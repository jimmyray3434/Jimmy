const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['note', 'email', 'task', 'call', 'meeting', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: true });

const LeadSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'qualified', 'disqualified', 'converted'],
    default: 'new'
  },
  source: {
    type: String,
    enum: ['website', 'social', 'referral', 'email', 'ad', 'other'],
    default: 'website'
  },
  score: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  },
  activity: [ActivitySchema],
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  qualifiedAt: {
    type: Date
  },
  disqualifiedAt: {
    type: Date
  },
  convertedAt: {
    type: Date
  },
  convertedContactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  lastActivityDate: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for faster queries
LeadSchema.index({ user: 1, createdAt: -1 });
LeadSchema.index({ user: 1, email: 1 });
LeadSchema.index({ user: 1, status: 1 });
LeadSchema.index({ user: 1, source: 1 });
LeadSchema.index({ user: 1, tags: 1 });

// Virtual for lead age in days
LeadSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to check if lead is qualified
LeadSchema.methods.isQualified = function() {
  return this.status === 'qualified';
};

// Method to check if lead is converted
LeadSchema.methods.isConverted = function() {
  return this.status === 'converted';
};

// Method to add activity
LeadSchema.methods.addActivity = async function(activity) {
  this.activity.push(activity);
  this.lastActivityDate = new Date();
  await this.save();
  return this;
};

// Method to update lead score
LeadSchema.methods.updateScore = async function(newScore) {
  this.score = newScore;
  await this.save();
  return this;
};

// Static method to find leads by email
LeadSchema.statics.findByEmail = function(userId, email) {
  return this.findOne({ user: userId, email });
};

// Static method to find leads by tag
LeadSchema.statics.findByTag = function(userId, tag) {
  return this.find({ user: userId, tags: tag });
};

// Static method to find leads by status
LeadSchema.statics.findByStatus = function(userId, status) {
  return this.find({ user: userId, status });
};

// Static method to find leads by source
LeadSchema.statics.findBySource = function(userId, source) {
  return this.find({ user: userId, source });
};

// Static method to find leads without activity in the last X days
LeadSchema.statics.findInactive = function(userId, days) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    user: userId,
    $or: [
      { lastActivityDate: { $lt: cutoffDate } },
      { lastActivityDate: { $exists: false } }
    ]
  });
};

module.exports = mongoose.model('Lead', LeadSchema);

