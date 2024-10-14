const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/:orderId/initiate', authMiddleware, paymentController.initiatePayment);
router.post('/verify', paymentController.verifyPayment);
router.get('/:paymentId/status', authMiddleware, paymentController.getPaymentStatus);
router.post('/:orderId/timeout', authMiddleware, paymentController.handlePaymentTimeout);

module.exports = router;