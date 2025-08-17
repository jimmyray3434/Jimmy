const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  type: {
    type: String,
    enum: ['blog', 'social', 'product-review', 'ebook', 'email'],
    required: [true, 'Please specify content type']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft'
  },
  niche: {
    type: String,
    required: [true, 'Please specify a niche']
  },
  keywords: [String],
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  summary: String,
  seoTitle: String,
  seoDescription: String,
  featuredImage: String,
  publishDate: Date,
  platforms: [{
    name: {
      type: String,
      enum: ['website', 'medium', 'wordpress', 'facebook', 'twitter', 'instagram', 'linkedin'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'failed'],
      default: 'pending'
    },
    publishedUrl: String,
    publishedDate: Date,
    error: String
  }],
  affiliateLinks: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AffiliateProduct'
    },
    network: String,
    url: String,
    anchor: String,
    position: String,
    impressions: {
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
  }],
  performance: {
    views: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    averageTimeOnPage: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0
    },
    socialShares: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  generationPrompt: String,
  generationSettings: {
    model: String,
    temperature: Number,
    maxTokens: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set updatedAt before saving
ContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Content', ContentSchema);

