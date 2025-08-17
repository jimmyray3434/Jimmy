import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchLeads = createAsyncThunk(
  'crm/fetchLeads',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/crm/leads', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leads');
    }
  }
);

export const fetchLeadById = createAsyncThunk(
  'crm/fetchLeadById',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/crm/leads/${leadId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch lead');
    }
  }
);

export const createLead = createAsyncThunk(
  'crm/createLead',
  async (leadData, { rejectWithValue }) => {
    try {
      const response = await api.post('/crm/leads', leadData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create lead');
    }
  }
);

export const updateLead = createAsyncThunk(
  'crm/updateLead',
  async ({ leadId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/crm/leads/${leadId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update lead');
    }
  }
);

export const deleteLead = createAsyncThunk(
  'crm/deleteLead',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/crm/leads/${leadId}`);
      return { ...response.data, leadId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete lead');
    }
  }
);

export const convertLead = createAsyncThunk(
  'crm/convertLead',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/crm/leads/${leadId}/convert`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to convert lead');
    }
  }
);

export const addLeadActivity = createAsyncThunk(
  'crm/addLeadActivity',
  async ({ leadId, activity }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/crm/leads/${leadId}/activity`, activity);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add lead activity');
    }
  }
);

export const fetchContacts = createAsyncThunk(
  'crm/fetchContacts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/crm/contacts', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch contacts');
    }
  }
);

export const fetchContactById = createAsyncThunk(
  'crm/fetchContactById',
  async (contactId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/crm/contacts/${contactId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch contact');
    }
  }
);

export const createContact = createAsyncThunk(
  'crm/createContact',
  async (contactData, { rejectWithValue }) => {
    try {
      const response = await api.post('/crm/contacts', contactData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create contact');
    }
  }
);

export const updateContact = createAsyncThunk(
  'crm/updateContact',
  async ({ contactId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/crm/contacts/${contactId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update contact');
    }
  }
);

export const deleteContact = createAsyncThunk(
  'crm/deleteContact',
  async (contactId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/crm/contacts/${contactId}`);
      return { ...response.data, contactId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete contact');
    }
  }
);

export const addContactActivity = createAsyncThunk(
  'crm/addContactActivity',
  async ({ contactId, activity }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/crm/contacts/${contactId}/activity`, activity);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add contact activity');
    }
  }
);

export const recordContactPurchase = createAsyncThunk(
  'crm/recordContactPurchase',
  async ({ contactId, amount }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/crm/contacts/${contactId}/purchase`, { amount });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to record purchase');
    }
  }
);

export const fetchAutomations = createAsyncThunk(
  'crm/fetchAutomations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/crm/automations', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch automations');
    }
  }
);

export const createAutomation = createAsyncThunk(
  'crm/createAutomation',
  async (automationData, { rejectWithValue }) => {
    try {
      const response = await api.post('/crm/automations', automationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create automation');
    }
  }
);

export const fetchEmailTemplates = createAsyncThunk(
  'crm/fetchEmailTemplates',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/crm/email-templates', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch email templates');
    }
  }
);

