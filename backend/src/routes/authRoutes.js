const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/register', verifyToken, isAdmin, authController.register); // Admin only

module.exports = router;
