const Chat = require('../models/Chat');

exports.saveMessage = async (userId, message) => {
  const newMessage = new Chat({
    userId,
    message,
    timestamp: new Date()
  });
  return await newMessage.save();
};

exports.getRecentMessages = async (limit = 50) => {
  return await Chat.find().sort({ timestamp: -1 }).limit(limit);
};