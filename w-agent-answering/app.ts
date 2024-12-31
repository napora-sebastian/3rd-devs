import axios from 'axios';
import express from 'express';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OpenAIService } from './OpenAIService';
import { WebSearchService } from './WebSearch';
import { answerPrompt } from './prompts';

import { promises as fs } from 'fs';
import { assumeNextStep } from './services/assumeNextStep';
import { sendMessageToXYZ } from './services/xyz';
import { answerToQuery } from './services/answerToQuery';
type Role = 'user' | 'assistant' | 'system';
type Message = Omit<ChatCompletionMessageParam, 'role'> & { role: Role };

interface SearchResult {
  url: string;
  title: string;
  description: string;
  content?: string;
}


const allowedDomains = [
  { name: 'xyz.ag3nts.org', url: 'xyz.ag3nts.org', scrappable: true },
  // { name: 'Wikipedia', url: 'en.wikipedia.org', scrappable: true },
  // { name: 'easycart', url: 'easycart.pl', scrappable: true },
  // { name: 'FS.blog', url: 'fs.blog', scrappable: true },
  // { name: 'arXiv', url: 'arxiv.org', scrappable: true },
  // { name: 'Instagram', url: 'instagram.com', scrappable: false },
  // { name: 'OpenAI', url: 'openai.com', scrappable: true },
  // { name: 'Brain overment', url: 'brain.overment.com', scrappable: true },
];

/*
Start Express server
*/
const app = express();
const port = 3000;
app.use(express.json());
app.listen(port, () => console.log(`Server running at http://localhost:${port}. Listening for POST /api/agent requests`));

const webSearchService = new WebSearchService(allowedDomains);
const openaiService = new OpenAIService();

app.post('/api/agent', async (req, res) => {
  console.log('Received request');
  await fs.writeFile('prompt.md', '');

  try {
    const { text, msgID } = req.body;

    let msgIdStored = msgID

    const nextStep = await assumeNextStep({ text, msgID: msgIdStored });

    console.log('Next step:', nextStep);

    let answer = 'READY';
    let result = { text: 'READY' };

    if (nextStep === '1') {
      while (!answer.includes('{{FLG')) {
        if (answer === 'READY') {
          const res = await sendMessageToXYZ({ text: answer, msgID: 0 });

          result = res
          msgIdStored = res.msgID
        }
        const answeredQuestion = await answerToQuery({ text: result.text, msgID: msgIdStored });
        const resultAfterAnswer = await sendMessageToXYZ({ text: answeredQuestion, msgID: msgIdStored });
        console.log('Result:', { result, answeredQuestion, resultAfterAnswer });
        answer = resultAfterAnswer.text
        result = { text: resultAfterAnswer.text }
      }
    }




    if (result.text.includes('{{FLG')) {
      res.json(result);
    }
  }
  catch (error) {
    console.error('Error in chat processing:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.post('/api/chat-dummy', async (req, res) => {
  const { messages }: { messages: Message[] } = req.body;

  try {
    const latestUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!latestUserMessage) {
      throw new Error('No user message found');
    }

    const dummyResponse: ChatCompletionMessageParam = {
      role: 'assistant',
      content: `This is a dummy response to: "${latestUserMessage.content}"`
    };

    const completion = {
      id: 'dummy-completion-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'dummy-model',
      choices: [
        {
          index: 0,
          message: dummyResponse,
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };

    return res.json(completion);
  } catch (error) {
    console.error('Error in chat processing:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});