require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',

  demoUsername: process.env.DEMO_USERNAME || 'tap',
  demoPassword: process.env.DEMO_PASSWORD || 'CHANGE_ME',
  demoName: process.env.DEMO_NAME || 'صيدلي مسؤول',
  demoPharmacyName: process.env.DEMO_PHARMACY_NAME || 'صيدلية الشفاء',

  brandingCredit: process.env.BRANDING_CREDIT || '',
};
