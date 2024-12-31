import axios from "axios";

export async function sendToOllama({content, assitantMessage}:{content: string, assitantMessage: string}) {
    const url = "http://127.0.0.1:11434/api/chat";
    const payload = {
        model: "gemma2:27b",
        messages: [
            // { role: "system", content: assitantMessage },
            { role: "user", content },
            // { role: "assistant", content: assitantMessage }
        ],
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { "Content-Type": "application/json" }
        });

        if (response.status !== 200) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        return response.data;
    } catch (error: any) {
        console.error(`Error sending to Ollama: ${error?.message}`);
    }
}