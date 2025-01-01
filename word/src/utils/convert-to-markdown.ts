import fs from 'fs';
import {relative, resolve, join} from 'path';
const pdf2md = require('@opendocsg/pdf2md')

export async function convertPdfToMarkdown(path: string, fileName: string) {
    const pdfBuffer = fs.readFileSync(path);
pdf2md(pdfBuffer)
  .then(text => {
    const outputDir = resolve(__dirname, '../markdowns'); // Resolve directory path
    const outputFile = join(outputDir, fileName); // Construct file path

    // Ensure the directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Writing to ${outputFile}...`);
    fs.writeFileSync(outputFile, text);
    console.log('Done.');
  })
  .catch(err => {
    console.error(err);
  });
}



 