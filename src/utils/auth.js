const passport = require('passport');
// const User = require('../models/user.model');

const ADMIN = 'admin';
const LOGGED_USER = '_loggedUser';
const PARTNER ="partner"
const Roles = ["user", 'admin', "branch", "partner"]

const handleJWT = (req, res, next, roles) => async (err, user, info) => {
  const error = err || info;
  if (!user) {
    console.log(user)
    return next('Unauthorized')
  }
  if (roles === LOGGED_USER) {
    if (user.role == 'admin'|| user.role =="branch") {
      return next('ur admin or branch');
    }
  } else if (roles === ADMIN) {
    if (user.role == 'user' || user.role =="branch") {
      return next('ur user or branch')
    }
  } else if (roles === PARTNER) {
    if (user.role == "user" || user.role=="admin") {
      return next("ur user");
    }
  } else if (!Roles.includes(user.role)) {
    return next('notfound');
  } else if (error || !user) {
    return next('nouser');
  }
  req.user = user;
  return next();
};

exports.oAuth = service =>
passport.authenticate(service, { session: false });

exports.ADMIN = ADMIN;
exports.LOGGED_USER = LOGGED_USER;
exports.PARTNER = PARTNER

exports.authorize = (roles = Roles) => (req, res, next) =>
  passport.authenticate(
    'jwt', { session: false },
    handleJWT(req, res, next, roles),
  )(req, res, next);


  const noAuth = (req, res, next, roles) => async (err, user, info) => {
    const error = err || info;
    if (!user) {
      req.body.new= true
      return next()
    }
    req.user = user;
    return next();
  };
exports.authorizeNot = (roles = Roles) => (req, res, next) =>
  passport.authenticate(
    'jwt', { session: false },
    noAuth(req, res, next, roles),
  )(req, res, next);

