const { staff } = require('../db');

async function listStaff(req, res) {
  const list = staff.find((s) => s.ownerId === req.ownerId).sort((a, b) => a.name.localeCompare(b.name));
  res.json(list);
}
async function createStaff(req, res) {
  const member = staff.insert({ ...req.body, ownerId: req.ownerId, isActive: true });
  res.status(201).json(member);
}
async function updateStaff(req, res) {
  const existing = staff.findOne((s) => s._id === req.params.id && s.ownerId === req.ownerId);
  if (!existing) return res.status(404).json({ message: 'العضو غير موجود' });
  const updated = staff.updateById(req.params.id, req.body);
  res.json(updated);
}
async function deleteStaff(req, res) {
  const existing = staff.findOne((s) => s._id === req.params.id && s.ownerId === req.ownerId);
  if (!existing) return res.status(404).json({ message: 'العضو غير موجود' });
  staff.deleteById(req.params.id);
  res.json({ message: 'تم الحذف' });
}
module.exports = { listStaff, createStaff, updateStaff, deleteStaff };
