const mongoose = require('mongoose');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');

const deliveryController = {
  getDeliveryStatus: async (req, res) => {
    const { orderId } = req.params;

    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID format' });
      }

      // Fetch delivery status directly from the database
      const delivery = await Delivery.findOne({ orderId });
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      return res.json(delivery);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  createDelivery: async (req, res) => {
    const { orderId, address, status } = req.body;

    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID format' });
      }

      const newDelivery = new Delivery({
        orderId,
        address,
        status,
      });

      await newDelivery.save();
      return res.status(201).json(newDelivery);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  updateDeliveryStatus: async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID format' });
      }

      const delivery = await Delivery.findOneAndUpdate(
        { orderId },
        { status },
        { new: true }
      );

      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      return res.json(delivery);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

module.exports = deliveryController;
