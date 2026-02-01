const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
    },
    productId: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitCost: {
        type: Number,
        required: true,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    supplier: {
        type: String,
        default: 'Generic Supplier'
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Purchase', purchaseSchema);
