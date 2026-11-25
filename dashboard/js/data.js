// Pharmacy Pro System - Data Layer
const PharmacyData = {
    medicines: [
        { id: 1, name: "باراسيتامول 500mg", category: "مسكنات", barcode: "6281001234567", price: 15.50, cost: 8.00, stock: 245, minStock: 50, expiry: "2027-06-15", supplier: "فارماكو", tax: 0.05 },
        { id: 2, name: "أموكسيسيلين 500mg", category: "مضادات حيوية", barcode: "6281001234568", price: 45.00, cost: 25.00, stock: 120, minStock: 30, expiry: "2026-12-20", supplier: "جلوبال فارما", tax: 0.05 },
        { id: 3, name: "أوميبرازول 20mg", category: "مضادات الحموضة", barcode: "6281001234569", price: 32.00, cost: 18.00, stock: 89, minStock: 25, expiry: "2027-03-10", supplier: "ميديكال كير", tax: 0.05 },
        { id: 4, name: "فيتامين د3 1000IU", category: "فيتامينات", barcode: "6281001234570", price: 28.00, cost: 14.00, stock: 340, minStock: 60, expiry: "2028-01-01", supplier: "فارماكو", tax: 0.05 },
        { id: 5, name: "سيتريزين 10mg", category: "مضادات الحساسية", barcode: "6281001234571", price: 18.00, cost: 9.00, stock: 15, minStock: 40, expiry: "2026-09-30", supplier: "جلوبال فارما", tax: 0.05 },
        { id: 6, name: "ميتفورمين 500mg", category: "أدوية السكري", barcode: "6281001234572", price: 55.00, cost: 30.00, stock: 78, minStock: 20, expiry: "2027-08-15", supplier: "ميديكال كير", tax: 0.05 },
        { id: 7, name: "أتورفاستاتين 20mg", category: "أدوية القلب", barcode: "6281001234573", price: 65.00, cost: 35.00, stock: 56, minStock: 20, expiry: "2027-05-20", supplier: "فارماكو", tax: 0.05 },
        { id: 8, name: "إيبوبروفين 400mg", category: "مسكنات", barcode: "6281001234574", price: 12.00, cost: 6.00, stock: 420, minStock: 80, expiry: "2027-11-01", supplier: "جلوبال فارما", tax: 0.05 },
        { id: 9, name: "لوراتادين 10mg", category: "مضادات الحساسية", barcode: "6281001234575", price: 22.00, cost: 11.00, stock: 200, minStock: 50, expiry: "2027-04-15", supplier: "ميديكال كير", tax: 0.05 },
        { id: 10, name: "أزيثرومايسين 500mg", category: "مضادات حيوية", barcode: "6281001234576", price: 58.00, cost: 32.00, stock: 67, minStock: 20, expiry: "2026-11-30", supplier: "فارماكو", tax: 0.05 },
        { id: 11, name: "أنسولين سريع", category: "أدوية السكري", barcode: "6281001234577", price: 120.00, cost: 75.00, stock: 45, minStock: 15, expiry: "2026-10-15", supplier: "نوفو نورديسك", tax: 0.05 },
        { id: 12, name: "أوميغا 3", category: "مكملات غذائية", barcode: "6281001234578", price: 85.00, cost: 45.00, stock: 150, minStock: 40, expiry: "2028-03-01", supplier: "جلوبال فارما", tax: 0.05 },
        { id: 13, name: "بانادول إكسترا", category: "مسكنات", barcode: "6281001234579", price: 25.00, cost: 13.00, stock: 300, minStock: 60, expiry: "2027-07-20", supplier: "فارماكو", tax: 0.05 },
        { id: 14, name: "فيتامين سي 1000mg", category: "فيتامينات", barcode: "6281001234580", price: 35.00, cost: 18.00, stock: 180, minStock: 50, expiry: "2028-06-01", supplier: "ميديكال كير", tax: 0.05 },
        { id: 15, name: "لوسارتان 50mg", category: "أدوية القلب", barcode: "6281001234581", price: 42.00, cost: 22.00, stock: 95, minStock: 25, expiry: "2027-09-15", supplier: "جلوبال فارما", tax: 0.05 },
    ],

    categories: ["مسكنات", "مضادات حيوية", "مضادات الحموضة", "فيتامينات", "مضادات الحساسية", "أدوية السكري", "أدوية القلب", "مكملات غذائية"],

    sales: [
        { id: 1, date: "2026-08-01", items: [{name: "باراسيتامول 500mg", qty: 2, price: 15.50}, {name: "فيتامين د3 1000IU", qty: 1, price: 28.00}], total: 59.00, tax: 2.95, customer: "أحمد محمد", payment: "نقدي" },
        { id: 2, date: "2026-08-01", items: [{name: "أموكسيسيلين 500mg", qty: 1, price: 45.00}], total: 45.00, tax: 2.25, customer: "سارة علي", payment: "بطاقة" },
        { id: 3, date: "2026-08-02", items: [{name: "أوميبرازول 20mg", qty: 2, price: 32.00}, {name: "سيتريزين 10mg", qty: 1, price: 18.00}], total: 82.00, tax: 4.10, customer: "محمد خالد", payment: "نقدي" },
        { id: 4, date: "2026-08-02", items: [{name: "إيبوبروفين 400mg", qty: 3, price: 12.00}, {name: "بانادول إكسترا", qty: 2, price: 25.00}], total: 86.00, tax: 4.30, customer: "فاطمة أحمد", payment: "بطاقة" },
        { id: 5, date: "2026-08-03", items: [{name: "ميتفورمين 500mg", qty: 1, price: 55.00}], total: 55.00, tax: 2.75, customer: "خالد عمر", payment: "نقدي" },
        { id: 6, date: "2026-08-03", items: [{name: "أتورفاستاتين 20mg", qty: 1, price: 65.00}, {name: "لوسارتان 50mg", qty: 1, price: 42.00}], total: 107.00, tax: 5.35, customer: "نورة سعد", payment: "بطاقة" },
        { id: 7, date: "2026-08-04", items: [{name: "أوميغا 3", qty: 2, price: 85.00}, {name: "فيتامين سي 1000mg", qty: 1, price: 35.00}], total: 205.00, tax: 10.25, customer: "عمر حسن", payment: "نقدي" },
        { id: 8, date: "2026-08-04", items: [{name: "أزيثرومايسين 500mg", qty: 1, price: 58.00}], total: 58.00, tax: 2.90, customer: "ليلى محمود", payment: "بطاقة" },
        { id: 9, date: "2026-08-05", items: [{name: "باراسيتامول 500mg", qty: 1, price: 15.50}, {name: "إيبوبروفين 400mg", qty: 2, price: 12.00}], total: 39.50, tax: 1.98, customer: "يوسف إبراهيم", payment: "نقدي" },
        { id: 10, date: "2026-08-05", items: [{name: "أنسولين سريع", qty: 2, price: 120.00}], total: 240.00, tax: 12.00, customer: "هند عبدالله", payment: "بطاقة" },
        { id: 11, date: "2026-08-06", items: [{name: "لوراتادين 10mg", qty: 1, price: 22.00}, {name: "سيتريزين 10mg", qty: 1, price: 18.00}], total: 40.00, tax: 2.00, customer: "سامي رشيد", payment: "نقدي" },
        { id: 12, date: "2026-08-06", items: [{name: "فيتامين د3 1000IU", qty: 3, price: 28.00}], total: 84.00, tax: 4.20, customer: "رنا طارق", payment: "بطاقة" },
    ],

    suppliers: [
        { id: 1, name: "فارماكو", phone: "+966501234567", email: "info@pharmaco.com", address: "الرياض، السعودية", balance: 12500 },
        { id: 2, name: "جلوبال فارما", phone: "+966502345678", email: "contact@globalpharma.com", address: "جدة، السعودية", balance: 8900 },
        { id: 3, name: "ميديكال كير", phone: "+966503456789", email: "sales@medicalcare.com", address: "الدمام، السعودية", balance: 5600 },
        { id: 4, name: "نوفو نورديسك", phone: "+966504567890", email: "me@novonordisk.com", address: "الرياض، السعودية", balance: 23400 },
    ],

    customers: [
        { id: 1, name: "أحمد محمد", phone: "+966501111111", visits: 12, totalSpent: 1250 },
        { id: 2, name: "سارة علي", phone: "+966502222222", visits: 8, totalSpent: 890 },
        { id: 3, name: "محمد خالد", phone: "+966503333333", visits: 15, totalSpent: 2100 },
        { id: 4, name: "فاطمة أحمد", phone: "+966504444444", visits: 6, totalSpent: 450 },
        { id: 5, name: "خالد عمر", phone: "+966505555555", visits: 20, totalSpent: 3400 },
    ],

    alerts: [
        { id: 1, type: "stock", message: "سيتريزين 10mg - المخزون منخفض (15 قطعة)", priority: "high", date: "2026-08-07" },
        { id: 2, type: "expiry", message: "أموكسيسيلين 500mg - تنتهي صلاحيته بعد 4 أشهر", priority: "medium", date: "2026-08-07" },
        { id: 3, type: "expiry", message: "أزيثرومايسين 500mg - تنتهي صلاحيته بعد 3 أشهر", priority: "medium", date: "2026-08-07" },
        { id: 4, type: "stock", message: "أنسولين سريع - المخزون منخفض (45 قطعة)", priority: "high", date: "2026-08-07" },
    ],

    expenses: [
        { id: 1, date: "2026-08-01", category: "رواتب", amount: 15000, description: "رواتب الموظفين" },
        { id: 2, date: "2026-08-02", category: "إيجار", amount: 5000, description: "إيجار المحل الشهري" },
        { id: 3, date: "2026-08-03", category: "كهرباء", amount: 850, description: "فاتورة الكهرباء" },
        { id: 4, date: "2026-08-04", category: "صيانة", amount: 1200, description: "صيانة معدات" },
        { id: 5, date: "2026-08-05", category: "تسويق", amount: 2000, description: "حملة إعلانية" },
    ],

    getLowStock() { return this.medicines.filter(m => m.stock <= m.minStock); },
    getExpiringSoon(days = 90) {
        const now = new Date();
        return this.medicines.filter(m => {
            const diff = new Date(m.expiry) - now;
            return diff > 0 && diff < days * 24 * 60 * 60 * 1000;
        });
    },
    getTotalStockValue() {
        return this.medicines.reduce((sum, m) => sum + (m.stock * m.cost), 0);
    },
    getTotalSalesValue() {
        return this.sales.reduce((sum, s) => sum + s.total, 0);
    },
    getTotalTax() {
        return this.sales.reduce((sum, s) => sum + s.tax, 0);
    },
    getDailySales(date) {
        return this.sales.filter(s => s.date === date).reduce((sum, s) => sum + s.total, 0);
    }
};

// Save/load from localStorage
if (!localStorage.getItem('pharmacy_data')) {
    localStorage.setItem('pharmacy_data', JSON.stringify(PharmacyData));
}

function getData() {
    return JSON.parse(localStorage.getItem('pharmacy_data'));
}

function saveData(data) {
    localStorage.setItem('pharmacy_data', JSON.stringify(data));
}
