import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface JsonItem {
  question?: string;
  answer?: string | number;
  test?: {
    q: string;
    a: string;
  };
}

export function splitJson(inputPath: string, outputPath: string): void {
  try {
    // Ensure output directory exists
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }

    // Read and parse JSON file
    const rawContent = readFileSync(inputPath, 'utf8');
    const jsonArray: {'test-data': JsonItem[]} = JSON.parse(rawContent);

    // Define chunk size
    const CHUNK_SIZE = 30;

    // Split into chunks
    for (let i = 0; i < jsonArray['test-data'].length; i += CHUNK_SIZE) {
      const chunk = jsonArray['test-data'].slice(i, i + CHUNK_SIZE);
      const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
      
      // Create chunk filename with padding for proper sorting
      const paddedIndex = chunkIndex.toString().padStart(3, '0');
      const chunkPath = join(outputPath, `chunk_${paddedIndex}.json`);

      // Write chunk to file with proper formatting
      writeFileSync(
        chunkPath, 
        JSON.stringify(chunk, null, 2),
        'utf8'
      );

      console.log(`✅ Created chunk ${paddedIndex} with ${chunk.length} items`);
    }

    console.log(`📦 Split complete: ${jsonArray['test-data'].length} items into ${Math.ceil(jsonArray['test-data'].length / CHUNK_SIZE)} chunks`);
  } catch (error) {
    console.error('Error splitting JSON:', error);
    throw error;
  }
}