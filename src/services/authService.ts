import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      await AsyncStorage.multiRemove(['authToken', 'user']);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  async register(email: string, password: string, name: string) {
    const response = await api.post('/auth/register', { email, password, name });
    
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  async logout() {
    await AsyncStorage.multiRemove(['authToken', 'user']);
    return api.post('/auth/logout');
  },

  async getCurrentUser() {
    return api.get('/auth/me');
  },

  async forgotPassword(email: string) {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string) {
    return api.post('/auth/reset-password', { token, password });
  },

  async refreshToken() {
    return api.post('/auth/refresh');
  },

  async getStoredToken() {
    return AsyncStorage.getItem('authToken');
  },

  async getStoredUser() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default api;

