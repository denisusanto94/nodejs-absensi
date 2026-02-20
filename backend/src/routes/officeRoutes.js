const express = require('express');
const router = express.Router();
const officeController = require('../controllers/officeController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isAdmin, officeController.getOffices);
router.post('/', verifyToken, isAdmin, officeController.createOffice);
router.delete('/:id', verifyToken, isAdmin, officeController.deleteOffice);
router.put('/:id', verifyToken, isAdmin, officeController.updateOffice);

module.exports = router;
