import { characterDescription } from './prompts-storage/prompts';
import { readFileSync } from 'fs';
import { getDocument } from 'pdfjs-dist';
import { sendToOllama } from './services/send-ollama';
import { extractMessagesFromString } from './utils/extract-messages-from-string';
import { handleFileContent } from './utils/handle-file-content';
import { convertPdfToMarkdown } from './utils/convert-to-markdown';

const pdfFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/book.pdf";
const readmeFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/charactersWithDescription.md";

async function extractTextFromPage(pdfPath: string) {
    const dataBuffer = readFileSync(pdfPath);
    const uint8Array = new Uint8Array(dataBuffer);

    const pdf = await getDocument(uint8Array).promise;
    const numPages = pdf.numPages;

    const mappedPromises = Array.from({ length: numPages }, (_, i) => i + 1)
        .map(async (numPage) => {

            const page = await pdf.getPage(numPage);
            const textContent = await page.getTextContent();

            const pageText = textContent.items.map((item: any) => item?.str).join(' ');
            const result = await sendToOllama({ content: JSON.stringify(pageText), assitantMessage: characterDescription });

            return { text: result, pageNumber: numPage };
        });

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

            handleFileContent(readmeFilePath, messageContent);
        });
    }).catch(err => {
        console.error('Error extracting text:', err);
    });
}
