const { purchaseOrders, suppliers, medications, stockMovements } = require('../db');
const generatePONumber = require('../utils/generatePONumber');

function withSupplier(order) {
  const supplier = order.supplierId ? suppliers.findById(order.supplierId) : null;
  return { ...order, supplierId: supplier ? { _id: supplier._id, name: supplier.name } : null };
}

// GET /api/purchase-orders
async function listOrders(req, res) {
  const list = purchaseOrders.find((o) => o.ownerId === req.ownerId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list.map(withSupplier));
}

// POST /api/purchase-orders  { supplierId, items:[{name,quantity,unitCost}], expectedDate, notes }
async function createOrder(req, res) {
  const { supplierId, items, expectedDate, notes } = req.body;
  if (!items || !items.length) return res.status(400).json({ message: 'لازم صنف واحد على الأقل بالطلبية' });
  const totalAmount = items.reduce((sum, it) => sum + (it.unitCost || 0) * (it.quantity || 0), 0);

  const order = purchaseOrders.insert({
    ownerId: req.ownerId,
    poNumber: generatePONumber(),
    supplierId: supplierId || null,
    items,
    totalAmount,
    expectedDate: expectedDate || null,
    status: 'pending',
    notes: notes || '',
  });
  res.status(201).json(withSupplier(order));
}

// PATCH /api/purchase-orders/:id/status  { status }
// Marking an order "completed" restocks each medication it contains
// (matched by medication name) and logs a stock movement for each.
async function updateStatus(req, res) {
  const order = purchaseOrders.findOne((o) => o._id === req.params.id && o.ownerId === req.ownerId);
  if (!order) return res.status(404).json({ message: 'الطلبية غير موجودة' });

  const { status } = req.body;
  if (status === 'completed' && order.status !== 'completed') {
    order.items.forEach((item) => {
      const med = medications.findOne((m) => m.name === item.name && m.ownerId === req.ownerId);
      if (med) {
        const newQty = med.stockQty + (item.quantity || 0);
        medications.updateById(med._id, { stockQty: newQty });
        stockMovements.insert({
          ownerId: req.ownerId,
          medicationId: med._id,
          change: item.quantity,
          reason: `توريد طلبية ${order.poNumber}`,
          resultingQty: newQty,
        });
      }
    });
  }

  const updated = purchaseOrders.updateById(order._id, { status });
  res.json(withSupplier(updated));
}

async function deleteOrder(req, res) {
  const existing = purchaseOrders.findOne((o) => o._id === req.params.id && o.ownerId === req.ownerId);
  if (!existing) return res.status(404).json({ message: 'الطلبية غير موجودة' });
  purchaseOrders.deleteById(req.params.id);
  res.json({ message: 'تم الحذف' });
}

module.exports = { listOrders, createOrder, updateStatus, deleteOrder };
