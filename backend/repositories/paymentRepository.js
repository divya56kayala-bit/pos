const Payment = require('../models/Payment');
const JsonStore = require('../utils/jsonStore');

const store = new JsonStore('payments.json');
const USE_MONGO = process.env.USE_MONGO === 'true';

const paymentRepository = {
    getAll: async () => {
        if (USE_MONGO) return await Payment.find();
        return store.getAll();
    },

    getById: async (id) => {
        if (USE_MONGO) return await Payment.findById(id);
        return store.getById(id);
    },

    findByBillId: async (billId) => {
        if (USE_MONGO) return await Payment.find({ billId });
        return store.filter(p => p.billId === billId);
    },

    create: async (data) => {
        if (USE_MONGO) return await Payment.create(data);
        return store.add(data);
    }
};

module.exports = paymentRepository;
