const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;

// Fallback API key for development (optional)
const defaultGeminiKey = process.env.GEMINI_API_KEY;
const defaultGrokKey = process.env.GROK_API_KEY;

// Available models configuration
const AVAILABLE_MODELS = {
  gemini: [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash-preview-09-2025',
    'gemini-2.5-flash-lite-preview-09-2025',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
  ],
  grok: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'openai/gpt-oss-120b'
  ]
};

/**
 * Get AI configuration with user's settings or fallback to defaults
 * @param {string} userApiKey - User's API key (optional)
 * @param {string} provider - AI provider ('gemini' or 'grok')
 * @param {string} model - Model name
 * @returns {Object} - AI configuration
 */
const getAIConfig = (userApiKey, provider = 'gemini', model = 'gemini-2.5-flash-lite') => {
  const apiKey = userApiKey || (provider === 'gemini' ? defaultGeminiKey : defaultGrokKey);

  if (!apiKey) {
    throw new Error(`No ${provider} API key available. Please provide your API key in profile settings.`);
  }

  return { apiKey, provider, model };
};

/**
 * Call Groq API (OpenAI-compatible)
 * @param {string} apiKey - Groq API key
 * @param {string} model - Model name
 * @param {Array} messages - Chat messages
 * @param {number} maxTokens - Maximum tokens for response
 * @returns {Promise<string>} - AI response text
 */
const callGroqAPI = async (apiKey, model, messages, maxTokens = 1024) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`Failed to call Groq API: ${error.message}`);
  }
};

/**
 * Call Groq API for vision tasks
 * Note: Only llama-4-scout model supports vision
 * @param {string} apiKey - Groq API key
 * @param {string} imagePath - Path to image file
 * @param {string} prompt - Text prompt
 * @returns {Promise<string>} - AI response text
 */
const callGroqVision = async (apiKey, imagePath, prompt) => {
  try {
    // Read and convert image to base64
    const imageData = await fs.readFile(imagePath);
    const base64Image = imageData.toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }];

    // Use llama-4-scout for vision
    return await callGroqAPI(apiKey, 'meta-llama/llama-4-scout-17b-16e-instruct', messages, 1024);
  } catch (error) {
    console.error('Groq Vision Error:', error);
    throw new Error(`Failed to detect ingredients with Groq: ${error.message}`);
  }
};

/**
 * Detect ingredients from an uploaded image
 * @param {string} imagePath - Path to the uploaded image
 * @param {string} userApiKey - User's API key (optional)
 * @param {string} provider - AI provider
 * @param {string} model - Model name
 * @returns {Promise<Array>} - Array of detected ingredients
 */
