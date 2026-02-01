const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

// @desc    Log a new purchase and update stock
// @route   POST /api/purchases
// @access  Private (Admin/Employee)
const createPurchase = async (req, res) => {
    try {
        const { productId, productName, quantity, unitCost, supplier } = req.body;

        if (!productId || !quantity || !unitCost) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const totalAmount = quantity * unitCost;

        // Create Purchase Record
        const purchase = new Purchase({
            productId,
            productName,
            quantity,
            unitCost,
            totalAmount,
            supplier: supplier || 'Generic Supplier',
        });

        await purchase.save();

        // Update Product Stock
        // Handle both MongoDB _id and custom id
        let product = await Product.findOne({ id: productId });
        if (!product) {
            try {
                product = await Product.findById(productId);
            } catch (e) {
                // ignore cast error
            }
        }

        // Fallback ID search if productId passed was actually _id string but stored as id?
        // Unlikely, but safety check:
        if (!product) {
            product = await Product.findOne({ name: productName });
        }

        if (product) {
            product.stock += Number(quantity);
            await product.save();
        } else {
            console.warn(`Product not found for stock update: ${productName} (${productId})`);
        }

        res.status(201).json(purchase);
    } catch (error) {
        console.error('Error creating purchase:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
const getAllPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find().sort({ createdAt: -1 });
        res.json(purchases);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a purchase and adjust stock difference
// @route   PUT /api/purchases/:id
// @access  Private
const updatePurchase = async (req, res) => {
    try {
        const { quantity, unitCost } = req.body;
        const purchaseId = req.params.id;

        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        const oldQuantity = purchase.quantity;
        const newQuantity = Number(quantity);
        const quantityDiff = newQuantity - oldQuantity;

        // Update purchase record
        purchase.quantity = newQuantity;
        purchase.unitCost = unitCost;
        purchase.totalAmount = newQuantity * unitCost;
        await purchase.save();

        // Update Product Stock if quantity changed
        if (quantityDiff !== 0) {
            const productId = purchase.productId;

            // Re-use logic to find product safely
            let product = await Product.findOne({ id: productId });
            if (!product) {
                try { product = await Product.findById(productId); } catch (e) { }
            }
            // Fallback
            if (!product) {
                product = await Product.findOne({ name: purchase.productName });
            }

            if (product) {
                product.stock += quantityDiff;
                await product.save();
                console.log(`Stock adjusted for ${product.name}: ${quantityDiff > 0 ? '+' : ''}${quantityDiff}. New Stock: ${product.stock}`);
            } else {
                console.warn(`Product not found for stock adjustment: ${purchase.productName}`);
            }
        }

        res.json(purchase);
    } catch (error) {
        console.error('Error updating purchase:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a purchase and revert stock
// @route   DELETE /api/purchases/:id
// @access  Private
const deletePurchase = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        const quantityToRevert = purchase.quantity;
        const productId = purchase.productId;

        await Purchase.findByIdAndDelete(req.params.id);

        // Revert stock (Decrease)
        let product = await Product.findOne({ id: productId });
        if (!product) {
            try { product = await Product.findById(productId); } catch (e) { }
        }
        if (!product) {
            product = await Product.findOne({ name: purchase.productName });
        }

        if (product) {
            product.stock -= quantityToRevert;
            await product.save();
        }

        res.json({ message: 'Purchase deleted' });
    } catch (error) {
        console.error('Error deleting purchase:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createPurchase,
    getAllPurchases,
    updatePurchase,
    deletePurchase
};
