const { customers, sales } = require('../db');

async function listCustomers(req, res) {
  const { search } = req.query;
  let list = customers.find((c) => c.ownerId === req.ownerId);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((c) => c.fullName.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q));
  }
  list.sort((a, b) => a.fullName.localeCompare(b.fullName));
  res.json(list);
}

async function createCustomer(req, res) {
  const customer = customers.insert({ ...req.body, ownerId: req.ownerId });
  res.status(201).json(customer);
}

async function updateCustomer(req, res) {
  const existing = customers.findOne((c) => c._id === req.params.id && c.ownerId === req.ownerId);
  if (!existing) return res.status(404).json({ message: 'الزبون غير موجود' });
  const updated = customers.updateById(req.params.id, req.body);
  res.json(updated);
}

async function deleteCustomer(req, res) {
  const existing = customers.findOne((c) => c._id === req.params.id && c.ownerId === req.ownerId);
  if (!existing) return res.status(404).json({ message: 'الزبون غير موجود' });
  customers.deleteById(req.params.id);
  res.json({ message: 'تم الحذف' });
}

async function purchaseHistory(req, res) {
  const list = sales.find((s) => s.customerId === req.params.id && s.ownerId === req.ownerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
}

module.exports = { listCustomers, createCustomer, updateCustomer, deleteCustomer, purchaseHistory };
