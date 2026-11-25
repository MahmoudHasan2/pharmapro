// Pharmacy Pro System - Main Application
class PharmacyApp {
    constructor() {
        this.currentUser = localStorage.getItem('pharmacy_user') || 'tap';
        this.init();
    }

    init() {
        this.checkAuth();
        this.initSidebar();
        this.initNotifications();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    checkAuth() {
        if (!localStorage.getItem('pharmacy_auth')) {
            window.location.href = 'login.html';
        }
    }

    logout() {
        localStorage.removeItem('pharmacy_auth');
        localStorage.removeItem('pharmacy_user');
        window.location.href = 'login.html';
    }

    initSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        const toggle = document.getElementById('sidebarToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                document.body.classList.toggle('sidebar-collapsed');
            });
        }
    }

    initNotifications() {
        const data = getData ? getData() : PharmacyData;
        const alerts = data.alerts || [];
        const badge = document.getElementById('alertBadge');
        if (badge) badge.textContent = alerts.length;
    }

    updateClock() {
        const el = document.getElementById('clock');
        if (el) {
            const now = new Date();
            el.textContent = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        }
        const dateEl = document.getElementById('dateDisplay');
        if (dateEl) {
            const now = new Date();
            dateEl.textContent = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    }

    showNotification(msg, type = 'success') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = `notification ${type}`;
        div.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} ml-2"></i>${msg}`;
        document.body.appendChild(div);

        requestAnimationFrame(() => div.classList.add('show'));
        setTimeout(() => {
            div.classList.remove('show');
            setTimeout(() => div.remove(), 300);
        }, 3000);
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    }

    formatMoney(amount) {
        return amount.toFixed(2) + ' ر.س';
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('ar-SA');
    }

    generateId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }
}

// Barcode scanner simulation
class BarcodeScanner {
    constructor(callback) {
        this.callback = callback;
        this.buffer = '';
        this.timeout = null;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            if (this.timeout) clearTimeout(this.timeout);

            if (e.key === 'Enter' && this.buffer.length > 5) {
                this.callback(this.buffer);
                this.buffer = '';
            } else if (e.key.length === 1) {
                this.buffer += e.key;
            }

            this.timeout = setTimeout(() => { this.buffer = ''; }, 100);
        });
    }
}

// AI Assistant
class PharmacyAI {
    constructor() {
        this.knowledge = {
            'باراسيتامول': 'مسكن خفيف للألم وخافض للحرارة. الجرعة: 500-1000mg كل 4-6 ساعات. لا يتجاوز 4000mg يومياً.',
            'أموكسيسيلين': 'مضاد حيوي واسع الطيف. يستخدم لعلاج العدوى البكتيرية. الجرعة حسب عمر المريض ونوع العدوى.',
            'أوميبرازول': 'مثبط مضخة البروتون. يعالج حرقة المعدة والقرحة. يؤخذ قبل الأكل بـ 30 دقيقة.',
            'ميتفورمين': 'يستخدم لعلاج السكري النوع الثاني. يقلل إنتاج الجلوكوز في الكبد ويحسن حساسية الأنسولين.',
            'أتورفاستاتين': 'يخفض الكوليسترول الضار (LDL). يؤخذ مرة واحدة يومياً مساءً.',
            'سيتريزين': 'مضاد للهيستامين لعلاج الحساسية. قد يسبب النعاس.',
            'إيبوبروفين': 'مضاد للالتهابات ومسكن للألم. يؤخذ مع الطعام لتجنب تهيج المعدة.',
            'فيتامين د': 'ضروري لصحة العظام والمناعة. الجرعة اليومية الموصى بها 1000-2000 وحدة.',
        };
    }

    ask(question) {
        const q = question.toLowerCase();

        // Stock queries
        if (q.includes('مخزون') || q.includes('كمية') || q.includes('كم')) {
            const data = getData ? getData() : PharmacyData;
            for (let med of data.medicines) {
                if (q.includes(med.name.toLowerCase()) || med.name.toLowerCase().includes(q.replace(/مخزون|كمية|كم|من/, '').trim())) {
                    return `مخزون ${med.name}: ${med.stock} قطعة. الحد الأدنى: ${med.minStock}. ${med.stock <= med.minStock ? '⚠️ المخزون منخفض!' : '✅ المخزون جيد'}`;
                }
            }
            return 'لم أجد الدواء المطلوب. جرب كتابة الاسم بشكل مختلف.';
        }

        // Price queries
        if (q.includes('سعر') || q.includes('كم')) {
            const data = getData ? getData() : PharmacyData;
            for (let med of data.medicines) {
                if (q.includes(med.name.toLowerCase())) {
                    return `سعر ${med.name}: ${med.price} ر.س (الضريبة: ${(med.price * med.tax).toFixed(2)} ر.س)`;
                }
            }
        }

        // Medical info
        for (let [drug, info] of Object.entries(this.knowledge)) {
            if (q.includes(drug.toLowerCase())) {
                return `📋 ${drug}:
${info}`;
            }
        }

        // General responses
        if (q.includes('مرحبا') || q.includes('سلام')) return 'أهلاً بك في صيدلية برو! كيف يمكنني مساعدتك اليوم؟ 💊';
        if (q.includes('شكرا')) return 'على الرحب والسعة! إذا احتجت أي مساعدة أنا موجود 😊';
        if (q.includes('مساعدة')) return 'يمكنني مساعدتك في:
• الاستعلام عن مخزون الأدوية
• معرفة الأسعار
• معلومات طبية عن الأدوية
• التنبيهات والتقارير
ما الذي تحتاجه؟';

        return 'عذراً، لم أفهم سؤالك تماماً. يمكنني مساعدتك في الاستعلام عن:
• مخزون الأدوية (اكتب: مخزون + اسم الدواء)
• الأسعار (اكتب: سعر + اسم الدواء)
• معلومات طبية عن الأدوية الشائعة';
    }
}

const app = new PharmacyApp();
