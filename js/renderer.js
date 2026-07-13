// renderer.js - منطق الواجهة الأمامية (شاشة تسجيل الدخول)

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMe = document.getElementById('rememberMe');
    const loginError = document.getElementById('loginError');
    const togglePassword = document.getElementById('togglePassword');

    // --- تبديل إظهار/إخفاء كلمة المرور مع أيقونة Font Awesome ---
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // تغيير أيقونة العين
            const icon = togglePassword.querySelector('i');
            if (type === 'password') {
                icon.className = 'fas fa-eye';
            } else {
                icon.className = 'fas fa-eye-slash';
            }
        });
    }

    // تحميل اسم المستخدم المخزن (تذكرني)
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberMe.checked = true;
    }

    // معالجة تسجيل الدخول
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            showError('يرجى إدخال اسم المستخدم وكلمة المرور');
            return;
        }

        const loginBtn = document.getElementById('loginBtn');
        loginBtn.disabled = true;
        loginBtn.textContent = 'جاري التحقق...';
        hideError();

        try {
            const result = await window.api.query(
                `SELECT id, username, full_name, role_id, password 
                 FROM users 
                 WHERE username = ? AND is_active = 1`,
                [username]
            );

            if (result && result.length > 0) {
                const user = result[0];
                if (user.password === password) {
                    if (rememberMe.checked) {
                        localStorage.setItem('rememberedUsername', username);
                    } else {
                        localStorage.removeItem('rememberedUsername');
                    }

                    sessionStorage.setItem('currentUser', JSON.stringify({
                        id: user.id,
                        username: user.username,
                        fullName: user.full_name,
                        roleId: user.role_id
                    }));

                    await window.api.query(
                        `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`,
                        [user.id]
                    );

                    await window.api.query(
                        `INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)`,
                        [user.id, 'login', 'تسجيل دخول ناجح']
                    );

                    window.location.href = '../pages/dashboard.html';
                } else {
                    showError('كلمة المرور غير صحيحة');
                    await logFailedAttempt(username);
                }
            } else {
                showError('المستخدم غير موجود أو غير نشط');
                await logFailedAttempt(username);
            }
        } catch (err) {
            console.error('خطأ في تسجيل الدخول:', err);
            showError('حدث خطأ في الاتصال بقاعدة البيانات. تأكد من تشغيل التطبيق بشكل صحيح.');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'تسجيل الدخول';
        }
    });

    // دوال مساعدة
    function showError(msg) {
        loginError.textContent = msg;
        loginError.style.display = 'block';
    }

    function hideError() {
        loginError.style.display = 'none';
    }

    async function logFailedAttempt(username) {
        try {
            const userResult = await window.api.query(
                `SELECT id FROM users WHERE username = ?`,
                [username]
            );
            if (userResult && userResult.length > 0) {
                await window.api.query(
                    `INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)`,
                    [userResult[0].id, 'login_failed', 'محاولة تسجيل دخول فاشلة']
                );
            }
        } catch (e) { /* تجاهل */ }
    }
});
