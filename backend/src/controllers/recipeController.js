const User = require('../models/User');
const { generateRecipe, generateMultipleRecipes } = require('../utils/aiHelper');
const { decrypt } = require('../utils/encryption');

/**
 * @desc    Generate recipes based on ingredients
 * @route   POST /api/recipes/generate
 * @access  Private
 */
const generateRecipes = async (req, res) => {
  try {
    const { ingredients, mode = 'cook_now', count = 3 } = req.body;

    // Validate ingredients
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of ingredients'
      });
    }

    // Validate mode
    if (!['cook_now', 'gap_analysis'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Mode must be either "cook_now" or "gap_analysis"'
      });
    }

    // Validate count
    const recipeCount = Math.min(Math.max(parseInt(count) || 3, 1), 5);

    // Get user profile, API key, provider, and model
    const user = await User.findById(req.user.id).select('+aiApiKey +geminiApiKey');

    // Decrypt user's API key if available (Security Rule #3)
    let userApiKey = null;
    if (user.aiApiKey) {
      userApiKey = decrypt(user.aiApiKey);
    } else if (user.geminiApiKey) {
      // Backward compatibility
      userApiKey = decrypt(user.geminiApiKey);
    }

    // Get provider and model from user settings
    const provider = user.aiProvider || 'gemini';
    const model = user.aiModel || 'gemini-2.5-flash-lite';

    // Generate recipes
    const recipes = await generateMultipleRecipes(
      ingredients,
      user.profile,
      mode,
      recipeCount,
      userApiKey,
      provider,
      model
    );

    res.status(200).json({
      success: true,
      message: `Generated ${recipes.length} recipes`,
      data: {
        recipes: recipes,
        mode: mode,
        userPreferences: {
          allergies: user.profile.allergies,
          dietaryRestrictions: user.profile.dietaryRestrictions,
          skillLevel: user.profile.skillLevel
        }
      }
    });
  } catch (error) {
    console.error('Generate Recipes Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recipes',
      error: error.message
    });
  }
};

/**
 * @desc    Generate single recipe
 * @route   POST /api/recipes/generate-one
 * @access  Private
 */
const generateSingleRecipe = async (req, res) => {
  try {
    const { ingredients, mode = 'cook_now' } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of ingredients'
      });
    }

    // Get user profile, API key, provider, and model
    const user = await User.findById(req.user.id).select('+aiApiKey +geminiApiKey');

    // Decrypt user's API key if available
    let userApiKey = null;
    if (user.aiApiKey) {
      userApiKey = decrypt(user.aiApiKey);
    } else if (user.geminiApiKey) {
      // Backward compatibility
      userApiKey = decrypt(user.geminiApiKey);
    }

    // Get provider and model from user settings
    const provider = user.aiProvider || 'gemini';
    const model = user.aiModel || 'gemini-2.5-flash-lite';

    const recipe = await generateRecipe(
      ingredients,
      user.profile,
      mode,
      2,
      userApiKey,
      provider,
      model
    );

    res.status(200).json({
      success: true,
      message: 'Recipe generated successfully',
      data: {
        recipe: recipe
      }
    });
  } catch (error) {
    console.error('Generate Single Recipe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recipe',
      error: error.message
    });
  }
};

module.exports = {
  generateRecipes,
  generateSingleRecipe
};
