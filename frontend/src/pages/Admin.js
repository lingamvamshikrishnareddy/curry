import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      fetchAdminData();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    // In a real application, you would validate credentials against a backend
    if (username === 'admin' && password === 'password') {
      setIsLoggedIn(true);
      localStorage.setItem('adminToken', 'dummy-token');
      fetchAdminData();
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const fetchAdminData = async () => {
    // Fetch orders and menu items
    // This is a placeholder. Replace with actual API calls.
    setOrders([
      { id: 1, customer: 'John Doe', total: 50 },
      { id: 2, customer: 'Jane Smith', total: 75 },
    ]);
    setMenuItems([
      { id: 1, name: 'Burger', price: 10 },
      { id: 2, name: 'Pizza', price: 15 },
    ]);
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Admin Login</h1>
          <form onSubmit={handleLogin} className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md"
            />
            <motion.button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
          <motion.button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Orders</h2>
            <ul className="bg-white rounded-lg shadow">
              {orders.map(order => (
                <li key={order.id} className="p-4 border-b last:border-b-0">
                  <span className="font-semibold">Order #{order.id}</span>
                  <span className="ml-4">{order.customer}</span>
                  <span className="float-right">${order.total}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Menu Items</h2>
            <ul className="bg-white rounded-lg shadow">
              {menuItems.map(item => (
                <li key={item.id} className="p-4 border-b last:border-b-0">
                  <span className="font-semibold">{item.name}</span>
                  <span className="float-right">${item.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Admin;