// ---------------------------------------------------------------------
// Auth guard — runs before anything else renders
// ---------------------------------------------------------------------
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// ---------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------
async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    logout();
    throw new Error('انتهت الجلسة');
  }
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) throw new Error((data && data.message) || 'حدث خطأ');
  return data;
}

async function downloadFile(path, filename) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!res.ok) throw new Error('تعذر تحميل الملف');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    showToast(err.message, true);
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show${isError ? ' error' : ''}`;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ---------------------------------------------------------------------
// Navigation (sidebar sections, mobile toggle) — from the template
// ---------------------------------------------------------------------
const pageTitles = {
  dashboard: { title: 'لوحة التحكم', subtitle: 'نظرة عامة على أداء الصيدلية اليوم' },
  products: { title: 'المنتجات', subtitle: 'إدارة مخزون الأدوية والمنتجات' },
  orders: { title: 'الطلبيات', subtitle: 'متابعة طلبيات الشراء من الموردين' },
  sales: { title: 'المبيعات', subtitle: 'تحليل وإدارة المبيعات والفواتير' },
  customers: { title: 'العملاء', subtitle: 'قاعدة بيانات العملاء' },
  reports: { title: 'التقارير', subtitle: 'تقارير شاملة عن أداء الصيدلية' },
  settings: { title: 'الإعدادات', subtitle: 'إعدادات النظام والحساب' },
};

const sectionLoaders = {
  dashboard: loadDashboard,
  products: loadProducts,
  orders: loadOrders,
  sales: loadSales,
  customers: loadCustomers,
  reports: loadReports,
  settings: loadSettings,
};

function showSection(sectionId, el) {
  document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  document.querySelectorAll('.sidebar-menu a').forEach((a) => a.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[sectionId].title;
  document.getElementById('pageSubtitle').textContent = pageTitles[sectionId].subtitle;
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobileOverlay').classList.remove('active');
  }
  if (sectionLoaders[sectionId]) sectionLoaders[sectionId]();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open');
    document.getElementById('mobileOverlay').classList.toggle('active');
  } else {
    sidebar.classList.toggle('collapsed');
  }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal-overlay').forEach((m) => {
  m.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('active'); });
});

function showSettings(panelId, el) {
  document.querySelectorAll('.settings-panel').forEach((p) => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
  document.querySelectorAll('.settings-tab').forEach((t) => t.classList.remove('active'));
  el.classList.add('active');
}

// ---------------------------------------------------------------------
// Shared caches (medications/suppliers/customers are reused across
// several sections' dropdowns and tables)
// ---------------------------------------------------------------------
let medsCache = [];
let suppliersCache = [];
let customersCache = [];

async function refreshCoreCaches() {
  [medsCache, suppliersCache, customersCache] = await Promise.all([
    api('/medications'),
    api('/suppliers'),
    api('/customers'),
  ]);
}

const CATEGORY_ICONS = ['fa-shield-virus', 'fa-heartbeat', 'fa-tablets', 'fa-syringe', 'fa-allergies', 'fa-lungs', 'fa-capsules'];
const CATEGORY_COLORS = [
  { bg: 'rgba(135,103,170,0.1)', fg: '#8767aa' },
  { bg: 'rgba(243,156,18,0.1)', fg: '#f39c12' },
  { bg: 'rgba(52,152,219,0.1)', fg: '#3498db' },
  { bg: 'rgba(39,174,96,0.1)', fg: '#27ae60' },
  { bg: 'rgba(231,76,60,0.1)', fg: '#e74c3c' },
];

// ---------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------
let salesChartInstance = null;

async function loadDashboard() {
  try {
    const [summary, categories, activity] = await Promise.all([
      api('/dashboard/summary'),
      api('/dashboard/categories'),
      api('/dashboard/recent-activity'),
    ]);

    document.getElementById('statTotalMeds').textContent = summary.totalMedications;
    document.getElementById('statLowStock').textContent = summary.lowStockCount;
    document.getElementById('statOutOfStock').textContent = summary.outOfStockCount;
    document.getElementById('statTodayRevenue').textContent = `$${summary.todayRevenue}`;
    document.getElementById('alertBadge').textContent = summary.lowStockCount + summary.expiringSoonCount;

    // Cold-storage medications nearing expiry get a dedicated heads-up,
    // since spoiled refrigerated stock is a bigger loss than room-temp stock.
    const allMeds = await api('/medications');
    const now = Date.now();
    const coldExpiring = allMeds.filter((m) => m.requiresRefrigeration && m.expiryDate && (new Date(m.expiryDate) - now) / 86400000 <= 30 && (new Date(m.expiryDate) - now) >= 0);
    if (coldExpiring.length) {
      showToast(`تنبيه: ${coldExpiring.length} صنف مبرّد قرب انتهاء صلاحيته (${coldExpiring.map((m) => m.name).slice(0, 3).join('، ')})`, true);
    }
    if (summary.outOfStockCount > 0) {
      showToast(`تنبيه: ${summary.outOfStockCount} صنف نفذ من المخزون تماماً`, true);
    }

    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = categories.length
      ? categories.map((c, i) => {
          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
          const icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
          return `<div class="category-card">
            <div class="category-icon" style="background:${color.bg};color:${color.fg}"><i class="fas ${icon}"></i></div>
            <div class="category-info"><h4>${escapeHtml(c.category)}</h4><p>${c.count} منتج</p></div>
            <div class="category-count">${c.share}%</div>
          </div>`;
        }).join('')
      : '<p class="empty-note">لا توجد أقسام بعد</p>';

    const activityIcons = { sale: 'fa-check sale', stock: 'fa-box stock', alert: 'fa-calendar-times alert' };
    const list = document.getElementById('activityList');
    list.innerHTML = activity.length
      ? activity.map((a) => {
          const [icon, cls] = (activityIcons[a.type] || 'fa-info order').split(' ');
          return `<li class="activity-item">
            <div class="activity-icon ${cls}"><i class="fas ${icon}"></i></div>
            <div class="activity-content"><h4>${escapeHtml(a.title)}</h4><p>${escapeHtml(a.detail)}</p></div>
            <span class="activity-time">${timeAgo(a.date)}</span>
          </li>`;
        }).join('')
      : '<li class="empty-note">لا توجد نشاطات بعد</li>';

    await loadRevenueChart();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function loadRevenueChart() {
  const period = document.getElementById('revenuePeriodSelect').value;
  const data = await api(`/dashboard/revenue-chart?period=${period}`);
  const ctx = document.getElementById('salesChart');
  if (salesChartInstance) salesChartInstance.destroy();
  salesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((d) => d.label),
      datasets: [{
        label: 'المبيعات ($)',
        data: data.map((d) => d.total),
        borderColor: '#8767aa',
        backgroundColor: 'rgba(135,103,170,0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8767aa',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { family: 'Cairo' } } },
        x: { grid: { display: false }, ticks: { font: { family: 'Cairo' } } },
      },
    },
  });
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------------------------------------------------------------------
// PRODUCTS
// ---------------------------------------------------------------------
async function loadProducts() {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-note">جارِ التحميل...</td></tr>';
  try {
    medsCache = await api('/medications');
    if (!medsCache.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-note">لا توجد منتجات بعد</td></tr>';
      return;
    }
    tbody.innerHTML = medsCache.map((m) => {
      let statusHtml;
      if (m.stockQty === 0) statusHtml = '<span class="status-badge status-out">نفذ</span>';
      else if (m.lowStock) statusHtml = '<span class="status-badge status-low">منخفض</span>';
      else statusHtml = '<span class="status-badge status-active">متوفر</span>';
      return `<tr>
        <td><div class="product-info"><div class="product-img"><i class="fas fa-pills"></i></div><div><div class="product-name">${escapeHtml(m.name)}</div><div class="product-id">${escapeHtml(m.manufacturer || '')}</div></div></div></td>
        <td>${escapeHtml(m.category || '—')}</td>
        <td>${m.stockQty} ${escapeHtml(m.unit || '')}</td>
        <td>$${m.salePrice}</td>
        <td>${m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('ar') : '—'}</td>
        <td>${statusHtml}</td>
        <td><div class="action-btns">
          <button class="action-btn edit" onclick="editProduct('${m._id}')"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete" onclick="deleteProduct('${m._id}')"><i class="fas fa-trash"></i></button>
        </div></td>
      </tr>`;
    }).join('');
  } catch (err) {
    showToast(err.message, true);
  }
}

function openProductModal() {
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('productModalTitle').textContent = 'إضافة منتج جديد';
  document.getElementById('productUnit').value = 'علبة';
  document.getElementById('productLowStockThreshold').value = 10;
  openModal('productModal');
}

function editProduct(id) {
  const m = medsCache.find((x) => x._id === id);
  if (!m) return;
  document.getElementById('productId').value = m._id;
  document.getElementById('productModalTitle').textContent = 'تعديل المنتج';
  document.getElementById('productName').value = m.name;
  document.getElementById('productCategory').value = m.category || '';
  document.getElementById('productManufacturer').value = m.manufacturer || '';
  document.getElementById('productUnit').value = m.unit || 'علبة';
  document.getElementById('productStockQty').value = m.stockQty;
  document.getElementById('productSalePrice').value = m.salePrice;
  document.getElementById('productCostPrice').value = m.costPrice;
  document.getElementById('productLowStockThreshold').value = m.lowStockThreshold;
  document.getElementById('productExpiryDate').value = m.expiryDate ? m.expiryDate.slice(0, 10) : '';
  document.getElementById('productBatchNumber').value = m.batchNumber || '';
  document.getElementById('productBarcode').value = m.barcode || '';
  document.getElementById('productRequiresRefrigeration').value = m.requiresRefrigeration ? 'true' : 'false';
  openModal('productModal');
}

async function deleteProduct(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
  try {
    await api(`/medications/${id}`, { method: 'DELETE' });
    showToast('تم حذف المنتج');
    loadProducts();
  } catch (err) {
    showToast(err.message, true);
  }
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const payload = {
    name: document.getElementById('productName').value,
    category: document.getElementById('productCategory').value,
    manufacturer: document.getElementById('productManufacturer').value,
    unit: document.getElementById('productUnit').value,
    stockQty: Number(document.getElementById('productStockQty').value),
    salePrice: Number(document.getElementById('productSalePrice').value),
    costPrice: Number(document.getElementById('productCostPrice').value),
    lowStockThreshold: Number(document.getElementById('productLowStockThreshold').value),
    expiryDate: document.getElementById('productExpiryDate').value || null,
    batchNumber: document.getElementById('productBatchNumber').value,
    barcode: document.getElementById('productBarcode').value.trim(),
    requiresRefrigeration: document.getElementById('productRequiresRefrigeration').value === 'true',
  };
  if (payload.barcode) {
    const dupe = medsCache.find((m) => m.barcode && m.barcode === payload.barcode && m._id !== id);
    if (dupe) { showToast(`هالباركود مستخدم مسبقاً للمنتج "${dupe.name}"`, true); return; }
  }
  try {
    if (id) await api(`/medications/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('/medications', { method: 'POST', body: JSON.stringify(payload) });
    showToast('تم الحفظ بنجاح');
    closeModal('productModal');
    loadProducts();
  } catch (err) {
    showToast(err.message, true);
  }
});

