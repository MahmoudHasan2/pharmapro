const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { shape } = require('./arabicText');

const COLORS = { dark: '#102032', purple: '#8767AA', gray: '#4B5563' };
const FONT_REGULAR = path.join(__dirname, '..', 'assets', 'fonts', 'Amiri-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '..', 'assets', 'fonts', 'Amiri-Bold.ttf');

function newDoc() {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  doc.registerFont('Amiri', FONT_REGULAR);
  doc.registerFont('Amiri-Bold', FONT_BOLD);
  doc.font('Amiri');
  return doc;
}

function T(doc, text, x, y, options = {}) {
  doc.text(shape(text), x, y, { align: 'right', ...options });
}

function resolveUploadPath(url) {
  if (!url) return null;
  const filename = url.split('/uploads/')[1];
  if (!filename) return null;
  const full = path.join(__dirname, '..', 'uploads', filename);
  return fs.existsSync(full) ? full : null;
}

function drawHeader(doc, settings, title) {
  const logoPath = resolveUploadPath(settings?.logoUrl);
  if (logoPath) {
    try { doc.image(logoPath, 480, 40, { width: 55, height: 55, fit: [55, 55] }); } catch {}
  }
  doc.font('Amiri-Bold').fillColor(COLORS.dark).fontSize(18);
  T(doc, settings?.pharmacyName || 'صيدلية', 50, 45, { width: 420 });
  doc.font('Amiri').fillColor(COLORS.gray).fontSize(9);
  T(doc, settings?.address || '', 50, 68, { width: 420 });
  doc.text(settings?.phone || '', 50, 82, { width: 420, align: 'right' });
  doc.font('Amiri-Bold').fillColor(COLORS.purple).fontSize(14);
  T(doc, title, 50, 112, { width: 495 });
  doc.strokeColor(COLORS.purple).lineWidth(1.5).moveTo(50, 138).lineTo(545, 138).stroke();
  doc.font('Amiri').fillColor(COLORS.dark).fontSize(10);
  doc.y = 150;
}

function drawFooter(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.font('Amiri').fillColor(COLORS.gray).fontSize(7.5);
    doc.text(`Generated ${new Date().toLocaleDateString('en-GB')}`, 50, 765, { width: 495, align: 'center', lineBreak: false });
  }
}

function sectionTitle(doc, title) {
  doc.moveDown(0.6);
  doc.font('Amiri-Bold').fillColor(COLORS.purple).fontSize(12);
  T(doc, title, 50, doc.y, { width: 495 });
  doc.moveDown(0.3);
  doc.strokeColor(COLORS.purple).lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.4);
  doc.font('Amiri').fillColor(COLORS.dark).fontSize(10);
}

function contentDispositionFilename(rawName, ext = 'pdf') {
  const asciiSafe = rawName.replace(/[^\x20-\x7E]/g, '').replace(/[^\w.-]+/g, '_') || 'file';
  const encoded = encodeURIComponent(`${rawName}.${ext}`);
  return `attachment; filename="${asciiSafe}.${ext}"; filename*=UTF-8''${encoded}`;
}

// ---- Sale receipt PDF ----
function generateSaleReceiptPDF(res, { sale, customer, settings }) {
  const doc = newDoc();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', contentDispositionFilename(sale.saleNumber));
  doc.pipe(res);

  drawHeader(doc, settings, `فاتورة بيع رقم ${sale.saleNumber}`);

  doc.font('Amiri').fillColor(COLORS.dark).fontSize(10);
  T(doc, `الزبون: ${customer?.fullName || 'زبون نقدي'}`, 50, doc.y, { width: 495 });
  doc.moveDown(0.2);
  T(doc, `التاريخ: ${new Date(sale.createdAt).toLocaleDateString('en-GB')}`, 50, doc.y, { width: 495 });
  doc.moveDown(1);

  const tableTop = doc.y;
  doc.font('Amiri-Bold').fillColor(COLORS.purple).fontSize(10);
  T(doc, 'الإجمالي', 460, tableTop, { width: 80 });
  T(doc, 'الكمية', 370, tableTop, { width: 80 });
  T(doc, 'السعر', 280, tableTop, { width: 80 });
  T(doc, 'الدواء', 50, tableTop, { width: 220 });
  doc.moveTo(50, tableTop + 16).lineTo(545, tableTop + 16).strokeColor(COLORS.gray).stroke();

  let y = tableTop + 24;
  doc.font('Amiri').fillColor(COLORS.dark).fontSize(10);
  sale.items.forEach((item) => {
    const lineTotal = (item.price * item.quantity).toFixed(2);
    doc.text(`$${lineTotal}`, 460, y, { width: 80, align: 'right' });
    doc.text(`${item.quantity}`, 370, y, { width: 80, align: 'right' });
    doc.text(`$${item.price}`, 280, y, { width: 80, align: 'right' });
    T(doc, item.medicationName || '-', 50, y, { width: 220 });
    y += 20;
  });

  y += 8;
  doc.moveTo(50, y).lineTo(545, y).strokeColor(COLORS.gray).stroke();
  y += 14;
  doc.font('Amiri-Bold').fillColor(COLORS.purple).fontSize(13);
  doc.text(`$${sale.total}`, 460, y, { width: 80, align: 'right' });
  T(doc, 'الإجمالي', 300, y, { width: 150 });

  drawFooter(doc);
  doc.end();
}

