const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, isAdmin, customerController.getAllCustomers);
router.get('/:id', verifyToken, isAdmin, customerController.getCustomerById);
router.post('/', verifyToken, customerController.createCustomer); // Employees need this for new customers
router.put('/:id', verifyToken, isAdmin, customerController.updateCustomer);
router.delete('/:id', verifyToken, isAdmin, customerController.deleteCustomer);
router.get('/:phone/orders', verifyToken, isAdmin, customerController.getOrdersByCustomer);
router.get('/phone/:phone', verifyToken, customerController.getCustomerByPhone);

module.exports = router;
