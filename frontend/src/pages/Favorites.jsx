import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyAPI } from '../services/api';
import { Clock, Users, Heart, Star, ChefHat } from 'lucide-react';

const Favorites = () => {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load favorite recipes
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await historyAPI.getFavorites({
        limit: 50, // Load more favorites
      });

      setRecipes(response.data.data.favorites);
    } catch (err) {
      setError('Failed to load favorite recipes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite (unfavorite)
  const handleToggleFavorite = async (recipeId) => {
    try {
      await historyAPI.toggleFavorite(recipeId);
      // Remove from list
      setRecipes(recipes.filter((r) => r._id !== recipeId));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // View recipe detail
  const handleViewRecipe = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };

  // Render star rating
  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-400 text-sm">Not rated</span>;

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Heart className="text-red-500 fill-red-500" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Favorite Recipes</h1>
          </div>
          <p className="text-gray-600">Your most loved recipes, all in one place</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Recipe Grid */}
        {!loading && recipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <div
                key={recipe._id}
                className="card hover:shadow-xl transition-shadow relative group"
              >
                {/* Favorite Heart (Top Right) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(recipe._id);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white shadow-md hover:scale-110 transition-transform z-10"
                >
                  <Heart size={20} className="text-red-500 fill-red-500" />
                </button>

                {/* Recipe Content */}
                <div onClick={() => handleViewRecipe(recipe._id)} className="cursor-pointer">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 pr-8">
                    {recipe.recipeName}
                  </h3>

                  {/* Meta Info */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    {recipe.timeTaken && (
                      <div className="flex items-center space-x-1">
                        <Clock size={16} />
                        <span>{recipe.timeTaken} min</span>
                      </div>
                    )}
                    {recipe.servings && (
                      <div className="flex items-center space-x-1">
                        <Users size={16} />
                        <span>{recipe.servings}</span>
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center space-x-2 mb-3">
                    {recipe.difficulty && (
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
                    )}
                    {recipe.cuisine && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                        {recipe.cuisine}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="mb-3">{renderStars(recipe.rating)}</div>

                  {/* Notes Preview */}
                  {recipe.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-600 line-clamp-2">{recipe.notes}</p>
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-500 mb-3">
                    Cooked on {new Date(recipe.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t">
                  <button
                    onClick={() => handleViewRecipe(recipe._id)}
                    className="w-full btn btn-primary py-2 text-sm flex items-center justify-center space-x-1"
                  >
                    <ChefHat size={16} />
                    <span>View Recipe</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && recipes.length === 0 && (
          <div className="text-center py-12">
            <Heart className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No favorite recipes yet</h3>
            <p className="text-gray-600 mb-6">
              Mark recipes as favorites to see them here!
            </p>
            <button
              onClick={() => navigate('/history')}
              className="btn btn-primary"
            >
              View Recipe History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
