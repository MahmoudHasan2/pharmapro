const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { owners } = require('../db');

function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ message: 'غير مصرح - لا يوجد رمز دخول' });

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    const owner = owners.findById(decoded.id);
    if (!owner || !owner.isActive) return res.status(403).json({ message: 'الحساب معطل أو غير موجود' });

    next();
  } catch (err) {
    return res.status(401).json({ message: 'رمز الدخول غير صالح أو منتهي' });
  }
}

function scopeToOwner(req, res, next) {
  if (!req.user) return res.status(403).json({ message: 'هذا المورد يتطلب تسجيل الدخول' });
  req.ownerId = req.user.id;
  next();
}

module.exports = { protect, scopeToOwner };
