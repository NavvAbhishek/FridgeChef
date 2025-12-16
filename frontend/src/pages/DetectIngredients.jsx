import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ingredientAPI, profileAPI } from '../services/api';
import { Camera, Upload, X, Loader, ChefHat, ArrowRight, AlertCircle, Settings } from 'lucide-react';

const DetectIngredients = () => {
  const navigate = useNavigate();

  // State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Upload, 2: Detected, 3: Generate
  const [hasApiKey, setHasApiKey] = useState(true);
  const [aiProvider, setAiProvider] = useState('');
  const [checkingApiKey, setCheckingApiKey] = useState(true);

  // Check API key status on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await profileAPI.getAIConfig();
        const data = response.data.data;
        setHasApiKey(data.hasApiKey);
        setAiProvider(data.provider || 'gemini');
      } catch (error) {
        console.error('Failed to check API key:', error);
        setHasApiKey(false);
      } finally {
        setCheckingApiKey(false);
      }
    };
    checkApiKey();
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectedIngredients([]);
    setError('');
    setStep(1);
  };

  // Detect ingredients
  const handleDetect = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await ingredientAPI.detectIngredients(formData);
      const ingredients = response.data.data.ingredients;

      setDetectedIngredients(ingredients);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to detect ingredients');
    } finally {
      setLoading(false);
    }
  };

  // Add ingredient manually
  const handleAddIngredient = (ingredient) => {
    if (ingredient.trim() && !detectedIngredients.includes(ingredient.trim())) {
      setDetectedIngredients([...detectedIngredients, ingredient.trim()]);
    }
  };

  // Remove ingredient
  const handleRemoveIngredient = (ingredient) => {
    setDetectedIngredients(
      detectedIngredients.filter((ing) => ing !== ingredient)
    );
  };

  // Navigate to recipe generation
  const handleGenerateRecipes = () => {
    // Store ingredients in sessionStorage for recipe page
    sessionStorage.setItem('ingredients', JSON.stringify(detectedIngredients));
    navigate('/recipes');
  };

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Detect Your Ingredients
          </h1>
          <p className="text-gray-600">
            Upload a photo of your fridge or pantry, and AI will identify your
            ingredients
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
                  To use ingredient detection, you need to configure your AI provider and API key in your profile settings.
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Settings size={16} />
                  <span>Configure AI in Profile</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}


        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          <div
            className={`flex items-center ${
              step >= 1 ? 'text-primary-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300'
              }`}
            >
              1
            </div>
            <span className="ml-2 font-medium">Upload</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-300"></div>

          <div
            className={`flex items-center ${
              step >= 2 ? 'text-primary-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300'
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">Detect</span>
          </div>

          <div className="w-12 h-0.5 bg-gray-300"></div>

          <div
            className={`flex items-center ${
              step >= 3 ? 'text-primary-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 3
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300'
              }`}
            >
              3
            </div>
            <span className="ml-2 font-medium">Cook</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Upload Image */}
        {step === 1 && (
          <div className="card">
            {!previewUrl ? (
              <div className="text-center">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer block"
                >
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-primary-500 transition-colors">
                    <Camera
                      className="mx-auto text-gray-400 mb-4"
                      size={64}
                    />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Click to upload an image
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF or WebP (max 5MB)
                    </p>
                  </div>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div>
                {/* Image Preview */}
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <button
                    onClick={handleClear}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Actions */}
                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={handleDetect}
                    disabled={loading}
                    className="flex-1 btn btn-primary py-3 text-lg flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Camera size={20} />
                        <span>Detect Ingredients</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClear}
                    className="btn btn-secondary py-3"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Detected Ingredients */}
        {step === 2 && (
          <div className="card">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Detected Ingredients
              </h2>
              <p className="text-sm text-gray-600">
                Review and edit the detected ingredients. You can add or remove items.
              </p>
            </div>

            {/* Preview Image (Small) */}
            {previewUrl && (
              <div className="mb-6">
                <img
                  src={previewUrl}
                  alt="Detected"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Ingredients List */}
            {detectedIngredients.length > 0 ? (
              <div className="mb-6">
                <div className="flex flex-wrap gap-3">
                  {detectedIngredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 bg-primary-50 border-2 border-primary-200 px-4 py-2 rounded-lg"
                    >
                      <span className="text-primary-900 font-medium">
                        {ingredient}
                      </span>
                      <button
                        onClick={() => handleRemoveIngredient(ingredient)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No ingredients detected. Try uploading a clearer image or add
                  ingredients manually.
                </p>
              </div>
            )}

            {/* Add Ingredient Manually */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Ingredient Manually
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g., tomatoes, garlic"
                  className="input flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddIngredient(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling;
                    handleAddIngredient(input.value);
                    input.value = '';
                  }}
                  className="btn btn-secondary"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleGenerateRecipes}
                disabled={detectedIngredients.length === 0}
                className="flex-1 btn btn-primary py-3 text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChefHat size={20} />
                <span>Generate Recipes</span>
                <ArrowRight size={20} />
              </button>
              <button onClick={handleClear} className="btn btn-secondary py-3">
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Camera className="text-blue-600" size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Take a Photo</h3>
            <p className="text-sm text-gray-600">
              Capture your fridge or pantry contents
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="text-green-600" size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">AI Detection</h3>
            <p className="text-sm text-gray-600">
              Our AI identifies your ingredients
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ChefHat className="text-primary-600" size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Get Recipes</h3>
            <p className="text-sm text-gray-600">
              Receive personalized recipe suggestions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectIngredients;
