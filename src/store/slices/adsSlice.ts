import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Placeholder ads slice - will be expanded later
interface AdsState {
  ads: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AdsState = {
  ads: [],
  isLoading: false,
  error: null,
};

const adsSlice = createSlice({
  name: 'ads',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { clearError } = adsSlice.actions;
export default adsSlice.reducer;

