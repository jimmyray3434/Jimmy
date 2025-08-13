const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { auth } = require('../middleware/auth');
const paypalService = require('../services/paypalService');

const router = express.Router();

// Cache for product and plan IDs
let MONTHLY_PLAN_ID = process.env.PAYPAL_MONTHLY_PLAN_ID;
let ANNUAL_PLAN_ID = process.env.PAYPAL_ANNUAL_PLAN_ID;

// Initialize PayPal product and plans if not already set
const initializePayPalPlans = async () => {
  try {
    if (!MONTHLY_PLAN_ID) {
      // Create product if not already created
      const productId = process.env.PAYPAL_PRODUCT_ID;
      let productResponse;
      
      if (!productId) {
        productResponse = await paypalService.createProduct({
          name: 'AI Ad Platform Subscription',
          description: 'Monthly subscription to AI Ad Platform with full access to all features',
          homeUrl: process.env.FRONTEND_URL || 'https://aiadplatform.com'
        });
        
        // Save product ID to environment (in memory)
        process.env.PAYPAL_PRODUCT_ID = productResponse.id;
      }
      
      // Create monthly plan
      const monthlyPlanResponse = await paypalService.createPlan({
        productId: process.env.PAYPAL_PRODUCT_ID,
        name: 'Monthly Subscription',
        description: 'AI Ad Platform Monthly Subscription - $30/month',
        intervalUnit: 'month',
        intervalCount: 1,
        price: 30.00,
        currency: 'USD'
      });
      
      // Save monthly plan ID to environment (in memory)
      MONTHLY_PLAN_ID = monthlyPlanResponse.id;
      process.env.PAYPAL_MONTHLY_PLAN_ID = MONTHLY_PLAN_ID;
      
      // Create annual plan (with discount)
      const annualPlanResponse = await paypalService.createPlan({
        productId: process.env.PAYPAL_PRODUCT_ID,
        name: 'Annual Subscription',
        description: 'AI Ad Platform Annual Subscription - $300/year (save $60)',
        intervalUnit: 'year',
        intervalCount: 1,
        price: 300.00,
        currency: 'USD'
      });
      
      // Save annual plan ID to environment (in memory)
      ANNUAL_PLAN_ID = annualPlanResponse.id;
      process.env.PAYPAL_ANNUAL_PLAN_ID = ANNUAL_PLAN_ID;
      
      console.log('PayPal plans initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize PayPal plans:', error);
  }
};

// Initialize plans on server startup
initializePayPalPlans();

// @route   GET /api/subscriptions/current
// @desc    Get current user's subscription
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get subscription details
    let subscription = null;
    if (user.subscriptionId) {
      subscription = await Subscription.findById(user.subscriptionId);
    }
    
    // If no subscription exists, create a trial subscription
    if (!subscription) {
      subscription = new Subscription({
        user: user._id,
        status: 'trial',
        plan: 'monthly',
        price: 30.00,
        startDate: new Date(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      await subscription.save();
      
      // Update user with subscription ID
      user.subscriptionId = subscription._id;
      await user.save();
    }
    
    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        status: subscription.status,
        plan: subscription.plan,
        price: subscription.price,
        currency: subscription.currency,
        startDate: subscription.startDate,
        trialEndDate: subscription.trialEndDate,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        paymentMethod: subscription.paymentMethod,
        isActive: subscription.isActive,
        trialDaysLeft: subscription.trialDaysLeft,
        daysLeftInPeriod: subscription.daysLeftInPeriod,
        paymentHistory: subscription.paymentHistory
      }
    });
    
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/subscriptions/create-subscription
// @desc    Create a PayPal subscription
// @access  Private
router.post('/create-subscription', [
  auth,
  body('plan').isIn(['monthly', 'annual']).withMessage('Invalid plan type'),
  body('returnUrl').isURL().withMessage('Valid return URL is required'),
  body('cancelUrl').isURL().withMessage('Valid cancel URL is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { plan, returnUrl, cancelUrl } = req.body;
    
    // Get user
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get or create subscription
    let subscription;
    if (user.subscriptionId) {
      subscription = await Subscription.findById(user.subscriptionId);
    }
    
    if (!subscription) {
      subscription = new Subscription({
        user: user._id,
        status: 'trial',
        plan: plan,
        price: plan === 'monthly' ? 30.00 : 300.00,
        startDate: new Date(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      await subscription.save();
      
      // Update user with subscription ID
      user.subscriptionId = subscription._id;
      await user.save();
    }
    
    // Update plan if different
    if (subscription.plan !== plan) {
      subscription.plan = plan;
      subscription.price = plan === 'monthly' ? 30.00 : 300.00;
      await subscription.save();
    }
    
    // Get appropriate plan ID
    const planId = plan === 'monthly' ? MONTHLY_PLAN_ID : ANNUAL_PLAN_ID;
    
    if (!planId) {
      return res.status(500).json({
        success: false,
        message: 'PayPal plans not initialized'
      });
    }
    
    // Create PayPal subscription
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 7); // Start after trial period
    
    const paypalSubscription = await paypalService.createSubscription({
      planId,
      requestId: uuidv4(), // Unique request ID to prevent duplicate subscriptions
      startTime: startTime.toISOString(),
      firstName: user.name.split(' ')[0] || 'User',
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      email: user.email,
      returnUrl: `${returnUrl}?subscriptionId=${subscription._id}`,
      cancelUrl
    });
    
    res.json({
      success: true,
      subscriptionId: subscription._id,
      paypalSubscriptionId: paypalSubscription.id,
      approvalUrl: paypalSubscription.links.find(link => link.rel === 'approve').href
    });
    
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

// @route   POST /api/subscriptions/activate
// @desc    Activate subscription after PayPal approval
// @access  Private
router.post('/activate', [
  auth,
  body('subscriptionId').isMongoId().withMessage('Valid subscription ID is required'),
  body('paypalSubscriptionId').notEmpty().withMessage('PayPal subscription ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { subscriptionId, paypalSubscriptionId } = req.body;
    
    // Get user
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get subscription
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription || subscription.user.toString() !== user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // Get PayPal subscription details
    const paypalSubscriptionDetails = await paypalService.getSubscription(paypalSubscriptionId);
    
    if (paypalSubscriptionDetails.status !== 'ACTIVE' && paypalSubscriptionDetails.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'PayPal subscription is not active'
      });
    }
    
    // Activate subscription
    await subscription.activate({
      subscriptionId: paypalSubscriptionId,
      customerId: paypalSubscriptionDetails.subscriber.payer_id,
      transactionId: paypalSubscriptionId // Use subscription ID as transaction ID for now
    });
    
    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        id: subscription._id,
        status: subscription.status,
        plan: subscription.plan,
        price: subscription.price,
        currency: subscription.currency,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
    
  } catch (error) {
    console.error('Activate subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate subscription'
    });
  }
});

// @route   POST /api/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel', [
  auth,
  body('cancelImmediately').isBoolean().optional().withMessage('cancelImmediately must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { cancelImmediately = false } = req.body;
    
    // Get user
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get subscription
    if (!user.subscriptionId) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    const subscription = await Subscription.findById(user.subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // If PayPal subscription exists, cancel it
    if (subscription.paypalSubscriptionId) {
      try {
        await paypalService.cancelSubscription(
          subscription.paypalSubscriptionId,
          cancelImmediately ? 'Cancelled immediately by user' : 'Cancelled at period end by user'
        );
      } catch (paypalError) {
        console.error('PayPal cancel subscription error:', paypalError);
        // Continue with local cancellation even if PayPal fails
      }
    }
    
    // Cancel subscription locally
    await subscription.cancel(cancelImmediately);
    
    res.json({
      success: true,
      message: cancelImmediately 
        ? 'Subscription cancelled successfully' 
        : 'Subscription will be cancelled at the end of the current billing period',
      subscription: {
        id: subscription._id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
    
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// @route   POST /api/subscriptions/change-plan
// @desc    Change subscription plan
// @access  Private
router.post('/change-plan', [
  auth,
  body('plan').isIn(['monthly', 'annual']).withMessage('Invalid plan type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { plan } = req.body;
    
    // Get user
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get subscription
    if (!user.subscriptionId) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    const subscription = await Subscription.findById(user.subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // If plan is the same, do nothing
    if (subscription.plan === plan) {
      return res.json({
        success: true,
        message: 'Already on this plan',
        subscription: {
          id: subscription._id,
          status: subscription.status,
          plan: subscription.plan,
          price: subscription.price
        }
      });
    }
    
    // Get appropriate plan ID
    const planId = plan === 'monthly' ? MONTHLY_PLAN_ID : ANNUAL_PLAN_ID;
    
    if (!planId) {
      return res.status(500).json({
        success: false,
        message: 'PayPal plans not initialized'
      });
    }
    
    // If PayPal subscription exists, update it
    if (subscription.status === 'active' && subscription.paypalSubscriptionId) {
      try {
        await paypalService.updateSubscriptionPricing(
          subscription.paypalSubscriptionId,
          {
            planId,
            currency: 'USD'
          }
        );
      } catch (paypalError) {
        console.error('PayPal update subscription error:', paypalError);
        return res.status(500).json({
          success: false,
          message: 'Failed to update PayPal subscription'
        });
      }
    }
    
    // Update subscription plan locally
    const newPrice = plan === 'monthly' ? 30.00 : 300.00;
    await subscription.updatePlan(plan, newPrice);
    
    res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      subscription: {
        id: subscription._id,
        status: subscription.status,
        plan: subscription.plan,
        price: subscription.price,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });
    
  } catch (error) {
    console.error('Change plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change subscription plan'
    });
  }
});

// @route   POST /api/subscriptions/webhook
// @desc    Handle PayPal webhook events
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    // Get webhook data
    const webhookData = {
      authAlgo: req.headers['paypal-auth-algo'],
      certUrl: req.headers['paypal-cert-url'],
      transmissionId: req.headers['paypal-transmission-id'],
      transmissionSig: req.headers['paypal-transmission-sig'],
      transmissionTime: req.headers['paypal-transmission-time'],
      webhookEvent: req.body
    };
    
    // Verify webhook signature
    const isValid = await paypalService.verifyWebhookSignature(webhookData);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }
    
    const event = req.body;
    const eventType = event.event_type;
    
    // Handle different event types
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        // Subscription created - nothing to do here as we handle this in the activate endpoint
        break;
        
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // Subscription activated
        await handleSubscriptionActivated(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.UPDATED':
        // Subscription updated
        await handleSubscriptionUpdated(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // Subscription cancelled
        await handleSubscriptionCancelled(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Subscription suspended
        await handleSubscriptionSuspended(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        // Payment failed
        await handlePaymentFailed(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED':
        // Payment succeeded
        await handlePaymentSucceeded(event);
        break;
    }
    
    // Acknowledge receipt of the event
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing error'
    });
  }
});

// Helper function to handle subscription activated event
const handleSubscriptionActivated = async (event) => {
  const paypalSubscriptionId = event.resource.id;
  
  // Find subscription by PayPal subscription ID
  const subscription = await Subscription.findOne({ paypalSubscriptionId });
  
  if (!subscription) {
    console.error('Subscription not found for PayPal subscription ID:', paypalSubscriptionId);
    return;
  }
  
  // Update subscription status
  subscription.status = 'active';
  await subscription.save();
};

// Helper function to handle subscription updated event
const handleSubscriptionUpdated = async (event) => {
  const paypalSubscriptionId = event.resource.id;
  
  // Find subscription by PayPal subscription ID
  const subscription = await Subscription.findOne({ paypalSubscriptionId });
  
  if (!subscription) {
    console.error('Subscription not found for PayPal subscription ID:', paypalSubscriptionId);
    return;
  }
  
  // Get updated subscription details from PayPal
  const paypalSubscription = await paypalService.getSubscription(paypalSubscriptionId);
  
  // Update subscription based on PayPal status
  switch (paypalSubscription.status) {
    case 'ACTIVE':
      subscription.status = 'active';
      break;
    case 'SUSPENDED':
      subscription.status = 'past_due';
      break;
    case 'CANCELLED':
      subscription.status = 'cancelled';
      break;
    case 'EXPIRED':
      subscription.status = 'expired';
      break;
  }
  
  await subscription.save();
};

// Helper function to handle subscription cancelled event
const handleSubscriptionCancelled = async (event) => {
  const paypalSubscriptionId = event.resource.id;
  
  // Find subscription by PayPal subscription ID
  const subscription = await Subscription.findOne({ paypalSubscriptionId });
  
  if (!subscription) {
    console.error('Subscription not found for PayPal subscription ID:', paypalSubscriptionId);
    return;
  }
  
  // Update subscription status
  subscription.status = 'cancelled';
  subscription.cancelledDate = new Date();
  await subscription.save();
};

// Helper function to handle subscription suspended event
const handleSubscriptionSuspended = async (event) => {
  const paypalSubscriptionId = event.resource.id;
  
  // Find subscription by PayPal subscription ID
  const subscription = await Subscription.findOne({ paypalSubscriptionId });
  
  if (!subscription) {
    console.error('Subscription not found for PayPal subscription ID:', paypalSubscriptionId);
    return;
  }
  
  // Update subscription status
  subscription.status = 'past_due';
  await subscription.save();
};

// Helper function to handle payment failed event
const handlePaymentFailed = async (event) => {
  const paypalSubscriptionId = event.resource.id;
  
  // Find subscription by PayPal subscription ID
  const subscription = await Subscription.findOne({ paypalSubscriptionId });
  
  if (!subscription) {
    console.error('Subscription not found for PayPal subscription ID:', paypalSubscriptionId);
    return;
  }
  
  // Add failed payment to history
  await subscription.handleFailedPayment({
    transactionId: event.resource.id
  });
};

// Helper function to handle payment succeeded event
const handlePaymentSucceeded = async (event) => {
  const paypalSubscriptionId = event.resource.id;
  
  // Find subscription by PayPal subscription ID
  const subscription = await Subscription.findOne({ paypalSubscriptionId });
  
  if (!subscription) {
    console.error('Subscription not found for PayPal subscription ID:', paypalSubscriptionId);
    return;
  }
  
  // Renew subscription
  await subscription.renew({
    transactionId: event.resource.id
  });
};

module.exports = router;

