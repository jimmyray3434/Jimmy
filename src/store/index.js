import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import contentReducer from './slices/contentSlice';
import affiliateReducer from './slices/affiliateSlice';
import productReducer from './slices/productSlice';
import analyticsReducer from './slices/analyticsSlice';
import automationReducer from './slices/automationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    content: contentReducer,
    affiliate: affiliateReducer,
    product: productReducer,
    analytics: analyticsReducer,
    automation: automationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

