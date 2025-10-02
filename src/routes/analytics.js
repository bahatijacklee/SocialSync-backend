const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/overview', analyticsController.getOverview);
router.get('/sentiment', analyticsController.getSentiment);
router.get('/performance', analyticsController.getPerformance);

module.exports = router; 