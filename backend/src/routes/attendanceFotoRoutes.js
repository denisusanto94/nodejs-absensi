const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const attendanceFotoController = require('../controllers/attendanceFotoController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/upload_absensi'));
    },
    filename: (req, file, cb) => {
        const userId = req.userId;
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${userId}_${timestamp}${ext}`);
    }
});

// File filter — only allow image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB
});

router.post('/checkin', verifyToken, upload.single('foto'), attendanceFotoController.uploadCheckinFoto);
router.post('/checkout', verifyToken, upload.single('foto'), attendanceFotoController.uploadCheckoutFoto);

module.exports = router;
