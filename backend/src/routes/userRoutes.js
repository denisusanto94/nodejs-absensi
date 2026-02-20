const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isAdmin, userController.getUsers);
router.post('/', verifyToken, isAdmin, userController.createUser);
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);
router.put('/:id', verifyToken, isAdmin, userController.updateUser);

module.exports = router;
