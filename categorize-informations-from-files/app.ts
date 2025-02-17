import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { OpenAI } from 'openai';
import Tesseract from 'tesseract.js';

interface CategoryResult {
    people: string[];
    hardware: string[];
}

const openai = new OpenAI();

async function extractZip(zipPath: string, extractTo: string): Promise<void> {
    await fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: extractTo })).promise();
}

async function readTextFile(filePath: string): Promise<string> {
    return fs.promises.readFile(filePath, 'utf-8');
}

async function readImageFile(filePath: string): Promise<string> {
    console.log('Reading image file:', filePath);
    const { data: { text } } = await Tesseract.recognize(filePath, 'pol');
    // //write file
    fs.writeFileSync(filePath.replace("png", "txt"), text);

    return text;
}

async function readAudioFile(filePath: string): Promise<string> {
    try {
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
        });

        //write the transcription to a file
        fs.writeFileSync(filePath.replace('mp3', 'txt'), transcription.text);

        return transcription.text;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return '';
    }
}

async function classifyContent(content: string): Promise<'people' | 'hardware' | null> {
    const systemPrompt = 'Analizujesz i kategoryzujesz. Wydobądź dla nas proszę tylko notatki zawierające informacje o schwytanych ludziach lub o śladach ich obecności oraz o naprawionych usterkach hardwarowych';
    const userPrompt = `
        Przeanalizuj prosze notatki i określ czy zawierają informacje o ludziach czy o sprzęcie. 
        
        ### Zadania:
        1. "people" - Sprawdź czy notatki zawierają informacje o schwytanych ludziach lub o śladach ich obecności.
        2. "hardware" - Sprawdź czy notatki zawierają informacje o naprawionych usterkach hardwarowych.
        3. "skip" - Jeśli nie ma informacji o ludziach ani sprzęcie.

        ### Notatki:
            ${content}    

        ### Pamiętaj:
        - Jeśli nie jesteś pewien, wybierz "skip".
        - Nalezy zwrócić słowa "people" lub "hardware", lub "skip" w odpowiedzi.
    `;
    
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.5
    });
    
    const classification = response?.choices?.[0]?.message?.content?.toLowerCase();
    if (classification?.includes('human')) return 'people';
    if (classification?.includes('machine')) return 'hardware';
    return null;
}

async function processFiles(directory: string): Promise<CategoryResult> {
    const result: CategoryResult = { people: [], hardware: [] };
    const files = await fs.promises.readdir(__dirname + '/' + directory);

    for (const file of files) {
        const filePath = path.join(__dirname + '/' + directory, file);

        // skip directories
        if ((await fs.promises.lstat(filePath)).isDirectory()) continue;
        const ext = path.extname(file);
        
        let content = '';
        //if you need to read the file content per type!
        if (ext === '.txt') content = await readTextFile(filePath);
         if (ext === '.png') content = await readImageFile(filePath);
         if (ext === '.mp3') content = await readAudioFile(filePath);

        if (content) {
            const category = await classifyContent(content);
            if (category) result[category].push(file);
        }
    }

    return result;
}

async function main(): Promise<void> {
    const zipPath = 'zadanie.zip';
    const extractTo = 'files_from_fabric';

    // await extractZip(zipPath, extractTo);
    const categorizedFiles = await processFiles(extractTo);

    fs.writeFileSync('result.json', JSON.stringify(categorizedFiles, null, 4));
    console.log('Processing completed. Results saved in result.json');
}

main().catch(console.error);
