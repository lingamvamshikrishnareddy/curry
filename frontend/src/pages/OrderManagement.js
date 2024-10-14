import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Check, Printer, MapPin, Package, ArrowRight, 
  AlertTriangle, Clock, ChevronDown, ChevronUp,
  FileText, Download
} from 'lucide-react';
import { getOrderDetails, getOrderHistory } from '../services/api';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const TAX_RATE = 0.18; // 18% GST
const DELIVERY_FEE = 40; // Fixed delivery fee

const OrderCard = ({ order, onTrackOrder, onViewInvoice }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Confirmed': 'bg-blue-100 text-blue-800',
      'Processing': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Order #{order._id}</h3>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
          {order.status}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center">
          <p className="font-medium">Total Amount: ₹{order.total.toFixed(2)}</p>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Less Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                More Details
              </>
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Order Items:</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.menuItem.name}</span>
                    <span>₹{item.menuItem.price.toFixed(2)} x {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Delivery Details:</h4>
              <p>{order.address}</p>
              <p>{order.phone}</p>
            </div>

            <div className="flex space-x-4">
              {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <button
                  onClick={() => onTrackOrder(order._id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded flex items-center hover:bg-blue-600"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Track Order
                </button>
              )}
              <button
                onClick={() => onViewInvoice(order)}
                className="border border-blue-500 text-blue-500 px-4 py-2 rounded flex items-center hover:bg-blue-50"
              >
                <FileText className="mr-2 h-4 w-4" />
                View Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const generatePDF = (order) => {
  const doc = new jsPDF();

  // Add company logo or name
  doc.setFontSize(20);
  doc.text("Your Company Name", 105, 15, null, null, "center");

  // Add invoice title
  doc.setFontSize(16);
  doc.text("Invoice", 105, 30, null, null, "center");

  // Add order details
  doc.setFontSize(12);
  doc.text(`Order #${order._id}`, 20, 50);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 60);

  // Add customer details
  doc.text("Bill To:", 20, 80);
  doc.text(order.customerName || "Customer Name", 20, 90);
  doc.text(order.address || "Customer Address", 20, 100);
  doc.text(order.phone || "Customer Phone", 20, 110);

  // Add item details
  const itemDetails = order.items.map(item => [
    item.menuItem.name,
    item.quantity.toString(),
    `₹${item.menuItem.price.toFixed(2)}`,
    `₹${(item.quantity * item.menuItem.price).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 130,
    head: [["Item", "Quantity", "Price", "Total"]],
    body: itemDetails,
  });

  const finalY = doc.lastAutoTable.finalY || 130;

  // Add summary
  const subtotal = order.total / (1 + TAX_RATE);
  const tax = order.total - subtotal;

  doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 140, finalY + 20);
  doc.text(`GST (18%): ₹${tax.toFixed(2)}`, 140, finalY + 30);
  doc.text(`Delivery Fee: ₹${DELIVERY_FEE.toFixed(2)}`, 140, finalY + 40);
  doc.text(`Total: ₹${(order.total + DELIVERY_FEE).toFixed(2)}`, 140, finalY + 50);

  // Save the PDF
  doc.save(`Invoice_${order._id}.pdf`);
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const orderHistory = await getOrderHistory();
        setOrders(orderHistory);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleTrackOrder = (orderId) => {
    navigate(`/track/${orderId}`);
  };

  const handleViewInvoice = (order) => {
    generatePDF(order);
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <AlertTriangle className="inline-block mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      <div className="space-y-6">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          sortedOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onTrackOrder={handleTrackOrder}
              onViewInvoice={handleViewInvoice}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default OrderManagement;