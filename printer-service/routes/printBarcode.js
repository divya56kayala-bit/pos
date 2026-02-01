const express = require('express');
const router = express.Router();
const { generateBarcodeLabel } = require('../utils/tsplGenerator');
const { printRaw } = require('../utils/tscRawPrinter');

router.post('/barcode', async (req, res) => {
    console.log('PRINT BARCODE REQUEST RECEIVED', req.body);

    try {
        const { name, barcode, mrp, offer } = req.body;

        // 1. Validate Input
        if (!name || !barcode) {
            console.error('PRINT BARCODE ERROR: Missing required fields');
            return res.status(400).json({ success: false, message: "Missing label data (name or barcode)" });
        }

        // 2. Generate TSPL
        let tspl;
        try {
            tspl = generateBarcodeLabel({ name, barcode, mrp, offer });
        } catch (genError) {
            console.error('PRINT BARCODE ERROR (Generation):', genError);
            return res.status(500).json({ success: false, message: "Label generation failed" });
        }

        // 3. Send to Printer
        try {
            await printRaw(tspl);
            console.log('PRINT BARCODE SUCCESS');
            return res.status(200).json({ success: true, message: "Label sent to printer" });
        } catch (printError) {
            console.error('PRINT BARCODE ERROR (Connection):', printError.message);
            // Return success: true to avoid UI blocking as requested, or at least a handled response
            // User requested: "Return { success: true } even if printer is temporarily unavailable"
            return res.status(200).json({
                success: true,
                message: "Print job queued (Printer may be offline, check connection)",
                warning: printError.message
            });
        }

    } catch (error) {
        console.error("PRINT BARCODE ERROR (Unhandled):", error);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
});

module.exports = router;
