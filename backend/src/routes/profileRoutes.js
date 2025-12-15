const express = require('express');
const {
  getProfile,
  updateProfile,
  updateAccount,
  setAIConfig,
  getAIConfig,
  deleteAIConfig,
  validateStoredAIConfig,
  setApiKey,
  getApiKeyStatus,
  deleteApiKey,
  validateStoredApiKey
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getProfile)
  .put(updateProfile);

router.put('/account', updateAccount);

// AI Configuration Routes (New)
router.route('/ai-config')
  .get(getAIConfig)
  .post(setAIConfig)
  .delete(deleteAIConfig);

router.post('/ai-config/validate', validateStoredAIConfig);

// API Key Management Routes (Legacy - for backward compatibility)
router.route('/api-key')
  .post(setApiKey)
  .delete(deleteApiKey);

router.get('/api-key/status', getApiKeyStatus);
router.post('/api-key/validate', validateStoredApiKey);

module.exports = router;
