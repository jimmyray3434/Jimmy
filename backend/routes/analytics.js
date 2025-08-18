const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Content = require('../models/Content');
const TrafficCampaign = require('../models/TrafficCampaign');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics
 * @access  Private
 */
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get date range
    const { period = 'month' } = req.query;
    const startDate = getStartDateForPeriod(period);
    
    // Get content metrics
    const contentMetrics = await getContentMetrics(req.user.id, startDate);
    
    // Get traffic metrics
    const trafficMetrics = await getTrafficMetrics(req.user.id, startDate);
    
    // Get lead metrics
    const leadMetrics = await getLeadMetrics(req.user.id, startDate);
    
    // Get revenue metrics
    const revenueMetrics = await getRevenueMetrics(req.user.id, startDate);
    
    res.json({
      success: true,
      data: {
        content: contentMetrics,
        traffic: trafficMetrics,
        leads: leadMetrics,
        revenue: revenueMetrics
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/analytics/content
 * @desc    Get content analytics
 * @access  Private
 */
router.get('/content', protect, async (req, res) => {
  try {
    // Get date range
    const { period = 'month' } = req.query;
    const startDate = getStartDateForPeriod(period);
    
    // Get content metrics
    const contentMetrics = await getContentMetrics(req.user.id, startDate);
    
    // Get content performance by type
    const performanceByType = await Content.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(req.user.id),
          status: 'published'
        } 
      },
      { 
        $group: {
          _id: '$type',
          views: { $sum: '$performance.views' },
          clicks: { $sum: '$performance.clicks' },
          conversions: { $sum: '$performance.conversions' },
          revenue: { $sum: '$performance.revenue' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          views: 1,
          clicks: 1,
          conversions: 1,
          revenue: 1,
          count: 1,
          viewsPerContent: { $divide: ['$views', '$count'] },
          clicksPerContent: { $divide: ['$clicks', '$count'] },
          conversionRate: { 
            $cond: [
              { $eq: ['$clicks', 0] },
              0,
              { $multiply: [{ $divide: ['$conversions', '$clicks'] }, 100] }
            ]
          },
          _id: 0
        }
      }
    ]);
    
    // Get top performing content
    const topContent = await Content.find({
      user: req.user.id,
      status: 'published'
    })
    .sort({ 'performance.views': -1 })
    .limit(10)
    .select('title type performance publishedAt');
    
    res.json({
      success: true,
      data: {
        summary: contentMetrics,
        performanceByType,
        topContent
      }
    });
  } catch (error) {
    console.error('Error fetching content analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/analytics/traffic
 * @desc    Get traffic analytics
 * @access  Private
 */
router.get('/traffic', protect, async (req, res) => {
  try {
    // Get date range
    const { period = 'month' } = req.query;
    const startDate = getStartDateForPeriod(period);
    
    // Get traffic metrics
    const trafficMetrics = await getTrafficMetrics(req.user.id, startDate);
    
    // Get traffic by channel
    const trafficByChannel = await TrafficCampaign.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(req.user.id),
          'results.date': { $gte: startDate }
        } 
      },
      { $unwind: '$results' },
      { $match: { 'results.date': { $gte: startDate } } },
      { $unwind: '$results.channels' },
      { 
        $group: {
          _id: '$results.channels',
          estimatedTraffic: { $sum: '$results.metrics.estimatedTraffic' },
          estimatedClicks: { $sum: '$results.metrics.estimatedClicks' },
          estimatedConversions: { $sum: '$results.metrics.estimatedConversions' },
          actualTraffic: { $sum: '$results.metrics.actualTraffic' },
          actualClicks: { $sum: '$results.metrics.actualClicks' },
          actualConversions: { $sum: '$results.metrics.actualConversions' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          channel: '$_id',
          estimatedTraffic: 1,
          estimatedClicks: 1,
          estimatedConversions: 1,
          actualTraffic: 1,
          actualClicks: 1,
          actualConversions: 1,
          count: 1,
          _id: 0
        }
      }
    ]);
    
    // Get top performing campaigns
    const topCampaigns = await TrafficCampaign.find({
      user: req.user.id,
      status: 'active'
    })
    .sort({ 'performance.totalTraffic': -1 })
    .limit(10)
    .select('title contentType performance');
    
    res.json({
      success: true,
      data: {
        summary: trafficMetrics,
        trafficByChannel,
        topCampaigns
      }
    });
  } catch (error) {
    console.error('Error fetching traffic analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/analytics/leads
 * @desc    Get lead analytics
 * @access  Private
 */
router.get('/leads', protect, async (req, res) => {
  try {
    // Get date range
    const { period = 'month' } = req.query;
    const startDate = getStartDateForPeriod(period);
    
    // Get lead metrics
    const leadMetrics = await getLeadMetrics(req.user.id, startDate);
    
    // Get leads by source
    const leadsBySource = await Lead.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(req.user.id),
          createdAt: { $gte: startDate }
        } 
      },
      { 
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          qualified: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] 
            } 
          },
          converted: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] 
            } 
          }
        }
      },
      {
        $project: {
          source: '$_id',
          count: 1,
          qualified: 1,
          converted: 1,
          qualificationRate: { 
            $multiply: [
              { $divide: ['$qualified', { $max: ['$count', 1] }] }, 
              100
            ] 
          },
          conversionRate: { 
            $multiply: [
              { $divide: ['$converted', { $max: ['$count', 1] }] }, 
              100
            ] 
          },
          _id: 0
        }
      }
    ]);
    
    // Get lead conversion timeline
    const leadConversionTimeline = await Lead.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(req.user.id),
          status: 'converted',
          createdAt: { $gte: startDate },
          convertedAt: { $exists: true }
        } 
      },
      {
        $project: {
          conversionTime: { 
            $divide: [
              { $subtract: ['$convertedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageConversionTime: { $avg: '$conversionTime' },
          minConversionTime: { $min: '$conversionTime' },
          maxConversionTime: { $max: '$conversionTime' }
        }
      },
      {
        $project: {
          averageConversionTime: 1,
          minConversionTime: 1,
          maxConversionTime: 1,
          _id: 0
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: leadMetrics,
        leadsBySource,
        conversionTimeline: leadConversionTimeline[0] || {
          averageConversionTime: 0,
          minConversionTime: 0,
          maxConversionTime: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching lead analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Private
 */
router.get('/revenue', protect, async (req, res) => {
  try {
    // Get date range
    const { period = 'month' } = req.query;
    const startDate = getStartDateForPeriod(period);
    
    // Get revenue metrics
    const revenueMetrics = await getRevenueMetrics(req.user.id, startDate);
    
    // Get revenue by source
    const revenueBySource = await Transaction.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(req.user.id),
          type: 'revenue',
          status: 'completed',
          createdAt: { $gte: startDate }
        } 
      },
      { 
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          source: '$_id',
          total: 1,
          count: 1,
          averageAmount: { $divide: ['$total', '$count'] },
          _id: 0
        }
      }
    ]);
    
    // Get revenue timeline
    const revenueTimeline = await Transaction.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(req.user.id),
          type: 'revenue',
          status: 'completed',
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: period === 'day' ? '%Y-%m-%d-%H' : '%Y-%m-%d', 
              date: '$createdAt' 
            }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          date: '$_id',
          total: 1,
          count: 1,
          _id: 0
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: revenueMetrics,
        revenueBySource,
        revenueTimeline
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * Get content metrics
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date for metrics
 * @returns {Promise<Object>} Content metrics
 */
async function getContentMetrics(userId, startDate) {
  // Get content counts
  const totalContent = await Content.countDocuments({ user: userId });
  const publishedContent = await Content.countDocuments({ user: userId, status: 'published' });
  const draftContent = await Content.countDocuments({ user: userId, status: 'draft' });
  const archivedContent = await Content.countDocuments({ user: userId, status: 'archived' });
  
  // Get content created in period
  const newContent = await Content.countDocuments({ 
    user: userId,
    createdAt: { $gte: startDate }
  });
  
  // Get content published in period
  const newlyPublishedContent = await Content.countDocuments({ 
    user: userId,
    status: 'published',
    publishedAt: { $gte: startDate }
  });
  
  // Get total performance metrics
  const performanceMetrics = await Content.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { 
      $group: {
        _id: null,
        totalViews: { $sum: '$performance.views' },
        totalClicks: { $sum: '$performance.clicks' },
        totalConversions: { $sum: '$performance.conversions' },
        totalRevenue: { $sum: '$performance.revenue' }
      }
    },
    {
      $project: {
        totalViews: 1,
        totalClicks: 1,
        totalConversions: 1,
        totalRevenue: 1,
        clickThroughRate: { 
          $cond: [
            { $eq: ['$totalViews', 0] },
            0,
            { $multiply: [{ $divide: ['$totalClicks', '$totalViews'] }, 100] }
          ]
        },
        conversionRate: { 
          $cond: [
            { $eq: ['$totalClicks', 0] },
            0,
            { $multiply: [{ $divide: ['$totalConversions', '$totalClicks'] }, 100] }
          ]
        },
        _id: 0
      }
    }
  ]);
  
  return {
    totalContent,
    publishedContent,
    draftContent,
    archivedContent,
    newContent,
    newlyPublishedContent,
    performance: performanceMetrics[0] || {
      totalViews: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      clickThroughRate: 0,
      conversionRate: 0
    }
  };
}

/**
 * Get traffic metrics
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date for metrics
 * @returns {Promise<Object>} Traffic metrics
 */
async function getTrafficMetrics(userId, startDate) {
  // Get campaign counts
  const totalCampaigns = await TrafficCampaign.countDocuments({ user: userId });
  const activeCampaigns = await TrafficCampaign.countDocuments({ user: userId, status: 'active' });
  const pausedCampaigns = await TrafficCampaign.countDocuments({ user: userId, status: 'paused' });
  const completedCampaigns = await TrafficCampaign.countDocuments({ user: userId, status: 'completed' });
  
  // Get campaigns created in period
  const newCampaigns = await TrafficCampaign.countDocuments({ 
    user: userId,
    createdAt: { $gte: startDate }
  });
  
  // Get campaigns run in period
  const campaignsRunInPeriod = await TrafficCampaign.countDocuments({ 
    user: userId,
    lastRun: { $gte: startDate }
  });
  
  // Get total performance metrics
  const performanceMetrics = await TrafficCampaign.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { 
      $group: {
        _id: null,
        totalTraffic: { $sum: '$performance.totalTraffic' },
        totalClicks: { $sum: '$performance.totalClicks' },
        totalConversions: { $sum: '$performance.totalConversions' }
      }
    },
    {
      $project: {
        totalTraffic: 1,
        totalClicks: 1,
        totalConversions: 1,
        clickThroughRate: { 
          $cond: [
            { $eq: ['$totalTraffic', 0] },
            0,
            { $multiply: [{ $divide: ['$totalClicks', '$totalTraffic'] }, 100] }
          ]
        },
        conversionRate: { 
          $cond: [
            { $eq: ['$totalClicks', 0] },
            0,
            { $multiply: [{ $divide: ['$totalConversions', '$totalClicks'] }, 100] }
          ]
        },
        _id: 0
      }
    }
  ]);
  
  return {
    totalCampaigns,
    activeCampaigns,
    pausedCampaigns,
    completedCampaigns,
    newCampaigns,
    campaignsRunInPeriod,
    performance: performanceMetrics[0] || {
      totalTraffic: 0,
      totalClicks: 0,
      totalConversions: 0,
      clickThroughRate: 0,
      conversionRate: 0
    }
  };
}

