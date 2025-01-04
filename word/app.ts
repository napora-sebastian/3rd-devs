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


const readmeFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/";
const restFilePath = readmeFilePath + 'book.pdf'
const restsFilePath = readmeFilePath + 'test-data.json'

const outputDir = readmeFilePath + 'src/test-data-markdowns';
const outputDirJsons = readmeFilePath + 'src/test-data-jsons';

// const pdfToMarkdownPagesPath = readmeFilePath + 'src/pdfs'
// extractCharactersWithDescription();
// extractCharactersList();
// mainService();

(async () => await findMistakes())();
// Call the function
// slicePdf(restsFilePath, outputDir).catch(err => {
//     console.error('Error slicing PDF:', err);
//   });


// splitJson(restsFilePath, outputDirJsons)

// const getDirectory = readdir(outputDirJsons, (err, files) => {
// console.log('files', files);
//     files.forEach(async (file, index) => {
//         console.log('@@@@@@@@@@@@@@@@', file);
// await convertJsonToMarkdown( outputDirJsons+ '/' + file, file);
//     })})
// const resultCount = new TokenCounterService().countTokens([{role: 'user', content: getFile}], 'gpt-4o').then((res) => {
// console.log('resultCount', res);
// })
// mainService()

// const result = convertToJSONFile()

// writeFileSync(readmeFilePath + 'result.json', result, 'utf-8');

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