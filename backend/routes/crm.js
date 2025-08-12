const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Client = require('../models/Client');
const { auth, requireActiveSubscription } = require('../middleware/auth');

const router = express.Router();

// Apply auth and subscription check to all routes
router.use(auth);
router.use(requireActiveSubscription);

// @route   GET /api/crm/clients
// @desc    Get all clients for the authenticated user
// @access  Private
router.get('/clients', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['lead', 'prospect', 'active', 'inactive', 'lost']).withMessage('Invalid status'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search query cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    let query = { assignedTo: req.user.userId, isActive: true };

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
        { phone: searchRegex }
      ];
    }

    const clients = await Client.find(query)
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Client.countDocuments(query);

    // Calculate summary statistics
    const stats = await Client.aggregate([
      { $match: { assignedTo: req.user.userId, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalSpent' }
        }
      }
    ]);

    res.json({
      success: true,
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/crm/clients/:id
// @desc    Get a specific client
// @access  Private
router.get('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      assignedTo: req.user.userId,
      isActive: true
    })
    .populate('assignedTo', 'name email')
    .populate('communications.createdBy', 'name')
    .populate('notes.createdBy', 'name');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      client
    });

  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/crm/clients
// @desc    Create a new client
// @access  Private
router.post('/clients', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('status')
    .optional()
    .isIn(['lead', 'prospect', 'active', 'inactive', 'lost'])
    .withMessage('Invalid status'),
  body('source')
    .optional()
    .isIn(['website', 'referral', 'social_media', 'advertising', 'cold_outreach', 'event', 'other'])
    .withMessage('Invalid source')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if client with this email already exists for this user
    const existingClient = await Client.findOne({
      email: req.body.email,
      assignedTo: req.user.userId,
      isActive: true
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    const clientData = {
      ...req.body,
      assignedTo: req.user.userId,
      createdBy: req.user.userId
    };

    const client = new Client(clientData);
    await client.save();

    await client.populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client
    });

  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/crm/clients/:id
// @desc    Update a client
// @access  Private
router.put('/clients/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  body('status')
    .optional()
    .isIn(['lead', 'prospect', 'active', 'inactive', 'lost'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const client = await Client.findOne({
      _id: req.params.id,
      assignedTo: req.user.userId,
      isActive: true
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (req.body.email && req.body.email !== client.email) {
      const existingClient = await Client.findOne({
        email: req.body.email,
        assignedTo: req.user.userId,
        isActive: true,
        _id: { $ne: req.params.id }
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Another client with this email already exists'
        });
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'email', 'phone', 'company', 'website', 'address',
      'industry', 'companySize', 'annualRevenue', 'status', 'source',
      'totalSpent', 'averageOrderValue', 'lifetimeValue', 'nextFollowUpDate',
      'tags', 'customFields'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'Client updated successfully',
      client: updatedClient
    });

  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/crm/clients/:id
// @desc    Delete a client (soft delete)
// @access  Private
router.delete('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      assignedTo: req.user.userId,
      isActive: true
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    client.isActive = false;
    await client.save();

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/crm/clients/:id/communications
// @desc    Add communication to a client
// @access  Private
router.post('/clients/:id/communications', [
  body('type')
    .isIn(['email', 'phone', 'meeting', 'note', 'task'])
    .withMessage('Invalid communication type'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const client = await Client.findOne({
      _id: req.params.id,
      assignedTo: req.user.userId,
      isActive: true
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const communicationData = {
      ...req.body,
      createdBy: req.user.userId
    };

    await client.addCommunication(communicationData);

    res.status(201).json({
      success: true,
      message: 'Communication added successfully',
      client
    });

  } catch (error) {
    console.error('Add communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/crm/clients/:id/notes
// @desc    Add note to a client
// @access  Private
router.post('/clients/:id/notes', [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note content must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const client = await Client.findOne({
      _id: req.params.id,
      assignedTo: req.user.userId,
      isActive: true
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    await client.addNote(req.body.content, req.user.userId);

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      client
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/crm/dashboard
// @desc    Get CRM dashboard data
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get client statistics
    const clientStats = await Client.aggregate([
      { $match: { assignedTo: userId, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalSpent' }
        }
      }
    ]);

    // Get overdue follow-ups
    const overdueFollowUps = await Client.find({
      assignedTo: userId,
      nextFollowUpDate: { $lt: new Date() },
      isActive: true
    }).countDocuments();

    // Get recent communications
    const recentCommunications = await Client.aggregate([
      { $match: { assignedTo: userId, isActive: true } },
      { $unwind: '$communications' },
      { $sort: { 'communications.createdAt': -1 } },
      { $limit: 10 },
      {
        $project: {
          clientName: '$name',
          communication: '$communications'
        }
      }
    ]);

    // Get top clients by value
    const topClients = await Client.find({
      assignedTo: userId,
      isActive: true
    })
    .sort({ totalSpent: -1 })
    .limit(5)
    .select('name company totalSpent');

    res.json({
      success: true,
      dashboard: {
        clientStats,
        overdueFollowUps,
        recentCommunications,
        topClients
      }
    });

  } catch (error) {
    console.error('Get CRM dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

