const Customer = require('../models/Customer');
const JsonStore = require('../utils/jsonStore');

const store = new JsonStore('../storage/customers.json');
const USE_MONGO = process.env.USE_MONGO === 'true';

const customerRepository = {
    getAll: async () => {
        if (USE_MONGO) return await Customer.find().sort({ createdAt: -1 });
        return store.getAll();
    },

    getById: async (id) => {
        if (USE_MONGO) return await Customer.findById(id);
        return store.getById(id);
    },

    findByPhone: async (phone) => {
        if (USE_MONGO) return await Customer.findOne({ phone });
        return store.getBy(c => c.phone === phone);
    },

    create: async (data) => {
        if (USE_MONGO) return await Customer.create(data);
        if (store.getBy(c => c.phone === data.phone)) {
            throw new Error('Customer with this phone already exists');
        }
        return store.add(data);
    },

    update: async (id, updates) => {
        if (USE_MONGO) return await Customer.findByIdAndUpdate(id, updates, { new: true });
        return store.update(id, updates);
    },

    delete: async (id) => {
        if (USE_MONGO) return await Customer.findByIdAndDelete(id);
        return store.delete(id);
    },

    addOrder: async (customerId, billId) => {
        console.log(`Linking Order ${billId} to Customer ${customerId}`);
        if (USE_MONGO) {
            return await Customer.findByIdAndUpdate(customerId, { $push: { orders: billId } }, { new: true });
        }
        const customer = await store.getById(customerId);
        if (customer) {
            const orders = customer.orders || [];
            if (!orders.includes(billId)) {
                orders.push(billId);
                const updated = await store.update(customerId, { orders });
                console.log(`Link Success: Customer now has ${updated.orders.length} orders`);
                return updated;
            } else {
                console.log('Order already linked');
                return customer;
            }
        } else {
            console.error(`Customer ${customerId} not found for linking`);
            return null;
        }
    }
};

module.exports = customerRepository;
