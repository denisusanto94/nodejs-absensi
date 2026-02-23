const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/attendanceTransumFotoController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Multer storage configuration — save to uploads/upload_transum
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/upload_transum'));
    },
    filename: (req, file, cb) => {
        const userId = req.userId;
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `transum_${userId}_${timestamp}${ext}`);
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

router.post('/checkin', verifyToken, upload.single('foto'), controller.uploadCheckinFoto);
router.post('/checkout', verifyToken, upload.single('foto'), controller.uploadCheckoutFoto);

module.exports = router;
