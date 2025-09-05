import { openai, MODELS } from "../../config/openai.js";
import type { AudioTranscriptionRequest, AudioTranscriptionResponse, TextToSpeechRequest, TextToSpeechResponse } from "@shared/schema.js";
import fs from "fs";
import path from "path";

/**
 * Week 3 - Audio Service Implementation
 * @description Handles audio transcription (Speech-to-Text) and text-to-speech synthesis
 * Provides comprehensive audio processing capabilities using OpenAI's Whisper and TTS models
 */
export class AudioService {
  private transcriptionHistory: Map<string, AudioTranscriptionResponse[]> = new Map();
  private ttsHistory: Map<string, TextToSpeechResponse[]> = new Map();

  /**
   * Transcribe audio file to text using Whisper
   * @param request - Audio transcription request with file path and options
   * @returns Promise<AudioTranscriptionResponse> - Transcription result with metadata
   */
  async transcribeAudio(request: AudioTranscriptionRequest): Promise<AudioTranscriptionResponse> {
    try {
      // Validate file exists
      if (!fs.existsSync(request.filePath)) {
        throw new Error(`Audio file not found: ${request.filePath}`);
      }

      // Get file stats and validate
      const fileStats = fs.statSync(request.filePath);
      const filename = path.basename(request.filePath);
      const fileExtension = path.extname(filename).toLowerCase();
      
      console.log(`Transcribing audio file: ${filename}`);
      console.log(`File size: ${fileStats.size} bytes`);
      console.log(`File extension: ${fileExtension}`);
      console.log(`File path: ${request.filePath}`);

      // Validate the file format before sending to OpenAI
      const validation = this.validateAudioFile(filename, fileStats.size);
      if (!validation.isValid) {
        throw new Error(`Invalid audio file: ${validation.issues.join(", ")}`);
      }

      // Create read stream for the audio file
      const audioFile = fs.createReadStream(request.filePath);

      // Call OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: MODELS.AUDIO,
        language: request.language || undefined, // Auto-detect if not specified
        prompt: request.prompt || undefined, // Optional context prompt
        response_format: request.responseFormat || "json",
        temperature: request.temperature || 0,
      });

      if(transcription.text.trim().length === 0) {
        console.error("Transcription resulted in empty text");
        throw new Error("Transcription resulted in empty text");
      }

      // Create response object
      const transcriptionResponse: AudioTranscriptionResponse = {
        id: this.generateTranscriptionId(),
        text: transcription.text,
        language: request.language || "auto-detected",
        duration: (transcription as any).duration || 0,
        filename,
        fileSize: fileStats.size,
        timestamp: new Date(),
        sessionId: request.sessionId,
        confidence: this.estimateConfidence(transcription.text), // Simple confidence estimation
      };

      // Store in history
      const history = this.transcriptionHistory.get(request.sessionId) || [];
      history.push(transcriptionResponse);
      this.transcriptionHistory.set(request.sessionId, history);

      console.log(`Audio transcribed successfully: ${filename} (${transcription.text.length} characters)`);
      console.log(`Transcription text: "${transcription.text.substring(0, 100)}${transcription.text.length > 100 ? '...' : ''}"`);

