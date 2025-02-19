import { Message } from "@/types/message";
import { SYSTEM_PROMPT, INITIAL_PROMPT } from "./prompts";

export class AISession {
  private messages: Message[] = [];
  private systemPrompt: string = SYSTEM_PROMPT;

  constructor() {
    // Add the initial system message
    this.messages.push({
      role: "assistant",
      content: INITIAL_PROMPT,
      timestamp: new Date(),
    });
  }

  public async sendMessage(content: string): Promise<Message> {
    // Add user message
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date(),
    };
    this.messages.push(userMessage);

    // TODO: Send messages to AI API and get response
    // For now, just echo back
    const aiMessage: Message = {
      role: "assistant",
      content: `I received your message: ${content}`,
      timestamp: new Date(),
    };
    this.messages.push(aiMessage);

    return aiMessage;
  }

  public getMessages(): Message[] {
    return this.messages;
  }

  public clearMessages(): void {
    this.messages = [
      {
        role: "assistant",
        content: INITIAL_PROMPT,
        timestamp: new Date(),
      },
    ];
  }
}
