const mongoose = require('mongoose');

const AffiliateProductSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [200, 'Name cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    required: [true, 'Please add a category']
  },
  network: {
    type: String,
    enum: ['amazon', 'shareasale', 'cj', 'rakuten', 'awin', 'other'],
    required: [true, 'Please specify affiliate network']
  },
  productUrl: {
    type: String,
    required: [true, 'Please add the product URL'],
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL'
    ]
  },
  affiliateUrl: {
    type: String,
    required: [true, 'Please add the affiliate URL'],
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL'
    ]
  },
  imageUrl: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL'
    ]
  },
  price: {
    type: Number,
    min: [0, 'Price must be at least 0']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  commissionRate: {
    type: Number,
    min: [0, 'Commission rate must be at least 0'],
    max: [100, 'Commission rate cannot exceed 100']
  },
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  tags: [String],
  rating: {
    type: Number,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  performance: {
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
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    earningsPerClick: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate performance metrics before saving
AffiliateProductSchema.pre('save', function(next) {
  const performance = this.performance;
  
  // Calculate conversion rate
  if (performance.clicks > 0) {
    performance.conversionRate = (performance.conversions / performance.clicks) * 100;
  }
  
  // Calculate earnings per click
  if (performance.clicks > 0) {
    performance.earningsPerClick = performance.revenue / performance.clicks;
  }
  
  // Update last updated timestamp
  this.lastUpdated = Date.now();
  
  next();
});

module.exports = mongoose.model('AffiliateProduct', AffiliateProductSchema);

