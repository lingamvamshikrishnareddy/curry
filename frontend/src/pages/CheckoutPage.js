import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { placeOrder, initiatePayment, verifyPayment, getUserProfile, updateOrderStatus } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const CheckoutPage = ({ cartItems, clearCart }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const totalAmount = useMemo(() => 
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );

  const fetchUserProfile = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const profile = await getUserProfile();
      setUserDetails({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({ ...prev, [name]: value }));
  }, []);

  const handlePaymentSuccess = useCallback(async (response, orderId) => {
    try {
      const verificationResult = await verifyPayment({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        orderId: orderId
      });
      
      if (verificationResult.success) {
        clearCart();
        navigate('/order-confirmation', { state: { orderId } });
      } else {
        setError("Payment verification failed. Please contact support.");
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError("Payment verification failed. Please contact support.");
    }
  }, [clearCart, navigate]);

  const handleRazorpayPayment = useCallback(async (orderId) => {
    try {
      const paymentData = await initiatePayment(orderId, { method: 'RAZORPAY' });
      
      if (!paymentData || !paymentData.razorpayOrderId || !paymentData.amount) {
        throw new Error('Invalid payment data received');
      }
  
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Your Restaurant Name',
        description: 'Food Order Payment',
        order_id: paymentData.razorpayOrderId,
        handler: (response) => handlePaymentSuccess(response, orderId),
        prefill: {
          name: userDetails.name,
          email: user?.email,
          contact: userDetails.phone
        },
        theme: { color: '#6366F1' },
        modal: {
          ondismiss: async () => {
            try {
              await updateOrderStatus(orderId, 'Pending');
            } catch (error) {
              console.error('Error updating order status:', error);
            }
            setError('Payment cancelled. Please try again.');
            setIsLoading(false);
          }
        }
      };
  
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment initiation failed:', error);
      setError(`Payment initiation failed: ${error.message}`);
      setIsLoading(false);
    }
  }, [handlePaymentSuccess, userDetails, user, updateOrderStatus]);

  
  const handleCODPayment = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'Confirmed');
      clearCart();
      navigate('/order-confirmation', { 
        state: { 
          orderId,
          paymentMethod: 'COD'
        }
      });
    } catch (error) {
      console.error('Error handling COD payment:', error);
      setError('Failed to process COD order. Please try again.');
    }
  };

  const validateOrderData = (orderData) => {
    if (!orderData.items.length) {
      throw new Error('Your cart is empty');
    }
    if (!orderData.name.trim()) {
      throw new Error('Please enter your name');
    }
    if (!orderData.phone.trim()) {
      throw new Error('Please enter your phone number');
    }
    if (!orderData.address.trim()) {
      throw new Error('Please enter your delivery address');
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
        const orderData = {
            items: cartItems.map((item) => ({
                menuItem: item.id,
                quantity: item.quantity,
            })),
            total: totalAmount,
            ...userDetails,
            paymentMethod: paymentMethod.toUpperCase(),
        };

        validateOrderData(orderData);

        const response = await placeOrder(orderData);
        const orderId = response.id;

        if (paymentMethod === 'razorpay') {
            await handleRazorpayPayment(orderId);
        } else if (paymentMethod === 'cod') {
            await handleCODPayment(orderId);
        }
    } catch (error) {
        console.error('Error placing order:', error);
        setError(error.message || "An error occurred while processing your order. Please try again.");
    } finally {
        setIsLoading(false);
    }
};
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Please log in to access the checkout page.</h2>
        <button
          onClick={() => navigate('/login')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (isLoading && !error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4">Processing your request...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      {error && <ErrorAlert message={error} />}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Name"
          id="name"
          name="name"
          value={userDetails.name}
          onChange={handleInputChange}
          required
        />
        <InputField
          label="Phone"
          id="phone"
          name="phone"
          type="tel"
          value={userDetails.phone}
          onChange={handleInputChange}
          required
        />
        <TextAreaField
          label="Delivery Address"
          id="address"
          name="address"
          value={userDetails.address}
          onChange={handleInputChange}
          required
        />
        
        <PaymentMethodSelect
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />
        
        <OrderSummary cartItems={cartItems} totalAmount={totalAmount} />

        <SubmitButton isLoading={isLoading} />
      </form>
    </div>
  );
};

const ErrorAlert = ({ message }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
    <AlertTriangle className="inline-block mr-2" />
    <span className="block sm:inline">{message}</span>
  </div>
);

const InputField = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      id={id}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      {...props}
    />
  </div>
);

const TextAreaField = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea
      id={id}
      rows="3"
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      {...props}
    ></textarea>
  </div>
);

const PaymentMethodSelect = ({ value, onChange }) => (
  <div>
    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
    <select
      id="paymentMethod"
      name="paymentMethod"
      value={value}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    >
      <option value="cod">Cash on Delivery</option>
      <option value="razorpay">Razorpay</option>
    </select>
  </div>
);

const OrderSummary = ({ cartItems, totalAmount }) => (
  <div className="mt-4">
    <h2 className="text-xl font-semibold">Order Summary</h2>
    <ul className="mt-2 space-y-2">
      {cartItems.map((item) => (
        <li key={item.id} className="flex justify-between">
          <span>{item.name} x {item.quantity}</span>
          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
        </li>
      ))}
    </ul>
    <div className="mt-4 text-xl font-bold flex justify-between border-t pt-4">
      <span>Total:</span>
      <span>₹{totalAmount.toFixed(2)}</span>
    </div>
  </div>
);

const SubmitButton = ({ isLoading }) => (
  <button
    type="submit"
    disabled={isLoading}
    className={`w-full ${
      isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
    } text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mt-6`}
  >
    {isLoading ? 'Processing...' : 'Place Order'}
  </button>
);

export default CheckoutPage;