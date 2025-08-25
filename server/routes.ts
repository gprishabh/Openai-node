import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Import all services
import { chatService } from "./services/week1/chatService.js";
import { knowledgeBaseService } from "./services/week2/knowledgeBaseService.js";
import { imageService } from "./services/week3/imageService.js";
import { audioService } from "./services/week3/audioService.js";
import { moderationService } from "./services/week3/moderationService.js";
import { integrationService } from "./services/week4/integrationService.js";

/**
 * Configure multer for file uploads
 */
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB default
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow documents and audio files
    const allowedMimes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "audio/mpeg",
      "audio/wav",
      "audio/mp4",
      "audio/webm",
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported`));
    }
  },
});

/**
 * Register all API routes for the OpenAI POC
 * @param app - Express application instance
 * @returns Promise<Server> - HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize knowledge base with sample documents
  await knowledgeBaseService.loadSampleDocuments();

  /**
   * WEEK 1 ROUTES - Chat Basics
   */

  /**
   * Initialize chat session
   * POST /api/chat/init
   */
  app.post("/api/chat/init", async (req, res) => {
    try {
      const sessionId = req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const welcomeMessage = await chatService.initializeChat(sessionId);
      
      res.json({
        success: true,
        sessionId,
        message: welcomeMessage,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to initialize chat",
      });
    }
  });

  /**
   * Send chat message
   * POST /api/chat/message
   */
  app.post("/api/chat/message", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({
          success: false,
          error: "Message and sessionId are required",
        });
      }

      const response = await chatService.sendMessage({ message, sessionId });
      
      res.json({
        success: true,
        message: response,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to send message",
      });
    }
  });

  /**
   * Get chat history
   * GET /api/chat/history/:sessionId
   */
  app.get("/api/chat/history/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = chatService.getChatHistory(sessionId);
      
      res.json({
        success: true,
        history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get chat history",
      });
    }
  });

  /**
   * Clear chat history
   * DELETE /api/chat/history/:sessionId
   */
  app.delete("/api/chat/history/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      chatService.clearChatHistory(sessionId);
      
      res.json({
        success: true,
        message: "Chat history cleared",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to clear chat history",
      });
    }
  });

  /**
   * WEEK 2 ROUTES - Knowledge Base
   */

  /**
   * Upload document to knowledge base
   * POST /api/knowledge-base/upload
   */
  app.post("/api/knowledge-base/upload", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      // Read file content
      const filepath = req.file.path;
      const content = fs.readFileSync(filepath, "utf-8");
      
      // Process document
      const result = await knowledgeBaseService.addDocument(req.file.originalname, content);
      
      // Clean up uploaded file
      fs.unlinkSync(filepath);
      
      res.json({
        success: true,
        result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload document",
      });
    }
  });

  /**
   * Query knowledge base
   * POST /api/knowledge-base/query
   */
  app.post("/api/knowledge-base/query", async (req, res) => {
    try {
      const { question, sessionId, maxResults, minSimilarity } = req.body;
      
      if (!question || !sessionId) {
        return res.status(400).json({
          success: false,
          error: "Question and sessionId are required",
        });
      }

      const response = await knowledgeBaseService.query({
        question,
        sessionId,
        maxResults,
        minSimilarity,
      });
      
      res.json({
        success: true,
        response,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to query knowledge base",
      });
    }
  });

  /**
   * Get knowledge base documents
   * GET /api/knowledge-base/documents
   */
  app.get("/api/knowledge-base/documents", async (req, res) => {
    try {
      const documents = knowledgeBaseService.getDocumentList();
      const statistics = knowledgeBaseService.getStatistics();
      
      res.json({
        success: true,
        documents,
        statistics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get documents",
      });
    }
  });

  /**
   * WEEK 3 ROUTES - Images, Audio & Moderation
   */

  /**
   * Generate image
   * POST /api/image/generate
   */
  app.post("/api/image/generate", async (req, res) => {
    try {
      const { prompt, sessionId, size, quality, style } = req.body;
      
      if (!prompt || !sessionId) {
        return res.status(400).json({
          success: false,
          error: "Prompt and sessionId are required",
        });
      }

      const response = await imageService.generateImage({
        prompt,
        sessionId,
        size,
        quality,
        style,
      });
      
      res.json({
        success: true,
        image: response,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate image",
      });
    }
  });

  /**
   * Get image generation history
   * GET /api/image/history/:sessionId
   */
  app.get("/api/image/history/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = imageService.getImageHistory(sessionId);
      
      res.json({
        success: true,
        history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get image history",
      });
    }
  });

  /**
   * Upload and transcribe audio
   * POST /api/audio/transcribe
   */
  app.post("/api/audio/transcribe", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No audio file uploaded",
        });
      }

      const { sessionId, language, prompt } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "SessionId is required",
        });
      }

      const transcription = await audioService.transcribeAudio({
        filePath: req.file.path,
        sessionId,
        language,
        prompt,
      });
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({
        success: true,
        transcription,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to transcribe audio",
      });
    }
  });

  /**
   * Text-to-speech
   * POST /api/audio/tts
   */
  app.post("/api/audio/tts", async (req, res) => {
    try {
      const { text, sessionId, voice, speed } = req.body;
      
      if (!text || !sessionId) {
        return res.status(400).json({
          success: false,
          error: "Text and sessionId are required",
        });
      }

      const response = await audioService.textToSpeech({
        text,
        sessionId,
        voice,
        speed,
      });
      
      res.json({
        success: true,
        audio: response,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate speech",
      });
    }
  });

  /**
   * Serve generated audio files
   * GET /api/audio/file/:filename
   */
  app.get("/api/audio/file/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const filepath = path.join(process.cwd(), "uploads", "audio", filename);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({
          success: false,
          error: "Audio file not found",
        });
      }

      res.sendFile(filepath);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to serve audio file",
      });
    }
  });

  /**
   * Moderate content
   * POST /api/moderation/check
   */
  app.post("/api/moderation/check", async (req, res) => {
    try {
      const { content, sessionId } = req.body;
      
      if (!content || !sessionId) {
        return res.status(400).json({
          success: false,
          error: "Content and sessionId are required",
        });
      }

      const moderation = await moderationService.moderateContent({
        content,
        sessionId,
      });
      
      res.json({
        success: true,
        moderation,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to moderate content",
      });
    }
  });

  /**
   * WEEK 4 ROUTES - Integration
   */

  /**
   * Unified chat endpoint with all features
   * POST /api/chat/integrated
   */
  app.post("/api/chat/integrated", async (req, res) => {
    try {
      const { message, sessionId, enableTTS, ttsVoice } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({
          success: false,
          error: "Message and sessionId are required",
        });
      }

      const response = await integrationService.processRequest({
        message,
        sessionId,
        enableTTS,
        ttsVoice,
      });
      
      res.json({
        success: true,
        response,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to process integrated request",
      });
    }
  });

  /**
   * Configure session features
   * POST /api/session/features
   */
  app.post("/api/session/features", async (req, res) => {
    try {
      const { sessionId, features } = req.body;
      
      if (!sessionId || !features) {
        return res.status(400).json({
          success: false,
          error: "SessionId and features are required",
        });
      }

      integrationService.configureSessionFeatures(sessionId, features);
      
      res.json({
        success: true,
        message: "Features configured successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to configure features",
      });
    }
  });

  /**
   * Get session statistics
   * GET /api/session/stats/:sessionId
   */
  app.get("/api/session/stats/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const stats = integrationService.getSessionStatistics(sessionId);
      
      res.json({
        success: true,
        statistics: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get session statistics",
      });
    }
  });

  /**
   * Get system statistics
   * GET /api/system/stats
   */
  app.get("/api/system/stats", async (req, res) => {
    try {
      const systemStats = integrationService.getSystemStatistics();
      const imageStats = imageService.getStatistics();
      const audioStats = audioService.getStatistics();
      const moderationStats = moderationService.getStatistics();
      const kbStats = knowledgeBaseService.getStatistics();
      
      res.json({
        success: true,
        statistics: {
          system: systemStats,
          images: imageStats,
          audio: audioStats,
          moderation: moderationStats,
          knowledgeBase: kbStats,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get system statistics",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
