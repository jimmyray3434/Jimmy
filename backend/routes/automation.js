const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const automationService = require('../services/automationService');

/**
 * @route   GET /api/automation/stats
 * @desc    Get automation statistics for the user
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await automationService.getAutomationStats(req.user.id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching automation stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/automation/system-stats
 * @desc    Get system-wide automation statistics
 * @access  Private/Admin
 */
router.get('/system-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await automationService.getSystemAutomationStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching system automation stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/automation/run-tasks
 * @desc    Manually trigger scheduled tasks
 * @access  Private/Admin
 */
router.post('/run-tasks', protect, authorize('admin'), async (req, res) => {
  try {
    const results = await automationService.runScheduledTasks();
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error running scheduled tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/automation/run-traffic
 * @desc    Manually trigger traffic generation
 * @access  Private
 */
router.post('/run-traffic', protect, async (req, res) => {
  try {
    const results = await automationService.runTrafficGeneration();
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error running traffic generation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/automation/run-lead-nurturing
 * @desc    Manually trigger lead nurturing
 * @access  Private
 */
router.post('/run-lead-nurturing', protect, async (req, res) => {
  try {
    const results = await automationService.runLeadNurturing();
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error running lead nurturing:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/automation/run-payment-processing
 * @desc    Manually trigger payment processing
 * @access  Private
 */
router.post('/run-payment-processing', protect, async (req, res) => {
  try {
    const results = await automationService.runPaymentProcessing();
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error running payment processing:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/automation/run-content-generation
 * @desc    Manually trigger content generation
 * @access  Private
 */
router.post('/run-content-generation', protect, async (req, res) => {
  try {
    const results = await automationService.runContentGeneration();
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error running content generation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

module.exports = router;

