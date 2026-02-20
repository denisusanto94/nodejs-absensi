const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, name, role, shift_start, shift_end FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createUser = async (req, res) => {
    const { username, password, name, role, shift_start, shift_end } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    try {
        await pool.execute('INSERT INTO users (username, password, name, role, shift_start, shift_end) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, name, role || 'employee', shift_start, shift_end]);
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
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
    const { username, password, name, role, shift_start, shift_end } = req.body;

    try {
        let query = 'UPDATE users SET username = ?, name = ?, role = ?, shift_start = ?, shift_end = ?';
        let params = [username, name, role, shift_start, shift_end];

        if (password && password.trim() !== '') {
            const hashedPassword = bcrypt.hashSync(password, 8);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await pool.execute(query, params);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
