const pool = require('../config/db');
const geolib = require('geolib');
const ExcelJS = require('exceljs');

const OFFICE_RADIUS_METERS = 100;

exports.checkIn = async (req, res) => {
    try {
        const { latitude, longitude, device_info } = req.body;
        const userId = req.userId;

        // 1. Validation: Check if already checked in today
        const today = new Date().toISOString().slice(0, 10);
        const [existing] = await pool.execute(
            'SELECT * FROM attendance WHERE user_id = ? AND type = "check_in" AND DATE(timestamp) = ?',
            [userId, today]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already checked in today.' });
        }

        // 2. Geo: Get User Location and Office Location
        // Simplification: Assume 1 Main Office or check nearest.
        const [offices] = await pool.query('SELECT * FROM office_locations');
        let validLocation = false;
        let distance = -1;

        if (offices.length === 0) {
            // If no office defined, allow (or block depending on policy). Use env default if available.
            // For safety, let's assume valid.
            validLocation = true;
        } else {
            for (const office of offices) {
                const dist = geolib.getDistance(
                    { latitude, longitude },
                    { latitude: office.latitude, longitude: office.longitude }
                );
                if (dist <= (office.radius || OFFICE_RADIUS_METERS)) {
                    validLocation = true;
                    distance = dist;
                    break;
                }
            }
        }

        if (!validLocation) {
            return res.status(400).json({ message: 'You are outside the office radius.' });
        }

        // 3. Shift Logic (Simple comparison)
        const [users] = await pool.execute('SELECT shift_start FROM users WHERE id = ?', [userId]);
        const shiftStart = users[0].shift_start; // "09:00:00"

        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0]; // "HH:MM:SS"
        let status = 'valid';

        // Simple Late check (if check in > shift start + grace period e.g. 15 mins)
        if (currentTime > shiftStart /* + margin */) {
            status = 'late';
        }

        await pool.execute(
            'INSERT INTO attendance (user_id, type, timestamp, latitude, longitude, status, device_info) VALUES (?, ?, NOW(), ?, ?, ?, ?)',
            [userId, 'check_in', latitude, longitude, status, device_info || 'ZeppApp']
        );

        res.status(200).json({ message: 'Check-in successful', status, distance });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkOut = async (req, res) => {
    try {
        const { latitude, longitude, device_info } = req.body;
        const userId = req.userId;

        // Check if already checked out today?
        const today = new Date().toISOString().slice(0, 10);
        const [existing] = await pool.execute(
            'SELECT * FROM attendance WHERE user_id = ? AND type = "check_out" AND DATE(timestamp) = ?',
            [userId, today]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already checked out today.' });
        }

        // Geo Check (Optional: Allow check out from anywhere? Usually restrict to office too).
        // Let's enforce it.
        const [offices] = await pool.query('SELECT * FROM office_locations');
        let validLocation = false;
        for (const office of offices) {
            const dist = geolib.getDistance(
                { latitude, longitude },
                { latitude: office.latitude, longitude: office.longitude }
            );
            if (dist <= (office.radius || OFFICE_RADIUS_METERS)) {
                validLocation = true;
                break;
            }
        }

        if (!validLocation) {
            return res.status(400).json({ message: 'You must be at the office to check out.' });
        }

        await pool.execute(
            'INSERT INTO attendance (user_id, type, timestamp, latitude, longitude, status, device_info) VALUES (?, ?, NOW(), ?, ?, ?, ?)',
            [userId, 'check_out', latitude, longitude, 'valid', device_info || 'ZeppApp']
        );

        res.status(200).json({ message: 'Check-out successful' });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllAttendance = async (req, res) => {
    try {
        let query = `
            SELECT a.*, u.name 
            FROM attendance a 
            JOIN users u ON a.user_id = u.id 
        `;
        let params = [];

        if (req.userRole !== 'admin') {
            query += ' WHERE a.user_id = ?';
            params.push(req.userId);
        }

        query += ' ORDER BY a.timestamp DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.exportExcel = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.id, u.name, a.type, a.timestamp, a.status 
            FROM attendance a 
            JOIN users u ON a.user_id = u.id 
            ORDER BY a.timestamp DESC
        `);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Attendance');

        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Time', key: 'timestamp', width: 20 },
            { header: 'Status', key: 'status', width: 10 }
        ];

        sheet.addRows(rows);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
