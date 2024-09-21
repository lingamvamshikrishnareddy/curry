import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const TrackOrderPage = ({ getOrderStatus }) => {
  const [orderId, setOrderId] = useState('');
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderIdParam = params.get('orderId');
    if (orderIdParam) {
      setOrderId(orderIdParam);
      handleTrackOrder(orderIdParam);
    }
  }, [location]);

  const handleTrackOrder = async (id = orderId) => {
    setLoading(true);
    setError(null);
    try {
      const status = await getOrderStatus(id);
      if (status === 'Not Found') {
        setError('Order not found. Please check the order ID and try again.');
      } else {
        setOrderStatus(status);
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
      setError('Failed to fetch order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lightgray text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-5xl font-bold mb-12 text-center text-green-400">
          Track Your Order
        </h1>
        <div className="bg-gray-900 p-8 rounded-lg shadow-lg mb-8">
          <form onSubmit={(e) => { e.preventDefault(); handleTrackOrder(); }} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter your order ID"
                className="w-full px-6 py-4 bg-gray-800 text-white border-2 border-gray-700 rounded-full focus:outline-none focus:border-green-500 text-lg"
                required
              />
              <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
            </div>
            <motion.button
              type="submit"
              className="w-full bg-green-500 text-white font-bold py-4 px-6 rounded-full hover:bg-green-600 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </motion.button>
          </form>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900 text-white p-4 rounded-lg mb-8"
          >
            {error}
          </motion.div>
        )}

        {orderStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900 p-8 rounded-lg shadow-lg"
          >
            <h2 className="text-3xl font-semibold mb-6 text-green-400">Order Status</h2>
            <p className="text-lg text-white">{orderStatus}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TrackOrderPage;