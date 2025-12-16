import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyAPI } from '../services/api';
import { Clock, Users, Heart, Star, ChefHat, Trash2, Filter } from 'lucide-react';

const History = () => {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load recipes
  useEffect(() => {
    loadRecipes();
  }, [sortBy, page]);

  const loadRecipes = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await historyAPI.getHistory({
        page,
        limit: 12,
        sortBy,
      });

      setRecipes(response.data.data.history);
      setTotalPages(response.data.data.pagination.pages);
    } catch (err) {
      setError('Failed to load recipe history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (recipeId) => {
    try {
      await historyAPI.toggleFavorite(recipeId);
      // Reload recipes to get updated favorite status
      loadRecipes();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Delete recipe
  const handleDelete = async (recipeId) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    try {
      await historyAPI.deleteRecipe(recipeId);
      loadRecipes();
    } catch (err) {
      console.error('Failed to delete recipe:', err);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recipe History</h1>
          <p className="text-gray-600">All the delicious meals you've cooked</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="input py-2"
            >
              <option value="createdAt">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="recipeName">Name (A-Z)</option>
            </select>
          </div>

          {/* Stats */}
          <div className="text-sm text-gray-600">
            {recipes.length > 0 && (
              <span>Showing {recipes.length} recipes</span>
            )}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                  <Heart
                    size={20}
                    className={recipe.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}
                  />
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

                  {/* Sustainability Impact */}
                  <div className="bg-green-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Food Saved:</span>
                      <span className="font-medium text-green-800">
                        {recipe.sustainabilityImpact?.foodSaved || 0} kg
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">CO₂ Saved:</span>
                      <span className="font-medium text-green-800">
                        {recipe.sustainabilityImpact?.co2Saved || 0} kg
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-gray-500 mb-3">
                    Cooked on {new Date(recipe.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-3 border-t">
                  <button
                    onClick={() => handleViewRecipe(recipe._id)}
                    className="flex-1 btn btn-primary py-2 text-sm flex items-center justify-center space-x-1"
                  >
                    <ChefHat size={16} />
                    <span>View Recipe</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(recipe._id);
                    }}
                    className="btn btn-secondary py-2 px-3"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && recipes.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No recipes yet</h3>
            <p className="text-gray-600 mb-6">
              Start by detecting ingredients and cooking your first recipe!
            </p>
            <button
              onClick={() => navigate('/detect')}
              className="btn btn-primary"
            >
              Detect Ingredients
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
