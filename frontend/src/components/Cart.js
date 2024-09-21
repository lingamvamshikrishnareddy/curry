import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';

const CartItem = ({ item, removeFromCart, updateQuantity }) => (
  <motion.div
    className="flex justify-between items-center bg-white p-4 rounded-lg shadow mb-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <div className="flex items-center">
      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded mr-4" />
      <div>
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-gray-600">₹{item.price.toFixed(2)}</p>
      </div>
    </div>
    <div className="flex items-center">
      <button
        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
        className="bg-gray-200 p-1 rounded"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className="mx-2">{item.quantity}</span>
      <button
        onClick={() => updateQuantity(item.id, item.quantity + 1)}
        className="bg-gray-200 p-1 rounded"
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
      <button
        onClick={() => removeFromCart(item.id)}
        className="ml-4 text-red-500 hover:text-red-700"
        aria-label="Remove item"
      >
        <Trash2 size={20} />
      </button>
    </div>
  </motion.div>
);

const Cart = ({ items = [], removeFromCart, updateQuantity, clearCart }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!Array.isArray(items)) {
    console.error('Items prop is not an array:', items);
    return <div>Error: Unable to display cart items</div>;
  }

  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
      {items.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <>
          <AnimatePresence>
            {items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
              />
            ))}
          </AnimatePresence>
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-xl font-bold">Total: ₹{total.toFixed(2)}</p>
            <div className="mt-4 flex justify-between">
              <button
                onClick={clearCart}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Clear Cart
              </button>
              <Link
                to="/checkout"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center"
              >
                <ShoppingBag className="mr-2" size={20} />
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;