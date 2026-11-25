const bcrypt = require('bcryptjs');
const { owners, pharmacySettings, medications, staff, customers, suppliers, purchaseOrders } = require('../db');
const { demoUsername, demoPassword, demoName, demoPharmacyName } = require('../config');

async function ensureDemoOwner() {
  const existing = owners.count();
  if (existing > 0) return;

  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const owner = owners.insert({
    name: demoName,
    username: demoUsername.toLowerCase(),
    passwordHash,
    pharmacyName: demoPharmacyName,
    phone: '',
    email: '',
    isActive: true,
    failedLoginAttempts: 0,
    lockUntil: null,
  });

  pharmacySettings.insert({
    ownerId: owner._id,
    pharmacyName: demoPharmacyName,
    logoUrl: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
    workingHours: '8:00 - 22:00',
    currency: 'USD',
    lowStockThresholdDefault: 10,
    expiryWarningDays: 60,
    autoAlerts: true,
    expiryAlerts: true,
    autoBackup: false,
    maintenanceMode: false,
    printPaperSize: '80mm',
    invoiceFooterNote: 'شكراً لزيارتكم',
  });

  const staffMembers = [
    { name: 'صيدلاني أول', role: 'صيدلاني', phone: '' },
    { name: 'كاشير', role: 'موظف كاشير', phone: '' },
  ].map((s) => staff.insert({ ...s, ownerId: owner._id, isActive: true }));

  const supplierList = [
    { name: 'شركة الدواء الحديثة', phone: '', notes: '' },
    { name: 'مؤسسة الصحة للأدوية', phone: '', notes: '' },
  ].map((s) => suppliers.insert({ ...s, ownerId: owner._id }));

  const today = new Date();
  const inMonths = (n) => new Date(today.getFullYear(), today.getMonth() + n, today.getDate()).toISOString();

  const defaultMeds = [
    { name: 'باراسيتامول 500mg', category: 'مسكنات', manufacturer: 'Pharma Co', unit: 'علبة', costPrice: 1, salePrice: 2.5, stockQty: 120, lowStockThreshold: 20, batchNumber: 'B-2201', expiryDate: inMonths(18) },
    { name: 'أموكسيسيلين 500mg', category: 'مضادات حيوية', manufacturer: 'MediPharm', unit: 'علبة', costPrice: 3, salePrice: 6, stockQty: 60, lowStockThreshold: 15, batchNumber: 'B-2202', expiryDate: inMonths(10) },
    { name: 'فيتامين D3', category: 'فيتامينات', manufacturer: 'HealthLine', unit: 'علبة', costPrice: 4, salePrice: 9, stockQty: 8, lowStockThreshold: 10, batchNumber: 'B-2203', expiryDate: inMonths(24) },
    { name: 'شراب سعال للأطفال', category: 'أطفال', manufacturer: 'KidsCare', unit: 'زجاجة', costPrice: 2.5, salePrice: 5.5, stockQty: 5, lowStockThreshold: 10, batchNumber: 'B-2204', expiryDate: inMonths(1) },
    { name: 'كريم مرطب للبشرة', category: 'عناية بالبشرة', manufacturer: 'DermaCare', unit: 'أنبوب', costPrice: 3.5, salePrice: 8, stockQty: 40, lowStockThreshold: 10, batchNumber: 'B-2205', expiryDate: inMonths(20) },
    { name: 'أسبرين 100mg', category: 'مسكنات', manufacturer: 'Pharma Co', unit: 'علبة', costPrice: 1.2, salePrice: 3, stockQty: 90, lowStockThreshold: 15, batchNumber: 'B-2206', expiryDate: inMonths(15) },
  ];
  defaultMeds.forEach((m) => medications.insert({ ...m, ownerId: owner._id }));

  const customerList = [
    { fullName: 'زبون نقدي عام', phone: '' },
    { fullName: 'سارة أحمد', phone: '0151 00000000' },
  ].map((c) => customers.insert({ ...c, ownerId: owner._id }));

  const orderList = [
    {
      poNumber: 'ORD-2026-0001',
      supplierId: supplierList[0]._id,
      items: [{ name: 'باراسيتامول 500mg', quantity: 50, unitCost: 1 }, { name: 'أموكسيسيلين 500mg', quantity: 30, unitCost: 3 }],
      totalAmount: 140,
      status: 'completed',
      notes: '',
    },
    {
      poNumber: 'ORD-2026-0002',
      supplierId: supplierList[1]._id,
      items: [{ name: 'فيتامين D3', quantity: 40, unitCost: 4 }],
      totalAmount: 160,
      status: 'pending',
      notes: '',
    },
  ].map((o) => purchaseOrders.insert({ ...o, ownerId: owner._id }));

  console.log('[Seed] Demo pharmacy owner account created automatically:');
  console.log(`[Seed]   username: ${owner.username}`);
  console.log(`[Seed]   password: ${demoPassword}`);
  console.log(`[Seed]   staff: ${staffMembers.length}, suppliers: ${supplierList.length}, medications: ${defaultMeds.length}, customers: ${customerList.length}, orders: ${orderList.length}`);
  console.log('[Seed] Change this password from the app once you have real users.');
}

module.exports = ensureDemoOwner;
