const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');
const { validateApiKey, getAvailableModels } = require('../utils/aiHelper');

/**
 * @desc    Get user profile
 * @route   GET /api/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        profile: user.profile,
        sustainabilityStats: user.sustainabilityStats
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update user profile preferences
 * @route   PUT /api/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const {
      allergies,
      dietaryRestrictions,
      dislikedFoods,
      cuisinePreferences,
      skillLevel
    } = req.body;

    const user = await User.findById(req.user.id);

    // Update only provided fields
    if (allergies !== undefined) {
      user.profile.allergies = allergies;
    }
    if (dietaryRestrictions !== undefined) {
      user.profile.dietaryRestrictions = dietaryRestrictions;
    }
    if (dislikedFoods !== undefined) {
      user.profile.dislikedFoods = dislikedFoods;
    }
    if (cuisinePreferences !== undefined) {
      user.profile.cuisinePreferences = cuisinePreferences;
    }
    if (skillLevel !== undefined) {
      user.profile.skillLevel = skillLevel;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update user name or email
 * @route   PUT /api/profile/account
 * @access  Private
 */
const updateAccount = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user.id);

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Update Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Set or update AI configuration (API key, provider, model)
 * @route   POST /api/profile/ai-config
 * @access  Private
 */
const setAIConfig = async (req, res) => {
  try {
    const { apiKey, provider = 'gemini', model } = req.body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid API key'
      });
    }

    // Validate provider
    if (!['gemini', 'grok'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Provider must be either "gemini" or "grok"'
      });
    }

    // Use default model if not provided
    const selectedModel = model || (provider === 'gemini' ? 'gemini-2.5-flash-lite' : 'llama-3.3-70b-versatile');

    // Validate model is in available list
    const availableModels = getAvailableModels(provider);
    if (!availableModels.includes(selectedModel)) {
      return res.status(400).json({
        success: false,
        message: `Model "${selectedModel}" is not available for provider "${provider}"`,
        data: {
          availableModels
        }
      });
    }

    // Validate API key by making a test call (Security Rule #4)
    try {
      await validateApiKey(apiKey, provider, selectedModel);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Encrypt the API key before storing (Security Rule #6)
    const encryptedKey = encrypt(apiKey);

    // Update user with encrypted API key and settings
    const user = await User.findById(req.user.id);
    user.aiApiKey = encryptedKey;
    user.aiProvider = provider;
    user.aiModel = selectedModel;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'AI configuration saved successfully',
      data: {
        hasApiKey: true,
        provider: provider,
        model: selectedModel
      }
    });
  } catch (error) {
    console.error('Set AI Config Error:', error.message); // Don't log the actual key (Security Rule #5)
    res.status(500).json({
      success: false,
      message: 'Failed to save AI configuration',
      error: error.message
    });
  }
};

/**
 * @desc    Set or update API key (legacy endpoint for backward compatibility)
 * @route   POST /api/profile/api-key
 * @access  Private
 */
const setApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid API key'
      });
    }

    // Default to Gemini for legacy endpoint
    const provider = 'gemini';
    const model = 'gemini-2.5-flash-lite';

    // Validate API key by making a test call (Security Rule #4)
    try {
      await validateApiKey(apiKey, provider, model);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Encrypt the API key before storing (Security Rule #6)
    const encryptedKey = encrypt(apiKey);

    // Update user with encrypted API key
    const user = await User.findById(req.user.id);
    user.aiApiKey = encryptedKey;
    user.aiProvider = provider;
    user.aiModel = model;
    user.geminiApiKey = encryptedKey; // Keep for backward compatibility
    await user.save();

    res.status(200).json({
      success: true,
      message: 'API key saved successfully',
      data: {
        hasApiKey: true
      }
    });
  } catch (error) {
    console.error('Set API Key Error:', error.message); // Don't log the actual key (Security Rule #5)
    res.status(500).json({
      success: false,
      message: 'Failed to save API key',
      error: error.message
    });
  }
};

/**
 * @desc    Get AI configuration status
 * @route   GET /api/profile/ai-config
 * @access  Private
 */
