const Bill = require('../models/Bill');
const JsonStore = require('../utils/jsonStore');

const store = new JsonStore('../storage/orders.json');
const USE_MONGO = process.env.USE_MONGO === 'true';

const billRepository = {
    getAll: async () => {
        if (USE_MONGO) return await Bill.find();
        return store.getAll();
    },

    getCount: async () => {
        if (USE_MONGO) return await Bill.countDocuments();
        return (await store.getAll()).length;
    },

    getById: async (id) => {
        if (USE_MONGO) return await Bill.findById(id);
        return store.getById(id);
    },

    create: async (data) => {
        if (USE_MONGO) return await Bill.create(data);
        return store.add(data); // Auto-generates ID. BillNo generation should be in Service or here if using JSON for consistency.
    },

    // For Reports
    findByDateRange: async (startDate, endDate) => {
        if (USE_MONGO) {
            return await Bill.find({
                createdAt: { $gte: startDate, $lte: endDate }
            });
        }
        return store.filter(b => {
            const d = new Date(b.createdAt);
            return d >= startDate && d <= endDate;
        });
    }
};

module.exports = billRepository;
