import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recipeAPI, historyAPI, shoppingAPI, profileAPI } from '../services/api';
import { ChefHat, Clock, Users, Loader, Heart, ShoppingCart, ArrowLeft, AlertCircle, Settings } from 'lucide-react';

const RecipeGeneration = () => {
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('cook_now');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [checkingApiKey, setCheckingApiKey] = useState(true);

  // Check API key status on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await profileAPI.getAIConfig();
        const data = response.data.data;
        setHasApiKey(data.hasApiKey);
      } catch (error) {
        console.error('Failed to check API key:', error);
        setHasApiKey(false);
      } finally {
        setCheckingApiKey(false);
      }
    };
    checkApiKey();
  }, []);

  // Load ingredients from sessionStorage
  useEffect(() => {
    const storedIngredients = sessionStorage.getItem('ingredients');
    if (storedIngredients) {
      setIngredients(JSON.parse(storedIngredients));
      // Auto-generate recipes only if API key is configured
      if (hasApiKey && !checkingApiKey) {
        generateRecipes('cook_now', JSON.parse(storedIngredients));
      }
    } else {
      // No ingredients, redirect back
      navigate('/detect');
    }
  }, [navigate, hasApiKey, checkingApiKey]);

  // Generate recipes
  const generateRecipes = async (selectedMode, ings = ingredients) => {
    setLoading(true);
    setError('');
    setMode(selectedMode);

    try {
      const response = await recipeAPI.generateRecipes({
        ingredients: ings,
        mode: selectedMode,
        count: 3,
      });

      setRecipes(response.data.data.recipes);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate recipes');
    } finally {
      setLoading(false);
    }
  };

  // Select recipe
  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
  };

  // Save recipe to history
  const handleSaveRecipe = async (recipe) => {
    try {
      await historyAPI.saveToHistory({
        recipeName: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        missingIngredients: recipe.missingIngredients || [],
        cuisine: recipe.cuisine || '',
        difficulty: recipe.difficulty || 'medium',
        servings: recipe.servings || 2,
        detectedIngredients: ingredients,
      });

      // If there are missing ingredients, add to shopping list
      if (recipe.missingIngredients && recipe.missingIngredients.length > 0) {
        await shoppingAPI.addItems({
          items: recipe.missingIngredients.map((ing) => ({
            ingredient: ing,
            relatedRecipe: recipe.title,
          })),
        });
      }

      // Navigate to history
      navigate('/history');
    } catch (err) {
      setError('Failed to save recipe');
    }
  };

  // Go back
  const handleBack = () => {
    if (selectedRecipe) {
      setSelectedRecipe(null);
    } else {
      navigate('/detect');
    }
  };

  return (
    <div className="page-container">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedRecipe ? selectedRecipe.title : 'Your Recipe Options'}
          </h1>
          <p className="text-gray-600">
            {selectedRecipe
              ? 'Recipe details and instructions'
              : `Based on your ${ingredients.length} ingredients`}
          </p>
        </div>

        {/* API Key Notice */}
        {!checkingApiKey && !hasApiKey && (
          <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-orange-600 mt-0.5 flex-shrink-0" size={24} />
              <div className="flex-1">
                <h3 className="font-bold text-orange-900 mb-1">
                  AI Configuration Required
                </h3>
                <p className="text-sm text-orange-800 mb-3">
                  To generate recipes, you need to configure your AI provider and API key in your profile settings.
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Settings size={16} />
                  <span>Configure AI in Profile</span>
                  <ArrowLeft size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Mode Selector */}
        {!selectedRecipe && (
          <div className="mb-6 flex items-center justify-center space-x-4">
            <button
              onClick={() => generateRecipes('cook_now')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                mode === 'cook_now'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cook Now (Only Available)
            </button>
            <button
              onClick={() => generateRecipes('gap_analysis')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                mode === 'gap_analysis'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Gap Analysis (1-2 Missing)
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="animate-spin text-primary-600 mb-4" size={48} />
            <p className="text-gray-600">Generating delicious recipes...</p>
          </div>
        )}

        {/* Recipe Detail View */}
        {selectedRecipe && !loading && (
          <div className="card">
            {/* Recipe Info */}
            <div className="flex items-center space-x-6 mb-6 pb-6 border-b">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock size={18} />
                <span className="text-sm">
                  {selectedRecipe.prepTime + selectedRecipe.cookTime} min
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Users size={18} />
                <span className="text-sm">{selectedRecipe.servings} servings</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedRecipe.difficulty === 'easy'
                    ? 'bg-green-100 text-green-700'
                    : selectedRecipe.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {selectedRecipe.difficulty}
              </span>
              {selectedRecipe.cuisine && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {selectedRecipe.cuisine}
                </span>
              )}
            </div>

            {/* Missing Ingredients Warning */}
            {selectedRecipe.missingIngredients &&
              selectedRecipe.missingIngredients.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    Missing Ingredients:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.missingIngredients.map((ing, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    These will be added to your shopping list
                  </p>
                </div>
              )}

            {/* Ingredients */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Ingredients
              </h3>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary-600 mr-2">•</span>
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Instructions
              </h3>
              <ol className="space-y-3">
                {selectedRecipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={() => handleSaveRecipe(selectedRecipe)}
                className="flex-1 btn btn-primary py-3 flex items-center justify-center space-x-2"
              >
                <Heart size={20} />
                <span>Save & Start Cooking</span>
              </button>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="btn btn-secondary py-3"
              >
                Back to Recipes
              </button>
            </div>
          </div>
        )}

        {/* Recipe Cards Grid */}
        {!selectedRecipe && !loading && recipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe, index) => (
              <div
                key={index}
                className="card hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => handleSelectRecipe(recipe)}
              >
                {/* Recipe Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {recipe.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock size={16} />
                      <span>{recipe.prepTime + recipe.cookTime} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users size={16} />
                      <span>{recipe.servings}</span>
                    </div>
                  </div>
                </div>

                {/* Difficulty & Cuisine */}
                <div className="flex items-center space-x-2 mb-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      recipe.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700'
                        : recipe.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {recipe.difficulty}
                  </span>
                  {recipe.cuisine && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                      {recipe.cuisine}
                    </span>
                  )}
                </div>

                {/* Missing Ingredients Badge */}
                {recipe.missingIngredients &&
                  recipe.missingIngredients.length > 0 && (
                    <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        Need {recipe.missingIngredients.length} more ingredient
                        {recipe.missingIngredients.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                {/* Preview Ingredients */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Ingredients ({recipe.ingredients.length}):
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {recipe.ingredients.slice(0, 3).join(', ')}
                    {recipe.ingredients.length > 3 && '...'}
                  </p>
                </div>

                {/* View Button */}
                <button className="w-full btn btn-outline py-2 flex items-center justify-center space-x-2">
                  <ChefHat size={18} />
                  <span>View Recipe</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* No Recipes */}
        {!loading && !selectedRecipe && recipes.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-600">No recipes generated yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeGeneration;
