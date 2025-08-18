const openaiService = require('./openai');
const Content = require('../models/Content');
const User = require('../models/User');
const AffiliateProduct = require('../models/AffiliateProduct');
const { generateDisclosure } = require('./disclosureGenerator');

// Generate a blog post and save to database
const generateBlogPost = async (userId, options) => {
  try {
    const {
      topic,
      keywords = [],
      niche,
      tone = 'informative',
      status = 'draft',
      publishDate = null
    } = options;
    
    // Get user for API key
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Generate blog post content
    const result = await openaiService.generateBlogPost(
      topic,
      keywords,
      niche,
      tone,
      user.apiKeys?.openai
    );
    
    if (!result.success) {
      return result;
    }
    
    // Generate SEO metadata
    const seoResult = await openaiService.generateSEOMetadata(
      topic,
      result.content,
      user.apiKeys?.openai
    );
    
    let seoTitle, seoDescription;
    if (seoResult.success && seoResult.metadata) {
      seoTitle = seoResult.metadata.seoTitle;
      seoDescription = seoResult.metadata.seoDescription;
    }
    
    // Extract title from content (assuming first line is a markdown heading)
    let title = topic;
    const contentLines = result.content.split('\n');
    const headingMatch = contentLines[0].match(/^#+\s+(.+)$/);
    if (headingMatch) {
      title = headingMatch[1];
      // Remove the heading from content
      result.content = contentLines.slice(1).join('\n').trim();
    }
    
    // Add affiliate disclosure if needed
    const hasAffiliateLinks = keywords.some(keyword => 
      keyword.toLowerCase().includes('review') || 
      keyword.toLowerCase().includes('best') ||
      keyword.toLowerCase().includes('vs') ||
      keyword.toLowerCase().includes('comparison')
    );
    
    let contentWithDisclosure = result.content;
    if (hasAffiliateLinks) {
      const disclosure = generateDisclosure('blog');
      contentWithDisclosure = `${result.content}\n\n${disclosure}`;
    }
    
    // Create new content document
    const newContent = new Content({
      user: userId,
      title,
      type: 'blog',
      status,
      niche,
      keywords,
      content: contentWithDisclosure,
      summary: contentWithDisclosure.substring(0, 200) + '...',
      seoTitle: seoTitle || title,
      seoDescription,
      generationPrompt: `Topic: ${topic}, Keywords: ${keywords.join(', ')}, Niche: ${niche}, Tone: ${tone}`,
      generationSettings: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 3000
      }
    });
    
    // Set publish date if provided
    if (publishDate) {
      newContent.publishDate = publishDate;
      if (new Date(publishDate) > new Date()) {
        newContent.status = 'scheduled';
      }
    }
    
    // Save to database
    await newContent.save();
    
    return {
      success: true,
      content: newContent
    };
  } catch (error) {
    console.error('Error generating blog post:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate a social media post and save to database
const generateSocialMediaPost = async (userId, options) => {
  try {
    const {
      topic,
      platform,
      keywords = [],
      niche,
      status = 'draft',
      publishDate = null
    } = options;
    
    // Get user for API key
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Generate social media post content
    const result = await openaiService.generateSocialMediaPost(
      topic,
      platform,
      keywords,
      niche,
      user.apiKeys?.openai
    );
    
    if (!result.success) {
      return result;
    }
    
    // Create new content document
    const newContent = new Content({
      user: userId,
      title: topic,
      type: 'social',
      status,
      niche,
      keywords,
      content: result.content,
      platforms: [{
        name: platform.toLowerCase(),
        status: 'pending'
      }],
      generationPrompt: `Topic: ${topic}, Platform: ${platform}, Keywords: ${keywords.join(', ')}, Niche: ${niche}`,
      generationSettings: {
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: platform.toLowerCase() === 'twitter' ? 500 : 1000
      }
    });
    
    // Set publish date if provided
    if (publishDate) {
      newContent.publishDate = publishDate;
      if (new Date(publishDate) > new Date()) {
        newContent.status = 'scheduled';
      }
    }
    
    // Save to database
    await newContent.save();
    
    return {
      success: true,
      content: newContent
    };
  } catch (error) {
    console.error('Error generating social media post:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate a product review and save to database
const generateProductReview = async (userId, options) => {
  try {
    const {
      productName,
      productCategory,
      keywords = [],
      niche,
      status = 'draft',
      publishDate = null,
      affiliateProductId = null
    } = options;
    
    // Get user for API key
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Generate product review content
    const result = await openaiService.generateProductReview(
      productName,
      productCategory,
      keywords,
      niche,
      user.apiKeys?.openai
    );
    
    if (!result.success) {
      return result;
    }
    
    // Generate SEO metadata
    const seoResult = await openaiService.generateSEOMetadata(
      `${productName} Review`,
      result.content,
      user.apiKeys?.openai
    );
    
    let seoTitle, seoDescription;
    if (seoResult.success && seoResult.metadata) {
      seoTitle = seoResult.metadata.seoTitle;
      seoDescription = seoResult.metadata.seoDescription;
    }
    
    // Extract title from content (assuming first line is a markdown heading)
    let title = `${productName} Review`;
    const contentLines = result.content.split('\n');
    const headingMatch = contentLines[0].match(/^#+\s+(.+)$/);
    if (headingMatch) {
      title = headingMatch[1];
      // Remove the heading from content
      result.content = contentLines.slice(1).join('\n').trim();
    }
    
    // Add affiliate disclosure
    const disclosure = generateDisclosure('review');
    const contentWithDisclosure = `${result.content}\n\n${disclosure}`;
    
    // Create affiliate links array if product ID is provided
    let affiliateLinks = [];
    if (affiliateProductId) {
      const affiliateProduct = await AffiliateProduct.findById(affiliateProductId);
      if (affiliateProduct) {
        affiliateLinks = [{
          productId: affiliateProductId,
          network: affiliateProduct.network,
          url: affiliateProduct.affiliateUrl,
          anchor: productName,
          position: 'body'
        }];
      }
    }
    
    // Create new content document
    const newContent = new Content({
      user: userId,
      title,
      type: 'product-review',
      status,
      niche,
      keywords,
      content: contentWithDisclosure,
      summary: result.content.substring(0, 200) + '...',
      seoTitle: seoTitle || title,
      seoDescription,
      affiliateLinks,
      generationPrompt: `Product: ${productName}, Category: ${productCategory}, Keywords: ${keywords.join(', ')}, Niche: ${niche}`,
      generationSettings: {
        model: 'gpt-4',
        temperature: 0.6,
        maxTokens: 3000
      }
    });
    
    // Set publish date if provided
    if (publishDate) {
      newContent.publishDate = publishDate;
      if (new Date(publishDate) > new Date()) {
        newContent.status = 'scheduled';
      }
    }
    
    // Save to database
    await newContent.save();
    
    return {
      success: true,
      content: newContent
    };
  } catch (error) {
    console.error('Error generating product review:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate an e-book outline and save to database
const generateEbookOutline = async (userId, options) => {
  try {
    const {
      topic,
      keywords = [],
      niche,
      status = 'draft'
    } = options;
    
    // Get user for API key
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Generate e-book outline
    const result = await openaiService.generateEbookOutline(
      topic,
      keywords,
      niche,
      user.apiKeys?.openai
    );
    
    if (!result.success) {
      return result;
    }
    
    // Extract title from content (assuming first line is a markdown heading)
    let title = `${topic} E-Book`;
    const contentLines = result.content.split('\n');
    const headingMatch = contentLines[0].match(/^#+\s+(.+)$/);
    if (headingMatch) {
      title = headingMatch[1];
    }
    
    // Create new content document
    const newContent = new Content({
      user: userId,
      title,
      type: 'ebook',
      status,
      niche,
      keywords,
      content: result.content,
      summary: `E-book outline for "${topic}"`,
      generationPrompt: `Topic: ${topic}, Keywords: ${keywords.join(', ')}, Niche: ${niche}`,
      generationSettings: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000
      }
    });
    
    // Save to database
    await newContent.save();
    
    return {
      success: true,
      content: newContent
    };
  } catch (error) {
    console.error('Error generating e-book outline:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate content based on user settings
const generateContentFromSettings = async (userId) => {
  try {
    // Get user and their settings
    const user = await User.findById(userId);
    if (!user || !user.settings || !user.settings.contentGeneration) {
      return {
        success: false,
        error: 'User settings not found'
      };
    }
    
    const { contentGeneration } = user.settings;
    const { targetNiche, contentTypes = [] } = contentGeneration;
    
    if (!targetNiche || contentTypes.length === 0) {
      return {
        success: false,
        error: 'Insufficient content generation settings'
      };
    }
    
    // Generate keywords based on niche
    const keywordsResult = await openaiService.generateContent(
      `Generate 5 high-value keywords for the ${targetNiche} niche that would be good for affiliate marketing content. Return only the keywords as a comma-separated list.`,
      {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 100
      },
      user.apiKeys?.openai
    );
    
    let keywords = [];
    if (keywordsResult.success) {
      keywords = keywordsResult.content
        .replace(/\n/g, '')
        .split(',')
        .map(k => k.trim())
        .filter(k => k);
    }
    
    // Generate topic based on niche
    const topicResult = await openaiService.generateContent(
      `Generate an engaging topic for content in the ${targetNiche} niche that would perform well for affiliate marketing. Return only the topic as a concise phrase.`,
      {
        model: 'gpt-4',
        temperature: 0.8,
        max_tokens: 50
      },
      user.apiKeys?.openai
    );
    
    let topic = targetNiche;
    if (topicResult.success) {
      topic = topicResult.content.replace(/\n/g, '').trim();
    }
    
    // Randomly select a content type from user preferences
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    
    // Generate content based on type
    let result;
    switch (contentType) {
      case 'blog':
        result = await generateBlogPost(userId, {
          topic,
          keywords,
          niche: targetNiche,
          status: 'draft'
        });
        break;
      case 'social':
        const platforms = ['twitter', 'facebook', 'instagram', 'linkedin'];
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        result = await generateSocialMediaPost(userId, {
          topic,
          platform,
          keywords,
          niche: targetNiche,
          status: 'draft'
        });
        break;
      case 'product-review':
        // Get a random affiliate product if available
        const affiliateProducts = await AffiliateProduct.find({ user: userId }).limit(10);
        let productName = 'Product';
        let productCategory = targetNiche;
        let affiliateProductId = null;
        
        if (affiliateProducts.length > 0) {
          const randomProduct = affiliateProducts[Math.floor(Math.random() * affiliateProducts.length)];
          productName = randomProduct.name;
          productCategory = randomProduct.category;
          affiliateProductId = randomProduct._id;
        } else {
          // Generate a product name if no affiliate products are available
          const productResult = await openaiService.generateContent(
            `Generate a product name for a popular product in the ${targetNiche} niche. Return only the product name.`,
            {
              model: 'gpt-4',
              temperature: 0.7,
              max_tokens: 20
            },
            user.apiKeys?.openai
          );
          
          if (productResult.success) {
            productName = productResult.content.replace(/\n/g, '').trim();
          }
        }
        
        result = await generateProductReview(userId, {
          productName,
          productCategory,
          keywords,
          niche: targetNiche,
          status: 'draft',
          affiliateProductId
        });
        break;
      case 'ebook':
        result = await generateEbookOutline(userId, {
          topic,
          keywords,
          niche: targetNiche,
          status: 'draft'
        });
        break;
      default:
        result = {
          success: false,
          error: `Unsupported content type: ${contentType}`
        };
    }
    
    return result;
  } catch (error) {
    console.error('Error generating content from settings:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateBlogPost,
  generateSocialMediaPost,
  generateProductReview,
  generateEbookOutline,
  generateContentFromSettings
};

