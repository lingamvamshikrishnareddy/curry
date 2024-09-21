import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMenuItems, submitReview } from '../services/api';
import { debounce } from 'lodash';
import { Filter, Star, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const MenuPage = ({ addToCart, removeFromCart, updateQuantity, cartItems, initialSearchTerm = '' }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  const fetchMenuItems = useCallback(async (search, pageNum) => {
    try {
      setLoading(true);
      setError(null);
      const items = await getMenuItems(search, pageNum);
      setMenuItems(prevItems => [...prevItems, ...items]);
      setHasMore(items.length > 0);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetchMenuItems = useCallback(
    debounce((search, pageNum) => fetchMenuItems(search, pageNum), 300),
    [fetchMenuItems]
  );

  useEffect(() => {
    setMenuItems([]);
    setPage(1);
    debouncedFetchMenuItems(searchTerm, 1);
    return () => debouncedFetchMenuItems.cancel();
  }, [debouncedFetchMenuItems, searchTerm]);

  const lastItemElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    if (page > 1) {
      debouncedFetchMenuItems(searchTerm, page);
    }
  }, [page, debouncedFetchMenuItems, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setMenuItems([]);
    setPage(1);
  };

  const filteredMenuItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];

  const handleReviewSubmit = async (itemId, reviewData) => {
    try {
      await submitReview({ ...reviewData, menuItemId: itemId });
      const updatedItems = await getMenuItems(searchTerm, 1);
      setMenuItems(updatedItems);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    }
  };

  

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Our Menu</h1>

      <SearchBar onSearch={handleSearch} initialSearchTerm={searchTerm} />

      <FilterOptions 
        categories={categories} 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredMenuItems.map((item, index) => (
            <motion.div
              key={item._id}
              ref={index === filteredMenuItems.length - 1 ? lastItemElementRef : null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <p className="text-lg font-bold mb-4">₹{item.price.toFixed(2)}</p>
              <button 
                onClick={() => addToCart(item)} 
                className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50"
              >
                Add to Cart
              </button>
              <ReviewForm onSubmit={(reviewData) => handleReviewSubmit(item._id, reviewData)} />
              
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {loading && <div className="text-center mt-8">Loading more items...</div>}
      {error && <div className="text-center mt-8 text-red-500">{error}</div>}

      <Cart 
        cartItems={cartItems} 
        removeFromCart={removeFromCart} 
        updateQuantity={updateQuantity} 
      />
    </div>
  );
};

const ReviewForm = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    if (comment.trim() === '') {
      setError('Please write a comment.');
      return;
    }
    setError('');
    onSubmit({ rating, comment });
    setRating(0);
    setComment('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Leave a Review</h3>
      <div className="flex mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            onClick={() => setRating(star)}
            fill={star <= rating ? 'gold' : 'none'}
            stroke={star <= rating ? 'gold' : 'currentColor'}
            className="cursor-pointer transition-colors duration-200 hover:fill-yellow-400"
          />
        ))}
      </div>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review..."
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800 resize-none"
        rows="3"
      />
      <button
        type="submit"
        className="mt-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50"
      >
        Submit Review
      </button>
    </form>
  );
};

const SearchBar = ({ onSearch, initialSearchTerm }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search menu items..."
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-500 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  );
};

const FilterOptions = ({ categories, selectedCategory, setSelectedCategory }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8 bg-white p-4 rounded-lg shadow"
    >
      <div className="flex items-center mb-4">
        <Filter className="mr-2 text-green-500" size={24} />
        <h3 className="text-xl font-semibold">Filter by Category</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <motion.button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full transition-colors duration-200 ${
              selectedCategory === category
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {category}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};


const Cart = ({ cartItems, removeFromCart, updateQuantity }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed bottom-0 right-0 m-4 z-50">
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ShoppingBag size={24} />
        <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
          {cartItems.length}
        </span>
      </motion.button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 bg-white p-6 rounded-lg shadow-md w-80"
          >
            <h2 className="text-2xl font-semibold mb-4">Your Cart</h2>
            {cartItems.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                {cartItems.map((item) => (
                  <div key={item._id} className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p>₹{item.price.toFixed(2)} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item._id, parseInt(e.target.value))}
                        className="w-16 px-2 py-1 border rounded mr-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xl font-bold">Total: ₹{total.toFixed(2)}</p>
                  <Link
                    to="/checkout"
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50"
                  >
                    <ShoppingBag className="mr-2" size={20} />
                    Proceed to Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuPage;