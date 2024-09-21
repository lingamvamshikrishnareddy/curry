exports.formatMessage = (message) => {
    return {
      id: message._id,
      userId: message.userId,
      text: message.message,
      timestamp: message.timestamp.toISOString()
    };
  };