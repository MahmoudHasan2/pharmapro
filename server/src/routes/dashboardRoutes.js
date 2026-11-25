const express = require('express');
const { protect, scopeToOwner } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const {
  summary, revenueChart, topMedications, slowMovers, expiringMedications, categoryCounts, recentActivity,
  downloadReportPDF, downloadReportCSV, downloadExpiryReportPDF,
} = require('../controllers/dashboardController');

const router = express.Router();
router.use(protect, scopeToOwner);

router.get('/summary', asyncHandler(summary));
router.get('/revenue-chart', asyncHandler(revenueChart));
router.get('/top-medications', asyncHandler(topMedications));
router.get('/slow-movers', asyncHandler(slowMovers));
router.get('/expiring-medications', asyncHandler(expiringMedications));
router.get('/categories', asyncHandler(categoryCounts));
router.get('/recent-activity', asyncHandler(recentActivity));
router.get('/report-pdf', asyncHandler(downloadReportPDF));
router.get('/report-csv', asyncHandler(downloadReportCSV));
router.get('/expiry-report-pdf', asyncHandler(downloadExpiryReportPDF));

module.exports = router;
