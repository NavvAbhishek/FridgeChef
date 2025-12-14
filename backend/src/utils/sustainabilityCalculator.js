/**
 * Estimate food saved based on number of ingredients used
 * @param {number} ingredientCount - Number of ingredients in recipe
 * @returns {number} - Estimated kg of food saved
 */
const calculateFoodSaved = (ingredientCount) => {
  // Average: ~0.2kg per ingredient saved from waste
  const avgPerIngredient = 0.2;
  return Math.round(ingredientCount * avgPerIngredient * 10) / 10;
};

/**
 * Estimate CO2 saved by cooking instead of ordering/wasting food
 * @param {number} ingredientCount - Number of ingredients
 * @returns {number} - Estimated kg of CO2 saved
 */
const calculateCO2Saved = (ingredientCount) => {
  // Average: ~0.5kg CO2 per ingredient saved (production + waste)
  const avgCO2PerIngredient = 0.5;
  return Math.round(ingredientCount * avgCO2PerIngredient * 10) / 10;
};

/**
 * Calculate full sustainability impact for a recipe
 * @param {Array} ingredients - Recipe ingredients
 * @returns {Object} - Sustainability metrics
 */
const calculateRecipeImpact = (ingredients) => {
  const ingredientCount = ingredients.length;

  return {
    foodSaved: calculateFoodSaved(ingredientCount),
    co2Saved: calculateCO2Saved(ingredientCount)
  };
};

/**
 * Update user's total sustainability stats
 * @param {Object} user - User document
 * @param {Object} recipeImpact - Recipe sustainability impact
 * @returns {Object} - Updated stats
 */
const updateUserStats = async (user, recipeImpact) => {
  user.sustainabilityStats.totalFoodSaved += recipeImpact.foodSaved;
  user.sustainabilityStats.co2Saved += recipeImpact.co2Saved;
  user.sustainabilityStats.timesCooked += 1;

  await user.save();

  return user.sustainabilityStats;
};

module.exports = {
  calculateFoodSaved,
  calculateCO2Saved,
  calculateRecipeImpact,
  updateUserStats
};
