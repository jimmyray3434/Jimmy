const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SubscriptionSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'none'],
    default: 'none'
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise', 'none'],
    default: 'free'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  trialEndDate: {
    type: Date
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  provider: {
    type: String,
    enum: ['stripe', 'paypal', 'manual', 'none'],
    default: 'none'
  },
  providerId: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  subscription: {
    type: SubscriptionSchema,
    default: () => ({})
  },
  balance: {
    type: Number,
    default: 0
  },
  paymentAccounts: {
    paypal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentAccount'
    },
    stripe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentAccount'
    },
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentAccount'
    }
  },
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    autoWithdrawal: {
      type: Boolean,
      default: false
    },
    autoTrafficGeneration: {
      type: Boolean,
      default: true
    },
    contentGeneration: {
      type: Object,
      default: {
        maxTokens: 2000,
        temperature: 0.7,
        model: 'gpt-3.5-turbo'
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user has active subscription
UserSchema.methods.hasActiveSubscription = function() {
  return this.subscription.status === 'active' || this.subscription.status === 'trialing';
};

// Check if user is in trial period
UserSchema.methods.isInTrial = function() {
  return this.subscription.status === 'trialing' && 
         this.subscription.trialEndDate && 
         new Date() < this.subscription.trialEndDate;
};

// Get days remaining in trial
UserSchema.methods.getTrialDaysRemaining = function() {
  if (!this.isInTrial()) {
    return 0;
  }
  
  const now = new Date();
  const trialEnd = new Date(this.subscription.trialEndDate);
  const diffTime = Math.abs(trialEnd - now);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Update user balance
UserSchema.methods.updateBalance = async function(amount) {
  this.balance += amount;
  await this.save();
  return this.balance;
};

module.exports = mongoose.model('User', UserSchema);

