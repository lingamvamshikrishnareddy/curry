const mongoose = require('mongoose');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const DeliveryService = require('../services/DeliveryService');
const { generateOTP } = require('../utils/otpUtils');
const { sendNotification } = require('../services/NotificationService');
const { validateLocation } = require('../utils/validationUtils');

const CACHE_EXPIRATION = 300; // 5 minutes

const deliveryController = {
  getDeliveryStatus: async (req, res) => {
    const { orderId } = req.params;

    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID format' });
      }

      // Check Redis cache first
      const cachedDelivery = await req.redisClient.get(`delivery:${orderId}`);
      if (cachedDelivery) {
        return res.json(JSON.parse(cachedDelivery));
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      let delivery = await Delivery.findOne({ orderId })
        .populate('orderId', 'items total status')
        .populate('deliveryAgent.id', 'name contact vehicleNumber rating')
        .lean();

      if (!delivery) {
        // Create a pending delivery status if no delivery exists
        delivery = {
          status: 'Pending',
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
          message: 'Order is being processed',
          location: null // No location available yet
        };
      } else {
        // Include delivery agent information if available
        if (delivery.deliveryAgent && delivery.deliveryAgent.id) {
          delivery.deliveryAgent = {
            name: delivery.deliveryAgent.id.name,
            contact: delivery.deliveryAgent.id.contact,
            vehicleNumber: delivery.deliveryAgent.id.vehicleNumber,
            rating: delivery.deliveryAgent.id.rating
          };
        }
        if (!delivery.location) {
          delivery.location = null; // Ensure location is null if not set
        }
      }

      // Include order status in the response
      delivery.orderStatus = order.status;

      // Cache delivery status
      await req.redisClient.setEx(`delivery:${orderId}`, CACHE_EXPIRATION, JSON.stringify(delivery));

      res.json(delivery);
    } catch (error) {
      console.error('Delivery status error:', error);
      res.status(500).json({
        message: 'Error retrieving delivery status',
        error: error.message
      });
    }
  },

  updateDeliveryStatus: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { orderId, status, location } = req.body;

      if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      if (location && !validateLocation(location)) {
        return res.status(400).json({ message: 'Invalid location format' });
      }

      const order = await Order.findById(orderId).session(session);
      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Order not found' });
      }

      let delivery = await Delivery.findOne({ orderId }).session(session);
      if (!delivery) {
        delivery = new Delivery({
          orderId,
          userId: order.user,
          status: status || 'Pending',
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
          route: []
        });
      }

      if (status) {
        delivery.status = status;
        if (status === 'Delivered') {
          order.status = 'Delivered';
          await order.save({ session });
        }
      }

      if (location) {
        delivery.location = location;
        delivery.route.push({
          coordinates: location.coordinates,
          timestamp: new Date()
        });
      }

      await delivery.save({ session });
      await session.commitTransaction();

      // Clear Redis cache
      await req.redisClient.del(`delivery:${orderId}`);

      // Broadcast update via WebSocket
      if (req.io) {
        req.io.to(`order_${orderId}`).emit('deliveryUpdate', delivery);
      }

      // Notify user about status update
      await sendNotification(order.user, {
        type: 'DELIVERY_UPDATE',
        message: `Your order status has been updated to ${status}`,
        orderId: orderId
      });

      res.json(delivery);
    } catch (error) {
      await session.abortTransaction();
      console.error('Update delivery status error:', error);
      res.status(500).json({
        message: 'Error updating delivery status',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  },

  assignDeliveryAgent: async (req, res) => {
    try {
      const { orderId, agentId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(agentId)) {
        return res.status(400).json({ message: 'Invalid order ID or agent ID' });
      }

      const delivery = await Delivery.findOne({ orderId });
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      delivery.deliveryAgent = {
        id: agentId,
        assignedAt: new Date()
      };
      delivery.status = 'Assigned';

      await delivery.save();

      // Clear Redis cache
      await req.redisClient.del(`delivery:${orderId}`);

      // Notify delivery agent
      await sendNotification(agentId, {
        type: 'NEW_DELIVERY_ASSIGNMENT',
        message: `You have been assigned a new delivery for order ${orderId}`,
        orderId: orderId
      });

      res.json(delivery);
    } catch (error) {
      console.error('Assign delivery agent error:', error);
      res.status(500).json({
        message: 'Error assigning delivery agent',
        error: error.message
      });
    }
  },

  generateDeliveryOTP: async (req, res) => {
    try {
      const { orderId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      const delivery = await Delivery.findOne({ orderId });
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      const otp = generateOTP();
      delivery.otp = otp;
      delivery.otpGeneratedAt = new Date();

      await delivery.save();

      // Clear Redis cache
      await req.redisClient.del(`delivery:${orderId}`);

      // Send OTP to user (you might want to implement this in a secure way)
      await sendNotification(delivery.userId, {
        type: 'DELIVERY_OTP',
        message: `Your delivery OTP is ${otp}. Please share this with the delivery agent to confirm your order.`,
        orderId: orderId
      });

      res.json({ message: 'OTP generated and sent to user' });
    } catch (error) {
      console.error('Generate delivery OTP error:', error);
      res.status(500).json({
        message: 'Error generating delivery OTP',
        error: error.message
      });
    }
  },

  verifyDeliveryOTP: async (req, res) => {
    try {
      const { orderId, otp } = req.body;

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      const delivery = await Delivery.findOne({ orderId });
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      if (delivery.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      const otpAge = (new Date() - delivery.otpGeneratedAt) / 1000 / 60; // in minutes
      if (otpAge > 5) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      delivery.status = 'Delivered';
      delivery.deliveredAt = new Date();
      delivery.otp = undefined;
      delivery.otpGeneratedAt = undefined;

      await delivery.save();

      // Clear Redis cache
      await req.redisClient.del(`delivery:${orderId}`);

      // Update order status
      await Order.findByIdAndUpdate(orderId, { status: 'Delivered' });

      // Notify user
      await sendNotification(delivery.userId, {
        type: 'ORDER_DELIVERED',
        message: 'Your order has been successfully delivered. Enjoy!',
        orderId: orderId
      });

      res.json({ message: 'Delivery confirmed', delivery });
    } catch (error) {
      console.error('Verify delivery OTP error:', error);
      res.status(500).json({
        message: 'Error verifying delivery OTP',
        error: error.message
      });
    }
  },

  updateDeliveryRoute: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { route } = req.body;

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      const delivery = await Delivery.findOne({ orderId });
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      delivery.route = route;
      await delivery.save();

      // Clear Redis cache
      await req.redisClient.del(`delivery:${orderId}`);

      res.json({ message: 'Delivery route updated', delivery });
    } catch (error) {
      console.error('Update delivery route error:', error);
      res.status(500).json({
        message: 'Error updating delivery route',
        error: error.message
      });
    }
  },

  getNearbyDeliveries: async (req, res) => {
    try {
      const { latitude, longitude, maxDistance } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      const nearbyDeliveries = await Delivery.find({
        status: { $in: ['Assigned', 'Out for Delivery'] },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(maxDistance) || 5000 // Default to 5km if not specified
          }
        }
      }).populate('orderId', 'items total');

      res.json(nearbyDeliveries);
    } catch (error) {
      console.error('Get nearby deliveries error:', error);
      res.status(500).json({
        message: 'Error retrieving nearby deliveries',
        error: error.message
      });
    }
  },

  getAllDeliveries: async (req, res) => {
    // Implementation for getting all deliveries
  },

  getDelivery: async (req, res) => {
    // Implementation for getting a specific delivery
  },

  cancelDelivery: async (req, res) => {
    // Implementation for canceling a delivery
  },

  updateDeliveryAttempt: async (req, res) => {
    // Implementation for updating a delivery attempt
  },

  submitDeliveryFeedback: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { rating, comment } = req.body;

      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      const delivery = await Delivery.findOne({ orderId });
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      delivery.feedback = { rating, comment };
      await delivery.save();

      // Clear Redis cache
      await req.redisClient.del(`delivery:${orderId}`);

      res.json({ message: 'Delivery feedback submitted', delivery });
    } catch (error) {
      console.error('Submit delivery feedback error:', error);
      res.status(500).json({
        message: 'Error submitting delivery feedback',
        error: error.message
      });
    }
  }
};

   

module.exports = deliveryController;