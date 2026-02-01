const Category = require('../models/Category');
const JsonStore = require('../utils/jsonStore');

const store = new JsonStore('categories.json');
const USE_MONGO = process.env.USE_MONGO === 'true';

const categoryRepository = {
    getAll: async () => {
        if (USE_MONGO) return await Category.find();
        return store.getAll();
    },

    getById: async (id) => {
        if (USE_MONGO) return await Category.findById(id);
        return store.getById(id);
    },

    create: async (data) => {
        if (USE_MONGO) return await Category.create(data);
        if (store.getBy(c => c.name === data.name)) {
            throw new Error('Category name already exists');
        }
        return store.add(data);
    },

    update: async (id, updates) => {
        if (USE_MONGO) return await Category.findByIdAndUpdate(id, updates, { new: true });
        return store.update(id, updates);
    },

    delete: async (id) => {
        if (USE_MONGO) return await Category.findByIdAndDelete(id);
        return store.delete(id);
    }
};

module.exports = categoryRepository;
