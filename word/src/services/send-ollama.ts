import axios from "axios";

export async function sendToOllama({
    content,
    assitantMessage,
}: {
    content: string;
    assitantMessage: string;
}): Promise<any> {
    const url = "http://127.0.0.1:11434/api/chat";
    const payload = {
        model: "phi4",
        messages: [
            { role: "system", content: assitantMessage },
            { role: "user", content },
            // Optionally include the assistant role if needed
            // { role: "assistant", content: assitantMessage }
        ],
        // Set the response format to JSON
        // response_format: { type: "json_object" },
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { "Content-Type": "application/json" },
        });

        if (response.status !== 200) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        return response.data;
    } catch (error: any) {
        console.error(`Error sending to Ollama: ${error?.message}`);
        if (error.response) {
            console.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        console.error(`Stack trace: ${error.stack}`);
        throw error; // Re-throw the error if you want the caller to handle it
    }
}
