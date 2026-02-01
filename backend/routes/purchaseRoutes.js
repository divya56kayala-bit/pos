const express = require('express');
const router = express.Router();
const { createPurchase, getAllPurchases, updatePurchase, deletePurchase } = require('../controllers/purchaseController');

router.post('/', createPurchase);
router.get('/', getAllPurchases);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

module.exports = router;
