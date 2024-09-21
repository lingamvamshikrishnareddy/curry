import React from 'react';

const Map = ({ address }) => {
  // In a real application, you would use a mapping service like Google Maps
  // For this example, we'll just display a placeholder
  return (
    <div className="bg-gray-200 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Our Location</h3>
      <p className="mb-2">{address}</p>
      <div className="bg-gray-300 h-48 flex items-center justify-center">
        <p className="text-gray-600">Map placeholder</p>
      </div>
    </div>
  );
};

export default Map;