import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import contentService from '../../services/contentService';

// Get all content
export const getContent = createAsyncThunk(
  'content/getAll',
  async (params, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await contentService.getContent(params, token);
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get content by ID
export const getContentById = createAsyncThunk(
  'content/getById',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await contentService.getContentById(id, token);
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create content
export const createContent = createAsyncThunk(
  'content/create',
  async (contentData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await contentService.createContent(contentData, token);
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Generate content with AI
export const generateContent = createAsyncThunk(
  'content/generate',
  async (generationParams, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await contentService.generateContent(generationParams, token);
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update content
export const updateContent = createAsyncThunk(
  'content/update',
  async ({ id, contentData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await contentService.updateContent(id, contentData, token);
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete content
export const deleteContent = createAsyncThunk(
  'content/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await contentService.deleteContent(id, token);
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Publish content
export const publishContent = createAsyncThunk(
  'content/publish',
  async ({ id, publishData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await contentService.publishContent(id, publishData, token);
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Schedule content
export const scheduleContent = createAsyncThunk(
  'content/schedule',
  async ({ id, scheduleData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await contentService.scheduleContent(id, scheduleData, token);
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  content: [],
  currentContent: null,
  generatedContent: null,
  isLoading: false,
  isGenerating: false,
  isSuccess: false,
  isError: false,
  message: '',
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

// Create slice
const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isGenerating = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentContent: (state) => {
      state.currentContent = null;
    },
    clearGeneratedContent: (state) => {
      state.generatedContent = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all content
      .addCase(getContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.content = action.payload.data;
        state.pagination = {
          page: action.payload.pagination.page,
          limit: action.payload.pagination.limit,
          total: action.payload.pagination.total,
          totalPages: action.payload.pagination.totalPages
        };
      })
      .addCase(getContent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get content by ID
      .addCase(getContentById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getContentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentContent = action.payload.data;
      })
      .addCase(getContentById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Create content
      .addCase(createContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.content.unshift(action.payload.data);
        state.currentContent = action.payload.data;
        state.message = 'Content created successfully';
      })
      .addCase(createContent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Generate content
      .addCase(generateContent.pending, (state) => {
        state.isGenerating = true;
      })
      .addCase(generateContent.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.isSuccess = true;
        state.generatedContent = action.payload.data;
        state.message = 'Content generated successfully';
      })
      .addCase(generateContent.rejected, (state, action) => {
        state.isGenerating = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update content
      .addCase(updateContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.content = state.content.map(item => 
          item._id === action.payload.data._id ? action.payload.data : item
        );
        state.currentContent = action.payload.data;
        state.message = 'Content updated successfully';
      })
      .addCase(updateContent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete content
      .addCase(deleteContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.content = state.content.filter(item => item._id !== action.payload.id);
        state.message = 'Content deleted successfully';
      })
      .addCase(deleteContent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Publish content
      .addCase(publishContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(publishContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.content = state.content.map(item => 
          item._id === action.payload.data._id ? action.payload.data : item
        );
        state.currentContent = action.payload.data;
        state.message = 'Content published successfully';
      })
      .addCase(publishContent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Schedule content
      .addCase(scheduleContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(scheduleContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.content = state.content.map(item => 
          item._id === action.payload.data._id ? action.payload.data : item
        );
        state.currentContent = action.payload.data;
        state.message = 'Content scheduled successfully';
      })
      .addCase(scheduleContent.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, clearCurrentContent, clearGeneratedContent, setPage } = contentSlice.actions;
export default contentSlice.reducer;

