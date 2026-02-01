const net = require('net');

const generateTsplLabel = ({ name, barcode, mrp, offerPrice }) => {
    return `SIZE 50 mm,30 mm
GAP 2 mm,0
DIRECTION 1
CLS
TEXT 20,20,"3",0,1,1,"${name}"
BARCODE 20,60,"128",70,1,0,2,2,"${barcode}"
TEXT 20,135,"3",0,1,1,"MRP: ₹${mrp}"
TEXT 20,160,"3",0,1,1,"Offer: ₹${offerPrice}"
PRINT 1`;
};

const sendToNetworkPrinter = (host, content, port = 9100) => {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        client.connect(port, host, () => {
            client.write(content, () => {
                client.end();
                resolve();
            });
        });
        client.on('error', (err) => {
            reject(err);
        });
    });
};

module.exports = { generateTsplLabel, sendToNetworkPrinter };
