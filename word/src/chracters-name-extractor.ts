import { readFileSync } from 'fs';
import { getDocument } from 'pdfjs-dist';
import { characterNameExtractor } from './prompts-storage/prompts';
import { sendToOllama } from './services/send-ollama';
import { extractMessagesFromString } from './utils/extract-messages-from-string';
import { handleFileContent } from './utils/handle-file-content';

const pdfFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/book.pdf";
const readmeListFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/CharactersList.md";

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
            const result = await sendToOllama({ content: JSON.stringify(pageText), assitantMessage: characterNameExtractor });

            return { text: result, pageNumber: numPage };
        });

    return mappedPromises
}

// Usage
export const extractCharactersList = () => {
    extractTextFromPage(pdfFilePath).then(async (results) => {
        for (const promise of results) {
            const { text, pageNumber } = await promise;
            const messagesArray = extractMessagesFromString(text);

            const messageContent = `\n\n Page: ${pageNumber}
                ######## CONTENT ########
                ${messagesArray}`

            handleFileContent(readmeListFilePath, messageContent);
        }

    }).catch(err => {
        console.error('Error extracting text:', err);
    });
}
