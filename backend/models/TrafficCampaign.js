const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  channels: {
    type: [String],
    default: []
  },
  metrics: {
    estimatedTraffic: {
      type: Number,
      default: 0
    },
    estimatedClicks: {
      type: Number,
      default: 0
    },
    estimatedConversions: {
      type: Number,
      default: 0
    },
    actualTraffic: {
      type: Number,
      default: 0
    },
    actualClicks: {
      type: Number,
      default: 0
    },
    actualConversions: {
      type: Number,
      default: 0
    }
  }
}, { _id: false });

const TrafficCampaignSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  contentType: {
    type: String,
    enum: ['blog-post', 'article', 'social-post', 'product-review', 'email', 'landing-page'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'failed'],
    default: 'active'
  },
  channels: {
    social: {
      enabled: {
        type: Boolean,
        default: true
      },
      platforms: {
        type: [String],
        default: ['twitter', 'facebook', 'linkedin']
      },
      frequency: {
        type: String,
        enum: ['once', 'daily', 'weekly'],
        default: 'once'
      }
    },
    seo: {
      enabled: {
        type: Boolean,
        default: true
      }
    },
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['once', 'weekly', 'monthly'],
        default: 'once'
      }
    },
    backlinks: {
      enabled: {
        type: Boolean,
        default: true
      },
      target: {
        type: Number,
        default: 5
      }
    }
  },
  targetAudience: {
    type: [String],
    default: []
  },
  keywords: {
    type: [String],
    default: []
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  lastRun: {
    type: Date
  },
  nextRun: {
    type: Date
  },
  runCount: {
    type: Number,
    default: 0
  },
  results: [ResultSchema],
  performance: {
    totalTraffic: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    totalConversions: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster queries
TrafficCampaignSchema.index({ user: 1, content: 1 }, { unique: true });
TrafficCampaignSchema.index({ status: 1 });
TrafficCampaignSchema.index({ contentType: 1 });
TrafficCampaignSchema.index({ lastRun: 1 });

// Virtual for campaign duration
TrafficCampaignSchema.virtual('duration').get(function() {
  if (!this.endDate) {
    return null;
  }
  
  return Math.floor((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)); // Duration in days
});

// Method to check if campaign is active
TrafficCampaignSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Method to check if campaign is due for execution
TrafficCampaignSchema.methods.isDueForExecution = function() {
  if (this.status !== 'active') {
    return false;
  }
  
  if (!this.lastRun) {
    return true;
  }
  
  const now = new Date();
  const hoursSinceLastRun = (now - this.lastRun) / (1000 * 60 * 60);
  
  // Run at least every 24 hours
  return hoursSinceLastRun >= 24;
};

// Method to update performance metrics
TrafficCampaignSchema.methods.updatePerformance = function() {
  if (!this.results || this.results.length === 0) {
    return;
  }
  
  let totalTraffic = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  
  this.results.forEach(result => {
    totalTraffic += result.metrics.actualTraffic || result.metrics.estimatedTraffic || 0;
    totalClicks += result.metrics.actualClicks || result.metrics.estimatedClicks || 0;
    totalConversions += result.metrics.actualConversions || result.metrics.estimatedConversions || 0;
  });
  
  this.performance.totalTraffic = totalTraffic;
  this.performance.totalClicks = totalClicks;
  this.performance.totalConversions = totalConversions;
  this.performance.conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
};

// Static method to find campaigns due for execution
TrafficCampaignSchema.statics.findDueForExecution = async function() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.find({
    status: 'active',
    $or: [
      { lastRun: { $lt: twentyFourHoursAgo } },
      { lastRun: { $exists: false } }
    ]
  }).populate('content');
};

// Pre-save hook to update performance metrics
TrafficCampaignSchema.pre('save', function(next) {
  this.updatePerformance();
  next();
});

module.exports = mongoose.model('TrafficCampaign', TrafficCampaignSchema);

