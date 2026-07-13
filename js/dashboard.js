// dashboard.js - منطق لوحة التحكم

document.addEventListener('DOMContentLoaded', async () => {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = '../pages/login.html';
        return;
    }

    const user = JSON.parse(userData);
    document.getElementById('userDisplayName').textContent = user.fullName || user.username;

    await loadStats();
    await loadRecentOrders();
    await loadRecentCustomers();
    await renderChart();
    setupEventListeners();
});

async function loadStats() {
    try {
        const customers = await window.api.query('SELECT COUNT(*) as count FROM customers');
        document.getElementById('totalCustomers').textContent = customers[0]?.count || 0;

        const totalOrders = await window.api.query('SELECT COUNT(*) as count FROM orders');
        document.getElementById('totalOrders').textContent = totalOrders[0]?.count || 0;

        const pending = await window.api.query(
            "SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'in_progress')"
        );
        document.getElementById('pendingOrders').textContent = pending[0]?.count || 0;

        const completed = await window.api.query(
            "SELECT COUNT(*) as count FROM orders WHERE status = 'completed'"
        );
        document.getElementById('completedOrders').textContent = completed[0]?.count || 0;

        const revenue = await window.api.query(
            "SELECT SUM(total) as sum FROM orders WHERE status = 'completed'"
        );
        document.getElementById('totalRevenue').innerHTML = 
            (revenue[0]?.sum || 0).toLocaleString() + ' <span class="currency">ريال</span>';

        const receivables = await window.api.query(
            "SELECT SUM(remaining) as sum FROM orders WHERE status IN ('pending', 'in_progress')"
        );
        document.getElementById('totalReceivables').innerHTML = 
            (receivables[0]?.sum || 0).toLocaleString() + ' <span class="currency">ريال</span>';

    } catch (err) {
        console.error('خطأ في تحميل الإحصائيات:', err);
    }
}

async function loadRecentOrders() {
    try {
        const orders = await window.api.query(`
            SELECT o.id, o.order_number, o.total, o.status, c.name as customer_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ORDER BY o.created_at DESC
            LIMIT 5
        `);

        const tbody = document.getElementById('recentOrdersBody');
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;">لا توجد طلبات</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const statusClass = {
                'completed': 'status-completed',
                'in_progress': 'status-in_progress',
                'pending': 'status-pending',
                'cancelled': 'status-cancelled'
            }[order.status] || 'status-pending';

            const statusText = {
                'completed': 'مكتمل',
                'in_progress': 'جاري',
                'pending': 'معلق',
                'cancelled': 'ملغي'
            }[order.status] || order.status;

            return `
                <tr>
                    <td><strong>${order.order_number}</strong></td>
                    <td>${order.customer_name || 'غير محدد'}</td>
                    <td>${(order.total || 0).toLocaleString()} ر.س</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('خطأ في تحميل آخر الطلبات:', err);
    }
}

async function loadRecentCustomers() {
    try {
        const customers = await window.api.query(`
            SELECT id, name, phone, company
            FROM customers
            ORDER BY created_at DESC
            LIMIT 5
        `);

        const tbody = document.getElementById('recentCustomersBody');
        if (!customers || customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;">لا يوجد عملاء</td></tr>';
            return;
        }

        tbody.innerHTML = customers.map(c => `
            <tr>
                <td>${c.id}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone || '-'}</td>
                <td>${c.company || '-'}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('خطأ في تحميل آخر العملاء:', err);
    }
}

async function renderChart() {
    try {
        const data = await window.api.query(`
            SELECT 
                strftime('%Y-%m', created_at) as month,
                COUNT(*) as count
            FROM orders
            WHERE created_at >= date('now', '-5 months')
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month ASC
        `);

        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const labels = [];
        const counts = [];

        if (data && data.length > 0) {
            data.forEach(row => {
                const [year, month] = row.month.split('-');
                const monthIndex = parseInt(month) - 1;
                labels.push(months[monthIndex] + ' ' + year);
                counts.push(row.count);
            });
        } else {
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                labels.push(months[d.getMonth()] + ' ' + d.getFullYear());
                counts.push(Math.floor(Math.random() * 6) + 1);
            }
        }

        const ctx = document.getElementById('monthlyChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'عدد الطلبات',
                    data: counts,
                    backgroundColor: 'rgba(255, 122, 0, 0.65)',
                    borderColor: '#ff7a00',
                    borderWidth: 2,
                    borderRadius: 6,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, font: { family: 'Cairo' } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Cairo', size: 11 } }
                    }
                }
            }
        });

    } catch (err) {
        console.error('خطأ في رسم الرسم البياني:', err);
    }
}

function setupEventListeners() {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992) {
            if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.classList.remove('open');
            }
        }
    });

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

    document.getElementById('notifBtn').addEventListener('click', () => {
        alert('📢 لديك 3 إشعارات جديدة:\n- طلب متأخر\n- عميل جديد\n- طلب مكتمل');
    });
}
