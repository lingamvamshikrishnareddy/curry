const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

passport.use(new LocalStrategy(async (username, password, done) => {
  // Implement local strategy
}));

module.exports = passport;