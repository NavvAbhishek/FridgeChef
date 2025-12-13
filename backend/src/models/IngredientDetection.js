const mongoose = require('mongoose');

const IngredientDetectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imagePath: {
    type: String,
    required: true
  },
  detectedIngredients: {
    type: [String],
    required: true
  },
  // Raw AI response for debugging
  aiResponse: {
    type: String,
    default: ''
  },
  // Confidence score if available
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for user queries
IngredientDetectionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('IngredientDetection', IngredientDetectionSchema);
