import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { historyAPI } from '../services/api';
import {
  ArrowLeft,
  Clock,
  Users,
  Heart,
  Star,
  Edit,
  Save,
  X,
  Trash2,
  Leaf,
} from 'lucide-react';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [rating, setRating] = useState(0);
  const [timeTaken, setTimeTaken] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Load recipe
  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await historyAPI.getRecipeById(id);
      const recipeData = response.data.data.recipe;

      setRecipe(recipeData);
      setRating(recipeData.rating || 0);
      setTimeTaken(recipeData.timeTaken || '');
      setNotes(recipeData.notes || '');
    } catch (err) {
      setError('Failed to load recipe');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async () => {
    try {
      await historyAPI.toggleFavorite(id);
      setRecipe({ ...recipe, isFavorite: !recipe.isFavorite });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Save updates
  const handleSave = async () => {
    setSaving(true);

    try {
      await historyAPI.updateRecipe(id, {
        rating: rating || undefined,
        timeTaken: timeTaken ? parseInt(timeTaken) : undefined,
        notes: notes || undefined,
      });

      await loadRecipe();
      setEditMode(false);
    } catch (err) {
      console.error('Failed to save recipe:', err);
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setRating(recipe.rating || 0);
    setTimeTaken(recipe.timeTaken || '');
    setNotes(recipe.notes || '');
    setEditMode(false);
  };

  // Delete recipe
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    try {
      await historyAPI.deleteRecipe(id);
      navigate('/history');
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Recipe not found'}</p>
          <button onClick={() => navigate('/history')} className="btn btn-primary">
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to History</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {recipe.recipeName}
              </h1>
              <p className="text-gray-600">
                Cooked on {new Date(recipe.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleFavorite}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart
                  size={24}
                  className={
                    recipe.isFavorite
                      ? 'text-red-500 fill-red-500'
                      : 'text-gray-400'
                  }
                />
              </button>

              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="btn btn-secondary flex items-center space-x-1"
                >
                  <Edit size={18} />
                  <span>Edit</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary flex items-center space-x-1"
                  >
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="btn btn-secondary"
                  >
                    <X size={18} />
                  </button>
                </>
              )}

              <button
                onClick={handleDelete}
                className="btn btn-secondary text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Recipe Info Card */}
        <div className="card mb-6">
          <div className="flex items-center space-x-6 mb-6 pb-6 border-b flex-wrap">
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock size={18} />
              <span className="text-sm">
                {recipe.timeTaken || 'N/A'} min
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Users size={18} />
              <span className="text-sm">{recipe.servings || 'N/A'} servings</span>
            </div>
            {recipe.difficulty && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
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
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {recipe.cuisine}
              </span>
            )}
          </div>

          {/* Rating Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your Rating</h3>
            {editMode ? (
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      size={24}
                      className={
                        star <= rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <button
                    onClick={() => setRating(0)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                {recipe.rating ? (
                  <>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={
                          star <= recipe.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </>
                ) : (
                  <span className="text-gray-400 text-sm">Not rated yet</span>
                )}
              </div>
            )}
          </div>

          {/* Time Taken */}
          {editMode && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Taken (minutes)
              </label>
              <input
                type="number"
                value={timeTaken}
                onChange={(e) => setTimeTaken(e.target.value)}
                className="input w-40"
                placeholder="e.g., 30"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your Notes</h3>
            {editMode ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input h-24 resize-none"
                placeholder="Add your thoughts, modifications, or tips..."
              />
            ) : recipe.notes ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{recipe.notes}</p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No notes yet</p>
            )}
          </div>
        </div>

        {/* Sustainability Impact */}
        <div className="card mb-6 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center space-x-2 mb-4">
            <Leaf className="text-green-600" size={24} />
            <h3 className="text-lg font-bold text-gray-900">
              Sustainability Impact
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Food Saved</p>
              <p className="text-2xl font-bold text-green-600">
                {recipe.sustainabilityImpact?.foodSaved || 0} kg
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">CO₂ Saved</p>
              <p className="text-2xl font-bold text-green-600">
                {recipe.sustainabilityImpact?.co2Saved || 0} kg
              </p>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="card mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ingredients</h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span className="text-gray-700">{ingredient}</span>
              </li>
            ))}
          </ul>

          {recipe.missingIngredients &&
            recipe.missingIngredients.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Missing Ingredients (when cooked):
                </p>
                <div className="flex flex-wrap gap-2">
                  {recipe.missingIngredients.map((ing, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Instructions */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Instructions</h3>
          <ol className="space-y-4">
            {recipe.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-medium mr-4">
                  {index + 1}
                </span>
                <span className="text-gray-700 pt-1">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
