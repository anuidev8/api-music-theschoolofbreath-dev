const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const { jwtSecret } = require('./vars');
const User = require('../models/user.model');
const BearerStrategy = require('passport-http-bearer');


const jwtOptions = {
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromHeader('ssid'),
};

const jwt = async (payload, done) => {
  try {

    console.log(payload)
    const user = await User.findById(payload.sub);
    if (user) return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
};

exports.jwt = new JwtStrategy(jwtOptions, jwt);