// ---------------------------------------------------------------------
// ORDERS (purchase orders from suppliers)
// ---------------------------------------------------------------------
async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-note">جارِ التحميل...</td></tr>';
  try {
    if (!suppliersCache.length) suppliersCache = await api('/suppliers');
    const orders = await api('/purchase-orders');
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-note">لا توجد طلبيات بعد</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map((o) => `<tr>
      <td><strong style="color:var(--secondary)">${o.poNumber}</strong></td>
      <td>${escapeHtml(o.supplierId?.name || '—')}</td>
      <td>${o.items.length} صنف</td>
      <td><strong>$${o.totalAmount}</strong></td>
      <td>${new Date(o.createdAt).toLocaleDateString('ar')}</td>
      <td>${o.status === 'completed' ? '<span class="status-badge status-completed">مكتملة</span>' : '<span class="status-badge status-pending">قيد التنفيذ</span>'}</td>
      <td><div class="action-btns">
        ${o.status !== 'completed' ? `<button class="action-btn view" title="تأكيد الاستلام وتحديث المخزون" onclick="completeOrder('${o._id}')"><i class="fas fa-check"></i></button>` : ''}
        <button class="action-btn delete" onclick="deleteOrder('${o._id}')"><i class="fas fa-trash"></i></button>
      </div></td>
    </tr>`).join('');
  } catch (err) {
    showToast(err.message, true);
  }
}

async function completeOrder(id) {
  if (!confirm('تأكيد استلام الطلبية؟ هذا رح يزيد كمية المنتجات بالمخزون تلقائياً.')) return;
  try {
    await api(`/purchase-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) });
    showToast('تم تأكيد الاستلام وتحديث المخزون');
    loadOrders();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function deleteOrder(id) {
  if (!confirm('هل أنت متأكد من حذف هذه الطلبية؟')) return;
  try {
    await api(`/purchase-orders/${id}`, { method: 'DELETE' });
    showToast('تم الحذف');
    loadOrders();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function openOrderModal() {
  if (!suppliersCache.length) suppliersCache = await api('/suppliers');
  const select = document.getElementById('orderSupplier');
  select.innerHTML = suppliersCache.map((s) => `<option value="${s._id}">${escapeHtml(s.name)}</option>`).join('');
  document.getElementById('orderForm').reset();
  document.getElementById('orderItemsContainer').innerHTML = '';
  addOrderItemRow();
  openModal('orderModal');
}

function addOrderItemRow() {
  if (!medsCache.length) { showToast('حمّل صفحة المنتجات مرة أولاً لتظهر بالقائمة', true); }
  const container = document.getElementById('orderItemsContainer');
  const row = document.createElement('div');
  row.className = 'form-row';
  row.style.marginBottom = '10px';
  row.innerHTML = `
    <select class="form-select order-item-name">
      <option value="">اختر منتج</option>
      ${medsCache.map((m) => `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</option>`).join('')}
    </select>
    <div style="display:flex;gap:8px">
      <input type="number" class="form-input order-item-qty" placeholder="الكمية" value="10" style="width:100px">
      <input type="number" step="0.01" class="form-input order-item-cost" placeholder="سعر الوحدة" value="1" style="width:120px">
      <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('.form-row').remove()">×</button>
    </div>`;
  container.appendChild(row);
}

document.getElementById('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const rows = document.querySelectorAll('#orderItemsContainer .form-row');
  const items = Array.from(rows).map((r) => ({
    name: r.querySelector('.order-item-name').value,
    quantity: Number(r.querySelector('.order-item-qty').value),
    unitCost: Number(r.querySelector('.order-item-cost').value),
  })).filter((it) => it.name && it.quantity > 0);

  if (!items.length) { showToast('أضف صنف واحد على الأقل', true); return; }

  try {
    await api('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: document.getElementById('orderSupplier').value,
        items,
        expectedDate: document.getElementById('orderExpectedDate').value || null,
        notes: document.getElementById('orderNotes').value,
      }),
    });
    showToast('تم إنشاء الطلبية');
    closeModal('orderModal');
    loadOrders();
  } catch (err) {
    showToast(err.message, true);
  }
});

