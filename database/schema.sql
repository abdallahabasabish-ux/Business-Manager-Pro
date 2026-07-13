-- schema.sql - هيكل قاعدة البيانات مع بيانات تجريبية

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

INSERT OR IGNORE INTO roles (id, name, description) VALUES
(1, 'admin', 'مدير النظام - صلاحية كاملة'),
(2, 'employee', 'موظف - صلاحية محدودة'),
(3, 'accountant', 'محاسب - صلاحية مالية'),
(4, 'supervisor', 'مشرف - صلاحية إشرافية');

INSERT OR IGNORE INTO users (username, password, full_name, role_id) VALUES
('admin', 'admin123', 'المدير العام', 1);

INSERT OR IGNORE INTO settings (key, value, category) VALUES
('company_name', 'شركة الأعمال المتقدمة', 'general'),
('company_phone', '+966 50 000 0000', 'general'),
('company_email', 'info@company.com', 'general'),
('currency', 'ريال سعودي', 'general'),
('tax_rate', '15', 'general');

-- ===== جداول البيانات الأساسية =====

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    image TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    default_price REAL DEFAULT 0,
    duration_days INTEGER DEFAULT 1,
    department TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    email TEXT,
    salary REAL DEFAULT 0,
    commission_rate REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER,
    service_id INTEGER,
    employee_id INTEGER,
    start_date DATE,
    delivery_date DATE,
    price REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL DEFAULT 0,
    paid REAL DEFAULT 0,
    remaining REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    completion_percentage INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'medium',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);

-- ===== بيانات تجريبية =====

INSERT OR IGNORE INTO customers (id, name, phone, email, company, country, city, created_at) VALUES
(1, 'أحمد محمد', '0501111111', 'ahmed@example.com', 'شركة التقنية المتقدمة', 'السعودية', 'الرياض', datetime('now', '-30 days')),
(2, 'سارة علي', '0502222222', 'sara@example.com', 'مؤسسة التصميم الإبداعي', 'السعودية', 'جدة', datetime('now', '-15 days')),
(3, 'خالد عبدالله', '0503333333', 'khaled@example.com', 'شركة الحلول الذكية', 'الإمارات', 'دبي', datetime('now', '-5 days'));

INSERT OR IGNORE INTO services (id, name, description, default_price, duration_days, department) VALUES
(1, 'تصميم موقع إلكتروني', 'تصميم موقع متكامل مع واجهة مستخدم احترافية', 5000, 14, 'التصميم'),
(2, 'تطوير تطبيق جوال', 'تطبيق iOS و Android باستخدام Flutter', 8000, 21, 'البرمجة'),
(3, 'استضافة سحابية', 'استضافة سنوية مع دعم فني', 1200, 1, 'البنية التحتية'),
(4, 'تحسين محركات البحث (SEO)', 'تحسين ظهور الموقع في محركات البحث', 3000, 30, 'التسويق');

INSERT OR IGNORE INTO employees (id, name, position, phone, email, salary, commission_rate) VALUES
(1, 'محمد الدوسري', 'مطور برمجيات', '0501234567', 'mohamed@company.com', 8000, 5),
(2, 'نورة الشمري', 'مصممة UI/UX', '0507654321', 'noura@company.com', 7000, 4),
(3, 'عبدالله الغامدي', 'مدير مشاريع', '0509876543', 'abdullah@company.com', 10000, 7);

INSERT OR IGNORE INTO orders (
    order_number, customer_id, service_id, employee_id, 
    start_date, delivery_date, price, discount, tax, total, paid, remaining, 
    status, completion_percentage, priority, created_at
) VALUES
('ORD-2026-001', 1, 1, 1, date('now', '-20 days'), date('now', '-6 days'), 5000, 0, 750, 5750, 5750, 0, 'completed', 100, 'high', datetime('now', '-20 days')),
('ORD-2026-002', 2, 2, 2, date('now', '-10 days'), date('now', '+11 days'), 8000, 500, 1125, 8625, 4000, 4625, 'in_progress', 60, 'urgent', datetime('now', '-10 days')),
('ORD-2026-003', 3, 3, 3, date('now', '-5 days'), date('now', '-4 days'), 1200, 0, 180, 1380, 1380, 0, 'completed', 100, 'medium', datetime('now', '-5 days')),
('ORD-2026-004', 1, 4, 1, date('now', '-2 days'), date('now', '+28 days'), 3000, 200, 420, 3220, 1000, 2220, 'in_progress', 20, 'low', datetime('now', '-2 days')),
('ORD-2026-005', 2, 1, 2, date('now', '-1 day'), date('now', '+13 days'), 5000, 0, 750, 5750, 0, 5750, 'pending', 0, 'medium', datetime('now', '-1 day'));
