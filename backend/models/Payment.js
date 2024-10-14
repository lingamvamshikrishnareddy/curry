const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['UPI', 'CARD', 'RAZORPAY', 'COD'],
        required: true,
        uppercase: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    upiId: {
        type: String,
        required: function() {
            return this.method === 'UPI';
        }
    },
    razorpayOrderId: {
        type: String,
        required: function() {
            return this.method === 'RAZORPAY';
        }
    },
    razorpayPaymentId: {
        type: String
    },
    transactionId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;