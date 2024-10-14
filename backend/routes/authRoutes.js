const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController'); // Ensure these functions exist

router.post('/register', register); // Registration endpoint
router.post('/login', login);       // Login endpoint

module.exports = router;
