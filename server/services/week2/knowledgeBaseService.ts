import { embeddingService } from "./embeddingService.js";
import { chatService } from "../week1/chatService.js";
import { openai, MODELS, SYSTEM_PROMPTS } from "../../config/openai.js";
import type { DocumentEmbedding, KnowledgeBaseQuery, KnowledgeBaseResponse } from "@shared/schema.js";
import fs from "fs";
import path from "path";

/**
 * Week 2 - Knowledge Base Service Implementation
 * @description Manages document storage, embedding generation, and retrieval-augmented generation (RAG)
 * Implements the complete flow: document upload → embedding → similarity search → context-aware responses
 */
export class KnowledgeBaseService {
  private documents: Map<string, DocumentEmbedding[]> = new Map();
  private documentMetadata: Map<string, { filename: string; uploadDate: Date; chunkCount: number }> = new Map();

  /**
   * Process and store a document in the knowledge base
   * @param filename - Name of the document file
   * @param content - Text content of the document
   * @returns Promise<{ documentId: string; chunkCount: number; tokenCount: number }> - Processing results
   */
  async addDocument(filename: string, content: string): Promise<{ documentId: string; chunkCount: number; tokenCount: number }> {
    try {
      // Generate unique document ID
      const documentId = this.generateDocumentId(filename);

      // Split document into chunks for better embedding quality
      const chunks = embeddingService.splitTextIntoChunks(content, 800, 80);
      
      // Generate embeddings for all chunks
      const embeddings = await embeddingService.generateMultipleEmbeddings(chunks, {
        filename,
        source: "document_upload",
      });

      // Store embeddings
      this.documents.set(documentId, embeddings);
      
      // Store metadata
      this.documentMetadata.set(documentId, {
        filename,
        uploadDate: new Date(),
        chunkCount: chunks.length,
      });

      // Calculate total token usage
      const totalTokens = embeddings.reduce((sum, emb) => sum + (emb.metadata.tokenCount || 0), 0);

      console.log(`Document processed: ${filename} (${chunks.length} chunks, ${totalTokens} tokens)`);

      return {
        documentId,
        chunkCount: chunks.length,
        tokenCount: totalTokens,
      };
    } catch (error) {
      console.error("Error adding document to knowledge base:", error);
      throw new Error(`Document processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Search knowledge base and generate context-aware response
   * @param query - Knowledge base query with search parameters
   * @returns Promise<KnowledgeBaseResponse> - Response with context and sources
   */
  async query(query: KnowledgeBaseQuery): Promise<KnowledgeBaseResponse> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateQueryEmbedding(query.question);

      // Get all document embeddings
      const allEmbeddings: DocumentEmbedding[] = [];
      for (const docEmbeddings of this.documents.values()) {
        allEmbeddings.push(...docEmbeddings);
      }

      if (allEmbeddings.length === 0) {
        return {
          answer: "I don't have any documents in my knowledge base yet. Please upload some documents first, and then I'll be able to answer questions based on their content.",
          sources: [],
          confidence: 0,
          hasContext: false,
        };
      }

      // Find most relevant documents
      const similarDocuments = embeddingService.findSimilarDocuments(
        queryEmbedding,
        allEmbeddings,
        query.maxResults || 3
      );

      // Filter by minimum similarity threshold
      const minSimilarity = query.minSimilarity || 0.7;
      const relevantDocuments = similarDocuments.filter(doc => doc.similarity >= minSimilarity);

      if (relevantDocuments.length === 0) {
        return {
          answer: "I couldn't find any relevant information in my knowledge base for your question. The documents I have don't seem to contain information related to your query.",
          sources: [],
          confidence: 0,
          hasContext: false,
        };
      }

      // Prepare context from relevant documents
      const context = relevantDocuments
        .map((doc, index) => `[Source ${index + 1}]: ${doc.text}`)
        .join("\n\n");

      // Generate response using retrieved context
      const response = await openai.chat.completions.create({
        model: MODELS.CHAT,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS.KNOWLEDGE_BASE,
          },
          {
            role: "user",
            content: `Context from knowledge base:\n${context}\n\nQuestion: ${query.question}\n\nPlease answer the question based on the provided context. If the context doesn't contain enough information to answer the question completely, say so clearly.`,
          },
        ],
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: 1500,
      });

      const answer = response.choices[0].message.content || "I apologize, but I couldn't generate a response based on the available context.";

      // Prepare source information
      const sources = relevantDocuments.map(doc => ({
        filename: doc.metadata.filename,
        similarity: doc.similarity,
        snippet: doc.text.substring(0, 200) + (doc.text.length > 200 ? "..." : ""),
      }));

      // Calculate confidence based on similarity scores
      const avgSimilarity = relevantDocuments.reduce((sum, doc) => sum + doc.similarity, 0) / relevantDocuments.length;
      const confidence = Math.round(avgSimilarity * 100) / 100;

      return {
        answer,
        sources,
        confidence,
        hasContext: true,
        tokenUsage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error("Error querying knowledge base:", error);
      throw new Error(`Knowledge base query failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get list of all documents in knowledge base
   * @returns Array of document metadata
   */
  getDocumentList(): Array<{ id: string; filename: string; uploadDate: Date; chunkCount: number }> {
    const documentList: Array<{ id: string; filename: string; uploadDate: Date; chunkCount: number }> = [];
    
    for (const [documentId, metadata] of this.documentMetadata.entries()) {
      documentList.push({
        id: documentId,
        ...metadata,
      });
    }

    return documentList.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
  }

  /**
   * Remove document from knowledge base
   * @param documentId - ID of document to remove
   * @returns boolean - Success status
   */
  removeDocument(documentId: string): boolean {
    const documentExists = this.documents.has(documentId);
    if (documentExists) {
      this.documents.delete(documentId);
      this.documentMetadata.delete(documentId);
      console.log(`Document removed: ${documentId}`);
    }
    return documentExists;
  }

  /**
   * Load sample FAQ document for demonstration
   * @returns Promise<void>
   */
  async loadSampleDocuments(): Promise<void> {
    try {
      const faqPath = path.join(process.cwd(), "docs", "faq.txt");
      
      if (fs.existsSync(faqPath)) {
        const faqContent = fs.readFileSync(faqPath, "utf-8");
        await this.addDocument("faq.txt", faqContent);
        console.log("Sample FAQ document loaded successfully");
      } else {
        console.log("FAQ file not found, skipping sample document load");
      }
    } catch (error) {
      console.error("Error loading sample documents:", error);
    }
  }

  /**
   * Get knowledge base statistics
   * @returns Object with statistics about the knowledge base
   */
  getStatistics(): {
    documentCount: number;
    totalChunks: number;
    averageChunksPerDocument: number;
  } {
    const documentCount = this.documents.size;
    const totalChunks = Array.from(this.documents.values()).reduce(
      (sum, embeddings) => sum + embeddings.length,
      0
    );

    return {
      documentCount,
      totalChunks,
      averageChunksPerDocument: documentCount > 0 ? Math.round(totalChunks / documentCount) : 0,
    };
  }

  /**
   * Generate unique document ID
   * @private
   * @param filename - Original filename
   * @returns string - Unique document identifier
   */
  private generateDocumentId(filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `doc_${timestamp}_${cleanFilename}_${random}`;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
