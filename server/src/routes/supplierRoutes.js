const express = require('express');
const { protect, scopeToOwner } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { listSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');

const router = express.Router();
router.use(protect, scopeToOwner);

router.get('/', asyncHandler(listSuppliers));
router.post('/', asyncHandler(createSupplier));
router.put('/:id', asyncHandler(updateSupplier));
router.delete('/:id', asyncHandler(deleteSupplier));

module.exports = router;
