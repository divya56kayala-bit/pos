const Product = require('../models/Product');
const JsonStore = require('../utils/jsonStore');

const store = new JsonStore('products.json');
const USE_MONGO = process.env.USE_MONGO === 'true';

const productRepository = {
    getAll: async () => {
        if (USE_MONGO) return await Product.find();
        return store.getAll();
    },

    getById: async (id) => {
        if (USE_MONGO) return await Product.findById(id);
        return store.getById(id);
    },

    findByBarcode: async (barcode) => {
        if (USE_MONGO) return await Product.findOne({ barcode });
        return store.getBy(p => p.barcode === barcode);
    },

    create: async (productData) => {
        // Auto-generate short barcode if not present
        if (!productData.barcode) {
            const generate = () => Math.floor(100000 + Math.random() * 900000).toString();
            let candidate = generate();
            // Simple collision check loop (for local store primarily, Mongo would need async check)
            // For strict Mongo env, unique index handles collision, but we want to supply it.
            productData.barcode = candidate;
        }

        if (USE_MONGO) return await Product.create(productData);

        // Auto-generate barcode if missing
        if (!productData.barcode) {
            let distinct = false;
            while (!distinct) {
                const random = Math.floor(100000 + Math.random() * 900000).toString();
                const exists = store.getBy(p => p.barcode === random);
                if (!exists) {
                    productData.barcode = random;
                    distinct = true;
                }
            }
        }

        // Check uniqueness
        if (store.getBy(p => p.barcode === productData.barcode)) {
            throw new Error('Barcode already exists');
        }
        return store.add(productData);
    },

    update: async (id, updates) => {
        // Auto-generate if missing during update (e.g. fixing old products)
        if (updates.barcode === '' || (updates.barcode === undefined && !store.getById(id)?.barcode)) {
            const generate = () => Math.floor(100000 + Math.random() * 900000).toString();
            let candidate = generate();
            // Simple uniqueness check could be added here similar to create
            updates.barcode = candidate;
        }

        if (USE_MONGO) return await Product.findByIdAndUpdate(id, updates, { new: true });
        return store.update(id, updates);
    },

    delete: async (id) => {
        // Soft delete logic can be handled here or service. The user asked for "Soft delete support" in Business Logic.
        // Typically database delete deletes the record. Soft delete updates 'isDeleted' flag.
        // Let's implement actual delete here, Service will decide whether to call delete or update({deleted:true})
        if (USE_MONGO) return await Product.findByIdAndDelete(id);
        return store.delete(id);
    }
};

module.exports = productRepository;
