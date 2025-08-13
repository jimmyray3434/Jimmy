const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, requireActiveSubscription } = require('../middleware/auth');
const Ad = require('../models/Ad');

const router = express.Router();

// Apply auth and subscription check to all routes
router.use(auth);
router.use(requireActiveSubscription);

// @route   GET /api/ads
// @desc    Get all ads for the authenticated user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const ads = await Ad.find({ user: req.user.userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: ads.length,
      ads
    });

  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/ads/:id
// @desc    Get ad by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const ad = await Ad.findOne({ 
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }
    
    res.json({
      success: true,
      ad
    });

  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/ads
// @desc    Create a new ad
// @access  Private
router.post('/', [
  body('title').trim().isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('budget.amount').isNumeric().withMessage('Budget amount must be a number')
    .custom(value => value >= 1).withMessage('Budget amount must be at least 1'),
  body('schedule.startDate').optional().isISO8601().withMessage('Start date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const newAd = new Ad({
      user: req.user.userId,
      title: req.body.title,
      description: req.body.description,
      targetAudience: req.body.targetAudience || {},
      budget: req.body.budget,
      schedule: req.body.schedule || { startDate: new Date() },
      creativeAssets: req.body.creativeAssets || {}
    });

    await newAd.save();

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      ad: newAd
    });

  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/ads/:id
// @desc    Update an ad
// @access  Private
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('budget.amount').optional().isNumeric().withMessage('Budget amount must be a number')
    .custom(value => value >= 1).withMessage('Budget amount must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const ad = await Ad.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Update fields
    if (req.body.title) ad.title = req.body.title;
    if (req.body.description) ad.description = req.body.description;
    if (req.body.targetAudience) ad.targetAudience = req.body.targetAudience;
    if (req.body.budget) ad.budget = { ...ad.budget, ...req.body.budget };
    if (req.body.schedule) ad.schedule = { ...ad.schedule, ...req.body.schedule };
    if (req.body.creativeAssets) ad.creativeAssets = { ...ad.creativeAssets, ...req.body.creativeAssets };

    await ad.save();

    res.json({
      success: true,
      message: 'Ad updated successfully',
      ad
    });

  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/ads/:id
// @desc    Delete an ad
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const ad = await Ad.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });

  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
