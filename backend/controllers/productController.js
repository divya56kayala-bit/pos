const productRepository = require('../repositories/productRepository');

exports.getAllProducts = async (req, res) => {
    try {
        const { search } = req.query;
        let products = await productRepository.getAll();

        if (search) {
            const lowerSearch = search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(lowerSearch) ||
                (p.barcode && p.barcode.includes(search))
            );
        }
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await productRepository.getById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductByBarcode = async (req, res) => {
    try {
        // Ensure barcode is string and trimmed
        const barcode = req.params.barcode ? String(req.params.barcode).trim() : '';
        console.log('Barcode received:', barcode);

        const product = await productRepository.findByBarcode(barcode);

        if (!product) {
            console.log(`Product with barcode ${barcode} not found.`);
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error('Barcode Error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const newProduct = await productRepository.create(req.body);
        res.status(201).json(newProduct);
    } catch (err) {
        if (err.message.includes('duplicate key') || err.message.includes('Barcode already exists')) {
            return res.status(409).json({ message: 'Product with this barcode already exists' });
        }
        res.status(400).json({ message: err.message });
    }
};

exports.createProductByBarcode = async (req, res) => {
    // Wrapper for consistent API pattern requested by user
    return exports.createProduct(req, res);
};

exports.updateProduct = async (req, res) => {
    try {
        const updatedProduct = await productRepository.update(req.params.id, req.body);
        if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await productRepository.delete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
