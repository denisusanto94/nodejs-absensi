const pool = require('../config/db');

exports.uploadCheckinFoto = async (req, res) => {
    try {
        const userId = req.userId;

        if (!req.file) {
            return res.status(400).json({ message: 'No photo uploaded.' });
        }

        // Check if user has checked in today for transum
        const today = new Date().toISOString().slice(0, 10);
        const [existing] = await pool.execute(
            'SELECT * FROM attendances_transum WHERE user_id = ? AND DATE(check_in) = ?',
            [userId, today]
        );

        if (existing.length === 0) {
            return res.status(400).json({ message: 'No transum check-in found for today. Please check in first.' });
        }

        const attendance = existing[0];
        const filePath = req.file.filename;

        // Update check-in photo in attendance_transum record
        await pool.execute(
            'UPDATE attendances_transum SET check_in_photo = ? WHERE id = ?',
            [filePath, attendance.id]
        );

        res.status(200).json({
            message: 'Transum check-in photo uploaded successfully',
            filename: filePath,
            attendance_transum_id: attendance.id
        });

    } catch (err) {
        console.error('Upload transum check-in photo error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.uploadCheckoutFoto = async (req, res) => {
    try {
        const userId = req.userId;

        if (!req.file) {
            return res.status(400).json({ message: 'No photo uploaded.' });
        }

        // Check if user has an active check-in today for transum
        const today = new Date().toISOString().slice(0, 10);
        const [existing] = await pool.execute(
            'SELECT * FROM attendances_transum WHERE user_id = ? AND DATE(check_in) = ?',
            [userId, today]
        );

        if (existing.length === 0) {
            return res.status(400).json({ message: 'No transum record found for today.' });
        }

        const attendance = existing[0];
        const filePath = req.file.filename;

        // Update check-out photo in attendance_transum record
        await pool.execute(
            'UPDATE attendances_transum SET check_out_photo = ? WHERE id = ?',
            [filePath, attendance.id]
        );

        res.status(200).json({
            message: 'Transum check-out photo uploaded successfully',
            filename: filePath,
            attendance_transum_id: attendance.id
        });

    } catch (err) {
        console.error('Upload transum check-out photo error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
