const User = require('../models/User');
const Content = require('../models/Content');
const AffiliateProduct = require('../models/AffiliateProduct');
const DigitalProduct = require('../models/DigitalProduct');
const contentGenerator = require('./contentGenerator');
const productGenerator = require('./productGenerator');
const analyticsService = require('./analyticsService');
const affiliateNetworks = require('./affiliateNetworks');

/**
 * Generate content based on user settings
 * @param {string} userId - User ID
 * @param {Object} data - Task data
 * @returns {Promise} - Result of content generation
 */
const generateContent = async (userId, data = {}) => {
  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Check if user has content generation settings
    if (!user.settings || !user.settings.contentGeneration) {
      return {
        success: false,
        error: 'Content generation settings not found'
      };
    }
    
    // Generate content
    const result = await contentGenerator.generateContentFromSettings(userId);
    
    return result;
  } catch (error) {
    console.error('Error generating content:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Publish scheduled content
 * @param {string} userId - User ID
 * @param {Object} data - Task data
 * @returns {Promise} - Result of content publishing
 */
const publishContent = async (userId, data = {}) => {
  try {
    const { contentId } = data;
    
    if (!contentId) {
      return {
        success: false,
        error: 'Content ID is required'
      };
    }
    
    // Get content
    const content = await Content.findById(contentId);
    if (!content) {
      return {
        success: false,
        error: 'Content not found'
      };
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== userId) {
      return {
        success: false,
        error: 'Not authorized'
      };
    }
    
    // Check if content is scheduled
    if (content.status !== 'scheduled') {
      return {
        success: false,
        error: 'Content is not scheduled for publishing'
      };
    }
    
    // Update content status to published
    content.status = 'published';
    await content.save();
    
    return {
      success: true,
      message: 'Content published successfully',
      content
    };
  } catch (error) {
    console.error('Error publishing content:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update affiliate products
 * @param {string} userId - User ID
 * @param {Object} data - Task data
 * @returns {Promise} - Result of affiliate product updates
 */
const updateAffiliateProducts = async (userId, data = {}) => {
  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Check if user has affiliate settings
    if (!user.settings || !user.settings.affiliate) {
      return {
        success: false,
        error: 'Affiliate settings not found'
      };
    }
    
    const { affiliate } = user.settings;
    const { networks = [], productCategories = [] } = affiliate;
    
    if (networks.length === 0 || productCategories.length === 0) {
      return {
        success: false,
        error: 'Insufficient affiliate settings'
      };
    }
    
    // Get existing affiliate products
    const existingProducts = await AffiliateProduct.find({ user: userId });
    
    // Update existing products or find new ones
    const updatedProducts = [];
    const newProducts = [];
    
    // Process each product category
    for (const category of productCategories) {
      // Generate keywords based on category
      const keywords = category.replace('-', ' ');
      
      // Search for affiliate products
      const searchResult = await affiliateNetworks.findAffiliateProducts(
        keywords,
        {
          category,
          networks,
          minCommissionRate: affiliate.minCommissionRate || 0,
          limit: 5
        },
        user.apiKeys
      );
      
      if (!searchResult.success) {
        console.error(`Error searching for affiliate products in category ${category}:`, searchResult.error);
        continue;
      }
      
      // Process found products
      for (const product of searchResult.products) {
        // Check if product already exists
        const existingProduct = existingProducts.find(p => 
          p.name === product.name && p.network === product.network
        );
        
        if (existingProduct) {
          // Update existing product
          existingProduct.description = product.description;
          existingProduct.price = product.price;
          existingProduct.imageUrl = product.imageUrl;
          existingProduct.commissionRate = product.commissionRate;
          existingProduct.lastUpdated = new Date();
          
          await existingProduct.save();
          updatedProducts.push(existingProduct);
        } else {
          // Create new product
          const newProduct = new AffiliateProduct({
            user: userId,
            name: product.name,
            description: product.description,
            category,
            network: product.network,
            productUrl: product.productUrl,
            affiliateUrl: product.affiliateUrl || product.productUrl,
            imageUrl: product.imageUrl,
            price: product.price,
            currency: product.currency || 'USD',
            commissionRate: product.commissionRate,
            commissionType: product.commissionType || 'percentage',
            rating: product.rating
          });
          
          await newProduct.save();
          newProducts.push(newProduct);
        }
      }
    }
    
    return {
      success: true,
      message: 'Affiliate products updated successfully',
      updated: updatedProducts.length,
      new: newProducts.length,
      updatedProducts,
      newProducts
    };
  } catch (error) {
    console.error('Error updating affiliate products:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate digital product
 * @param {string} userId - User ID
 * @param {Object} data - Task data
 * @returns {Promise} - Result of digital product generation
 */
const generateDigitalProduct = async (userId, data = {}) => {
  try {
    // Generate product
    const result = await productGenerator.generateProductFromSettings(userId);
    
    return result;
  } catch (error) {
    console.error('Error generating digital product:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Collect analytics
 * @param {string} userId - User ID
 * @param {Object} data - Task data
 * @returns {Promise} - Result of analytics collection
 */
const collectAnalytics = async (userId, data = {}) => {
  try {
    // Generate daily analytics
    const result = await analyticsService.generateDailyAnalytics(userId);
    
    return result;
  } catch (error) {
    console.error('Error collecting analytics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Post to social media
 * @param {string} userId - User ID
 * @param {Object} data - Task data
 * @returns {Promise} - Result of social media posting
 */
const postToSocial = async (userId, data = {}) => {
  try {
    const { contentId, platform } = data;
    
    if (!contentId || !platform) {
      return {
        success: false,
        error: 'Content ID and platform are required'
      };
    }
    
    // Get content
    const content = await Content.findById(contentId);
    if (!content) {
      return {
        success: false,
        error: 'Content not found'
      };
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== userId) {
      return {
        success: false,
        error: 'Not authorized'
      };
    }
    
    // In a real implementation, this would connect to social media APIs
    // For now, we'll simulate a successful posting
    
    // Update content platforms
    const platformIndex = content.platforms.findIndex(p => p.name === platform);
    
    if (platformIndex >= 0) {
      content.platforms[platformIndex].status = 'published';
      content.platforms[platformIndex].publishedDate = new Date();
      content.platforms[platformIndex].publishedUrl = `https://${platform}.com/sample-post`;
    } else {
      content.platforms.push({
        name: platform,
        status: 'published',
        publishedDate: new Date(),
        publishedUrl: `https://${platform}.com/sample-post`
      });
    }
    
    await content.save();
    
    return {
      success: true,
      message: `Content posted to ${platform} successfully`,
      platform,
      content
    };
  } catch (error) {
    console.error('Error posting to social media:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send email
 * @param {string} userId - User ID
 * @param {Object} data - Task data
 * @returns {Promise} - Result of email sending
 */
const sendEmail = async (userId, data = {}) => {
  try {
    const { contentId, recipients } = data;
    
    if (!contentId) {
      return {
        success: false,
        error: 'Content ID is required'
      };
    }
    
    // Get content
    const content = await Content.findById(contentId);
    if (!content) {
      return {
        success: false,
        error: 'Content not found'
      };
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== userId) {
      return {
        success: false,
        error: 'Not authorized'
      };
    }
    
    // In a real implementation, this would connect to an email service
    // For now, we'll simulate a successful email sending
    
    return {
      success: true,
      message: 'Email sent successfully',
      recipientCount: recipients?.length || 0,
      content
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Perform maintenance tasks
 * @param {string} userId - User ID
 * @param {Object} data - Task data
 * @returns {Promise} - Result of maintenance tasks
 */
const performMaintenance = async (userId, data = {}) => {
  try {
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Perform maintenance tasks
    const tasks = [];
    
    // 1. Archive old content
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const oldContent = await Content.find({
      user: userId,
      createdAt: { $lt: threeMonthsAgo },
      status: { $ne: 'archived' },
      'performance.views': { $lt: 100 }
    });
    
    if (oldContent.length > 0) {
      await Content.updateMany(
        {
          _id: { $in: oldContent.map(c => c._id) }
        },
        {
          $set: { status: 'archived' }
        }
      );
      
      tasks.push(`Archived ${oldContent.length} old content items with low views`);
    }
    
    // 2. Deactivate low-performing affiliate products
    const lowPerformingProducts = await AffiliateProduct.find({
      user: userId,
      isActive: true,
      'performance.clicks': { $gt: 10 },
      'performance.conversionRate': { $lt: 1 }
    });
    
    if (lowPerformingProducts.length > 0) {
      await AffiliateProduct.updateMany(
        {
          _id: { $in: lowPerformingProducts.map(p => p._id) }
        },
        {
          $set: { isActive: false }
        }
      );
      
      tasks.push(`Deactivated ${lowPerformingProducts.length} low-performing affiliate products`);
    }
    
    return {
      success: true,
      message: 'Maintenance tasks completed successfully',
      tasks
    };
  } catch (error) {
    console.error('Error performing maintenance:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateContent,
  publishContent,
  updateAffiliateProducts,
  generateDigitalProduct,
  collectAnalytics,
  postToSocial,
  sendEmail,
  performMaintenance
};