/**
 * Get lead metrics
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date for metrics
 * @returns {Promise<Object>} Lead metrics
 */
async function getLeadMetrics(userId, startDate) {
  // Get lead counts
  const totalLeads = await Lead.countDocuments({ user: userId });
  const newLeads = await Lead.countDocuments({ user: userId, status: 'new' });
  const qualifiedLeads = await Lead.countDocuments({ user: userId, status: 'qualified' });
  const disqualifiedLeads = await Lead.countDocuments({ user: userId, status: 'disqualified' });
  const convertedLeads = await Lead.countDocuments({ user: userId, status: 'converted' });
  
  // Get leads created in period
  const leadsCreatedInPeriod = await Lead.countDocuments({ 
    user: userId,
    createdAt: { $gte: startDate }
  });
  
  // Get leads converted in period
  const leadsConvertedInPeriod = await Lead.countDocuments({ 
    user: userId,
    status: 'converted',
    convertedAt: { $gte: startDate }
  });
  
  // Get conversion rate
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  
  // Get qualification rate
  const qualificationRate = totalLeads > 0 ? ((qualifiedLeads + convertedLeads) / totalLeads) * 100 : 0;
  
  // Get contacts count
  const totalContacts = await Contact.countDocuments({ user: userId });
  const activeContacts = await Contact.countDocuments({ user: userId, status: 'active' });
  const customerContacts = await Contact.countDocuments({ user: userId, status: 'customer' });
  
  // Get contacts created in period
  const contactsCreatedInPeriod = await Contact.countDocuments({ 
    user: userId,
    createdAt: { $gte: startDate }
  });
  
  return {
    leads: {
      totalLeads,
      newLeads,
      qualifiedLeads,
      disqualifiedLeads,
      convertedLeads,
      leadsCreatedInPeriod,
      leadsConvertedInPeriod,
      conversionRate,
      qualificationRate
    },
    contacts: {
      totalContacts,
      activeContacts,
      customerContacts,
      contactsCreatedInPeriod
    }
  };
}

