const crypto = require('crypto');

const generateSecureSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

const newSecret = generateSecureSecret();
console.log('New JWT_SECRET:', newSecret);

// Instructions:
// 1. Save this script as 'generate-jwt-secret.js'
// 2. Run it using Node.js: node generate-jwt-secret.js
// 3. Copy the output and update your .env file with the new JWT_SECRET