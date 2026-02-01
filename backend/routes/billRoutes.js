const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, billController.createBill);
router.get('/', verifyToken, billController.getAllBills);
router.get('/:id', verifyToken, billController.getBillById);

module.exports = router;
