const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'محاولات دخول كثيرة، حاول لاحقاً' } });

router.post('/login', loginLimiter, asyncHandler(login));
router.get('/me', protect, asyncHandler(getMe));
router.put('/password', protect, asyncHandler(changePassword));

module.exports = router;
