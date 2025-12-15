const express = require('express');
const {
  getDashboard,
  getSustainabilityMetrics
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getDashboard);
router.get('/sustainability', getSustainabilityMetrics);

module.exports = router;
