import { type ChatMessage, type DocumentEmbedding, type SessionData, type User, type InsertUser } from "@shared/schema.js";
import { randomUUID } from "crypto";

/**
 * Storage interface for the OpenAI POC
 * Extends the basic storage interface to include POC-specific data types
 */
export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Chat message storage
  saveChatMessage(message: ChatMessage): Promise<void>;
  getChatHistory(sessionId: string): Promise<ChatMessage[]>;
  clearChatHistory(sessionId: string): Promise<void>;

  // Document embedding storage  
  saveEmbedding(embedding: DocumentEmbedding): Promise<void>;
  getEmbeddings(documentId?: string): Promise<DocumentEmbedding[]>;
  deleteEmbeddings(documentId: string): Promise<void>;

  // Session data management
  saveSessionData(sessionData: SessionData): Promise<void>;
  getSessionData(sessionId: string): Promise<SessionData | undefined>;
  deleteSessionData(sessionId: string): Promise<void>;
}

/**
 * In-memory storage implementation for the POC
 * @description Provides fast, temporary storage for development and testing
 * In production, this would be replaced with a proper database implementation
 */
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatMessages: Map<string, ChatMessage[]>; // sessionId -> messages
  private embeddings: Map<string, DocumentEmbedding[]>; // documentId -> embeddings
  private sessions: Map<string, SessionData>;

  constructor() {
    this.users = new Map();
    this.chatMessages = new Map();
    this.embeddings = new Map();
    this.sessions = new Map();
  }

  /**
   * User management methods
   */
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  /**
   * Chat message storage methods
   */
  async saveChatMessage(message: ChatMessage): Promise<void> {
    const sessionMessages = this.chatMessages.get(message.sessionId) || [];
    sessionMessages.push(message);
    this.chatMessages.set(message.sessionId, sessionMessages);
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    return this.chatMessages.get(sessionId) || [];
  }

  async clearChatHistory(sessionId: string): Promise<void> {
    this.chatMessages.delete(sessionId);
  }

  /**
   * Document embedding storage methods
   */
  async saveEmbedding(embedding: DocumentEmbedding): Promise<void> {
    const documentId = embedding.metadata.source || "default";
    const documentEmbeddings = this.embeddings.get(documentId) || [];
    documentEmbeddings.push(embedding);
    this.embeddings.set(documentId, documentEmbeddings);
  }

  async getEmbeddings(documentId?: string): Promise<DocumentEmbedding[]> {
    if (documentId) {
      return this.embeddings.get(documentId) || [];
    }
    
    // Return all embeddings if no documentId specified
    const allEmbeddings: DocumentEmbedding[] = [];
    for (const embeddings of this.embeddings.values()) {
      allEmbeddings.push(...embeddings);
    }
    return allEmbeddings;
  }

  async deleteEmbeddings(documentId: string): Promise<void> {
    this.embeddings.delete(documentId);
  }

  /**
   * Session data management methods
   */
  async saveSessionData(sessionData: SessionData): Promise<void> {
    this.sessions.set(sessionData.sessionId, sessionData);
  }

  async getSessionData(sessionId: string): Promise<SessionData | undefined> {
    return this.sessions.get(sessionId);
  }

  async deleteSessionData(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  /**
   * Utility methods for storage management
   */

  /**
   * Get storage statistics
   * @returns Object with storage usage statistics
   */
  getStorageStats(): {
    users: number;
    chatSessions: number;
    totalMessages: number;
    embeddingDocuments: number;
    totalEmbeddings: number;
    sessions: number;
  } {
    const totalMessages = Array.from(this.chatMessages.values()).reduce(
      (sum, messages) => sum + messages.length,
      0
    );

    const totalEmbeddings = Array.from(this.embeddings.values()).reduce(
      (sum, embeddings) => sum + embeddings.length,
      0
    );

    return {
      users: this.users.size,
      chatSessions: this.chatMessages.size,
      totalMessages,
      embeddingDocuments: this.embeddings.size,
      totalEmbeddings,
      sessions: this.sessions.size,
    };
  }

  /**
   * Clear all data (useful for testing)
   */
  clearAll(): void {
    this.users.clear();
    this.chatMessages.clear();
    this.embeddings.clear();
    this.sessions.clear();
  }

  /**
   * Get memory usage estimate
   * @returns Estimated memory usage in bytes
   */
  getMemoryUsage(): number {
    let totalSize = 0;

    // Estimate user data size
    for (const user of this.users.values()) {
      totalSize += JSON.stringify(user).length * 2; // rough UTF-16 estimate
    }

    // Estimate chat message data size
    for (const messages of this.chatMessages.values()) {
      for (const message of messages) {
        totalSize += JSON.stringify(message).length * 2;
      }
    }

    // Estimate embedding data size (embeddings are large)
    for (const embeddings of this.embeddings.values()) {
      for (const embedding of embeddings) {
        totalSize += embedding.embedding.length * 8; // 64-bit floats
        totalSize += JSON.stringify({
          id: embedding.id,
          text: embedding.text,
          metadata: embedding.metadata,
        }).length * 2;
      }
    }

    // Estimate session data size
    for (const session of this.sessions.values()) {
      totalSize += JSON.stringify(session).length * 2;
    }

    return totalSize;
  }
}

export const storage = new MemStorage();
