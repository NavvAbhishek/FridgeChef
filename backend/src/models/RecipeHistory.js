const mongoose = require('mongoose');

const RecipeHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipeName: {
    type: String,
    required: [true, 'Recipe name is required'],
    trim: true
  },
  ingredients: {
    type: [String],
    required: true
  },
  instructions: {
    type: [String],
    required: true
  },
  missingIngredients: {
    type: [String],
    default: []
  },
  // User feedback on recipe
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  timeTaken: {
    type: Number, // in minutes
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  // Favorite flag
  isFavorite: {
    type: Boolean,
    default: false
  },
  // Sustainability impact of this recipe
  sustainabilityImpact: {
    foodSaved: {
      type: Number,
      default: 0 // kg
    },
    co2Saved: {
      type: Number,
      default: 0 // kg
    }
  },
  // Recipe metadata
  cuisine: {
    type: String,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  servings: {
    type: Number,
    default: 2
  },
  // Detection source (which ingredients were detected from photo)
  detectedIngredients: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
RecipeHistorySchema.index({ user: 1, createdAt: -1 });
RecipeHistorySchema.index({ user: 1, isFavorite: 1 });

module.exports = mongoose.model('RecipeHistory', RecipeHistorySchema);
