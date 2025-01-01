import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

export async function slicePdf(inputPath: string, outputDirectory: string) {
    if (!existsSync(inputPath)) {
        throw new Error(`Input file does not exist: ${inputPath}`);
    }

    const dataBuffer = readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(dataBuffer);
    const numPages = pdfDoc.getPageCount();

    if (!existsSync(outputDirectory)) {
        mkdirSync(outputDirectory, { recursive: true });
    }

    for (let i = 0; i < numPages; i++) {
        const newPdfDoc = await PDFDocument.create();
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);

        const pdfBytes = await newPdfDoc.save();
        const outputFile = join(outputDirectory, `page-${i + 1}.pdf`);
        writeFileSync(outputFile, pdfBytes);
        console.log(`Saved page ${i + 1} to ${outputFile}`);
    }

    console.log('All pages have been saved as individual PDFs.');
}
