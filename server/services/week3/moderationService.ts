import { openai } from "../../config/openai.js";
import type { ModerationRequest, ModerationResponse } from "@shared/schema.js";

/**
 * Week 3 - Moderation Service Implementation
 * @description Handles content moderation using OpenAI's Moderation API
 * Provides content safety checks before processing user inputs
 */
export class ModerationService {
  private moderationHistory: Map<string, ModerationResponse[]> = new Map();

  /**
   * Moderate content using OpenAI Moderation API
   * @param request - Moderation request with content to check
   * @returns Promise<ModerationResponse> - Moderation result with safety flags
   */
  async moderateContent(request: ModerationRequest): Promise<ModerationResponse> {
    try {
      // Call OpenAI Moderation API
      const moderation = await openai.moderations.create({
        input: request.content,
      });

      if (!moderation.results || moderation.results.length === 0) {
        throw new Error("No moderation results returned");
      }

      const result = moderation.results[0];

      // Create detailed response object
      const moderationResponse: ModerationResponse = {
        id: this.generateModerationId(),
        content: request.content,
        flagged: result.flagged,
        categories: {
          hate: result.categories.hate || false,
          hateThreatening: result.categories["hate/threatening"] || false,
          harassment: result.categories.harassment || false,
          harassmentThreatening: result.categories["harassment/threatening"] || false,
          selfHarm: result.categories["self-harm"] || false,
          selfHarmIntent: result.categories["self-harm/intent"] || false,
          selfHarmInstructions: result.categories["self-harm/instructions"] || false,
          sexual: result.categories.sexual || false,
          sexualMinors: result.categories["sexual/minors"] || false,
          violence: result.categories.violence || false,
          violenceGraphic: result.categories["violence/graphic"] || false,
        },
        categoryScores: {
          hate: result.category_scores.hate || 0,
          hateThreatening: result.category_scores["hate/threatening"] || 0,
          harassment: result.category_scores.harassment || 0,
          harassmentThreatening: result.category_scores["harassment/threatening"] || 0,
          selfHarm: result.category_scores["self-harm"] || 0,
          selfHarmIntent: result.category_scores["self-harm/intent"] || 0,
          selfHarmInstructions: result.category_scores["self-harm/instructions"] || 0,
          sexual: result.category_scores.sexual || 0,
          sexualMinors: result.category_scores["sexual/minors"] || 0,
          violence: result.category_scores.violence || 0,
          violenceGraphic: result.category_scores["violence/graphic"] || 0,
        },
        timestamp: new Date(),
        sessionId: request.sessionId,
        action: this.determineAction(result.flagged, result.categories) as "allow" | "warn" | "block",
        riskLevel: this.calculateRiskLevel(result.category_scores) as "low" | "medium" | "high",
      };

      // Store in history
      const history = this.moderationHistory.get(request.sessionId) || [];
      history.push(moderationResponse);
      this.moderationHistory.set(request.sessionId, history);

      console.log(`Content moderated: ${moderationResponse.flagged ? "FLAGGED" : "SAFE"} (${moderationResponse.riskLevel} risk)`);

      return moderationResponse;
    } catch (error) {
      console.error("Error moderating content:", error);
      throw new Error(`Content moderation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate safe response for flagged content
   * @param moderationResult - Moderation result indicating why content was flagged
   * @returns string - Appropriate safe response message
   */
  generateSafeResponse(moderationResult: ModerationResponse): string {
    const flaggedCategories = Object.entries(moderationResult.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category, _]) => category);

    if (flaggedCategories.length === 0) {
      return "I apologize, but I couldn't process your request. Please try rephrasing your message.";
    }

    // Generate specific responses based on flagged categories
    if (moderationResult.categories.hate || moderationResult.categories.hateThreatening) {
      return "I can't respond to content that contains hate speech or discriminatory language. Please keep our conversation respectful and inclusive.";
    }

    if (moderationResult.categories.harassment || moderationResult.categories.harassmentThreatening) {
      return "I'm designed to have helpful and respectful conversations. Please avoid content that could be considered harassing or threatening.";
    }

    if (moderationResult.categories.violence || moderationResult.categories.violenceGraphic) {
      return "I cannot engage with content that involves violence or graphic descriptions. Let's focus on constructive and positive topics instead.";
    }

    if (moderationResult.categories.sexual || moderationResult.categories.sexualMinors) {
      return "I'm not able to discuss sexual content. Please keep our conversation appropriate and professional.";
    }

    if (moderationResult.categories.selfHarm || moderationResult.categories.selfHarmIntent || moderationResult.categories.selfHarmInstructions) {
      return "I'm concerned about the content of your message. If you're struggling with difficult thoughts, please consider reaching out to a mental health professional or crisis helpline. I'm here to help with other topics in a positive way.";
    }

    // Generic safe response
    return "I'm not able to respond to that type of content. Please rephrase your message and I'll be happy to help with your question or request.";
  }

  /**
   * Get moderation history for a session
   * @param sessionId - Session identifier
   * @returns Array of moderation results
   */
  getModerationHistory(sessionId: string): ModerationResponse[] {
    return this.moderationHistory.get(sessionId) || [];
  }

  /**
   * Clear moderation history for a session
   * @param sessionId - Session identifier
   */
  clearModerationHistory(sessionId: string): void {
    this.moderationHistory.delete(sessionId);
  }

  /**
   * Get moderation statistics
   * @returns Object with moderation statistics
   */
  getStatistics(): {
    totalChecks: number;
    totalFlagged: number;
    flaggedPercentage: number;
    mostCommonCategory: string;
    totalSessions: number;
  } {
    const allModerations = Array.from(this.moderationHistory.values()).flat();
    const totalChecks = allModerations.length;
    const totalFlagged = allModerations.filter(m => m.flagged).length;
    const flaggedPercentage = totalChecks > 0 ? Math.round((totalFlagged / totalChecks) * 100) : 0;

    // Find most common flagged category
    const categoryCount: Record<string, number> = {};
    allModerations.forEach(moderation => {
      Object.entries(moderation.categories).forEach(([category, flagged]) => {
        if (flagged) {
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      });
    });

    const mostCommonCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "none";

    return {
      totalChecks,
      totalFlagged,
      flaggedPercentage,
      mostCommonCategory,
      totalSessions: this.moderationHistory.size,
    };
  }

  /**
   * Check if content is safe for processing
   * @param content - Content to check
   * @param sessionId - Session identifier
   * @returns Promise<boolean> - True if content is safe, false if flagged
   */
  async isContentSafe(content: string, sessionId: string): Promise<boolean> {
    try {
      const moderationResult = await this.moderateContent({ content, sessionId });
      return !moderationResult.flagged;
    } catch (error) {
      console.error("Error checking content safety:", error);
      // In case of error, be conservative and consider content unsafe
      return false;
    }
  }

  /**
   * Determine appropriate action based on moderation result
   * @private
   * @param flagged - Whether content was flagged
   * @param categories - Flagged categories
   * @returns string - Recommended action
   */
  private determineAction(flagged: boolean, categories: any): string {
    if (!flagged) {
      return "allow";
    }

    // Determine severity based on categories
    const highSeverityCategories = [
      "hate/threatening",
      "harassment/threatening", 
      "self-harm/intent",
      "self-harm/instructions",
      "sexual/minors",
      "violence/graphic"
    ];

    const hasHighSeverity = Object.entries(categories).some(
      ([category, flagged]) => flagged && highSeverityCategories.includes(category)
    );

    return hasHighSeverity ? "block" : "warn";
  }

  /**
   * Calculate overall risk level based on category scores
   * @private
   * @param categoryScores - Moderation category scores
   * @returns string - Risk level (low, medium, high)
   */
  private calculateRiskLevel(categoryScores: any): string {
    const maxScore = Math.max(...Object.values(categoryScores).map(Number));

    if (maxScore < 0.3) return "low";
    if (maxScore < 0.7) return "medium";
    return "high";
  }

  /**
   * Generate unique moderation ID
   * @private
   * @returns string - Unique moderation identifier
   */
  private generateModerationId(): string {
    return `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const moderationService = new ModerationService();
