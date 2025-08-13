const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

/**
 * @route   POST /api/ai/generate-ad-copy
 * @desc    Generate ad copy based on product/service details
 * @access  Private
 */
router.post('/generate-ad-copy', [
  auth,
  body('productName').notEmpty().withMessage('Product name is required'),
  body('productDescription').notEmpty().withMessage('Product description is required'),
  body('targetAudience').notEmpty().withMessage('Target audience is required'),
  body('tone').optional(),
  body('keyFeatures').optional().isArray(),
  body('callToAction').optional(),
  body('maxLength').optional().isInt({ min: 50, max: 1000 }),
  body('provider').optional().isIn(['openai', 'google'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await aiService.generateAdCopy(req.body);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Generate ad copy error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate ad copy'
    });
  }
});

/**
 * @route   POST /api/ai/analyze-ad-performance
 * @desc    Analyze ad performance and provide optimization suggestions
 * @access  Private
 */
router.post('/analyze-ad-performance', [
  auth,
  body('adId').notEmpty().withMessage('Ad ID is required'),
  body('impressions').isInt({ min: 0 }).withMessage('Valid impressions count is required'),
  body('clicks').isInt({ min: 0 }).withMessage('Valid clicks count is required'),
  body('conversions').isInt({ min: 0 }).withMessage('Valid conversions count is required'),
  body('spend').isFloat({ min: 0 }).withMessage('Valid spend amount is required'),
  body('targetAudience').notEmpty().withMessage('Target audience is required'),
  body('adContent').notEmpty().withMessage('Ad content is required'),
  body('provider').optional().isIn(['openai', 'google'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await aiService.analyzeAdPerformance(req.body);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Analyze ad performance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze ad performance'
    });
  }
});

/**
 * @route   POST /api/ai/audience-recommendations
 * @desc    Generate audience targeting recommendations
 * @access  Private
 */
router.post('/audience-recommendations', [
  auth,
  body('businessType').notEmpty().withMessage('Business type is required'),
  body('productCategory').notEmpty().withMessage('Product category is required'),
  body('campaignGoals').notEmpty().withMessage('Campaign goals are required'),
  body('currentAudience').optional(),
  body('pastPerformanceData').optional(),
  body('provider').optional().isIn(['openai', 'google'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await aiService.generateAudienceRecommendations(req.body);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Audience recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate audience recommendations'
    });
  }
});

/**
 * @route   POST /api/ai/optimize-budget
 * @desc    Optimize ad budget allocation
 * @access  Private
 */
router.post('/optimize-budget', [
  auth,
  body('totalBudget').isFloat({ min: 0 }).withMessage('Valid total budget is required'),
  body('campaigns').isArray().withMessage('Campaigns data is required'),
  body('campaignGoals').notEmpty().withMessage('Campaign goals are required'),
  body('provider').optional().isIn(['openai', 'google'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await aiService.optimizeBudgetAllocation(req.body);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Budget optimization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to optimize budget allocation'
    });
  }
});

/**
 * @route   POST /api/ai/content-ideas
 * @desc    Generate content ideas for ad campaigns
 * @access  Private
 */
router.post('/content-ideas', [
  auth,
  body('businessType').notEmpty().withMessage('Business type is required'),
  body('productCategory').notEmpty().withMessage('Product category is required'),
  body('targetAudience').notEmpty().withMessage('Target audience is required'),
  body('campaignGoals').notEmpty().withMessage('Campaign goals are required'),
  body('contentType').optional().isIn(['all', 'image', 'video', 'text']),
  body('provider').optional().isIn(['openai', 'google'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await aiService.generateContentIdeas(req.body);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Content ideas generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate content ideas'
    });
  }
});

/**
 * @route   POST /api/ai/predict-performance
 * @desc    Predict ad performance based on historical data and proposed changes
 * @access  Private
 */
router.post('/predict-performance', [
  auth,
  body('historicalData').isArray().withMessage('Historical data is required'),
  body('proposedChanges').notEmpty().withMessage('Proposed changes are required'),
  body('provider').optional().isIn(['openai', 'google'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const result = await aiService.predictAdPerformance(req.body);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Performance prediction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to predict ad performance'
    });
  }
});

module.exports = router;

