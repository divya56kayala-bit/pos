const net = require('net');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const PRINTER_HOST = '127.0.0.1'; // Or localhost
const PRINTER_PORT = 9100;

function printRaw(tsplString) {
    return new Promise((resolve, reject) => {
        // 1. Try Network Printing First
        const client = new net.Socket();
        let handled = false;

        client.on('error', (err) => {
            if (!handled) {
                handled = true;
                console.log('Network Print Failed, attempting USB...', err.message);
                tryUSB(tsplString).then(resolve).catch((usbErr) => {
                    reject(new Error(`Network: ${err.message}, USB: ${usbErr.message}`));
                });
            }
        });

        const timeout = setTimeout(() => {
            if (!handled) {
                handled = true;
                client.destroy();
                console.log('Network Print Timed Out, attempting USB...');
                tryUSB(tsplString).then(resolve).catch((usbErr) => {
                    reject(new Error(`Network: Timeout, USB: ${usbErr.message}`));
                });
            }
        }, 2000); // 2 second timeout for network

        client.connect(PRINTER_PORT, PRINTER_HOST, () => {
            if (!handled) {
                client.write(tsplString, () => {
                    handled = true;
                    clearTimeout(timeout);
                    client.end();
                });
            }
        });

        client.on('close', () => {
            // Only resolve if we actually wrote to it successfully (handled is true)
            // But 'close' emits after error too.
            if (handled && !client.destroyed) { // Check logic here or simpler: resolve in callback
                resolve({ success: true, method: 'Network' });
            }
        });

        // Simplified Logic: Resolve on end/close if no error?
        // Actually, let's just use the write callback for success in network case
        // But we need to wait for data to flush? client.end() does that.
    });
}

function tryUSB(data) {
    return new Promise((resolve, reject) => {
        try {
            const device = new escpos.USB(); // Auto-detect
            device.open((err) => {
                if (err) {
                    return reject(new Error("USB Open Failed: " + err));
                }

                device.write(data, (writeErr) => {
                    if (writeErr) {
                        device.close();
                        return reject(new Error("USB Write Failed: " + writeErr));
                    }

                    device.close();
                    console.log('Printed via USB');
                    resolve({ success: true, method: 'USB' });
                });
            });
        } catch (err) {
            reject(new Error("USB Device Not Found or Driver Issue: " + err.message));
        }
    });
}

module.exports = { printRaw };
