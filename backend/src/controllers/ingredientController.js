const IngredientDetection = require('../models/IngredientDetection');
const User = require('../models/User');
const { detectIngredientsFromImage } = require('../utils/aiHelper');
const { decrypt } = require('../utils/encryption');

/**
 * @desc    Upload image and detect ingredients
 * @route   POST /api/ingredients/detect
 * @access  Private
 */
const detectIngredients = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const imagePath = req.file.path;

    // Get user's API key, provider, and model
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

    // Detect ingredients using AI
    const ingredients = await detectIngredientsFromImage(imagePath, userApiKey, provider, model);

    // Save detection to database
    const detection = await IngredientDetection.create({
      user: req.user.id,
      imagePath: imagePath,
      detectedIngredients: ingredients,
      confidence: 0.85 // Default confidence
    });

    res.status(200).json({
      success: true,
      message: 'Ingredients detected successfully',
      data: {
        ingredients: ingredients,
        detectionId: detection._id,
        imageUrl: `/${imagePath}`
      }
    });
  } catch (error) {
    console.error('Detect Ingredients Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect ingredients',
      error: error.message
    });
  }
};

/**
 * @desc    Get ingredient detection history
 * @route   GET /api/ingredients/history
 * @access  Private
 */
const getDetectionHistory = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const detections = await IngredientDetection.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await IngredientDetection.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        detections: detections,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get Detection History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get single detection by ID
 * @route   GET /api/ingredients/detection/:id
 * @access  Private
 */
const getDetectionById = async (req, res) => {
  try {
    const detection = await IngredientDetection.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        detection: detection
      }
    });
  } catch (error) {
    console.error('Get Detection Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  detectIngredients,
  getDetectionHistory,
  getDetectionById
};
