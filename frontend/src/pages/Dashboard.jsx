import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Leaf, ChefHat, Star, Calendar } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load dashboard data
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await dashboardAPI.getDashboard();
      setDashboard(response.data.data);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Colors for charts
  const COLORS = ['#16a34a', '#eab308', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

  // Format monthly data for chart
  const formatMonthlyData = (data) => {
    if (!data || data.length === 0) return [];

    return data.map((item) => ({
      name: `${item._id.month}/${item._id.year}`,
      recipes: item.count,
      foodSaved: item.totalFoodSaved,
      co2Saved: item.totalCO2Saved,
    }));
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
  if (error || !dashboard) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Failed to load dashboard'}</p>
          <button onClick={loadDashboard} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { overview, monthlyData, cuisineDistribution, difficultyDistribution, recentActivity } =
    dashboard;

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Cooking Dashboard
          </h1>
          <p className="text-gray-600">
            Track your progress and environmental impact
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Recipes */}
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <ChefHat className="text-primary-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.totalRecipes}
                </p>
                <p className="text-sm text-gray-600">Total Recipes</p>
              </div>
            </div>
          </div>

          {/* Favorites */}
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Star className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.favoriteRecipes}
                </p>
                <p className="text-sm text-gray-600">Favorites</p>
              </div>
            </div>
          </div>

          {/* Food Saved */}
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Leaf className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.totalFoodSaved.toFixed(1)} kg
                </p>
                <p className="text-sm text-gray-600">Food Saved</p>
              </div>
            </div>
          </div>

          {/* CO₂ Saved */}
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-emerald-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.co2Saved.toFixed(1)} kg
                </p>
                <p className="text-sm text-gray-600">CO₂ Saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Cooking Activity */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Monthly Cooking Activity
            </h3>
            {monthlyData && monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatMonthlyData(monthlyData)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="recipes" fill="#16a34a" name="Recipes Cooked" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar size={48} className="mx-auto mb-2 text-gray-400" />
                <p>No cooking data yet</p>
              </div>
            )}
          </div>

          {/* Cuisine Distribution */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Cuisine Distribution
            </h3>
            {cuisineDistribution && cuisineDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={cuisineDistribution}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => entry._id}
                  >
                    {cuisineDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ChefHat size={48} className="mx-auto mb-2 text-gray-400" />
                <p>No cuisine data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Difficulty Distribution & Average Rating */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Difficulty Distribution */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Recipe Difficulty
            </h3>
            {difficultyDistribution && difficultyDistribution.length > 0 ? (
              <div className="space-y-4">
                {difficultyDistribution.map((item) => {
                  const total = difficultyDistribution.reduce((sum, d) => sum + d.count, 0);
                  const percentage = ((item.count / total) * 100).toFixed(0);

                  return (
                    <div key={item._id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {item._id || 'Unknown'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item._id === 'easy'
                              ? 'bg-green-500'
                              : item._id === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No difficulty data yet</p>
              </div>
            )}
          </div>

          {/* Average Rating & Stats */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Stats</h3>
            <div className="space-y-4">
              {/* Average Rating */}
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Star className="text-yellow-500 fill-yellow-500" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overview.averageRating > 0
                        ? overview.averageRating.toFixed(1)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {overview.totalRated} recipes rated
                  </p>
                </div>
              </div>

              {/* Times Cooked */}
              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ChefHat className="text-primary-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Times Cooked</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overview.timesCooked}
                    </p>
                  </div>
                </div>
              </div>

              {/* Environmental Impact */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Leaf className="text-green-600" size={20} />
                  <p className="text-sm font-medium text-green-800">
                    Environmental Impact
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Food Saved:</span>
                    <span className="font-bold text-green-700">
                      {overview.totalFoodSaved.toFixed(1)} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">CO₂ Reduced:</span>
                    <span className="font-bold text-green-700">
                      {overview.co2Saved.toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((recipe) => (
                <div
                  key={recipe._id}
                  onClick={() => navigate(`/recipe/${recipe._id}`)}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{recipe.recipeName}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-sm text-gray-600">
                        {new Date(recipe.createdAt).toLocaleDateString()}
                      </p>
                      {recipe.cuisine && (
                        <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                          {recipe.cuisine}
                        </span>
                      )}
                      {recipe.rating && (
                        <div className="flex items-center space-x-1">
                          {[...Array(recipe.rating)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className="text-yellow-400 fill-yellow-400"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
