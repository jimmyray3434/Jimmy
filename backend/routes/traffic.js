const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const trafficService = require('../services/trafficService');
const TrafficCampaign = require('../models/TrafficCampaign');
const SocialAccount = require('../models/SocialAccount');

/**
 * @route   GET /api/traffic/campaigns
 * @desc    Get user's traffic campaigns
 * @access  Private
 */
router.get('/campaigns', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status
    };
    
    const campaigns = await trafficService.getUserCampaigns(req.user.id, options);
    
    res.json({
      success: true,
      data: campaigns.data,
      pagination: campaigns.pagination
    });
  } catch (error) {
    console.error('Error fetching traffic campaigns:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/traffic/campaigns/:id
 * @desc    Get traffic campaign by ID
 * @access  Private
 */
router.get('/campaigns/:id', protect, async (req, res) => {
  try {
    const campaign = await trafficService.getCampaign(req.params.id);
    
    // Check if campaign belongs to user
    if (campaign.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this campaign'
      });
    }
    
    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error fetching traffic campaign:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/traffic/generate/:contentId
 * @desc    Generate traffic for specific content
 * @access  Private
 */
router.post('/generate/:contentId', protect, async (req, res) => {
  try {
    const { contentId } = req.params;
    
    const result = await trafficService.generateTrafficForContent(contentId);
    
    res.json({
      success: true,
      data: result,
      message: 'Traffic generation initiated successfully'
    });
  } catch (error) {
    console.error('Error generating traffic:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   PUT /api/traffic/campaigns/:id
 * @desc    Update traffic campaign
 * @access  Private
 */
router.put('/campaigns/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate updates
    const allowedUpdates = ['status', 'channels', 'targetAudience', 'keywords'];
    const updateKeys = Object.keys(updates);
    
    const isValidOperation = updateKeys.every(key => allowedUpdates.includes(key));
    
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        error: 'Invalid updates'
      });
    }
    
    const campaign = await trafficService.updateCampaign(id, updates, req.user.id);
    
    res.json({
      success: true,
      data: campaign,
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(error.message.includes('not found') ? 404 : 
               error.message.includes('Not authorized') ? 403 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/traffic/social-accounts
 * @desc    Get user's social accounts
 * @access  Private
 */
router.get('/social-accounts', protect, async (req, res) => {
  try {
    const accounts = await SocialAccount.find({ user: req.user.id });
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/traffic/social-accounts
 * @desc    Add or update social account
 * @access  Private
 */
router.post('/social-accounts', protect, async (req, res) => {
  try {
    const { platform, username, profileUrl, tokenInfo } = req.body;
    
    if (!platform || !username) {
      return res.status(400).json({
        success: false,
        error: 'Platform and username are required'
      });
    }
    
    // Check if platform is valid
    if (!['facebook', 'twitter', 'linkedin', 'instagram', 'pinterest', 'medium'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform'
      });
    }
    
    // Create or update social account
    const account = await SocialAccount.findOneAndUpdate(
      { user: req.user.id, platform },
      {
        user: req.user.id,
        platform,
        username,
        profileUrl,
        isConnected: true,
        lastConnected: new Date(),
        status: 'active',
        ...(tokenInfo && { tokenInfo })
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      data: account,
      message: `${platform} account added successfully`
    });
  } catch (error) {
    console.error('Error adding social account:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   PUT /api/traffic/social-accounts/:platform
 * @desc    Update social account settings
 * @access  Private
 */
router.put('/social-accounts/:platform', protect, async (req, res) => {
  try {
    const { platform } = req.params;
    const updates = req.body;
    
    // Check if platform is valid
    if (!['facebook', 'twitter', 'linkedin', 'instagram', 'pinterest', 'medium'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform'
      });
    }
    
    // Find account
    const account = await SocialAccount.findOne({ user: req.user.id, platform });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: `No ${platform} account found`
      });
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'username', 'profileUrl', 'autoPostingEnabled', 
      'postingFrequency', 'customPostingSchedule', 'status'
    ];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        account[field] = updates[field];
      }
    });
    
    await account.save();
    
    res.json({
      success: true,
      data: account,
      message: `${platform} account updated successfully`
    });
  } catch (error) {
    console.error('Error updating social account:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   DELETE /api/traffic/social-accounts/:platform
 * @desc    Disconnect social account
 * @access  Private
 */
router.delete('/social-accounts/:platform', protect, async (req, res) => {
  try {
    const { platform } = req.params;
    
    // Check if platform is valid
    if (!['facebook', 'twitter', 'linkedin', 'instagram', 'pinterest', 'medium'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform'
      });
    }
    
    // Update account to disconnected
    const account = await SocialAccount.findOneAndUpdate(
      { user: req.user.id, platform },
      {
        isConnected: false,
        status: 'disabled',
        statusMessage: 'Disconnected by user'
      },
      { new: true }
    );
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: `No ${platform} account found`
      });
    }
    
    res.json({
      success: true,
      data: account,
      message: `${platform} account disconnected successfully`
    });
  } catch (error) {
    console.error('Error disconnecting social account:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/traffic/stats
 * @desc    Get traffic statistics
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    // Get all user's campaigns
    const campaigns = await TrafficCampaign.find({ user: req.user.id });
    
    // Calculate total traffic, clicks, and conversions
    let totalTraffic = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    
    campaigns.forEach(campaign => {
      totalTraffic += campaign.performance.totalTraffic || 0;
      totalClicks += campaign.performance.totalClicks || 0;
      totalConversions += campaign.performance.totalConversions || 0;
    });
    
    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    
    // Get traffic by channel
    const trafficByChannel = {
      social: 0,
      seo: 0,
      email: 0,
      backlinks: 0
    };
    
    campaigns.forEach(campaign => {
      campaign.results.forEach(result => {
        result.channels.forEach(channel => {
          if (trafficByChannel[channel] !== undefined) {
            trafficByChannel[channel] += result.metrics.estimatedTraffic || 0;
          }
        });
      });
    });
    
    // Get active campaigns count
    const activeCampaigns = campaigns.filter(campaign => campaign.status === 'active').length;
    
    res.json({
      success: true,
      data: {
        totalTraffic,
        totalClicks,
        totalConversions,
        conversionRate,
        trafficByChannel,
        activeCampaigns,
        totalCampaigns: campaigns.length
      }
    });
  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;

