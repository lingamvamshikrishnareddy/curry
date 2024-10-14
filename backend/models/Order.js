const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Processing', 'Delivered', 'Cancelled', 'Expired'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'RAZORPAY'],
        required: true
    },
    paymentConfirmed: {
        type: Boolean,
        default: false
    },
    paymentDeadline: {
        type: Date,
        required: function() {
            // Only required for non-COD orders
            return this.paymentMethod !== 'COD';
        },
        default: function() {
            if (this.paymentMethod === 'COD') return null;
            // Set payment deadline to 30 minutes from now
            return new Date(Date.now() + 30 * 60 * 1000);
        }
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);