// ---------------------------------------------------------------------
// SALES
// ---------------------------------------------------------------------
async function loadSales() {
  const tbody = document.getElementById('salesTableBody');
  tbody.innerHTML = '<tr><td colspan="6" class="empty-note">جارِ التحميل...</td></tr>';
  try {
    const [sales, topMeds] = await Promise.all([api('/sales'), api('/dashboard/top-medications')]);

    const totalValue = sales.reduce((s, x) => s + x.total, 0);
    document.getElementById('statTotalSalesValue').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('statInvoiceCount').textContent = sales.length;
    document.getElementById('statAvgInvoice').textContent = sales.length ? `$${(totalValue / sales.length).toFixed(2)}` : '$0';
    const today = new Date().toDateString();
    document.getElementById('statTodaySalesCount').textContent = sales.filter((s) => new Date(s.createdAt).toDateString() === today).length;

    const maxCount = Math.max(...topMeds.map((m) => m.count), 1);
    const progressColors = ['#8767aa', '#3498db', '#27ae60', '#f39c12', '#e74c3c'];
    document.getElementById('topProductsProgress').innerHTML = topMeds.length
      ? topMeds.map((m, i) => `<div class="progress-item">
          <div class="progress-header"><span>${escapeHtml(m.name)}</span><span>${m.count} وحدة</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round((m.count / maxCount) * 100)}%;background:${progressColors[i % progressColors.length]}"></div></div>
        </div>`).join('')
      : '<p class="empty-note">لا توجد مبيعات بعد</p>';

    tbody.innerHTML = sales.length
      ? sales.slice(0, 30).map((s) => `<tr>
          <td><strong style="color:var(--secondary)">${s.saleNumber}</strong></td>
          <td>${escapeHtml(s.customerId?.fullName || 'زبون نقدي')}</td>
          <td>${s.items.length} منتج</td>
          <td><strong>$${s.total}</strong></td>
          <td>${new Date(s.createdAt).toLocaleDateString('ar')}</td>
          <td><div class="action-btns">
            <button class="action-btn view" title="طباعة الفاتورة" onclick="printReceipt('${s._id}')"><i class="fas fa-print"></i></button>
            <button class="action-btn" title="تحميل PDF" onclick="downloadFile('/sales/${s._id}/receipt-pdf','${s.saleNumber}.pdf')"><i class="fas fa-file-pdf"></i></button>
          </div></td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="empty-note">لا توجد فواتير بعد</td></tr>';
  } catch (err) {
    showToast(err.message, true);
  }
}

async function openSaleModal() {
  if (!medsCache.length) medsCache = await api('/medications');
  if (!customersCache.length) customersCache = await api('/customers');
  const select = document.getElementById('saleCustomer');
  select.innerHTML = '<option value="">زبون نقدي</option>' + customersCache.map((c) => `<option value="${c._id}">${escapeHtml(c.fullName)}</option>`).join('');
  document.getElementById('saleForm').reset();
  document.getElementById('saleItemsContainer').innerHTML = '';
  addSaleItemRow();
  updateSaleTotal();
  openModal('saleModal');
  const scanInput = document.getElementById('saleBarcodeInput');
  scanInput.value = '';
  setTimeout(() => scanInput.focus(), 50);
}

function addSaleItemRow(preselectMedId) {
  const container = document.getElementById('saleItemsContainer');
  const row = document.createElement('div');
  row.className = 'form-row';
  row.style.marginBottom = '10px';
  row.innerHTML = `
    <select class="form-select sale-item-med" onchange="updateSaleTotal()">
      <option value="">اختر منتج</option>
      ${medsCache.map((m) => `<option value="${m._id}" data-price="${m.salePrice}" data-stock="${m.stockQty}" ${m._id === preselectMedId ? 'selected' : ''}>${escapeHtml(m.name)} (متوفر ${m.stockQty})</option>`).join('')}
    </select>
    <div style="display:flex;gap:8px">
      <input type="number" class="form-input sale-item-qty" placeholder="الكمية" value="1" min="1" style="width:100px" oninput="updateSaleTotal()">
      <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('.form-row').remove(); updateSaleTotal()">×</button>
    </div>`;
  container.appendChild(row);
  return row;
}

// ---- Barcode scanner support (POS) ----
// A barcode scanner behaves like a keyboard: it "types" the code very fast
// into whichever input is focused, then sends Enter. We keep this input
// focused while the sale modal is open so scanning "just works".
function handleSaleBarcodeScan(code) {
  const barcode = (code || '').trim();
  if (!barcode) return;
  const med = medsCache.find((m) => m.barcode && m.barcode === barcode);
  const scanInput = document.getElementById('saleBarcodeInput');
  if (!med) {
    showToast(`ما في منتج مسجل بهالباركود: ${barcode}`, true);
    scanInput.value = '';
    return;
  }
  const rows = Array.from(document.querySelectorAll('#saleItemsContainer .form-row'));
  const existingRow = rows.find((r) => r.querySelector('.sale-item-med').value === med._id);
  if (existingRow) {
    const qtyInput = existingRow.querySelector('.sale-item-qty');
    qtyInput.value = Number(qtyInput.value || 0) + 1;
  } else {
    const emptyRow = rows.find((r) => !r.querySelector('.sale-item-med').value);
    if (emptyRow) emptyRow.remove();
    addSaleItemRow(med._id);
  }
  updateSaleTotal();
  showToast(`أُضيف: ${med.name}`);
  scanInput.value = '';
  scanInput.focus();
}
document.getElementById('saleBarcodeInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleSaleBarcodeScan(e.target.value);
  }
});

function updateSaleTotal() {
  const rows = document.querySelectorAll('#saleItemsContainer .form-row');
  let subtotal = 0;
  rows.forEach((r) => {
    const select = r.querySelector('.sale-item-med');
    const qty = Number(r.querySelector('.sale-item-qty').value) || 0;
    const price = Number(select.selectedOptions[0]?.dataset.price || 0);
    subtotal += price * qty;
  });
  const discount = Number(document.getElementById('saleDiscount')?.value || 0);
  const total = Math.max(subtotal - discount, 0);
  document.getElementById('saleTotalPreview').textContent = `$${total.toFixed(2)}`;
}
document.getElementById('saleDiscount').addEventListener('input', updateSaleTotal);

document.getElementById('saleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const rows = document.querySelectorAll('#saleItemsContainer .form-row');
  const items = Array.from(rows).map((r) => ({
    medicationId: r.querySelector('.sale-item-med').value,
    quantity: Number(r.querySelector('.sale-item-qty').value),
  })).filter((it) => it.medicationId && it.quantity > 0);

  if (!items.length) { showToast('أضف صنف واحد على الأقل', true); return; }

  try {
    const sale = await api('/sales', {
      method: 'POST',
      body: JSON.stringify({
        customerId: document.getElementById('saleCustomer').value || null,
        items,
        paymentMethod: document.getElementById('salePaymentMethod').value,
        discount: Number(document.getElementById('saleDiscount').value) || 0,
      }),
    });
    showToast(`تمت الفاتورة ${sale.saleNumber}`);
    closeModal('saleModal');
    medsCache = await api('/medications'); // stock changed
    loadSales();
  } catch (err) {
    showToast(err.message, true);
  }
});

// ---------------------------------------------------------------------
// CUSTOMERS
// ---------------------------------------------------------------------
async function loadCustomers() {
  const tbody = document.getElementById('customersTableBody');
  tbody.innerHTML = '<tr><td colspan="3" class="empty-note">جارِ التحميل...</td></tr>';
  try {
    customersCache = await api('/customers');
    tbody.innerHTML = customersCache.length
      ? customersCache.map((c) => `<tr>
          <td><div class="product-info"><div class="product-img" style="background:rgba(135,103,170,0.15);color:var(--secondary)">${escapeHtml((c.fullName || '?').slice(0, 1))}</div><div class="product-name">${escapeHtml(c.fullName)}</div></div></td>
          <td>${escapeHtml(c.phone || '—')}</td>
          <td><div class="action-btns"><button class="action-btn delete" onclick="deleteCustomer('${c._id}')"><i class="fas fa-trash"></i></button></div></td>
        </tr>`).join('')
      : '<tr><td colspan="3" class="empty-note">لا يوجد عملاء بعد</td></tr>';
  } catch (err) {
    showToast(err.message, true);
  }
}

function openCustomerModal() {
  document.getElementById('customerForm').reset();
  openModal('customerModal');
}

async function deleteCustomer(id) {
  if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
  try {
    await api(`/customers/${id}`, { method: 'DELETE' });
    showToast('تم الحذف');
    loadCustomers();
  } catch (err) {
    showToast(err.message, true);
  }
}

document.getElementById('customerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/customers', {
      method: 'POST',
      body: JSON.stringify({ fullName: document.getElementById('customerName').value, phone: document.getElementById('customerPhone').value }),
    });
    showToast('تم إضافة العميل');
    closeModal('customerModal');
    loadCustomers();
  } catch (err) {
    showToast(err.message, true);
  }
});

// ---------------------------------------------------------------------
// REPORTS
// ---------------------------------------------------------------------
let revenueChartInstance = null;
let categoryChartInstance = null;

async function loadReports() {
  try {
    const [revenue, categories, meds, slowMovers] = await Promise.all([
      api('/dashboard/revenue-chart?period=monthly'),
      api('/dashboard/categories'),
      api('/medications'),
      api('/dashboard/slow-movers'),
    ]);

    document.getElementById('slowMoversBody').innerHTML = slowMovers.length
      ? slowMovers.map((m) => `<tr>
          <td>${escapeHtml(m.name)}</td>
          <td>${m.unitsSold === 0 ? '<span class="status-badge status-out">لم يُطلب أبداً</span>' : m.unitsSold}</td>
          <td>${m.stockQty}</td>
        </tr>`).join('')
      : '<tr><td colspan="3" class="empty-note">لا توجد بيانات</td></tr>';

    const ctx1 = document.getElementById('revenueChart');
    if (revenueChartInstance) revenueChartInstance.destroy();
    revenueChartInstance = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: revenue.map((d) => d.label),
        datasets: [{ label: 'الإيرادات', data: revenue.map((d) => d.total), borderColor: '#8767aa', backgroundColor: 'rgba(135,103,170,0.1)', borderWidth: 3, fill: true, tension: 0.4 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } },
      },
    });

    const ctx2 = document.getElementById('categoryChart');
    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: categories.map((c) => c.category),
        datasets: [{ data: categories.map((c) => c.count), backgroundColor: ['#8767aa', '#3498db', '#27ae60', '#f39c12', '#e74c3c', '#95a5a6'], borderWidth: 0 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { family: 'Cairo' }, usePointStyle: true, padding: 16 } } } },
    });

    const tbody = document.getElementById('inventoryReportBody');
    tbody.innerHTML = meds.length
      ? meds.map((m) => {
          let statusHtml = m.stockQty === 0 ? '<span class="status-badge status-out">نفذ</span>' : m.lowStock ? '<span class="status-badge status-low">منخفض</span>' : '<span class="status-badge status-active">جيد</span>';
          return `<tr>
            <td>${escapeHtml(m.name)}</td>
            <td>${m.stockQty}</td>
            <td>${m.lowStockThreshold}</td>
            <td>${statusHtml}</td>
            <td>$${(m.stockQty * m.costPrice).toFixed(2)}</td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="5" class="empty-note">لا توجد بيانات</td></tr>';
  } catch (err) {
    showToast(err.message, true);
  }
}

// ---------------------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------------------
let settingsCache = null;

async function loadSettings() {
  try {
    settingsCache = await api('/settings');
    document.getElementById('settingPharmacyName').value = settingsCache.pharmacyName || '';
    document.getElementById('settingLicenseNumber').value = settingsCache.licenseNumber || '';
    document.getElementById('settingPhone').value = settingsCache.phone || '';
    document.getElementById('settingEmail').value = settingsCache.email || '';
    document.getElementById('settingAddress').value = settingsCache.address || '';
    document.getElementById('settingPrintPaperSize').value = settingsCache.printPaperSize || '80mm';
    document.getElementById('settingInvoiceFooterNote').value = settingsCache.invoiceFooterNote || '';
    const logoImg = document.getElementById('settingLogoPreview');
    if (settingsCache.logoUrl) { logoImg.src = settingsCache.logoUrl; logoImg.style.display = 'block'; }
    else { logoImg.style.display = 'none'; }

    setToggle('toggleAutoAlerts', settingsCache.autoAlerts);
    setToggle('toggleExpiryAlerts', settingsCache.expiryAlerts);
    setToggle('toggleAutoBackup', settingsCache.autoBackup);
  } catch (err) {
    showToast(err.message, true);
  }
}

function setToggle(id, active) {
  const el = document.getElementById(id);
  el.classList.toggle('active', !!active);
}

async function toggleSetting(key, el) {
  const newValue = !el.classList.contains('active');
  el.classList.toggle('active', newValue);
  try {
    await api('/settings', { method: 'PUT', body: JSON.stringify({ [key]: newValue }) });
  } catch (err) {
    el.classList.toggle('active', !newValue); // revert on failure
    showToast(err.message, true);
  }
}

document.getElementById('generalSettingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        pharmacyName: document.getElementById('settingPharmacyName').value,
        licenseNumber: document.getElementById('settingLicenseNumber').value,
        phone: document.getElementById('settingPhone').value,
        email: document.getElementById('settingEmail').value,
        address: document.getElementById('settingAddress').value,
      }),
    });
    showToast('تم حفظ الإعدادات');
    loadHeaderInfo();
  } catch (err) {
    showToast(err.message, true);
  }
});

