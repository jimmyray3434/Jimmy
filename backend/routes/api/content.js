const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { protect } = require('../../middleware/auth');
const { contentGenerationLimiter } = require('../../middleware/rateLimit');
const Content = require('../../models/Content');
const contentGenerator = require('../../services/contentGenerator');

// @route   POST api/content
// @desc    Create a new content item manually
// @access  Private
router.post(
  '/',
  protect,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('type', 'Content type is required').isIn(['blog', 'social', 'product-review', 'ebook', 'email']),
    check('content', 'Content is required').not().isEmpty(),
    check('niche', 'Niche is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        title,
        type,
        content,
        niche,
        keywords = [],
        status = 'draft',
        publishDate,
        platforms = [],
        affiliateLinks = []
      } = req.body;

      const newContent = new Content({
        user: req.user.id,
        title,
        type,
        content,
        niche,
        keywords,
        status,
        platforms,
        affiliateLinks
      });

      if (publishDate) {
        newContent.publishDate = publishDate;
        if (new Date(publishDate) > new Date()) {
          newContent.status = 'scheduled';
        }
      }

      await newContent.save();

      res.status(201).json({
        success: true,
        data: newContent
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   GET api/content
// @desc    Get all content for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { user: req.user.id };
    if (type) query.type = type;
    if (status) query.status = status;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get content with pagination
    const content = await Content.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Content.countDocuments(query);
    
    res.json({
      success: true,
      count: content.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: content
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET api/content/:id
// @desc    Get content by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    res.json({
      success: true,
      data: content
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT api/content/:id
// @desc    Update content
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Update content
    content = await Content.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: content
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   DELETE api/content/:id
// @desc    Delete content
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    await content.remove();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/content/generate/blog
// @desc    Generate a blog post
// @access  Private
router.post(
  '/generate/blog',
  protect,
  contentGenerationLimiter,
  [
    check('topic', 'Topic is required').not().isEmpty(),
    check('niche', 'Niche is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        topic,
        keywords = [],
        niche,
        tone = 'informative',
        status = 'draft',
        publishDate = null
      } = req.body;

      const result = await contentGenerator.generateBlogPost(req.user.id, {
        topic,
        keywords,
        niche,
        tone,
        status,
        publishDate
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.status(201).json({
        success: true,
        data: result.content
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST api/content/generate/social
// @desc    Generate a social media post
// @access  Private
router.post(
  '/generate/social',
  protect,
  contentGenerationLimiter,
  [
    check('topic', 'Topic is required').not().isEmpty(),
    check('platform', 'Platform is required').isIn(['twitter', 'facebook', 'instagram', 'linkedin']),
    check('niche', 'Niche is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        topic,
        platform,
        keywords = [],
        niche,
        status = 'draft',
        publishDate = null
      } = req.body;

      const result = await contentGenerator.generateSocialMediaPost(req.user.id, {
        topic,
        platform,
        keywords,
        niche,
        status,
        publishDate
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.status(201).json({
        success: true,
        data: result.content
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST api/content/generate/product-review
// @desc    Generate a product review
// @access  Private
router.post(
  '/generate/product-review',
  protect,
  contentGenerationLimiter,
  [
    check('productName', 'Product name is required').not().isEmpty(),
    check('productCategory', 'Product category is required').not().isEmpty(),
    check('niche', 'Niche is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        productName,
        productCategory,
        keywords = [],
        niche,
        status = 'draft',
        publishDate = null,
        affiliateProductId = null
      } = req.body;

      const result = await contentGenerator.generateProductReview(req.user.id, {
        productName,
        productCategory,
        keywords,
        niche,
        status,
        publishDate,
        affiliateProductId
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.status(201).json({
        success: true,
        data: result.content
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST api/content/generate/ebook
// @desc    Generate an e-book outline
// @access  Private
router.post(
  '/generate/ebook',
  protect,
  contentGenerationLimiter,
  [
    check('topic', 'Topic is required').not().isEmpty(),
    check('niche', 'Niche is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        topic,
        keywords = [],
        niche,
        status = 'draft'
      } = req.body;

      const result = await contentGenerator.generateEbookOutline(req.user.id, {
        topic,
        keywords,
        niche,
        status
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.status(201).json({
        success: true,
        data: result.content
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST api/content/generate/auto
// @desc    Generate content based on user settings
// @access  Private
router.post(
  '/generate/auto',
  protect,
  contentGenerationLimiter,
  async (req, res) => {
    try {
      const result = await contentGenerator.generateContentFromSettings(req.user.id);

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.status(201).json({
        success: true,
        data: result.content
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   PUT api/content/:id/publish
// @desc    Publish content
// @access  Private
router.put('/:id/publish', protect, async (req, res) => {
  try {
    let content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    
    // Check if content belongs to user
    if (content.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Update content status to published
    content = await Content.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status: 'published',
          publishDate: Date.now()
        } 
      },
      { new: true }
    );
    
    res.json({
      success: true,
      data: content
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

