const axios = require('axios');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const PaymentAccount = require('../models/PaymentAccount');

/**
 * PayPal API Service
 * Handles PayPal integration for connecting accounts, processing payments,
 * and managing automated withdrawals
 */
class PaymentService {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  }

  /**
   * Get PayPal access token
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/oauth2/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        },
        data: 'grant_type=client_credentials'
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting PayPal access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with PayPal');
    }
  }

  /**
   * Connect user's PayPal account
   * @param {string} userId - User ID
   * @param {string} authCode - Authorization code from PayPal OAuth
   * @returns {Promise<Object>} Connected account details
   */
  async connectPayPalAccount(userId, authCode) {
    try {
      // Exchange auth code for tokens
      const accessToken = await this.getAccessToken();
      
      // This would be a real implementation using PayPal's API
      // For now, we'll simulate the connection
      
      // Create or update payment account record
      const paymentAccount = await PaymentAccount.findOneAndUpdate(
        { user: userId, provider: 'paypal' },
        {
          user: userId,
          provider: 'paypal',
          isConnected: true,
          accountEmail: 'user@example.com', // In real implementation, get from PayPal
          lastConnected: new Date(),
          withdrawalSettings: {
            minAmount: 50,
            frequency: 'monthly',
            dayOfMonth: 1,
            isAutoWithdrawalEnabled: false
          }
        },
        { upsert: true, new: true }
      );

      // Update user record
      await User.findByIdAndUpdate(userId, {
        $set: { 'paymentAccounts.paypal': paymentAccount._id }
      });

      return paymentAccount;
    } catch (error) {
      console.error('Error connecting PayPal account:', error);
      throw new Error('Failed to connect PayPal account');
    }
  }

  /**
   * Update withdrawal settings
   * @param {string} userId - User ID
   * @param {Object} settings - Withdrawal settings
   * @returns {Promise<Object>} Updated payment account
   */
  async updateWithdrawalSettings(userId, settings) {
    try {
      const paymentAccount = await PaymentAccount.findOneAndUpdate(
        { user: userId, provider: 'paypal' },
        {
          $set: {
            'withdrawalSettings.minAmount': settings.minAmount,
            'withdrawalSettings.frequency': settings.frequency,
            'withdrawalSettings.dayOfMonth': settings.dayOfMonth,
            'withdrawalSettings.isAutoWithdrawalEnabled': settings.isAutoWithdrawalEnabled
          }
        },
        { new: true }
      );

      if (!paymentAccount) {
        throw new Error('PayPal account not connected');
      }

      return paymentAccount;
    } catch (error) {
      console.error('Error updating withdrawal settings:', error);
      throw new Error('Failed to update withdrawal settings');
    }
  }

  /**
   * Process withdrawal to PayPal
   * @param {string} userId - User ID
   * @param {number} amount - Amount to withdraw
   * @returns {Promise<Object>} Transaction details
   */
  async processWithdrawal(userId, amount) {
    try {
      // Get user's PayPal account
      const paymentAccount = await PaymentAccount.findOne({ 
        user: userId, 
        provider: 'paypal',
        isConnected: true
      });

      if (!paymentAccount) {
        throw new Error('PayPal account not connected');
      }

      // Check if user has sufficient balance
      const user = await User.findById(userId);
      if (user.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // In a real implementation, this would call PayPal's payout API
      const accessToken = await this.getAccessToken();
      
      // Create transaction record
      const transaction = await Transaction.create({
        user: userId,
        type: 'withdrawal',
        amount,
        status: 'completed',
        provider: 'paypal',
        providerTransactionId: `ppl-${Date.now()}`, // In real implementation, get from PayPal
        description: 'Withdrawal to PayPal account',
        metadata: {
          paypalEmail: paymentAccount.accountEmail
        }
      });

      // Update user balance
      await User.findByIdAndUpdate(userId, {
        $inc: { balance: -amount }
      });

      return transaction;
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      
      // Create failed transaction record if appropriate
      if (error.message !== 'PayPal account not connected' && 
          error.message !== 'Insufficient balance') {
        await Transaction.create({
          user: userId,
          type: 'withdrawal',
          amount,
          status: 'failed',
          provider: 'paypal',
          description: 'Failed withdrawal to PayPal account',
          metadata: {
            error: error.message
          }
        });
      }
      
      throw new Error(`Failed to process withdrawal: ${error.message}`);
    }
  }

  /**
   * Process automated withdrawals for all eligible users
   * @returns {Promise<Array>} Array of processed transactions
   */
  async processAutomatedWithdrawals() {
    try {
      // Find all payment accounts with auto-withdrawal enabled
      const eligibleAccounts = await PaymentAccount.find({
        provider: 'paypal',
        isConnected: true,
        'withdrawalSettings.isAutoWithdrawalEnabled': true
      }).populate('user');

      const transactions = [];

      // Process each eligible account
      for (const account of eligibleAccounts) {
        const user = account.user;
        const settings = account.withdrawalSettings;
        
        // Check if withdrawal should be processed based on frequency
        const shouldProcess = this.shouldProcessWithdrawal(settings);
        
        if (shouldProcess && user.balance >= settings.minAmount) {
          try {
            const transaction = await this.processWithdrawal(user._id, settings.minAmount);
            transactions.push(transaction);
          } catch (error) {
            console.error(`Error processing automated withdrawal for user ${user._id}:`, error);
            // Continue with next user
          }
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error processing automated withdrawals:', error);
      throw new Error('Failed to process automated withdrawals');
    }
  }

  /**
   * Check if withdrawal should be processed based on frequency settings
   * @param {Object} settings - Withdrawal settings
   * @returns {boolean} Whether withdrawal should be processed
   */
  shouldProcessWithdrawal(settings) {
    const now = new Date();
    
    switch (settings.frequency) {
      case 'daily':
        return true;
      
      case 'weekly':
        // Process on specified day of week (0 = Sunday, 6 = Saturday)
        return now.getDay() === settings.dayOfWeek;
      
      case 'monthly':
        // Process on specified day of month
        return now.getDate() === settings.dayOfMonth;
      
      default:
        return false;
    }
  }

  /**
   * Get transaction history for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, page, type)
   * @returns {Promise<Object>} Transactions with pagination
   */
  async getTransactionHistory(userId, options = {}) {
    try {
      const limit = options.limit || 10;
      const page = options.page || 1;
      const skip = (page - 1) * limit;
      
      const query = { user: userId };
      
      if (options.type) {
        query.type = options.type;
      }
      
      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Transaction.countDocuments(query);
      
      return {
        data: transactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw new Error('Failed to get transaction history');
    }
  }

  /**
   * Get revenue summary by source
   * @param {string} userId - User ID
   * @param {string} period - Time period (day, week, month, year)
   * @returns {Promise<Object>} Revenue summary
   */
  async getRevenueSummary(userId, period = 'month') {
    try {
      const startDate = this.getStartDateForPeriod(period);
      
      // Aggregate transactions by source
      const revenueSummary = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'revenue',
            createdAt: { $gte: startDate }
          }
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
      
      // Calculate total revenue
      const totalRevenue = revenueSummary.reduce((sum, item) => sum + item.total, 0);
      
      return {
        period,
        totalRevenue,
        sources: revenueSummary
      };
    } catch (error) {
      console.error('Error getting revenue summary:', error);
      throw new Error('Failed to get revenue summary');
    }
  }

  /**
   * Get start date for a given period
   * @param {string} period - Time period (day, week, month, year)
   * @returns {Date} Start date
   */
  getStartDateForPeriod(period) {
    const now = new Date();
    
    switch (period) {
      case 'day':
        return new Date(now.setHours(0, 0, 0, 0));
      
      case 'week':
        const dayOfWeek = now.getDay();
        return new Date(now.setDate(now.getDate() - dayOfWeek));
      
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1); // Default to month
    }
  }
}

module.exports = new PaymentService();

