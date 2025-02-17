import axios from 'axios'
import { OpenAI } from 'openai';
import { createReadStream, createWriteStream, unlink, writeFileSync } from 'fs';
import type { content } from 'googleapis/build/src/apis/content';
import Tesseract from 'tesseract.js';
import { join } from 'path';
const https = require('https');

const openai = new OpenAI();


const ARTICLE_URL = 'https://centrala.ag3nts.org/dane/arxiv-draft.html';
const QUESTIONS_URL = 'https://centrala.ag3nts.org/data/7a237df9-60f5-44be-aaea-c73530e5e332/arxiv.txt';

// Funkcja do pobierania treści z URL
async function fetchContent(url: string) {
    const response = await axios.get(url);
    // console.log("Response from URL:", response.data);
    if (!response) {
        throw new Error(`Błąd pobierania ${url}`);
    }
    return await response.data;
}

// Funkcja do parsowania pytań z pobranego pliku
function parseQuestions(questionsText: string) {
    // We'll parse lines that start with number and equals sign
    const questions = {};
    const lines = questionsText.split('\n');
    for (let line of lines) {
        line = line.trim();
        // Remove any comment markers (//) from the start
        line = line.replace(/^\/\/\s*/, '');
        if (line) {
            // Match pattern: "01=question" or "1=question"
            const match = line.match(/^(\d+)=(.*)/);
            if (match) {
                const id = match[1].padStart(2, '0'); // Ensure 2-digit ID
                const question = match[2].trim();
                questions[id] = question;
            }
        }
    }
    return questions;

}

// Funkcja symulująca wywołanie API LLM – w produkcji należy zastąpić rzeczywistym API
async function callLLM(prompt: string) {

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system', content: `
                Analizujesz i zgodnie z potrzebna przeszukujesz własną bazę wiedzy w poszukiwaniu odpowiedzi.
                Jezeli trzeba skorzystaj z internetu w odszukaniu własciwej odpowiedzi. 
                Odpowiada maksymalnie jednym zdaniem!
                
                #### Expected result:
                Oczekiwany format odpowiedzi: 
                {
                    "ID-pytania-01": "krótka odpowiedź w 1 zdaniu",
                    "ID-pytania-02": "krótka odpowiedź w 1 zdaniu",
                    "ID-pytania-03": "krótka odpowiedź w 1 zdaniu",
                    "ID-pytania-NN": "krótka odpowiedź w 1 zdaniu"
                }
            ` },
            { role: 'user', content: prompt }
        ],
        temperature: 0.5
    });

    const responseContent = response?.choices?.[0]?.message?.content;
    // Tutaj należałoby wykonać fetch do rzeczywistego endpointu LLM, np. OpenAI API.
    // Przykładowy kod:
    //
    // const apiKey = 'YOUR_API_KEY';
    // const response = await fetch('https://api.openai.com/v1/engines/davinci/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apiKey}`
    //   },
    //   body: JSON.stringify({
    //     prompt: prompt,
    //     max_tokens: 50,
    //     temperature: 0.5,
    //     n: 1,
    //     stop: ['\n']
    //   })
    // });
    // const data = await response.json();
    // return data.choices[0].text.trim();

    // Na potrzeby tego przykładu zwracamy symulowaną odpowiedź.
    // console.log("Prompt do LLM:", { prompt, responseContent });
    return responseContent
}


async function readImageFile(filePath: string): Promise<string> {
    console.log('Reading image file:', filePath);
     function downloadFile(url: string, dest: string) {
         return  new Promise((resolve, reject) => {
            const file = createWriteStream(dest);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }).on('error', (err) => {
                unlink(dest, () => reject(err));
            });
        });
    }

    await downloadFile('https://centrala.ag3nts.org/dane/' + filePath, join(__dirname, filePath.split('/')[1]));

    return 'success'
    // console.log(join(__dirname, filePath.split('/')[1]), '!@#!@#!#@')

    // const { data: { text } } = await Tesseract.recognize(join(__dirname, filePath.split('/')[1]), 'pol');
    // console.log('Text from image:', text);
    // // //write file
    // writeFileSync(join(__dirname, filePath.split('/')[1].replace('png', 'txt')), text);

    // return text;
}

async function readAudioFile(filePath: string): Promise<string> {
    // const getBlob = await axios.get(file, {
    //     responseType: 'blob'
    // })
    function downloadFile(url: string, dest: string) {
        return new Promise((resolve, reject) => {
            const file = createWriteStream(dest);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }).on('error', (err) => {
                unlink(dest, () => reject(err));
            });
        });
    }


    // console.log('Reading audio file:', getBlob.data);
    await downloadFile(filePath, join(__dirname, 'audio.mp3'));


    try {
        const transcription = await openai.audio.transcriptions.create({
            file: createReadStream(join(__dirname, 'audio.mp3')),
            model: "whisper-1",
        });

        //write the transcription to a file
        writeFileSync(join(__dirname, 'audio.txt'), transcription.text);

        return transcription.text;
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return '';
    }
}

// Funkcja odpowiadająca na każde pytanie przy użyciu artykułu jako kontekstu
async function answerQuestions(articleContent: string, questionsObj: any) {
    //need steep that allow to get audio files or images and analyze them from the article that is a html file
    const getAudioUrl = (articleContent: string) => {
        const audioRegex = /<a.*?href="(.*?)"/;
        const match = articleContent.match(audioRegex);
        return match ? match[1] : null;
    }

    const getImageUrl = (articleContent: string) => {
        //match all of them
        const match = articleContent.match(/<img.*?src="(.*?)"/g);
        //get only src value
        if (match) {
            return match.map((m) => {
                return m.match(/src="(.*?)"/)[1]
            })
        }
    }

    const audio = getAudioUrl(articleContent);

    const images = getImageUrl(articleContent);

    //create a file with the audio

    if (images) {
        for (const image of images) {
            readImageFile(image)
        }
    };
    // if (audio) await readAudioFile('https://centrala.ag3nts.org/dane/' + audio);

    // const results = {};
    // for (const [id, question] of Object.entries(questionsObj)) {
    //     // Tworzymy prompt zawierający kontekst (artykuł) oraz pytanie
    //     const prompt = `Użyj poniższego materiału (tekst, grafika, dźwięk) do odpowiedzi na pytanie w jednym zdaniu:\n\nMateriał:\n${articleContent}\n\nPytanie: ${question}\nOdpowiedź w jednym zdaniu:`;
    //     const answer = await callLLM(prompt);
    //     results[id] = answer;
    // }
    // return results;
}

// Funkcja główna – koordynuje pobieranie danych, generowanie odpowiedzi i wypisanie wyniku
async function main() {
    try {
        const articleContent = await fetchContent(ARTICLE_URL);
        const questionsText = await fetchContent(QUESTIONS_URL);
        const questionsObj = parseQuestions(questionsText);
        const answers = await answerQuestions(articleContent, questionsObj);
        console.log("Final JSON response:", answers);

        //write response to file
        //  writeFileSync('answers.json', answers.toString());

        // if (answers) {
        //     const reposne = await axios.postForm('https://centrala.ag3nts.org/report', {
        //         task: "arxiv",
        //         apikey: "7a237df9-60f5-44be-aaea-c73530e5e332",
        //         answer: answers
        //     })

        //     // console.log("Response from API:", reposne.data);
        // }
    } catch (error) {
        // console.error("Wystąpił błąd:", error);
    }
}

main();
