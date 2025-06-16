/**
 * BankGuard AI - Fraud Detection API Routes
 * 
 * This module defines the REST API endpoints for fraud detection functionality.
 * All endpoints are designed with privacy-first principles and GDPR/DPDP compliance.
 * 
 * Endpoints:
 * - POST /analyze - Process behavioral metrics from mobile devices
 * - GET /statistics - Get fraud detection statistics
 * - POST /feedback - Update fraud case outcomes for learning
 * - GET /patterns - Get similar fraud patterns
 */

import express from 'express';
import Joi from 'joi';
import { fraudDetectionService, BehavioralMetrics } from '../services/fraudDetection';
import { ragService } from '../services/ragSystem';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// Validation schemas
const behavioralMetricsSchema = Joi.object({
  userId: Joi.string().required(),
  sessionId: Joi.string().required(),
  timestamp: Joi.number().required(),
  typingRhythm: Joi.array().items(Joi.number()).required(),
  touchDynamics: Joi.array().items(Joi.number()).required(),
  deviceOrientation: Joi.array().items(Joi.number()).required(),
  navigationPattern: Joi.array().items(Joi.number()).required(),
  riskScore: Joi.number().min(0).max(1).required(),
  anomalyFlags: Joi.array().items(Joi.string()).required(),
  confidenceLevel: Joi.number().min(0).max(1).required(),
  deviceFingerprint: Joi.string().required(),
  locationHash: Joi.string().optional(),
  timeOfDay: Joi.number().min(0).max(23).required(),
  dayOfWeek: Joi.number().min(0).max(6).required(),
});

const feedbackSchema = Joi.object({
  caseId: Joi.string().required(),
  outcome: Joi.string().valid('confirmed_fraud', 'false_positive', 'under_investigation').required(),
  effectiveness: Joi.number().min(0).max(1).required(),
  notes: Joi.string().optional(),
});

/**
 * POST /api/fraud/analyze
 * Analyze behavioral metrics from mobile device
 * 
 * This is the main endpoint that receives anonymized behavioral data
 * from mobile devices and returns security response recommendations.
 */
router.post('/analyze', validateRequest(behavioralMetricsSchema), async (req, res) => {
  try {
    const metrics: BehavioralMetrics = req.body;
    
    logger.info(`Received fraud analysis request for session ${metrics.sessionId}`);

    // Process the behavioral metrics
    const securityResponse = await fraudDetectionService.processBehavioralMetrics(metrics);

    // Prepare response
    const response = {
      sessionId: metrics.sessionId,
      riskAssessment: {
        riskScore: metrics.riskScore,
        riskLevel: getRiskLevel(metrics.riskScore),
        confidenceLevel: metrics.confidenceLevel,
        anomaliesDetected: metrics.anomalyFlags,
      },
      securityResponse: securityResponse || {
        type: 'none',
        severity: 'low',
        message: 'No additional security measures required.',
        requiresUserAction: false,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: response,
    });

    logger.info(`Fraud analysis completed for session ${metrics.sessionId}, risk level: ${response.riskAssessment.riskLevel}`);
  } catch (error) {
    logger.error('Error in fraud analysis endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during fraud analysis',
    });
  }
});

/**
 * GET /api/fraud/statistics
 * Get fraud detection statistics for dashboard
 * 
 * Returns aggregated, anonymized statistics about fraud detection
 * performance over specified time periods.
 */
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const timeRange = req.query.range as string || '24h';
    
    // Validate time range
    const validRanges = ['1h', '24h', '7d', '30d'];
    if (!validRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time range. Valid options: 1h, 24h, 7d, 30d',
      });
    }

    const statistics = await fraudDetectionService.getFraudStatistics(timeRange);
    const patternStats = await ragService.getPatternStatistics();

    res.status(200).json({
      success: true,
      data: {
        timeRange,
        fraudDetection: statistics,
        historicalPatterns: patternStats,
        generatedAt: new Date().toISOString(),
      },
    });

    logger.info(`Fraud statistics requested for time range: ${timeRange}`);
  } catch (error) {
    logger.error('Error getting fraud statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching statistics',
    });
  }
});

/**
 * POST /api/fraud/feedback
 * Update fraud case outcome for machine learning
 * 
 * This endpoint allows administrators to provide feedback on fraud
 * detection accuracy, which is used to improve the system over time.
 */
router.post('/feedback', authMiddleware, validateRequest(feedbackSchema), async (req, res) => {
  try {
    const { caseId, outcome, effectiveness, notes } = req.body;

    // Update the fraud case outcome
    await ragService.updateFraudOutcome(caseId, outcome, effectiveness);

    // Log the feedback for audit purposes
    logger.info(`Fraud case feedback received: ${caseId} -> ${outcome} (effectiveness: ${effectiveness})`);

    res.status(200).json({
      success: true,
      message: 'Fraud case feedback recorded successfully',
      data: {
        caseId,
        outcome,
        effectiveness,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error recording fraud feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while recording feedback',
    });
  }
});

/**
 * GET /api/fraud/patterns
 * Get similar fraud patterns for a given query
 * 
 * This endpoint allows querying the RAG system for similar
 * historical fraud patterns based on current anomaly characteristics.
 */
router.get('/patterns', authMiddleware, async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }

    if (limit < 1 || limit > 20) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 20',
      });
    }

    const patterns = await ragService.queryFraudPatterns(query, limit);

    res.status(200).json({
      success: true,
      data: {
        query,
        patterns,
        count: patterns.length,
        generatedAt: new Date().toISOString(),
      },
    });

    logger.info(`Fraud patterns query: "${query}" returned ${patterns.length} results`);
  } catch (error) {
    logger.error('Error querying fraud patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while querying patterns',
    });
  }
});

/**
 * GET /api/fraud/health
 * Health check endpoint for fraud detection service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'fraud-detection',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Helper function to determine risk level from risk score
 */
function getRiskLevel(riskScore: number): string {
  if (riskScore >= 0.95) return 'critical';
  if (riskScore >= 0.8) return 'high';
  if (riskScore >= 0.6) return 'medium';
  if (riskScore >= 0.3) return 'low';
  return 'minimal';
}

export { router as fraudDetectionRoutes };