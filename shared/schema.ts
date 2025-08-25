import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * User table schema
 */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/**
 * Chat message types for Week 1
 */
export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: Date;
  sessionId: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatCompletionRequest {
  message: string;
  sessionId: string;
}

export interface StreamingResponse {
  type: "chunk" | "complete" | "error";
  content?: string;
  messageId?: string;
  message?: ChatMessage;
  error?: string;
  sessionId: string;
}

/**
 * Embedding and knowledge base types for Week 2
 */
export interface DocumentEmbedding {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    filename: string;
    source: string;
    chunkIndex: number;
    timestamp: Date;
    tokenCount: number;
  };
}

export interface EmbeddingRequest {
  text: string;
  filename?: string;
  source?: string;
  chunkIndex?: number;
}

export interface KnowledgeBaseQuery {
  question: string;
  sessionId: string;
  maxResults?: number;
  minSimilarity?: number;
}

export interface KnowledgeBaseResponse {
  answer: string;
  sources: Array<{
    filename: string;
    similarity: number;
    snippet: string;
  }>;
  confidence: number;
  hasContext: boolean;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Image generation types for Week 3
 */
export interface ImageGenerationRequest {
  prompt: string;
  sessionId: string;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
}

export interface ImageGenerationResponse {
  id: string;
  url: string;
  prompt: string;
  revisedPrompt: string;
  size: string;
  quality: string;
  style: string;
  timestamp: Date;
  sessionId: string;
}

/**
 * Audio processing types for Week 3
 */
export interface AudioTranscriptionRequest {
  filePath: string;
  sessionId: string;
  language?: string;
  prompt?: string;
  responseFormat?: "json" | "text" | "srt" | "verbose_json" | "vtt";
  temperature?: number;
}

export interface AudioTranscriptionResponse {
  id: string;
  text: string;
  language: string;
  duration: number;
  filename: string;
  fileSize: number;
  timestamp: Date;
  sessionId: string;
  confidence: number;
}

export interface TextToSpeechRequest {
  text: string;
  sessionId: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  responseFormat?: "mp3" | "opus" | "aac" | "flac";
  speed?: number;
}

export interface TextToSpeechResponse {
  id: string;
  text: string;
  voice: string;
  speed: number;
  responseFormat: string;
  filename: string;
  filepath: string;
  fileSize: number;
  timestamp: Date;
  sessionId: string;
  duration: number;
}

/**
 * Content moderation types for Week 3
 */
export interface ModerationRequest {
  content: string;
  sessionId: string;
}

export interface ModerationResponse {
  id: string;
  content: string;
  flagged: boolean;
  categories: {
    hate: boolean;
    hateThreatening: boolean;
    harassment: boolean;
    harassmentThreatening: boolean;
    selfHarm: boolean;
    selfHarmIntent: boolean;
    selfHarmInstructions: boolean;
    sexual: boolean;
    sexualMinors: boolean;
    violence: boolean;
    violenceGraphic: boolean;
  };
  categoryScores: {
    hate: number;
    hateThreatening: number;
    harassment: number;
    harassmentThreatening: number;
    selfHarm: number;
    selfHarmIntent: number;
    selfHarmInstructions: number;
    sexual: number;
    sexualMinors: number;
    violence: number;
    violenceGraphic: number;
  };
  timestamp: Date;
  sessionId: string;
  action: "allow" | "warn" | "block";
  riskLevel: "low" | "medium" | "high";
}

/**
 * Integration types for Week 4
 */
export interface ChatFeatures {
  chat: boolean;
  knowledgeBase: boolean;
  imageGeneration: boolean;
  audioInput: boolean;
  textToSpeech: boolean;
  moderation: boolean;
}

export interface IntegratedChatRequest {
  message: string;
  sessionId: string;
  enableTTS?: boolean;
  ttsVoice?: string;
}

export interface IntegratedChatResponse {
  sessionId: string;
  timestamp: Date;
  features: ChatFeatures;
  requestType?: string;
  chat?: ChatMessage;
  knowledgeBase?: KnowledgeBaseResponse;
  image?: ImageGenerationResponse;
  audio?: TextToSpeechResponse;
  audioTranscription?: AudioTranscriptionResponse;
  moderation?: ModerationResponse;
  error?: string;
}

export interface SessionStatistics {
  sessionId: string;
  messagesCount: number;
  imagesGenerated: number;
  audioTranscriptions: number;
  knowledgeBaseQueries: number;
  moderationChecks: number;
  moderationBlocked: number;
  tokensUsed: number;
  sessionDuration: number;
  startTime: Date;
  lastActivity: Date;
}

export interface SessionData {
  sessionId: string;
  features: ChatFeatures;
  statistics: SessionStatistics;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Validation schemas
 */
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().min(1),
});

export const imageGenerationSchema = z.object({
  prompt: z.string().min(1).max(1000),
  sessionId: z.string().min(1),
  size: z.enum(["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"]).optional(),
  quality: z.enum(["standard", "hd"]).optional(),
  style: z.enum(["vivid", "natural"]).optional(),
});

export const knowledgeBaseQuerySchema = z.object({
  question: z.string().min(1).max(1000),
  sessionId: z.string().min(1),
  maxResults: z.number().min(1).max(10).optional(),
  minSimilarity: z.number().min(0).max(1).optional(),
});

export const moderationSchema = z.object({
  content: z.string().min(1).max(4000),
  sessionId: z.string().min(1),
});

export const sessionFeaturesSchema = z.object({
  sessionId: z.string().min(1),
  features: z.object({
    chat: z.boolean(),
    knowledgeBase: z.boolean(),
    imageGeneration: z.boolean(),
    audioInput: z.boolean(),
    textToSpeech: z.boolean(),
    moderation: z.boolean(),
  }),
});
