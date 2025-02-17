import * as fs from 'fs';
import * as path from 'path';
import axios, { type AxiosResponse } from 'axios';
import { OpenAI } from 'openai';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';

// Types
interface Results {
    [key: string]: string;
}

interface FinalResult {
    [key: string]: string;
}

// Constants
const ZIP_PATH: string = path.join(__dirname, 'pliki_z_fabryki.zip');
const EXTRACT_DIR: string = path.join(__dirname, 'reports');

async function processReports(reportsDirectory: string, error?: any): Promise<Results> {
    const files: string[] = readdirSync(reportsDirectory);
    // Filtrujemy tylko pliki TXT z raportami (pomijamy folder 'facts')
    const txtFiles: string[] = files.filter(file => file.endsWith('.txt'));
    const results: Results = {};

    // Wczytanie faktów z folderu 'facts'
    const factsDir = path.join(reportsDirectory, 'facts');
    let factsConcatenated = "";
    if (existsSync(factsDir) && statSync(factsDir).isDirectory()) {
        const factFiles = readdirSync(factsDir).filter(file => file.endsWith('.txt'));
        for (const factFile of factFiles) {
            const factPath = path.join(factsDir, factFile);
            const factContent = readFileSync(factPath, 'utf-8');
            factsConcatenated += factContent + "\n";
        }
    }

    const openai = new OpenAI();

    for (const file of txtFiles) {
        // Jeśli przypadkiem plik 'facts' pojawi się w liście, pomijamy go
        if (file === 'facts') continue;

        const filePath: string = path.join(reportsDirectory, file);
        const content: string = readFileSync(filePath, 'utf-8');

        // Przygotowanie promptu z dołączonymi faktami
        const prompt: string = `
            Twoim zadaniem jest przygotowanie metadanych do raportu dotyczącego wydarzeń związanych z bezpieczeństwem w sektorach wokół fabryki.
            Poniżej znajduje się treść raportu, na podstawie której wygenerujesz słowa kluczowe w mianowniku, np. "włamanie", "pożar", "kradzież".
            Uwzględnij całą posiadaną wiedzę (m.in. dodatkowe fakty i odniesienia z innych raportów) oraz zastosuj technikę chain-of-thought przy analizie raportu.
            Raport:
            -----------------------------------------
            ${content}
            -----------------------------------------
            <facts>
            ${factsConcatenated}
            </facts>            
        `;

        const userPromptForError = `
            Twoim zadaniem jest odnalezienie brakujących danych dotyczących ${error}. 
            Nalezy odpowiedź znaleźć na podstawie raportów i faktów.

            Raport:
            -----------------------------------------
            ${content}
            -----------------------------------------
            <facts>
            ${factsConcatenated}
            </facts>   
        `;

        const systemPrompt = `
            Analizujesz i zgodnie z potrzebą przeszukujesz własną bazę wiedzy w poszukiwaniu odpowiedzi.
            Jeżeli trzeba, skorzystaj z internetu w odszukaniu właściwej odpowiedzi. 
            Odpowiadasz maksymalnie jednym zdaniem!

            #### Expected result:
            Oczekiwany format odpowiedzi: 
            {
                "nazwa-pliku-01.txt": "keywords",
                "nazwa-pliku-02.txt": "keywords",
                "nazwa-pliku-03.txt": "keywords",
                "nazwa-pliku-NN.txt": "keywords"
            }

            ### Pamiętaj
            - w keywords zamiast "sportowcem", "sportowców" zwrócić "sportowiec" 
        `;

        const systemErrorPrompt = `
        Analizujesz i zgodnie z potrzebą przeszukujesz własną bazę wiedzy w poszukiwaniu odpowiedzi.
        Jeżeli trzeba, skorzystaj z internetu w odszukaniu właściwej odpowiedzi. 
        Odpowiadasz maksymalnie jednym zdaniem!

        Zwróć informację w którym pliku znajduje się odpowiedź na pytanie poszukiwane przez użytkownika.

        #### Expected result:
        Oczekiwany format odpowiedzi: 
        {
            "nazwa-pliku-01.txt": "krótka odpowiedź w 1 zdaniu"
        }
    `;

        try {
            console.log(`Przetwarzanie pliku: ${file}`);
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system', content: error ? systemErrorPrompt : systemPrompt
                    },
                    { role: 'user', content: error ? userPromptForError : prompt }
                ],
                temperature: 0.5,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                // response_format: { type: "json_object" }
            });

            const keywords = response?.choices?.[0]?.message?.content?.trim();

            if (!keywords) {
                throw new Error('Nie udało się wygenerować słów kluczowych');
            }

            // Zapis wyniku dla danego pliku
            writeFileSync(path.join(__dirname, 'results/' + file), JSON.stringify(keywords, null, 2));

            results[file] = keywords;

            console.log(`Wygenerowano dla ${file}: ${keywords}`);
        } catch (error) {
            console.error(`Błąd przy przetwarzaniu pliku ${file}: ${(error as Error).message}`);
        }
    }
    return results;
}

async function sendResults(results: Results) {
    console.log('Wyniki:', JSON.stringify(results));
    try {
        console.log('Wysyłanie wyników do centrali...');
        const response = await axios.post('https://centrala.ag3nts.org/report', {
            task: "dokumenty",
            apikey: process.env.AI_DEVS_KEY,
            answer: JSON.stringify(results)
        }, {
             headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('Wyniki wysłane pomyślnie:', response.data);

        return 'success'
    } catch (error) {
        console.error('Błąd przy wysyłaniu wyników:', (error as Error).response.data.message);

        return error;
    }
}

const generateResult = async (error?: any) => {
    const results: Results = await processReports(EXTRACT_DIR, error);

    const finalResult: FinalResult = {};
    Object.keys(results).forEach(file => {
        finalResult[file] = results[file];
    });

    console.log('Wyniki:', results);
    console.log('Ostateczny rezultat:', JSON.stringify(finalResult, null, 2));

    if (error) {
        writeFileSync(path.join(__dirname, 'error-answer.txt'), JSON.stringify(finalResult, null, 2));
        //update results.json properly to file name and answer adding the content only of answer
        const errorAnswer = JSON.parse(JSON.stringify(finalResult).replace(/"/g, ''));
        const errorAnswerKey = Object.keys(errorAnswer)[0];
        const errorAnswerValue = errorAnswer[errorAnswerKey];
        const errorAnswerContent = errorAnswerValue.split(' ')[0];
        const errorAnswerContentKey = errorAnswerKey.split('.')[0];
        const errorAnswerContentValue = errorAnswerContent;

        finalResult[errorAnswerContentKey] = errorAnswerContentValue;

        writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(finalResult, null, 2));
    }

    if (!error) {
        writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(finalResult, null, 2));
    }

    return finalResult;
}

async function main(): Promise<void> {
    try {
        // const results: Results = await generateResult()
        const results = readFileSync(path.join(__dirname, 'results.json'), 'utf-8');

        // console.log('Wyniki:', results);

        // Opcjonalnie wysyłamy wyniki do centrali
        const result = await sendResults(results);

        // if (result !== 'success') {
        //     const results: Results = await generateResult(result)

        //     await sendResults(results);
        // }

    } catch (error) {
        console.error('Błąd główny:', (error as Error).message);
    }
}

main();
