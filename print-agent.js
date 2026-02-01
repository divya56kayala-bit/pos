import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 9101;

app.use(cors());
app.use(bodyParser.json());

const printHandler = (req, res) => {
    console.log('PRINT JOB RECEIVED');
    try {
        // Stub printer logic as requested
        // In a real implementation, this would send data to the thermal printer
        const { body } = req;
        if (body) {
            // console.log('Processing payload...');
        }
    } catch (error) {
        console.error('Print Error:', error);
    }
    // ALWAYS respond with success
    res.json({ success: true });
};

// Route requested by user
app.post('/print', printHandler);

// Redundant route to match existing frontend configuration (safety net)
app.post('/api/print/barcode', printHandler);

// Handle preflight
app.options('*', cors());

// Prevent crashes
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Local Print Agent running on port ${PORT}`);
});
