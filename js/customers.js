// customers.js - إدارة العملاء

let allCustomers = [];
let isEditing = false;

document.addEventListener('DOMContentLoaded', async () => {
    // التحقق من تسجيل الدخول
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = '../pages/login.html';
        return;
    }
    const user = JSON.parse(userData);
    document.getElementById('userDisplayName').textContent = user.fullName || user.username;

    // تحميل العملاء
    await loadCustomers();

    // إعداد الأحداث
    setupEventListeners();
});

// ===== تحميل العملاء من قاعدة البيانات =====
async function loadCustomers(searchTerm = '') {
    try {
        let query = `
            SELECT 
                c.*,
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.paid), 0) as total_paid,
                COALESCE(SUM(o.remaining), 0) as total_remaining
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
        `;
        let params = [];

        if (searchTerm.trim() !== '') {
            query += ` WHERE c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.company LIKE ?`;
            const term = `%${searchTerm.trim()}%`;
            params = [term, term, term, term];
        }

        query += ` GROUP BY c.id ORDER BY c.created_at DESC`;

        const customers = await window.api.query(query, params);
        allCustomers = customers;

        const tbody = document.getElementById('customersBody');
        if (!customers || customers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; color:#94a3b8; padding: 30px;">
                        <i class="fas fa-users" style="font-size:24px; display:block; margin-bottom:10px;"></i>
                        لا يوجد عملاء. أضف عميلاً جديداً!
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = customers.map(c => `
            <tr>
                <td>${c.id}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>${c.company || '-'}</td>
                <td>${c.total_orders || 0}</td>
                <td>${(c.total_paid || 0).toLocaleString()} ر.س</td>
                <td>${(c.total_remaining || 0).toLocaleString()} ر.س</td>
                <td>
                    <button class="btn-action btn-edit" data-id="${c.id}" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-delete" data-id="${c.id}" title="حذف"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        // ربط أحداث الأزرار
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editCustomer(btn.dataset.id));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteCustomer(btn.dataset.id));
        });

    } catch (err) {
        console.error('خطأ في تحميل العملاء:', err);
        showToast('حدث خطأ في تحميل العملاء', 'error');
    }
}

// ===== فتح مودال الإضافة =====
function openAddModal() {
    isEditing = false;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus"></i> إضافة عميل جديد';
    document.getElementById('customerForm').reset();
    document.getElementById('customerId').value = '';
    document.getElementById('customerModal').classList.add('open');
}

// ===== فتح مودال التعديل =====
async function editCustomer(id) {
    try {
        const customers = await window.api.query(
            `SELECT * FROM customers WHERE id = ?`,
            [id]
        );
        if (!customers || customers.length === 0) {
            showToast('العميل غير موجود', 'error');
            return;
        }
        const c = customers[0];
        isEditing = true;
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-edit"></i> تعديل بيانات العميل';
        document.getElementById('customerId').value = c.id;
        document.getElementById('custName').value = c.name || '';
        document.getElementById('custPhone').value = c.phone || '';
        document.getElementById('custEmail').value = c.email || '';
        document.getElementById('custCompany').value = c.company || '';
        document.getElementById('custCountry').value = c.country || '';
        document.getElementById('custCity').value = c.city || '';
        document.getElementById('custAddress').value = c.address || '';
        document.getElementById('custNotes').value = c.notes || '';
        document.getElementById('custImage').value = c.image || '';
        document.getElementById('customerModal').classList.add('open');
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ في تحميل بيانات العميل', 'error');
    }
}

// ===== حفظ العميل (إضافة أو تعديل) =====
async function saveCustomer(event) {
    event.preventDefault();
    const id = document.getElementById('customerId').value;
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const company = document.getElementById('custCompany').value.trim();
    const country = document.getElementById('custCountry').value.trim();
    const city = document.getElementById('custCity').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const notes = document.getElementById('custNotes').value.trim();
    const image = document.getElementById('custImage').value.trim();

    if (!name) {
        showToast('يرجى إدخال اسم العميل', 'error');
        return;
    }

    try {
        if (id) {
            // تعديل
            await window.api.query(
                `UPDATE customers SET 
                    name = ?, phone = ?, email = ?, company = ?, 
                    country = ?, city = ?, address = ?, notes = ?, image = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [name, phone, email, company, country, city, address, notes, image, id]
            );
            showToast('تم تحديث بيانات العميل بنجاح', 'success');
        } else {
            // إضافة
            await window.api.query(
                `INSERT INTO customers (name, phone, email, company, country, city, address, notes, image) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, phone, email, company, country, city, address, notes, image]
            );
            showToast('تم إضافة العميل بنجاح', 'success');
        }
        closeModal();
        await loadCustomers(document.getElementById('searchInput').value);
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ في حفظ البيانات', 'error');
    }
}

// ===== حذف العميل =====
async function deleteCustomer(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟ سيتم حذف جميع طلباته المرتبطة (إذا لم تكن مقيدة).')) {
        return;
    }
    try {
        await window.api.query(`DELETE FROM customers WHERE id = ?`, [id]);
        showToast('تم حذف العميل بنجاح', 'success');
        await loadCustomers(document.getElementById('searchInput').value);
    } catch (err) {
        console.error(err);
        showToast('لا يمكن حذف العميل لأنه مرتبط بطلبات. قم بحذف الطلبات أولاً.', 'error');
    }
}

// ===== إغلاق المودال =====
function closeModal() {
    document.getElementById('customerModal').classList.remove('open');
}

// ===== البحث =====
function handleSearch() {
    const term = document.getElementById('searchInput').value;
    loadCustomers(term);
}

// ===== تصدير CSV =====
async function exportCSV() {
    try {
        const data = await window.api.query(`
            SELECT id, name, phone, email, company, country, city, address, notes, created_at 
            FROM customers ORDER BY id
        `);
        if (!data || data.length === 0) {
            showToast('لا يوجد عملاء للتصدير', 'error');
            return;
        }

        // رؤوس الأعمدة
        const headers = ['المعرف', 'الاسم', 'الهاتف', 'البريد', 'الشركة', 'الدولة', 'المدينة', 'العنوان', 'ملاحظات', 'تاريخ الإضافة'];
        const rows = data.map(c => [
            c.id, c.name, c.phone || '', c.email || '', c.company || '',
            c.country || '', c.city || '', c.address || '', c.notes || '', c.created_at
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            // تنظيف القيم التي قد تحتوي على فواصل
            const cleanRow = row.map(val => `"${String(val).replace(/"/g, '""')}"`);
            csvContent += cleanRow.join(',') + '\n';
        });

        // تحميل الملف
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM لـ Excel
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `customers_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('تم تصدير العملاء بنجاح', 'success');
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ في التصدير', 'error');
    }
}

// ===== استيراد CSV =====
function importCSV() {
    document.getElementById('fileInput').click();
}

async function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            showToast('الملف فارغ أو غير صحيح', 'error');
            return;
        }

        // تخطي الرأس (header)
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            if (values.length < 2) continue;
            const [name, phone, email, company, country, city, address, notes] = values;
            if (name) {
                await window.api.query(
                    `INSERT INTO customers (name, phone, email, company, country, city, address, notes) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [name, phone || '', email || '', company || '', country || '', city || '', address || '', notes || '']
                );
                imported++;
            }
        }
        showToast(`تم استيراد ${imported} عميل بنجاح`, 'success');
        await loadCustomers(document.getElementById('searchInput').value);
    } catch (err) {
        console.error(err);
        showToast('خطأ في قراءة الملف. تأكد من صيغة CSV.', 'error');
    }
    event.target.value = '';
}

