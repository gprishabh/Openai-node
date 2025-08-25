import { openai, MODELS } from "../../config/openai.js";
import type { ImageGenerationRequest, ImageGenerationResponse } from "@shared/schema.js";
import fs from "fs";
import path from "path";

/**
 * Week 3 - Image Service Implementation
 * @description Handles image generation using DALL-E 3 model
 * Provides image creation, download, and management functionality
 */
export class ImageService {
  private imageHistory: Map<string, ImageGenerationResponse[]> = new Map();

  /**
   * Generate image from text prompt using DALL-E 3
   * @param request - Image generation request with prompt and options
   * @returns Promise<ImageGenerationResponse> - Generated image data and metadata
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      // Call OpenAI DALL-E API
      const response = await openai.images.generate({
        model: MODELS.IMAGE,
        prompt: request.prompt,
        n: 1, // DALL-E 3 only supports n=1
        size: request.size || "1024x1024",
        quality: request.quality || "standard",
        style: request.style || "vivid",
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("No image was generated");
      }

      const imageData = response.data[0];
      
      // Create response object
      const imageResponse: ImageGenerationResponse = {
        id: this.generateImageId(),
        url: imageData.url!,
        prompt: request.prompt,
        revisedPrompt: imageData.revised_prompt || request.prompt,
        size: request.size || "1024x1024",
        quality: request.quality || "standard",
        style: request.style || "vivid",
        timestamp: new Date(),
        sessionId: request.sessionId,
      };

      // Store in history
      const history = this.imageHistory.get(request.sessionId) || [];
      history.push(imageResponse);
      this.imageHistory.set(request.sessionId, history);

      console.log(`Image generated: ${imageResponse.id} for session ${request.sessionId}`);

      return imageResponse;
    } catch (error) {
      console.error("Error generating image:", error);
      
      // Handle specific OpenAI API errors
      if (error instanceof Error) {
        if (error.message.includes("content_policy_violation")) {
          throw new Error("Image generation failed: The prompt violates OpenAI's content policy. Please try a different prompt.");
        } else if (error.message.includes("rate_limit_exceeded")) {
          throw new Error("Image generation failed: Rate limit exceeded. Please try again in a few minutes.");
        }
      }
      
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Download and save image locally
   * @param imageUrl - URL of the image to download
   * @param filename - Optional custom filename
   * @returns Promise<string> - Local file path
   */
  async downloadImage(imageUrl: string, filename?: string): Promise<string> {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), "uploads", "images");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate filename if not provided
      const imageFilename = filename || `generated_${Date.now()}.png`;
      const filepath = path.join(uploadsDir, imageFilename);

      // Download image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Save to file
      fs.writeFileSync(filepath, buffer);

      console.log(`Image downloaded to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error("Error downloading image:", error);
      throw new Error(`Image download failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get image generation history for a session
   * @param sessionId - Session identifier
   * @returns Array of generated images for the session
   */
  getImageHistory(sessionId: string): ImageGenerationResponse[] {
    return this.imageHistory.get(sessionId) || [];
  }

  /**
   * Clear image history for a session
   * @param sessionId - Session identifier
   */
  clearImageHistory(sessionId: string): void {
    this.imageHistory.delete(sessionId);
  }

  /**
   * Get all image generation statistics
   * @returns Object with image generation statistics
   */
  getStatistics(): {
    totalImagesGenerated: number;
    totalSessions: number;
    averageImagesPerSession: number;
  } {
    const totalSessions = this.imageHistory.size;
    const totalImages = Array.from(this.imageHistory.values()).reduce(
      (sum, images) => sum + images.length,
      0
    );

    return {
      totalImagesGenerated: totalImages,
      totalSessions,
      averageImagesPerSession: totalSessions > 0 ? Math.round(totalImages / totalSessions) : 0,
    };
  }

  /**
   * Validate image generation prompt
   * @param prompt - Text prompt to validate
   * @returns Object with validation result and suggestions
   */
  validatePrompt(prompt: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check prompt length
    if (prompt.length < 10) {
      issues.push("Prompt is too short");
      suggestions.push("Add more descriptive details to your prompt");
    }

    if (prompt.length > 1000) {
      issues.push("Prompt is too long");
      suggestions.push("Shorten your prompt to under 1000 characters");
    }

    // Check for potentially problematic content
    const problematicWords = ["nsfw", "explicit", "violence", "gore", "hate"];
    const foundProblematic = problematicWords.filter(word => 
      prompt.toLowerCase().includes(word)
    );

    if (foundProblematic.length > 0) {
      issues.push("Prompt may contain inappropriate content");
      suggestions.push("Remove potentially inappropriate terms and try again");
    }

    // Provide general suggestions for better prompts
    if (!prompt.includes("detailed") && !prompt.includes("high quality")) {
      suggestions.push("Consider adding 'detailed' or 'high quality' for better results");
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * Generate enhanced prompt with style suggestions
   * @param userPrompt - Original user prompt
   * @param style - Desired artistic style
   * @returns Enhanced prompt with style modifiers
   */
  enhancePrompt(userPrompt: string, style: "realistic" | "artistic" | "cartoon" | "photographic" = "realistic"): string {
    const styleModifiers = {
      realistic: "photorealistic, high detail, professional photography",
      artistic: "artistic, creative, stylized, beautiful composition",
      cartoon: "cartoon style, animated, colorful, fun",
      photographic: "professional photography, studio lighting, high resolution",
    };

    const qualityModifiers = "high quality, detailed, well-composed";
    
    return `${userPrompt}, ${styleModifiers[style]}, ${qualityModifiers}`;
  }

  /**
   * Generate unique image ID
   * @private
   * @returns string - Unique image identifier
   */
  private generateImageId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const imageService = new ImageService();