const detectIngredientsFromImage = async (imagePath, userApiKey = null, provider = 'gemini', model = 'gemini-2.5-flash-lite') => {
  try {
    const config = getAIConfig(userApiKey, provider, model);

    // Groq supports vision with llama-4-scout
    if (config.provider === 'grok') {
      const prompt = `You are a food ingredient detection AI. Analyze this image and identify all visible food ingredients.

IMPORTANT: Return ONLY a valid JSON array of ingredient names, nothing else. No explanations, no markdown, just the JSON array.

Example format:
["tomatoes", "onions", "garlic", "chicken breast", "olive oil"]

Rules:
1. List only clear, identifiable ingredients
2. Use common names (e.g., "tomatoes" not "Solanum lycopersicum")
3. Be specific when possible (e.g., "chicken breast" not just "chicken")
4. Ignore containers, utensils, or non-food items
5. Return empty array [] if no food ingredients are visible

Now analyze the image:`;

      const text = await callGroqVision(config.apiKey, imagePath, prompt);

      // Parse the response
      let ingredients = [];
      try {
        const jsonMatch = text.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          ingredients = JSON.parse(jsonMatch[0]);
        } else {
          console.warn('No JSON array found in response:', text);
          ingredients = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('[') && !line.startsWith(']'))
            .map(line => line.replace(/^[-*•]\s*/, '').replace(/^["']|["']$/g, ''));
        }
      } catch (parseError) {
        console.error('Error parsing ingredients:', parseError);
        throw new Error('Failed to parse AI response');
      }

      return ingredients;
    }

    // Use Gemini for vision
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const visionModel = genAI.getGenerativeModel({ model: config.model });

    // Read image file
    const imageData = await fs.readFile(imagePath);
    const base64Image = imageData.toString('base64');

    // Prepare the prompt
    const prompt = `You are a food ingredient detection AI. Analyze this image and identify all visible food ingredients.

IMPORTANT: Return ONLY a valid JSON array of ingredient names, nothing else. No explanations, no markdown, just the JSON array.

Example format:
["tomatoes", "onions", "garlic", "chicken breast", "olive oil"]

Rules:
1. List only clear, identifiable ingredients
2. Use common names (e.g., "tomatoes" not "Solanum lycopersicum")
3. Be specific when possible (e.g., "chicken breast" not just "chicken")
4. Ignore containers, utensils, or non-food items
5. Return empty array [] if no food ingredients are visible

Now analyze the image:`;

    // Generate content with image
    const result = await visionModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse the response
    let ingredients = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        ingredients = JSON.parse(jsonMatch[0]);
      } else {
        console.warn('No JSON array found in response:', text);
        // Fallback: split by lines and clean up
        ingredients = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('[') && !line.startsWith(']'))
          .map(line => line.replace(/^[-*•]\s*/, '').replace(/^["']|["']$/g, ''));
      }
    } catch (parseError) {
      console.error('Error parsing ingredients:', parseError);
      throw new Error('Failed to parse AI response');
    }

    return ingredients;
  } catch (error) {
    console.error('AI Image Detection Error:', error);
    throw new Error(`Failed to detect ingredients: ${error.message}`);
  }
};

/**
 * Generate recipe based on available ingredients and user preferences
 * @param {Array} ingredients - Available ingredients
 * @param {Object} userProfile - User's dietary preferences and restrictions
 * @param {string} mode - 'cook_now' or 'gap_analysis'
 * @param {number} maxMissingIngredients - Max missing ingredients for gap analysis
 * @param {string} userApiKey - User's API key (optional)
 * @param {string} provider - AI provider
 * @param {string} model - Model name
 * @returns {Promise<Object>} - Recipe object
 */
const generateRecipe = async (
  ingredients,
  userProfile = {},
  mode = 'cook_now',
  maxMissingIngredients = 2,
  userApiKey = null,
  provider = 'gemini',
  model = 'gemini-2.5-flash-lite'
) => {
  try {
    const config = getAIConfig(userApiKey, provider, model);

    // Build user preferences string
    let preferencesText = '';
    if (userProfile.allergies && userProfile.allergies.length > 0) {
      preferencesText += `\n- ALLERGIES (MUST AVOID): ${userProfile.allergies.join(', ')}`;
    }
    if (userProfile.dietaryRestrictions && userProfile.dietaryRestrictions.length > 0) {
      preferencesText += `\n- Dietary restrictions: ${userProfile.dietaryRestrictions.join(', ')}`;
    }
    if (userProfile.dislikedFoods && userProfile.dislikedFoods.length > 0) {
      preferencesText += `\n- Disliked foods (avoid if possible): ${userProfile.dislikedFoods.join(', ')}`;
    }
    if (userProfile.cuisinePreferences && userProfile.cuisinePreferences.length > 0) {
      preferencesText += `\n- Preferred cuisines: ${userProfile.cuisinePreferences.join(', ')}`;
    }
    if (userProfile.skillLevel) {
      preferencesText += `\n- Cooking skill level: ${userProfile.skillLevel}`;
    }

    // Build prompt based on mode
    let prompt = '';
    if (mode === 'cook_now') {
      prompt = `You are a professional chef AI. Create a recipe using ONLY the available ingredients listed below.

Available Ingredients: ${ingredients.join(', ')}

User Preferences:${preferencesText || '\n- None specified'}

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "title": "Recipe Name",
  "cuisine": "cuisine type",
  "difficulty": "easy|medium|hard",
  "servings": 2,
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "missingIngredients": []
}

Rules:
1. Use ONLY ingredients from the available list
2. Respect ALL dietary restrictions and allergies (this is critical!)
3. Make it practical and delicious
4. Adjust difficulty based on skill level
5. Include estimated prep and cook times in minutes
6. missingIngredients should be an empty array []

Generate the recipe now:`;
    } else {
      // gap_analysis mode
      prompt = `You are a professional chef AI. Create a recipe using the available ingredients, but you may suggest up to ${maxMissingIngredients} additional common ingredients.

Available Ingredients: ${ingredients.join(', ')}

User Preferences:${preferencesText || '\n- None specified'}

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "title": "Recipe Name",
  "cuisine": "cuisine type",
  "difficulty": "easy|medium|hard",
  "servings": 2,
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": ["all ingredients including missing ones"],
  "instructions": ["step 1", "step 2"],
  "missingIngredients": ["missing item 1", "missing item 2"]
}

Rules:
1. Primarily use available ingredients
2. Suggest up to ${maxMissingIngredients} common, affordable missing ingredients
3. List missing ingredients separately in missingIngredients array
4. Respect ALL dietary restrictions and allergies (this is critical!)
5. Make it practical and delicious
6. Include estimated prep and cook times in minutes

Generate the recipe now:`;
    }

    let text;

    // Call appropriate AI provider
    if (config.provider === 'grok') {
      text = await callGroqAPI(config.apiKey, config.model, [
        { role: 'user', content: prompt }
      ], 2048);
    } else {
      // Gemini
      const genAI = new GoogleGenerativeAI(config.apiKey);
      const aiModel = genAI.getGenerativeModel({ model: config.model });
      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    }

    // Parse the JSON response
    let recipe = {};
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipe = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found in response');
      }

      // Validate required fields
      if (!recipe.title || !recipe.ingredients || !recipe.instructions) {
        throw new Error('Missing required recipe fields');
      }

      // Ensure missingIngredients is an array
      if (!recipe.missingIngredients) {
        recipe.missingIngredients = [];
      }

    } catch (parseError) {
      console.error('Error parsing recipe:', parseError);
      console.error('Raw response:', text);
      throw new Error('Failed to parse recipe from AI response');
    }

    return recipe;
  } catch (error) {
    console.error('AI Recipe Generation Error:', error);
    throw new Error(`Failed to generate recipe: ${error.message}`);
  }
};

