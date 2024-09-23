import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Menu related API calls
export const getMenuItems = async (searchTerm = '') => {
  try {
    const response = await api.get(`/menu`, {
      params: { search: searchTerm }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

export const submitReview = async (reviewData) => {
  try {
    const response = await api.post(`/reviews`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

// Order related API calls
export const placeOrder = async (orderDetails) => {
  try {
    const response = await api.post('/orders', orderDetails);
    return response.data;
  } catch (error) {
    throw new Error('Failed to place order');
  }
};

export const getOrderStatus = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}/status`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch order status');
  }
};

export const getOrderHistory = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/orders`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch order history');
  }
};

// User related API calls
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch user profile');
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw new Error('Failed to update user profile');
  }
};

// Cart related API calls
export const getCart = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/cart`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch cart');
  }
};

export const updateCart = async (userId, cartItems) => {
  try {
    const response = await api.put(`/users/${userId}/cart`, { items: cartItems });
    return response.data;
  } catch (error) {
    throw new Error('Failed to update cart');
  }
};

// Review related API calls
export const getReviews = async (menuItemId) => {
  try {
    const response = await api.get(`/menu/${menuItemId}/reviews`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch reviews');
  }
};

// Chat support API call
export const sendChatMessage = async (message) => {
  try {
    const response = await api.post('/chat', { message });
    return response.data;
  } catch (error) {
    throw new Error('Failed to send chat message');
  }
};

export default api;