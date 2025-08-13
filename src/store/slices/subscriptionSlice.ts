import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { subscriptionService } from '../../services/subscriptionService';

export interface PaymentHistory {
  amount: number;
  currency: string;
  date: string;
  transactionId: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
}

export interface Subscription {
  id: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due';
  plan: 'monthly' | 'annual';
  price: number;
  currency: string;
  startDate: string;
  trialEndDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentMethod: 'paypal' | 'credit_card' | 'none';
  isActive: boolean;
  trialDaysLeft: number;
  daysLeftInPeriod: number;
  paymentHistory: PaymentHistory[];
}

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  paypalApprovalUrl: string | null;
}

const initialState: SubscriptionState = {
  subscription: null,
  isLoading: false,
  error: null,
  paypalApprovalUrl: null,
};

// Async thunks
export const fetchCurrentSubscription = createAsyncThunk(
  'subscription/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.getCurrentSubscription();
      return response.data.subscription;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription');
    }
  }
);

export const createSubscription = createAsyncThunk(
  'subscription/create',
  async (data: { plan: 'monthly' | 'annual', returnUrl: string, cancelUrl: string }, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.createSubscription(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subscription');
    }
  }
);

export const activateSubscription = createAsyncThunk(
  'subscription/activate',
  async (data: { subscriptionId: string, paypalSubscriptionId: string }, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.activateSubscription(data);
      return response.data.subscription;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate subscription');
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscription/cancel',
  async (data: { cancelImmediately?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.cancelSubscription(data);
      return response.data.subscription;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel subscription');
    }
  }
);

export const changePlan = createAsyncThunk(
  'subscription/changePlan',
  async (data: { plan: 'monthly' | 'annual' }, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.changePlan(data);
      return response.data.subscription;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change subscription plan');
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPayPalApprovalUrl: (state) => {
      state.paypalApprovalUrl = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch current subscription
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create subscription
      .addCase(createSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paypalApprovalUrl = action.payload.approvalUrl;
        state.error = null;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Activate subscription
      .addCase(activateSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(activateSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload;
        state.paypalApprovalUrl = null;
        state.error = null;
      })
      .addCase(activateSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Cancel subscription
      .addCase(cancelSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.subscription) {
          state.subscription = {
            ...state.subscription,
            ...action.payload
          };
        }
        state.error = null;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Change plan
      .addCase(changePlan.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePlan.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.subscription) {
          state.subscription = {
            ...state.subscription,
            ...action.payload
          };
        }
        state.error = null;
      })
      .addCase(changePlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearPayPalApprovalUrl } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;

