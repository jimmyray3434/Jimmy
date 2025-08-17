const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const createOpenAIClient = (apiKey) => {
  const key = apiKey || process.env.OPENAI_API_KEY;
  
  if (!key) {
    throw new Error('OpenAI API key is required');
  }
  
  return new OpenAI({
    apiKey: key
  });
};

// Generate content using OpenAI
const generateContent = async (prompt, options = {}, apiKey = null) => {
  try {
    const openai = createOpenAIClient(apiKey);
    
    const {
      model = 'gpt-4',
      temperature = 0.7,
      max_tokens = 2000,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0
    } = options;
    
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert content creator specializing in creating high-quality, engaging, and SEO-optimized content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty
    });
    
    return {
      success: true,
      content: response.choices[0].message.content,
      usage: response.usage
    };
  } catch (error) {
    console.error('Error generating content with OpenAI:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate blog post
const generateBlogPost = async (topic, keywords, niche, tone = 'informative', apiKey = null) => {
  const prompt = `
    Create a comprehensive, engaging, and SEO-optimized blog post about "${topic}".
    
    Niche: ${niche}
    Target Keywords: ${keywords.join(', ')}
    Tone: ${tone}
    
    The blog post should include:
    1. An attention-grabbing headline
    2. An engaging introduction that hooks the reader
    3. Well-structured body with subheadings
    4. Practical tips, insights, or actionable advice
    5. A compelling conclusion
    6. Include natural places where affiliate products could be mentioned
    
    Format the blog post with proper Markdown formatting including headers, bullet points, and emphasis where appropriate.
    
    The content should be original, informative, and valuable to the reader while naturally incorporating the target keywords.
  `;
  
  return await generateContent(prompt, {
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 3000
  }, apiKey);
};

// Generate social media post
const generateSocialMediaPost = async (topic, platform, keywords, niche, apiKey = null) => {
  const platformSpecifics = {
    twitter: 'Keep it concise (under 280 characters) and engaging. Include relevant hashtags.',
    facebook: 'Create an engaging post that encourages discussion. Include a question or call to action.',
    instagram: 'Create a visually descriptive post with relevant hashtags. Focus on storytelling.',
    linkedin: 'Create a professional post that demonstrates expertise. Include industry insights.'
  };
  
  const prompt = `
    Create an engaging social media post for ${platform} about "${topic}".
    
    Niche: ${niche}
    Target Keywords: ${keywords.join(', ')}
    
    ${platformSpecifics[platform.toLowerCase()] || ''}
    
    The post should be attention-grabbing, relevant to the target audience, and designed to maximize engagement.
    If appropriate, include a subtle call-to-action that could lead to affiliate product interest.
  `;
  
  const maxTokens = platform.toLowerCase() === 'twitter' ? 500 : 1000;
  
  return await generateContent(prompt, {
    model: 'gpt-4',
    temperature: 0.8,
    max_tokens: maxTokens
  }, apiKey);
};

// Generate product review
const generateProductReview = async (productName, productCategory, keywords, niche, apiKey = null) => {
  const prompt = `
    Create a comprehensive, honest, and helpful review of "${productName}" in the ${productCategory} category.
    
    Niche: ${niche}
    Target Keywords: ${keywords.join(', ')}
    
    The review should include:
    1. An engaging headline that includes the product name
    2. A brief introduction to the product and its purpose
    3. Detailed sections covering features, benefits, and specifications
    4. Pros and cons of the product
    5. Comparisons to similar products (if applicable)
    6. Personal experience or research-based insights
    7. A final verdict with rating
    8. Who this product is best for
    
    Format the review with proper Markdown formatting including headers, bullet points, and emphasis where appropriate.
    
    The review should be balanced, authentic, and genuinely helpful to readers while naturally incorporating the target keywords.
    Include natural affiliate link placement opportunities without explicitly mentioning "affiliate links".
  `;
  
  return await generateContent(prompt, {
    model: 'gpt-4',
    temperature: 0.6,
    max_tokens: 3000
  }, apiKey);
};

// Generate e-book outline
const generateEbookOutline = async (topic, keywords, niche, apiKey = null) => {
  const prompt = `
    Create a detailed outline for an e-book about "${topic}".
    
    Niche: ${niche}
    Target Keywords: ${keywords.join(', ')}
    
    The outline should include:
    1. A compelling title for the e-book
    2. An introduction section explaining the value of the e-book
    3. 5-10 main chapters with titles
    4. 3-5 subheadings for each chapter
    5. A brief description of what each chapter will cover
    6. Ideas for graphics, charts, or worksheets to include
    7. A conclusion section
    
    Format the outline with proper Markdown formatting including headers, bullet points, and emphasis where appropriate.
    
    The e-book outline should be comprehensive, valuable to the reader, and naturally incorporate the target keywords.
    Include natural places where affiliate products could be mentioned where relevant.
  `;
  
  return await generateContent(prompt, {
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000
  }, apiKey);
};

// Generate SEO metadata
const generateSEOMetadata = async (title, content, apiKey = null) => {
  const prompt = `
    Based on the following content title and excerpt, generate SEO metadata including:
    1. An SEO-optimized title (max 60 characters)
    2. A compelling meta description (max 160 characters)
    3. 5-7 relevant focus keywords or phrases
    
    Title: ${title}
    
    Content excerpt:
    ${content.substring(0, 1000)}...
    
    Format the response as JSON with the following structure:
    {
      "seoTitle": "The optimized title",
      "seoDescription": "The meta description",
      "focusKeywords": ["keyword1", "keyword2", "keyword phrase 3"]
    }
  `;
  
  const result = await generateContent(prompt, {
    model: 'gpt-4',
    temperature: 0.5,
    max_tokens: 500
  }, apiKey);
  
  if (result.success) {
    try {
      // Extract JSON from the response
      const jsonMatch = result.content.match(/```json\n([\s\S]*?)\n```/) || 
                        result.content.match(/{[\s\S]*?}/);
      
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : result.content;
      return {
        success: true,
        metadata: JSON.parse(jsonString)
      };
    } catch (error) {
      console.error('Error parsing SEO metadata JSON:', error);
      return {
        success: false,
        error: 'Failed to parse SEO metadata',
        rawContent: result.content
      };
    }
  }
  
  return result;
};

module.exports = {
  createOpenAIClient,
  generateContent,
  generateBlogPost,
  generateSocialMediaPost,
  generateProductReview,
  generateEbookOutline,
  generateSEOMetadata
};

