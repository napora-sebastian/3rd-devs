import { extractCharactersWithDescription } from './src/extract-characters-with-description';
import { extractCharactersList } from './src/chracters-name-extractor';
import { mainService } from './src/main-service';
import { findMistakes } from './src/find-mistakes';
import { convertPdfToMarkdown } from './src/utils/convert-to-markdown';
import { slicePdf } from './src/utils/slice-pdf';
import * as fs from 'fs';


const readmeFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/";
const restFilePath = readmeFilePath + 'book.pdf'

const outputDir = readmeFilePath + 'src/pdfs'

const pdfToMarkdownPagesPath = readmeFilePath + 'src/pdfs'
// extractCharactersWithDescription();
// extractCharactersList();
// mainService();

// findMistakes()
// Call the function
// slicePdf(restFilePath, outputDir).catch(err => {
//     console.error('Error slicing PDF:', err);
//   });
// mainService()

// get directory pdfToMarkdownPagesPath and get each file inside and convert to markdown

 fs.readdir(pdfToMarkdownPagesPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }
  
    files.forEach(async (file) => {
      const filePath = `${pdfToMarkdownPagesPath}/${file}`;
      console.log('Converting', filePath, 'to markdown...');
      await convertPdfToMarkdown(filePath, file +'.md');
    });
  });