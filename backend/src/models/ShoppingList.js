const mongoose = require('mongoose');

const ShoppingListItemSchema = new mongoose.Schema({
  ingredient: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    default: '' // e.g., "2 cups", "500g", etc.
  },
  isPurchased: {
    type: Boolean,
    default: false
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  // Which recipe this item is for (optional)
  relatedRecipe: {
    type: String,
    default: ''
  }
});

const ShoppingListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [ShoppingListItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
ShoppingListSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster user queries
ShoppingListSchema.index({ user: 1 });

module.exports = mongoose.model('ShoppingList', ShoppingListSchema);
