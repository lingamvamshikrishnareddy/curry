import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Cart from './components/Cart';
import ChatSupport from './components/ChatSupport';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import OrderPage from './pages/OrderPage';
import TrackOrderPage from './pages/TrackOrderPage';
import CheckoutPage from './pages/CheckoutPage';

import { initializeSocket, socket } from './services/websocket';
import { getUserProfile } from './services/api';

const App = () => {
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    gsap.to('body', { opacity: 1, duration: 0.5, ease: 'power2.out' });
    const cleanup = initializeSocket();
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    }

    return () => {
      cleanup();
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
    }
  };

  const addToCart = (item) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, 6) } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.min(Math.max(newQuantity, 1), 6) } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const addToOrderHistory = (order) => {
    setOrderHistory((prevHistory) => [...prevHistory, order]);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <Router>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="app bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen flex flex-col"
      >
        <Header
          user={user}
          cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          onLogout={handleLogout}
          onSearch={handleSearch}
          toggleChat={toggleChat}
        />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes>
              <Route
                path="/"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    <Home />
                  </motion.div>
                }
              />
              <Route
                path="/about"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    <About />
                  </motion.div>
                }
              />
              <Route
                path="/menu"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    <MenuPage
                      addToCart={addToCart}
                      removeFromCart={removeFromCart}
                      updateQuantity={updateQuantity}
                      cartItems={cartItems}
                      searchTerm={searchTerm}
                    />
                  </motion.div>
                }
              />
              <Route
                path="/cart"
                element={
                  <Cart items={cartItems} removeFromCart={removeFromCart} updateQuantity={updateQuantity} clearCart={clearCart} />
                }
              />
              <Route
                path="/login"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    <LoginPage onLogin={handleLogin} />
                  </motion.div>
                }
              />
              <Route
                path="/register"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    <RegisterPage onRegister={handleLogin} />
                  </motion.div>
                }
              />
              <Route
                path="/admin"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    <Admin />
                  </motion.div>
                }
              />
              <Route
                path="/profile"
                element={
                  user ? (
                    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                      <Profile user={user} />
                    </motion.div>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/contact"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    <Contact />
                  </motion.div>
                }
              />
              <Route
                path="/order"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    <OrderPage
                      cartItems={cartItems}
                      clearCart={clearCart}
                      addToOrderHistory={addToOrderHistory}
                      orderHistory={orderHistory}
                    />
                  </motion.div>
                }
              />
              <Route
                path="/track"
                element={
                  <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                    <TrackOrderPage
                      orderHistory={orderHistory}
                      getOrderStatus={(orderId) => {
                        const order = orderHistory.find((o) => o.id === orderId);
                        return order ? order.status : 'Not Found';
                      }}
                    />
                  </motion.div>
                }
              />
              <Route
                path="/checkout"
                element={
                  user ? (
                    <motion.div variants={pageVariants} initial="initial" animate="in" exit="out" transition={pageTransition}>
                      <CheckoutPage cartItems={cartItems} clearCart={clearCart} />
                    </motion.div>
                  ) : (
                    <Navigate to="/login" state={{ from: '/checkout' }} replace />
                  )
                }
              />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer />
        <ChatSupport isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </motion.div>
    </Router>
  );
};

export default App;