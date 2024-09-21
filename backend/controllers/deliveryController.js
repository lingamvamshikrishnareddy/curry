const Delivery = require('../models/Delivery');
const { generateOTP } = require('../services/otpService');
const { sendNotification } = require('../services/notificationService');

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const delivery = await Delivery.findOne({ orderId });
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    delivery.status = status;
    
    if (status === 'Out for Delivery') {
      delivery.otp = generateOTP();
      await sendNotification(delivery.userId, 'Your order is out for delivery!');
    }

    await delivery.save();
    req.io.emit('delivery update', { orderId, status });
    res.status(200).json(delivery);
  } catch (error) {
    res.status(500).json({ message: 'Error updating delivery status', error: error.message });
  }
};

exports.getDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const delivery = await Delivery.findOne({ orderId });
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.status(200).json(delivery);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving delivery status', error: error.message });
  }
};