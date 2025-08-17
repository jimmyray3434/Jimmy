const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  contentMetrics: {
    totalViews: {
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
    }
  },
  affiliateMetrics: {
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
    clickThroughRate: {
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
  productMetrics: {
    views: {
      type: Number,
      default: 0
    },
    sales: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    refunds: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    }
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  topPerformingContent: [{
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    title: String,
    views: Number,
    revenue: Number
  }],
  topPerformingProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DigitalProduct'
    },
    title: String,
    sales: Number,
    revenue: Number
  }],
  topPerformingAffiliates: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AffiliateProduct'
    },
    name: String,
    clicks: Number,
    conversions: Number,
    revenue: Number
  }]
});

// Calculate metrics before saving
AnalyticsSchema.pre('save', function(next) {
  // Calculate affiliate metrics
  const affiliate = this.affiliateMetrics;
  if (affiliate.impressions > 0) {
    affiliate.clickThroughRate = (affiliate.clicks / affiliate.impressions) * 100;
  }
  if (affiliate.clicks > 0) {
    affiliate.conversionRate = (affiliate.conversions / affiliate.clicks) * 100;
    affiliate.earningsPerClick = affiliate.revenue / affiliate.clicks;
  }
  
  // Calculate product metrics
  const product = this.productMetrics;
  if (product.views > 0) {
    product.conversionRate = (product.sales / product.views) * 100;
  }
  if (product.sales > 0) {
    product.averageOrderValue = product.revenue / product.sales;
  }
  
  // Calculate total revenue
  this.totalRevenue = affiliate.revenue + product.revenue;
  
  next();
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);

