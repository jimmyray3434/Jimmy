const axios = require('axios');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

// Initialize Google AI client
const googleAi = process.env.GOOGLE_AI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) 
  : null;

/**
 * Generate ad copy based on product/service details
 * @param {Object} data - Product/service details
 * @returns {Promise<Object>} Generated ad copy
 */
const generateAdCopy = async (data) => {
  try {
    const { 
      productName, 
      productDescription, 
      targetAudience, 
      tone, 
      keyFeatures = [], 
      callToAction,
      maxLength = 200,
      provider = 'openai'
    } = data;

    // Validate required fields
    if (!productName || !productDescription || !targetAudience) {
      throw new Error('Missing required fields: productName, productDescription, targetAudience');
    }

    // Format key features as bullet points
    const featuresText = keyFeatures.length > 0 
      ? `Key features to highlight:\n${keyFeatures.map(f => `- ${f}`).join('\n')}`
      : '';

    // Construct prompt
    const prompt = `
      Generate compelling ad copy for the following product/service:
      
      Product/Service Name: ${productName}
      
      Product/Service Description: ${productDescription}
      
      Target Audience: ${targetAudience}
      
      ${featuresText}
      
      Tone: ${tone || 'Professional and engaging'}
      
      Call to Action: ${callToAction || 'Learn more'}
      
      Maximum Length: ${maxLength} characters
      
      The ad copy should be attention-grabbing, highlight the value proposition, and include the call to action.
      Format the response as a JSON object with "headline" (short, catchy headline), "body" (main ad copy), and "callToAction" fields.
    `;

    let result;
    
    // Use the specified AI provider
    if (provider === 'google' && googleAi) {
      result = await generateWithGoogleAI(prompt);
    } else if (provider === 'openai' && openai) {
      result = await generateWithOpenAI(prompt);
    } else {
      throw new Error(`AI provider "${provider}" not available or not configured`);
    }

    return result;
  } catch (error) {
    console.error('Ad copy generation error:', error);
    throw new Error(`Failed to generate ad copy: ${error.message}`);
  }
};

/**
 * Generate with OpenAI
 * @param {string} prompt - The prompt to send to OpenAI
 * @returns {Promise<Object>} Generated content
 */
const generateWithOpenAI = async (prompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert marketing copywriter specializing in creating compelling ad copy.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw new Error(`OpenAI generation failed: ${error.message}`);
  }
};

/**
 * Generate with Google AI
 * @param {string} prompt - The prompt to send to Google AI
 * @returns {Promise<Object>} Generated content
 */
const generateWithGoogleAI = async (prompt) => {
  try {
    const model = googleAi.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse JSON from Google AI response');
    }
  } catch (error) {
    console.error('Google AI generation error:', error);
    throw new Error(`Google AI generation failed: ${error.message}`);
  }
};

/**
 * Analyze ad performance and provide optimization suggestions
 * @param {Object} adData - Ad performance data
 * @returns {Promise<Object>} Analysis and suggestions
 */
const analyzeAdPerformance = async (adData) => {
  try {
    const { 
      adId, 
      impressions, 
      clicks, 
      conversions, 
      spend,
      targetAudience,
      adContent,
      provider = 'openai'
    } = adData;

    // Calculate key metrics
    const ctr = clicks > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;

    // Construct prompt
    const prompt = `
      Analyze the following ad performance data and provide optimization suggestions:
      
      Ad Performance Metrics:
      - Impressions: ${impressions}
      - Clicks: ${clicks}
      - Conversions: ${conversions}
      - Spend: $${spend}
      - CTR: ${ctr.toFixed(2)}%
      - Conversion Rate: ${conversionRate.toFixed(2)}%
      - Cost per Acquisition: $${cpa.toFixed(2)}
      - Cost per Click: $${cpc.toFixed(2)}
      
      Target Audience: ${targetAudience}
      
      Ad Content:
      ${adContent}
      
      Provide a detailed analysis of the ad performance and specific, actionable suggestions for optimization.
      Format the response as a JSON object with "analysis" (overall performance assessment), "strengths" (array of what's working well),
      "weaknesses" (array of issues), and "suggestions" (array of specific optimization recommendations).
    `;

    let result;
    
    // Use the specified AI provider
    if (provider === 'google' && googleAi) {
      result = await generateWithGoogleAI(prompt);
    } else if (provider === 'openai' && openai) {
      result = await generateWithOpenAI(prompt);
    } else {
      throw new Error(`AI provider "${provider}" not available or not configured`);
    }

    return result;
  } catch (error) {
    console.error('Ad performance analysis error:', error);
    throw new Error(`Failed to analyze ad performance: ${error.message}`);
  }
};

/**
 * Generate audience targeting recommendations
 * @param {Object} data - Business and campaign data
 * @returns {Promise<Object>} Audience targeting recommendations
 */