/**
 * Generate multiple recipe options
 * @param {Array} ingredients - Available ingredients
 * @param {Object} userProfile - User preferences
 * @param {string} mode - 'cook_now' or 'gap_analysis'
 * @param {number} count - Number of recipes to generate (1-3)
 * @param {string} userApiKey - User's API key (optional)
 * @param {string} provider - AI provider
 * @param {string} model - Model name
 * @returns {Promise<Array>} - Array of recipe objects
 */
const generateMultipleRecipes = async (
  ingredients,
  userProfile = {},
  mode = 'cook_now',
  count = 3,
  userApiKey = null,
  provider = 'gemini',
  model = 'gemini-2.5-flash-lite'
) => {
  try {
    const recipes = [];

    // Generate recipes with variety
    for (let i = 0; i < count; i++) {
      const recipe = await generateRecipe(ingredients, userProfile, mode, 2, userApiKey, provider, model);
      recipes.push(recipe);

      // Small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return recipes;
  } catch (error) {
    console.error('Error generating multiple recipes:', error);
    throw error;
  }
};

/**
 * Validate API key by making a test call
 * @param {string} apiKey - API key to validate
 * @param {string} provider - AI provider ('gemini' or 'grok')
 * @param {string} model - Model name
 * @returns {Promise<boolean>} - True if valid, throws error if invalid
 */
const validateApiKey = async (apiKey, provider = 'gemini', model = 'gemini-2.5-flash-lite') => {
  try {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }

    if (provider === 'grok') {
      // Test Groq API
      await callGroqAPI(apiKey, model, [
        { role: 'user', content: 'Say OK' }
      ], 10);
    } else {
      // Test Gemini API
      const genAI = new GoogleGenerativeAI(apiKey);
      const aiModel = genAI.getGenerativeModel({ model });

      const result = await aiModel.generateContent('Say "OK"');
      const response = await result.response;
      const text = response.text();

      if (text.length === 0) {
        throw new Error('Invalid API response');
      }
    }

    return true;
  } catch (error) {
    // Check for specific API key errors
    if (error.message.includes('API_KEY_INVALID') ||
        error.message.includes('invalid') ||
        error.message.includes('401') ||
        error.message.includes('403')) {
      throw new Error(`Invalid ${provider} API key. Please check your API key.`);
    }
    throw new Error(`API key validation failed: ${error.message}`);
  }
};

/**
 * Get list of available models for a provider
 * @param {string} provider - AI provider ('gemini' or 'grok')
 * @returns {Array<string>} - List of available models
 */
const getAvailableModels = (provider = 'gemini') => {
  return AVAILABLE_MODELS[provider] || [];
};

module.exports = {
  detectIngredientsFromImage,
  generateRecipe,
  generateMultipleRecipes,
  validateApiKey,
  getAvailableModels,
  AVAILABLE_MODELS
};
