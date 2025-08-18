import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchCampaigns = createAsyncThunk(
  'traffic/fetchCampaigns',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/traffic/campaigns', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch campaigns');
    }
  }
);

export const fetchCampaignById = createAsyncThunk(
  'traffic/fetchCampaignById',
  async (campaignId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/traffic/campaigns/${campaignId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch campaign');
    }
  }
);

export const fetchTrafficStats = createAsyncThunk(
  'traffic/fetchTrafficStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/traffic/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch traffic statistics');
    }
  }
);

export const generateTraffic = createAsyncThunk(
  'traffic/generateTraffic',
  async (contentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/traffic/generate/${contentId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to generate traffic');
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'traffic/updateCampaign',
  async ({ campaignId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/traffic/campaigns/${campaignId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update campaign');
    }
  }
);

export const fetchSocialAccounts = createAsyncThunk(
  'traffic/fetchSocialAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/traffic/social-accounts');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch social accounts');
    }
  }
);

export const addSocialAccount = createAsyncThunk(
  'traffic/addSocialAccount',
  async (accountData, { rejectWithValue }) => {
    try {
      const response = await api.post('/traffic/social-accounts', accountData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add social account');
    }
  }
);

export const updateSocialAccount = createAsyncThunk(
  'traffic/updateSocialAccount',
  async ({ platform, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/traffic/social-accounts/${platform}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update social account');
    }
  }
);

export const disconnectSocialAccount = createAsyncThunk(
  'traffic/disconnectSocialAccount',
  async (platform, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/traffic/social-accounts/${platform}`);
      return { ...response.data, platform };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to disconnect social account');
    }
  }
);

// Initial state
const initialState = {
  campaigns: [],
  currentCampaign: null,
  trafficStats: null,
  socialAccounts: [],
  pagination: null,
  loading: false,
  error: null,
};

// Slice
const trafficSlice = createSlice({
  name: 'traffic',
  initialState,
  reducers: {
    clearTrafficError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch campaigns
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch campaign by ID
      .addCase(fetchCampaignById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaignById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCampaign = action.payload.data;
      })
      .addCase(fetchCampaignById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch traffic stats
      .addCase(fetchTrafficStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrafficStats.fulfilled, (state, action) => {
        state.loading = false;
        state.trafficStats = action.payload.data;
      })
      .addCase(fetchTrafficStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Generate traffic
      .addCase(generateTraffic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateTraffic.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update campaign in the list if it exists
        if (action.payload.data && action.payload.data.campaign) {
          const campaignIndex = state.campaigns.findIndex(
            campaign => campaign._id === action.payload.data.campaign._id
          );
          
          if (campaignIndex !== -1) {
            state.campaigns[campaignIndex] = action.payload.data.campaign;
          }
          
          // Update current campaign if it matches
          if (state.currentCampaign && state.currentCampaign._id === action.payload.data.campaign._id) {
            state.currentCampaign = action.payload.data.campaign;
          }
        }
      })
      .addCase(generateTraffic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update campaign
      .addCase(updateCampaign.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update campaign in the list
        const campaignIndex = state.campaigns.findIndex(
          campaign => campaign._id === action.payload.data._id
        );
        
        if (campaignIndex !== -1) {
          state.campaigns[campaignIndex] = action.payload.data;
        }
        
        // Update current campaign if it matches
        if (state.currentCampaign && state.currentCampaign._id === action.payload.data._id) {
          state.currentCampaign = action.payload.data;
        }
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch social accounts
      .addCase(fetchSocialAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSocialAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.socialAccounts = action.payload.data;
      })
      .addCase(fetchSocialAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add social account
      .addCase(addSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        
        // Add or update account in the list
        const accountIndex = state.socialAccounts.findIndex(
          account => account.platform === action.payload.data.platform
        );
        
        if (accountIndex !== -1) {
          state.socialAccounts[accountIndex] = action.payload.data;
        } else {
          state.socialAccounts.push(action.payload.data);
        }
      })
      .addCase(addSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update social account
      .addCase(updateSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update account in the list
        const accountIndex = state.socialAccounts.findIndex(
          account => account.platform === action.payload.data.platform
        );
        
        if (accountIndex !== -1) {
          state.socialAccounts[accountIndex] = action.payload.data;
        }
      })
      .addCase(updateSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Disconnect social account
      .addCase(disconnectSocialAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(disconnectSocialAccount.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update account in the list
        const accountIndex = state.socialAccounts.findIndex(
          account => account.platform === action.payload.platform
        );
        
        if (accountIndex !== -1) {
          state.socialAccounts[accountIndex] = action.payload.data;
        }
      })
      .addCase(disconnectSocialAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTrafficError } = trafficSlice.actions;

export default trafficSlice.reducer;

