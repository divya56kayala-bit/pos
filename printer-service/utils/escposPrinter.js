const net = require('net');

function printReceipt(data) {
    try {
        const storeName = data.storeName || 'Store';
        const subtotal = (data.subtotal || 0).toFixed(2);
        const tax = (data.tax || 0).toFixed(2);
        const total = (data.total || 0).toFixed(2);
        const paymentMode = data.paymentMode || 'Cash';

        let itemLines = '';
        if (data.items && Array.isArray(data.items)) {
            data.items.forEach(item => {
                const name = (item.name || '').substring(0, 11).padEnd(12, ' ');
                const qty = (item.qty || 0).toString().padEnd(5, ' ');
                const price = (item.price || 0).toFixed(2).padStart(8, ' ');
                itemLines += `${name}${qty}${price}\n`;
            });
        }

        const buffer = Buffer.from(
            '\x1B\x40' +
            '\x1B\x61\x01' +
            '\x1B\x45\x01' +
            `${storeName}\n` +
            '\x1B\x45\x00' +
            '\x1B\x61\x00' +
            '----------------------------\n' +
            'Item        Qty     Price\n' +
            '----------------------------\n' +
            itemLines +
            '----------------------------\n' +
            `Subtotal        ${subtotal.padStart(8, ' ')}\n` +
            `Tax             ${tax.padStart(8, ' ')}\n` +
            '----------------------------\n' +
            '\x1B\x45\x01' +
            `TOTAL           ${total.padStart(8, ' ')}\n` +
            '\x1B\x45\x00' +
            '----------------------------\n' +
            `Payment: ${paymentMode}\n` +
            'Thank you for shopping!\n\n' +
            '\x1D\x56\x00'
        );

        const client = new net.Socket();

        client.on('error', (err) => {
            console.error('Printer connection error:', err);
        });

        client.connect(9100, '127.0.0.1', () => {
            client.write(buffer);
            client.end();
            client.destroy();
        });

    } catch (error) {
        console.error('Receipt generation error:', error);
    }
}

module.exports = { printReceipt };
