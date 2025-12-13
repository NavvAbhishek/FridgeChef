const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password in queries by default
  },
  // AI Provider Configuration
  aiProvider: {
    type: String,
    enum: ['gemini', 'grok'],
    default: 'gemini'
  },
  // Selected AI Model
  aiModel: {
    type: String,
    default: 'gemini-2.5-flash-lite'
  },
  // Encrypted AI API Key (user-provided)
  aiApiKey: {
    type: String,
    select: false, // Never return in queries by default for security
    default: null
  },
  // Legacy field for backward compatibility
  geminiApiKey: {
    type: String,
    select: false,
    default: null
  },
  // User Profile Settings
  profile: {
    allergies: {
      type: [String],
      default: []
    },
    dietaryRestrictions: {
      type: [String],
      default: [],
      enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'low-carb', 'low-sodium', 'keto', 'paleo', 'none']
    },
    dislikedFoods: {
      type: [String],
      default: []
    },
    cuisinePreferences: {
      type: [String],
      default: []
    },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  // Sustainability Metrics
  sustainabilityStats: {
    totalFoodSaved: {
      type: Number,
      default: 0 // in kg
    },
    co2Saved: {
      type: Number,
      default: 0 // in kg
    },
    timesCooked: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving user
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = mongoose.model('User', UserSchema);
