import fs, { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { relative, resolve, join } from 'path';

interface TestItem {
  question?: string;
  answer?: string | number;
  test?: {
    q: string;
    a: string;
  };
}

function convertJsonToMarkdownContent(jsonData: TestItem[]): string {
  let markdown = '';
  
  jsonData.forEach((item, index) => {
    if (item.question) {
      markdown += `### test-data[${index}].question\n${item.question}\n`;
    }
    if (item.answer !== undefined) {
      markdown += `### test-data[${index}].answer\n${item.answer}\n`;
    }
    if (item.test) {
      markdown += `## test-data[${index}].test\n`;
      markdown += `### test-data[${index}].test.q\n${item.test.q}\n`;
      markdown += `### test-data[${index}].test.a\n${item.test.a}\n`;
    }
  });
  
  return markdown;
}

export async function convertJsonToMarkdown(path: string, fileName: string): Promise<void> {
  try {
    const jsonContent = readFileSync(path, 'utf-8');
    const jsonData: TestItem[] = JSON.parse(jsonContent);
    
    const markdownContent = convertJsonToMarkdownContent(jsonData);
    const mdFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    
    const outputDir = resolve(__dirname, '../test-data-markdowns');
    const outputFile = join(outputDir, mdFileName);

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(outputFile, markdownContent);
    console.log(`✅ Converted ${jsonData.length} items to: ${outputFile}`);
  } catch (err) {
    console.error('Error converting JSON to Markdown:', err);
    throw err;
  }
}