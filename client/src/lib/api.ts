import { apiRequest } from "./queryClient";

/**
 * API client for OpenAI POC endpoints
 * @description Centralized API calls for all POC functionality
 */
export const api = {
  // Chat endpoints
  async initializeChat(sessionId: string) {
    const response = await apiRequest("POST", "/api/chat/init", { sessionId });
    return response.json();
  },

  async sendMessage(message: string, sessionId: string) {
    const response = await apiRequest("POST", "/api/chat/message", {
      message,
      sessionId,
    });
    return response.json();
  },

  async sendIntegratedMessage(data: {
    message: string;
    sessionId: string;
    enableTTS?: boolean;
    ttsVoice?: string;
  }) {
    const response = await apiRequest("POST", "/api/chat/integrated", data);
    return response.json();
  },

  async getChatHistory(sessionId: string) {
    const response = await apiRequest("GET", `/api/chat/history/${sessionId}`);
    return response.json();
  },

  async clearChatHistory(sessionId: string) {
    const response = await apiRequest("DELETE", `/api/chat/history/${sessionId}`);
    return response.json();
  },

  // Knowledge base endpoints
  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("document", file);
    
    const response = await fetch("/api/knowledge-base/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  async queryKnowledgeBase(data: {
    question: string;
    sessionId: string;
    maxResults?: number;
    minSimilarity?: number;
  }) {
    const response = await apiRequest("POST", "/api/knowledge-base/query", data);
    return response.json();
  },

  async getDocuments() {
    const response = await apiRequest("GET", "/api/knowledge-base/documents");
    return response.json();
  },

  async removeDocument(documentId: string) {
    const response = await apiRequest("DELETE", `/api/knowledge-base/documents/${documentId}`);
    return response.json();
  },

  // Image generation endpoints
  async generateImage(data: {
    prompt: string;
    sessionId: string;
    size?: string;
    quality?: string;
    style?: string;
  }) {
    const response = await apiRequest("POST", "/api/image/generate", data);
    return response.json();
  },

  async getImageHistory(sessionId: string) {
    const response = await apiRequest("GET", `/api/image/history/${sessionId}`);
    return response.json();
  },

  // Audio endpoints
  async transcribeAudio(file: File, sessionId: string, options?: {
    language?: string;
    prompt?: string;
  }) {
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("sessionId", sessionId);
    
    if (options?.language) {
      formData.append("language", options.language);
    }
    if (options?.prompt) {
      formData.append("prompt", options.prompt);
    }
    
    const response = await fetch("/api/audio/transcribe", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  async textToSpeech(data: {
    text: string;
    sessionId: string;
    voice?: string;
    speed?: number;
  }) {
    const response = await apiRequest("POST", "/api/audio/tts", data);
    return response.json();
  },

  // Moderation endpoints
  async moderateContent(data: {
    content: string;
    sessionId: string;
  }) {
    const response = await apiRequest("POST", "/api/moderation/check", data);
    return response.json();
  },

  // Session management endpoints
  async updateSessionFeatures(sessionId: string, features: any) {
    const response = await apiRequest("POST", "/api/session/features", {
      sessionId,
      features,
    });
    return response.json();
  },

  async getSessionStatistics(sessionId: string) {
    const response = await apiRequest("GET", `/api/session/stats/${sessionId}`);
    return response.json();
  },

  async getSystemStatistics() {
    const response = await apiRequest("GET", "/api/system/stats");
    return response.json();
  },
};
