const ShoppingList = require('../models/ShoppingList');

/**
 * @desc    Get user's shopping list
 * @route   GET /api/shopping
 * @access  Private
 */
const getShoppingList = async (req, res) => {
  try {
    let shoppingList = await ShoppingList.findOne({ user: req.user.id });

    // Create empty list if doesn't exist
    if (!shoppingList) {
      shoppingList = await ShoppingList.create({
        user: req.user.id,
        items: []
      });
    }

    res.status(200).json({
      success: true,
      data: {
        shoppingList: shoppingList
      }
    });
  } catch (error) {
    console.error('Get Shopping List Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Add items to shopping list
 * @route   POST /api/shopping
 * @access  Private
 */
const addItems = async (req, res) => {
  try {
    const { items } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of items'
      });
    }

    let shoppingList = await ShoppingList.findOne({ user: req.user.id });

    // Create list if doesn't exist
    if (!shoppingList) {
      shoppingList = new ShoppingList({
        user: req.user.id,
        items: []
      });
    }

    // Add new items
    items.forEach(item => {
      shoppingList.items.push({
        ingredient: item.ingredient || item,
        quantity: item.quantity || '',
        relatedRecipe: item.relatedRecipe || '',
        isPurchased: false
      });
    });

    await shoppingList.save();

    res.status(201).json({
      success: true,
      message: `Added ${items.length} item(s) to shopping list`,
      data: {
        shoppingList: shoppingList
      }
    });
  } catch (error) {
    console.error('Add Items Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update shopping list item
 * @route   PUT /api/shopping/item/:itemId
 * @access  Private
 */
const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { isPurchased, quantity, ingredient } = req.body;

    const shoppingList = await ShoppingList.findOne({ user: req.user.id });

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'Shopping list not found'
      });
    }

    // Find item
    const item = shoppingList.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Update fields
    if (isPurchased !== undefined) item.isPurchased = isPurchased;
    if (quantity !== undefined) item.quantity = quantity;
    if (ingredient !== undefined) item.ingredient = ingredient;

    await shoppingList.save();

    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: {
        shoppingList: shoppingList
      }
    });
  } catch (error) {
    console.error('Update Item Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Delete shopping list item
 * @route   DELETE /api/shopping/item/:itemId
 * @access  Private
 */
const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const shoppingList = await ShoppingList.findOne({ user: req.user.id });

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'Shopping list not found'
      });
    }

    // Remove item using pull
    shoppingList.items.pull(itemId);
    await shoppingList.save();

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
      data: {
        shoppingList: shoppingList
      }
    });
  } catch (error) {
    console.error('Delete Item Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Clear all purchased items
 * @route   DELETE /api/shopping/purchased
 * @access  Private
 */
const clearPurchased = async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({ user: req.user.id });

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'Shopping list not found'
      });
    }

    // Remove all purchased items
    shoppingList.items = shoppingList.items.filter(item => !item.isPurchased);
    await shoppingList.save();

    res.status(200).json({
      success: true,
      message: 'Purchased items cleared',
      data: {
        shoppingList: shoppingList
      }
    });
  } catch (error) {
    console.error('Clear Purchased Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Clear entire shopping list
 * @route   DELETE /api/shopping/all
 * @access  Private
 */
const clearAll = async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({ user: req.user.id });

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'Shopping list not found'
      });
    }

    shoppingList.items = [];
    await shoppingList.save();

    res.status(200).json({
      success: true,
      message: 'Shopping list cleared',
      data: {
        shoppingList: shoppingList
      }
    });
  } catch (error) {
    console.error('Clear All Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getShoppingList,
  addItems,
  updateItem,
  deleteItem,
  clearPurchased,
  clearAll
};
