import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu as MenuIcon, MessageSquare, MapPin } from 'lucide-react';
import { detectUserLocation, getLocationSuggestions, handleAutoDetectLocation } from '../services/api';

// Custom Button component
const Button = ({ onClick, variant = 'default', className = '', children, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50';
  const variantClasses = {
    default: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-300',
    primary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Custom Input component
const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
};

const Header = ({ cartItemsCount = 0, user = null, onLogout = () => {}, toggleChat = () => {}, onLocationChange = null }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    handleInitialLocationDetection();
  }, []);

  const handleInitialLocationDetection = async () => {
    await handleAutoDetectLocation(setIsLoadingLocation, setDeliveryLocation, onLocationChange);
  };

  const handleLocationChange = async (e) => {
    const newLocation = e.target.value;
    setDeliveryLocation(newLocation);
    if (onLocationChange) {
      onLocationChange(newLocation);
    }

    if (newLocation.length > 2) {
      try {
        const suggestions = await getLocationSuggestions(newLocation);
        setLocationSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setLocationSuggestions([]);
      }
    } else {
      setLocationSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setDeliveryLocation(suggestion.formatted);
    setLocationSuggestions([]);
    if (onLocationChange) {
      onLocationChange(suggestion.formatted);
    }
  };

  const handleAutoDetectLocationClick = async () => {
    await handleAutoDetectLocation(setIsLoadingLocation, setDeliveryLocation, onLocationChange);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-orange-500">
          Curry
        </Link>
      
        {/* Delivery Location */}
        <div className="hidden md:flex items-center space-x-2 relative">
          <MapPin className="text-gray-500" />
          <Input
            type="text"
            placeholder={isLoadingLocation ? "Detecting location..." : "Enter delivery location"}
            value={deliveryLocation}
            onChange={handleLocationChange}
            className="w-64"
          />
          <Button onClick={handleAutoDetectLocationClick} variant="ghost" className="p-2">
            {isLoadingLocation ? 'Detecting...' : 'Detect'}
          </Button>
          {locationSuggestions.length > 0 && (
            <ul className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
              {locationSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.formatted}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-4">
          <Link to="/" className="text-gray-600 hover:text-orange-500">Home</Link>
          <Link to="/menu" className="text-gray-600 hover:text-orange-500">Menu</Link>
          <Link to="/order" className="text-gray-600 hover:text-orange-500">Order</Link>
          <Link to="/track" className="text-gray-600 hover:text-orange-500">Track</Link>
        </nav>

        {/* User Profile and Cart */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/profile" className="text-gray-600 hover:text-orange-500">Profile</Link>
              <Button onClick={onLogout} variant="ghost">Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-orange-500">Login</Link>
              <Link to="/register" className="text-gray-600 hover:text-orange-500">Register</Link>
            </>
          )}

          {/* Cart Icon */}
          <Link to="/cart" className="relative">
            <ShoppingCart className="text-gray-600 hover:text-orange-500" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {cartItemsCount}
              </span>
            )}
          </Link>

          {/* Chat Support */}
          <Button onClick={toggleChat} variant="ghost" className="p-2">
            <MessageSquare className="text-gray-600 hover:text-orange-500" />
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            variant="ghost"
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            <MenuIcon className="text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white py-4">
          <div className="container mx-auto px-4 flex flex-col space-y-4">
            <Link to="/" className="text-gray-600 hover:text-orange-500">Home</Link>
            <Link to="/menu" className="text-gray-600 hover:text-orange-500">Menu</Link>
            <Link to="/order" className="text-gray-600 hover:text-orange-500">Order</Link>
            <Link to="/track" className="text-gray-600 hover:text-orange-500">Track</Link>
            <Input
              type="text"
              placeholder="Enter delivery location"
              value={deliveryLocation}
              onChange={handleLocationChange}
              className="w-full"
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;