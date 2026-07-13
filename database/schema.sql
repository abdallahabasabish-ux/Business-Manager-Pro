-- schema.sql - هيكل قاعدة البيانات

-- تفعيل المفاتيح الخارجية
PRAGMA foreign_keys = ON;

-- جدول الصلاحيات
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,   -- admin, employee, accountant, supervisor
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,      -- سيتم تشفيرها لاحقاً
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

-- جدول سجل النشاطات
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- إدراج الصلاحيات الافتراضية
INSERT OR IGNORE INTO roles (id, name, description) VALUES
(1, 'admin', 'مدير النظام - صلاحية كاملة'),
(2, 'employee', 'موظف - صلاحية محدودة'),
(3, 'accountant', 'محاسب - صلاحية مالية'),
(4, 'supervisor', 'مشرف - صلاحية إشرافية');

-- إدراج مستخدم مدير افتراضي (كلمة المرور: admin123)
-- سيتم تشفيرها لاحقاً، لكن حالياً تخزين نصي مؤقت
INSERT OR IGNORE INTO users (username, password, full_name, role_id) VALUES
('admin', 'admin123', 'المدير العام', 1);

-- إدراج إعدادات افتراضية
INSERT OR IGNORE INTO settings (key, value, category) VALUES
('company_name', 'شركة الأعمال المتقدمة', 'general'),
('company_phone', '+966 50 000 0000', 'general'),
('company_email', 'info@company.com', 'general'),
('currency', 'ريال سعودي', 'general'),
('tax_rate', '15', 'general');
