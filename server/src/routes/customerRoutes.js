const express = require('express');
const { protect, scopeToOwner } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { listCustomers, createCustomer, updateCustomer, deleteCustomer, purchaseHistory } = require('../controllers/customerController');

const router = express.Router();
router.use(protect, scopeToOwner);

router.get('/', asyncHandler(listCustomers));
router.post('/', asyncHandler(createCustomer));
router.put('/:id', asyncHandler(updateCustomer));
router.delete('/:id', asyncHandler(deleteCustomer));
router.get('/:id/purchases', asyncHandler(purchaseHistory));

module.exports = router;
