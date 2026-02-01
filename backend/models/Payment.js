const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    billId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['Cash', 'UPI', 'Card'], required: true },
    referenceId: { type: String }, // For UPI/Card ref
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
