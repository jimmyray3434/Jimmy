const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['welcome', 'follow_up', 'newsletter', 'promotion', 'abandoned_cart', 'other'],
    default: 'other'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  isHtml: {
    type: Boolean,
    default: true
  },
  variables: {
    type: [String],
    default: []
  },
  preheader: {
    type: String,
    trim: true
  },
  fromName: {
    type: String,
    trim: true
  },
  replyTo: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'draft'
  },
  stats: {
    timesUsed: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    },
    openRate: {
      type: Number,
      default: 0
    },
    clickRate: {
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

// Indexes for faster queries
EmailTemplateSchema.index({ user: 1, category: 1 });
EmailTemplateSchema.index({ user: 1, status: 1 });
EmailTemplateSchema.index({ user: 1, 'stats.timesUsed': -1 });

// Virtual for template age in days
EmailTemplateSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to check if template is active
EmailTemplateSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Method to activate template
EmailTemplateSchema.methods.activate = async function() {
  this.status = 'active';
  await this.save();
  return this;
};

// Method to archive template
EmailTemplateSchema.methods.archive = async function() {
  this.status = 'archived';
  await this.save();
  return this;
};

// Method to record usage
EmailTemplateSchema.methods.recordUsage = async function() {
  this.stats.timesUsed += 1;
  this.stats.lastUsed = new Date();
  await this.save();
  return this;
};

// Method to update open rate
EmailTemplateSchema.methods.updateOpenRate = async function(openRate) {
  this.stats.openRate = openRate;
  await this.save();
  return this;
};

// Method to update click rate
EmailTemplateSchema.methods.updateClickRate = async function(clickRate) {
  this.stats.clickRate = clickRate;
  await this.save();
  return this;
};

// Method to render template with variables
EmailTemplateSchema.methods.render = function(data = {}) {
  let rendered = this.body;
  
  // Replace variables in the format {{variable}}
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, data[key]);
  });
  
  return rendered;
};

// Static method to find templates by category
EmailTemplateSchema.statics.findByCategory = function(userId, category) {
  return this.find({ user: userId, category, status: 'active' });
};

// Static method to find most used templates
EmailTemplateSchema.statics.findMostUsed = function(userId, limit = 10) {
  return this.find({ user: userId, status: 'active' })
    .sort({ 'stats.timesUsed': -1 })
    .limit(limit);
};

// Static method to find templates with highest open rate
EmailTemplateSchema.statics.findHighestOpenRate = function(userId, limit = 10) {
  return this.find({ 
    user: userId, 
    status: 'active',
    'stats.timesUsed': { $gt: 0 } // Only include templates that have been used
  })
    .sort({ 'stats.openRate': -1 })
    .limit(limit);
};

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema);

