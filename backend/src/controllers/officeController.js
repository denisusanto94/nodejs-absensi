const pool = require('../config/db');

exports.getOffices = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM office_locations');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createOffice = async (req, res) => {
    const { name, latitude, longitude, radius } = req.body;
    try {
        await pool.execute('INSERT INTO office_locations (name, latitude, longitude, radius) VALUES (?, ?, ?, ?)',
            [name, latitude, longitude, radius || 100]);
        res.status(201).json({ message: 'Office location created' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteOffice = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM office_locations WHERE id = ?', [id]);
        res.json({ message: 'Office location deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateOffice = async (req, res) => {
    const { id } = req.params;
    const { name, latitude, longitude, radius } = req.body;
    try {
        await pool.execute(
            'UPDATE office_locations SET name = ?, latitude = ?, longitude = ?, radius = ? WHERE id = ?',
            [name, latitude, longitude, radius, id]
        );
        res.json({ message: 'Office location updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
