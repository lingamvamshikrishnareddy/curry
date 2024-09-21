const validator = require('validator');

const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateUrl = (url) => {
  return validator.isURL(url);
};

const validateNumber = (value, { min, max }) => {
  return validator.isInt(value.toString(), { min, max });
};

const validateAlphanumeric = (str) => {
  return validator.isAlphanumeric(str);
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUrl,
  validateNumber,
  validateAlphanumeric
};