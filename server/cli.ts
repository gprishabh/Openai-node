import readline from "readline";
import { chatService } from "./services/week1/chatService.js";
import { knowledgeBaseService } from "./services/week2/knowledgeBaseService.js";
import { imageService } from "./services/week3/imageService.js";
import { audioService } from "./services/week3/audioService.js";
import { moderationService } from "./services/week3/moderationService.js";
import { integrationService } from "./services/week4/integrationService.js";
import fs from "fs";
import path from "path";

/**
 * CLI Interface for OpenAI Node.js POC
 * @description Provides a command-line interface for testing all POC features
 * Includes interactive commands for Week 1-4 functionality
 */

class OpenAICLI {
  private rl: readline.Interface;
  private sessionId: string;
  private isRunning: boolean = false;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "AI Assistant> ",
    });

    this.sessionId = `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setupEventHandlers();
  }

  /**
   * Setup readline event handlers
   * @private
   */
  private setupEventHandlers(): void {
    this.rl.on("line", async (input) => {
      await this.handleInput(input.trim());
      if (this.isRunning) {
        this.rl.prompt();
      }
    });

    this.rl.on("close", () => {
      console.log("\n👋 Goodbye! Thanks for using the OpenAI POC CLI.");
      process.exit(0);
    });

    // Handle Ctrl+C gracefully
    this.rl.on("SIGINT", () => {
      console.log("\n\nUse 'exit' or 'quit' to close the CLI properly.");
      this.rl.prompt();
    });
  }

  /**
   * Start the CLI interface
   */
  async start(): Promise<void> {
    this.isRunning = true;
    
    console.log("🤖 OpenAI Node.js POC - CLI Interface");
    console.log("=====================================");
    console.log("Welcome to your AI Personal Assistant POC!");
    console.log(`Session ID: ${this.sessionId}\n`);
    
    // Initialize chat session
    await this.initializeSession();
    
    // Show help
    this.showHelp();
    
    console.log("\nType your message or use commands below:");
    this.rl.prompt();
  }

  /**
   * Initialize chat session with welcome message
   * @private
   */
  private async initializeSession(): Promise<void> {
    try {
      const welcomeMessage = await chatService.initializeChat(this.sessionId);
      console.log(`🤖 ${welcomeMessage.content}\n`);
    } catch (error) {
      console.error("❌ Failed to initialize session:", error);
    }
  }

  /**
   * Handle user input and route to appropriate handlers
   * @private
   * @param input - User input string
   */
  private async handleInput(input: string): Promise<void> {
    if (!input) {
      return;
    }

    // Handle commands
    if (input.startsWith("/")) {
      await this.handleCommand(input);
      return;
    }

    // Handle regular chat
    await this.handleChat(input);
  }

  /**
   * Handle slash commands
   * @private
   * @param command - Command string starting with /
   */
  private async handleCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.slice(1).split(" ");

    switch (cmd.toLowerCase()) {
      case "help":
      case "h":
        this.showHelp();
        break;

      case "features":
      case "f":
        this.showFeatures();
        break;

      case "enable":
        await this.enableFeature(args[0]);
        break;

      case "disable":
        await this.disableFeature(args[0]);
        break;

      case "upload":
        await this.uploadDocument(args[0]);
        break;

      case "image":
      case "img":
        await this.generateImage(args.join(" "));
        break;

      case "transcribe":
        await this.transcribeAudio(args[0]);
        break;

      case "tts":
        await this.textToSpeech(args.join(" "));
        break;

      case "moderate":
        await this.moderateContent(args.join(" "));
        break;

      case "history":
        await this.showHistory();
        break;

      case "stats":
        await this.showStatistics();
        break;

      case "clear":
        await this.clearHistory();
        break;

      case "session":
        console.log(`📋 Current Session ID: ${this.sessionId}`);
        break;

      case "exit":
      case "quit":
      case "q":
        this.isRunning = false;
        this.rl.close();
        break;

      default:
        console.log(`❌ Unknown command: ${cmd}. Type /help for available commands.`);
    }
  }

  /**
   * Handle regular chat messages
   * @private
   * @param message - Chat message
   */
  private async handleChat(message: string): Promise<void> {
    try {
      console.log("🤔 Thinking...");
      
      // Use integrated service for comprehensive processing
      const response = await integrationService.processRequest({
        message,
        sessionId: this.sessionId,
      });

      if (response.chat) {
        console.log(`🤖 ${response.chat.content}`);
      }

      if (response.image) {
        console.log(`🖼️  Image generated: ${response.image.url}`);
        console.log(`   Prompt: ${response.image.prompt}`);
      }

      if (response.knowledgeBase) {
        console.log(`📚 Knowledge Base Response (Confidence: ${response.knowledgeBase.confidence})`);
        if (response.knowledgeBase.sources.length > 0) {
          console.log("   Sources:");
          response.knowledgeBase.sources.forEach((source, idx) => {
            console.log(`   ${idx + 1}. ${source.filename} (${Math.round(source.similarity * 100)}% match)`);
          });
        }
      }

      if (response.moderation?.flagged) {
        console.log(`🚨 Content flagged by moderation: ${response.moderation.action}`);
      }

      if (response.audio) {
        console.log(`🔊 Audio generated: ${response.audio.filename}`);
      }

    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Show help information
   * @private
   */
  private showHelp(): void {
    console.log("\n📖 Available Commands:");
    console.log("====================");
    console.log("/help, /h          - Show this help message");
    console.log("/features, /f      - Show current feature status");
    console.log("/enable <feature>  - Enable a feature (chat, kb, image, audio, tts, moderation)");
    console.log("/disable <feature> - Disable a feature");
    console.log("/upload <file>     - Upload document to knowledge base");
    console.log("/image <prompt>    - Generate image from prompt");
    console.log("/transcribe <file> - Transcribe audio file");
    console.log("/tts <text>        - Convert text to speech");
    console.log("/moderate <text>   - Check content moderation");
    console.log("/history           - Show chat history");
    console.log("/stats             - Show session statistics");
    console.log("/clear             - Clear chat history");
    console.log("/session           - Show current session ID");
    console.log("/exit, /quit, /q   - Exit the CLI");
    console.log("\nOr just type a message to chat!");
  }

  /**
   * Show current feature status
   * @private
   */
  private showFeatures(): void {
    const features = integrationService.getSessionFeatures(this.sessionId);
    
    console.log("\n⚙️  Feature Status:");
    console.log("==================");
    console.log(`Chat:              ${features.chat ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`Knowledge Base:    ${features.knowledgeBase ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`Image Generation:  ${features.imageGeneration ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`Audio Input:       ${features.audioInput ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`Text-to-Speech:    ${features.textToSpeech ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`Moderation:        ${features.moderation ? "✅ Enabled" : "❌ Disabled"}`);
  }

  /**
   * Enable a feature
   * @private
   * @param featureName - Name of feature to enable
   */
  private async enableFeature(featureName: string): Promise<void> {
    if (!featureName) {
      console.log("❌ Please specify a feature name. Available: chat, kb, image, audio, tts, moderation");
      return;
    }

    const features = integrationService.getSessionFeatures(this.sessionId);
    const featureMap: Record<string, keyof typeof features> = {
      chat: "chat",
      kb: "knowledgeBase",
      knowledge: "knowledgeBase",
      image: "imageGeneration",
      img: "imageGeneration",
      audio: "audioInput",
      tts: "textToSpeech",
      speech: "textToSpeech",
      moderation: "moderation",
      mod: "moderation",
    };

    const feature = featureMap[featureName.toLowerCase()];
    if (!feature) {
      console.log("❌ Unknown feature. Available: chat, kb, image, audio, tts, moderation");
      return;
    }

    features[feature] = true;
    integrationService.configureSessionFeatures(this.sessionId, features);
    console.log(`✅ ${feature} enabled`);
  }

  /**
   * Disable a feature
   * @private
   * @param featureName - Name of feature to disable
   */
  private async disableFeature(featureName: string): Promise<void> {
    if (!featureName) {
      console.log("❌ Please specify a feature name. Available: chat, kb, image, audio, tts, moderation");
      return;
    }

    const features = integrationService.getSessionFeatures(this.sessionId);
    const featureMap: Record<string, keyof typeof features> = {
      chat: "chat",
      kb: "knowledgeBase",
      knowledge: "knowledgeBase",
      image: "imageGeneration",
      img: "imageGeneration",
      audio: "audioInput",
      tts: "textToSpeech",
      speech: "textToSpeech",
      moderation: "moderation",
      mod: "moderation",
    };

    const feature = featureMap[featureName.toLowerCase()];
    if (!feature) {
      console.log("❌ Unknown feature. Available: chat, kb, image, audio, tts, moderation");
      return;
    }

    features[feature] = false;
    integrationService.configureSessionFeatures(this.sessionId, features);
    console.log(`❌ ${feature} disabled`);
  }

  /**
   * Upload document to knowledge base
   * @private
   * @param filePath - Path to document file
   */
  private async uploadDocument(filePath: string): Promise<void> {
    if (!filePath) {
      console.log("❌ Please provide a file path. Usage: /upload <file-path>");
      return;
    }

    try {
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const filename = path.basename(filePath);
      
      console.log("📄 Uploading document...");
      const result = await knowledgeBaseService.addDocument(filename, content);
      
      console.log(`✅ Document uploaded successfully!`);
      console.log(`   Document ID: ${result.documentId}`);
      console.log(`   Chunks: ${result.chunkCount}`);
      console.log(`   Tokens: ${result.tokenCount}`);
    } catch (error) {
      console.error("❌ Upload failed:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Generate image from prompt
   * @private
   * @param prompt - Image generation prompt
   */
  private async generateImage(prompt: string): Promise<void> {
    if (!prompt) {
      console.log("❌ Please provide an image prompt. Usage: /image <prompt>");
      return;
    }

    try {
      console.log("🎨 Generating image...");
      const result = await imageService.generateImage({
        prompt,
        sessionId: this.sessionId,
      });
      
      console.log(`✅ Image generated successfully!`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Original prompt: ${result.prompt}`);
      console.log(`   Revised prompt: ${result.revisedPrompt}`);
    } catch (error) {
      console.error("❌ Image generation failed:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Transcribe audio file
   * @private
   * @param filePath - Path to audio file
   */
  private async transcribeAudio(filePath: string): Promise<void> {
    if (!filePath) {
      console.log("❌ Please provide an audio file path. Usage: /transcribe <file-path>");
      return;
    }

    try {
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
      }

      console.log("🎤 Transcribing audio...");
      const result = await audioService.transcribeAudio({
        filePath,
        sessionId: this.sessionId,
      });
      
      console.log(`✅ Audio transcribed successfully!`);
      console.log(`   Text: "${result.text}"`);
      console.log(`   Duration: ${result.duration}s`);
      console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
    } catch (error) {
      console.error("❌ Transcription failed:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Convert text to speech
   * @private
   * @param text - Text to convert to speech
   */
  private async textToSpeech(text: string): Promise<void> {
    if (!text) {
      console.log("❌ Please provide text to convert. Usage: /tts <text>");
      return;
    }

    try {
      console.log("🔊 Generating speech...");
      const result = await audioService.textToSpeech({
        text,
        sessionId: this.sessionId,
      });
      
      console.log(`✅ Speech generated successfully!`);
      console.log(`   File: ${result.filename}`);
      console.log(`   Duration: ~${result.duration}s`);
      console.log(`   Voice: ${result.voice}`);
    } catch (error) {
      console.error("❌ Speech generation failed:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Moderate content
   * @private
   * @param content - Content to moderate
   */
  private async moderateContent(content: string): Promise<void> {
    if (!content) {
      console.log("❌ Please provide content to moderate. Usage: /moderate <text>");
      return;
    }

    try {
      console.log("🛡️  Checking content...");
      const result = await moderationService.moderateContent({
        content,
        sessionId: this.sessionId,
      });
      
      console.log(`${result.flagged ? "🚨" : "✅"} Moderation Result:`);
      console.log(`   Flagged: ${result.flagged ? "Yes" : "No"}`);
      console.log(`   Risk Level: ${result.riskLevel}`);
      console.log(`   Action: ${result.action}`);
      
      if (result.flagged) {
        const flaggedCategories = Object.entries(result.categories)
          .filter(([_, flagged]) => flagged)
          .map(([category, _]) => category);
        console.log(`   Flagged Categories: ${flaggedCategories.join(", ")}`);
      }
    } catch (error) {
      console.error("❌ Moderation failed:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Show chat history
   * @private
   */
  private async showHistory(): Promise<void> {
    try {
      const history = chatService.getChatHistory(this.sessionId);
      
      if (history.length === 0) {
        console.log("📝 No chat history found for this session.");
        return;
      }

      console.log("\n📝 Chat History:");
      console.log("================");
      
      history.forEach((message, index) => {
        const timestamp = message.timestamp.toLocaleTimeString();
        const icon = message.role === "user" ? "👤" : "🤖";
        console.log(`${index + 1}. [${timestamp}] ${icon} ${message.role}:`);
        console.log(`   ${message.content}\n`);
      });
    } catch (error) {
      console.error("❌ Failed to get history:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Show session statistics
   * @private
   */
  private async showStatistics(): Promise<void> {
    try {
      const stats = integrationService.getSessionStatistics(this.sessionId);
      
      console.log("\n📊 Session Statistics:");
      console.log("=====================");
      console.log(`Messages: ${stats.messagesCount}`);
      console.log(`Images Generated: ${stats.imagesGenerated}`);
      console.log(`Audio Transcriptions: ${stats.audioTranscriptions}`);
      console.log(`Knowledge Base Queries: ${stats.knowledgeBaseQueries}`);
      console.log(`Moderation Checks: ${stats.moderationChecks}`);
      console.log(`Moderation Blocked: ${stats.moderationBlocked}`);
      console.log(`Session Duration: ${Math.round(stats.sessionDuration / 1000)}s`);
      console.log(`Start Time: ${stats.startTime.toLocaleString()}`);
      console.log(`Last Activity: ${stats.lastActivity.toLocaleString()}`);
    } catch (error) {
      console.error("❌ Failed to get statistics:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Clear chat history
   * @private
   */
  private async clearHistory(): Promise<void> {
    try {
      chatService.clearChatHistory(this.sessionId);
      console.log("🗑️  Chat history cleared.");
    } catch (error) {
      console.error("❌ Failed to clear history:", error instanceof Error ? error.message : "Unknown error");
    }
  }
}

/**
 * Main CLI entry point
 * @description Starts the OpenAI POC CLI interface
 */
async function main(): Promise<void> {
  try {
    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ Error: OPENAI_API_KEY environment variable is required.");
      console.log("Please set your OpenAI API key in the .env file.");
      process.exit(1);
    }

    const cli = new OpenAICLI();
    await cli.start();
  } catch (error) {
    console.error("❌ Failed to start CLI:", error);
    process.exit(1);
  }
}

// Export for potential use as module
export { OpenAICLI };

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
