import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { getDocument } from 'pdfjs-dist';
import { sendToOllama } from './send-ollama';

import { handleFileContent } from '../utils/handle-file-content';
import { join } from 'path';
import { extractMessagesFromString } from '../utils/extract-messages-from-string';
import { createProperMarkdownFile } from '../utils/create-proper-markdown-file';
import { summarizeContentPrompt } from '../prompts-storage/summarize-content';

const BATCH_SIZE = 5;
const pdfFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/MOCCC.pdf";
const readmeListFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/CharactersList.md";
const markdownDir = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/src/moc-markdowns";
const readmeFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/src/markdowns";
// const readmeFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/summarize-mocc";
const linksTagsFilePath = readmeFilePath + '/links-tags.json'
//read the file json from path linksTagsFilePath

function extractLinks(content: string): string[] {
    const bracketPattern = /\[\[(.*?)\]\]/g;
    const matches = [...content.matchAll(bracketPattern)]
        .map(match => (match[1].trim().toLowerCase()));
    return matches;
}

async function processBatch(
    files: string[],
    startIndex: number,
    summarizeContentPrompt: string) {
    // Ensure output directory exists
    if (!existsSync(readmeFilePath)) {
        mkdirSync(readmeFilePath, { recursive: true });
    }

    const batch = files.slice(startIndex, startIndex + BATCH_SIZE);
    const batchResults = [];

    for (const file of batch) {
        try {
            const filePath = join(markdownDir, file);
            const content = readFileSync(filePath, 'utf-8');

            const result = await sendToOllama({
                content,
                assitantMessage: summarizeContentPrompt
            });

            // console.log('$$$$$$$$$$$$$$$$$');
            // console.log('$$$$$$$$$$$$$$$$$');
            // console.log('$$$$$$$$$$$$$$$$$', result);
            const messagesArray = extractMessagesFromString(result);
            const outputPath = join(readmeFilePath, `summary_${startIndex + batch.indexOf(file)}.md`);

            createProperMarkdownFile(messagesArray, outputPath);

            const linksTagsFilePath = readmeFilePath + '/links-tags.json'

            const linksTags = readFileSync(linksTagsFilePath, 'utf-8');

            // console.log('linksTags', JSON.parse(linksTags).links);

            // Extract arrays and clean up values
            let resultExtractingLinksTags: {
                links: string[];
                tags: string[];
            } = {
                links: JSON.parse(linksTags)?.links || [],
                tags: JSON.parse(linksTags)?.tags || []
            }

            try {
                const linksMatches = extractLinks(messagesArray)

                const newLinks = [...resultExtractingLinksTags.links, ...linksMatches];

                const filterOutDuplicates = [...new Set(newLinks)];

                resultExtractingLinksTags.links = filterOutDuplicates;
            } catch (error) {
                console.error('Error: during links regex', error);
            }

            try {
                const tagsMatches = messagesArray.match(/'([^']+)'/g);

                // Clean up and remove surrounding single quotes
                const extractedStrings = tagsMatches
                    ?.map(item => item
                        .replace(/'/g, '')
                        .trim()
                        .toLowerCase())
                    || [];

                const newTags = [...resultExtractingLinksTags.tags, ...extractedStrings];

                const filterOutDuplicates = [...new Set(newTags)];

                resultExtractingLinksTags.tags = filterOutDuplicates;
            } catch (error) {
                console.error('Error: during tags regex', error);
            }

            writeFileSync(linksTagsFilePath, JSON.stringify(resultExtractingLinksTags, null, 2));
            batchResults.push(messagesArray);

            console.log(`✅ Processed ${file}`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }

    return batchResults;
}

async function summarize() {
    // const summarizeContentPrompt = readFileSync('/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/src/prompts-storage/summarize-content.md', 'utf-8');
    try {
        const files = readdirSync(markdownDir)
            .filter(file => file.endsWith('.md'))
            .sort((a, b) => {
                const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                return numA - numB;
            });

        const linksTags = readFileSync(linksTagsFilePath, 'utf-8');

        const results = [];

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)}`);
            const batchResults = await processBatch(files, i, summarizeContentPrompt({ linksList: linksTags?.links, tagsList: linksTags?.tags }));
            results.push(...batchResults);
        }

        console.log('All files processed successfully');
        return results;
    } catch (err) {
        console.error('Error processing markdown files:', err);
        throw err;
    }
}

export const summarizeMarkdowns = async () => {
    return await summarize().catch(err => {
        console.error('Error in summarizeMarkdowns:', err);
        throw err;
    });
};
