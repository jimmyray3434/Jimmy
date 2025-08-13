const express = require('express');
const { auth, requireActiveSubscription } = require('../middleware/auth');
const Analytics = require('../models/Analytics');
const Ad = require('../models/Ad');

const router = express.Router();

// Apply auth and subscription check to all routes
router.use(auth);
router.use(requireActiveSubscription);

// @route   GET /api/analytics/dashboard
// @desc    Get analytics dashboard data
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    // Get date ranges for current and previous periods
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    // Get analytics data for current period (last 30 days)
    let currentPeriodData = await Analytics.find({
      user: req.user.userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });
    
    // Get analytics data for previous period (30-60 days ago)
    let previousPeriodData = await Analytics.find({
      user: req.user.userId,
      date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    }).sort({ date: -1 });
    
    // If no data exists, generate demo data
    if (currentPeriodData.length === 0) {
      await Analytics.generateDemoData(req.user.userId, 'daily', 60);
      
      // Fetch the generated data
      currentPeriodData = await Analytics.find({
        user: req.user.userId,
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: -1 });
      
      previousPeriodData = await Analytics.find({
        user: req.user.userId,
        date: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      }).sort({ date: -1 });
    }
    
    // Calculate totals for current period
    const currentRevenue = currentPeriodData.reduce((sum, item) => sum + item.metrics.revenue, 0);
    const currentImpressions = currentPeriodData.reduce((sum, item) => sum + item.metrics.impressions, 0);
    const currentClicks = currentPeriodData.reduce((sum, item) => sum + item.metrics.clicks, 0);
    const currentConversions = currentPeriodData.reduce((sum, item) => sum + item.metrics.conversions, 0);
    
    // Calculate totals for previous period
    const previousRevenue = previousPeriodData.reduce((sum, item) => sum + item.metrics.revenue, 0);
    const previousImpressions = previousPeriodData.reduce((sum, item) => sum + item.metrics.impressions, 0);
    const previousClicks = previousPeriodData.reduce((sum, item) => sum + item.metrics.clicks, 0);
    const previousConversions = previousPeriodData.reduce((sum, item) => sum + item.metrics.conversions, 0);
    
    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    const revenueChange = calculateChange(currentRevenue, previousRevenue);
    const impressionsChange = calculateChange(currentImpressions, previousImpressions);
    const clicksChange = calculateChange(currentClicks, previousClicks);
    const conversionsChange = calculateChange(currentConversions, previousConversions);
    
    // Get revenue chart data (last 7 days)
    const revenueChartData = currentPeriodData.slice(0, 7).map(item => item.metrics.revenue).reverse();
    
    // Get performance metrics for chart
    const performanceData = [currentImpressions, currentClicks, currentConversions];
    
    // Get active ads for campaign data
    const ads = await Ad.find({ user: req.user.userId, 'schedule.isActive': true })
      .limit(4);
    
    const campaignData = ads.map(ad => ({
      name: ad.title,
      value: Math.floor(Math.random() * 40) + 10 // Random value between 10-50 for demo
    }));
    
    // If no campaigns, use placeholder data
    if (campaignData.length === 0) {
      campaignData.push(
        { name: 'Summer Sale', value: 35 },
        { name: 'Product Launch', value: 28 },
        { name: 'Brand Awareness', value: 22 },
        { name: 'Retargeting', value: 15 }
      );
    }
    
    const dashboardData = {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: parseFloat(revenueChange.toFixed(1))
      },
      impressions: {
        current: currentImpressions,
        previous: previousImpressions,
        change: parseFloat(impressionsChange.toFixed(1))
      },
      clicks: {
        current: currentClicks,
        previous: previousClicks,
        change: parseFloat(clicksChange.toFixed(1))
      },
      conversions: {
        current: currentConversions,
        previous: previousConversions,
        change: parseFloat(conversionsChange.toFixed(1))
      },
      chartData: {
        revenue: revenueChartData,
        performance: performanceData,
        campaigns: campaignData
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/reports
// @desc    Get detailed analytics reports
// @access  Private
router.get('/reports', async (req, res) => {
  try {
    // Get query parameters
    const { period = 'daily', startDate, endDate, limit = 30 } = req.query;
    
    // Parse dates
    const parsedStartDate = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const parsedEndDate = endDate ? new Date(endDate) : new Date();
    
    // Query for analytics data
    const analyticsData = await Analytics.find({
      user: req.user.userId,
      date: { $gte: parsedStartDate, $lte: parsedEndDate },
      period: period
    })
    .sort({ date: -1 })
    .limit(parseInt(limit));
    
    // If no data exists, generate demo data
    if (analyticsData.length === 0) {
      await Analytics.generateDemoData(req.user.userId, period, 30);
      
      // Fetch the generated data
      const generatedData = await Analytics.find({
        user: req.user.userId,
        period: period
      })
      .sort({ date: -1 })
      .limit(parseInt(limit));
      
      return res.json({
        success: true,
        count: generatedData.length,
        data: generatedData
      });
    }
    
    res.json({
      success: true,
      count: analyticsData.length,
      data: analyticsData
    });

  } catch (error) {
    console.error('Analytics reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/ad/:id
// @desc    Get analytics for a specific ad
// @access  Private
router.get('/ad/:id', async (req, res) => {
  try {
    // Check if ad exists and belongs to user
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
    
    // Generate random performance data for demo purposes
    const impressions = Math.floor(Math.random() * 10000) + 1000;
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01)); // 1-6% CTR
    const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.05)); // 5-15% conversion rate
    const spend = Math.floor(clicks * (Math.random() * 1.5 + 0.5)); // $0.50-$2.00 CPC
    
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const costPerConversion = conversions > 0 ? spend / conversions : 0;
    
    // Daily data for charts (last 7 days)
    const dailyData = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const factor = Math.max(0.5, 1 - (i / 14)); // Decreasing factor for older dates
      
      const dayImpressions = Math.floor((impressions / 7) * factor * (Math.random() * 0.4 + 0.8));
      const dayClicks = Math.floor(dayImpressions * (Math.random() * 0.05 + 0.01));
      const dayConversions = Math.floor(dayClicks * (Math.random() * 0.1 + 0.05));
      const daySpend = Math.floor(dayClicks * (Math.random() * 1.5 + 0.5));
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        impressions: dayImpressions,
        clicks: dayClicks,
        conversions: dayConversions,
        spend: daySpend
      });
    }
    
    // Audience insights
    const audienceInsights = {
      demographics: {
        ageGroups: [
          { range: '18-24', percentage: Math.floor(Math.random() * 20) + 5 },
          { range: '25-34', percentage: Math.floor(Math.random() * 20) + 15 },
          { range: '35-44', percentage: Math.floor(Math.random() * 20) + 15 },
          { range: '45-54', percentage: Math.floor(Math.random() * 15) + 10 },
          { range: '55+', percentage: Math.floor(Math.random() * 15) + 5 }
        ],
        genders: [
          { type: 'Male', percentage: Math.floor(Math.random() * 30) + 35 },
          { type: 'Female', percentage: Math.floor(Math.random() * 30) + 35 },
          { type: 'Other', percentage: Math.floor(Math.random() * 10) + 1 }
        ],
        locations: [
          { name: 'United States', percentage: Math.floor(Math.random() * 30) + 40 },
          { name: 'United Kingdom', percentage: Math.floor(Math.random() * 15) + 10 },
          { name: 'Canada', percentage: Math.floor(Math.random() * 10) + 5 },
          { name: 'Australia', percentage: Math.floor(Math.random() * 10) + 5 },
          { name: 'Other', percentage: Math.floor(Math.random() * 20) + 5 }
        ]
      },
      devices: [
        { type: 'Mobile', percentage: Math.floor(Math.random() * 20) + 50 },
        { type: 'Desktop', percentage: Math.floor(Math.random() * 20) + 30 },
        { type: 'Tablet', percentage: Math.floor(Math.random() * 10) + 5 }
      ]
    };
    
    // Normalize percentages to ensure they sum to 100%
    const normalizePercentages = (items) => {
      const total = items.reduce((sum, item) => sum + item.percentage, 0);
      return items.map(item => ({
        ...item,
        percentage: Math.round((item.percentage / total) * 100)
      }));
    };
    
    audienceInsights.demographics.ageGroups = normalizePercentages(audienceInsights.demographics.ageGroups);
    audienceInsights.demographics.genders = normalizePercentages(audienceInsights.demographics.genders);
    audienceInsights.demographics.locations = normalizePercentages(audienceInsights.demographics.locations);
    audienceInsights.devices = normalizePercentages(audienceInsights.devices);
    
    const adAnalytics = {
      summary: {
        impressions,
        clicks,
        conversions,
        spend,
        ctr: parseFloat(ctr.toFixed(2)),
        cpc: parseFloat(cpc.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        costPerConversion: parseFloat(costPerConversion.toFixed(2))
      },
      dailyData,
      audienceInsights
    };
    
    res.json({
      success: true,
      data: adAnalytics
    });

  } catch (error) {
    console.error('Ad analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
