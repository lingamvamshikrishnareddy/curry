const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

// Update delivery status
router.put('/status', authMiddleware, deliveryController.updateDeliveryStatus);

// Get delivery status
router.get('/status/:orderId', authMiddleware, deliveryController.getDeliveryStatus);

// Assign delivery agent
router.post('/assign', adminAuthMiddleware, deliveryController.assignDeliveryAgent);

// Generate OTP for delivery confirmation
router.post('/generate-otp/:orderId', authMiddleware, deliveryController.generateDeliveryOTP);

// Verify OTP for delivery confirmation
router.post('/verify-otp', authMiddleware, deliveryController.verifyDeliveryOTP);

// Update delivery route
router.put('/update-route/:orderId', authMiddleware, deliveryController.updateDeliveryRoute);

// Get nearby deliveries (for delivery agents)
router.get('/nearby', authMiddleware, deliveryController.getNearbyDeliveries);

// Submit delivery feedback
router.post('/feedback/:orderId', authMiddleware, deliveryController.submitDeliveryFeedback);

// New routes
// Get all deliveries (with pagination)
router.get('/', adminAuthMiddleware, deliveryController.getAllDeliveries);

// Get a specific delivery
router.get('/:deliveryId', authMiddleware, deliveryController.getDelivery);

// Cancel a delivery
router.delete('/:deliveryId', adminAuthMiddleware, deliveryController.cancelDelivery);

// Update delivery attempt
router.put('/attempt/:deliveryId', authMiddleware, deliveryController.updateDeliveryAttempt);

module.exports = router;