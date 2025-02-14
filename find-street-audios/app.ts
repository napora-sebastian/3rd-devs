import fs from "fs";
import OpenAI from "openai";
import path from 'path';

const openai = new OpenAI();

 async function transcription() {
    try {
        //read the files from audios folder
        const audioFolderPath = path.join(__dirname, 'audios');
        const files = fs.readdirSync(audioFolderPath);
        const audioFiles = files.filter(file => file.endsWith(".m4a"));

        console.log(`Found ${audioFiles} audio files to process`);

        const transcriptionPromises = audioFiles.map(async (file) => {
            const filePath = path.join(__dirname, 'audios/' + file);
            console.log(`Processing file: ${filePath}`);

            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-1",
            });

            const transcriptionPath = path.join(__dirname, 'transcriptions/' + file);
            const transcriptionOneFilePath = path.join(__dirname, 'transcriptions/' + 'one-text.txt');

            const transcribedWithEmptyLines = transcription.text.split('\n').join('\n\n');

            fs.writeFileSync(`${transcriptionPath}${file}.txt`, transcribedWithEmptyLines);

            if(fs.existsSync(transcriptionOneFilePath)) {
                fs.appendFileSync(`${transcriptionOneFilePath}`, transcribedWithEmptyLines);
                return;
            }

            fs.writeFileSync(`${transcriptionOneFilePath}`, transcribedWithEmptyLines);
        });

        await Promise.all(transcriptionPromises);
    } catch (err) {
        console.error("Error processing audio files:", err);
    }
}

export async function findStreet() {
    const filePath = path.join(__dirname, 'transcriptions/one-text.txt');

    const transcripts = fs.readFileSync(filePath, 'utf-8');

        const prompt = `
        Jako wybitny detektyw poszukujesz informacji o miejscu pracy profesora Andrzeja Maja.

            <rules>
                Analizuję te zeznania świadków krok po kroku:
                1. Wyszukuję wzmianki o Andrzeju Maju i jego miejscu pracy
                2. Zwracam uwagę na kontekst geograficzny i topograficzny
                3. Analizuję potencjalne sprzeczności w zeznaniach
                4. Rozważam możliwe interpretacje metafor lub opisów
                6. Szukam nazwy ulicy instytutu!
                7. Warto zweryfikować nazwy ulic, które się pojawiają obok miejsc związanych z nauką ale nie uczelania a instytu naukowy
                7. Zwróć tylko nazwę ulicy gdzie znajduje się instutut naukowy na którym wykłada profesor Maj.
                8. Poszukaj w internecie ulicy związanej z instytutem naukowym wspomnianym w transcrypcji przekazanej przez uzytkownika
            </rules>           
          `;

          const userMessage = `Znajdź nazwę ulicy na której wykłada/pracuje Andrzej Maj. I tylko nazwę ulicy zwróć proszę!. Treść do przeanalizowania: ${transcripts}`
          
          const response = await openai.chat.completions.create({
            messages: [{role: "system", content: prompt}, {
                role: "user",
                content: userMessage
            }],
            model: "gpt-4o-mini",
            stream: false,
            response_format: {type: "text" }
        });

        console.log(response, '$$$$$$$$$$');
}

(async () => await findStreet())()