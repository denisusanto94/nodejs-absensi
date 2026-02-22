const pool = require('../config/db');
const geolib = require('geolib');
const ExcelJS = require('exceljs');

exports.checkIn = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const userId = req.userId;

        // 1. Validation: Check if already checked in today
        const today = new Date().toISOString().slice(0, 10);
        const [existing] = await pool.execute(
            'SELECT * FROM attendances WHERE user_id = ? AND DATE(check_in) = ?',
            [userId, today]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already checked in today.' });
        }

        // 2. Geo: Get User Location and Office Location
        // Fetch office assigned to user
        const [userRows] = await pool.execute('SELECT office_id FROM users WHERE id = ?', [userId]);
        const officeId = userRows[0].office_id;

        if (!officeId) {
            return res.status(400).json({ message: 'User has no assigned office.' });
        }

        const [officeRows] = await pool.execute('SELECT * FROM offices WHERE id = ?', [officeId]);
        const office = officeRows[0];

        const dist = geolib.getDistance(
            { latitude, longitude },
            { latitude: office.latitude, longitude: office.longitude }
        );

        if (dist > office.radius_meter) {
            return res.status(400).json({ message: 'You are outside the office radius.', distance: dist });
        }

        // 3. Shift Logic
        // Find active shift for user
        const [shiftRows] = await pool.execute(`
            SELECT s.* FROM shifts s
            JOIN user_shifts us ON s.id = us.shift_id
            WHERE us.user_id = ? AND us.start_date <= CURDATE() AND (us.end_date IS NULL OR us.end_date >= CURDATE())
            LIMIT 1
        `, [userId]);

        let status = 'present';
        if (shiftRows.length > 0) {
            const shift = shiftRows[0];
            const now = new Date();
            const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

            const [shH, shM, shS] = shift.check_in.split(':').map(Number);
            const shiftStartTime = shH * 3600 + shM * 60 + shS;
            const toleranceSeconds = shift.late_tolerance_minute * 60;

            if (currentTime > (shiftStartTime + toleranceSeconds)) {
                status = 'late';
            }
        }

        await pool.execute(
            'INSERT INTO attendances (user_id, office_id, check_in, check_in_lat, check_in_long, status) VALUES (?, ?, NOW(), ?, ?, ?)',
            [userId, officeId, latitude, longitude, status]
        );

        res.status(200).json({ message: 'Check-in successful', status, distance: dist });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.checkOut = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const userId = req.userId;

        const today = new Date().toISOString().slice(0, 10);
        const [existing] = await pool.execute(
            'SELECT * FROM attendances WHERE user_id = ? AND DATE(check_in) = ? AND check_out IS NULL',
            [userId, today]
        );

        if (existing.length === 0) {
            return res.status(400).json({ message: 'No active check-in found for today.' });
        }

        const attendance = existing[0];
        const officeId = attendance.office_id;

        const [officeRows] = await pool.execute('SELECT * FROM offices WHERE id = ?', [officeId]);
        const office = officeRows[0];

        const dist = geolib.getDistance(
            { latitude, longitude },
            { latitude: office.latitude, longitude: office.longitude }
        );

        if (dist > office.radius_meter) {
            return res.status(400).json({ message: 'You must be at the office to check out.' });
        }

        // Calculate work duration
        const checkInTime = new Date(attendance.check_in);
        const checkOutTime = new Date();
        const durationMinutes = Math.floor((checkOutTime - checkInTime) / 60000);

        await pool.execute(
            'UPDATE attendances SET check_out = NOW(), check_out_lat = ?, check_out_long = ?, work_duration = ? WHERE id = ?',
            [latitude, longitude, durationMinutes, attendance.id]
        );

        res.status(200).json({ message: 'Check-out successful', duration_minutes: durationMinutes });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllAttendance = async (req, res) => {
    try {
        let query = `
            SELECT a.*, u.name, o.office_name 
            FROM attendances a 
            JOIN users u ON a.user_id = u.id 
            JOIN offices o ON a.office_id = o.id
        `;
        let params = [];

        // Note: Assuming there's a way to identify admin. Since 'role' was removed from users, 
        // we might need another way or just check a specific email for now, or add role back.
        // For now let's assume we filter by userId if not admin.
        // User's provided script didn't have a 'role' column in 'users', but the seed data has 'Super Admin'.

        // I'll check if the user is the one from seed data 'admin@company.com'
        const [adminUser] = await pool.execute('SELECT id FROM users WHERE email = ?', ['admin@company.com']);
        const isAdmin = adminUser.length > 0 && adminUser[0].id === req.userId;

        if (!isAdmin) {
            query += ' WHERE a.user_id = ?';
            params.push(req.userId);
        }

        query += ' ORDER BY a.check_in DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.exportExcel = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.id, u.name, a.check_in, a.check_out, a.status, a.work_duration 
            FROM attendances a 
            JOIN users u ON a.user_id = u.id 
            ORDER BY a.check_in DESC
        `);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Attendance');

        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Check In', key: 'check_in', width: 20 },
            { header: 'Check Out', key: 'check_out', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Duration (Min)', key: 'work_duration', width: 15 }
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

exports.submitAttendance = async (req, res) => {
    const {
        id_user, office_id,
        check_in, check_in_lat, check_in_long,
        check_out, check_out_lat, check_out_long
    } = req.body;

    try {
        // Validation: Calculate duration if check_out exists
        let work_duration = 0;
        if (check_in && check_out) {
            const start = new Date(check_in);
            const end = new Date(check_out);
            work_duration = Math.floor((end - start) / 60000);
        }

        // Determine status (simple logic for now)
        const status = 'present';

        await pool.execute(`
            INSERT INTO attendances 
            (user_id, office_id, check_in, check_in_lat, check_in_long, check_out, check_out_lat, check_out_long, work_duration, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id_user, office_id,
            check_in || null, check_in_lat || null, check_in_long || null,
            check_out || null, check_out_lat || null, check_out_long || null,
            work_duration, status
        ]);

        res.status(201).json({ message: 'Attendance submitted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