const generateAudienceRecommendations = async (data) => {
  try {
    const { 
      businessType, 
      productCategory, 
      currentAudience = {},
      campaignGoals,
      pastPerformanceData = {},
      provider = 'openai'
    } = data;

    // Construct prompt
    const prompt = `
      Generate audience targeting recommendations for the following business:
      
      Business Type: ${businessType}
      Product Category: ${productCategory}
      Campaign Goals: ${campaignGoals}
      
      Current Audience Targeting:
      ${JSON.stringify(currentAudience, null, 2)}
      
      Past Performance Data:
      ${JSON.stringify(pastPerformanceData, null, 2)}
      
      Provide detailed audience targeting recommendations including demographics, interests, behaviors, and lookalike audiences.
      Format the response as a JSON object with "primaryAudience" (description of ideal primary audience),
      "secondaryAudiences" (array of potential secondary audiences), "demographics" (recommended demographic targeting),
      "interests" (array of recommended interest categories), "behaviors" (array of recommended behavior targeting),
      and "exclusions" (audiences to exclude).
    `;

    let result;
    
    // Use the specified AI provider
    if (provider === 'google' && googleAi) {
      result = await generateWithGoogleAI(prompt);
    } else if (provider === 'openai' && openai) {
      result = await generateWithOpenAI(prompt);
    } else {
      throw new Error(`AI provider "${provider}" not available or not configured`);
    }

    return result;
  } catch (error) {
    console.error('Audience recommendations error:', error);
    throw new Error(`Failed to generate audience recommendations: ${error.message}`);
  }
};

/**
 * Optimize ad budget allocation based on performance data
 * @param {Object} data - Campaign and performance data
 * @returns {Promise<Object>} Budget allocation recommendations
 */
const optimizeBudgetAllocation = async (data) => {
  try {
    const { 
      totalBudget, 
      campaigns = [], 
      campaignGoals,
      provider = 'openai'
    } = data;

    // Construct prompt
    const prompt = `
      Optimize budget allocation for the following advertising campaigns:
      
      Total Budget: $${totalBudget}
      Campaign Goals: ${campaignGoals}
      
      Campaign Performance Data:
      ${JSON.stringify(campaigns, null, 2)}
      
      Analyze the performance of each campaign and provide recommendations for optimal budget allocation.
      Consider metrics such as CTR, conversion rate, CPA, and ROAS when making recommendations.
      Format the response as a JSON object with "analysis" (overall analysis of current performance),
      "recommendations" (array of specific budget allocation recommendations), and "budgetAllocation"
      (object with campaign IDs as keys and recommended budget amounts as values).
    `;

    let result;
    
    // Use the specified AI provider
    if (provider === 'google' && googleAi) {
      result = await generateWithGoogleAI(prompt);
    } else if (provider === 'openai' && openai) {
      result = await generateWithOpenAI(prompt);
    } else {
      throw new Error(`AI provider "${provider}" not available or not configured`);
    }

    return result;
  } catch (error) {
    console.error('Budget optimization error:', error);
    throw new Error(`Failed to optimize budget allocation: ${error.message}`);
  }
};

/**
 * Generate content ideas for ad campaigns
 * @param {Object} data - Business and campaign data
 * @returns {Promise<Object>} Content ideas
 */
const generateContentIdeas = async (data) => {
  try {
    const { 
      businessType, 
      productCategory, 
      targetAudience,
      campaignGoals,
      contentType = 'all', // 'all', 'image', 'video', 'text'
      provider = 'openai'
    } = data;

    // Construct prompt
    const prompt = `
      Generate creative content ideas for ad campaigns for the following business:
      
      Business Type: ${businessType}
      Product Category: ${productCategory}
      Target Audience: ${targetAudience}
      Campaign Goals: ${campaignGoals}
      Content Type: ${contentType}
      
      Provide creative and engaging content ideas that will resonate with the target audience and achieve the campaign goals.
      Format the response as a JSON object with "themes" (array of campaign theme ideas),
      "headlines" (array of headline ideas), "visualConcepts" (array of visual concept ideas),
      "copyApproaches" (array of copywriting approach ideas), and "callToActions" (array of call-to-action ideas).
    `;

    let result;
    
    // Use the specified AI provider
    if (provider === 'google' && googleAi) {
      result = await generateWithGoogleAI(prompt);
    } else if (provider === 'openai' && openai) {
      result = await generateWithOpenAI(prompt);
    } else {
      throw new Error(`AI provider "${provider}" not available or not configured`);
    }

    return result;
  } catch (error) {
    console.error('Content ideas generation error:', error);
    throw new Error(`Failed to generate content ideas: ${error.message}`);
  }
};

/**
 * Predict ad performance based on historical data and proposed changes
 * @param {Object} data - Historical data and proposed changes
 * @returns {Promise<Object>} Performance predictions
 */
const predictAdPerformance = async (data) => {
  try {
    const { 
      historicalData = [], 
      proposedChanges = {},
      provider = 'openai'
    } = data;

    // Construct prompt
    const prompt = `
      Predict ad performance based on the following historical data and proposed changes:
      
      Historical Performance Data:
      ${JSON.stringify(historicalData, null, 2)}
      
      Proposed Changes:
      ${JSON.stringify(proposedChanges, null, 2)}
      
      Analyze the historical performance data and predict how the proposed changes will affect future performance.
      Consider metrics such as CTR, conversion rate, CPA, and ROAS in your prediction.
      Format the response as a JSON object with "prediction" (overall performance prediction),
      "metrics" (object with predicted metrics), "confidenceLevel" (confidence in the prediction from 1-10),
      and "factors" (array of factors influencing the prediction).
    `;

    let result;
    
    // Use the specified AI provider
    if (provider === 'google' && googleAi) {
      result = await generateWithGoogleAI(prompt);
    } else if (provider === 'openai' && openai) {
      result = await generateWithOpenAI(prompt);
    } else {
      throw new Error(`AI provider "${provider}" not available or not configured`);
    }

    return result;
  } catch (error) {
    console.error('Performance prediction error:', error);
    throw new Error(`Failed to predict ad performance: ${error.message}`);
  }
};

module.exports = {
  generateAdCopy,
  analyzeAdPerformance,
  generateAudienceRecommendations,
  optimizeBudgetAllocation,
  generateContentIdeas,
  predictAdPerformance
};

