import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import axios from 'axios';
import { getDocument } from 'pdfjs-dist';
import { characterNameExtractor } from '../prompts';

const pdfFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/book.pdf";
const readmeListFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/CharactersList.md";


async function sendToOllama(content: string) {
    const url = "http://127.0.0.1:11434/api/chat";
    const payload = {
        model: "gemma2:27b",
        messages: [
            { role: "user", content },
            { role: "assistant", content: characterNameExtractor }
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

    console.log(messages, '################')
    return messages.join('');
}

async function extractTextFromPage(pdfPath: string) {
    const dataBuffer = readFileSync(pdfPath);
    const uint8Array = new Uint8Array(dataBuffer);

    const pdf = await getDocument(uint8Array).promise;
    const numPages = pdf.numPages;

    const mappedPromises = Array.from({ length: 2 }, (_, i) => i + 1)
        .map((_, i) => i + 11)
        .map(async (numPage) => {

            const page = await pdf.getPage(numPage);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item?.str).join(' ');
            const result = await sendToOllama(JSON.stringify(pageText));

            return { text: result, pageNumber: numPage };
        });

   return mappedPromises
}

// Usage
export const extractCharactersList = () => {
    extractTextFromPage(pdfFilePath).then(async (results) => {
        for(const promise of  results) {
            const {text, pageNumber} = await promise;
            const messagesArray = extractMessagesFromString(text);
    
            const messageContent = `\n\n Page: ${pageNumber}
                ######## CONTENT ########
                ${messagesArray}`
    
            if (!existsSync(readmeListFilePath)) {
                writeFileSync(readmeListFilePath, messageContent);
            } else {
                appendFileSync(readmeListFilePath, messageContent);
            }
        }

}).catch(err => {
    console.error('Error extracting text:', err);
});
}
