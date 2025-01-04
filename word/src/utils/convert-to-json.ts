import * as fs from 'fs';

interface TestData {
  question?: string;
  answer?: string | number;
  test?: {
    q?: string;
    a?: string;
  };
}

interface ParsedSection {
  index: string;
  level1?: string;
  level2?: string;
  value: string;
}

export function convertToJSONFile(content?: string): string {
  const readmeFilePath = "./word/find-mistakes.md";
  const readFileMd =  fs.readFileSync(readmeFilePath, 'utf-8');

  try {
    // Enhanced regex pattern for nested headers
    const replacements = {
      '\\n': ':',
      '\\t': '    ',
      '\\n###': ' ',

    };
    
    let outputText = readFileMd;
    
    for (const [key, value] of Object.entries(replacements)) {
      outputText = outputText.replaceAll(key, value);
    }

// const ss = /#{2,}\s*test-data\[(\d+)\](?:\.(\w+))?(?:\.(\w+))?\s*\n([\s\S]*?)(?=\n#{2,}|$)/gm;


    // const regex = /###\s*test-data\[(\d+)\](?:\.(\w+))?:([^#]*)/g;

    // const data = outputText.replace(/\n/g, "\\n").replace(/\r/g, "\\r");

    // const simplePattern = /###\s*test-data\[\d+\]/g;
    // const findDots = /###\s*test-data\[\d+\]\.\w+/g;
    // const findWithNestedDots= /###\s*test-data\[\d+\]\.\w+\.\w+/g;
    // const findWithNestedAndNotNestedDots = /###\s*test-data\[\d+\]\.\w+\.\w+|###\s*test-data\[\d+\]\.\w+/g;
    // const findContentWithNestedAndNotNestedDots = /###\s*test-data\[\d+\]\.\w+\.\w+\s*\n([\s\S]*?)(?=\n###|$)/g;
// console.log('singleQuote', [...outputText.matchAll(regex)]);



const aaaa = /###\s*test-data\[(\d+)\](?:\.(\w+))?(?:\.(\w+))?:([^#]*)/g;

const results = [];

let matchFields;

while ((matchFields = aaaa.exec(outputText)) !== null) {
  const index = matchFields[1]; // Extract the index inside [ ]
  const field1 = matchFields[2] || null; // Extract the first-level field (e.g., question, answer, or test)
  const field2 = matchFields[3] || null; // Extract the second-level field (e.g., a, q)
  const content = matchFields[4].trim(); // Extract the content between colons

  results.push({
    index,
    field1,
    field2,
    content,
  });
}


// Result array to hold all question-answer pairs
const resultArray = [];

results.forEach(({ index, field1, field2, content }) => {
  // Clean the content to remove the trailing colon and trim it
  const cleanContent = content.replace(/:$/, "").trim();

  // Find if the result already exists in the array by matching index
  let existingObj = resultArray.find(obj => obj.index === index);

  // If the object doesn't exist, create a new one
  if (!existingObj) {
    existingObj = { index };
    resultArray.push(existingObj);
  }

  // Assign the question or answer to the appropriate field
  if (field1 === "question") {
    existingObj.question = cleanContent;
  } else if (field1 === "answer") {
    existingObj.answer = parseInt(cleanContent, 10); // Convert answer to an integer
  } else if (field1 === "test" && field2) {
    if (!existingObj.test) {
      existingObj.test = {};
    }
    existingObj.test[field2] = cleanContent;
  }
});

// Remove the index key if not needed (optional)
resultArray.forEach(item => delete item.index);

    return JSON.stringify(resultArray, null, 2);
  } catch (error) {
    console.error('Error processing markdown:', error);
    throw error;
  }
}