const { medications, sales, customers, staff, stockMovements, purchaseOrders } = require('../db');
const SettingsHelper = require('./_settingsHelper');
const { generateFinancialReportPDF, generateExpiryReportPDF } = require('../utils/pdfGenerator');

function bucketLabel(dateStr, period) {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  if (period === 'daily') return `${yyyy}-${mm}-${dd}`;
  if (period === 'yearly') return `${yyyy}`;
  if (period === 'weekly') {
    const firstJan = new Date(yyyy, 0, 1);
    const daysSince = Math.floor((d - firstJan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((daysSince + firstJan.getDay() + 1) / 7);
    return `${yyyy}-W${String(week).padStart(2, '0')}`;
  }
  return `${yyyy}-${mm}`;
}

function fetchRevenueData(ownerId, period) {
  const ownerSales = sales.find((s) => s.ownerId === ownerId);
  const totals = {};
  ownerSales.forEach((s) => {
    const label = bucketLabel(s.createdAt, period);
    totals[label] = (totals[label] || 0) + s.total;
  });
  return Object.entries(totals).map(([label, total]) => ({ label, total })).sort((a, b) => (a.label > b.label ? 1 : -1));
}

function fetchTopMedications(ownerId) {
  const ownerSales = sales.find((s) => s.ownerId === ownerId);
  const totals = {};
  ownerSales.forEach((s) => {
    (s.items || []).forEach((item) => {
      const key = item.medicationName || '-';
      if (!totals[key]) totals[key] = { count: 0, revenue: 0 };
      totals[key].count += item.quantity;
      totals[key].revenue += item.price * item.quantity;
    });
  });
  return Object.entries(totals).map(([name, v]) => ({ name, count: v.count, revenue: v.revenue })).sort((a, b) => b.count - a.count).slice(0, 10);
}

// GET /api/dashboard/slow-movers — medications with the least sales
// activity (including items never sold at all), based on real sales data.
// Used for the "أقل الأصناف طلباً" report.
function slowMovers(req, res) {
  const ownerId = req.ownerId;
  const ownerSales = sales.find((s) => s.ownerId === ownerId);
  const soldCounts = {};
  ownerSales.forEach((s) => {
    (s.items || []).forEach((item) => {
      soldCounts[item.medicationId] = (soldCounts[item.medicationId] || 0) + item.quantity;
    });
  });
  const list = medications.find((m) => m.ownerId === ownerId).map((m) => ({
    name: m.name,
    stockQty: m.stockQty,
    unitsSold: soldCounts[m._id] || 0,
  })).sort((a, b) => a.unitsSold - b.unitsSold).slice(0, 10);
  res.json(list);
}

async function summary(req, res) {
  const ownerId = req.ownerId;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);

  const totalMedications = medications.count((m) => m.ownerId === ownerId);
  const allMeds = medications.find((m) => m.ownerId === ownerId);
  const now = new Date();
  const lowStockCount = allMeds.filter((m) => m.stockQty <= (m.lowStockThreshold || 10) && m.stockQty > 0).length;
  const outOfStockCount = allMeds.filter((m) => m.stockQty === 0).length;
  const expiringSoonCount = allMeds.filter((m) => {
    if (!m.expiryDate) return false;
    const days = Math.ceil((new Date(m.expiryDate) - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 60;
  }).length;
  const expiredCount = allMeds.filter((m) => m.expiryDate && new Date(m.expiryDate) < now).length;

  const todaySales = sales.find((s) => s.ownerId === ownerId && new Date(s.createdAt) >= start && new Date(s.createdAt) <= end);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalCustomers = customers.count((c) => c.ownerId === ownerId);

  res.json({ totalMedications, lowStockCount, outOfStockCount, expiringSoonCount, expiredCount, todayRevenue, todaySalesCount: todaySales.length, totalCustomers });
}

// GET /api/dashboard/categories — counts + share per medication category,
// used for the category cards on the dashboard.
async function categoryCounts(req, res) {
  const allMeds = medications.find((m) => m.ownerId === req.ownerId);
  const totals = {};
  allMeds.forEach((m) => {
    const key = m.category || 'أخرى';
    totals[key] = (totals[key] || 0) + 1;
  });
  const total = allMeds.length || 1;
  res.json(
    Object.entries(totals)
      .map(([category, count]) => ({ category, count, share: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
  );
}

// GET /api/dashboard/recent-activity — merges recent sales, stock
// changes, and expiry warnings into one feed, newest first.
async function recentActivity(req, res) {
  const ownerId = req.ownerId;
  const items = [];

  sales.find((s) => s.ownerId === ownerId).forEach((s) => {
    items.push({
      type: 'sale',
      title: `تم بيع ${s.items[0]?.medicationName || 'دواء'}${s.items.length > 1 ? ` +${s.items.length - 1}` : ''}`,
      detail: `${s.items.reduce((n, it) => n + it.quantity, 0)} وحدة - $${s.total}`,
      date: s.createdAt,
    });
  });

  stockMovements.find((m) => m.ownerId === ownerId && m.change > 0).slice(-20).forEach((m) => {
    const med = medications.findById(m.medicationId);
    if (med) {
      items.push({ type: 'stock', title: 'توريد مخزون', detail: `${med.name} +${m.change}`, date: m.createdAt });
    }
  });

  const now = new Date();
  medications.find((m) => m.ownerId === ownerId && m.expiryDate).forEach((m) => {
    const days = Math.ceil((new Date(m.expiryDate) - now) / (1000 * 60 * 60 * 24));
    if (days >= 0 && days <= 30) {
      items.push({ type: 'alert', title: 'انتهاء صلاحية قريب', detail: `${m.name} - ${new Date(m.expiryDate).toLocaleDateString('en-GB')}`, date: m.updatedAt });
    }
  });

  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(items.slice(0, 10));
}

async function revenueChart(req, res) {
  res.json(fetchRevenueData(req.ownerId, req.query.period || 'monthly'));
}

async function topMedications(req, res) {
  res.json(fetchTopMedications(req.ownerId));
}

async function expiringMedications(req, res) {
  const now = new Date();
  const list = medications
    .find((m) => m.ownerId === req.ownerId && m.expiryDate)
    .filter((m) => {
      const days = Math.ceil((new Date(m.expiryDate) - now) / (1000 * 60 * 60 * 24));
      return days <= 60;
    })
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  res.json(list);
}

async function downloadReportPDF(req, res) {
  const period = req.query.period || 'monthly';
  const revenueData = fetchRevenueData(req.ownerId, period);
  const meds = fetchTopMedications(req.ownerId);
  const settings = SettingsHelper.getFor(req.ownerId);
  generateFinancialReportPDF(res, { revenueData, period, topMedications: meds, settings });
}

async function downloadReportCSV(req, res) {
  const period = req.query.period || 'monthly';
  const revenueData = fetchRevenueData(req.ownerId, period);
  const meds = fetchTopMedications(req.ownerId);
  const escapeCsv = (val) => `"${String(val).replace(/"/g, '""')}"`;
  let csv = 'Revenue Report\r\nPeriod,Total\r\n';
  revenueData.forEach((r) => (csv += `${escapeCsv(r.label)},${r.total}\r\n`));
  csv += '\r\nTop Medications\r\nMedication,Count,Revenue\r\n';
  meds.forEach((m) => (csv += `${escapeCsv(m.name)},${m.count},${m.revenue}\r\n`));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=financial-report-${period}.csv`);
  res.send('\uFEFF' + csv);
}

async function downloadExpiryReportPDF(req, res) {
  const now = new Date();
  const meds = medications
    .find((m) => m.ownerId === req.ownerId && m.expiryDate)
    .filter((m) => Math.ceil((new Date(m.expiryDate) - now) / (1000 * 60 * 60 * 24)) <= 60)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  const settings = SettingsHelper.getFor(req.ownerId);
  generateExpiryReportPDF(res, { medications: meds, settings });
}

module.exports = { summary, revenueChart, topMedications, slowMovers, expiringMedications, categoryCounts, recentActivity, downloadReportPDF, downloadReportCSV, downloadExpiryReportPDF };
