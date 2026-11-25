const express = require('express');
const { protect, scopeToOwner } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { listSales, createSale, getSale, downloadReceiptPDF } = require('../controllers/saleController');

const router = express.Router();
router.use(protect, scopeToOwner);

router.get('/', asyncHandler(listSales));
router.post('/', asyncHandler(createSale));
router.get('/:id', asyncHandler(getSale));
router.get('/:id/receipt-pdf', asyncHandler(downloadReceiptPDF));

module.exports = router;
