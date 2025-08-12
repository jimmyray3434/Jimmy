const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'phone', 'meeting', 'note', 'task'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  scheduledDate: Date,
  completedDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const clientSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true
  },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  // Business Information
  industry: {
    type: String,
    trim: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  annualRevenue: {
    type: String,
    enum: ['<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M+']
  },

  // Relationship Information
  status: {
    type: String,
    enum: ['lead', 'prospect', 'active', 'inactive', 'lost'],
    default: 'lead'
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social_media', 'advertising', 'cold_outreach', 'event', 'other'],
    default: 'other'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Financial Information
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  lifetimeValue: {
    type: Number,
    default: 0,
    min: 0
  },

  // Engagement Metrics
  lastContactDate: Date,
  nextFollowUpDate: Date,
  engagementScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Communication History
  communications: [contactSchema],
  
  // Tags and Categories
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Custom Fields
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Notes
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
clientSchema.index({ assignedTo: 1, status: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ createdAt: -1 });
clientSchema.index({ lastContactDate: -1 });
clientSchema.index({ nextFollowUpDate: 1 });
clientSchema.index({ tags: 1 });
clientSchema.index({ 'communications.type': 1 });

// Virtual for days since last contact
clientSchema.virtual('daysSinceLastContact').get(function() {
  if (!this.lastContactDate) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.lastContactDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue follow-ups
clientSchema.virtual('isOverdue').get(function() {
  if (!this.nextFollowUpDate) return false;
  return new Date() > this.nextFollowUpDate;
});

// Method to add communication
clientSchema.methods.addCommunication = function(communicationData) {
  this.communications.push(communicationData);
  this.lastContactDate = new Date();
  
  // Update engagement score based on communication frequency
  this.updateEngagementScore();
  
  return this.save();
};

// Method to update engagement score
clientSchema.methods.updateEngagementScore = function() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Count recent communications
  const recentCommunications = this.communications.filter(
    comm => comm.createdAt >= thirtyDaysAgo
  ).length;
  
  // Calculate base score from communication frequency
  let score = Math.min(recentCommunications * 10, 50);
  
  // Add points for recent activity
  if (this.lastContactDate && this.lastContactDate >= thirtyDaysAgo) {
    score += 20;
  }
  
  // Add points for financial value
  if (this.totalSpent > 0) {
    score += Math.min(this.totalSpent / 1000 * 5, 20);
  }
  
  // Deduct points for overdue follow-ups
  if (this.isOverdue) {
    score -= 10;
  }
  
  this.engagementScore = Math.max(0, Math.min(100, score));
};

// Method to add note
clientSchema.methods.addNote = function(content, userId) {
  this.notes.push({
    content,
    createdBy: userId
  });
  return this.save();
};

// Static method to get clients by status
clientSchema.statics.getByStatus = function(status, userId) {
  return this.find({ 
    status, 
    assignedTo: userId, 
    isActive: true 
  }).sort({ updatedAt: -1 });
};

// Static method to get overdue follow-ups
clientSchema.statics.getOverdueFollowUps = function(userId) {
  return this.find({
    assignedTo: userId,
    nextFollowUpDate: { $lt: new Date() },
    isActive: true
  }).sort({ nextFollowUpDate: 1 });
};

// Static method to search clients
clientSchema.statics.searchClients = function(query, userId) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    assignedTo: userId,
    isActive: true,
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { company: searchRegex },
      { phone: searchRegex }
    ]
  }).sort({ updatedAt: -1 });
};

// Pre-save middleware to update engagement score
clientSchema.pre('save', function(next) {
  if (this.isModified('communications') || this.isModified('totalSpent') || this.isModified('lastContactDate')) {
    this.updateEngagementScore();
  }
  next();
});

module.exports = mongoose.model('Client', clientSchema);

