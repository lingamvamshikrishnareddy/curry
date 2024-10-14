const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Protect all routes

// Create new order
router.post('/', [
    body('items').isArray().notEmpty(),
    body('total').isNumeric(),
    body('paymentMethod').isIn(['COD', 'RAZORPAY', 'UPI']),
    body('name').notEmpty(),
    body('phone').isMobilePhone(),
    body('address').notEmpty()
], orderController.createOrder);

// Get order history
router.get('/history', orderController.getOrderHistory);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Update order status
router.put('/:id/status', orderController.updateOrderStatus);

// Confirm payment
router.post('/:id/confirm-payment', orderController.confirmPayment);

// Verify payment status
router.get('/:id/verify-payment', orderController.verifyPaymentStatus);

// Get order status
router.get('/:id/status', orderController.getOrderStatus);

// Cancel order
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;