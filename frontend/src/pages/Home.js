import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  const [logoText, setLogoText] = useState('');
  const fullText = "Curry";

  useEffect(() => {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setLogoText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 200);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-green-100 min-h-screen text-green-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center animate-fade-in">
          <h1 className="text-6xl font-bold mb-4 text-green-900">
            Welcome to <span className="text-green-700 animate-pulse">{logoText}</span>
          </h1>
          <p className="text-xl mb-8 text-gray-800">Delicious vegetarian cuisine at your doorstep</p>
          <Link to="/menu">
            <motion.button
              className="bg-green-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-green-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore Our Menu
            </motion.button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {['Fresh Ingredients', 'Fast Delivery', 'Eco-Friendly'].map((title, index) => (
            <motion.div
              key={title}
              className="bg-white p-6 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <h2 className="text-2xl font-semibold mb-4 text-green-800">{title}</h2>
              <p className="text-gray-700">
                {title === 'Fresh Ingredients' && "We use only the freshest, locally-sourced ingredients to create our delicious meals."}
                {title === 'Fast Delivery' && "Our efficient delivery system ensures your food arrives hot and fresh at your doorstep."}
                {title === 'Eco-Friendly' && "We're committed to sustainability, using eco-friendly packaging for all our deliveries."}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;