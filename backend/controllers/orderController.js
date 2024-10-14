const Order = require('../models/Order');
const QRCode = require('qrcode');
const { validationResult } = require('express-validator');

const orderController = {
    // Create new order
    createOrder:async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
    
            const { items, total, paymentMethod, ...userData } = req.body;
    
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'Invalid items in order' });
            }
    
            if (typeof total !== 'number' || total <= 0) {
                return res.status(400).json({ message: 'Invalid total amount' });
            }
    
            const orderData = {
                items,
                total,
                user: req.user.id,
                paymentMethod: paymentMethod.toUpperCase(),
                status: 'Pending',
                ...userData
            };
    
            // Only set paymentDeadline for non-COD orders
            if (paymentMethod.toUpperCase() !== 'COD') {
                orderData.paymentDeadline = new Date(Date.now() + 30 * 60 * 1000);
            }
    
            const newOrder = new Order(orderData);
            const order = await newOrder.save();
    
            let responseData = {
                id: order._id,
                status: order.status,
                paymentMethod: order.paymentMethod
            };
    
            if (paymentMethod.toUpperCase() !== 'COD') {
                const qrCodeData = JSON.stringify({
                    orderId: order._id,
                    amount: total,
                    upiId: process.env.UPI_ID || 'vamshikrish502@okicici'
                });
                const qrCode = await QRCode.toDataURL(qrCodeData);
                responseData.qrCode = qrCode;
                responseData.paymentDeadline = order.paymentDeadline;
            }
    
            res.status(201).json(responseData);
        } catch (err) {
            console.error('Error in createOrder:', err);
            if (err.name === 'ValidationError') {
                return res.status(400).json({ message: err.message });
            }
            res.status(500).json({ message: 'Server error' });
        }
    },
    
    // Get order history
    getOrderHistory: async (req, res) => {
        try {
            const orders = await Order.find({ user: req.user.id })
                .sort({ createdAt: -1 })
                .populate('items.menuItem', 'name price');
            
            res.json(orders);
        } catch (err) {
            console.error('Error in getOrderHistory:', err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get order by ID
    getOrderById: async (req, res) => {
        try {
            const order = await Order.findOne({
                _id: req.params.id,
                user: req.user.id
            }).populate('items.menuItem', 'name price');

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            res.json(order);
        } catch (err) {
            console.error('Error in getOrderById:', err);
            res.status(500).json({ message: 'Server error' });
        }
    },
// Update order status
updateOrderStatus: async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (err) {
        console.error('Error in updateOrderStatus:', err);
        res.status(500).json({ message: 'Server error' });
    }
},

// Confirm payment
confirmPayment: async (req, res) => {
    try {
        const { confirmed } = req.body;
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status === 'Confirmed') {
            return res.json({ status: 'success', message: 'Payment already confirmed' });
        }

        if (new Date() > order.paymentDeadline) {
            order.status = 'Expired';
            await order.save();
            return res.json({ status: 'expired', message: 'Payment deadline exceeded' });
        }

        if (confirmed) {
            order.status = 'Confirmed';
            order.paymentConfirmed = true;
            await order.save();
            return res.json({ status: 'success', message: 'Payment confirmed successfully' });
        } else {
            order.status = 'Cancelled';
            await order.save();
            return res.json({ status: 'cancelled', message: 'Order cancelled' });
        }
    } catch (err) {
        console.error('Error in confirmPayment:', err);
        res.status(500).json({ message: 'Server error' });
    }
},

// Verify payment status
verifyPaymentStatus: async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.paymentMethod === 'COD') {
            return res.json({ status: 'success', message: 'COD order, no payment verification needed' });
        }

        if (order.status === 'Confirmed') {
            return res.json({ status: 'success', message: 'Payment already confirmed' });
        }

        if (new Date() > order.paymentDeadline) {
            order.status = 'Expired';
            await order.save();
            return res.json({ status: 'expired', message: 'Payment deadline exceeded' });
        }

        res.json({ status: 'pending', message: 'Payment not confirmed yet' });
    } catch (err) {
        console.error('Error in verifyPaymentStatus:', err);
        res.status(500).json({ message: 'Server error' });
    }
},

// Get order status
getOrderStatus: async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.id
        }).select('status paymentMethod paymentConfirmed');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (err) {
        console.error('Error in getOrderStatus:', err);
        res.status(500).json({ message: 'Server error' });
    }
},

// Cancel order
cancelOrder: async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (['Delivered', 'Cancelled'].includes(order.status)) {
            return res.status(400).json({ message: 'Cannot cancel this order' });
        }

        order.status = 'Cancelled';
        await order.save();

        res.json({ status: 'success', message: 'Order cancelled successfully' });
    } catch (err) {
        console.error('Error in cancelOrder:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
};

module.exports = orderController;