      return transcriptionResponse;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        filePath: request.filePath,
        fileExists: fs.existsSync(request.filePath),
      });
      throw new Error(`Audio transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Convert text to speech using OpenAI TTS
   * @param request - Text-to-speech request with text and voice options
   * @returns Promise<TextToSpeechResponse> - Generated audio file information
   */
  async textToSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    try {
      // Validate text length
      if (request.text.length > 4096) {
        throw new Error("Text is too long for TTS (maximum 4096 characters)");
      }

      // Call OpenAI TTS API
      const mp3Response = await openai.audio.speech.create({
        model: MODELS.TTS,
        voice: request.voice || "alloy",
        input: request.text,
        response_format: request.responseFormat || "mp3",
        speed: request.speed || 1.0,
      });

      // Create output directory if it doesn't exist
      const outputDir = path.join(process.cwd(), "uploads", "audio");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate unique filename
      const filename = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
      const filepath = path.join(outputDir, filename);

      // Convert response to buffer and save
      const arrayBuffer = await mp3Response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filepath, buffer);

      // Create response object
      const ttsResponse: TextToSpeechResponse = {
        id: this.generateTTSId(),
        text: request.text,
        voice: request.voice || "alloy",
        speed: request.speed || 1.0,
        responseFormat: request.responseFormat || "mp3",
        filename,
        filepath,
        fileSize: buffer.length,
        timestamp: new Date(),
        sessionId: request.sessionId,
        duration: this.estimateAudioDuration(request.text, request.speed || 1.0),
      };

      // Store in history
      const history = this.ttsHistory.get(request.sessionId) || [];
      history.push(ttsResponse);
      this.ttsHistory.set(request.sessionId, history);

      console.log(`Text-to-speech generated: ${filename} (${request.text.length} characters)`);

      return ttsResponse;
    } catch (error) {
      console.error("Error generating speech:", error);
      throw new Error(`Text-to-speech generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Process uploaded audio file and save to uploads directory
   * @param fileBuffer - Audio file buffer
   * @param originalFilename - Original filename
   * @param sessionId - Session identifier
   * @returns Promise<string> - Saved file path
   */
  async saveUploadedAudio(fileBuffer: Buffer, originalFilename: string, sessionId: string): Promise<string> {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), "uploads", "audio");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate safe filename
      const timestamp = Date.now();
      const safeFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `upload_${timestamp}_${safeFilename}`;
      const filepath = path.join(uploadsDir, filename);

      // Save file
      fs.writeFileSync(filepath, fileBuffer);

      console.log(`Audio file saved: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error("Error saving audio file:", error);
      throw new Error(`Audio file save failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get transcription history for a session
   * @param sessionId - Session identifier
   * @returns Array of transcription results
   */
  getTranscriptionHistory(sessionId: string): AudioTranscriptionResponse[] {
    return this.transcriptionHistory.get(sessionId) || [];
  }

  /**
   * Remove a specific transcription from history
   * @param sessionId - Session identifier
   * @param transcriptionId - Transcription identifier
   * @returns boolean - Success status
   */
  removeTranscription(sessionId: string, transcriptionId: string): boolean {
    const history = this.transcriptionHistory.get(sessionId) || [];
    const initialLength = history.length;
    
    const filteredHistory = history.filter(t => t.id !== transcriptionId);
    
    if (filteredHistory.length < initialLength) {
      this.transcriptionHistory.set(sessionId, filteredHistory);
      console.log(`Transcription removed: ${transcriptionId} from session ${sessionId}`);
      return true;
    }
    
    return false;
  }

  /**
   * Get TTS history for a session
   * @param sessionId - Session identifier
   * @returns Array of TTS results
   */
  getTTSHistory(sessionId: string): TextToSpeechResponse[] {
    return this.ttsHistory.get(sessionId) || [];
  }

  /**
   * Clear audio histories for a session
   * @param sessionId - Session identifier
   */
  clearAudioHistory(sessionId: string): void {
    this.transcriptionHistory.delete(sessionId);
    this.ttsHistory.delete(sessionId);
  }

  /**
   * Get audio processing statistics
   * @returns Object with audio processing statistics
   */
  getStatistics(): {
    totalTranscriptions: number;
    totalTTSGenerations: number;
    totalSessions: number;
    averageTranscriptLength: number;
  } {
    const allTranscriptions = Array.from(this.transcriptionHistory.values()).flat();
    const allTTS = Array.from(this.ttsHistory.values()).flat();
    const totalSessions = new Set([
      ...this.transcriptionHistory.keys(),
      ...this.ttsHistory.keys(),
    ]).size;

    const averageTranscriptLength = allTranscriptions.length > 0
      ? Math.round(allTranscriptions.reduce((sum, t) => sum + t.text.length, 0) / allTranscriptions.length)
      : 0;

    return {
      totalTranscriptions: allTranscriptions.length,
      totalTTSGenerations: allTTS.length,
      totalSessions,
      averageTranscriptLength,
    };
  }

  /**
   * Validate audio file format and size
   * @param filename - Audio filename
   * @param fileSize - File size in bytes
   * @returns Object with validation result
   */
  validateAudioFile(filename: string, fileSize: number): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const maxSize = 25 * 1024 * 1024; // 25MB limit per OpenAI docs
    
    // Supported formats according to OpenAI Whisper documentation
    const supportedFormats = [".flac", ".m4a", ".mp3", ".mp4", ".mpeg", ".mpga", ".oga", ".ogg", ".wav", ".webm"];

    // Check file size
    if (fileSize > maxSize) {
      issues.push(`File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds maximum of 25MB`);
    }

    if (fileSize === 0) {
      issues.push("File is empty");
    }

    // Check file format
    const extension = path.extname(filename).toLowerCase();
    if (!extension) {
      issues.push("File has no extension");
    } else if (!supportedFormats.includes(extension)) {
      issues.push(`File format ${extension} is not supported. Supported formats: ${supportedFormats.join(", ")}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Estimate transcription confidence based on text characteristics
   * @private
   * @param text - Transcribed text
   * @returns number - Confidence score (0-1)
   */
  private estimateConfidence(text: string): number {
    // Simple heuristic-based confidence estimation
    let confidence = 0.8; // Base confidence

    // Penalize very short texts
    if (text.length < 10) confidence -= 0.2;

    // Penalize texts with many special characters or numbers
    const specialCharRatio = (text.match(/[^a-zA-Z\s]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) confidence -= 0.1;

    // Boost confidence for proper sentence structure
    if (text.includes(".") || text.includes("?") || text.includes("!")) {
      confidence += 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Estimate audio duration based on text length and speech rate
   * @private
   * @param text - Text to be spoken
   * @param speed - Speech speed multiplier
   * @returns number - Estimated duration in seconds
   */
  private estimateAudioDuration(text: string, speed: number): number {
    // Average speaking rate is about 150 words per minute
    const wordsPerMinute = 150 * speed;
    const wordCount = text.split(/\s+/).length;
    return Math.round((wordCount / wordsPerMinute) * 60);
  }

  /**
   * Generate unique transcription ID
   * @private
   * @returns string - Unique transcription identifier
   */
  private generateTranscriptionId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique TTS ID
   * @private
   * @returns string - Unique TTS identifier
   */
  private generateTTSId(): string {
    return `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const audioService = new AudioService();
