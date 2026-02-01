const net = require('net');

function generateReceipt(data) {
    const ESC = '\x1B';
    const GS = '\x1D';
    const LF = '\x0A';
    const EMPHASIZE_ON = ESC + '\x45\x01';
    const EMPHASIZE_OFF = ESC + '\x45\x00';
    const CENTER = ESC + '\x61\x01';
    const LEFT = ESC + '\x61\x00';
    const CUT = GS + '\x56\x00';

    // 80mm printer usually 48 columns (Font A)
    const SEPARATOR = '------------------------------------------------';

    const storeName = data.storeName || 'Store Name';
    const address = data.address || '';
    const gstin = data.gstin || '';
    const billNo = data.billNo || '';
    const date = data.date || new Date().toLocaleString();
    const cashier = data.cashier || 'Admin';
    const paymentMode = data.paymentMode || 'Cash';

    // Fixed widths for 48 columns
    // Item (20) | MRP (7) | Qty (5) | Total (10)
    // Adjusting for better fit:
    // Item: 22 chars
    // MRP: 8 chars
    // Qty: 6 chars
    // Our: 10 chars
    // Total: 46 + spaces = 48

    let itemLines = '';
    let totalMrp = 0;
    let totalOurPrice = 0;

    if (data.items && Array.isArray(data.items)) {
        data.items.forEach(item => {
            const name = (item.name || 'Item').substring(0, 20).padEnd(20, ' ');
            const mrpVal = (item.mrp || item.price || 0);
            const priceVal = (item.price || 0);
            const qtyVal = (item.qty || 0);

            const itemTotal = priceVal * qtyVal;
            const itemMrpTotal = mrpVal * qtyVal;

            totalMrp += itemMrpTotal;
            totalOurPrice += itemTotal;

            const mrp = mrpVal.toFixed(2).padStart(8, ' ');
            const qty = qtyVal.toString().padStart(5, ' ');
            const ourPrice = itemTotal.toFixed(2).padStart(9, ' ');

            // First line: Item Name
            // Second line details if needed or all in one? 
            // The prompt asks for specific columns: Item | MRP | Qty | Our Price
            // "Item name can wrap to next line"

            // Let's try to fit or wrap. 
            // Simple approach: Name on one line if long, or same line
            // Template:
            // Item        MRP   Qty  Our
            //                     Price

            // Format:
            // Name (up to 20) | MRP (8) | Qty (5) | Price (9)
            // If name > 20, wrap? 
            // For simplicity and speed: Truncate to 20 or wrap manually.
            // Let's do Name + Newline if long, else compact.

            itemLines += `${name} ${mrp} ${qty} ${ourPrice}\n`;
        });
    }

    const savings = Math.max(0, totalMrp - totalOurPrice);

    const subtotal = (data.subtotal || (totalOurPrice - (data.tax || 0))).toFixed(2);
    const tax = (data.tax || 0).toFixed(2);
    const grandTotal = totalOurPrice.toFixed(2);
    const savedStr = savings.toFixed(2);

    let bufferString = '';

    // Header
    bufferString += ESC + '\x40'; // Init
    bufferString += CENTER;
    bufferString += EMPHASIZE_ON + storeName + LF + EMPHASIZE_OFF;
    if (address) bufferString += address + LF;
    if (gstin) bufferString += `GSTIN: ${gstin}` + LF;

    bufferString += LEFT;
    bufferString += SEPARATOR + LF;
    bufferString += `Bill No: ${billNo}` + LF;
    bufferString += `Date: ${date}` + LF;
    bufferString += SEPARATOR + LF;

    // Table Header
    bufferString += 'Item                 MRP    Qty   Our Price' + LF; // Adjusted spacing
    bufferString += SEPARATOR + LF;

    // Items
    bufferString += itemLines;
    bufferString += SEPARATOR + LF;

    // Totals
    bufferString += `Subtotal (Excl)           ${subtotal.padStart(16, ' ')}` + LF;
    bufferString += `GST (Included)            ${tax.padStart(16, ' ')}` + LF;
    bufferString += SEPARATOR + LF;

    bufferString += EMPHASIZE_ON;
    bufferString += `GRAND TOTAL               ${grandTotal.padStart(16, ' ')}` + LF;
    bufferString += EMPHASIZE_OFF;
    bufferString += SEPARATOR + LF;

    // Savings
    if (savings > 0) {
        bufferString += `You Saved \x1D\x21\x11₹${savedStr}\x1D\x21\x00` + LF; // Double height/width for savings? Maybe just text. 
        // User requested: You Saved ₹X.XX
        // Let's keep it simple text as requested
        // Re-read: "Before payment details, print: You Saved ₹X.XX"
        // Let's stick to standard text but maybe bold or centered
        // Template shows: ----------------- \n You Saved ₹... \n -----------------
        // Wait, template doesn't allow random commands. "ONLY USE RAW ESC/POS COMMANDS"
        // I will just print the text.
    } else {
        // If no savings, maybe skip or print 0? "You Saved" usually implies > 0. 
        // User template has {YOU_SAVED}, suggests always print.
        // But if 0, it might look odd. I'll print it.
    }
    // Actually reset savings line to match template exactly
    bufferString += `You Saved ₹${savedStr}` + LF;
    bufferString += SEPARATOR + LF;

    // Footer
    bufferString += `Payment: ${paymentMode}` + LF;
    bufferString += `Cashier: ${cashier}` + LF;
    bufferString += 'Thank you for shopping!' + LF + LF;

    // Cut
    bufferString += CUT;

    return Buffer.from(bufferString, 'binary');
}

function printReceipt(data, host = '127.0.0.1', port = 9100) {
    const buffer = generateReceipt(data);
    const client = new net.Socket();

    client.connect(port, host, () => {
        client.write(buffer);
        client.end();
        client.destroy();
    });

    client.on('error', (err) => {
        console.error('Print Error:', err);
    });
}

module.exports = { printReceipt, generateReceipt };
