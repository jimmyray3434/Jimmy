const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const PaymentAccount = require('../models/PaymentAccount');
const Transaction = require('../models/Transaction');

/**
 * @route   GET /api/payment/accounts
 * @desc    Get user's payment accounts
 * @access  Private
 */
router.get('/accounts', protect, async (req, res) => {
  try {
    const accounts = await PaymentAccount.find({ user: req.user.id });
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error fetching payment accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   GET /api/payment/accounts/:provider
 * @desc    Get specific payment account by provider
 * @access  Private
 */
router.get('/accounts/:provider', protect, async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (!['paypal', 'stripe', 'bank'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment provider'
      });
    }
    
    const account = await PaymentAccount.findOne({
      user: req.user.id,
      provider
    });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: `No ${provider} account found`
      });
    }
    
    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.provider} account:`, error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * @route   POST /api/payment/connect/paypal
 * @desc    Connect PayPal account
 * @access  Private
 */
router.post('/connect/paypal', protect, async (req, res) => {
  try {
    const { authCode } = req.body;
    
    if (!authCode) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }
    
    const account = await paymentService.connectPayPalAccount(req.user.id, authCode);
    
    res.json({
      success: true,
      data: account,
      message: 'PayPal account connected successfully'
    });
  } catch (error) {
    console.error('Error connecting PayPal account:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect PayPal account'
    });
  }
});

/**
 * @route   PUT /api/payment/settings/withdrawal
 * @desc    Update withdrawal settings
 * @access  Private
 */
router.put('/settings/withdrawal', protect, async (req, res) => {
  try {
    const { provider, settings } = req.body;
    
    if (!provider || !settings) {
      return res.status(400).json({
        success: false,
        error: 'Provider and settings are required'
      });
    }
    
    if (!['paypal', 'stripe', 'bank'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment provider'
      });
    }
    
    // Validate settings
    const { minAmount, frequency, dayOfMonth, isAutoWithdrawalEnabled } = settings;
    
    if (minAmount !== undefined && (isNaN(minAmount) || minAmount < 1)) {
      return res.status(400).json({
        success: false,
        error: 'Minimum amount must be at least 1'
      });
    }
    
    if (frequency && !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid frequency'
      });
    }
    
    if (dayOfMonth !== undefined && (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)) {
      return res.status(400).json({
        success: false,
        error: 'Day of month must be between 1 and 31'
      });
    }
    
    // Update settings based on provider
    let account;
    
    if (provider === 'paypal') {
      account = await paymentService.updateWithdrawalSettings(req.user.id, settings);
    } else {
      // For other providers, update directly in the database
      account = await PaymentAccount.findOneAndUpdate(
        { user: req.user.id, provider },
        {
          $set: {
            'withdrawalSettings.minAmount': settings.minAmount,
            'withdrawalSettings.frequency': settings.frequency,
            'withdrawalSettings.dayOfMonth': settings.dayOfMonth,
            'withdrawalSettings.dayOfWeek': settings.dayOfWeek,
            'withdrawalSettings.isAutoWithdrawalEnabled': settings.isAutoWithdrawalEnabled
          }
        },
        { new: true }
      );
      
      if (!account) {
        return res.status(404).json({
          success: false,
          error: `No ${provider} account found`
        });
      }
    }
    
    res.json({
      success: true,
      data: account,
      message: 'Withdrawal settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating withdrawal settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update withdrawal settings'
    });
  }
});

/**
 * @route   POST /api/payment/withdraw
 * @desc    Process manual withdrawal
 * @access  Private
 */
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { provider, amount } = req.body;
    
    if (!provider || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Provider and amount are required'
      });
    }
    
    if (!['paypal', 'stripe', 'bank'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment provider'
      });
    }
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }
    
    // Process withdrawal based on provider
    let transaction;
    
    if (provider === 'paypal') {
      transaction = await paymentService.processWithdrawal(req.user.id, amount);
    } else {
      // For other providers, implement similar methods
      return res.status(400).json({
        success: false,
        error: `Withdrawals for ${provider} are not yet supported`
      });
    }
    
    res.json({
      success: true,
      data: transaction,
      message: 'Withdrawal processed successfully'
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(error.message.includes('Insufficient balance') ? 400 : 500).json({
      success: false,
      error: error.message || 'Failed to process withdrawal'
    });
  }
});

/**
 * @route   GET /api/payment/transactions
 * @desc    Get transaction history
 * @access  Private
 */
router.get('/transactions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      type
    };
    
    const transactions = await paymentService.getTransactionHistory(req.user.id, options);
    
    res.json({
      success: true,
      data: transactions.data,
      pagination: transactions.pagination
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transactions'
    });
  }
});

/**
 * @route   GET /api/payment/revenue
 * @desc    Get revenue summary
 * @access  Private
 */
router.get('/revenue', protect, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    if (!['day', 'week', 'month', 'year'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period'
      });
    }
    
    const revenueSummary = await paymentService.getRevenueSummary(req.user.id, period);
    
    res.json({
      success: true,
      data: revenueSummary
    });
  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch revenue summary'
    });
  }
});

/**
 * @route   DELETE /api/payment/accounts/:provider
 * @desc    Disconnect payment account
 * @access  Private
 */
router.delete('/accounts/:provider', protect, async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (!['paypal', 'stripe', 'bank'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment provider'
      });
    }
    
    const account = await PaymentAccount.findOneAndUpdate(
      { user: req.user.id, provider },
      {
        $set: {
          isConnected: false,
          status: 'disabled',
          statusMessage: 'Disconnected by user'
        }
      },
      { new: true }
    );
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: `No ${provider} account found`
      });
    }
    
    res.json({
      success: true,
      data: account,
      message: `${provider} account disconnected successfully`
    });
  } catch (error) {
    console.error(`Error disconnecting ${req.params.provider} account:`, error);
    res.status(500).json({
      success: false,
      error: error.message || `Failed to disconnect ${req.params.provider} account`
    });
  }
});

module.exports = router;

