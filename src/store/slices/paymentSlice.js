import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchTransactions = createAsyncThunk(
  'payment/fetchTransactions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/payment/transactions', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch transactions');
    }
  }
);

export const fetchRevenueSummary = createAsyncThunk(
  'payment/fetchRevenueSummary',
  async (period = 'month', { rejectWithValue }) => {
    try {
      const response = await api.get('/payment/revenue', { params: { period } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch revenue summary');
    }
  }
);

export const fetchPaymentAccount = createAsyncThunk(
  'payment/fetchPaymentAccount',
  async (provider, { rejectWithValue }) => {
    try {
      const response = await api.get(`/payment/accounts/${provider}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || `Failed to fetch ${provider} account`);
    }
  }
);

export const connectPayPalAccount = createAsyncThunk(
  'payment/connectPayPalAccount',
  async (authCode, { rejectWithValue }) => {
    try {
      const response = await api.post('/payment/connect/paypal', { authCode });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to connect PayPal account');
    }
  }
);

export const updateWithdrawalSettings = createAsyncThunk(
  'payment/updateWithdrawalSettings',
  async ({ provider, settings }, { rejectWithValue }) => {
    try {
      const response = await api.put('/payment/settings/withdrawal', { provider, settings });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update withdrawal settings');
    }
  }
);

export const processWithdrawal = createAsyncThunk(
  'payment/processWithdrawal',
  async ({ provider, amount }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payment/withdraw', { provider, amount });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to process withdrawal');
    }
  }
);

// Initial state
const initialState = {
  transactions: [],
  pagination: null,
  revenueSummary: null,
  paymentAccount: null,
  balance: 0,
  loading: false,
  error: null,
};

// Slice
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch revenue summary
      .addCase(fetchRevenueSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenueSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueSummary = action.payload.data;
        state.balance = action.payload.data.currentBalance || 0;
      })
      .addCase(fetchRevenueSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch payment account
      .addCase(fetchPaymentAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentAccount = action.payload.data;
      })
      .addCase(fetchPaymentAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Connect PayPal account
      .addCase(connectPayPalAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectPayPalAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentAccount = action.payload.data;
      })
      .addCase(connectPayPalAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update withdrawal settings
      .addCase(updateWithdrawalSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWithdrawalSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentAccount = action.payload.data;
      })
      .addCase(updateWithdrawalSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Process withdrawal
      .addCase(processWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        // Update balance after withdrawal
        state.balance -= action.payload.data.amount;
        // Add the new transaction to the list
        state.transactions = [action.payload.data, ...state.transactions];
      })
      .addCase(processWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPaymentError } = paymentSlice.actions;

export default paymentSlice.reducer;

