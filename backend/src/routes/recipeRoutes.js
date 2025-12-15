const express = require('express');
const {
  generateRecipes,
  generateSingleRecipe
} = require('../controllers/recipeController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/generate', generateRecipes);
router.post('/generate-one', generateSingleRecipe);

module.exports = router;