export const createEmailTemplate = createAsyncThunk(
  'crm/createEmailTemplate',
  async (templateData, { rejectWithValue }) => {
    try {
      const response = await api.post('/crm/email-templates', templateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create email template');
    }
  }
);

export const fetchLeadStats = createAsyncThunk(
  'crm/fetchLeadStats',
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, this would be a dedicated endpoint
      // For now, we'll simulate it by combining data from leads and contacts endpoints
      
      // Get lead counts
      const leadsResponse = await api.get('/crm/leads', { params: { limit: 1 } });
      
      // Get contact counts
      const contactsResponse = await api.get('/crm/contacts', { params: { limit: 1 } });
      
      // Simulate lead stats
      const leadStats = {
        leads: {
          totalLeads: leadsResponse.data.pagination?.total || 0,
          newLeads: 0,
          qualifiedLeads: 0,
          disqualifiedLeads: 0,
          convertedLeads: 0,
          leadsCreatedInPeriod: 0,
          leadsConvertedInPeriod: 0,
          conversionRate: 0,
          qualificationRate: 0
        },
        contacts: {
          totalContacts: contactsResponse.data.pagination?.total || 0,
          activeContacts: 0,
          customerContacts: 0,
          contactsCreatedInPeriod: 0
        }
      };
      
      // If we have leads, get the status breakdown
      if (leadStats.leads.totalLeads > 0) {
        const newLeadsResponse = await api.get('/crm/leads', { params: { status: 'new', limit: 1 } });
        const qualifiedLeadsResponse = await api.get('/crm/leads', { params: { status: 'qualified', limit: 1 } });
        const disqualifiedLeadsResponse = await api.get('/crm/leads', { params: { status: 'disqualified', limit: 1 } });
        const convertedLeadsResponse = await api.get('/crm/leads', { params: { status: 'converted', limit: 1 } });
        
        leadStats.leads.newLeads = newLeadsResponse.data.pagination?.total || 0;
        leadStats.leads.qualifiedLeads = qualifiedLeadsResponse.data.pagination?.total || 0;
        leadStats.leads.disqualifiedLeads = disqualifiedLeadsResponse.data.pagination?.total || 0;
        leadStats.leads.convertedLeads = convertedLeadsResponse.data.pagination?.total || 0;
        
        // Calculate rates
        leadStats.leads.conversionRate = leadStats.leads.totalLeads > 0 
          ? (leadStats.leads.convertedLeads / leadStats.leads.totalLeads) * 100 
          : 0;
          
        leadStats.leads.qualificationRate = leadStats.leads.totalLeads > 0 
          ? ((leadStats.leads.qualifiedLeads + leadStats.leads.convertedLeads) / leadStats.leads.totalLeads) * 100 
          : 0;
      }
      
      // If we have contacts, get the status breakdown
      if (leadStats.contacts.totalContacts > 0) {
        const activeContactsResponse = await api.get('/crm/contacts', { params: { status: 'active', limit: 1 } });
        const customerContactsResponse = await api.get('/crm/contacts', { params: { status: 'customer', limit: 1 } });
        
        leadStats.contacts.activeContacts = activeContactsResponse.data.pagination?.total || 0;
        leadStats.contacts.customerContacts = customerContactsResponse.data.pagination?.total || 0;
      }
      
      return { data: leadStats };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch lead statistics');
    }
  }
);

// Initial state
const initialState = {
  leads: [],
  currentLead: null,
  contacts: [],
  currentContact: null,
  automations: [],
  emailTemplates: [],
  leadStats: null,
  pagination: null,
  loading: false,
  error: null,
};

