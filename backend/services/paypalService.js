const axios = require('axios');
const querystring = require('querystring');

// PayPal API URLs
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Cache for access token
let accessToken = null;
let tokenExpiry = null;

/**
 * Get PayPal access token
 * @returns {Promise<string>} Access token
 */
const getAccessToken = async () => {
  // Check if we have a valid cached token
  if (accessToken && tokenExpiry && new Date() < tokenExpiry) {
    return accessToken;
  }

  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v1/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      data: 'grant_type=client_credentials'
    });

    accessToken = response.data.access_token;
    
    // Set token expiry (subtract 5 minutes to be safe)
    const expiresIn = response.data.expires_in;
    tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
    
    return accessToken;
  } catch (error) {
    console.error('PayPal access token error:', error.response?.data || error.message);
    throw new Error('Failed to get PayPal access token');
  }
};

/**
 * Create a PayPal product
 * @param {Object} productData Product data
 * @returns {Promise<Object>} Created product
 */
const createProduct = async (productData) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v1/catalogs/products`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        name: productData.name,
        description: productData.description,
        type: 'SERVICE',
        category: 'SOFTWARE',
        home_url: productData.homeUrl
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('PayPal create product error:', error.response?.data || error.message);
    throw new Error('Failed to create PayPal product');
  }
};

/**
 * Create a PayPal plan
 * @param {Object} planData Plan data
 * @returns {Promise<Object>} Created plan
 */
const createPlan = async (planData) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v1/billing/plans`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        product_id: planData.productId,
        name: planData.name,
        description: planData.description,
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: planData.intervalUnit.toUpperCase(),
              interval_count: planData.intervalCount
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Infinite
            pricing_scheme: {
              fixed_price: {
                value: planData.price.toString(),
                currency_code: planData.currency || 'USD'
              }
            }
          }
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: planData.currency || 'USD'
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('PayPal create plan error:', error.response?.data || error.message);
    throw new Error('Failed to create PayPal plan');
  }
};

/**
 * Create a PayPal subscription
 * @param {Object} subscriptionData Subscription data
 * @returns {Promise<Object>} Created subscription
 */
const createSubscription = async (subscriptionData) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v1/billing/subscriptions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'PayPal-Request-Id': subscriptionData.requestId
      },
      data: {
        plan_id: subscriptionData.planId,
        start_time: subscriptionData.startTime,
        subscriber: {
          name: {
            given_name: subscriptionData.firstName,
            surname: subscriptionData.lastName
          },
          email_address: subscriptionData.email
        },
        application_context: {
          brand_name: 'AI Ad Platform',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: subscriptionData.returnUrl,
          cancel_url: subscriptionData.cancelUrl
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('PayPal create subscription error:', error.response?.data || error.message);
    throw new Error('Failed to create PayPal subscription');
  }
};

/**
 * Get subscription details
 * @param {string} subscriptionId PayPal subscription ID
 * @returns {Promise<Object>} Subscription details
 */
const getSubscription = async (subscriptionId) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'get',
      url: `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('PayPal get subscription error:', error.response?.data || error.message);
    throw new Error('Failed to get PayPal subscription details');
  }
};

/**
 * Cancel a subscription
 * @param {string} subscriptionId PayPal subscription ID
 * @param {string} reason Cancellation reason
 * @returns {Promise<Object>} Cancellation result
 */
const cancelSubscription = async (subscriptionId, reason) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        reason: reason || 'Cancelled by user'
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('PayPal cancel subscription error:', error.response?.data || error.message);
    throw new Error('Failed to cancel PayPal subscription');
  }
};

/**
 * Suspend a subscription
 * @param {string} subscriptionId PayPal subscription ID
 * @param {string} reason Suspension reason
 * @returns {Promise<Object>} Suspension result
 */
const suspendSubscription = async (subscriptionId, reason) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/suspend`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        reason: reason || 'Suspended by user'
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('PayPal suspend subscription error:', error.response?.data || error.message);
    throw new Error('Failed to suspend PayPal subscription');
  }
};

/**
 * Activate a suspended subscription
 * @param {string} subscriptionId PayPal subscription ID
 * @param {string} reason Activation reason
 * @returns {Promise<Object>} Activation result
 */
const activateSubscription = async (subscriptionId, reason) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/activate`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        reason: reason || 'Activated by user'
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('PayPal activate subscription error:', error.response?.data || error.message);
    throw new Error('Failed to activate PayPal subscription');
  }
};

/**
 * Update subscription pricing
 * @param {string} subscriptionId PayPal subscription ID
 * @param {Object} pricingData New pricing data
 * @returns {Promise<Object>} Update result
 */
const updateSubscriptionPricing = async (subscriptionId, pricingData) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}/revise`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        plan_id: pricingData.planId,
        shipping_amount: {
          currency_code: pricingData.currency || 'USD',
          value: '0'
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('PayPal update subscription pricing error:', error.response?.data || error.message);
    throw new Error('Failed to update PayPal subscription pricing');
  }
};

/**
 * Verify webhook signature
 * @param {Object} webhookData Webhook data from PayPal
 * @returns {Promise<boolean>} Whether the webhook signature is valid
 */
const verifyWebhookSignature = async (webhookData) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        auth_algo: webhookData.authAlgo,
        cert_url: webhookData.certUrl,
        transmission_id: webhookData.transmissionId,
        transmission_sig: webhookData.transmissionSig,
        transmission_time: webhookData.transmissionTime,
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: webhookData.webhookEvent
      }
    });
    
    return response.data.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal verify webhook signature error:', error.response?.data || error.message);
    return false;
  }
};

/**
 * Get transaction details
 * @param {string} transactionId PayPal transaction ID
 * @returns {Promise<Object>} Transaction details
 */
const getTransactionDetails = async (transactionId) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios({
      method: 'get',
      url: `${PAYPAL_API_BASE}/v1/payments/payment/${transactionId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('PayPal get transaction details error:', error.response?.data || error.message);
    throw new Error('Failed to get PayPal transaction details');
  }
};

module.exports = {
  getAccessToken,
  createProduct,
  createPlan,
  createSubscription,
  getSubscription,
  cancelSubscription,
  suspendSubscription,
  activateSubscription,
  updateSubscriptionPricing,
  verifyWebhookSignature,
  getTransactionDetails
};

