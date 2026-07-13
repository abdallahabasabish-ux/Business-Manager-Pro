// userService.js - خدمة إدارة المستخدمين (مؤقت)

const { runQuery, runWrite } = require('../database');

class UserService {
    async authenticate(username, password) {
        const users = await runQuery(
            `SELECT id, username, full_name, role_id, password 
             FROM users WHERE username = ? AND is_active = 1`,
            [username]
        );
        if (users.length === 0) return null;
        const user = users[0];
        if (user.password === password) {
            delete user.password;
            return user;
        }
        return null;
    }

    async getUserById(id) {
        const users = await runQuery(
            `SELECT id, username, full_name, email, phone, role_id, is_active, last_login, created_at 
             FROM users WHERE id = ?`,
            [id]
        );
        return users.length > 0 ? users[0] : null;
    }

    async getAllUsers() {
        return await runQuery(
            `SELECT id, username, full_name, email, phone, role_id, is_active, last_login, created_at 
             FROM users ORDER BY id DESC`
        );
    }

    async createUser(userData) {
        const { username, password, full_name, email, phone, role_id } = userData;
        const result = await runWrite(
            `INSERT INTO users (username, password, full_name, email, phone, role_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [username, password, full_name, email, phone, role_id]
        );
        return result.lastID;
    }
}

module.exports = new UserService();
