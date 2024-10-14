const validateLocation = (location) => {
    if (!location || typeof location !== 'object') return false;
    if (!location.type || location.type !== 'Point') return false;
    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) return false;
    if (typeof location.coordinates[0] !== 'number' || typeof location.coordinates[1] !== 'number') return false;
    return true;
  };
  
  module.exports = { validateLocation };