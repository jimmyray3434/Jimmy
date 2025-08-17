import axios from 'axios';
import { API_URL } from '../config';

// Get all content with pagination and filters
const getContent = async (params = {}, token) => {
  const { page = 1, limit = 10, status, type, search } = params;
  
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page,
      limit,
      ...(status && { status }),
      ...(type && { type }),
      ...(search && { search }),
    },
  };

  const response = await axios.get(`${API_URL}/api/content`, config);
  return response.data;
};

// Get content by ID
const getContentById = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_URL}/api/content/${id}`, config);
  return response.data;
};

// Create content manually
const createContent = async (contentData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(`${API_URL}/api/content`, contentData, config);
  return response.data;
};

// Generate content with AI
const generateContent = async (generationParams, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(
    `${API_URL}/api/content/generate`, 
    generationParams, 
    config
  );
  return response.data;
};

// Update content
const updateContent = async (id, contentData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(
    `${API_URL}/api/content/${id}`, 
    contentData, 
    config
  );
  return response.data;
};

// Delete content
const deleteContent = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(`${API_URL}/api/content/${id}`, config);
  return { ...response.data, id };
};

// Publish content
const publishContent = async (id, publishData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(
    `${API_URL}/api/content/${id}/publish`, 
    publishData, 
    config
  );
  return response.data;
};

// Schedule content
const scheduleContent = async (id, scheduleData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(
    `${API_URL}/api/content/${id}/schedule`, 
    scheduleData, 
    config
  );
  return response.data;
};

// Get content templates
const getContentTemplates = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_URL}/api/content/templates`, config);
  return response.data;
};

// Get content statistics
const getContentStats = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(`${API_URL}/api/content/stats`, config);
  return response.data;
};

// Upload image for content
const uploadContentImage = async (id, formData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  };

  const response = await axios.post(
    `${API_URL}/api/content/${id}/upload-image`, 
    formData, 
    config
  );
  return response.data;
};

const contentService = {
  getContent,
  getContentById,
  createContent,
  generateContent,
  updateContent,
  deleteContent,
  publishContent,
  scheduleContent,
  getContentTemplates,
  getContentStats,
  uploadContentImage,
};

export default contentService;

