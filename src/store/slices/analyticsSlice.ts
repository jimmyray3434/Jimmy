import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Placeholder analytics slice - will be expanded later
interface AnalyticsState {
  data: any;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  data: null,
  isLoading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;

