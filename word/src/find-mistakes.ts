import { readdirSync, readFileSync, appendFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sendToOllama } from './services/send-ollama';
import { extractMessagesFromString } from './utils/extract-messages-from-string';
// import { findMistakesPrompt,ccc } from './prompts-storage/find-mistakes.prompts';
import axios from 'axios';
import { OpenAIService } from './services/OpenAIService';
import { convertToJSONFile } from './utils/convert-to-json';

const markdownDir = "./word/src/test-data-markdowns";
const readmeFilePath = "./word/find-mistakes.md";
const promptPath = "./word/src/prompts-storage/find-mistakes-same-output.md";

async function processMarkdownFiles() {
    const prompt = readFileSync(promptPath, 'utf-8');
    
    try {
        writeFileSync(readmeFilePath, '', 'utf-8');
        const files = readdirSync(markdownDir)
            .filter(file => file.endsWith('.md'))
            .sort((a, b) => {
                const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                return numA - numB;
            });

        console.log(`Found ${files.length} files to process`);
        
        const results = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`Processing file ${i + 1}/${files.length}: ${file}`);

            const filePath = join(markdownDir, file);
            const content = readFileSync(filePath, 'utf-8');

            const result = await sendToOllama({
                content: content,
                assitantMessage: prompt
            });

            const messagesArray = extractMessagesFromString(result);
            appendFileSync(readmeFilePath, messagesArray);
            results.push(messagesArray);
            console.log(`✅ Completed ${file}`);
        }

        console.log('All files processed successfully');
        return results; // Return all results instead of early return
    } catch (err) {
        console.error('Error processing markdown files:', err);
        throw err; // Re-throw to handle in the calling function
    }
}

export const findMistakes = async () => {
    const results = await processMarkdownFiles().catch(err => {
        console.error('Error in findMistakes:', err);
        throw err;
    });

    convertToJSONFile();
    return results;
};
