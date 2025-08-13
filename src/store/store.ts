import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import crmSlice from './slices/crmSlice';
import analyticsSlice from './slices/analyticsSlice';
import adsSlice from './slices/adsSlice';
import subscriptionSlice from './slices/subscriptionSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    crm: crmSlice,
    analytics: analyticsSlice,
    ads: adsSlice,
    subscription: subscriptionSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
