import api from './authService';

export const subscriptionService = {
  // Get current subscription
  async getCurrentSubscription() {
    return api.get('/subscriptions/current');
  },

  // Create a PayPal subscription
  async createSubscription(data: { plan: 'monthly' | 'annual', returnUrl: string, cancelUrl: string }) {
    return api.post('/subscriptions/create-subscription', data);
  },

  // Activate subscription after PayPal approval
  async activateSubscription(data: { subscriptionId: string, paypalSubscriptionId: string }) {
    return api.post('/subscriptions/activate', data);
  },

  // Cancel subscription
  async cancelSubscription(data: { cancelImmediately?: boolean } = {}) {
    return api.post('/subscriptions/cancel', data);
  },

  // Change subscription plan
  async changePlan(data: { plan: 'monthly' | 'annual' }) {
    return api.post('/subscriptions/change-plan', data);
  },

  // Get subscription invoice history
  async getInvoiceHistory() {
    return api.get('/subscriptions/invoices');
  },

  // Get subscription details
  async getSubscriptionDetails(subscriptionId: string) {
    return api.get(`/subscriptions/${subscriptionId}`);
  },

  // Resume cancelled subscription
  async resumeSubscription() {
    return api.post('/subscriptions/resume');
  },

  // Update payment method
  async updatePaymentMethod(data: { returnUrl: string, cancelUrl: string }) {
    return api.post('/subscriptions/update-payment-method', data);
  }
};

