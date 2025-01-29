import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LangfuseService } from './LangfuseService';
import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OpenAIService } from './OpenAIService';
import { AssistantService } from './AssistantService';

const app = express();
const port = 3000;
app.use(express.json());

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}


const langfuseService = new LangfuseService();
const openaiService = new OpenAIService();
const assistantService = new AssistantService(openaiService, langfuseService);

app.post('/api/chat', async (req, res) => {
  let { messages, conversation_id = uuidv4() } = req.body;

  console.log('Received messages:', messages);

  // Validate and format messages
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages must be an array' });
  }

  messages = messages.map((msg: any): ChatMessage => {
    if (typeof msg === 'string') {
      return { role: 'user', content: msg };
    }
    if (typeof msg === 'object' && msg.role && msg.content) {
      return { role: msg.role, content: msg.content };
    }
    throw new Error('Invalid message format');
  });

  const trace = langfuseService.createTrace({ 
    id: uuidv4(), 
    name: (messages.at(-1)?.content || '').slice(0, 45), 
    sessionId: conversation_id, 
    userId: 'test-user' 
  });

  let answer: ChatCompletion | null = null;
  try {

    answer = await assistantService.answer({ messages }, trace);
    console.log('Processed messages:', answer);
  } catch (error) {
    console.error('Error in chat processing:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
  
  if(!answer) {
    return res.status(500).json({ error: 'An error occurred while processing your request' });
  }
  
  try {

    await langfuseService.finalizeTrace(trace, {messages}, answer.choices[0].message);
    await langfuseService.flushAsync();
    return res.json({...answer, conversation_id});
  } catch (error) {
    await langfuseService.finalizeTrace(trace, req.body, { error: 'An error occurred while processing your request' });
    console.error('Error in chat processing:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

process.on('SIGINT', async () => {
  await langfuseService.shutdownAsync();
  process.exit(0);
});