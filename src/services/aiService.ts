import api from './api';

/**
 * Generate ad copy based on product/service details
 * @param data Product/service details
 * @returns Generated ad copy
 */
export const generateAdCopy = async (data: {
  productName: string;
  productDescription: string;
  targetAudience: string;
  tone?: string;
  keyFeatures?: string[];
  callToAction?: string;
  maxLength?: number;
  provider?: 'openai' | 'google';
}) => {
  try {
    const response = await api.post('/ai/generate-ad-copy', data);
    return response.data;
  } catch (error) {
    console.error('Generate ad copy error:', error);
    throw error;
  }
};

/**
 * Analyze ad performance and provide optimization suggestions
 * @param data Ad performance data
 * @returns Analysis and suggestions
 */
export const analyzeAdPerformance = async (data: {
  adId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  targetAudience: string;
  adContent: string;
  provider?: 'openai' | 'google';
}) => {
  try {
    const response = await api.post('/ai/analyze-ad-performance', data);
    return response.data;
  } catch (error) {
    console.error('Analyze ad performance error:', error);
    throw error;
  }
};

/**
 * Generate audience targeting recommendations
 * @param data Business and campaign data
 * @returns Audience targeting recommendations
 */
export const generateAudienceRecommendations = async (data: {
  businessType: string;
  productCategory: string;
  campaignGoals: string;
  currentAudience?: any;
  pastPerformanceData?: any;
  provider?: 'openai' | 'google';
}) => {
  try {
    const response = await api.post('/ai/audience-recommendations', data);
    return response.data;
  } catch (error) {
    console.error('Audience recommendations error:', error);
    throw error;
  }
};

/**
 * Optimize ad budget allocation based on performance data
 * @param data Campaign and performance data
 * @returns Budget allocation recommendations
 */
export const optimizeBudgetAllocation = async (data: {
  totalBudget: number;
  campaigns: any[];
  campaignGoals: string;
  provider?: 'openai' | 'google';
}) => {
  try {
    const response = await api.post('/ai/optimize-budget', data);
    return response.data;
  } catch (error) {
    console.error('Budget optimization error:', error);
    throw error;
  }
};

/**
 * Generate content ideas for ad campaigns
 * @param data Business and campaign data
 * @returns Content ideas
 */
export const generateContentIdeas = async (data: {
  businessType: string;
  productCategory: string;
  targetAudience: string;
  campaignGoals: string;
  contentType?: 'all' | 'image' | 'video' | 'text';
  provider?: 'openai' | 'google';
}) => {
  try {
    const response = await api.post('/ai/content-ideas', data);
    return response.data;
  } catch (error) {
    console.error('Content ideas generation error:', error);
    throw error;
  }
};

/**
 * Predict ad performance based on historical data and proposed changes
 * @param data Historical data and proposed changes
 * @returns Performance predictions
 */
export const predictAdPerformance = async (data: {
  historicalData: any[];
  proposedChanges: any;
  provider?: 'openai' | 'google';
}) => {
  try {
    const response = await api.post('/ai/predict-performance', data);
    return response.data;
  } catch (error) {
    console.error('Performance prediction error:', error);
    throw error;
  }
};

export default {
  generateAdCopy,
  analyzeAdPerformance,
  generateAudienceRecommendations,
  optimizeBudgetAllocation,
  generateContentIdeas,
  predictAdPerformance
};