// ===== رسائل التنبيه (Toast) =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toastMessage');
    toast.textContent = message;
    toast.className = 'toast-message ' + type;
    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ===== إعداد الأحداث =====
function setupEventListeners() {
    // السايدبار
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992) {
            if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.classList.remove('open');
            }
        }
    });

    // الداكن
    const darkToggle = document.getElementById('darkModeToggle');
    darkToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = darkToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.className = 'fas fa-sun';
            localStorage.setItem('darkMode', 'true');
        } else {
            icon.className = 'fas fa-moon';
            localStorage.setItem('darkMode', 'false');
        }
    });
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkToggle.querySelector('i').className = 'fas fa-sun';
    }

    // تسجيل الخروج
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        const userData = sessionStorage.getItem('currentUser');
        if (userData) {
            const user = JSON.parse(userData);
            await window.api.query(
                `INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)`,
                [user.id, 'logout', 'تسجيل خروج']
            );
        }
        sessionStorage.removeItem('currentUser');
        window.location.href = '../pages/login.html';
    });

    // الإشعارات
    document.getElementById('notifBtn').addEventListener('click', () => {
        alert('📢 لديك 3 إشعارات جديدة:\n- طلب متأخر\n- عميل جديد\n- طلب مكتمل');
    });

    // --- أحداث العملاء ---
    document.getElementById('addCustomerBtn').addEventListener('click', openAddModal);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    // إغلاق المودال عند النقر خارجها
    document.getElementById('customerModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('customerForm').addEventListener('submit', saveCustomer);

    document.getElementById('searchInput').addEventListener('input', handleSearch);

    document.getElementById('exportBtn').addEventListener('click', exportCSV);
    document.getElementById('importBtn').addEventListener('click', importCSV);
    document.getElementById('fileInput').addEventListener('change', handleFileImport);
}
