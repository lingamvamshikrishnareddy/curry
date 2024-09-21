const User = require('../models/User');

exports.sendNotification = async (userId, message) => {
  const user = await User.findById(userId);
  if (user && user.deviceToken) {
    // Here you would typically integrate with a push notification service
    // For this example, we'll just console.log the message
    console.log(`Sending notification to user ${userId}: ${message}`);
  }
};