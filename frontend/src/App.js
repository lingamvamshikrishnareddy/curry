import React, { useState, useEffect, useCallback } from 'react';
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

import Profile from './pages/Profile';
import Contact from './pages/Contact';
import TrackOrderPage from './pages/TrackOrderPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
import OrderManagement from './pages/OrderManagement';

import { initializeSocket, socket } from './services/websocket';
import { useAuth } from './hooks/useAuth';

const App = () => {
  const [cartItems, setCartItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { isAuthenticated, isLoading, user, logout: handleLogout, checkAuthStatus } = useAuth();

  useEffect(() => {
    gsap.to('body', { opacity: 1, duration: 0.5, ease: 'power2.out' });
    const cleanup = initializeSocket();
    checkAuthStatus();

    return () => {
      cleanup();
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [checkAuthStatus]);

  const addToCart = useCallback((item) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: Math.min(i.quantity + 1, 6) } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId, newQuantity) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.min(Math.max(newQuantity, 1), 6) } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const addToOrderHistory = useCallback((order) => {
    setOrderHistory((prevHistory) => [...prevHistory, order]);
  }, []);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const AnimatedRoute = ({ component: Component, props = {} }) => {
    if (!Component) {
      console.error('Component is undefined in AnimatedRoute');
      return null;
    }

    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
        transition={pageTransition}
      >
        <Component {...props} />
      </motion.div>
    );
  };

  const ProtectedRoute = ({ component: Component, props = {} }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    if (!Component) {
      console.error('Component is undefined in ProtectedRoute');
      return null;
    }
    return <AnimatedRoute component={Component} props={props} />;
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
          isAuthenticated={isAuthenticated}
        />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<AnimatedRoute component={Home} />} />
              <Route path="/about" element={<AnimatedRoute component={About} />} />
              <Route path="/contact" element={<AnimatedRoute component={Contact} />} />
              <Route path="/menu" element={
                <AnimatedRoute
                  component={MenuPage}
                  props={{
                    addToCart,
                    removeFromCart,
                    updateQuantity,
                    cartItems,
                    searchTerm
                  }}
                />
              } />
              <Route path="/cart" element={
                <AnimatedRoute
                  component={Cart}
                  props={{
                    items: cartItems,
                    removeFromCart,
                    updateQuantity,
                    clearCart
                  }}
                />
              } />

              {/* Authentication Routes */}
              <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" replace /> : <AnimatedRoute component={LoginPage} />}
              />
              <Route
                path="/register"
                element={isAuthenticated ? <Navigate to="/" replace /> : <AnimatedRoute component={RegisterPage} />}
              />

              {/* Protected Routes */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute
                    component={CheckoutPage}
                    props={{
                      cartItems,
                      clearCart,
                      user,
                      addToOrderHistory
                    }}
                  />
                }
              />
              <Route
                path="/payment-confirmation"
                element={<ProtectedRoute component={PaymentConfirmationPage} />}
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute
                    component={OrderManagement}
                    props={{
                      addToOrderHistory,
                      orderHistory
                    }}
                  />
                }
              />
              <Route
                path="/track"
                element={<ProtectedRoute component={TrackOrderPage} />}
              />
              <Route
                path="/track/:orderId"
                element={<ProtectedRoute component={TrackOrderPage} />}
              />
              
              <Route
                path="/profile"
                element={<ProtectedRoute component={Profile} props={{ user }} />}
              />

              {/* Redirects */}
              <Route path="/order" element={<Navigate to="/orders" replace />} />
              <Route path="/order-confirmation" element={<Navigate to="/orders" replace />} />
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
