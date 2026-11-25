const { pharmacySettings } = require('../db');

function getFor(ownerId) {
  let settings = pharmacySettings.findOne((s) => s.ownerId === ownerId);
  if (!settings) {
    settings = pharmacySettings.insert({
      ownerId,
      pharmacyName: '',
      logoUrl: '',
      address: '',
      phone: '',
      workingHours: '8:00 - 22:00',
      currency: 'USD',
      lowStockThresholdDefault: 10,
      expiryWarningDays: 60,
      licenseNumber: '',
      email: '',
      autoAlerts: true,
      expiryAlerts: true,
      autoBackup: false,
      maintenanceMode: false,
    });
  }
  return settings;
}

module.exports = { getFor };
