const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');

require('dotenv').config();

let razorpay;

const initializeRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error('Razorpay credentials are missing in environment variables');
        return null;
    }

    if (!razorpay) {
        try {
            razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET
            });
        } catch (error) {
            console.error('Failed to initialize Razorpay:', error.message);
            return null;
        }
    }

    return razorpay;
};

exports.initiatePayment = async (req, res) => {
    try {
        const razorpayInstance = initializeRazorpay();
        if (!razorpayInstance) {
            return res.status(500).json({ success: false, message: 'Payment service is not available' });
        }

        const { orderId } = req.params;
        const { method } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentConfirmed) {
            return res.status(400).json({ success: false, message: 'Order has already been paid' });
        }

        if (method.toUpperCase() !== 'RAZORPAY') {
            return res.status(400).json({ success: false, message: 'Unsupported payment method' });
        }

        const amount = Math.round(order.total * 100); // Convert to paisa
        const currency = 'INR';

        const razorpayOrder = await razorpayInstance.orders.create({
            amount,
            currency,
            receipt: orderId,
            payment_capture: 1
        });

        const payment = new Payment({
            orderId: order._id,
            amount: order.total,
            method: 'RAZORPAY',
            razorpayOrderId: razorpayOrder.id,
            status: 'PENDING'
        });
        await payment.save();

        order.status = 'Pending';
        await order.save();

        return res.status(200).json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount,
            currency
        });
    } catch (error) {
        console.error('Error initiating payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error initiating payment',
            error: error.message
        });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        const secret = process.env.RAZORPAY_KEY_SECRET;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
            if (!payment) {
                return res.status(404).json({ success: false, message: 'Payment not found' });
            }

            payment.status = 'COMPLETED';
            payment.razorpayPaymentId = razorpay_payment_id;
            await payment.save();

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            order.status = 'Confirmed';
            order.paymentConfirmed = true;
            await order.save();

            return res.status(200).json({
                success: true,
                message: 'Payment verified successfully'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findById(paymentId);
        
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        res.json({ success: true, status: payment.status });
    } catch (error) {
        console.error('Error getting payment status:', error);
        res.status(500).json({ success: false, message: 'Error getting payment status', error: error.message });
    }
};

exports.handlePaymentTimeout = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'Pending' || order.paymentConfirmed) {
            return res.status(400).json({ success: false, message: 'Order is not in a valid state for timeout handling' });
        }

        const payment = await Payment.findOne({ orderId: order._id, status: 'PENDING' });
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Pending payment not found for this order' });
        }

        // Update payment status
        payment.status = 'TIMEOUT';
        await payment.save();

        // Update order status
        order.status = 'Expired';
        await order.save();

        return res.status(200).json({
            success: true,
            message: 'Payment timeout handled successfully',
            orderStatus: order.status,
            paymentStatus: payment.status
        });
    } catch (error) {
        console.error('Error handling payment timeout:', error);
        return res.status(500).json({
            success: false,
            message: 'Error handling payment timeout',
            error: error.message
        });
    }
};