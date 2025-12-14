const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;

// Fallback API key for development (optional)
const defaultGenAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Get Gemini AI instance with user's API key or fallback to default
 * @param {string} userApiKey - User's Gemini API key (optional)
 * @returns {GoogleGenerativeAI} - Gemini AI instance
 */
const getGeminiInstance = (userApiKey) => {
  if (userApiKey) {
    return new GoogleGenerativeAI(userApiKey);
  }
  if (defaultGenAI) {
    return defaultGenAI;
  }
  throw new Error('No Gemini API key available. Please provide your API key in profile settings.');
};

/**
 * Detect ingredients from an uploaded image
 * @param {string} imagePath - Path to the uploaded image
 * @param {string} userApiKey - User's Gemini API key (optional)
 * @returns {Promise<Array>} - Array of detected ingredients
 */
const detectIngredientsFromImage = async (imagePath, userApiKey = null) => {
  try {
    // Get the appropriate Gemini AI instance
    const genAI = getGeminiInstance(userApiKey);

    // Get the vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

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
    const result = await model.generateContent([
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
    console.error('Gemini Image Detection Error:', error);
    throw new Error(`Failed to detect ingredients: ${error.message}`);
  }
};

/**
 * Generate recipe based on available ingredients and user preferences
 * @param {Array} ingredients - Available ingredients
 * @param {Object} userProfile - User's dietary preferences and restrictions
 * @param {string} mode - 'cook_now' or 'gap_analysis'
 * @param {number} maxMissingIngredients - Max missing ingredients for gap analysis
 * @param {string} userApiKey - User's Gemini API key (optional)
 * @returns {Promise<Object>} - Recipe object
 */
const generateRecipe = async (ingredients, userProfile = {}, mode = 'cook_now', maxMissingIngredients = 2, userApiKey = null) => {
  try {
    // Get the appropriate Gemini AI instance
    const genAI = getGeminiInstance(userApiKey);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
    console.error('Gemini Recipe Generation Error:', error);
    throw new Error(`Failed to generate recipe: ${error.message}`);
  }
};

/**
 * Generate multiple recipe options
 * @param {Array} ingredients - Available ingredients
 * @param {Object} userProfile - User preferences
 * @param {string} mode - 'cook_now' or 'gap_analysis'
 * @param {number} count - Number of recipes to generate (1-3)
 * @param {string} userApiKey - User's Gemini API key (optional)
 * @returns {Promise<Array>} - Array of recipe objects
 */
const generateMultipleRecipes = async (ingredients, userProfile = {}, mode = 'cook_now', count = 3, userApiKey = null) => {
  try {
    const recipes = [];

    // Generate recipes with variety
    for (let i = 0; i < count; i++) {
      const recipe = await generateRecipe(ingredients, userProfile, mode, 2, userApiKey);
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
 * Validate Gemini API key by making a test call
 * @param {string} apiKey - API key to validate
 * @returns {Promise<boolean>} - True if valid, throws error if invalid
 */
const validateApiKey = async (apiKey) => {
  try {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }

    // Create a Gemini AI instance with the provided key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

    // Make a minimal test call
    const result = await model.generateContent('Say "OK"');
    const response = await result.response;
    const text = response.text();

    // If we got here without error, the key is valid
    return text.length > 0;
  } catch (error) {
    // Check for specific API key errors
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid')) {
      throw new Error('Invalid API key. Please check your Gemini API key.');
    }
    throw new Error(`API key validation failed: ${error.message}`);
  }
};

module.exports = {
  detectIngredientsFromImage,
  generateRecipe,
  generateMultipleRecipes,
  validateApiKey
};
