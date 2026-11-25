const { medications, stockMovements } = require('../db');

function withStatus(med) {
  const now = new Date();
  const expiryDate = med.expiryDate ? new Date(med.expiryDate) : null;
  const daysToExpiry = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : null;
  return {
    ...med,
    lowStock: med.stockQty <= (med.lowStockThreshold || 10),
    expiringSoon: daysToExpiry !== null && daysToExpiry <= 60 && daysToExpiry >= 0,
    expired: daysToExpiry !== null && daysToExpiry < 0,
    daysToExpiry,
  };
}

// GET /api/medications?search=&category=&lowStockOnly=&expiringOnly=
async function listMedications(req, res) {
  const { search, category, lowStockOnly, expiringOnly } = req.query;
  let list = medications.find((m) => m.ownerId === req.ownerId);
  if (category) list = list.filter((m) => m.category === category);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((m) => m.name.toLowerCase().includes(q) || (m.manufacturer || '').toLowerCase().includes(q) || (m.barcode || '').toLowerCase().includes(q));
  }
  list = list.map(withStatus);
  if (lowStockOnly === 'true') list = list.filter((m) => m.lowStock);
  if (expiringOnly === 'true') list = list.filter((m) => m.expiringSoon || m.expired);
  list.sort((a, b) => a.name.localeCompare(b.name));
  res.json(list);
}

async function getMedication(req, res) {
  const med = medications.findOne((m) => m._id === req.params.id && m.ownerId === req.ownerId);
  if (!med) return res.status(404).json({ message: 'الدواء غير موجود' });
  res.json(withStatus(med));
}

async function createMedication(req, res) {
  const med = medications.insert({ ...req.body, ownerId: req.ownerId, stockQty: req.body.stockQty || 0 });
  res.status(201).json(withStatus(med));
}

async function updateMedication(req, res) {
  const existing = medications.findOne((m) => m._id === req.params.id && m.ownerId === req.ownerId);
  if (!existing) return res.status(404).json({ message: 'الدواء غير موجود' });
  const updated = medications.updateById(req.params.id, req.body);
  res.json(withStatus(updated));
}

async function deleteMedication(req, res) {
  const existing = medications.findOne((m) => m._id === req.params.id && m.ownerId === req.ownerId);
  if (!existing) return res.status(404).json({ message: 'الدواء غير موجود' });
  medications.deleteById(req.params.id);
  res.json({ message: 'تم حذف الدواء' });
}

// POST /api/medications/:id/adjust-stock  { change, reason }
async function adjustStock(req, res) {
  const med = medications.findOne((m) => m._id === req.params.id && m.ownerId === req.ownerId);
  if (!med) return res.status(404).json({ message: 'الدواء غير موجود' });
  const { change, reason } = req.body;
  if (!change || typeof change !== 'number') return res.status(400).json({ message: 'مقدار التغيير مطلوب' });

  const newQty = Math.max(0, med.stockQty + change);
  const updated = medications.updateById(med._id, { stockQty: newQty });
  const movement = stockMovements.insert({ ownerId: req.ownerId, medicationId: med._id, change, reason: reason || '', resultingQty: newQty });
  res.json({ medication: withStatus(updated), movement });
}

async function listMovements(req, res) {
  const list = stockMovements.find((m) => m.medicationId === req.params.id && m.ownerId === req.ownerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
}

module.exports = { listMedications, getMedication, createMedication, updateMedication, deleteMedication, adjustStock, listMovements };
