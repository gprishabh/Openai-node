import { openai, MODELS } from "../../config/openai.js";
import type { DocumentEmbedding, EmbeddingRequest } from "@shared/schema.js";

/**
 * Week 2 - Embedding Service Implementation
 * @description Handles text embedding generation using OpenAI's text-embedding-3-small model
 * Provides cosine similarity search functionality for document retrieval
 */
export class EmbeddingService {
  /**
   * Generate embeddings for a text document
   * @param request - Document text and metadata for embedding generation
   * @returns Promise<DocumentEmbedding> - Generated embedding with metadata
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<DocumentEmbedding> {
    try {
      // Call OpenAI Embeddings API
      const response = await openai.embeddings.create({
        model: MODELS.EMBEDDING,
        input: request.text,
        encoding_format: "float",
      });

      const embedding = response.data[0].embedding;

      // Create document embedding object
      const documentEmbedding: DocumentEmbedding = {
        id: this.generateEmbeddingId(),
        text: request.text,
        embedding,
        metadata: {
          filename: request.filename || "unknown",
          source: request.source || "text_input",
          chunkIndex: request.chunkIndex || 0,
          timestamp: new Date(),
          tokenCount: response.usage?.total_tokens || 0,
        },
      };

      return documentEmbedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate embeddings for multiple text chunks
   * @param texts - Array of text strings to embed
   * @param metadata - Common metadata for all chunks
   * @returns Promise<DocumentEmbedding[]> - Array of generated embeddings
   */
  async generateMultipleEmbeddings(
    texts: string[], 
    metadata: { filename?: string; source?: string }
  ): Promise<DocumentEmbedding[]> {
    try {
      const embeddings: DocumentEmbedding[] = [];

      // Process texts in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map((text, index) => 
          this.generateEmbedding({
            text,
            filename: metadata.filename,
            source: metadata.source,
            chunkIndex: i + index,
          })
        );

        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);

        // Small delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return embeddings;
    } catch (error) {
      console.error("Error generating multiple embeddings:", error);
      throw new Error(`Batch embedding generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate query embedding for similarity search
   * @param query - Search query text
   * @returns Promise<number[]> - Query embedding vector
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: MODELS.EMBEDDING,
        input: query,
        encoding_format: "float",
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating query embedding:", error);
      throw new Error(`Query embedding generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param vectorA - First embedding vector
   * @param vectorB - Second embedding vector
   * @returns number - Cosine similarity score (-1 to 1)
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error("Vectors must have the same length for cosine similarity calculation");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Find most similar documents using cosine similarity
   * @param queryEmbedding - Query embedding vector
   * @param documentEmbeddings - Array of document embeddings to search
   * @param topK - Number of top results to return (default: 5)
   * @returns Array of documents with similarity scores, sorted by relevance
   */
  findSimilarDocuments(
    queryEmbedding: number[],
    documentEmbeddings: DocumentEmbedding[],
    topK: number = 5
  ): Array<DocumentEmbedding & { similarity: number }> {
    // Calculate similarity scores for all documents
    const documentsWithScores = documentEmbeddings.map(doc => ({
      ...doc,
      similarity: this.calculateCosineSimilarity(queryEmbedding, doc.embedding),
    }));

    // Sort by similarity score (descending) and return top K
    return documentsWithScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Split text into chunks for embedding
   * @param text - Input text to split
   * @param maxChunkSize - Maximum characters per chunk (default: 1000)
   * @param overlapSize - Character overlap between chunks (default: 100)
   * @returns string[] - Array of text chunks
   */
  splitTextIntoChunks(
    text: string, 
    maxChunkSize: number = 1000, 
    overlapSize: number = 100
  ): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = "";
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      
      // If adding this sentence would exceed chunk size, save current chunk
      if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap from previous chunk
        const words = currentChunk.split(" ");
        const overlapWords = words.slice(-Math.floor(overlapSize / 5)); // Approximate word count for overlap
        currentChunk = overlapWords.join(" ") + " " + trimmedSentence;
      } else {
        currentChunk += (currentChunk ? " " : "") + trimmedSentence;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Generate unique embedding ID
   * @private
   * @returns string - Unique embedding identifier
   */
  private generateEmbeddingId(): string {
    return `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const embeddingService = new EmbeddingService();
