const express = require('express');
const { protect, scopeToOwner } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { listOrders, createOrder, updateStatus, deleteOrder } = require('../controllers/purchaseOrderController');

const router = express.Router();
router.use(protect, scopeToOwner);

router.get('/', asyncHandler(listOrders));
router.post('/', asyncHandler(createOrder));
router.patch('/:id/status', asyncHandler(updateStatus));
router.delete('/:id', asyncHandler(deleteOrder));

module.exports = router;
