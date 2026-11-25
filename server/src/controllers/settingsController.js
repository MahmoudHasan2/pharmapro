const fs = require('fs');
const path = require('path');
const { pharmacySettings } = require('../db');
const SettingsHelper = require('./_settingsHelper');

async function getSettings(req, res) {
  res.json(SettingsHelper.getFor(req.ownerId));
}

async function updateSettings(req, res) {
  const current = SettingsHelper.getFor(req.ownerId);
  const updated = pharmacySettings.updateById(current._id, req.body);
  res.json(updated);
}

async function uploadLogo(req, res) {
  if (!req.file) return res.status(400).json({ message: 'لم يتم إرفاق ملف الشعار' });
  const current = SettingsHelper.getFor(req.ownerId);
  if (current.logoUrl) {
    const oldFilename = current.logoUrl.split('/uploads/')[1];
    if (oldFilename) fs.unlink(path.join(__dirname, '..', 'uploads', oldFilename), () => {});
  }
  const updated = pharmacySettings.updateById(current._id, { logoUrl: `/uploads/${req.file.filename}` });
  res.json(updated);
}

module.exports = { getSettings, updateSettings, uploadLogo };
