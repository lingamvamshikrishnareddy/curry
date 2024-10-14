const mongoose = require('mongoose');

// Define the Delivery Schema
const DeliverySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Out for Delivery', 'Near Location', 'Arrived', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  deliveryAgent: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryAgent'
    },
    name: String,
    contact: String,
    vehicleNumber: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String
  },
  route: [{
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    timestamp: Date
  }],
  otp: {
    code: String,
    generatedAt: { 
      type: Date, 
      default: Date.now,
      expires: 300 // OTP expires in 5 minutes
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  customerSignature: String,
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  },
  metadata: {
    type: Map,
    of: String
  },
  deliveryInstructions: String,
  deliveryAttempts: [{
    attemptedAt: Date,
    status: String,
    notes: String
  }],
  specialNotes: String
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes
DeliverySchema.index({ location: '2dsphere' });
DeliverySchema.index({ orderId: 1, status: 1 });
DeliverySchema.index({ userId: 1 });
// You can add more indexes if needed, e.g., estimatedDeliveryTime for better querying

// Middleware to update estimatedDeliveryTime before saving
DeliverySchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Out for Delivery') {
    this.estimatedDeliveryTime = new Date(Date.now() + 45 * 60 * 1000); // 45 minutes from now
  }
  next();
});

// Virtual property to calculate delivery duration in minutes
DeliverySchema.virtual('deliveryDuration').get(function() {
  if (this.actualDeliveryTime && this.createdAt) {
    return (this.actualDeliveryTime - this.createdAt) / 1000 / 60; // in minutes
  }
  return null;
});

// Virtual property to calculate delivery delay in minutes
DeliverySchema.virtual('deliveryDelay').get(function() {
  if (this.actualDeliveryTime && this.estimatedDeliveryTime) {
    return Math.max(0, (this.actualDeliveryTime - this.estimatedDeliveryTime) / 1000 / 60); // in minutes
  }
  return null;
});

// Method to add a delivery attempt
DeliverySchema.methods.addDeliveryAttempt = async function(status, notes) {
  try {
    this.deliveryAttempts.push({
      attemptedAt: new Date(),
      status,
      notes
    });
    return await this.save();
  } catch (error) {
    console.error('Error adding delivery attempt:', error);
    throw error; // Rethrow the error to handle it further up the call chain
  }
};

// Check if the model already exists before compiling it
module.exports = mongoose.models.Delivery || mongoose.model('Delivery', DeliverySchema);
