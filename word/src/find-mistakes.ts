import { characterDescription } from './prompts-storage/prompts';
import { readFileSync } from 'fs';
import { getDocument } from 'pdfjs-dist';
import { sendToOllama } from './services/send-ollama';
import { extractMessagesFromString } from './utils/extract-messages-from-string';
import { handleFileContent } from './utils/handle-file-content';
import { findMistakesPrompt } from './prompts-storage/find-mistakes.prompts';

const pdfFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/test-data.pdf";
const readmeFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/find-mistakes.md";

async function extractTextFromPage(pdfPath: string) {
    const dataBuffer = readFileSync(pdfPath);
    const uint8Array = new Uint8Array(dataBuffer);

    const pdf = await getDocument(uint8Array).promise;
    const numPages = pdf.numPages;

    const mappedPromises = Array.from({ length: 1 }, (_, i) => i + 1)
        .map(async (numPage) => {

            const page = await pdf.getPage(numPage);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item?.str).join(' ');
            const result = await sendToOllama({ content: JSON.stringify(pageText), assitantMessage: findMistakesPrompt });

            return { text: result, pageNumber: numPage };
        });

    const results = await Promise.all(mappedPromises);

    return results;
}

// Usage
export const findMistakes = () => {
    extractTextFromPage(pdfFilePath).then((results) => {
        results.forEach(({ text, pageNumber }) => {
            const messagesArray = extractMessagesFromString(text);

            const messageContent = `\n\n Page: ${pageNumber}
            ######## CONTENT ########
            ${messagesArray}`

            handleFileContent(readmeFilePath, messageContent);
        });
    }).catch(err => {
        console.error('Error extracting text:', err);
    });
}
