/**
 * BankGuard AI - RAG (Retrieval-Augmented Generation) System
 * 
 * This service implements a RAG system for analyzing historical fraud patterns
 * when anomalies are detected. It uses vector embeddings to find similar
 * fraud cases and provides context for better decision making.
 * 
 * Features:
 * - Vector similarity search for fraud patterns
 * - Privacy-preserving pattern matching
 * - Historical fraud case analysis
 * - Contextual fraud intelligence
 */

import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { supabase } from '../config/supabase';

export interface FraudPattern {
  id: string;
  description: string;
  riskScore: number;
  anomalyTypes: string[];
  timePattern: string;
  devicePattern: string;
  outcome: 'confirmed_fraud' | 'false_positive' | 'under_investigation';
  similarity: number;
  metadata: {
    detectionDate: string;
    responseType: string;
    effectiveness: number;
  };
}

export interface RAGQuery {
  text: string;
  riskScore: number;
  anomalyFlags: string[];
  timeContext: string;
  deviceContext: string;
}

class RAGService {
  private chromaClient: ChromaClient;
  private openai: OpenAI;
  private collectionName = 'fraud_patterns';
  private collection: any = null;

  constructor() {
    this.chromaClient = new ChromaClient({
      path: process.env.CHROMA_DB_URL || 'http://localhost:8000'
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development'
    });
  }

  /**
   * Initialize the RAG system and create vector database collection
   */
  async initialize(): Promise<void> {
    try {
      // Create or get the fraud patterns collection
      this.collection = await this.chromaClient.getOrCreateCollection({
        name: this.collectionName,
        metadata: { description: 'Historical fraud patterns for similarity search' }
      });

      // Load existing fraud patterns into vector database
      await this.loadHistoricalPatterns();

      logger.info('RAG system initialized successfully');
    } catch (error) {
      logger.error('Error initializing RAG system:', error);
      throw error;
    }
  }

