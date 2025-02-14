import axios from "axios";
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { censorPrompt } from "./prompt";

export async function sendToOllama(
    {
        userMessage,
    }: {
        userMessage: string;
    }
): Promise<any> {
    console.log('Fetching text from centrala')
    const getContent = await axios.get(`https://centrala.ag3nts.org/data/${process.env.AI_DEVS_KEY}/cenzura.txt`)

    console.log('Fetched data from centrala', getContent.data)

    const url = "http://127.0.0.1:11434/api/chat";
    const payload = {
        model: "phi4",
        messages: [
            { role: "system", content: censorPrompt },
            { role: "user", content: userMessage + getContent.data },
            // Optionally include the assistant role if needed
            // { role: "assistant", content: assitantMessage }
        ],
        stream: true,
        // Set the response format to JSON
        // response_format: { type: "json_object" },
    };

    console.log('Sending data to ollama')
    try {
        const response = await axios.post(url, payload, {
            headers: { "Content-Type": "application/json" },
            responseType: "stream"
        });

        if (response.status !== 200) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        let output = await new Promise((resolve, reject) => {
            let cumulatedOutput = "";

            response.data.on("data", (chunk: Buffer) => {
                //convert to stringified JSON
                const text = chunk.toString("utf-8"); 
                const parsedText = JSON.parse(text);
                //assign the content to the cumulatedOutput
                cumulatedOutput += parsedText.message.content;
            });

            response.data.on("end", () => {
                console.log("Streaming completed.", cumulatedOutput);
                //resolve the promise with the cumulatedOutput
                resolve(cumulatedOutput);
            });
        });

        return output;
    } catch (error: any) {
        console.error(`Error sending to Ollama: ${error?.message}`);
        if (error.response) {
            console.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        console.error(`Stack trace: ${error.stack}`);
        throw error; // Re-throw the error if you want the caller to handle it
    }
}

async function resendAnswer(answer: string) {
    try {

        const response = await axios.post(`https://centrala.ag3nts.org/report`, {
            task: "CENZURA",
            apikey:process.env.AI_DEVS_KEY,
            answer: answer
        })

        return response.data;
    } catch (error: any) {
        console.error(`Error sending to Ollama: ${error?.message}`);
        if (error.response) {
            console.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        console.error(`Stack trace: ${error.stack}`);
        return error // Re-throw the error if you want the caller to handle it
    }
}



const app = express();
const port = 3000;
app.use(express.json());


app.post('/api/chat', async (req, res) => {
    let { messages, conversation_id = uuidv4() } = req.body;

    const newMessages = messages.filter((msg: ChatCompletionMessageParam) => msg.role !== 'system');
    const userMessage = messages.find((msg: ChatCompletionMessageParam) => msg.role === 'user');

    const response = await sendToOllama({ userMessage: userMessage.content })
    console.log('Response from ollama', response)

    const resendAnswerValue = await resendAnswer(response)

    res.send(resendAnswerValue);
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
