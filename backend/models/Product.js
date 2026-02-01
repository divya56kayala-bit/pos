
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  barcode: { type: String, unique: true, sparse: true }, // sparse allows unique index to ignore nulls if any, though we enforce generation
  category: { type: String, required: true },
  subCategory: { type: String },
  mrp: { type: Number },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  gst: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 }
}, { timestamps: true });

// Auto-generate barcode if not provided
productSchema.pre('save', function (next) {
  if (!this.barcode) {
    this.barcode = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
