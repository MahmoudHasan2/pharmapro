const express = require('express');
const { protect, scopeToOwner } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { listStaff, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');

const router = express.Router();
router.use(protect, scopeToOwner);

router.get('/', asyncHandler(listStaff));
router.post('/', asyncHandler(createStaff));
router.put('/:id', asyncHandler(updateStaff));
router.delete('/:id', asyncHandler(deleteStaff));

module.exports = router;
