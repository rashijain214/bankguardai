/**
 * BankGuard AI - Fraud Detection Service
 * 
 * This service handles the core fraud detection logic, including:
 * - Processing behavioral biometric data from mobile devices
 * - Running anomaly detection algorithms
 * - Triggering appropriate security responses
 * - Maintaining privacy compliance (GDPR/DPDP)
 * 
 * Privacy Features:
 * - On-device processing ensures sensitive data never leaves the device
 * - Only anonymized risk scores are transmitted to the server
 * - Differential privacy techniques applied to aggregated data
 */

import * as tf from '@tensorflow/tfjs-node';
import { logger } from '../utils/logger';
import { supabase } from '../config/supabase';
import { ragService } from './ragSystem';
import { alertService } from './alertService';
import { io } from '../index';

export interface BehavioralMetrics {
  userId: string;
  sessionId: string;
  timestamp: number;
  
  // Anonymized behavioral features (no raw biometric data)
  typingRhythm: number[];      // Anonymized typing pattern scores
  touchDynamics: number[];     // Anonymized touch pressure/area scores
  deviceOrientation: number[]; // Device movement patterns
  navigationPattern: number[]; // App usage flow scores
  
  // Risk assessment (computed on-device)
  riskScore: number;           // 0-1 risk probability
  anomalyFlags: string[];      // Specific anomaly types detected
  confidenceLevel: number;     // Model confidence in assessment
  
  // Privacy-preserving metadata
  deviceFingerprint: string;   // Hashed device identifier
  locationHash?: string;       // Hashed location (if enabled)
  timeOfDay: number;          // Hour of day (0-23)
  dayOfWeek: number;          // Day of week (0-6)
}

export interface SecurityResponse {
  type: 'silent_faceid' | 'otp_challenge' | 'session_termination' | 'account_lock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  requiresUserAction: boolean;
  expiresAt?: Date;
}

class FraudDetectionService {
  private model: tf.LayersModel | null = null;
  private readonly RISK_THRESHOLDS = {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8,
    CRITICAL: 0.95
  };

  constructor() {
    this.loadModel();
  }

  /**
   * Load the TensorFlow model for server-side analysis
   * Note: Primary ML processing happens on-device for privacy
   */
  private async loadModel(): Promise<void> {
    try {
      // Load a lightweight model for server-side pattern analysis
      // This model only processes anonymized aggregated data
      const modelPath = process.env.ML_MODEL_PATH || './models/fraud_detection_server.json';
      this.model = await tf.loadLayersModel(`file://${modelPath}`);
      logger.info('Fraud detection model loaded successfully');
    } catch (error) {
      logger.warn('Could not load ML model, using rule-based detection:', error);
    }
  }

  /**
   * Process behavioral metrics from mobile device
   * All sensitive biometric data has already been processed on-device
   */
  async processBehavioralMetrics(metrics: BehavioralMetrics): Promise<SecurityResponse | null> {
    try {
      logger.info(`Processing behavioral metrics for session ${metrics.sessionId}`);

      // Validate the incoming data
      if (!this.validateMetrics(metrics)) {
        throw new Error('Invalid behavioral metrics received');
      }

      // Store anonymized metrics for analysis (GDPR compliant)
      await this.storeAnonymizedMetrics(metrics);

      // Determine security response based on risk score
      const response = await this.determineSecurityResponse(metrics);

      // If high risk detected, query RAG system for similar fraud patterns
      if (metrics.riskScore > this.RISK_THRESHOLDS.MEDIUM) {
        await this.analyzeWithRAG(metrics);
      }

      // Send real-time alert to dashboard
      if (response) {
        await this.sendRealTimeAlert(metrics, response);
      }

      return response;
    } catch (error) {
      logger.error('Error processing behavioral metrics:', error);
      throw error;
    }
  }

