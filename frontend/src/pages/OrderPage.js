import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const schema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  phone: z.string().regex(/^\d{10}$/, { message: "Phone must be 10 digits" }),
  email: z.string().email({ message: "Invalid email address" }),
});

const OrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state?.order);
  const cartItems = location.state?.cartItems || [];

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data) => {
    // Simulate placing an order
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      items: cartItems
    };
    setOrder(newOrder);
    // You might want to send this data to your backend here
  };

  if (order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Order Placed Successfully!</h2>
          <p className="mb-4">Your order ID is: <span className="font-semibold">{order.id}</span></p>
          <p className="mb-6">Thank you for your order. You can track your delivery status on the tracking page.</p>
          <div className="space-y-4">
            <Link to="/track-order" className="block">
              <motion.button
                className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-colors w-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Track Order
              </motion.button>
            </Link>
            <Link to="/menu" className="block">
              <motion.button
                className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors w-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Return to Menu
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6">Complete Your Order</h2>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 mb-2">Name:</label>
          <input
            {...register("name")}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.name && <p className="text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">Email:</label>
          <input
            {...register("email")}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.email && <p className="text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="address" className="block text-gray-700 mb-2">Address:</label>
          <input
            {...register("address")}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.address && <p className="text-red-500 mt-1">{errors.address.message}</p>}
        </div>
        <div className="mb-4">
          <label htmlFor="phone" className="block text-gray-700 mb-2">Phone:</label>
          <input
            {...register("phone")}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors.phone && <p className="text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
        <motion.button
          type="submit"
          className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Place Order
        </motion.button>
      </form>
    </motion.div>
  );
};

export default OrderPage;