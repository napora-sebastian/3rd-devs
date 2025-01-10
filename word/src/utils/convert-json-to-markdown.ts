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

function convertJsonToMarkdownContent(jsonData: TestItem[], indexes: number): string {
console.log('indexes', indexes);
  let markdown = '';

  const newJsonData = jsonData.map((item, indexs) => {
    const array = [...new Array(indexes).keys()].map(num => num + indexes); // Adjust the range if necessary
    return {
        ...item,
        newIndex: array[indexs], // Get the last value of the array
    };
  })
  
  newJsonData.forEach((item) => {

    if (item.question) {
      markdown += `### test-data[${item.newIndex}].question\n${item.question}\n`;
    }
    if (item.answer !== undefined) {
      markdown += `### test-data[${item.newIndex}].answer\n${item.answer}\n`;
    }
    if (item.test) {
      markdown += `## test-data[${item.newIndex}].test\n`;
      markdown += `### test-data[${item.newIndex}].test.q\n${item.test.q}\n`;
      markdown += `### test-data[${item.newIndex}].test.a\n${item.test.a}\n`;
    }
  });
  
  return markdown;
}

export async function convertJsonToMarkdown(path: string, fileName: string, indexes: number): Promise<void> {
  try {
    const jsonContent = readFileSync(path, 'utf-8');
    const jsonData: TestItem[] = JSON.parse(jsonContent);
    
    const markdownContent = convertJsonToMarkdownContent(jsonData, indexes);
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