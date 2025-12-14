const User = require('../models/User');
const RecipeHistory = require('../models/RecipeHistory');

/**
 * @desc    Get sustainability dashboard data
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get recipe statistics
    const totalRecipes = await RecipeHistory.countDocuments({ user: req.user.id });
    const favoriteRecipes = await RecipeHistory.countDocuments({
      user: req.user.id,
      isFavorite: true
    });

    // Get recent activity (last 10 recipes)
    const recentActivity = await RecipeHistory.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('recipeName createdAt rating cuisine');

    // Get monthly data (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRecipes = await RecipeHistory.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalFoodSaved: { $sum: '$sustainabilityImpact.foodSaved' },
          totalCO2Saved: { $sum: '$sustainabilityImpact.co2Saved' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get cuisine distribution
    const cuisineStats = await RecipeHistory.aggregate([
      {
        $match: { user: user._id }
      },
      {
        $group: {
          _id: '$cuisine',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get difficulty distribution
    const difficultyStats = await RecipeHistory.aggregate([
      {
        $match: { user: user._id }
      },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average rating
    const ratingStats = await RecipeHistory.aggregate([
      {
        $match: {
          user: user._id,
          rating: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRated: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRecipes: totalRecipes,
          favoriteRecipes: favoriteRecipes,
          totalFoodSaved: user.sustainabilityStats.totalFoodSaved,
          co2Saved: user.sustainabilityStats.co2Saved,
          timesCooked: user.sustainabilityStats.timesCooked,
          averageRating: ratingStats[0]?.averageRating || 0,
          totalRated: ratingStats[0]?.totalRated || 0
        },
        monthlyData: monthlyRecipes,
        cuisineDistribution: cuisineStats,
        difficultyDistribution: difficultyStats,
        recentActivity: recentActivity
      }
    });
  } catch (error) {
    console.error('Get Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get sustainability metrics only
 * @route   GET /api/dashboard/sustainability
 * @access  Private
 */
const getSustainabilityMetrics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        totalFoodSaved: user.sustainabilityStats.totalFoodSaved,
        co2Saved: user.sustainabilityStats.co2Saved,
        timesCooked: user.sustainabilityStats.timesCooked
      }
    });
  } catch (error) {
    console.error('Get Sustainability Metrics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getSustainabilityMetrics
};
