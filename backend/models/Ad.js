const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  targetAudience: {
    demographics: {
      ageRange: {
        min: {
          type: Number,
          min: 13,
          max: 100,
          default: 18
        },
        max: {
          type: Number,
          min: 13,
          max: 100,
          default: 65
        }
      },
      gender: {
        type: String,
        enum: ['all', 'male', 'female', 'other'],
        default: 'all'
      },
      locations: [{
        type: String,
        trim: true
      }]
    },
    interests: [{
      type: String,
      trim: true
    }],
    behaviors: [{
      type: String,
      trim: true
    }]
  },
  budget: {
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    dailyLimit: {
      type: Number,
      min: 0
    }
  },
  schedule: {
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  creativeAssets: {
    images: [{
      url: {
        type: String,
        trim: true
      },
      altText: {
        type: String,
        trim: true
      }
    }],
    videos: [{
      url: {
        type: String,
        trim: true
      },
      thumbnailUrl: {
        type: String,
        trim: true
      }
    }],
    copyText: {
      headline: {
        type: String,
        trim: true,
        maxlength: 100
      },
      body: {
        type: String,
        trim: true,
        maxlength: 300
      },
      callToAction: {
        type: String,
        trim: true,
        maxlength: 50
      }
    }
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
    ctr: {
      type: Number,
      default: 0
    },
    cpc: {
      type: Number,
      default: 0
    },
    spend: {
      type: Number,
      default: 0
    }
  },
  aiRecommendations: {
    optimizationTips: [{
      type: String,
      trim: true
    }],
    targetingAdjustments: [{
      type: String,
      trim: true
    }],
    budgetRecommendations: {
      type: String,
      trim: true
    },
    performanceInsights: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Virtual for CTR calculation
adSchema.virtual('calculatedCTR').get(function() {
  if (this.performance.impressions === 0) return 0;
  return (this.performance.clicks / this.performance.impressions) * 100;
});

// Virtual for CPC calculation
adSchema.virtual('calculatedCPC').get(function() {
  if (this.performance.clicks === 0) return 0;
  return this.performance.spend / this.performance.clicks;
});

// Method to update performance metrics
adSchema.methods.updatePerformance = function(metrics) {
  this.performance = {
    ...this.performance,
    ...metrics
  };
  
  // Recalculate derived metrics
  if (this.performance.impressions > 0) {
    this.performance.ctr = (this.performance.clicks / this.performance.impressions) * 100;
  }
  
  if (this.performance.clicks > 0) {
    this.performance.cpc = this.performance.spend / this.performance.clicks;
  }
  
  return this.save();
};

module.exports = mongoose.model('Ad', adSchema);

