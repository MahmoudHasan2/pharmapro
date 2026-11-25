const express = require('express');
const { protect, scopeToOwner } = require('../middleware/auth');
const upload = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');
const { getSettings, updateSettings, uploadLogo } = require('../controllers/settingsController');

const router = express.Router();
router.use(protect, scopeToOwner);

router.get('/', asyncHandler(getSettings));
router.put('/', asyncHandler(updateSettings));
router.post('/logo', upload.single('logo'), asyncHandler(uploadLogo));

module.exports = router;
