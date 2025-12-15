const express = require('express');
const {
  detectIngredients,
  getDetectionHistory,
  getDetectionById
} = require('../controllers/ingredientController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

const router = express.Router();

// All routes are protected
router.use(protect);

// Image upload and detection
router.post('/detect', upload.single('image'), detectIngredients);

// Detection history
router.get('/history', getDetectionHistory);
router.get('/detection/:id', getDetectionById);

module.exports = router;
