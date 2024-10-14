import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const handleApiError = (error) => {
  if (error.response) {
    console.error('API Error:', error.response.data);
    throw new Error(error.response.data.message || 'An error occurred');
  } else if (error.request) {
    console.error('No response received:', error.request);
    throw new Error('No response received from the server');
  } else {
    console.error('Error:', error.message);
    throw error;
  }
};

// Auth-related API calls
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Order-related API calls
export const placeOrder = async (orderData) => {
  try {
    const date = new Date();
    const orderId = `OD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const response = await api.post('/orders', {
      ...orderData,
      orderId,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getOrderHistory = async () => {
  try {
    const response = await api.get('/orders/history');
    // Sort orders by date in descending order
    const sortedOrders = response.data.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    return sortedOrders;
  } catch (error) {
    handleApiError(error);
  }
};


export const getOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    const orderData = response.data;
    
    // Ensure all required fields are present
    return {
      ...orderData,
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      orderDate: orderData.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    handleApiError(error);
  }
};

export const getOrderStatus = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}/status`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, { status: newStatus });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Delivery-related API calls
export const getDeliveryStatus = async (orderId) => {
  try {
    const response = await api.get(`/delivery/status/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching delivery status:', error);
    if (error.response && error.response.status === 404) {
      throw new Error('Order not found');
    }
    throw new Error('Failed to fetch delivery status. Please try again.');
  }
};



export const updateDeliveryStatus = async (orderId, status, location) => {
  try {
    const response = await api.put(`/delivery/status`, { orderId, status, location });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Payment-related API calls
export const initiatePayment = async (orderId, paymentDetails) => {
  try {
    const response = await api.post(`/payments/${orderId}/initiate`, paymentDetails);
    return response.data;
  } catch (error) {
    console.error('Payment initiation error:', error);
    throw error;
  }
};

export const handleRazorpayPayment = (payment) => {
  return new Promise((resolve, reject) => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: payment.amount,
      currency: payment.currency,
      name: 'Your Restaurant Name',
      description: 'Food Order Payment',
      order_id: payment.razorpayOrderId,
      handler: async (response) => {
        try {
          const verificationResult = await verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
          resolve(verificationResult);
        } catch (error) {
          reject(error);
        }
      },
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#F37254'
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  });
};

export const verifyPayment = async (verificationDetails) => {
  try {
    console.log('Sending verification details:', verificationDetails);
    const response = await api.post('/payments/verify', verificationDetails);
    console.log('Verification response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Payment verification error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};

export const handlePaymentTimeout = async (orderId) => {
  try {
    const response = await api.post(`/payments/${orderId}/timeout`);
    return response.data;
  } catch (error) {
    console.error('Error handling payment timeout:', error);
    throw error;
  }
};

export const confirmPayment = async (orderId, confirmed) => {
  try {
    const response = await api.post(`/payments/${orderId}/confirm`, { confirmed });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// User-related API calls
export const getUserProfile = async () => {
  try {
    const response = await api.get('/user/profile');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Menu-related API calls
export const getMenuItems = async () => {
  try {
    const response = await api.get('/menu');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Location-related API calls
export const detectUserLocation = async () => {
  try {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        maximumAge: 60000,
        enableHighAccuracy: true
      });
    });

    const { latitude, longitude } = position.coords;
    console.log('Detected coordinates:', latitude, longitude);

    // Create a new axios instance without the default auth header
    const axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await axiosInstance.get(`/location/reverse-geocode`, {
      params: { lat: latitude, lon: longitude }
    });

    console.log('Reverse geocode response:', response.data);

    if (!response.data) {
      throw new Error('No data received from reverse geocode API');
    }

    return response.data;
  } catch (error) {
    console.error('Error in detectUserLocation:', error);

    if (error.response) {
      console.error('Server response:', error.response.data);
      throw new Error(`Server error: ${error.response.data.error || 'Unknown server error'}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response received from the server');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error(`Unable to detect location: ${error.message}`);
    }
  }
};

export const handleAutoDetectLocation = async (setIsLoadingLocation, setDeliveryLocation, onLocationChange) => {
  setIsLoadingLocation(true);
  try {
    const location = await detectUserLocation();
    if (location && location.formatted) {
      setDeliveryLocation(location.formatted);
      if (onLocationChange) {
        onLocationChange(location.formatted);
      }
    } else {
      throw new Error('Invalid location data received');
    }
  } catch (error) {
    console.error('Error detecting location:', error);
    setDeliveryLocation('');
    const errorMessage = error.message.includes('Server error') 
      ? 'Unable to detect your location. Please try again later or enter your location manually.'
      : error.message || 'An error occurred while detecting your location. Please try again.';
    alert(errorMessage);
  } finally {
    setIsLoadingLocation(false);
  }
};

export const getLocationSuggestions = async (query) => {
  try {
    const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&limit=5`);
    return response.data.results.map(result => ({
      formatted: result.formatted,
      geometry: result.geometry
    }));
  } catch (error) {
    console.error('Error in getLocationSuggestions:', error);
    throw new Error('Unable to get location suggestions');
  }
};

export const checkDeliverability = async (pincode) => {
  try {
    const response = await api.get(`/location/check-deliverability?pincode=${pincode}`);
    return response.data.isDeliverable;
  } catch (error) {
    console.error("Error checking deliverability:", error);
    throw error;
  }
};

// Review-related API calls
export const submitReview = (reviewData) => api.post('/reviews', reviewData);

// Helper function to format currency in Indian Rupees
export const formatIndianRupees = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default api;