const getAIConfig = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('aiApiKey aiProvider aiModel geminiApiKey');

    res.status(200).json({
      success: true,
      data: {
        hasApiKey: !!(user.aiApiKey || user.geminiApiKey),
        provider: user.aiProvider || 'gemini',
        model: user.aiModel || 'gemini-2.5-flash-lite',
        availableModels: {
          gemini: getAvailableModels('gemini'),
          grok: getAvailableModels('grok')
        }
      }
    });
  } catch (error) {
    console.error('Get AI Config Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Check if user has API key configured (legacy)
 * @route   GET /api/profile/api-key/status
 * @access  Private
 */
const getApiKeyStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('aiApiKey geminiApiKey');

    res.status(200).json({
      success: true,
      data: {
        hasApiKey: !!(user.aiApiKey || user.geminiApiKey)
      }
    });
  } catch (error) {
    console.error('Get API Key Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Remove AI configuration
 * @route   DELETE /api/profile/ai-config
 * @access  Private
 */
const deleteAIConfig = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.aiApiKey = null;
    user.geminiApiKey = null;
    user.aiProvider = 'gemini';
    user.aiModel = 'gemini-2.5-flash-lite';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'AI configuration removed successfully',
      data: {
        hasApiKey: false
      }
    });
  } catch (error) {
    console.error('Delete AI Config Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove AI configuration',
      error: error.message
    });
  }
};

/**
 * @desc    Remove API key (legacy)
 * @route   DELETE /api/profile/api-key
 * @access  Private
 */
const deleteApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.aiApiKey = null;
    user.geminiApiKey = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'API key removed successfully',
      data: {
        hasApiKey: false
      }
    });
  } catch (error) {
    console.error('Delete API Key Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove API key',
      error: error.message
    });
  }
};

/**
 * @desc    Validate user's stored AI configuration
 * @route   POST /api/profile/ai-config/validate
 * @access  Private
 */
const validateStoredAIConfig = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('aiApiKey geminiApiKey aiProvider aiModel');

    if (!user.aiApiKey && !user.geminiApiKey) {
      return res.status(404).json({
        success: false,
        message: 'No API key configured'
      });
    }

    // Decrypt and validate
    const decryptedKey = user.aiApiKey ? decrypt(user.aiApiKey) : decrypt(user.geminiApiKey);
    const provider = user.aiProvider || 'gemini';
    const model = user.aiModel || 'gemini-2.5-flash-lite';

    await validateApiKey(decryptedKey, provider, model);

    res.status(200).json({
      success: true,
      message: 'AI configuration is valid',
      data: {
        isValid: true,
        provider: provider,
        model: model
      }
    });
  } catch (error) {
    console.error('Validate AI Config Error:', error.message);
    res.status(400).json({
      success: false,
      message: 'AI configuration validation failed',
      error: error.message
    });
  }
};

/**
 * @desc    Validate user's stored API key (legacy)
 * @route   POST /api/profile/api-key/validate
 * @access  Private
 */
const validateStoredApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('aiApiKey geminiApiKey aiProvider aiModel');

    if (!user.aiApiKey && !user.geminiApiKey) {
      return res.status(404).json({
        success: false,
        message: 'No API key configured'
      });
    }

    // Decrypt and validate
    const decryptedKey = user.aiApiKey ? decrypt(user.aiApiKey) : decrypt(user.geminiApiKey);
    const provider = user.aiProvider || 'gemini';
    const model = user.aiModel || 'gemini-2.5-flash-lite';

    await validateApiKey(decryptedKey, provider, model);

    res.status(200).json({
      success: true,
      message: 'API key is valid',
      data: {
        isValid: true
      }
    });
  } catch (error) {
    console.error('Validate Stored API Key Error:', error.message);
    res.status(400).json({
      success: false,
      message: 'API key validation failed',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateAccount,
  setAIConfig,
  getAIConfig,
  deleteAIConfig,
  validateStoredAIConfig,
  // Legacy endpoints for backward compatibility
  setApiKey,
  getApiKeyStatus,
  deleteApiKey,
  validateStoredApiKey
};
