const customerRepository = require('../repositories/customerRepository');

exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await customerRepository.getAll();
        // Return with derived totalOrders
        const customerWithStats = customers.map(c => {
            const cust = c.toObject ? c.toObject() : c;
            return {
                ...cust,
                totalOrders: cust.orders ? cust.orders.length : (cust.orderIds ? cust.orderIds.length : 0)
            };
        });
        console.log('[DEBUG] Customers with stats:', customerWithStats.map(c => ({ name: c.name, orders: c.orders, total: c.totalOrders })));
        res.json(customerWithStats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const customer = await customerRepository.getById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createCustomer = async (req, res) => {
    try {
        const newCustomer = await customerRepository.create(req.body);
        res.status(201).json(newCustomer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const updatedCustomer = await customerRepository.update(req.params.id, req.body);
        if (!updatedCustomer) return res.status(404).json({ message: 'Customer not found' });
        res.json(updatedCustomer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const deletedCustomer = await customerRepository.delete(req.params.id);
        if (!deletedCustomer) return res.status(404).json({ message: 'Customer not found' });
        res.json({ message: 'Customer deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getOrdersByCustomer = async (req, res) => {
    try {
        const { phone } = req.params;
        let customer = await customerRepository.findByPhone(phone);

        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Populate orders directly from the array
        if (customer.populate) {
            await customer.populate({
                path: 'orders',
                options: { sort: { createdAt: -1 } }
            });
        }

        // If 'orders' is populated, it will be an array of Bill objects.
        // If using JSON store, we might need manual handling, but we are using Mongo.
        // Fallback for JSON store or if populate fails:
        let history = customer.orders || [];

        // Ensure we are returning the bills, not IDs (if populate failed for some reason)
        // Note: repo.findByPhone might return lean object if not careful, but usually returns doc.
        // If it's a lean object, we can't populate.
        // The repo code: `if (USE_MONGO) return await Customer.findOne({ phone });` -> Returns Doc.

        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCustomerByPhone = async (req, res) => {
    try {
        const { phone } = req.params;
        let customer = await customerRepository.findByPhone(phone);

        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // If Mongoose document, populate orders
        if (customer.populate) {
            await customer.populate('orders');
        }

        res.json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
