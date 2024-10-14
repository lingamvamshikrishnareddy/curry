import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Truck, AlertTriangle, CheckCircle, Package, Clock, RefreshCw, Search, DollarSign, Calendar } from 'lucide-react';
import { getOrderStatus, getDeliveryStatus, getOrderDetails } from '../services/api';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Alert = ({ children, variant = 'default', onRetry }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800 border-blue-500',
    destructive: 'bg-red-100 text-red-800 border-red-500'
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${variants[variant]} flex items-center justify-between animate-fade-in`}>
      <div className="flex items-center">
        {variant === 'destructive' && <AlertTriangle className="h-4 w-4 mr-2" />}
        <span>{children}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-4 flex items-center text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-1" /> Retry
        </button>
      )}
    </div>
  );
};

const OrderStage = ({ icon: Icon, title, description, isCompleted, isActive }) => (
  <div className={`flex items-center mb-4 ${isCompleted ? 'text-green-500' : isActive ? 'text-blue-500' : 'text-gray-400'} animate-fade-in`}>
    <div className={`rounded-full p-2 mr-4 ${isCompleted ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
      <Icon size={24} />
    </div>
    <div>
      <h4 className="font-semibold">{title}</h4>
      <p className="text-sm">{description}</p>
    </div>
  </div>
);

const ProgressBar = ({ value }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.5 }}
      className="bg-blue-500 h-2.5 rounded-full"
    />
  </div>
);