  /**
   * Load historical fraud patterns from database into vector store
   */
  private async loadHistoricalPatterns(): Promise<void> {
    try {
      // Fetch historical fraud cases from database
      const { data: fraudCases, error } = await supabase
        .from('historical_fraud_cases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000); // Load recent cases

      if (error) {
        throw error;
      }

      if (!fraudCases || fraudCases.length === 0) {
        logger.info('No historical fraud cases found, starting with empty collection');
        return;
      }

      // Convert fraud cases to embeddings and store in vector database
      const documents = fraudCases.map(case_ => this.formatFraudCaseForEmbedding(case_));
      const ids = fraudCases.map(case_ => case_.id);
      const metadatas = fraudCases.map(case_ => ({
        riskScore: case_.risk_score,
        anomalyTypes: case_.anomaly_types,
        outcome: case_.outcome,
        detectionDate: case_.created_at,
        responseType: case_.response_type,
        effectiveness: case_.effectiveness_score || 0.5
      }));

      // Generate embeddings for the documents
      const embeddings = await this.generateEmbeddings(documents);

      // Add to vector database
      await this.collection.add({
        ids,
        embeddings,
        documents,
        metadatas
      });

      logger.info(`Loaded ${fraudCases.length} historical fraud patterns into RAG system`);
    } catch (error) {
      logger.error('Error loading historical patterns:', error);
      throw error;
    }
  }

  /**
   * Format fraud case data for embedding generation
   */
  private formatFraudCaseForEmbedding(fraudCase: any): string {
    const anomalies = Array.isArray(fraudCase.anomaly_types) 
      ? fraudCase.anomaly_types.join(', ') 
      : fraudCase.anomaly_types || 'unknown';
    
    return `Fraud case with risk score ${fraudCase.risk_score}, ` +
           `anomalies: ${anomalies}, ` +
           `detected at ${fraudCase.time_context || 'unknown time'}, ` +
           `device pattern: ${fraudCase.device_pattern || 'unknown device'}, ` +
           `outcome: ${fraudCase.outcome}, ` +
           `response: ${fraudCase.response_type}`;
  }

  /**
   * Generate embeddings for text documents
   */
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      // Fallback to dummy embeddings for development
      return texts.map(() => Array(1536).fill(0).map(() => Math.random()));
    }
  }

  /**
   * Query fraud patterns using RAG
   */
  async queryFraudPatterns(query: string, limit: number = 5): Promise<FraudPattern[]> {
    try {
      if (!this.collection) {
        logger.warn('RAG collection not initialized, returning empty results');
        return [];
      }

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbeddings([query]);

      // Search for similar patterns in vector database
      const results = await this.collection.query({
        queryEmbeddings: queryEmbedding,
        nResults: limit,
        include: ['documents', 'metadatas', 'distances']
      });

      // Convert results to FraudPattern objects
      const patterns: FraudPattern[] = [];
      
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const pattern: FraudPattern = {
            id: results.ids[0][i],
            description: results.documents[0][i],
            riskScore: results.metadatas[0][i].riskScore,
            anomalyTypes: results.metadatas[0][i].anomalyTypes,
            timePattern: results.metadatas[0][i].timePattern || 'unknown',
            devicePattern: results.metadatas[0][i].devicePattern || 'unknown',
            outcome: results.metadatas[0][i].outcome,
            similarity: 1 - (results.distances[0][i] || 0), // Convert distance to similarity
            metadata: {
              detectionDate: results.metadatas[0][i].detectionDate,
              responseType: results.metadatas[0][i].responseType,
              effectiveness: results.metadatas[0][i].effectiveness
            }
          };
          patterns.push(pattern);
        }
      }

      logger.info(`Found ${patterns.length} similar fraud patterns for query`);
      return patterns;
    } catch (error) {
      logger.error('Error querying fraud patterns:', error);
      return [];
    }
  }

  /**
   * Add new fraud case to the vector database
   */
  async addFraudCase(fraudCase: any): Promise<void> {
    try {
      if (!this.collection) {
        logger.warn('RAG collection not initialized, cannot add fraud case');
        return;
      }

      const document = this.formatFraudCaseForEmbedding(fraudCase);
      const embedding = await this.generateEmbeddings([document]);
      
      const metadata = {
        riskScore: fraudCase.risk_score,
        anomalyTypes: fraudCase.anomaly_types,
        outcome: fraudCase.outcome,
        detectionDate: fraudCase.created_at,
        responseType: fraudCase.response_type,
        effectiveness: fraudCase.effectiveness_score || 0.5
      };

      await this.collection.add({
        ids: [fraudCase.id],
        embeddings: embedding,
        documents: [document],
        metadatas: [metadata]
      });

      logger.info(`Added new fraud case ${fraudCase.id} to RAG system`);
    } catch (error) {
      logger.error('Error adding fraud case to RAG system:', error);
    }
  }

  /**
   * Generate fraud analysis report using RAG
   */
  async generateFraudAnalysis(
    currentCase: any, 
    similarPatterns: FraudPattern[]
  ): Promise<string> {
    try {
      if (similarPatterns.length === 0) {
        return 'No similar fraud patterns found in historical data.';
      }

      const context = similarPatterns.map(pattern => 
        `Pattern ${pattern.id}: ${pattern.description} (Similarity: ${(pattern.similarity * 100).toFixed(1)}%, Outcome: ${pattern.outcome})`
      ).join('\n');

      const prompt = `
        Analyze the following fraud case based on similar historical patterns:
        
        Current Case:
        - Risk Score: ${currentCase.riskScore}
        - Anomalies: ${currentCase.anomalyFlags.join(', ')}
        - Time Context: ${currentCase.timeContext}
        - Device Context: ${currentCase.deviceContext}
        
        Similar Historical Patterns:
        ${context}
        
        Provide a brief analysis including:
        1. Risk assessment based on historical patterns
        2. Recommended response actions
        3. Confidence level in the assessment
        
        Keep the response concise and actionable.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a fraud detection analyst. Provide concise, actionable fraud analysis based on historical patterns.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || 'Unable to generate analysis.';
    } catch (error) {
      logger.error('Error generating fraud analysis:', error);
      return 'Error generating fraud analysis. Please review manually.';
    }
  }

  /**
   * Update fraud case outcome (for learning)
   */
  async updateFraudOutcome(caseId: string, outcome: string, effectiveness: number): Promise<void> {
    try {
      // Update in database
      const { error } = await supabase
        .from('historical_fraud_cases')
        .update({ 
          outcome, 
          effectiveness_score: effectiveness,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (error) {
        throw error;
      }

      // Update in vector database metadata
      if (this.collection) {
        await this.collection.update({
          ids: [caseId],
          metadatas: [{ outcome, effectiveness }]
        });
      }

      logger.info(`Updated fraud case ${caseId} outcome to ${outcome}`);
    } catch (error) {
      logger.error('Error updating fraud outcome:', error);
    }
  }

  /**
   * Get fraud pattern statistics
   */
  async getPatternStatistics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('historical_fraud_cases')
        .select('outcome, response_type, effectiveness_score')
        .not('outcome', 'is', null);

      if (error) {
        throw error;
      }

      const stats = {
        totalCases: data.length,
        confirmedFraud: data.filter(d => d.outcome === 'confirmed_fraud').length,
        falsePositives: data.filter(d => d.outcome === 'false_positive').length,
        underInvestigation: data.filter(d => d.outcome === 'under_investigation').length,
        averageEffectiveness: data.length > 0 ? 
          data.reduce((sum, d) => sum + (d.effectiveness_score || 0), 0) / data.length : 0,
        responseTypes: data.reduce((acc, d) => {
          acc[d.response_type] = (acc[d.response_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      logger.error('Error getting pattern statistics:', error);
      return null;
    }
  }
}

export const ragService = new RAGService();

/**
 * Initialize RAG system
 */
export async function initializeRAGSystem(): Promise<void> {
  await ragService.initialize();
}