document.getElementById('printSettingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    settingsCache = await api('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        printPaperSize: document.getElementById('settingPrintPaperSize').value,
        invoiceFooterNote: document.getElementById('settingInvoiceFooterNote').value,
      }),
    });
    showToast('تم حفظ إعدادات الطباعة');
  } catch (err) {
    showToast(err.message, true);
  }
});

async function uploadLogoFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('logo', file);
  try {
    settingsCache = await api('/settings/logo', { method: 'POST', body: formData });
    const logoImg = document.getElementById('settingLogoPreview');
    logoImg.src = settingsCache.logoUrl; logoImg.style.display = 'block';
    showToast('تم رفع الشعار بنجاح');
  } catch (err) {
    showToast(err.message, true);
  }
}

// ---------------------------------------------------------------------
// REAL PRINTING — thermal 58/80mm receipt printers + A4, via the
// browser's native print dialog (works with any printer installed on the
// machine, which is how thermal receipt printers normally show up on
// Windows/Linux once their driver is installed).
// ---------------------------------------------------------------------
function printHtml(bodyHtml, paperSize) {
  const size = paperSize || settingsCache?.printPaperSize || '80mm';
  const pageCss = size === 'A4'
    ? '@page { size: A4; margin: 14mm; } body { width: 190mm; font-size: 13px; }'
    : `@page { size: ${size} auto; margin: 2mm; } body { width: ${size === '58mm' ? '54mm' : '76mm'}; font-size: 11px; }`;
  const win = window.open('', '_blank', 'width=420,height=640');
  win.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Cairo', Tahoma, sans-serif; margin: 0 auto; color: #102032; direction: rtl; }
      h1,h2,h3 { margin: 4px 0; }
      table { width: 100%; border-collapse: collapse; margin: 6px 0; }
      th, td { padding: 3px 2px; text-align: right; font-size: inherit; }
      th { border-bottom: 1px solid #333; }
      .total-row td { border-top: 1px solid #333; font-weight: 700; padding-top: 6px; }
      .center { text-align: center; }
      .muted { color: #555; font-size: 0.85em; }
      .logo { max-width: 60px; max-height: 60px; display: block; margin: 0 auto 6px; }
      ${pageCss}
    </style></head><body>${bodyHtml}</body></html>`);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
  // Some browsers fire onload before assets (logo image) are ready; also
  // trigger after a short delay as a fallback.
  setTimeout(() => { try { win.focus(); win.print(); } catch (e) {} }, 400);
}

async function printReceipt(saleId) {
  try {
    const sale = await api(`/sales/${saleId}`);
    const s = settingsCache || {};
    const itemsRows = sale.items.map((it) => `<tr>
        <td>${escapeHtml(it.medicationName)}</td>
        <td class="center">${it.quantity}</td>
        <td class="center">$${it.price}</td>
        <td class="center">$${(it.price * it.quantity).toFixed(2)}</td>
      </tr>`).join('');
    const logoAbs = s.logoUrl ? (s.logoUrl.startsWith('http') ? s.logoUrl : window.location.origin + s.logoUrl) : '';
    const html = `
      ${logoAbs ? `<img class="logo" src="${logoAbs}">` : ''}
      <h2 class="center">${escapeHtml(s.pharmacyName || 'الصيدلية')}</h2>
      <p class="center muted">${escapeHtml(s.address || '')}${s.phone ? ' - ' + escapeHtml(s.phone) : ''}</p>
      <hr>
      <p>فاتورة رقم: <strong>${sale.saleNumber}</strong><br>
         التاريخ: ${new Date(sale.createdAt).toLocaleString('en-GB')}<br>
         الزبون: ${escapeHtml(sale.customerId?.fullName || 'زبون نقدي')}</p>
      <table>
        <thead><tr><th>الصنف</th><th class="center">كمية</th><th class="center">سعر</th><th class="center">إجمالي</th></tr></thead>
        <tbody>${itemsRows}</tbody>
        <tfoot>
          ${sale.discount ? `<tr><td colspan="3">الخصم</td><td class="center">-$${sale.discount}</td></tr>` : ''}
          <tr class="total-row"><td colspan="3">الإجمالي</td><td class="center">$${sale.total}</td></tr>
        </tfoot>
      </table>
      <p class="center muted">${escapeHtml(s.invoiceFooterNote || 'شكراً لزيارتكم')}</p>`;
    printHtml(html);
  } catch (err) {
    showToast(err.message, true);
  }
}

function printCurrentSection(title) {
  const active = document.querySelector('.section.active') || document.querySelector('.section[style*="block"]');
  const table = active ? active.querySelector('table') : document.querySelector('table');
  if (!table) { showToast('ما في جدول لطباعته بهالصفحة', true); return; }
  const s = settingsCache || {};
  const logoAbs = s.logoUrl ? (s.logoUrl.startsWith('http') ? s.logoUrl : window.location.origin + s.logoUrl) : '';
  const html = `
    ${logoAbs ? `<img class="logo" src="${logoAbs}">` : ''}
    <h2 class="center">${escapeHtml(s.pharmacyName || 'الصيدلية')}</h2>
    <h3 class="center">${escapeHtml(title || '')}</h3>
    <p class="center muted">${new Date().toLocaleDateString('en-GB')}</p>
    <hr>
    ${table.outerHTML}`;
  printHtml(html, 'A4');
}

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: document.getElementById('newPassword').value,
      }),
    });
    showToast('تم تحديث كلمة المرور بنجاح');
    document.getElementById('passwordForm').reset();
  } catch (err) {
    showToast(err.message, true);
  }
});

async function exportBackup() {
  await downloadFile('/backup/export', `pharmacy-backup-${new Date().toISOString().slice(0, 10)}.json`);
  showToast('تم تحميل النسخة الاحتياطية');
}

async function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!confirm('استرجاع النسخة الاحتياطية بيستبدل كل بياناتك الحالية. متأكد إنك بدك تكمل؟')) {
    event.target.value = '';
    return;
  }
  try {
    const text = await file.text();
    const backup = JSON.parse(text);
    const result = await api('/backup/import', { method: 'POST', body: JSON.stringify(backup) });
    showToast(`${result.message} (${result.restoredCount} سجل)`);
  } catch (err) {
    showToast(err.message || 'ملف غير صالح', true);
  } finally {
    event.target.value = '';
  }
}

// ---------------------------------------------------------------------
// Header / sidebar user info
// ---------------------------------------------------------------------
function loadHeaderInfo() {
  document.getElementById('sidebarPharmacyName').textContent = currentUser.pharmacyName || 'الصيدلية';
  document.getElementById('sidebarUserName').textContent = currentUser.name || '';
  document.getElementById('topbarUserName').textContent = currentUser.name || '';
  document.getElementById('userAvatar').textContent = (currentUser.name || '؟').trim().slice(0, 1);
}

// ---------------------------------------------------------------------
// Global search (client-side filter across the currently visible table)
// ---------------------------------------------------------------------
document.getElementById('globalSearch').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const activeSection = document.querySelector('.section.active');
  if (!activeSection) return;
  activeSection.querySelectorAll('.data-table tbody tr').forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------
loadHeaderInfo();
refreshCoreCaches().finally(loadDashboard);
