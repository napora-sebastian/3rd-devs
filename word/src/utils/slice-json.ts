import * as fs from 'fs';
import * as path from 'path';

interface JsonChunk {
  title?: string;
  content: any;
}

export function jsonToMarkdown(jsonData: any, maxChunkSize: number = 2000): string[] {
  const chunks: string[] = [];
  
  function processObject(obj: any, parentKey: string = ''): void {
    // Handle objects
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        // Handle arrays
        obj.forEach((item, index) => {
          processObject(item, `${parentKey}[${index}]`);
        });
      } else {
        // Handle regular objects
        Object.entries(obj).forEach(([key, value]) => {
          const title = parentKey ? `${parentKey}.${key}` : key;
          
          if (typeof value === 'object' && value !== null) {
            chunks.push(`## ${title}\n`);
            processObject(value, title);
          } else {
            chunks.push(`### ${title}\n${value}\n`);
          }
        });
      }
    } else {
      // Handle primitive values
      chunks.push(`${obj}\n`);
    }
  }

  processObject(jsonData);

  // Combine chunks while respecting maxChunkSize
  return chunks.reduce((acc: string[], chunk: string) => {
    const lastChunk = acc[acc.length - 1] || '';
    if (lastChunk.length + chunk.length < maxChunkSize) {
      acc[acc.length - 1] = (lastChunk + '\n' + chunk).trim();
    } else {
      acc.push(chunk.trim());
    }
    return acc;
  }, ['']);
}

export async function saveJsonChunksToMarkdown(
    jsonData: any, 
    outputDir: string = './word/src/test-data-markdowns',
    maxChunkSize: number = 2000
  ): Promise<string[]> {
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  
    const chunks = jsonToMarkdown(jsonData, maxChunkSize);
    const savedFiles: string[] = [];
  
    chunks.forEach((chunk, index) => {
      const filename = path.join(outputDir, `chunk-${index + 1}.md`);
      fs.writeFileSync(filename, chunk, 'utf-8');
      savedFiles.push(filename);
    });
  
    return savedFiles;
  }

// Usage example:
/*
const jsonData = {
  title: "Example",
  sections: [{
    heading: "Section 1",
    content: "Some content"
  }]
};

const markdownChunks = jsonToMarkdown(jsonData);
console.log(markdownChunks);
*/