import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import paymentReducer from './slices/paymentSlice';
import trafficReducer from './slices/trafficSlice';
import crmReducer from './slices/crmSlice';
import contentReducer from './slices/contentSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    payment: paymentReducer,
    traffic: trafficReducer,
    crm: crmReducer,
    content: contentReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;

