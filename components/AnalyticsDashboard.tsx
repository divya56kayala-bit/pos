import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
    kpis: {
        totalOrders: { value: number; trend: number };
        grossSales: { value: number; trend: number };
        avgOrderValue: { value: number; trend: number };
        avgSalesPerDay: { value: number; trend: number };
    };
    salesTrend: { date: string; orders: number; sales: number }[];
    paymentDistribution: { name: string; value: number }[];
    employeeSales: { name: string; sales: number }[];
}

const COLORS = ['#ea580c', '#4338ca', '#059669', '#d97706'];

const AnalyticsDashboard: React.FC = () => {
    const [range, setRange] = useState(30);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [range]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const result = await api.getAnalytics(range);
            setData(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) return <div className="p-8 text-center text-gray-500">Loading Analytics...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sales Analytics</h2>
                    <p className="text-sm text-gray-500">Performance insights for the last {range} days</p>
                </div>
                <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                    <button
                        onClick={() => setRange(7)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${range === 7 ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => setRange(30)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${range === 30 ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Last 30 Days
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Orders', kpi: data.kpis.totalOrders, prefix: '' },
                    { label: 'Gross Sales', kpi: data.kpis.grossSales, prefix: '₹' },
                    { label: 'Avg Order Value', kpi: data.kpis.avgOrderValue, prefix: '₹' },
                    { label: 'Avg Sales / Day', kpi: data.kpis.avgSalesPerDay, prefix: '₹' },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <p className="text-xs font-bold uppercase text-gray-500 mb-2">{item.label}</p>
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-black text-gray-900">{item.prefix}{item.kpi.value.toLocaleString()}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.kpi.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {item.kpi.trend >= 0 ? '↑' : '↓'} {Math.abs(item.kpi.trend)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-800">Revenue Trend</h3>
                    </div>
                    <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.salesTrend}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`₹${value}`, 'Sales']}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-6">Payment Splits</h3>
                    <div style={{ width: '100%', height: 200, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.paymentDistribution}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.paymentDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-4">
                        {data.paymentDistribution.map((entry, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="font-medium text-gray-600">{entry.name}</span>
                                </div>
                                <span className="font-bold text-gray-900">{entry.value} txns</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Employee & Orders Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Top Performing Staff</h3>
                    {data.employeeSales.length > 0 ? (
                        <div className="space-y-4">
                            {data.employeeSales.map((emp, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <span className="font-bold text-gray-700">{emp.name}</span>
                                    </div>
                                    <span className="font-mono font-bold text-gray-900">₹{emp.sales.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 italic">No employee data available</div>
                    )}
                </div>
                {/* Orders Trend Mini */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-6">Daily Order Volume</h3>
                    <div style={{ width: '100%', height: 250, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.salesTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
