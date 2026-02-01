const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Add explicit logging for route registration
console.log('[AUTH ROUTES] Registering /login route');
router.post('/login', authController.login);

console.log('[AUTH ROUTES] Registering /register route');
router.post('/register', verifyToken, isAdmin, authController.register);

console.log('[AUTH ROUTES] Registering /users route');
router.get('/users', verifyToken, isAdmin, authController.getUsers);

// Add a test route to verify router is working
router.get('/test', (req, res) => {
  console.log('[AUTH ROUTES] /test route hit!');
  res.json({ message: 'Auth router is working', routes: ['/login', '/register', '/users'] });
});

console.log('[AUTH ROUTES] Router setup complete. Routes registered:', router.stack.length);

module.exports = router;
