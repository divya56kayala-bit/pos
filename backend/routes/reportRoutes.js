const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/summary', verifyToken, reportController.getSummary);
router.get('/daily', verifyToken, reportController.getDailySales || ((req, res) => res.status(404).json({ msg: "Deprecated" })));
router.get('/monthly', verifyToken, reportController.getMonthlySales);
router.get('/weekly-sales', verifyToken, reportController.getWeeklySales);
router.get('/analytics', verifyToken, reportController.getAnalytics);
router.get('/payment-distribution', verifyToken, reportController.getPaymentDistribution);

module.exports = router;
