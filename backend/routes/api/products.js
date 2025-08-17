const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { protect } = require('../../middleware/auth');
const { contentGenerationLimiter } = require('../../middleware/rateLimit');
const DigitalProduct = require('../../models/DigitalProduct');
const productGenerator = require('../../services/productGenerator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(__dirname, '../../uploads', req.user.id);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept all file types for now
  cb(null, true);
};

// Initialize upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// @route   POST api/products
// @desc    Create a new digital product manually
// @access  Private
router.post(
  '/',
  protect,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('type', 'Product type is required').isIn(['ebook', 'template', 'course', 'software', 'printable', 'other']),
    check('category', 'Category is required').not().isEmpty(),
    check('price', 'Price is required').isNumeric()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        title,
        description,
        type,
        category,
        price,
        currency = 'USD',
        discountPrice,
        status = 'draft',
        tags = [],
        features = [],
        requirements = [],
        contentOutline = '',
        salesPage = {}
      } = req.body;

      const newProduct = new DigitalProduct({
        user: req.user.id,
        title,
        description,
        type,
        category,
        price,
        currency,
        discountPrice,
        status,
        tags,
        features,
        requirements,
        contentOutline,
        salesPage
      });

      await newProduct.save();

      res.status(201).json({
        success: true,
        data: newProduct
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   GET api/products
// @desc    Get all digital products for a user
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
    
    // Get products with pagination
    const products = await DigitalProduct.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await DigitalProduct.countDocuments(query);
    
    res.json({
      success: true,
      count: products.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      data: products
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET api/products/:id
// @desc    Get digital product by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await DigitalProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT api/products/:id
// @desc    Update digital product
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let product = await DigitalProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Update product
    product = await DigitalProduct.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   DELETE api/products/:id
// @desc    Delete digital product
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await DigitalProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Delete product file if exists
    if (product.filePath) {
      const fullPath = path.join(__dirname, '../..', product.filePath);
      if (fs.existsSync(fullPath)) {
        await unlinkAsync(fullPath);
      }
    }
    
    await product.remove();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/products/upload/:id
// @desc    Upload file for digital product
// @access  Private
router.post('/upload/:id', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const product = await DigitalProduct.findById(req.params.id);
    
    if (!product) {
      // Delete uploaded file
      await unlinkAsync(req.file.path);
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      // Delete uploaded file
      await unlinkAsync(req.file.path);
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Delete old file if exists
    if (product.filePath) {
      const oldPath = path.join(__dirname, '../..', product.filePath);
      if (fs.existsSync(oldPath)) {
        await unlinkAsync(oldPath);
      }
    }
    
    // Update product with file info
    product.filePath = `uploads/${req.user.id}/${req.file.filename}`;
    product.fileSize = req.file.size;
    product.fileType = req.file.mimetype;
    
    await product.save();
    
    res.json({
      success: true,
      data: {
        filePath: product.filePath,
        fileSize: product.fileSize,
        fileType: product.fileType
      }
    });
  } catch (err) {
    console.error(err.message);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      await unlinkAsync(req.file.path);
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/products/upload-cover/:id
// @desc    Upload cover image for digital product
// @access  Private
router.post('/upload-cover/:id', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image uploaded' });
    }
    
    const product = await DigitalProduct.findById(req.params.id);
    
    if (!product) {
      // Delete uploaded file
      await unlinkAsync(req.file.path);
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      // Delete uploaded file
      await unlinkAsync(req.file.path);
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Delete old cover image if exists
    if (product.coverImage) {
      const oldPath = path.join(__dirname, '../..', product.coverImage);
      if (fs.existsSync(oldPath)) {
        await unlinkAsync(oldPath);
      }
    }
    
    // Update product with cover image info
    product.coverImage = `uploads/${req.user.id}/${req.file.filename}`;
    
    await product.save();
    
    res.json({
      success: true,
      data: {
        coverImage: product.coverImage
      }
    });
  } catch (err) {
    console.error(err.message);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      await unlinkAsync(req.file.path);
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/products/generate/ebook
// @desc    Generate an e-book
// @access  Private
router.post(
  '/generate/ebook',
  protect,
  contentGenerationLimiter,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        title,
        description,
        category,
        outline,
        price = 9.99,
        tags = [],
        status = 'draft'
      } = req.body;

      const result = await productGenerator.generateEbook(req.user.id, {
        title,
        description,
        category,
        outline,
        price,
        tags,
        status
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.status(201).json({
        success: true,
        data: result.product
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST api/products/generate/template
// @desc    Generate a template
// @access  Private
router.post(
  '/generate/template',
  protect,
  contentGenerationLimiter,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        title,
        description,
        category,
        type = 'template',
        price = 19.99,
        tags = [],
        features = [],
        status = 'draft'
      } = req.body;

      const result = await productGenerator.generateTemplate(req.user.id, {
        title,
        description,
        category,
        type,
        price,
        tags,
        features,
        status
      });

      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      res.status(201).json({
        success: true,
        data: result.product
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   POST api/products/generate/sales-page/:id
// @desc    Generate sales page content for a product
// @access  Private
router.post('/generate/sales-page/:id', protect, contentGenerationLimiter, async (req, res) => {
  try {
    const product = await DigitalProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Get user for API key
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Generate sales page content
    const result = await productGenerator.generateSalesPageContent(
      product.title,
      product.description,
      product.category,
      product.tags,
      user.apiKeys?.openai
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    // Update product with sales page content
    product.salesPage = result.salesPage;
    await product.save();
    
    res.json({
      success: true,
      data: result.salesPage
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/products/generate/full-ebook/:id
// @desc    Generate full e-book content
// @access  Private
router.post('/generate/full-ebook/:id', protect, contentGenerationLimiter, async (req, res) => {
  try {
    const result = await productGenerator.generateFullEbookContent(req.user.id, req.params.id);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/products/generate/auto
// @desc    Generate a product based on user settings
// @access  Private
router.post('/generate/auto', protect, contentGenerationLimiter, async (req, res) => {
  try {
    const result = await productGenerator.generateProductFromSettings(req.user.id);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.status(201).json({
      success: true,
      data: result.product
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT api/products/:id/publish
// @desc    Publish a digital product
// @access  Private
router.put('/:id/publish', protect, async (req, res) => {
  try {
    let product = await DigitalProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Check if product has a file
    if (!product.filePath) {
      return res.status(400).json({ success: false, error: 'Product file is required before publishing' });
    }
    
    // Update product status to published
    product = await DigitalProduct.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status: 'published',
          publishedAt: Date.now()
        } 
      },
      { new: true }
    );
    
    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   PUT api/products/:id/performance
// @desc    Update product performance metrics
// @access  Private
router.put('/:id/performance', protect, async (req, res) => {
  try {
    let product = await DigitalProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    const { views, sales, revenue, refunds, averageRating } = req.body;
    
    // Update performance metrics
    const updateData = {};
    if (views !== undefined) updateData['performance.views'] = views;
    if (sales !== undefined) updateData['performance.sales'] = sales;
    if (revenue !== undefined) updateData['performance.revenue'] = revenue;
    if (refunds !== undefined) updateData['performance.refunds'] = refunds;
    if (averageRating !== undefined) updateData['performance.averageRating'] = averageRating;
    
    // Calculate conversion rate
    if (views !== undefined && sales !== undefined) {
      updateData['performance.conversionRate'] = views > 0 ? (sales / views) * 100 : 0;
    }
    
    // Update product
    product = await DigitalProduct.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

