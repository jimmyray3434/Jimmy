const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const analyticsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    default: 'daily'
  },
  metrics: {
    revenue: {
      type: Number,
      default: 0
    },
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
    ctr: {
      type: Number,
      default: 0
    },
    cpc: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    costPerConversion: {
      type: Number,
      default: 0
    },
    roi: {
      type: Number,
      default: 0
    }
  },
  adPerformance: [{
    adId: {
      type: Schema.Types.ObjectId,
      ref: 'Ad'
    },
    title: String,
    impressions: Number,
    clicks: Number,
    conversions: Number,
    spend: Number,
    ctr: Number,
    cpc: Number
  }],
  audienceInsights: {
    demographics: {
      ageGroups: [{
        range: String,
        percentage: Number
      }],
      genders: [{
        type: String,
        percentage: Number
      }],
      locations: [{
        name: String,
        percentage: Number
      }]
    },
    interests: [{
      name: String,
      percentage: Number
    }],
    devices: [{
      type: String,
      percentage: Number
    }]
  },
  campaignPerformance: [{
    name: String,
    impressions: Number,
    clicks: Number,
    conversions: Number,
    spend: Number,
    ctr: Number,
    cpc: Number
  }]
}, {
  timestamps: true
});

// Method to calculate derived metrics
analyticsSchema.methods.calculateDerivedMetrics = function() {
  const m = this.metrics;
  
  // Calculate CTR
  if (m.impressions > 0) {
    m.ctr = (m.clicks / m.impressions) * 100;
  }
  
  // Calculate CPC
  if (m.clicks > 0) {
    m.cpc = m.revenue / m.clicks;
  }
  
  // Calculate conversion rate
  if (m.clicks > 0) {
    m.conversionRate = (m.conversions / m.clicks) * 100;
  }
  
  // Calculate cost per conversion
  if (m.conversions > 0) {
    m.costPerConversion = m.revenue / m.conversions;
  }
  
  // Calculate ROI (assuming revenue is cost and we have a separate revenue field)
  // This is a simplified calculation
  if (m.revenue > 0) {
    m.roi = ((m.conversions * 50) - m.revenue) / m.revenue * 100; // Assuming $50 value per conversion
  }
  
  return this.save();
};

// Static method to generate random analytics data for demo purposes
analyticsSchema.statics.generateDemoData = async function(userId, period = 'daily', days = 30) {
  const Analytics = this;
  const data = [];
  
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate random metrics with some trend
    const factor = Math.max(0.5, 1 - (i / (days * 2))); // Decreasing factor for older dates
    
    const impressions = Math.floor(Math.random() * 10000 * factor) + 1000;
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01)); // 1-6% CTR
    const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.05)); // 5-15% conversion rate
    const revenue = Math.floor(clicks * (Math.random() * 1.5 + 0.5)); // $0.50-$2.00 CPC
    
    const analytics = new Analytics({
      user: userId,
      date: date,
      period: period,
      metrics: {
        revenue: revenue,
        impressions: impressions,
        clicks: clicks,
        conversions: conversions
      }
    });
    
    // Calculate derived metrics
    analytics.calculateDerivedMetrics();
    
    data.push(analytics);
  }
  
  // Save all the generated data
  await Analytics.insertMany(data);
  
  return data;
};

module.exports = mongoose.model('Analytics', analyticsSchema);

