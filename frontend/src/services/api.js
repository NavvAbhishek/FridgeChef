import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


// AUTH API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};


// PROFILE API
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  updateAccount: (data) => api.put('/profile/account', data),
  // AI Configuration (New)
  getAIConfig: () => api.get('/profile/ai-config'),
  setAIConfig: (data) => api.post('/profile/ai-config', data),
  deleteAIConfig: () => api.delete('/profile/ai-config'),
  validateAIConfig: () => api.post('/profile/ai-config/validate'),
  // API Key Management (Legacy)
  setApiKey: (data) => api.post('/profile/api-key', data),
  getApiKeyStatus: () => api.get('/profile/api-key/status'),
  deleteApiKey: () => api.delete('/profile/api-key'),
  validateApiKey: () => api.post('/profile/api-key/validate'),
};


// INGREDIENT DETECTION API
export const ingredientAPI = {
  detectIngredients: (formData) => {
    return api.post('/ingredients/detect', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getDetectionHistory: (params) => api.get('/ingredients/history', { params }),
  getDetectionById: (id) => api.get(`/ingredients/detection/${id}`),
};


// RECIPE API
export const recipeAPI = {
  generateRecipes: (data) => api.post('/recipes/generate', data),
  generateSingleRecipe: (data) => api.post('/recipes/generate-one', data),
};


// HISTORY API
export const historyAPI = {
  saveToHistory: (data) => api.post('/history', data),
  getHistory: (params) => api.get('/history', { params }),
  getFavorites: (params) => api.get('/history/favorites', { params }),
  getRecipeById: (id) => api.get(`/history/${id}`),
  updateRecipe: (id, data) => api.put(`/history/${id}`, data),
  deleteRecipe: (id) => api.delete(`/history/${id}`),
  toggleFavorite: (id) => api.patch(`/history/${id}/favorite`),
};


// SHOPPING LIST API
export const shoppingAPI = {
  getShoppingList: () => api.get('/shopping'),
  addItems: (data) => api.post('/shopping', data),
  updateItem: (itemId, data) => api.put(`/shopping/item/${itemId}`, data),
  deleteItem: (itemId) => api.delete(`/shopping/item/${itemId}`),
  clearPurchased: () => api.delete('/shopping/purchased'),
  clearAll: () => api.delete('/shopping/all'),
};


// DASHBOARD API
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getSustainabilityMetrics: () => api.get('/dashboard/sustainability'),
};

export default api;
