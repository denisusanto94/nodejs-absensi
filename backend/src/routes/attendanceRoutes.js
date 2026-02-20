const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.post('/checkin', verifyToken, attendanceController.checkIn);
router.post('/checkout', verifyToken, attendanceController.checkOut);
router.get('/all', verifyToken, attendanceController.getAllAttendance);
router.get('/export', verifyToken, isAdmin, attendanceController.exportExcel);

module.exports = router;
