const RecipeHistory = require('../models/RecipeHistory');
const User = require('../models/User');
const { calculateRecipeImpact, updateUserStats } = require('../utils/sustainabilityCalculator');

/**
 * @desc    Save recipe to history (after user accepts/cooks it)
 * @route   POST /api/history
 * @access  Private
 */
const saveToHistory = async (req, res) => {
  try {
    const {
      recipeName,
      ingredients,
      instructions,
      missingIngredients = [],
      cuisine = '',
      difficulty = 'medium',
      servings = 2,
      detectedIngredients = []
    } = req.body;

    // Validate required fields
    if (!recipeName || !ingredients || !instructions) {
      return res.status(400).json({
        success: false,
        message: 'Please provide recipeName, ingredients, and instructions'
      });
    }

    // Calculate sustainability impact
    const impact = calculateRecipeImpact(ingredients);

    // Create history entry
    const historyEntry = await RecipeHistory.create({
      user: req.user.id,
      recipeName,
      ingredients,
      instructions,
      missingIngredients,
      cuisine,
      difficulty,
      servings,
      detectedIngredients,
      sustainabilityImpact: impact
    });

    // Update user's sustainability stats
    const user = await User.findById(req.user.id);
    await updateUserStats(user, impact);

    res.status(201).json({
      success: true,
      message: 'Recipe saved to history',
      data: {
        history: historyEntry,
        sustainabilityStats: user.sustainabilityStats
      }
    });
  } catch (error) {
    console.error('Save To History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save recipe',
      error: error.message
    });
  }
};

/**
 * @desc    Get recipe history
 * @route   GET /api/history
 * @access  Private
 */
const getHistory = async (req, res) => {
  try {
    const { limit = 20, page = 1, sortBy = 'createdAt' } = req.query;

    const history = await RecipeHistory.find({ user: req.user.id })
      .sort({ [sortBy]: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await RecipeHistory.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        history: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get favorite recipes
 * @route   GET /api/history/favorites
 * @access  Private
 */
const getFavorites = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    const favorites = await RecipeHistory.find({
      user: req.user.id,
      isFavorite: true
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await RecipeHistory.countDocuments({
      user: req.user.id,
      isFavorite: true
    });

    res.status(200).json({
      success: true,
      data: {
        favorites: favorites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get Favorites Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get single recipe by ID
 * @route   GET /api/history/:id
 * @access  Private
 */
const getRecipeById = async (req, res) => {
  try {
    const recipe = await RecipeHistory.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        recipe: recipe
      }
    });
  } catch (error) {
    console.error('Get Recipe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update recipe (rating, notes, favorite, time taken)
 * @route   PUT /api/history/:id
 * @access  Private
 */
const updateRecipe = async (req, res) => {
  try {
    const { rating, notes, isFavorite, timeTaken } = req.body;

    const recipe = await RecipeHistory.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    // Update only provided fields
    if (rating !== undefined) recipe.rating = rating;
    if (notes !== undefined) recipe.notes = notes;
    if (isFavorite !== undefined) recipe.isFavorite = isFavorite;
    if (timeTaken !== undefined) recipe.timeTaken = timeTaken;

    await recipe.save();

    res.status(200).json({
      success: true,
      message: 'Recipe updated successfully',
      data: {
        recipe: recipe
      }
    });
  } catch (error) {
    console.error('Update Recipe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Delete recipe from history
 * @route   DELETE /api/history/:id
 * @access  Private
 */
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await RecipeHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Delete Recipe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Toggle favorite status
 * @route   PATCH /api/history/:id/favorite
 * @access  Private
 */
const toggleFavorite = async (req, res) => {
  try {
    const recipe = await RecipeHistory.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    recipe.isFavorite = !recipe.isFavorite;
    await recipe.save();

    res.status(200).json({
      success: true,
      message: `Recipe ${recipe.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: {
        recipe: recipe
      }
    });
  } catch (error) {
    console.error('Toggle Favorite Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  saveToHistory,
  getHistory,
  getFavorites,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  toggleFavorite
};
