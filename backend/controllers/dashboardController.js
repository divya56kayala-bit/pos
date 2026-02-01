const billRepository = require('../repositories/billRepository');
const productRepository = require('../repositories/productRepository');

exports.getStats = async (req, res) => {
    try {
        const { userId, userRole } = req;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        // Fetch ALL bills
        let allBills = await billRepository.getAll();
        console.log(`Dashboard Stats - Total Bills Loaded: ${allBills.length}`);

        // Role-based filtering
        if (userRole !== 'admin') {
            allBills = allBills.filter(b =>
                (b.billedBy && b.billedBy.userId === userId) ||
                (b.employeeId === userId)
            );
            console.log(`Employee Filter Applied - Bills After Filter: ${allBills.length}`);
        }

        // Filter for today
        const todayBills = allBills.filter(b => {
            const billDate = new Date(b.createdAt);
            return billDate >= today && billDate < tomorrow;
        });
        console.log(`Today's Bills: ${todayBills.length}`);

        const totalBillsToday = todayBills.length;
        const todaySales = todayBills.reduce((sum, bill) => sum + (bill.total || bill.totalAmount || 0), 0);
        console.log(`Today's Revenue: ₹${todaySales}`);

        // Filter for month
        const monthlyBills = allBills.filter(b => {
            const billDate = new Date(b.createdAt);
            return billDate >= startOfMonth && billDate <= endOfMonth;
        });
        const monthlySales = monthlyBills.reduce((sum, bill) => sum + (bill.total || bill.totalAmount || 0), 0);
        console.log(`Monthly Revenue: ₹${monthlySales}`);

        // Fetch Low Stock Items (Threshold < 10)
        const products = await productRepository.getAll();
        const lowStockItems = products.filter(p => p.stock < 10).length;

        res.json({
            todaySales,
            monthlySales,
            lowStockItems,
            totalBillsToday
        });
    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ message: err.message });
    }
};
