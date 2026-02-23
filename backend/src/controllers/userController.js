const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.email, u.name, u.office_id, u.is_active, 
                   r.roles_name as role, d.divisions_name as division,
                   uhr.id_roles as role_id, uhr.divisions_id as division_id
            FROM users u
            LEFT JOIN users_has_roles uhr ON u.id = uhr.id_users
            LEFT JOIN roles r ON uhr.id_roles = r.id
            LEFT JOIN divisions d ON uhr.divisions_id = d.id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createUser = async (req, res) => {
    const { email, password, name, office_id, role_id, division_id } = req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const hashedPassword = bcrypt.hashSync(password, 10);

        const [userResult] = await conn.execute(
            'INSERT INTO users (email, password, name, office_id) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, name, office_id]
        );
        const userId = userResult.insertId;

        if (role_id && division_id) {
            await conn.execute(
                'INSERT INTO users_has_roles (id_users, id_roles, divisions_id) VALUES (?, ?, ?)',
                [userId, role_id, division_id]
            );
        }

        await conn.commit();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        conn.release();
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, password, name, office_id, is_active, role_id, division_id } = req.body;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        let query = 'UPDATE users SET email = ?, name = ?, office_id = ?, is_active = ?';
        let params = [email, name, office_id, is_active];

        if (password && password.trim() !== '') {
            const hashedPassword = bcrypt.hashSync(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await conn.execute(query, params);

        if (role_id && division_id) {
            // Check if mapping exists
            const [existing] = await conn.execute('SELECT * FROM users_has_roles WHERE id_users = ?', [id]);
            if (existing.length > 0) {
                await conn.execute(
                    'UPDATE users_has_roles SET id_roles = ?, divisions_id = ? WHERE id_users = ?',
                    [role_id, division_id, id]
                );
            } else {
                await conn.execute(
                    'INSERT INTO users_has_roles (id_users, id_roles, divisions_id) VALUES (?, ?, ?)',
                    [id, role_id, division_id]
                );
            }
        }

        await conn.commit();
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        conn.release();
    }
};
