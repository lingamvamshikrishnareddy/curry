const axios = require('axios');
const Location = require('../models/location');

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;

const locationController = {
  reverseGeocode: async (req, res) => {
    const { lat, lon } = req.query;
    
    if (!OPENCAGE_API_KEY) {
      console.error('OPENCAGE_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
      console.log(`Requesting reverse geocode for coordinates: ${lat}, ${lon}`);
      const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${OPENCAGE_API_KEY}`);
      
      console.log('OpenCage API response:', JSON.stringify(response.data, null, 2));
      
      const result = response.data.results[0];
      
      if (result) {
        const location = new Location({
          formatted: result.formatted,
          components: result.components,
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(lon), parseFloat(lat)]
          },
          pincode: result.components.postcode
        });
        
        await location.save();
        res.json(location);
      } else {
        res.status(404).json({ error: 'Location not found' });
      }
    } catch (error) {
      console.error('Error fetching reverse geocode data:', error);
      if (error.response) {
        console.error('OpenCage API response:', error.response.data);
      }
      res.status(500).json({ error: 'An error occurred while fetching location data', details: error.message });
    }
  },
  
  
  getSuggestions: async (req, res) => {
    const { query } = req.query;
    
    if (!OPENCAGE_API_KEY) {
      console.error('OPENCAGE_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
      const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&limit=5`);
      
      const suggestions = response.data.results.map(result => ({
        formatted: result.formatted,
        components: result.components,
        geometry: result.geometry
      }));

      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      res.status(500).json({ error: 'An error occurred while fetching location suggestions', details: error.message });
    }
  },
  // Check deliverability based on pincode
  checkDeliverability: async (req, res) => {
    const { pincode } = req.query;
    try {
      const location = await Location.findOne({ 'components.postcode': pincode });
      if (location) {
        res.json({ isDeliverable: location.isDeliverable });
      } else {
        res.json({ isDeliverable: false }); // Assume not deliverable if location not found
      }
    } catch (error) {
      console.error('Error checking deliverability:', error);
      res.status(500).json({ error: 'An error occurred while checking deliverability', details: error.message });
    }
  }
};

module.exports = locationController;
