import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';
import axios from 'axios';
import { PdfReader } from "pdfreader";
import { getDocument } from 'pdfjs-dist';
import { assistantMessage, characterDescription } from '../prompts';

const pdfFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/book.pdf";
const readmeFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/charactersWithDescription.md";

async function sendToOllama(content: string) {
    const url = "http://127.0.0.1:11434/api/chat";
    const payload = {
        model: "gemma2:27b",
        messages: [
            { role: "user", content },
            { role: "assistant", content: characterDescription }
        ],
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { "Content-Type": "application/json" }
        });

        if (response.status !== 200) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        return response.data;
    } catch (error: any) {
        console.error(`Error sending to Ollama: ${error?.message}`);
    }
}

function extractMessagesFromString(input: string): string {
    const regex = /"content":"([^"]*)"/g;
    const messages = [];
    let match;
    while ((match = regex.exec(input)) !== null) {
        messages.push(match[1]);
    }
    return messages.join('');
}

async function extractTextFromPage(pdfPath: string) {
    const dataBuffer = readFileSync(pdfPath);
    const uint8Array = new Uint8Array(dataBuffer);

    const pdf = await getDocument(uint8Array).promise;
    const numPages = pdf.numPages;

    const mappedPromises = Array.from({ length: 10 }, (_, i) => i + 1)
        .map((_, i) => i + 11)
        .map(async (numPage) => {

            const page = await pdf.getPage(numPage);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item?.str).join(' ');
            const result = await sendToOllama(JSON.stringify(pageText));

            return { text: result, pageNumber: numPage };
        });

    // const mappedPromises = Array.from({ length: 10 }, (_, i) => i + 1)
    //     .map(async (numPage) => {

    //         const page = await pdf.getPage(numPage);
    //         const textContent = await page.getTextContent();
    //         const pageText = textContent.items.map(item => item?.str).join(' ');
    //         // console.log('Page Text:', pageText);
    //         const result = await sendToOllama(JSON.stringify(pageText));


    //         // const allTextMessage = result.

    //         return { text: result, pageNumber: numPage };
    //     });

    const results = await Promise.all(mappedPromises);

    return results;
}

// Usage
export const extractCharactersWithDescription = () => {
    extractTextFromPage(pdfFilePath).then((results) => {
    results.forEach(({ text, pageNumber }) => {
        const messagesArray = extractMessagesFromString(text);

        const messageContent = `\n\n Page: ${pageNumber}
            ######## CONTENT ########
            ${messagesArray}`

        if (!existsSync(readmeFilePath)) {
            writeFileSync(readmeFilePath, messageContent);
        } else {
            appendFileSync(readmeFilePath, messageContent);
        }
    });
}).catch(err => {
    console.error('Error extracting text:', err);
});
}
