const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['revenue', 'withdrawal', 'refund', 'fee'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  source: {
    type: String,
    enum: ['content', 'affiliate', 'product', 'other'],
    default: 'other'
  },
  provider: {
    type: String,
    enum: ['paypal', 'stripe', 'bank', 'system', 'other'],
    default: 'system'
  },
  providerTransactionId: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ user: 1, type: 1 });
TransactionSchema.index({ status: 1 });

// Virtual for formatted amount
TransactionSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Method to check if transaction is successful
TransactionSchema.methods.isSuccessful = function() {
  return this.status === 'completed';
};

// Static method to calculate total revenue for a user
TransactionSchema.statics.calculateTotalRevenue = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        type: 'revenue',
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  return result.length > 0 ? result[0].total : 0;
};

// Static method to calculate total withdrawals for a user
TransactionSchema.statics.calculateTotalWithdrawals = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        type: 'withdrawal',
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  return result.length > 0 ? result[0].total : 0;
};

// Static method to get revenue by source
TransactionSchema.statics.getRevenueBySource = async function(userId, startDate, endDate) {
  const query = {
    user: mongoose.Types.ObjectId(userId),
    type: 'revenue',
    status: 'completed'
  };

  if (startDate) {
    query.createdAt = { $gte: startDate };
  }

  if (endDate) {
    query.createdAt = { ...query.createdAt, $lte: endDate };
  }

  return this.aggregate([
    {
      $match: query
    },
    {
      $group: {
        _id: '$source',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        source: '$_id',
        total: 1,
        count: 1,
        _id: 0
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', TransactionSchema);

