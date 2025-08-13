const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['trial', 'active', 'cancelled', 'expired', 'past_due'],
    default: 'trial'
  },
  plan: {
    type: String,
    enum: ['monthly', 'annual'],
    default: 'monthly'
  },
  price: {
    type: Number,
    default: 30.00 // $30 per month
  },
  currency: {
    type: String,
    default: 'USD'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  trialEndDate: {
    type: Date,
    default: function() {
      // 7-day trial by default
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    default: function() {
      // 1 month from now by default
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date;
    }
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  cancelledDate: Date,
  paypalSubscriptionId: {
    type: String,
    sparse: true
  },
  paypalCustomerId: {
    type: String,
    sparse: true
  },
  paymentMethod: {
    type: String,
    enum: ['paypal', 'credit_card', 'none'],
    default: 'none'
  },
  paymentHistory: [{
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    date: {
      type: Date,
      default: Date.now
    },
    transactionId: String,
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed'
    }
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better performance
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ paypalSubscriptionId: 1 });
subscriptionSchema.index({ trialEndDate: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' || 
         (this.status === 'trial' && new Date() < this.trialEndDate);
});

// Virtual for days left in trial
subscriptionSchema.virtual('trialDaysLeft').get(function() {
  if (this.status !== 'trial') return 0;
  
  const now = new Date();
  const trialEnd = new Date(this.trialEndDate);
  
  if (now > trialEnd) return 0;
  
  const diffTime = Math.abs(trialEnd - now);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days left in current period
subscriptionSchema.virtual('daysLeftInPeriod').get(function() {
  const now = new Date();
  const periodEnd = new Date(this.currentPeriodEnd);
  
  if (now > periodEnd) return 0;
  
  const diffTime = Math.abs(periodEnd - now);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to activate subscription after payment
subscriptionSchema.methods.activate = function(paypalData) {
  this.status = 'active';
  this.paypalSubscriptionId = paypalData.subscriptionId;
  this.paypalCustomerId = paypalData.customerId;
  this.paymentMethod = 'paypal';
  this.currentPeriodStart = new Date();
  
  // Set the current period end based on the plan
  const periodEnd = new Date();
  if (this.plan === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (this.plan === 'annual') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }
  this.currentPeriodEnd = periodEnd;
  
  // Add payment to history
  this.paymentHistory.push({
    amount: this.price,
    currency: this.currency,
    date: new Date(),
    transactionId: paypalData.transactionId,
    status: 'completed'
  });
  
  return this.save();
};

// Method to cancel subscription
subscriptionSchema.methods.cancel = function(cancelImmediately = false) {
  this.cancelledDate = new Date();
  
  if (cancelImmediately) {
    this.status = 'cancelled';
  } else {
    this.cancelAtPeriodEnd = true;
  }
  
  return this.save();
};

// Method to handle subscription renewal
subscriptionSchema.methods.renew = function(paypalData) {
  // Update period dates
  this.currentPeriodStart = new Date();
  
  const periodEnd = new Date();
  if (this.plan === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (this.plan === 'annual') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }
  this.currentPeriodEnd = periodEnd;
  
  // Reset cancel at period end if it was set
  this.cancelAtPeriodEnd = false;
  
  // Add payment to history
  this.paymentHistory.push({
    amount: this.price,
    currency: this.currency,
    date: new Date(),
    transactionId: paypalData.transactionId,
    status: 'completed'
  });
  
  return this.save();
};

// Method to handle failed payment
subscriptionSchema.methods.handleFailedPayment = function(paypalData) {
  this.status = 'past_due';
  
  // Add failed payment to history
  this.paymentHistory.push({
    amount: this.price,
    currency: this.currency,
    date: new Date(),
    transactionId: paypalData.transactionId,
    status: 'failed'
  });
  
  return this.save();
};

// Method to update subscription plan
subscriptionSchema.methods.updatePlan = function(newPlan, newPrice) {
  this.plan = newPlan;
  if (newPrice) {
    this.price = newPrice;
  }
  
  // Update the current period end based on the new plan
  const periodEnd = new Date();
  if (this.plan === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (this.plan === 'annual') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }
  this.currentPeriodEnd = periodEnd;
  
  return this.save();
};

// Static method to find subscriptions that need renewal
subscriptionSchema.statics.findDueForRenewal = function(daysThreshold = 3) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  return this.find({
    status: 'active',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: { $lte: thresholdDate }
  }).populate('user');
};

// Static method to find trial subscriptions about to expire
subscriptionSchema.statics.findTrialsAboutToExpire = function(daysThreshold = 2) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  return this.find({
    status: 'trial',
    trialEndDate: { $lte: thresholdDate }
  }).populate('user');
};

// Static method to expire trials that have ended
subscriptionSchema.statics.expireEndedTrials = function() {
  const now = new Date();
  
  return this.updateMany(
    {
      status: 'trial',
      trialEndDate: { $lt: now }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

module.exports = mongoose.model('Subscription', subscriptionSchema);

