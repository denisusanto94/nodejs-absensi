const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.execute(`
            SELECT u.*, r.roles_name as role 
            FROM users u
            LEFT JOIN users_has_roles uhr ON u.id = uhr.id_users
            LEFT JOIN roles r ON uhr.id_roles = r.id
            WHERE u.email = ?
        `, [email]);

        if (rows.length === 0) {
            console.log(`Login failed: User not found (${email})`);
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];

        if (!user.is_active) {
            return res.status(401).json({ message: 'Account is inactive' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            console.log(`Login failed: Invalid password for user ${email}`);
            return res.status(401).json({ auth: false, token: null, message: 'Invalid Password' });
        }

        // Fetch user permissions
        let permissions = [];
        if (user.role === 'super_admin') {
            const [allPerms] = await pool.query('SELECT permissions_name FROM permissions');
            permissions = allPerms.map(p => p.permissions_name);
        } else {
            const [permRows] = await pool.execute(`
                SELECT DISTINCT p.permissions_name
                FROM users_has_roles uhr
                JOIN roles_has_permission rhp ON uhr.id_roles = rhp.id_roles
                JOIN permissions p ON rhp.id_permissions = p.id
                WHERE uhr.id_users = ?
            `, [user.id]);
            permissions = permRows.map(p => p.permissions_name);
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: 86400 // 24 hours
        });

        // Update last login
        await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        console.log(`Login success: ${email}`);
        res.status(200).json({
            auth: true,
            token: token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: permissions
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.execute(`
            SELECT u.id as id_user, u.email, u.password, u.is_active, 
                   r.roles_name as roles, d.divisions_name as divisi
            FROM users u
            LEFT JOIN users_has_roles uhr ON u.id = uhr.id_users
            LEFT JOIN roles r ON uhr.id_roles = r.id
            LEFT JOIN divisions d ON uhr.divisions_id = d.id
            WHERE u.email = ?
        `, [email]);

        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = rows[0];
        if (!user.is_active) return res.status(401).json({ message: 'Account is inactive' });

        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) return res.status(401).json({ message: 'Invalid Password' });

        res.json({
            id_user: user.id_user,
            email: user.email,
            roles: user.roles || '',
            divisi: user.divisi || ''
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.register = async (req, res) => {
    const { email, password, name, division_id, office_id } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        await pool.execute('INSERT INTO users (email, password, name, division_id, office_id) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, name, division_id, office_id]);
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.me = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT u.id, u.name, u.email, r.roles_name as role
            FROM users u
            LEFT JOIN users_has_roles uhr ON u.id = uhr.id_users
            LEFT JOIN roles r ON uhr.id_roles = r.id
            WHERE u.id = ?
        `, [req.userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];

        // Fetch user permissions
        let permissions = [];
        if (user.role === 'super_admin') {
            const [allPerms] = await pool.query('SELECT permissions_name FROM permissions');
            permissions = allPerms.map(p => p.permissions_name);
        } else {
            const [permRows] = await pool.execute(`
                SELECT DISTINCT p.permissions_name
                FROM users_has_roles uhr
                JOIN roles_has_permission rhp ON uhr.id_roles = rhp.id_roles
                JOIN permissions p ON rhp.id_permissions = p.id
                WHERE uhr.id_users = ?
            `, [user.id]);
            permissions = permRows.map(p => p.permissions_name);
        }

        res.json({
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: permissions
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