/**
 * Get revenue metrics
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date for metrics
 * @returns {Promise<Object>} Revenue metrics
 */
async function getRevenueMetrics(userId, startDate) {
  // Get total revenue
  const totalRevenue = await Transaction.aggregate([
    { 
      $match: { 
        user: mongoose.Types.ObjectId(userId),
        type: 'revenue',
        status: 'completed'
      } 
    },
    { 
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  // Get revenue in period
  const revenueInPeriod = await Transaction.aggregate([
    { 
      $match: { 
        user: mongoose.Types.ObjectId(userId),
        type: 'revenue',
        status: 'completed',
        createdAt: { $gte: startDate }
      } 
    },
    { 
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  // Get total withdrawals
  const totalWithdrawals = await Transaction.aggregate([
    { 
      $match: { 
        user: mongoose.Types.ObjectId(userId),
        type: 'withdrawal',
        status: 'completed'
      } 
    },
    { 
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  // Get withdrawals in period
  const withdrawalsInPeriod = await Transaction.aggregate([
    { 
      $match: { 
        user: mongoose.Types.ObjectId(userId),
        type: 'withdrawal',
        status: 'completed',
        createdAt: { $gte: startDate }
      } 
    },
    { 
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  // Calculate current balance
  const currentBalance = 
    (totalRevenue.length > 0 ? totalRevenue[0].total : 0) - 
    (totalWithdrawals.length > 0 ? totalWithdrawals[0].total : 0);
  
  return {
    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
    revenueInPeriod: revenueInPeriod.length > 0 ? revenueInPeriod[0].total : 0,
    totalWithdrawals: totalWithdrawals.length > 0 ? totalWithdrawals[0].total : 0,
    withdrawalsInPeriod: withdrawalsInPeriod.length > 0 ? withdrawalsInPeriod[0].total : 0,
    currentBalance
  };
}

/**
 * Get start date for a given period
 * @param {string} period - Time period (day, week, month, year)
 * @returns {Date} Start date
 */
function getStartDateForPeriod(period) {
  const now = new Date();
  
  switch (period) {
    case 'day':
      return new Date(now.setHours(0, 0, 0, 0));
    
    case 'week':
      const dayOfWeek = now.getDay();
      return new Date(now.setDate(now.getDate() - dayOfWeek));
    
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1); // Default to month
  }
}

module.exports = router;

