import React from 'react';
import { motion } from 'framer-motion';

const PaymentConfirmationPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-4">Payment Confirmation</h1>
      <p className="mb-4">Thank you for your payment. Your transaction has been successfully processed.</p>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Success!</strong>
        <span className="block sm:inline"> Your order has been confirmed.</span>
      </div>
    </motion.div>
  );
};

export default PaymentConfirmationPage;