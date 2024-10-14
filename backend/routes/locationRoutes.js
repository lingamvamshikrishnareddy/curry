const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware');

// Remove authMiddleware for reverse-geocode
router.get('/reverse-geocode', locationController.reverseGeocode);

// Keep authMiddleware for other routes that require authentication
router.get('/suggestions', authMiddleware, locationController.getSuggestions);
router.get('/check-deliverability', authMiddleware, locationController.checkDeliverability);

module.exports = router;