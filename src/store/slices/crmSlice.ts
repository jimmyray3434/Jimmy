import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { crmService } from '../../services/crmService';

export interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'lost';
  source: 'website' | 'referral' | 'social_media' | 'advertising' | 'cold_outreach' | 'event' | 'other';
  totalSpent: number;
  averageOrderValue: number;
  lifetimeValue: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  engagementScore: number;
  tags: string[];
  notes: Array<{
    _id: string;
    content: string;
    createdBy: string;
    createdAt: string;
  }>;
  communications: Array<{
    _id: string;
    type: 'email' | 'phone' | 'meeting' | 'note' | 'task';
    subject: string;
    description?: string;
    status: 'pending' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    scheduledDate?: string;
    completedDate?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ClientStats {
  _id: string;
  count: number;
  totalValue: number;
}

interface CRMDashboard {
  clientStats: ClientStats[];
  overdueFollowUps: number;
  recentCommunications: Array<{
    clientName: string;
    communication: any;
  }>;
  topClients: Array<{
    _id: string;
    name: string;
    company?: string;
    totalSpent: number;
  }>;
}

interface CRMState {
  clients: Client[];
  currentClient: Client | null;
  dashboard: CRMDashboard | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    status?: string;
    search?: string;
  };
}

const initialState: CRMState = {
  clients: [],
  currentClient: null,
  dashboard: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchClients = createAsyncThunk(
  'crm/fetchClients',
  async (params: { page?: number; limit?: number; status?: string; search?: string }, { rejectWithValue }) => {
    try {
      const response = await crmService.getClients(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients');
    }
  }
);

export const fetchClient = createAsyncThunk(
  'crm/fetchClient',
  async (clientId: string, { rejectWithValue }) => {
    try {
      const response = await crmService.getClient(clientId);
      return response.data.client;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch client');
    }
  }
);

export const createClient = createAsyncThunk(
  'crm/createClient',
  async (clientData: Partial<Client>, { rejectWithValue }) => {
    try {
      const response = await crmService.createClient(clientData);
      return response.data.client;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create client');
    }
  }
);

export const updateClient = createAsyncThunk(
  'crm/updateClient',
  async ({ clientId, updates }: { clientId: string; updates: Partial<Client> }, { rejectWithValue }) => {
    try {
      const response = await crmService.updateClient(clientId, updates);
      return response.data.client;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update client');
    }
  }
);

export const deleteClient = createAsyncThunk(
  'crm/deleteClient',
  async (clientId: string, { rejectWithValue }) => {
    try {
      await crmService.deleteClient(clientId);
      return clientId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete client');
    }
  }
);

export const addCommunication = createAsyncThunk(
  'crm/addCommunication',
  async ({ clientId, communication }: { clientId: string; communication: any }, { rejectWithValue }) => {
    try {
      const response = await crmService.addCommunication(clientId, communication);
      return response.data.client;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add communication');
    }
  }
);

export const addNote = createAsyncThunk(
  'crm/addNote',
  async ({ clientId, content }: { clientId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await crmService.addNote(clientId, content);
      return response.data.client;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add note');
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  'crm/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await crmService.getDashboard();
      return response.data.dashboard;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard');
    }
  }
);

const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<{ status?: string; search?: string }>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentClient: (state, action: PayloadAction<Client | null>) => {
      state.currentClient = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch clients
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload.clients;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single client
      .addCase(fetchClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentClient = action.payload;
        state.error = null;
      })
      .addCase(fetchClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create client
      .addCase(createClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients.unshift(action.payload);
        state.error = null;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update client
      .addCase(updateClient.fulfilled, (state, action) => {
        const index = state.clients.findIndex(client => client._id === action.payload._id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.currentClient && state.currentClient._id === action.payload._id) {
          state.currentClient = action.payload;
        }
      })
      // Delete client
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.clients = state.clients.filter(client => client._id !== action.payload);
        if (state.currentClient && state.currentClient._id === action.payload) {
          state.currentClient = null;
        }
      })
      // Add communication
      .addCase(addCommunication.fulfilled, (state, action) => {
        const index = state.clients.findIndex(client => client._id === action.payload._id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.currentClient && state.currentClient._id === action.payload._id) {
          state.currentClient = action.payload;
        }
      })
      // Add note
      .addCase(addNote.fulfilled, (state, action) => {
        const index = state.clients.findIndex(client => client._id === action.payload._id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.currentClient && state.currentClient._id === action.payload._id) {
          state.currentClient = action.payload;
        }
      })
      // Fetch dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, clearFilters, setCurrentClient } = crmSlice.actions;
export default crmSlice.reducer;

