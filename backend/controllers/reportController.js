const Bill = require('../models/Bill'); // Direct access for aggregation
const productRepository = require('../repositories/productRepository');

// Helper for Aggregation Match Stage based on User Role
const getMatchStage = (req) => {
    const { userId, userRole } = req;
    const match = {};
    if (userRole !== 'admin') {
        // Match either billedBy.userId OR legacy employeeId
        match.$or = [
            { 'billedBy.userId': userId },
            { employeeId: userId }
        ];
    }
    return match;
};

exports.getSummary = async (req, res) => {
    try {
        const matchStage = getMatchStage(req);

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const summary = await Bill.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    today: [
                        { $match: { createdAt: { $gte: startOfDay } } },
                        { $group: { _id: null, revenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
                    ],
                    month: [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } }
                    ]
                }
            }
        ]);

        // Low stock is independent of bills
        const products = await productRepository.getAll();
        const lowStockItems = products.filter(p => p.stock < 10).length;

        const result = summary[0];
        res.json({
            todaySales: result.today[0]?.revenue || 0,
            monthlySales: result.month[0]?.revenue || 0,
            totalBillsToday: result.today[0]?.count || 0,
            lowStockItems
        });

    } catch (err) {
        console.error('[REPORT] Aggregation Error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.getWeeklySales = async (req, res) => {
    try {
        const matchStage = getMatchStage(req);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const sales = await Bill.aggregate([
            {
                $match: {
                    ...matchStage,
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Map to Day names
        // Note: Ideally sending ISO dates is better for frontend internationalization, 
        // but keeping "Day Name" format to match frontend expectation
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData = sales.map(s => {
            const d = new Date(s._id);
            return {
                day: days[d.getDay()], // WARNING: This maps strictly by date, duplicates if > 1 week
                total: s.total,
                date: s._id
            };
        });

        res.json(chartData);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPaymentDistribution = async (req, res) => {
    try {
        const matchStage = getMatchStage(req);
        const distribution = await Bill.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$paymentMode",
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = distribution.reduce((sum, d) => sum + d.count, 0) || 1;
        const result = { cashPercentage: 0, upiPercentage: 0 };

        distribution.forEach(d => {
            const pct = Math.round((d.count / total) * 100);
            if (d._id === 'Cash') result.cashPercentage = pct;
            if (d._id === 'UPI') result.upiPercentage = pct;
            // Handle lowercase if necessary as well
        });

        res.json(result);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const matchStage = getMatchStage(req);
        const range = parseInt(req.query.range) || 30;

        const now = new Date();
        const startOfCurrent = new Date(now);
        startOfCurrent.setDate(now.getDate() - range);

        const startOfPrevious = new Date(startOfCurrent);
        startOfPrevious.setDate(startOfPrevious.getDate() - range);

        const stats = await Bill.aggregate([
            { $match: { ...matchStage, createdAt: { $gte: startOfPrevious } } },
            {
                $facet: {
                    current: [
                        { $match: { createdAt: { $gte: startOfCurrent } } },
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                grossSales: { $sum: "$totalAmount" },
                                avgOrder: { $avg: "$totalAmount" },
                            }
                        }
                    ],
                    previous: [
                        { $match: { createdAt: { $lt: startOfCurrent, $gte: startOfPrevious } } },
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                grossSales: { $sum: "$totalAmount" },
                                avgOrder: { $avg: "$totalAmount" },
                            }
                        }
                    ],
                    dailyTrend: [
                        { $match: { createdAt: { $gte: startOfCurrent } } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                                orders: { $sum: 1 },
                                sales: { $sum: "$totalAmount" }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    payments: [
                        { $match: { createdAt: { $gte: startOfCurrent } } },
                        { $group: { _id: "$paymentMode", count: { $sum: 1 } } }
                    ],
                    employees: [
                        { $match: { createdAt: { $gte: startOfCurrent } } },
                        {
                            $group: {
                                _id: { $ifNull: ["$billedBy.name", "$employeeName"] },
                                sales: { $sum: "$totalAmount" }
                            }
                        },
                        { $sort: { sales: -1 } },
                        { $limit: 5 }
                    ]
                }
            }
        ]);

        const raw = stats[0];
        const curr = raw.current[0] || { totalOrders: 0, grossSales: 0, avgOrder: 0 };
        const prev = raw.previous[0] || { totalOrders: 0, grossSales: 0, avgOrder: 0 };

        const calculateTrend = (c, p) => p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);

        const kpis = {
            totalOrders: { value: curr.totalOrders, trend: calculateTrend(curr.totalOrders, prev.totalOrders) },
            grossSales: { value: Math.round(curr.grossSales), trend: calculateTrend(curr.grossSales, prev.grossSales) },
            avgOrderValue: { value: Math.round(curr.avgOrder), trend: calculateTrend(curr.avgOrder, prev.avgOrder) },
            avgSalesPerDay: { value: Math.round(curr.grossSales / range), trend: 0 } // Simple avg
        };

        // Format Daily Trend for Recharts
        const salesTrend = raw.dailyTrend.map(d => ({
            date: new Date(d._id).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            orders: d.orders,
            sales: d.sales
        }));

        // Format Payment
        const paymentDistribution = raw.payments.map(p => ({
            name: p._id || 'Unknown',
            value: p.count
        }));

        // Format Employees
        const employeeSales = raw.employees.map(e => ({
            name: e._id || 'Unknown',
            sales: e.sales
        }));

        res.json({ kpis, salesTrend, paymentDistribution, employeeSales });

    } catch (err) {
        console.error('[REPORT] Aggregation Analytics Error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.getDailySales = async (req, res) => res.json({ message: "Use /summary" });
exports.getMonthlySales = async (req, res) => res.json({ message: "Use /summary" });
