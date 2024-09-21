import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">About Curry</h1>
        <div className="max-w-2xl mx-auto">
          <p className="mb-4 text-lg text-gray-600">
            Curry is a vegetarian restaurant dedicated to bringing delicious, healthy, and authentic Indian cuisine to your doorstep. Our passion for food and commitment to quality ingredients sets us apart.
          </p>
          <p className="mb-4 text-lg text-gray-600">
            Founded in 2020, we've quickly become a favorite among food enthusiasts looking for tasty vegetarian options. Our menu features a wide variety of dishes, from classic curries to innovative fusion creations.
          </p>
          <p className="text-lg text-gray-600">
            At Curry, we believe in sustainable practices and supporting local farmers. We source our ingredients locally whenever possible and use eco-friendly packaging for all our deliveries.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default About;