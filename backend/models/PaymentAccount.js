const mongoose = require('mongoose');

const WithdrawalSettingsSchema = new mongoose.Schema({
  minAmount: {
    type: Number,
    default: 50,
    min: 1
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'monthly'
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    default: 1 // Monday
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  isAutoWithdrawalEnabled: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const PaymentAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    enum: ['paypal', 'stripe', 'bank'],
    required: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  accountEmail: {
    type: String,
    trim: true
  },
  accountName: {
    type: String,
    trim: true
  },
  accountId: {
    type: String,
    trim: true
  },
  lastFour: {
    type: String,
    trim: true
  },
  tokenInfo: {
    accessToken: {
      type: String,
      select: false // Don't include in query results by default
    },
    refreshToken: {
      type: String,
      select: false
    },
    expiresAt: {
      type: Date
    }
  },
  withdrawalSettings: {
    type: WithdrawalSettingsSchema,
    default: () => ({})
  },
  lastConnected: {
    type: Date,
    default: Date.now
  },
  lastWithdrawal: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'error', 'disabled'],
    default: 'active'
  },
  statusMessage: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for user and provider
PaymentAccountSchema.index({ user: 1, provider: 1 }, { unique: true });

// Method to check if account is ready for withdrawal
PaymentAccountSchema.methods.isReadyForWithdrawal = function() {
  return this.isConnected && this.status === 'active';
};

// Method to check if auto-withdrawal is due
PaymentAccountSchema.methods.isAutoWithdrawalDue = function() {
  if (!this.withdrawalSettings.isAutoWithdrawalEnabled) {
    return false;
  }

  const now = new Date();
  const settings = this.withdrawalSettings;
  
  // If no previous withdrawal, it's due
  if (!this.lastWithdrawal) {
    return true;
  }

  const lastWithdrawal = new Date(this.lastWithdrawal);
  
  switch (settings.frequency) {
    case 'daily':
      // Check if last withdrawal was on a different day
      return lastWithdrawal.getDate() !== now.getDate() ||
             lastWithdrawal.getMonth() !== now.getMonth() ||
             lastWithdrawal.getFullYear() !== now.getFullYear();
    
    case 'weekly':
      // Check if it's the specified day of week and last withdrawal was in a different week
      const daysSinceLastWithdrawal = Math.floor((now - lastWithdrawal) / (1000 * 60 * 60 * 24));
      return now.getDay() === settings.dayOfWeek && daysSinceLastWithdrawal >= 7;
    
    case 'monthly':
      // Check if it's the specified day of month and last withdrawal was in a different month
      return now.getDate() === settings.dayOfMonth && 
             (lastWithdrawal.getMonth() !== now.getMonth() || 
              lastWithdrawal.getFullYear() !== now.getFullYear());
    
    default:
      return false;
  }
};

// Static method to find accounts due for auto-withdrawal
PaymentAccountSchema.statics.findDueForAutoWithdrawal = async function() {
  // Find all active accounts with auto-withdrawal enabled
  const accounts = await this.find({
    isConnected: true,
    status: 'active',
    'withdrawalSettings.isAutoWithdrawalEnabled': true
  }).populate('user');

  // Filter accounts that are due for withdrawal
  return accounts.filter(account => account.isAutoWithdrawalDue());
};

module.exports = mongoose.model('PaymentAccount', PaymentAccountSchema);

