
const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNo: { type: String, required: true, unique: true },
  items: [{
    productId: { type: String, ref: 'Product' },
    name: String,
    qty: Number,
    mrp: Number,
    price: Number,
    gst: Number,
    amount: Number
  }],
  subTotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card'], required: true },
  customer: {
    name: String,
    phone: String,
    id: { type: String, ref: 'Customer' }
  },
  customerName: String,
  customerPhone: String,
  employeeId: { type: String, ref: 'User' },
  employeeName: String
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
