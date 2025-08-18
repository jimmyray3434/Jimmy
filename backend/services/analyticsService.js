const Analytics = require('../models/Analytics');
const Content = require('../models/Content');
const AffiliateProduct = require('../models/AffiliateProduct');
const DigitalProduct = require('../models/DigitalProduct');

/**
 * Generate daily analytics report
 * @param {string} userId - User ID
 * @returns {Promise} - Generated analytics report
 */
const generateDailyAnalytics = async (userId) => {
  try {
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if analytics already exist for today
    const existingAnalytics = await Analytics.findOne({
      user: userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (existingAnalytics) {
      return {
        success: true,
        message: 'Analytics already generated for today',
        analytics: existingAnalytics
      };
    }
    
    // Get content metrics
    const contentMetrics = await getContentMetrics(userId);
    
    // Get affiliate metrics
    const affiliateMetrics = await getAffiliateMetrics(userId);
    
    // Get product metrics
    const productMetrics = await getProductMetrics(userId);
    
    // Get top performing content
    const topContent = await getTopPerformingContent(userId, 5);
    
    // Get top performing products
    const topProducts = await getTopPerformingProducts(userId, 5);
    
    // Get top performing affiliates
    const topAffiliates = await getTopPerformingAffiliates(userId, 5);
    
    // Create new analytics document
    const newAnalytics = new Analytics({
      user: userId,
      date: today,
      contentMetrics,
      affiliateMetrics,
      productMetrics,
      topPerformingContent: topContent,
      topPerformingProducts: topProducts,
      topPerformingAffiliates: topAffiliates
    });
    
    await newAnalytics.save();
    
    return {
      success: true,
      analytics: newAnalytics
    };
  } catch (error) {
    console.error('Error generating daily analytics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get content metrics
 * @param {string} userId - User ID
 * @returns {Promise} - Content metrics
 */
const getContentMetrics = async (userId) => {
  try {
    // Get all content for user
    const content = await Content.find({ user: userId });
    
    // Calculate metrics
    let totalViews = 0;
    let totalUniqueVisitors = 0;
    let totalTimeOnPage = 0;
    let totalBounceRate = 0;
    let totalSocialShares = 0;
    let totalComments = 0;
    
    content.forEach(item => {
      totalViews += item.performance?.views || 0;
      totalUniqueVisitors += item.performance?.uniqueVisitors || 0;
      totalTimeOnPage += item.performance?.averageTimeOnPage || 0;
      totalBounceRate += item.performance?.bounceRate || 0;
      totalSocialShares += item.performance?.socialShares || 0;
      totalComments += item.performance?.comments || 0;
    });
    
    // Calculate averages
    const contentCount = content.length || 1;
    const averageTimeOnPage = totalTimeOnPage / contentCount;
    const averageBounceRate = totalBounceRate / contentCount;
    
    return {
      totalViews,
      uniqueVisitors: totalUniqueVisitors,
      averageTimeOnPage,
      bounceRate: averageBounceRate,
      socialShares: totalSocialShares,
      comments: totalComments
    };
  } catch (error) {
    console.error('Error getting content metrics:', error);
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      averageTimeOnPage: 0,
      bounceRate: 0,
      socialShares: 0,
      comments: 0
    };
  }
};

/**
 * Get affiliate metrics
 * @param {string} userId - User ID
 * @returns {Promise} - Affiliate metrics
 */
const getAffiliateMetrics = async (userId) => {
  try {
    // Get all affiliate products for user
    const affiliateProducts = await AffiliateProduct.find({ user: userId });
    
    // Calculate metrics
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    
    affiliateProducts.forEach(product => {
      totalImpressions += product.performance?.impressions || 0;
      totalClicks += product.performance?.clicks || 0;
      totalConversions += product.performance?.conversions || 0;
      totalRevenue += product.performance?.revenue || 0;
    });
    
    // Calculate rates
    const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const earningsPerClick = totalClicks > 0 ? totalRevenue / totalClicks : 0;
    
    return {
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      revenue: totalRevenue,
      clickThroughRate,
      conversionRate,
      earningsPerClick
    };
  } catch (error) {
    console.error('Error getting affiliate metrics:', error);
    return {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      earningsPerClick: 0
    };
  }
};

/**
 * Get product metrics
 * @param {string} userId - User ID
 * @returns {Promise} - Product metrics
 */
const getProductMetrics = async (userId) => {
  try {
    // Get all digital products for user
    const digitalProducts = await DigitalProduct.find({ user: userId });
    
    // Calculate metrics
    let totalViews = 0;
    let totalSales = 0;
    let totalRevenue = 0;
    let totalRefunds = 0;
    
    digitalProducts.forEach(product => {
      totalViews += product.performance?.views || 0;
      totalSales += product.performance?.sales || 0;
      totalRevenue += product.performance?.revenue || 0;
      totalRefunds += product.performance?.refunds || 0;
    });
    
    // Calculate rates
    const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    return {
      views: totalViews,
      sales: totalSales,
      revenue: totalRevenue,
      refunds: totalRefunds,
      conversionRate,
      averageOrderValue
    };
  } catch (error) {
    console.error('Error getting product metrics:', error);
    return {
      views: 0,
      sales: 0,
      revenue: 0,
      refunds: 0,
      conversionRate: 0,
      averageOrderValue: 0
    };
  }
};

/**
 * Get top performing content
 * @param {string} userId - User ID
 * @param {number} limit - Number of items to return
 * @returns {Promise} - Top performing content
 */
const getTopPerformingContent = async (userId, limit = 5) => {
  try {
    // Get content sorted by views
    const content = await Content.find({ user: userId })
      .sort({ 'performance.views': -1 })
      .limit(limit);
    
    return content.map(item => ({
      contentId: item._id,
      title: item.title,
      views: item.performance?.views || 0,
      revenue: item.performance?.revenue || 0
    }));
  } catch (error) {
    console.error('Error getting top performing content:', error);
    return [];
  }
};

/**
 * Get top performing products
 * @param {string} userId - User ID
 * @param {number} limit - Number of items to return
 * @returns {Promise} - Top performing products
 */
const getTopPerformingProducts = async (userId, limit = 5) => {
  try {
    // Get products sorted by sales
    const products = await DigitalProduct.find({ user: userId })
      .sort({ 'performance.sales': -1 })
      .limit(limit);
    
    return products.map(product => ({
      productId: product._id,
      title: product.title,
      sales: product.performance?.sales || 0,
      revenue: product.performance?.revenue || 0
    }));
  } catch (error) {
    console.error('Error getting top performing products:', error);
    return [];
  }
};

/**
 * Get top performing affiliate products
 * @param {string} userId - User ID
 * @param {number} limit - Number of items to return
 * @returns {Promise} - Top performing affiliate products
 */
const getTopPerformingAffiliates = async (userId, limit = 5) => {
  try {
    // Get affiliate products sorted by revenue
    const affiliates = await AffiliateProduct.find({ user: userId })
      .sort({ 'performance.revenue': -1 })
      .limit(limit);
    
    return affiliates.map(affiliate => ({
      productId: affiliate._id,
      name: affiliate.name,
      clicks: affiliate.performance?.clicks || 0,
      conversions: affiliate.performance?.conversions || 0,
      revenue: affiliate.performance?.revenue || 0
    }));
  } catch (error) {
    console.error('Error getting top performing affiliates:', error);
    return [];
  }
};

/**
 * Get analytics for a specific date range
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise} - Analytics for date range
 */
const getAnalyticsForDateRange = async (userId, startDate, endDate) => {
  try {
    // Get analytics for date range
    const analytics = await Analytics.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });
    
    return {
      success: true,
      analytics
    };
  } catch (error) {
    console.error('Error getting analytics for date range:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get revenue breakdown
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise} - Revenue breakdown
 */
const getRevenueBreakdown = async (userId, startDate, endDate) => {
  try {
    // Get analytics for date range
    const analytics = await Analytics.find({
      user: userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    // Calculate revenue breakdown
    let affiliateRevenue = 0;
    let productRevenue = 0;
    let totalRevenue = 0;
    
    analytics.forEach(item => {
      affiliateRevenue += item.affiliateMetrics.revenue;
      productRevenue += item.productMetrics.revenue;
      totalRevenue += item.totalRevenue;
    });
    
    return {
      success: true,
      data: {
        affiliateRevenue,
        productRevenue,
        totalRevenue,
        affiliatePercentage: totalRevenue > 0 ? (affiliateRevenue / totalRevenue) * 100 : 0,
        productPercentage: totalRevenue > 0 ? (productRevenue / totalRevenue) * 100 : 0
      }
    };
  } catch (error) {
    console.error('Error getting revenue breakdown:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate random analytics data for testing
 * @param {string} userId - User ID
 * @param {number} days - Number of days to generate data for
 * @returns {Promise} - Generated analytics data
 */
const generateRandomAnalyticsData = async (userId, days = 30) => {
  try {
    const analytics = [];
    
    // Generate data for each day
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Check if analytics already exist for this day
      const existingAnalytics = await Analytics.findOne({
        user: userId,
        date: {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      if (existingAnalytics) {
        analytics.push(existingAnalytics);
        continue;
      }
      
      // Generate random metrics
      const contentMetrics = {
        totalViews: Math.floor(Math.random() * 1000),
        uniqueVisitors: Math.floor(Math.random() * 800),
        averageTimeOnPage: Math.random() * 5,
        bounceRate: Math.random() * 100,
        socialShares: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 20)
      };
      
      const affiliateClicks = Math.floor(Math.random() * 200);
      const affiliateConversions = Math.floor(affiliateClicks * (Math.random() * 0.2));
      const affiliateRevenue = affiliateConversions * (Math.random() * 50 + 10);
      
      const affiliateMetrics = {
        impressions: Math.floor(Math.random() * 2000),
        clicks: affiliateClicks,
        conversions: affiliateConversions,
        revenue: affiliateRevenue,
        clickThroughRate: 0, // Will be calculated on save
        conversionRate: 0, // Will be calculated on save
        earningsPerClick: 0 // Will be calculated on save
      };
      
      const productViews = Math.floor(Math.random() * 500);
      const productSales = Math.floor(productViews * (Math.random() * 0.1));
      const productRevenue = productSales * (Math.random() * 100 + 20);
      
      const productMetrics = {
        views: productViews,
        sales: productSales,
        revenue: productRevenue,
        refunds: Math.floor(productSales * (Math.random() * 0.05)),
        conversionRate: 0, // Will be calculated on save
        averageOrderValue: 0 // Will be calculated on save
      };
      
      // Create new analytics document
      const newAnalytics = new Analytics({
        user: userId,
        date,
        contentMetrics,
        affiliateMetrics,
        productMetrics,
        topPerformingContent: [],
        topPerformingProducts: [],
        topPerformingAffiliates: []
      });
      
      await newAnalytics.save();
      analytics.push(newAnalytics);
    }
    
    return {
      success: true,
      count: analytics.length,
      analytics
    };
  } catch (error) {
    console.error('Error generating random analytics data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateDailyAnalytics,
  getAnalyticsForDateRange,
  getRevenueBreakdown,
  generateRandomAnalyticsData
};

