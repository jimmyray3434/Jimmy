const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Content = require('../models/Content');
const trafficService = require('../services/trafficService');
const { contentGenerationLimiter } = require('../middleware/rateLimit');

/**
 * @route   GET /api/content
 * @desc    Get user's content
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    
    const query = { user: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 }
    };
    
    const content = await Content.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort);
    
    const total = await Content.countDocuments(query);
    
    res.json({
      success: true,
      data: content,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/content/:id
 * @desc    Get content by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this content'
      });
    }
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/content
 * @desc    Create new content
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { 
      title, type, content, description, featuredImage, 
      keywords, targetAudience, categories, tags,
      seoTitle, seoDescription, status
    } = req.body;
    
    if (!title || !type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title, type, and content are required'
      });
    }
    
    // Create content
    const newContent = await Content.create({
      user: req.user.id,
      title,
      type,
      content,
      description,
      featuredImage,
      keywords: keywords || [],
      targetAudience: targetAudience || [],
      categories: categories || [],
      tags: tags || [],
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || description,
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : null
    });
    
    res.status(201).json({
      success: true,
      data: newContent,
      message: 'Content created successfully'
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   PUT /api/content/:id
 * @desc    Update content
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    let content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this content'
      });
    }
    
    // Check if publishing
    if (req.body.status === 'published' && content.status !== 'published') {
      req.body.publishedAt = new Date();
    }
    
    // Update content
    content = await Content.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: content,
      message: 'Content updated successfully'
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   DELETE /api/content/:id
 * @desc    Delete content
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this content'
      });
    }
    
    await content.remove();
    
    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/content/generate
 * @desc    Generate content using AI
 * @access  Private
 */
router.post('/generate', protect, contentGenerationLimiter, async (req, res) => {
  try {
    const { prompt, type, keywords, targetAudience } = req.body;
    
    if (!prompt || !type) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and type are required'
      });
    }
    
    // In a real implementation, this would call an AI service
    // For now, we'll return a placeholder
    
    const generatedTitle = `AI Generated ${type} about ${prompt.substring(0, 30)}...`;
    const generatedContent = `This is a placeholder for AI-generated content about "${prompt}". In a real implementation, this would be generated using an AI service like OpenAI's GPT.`;
    
    // Create content
    const content = await Content.create({
      user: req.user.id,
      title: generatedTitle,
      type,
      content: generatedContent,
      description: `AI-generated ${type} based on prompt: ${prompt.substring(0, 100)}...`,
      keywords: keywords || [],
      targetAudience: targetAudience || [],
      status: 'draft',
      aiGenerated: true,
      aiPrompt: prompt,
      aiModel: 'placeholder'
    });
    
    res.status(201).json({
      success: true,
      data: content,
      message: 'Content generated successfully'
    });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/content/:id/publish
 * @desc    Publish content
 * @access  Private
 */
router.post('/:id/publish', protect, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to publish this content'
      });
    }
    
    // Check if already published
    if (content.status === 'published') {
      return res.status(400).json({
        success: false,
        error: 'Content is already published'
      });
    }
    
    // Publish content
    const publishedContent = await content.publish();
    
    res.json({
      success: true,
      data: publishedContent,
      message: 'Content published successfully'
    });
  } catch (error) {
    console.error('Error publishing content:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/content/:id/archive
 * @desc    Archive content
 * @access  Private
 */
router.post('/:id/archive', protect, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to archive this content'
      });
    }
    
    // Check if already archived
    if (content.status === 'archived') {
      return res.status(400).json({
        success: false,
        error: 'Content is already archived'
      });
    }
    
    // Archive content
    const archivedContent = await content.archive();
    
    res.json({
      success: true,
      data: archivedContent,
      message: 'Content archived successfully'
    });
  } catch (error) {
    console.error('Error archiving content:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/content/:id/generate-traffic
 * @desc    Generate traffic for content
 * @access  Private
 */
router.post('/:id/generate-traffic', protect, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to generate traffic for this content'
      });
    }
    
    // Check if content is published
    if (content.status !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'Cannot generate traffic for unpublished content'
      });
    }
    
    // Generate traffic
    const result = await trafficService.generateTrafficForContent(req.params.id);
    
    // Update content with last traffic generation timestamp
    await Content.findByIdAndUpdate(req.params.id, {
      lastTrafficGeneration: new Date()
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Traffic generation initiated successfully'
    });
  } catch (error) {
    console.error('Error generating traffic:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/content/stats/performance
 * @desc    Get content performance statistics
 * @access  Private
 */
router.get('/stats/performance', protect, async (req, res) => {
  try {
    // Get top performing content
    const topByViews = await Content.findTopPerforming(req.user.id, 'views', 5);
    const topByClicks = await Content.findTopPerforming(req.user.id, 'clicks', 5);
    const topByConversions = await Content.findTopPerforming(req.user.id, 'conversions', 5);
    const topByRevenue = await Content.findTopPerforming(req.user.id, 'revenue', 5);
    
    // Get content counts by type
    const contentByType = await Content.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Get content counts by status
    const contentByStatus = await Content.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Get total performance metrics
    const totalPerformance = await Content.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: {
          _id: null,
          totalViews: { $sum: '$performance.views' },
          totalClicks: { $sum: '$performance.clicks' },
          totalConversions: { $sum: '$performance.conversions' },
          totalRevenue: { $sum: '$performance.revenue' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        topContent: {
          byViews: topByViews,
          byClicks: topByClicks,
          byConversions: topByConversions,
          byRevenue: topByRevenue
        },
        contentByType,
        contentByStatus,
        totalPerformance: totalPerformance[0] || {
          totalViews: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching content performance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;

