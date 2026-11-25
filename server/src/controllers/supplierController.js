const { suppliers } = require('../db');

async function listSuppliers(req, res) {
  const list = suppliers.find((s) => s.ownerId === req.ownerId).sort((a, b) => a.name.localeCompare(b.name));
  res.json(list);
}
async function createSupplier(req, res) {
  const supplier = suppliers.insert({ ...req.body, ownerId: req.ownerId });
  res.status(201).json(supplier);
}
async function updateSupplier(req, res) {
  const existing = suppliers.findOne((s) => s._id === req.params.id && s.ownerId === req.ownerId);
  if (!existing) return res.status(404).json({ message: 'المورد غير موجود' });
  const updated = suppliers.updateById(req.params.id, req.body);
  res.json(updated);
}
async function deleteSupplier(req, res) {
  const existing = suppliers.findOne((s) => s._id === req.params.id && s.ownerId === req.ownerId);
  if (!existing) return res.status(404).json({ message: 'المورد غير موجود' });
  suppliers.deleteById(req.params.id);
  res.json({ message: 'تم الحذف' });
}
module.exports = { listSuppliers, createSupplier, updateSupplier, deleteSupplier };
