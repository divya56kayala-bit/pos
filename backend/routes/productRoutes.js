const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, productController.getAllProducts);
router.get('/barcode/:barcode', verifyToken, productController.getProductByBarcode);
router.post('/barcode', verifyToken, isAdmin, productController.createProductByBarcode);
router.get('/:id', verifyToken, productController.getProductById);
router.post('/', verifyToken, isAdmin, productController.createProduct);
router.put('/:id', verifyToken, isAdmin, productController.updateProduct);
router.delete('/:id', verifyToken, isAdmin, productController.deleteProduct);

module.exports = router;
