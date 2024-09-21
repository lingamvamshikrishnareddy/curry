import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-2xl font-bold mb-4">Curry</h3>
            <p className="mb-4">© 2024 Curry. All rights reserved.</p>
            <p>We use organic vegetables and are 100% vegetarian.</p>
          </div>
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h4 className="text-xl font-semibold mb-4">Connect With Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-gray-400"><Facebook size={24} /></a>
              <a href="#" className="hover:text-gray-400"><Twitter size={24} /></a>
              <a href="#" className="hover:text-gray-400"><Instagram size={24} /></a>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
            <ul>
              <li className="mb-2"><Link to="/about" className="hover:text-gray-400">About Us</Link></li>
              <li className="mb-2"><Link to="/about#our-story" className="hover:text-gray-400">Our Story</Link></li>
              <li className="mb-2"><Link to="/about#careers" className="hover:text-gray-400">Careers</Link></li>
              <li className="mb-2"><Link to="/about#investors" className="hover:text-gray-400">Investors</Link></li>
              <li><Link to="/contact" className="hover:text-gray-400">Contact Us</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;