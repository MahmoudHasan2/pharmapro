const { sales } = require('../db');

function generateSaleNumber() {
  const year = new Date().getFullYear();
  const prefix = `SALE-${year}-`;
  const count = sales.count((s) => s.saleNumber && s.saleNumber.startsWith(prefix));
  return `${prefix}${String(count + 1).padStart(5, '0')}`;
}
module.exports = generateSaleNumber;
