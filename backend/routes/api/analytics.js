const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const Analytics = require('../models/Analytics');
const analyticsService = require('../../services/analyticsService');

// @route   GET api/analytics
// @desc    Get analytics for a date range
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate dates
    let start, end;
    
    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid start date' });
      }
    } else {
      // Default to 30 days ago
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }
    
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid end date' });
      }
    } else {
      // Default to today
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }
    
    const result = await analyticsService.getAnalyticsForDateRange(req.user.id, start, end);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({
      success: true,
      count: result.analytics.length,
      data: result.analytics
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET api/analytics/latest
// @desc    Get latest analytics
// @access  Private
router.get('/latest', protect, async (req, res) => {
  try {
    // Get latest analytics
    const analytics = await Analytics.findOne({ user: req.user.id })
      .sort({ date: -1 });
    
    if (!analytics) {
      return res.status(404).json({ success: false, error: 'No analytics found' });
    }
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET api/analytics/revenue
// @desc    Get revenue breakdown
// @access  Private
router.get('/revenue', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate dates
    let start, end;
    
    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid start date' });
      }
    } else {
      // Default to 30 days ago
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }
    
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid end date' });
      }
    } else {
      // Default to today
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }
    
    const result = await analyticsService.getRevenueBreakdown(req.user.id, start, end);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/analytics/generate
// @desc    Generate daily analytics
// @access  Private
router.post('/generate', protect, async (req, res) => {
  try {
    const result = await analyticsService.generateDailyAnalytics(req.user.id);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({
      success: true,
      data: result.analytics
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/analytics/generate-test-data
// @desc    Generate test analytics data
// @access  Private
router.post('/generate-test-data', protect, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    
    // Limit days to 90
    const daysToGenerate = Math.min(days, 90);
    
    const result = await analyticsService.generateRandomAnalyticsData(req.user.id, daysToGenerate);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({
      success: true,
      count: result.count,
      message: `Generated ${result.count} days of test analytics data`
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

