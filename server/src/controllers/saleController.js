const { sales, medications, customers, staff, stockMovements } = require('../db');
const SettingsHelper = require('./_settingsHelper');
const generateSaleNumber = require('../utils/generateSaleNumber');
const { generateSaleReceiptPDF } = require('../utils/pdfGenerator');

function withRelations(sale) {
  const customer = sale.customerId ? customers.findById(sale.customerId) : null;
  const staffMember = sale.staffId ? staff.findById(sale.staffId) : null;
  return {
    ...sale,
    customerId: customer ? { _id: customer._id, fullName: customer.fullName, phone: customer.phone } : null,
    staffId: staffMember ? { _id: staffMember._id, name: staffMember.name } : null,
  };
}

// GET /api/sales?from=&to=&customerId=
async function listSales(req, res) {
  const { from, to, customerId } = req.query;
  let list = sales.find((s) => s.ownerId === req.ownerId);
  if (customerId) list = list.filter((s) => s.customerId === customerId);
  if (from) list = list.filter((s) => new Date(s.createdAt) >= new Date(from));
  if (to) list = list.filter((s) => new Date(s.createdAt) <= new Date(to));
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list.map(withRelations));
}

// POST /api/sales  { customerId?, staffId?, items:[{medicationId, quantity}], paymentMethod, discount }
// This is the point-of-sale checkout: validates stock, computes total from
// each medication's current sale price, deducts stock, and logs the sale
// in one atomic-ish sequence (no external DB transactions needed since
// everything is a single synchronous file write per store).
async function createSale(req, res) {
  const { customerId, staffId, items, paymentMethod, discount } = req.body;
  if (!items || !items.length) return res.status(400).json({ message: 'لازم تختار دواء واحد على الأقل' });

  const saleItems = [];
  for (const item of items) {
    const med = medications.findOne((m) => m._id === item.medicationId && m.ownerId === req.ownerId);
    if (!med) return res.status(404).json({ message: `دواء غير موجود` });
    if (med.stockQty < item.quantity) {
      return res.status(400).json({ message: `الكمية المتوفرة من "${med.name}" غير كافية (المتوفر: ${med.stockQty})` });
    }
    saleItems.push({ medicationId: med._id, medicationName: med.name, price: med.salePrice, quantity: item.quantity });
  }

  const subtotal = saleItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const total = Math.max(subtotal - (discount || 0), 0);

  // Deduct stock for each item and log the movement
  saleItems.forEach((it) => {
    const med = medications.findById(it.medicationId);
    const newQty = med.stockQty - it.quantity;
    medications.updateById(med._id, { stockQty: newQty });
    stockMovements.insert({
      ownerId: req.ownerId,
      medicationId: med._id,
      change: -it.quantity,
      reason: 'بيع',
      resultingQty: newQty,
    });
  });

  const sale = sales.insert({
    ownerId: req.ownerId,
    saleNumber: generateSaleNumber(),
    customerId: customerId || null,
    staffId: staffId || null,
    items: saleItems,
    discount: discount || 0,
    subtotal,
    total,
    paymentMethod: paymentMethod || 'cash',
  });

  res.status(201).json(withRelations(sale));
}

async function getSale(req, res) {
  const sale = sales.findOne((s) => s._id === req.params.id && s.ownerId === req.ownerId);
  if (!sale) return res.status(404).json({ message: 'الفاتورة غير موجودة' });
  res.json(withRelations(sale));
}

async function downloadReceiptPDF(req, res) {
  const sale = sales.findOne((s) => s._id === req.params.id && s.ownerId === req.ownerId);
  if (!sale) return res.status(404).json({ message: 'الفاتورة غير موجودة' });
  const customer = sale.customerId ? customers.findById(sale.customerId) : null;
  const settings = SettingsHelper.getFor(req.ownerId);
  generateSaleReceiptPDF(res, { sale, customer, settings });
}

module.exports = { listSales, createSale, getSale, downloadReceiptPDF };
