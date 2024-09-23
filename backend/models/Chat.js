const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['user', 'agent', 'bot'],
    required: true
  },
  recipient: {
    type: String,
    enum: ['user', 'agent', 'bot'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: String
  }
});

module.exports = mongoose.model('Chat', chatSchema);