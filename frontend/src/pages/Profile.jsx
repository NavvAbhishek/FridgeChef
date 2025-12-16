import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import { User, Mail, Save, CheckCircle, AlertCircle, Key, Eye, EyeOff, Shield } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();

  // Account info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Profile preferences
  const [allergies, setAllergies] = useState([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [dislikedFoods, setDislikedFoods] = useState([]);
  const [cuisinePreferences, setCuisinePreferences] = useState([]);
  const [skillLevel, setSkillLevel] = useState('beginner');

  // Temporary input fields
  const [allergyInput, setAllergyInput] = useState('');
  const [dislikedInput, setDislikedInput] = useState('');
  const [cuisineInput, setCuisineInput] = useState('');

  // AI Configuration state
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-lite');
  const [availableModels, setAvailableModels] = useState({
    gemini: [],
    grok: []
  });
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState({ type: '', text: '' });

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Dietary restriction options
  const dietaryOptions = [
    'vegetarian',
    'vegan',
    'halal',
    'kosher',
    'gluten-free',
    'dairy-free',
    'low-carb',
    'low-sodium',
    'keto',
    'paleo',
  ];

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAllergies(user.profile?.allergies || []);
      setDietaryRestrictions(user.profile?.dietaryRestrictions || []);
      setDislikedFoods(user.profile?.dislikedFoods || []);
      setCuisinePreferences(user.profile?.cuisinePreferences || []);
      setSkillLevel(user.profile?.skillLevel || 'beginner');
    }
  }, [user]);

  // Load AI configuration on mount
  useEffect(() => {
    const loadAIConfig = async () => {
      try {
        const response = await profileAPI.getAIConfig();
        const data = response.data.data;
        setHasApiKey(data.hasApiKey);
        setProvider(data.provider || 'gemini');
        setSelectedModel(data.model || 'gemini-2.5-flash-lite');
        setAvailableModels(data.availableModels || { gemini: [], grok: [] });
      } catch (error) {
        console.error('Failed to load AI config:', error);
      }
    };
    loadAIConfig();
  }, []);

  // Add item to array
  const addItem = (value, setter, currentArray) => {
    if (value.trim() && !currentArray.includes(value.trim())) {
      setter([...currentArray, value.trim()]);
    }
  };

  // Remove item from array
  const removeItem = (item, setter, currentArray) => {
    setter(currentArray.filter((i) => i !== item));
  };

  // Toggle dietary restriction
  const toggleDietaryRestriction = (option) => {
    if (dietaryRestrictions.includes(option)) {
      setDietaryRestrictions(dietaryRestrictions.filter((r) => r !== option));
    } else {
      setDietaryRestrictions([...dietaryRestrictions, option]);
    }
  };

  // Save account info
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await profileAPI.updateAccount({ name, email });
      updateUser(response.data.data.user);
      setMessage({ type: 'success', text: 'Account updated successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update account',
      });
    } finally {
      setLoading(false);
    }
  };

  // Save profile preferences
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await profileAPI.updateProfile({
        allergies,
        dietaryRestrictions,
        dislikedFoods,
        cuisinePreferences,
        skillLevel,
      });

      // Update user in context
      const updatedUser = { ...user, profile: response.data.data.profile };
      updateUser(updatedUser);

      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save preferences',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle provider change
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    // Set default model for the provider
    if (newProvider === 'gemini') {
      setSelectedModel('gemini-2.5-flash-lite');
    } else {
      setSelectedModel('llama-3.3-70b-versatile');
    }
  };

  // Save AI Configuration
  const handleSaveAIConfig = async (e) => {
    e.preventDefault();
    setApiKeyLoading(true);
    setApiKeyMessage({ type: '', text: '' });

    try {
      await profileAPI.setAIConfig({
        apiKey,
        provider,
        model: selectedModel
      });
      setHasApiKey(true);
      setApiKey('');
      setShowApiKey(false);
      setApiKeyMessage({
        type: 'success',
        text: `${provider === 'gemini' ? 'Gemini' : 'Groq'} API key saved and validated successfully!`,
      });
    } catch (error) {
      setApiKeyMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save AI configuration',
      });
    } finally {
      setApiKeyLoading(false);
    }
  };

  // Validate stored AI Configuration
  const handleValidateAIConfig = async () => {
    setApiKeyLoading(true);
    setApiKeyMessage({ type: '', text: '' });

    try {
      const response = await profileAPI.validateAIConfig();
      setApiKeyMessage({
        type: 'success',
        text: `${response.data.data.provider === 'gemini' ? 'Gemini' : 'Groq'} API key is valid and working!`,
      });
    } catch (error) {
      setApiKeyMessage({
        type: 'error',
        text: error.response?.data?.message || 'AI configuration validation failed',
      });
    } finally {
      setApiKeyLoading(false);
    }
  };

  // Delete AI Configuration
  const handleDeleteAIConfig = async () => {
    if (!confirm('Are you sure you want to remove your AI configuration? You will need to set it up again to use AI features.')) {
      return;
    }

    setApiKeyLoading(true);
    setApiKeyMessage({ type: '', text: '' });

    try {
      await profileAPI.deleteAIConfig();
      setHasApiKey(false);
      setApiKey('');
      setProvider('gemini');
      setSelectedModel('gemini-2.5-flash-lite');
      setApiKeyMessage({
        type: 'success',
        text: 'AI configuration removed successfully',
      });
    } catch (error) {
      setApiKeyMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to remove AI configuration',
      });
    } finally {
      setApiKeyLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your account and cooking preferences
          </p>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <AlertCircle className="text-red-600" size={20} />
            )}
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Account Information */}
        <div className="card mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
          </div>

          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save size={18} />
              <span>Save Account Info</span>
            </button>
          </form>
        </div>

        {/* AI Configuration */}
        <div className="card mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Key className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">AI Configuration</h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <Shield className="text-blue-600 mt-0.5" size={18} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Required for AI Features</p>
                <p className="mb-2">
                  Choose your AI provider (Google Gemini or Groq) and enter your API key.
                  Your key is encrypted and securely stored.
                </p>
                <div className="space-y-1">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline hover:text-blue-900 block"
                  >
                    Get Gemini API key from Google AI Studio →
                  </a>
                  <a
                    href="https://console.groq.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline hover:text-blue-900 block"
                  >
                    Get Groq API key from Groq Console →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {apiKeyMessage.text && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-center space-x-2 ${
                apiKeyMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {apiKeyMessage.type === 'success' ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <AlertCircle className="text-red-600" size={20} />
              )}
              <p
                className={`text-sm ${
                  apiKeyMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {apiKeyMessage.text}
              </p>
            </div>
          )}

          {hasApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
                <span className="text-sm text-green-700 font-medium">
                  AI configured: {provider === 'gemini' ? 'Google Gemini' : 'Groq'} - {selectedModel}
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleValidateAIConfig}
                  disabled={apiKeyLoading}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Shield size={18} />
                  <span>Test Configuration</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAIConfig}
                  disabled={apiKeyLoading}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
                >
                  <AlertCircle size={18} />
                  <span>Remove Configuration</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveAIConfig} className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleProviderChange('gemini')}
                    className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      provider === 'gemini'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-bold">Google Gemini</div>
                      <div className="text-xs mt-1">Supports images & recipes</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderChange('grok')}
                    className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      provider === 'grok'
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-bold">Groq</div>
                      <div className="text-xs mt-1">Supports images & recipes</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="input"
                  required
                >
                  {availableModels[provider]?.length > 0 ? (
                    availableModels[provider].map((model) => (
                      <option key={model} value={model}>
                        {model}
                        {(model === 'gemini-2.5-flash-lite' || model === 'llama-3.3-70b-versatile') && ' (Recommended)'}
                      </option>
                    ))
                  ) : (
                    <option value={selectedModel}>{selectedModel}</option>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {provider === 'gemini' ? 'Flash models are faster and more cost-effective' : 'Choose based on your speed and quality needs'}
                </p>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {provider === 'gemini' ? 'Gemini' : 'Groq'} API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="input pr-10"
                    placeholder={provider === 'gemini' ? 'AIza...' : 'gsk_...'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your API key will be encrypted and never exposed to the frontend
                </p>
              </div>

              <button
                type="submit"
                disabled={apiKeyLoading || !apiKey.trim()}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save size={18} />
                <span>Save & Validate Configuration</span>
              </button>
            </form>
          )}
        </div>

        {/* Cooking Preferences */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Cooking Preferences
          </h2>

          <form onSubmit={handleSavePreferences} className="space-y-6">
            {/* Skill Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cooking Skill Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSkillLevel(level)}
                    className={`py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                      skillLevel === level
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies
                <span className="text-red-600 ml-1">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Critical for your safety - recipes will avoid these ingredients
              </p>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(allergyInput, setAllergies, allergies);
                      setAllergyInput('');
                    }
                  }}
                  className="input flex-1"
                  placeholder="e.g., peanuts, shellfish"
                />
                <button
                  type="button"
                  onClick={() => {
                    addItem(allergyInput, setAllergies, allergies);
                    setAllergyInput('');
                  }}
                  className="btn btn-secondary"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{allergy}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(allergy, setAllergies, allergies)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Restrictions
              </label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleDietaryRestriction(option)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      dietaryRestrictions.includes(option)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Disliked Foods */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disliked Foods
              </label>
              <p className="text-xs text-gray-500 mb-2">
                We'll try to avoid these in your recipes
              </p>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={dislikedInput}
                  onChange={(e) => setDislikedInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(dislikedInput, setDislikedFoods, dislikedFoods);
                      setDislikedInput('');
                    }
                  }}
                  className="input flex-1"
                  placeholder="e.g., mushrooms, olives"
                />
                <button
                  type="button"
                  onClick={() => {
                    addItem(dislikedInput, setDislikedFoods, dislikedFoods);
                    setDislikedInput('');
                  }}
                  className="btn btn-secondary"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {dislikedFoods.map((food) => (
                  <span
                    key={food}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{food}</span>
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(food, setDislikedFoods, dislikedFoods)
                      }
                      className="text-gray-600 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Cuisine Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favorite Cuisines
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={cuisineInput}
                  onChange={(e) => setCuisineInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(
                        cuisineInput,
                        setCuisinePreferences,
                        cuisinePreferences
                      );
                      setCuisineInput('');
                    }
                  }}
                  className="input flex-1"
                  placeholder="e.g., Italian, Mexican, Thai"
                />
                <button
                  type="button"
                  onClick={() => {
                    addItem(
                      cuisineInput,
                      setCuisinePreferences,
                      cuisinePreferences
                    );
                    setCuisineInput('');
                  }}
                  className="btn btn-secondary"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cuisinePreferences.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{cuisine}</span>
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(
                          cuisine,
                          setCuisinePreferences,
                          cuisinePreferences
                        )
                      }
                      className="text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Save size={18} />
              <span>Save Preferences</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
