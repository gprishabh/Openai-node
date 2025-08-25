import OpenAI from "openai";

/**
 * OpenAI configuration and client initialization
 * Handles API key validation and client setup for the POC
 */

// Validate required environment variables
const API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;

if (!API_KEY) {
  throw new Error(
    "OPENAI_API_KEY is required. Please set it in your .env file."
  );
}

/**
 * Initialize OpenAI client with API key
 * @description Creates a configured OpenAI client instance for use across all services
 */
export const openai = new OpenAI({
  apiKey: API_KEY,
});

/**
 * Model configurations for different OpenAI services
 * @description Centralized model configuration to ensure consistency across the POC
 */
export const MODELS = {
  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  CHAT: process.env.OPENAI_MODEL || "gpt-5",
  EMBEDDING: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small", 
  IMAGE: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
  AUDIO: process.env.OPENAI_AUDIO_MODEL || "whisper-1",
  TTS: process.env.OPENAI_TTS_MODEL || "tts-1",
} as const;

/**
 * Default parameters for OpenAI API calls
 * @description Standard configuration values used across different services
 */
export const DEFAULT_PARAMS = {
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
  TOP_P: 1,
  FREQUENCY_PENALTY: 0,
  PRESENCE_PENALTY: 0,
} as const;

/**
 * System prompts for different assistant modes
 * @description Pre-configured system messages for various POC functionalities
 */
export const SYSTEM_PROMPTS = {
  GENERAL: "You are a helpful AI assistant that can answer questions, generate images, process audio, and search through uploaded documents. Always be concise but thorough in your responses.",
  KNOWLEDGE_BASE: "You are an AI assistant with access to a knowledge base. Use the provided context to answer questions accurately. If the context doesn't contain relevant information, say so clearly.",
  CODE_HELPER: "You are an AI assistant specialized in helping with OpenAI Node.js integration. Provide clear, well-documented code examples with JSDoc comments.",
} as const;
