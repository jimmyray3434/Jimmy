import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

// Register user
const register = async (userData) => {
  const response = await axios.post(`${API_URL}/api/auth/register`, userData);

  if (response.data.success) {
    await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
    await AsyncStorage.setItem('token', response.data.data.token);
    return response.data.data;
  }

  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(`${API_URL}/api/auth/login`, userData);

  if (response.data.success) {
    await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));
    await AsyncStorage.setItem('token', response.data.data.token);
    return response.data.data;
  }

  return response.data;
};

// Logout user
const logout = async () => {
  await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('token');
  return { success: true };
};

// Get user profile
const getProfile = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_URL}/api/auth/me`, config);
  return response.data;
};

// Update user profile
const updateProfile = async (userData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(`${API_URL}/api/users/profile`, userData, config);
  
  if (response.data.success) {
    await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
    return response.data.data;
  }

  return response.data;
};

// Update API keys
const updateApiKeys = async (apiKeys, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(`${API_URL}/api/users/api-keys`, apiKeys, config);
  
  if (response.data.success) {
    const user = JSON.parse(await AsyncStorage.getItem('user'));
    user.apiKeys = response.data.data.apiKeys;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return response.data.data;
  }

  return response.data;
};

// Update user settings
const updateSettings = async (settings, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(`${API_URL}/api/users/settings`, settings, config);
  
  if (response.data.success) {
    const user = JSON.parse(await AsyncStorage.getItem('user'));
    user.settings = response.data.data.settings;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return response.data.data;
  }

  return response.data;
};

const authService = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  updateApiKeys,
  updateSettings,
};

export default authService;