// ---- Expiry / inventory report PDF ----
function generateExpiryReportPDF(res, { medications, settings }) {
  const doc = newDoc();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', contentDispositionFilename('expiry-report'));
  doc.pipe(res);

  drawHeader(doc, settings, 'تقرير الأدوية القريبة من انتهاء الصلاحية');

  let y = doc.y;
  doc.font('Amiri-Bold').fillColor(COLORS.purple).fontSize(10);
  T(doc, 'الكمية', 400, y, { width: 80 });
  T(doc, 'تاريخ الانتهاء', 250, y, { width: 140 });
  T(doc, 'اسم الدواء', 50, y, { width: 190 });
  doc.moveTo(50, y + 16).lineTo(545, y + 16).strokeColor(COLORS.gray).stroke();
  y += 24;
  doc.font('Amiri').fillColor(COLORS.dark).fontSize(10);
  medications.forEach((m) => {
    if (y > 750) { doc.addPage(); y = 60; }
    doc.text(`${m.stockQty}`, 400, y, { width: 80, align: 'right' });
    doc.text(m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('en-GB') : '-', 250, y, { width: 140, align: 'right' });
    T(doc, m.name, 50, y, { width: 190 });
    y += 20;
  });

  drawFooter(doc);
  doc.end();
}

// ---- Financial report PDF ----
function generateFinancialReportPDF(res, { revenueData, period, topMedications, settings }) {
  const doc = newDoc();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', contentDispositionFilename(`financial-report-${period}`));
  doc.pipe(res);

  drawHeader(doc, settings, `التقرير المالي (${period})`);

  sectionTitle(doc, 'الإيرادات حسب الفترة');
  let y = doc.y;
  revenueData.forEach((r) => {
    if (y > 750) { doc.addPage(); y = 60; }
    doc.font('Amiri-Bold').fillColor(COLORS.dark).fontSize(10);
    doc.text(`$${r.total}`, 460, y, { width: 80, align: 'right' });
    doc.font('Amiri').fillColor(COLORS.dark).fontSize(10);
    T(doc, r.label, 50, y, { width: 300 });
    y += 18;
  });

  const totalRevenue = revenueData.reduce((s, r) => s + r.total, 0);
  y += 8;
  doc.moveTo(50, y).lineTo(545, y).strokeColor(COLORS.gray).stroke();
  y += 14;
  doc.font('Amiri-Bold').fillColor(COLORS.purple).fontSize(12);
  doc.text(`$${totalRevenue}`, 460, y, { width: 80, align: 'right' });
  T(doc, 'الإجمالي', 50, y, { width: 300 });

  doc.y = y + 40;
  sectionTitle(doc, 'أكثر الأدوية مبيعاً');
  y = doc.y;
  topMedications.forEach((t) => {
    if (y > 750) { doc.addPage(); y = 60; }
    doc.font('Amiri-Bold').fillColor(COLORS.dark).fontSize(10);
    doc.text(`$${t.revenue}`, 460, y, { width: 80, align: 'right' });
    doc.font('Amiri').fillColor(COLORS.dark).fontSize(10);
    T(doc, `${t.count} مرة`, 300, y, { width: 100 });
    T(doc, t.name || '-', 50, y, { width: 220 });
    y += 18;
  });

  drawFooter(doc);
  doc.end();
}

module.exports = { generateSaleReceiptPDF, generateExpiryReportPDF, generateFinancialReportPDF };
