const Chat = require('../models/Chat');
const { formatMessage } = require('../utils/messageFormatter');

exports.sendMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;
    const newMessage = new Chat({
      userId,
      message,
      timestamp: new Date()
    });
    await newMessage.save();
    const formattedMessage = formatMessage(newMessage);
    req.io.emit('chat message', formattedMessage);
    res.status(201).json(formattedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Chat.find().sort({ timestamp: -1 }).limit(50);
    const formattedMessages = messages.map(formatMessage);
    res.status(200).json(formattedMessages);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving messages', error: error.message });
  }
};