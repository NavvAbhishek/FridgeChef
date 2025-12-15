const express = require('express');
const {
  saveToHistory,
  getHistory,
  getFavorites,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  toggleFavorite
} = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getHistory)
  .post(saveToHistory);

router.get('/favorites', getFavorites);

router.route('/:id')
  .get(getRecipeById)
  .put(updateRecipe)
  .delete(deleteRecipe);

router.patch('/:id/favorite', toggleFavorite);

module.exports = router;