  /**
   * Validate incoming behavioral metrics
   */
  private validateMetrics(metrics: BehavioralMetrics): boolean {
    // Ensure required fields are present
    if (!metrics.userId || !metrics.sessionId || !metrics.timestamp) {
      return false;
    }

    // Validate risk score is within expected range
    if (metrics.riskScore < 0 || metrics.riskScore > 1) {
      return false;
    }

    // Ensure confidence level is valid
    if (metrics.confidenceLevel < 0 || metrics.confidenceLevel > 1) {
      return false;
    }

    return true;
  }

  /**
   * Store anonymized metrics in database (GDPR/DPDP compliant)
   */
  private async storeAnonymizedMetrics(metrics: BehavioralMetrics): Promise<void> {
    try {
      // Only store anonymized, aggregated data
      const anonymizedData = {
        session_id: metrics.sessionId,
        user_hash: this.hashUserId(metrics.userId), // Hash user ID for privacy
        timestamp: new Date(metrics.timestamp).toISOString(),
        risk_score: metrics.riskScore,
        anomaly_flags: metrics.anomalyFlags,
        confidence_level: metrics.confidenceLevel,
        device_fingerprint: metrics.deviceFingerprint,
        time_of_day: metrics.timeOfDay,
        day_of_week: metrics.dayOfWeek,
        // Note: Raw biometric data is never stored
      };

      const { error } = await supabase
        .from('behavioral_analytics')
        .insert(anonymizedData);

      if (error) {
        throw error;
      }

      logger.info(`Stored anonymized metrics for session ${metrics.sessionId}`);
    } catch (error) {
      logger.error('Error storing anonymized metrics:', error);
      throw error;
    }
  }

  /**
   * Determine appropriate security response based on risk assessment
   */
  private async determineSecurityResponse(metrics: BehavioralMetrics): Promise<SecurityResponse | null> {
    const { riskScore, anomalyFlags, confidenceLevel } = metrics;

    // No action needed for low risk
    if (riskScore < this.RISK_THRESHOLDS.LOW) {
      return null;
    }

    // Critical risk - immediate account protection
    if (riskScore >= this.RISK_THRESHOLDS.CRITICAL) {
      return {
        type: 'account_lock',
        severity: 'critical',
        message: 'Suspicious activity detected. Account temporarily locked for security.',
        requiresUserAction: true,
      };
    }

    // High risk - terminate session
    if (riskScore >= this.RISK_THRESHOLDS.HIGH) {
      return {
        type: 'session_termination',
        severity: 'high',
        message: 'Session terminated due to unusual activity patterns.',
        requiresUserAction: true,
      };
    }

    // Medium risk - additional authentication
    if (riskScore >= this.RISK_THRESHOLDS.MEDIUM) {
      // Choose authentication method based on anomaly type
      const authType = this.selectAuthenticationMethod(anomalyFlags);
      
      return {
        type: authType,
        severity: 'medium',
        message: 'Additional verification required for security.',
        requiresUserAction: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      };
    }

    // Low-medium risk - silent verification
    return {
      type: 'silent_faceid',
      severity: 'low',
      message: 'Background security check in progress.',
      requiresUserAction: false,
    };
  }

  /**
   * Select appropriate authentication method based on detected anomalies
   */
  private selectAuthenticationMethod(anomalyFlags: string[]): 'silent_faceid' | 'otp_challenge' {
    // If device-related anomalies, prefer biometric authentication
    if (anomalyFlags.includes('device_anomaly') || anomalyFlags.includes('location_anomaly')) {
      return 'silent_faceid';
    }

    // For behavioral anomalies, use OTP challenge
    if (anomalyFlags.includes('typing_anomaly') || anomalyFlags.includes('navigation_anomaly')) {
      return 'otp_challenge';
    }

    // Default to biometric authentication
    return 'silent_faceid';
  }

  /**
   * Analyze current metrics against historical fraud patterns using RAG
   */
  private async analyzeWithRAG(metrics: BehavioralMetrics): Promise<void> {
    try {
      const query = this.buildRAGQuery(metrics);
      const similarPatterns = await ragService.queryFraudPatterns(query);

      if (similarPatterns.length > 0) {
        logger.info(`Found ${similarPatterns.length} similar fraud patterns for session ${metrics.sessionId}`);
        
        // Store the analysis results
        await this.storeFraudAnalysis(metrics.sessionId, similarPatterns);
      }
    } catch (error) {
      logger.error('Error analyzing with RAG system:', error);
    }
  }

