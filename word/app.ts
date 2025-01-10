import { extractCharactersWithDescription } from './src/extract-characters-with-description';
import { extractCharactersList } from './src/chracters-name-extractor';
import { mainService } from './src/main-service';
import { findMistakes } from './src/find-mistakes';
import { convertPdfToMarkdown } from './src/utils/convert-to-markdown';
import { slicePdf } from './src/utils/slice-pdf';
import { jsonToMarkdown, saveJsonChunksToMarkdown } from './src/utils/slice-json';
import { convertToJSONFile } from './src/utils/convert-to-json';
import { readdir, readFileSync, writeFileSync } from 'fs';
import axios from 'axios';
import { TokenCounterService } from './src/token-counts/token-counts.service';
import { splitJson } from './src/utils/split-json';
import { convertJsonToMarkdown } from './src/utils/convert-json-to-markdown';
import { summarizeMarkdowns } from './src/services/summarize-markdowns';
import { createProperMarkdownFile } from './src/utils/create-proper-markdown-file';


const readmeFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/";
const restFilePath = readmeFilePath + 'MOCCC.pdf'
const restsFilePath = readmeFilePath + 'test-data.json'

const outputDir = readmeFilePath + 'src/test-data-markdowns';
const outputDirPdfs = readmeFilePath + 'src/pdfs';
const outputDirJsons = readmeFilePath + 'src/test-data-jsons';

const pdfToMarkdownPagesPath = readmeFilePath + 'src/pdfs'

const readmeFilePathsss = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/summarize-mocc";
// const exampleContent = `\nlinks: [[ Project Description ]], [[ Technological Integration ]], [[ Security and Privacy ]]\n\ntags: ['fleet', 'management software', 'project description', 'integration', 'security']\n\nSUMMARY: The document outlines the structure and key components of a fleet management software project by. It begins with a preamble, introduction, and documentation details, emphasizing the goal and rationale behind the project. The primary purpose is to address specific issues faced by target groups through technological integration, focusing on modularity and expandability. Important aspects include milestones, timeline, security, privacy measures, added value perspectives, and SWOT analysis. The document further discusses requirements for the application, covering input variables, licensing, and user management, including roles, rights, and global settings. It also highlights specific modules like parcels, billing functions with expansion levels, multi-client capabilities, dashboards, notifications, and user groups.\n`
// createProperMarkdownFile(exampleContent, readmeFilePathsss + '/example.md');
// extractCharactersWithDescription();
// extractCharactersList();
// mainService();

summarizeMarkdowns();

// (async () => await findMistakes())();

// const result = convertToJSONFile()

// writeFileSync(readmeFilePath + 'result.json', result, 'utf-8');

// import TestData from './test-data.json';


// console.log('TestData', TestData?.['test-data'].filter(item => item.test));


// splitJson(restsFilePath, outputDirJsons)

// const getDirectory = readdir(outputDirJsons, (err, files) => {
// console.log('files', files);
//     files.forEach(async (file, index) => {
//         let latestCount = 0;

//         const indexes = [...new Array(files.length).keys()].map(i => {
//             if (index === 0) {
//                 latestCount = 29;
//                 return latestCount;
//             }
//             latestCount += 30; // Increment by 30 for each subsequent index
//             return latestCount;
//         });


// await convertJsonToMarkdown( outputDirJsons+ '/' + file, file, indexes[index]);
//     })})
// Call the function
// slicePdf(restFilePath, outputDirPdfs).catch(err => {
//     console.error('Error slicing PDF:', err);
//   });


// const resultCount = new TokenCounterService().countTokens([{role: 'user', content: getFile}], 'gpt-4o').then((res) => {
// console.log('resultCount', res);
// })
// mainService()



// (async () => {
// try {

// const readJsonFile = readFileSync(readmeFilePath + 'result.json', 'utf-8');

// console.log('readJsonFile', readJsonFile);
// const respone = await axios.post('https://centrala.ag3nts.org/report', {
//     "task": "JSON",
//     "apikey":"7a237df9-60f5-44be-aaea-c73530e5e332",
//     "answer": JSON.parse(readJsonFile)
// })
//     console.log('respone', respone.data);

// }catch(err) {
//     console.error('Error in findMistakes:', err);
// }
// })();
// import testData from './test-data.json';
// const markdownChunks = saveJsonChunksToMarkdown(testData);

// console.log(markdownChunks);

// get directory pdfToMarkdownPagesPath and get each file inside and convert to markdown

//  readdir(pdfToMarkdownPagesPath, (err, files) => {
//     if (err) {
//       console.error('Error reading directory:', err);
//       return;
//     }
  
//     files.forEach(async (file) => {
//       const filePath = `${pdfToMarkdownPagesPath}/${file}`;
//       console.log('Converting', filePath, 'to markdown...');
//       await convertPdfToMarkdown(filePath, file +'.md');
//     });
//   });