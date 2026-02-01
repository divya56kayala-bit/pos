const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { generateBarcodeLabel } = require('./utils/tsplGenerator');
const { printRaw } = require('./utils/tscRawPrinter');

const app = express();
const PORT = 3333;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Logging Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Barcode Print Route
app.post('/api/print/barcode', async (req, res) => {
    console.log('PRINT BARCODE REQUEST RECEIVED', req.body);

    try {
        const { name, barcode, mrp, offer } = req.body;

        // 1. Validate
        if (!name || !barcode) {
            console.error('ERROR: Missing name or barcode');
            return res.status(400).json({ success: false, message: "Missing label data" });
        }

        // 2. Generate TSPL (Safely)
        let tspl;
        try {
            tspl = generateBarcodeLabel({ name, barcode, mrp, offer });
        } catch (genErr) {
            console.error('ERROR: TSPL Generation Failed', genErr);
            return res.status(200).json({ success: false, message: "Label generation failed, but server alive." });
        }

        // 3. Print (Safely)
        try {
            await printRaw(tspl);
            console.log('PRINT SUCCESS');
            return res.json({ success: true, message: "Printed successfully" });
        } catch (printErr) {
            console.error('ERROR: Print Connection Failed', printErr.message);
            // ALWAYS SUCCESS TRUE as per request to prevent connection refused/ui crash
            return res.json({
                success: true,
                message: "Print sent (Printer offline or busy)",
                error: printErr.message
            });
        }

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        // Catch-all to prevent 500 if possible, though express needs status
        return res.status(200).json({ success: true, message: "Server caught error", error: err.message });
    }
});

// Health Check
app.get('/', (req, res) => res.send('Printer Service Running'));

// Global Error Handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    // Keep alive if possible
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Printer Service running on Port ${PORT}`);
    console.log(`   POST http://localhost:${PORT}/api/print/barcode`);
});