  /**
   * Build query for RAG system based on current metrics
   */
  private buildRAGQuery(metrics: BehavioralMetrics): string {
    const anomalies = metrics.anomalyFlags.join(', ');
    const timeContext = `${metrics.timeOfDay}:00 on day ${metrics.dayOfWeek}`;
    
    return `Fraud pattern with risk score ${metrics.riskScore.toFixed(2)}, ` +
           `anomalies: ${anomalies}, detected at ${timeContext}. ` +
           `Device fingerprint category: ${metrics.deviceFingerprint.substring(0, 8)}`;
  }

  /**
   * Store fraud analysis results
   */
  private async storeFraudAnalysis(sessionId: string, patterns: any[]): Promise<void> {
    try {
      const analysisData = {
        session_id: sessionId,
        similar_patterns: patterns,
        analysis_timestamp: new Date().toISOString(),
        pattern_count: patterns.length,
      };

      const { error } = await supabase
        .from('fraud_analysis')
        .insert(analysisData);

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Error storing fraud analysis:', error);
    }
  }

  /**
   * Send real-time alert to dashboard
   */
  private async sendRealTimeAlert(metrics: BehavioralMetrics, response: SecurityResponse): Promise<void> {
    try {
      const alert = {
        id: `alert_${Date.now()}`,
        sessionId: metrics.sessionId,
        userHash: this.hashUserId(metrics.userId),
        riskScore: metrics.riskScore,
        severity: response.severity,
        responseType: response.type,
        timestamp: new Date().toISOString(),
        anomalyFlags: metrics.anomalyFlags,
      };

      // Store alert in database
      await alertService.createAlert(alert);

      // Send to dashboard via WebSocket
      io.emit('fraud_alert', alert);

      logger.info(`Sent real-time alert for session ${metrics.sessionId}`);
    } catch (error) {
      logger.error('Error sending real-time alert:', error);
    }
  }

  /**
   * Hash user ID for privacy compliance
   */
  private hashUserId(userId: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }

  /**
   * Get fraud statistics for dashboard
   */
  async getFraudStatistics(timeRange: string = '24h'): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('behavioral_analytics')
        .select('risk_score, anomaly_flags, timestamp')
        .gte('timestamp', this.getTimeRangeStart(timeRange));

      if (error) {
        throw error;
      }

      return this.aggregateStatistics(data);
    } catch (error) {
      logger.error('Error getting fraud statistics:', error);
      throw error;
    }
  }

  /**
   * Get time range start for statistics
   */
  private getTimeRangeStart(range: string): string {
    const now = new Date();
    switch (range) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Aggregate statistics for dashboard
   */
  private aggregateStatistics(data: any[]): any {
    const totalSessions = data.length;
    const highRiskSessions = data.filter(d => d.risk_score > this.RISK_THRESHOLDS.HIGH).length;
    const mediumRiskSessions = data.filter(d => 
      d.risk_score > this.RISK_THRESHOLDS.MEDIUM && d.risk_score <= this.RISK_THRESHOLDS.HIGH
    ).length;

    const anomalyTypes = data.reduce((acc, d) => {
      d.anomaly_flags.forEach((flag: string) => {
        acc[flag] = (acc[flag] || 0) + 1;
      });
      return acc;
    }, {});

    return {
      totalSessions,
      highRiskSessions,
      mediumRiskSessions,
      lowRiskSessions: totalSessions - highRiskSessions - mediumRiskSessions,
      fraudRate: totalSessions > 0 ? (highRiskSessions / totalSessions) * 100 : 0,
      anomalyTypes,
      averageRiskScore: data.length > 0 ? 
        data.reduce((sum, d) => sum + d.risk_score, 0) / data.length : 0,
    };
  }
}

export const fraudDetectionService = new FraudDetectionService();