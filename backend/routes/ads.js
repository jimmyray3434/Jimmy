const express = require('express');
const { auth, requireActiveSubscription } = require('../middleware/auth');

const router = express.Router();

// Apply auth and subscription check to all routes
router.use(auth);
router.use(requireActiveSubscription);

// @route   GET /api/ads
// @desc    Get all ads for the authenticated user
// @access  Private
router.get('/', async (req, res) => {
  try {
    // TODO: Implement ads listing
    res.json({
      success: true,
      message: 'Ads listing endpoint - Coming soon!',
      ads: []
    });

  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/ads
// @desc    Create a new ad
// @access  Private
router.post('/', async (req, res) => {
  try {
    // TODO: Implement ad creation
    res.json({
      success: true,
      message: 'Ad creation endpoint - Coming soon!'
    });

  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

