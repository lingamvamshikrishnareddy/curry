import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu as MenuIcon, MessageSquare, MapPin } from 'lucide-react';


const Header = ({ cartItemsCount,  user, onLogout, toggleChat, onLocationChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('');

  const handleLocationChange = (e) => {
    setDeliveryLocation(e.target.value);
    onLocationChange(e.target.value);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-green-800 hover:text-green-600 transition-colors duration-300">
          Curry
        </Link>

        {/* Delivery Location */}
        <div className="flex items-center max-w-xs mx-4">
          <MapPin className="h-5 w-5 text-green-600 mr-2" />
          <input
            type="text"
            placeholder="Enter delivery location"
            value={deliveryLocation}
            onChange={handleLocationChange}
            className="w-full pl-3 pr-10 py-2 border-gray-300 focus:ring-green-500 focus:border-green-500 block rounded-full shadow-sm"
          />
        </div>

       

        {/* Navigation Links */}
        <nav className={`${isMenuOpen ? "block" : "hidden"} md:flex md:items-center md:space-x-6`}>
          <Link to="/" className="nav-item">Home</Link>
          <Link to="/menu" className="nav-item">Menu</Link>
          <Link to="/order" className="nav-item">Order</Link>
          <Link to="/track" className="nav-item">Track</Link>

          {/* User Profile and Cart */}
          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="nav-item">Profile</Link>
              <button onClick={onLogout} className="btn-primary">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary">Login</Link>
          )}

          {/* Cart Icon */}
          <Link to="/cart" className="relative inline-block">
            <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-green-600 transition-colors duration-300" />
            {cartItemsCount > 0 && (
              <span className="cart-badge">
                {cartItemsCount}
              </span>
            )}
          </Link>

          {/* Chat Support */}
          <button onClick={toggleChat} className="btn-primary flex items-center">
            <MessageSquare className="h-5 w-5 mr-1" /> Chat
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden btn-primary"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <MenuIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;