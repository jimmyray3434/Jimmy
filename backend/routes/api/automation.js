const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { protect } = require('../../middleware/auth');
const { apiLimiter } = require('../../middleware/rateLimit');
const Task = require('../models/Task');
const scheduler = require('../services/scheduler');

// @route   GET api/automation/tasks
// @desc    Get all tasks for a user
// @access  Private
router.get('/tasks', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const result = await scheduler.getUserTasks(
      req.user.id,
      status,
      parseInt(limit),
      parseInt(page)
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.json({
      success: true,
      count: result.count,
      total: result.total,
      pagination: result.pagination,
      data: result.tasks
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET api/automation/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/automation/tasks
// @desc    Create a new task
// @access  Private
router.post(
  '/tasks',
  protect,
  apiLimiter,
  [
    check('type', 'Task type is required').isIn([
      'content-generation',
      'content-publishing',
      'affiliate-update',
      'product-generation',
      'analytics-collection',
      'social-posting',
      'email-sending',
      'maintenance'
    ]),
    check('data', 'Task data is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { type, data, scheduledFor, priority = 2 } = req.body;
      
      // Parse scheduled date
      let scheduledDate = new Date();
      if (scheduledFor) {
        scheduledDate = new Date(scheduledFor);
        if (isNaN(scheduledDate.getTime())) {
          return res.status(400).json({ success: false, error: 'Invalid scheduled date' });
        }
      }
      
      // Schedule task
      const result = await scheduler.scheduleTask(
        req.user.id,
        type,
        data,
        scheduledDate,
        priority
      );
      
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      
      res.status(201).json({
        success: true,
        data: result.task
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
);

// @route   DELETE api/automation/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    // Check if task belongs to user
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    // Check if task can be deleted
    if (task.status === 'in-progress') {
      return res.status(400).json({ success: false, error: 'Cannot delete a task in progress' });
    }
    
    await task.remove();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/automation/generate-content
// @desc    Schedule content generation task
// @access  Private
router.post('/generate-content', protect, apiLimiter, async (req, res) => {
  try {
    // Schedule content generation task
    const result = await scheduler.scheduleTask(
      req.user.id,
      'content-generation',
      req.body,
      new Date(),
      3
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.status(201).json({
      success: true,
      message: 'Content generation task scheduled',
      data: result.task
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/automation/update-affiliates
// @desc    Schedule affiliate update task
// @access  Private
router.post('/update-affiliates', protect, apiLimiter, async (req, res) => {
  try {
    // Schedule affiliate update task
    const result = await scheduler.scheduleTask(
      req.user.id,
      'affiliate-update',
      req.body,
      new Date(),
      2
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.status(201).json({
      success: true,
      message: 'Affiliate update task scheduled',
      data: result.task
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/automation/generate-product
// @desc    Schedule product generation task
// @access  Private
router.post('/generate-product', protect, apiLimiter, async (req, res) => {
  try {
    // Schedule product generation task
    const result = await scheduler.scheduleTask(
      req.user.id,
      'product-generation',
      req.body,
      new Date(),
      2
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.status(201).json({
      success: true,
      message: 'Product generation task scheduled',
      data: result.task
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/automation/collect-analytics
// @desc    Schedule analytics collection task
// @access  Private
router.post('/collect-analytics', protect, apiLimiter, async (req, res) => {
  try {
    // Schedule analytics collection task
    const result = await scheduler.scheduleTask(
      req.user.id,
      'analytics-collection',
      req.body,
      new Date(),
      1
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.status(201).json({
      success: true,
      message: 'Analytics collection task scheduled',
      data: result.task
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   POST api/automation/maintenance
// @desc    Schedule maintenance task
// @access  Private
router.post('/maintenance', protect, apiLimiter, async (req, res) => {
  try {
    // Schedule maintenance task
    const result = await scheduler.scheduleTask(
      req.user.id,
      'maintenance',
      req.body,
      new Date(),
      1
    );
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    
    res.status(201).json({
      success: true,
      message: 'Maintenance task scheduled',
      data: result.task
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;

