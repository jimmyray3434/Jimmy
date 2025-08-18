const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'content-generation',
      'content-publishing',
      'affiliate-update',
      'product-generation',
      'analytics-collection',
      'social-posting',
      'email-sending',
      'maintenance'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  result: {
    success: {
      type: Boolean,
      default: false
    },
    message: String,
    data: mongoose.Schema.Types.Mixed,
    error: String
  },
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for finding tasks to process
TaskSchema.index({ status: 1, scheduledFor: 1, priority: -1 });

// Index for user's tasks
TaskSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Task', TaskSchema);

