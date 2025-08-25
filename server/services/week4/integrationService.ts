import { chatService } from "../week1/chatService.js";
import { knowledgeBaseService } from "../week2/knowledgeBaseService.js";
import { imageService } from "../week3/imageService.js";
import { audioService } from "../week3/audioService.js";
import { moderationService } from "../week3/moderationService.js";
import type { 
  IntegratedChatRequest, 
  IntegratedChatResponse, 
  ChatFeatures,
  SessionStatistics 
} from "@shared/schema.js";

/**
 * Week 4 - Integration Service Implementation
 * @description Unified service that orchestrates all POC features
 * Provides a single endpoint integrating chat, knowledge base, images, audio, and moderation
 */
export class IntegrationService {
  private sessionFeatures: Map<string, ChatFeatures> = new Map();
  private sessionStatistics: Map<string, SessionStatistics> = new Map();

  /**
   * Process integrated chat request with all available features
   * @param request - Comprehensive chat request with feature flags and content
   * @returns Promise<IntegratedChatResponse> - Unified response with all applicable results
   */
  async processRequest(request: IntegratedChatRequest): Promise<IntegratedChatResponse> {
    try {
      // Get session features configuration
      const features = this.getSessionFeatures(request.sessionId);
      
      // Initialize response object
      const response: IntegratedChatResponse = {
        sessionId: request.sessionId,
        timestamp: new Date(),
        features,
      };

      // Step 1: Content moderation (if enabled)
      if (features.moderation) {
        const moderationResult = await moderationService.moderateContent({
          content: request.message,
          sessionId: request.sessionId,
        });

        response.moderation = moderationResult;

        // If content is flagged, return safe response and stop processing
        if (moderationResult.flagged) {
          response.chat = {
            id: this.generateResponseId(),
            role: "assistant",
            content: moderationService.generateSafeResponse(moderationResult),
            timestamp: new Date(),
            sessionId: request.sessionId,
          };
          
          this.updateStatistics(request.sessionId, "moderation_blocked");
          return response;
        }
      }

      // Step 2: Determine request type and route accordingly
      const requestType = this.analyzeRequestType(request.message);
      response.requestType = requestType;

      // Step 3: Process based on request type
      switch (requestType) {
        case "image_generation":
          if (features.imageGeneration) {
            response.image = await this.handleImageGeneration(request);
            response.chat = {
              id: this.generateResponseId(),
              role: "assistant",
              content: `I've generated an image based on your prompt: "${request.message}". The image should appear above this message.`,
              timestamp: new Date(),
              sessionId: request.sessionId,
            };
          } else {
            response.chat = await chatService.sendMessage({
              message: "Image generation is currently disabled. Please enable it in the features panel to generate images.",
              sessionId: request.sessionId,
            });
          }
          break;

        case "knowledge_base_query":
          if (features.knowledgeBase) {
            const kbResponse = await knowledgeBaseService.query({
              question: request.message,
              sessionId: request.sessionId,
              maxResults: 3,
              minSimilarity: 0.7,
            });
            
            response.knowledgeBase = kbResponse;
            response.chat = {
              id: this.generateResponseId(),
              role: "assistant",
              content: kbResponse.answer,
              timestamp: new Date(),
              sessionId: request.sessionId,
            };
          } else {
            response.chat = await chatService.sendMessage({
              message: "Knowledge base queries are currently disabled. Please enable the knowledge base feature or upload some documents first.",
              sessionId: request.sessionId,
            });
          }
          break;

        case "general_chat":
        default:
          response.chat = await chatService.sendMessage({
            message: request.message,
            sessionId: request.sessionId,
          });
          break;
      }

      // Step 4: Text-to-speech processing (if enabled and requested)
      if (features.textToSpeech && request.enableTTS && response.chat) {
        try {
          response.audio = await audioService.textToSpeech({
            text: response.chat.content,
            voice: (request.ttsVoice || "alloy") as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
            sessionId: request.sessionId,
          });
        } catch (error) {
          console.error("TTS generation failed:", error);
          // Don't fail the entire request if TTS fails
        }
      }

      // Step 5: Update session statistics
      this.updateStatistics(request.sessionId, requestType);

      return response;
    } catch (error) {
      console.error("Error processing integrated request:", error);
      
      // Return error response
      return {
        sessionId: request.sessionId,
        timestamp: new Date(),
        features: this.getSessionFeatures(request.sessionId),
        chat: {
          id: this.generateResponseId(),
          role: "assistant",
          content: `I apologize, but I encountered an error while processing your request: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
          timestamp: new Date(),
          sessionId: request.sessionId,
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle audio transcription and process as text
   * @param audioFilePath - Path to uploaded audio file
   * @param sessionId - Session identifier
   * @returns Promise<IntegratedChatResponse> - Response including transcription and chat
   */
  async processAudioInput(audioFilePath: string, sessionId: string): Promise<IntegratedChatResponse> {
    try {
      const features = this.getSessionFeatures(sessionId);

      if (!features.audioInput) {
        throw new Error("Audio input is disabled for this session");
      }

      // Transcribe audio
      const transcription = await audioService.transcribeAudio({
        filePath: audioFilePath,
        sessionId,
      });

      // Process transcribed text as regular chat message
      const chatResponse = await this.processRequest({
        message: transcription.text,
        sessionId,
        enableTTS: features.textToSpeech,
      });

      // Add transcription to response
      chatResponse.audioTranscription = transcription;

      return chatResponse;
    } catch (error) {
      console.error("Error processing audio input:", error);
      throw error;
    }
  }

  /**
   * Configure features for a session
   * @param sessionId - Session identifier
   * @param features - Feature configuration
   */
  configureSessionFeatures(sessionId: string, features: ChatFeatures): void {
    this.sessionFeatures.set(sessionId, features);
    console.log(`Features configured for session ${sessionId}:`, features);
  }

  /**
   * Get current feature configuration for a session
   * @param sessionId - Session identifier
   * @returns ChatFeatures - Current feature configuration
   */
  getSessionFeatures(sessionId: string): ChatFeatures {
    return this.sessionFeatures.get(sessionId) || {
      chat: true,
      knowledgeBase: true,
      imageGeneration: false,
      audioInput: false,
      textToSpeech: false,
      moderation: true,
    };
  }

  /**
   * Get comprehensive session statistics
   * @param sessionId - Session identifier
   * @returns SessionStatistics - Session usage statistics
   */
  getSessionStatistics(sessionId: string): SessionStatistics {
    const stats = this.sessionStatistics.get(sessionId) || {
      sessionId,
      messagesCount: 0,
      imagesGenerated: 0,
      audioTranscriptions: 0,
      knowledgeBaseQueries: 0,
      moderationChecks: 0,
      moderationBlocked: 0,
      tokensUsed: 0,
      sessionDuration: 0,
      startTime: new Date(),
      lastActivity: new Date(),
    };

    // Calculate session duration
    stats.sessionDuration = Date.now() - stats.startTime.getTime();

    return stats;
  }

  /**
   * Get system-wide statistics
   * @returns Object with overall system statistics
   */
  getSystemStatistics(): {
    totalSessions: number;
    activeFeatures: Record<string, number>;
    totalRequests: number;
    averageRequestsPerSession: number;
  } {
    const allStats = Array.from(this.sessionStatistics.values());
    const totalSessions = allStats.length;
    const totalRequests = allStats.reduce((sum, stat) => sum + stat.messagesCount, 0);

    // Count active features across sessions
    const activeFeatures = {
      chat: 0,
      knowledgeBase: 0,
      imageGeneration: 0,
      audioInput: 0,
      textToSpeech: 0,
      moderation: 0,
    };

    for (const features of this.sessionFeatures.values()) {
      Object.entries(features).forEach(([feature, enabled]) => {
        if (enabled && feature in activeFeatures) {
          activeFeatures[feature as keyof typeof activeFeatures]++;
        }
      });
    }

    return {
      totalSessions,
      activeFeatures,
      totalRequests,
      averageRequestsPerSession: totalSessions > 0 ? Math.round(totalRequests / totalSessions) : 0,
    };
  }

  /**
   * Clear session data
   * @param sessionId - Session identifier
   */
  clearSession(sessionId: string): void {
    // Clear data from all services
    chatService.clearChatHistory(sessionId);
    imageService.clearImageHistory(sessionId);
    audioService.clearAudioHistory(sessionId);
    moderationService.clearModerationHistory(sessionId);

    // Clear integration service data
    this.sessionFeatures.delete(sessionId);
    this.sessionStatistics.delete(sessionId);

    console.log(`Session data cleared: ${sessionId}`);
  }

  /**
   * Analyze request type based on message content
   * @private
   * @param message - User message to analyze
   * @returns string - Detected request type
   */
  private analyzeRequestType(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Image generation keywords
    const imageKeywords = ["generate image", "create image", "draw", "picture of", "image of", "generate a", "create a"];
    if (imageKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return "image_generation";
    }

    // Knowledge base query keywords
    const kbKeywords = ["what is", "explain", "how does", "tell me about", "definition of", "describe"];
    if (kbKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return "knowledge_base_query";
    }

    return "general_chat";
  }

  /**
   * Update session statistics
   * @private
   * @param sessionId - Session identifier
   * @param action - Action performed
   */
  private updateStatistics(sessionId: string, action: string): void {
    const stats = this.sessionStatistics.get(sessionId) || {
      sessionId,
      messagesCount: 0,
      imagesGenerated: 0,
      audioTranscriptions: 0,
      knowledgeBaseQueries: 0,
      moderationChecks: 0,
      moderationBlocked: 0,
      tokensUsed: 0,
      sessionDuration: 0,
      startTime: new Date(),
      lastActivity: new Date(),
    };

    // Update based on action
    switch (action) {
      case "general_chat":
        stats.messagesCount++;
        break;
      case "image_generation":
        stats.imagesGenerated++;
        stats.messagesCount++;
        break;
      case "knowledge_base_query":
        stats.knowledgeBaseQueries++;
        stats.messagesCount++;
        break;
      case "audio_transcription":
        stats.audioTranscriptions++;
        break;
      case "moderation_blocked":
        stats.moderationBlocked++;
        break;
    }

    stats.lastActivity = new Date();
    this.sessionStatistics.set(sessionId, stats);
  }

  /**
   * Generate unique response ID
   * @private
   * @returns string - Unique response identifier
   */
  private generateResponseId(): string {
    return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle image generation request
   * @private
   * @param request - Original chat request
   * @returns Promise with image generation result
   */
  private async handleImageGeneration(request: IntegratedChatRequest) {
    // Extract image prompt from message (remove trigger words)
    let prompt = request.message
      .replace(/generate\s+(image|picture)\s+(of\s+)?/i, "")
      .replace(/create\s+(an?\s+)?(image|picture)\s+(of\s+)?/i, "")
      .replace(/draw\s+(an?\s+)?/i, "")
      .trim();

    if (!prompt) {
      prompt = request.message; // Use full message if no clean prompt extracted
    }

    return await imageService.generateImage({
      prompt,
      sessionId: request.sessionId,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });
  }
}

export const integrationService = new IntegrationService();