const TrackOrderPage = () => {
  const [orderStatus, setOrderStatus] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [orderIdInput, setOrderIdInput] = useState('');
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const { orderId } = useParams();
  const navigate = useNavigate();

  const fetchOrderAndDeliveryStatus = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const [orderData, deliveryData, detailsData] = await Promise.all([
        getOrderStatus(id),
        getDeliveryStatus(id),
        getOrderDetails(id)
      ]);

      setOrderStatus(orderData);
      setDeliveryStatus(deliveryData);
      setOrderDetails(detailsData);
      updateProgressBar(orderData.status);

      if (deliveryData && deliveryData.location && deliveryData.location.coordinates) {
        setMapCenter(deliveryData.location.coordinates);
      } else {
        console.warn('Delivery location data is missing');
        setMapCenter([0, 0]);
      }
    } catch (err) {
      console.error('Error fetching order and delivery status:', err);
      setError(err.message || 'Failed to load order status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrderAndDeliveryStatus(orderId);
    }
  }, [orderId, fetchOrderAndDeliveryStatus]);

  useEffect(() => {
    let intervalId;
    if (autoRefresh && orderId && !error && orderStatus?.status !== 'Delivered') {
      intervalId = setInterval(() => {
        fetchOrderAndDeliveryStatus(orderId);
      }, 30000);
    }
    return () => clearInterval(intervalId);
  }, [orderId, autoRefresh, error, orderStatus?.status, fetchOrderAndDeliveryStatus]);

  const updateProgressBar = (status) => {
    const statusMap = {
      'Pending': 0,
      'Confirmed': 25,
      'Processing': 50,
      'Out for Delivery': 75,
      'Delivered': 100
    };
    setProgress(statusMap[status] || 0);
  };

  const handleRetry = () => {
    if (orderId) {
      fetchOrderAndDeliveryStatus(orderId);
    }
  };

  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (orderIdInput) {
      navigate(`/track/${orderIdInput}`);
    }
  };

  const renderOrderForm = () => (
    <form onSubmit={handleTrackOrder} className="mb-8">
      <div className="flex items-center">
        <input
          type="text"
          value={orderIdInput}
          onChange={(e) => setOrderIdInput(e.target.value)}
          placeholder="Enter Order ID"
          className="flex-grow mr-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="btn-primary flex items-center"
        >
          <Search className="inline-block mr-2" />
          Track Order
        </button>
      </div>
    </form>
  );

  const renderLoadingState = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
    </div>
  );

  const renderMap = () => {
    if (!deliveryStatus || !deliveryStatus.location || !deliveryStatus.location.coordinates) {
      return <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">Delivery location is not available yet. Please check back later.</div>;
    }

    return (
      <div>
        <MapContainer center={mapCenter} zoom={13} style={{ height: '400px', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={mapCenter}>
            <Popup>
              Delivery Location<br />
              {deliveryStatus.location.address || 'Address not available'}
            </Popup>
          </Marker>
        </MapContainer>
        <p className="mt-2"><strong>Delivery Address:</strong> {deliveryStatus.location.address || 'Address not available'}</p>
      </div>
    );
  };

  const renderOrderDetails = () => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ProgressBar value={progress} />

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Delivery Progress</h2>
            <OrderStage
              icon={Package}
              title="Order Confirmed"
              description="Your order has been confirmed"
              isCompleted={progress >= 25}
            />
            <OrderStage
              icon={Clock}
              title="Processing"
              description="Your order is being processed"
              isCompleted={progress >= 50}
              isActive={progress >= 25 && progress < 50}
            />
            <OrderStage
              icon={Truck}
              title="Out for Delivery"
              description="Your order is out for delivery"
              isCompleted={progress >= 75}
              isActive={progress >= 50 && progress < 75}
            />
            <OrderStage
              icon={CheckCircle}
              title="Delivered"
              description="Your order has been delivered"
              isCompleted={progress === 100}
              isActive={progress >= 75 && progress < 100}
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
            {deliveryStatus && deliveryStatus.status === 'Pending' ? (
              <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4">
                Your order is being processed. Delivery details will be available soon.
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <MapPin className="inline-block mr-2" />
                  <span className="font-semibold">Delivery Address:</span>
                  <p className="ml-6">{orderDetails?.address || 'Not available'}</p>
                </div>

                <div className="mb-4">
                  <Phone className="inline-block mr-2" />
                  <span className="font-semibold">Contact:</span>
                  <p className="ml-6">{orderDetails?.phone || 'Not available'}</p>
                </div>

                <div className="mb-4">
                  <Package className="inline-block mr-2" />
                  <span className="font-semibold">Order ID:</span>
                  <p className="ml-6">{orderId || 'Not available'}</p>
                </div>

                {deliveryStatus?.deliveryAgent && (
                  <div className="mb-4">
                    <Truck className="inline-block mr-2" />
                    <span className="font-semibold">Delivery Agent:</span>
                    <p className="ml-6">{deliveryStatus.deliveryAgent.name || 'Not assigned'}</p>
                    <p className="ml-6">Contact: {deliveryStatus.deliveryAgent.contact || 'Not available'}</p>
                    {deliveryStatus.deliveryAgent.contact && (
                      <button
                        className="mt-2 btn-primary"
                        onClick={() => window.location.href = `tel:${deliveryStatus.deliveryAgent.contact}`}
                      >
                        <Phone className="inline-block mr-2" />
                        Call Delivery Agent
                      </button>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <Clock className="inline-block mr-2" />
                  <span className="font-semibold">Estimated Delivery Time:</span>
                  <p className="ml-6">{deliveryStatus?.estimatedDeliveryTime || 'Not available'}</p>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Order Items:</h3>
                  {orderDetails?.items && orderDetails.items.length > 0 ? (
                    <ul className="list-disc list-inside ml-6">
                      {orderDetails.items.map((item, index) => (
                        <li key={index}>
                          {item.name} x {item.quantity} - ${item.price?.toFixed(2) || 'N/A'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ml-6">No items available</p>
                  )}
                </div>

                <div className="mb-4">
                  <DollarSign className="inline-block mr-2" />
                  <span className="font-semibold">Total Amount:</span>
                  <p className="ml-6">${orderDetails?.totalAmount?.toFixed(2) || 'Not available'}</p>
                </div>

                <div className="mb-4">
                  <Calendar className="inline-block mr-2" />
                  <span className="font-semibold">Order Date:</span>
                  <p className="ml-6">
                    {orderDetails?.orderDate
                      ? format(new Date(orderDetails.orderDate), 'MMMM dd, yyyy HH:mm:ss')
                      : 'Not available'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Delivery Location</h2>
          {renderMap()}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg rounded-lg overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Order Tracking</h1>
            <button
              onClick={() => navigate('/orders')}
              className="text-blue-500 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2 py-1"
            >
              Back to Orders
            </button>
          </div>

          {!orderId && renderOrderForm()}

          {error && (
            <Alert variant="destructive" onRetry={handleRetry}>
              {error}
            </Alert>
          )}

          {loading ? renderLoadingState() : (
            orderStatus && deliveryStatus && orderDetails ? renderOrderDetails() : (
              <p className="text-center text-gray-500">Enter an order ID to track your order.</p>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TrackOrderPage;