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

// Update delivery route
router.put('/update-route/:orderId', authMiddleware, deliveryController.updateDeliveryRoute);

// Submit delivery feedback
router.post('/feedback/:orderId', authMiddleware, deliveryController.submitDeliveryFeedback);

// New routes
// Get all deliveries (with pagination)
router.get('/', adminAuthMiddleware, deliveryController.getAllDeliveries);

// Get a specific delivery
router.get('/:deliveryId', authMiddleware, deliveryController.getDelivery);

// Cancel a delivery
router.delete('/:deliveryId', adminAuthMiddleware, deliveryController.cancelDelivery);

module.exports = router;
