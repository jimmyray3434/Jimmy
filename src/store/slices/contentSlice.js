import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchContent = createAsyncThunk(
  'content/fetchContent',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/content', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch content');
    }
  }
);

export const fetchContentById = createAsyncThunk(
  'content/fetchContentById',
  async (contentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/content/${contentId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch content');
    }
  }
);

export const createContent = createAsyncThunk(
  'content/createContent',
  async (contentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/content', contentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create content');
    }
  }
);

export const updateContent = createAsyncThunk(
  'content/updateContent',
  async ({ contentId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/content/${contentId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update content');
    }
  }
);

export const deleteContent = createAsyncThunk(
  'content/deleteContent',
  async (contentId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/content/${contentId}`);
      return { ...response.data, contentId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete content');
    }
  }
);

export const publishContent = createAsyncThunk(
  'content/publishContent',
  async (contentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/content/${contentId}/publish`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to publish content');
    }
  }
);

export const archiveContent = createAsyncThunk(
  'content/archiveContent',
  async (contentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/content/${contentId}/archive`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to archive content');
    }
  }
);

export const generateContent = createAsyncThunk(
  'content/generateContent',
  async (promptData, { rejectWithValue }) => {
    try {
      const response = await api.post('/content/generate', promptData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to generate content');
    }
  }
);

export const generateTrafficForContent = createAsyncThunk(
  'content/generateTrafficForContent',
  async (contentId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/content/${contentId}/generate-traffic`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to generate traffic');
    }
  }
);

export const fetchContentStats = createAsyncThunk(
  'content/fetchContentStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/content/stats/performance');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch content statistics');
    }
  }
);

// Initial state
const initialState = {
  content: [],
  currentContent: null,
  contentStats: null,
  pagination: null,
  loading: false,
  error: null,
};

// Slice
const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    clearContentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch content
      .addCase(fetchContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContent.fulfilled, (state, action) => {
        state.loading = false;
        state.content = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch content by ID
      .addCase(fetchContentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentContent = action.payload.data;
      })
      .addCase(fetchContentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create content
      .addCase(createContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createContent.fulfilled, (state, action) => {
        state.loading = false;
        state.content = [action.payload.data, ...state.content];
      })
      .addCase(createContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update content
      .addCase(updateContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContent.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update content in the list
        const contentIndex = state.content.findIndex(
          item => item._id === action.payload.data._id
        );
        
        if (contentIndex !== -1) {
          state.content[contentIndex] = action.payload.data;
        }
        
        // Update current content if it matches
        if (state.currentContent && state.currentContent._id === action.payload.data._id) {
          state.currentContent = action.payload.data;
        }
      })
      .addCase(updateContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete content
      .addCase(deleteContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContent.fulfilled, (state, action) => {
        state.loading = false;
        
        // Remove content from the list
        state.content = state.content.filter(item => item._id !== action.payload.contentId);
        
        // Clear current content if it matches
        if (state.currentContent && state.currentContent._id === action.payload.contentId) {
          state.currentContent = null;
        }
      })
      .addCase(deleteContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Publish content
      .addCase(publishContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(publishContent.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update content in the list
        const contentIndex = state.content.findIndex(
          item => item._id === action.payload.data._id
        );
        
        if (contentIndex !== -1) {
          state.content[contentIndex] = action.payload.data;
        }
        
        // Update current content if it matches
        if (state.currentContent && state.currentContent._id === action.payload.data._id) {
          state.currentContent = action.payload.data;
        }
      })
      .addCase(publishContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Archive content
      .addCase(archiveContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(archiveContent.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update content in the list
        const contentIndex = state.content.findIndex(
          item => item._id === action.payload.data._id
        );
        
        if (contentIndex !== -1) {
          state.content[contentIndex] = action.payload.data;
        }
        
        // Update current content if it matches
        if (state.currentContent && state.currentContent._id === action.payload.data._id) {
          state.currentContent = action.payload.data;
        }
      })
      .addCase(archiveContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Generate content
      .addCase(generateContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateContent.fulfilled, (state, action) => {
        state.loading = false;
        state.content = [action.payload.data, ...state.content];
        state.currentContent = action.payload.data;
      })
      .addCase(generateContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Generate traffic for content
      .addCase(generateTrafficForContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateTrafficForContent.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update content in the list if it exists
        if (action.payload.data && action.payload.data.content) {
          const contentIndex = state.content.findIndex(
            item => item._id === action.payload.data.content._id
          );
          
          if (contentIndex !== -1) {
            state.content[contentIndex] = action.payload.data.content;
          }
          
          // Update current content if it matches
          if (state.currentContent && state.currentContent._id === action.payload.data.content._id) {
            state.currentContent = action.payload.data.content;
          }
        }
      })
      .addCase(generateTrafficForContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch content stats
      .addCase(fetchContentStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContentStats.fulfilled, (state, action) => {
        state.loading = false;
        state.contentStats = action.payload.data;
      })
      .addCase(fetchContentStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearContentError } = contentSlice.actions;

export default contentSlice.reducer;

