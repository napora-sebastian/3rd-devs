import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class OllamaLocalService {
//   private ollama: OpenAI;

  constructor() {
    // this.ollama = new OpenAI();
  }


  async completion(
    messages: ChatCompletionMessageParam[],
    model: string = "llama3.2",
    stream: boolean = false,
    jsonMode: boolean = false
  ): Promise<any> {
    try {
      const response = await fetch("http://127.0.0.1:11434/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model,
          stream,
          response_format: jsonMode ? { type: "json_object" } : { type: "text" }
        })
      });

      console.log("$$$$$$$$$$$$$$$$");
      console.log("Ollama response:", response);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const result = await response.json();
      // console.log("$$$$$$$$$$$$$$$$");
      // console.log("$$$$$$$$$$$$$$$$");
      // console.log("Ollama result:", result);
      return result;
    } catch (error) {
      console.error("Error in Ollama completion:", error);
      throw error;
    }
  }
}