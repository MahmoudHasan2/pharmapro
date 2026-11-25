const { purchaseOrders } = require('../db');

function generatePONumber() {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const count = purchaseOrders.count((o) => o.poNumber && o.poNumber.startsWith(prefix));
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}
module.exports = generatePONumber;