// Slice
const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    clearCrmError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leads
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch lead by ID
      .addCase(fetchLeadById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLead = action.payload.data;
      })
      .addCase(fetchLeadById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create lead
      .addCase(createLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = [action.payload.data, ...state.leads];
      })
      .addCase(createLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update lead
      .addCase(updateLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update lead in the list
        const leadIndex = state.leads.findIndex(
          lead => lead._id === action.payload.data._id
        );
        
        if (leadIndex !== -1) {
          state.leads[leadIndex] = action.payload.data;
        }
        
        // Update current lead if it matches
        if (state.currentLead && state.currentLead._id === action.payload.data._id) {
          state.currentLead = action.payload.data;
        }
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete lead
      .addCase(deleteLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.loading = false;
        
        // Remove lead from the list
        state.leads = state.leads.filter(lead => lead._id !== action.payload.leadId);
        
        // Clear current lead if it matches
        if (state.currentLead && state.currentLead._id === action.payload.leadId) {
          state.currentLead = null;
        }
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Convert lead
      .addCase(convertLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(convertLead.fulfilled, (state, action) => {
        state.loading = false;
        
        // Add new contact to the list
        state.contacts = [action.payload.data, ...state.contacts];
        
        // Update lead in the list
        const leadId = state.currentLead?._id;
        if (leadId) {
          const leadIndex = state.leads.findIndex(lead => lead._id === leadId);
          
          if (leadIndex !== -1) {
            state.leads[leadIndex] = {
              ...state.leads[leadIndex],
              status: 'converted',
              convertedAt: new Date().toISOString(),
              convertedContactId: action.payload.data._id
            };
          }
          
          // Update current lead
          if (state.currentLead) {
            state.currentLead = {
              ...state.currentLead,
              status: 'converted',
              convertedAt: new Date().toISOString(),
              convertedContactId: action.payload.data._id
            };
          }
        }
      })
      .addCase(convertLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add lead activity
      .addCase(addLeadActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addLeadActivity.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update current lead if it matches
        if (state.currentLead && state.currentLead._id === action.payload.data._id) {
          state.currentLead = action.payload.data;
        }
        
        // Update lead in the list
        const leadIndex = state.leads.findIndex(
          lead => lead._id === action.payload.data._id
        );
        
        if (leadIndex !== -1) {
          state.leads[leadIndex] = action.payload.data;
        }
      })
      .addCase(addLeadActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch contacts
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch contact by ID
      .addCase(fetchContactById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContactById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentContact = action.payload.data;
      })
      .addCase(fetchContactById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create contact
      .addCase(createContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = [action.payload.data, ...state.contacts];
      })
      .addCase(createContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update contact
      .addCase(updateContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update contact in the list
        const contactIndex = state.contacts.findIndex(
          contact => contact._id === action.payload.data._id
        );
        
        if (contactIndex !== -1) {
          state.contacts[contactIndex] = action.payload.data;
        }
        
        // Update current contact if it matches
        if (state.currentContact && state.currentContact._id === action.payload.data._id) {
          state.currentContact = action.payload.data;
        }
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete contact
      .addCase(deleteContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.loading = false;
        
        // Remove contact from the list
        state.contacts = state.contacts.filter(contact => contact._id !== action.payload.contactId);
        
        // Clear current contact if it matches
        if (state.currentContact && state.currentContact._id === action.payload.contactId) {
          state.currentContact = null;
        }
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add contact activity
      .addCase(addContactActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addContactActivity.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update current contact if it matches
        if (state.currentContact && state.currentContact._id === action.payload.data._id) {
          state.currentContact = action.payload.data;
        }
        
        // Update contact in the list
        const contactIndex = state.contacts.findIndex(
          contact => contact._id === action.payload.data._id
        );
        
        if (contactIndex !== -1) {
          state.contacts[contactIndex] = action.payload.data;
        }
      })
      .addCase(addContactActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Record contact purchase
      .addCase(recordContactPurchase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordContactPurchase.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update current contact if it matches
        if (state.currentContact && state.currentContact._id === action.payload.data._id) {
          state.currentContact = action.payload.data;
        }
        
        // Update contact in the list
        const contactIndex = state.contacts.findIndex(
          contact => contact._id === action.payload.data._id
        );
        
        if (contactIndex !== -1) {
          state.contacts[contactIndex] = action.payload.data;
        }
      })
      .addCase(recordContactPurchase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch automations
      .addCase(fetchAutomations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAutomations.fulfilled, (state, action) => {
        state.loading = false;
        state.automations = action.payload.data;
      })
      .addCase(fetchAutomations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create automation
      .addCase(createAutomation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAutomation.fulfilled, (state, action) => {
        state.loading = false;
        state.automations = [action.payload.data, ...state.automations];
      })
      .addCase(createAutomation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch email templates
      .addCase(fetchEmailTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.emailTemplates = action.payload.data;
      })
      .addCase(fetchEmailTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create email template
      .addCase(createEmailTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmailTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.emailTemplates = [action.payload.data, ...state.emailTemplates];
      })
      .addCase(createEmailTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch lead stats
      .addCase(fetchLeadStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeadStats.fulfilled, (state, action) => {
        state.loading = false;
        state.leadStats = action.payload.data;
      })
      .addCase(fetchLeadStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCrmError } = crmSlice.actions;

export default crmSlice.reducer;

