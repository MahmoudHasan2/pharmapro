const path = require('path');
const JsonStore = require('./jsonStore');

const dataDir = path.join(__dirname, '..', 'data');

module.exports = {
  owners: new JsonStore('owners', dataDir),
  staff: new JsonStore('staff', dataDir),
  customers: new JsonStore('customers', dataDir),
  suppliers: new JsonStore('suppliers', dataDir),
  medications: new JsonStore('medications', dataDir),
  stockMovements: new JsonStore('stockMovements', dataDir),
  sales: new JsonStore('sales', dataDir),
  purchaseOrders: new JsonStore('purchaseOrders', dataDir),
  pharmacySettings: new JsonStore('pharmacySettings', dataDir),
};
