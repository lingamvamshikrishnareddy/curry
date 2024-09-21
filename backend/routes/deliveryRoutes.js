const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middleware/authMiddleware');

router.put('/status', authMiddleware, deliveryController.updateDeliveryStatus);
router.get('/status/:orderId', authMiddleware, deliveryController.getDeliveryStatus);

module.exports = router;