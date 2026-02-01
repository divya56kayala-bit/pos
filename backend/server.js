
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Load routes with error handling
let authRoutes;
try {
  authRoutes = require('./routes/authRoutes');
  console.log('[SERVER] Auth routes loaded successfully');
  console.log('[SERVER] Auth routes type:', typeof authRoutes);
  if (authRoutes && authRoutes.stack) {
    console.log('[SERVER] Auth routes stack length:', authRoutes.stack.length);
  }
} catch (error) {
  console.error('[SERVER] CRITICAL: Failed to load authRoutes:', error);
  process.exit(1);
}

const productRoutes = require('./routes/productRoutes');
const billRoutes = require('./routes/billRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logging middleware - must be before routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`[REQUEST] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[REQUEST] Body:`, JSON.stringify(req.body, null, 2));
  next();
});

// Routes
console.log('[SERVER] Mounting routes...');
try {
  // Verify authRoutes before mounting
  console.log('[SERVER] Auth routes object:', {
    type: typeof authRoutes,
    isFunction: typeof authRoutes === 'function',
    hasStack: authRoutes && authRoutes.stack ? true : false,
    stackLength: authRoutes && authRoutes.stack ? authRoutes.stack.length : 0
  });

  if (authRoutes && authRoutes.stack) {
    console.log('[SERVER] Auth routes stack details:');
    authRoutes.stack.forEach((layer, index) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods);
        console.log(`  [${index}] ${methods.join(',').toUpperCase()} ${layer.route.path}`);
      } else {
        console.log(`  [${index}] Middleware: ${layer.name || 'unnamed'}`);
      }
    });
  }

  // Mount auth routes first
  app.use('/api/auth', authRoutes);
  console.log('[SERVER] ✓ Auth routes mounted at /api/auth');

  // Add a test route to verify auth routes are working
  app.get('/api/auth/test', (req, res) => {
    res.json({ message: 'Auth routes are working', timestamp: new Date().toISOString() });
  });

  // TEMPORARY: Direct login route as fallback to test if router mounting is the issue
  app.post('/api/auth/login-direct', async (req, res) => {
    console.log('[DIRECT LOGIN] Direct login route hit!');
    try {
      const authController = require('./controllers/authController');
      await authController.login(req, res);
    } catch (error) {
      console.error('[DIRECT LOGIN] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Verify the route is actually registered
  if (authRoutes && typeof authRoutes === 'function') {
    console.log('[SERVER] ✓ Auth routes is a valid Express router');
  } else {
    console.error('[SERVER] ✗ Auth routes is NOT a valid router!');
  }
} catch (error) {
  console.error('[SERVER] CRITICAL: Error mounting auth routes:', error);
  console.error('[SERVER] Error stack:', error.stack);
  throw error;
}

app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/purchases', purchaseRoutes);

app.get('/', (req, res) => {
  res.send('POS Backend is running');
});

app.get('/api', (req, res) => {
  res.json({ message: 'POS API - Backend is running' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Debug middleware - log all API requests before 404
app.use('/api', (req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.path}`);
  console.log(`[API REQUEST] Original URL: ${req.originalUrl}`);
  console.log(`[API REQUEST] Base URL: ${req.baseUrl}`);
  next();
});

// Catch-all 404 handler - must be last
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path} - Route not found`);
  console.log(`[404] Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    message: `No route found for ${req.method} ${req.path}`,
    hint: 'Check server logs for registered routes'
  });
});

// Start server first, then connect to MongoDB in background (non-blocking)

// Running in Local Storage Mode (JSON files)
console.log('[SERVER] Running in Local Storage Mode (JSON files)');

// Verify routes are registered
console.log('[SERVER] Verifying route registration...');
const registeredRoutes = [];

function extractRoutes(layer, basePath = '') {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
    registeredRoutes.push(`${methods} ${basePath}${layer.route.path}`);
  } else if (layer.name === 'router' || layer.name === 'bound dispatch') {
    const routerBase = layer.regexp ? layer.regexp.source.replace(/\\\/\?\^\$/, '').replace(/\\/, '/') : '';
    if (layer.handle && layer.handle.stack) {
      layer.handle.stack.forEach((sublayer) => {
        extractRoutes(sublayer, basePath + routerBase);
      });
    }
  }
}

if (app._router && app._router.stack) {
  app._router.stack.forEach((layer) => {
    extractRoutes(layer);
  });
}

console.log('[SERVER] Registered routes:', registeredRoutes.length > 0 ? registeredRoutes.join(', ') : 'NONE FOUND!');
const loginRoute = registeredRoutes.find(r => r.includes('login') || r.includes('/api/auth'));
console.log('[SERVER] Login route found:', loginRoute || 'NOT FOUND!');
console.log('[SERVER] All auth-related routes:', registeredRoutes.filter(r => r.includes('auth')).join(', ') || 'NONE!');

// Only start the server if this file is run directly (not imported)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SERVER] ✓ Server running on port ${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[SERVER] Storage: JSON files in ./data directory`);
  });
}

module.exports = app;
