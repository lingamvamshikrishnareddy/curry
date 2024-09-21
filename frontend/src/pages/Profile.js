import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit2 } from 'lucide-react';

const Profile = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  useEffect(() => {
    // Fetch user profile data from API
    // This is a placeholder. Replace with actual API call.
    const fetchProfile = async () => {
      // const response = await fetch('/api/profile');
      // const data = await response.json();
      // setProfile(data);
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit updated profile to API
    // This is a placeholder. Replace with actual API call.
    // await fetch('/api/profile', { method: 'POST', body: JSON.stringify(profile) });
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center text-green-500 hover:text-green-600"
          >
            <Edit2 className="w-5 h-5 mr-1" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="w-6 h-6 text-gray-400 mr-3" />
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              ) : (
                <span className="text-lg">{profile.name}</span>
              )}
            </div>
            <div className="flex items-center">
              <Mail className="w-6 h-6 text-gray-400 mr-3" />
              <span className="text-lg">{profile.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-6 h-6 text-gray-400 mr-3" />
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              ) : (
                <span className="text-lg">{profile.phone}</span>
              )}
            </div>
            <div className="flex items-start">
              <MapPin className="w-6 h-6 text-gray-400 mr-3 mt-1" />
              {isEditing ? (
                <textarea
                  name="address"
                  value={profile.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows="3"
                />
              ) : (
                <span className="text-lg">{profile.address}</span>
              )}
            </div>
          </div>
          {isEditing && (
            <motion.button
              type="submit"
              className="mt-6 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Save Changes
            </motion.button>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;