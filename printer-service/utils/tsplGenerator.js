function generateBarcodeLabel(data) {
    const { name, barcode, mrp, offer } = data;

    // TSPL commands (raw format)
    // SIZE 50 mm,30 mm
    // GAP 2 mm,0
    // DIRECTION 1
    // CLS
    // TEXT x,y,"font",rotation,x-mul,y-mul,"text"
    // BARCODE x,y,"type",height,human,rotation,narrow,wide,"content"
    // PRINT 1

    return `SIZE 50 mm,30 mm
GAP 2 mm,0
DIRECTION 1
CLS
TEXT 20,20,"3",0,1,1,"${name}"
BARCODE 20,50,"128",70,1,0,2,2,"${barcode}"
TEXT 20,135,"3",0,1,1,"MRP: ₹${mrp}"
TEXT 20,160,"3",0,1,1,"Offer: ₹${offer}"
PRINT 1
`;
}

module.exports = { generateBarcodeLabel };
