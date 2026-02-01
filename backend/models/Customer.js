const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    address: { type: String },
    points: { type: Number, default: 0 },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bill' }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
