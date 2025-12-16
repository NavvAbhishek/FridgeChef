import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Utensils, Leaf, ShoppingCart } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Camera,
      title: 'Snap Your Ingredients',
      description: 'Take a photo of your fridge or pantry',
      link: '/detect',
      color: 'bg-blue-500',
    },
    {
      icon: Utensils,
      title: 'Get Recipe Ideas',
      description: 'AI generates recipes from your ingredients',
      link: '/detect',
      color: 'bg-green-500',
    },
    {
      icon: Leaf,
      title: 'Track Impact',
      description: 'See how much food waste you\'ve prevented',
      link: '/dashboard',
      color: 'bg-emerald-500',
    },
    {
      icon: ShoppingCart,
      title: 'Smart Shopping',
      description: 'Auto-generated lists for missing ingredients',
      link: '/shopping',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="page-container">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your personal cooking companion that helps you reduce food waste and cook delicious meals
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">
            {user?.sustainabilityStats?.totalFoodSaved?.toFixed(1) || 0} kg
          </p>
          <p className="text-gray-600 mt-2">Food Saved</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">
            {user?.sustainabilityStats?.co2Saved?.toFixed(1) || 0} kg
          </p>
          <p className="text-gray-600 mt-2">CO₂ Saved</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">
            {user?.sustainabilityStats?.timesCooked || 0}
          </p>
          <p className="text-gray-600 mt-2">Times Cooked</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/detect"
            className="card hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <Camera className="text-primary-600" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Detect Ingredients</h3>
                <p className="text-gray-600">Start cooking with what you have</p>
              </div>
            </div>
          </Link>

          <Link
            to="/history"
            className="card hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Utensils className="text-blue-600" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">View History</h3>
                <p className="text-gray-600">Browse your cooked recipes</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.link}
                className="card text-center hover:shadow-xl transition-shadow cursor-pointer group"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Cook?</h2>
        <p className="text-lg mb-6 opacity-90">
          Upload a photo of your ingredients and let AI suggest amazing recipes!
        </p>
        <Link to="/detect" className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default Home;
