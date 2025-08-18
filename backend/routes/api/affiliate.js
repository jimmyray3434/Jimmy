const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { protect } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimit');
const AffiliateProduct = require('../../models/AffiliateProduct');
const User = require('../../models/User');
const affiliateNetworks = require('../../services/affiliateNetworks');

// @route   POST api/affiliate/products
// @desc    Create a new affiliate product
// @access  Private
router.post(
  '/products',
  protect,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('network', 'Network is required').isIn(['amazon', 'shareasale', 'cj', 'rakuten', 'awin', 'other']),
    check('productUrl', 'Product URL is required').isURL(),
    check('affiliateUrl', 'Affiliate URL is required').isURL()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const {
        name,
        description,
        category,
        network,
        productUrl,
        affiliateUrl,
        imageUrl,
        price,
        currency,
        commissionRate,
        commissionType,
        tags,
        rating
      } = req.body;

      const newProduct = new AffiliateProduct({
        user: req.user.id,
        name,
        description,
        category,
        network,
        productUrl,
        affiliateUrl,
        imageUrl,
        price,
        currency,
        commissionRate,
        commissionType,
        tags,
        rating
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

// @route   GET api/affiliate/products
// @desc    Get all affiliate products for a user
// @access  Private
router.get('/products', protect, async (req, res) => {
  try {
    const { network, category, isActive, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { user: req.user.id };
    if (network) query.network = network;
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get products with pagination
    const products = await AffiliateProduct.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await AffiliateProduct.countDocuments(query);
    
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

// @route   GET api/affiliate/products/:id
// @desc    Get affiliate product by ID
// @access  Private
router.get('/products/:id', protect, async (req, res) => {
  try {
    const product = await AffiliateProduct.findById(req.params.id);
    
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

// @route   PUT api/affiliate/products/:id
// @desc    Update affiliate product
// @access  Private
router.put('/products/:id', protect, async (req, res) => {
  try {
    let product = await AffiliateProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Update product
    product = await AffiliateProduct.findByIdAndUpdate(
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

// @route   DELETE api/affiliate/products/:id
// @desc    Delete affiliate product
// @access  Private
router.delete('/products/:id', protect, async (req, res) => {
  try {
    const product = await AffiliateProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
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

// @route   PUT api/affiliate/products/:id/performance
// @desc    Update affiliate product performance metrics
// @access  Private
router.put('/products/:id/performance', protect, async (req, res) => {
  try {
    let product = await AffiliateProduct.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    const { impressions, clicks, conversions, revenue } = req.body;
    
    // Update performance metrics
    const updateData = {};
    if (impressions !== undefined) updateData['performance.impressions'] = impressions;
    if (clicks !== undefined) updateData['performance.clicks'] = clicks;
    if (conversions !== undefined) updateData['performance.conversions'] = conversions;
    if (revenue !== undefined) updateData['performance.revenue'] = revenue;
    
    // Update product
    product = await AffiliateProduct.findByIdAndUpdate(
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

// @route   GET api/affiliate/search
// @desc    Search for affiliate products across networks
// @access  Private
router.get('/search', protect, apiLimiter, async (req, res) => {
  try {
    const { 
      keywords,
      category,
      minCommissionRate,
      maxPrice,
      networks,
      limit = 10
    } = req.query;
    
    if (!keywords) {
      return res.status(400).json({ success: false, error: 'Keywords are required' });
    }
    
    // Get user API keys
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const userApiKeys = user.apiKeys || {};
    
    // Parse networks if provided
    let networksArray = ['amazon', 'shareasale'];
    if (networks) {
      networksArray = networks.split(',').map(n => n.trim().toLowerCase());
    }
    
    // Search for products
    const results = await affiliateNetworks.findAffiliateProducts(
      keywords,
      {
        category,
        minCommissionRate: minCommissionRate ? parseFloat(minCommissionRate) : 0,
        maxPrice: maxPrice ? parseFloat(maxPrice) : 0,
        networks: networksArray,
        limit: parseInt(limit)
      },
      userApiKeys
    );
    
    if (!results.success) {
      return res.status(400).json({ success: false, error: results.error });
    }
    
    res.json({
      success: true,
      count: results.products.length,
      total: results.total,
      data: results.products
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/affiliate/import
// @desc    Import affiliate products from search results
// @access  Private
router.post('/import', protect, async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, error: 'Products array is required' });
    }
    
    // Get user API keys
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const userApiKeys = user.apiKeys || {};
    
    // Import products
    const importedProducts = [];
    
    for (const product of products) {
      const {
        name,
        description,
        category,
        network,
        productUrl,
        price,
        currency,
        imageUrl,
        rating,
        commissionRate,
        commissionType,
        merchantId,
        productId,
        tags
      } = product;
      
      // Generate affiliate link
      const affiliateUrl = affiliateNetworks.generateAffiliateLink(
        network,
        productId,
        merchantId,
        userApiKeys
      );
      
      // Create new product
      const newProduct = new AffiliateProduct({
        user: req.user.id,
        name,
        description,
        category,
        network,
        productUrl,
        affiliateUrl: affiliateUrl || productUrl,
        imageUrl,
        price,
        currency,
        commissionRate,
        commissionType,
        tags,
        rating
      });
      
      await newProduct.save();
      importedProducts.push(newProduct);
    }
    
    res.status(201).json({
      success: true,
      count: importedProducts.length,
      data: importedProducts
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET api/affiliate/stats
// @desc    Get affiliate statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // Get total products
    const totalProducts = await AffiliateProduct.countDocuments({ user: req.user.id });
    
    // Get products by network
    const networkStats = await AffiliateProduct.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: '$network', count: { $sum: 1 } } }
    ]);
    
    // Get performance totals
    const performanceStats = await AffiliateProduct.aggregate([
      { $match: { user: req.user.id } },
      { 
        $group: { 
          _id: null, 
          totalImpressions: { $sum: '$performance.impressions' },
          totalClicks: { $sum: '$performance.clicks' },
          totalConversions: { $sum: '$performance.conversions' },
          totalRevenue: { $sum: '$performance.revenue' }
        } 
      }
    ]);
    
    // Get top performing products
    const topProducts = await AffiliateProduct.find({ user: req.user.id })
      .sort({ 'performance.revenue': -1 })
      .limit(5);
    
    // Calculate overall metrics
    let overallClickThroughRate = 0;
    let overallConversionRate = 0;
    let overallEarningsPerClick = 0;
    
    if (performanceStats.length > 0) {
      const { totalImpressions, totalClicks, totalConversions, totalRevenue } = performanceStats[0];
      
      if (totalImpressions > 0) {
        overallClickThroughRate = (totalClicks / totalImpressions) * 100;
      }
      
      if (totalClicks > 0) {
        overallConversionRate = (totalConversions / totalClicks) * 100;
        overallEarningsPerClick = totalRevenue / totalClicks;
      }
    }
    
    res.json({
      success: true,
      data: {
        totalProducts,
        networkStats,
        performance: performanceStats.length > 0 ? performanceStats[0] : {
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0
        },
        metrics: {
          clickThroughRate: overallClickThroughRate,
          conversionRate: overallConversionRate,
          earningsPerClick: overallEarningsPerClick
        },
        topProducts
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

