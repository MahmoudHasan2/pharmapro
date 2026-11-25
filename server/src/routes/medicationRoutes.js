const express = require('express');
const { protect, scopeToOwner } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
  listMedications, getMedication, createMedication, updateMedication, deleteMedication, adjustStock, listMovements,
} = require('../controllers/medicationController');

const router = express.Router();
router.use(protect, scopeToOwner);

router.get('/', asyncHandler(listMedications));
router.post('/', asyncHandler(createMedication));
router.get('/:id', asyncHandler(getMedication));
router.put('/:id', asyncHandler(updateMedication));
router.delete('/:id', asyncHandler(deleteMedication));
router.post('/:id/adjust-stock', asyncHandler(adjustStock));
router.get('/:id/movements', asyncHandler(listMovements));

module.exports = router;
