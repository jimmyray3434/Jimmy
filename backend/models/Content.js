const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['blog-post', 'article', 'social-post', 'product-review', 'email', 'landing-page'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  content: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  featuredImage: {
    type: String
  },
  url: {
    type: String,
    trim: true
  },
  keywords: {
    type: [String],
    default: []
  },
  targetAudience: {
    type: [String],
    default: []
  },
  categories: {
    type: [String],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  seoTitle: {
    type: String,
    trim: true
  },
  seoDescription: {
    type: String,
    trim: true
  },
  publishedAt: {
    type: Date
  },
  lastTrafficGeneration: {
    type: Date
  },
  performance: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiPrompt: {
    type: String
  },
  aiModel: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for faster queries
ContentSchema.index({ user: 1, createdAt: -1 });
ContentSchema.index({ user: 1, status: 1 });
ContentSchema.index({ user: 1, type: 1 });
ContentSchema.index({ user: 1, keywords: 1 });
ContentSchema.index({ user: 1, tags: 1 });
ContentSchema.index({ user: 1, 'performance.views': -1 });

// Virtual for content age in days
ContentSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for days since publication
ContentSchema.virtual('daysSincePublication').get(function() {
  if (!this.publishedAt) return null;
  return Math.floor((new Date() - this.publishedAt) / (1000 * 60 * 60 * 24));
});

// Method to check if content is published
ContentSchema.methods.isPublished = function() {
  return this.status === 'published';
};

// Method to publish content
ContentSchema.methods.publish = async function() {
  this.status = 'published';
  this.publishedAt = new Date();
  await this.save();
  return this;
};

// Method to archive content
ContentSchema.methods.archive = async function() {
  this.status = 'archived';
  await this.save();
  return this;
};

// Method to update performance metrics
ContentSchema.methods.updatePerformance = async function(metrics) {
  if (metrics.views !== undefined) {
    this.performance.views += metrics.views;
  }
  
  if (metrics.clicks !== undefined) {
    this.performance.clicks += metrics.clicks;
  }
  
  if (metrics.conversions !== undefined) {
    this.performance.conversions += metrics.conversions;
  }
  
  if (metrics.revenue !== undefined) {
    this.performance.revenue += metrics.revenue;
  }
  
  await this.save();
  return this;
};

// Static method to find content by keyword
ContentSchema.statics.findByKeyword = function(userId, keyword) {
  return this.find({ user: userId, keywords: keyword });
};

// Static method to find content by tag
ContentSchema.statics.findByTag = function(userId, tag) {
  return this.find({ user: userId, tags: tag });
};

// Static method to find content by type
ContentSchema.statics.findByType = function(userId, type) {
  return this.find({ user: userId, type });
};

// Static method to find top performing content
ContentSchema.statics.findTopPerforming = function(userId, metric = 'views', limit = 10) {
  return this.find({ user: userId, status: 'published' })
    .sort({ [`performance.${metric}`]: -1 })
    .limit(limit);
};

// Static method to find content due for traffic generation
ContentSchema.statics.findDueForTrafficGeneration = function(userId, hours = 24) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);
  
  return this.find({
    user: userId,
    status: 'published',
    $or: [
      { lastTrafficGeneration: { $lt: cutoffDate } },
      { lastTrafficGeneration: { $exists: false } }
    ]
  });
};

module.exports = mongoose.model('Content', ContentSchema);

