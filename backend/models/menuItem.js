const mongoose = require('mongoose');

// Check if the model already exists before defining it
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  // Add any other fields you need
}, { timestamps: true }));

module.exports = MenuItem;