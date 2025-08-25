import { openai, MODELS, DEFAULT_PARAMS, SYSTEM_PROMPTS } from "../../config/openai.js";
import type { ChatMessage, ChatCompletionRequest, StreamingResponse } from "@shared/schema.js";

/**
 * Week 1 - Chat Service Implementation
 * @description Handles basic chat completions with system, user, and assistant roles
 * Implements chat history memory and streaming responses
 */
export class ChatService {
  private chatHistory: Map<string, ChatMessage[]> = new Map();

  /**
   * Initialize chat session with welcome message
   * @param sessionId - Unique identifier for the chat session
   * @returns Promise<ChatMessage> - Welcome message from assistant
   */
  async initializeChat(sessionId: string): Promise<ChatMessage> {
    const welcomeMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: "assistant",
      content: "Welcome to your AI Personal Assistant POC! I can help you with general conversations, knowledge base queries, image generation, audio processing, and content moderation. How can I assist you today?",
      timestamp: new Date(),
      sessionId,
    };

    this.chatHistory.set(sessionId, [welcomeMessage]);
    return welcomeMessage;
  }

  /**
   * Send a message and get AI response
   * @param request - Chat completion request with message and session info
   * @returns Promise<ChatMessage> - AI assistant response
   */
  async sendMessage(request: ChatCompletionRequest): Promise<ChatMessage> {
    try {
      // Get existing chat history
      const history = this.getChatHistory(request.sessionId);
      
      // Create user message
      const userMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: "user",
        content: request.message,
        timestamp: new Date(),
        sessionId: request.sessionId,
      };

      // Add user message to history
      history.push(userMessage);

      // Prepare messages for OpenAI API
      const messages = this.formatMessagesForAPI(history) as any[];

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: MODELS.CHAT,
        messages,
        max_tokens: DEFAULT_PARAMS.MAX_TOKENS,
        temperature: DEFAULT_PARAMS.TEMPERATURE,
        top_p: DEFAULT_PARAMS.TOP_P,
        frequency_penalty: DEFAULT_PARAMS.FREQUENCY_PENALTY,
        presence_penalty: DEFAULT_PARAMS.PRESENCE_PENALTY,
      });

      // Create assistant response
      const assistantMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: "assistant",
        content: completion.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date(),
        sessionId: request.sessionId,
        tokenUsage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
      };

      // Add assistant message to history
      history.push(assistantMessage);
      this.chatHistory.set(request.sessionId, history);

      return assistantMessage;
    } catch (error) {
      console.error("Error in chat completion:", error);
      throw new Error(`Chat completion failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Send message with streaming response
   * @param request - Chat completion request
   * @returns AsyncGenerator<StreamingResponse> - Streaming response chunks
   */
  async* sendStreamingMessage(request: ChatCompletionRequest): AsyncGenerator<StreamingResponse> {
    try {
      const history = this.getChatHistory(request.sessionId);
      
      const userMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: "user",
        content: request.message,
        timestamp: new Date(),
        sessionId: request.sessionId,
      };

      history.push(userMessage);
      const messages = this.formatMessagesForAPI(history) as any[];

      const stream = await openai.chat.completions.create({
        model: MODELS.CHAT,
        messages,
        max_tokens: DEFAULT_PARAMS.MAX_TOKENS,
        temperature: DEFAULT_PARAMS.TEMPERATURE,
        stream: true,
      });

      let fullContent = "";
      const messageId = this.generateMessageId();

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullContent += content;
          yield {
            type: "chunk",
            content,
            messageId,
            sessionId: request.sessionId,
          };
        }
      }

      // Save complete message to history
      const assistantMessage: ChatMessage = {
        id: messageId,
        role: "assistant",
        content: fullContent,
        timestamp: new Date(),
        sessionId: request.sessionId,
      };

      history.push(assistantMessage);
      this.chatHistory.set(request.sessionId, history);

      yield {
        type: "complete",
        message: assistantMessage,
        sessionId: request.sessionId,
      };

    } catch (error) {
      console.error("Error in streaming chat:", error);
      yield {
        type: "error",
        error: `Streaming failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        sessionId: request.sessionId,
      };
    }
  }

  /**
   * Get chat history for a session
   * @param sessionId - Unique session identifier
   * @returns ChatMessage[] - Array of chat messages
   */
  getChatHistory(sessionId: string): ChatMessage[] {
    return this.chatHistory.get(sessionId) || [];
  }

  /**
   * Clear chat history for a session
   * @param sessionId - Unique session identifier
   */
  clearChatHistory(sessionId: string): void {
    this.chatHistory.delete(sessionId);
  }

  /**
   * Format messages for OpenAI API
   * @private
   * @param history - Chat message history
   * @returns Array of formatted messages for API
   */
  private formatMessagesForAPI(history: ChatMessage[]) {
    return [
      { role: "system", content: SYSTEM_PROMPTS.GENERAL },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    ];
  }

  /**
   * Generate unique message ID
   * @private
   * @returns string - Unique message identifier
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const chatService = new ChatService();
