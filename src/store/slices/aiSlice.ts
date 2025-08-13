import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import aiService from '../../services/aiService';

// Types
interface AdCopyRequest {
  productName: string;
  productDescription: string;
  targetAudience: string;
  tone?: string;
  keyFeatures?: string[];
  callToAction?: string;
  maxLength?: number;
  provider?: 'openai' | 'google';
}

interface AdCopyResponse {
  headline: string;
  body: string;
  callToAction: string;
}

interface AdPerformanceRequest {
  adId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  targetAudience: string;
  adContent: string;
  provider?: 'openai' | 'google';
}

interface AdPerformanceResponse {
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

interface AudienceRecommendationsRequest {
  businessType: string;
  productCategory: string;
  campaignGoals: string;
  currentAudience?: any;
  pastPerformanceData?: any;
  provider?: 'openai' | 'google';
}

interface AudienceRecommendationsResponse {
  primaryAudience: string;
  secondaryAudiences: string[];
  demographics: any;
  interests: string[];
  behaviors: string[];
  exclusions: string[];
}

interface BudgetOptimizationRequest {
  totalBudget: number;
  campaigns: any[];
  campaignGoals: string;
  provider?: 'openai' | 'google';
}

interface BudgetOptimizationResponse {
  analysis: string;
  recommendations: string[];
  budgetAllocation: Record<string, number>;
}

interface ContentIdeasRequest {
  businessType: string;
  productCategory: string;
  targetAudience: string;
  campaignGoals: string;
  contentType?: 'all' | 'image' | 'video' | 'text';
  provider?: 'openai' | 'google';
}

interface ContentIdeasResponse {
  themes: string[];
  headlines: string[];
  visualConcepts: string[];
  copyApproaches: string[];
  callToActions: string[];
}

interface PerformancePredictionRequest {
  historicalData: any[];
  proposedChanges: any;
  provider?: 'openai' | 'google';
}

interface PerformancePredictionResponse {
  prediction: string;
  metrics: any;
  confidenceLevel: number;
  factors: string[];
}

// State interface
interface AiState {
  adCopy: {
    data: AdCopyResponse | null;
    loading: boolean;
    error: string | null;
  };
  adPerformance: {
    data: AdPerformanceResponse | null;
    loading: boolean;
    error: string | null;
  };
  audienceRecommendations: {
    data: AudienceRecommendationsResponse | null;
    loading: boolean;
    error: string | null;
  };
  budgetOptimization: {
    data: BudgetOptimizationResponse | null;
    loading: boolean;
    error: string | null;
  };
  contentIdeas: {
    data: ContentIdeasResponse | null;
    loading: boolean;
    error: string | null;
  };
  performancePrediction: {
    data: PerformancePredictionResponse | null;
    loading: boolean;
    error: string | null;
  };
}

// Initial state
const initialState: AiState = {
  adCopy: {
    data: null,
    loading: false,
    error: null
  },
  adPerformance: {
    data: null,
    loading: false,
    error: null
  },
  audienceRecommendations: {
    data: null,
    loading: false,
    error: null
  },
  budgetOptimization: {
    data: null,
    loading: false,
    error: null
  },
  contentIdeas: {
    data: null,
    loading: false,
    error: null
  },
  performancePrediction: {
    data: null,
    loading: false,
    error: null
  }
};

// Async thunks
export const generateAdCopy = createAsyncThunk(
  'ai/generateAdCopy',
  async (data: AdCopyRequest, { rejectWithValue }) => {
    try {
      const response = await aiService.generateAdCopy(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate ad copy');
    }
  }
);

export const analyzeAdPerformance = createAsyncThunk(
  'ai/analyzeAdPerformance',
  async (data: AdPerformanceRequest, { rejectWithValue }) => {
    try {
      const response = await aiService.analyzeAdPerformance(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to analyze ad performance');
    }
  }
);

export const generateAudienceRecommendations = createAsyncThunk(
  'ai/generateAudienceRecommendations',
  async (data: AudienceRecommendationsRequest, { rejectWithValue }) => {
    try {
      const response = await aiService.generateAudienceRecommendations(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate audience recommendations');
    }
  }
);

export const optimizeBudgetAllocation = createAsyncThunk(
  'ai/optimizeBudgetAllocation',
  async (data: BudgetOptimizationRequest, { rejectWithValue }) => {
    try {
      const response = await aiService.optimizeBudgetAllocation(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to optimize budget allocation');
    }
  }
);

export const generateContentIdeas = createAsyncThunk(
  'ai/generateContentIdeas',
  async (data: ContentIdeasRequest, { rejectWithValue }) => {
    try {
      const response = await aiService.generateContentIdeas(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate content ideas');
    }
  }
);

export const predictAdPerformance = createAsyncThunk(
  'ai/predictAdPerformance',
  async (data: PerformancePredictionRequest, { rejectWithValue }) => {
    try {
      const response = await aiService.predictAdPerformance(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to predict ad performance');
    }
  }
);

// Slice
const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearAdCopy: (state) => {
      state.adCopy.data = null;
      state.adCopy.error = null;
    },
    clearAdPerformance: (state) => {
      state.adPerformance.data = null;
      state.adPerformance.error = null;
    },
    clearAudienceRecommendations: (state) => {
      state.audienceRecommendations.data = null;
      state.audienceRecommendations.error = null;
    },
    clearBudgetOptimization: (state) => {
      state.budgetOptimization.data = null;
      state.budgetOptimization.error = null;
    },
    clearContentIdeas: (state) => {
      state.contentIdeas.data = null;
      state.contentIdeas.error = null;
    },
    clearPerformancePrediction: (state) => {
      state.performancePrediction.data = null;
      state.performancePrediction.error = null;
    }
  },
  extraReducers: (builder) => {
    // Generate Ad Copy
    builder.addCase(generateAdCopy.pending, (state) => {
      state.adCopy.loading = true;
      state.adCopy.error = null;
    });
    builder.addCase(generateAdCopy.fulfilled, (state, action: PayloadAction<AdCopyResponse>) => {
      state.adCopy.loading = false;
      state.adCopy.data = action.payload;
    });
    builder.addCase(generateAdCopy.rejected, (state, action) => {
      state.adCopy.loading = false;
      state.adCopy.error = action.payload as string;
    });

    // Analyze Ad Performance
    builder.addCase(analyzeAdPerformance.pending, (state) => {
      state.adPerformance.loading = true;
      state.adPerformance.error = null;
    });
    builder.addCase(analyzeAdPerformance.fulfilled, (state, action: PayloadAction<AdPerformanceResponse>) => {
      state.adPerformance.loading = false;
      state.adPerformance.data = action.payload;
    });
    builder.addCase(analyzeAdPerformance.rejected, (state, action) => {
      state.adPerformance.loading = false;
      state.adPerformance.error = action.payload as string;
    });

    // Generate Audience Recommendations
    builder.addCase(generateAudienceRecommendations.pending, (state) => {
      state.audienceRecommendations.loading = true;
      state.audienceRecommendations.error = null;
    });
    builder.addCase(generateAudienceRecommendations.fulfilled, (state, action: PayloadAction<AudienceRecommendationsResponse>) => {
      state.audienceRecommendations.loading = false;
      state.audienceRecommendations.data = action.payload;
    });
    builder.addCase(generateAudienceRecommendations.rejected, (state, action) => {
      state.audienceRecommendations.loading = false;
      state.audienceRecommendations.error = action.payload as string;
    });

    // Optimize Budget Allocation
    builder.addCase(optimizeBudgetAllocation.pending, (state) => {
      state.budgetOptimization.loading = true;
      state.budgetOptimization.error = null;
    });
    builder.addCase(optimizeBudgetAllocation.fulfilled, (state, action: PayloadAction<BudgetOptimizationResponse>) => {
      state.budgetOptimization.loading = false;
      state.budgetOptimization.data = action.payload;
    });
    builder.addCase(optimizeBudgetAllocation.rejected, (state, action) => {
      state.budgetOptimization.loading = false;
      state.budgetOptimization.error = action.payload as string;
    });

    // Generate Content Ideas
    builder.addCase(generateContentIdeas.pending, (state) => {
      state.contentIdeas.loading = true;
      state.contentIdeas.error = null;
    });
    builder.addCase(generateContentIdeas.fulfilled, (state, action: PayloadAction<ContentIdeasResponse>) => {
      state.contentIdeas.loading = false;
      state.contentIdeas.data = action.payload;
    });
    builder.addCase(generateContentIdeas.rejected, (state, action) => {
      state.contentIdeas.loading = false;
      state.contentIdeas.error = action.payload as string;
    });

    // Predict Ad Performance
    builder.addCase(predictAdPerformance.pending, (state) => {
      state.performancePrediction.loading = true;
      state.performancePrediction.error = null;
    });
    builder.addCase(predictAdPerformance.fulfilled, (state, action: PayloadAction<PerformancePredictionResponse>) => {
      state.performancePrediction.loading = false;
      state.performancePrediction.data = action.payload;
    });
    builder.addCase(predictAdPerformance.rejected, (state, action) => {
      state.performancePrediction.loading = false;
      state.performancePrediction.error = action.payload as string;
    });
  }
});

export const {
  clearAdCopy,
  clearAdPerformance,
  clearAudienceRecommendations,
  clearBudgetOptimization,
  clearContentIdeas,
  clearPerformancePrediction
} = aiSlice.actions;

export default aiSlice.reducer;

