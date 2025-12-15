const express = require('express');
const {
  getShoppingList,
  addItems,
  updateItem,
  deleteItem,
  clearPurchased,
  clearAll
} = require('../controllers/shoppingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getShoppingList)
  .post(addItems);

router.route('/item/:itemId')
  .put(updateItem)
  .delete(deleteItem);

router.delete('/purchased', clearPurchased);
router.delete('/all', clearAll);

module.exports = router;
