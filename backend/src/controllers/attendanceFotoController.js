const path = require('path');
const pool = require('../config/db');

exports.uploadCheckinFoto = async (req, res) => {
    try {
        const userId = req.userId;

        if (!req.file) {
            return res.status(400).json({ message: 'No photo uploaded.' });
        }

        // Check if user has checked in today
        const today = new Date().toISOString().slice(0, 10);
        const [existing] = await pool.execute(
            'SELECT * FROM attendances WHERE user_id = ? AND DATE(check_in) = ?',
            [userId, today]
        );

        if (existing.length === 0) {
            return res.status(400).json({ message: 'No check-in found for today. Please check in first.' });
        }

        const attendance = existing[0];
        const filePath = req.file.filename;

        // Update check-in photo in attendance record
        await pool.execute(
            'UPDATE attendances SET check_in_foto = ? WHERE id = ?',
            [filePath, attendance.id]
        );

        res.status(200).json({
            message: 'Check-in photo uploaded successfully',
            filename: filePath,
            attendance_id: attendance.id
        });

    } catch (err) {
        console.error('Upload check-in photo error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.uploadCheckoutFoto = async (req, res) => {
    try {
        const userId = req.userId;

        if (!req.file) {
            return res.status(400).json({ message: 'No photo uploaded.' });
        }

        // Check if user has an active check-in today (already checked in, not yet checked out or already checked out)
        const today = new Date().toISOString().slice(0, 10);
        const [existing] = await pool.execute(
            'SELECT * FROM attendances WHERE user_id = ? AND DATE(check_in) = ?',
            [userId, today]
        );

        if (existing.length === 0) {
            return res.status(400).json({ message: 'No attendance record found for today.' });
        }

        const attendance = existing[0];
        const filePath = req.file.filename;

        // Update check-out photo in attendance record
        await pool.execute(
            'UPDATE attendances SET check_out_foto = ? WHERE id = ?',
            [filePath, attendance.id]
        );

        res.status(200).json({
            message: 'Check-out photo uploaded successfully',
            filename: filePath,
            attendance_id: attendance.id
        });

    } catch (err) {
        console.error('Upload check-out photo error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
