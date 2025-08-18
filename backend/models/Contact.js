const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['note', 'email', 'task', 'call', 'meeting', 'purchase', 'other'],
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

const ContactSchema = new mongoose.Schema({
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
    enum: ['active', 'inactive', 'customer', 'prospect'],
    default: 'active'
  },
  leadSource: {
    type: String,
    enum: ['website', 'social', 'referral', 'email', 'ad', 'other'],
    default: 'website'
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
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  socialProfiles: {
    twitter: String,
    linkedin: String,
    facebook: String,
    instagram: String
  },
  customerSince: {
    type: Date
  },
  lastPurchaseDate: {
    type: Date
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
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
ContactSchema.index({ user: 1, createdAt: -1 });
ContactSchema.index({ user: 1, email: 1 }, { unique: true });
ContactSchema.index({ user: 1, status: 1 });
ContactSchema.index({ user: 1, tags: 1 });
ContactSchema.index({ user: 1, totalSpent: -1 });
ContactSchema.index({ user: 1, lastPurchaseDate: -1 });

// Virtual for contact age in days
ContactSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for days since last purchase
ContactSchema.virtual('daysSinceLastPurchase').get(function() {
  if (!this.lastPurchaseDate) return null;
  return Math.floor((new Date() - this.lastPurchaseDate) / (1000 * 60 * 60 * 24));
});

// Method to check if contact is a customer
ContactSchema.methods.isCustomer = function() {
  return this.status === 'customer';
};

// Method to add activity
ContactSchema.methods.addActivity = async function(activity) {
  this.activity.push(activity);
  this.lastActivityDate = new Date();
  await this.save();
  return this;
};

// Method to record purchase
ContactSchema.methods.recordPurchase = async function(amount) {
  this.totalPurchases += 1;
  this.totalSpent += amount;
  this.lastPurchaseDate = new Date();
  
  if (this.status !== 'customer') {
    this.status = 'customer';
    this.customerSince = new Date();
  }
  
  // Add purchase activity
  this.activity.push({
    type: 'purchase',
    description: `Purchase of $${amount.toFixed(2)}`,
    createdAt: new Date(),
    metadata: {
      amount,
      purchaseNumber: this.totalPurchases
    }
  });
  
  this.lastActivityDate = new Date();
  await this.save();
  return this;
};

// Static method to find contacts by email
ContactSchema.statics.findByEmail = function(userId, email) {
  return this.findOne({ user: userId, email });
};

// Static method to find contacts by tag
ContactSchema.statics.findByTag = function(userId, tag) {
  return this.find({ user: userId, tags: tag });
};

// Static method to find contacts by status
ContactSchema.statics.findByStatus = function(userId, status) {
  return this.find({ user: userId, status });
};

// Static method to find top customers by total spent
ContactSchema.statics.findTopCustomers = function(userId, limit = 10) {
  return this.find({ user: userId, status: 'customer' })
    .sort({ totalSpent: -1 })
    .limit(limit);
};

// Static method to find contacts without activity in the last X days
ContactSchema.statics.findInactive = function(userId, days) {
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

module.exports = mongoose.model('Contact', ContactSchema);

