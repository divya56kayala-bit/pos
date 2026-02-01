const User = require('../models/User');
const JsonStore = require('../utils/jsonStore');
const bcrypt = require('bcryptjs');

const store = new JsonStore('users.json');
const USE_MONGO = process.env.USE_MONGO === 'true';

const userRepository = {
    getAll: async () => {
        if (USE_MONGO) return await User.find();
        return store.getAll();
    },

    getById: async (id) => {
        if (USE_MONGO) return await User.findById(id);
        return store.getById(id);
    },

    findByEmail: async (email) => {
        if (USE_MONGO) return await User.findOne({ email });
        return store.getBy(u => u.email === email);
    },

    create: async (userData) => {
        if (USE_MONGO) {
            const user = new User(userData);
            return await user.save();
        }

        // Manual Validation for uniqueness
        if (store.getBy(u => u.email === userData.email)) {
            throw new Error('Email already exists');
        }

        // Mimic Mongoose pre-save hook for password hashing
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        return store.add(userData);
    },

    update: async (id, updates) => {
        if (USE_MONGO) {
            // If password is updated, we rely on finding doc and saving to trigger hook, or manual hash if using updateOne
            if (updates.password) {
                updates.password = await bcrypt.hash(updates.password, 10);
            }
            return await User.findByIdAndUpdate(id, updates, { new: true });
        }

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }
        return store.update(id, updates);
    },

    delete: async (id) => {
        if (USE_MONGO) return await User.findByIdAndDelete(id);
        return store.delete(id);
    }
};

module.exports = userRepository;
