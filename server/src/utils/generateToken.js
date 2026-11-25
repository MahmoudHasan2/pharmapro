const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config');

function generateToken(id, rememberMe = false) {
  return jwt.sign({ id, role: 'owner' }, jwtSecret, { expiresIn: rememberMe ? '30d' : jwtExpiresIn });
}
module.exports = generateToken;
