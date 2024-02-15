const basicAuth = require('express-basic-auth');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const myAuthorizer = async (username, password, cb) => {
  const user = await User.findOne({ where: { username } });
  if (user && await bcrypt.compare(password, user.password)) {
    return cb(null, true);
  } else {
    return cb(null, false);
  }
};

const authMiddleware = basicAuth({
  authorizer: myAuthorizer,
  authorizeAsync: true,
  challenge: true,
  realm: 'My Application'
});

module.exports = authMiddleware;
