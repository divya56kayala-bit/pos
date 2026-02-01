const categoryRepository = require('../repositories/categoryRepository');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await categoryRepository.getAll();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await categoryRepository.getById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const newCategory = await categoryRepository.create(req.body);
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const updatedCategory = await categoryRepository.update(req.params.id, req.body);
        if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });
        res.json(updatedCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await categoryRepository.delete(req.params.id);
        if (!deletedCategory) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
