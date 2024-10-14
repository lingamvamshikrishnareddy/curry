const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  formatted: {
    type: String,
    required: true
  },
  components: {
    type: Map,
    of: mongoose.Schema.Types.Mixed  // Changed from String to Mixed
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  pincode: {
    type: String
  },
  isDeliverable: {
    type: Boolean,
    default: false
  }
});

locationSchema.index({ geometry: '2dsphere' });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;