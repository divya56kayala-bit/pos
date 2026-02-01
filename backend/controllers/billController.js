const billRepository = require('../repositories/billRepository');
const productRepository = require('../repositories/productRepository');
const paymentRepository = require('../repositories/paymentRepository');

const customerRepository = require('../repositories/customerRepository');

exports.createBill = async (req, res) => {
    const { items, subTotal, taxAmount, totalAmount, paymentMode, customer, employeeName } = req.body;

    // Start "Transaction"
    const stockDeductions = [];

    try {
        // 1. Validate Stock
        for (const item of items) {
            const product = await productRepository.getById(item.productId);
            if (!product) throw new Error(`Product ${item.name || 'Unknown'} not found`);
            if (product.stock < item.qty) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
            }
            stockDeductions.push({ product, qty: item.qty });
        }

        // 2. Reduce Stock
        for (const deduction of stockDeductions) {
            await productRepository.update(deduction.product._id, {
                stock: deduction.product.stock - deduction.qty
            });
        }

        // 3. Handle Customer (New or Existing)
        let customerId = null;
        let customerData = null;

        if (customer && customer.phone) {
            console.log(`Processing Customer: ${customer.phone}`);
            const existingCustomer = await customerRepository.findByPhone(customer.phone);
            if (existingCustomer) {
                console.log(`Found Existing: ${existingCustomer._id}`);
                customerId = existingCustomer._id;
                customerData = { name: existingCustomer.name, phone: existingCustomer.phone };
            } else {
                console.log(`Creating New Customer for ${customer.phone}`);
                try {
                    const newCust = await customerRepository.create({
                        name: customer.name || 'Unknown',
                        phone: customer.phone,
                        createdAt: new Date().toISOString()
                    });
                    customerId = newCust._id;
                    customerData = { name: newCust.name, phone: newCust.phone };
                    console.log(`New Customer Created: ${customer.phone}`);
                } catch (err) {
                    if (err.message && err.message.includes('already exists')) {
                        console.log("Customer collision detected, fetching existing...");
                        const existing = await customerRepository.findByPhone(customer.phone);
                        if (existing) {
                            customerId = existing._id;
                            customerData = { name: existing.name, phone: existing.phone };
                        } else {
                            throw err; // Should not happen if it exists
                        }
                    } else {
                        throw err;
                    }
                }
            }
        }

        // 4. Generate Bill No
        const billCount = await billRepository.getCount();
        const billNo = `INV-${new Date().getFullYear()}${(billCount + 1).toString().padStart(4, '0')}`;

        // 5. Save Bill
        // Map fields to match Frontend Types (Bill interface)
        // 5. Save Bill
        // Map fields to match Frontend Types (Bill interface)
        const finalBillData = {
            billNo,
            items,
            subTotal,
            taxAmount,
            totalAmount,
            paymentMode,
            customer: {
                ...customerData,
                id: customerId
            },
            customerName: customer.name,
            customerPhone: customer.phone,
            employeeId: req.userId,
            employeeName,
            billedBy: {
                userId: req.userId,
                name: employeeName,
                role: req.userRole
            },
            createdAt: new Date().toISOString()
        };

        const newBill = await billRepository.create(finalBillData);
        console.log(`Bill Saved: ${billNo}, Total: ${totalAmount}, By: ${employeeName} (${req.userRole})`);

        // 6. Record Payment
        await paymentRepository.create({
            billId: newBill._id,
            amount: totalAmount,
            method: paymentMode,
            date: new Date().toISOString()
        });

        // 7. Link Bill to Customer
        if (customerId) {
            await customerRepository.addOrder(customerId, newBill._id);
            console.log(`Linked Order ${newBill._id} to Customer ${customerId}`);
        }

        res.status(201).json(newBill);

    } catch (err) {
        console.error('Bill Creation Error:', err.message);
        res.status(400).json({ message: err.message });
    }
};

exports.getAllBills = async (req, res) => {
    try {
        const { userId, userRole } = req;
        console.log(`History Request - User: ${userId}, Role: ${userRole}`);

        let bills = await billRepository.getAll();

        // Normalize fields if old data exists
        let normalizedBills = bills.map(doc => {
            const b = doc.toObject ? doc.toObject() : doc;
            return {
                ...b,
                total: b.total || b.totalAmount || 0,
                gstTotal: b.gstTotal || b.taxAmount || 0
            };
        });

        // ROLE BASED FILTERING
        if (userRole === 'admin') {
            // Admin sees all
        } else {
            // Employee sees only their own bills
            // Check both new 'billedBy.userId' and legacy 'employeeId'
            normalizedBills = normalizedBills.filter(b =>
                (b.billedBy && b.billedBy.userId === userId) ||
                (b.employeeId === userId)
            );
        }

        // Sort by date desc
        normalizedBills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log(`Returning ${normalizedBills.length} bills for ${userRole}.`);
        res.json(normalizedBills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getBillById = async (req, res) => {
    try {
        const bill = await billRepository.getById(req.params.id);
        if (!bill) return res.status(404).json({ message: 'Bill not found' });
        res.json(bill);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
