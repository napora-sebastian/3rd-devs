import express from 'express';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { promises as fs } from 'fs';
import { sendToOllama } from './services/send-ollama';
import { JOBS_CREATOR_PROMPT } from './prompts-storage/jobs-creator.prompt';
import { extractMessagesFromString } from './utils/extract-messages-from-string';
import { handleFileContent } from './utils/handle-file-content';
type Role = 'user' | 'assistant' | 'system';
type Message = Omit<ChatCompletionMessageParam, 'role'> & { role: Role };

interface SearchResult {
  url: string;
  title: string;
  description: string;
  content?: string;
}

/*
Start Express server
*/
const app = express();
const port = 3000;
app.use(express.json());
app.listen(port, () => console.log(`Server running at http://localhost:${port}. Listening for POST /api/chat requests`));

export const mainService = () => {
  app.post('/agent', async (req, res) => {
    console.log('Received request');
    await fs.writeFile('prompt.md', '');

    const { messages }: { messages: Message[] } = req.body;

    console.log('agent Messages:', messages);

    try {
      const latestUserMessage = messages.filter(m => m.role === 'user').pop();
      if (!latestUserMessage) {
        throw new Error('No user message found');
      }

      const prepareJobsToDo = await sendToOllama({ content: latestUserMessage.content as string, assitantMessage: JOBS_CREATOR_PROMPT })

      const messagesArray = extractMessagesFromString(prepareJobsToDo);
      console.log('messagesArray', messagesArray);

      const readmeFilePath = "/Users/sna/Desktop/AI_DEVS_3/3rd-devs/word/src/prompts-storage/CREATED-jobs-prompts.md";

      handleFileContent(readmeFilePath, messagesArray);

      return res.json(prepareJobsToDo);
    } catch (error) {
      console.error('Error in chat processing:', error);
      res.status(500).json({ error: 'An error occurred while processing your request' });
    }
  });
}