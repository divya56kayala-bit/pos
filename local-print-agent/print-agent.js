const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// --- CONFIG ---
const PORT = 9101;
// The printer MUST be shared in Windows as "POS_Printer"
const PRINTER_SHARE_NAME = 'POS_Printer';

// --- TSPL GENERATOR ---
function generateBarcodeLabel(data) {
    const { name, barcode, mrp, offer } = data;
    const safeName = (name || '').replace(/"/g, '');
    const safeBarcode = (barcode || '').replace(/"/g, '');

    return `SIZE 50 mm,30 mm
GAP 2 mm,0
DIRECTION 1
CLS
TEXT 20,20,"3",0,1,1,"${safeName}"
BARCODE 20,50,"128",70,1,0,2,2,"${safeBarcode}"
TEXT 20,135,"3",0,1,1,"MRP: Rs.${mrp}"
TEXT 20,160,"3",0,1,1,"Offer: Rs.${offer}"
PRINT 1
`;
}

// --- SPOOLER LOGIC (DRIVERLESS) ---
function printViaSpooler(tsplString) {
    return new Promise((resolve, reject) => {
        const tempFile = path.join(os.tmpdir(), `pos-print-${Date.now()}.txt`);

        // 1. Write Data to Temp File
        fs.writeFile(tempFile, tsplString, (err) => {
            if (err) return reject(new Error("File Write Failed: " + err.message));

            // 2. Send to Shared Printer via Command Line
            // Command: COPY /B "c:\temp\file.txt" "\\127.0.0.1\POS_Printer"
            const command = `COPY /B "${tempFile}" "\\\\127.0.0.1\\${PRINTER_SHARE_NAME}"`;

            console.log("Executing:", command);

            exec(command, (execErr, stdout, stderr) => {
                // Cleanup temp file
                try { fs.unlinkSync(tempFile); } catch (e) { }

                if (execErr) {
                    return reject(new Error(`Spooler Failed: ${execErr.message} (Is printer shared as '${PRINTER_SHARE_NAME}'?)`));
                }

                console.log("Spooler Output:", stdout);
                resolve({ success: true, method: 'WindowsSpooler' });
            });
        });
    });
}

// --- EXPRESS SERVER ---
const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'], credentials: true }));
app.use((req, res, next) => { res.header("Access-Control-Allow-Private-Network", "true"); next(); });
app.use(bodyParser.json());

const printHandler = async (req, res) => {
    console.log('PRINT JOB RECEIVED');
    const { name, barcode, mrp, offer } = req.body;

    if (!name || !barcode) {
        return res.json({ success: false, message: "Missing Data" });
    }

    try {
        const tspl = generateBarcodeLabel({ name, barcode, mrp, offer });
        await printViaSpooler(tspl);
        console.log('Print Success via Spooler');
        res.json({ success: true, message: "Printed" });
    } catch (error) {
        console.error('Print Error:', error);
        res.json({ success: true, warning: error.message });
    }
};

app.post('/print', printHandler);
app.post('/api/print/barcode', printHandler);
app.get('/print', (req, res) => res.send('<h1>✅ Agent is Running (v3 - Driverless)</h1>'));
app.options('*', (req, res) => { res.header("Access-Control-Allow-Private-Network", "true"); res.sendStatus(204); });

process.on('uncaughtException', (err) => { console.error('UNCAUGHT EXCEPTION:', err); });

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Local Print Agent running on port ${PORT}`);
    console.log(`TARGET PRINTER SHARED NAME: \\\\127.0.0.1\\${PRINTER_SHARE_NAME}`);
});
