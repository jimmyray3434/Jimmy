const openaiService = require('./openai');
const DigitalProduct = require('../models/DigitalProduct');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

/**
 * Generate an e-book and save to database
 * @param {string} userId - User ID
 * @param {Object} options - E-book options
 * @returns {Promise} - Generated e-book
 */
const generateEbook = async (userId, options) => {
  try {
    const {
      title,
      description = '',
      category,
      outline,
      price = 9.99,
      tags = [],
      status = 'draft'
    } = options;
    
    // Get user for API key
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // If outline is not provided, generate one
    let contentOutline = outline;
    if (!contentOutline) {
      const outlineResult = await openaiService.generateEbookOutline(
        title,
        tags,
        category,
        user.apiKeys?.openai
      );
      
      if (!outlineResult.success) {
        return outlineResult;
      }
      
      contentOutline = outlineResult.content;
    }
    
    // Generate sales page content
    const salesPageResult = await generateSalesPageContent(
      title,
      description || `A comprehensive e-book about ${title}`,
      category,
      tags,
      user.apiKeys?.openai
    );
    
    // Create new digital product
    const newProduct = new DigitalProduct({
      user: userId,
      title,
      description: description || `A comprehensive e-book about ${title}`,
      type: 'ebook',
      category,
      price,
      tags,
      status,
      contentOutline,
      generationPrompt: `Title: ${title}, Category: ${category}, Tags: ${tags.join(', ')}`,
      generationSettings: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000
      }
    });
    
    // Add sales page content if generated successfully
    if (salesPageResult.success) {
      newProduct.salesPage = salesPageResult.salesPage;
    }
    
    // Save to database
    await newProduct.save();
    
    return {
      success: true,
      product: newProduct
    };
  } catch (error) {
    console.error('Error generating e-book:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate a template and save to database
 * @param {string} userId - User ID
 * @param {Object} options - Template options
 * @returns {Promise} - Generated template
 */
const generateTemplate = async (userId, options) => {
  try {
    const {
      title,
      description = '',
      category,
      type = 'template',
      price = 19.99,
      tags = [],
      features = [],
      status = 'draft'
    } = options;
    
    // Get user for API key
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Generate template features if not provided
    let templateFeatures = features;
    if (!templateFeatures || templateFeatures.length === 0) {
      const featuresPrompt = `
        Generate 5-7 compelling features for a ${category} template titled "${title}".
        Each feature should be concise and highlight a specific benefit or functionality.
        Format the response as a JSON array of strings.
      `;
      
      const featuresResult = await openaiService.generateContent(
        featuresPrompt,
        {
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 500
        },
        user.apiKeys?.openai
      );
      
      if (featuresResult.success) {
        try {
          // Extract JSON from the response
          const jsonMatch = featuresResult.content.match(/```json\n([\s\S]*?)\n```/) || 
                          featuresResult.content.match(/\[([\s\S]*?)\]/);
          
          const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : featuresResult.content;
          templateFeatures = JSON.parse(jsonString);
        } catch (error) {
          console.error('Error parsing template features JSON:', error);
          templateFeatures = [
            'Easy to customize',
            'Professional design',
            'Time-saving solution',
            'Ready to use',
            'Fully editable'
          ];
        }
      } else {
        templateFeatures = [
          'Easy to customize',
          'Professional design',
          'Time-saving solution',
          'Ready to use',
          'Fully editable'
        ];
      }
    }
    
    // Generate sales page content
    const salesPageResult = await generateSalesPageContent(
      title,
      description || `A professional ${category} template`,
      category,
      tags,
      user.apiKeys?.openai
    );
    
    // Create new digital product
    const newProduct = new DigitalProduct({
      user: userId,
      title,
      description: description || `A professional ${category} template`,
      type,
      category,
      price,
      tags,
      features: templateFeatures,
      status,
      generationPrompt: `Title: ${title}, Category: ${category}, Tags: ${tags.join(', ')}`,
      generationSettings: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      }
    });
    
    // Add sales page content if generated successfully
    if (salesPageResult.success) {
      newProduct.salesPage = salesPageResult.salesPage;
    }
    
    // Save to database
    await newProduct.save();
    
    return {
      success: true,
      product: newProduct
    };
  } catch (error) {
    console.error('Error generating template:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate sales page content for a digital product
 * @param {string} title - Product title
 * @param {string} description - Product description
 * @param {string} category - Product category
 * @param {Array} tags - Product tags
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise} - Generated sales page content
 */
const generateSalesPageContent = async (title, description, category, tags = [], apiKey = null) => {
  try {
    const prompt = `
      Create compelling sales page content for a digital product with the following details:
      
      Title: ${title}
      Description: ${description}
      Category: ${category}
      Tags: ${tags.join(', ')}
      
      Generate the following elements:
      1. A powerful headline (max 100 characters)
      2. An engaging subheadline (max 200 characters)
      3. 5-7 key benefits (bullet points)
      4. A strong call to action
      5. 3 FAQs with answers
      
      Format the response as a JSON object with the following structure:
      {
        "headline": "The headline text",
        "subheadline": "The subheadline text",
        "benefits": ["Benefit 1", "Benefit 2", ...],
        "callToAction": "Call to action text",
        "faqs": [
          {
            "question": "Question 1?",
            "answer": "Answer to question 1"
          },
          ...
        ]
      }
    `;
    
    const result = await openaiService.generateContent(
      prompt,
      {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1000
      },
      apiKey
    );
    
    if (result.success) {
      try {
        // Extract JSON from the response
        const jsonMatch = result.content.match(/```json\n([\s\S]*?)\n```/) || 
                        result.content.match(/{[\s\S]*?}/);
        
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : result.content;
        const salesPage = JSON.parse(jsonString);
        
        return {
          success: true,
          salesPage
        };
      } catch (error) {
        console.error('Error parsing sales page JSON:', error);
        return {
          success: false,
          error: 'Failed to parse sales page content',
          rawContent: result.content
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error generating sales page content:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate a full e-book content based on outline
 * @param {string} userId - User ID
 * @param {string} productId - Digital product ID
 * @returns {Promise} - Generated e-book content
 */
const generateFullEbookContent = async (userId, productId) => {
  try {
    // Get user for API key
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Get product
    const product = await DigitalProduct.findById(productId);
    if (!product) {
      return {
        success: false,
        error: 'Product not found'
      };
    }
    
    // Check if product belongs to user
    if (product.user.toString() !== userId) {
      return {
        success: false,
        error: 'Not authorized'
      };
    }
    
    // Check if product is an e-book
    if (product.type !== 'ebook') {
      return {
        success: false,
        error: 'Product is not an e-book'
      };
    }
    
    // Check if outline exists
    if (!product.contentOutline) {
      return {
        success: false,
        error: 'E-book outline not found'
      };
    }
    
    // Parse outline to extract chapters
    const outlineLines = product.contentOutline.split('\n');
    const chapters = [];
    let currentChapter = null;
    
    for (const line of outlineLines) {
      // Check if line is a chapter heading (starts with # or ##)
      if (line.match(/^#{1,2}\s+/)) {
        if (currentChapter) {
          chapters.push(currentChapter);
        }
        
        currentChapter = {
          title: line.replace(/^#{1,2}\s+/, ''),
          subheadings: []
        };
      } 
      // Check if line is a subheading (starts with ### or ####)
      else if (line.match(/^#{3,4}\s+/) && currentChapter) {
        currentChapter.subheadings.push(line.replace(/^#{3,4}\s+/, ''));
      }
    }
    
    // Add the last chapter
    if (currentChapter) {
      chapters.push(currentChapter);
    }
    
    // Generate content for each chapter
    const ebookContent = [];
    
    for (const chapter of chapters) {
      const chapterPrompt = `
        Write a comprehensive, engaging, and valuable chapter for an e-book with the following details:
        
        E-book Title: ${product.title}
        Chapter Title: ${chapter.title}
        Subheadings: ${chapter.subheadings.join(', ')}
        
        The chapter should:
        1. Start with an engaging introduction
        2. Cover all the subheadings in a logical flow
        3. Include practical advice, examples, and actionable tips
        4. End with a conclusion that summarizes key points
        
        Write in a conversational, authoritative tone. Include relevant examples and make the content valuable to readers.
        Format the content with proper Markdown headings, bullet points, and emphasis where appropriate.
      `;
      
      const chapterResult = await openaiService.generateContent(
        chapterPrompt,
        {
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 3000
        },
        user.apiKeys?.openai
      );
      
      if (chapterResult.success) {
        ebookContent.push({
          title: chapter.title,
          content: chapterResult.content
        });
      } else {
        return {
          success: false,
          error: `Failed to generate content for chapter "${chapter.title}": ${chapterResult.error}`
        };
      }
    }
    
    // Generate introduction and conclusion
    const introPrompt = `
      Write an engaging introduction for an e-book titled "${product.title}".
      
      The introduction should:
      1. Hook the reader with a compelling opening
      2. Explain the purpose and value of the e-book
      3. Briefly outline what readers will learn
      4. Establish your authority on the subject
      
      Keep it concise, engaging, and set the tone for the rest of the e-book.
      Format the content with proper Markdown formatting.
    `;
    
    const introResult = await openaiService.generateContent(
      introPrompt,
      {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1500
      },
      user.apiKeys?.openai
    );
    
    const conclusionPrompt = `
      Write a powerful conclusion for an e-book titled "${product.title}".
      
      The conclusion should:
      1. Summarize the key points covered in the e-book
      2. Reinforce the main value proposition
      3. Provide final thoughts and recommendations
      4. Include a call to action for the reader
      
      Make it inspiring and leave the reader feeling equipped to take action.
      Format the content with proper Markdown formatting.
    `;
    
    const conclusionResult = await openaiService.generateContent(
      conclusionPrompt,
      {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1500
      },
      user.apiKeys?.openai
    );
    
    // Compile the full e-book
    let fullEbookContent = `# ${product.title}\n\n`;
    
    // Add introduction
    if (introResult.success) {
      fullEbookContent += `## Introduction\n\n${introResult.content}\n\n`;
    }
    
    // Add chapters
    for (const chapter of ebookContent) {
      fullEbookContent += `## ${chapter.title}\n\n${chapter.content}\n\n`;
    }
    
    // Add conclusion
    if (conclusionResult.success) {
      fullEbookContent += `## Conclusion\n\n${conclusionResult.content}\n\n`;
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const userDir = path.join(uploadsDir, userId);
    
    if (!fs.existsSync(uploadsDir)) {
      await mkdirAsync(uploadsDir);
    }
    
    if (!fs.existsSync(userDir)) {
      await mkdirAsync(userDir);
    }
    
    // Save e-book to file
    const fileName = `${product.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    const filePath = path.join(userDir, fileName);
    
    await writeFileAsync(filePath, fullEbookContent);
    
    // Update product with file path
    product.filePath = `uploads/${userId}/${fileName}`;
    product.fileSize = fullEbookContent.length;
    product.fileType = 'text/markdown';
    await product.save();
    
    return {
      success: true,
      filePath: product.filePath,
      chapters: ebookContent.length,
      totalWords: fullEbookContent.split(/\s+/).length
    };
  } catch (error) {
    console.error('Error generating full e-book content:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate a digital product based on user settings
 * @param {string} userId - User ID
 * @returns {Promise} - Generated digital product
 */
const generateProductFromSettings = async (userId) => {
  try {
    // Get user and their settings
    const user = await User.findById(userId);
    if (!user || !user.settings || !user.settings.digitalProducts) {
      return {
        success: false,
        error: 'User settings not found'
      };
    }
    
    const { digitalProducts } = user.settings;
    const { productTypes = [], priceRange = {} } = digitalProducts;
    
    if (productTypes.length === 0) {
      return {
        success: false,
        error: 'No product types specified in settings'
      };
    }
    
    // Generate topic based on user's niche
    const niche = user.settings.contentGeneration?.targetNiche || 'general';
    
    const topicResult = await openaiService.generateContent(
      `Generate a compelling topic for a digital product in the ${niche} niche. Return only the topic as a concise phrase.`,
      {
        model: 'gpt-4',
        temperature: 0.8,
        max_tokens: 50
      },
      user.apiKeys?.openai
    );
    
    let topic = niche;
    if (topicResult.success) {
      topic = topicResult.content.replace(/\n/g, '').trim();
    }
    
    // Generate tags
    const tagsResult = await openaiService.generateContent(
      `Generate 5 relevant tags for a digital product about "${topic}" in the ${niche} niche. Return only the tags as a comma-separated list.`,
      {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 100
      },
      user.apiKeys?.openai
    );
    
    let tags = [];
    if (tagsResult.success) {
      tags = tagsResult.content
        .replace(/\n/g, '')
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
    }
    
    // Randomly select a product type from user preferences
    const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
    
    // Generate random price within range
    const minPrice = priceRange.min || 9.99;
    const maxPrice = priceRange.max || 29.99;
    const price = Math.round((Math.random() * (maxPrice - minPrice) + minPrice) * 100) / 100;
    
    // Generate product based on type
    let result;
    switch (productType) {
      case 'ebook':
        result = await generateEbook(userId, {
          title: topic,
          category: niche,
          price,
          tags,
          status: 'draft'
        });
        break;
      case 'template':
        result = await generateTemplate(userId, {
          title: `${topic} Template`,
          category: niche,
          price,
          tags,
          status: 'draft'
        });
        break;
      default:
        result = {
          success: false,
          error: `Unsupported product type: ${productType}`
        };
    }
    
    return result;
  } catch (error) {
    console.error('Error generating product from settings:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateEbook,
  generateTemplate,
  generateSalesPageContent,
  generateFullEbookContent,
  generateProductFromSettings
};

