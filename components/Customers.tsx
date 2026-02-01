import React, { useState, useEffect } from 'react';
import { Customer, Bill } from '../types';
import { api } from '../services/api';

const Customers: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [history, setHistory] = useState<Bill[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await api.getAllCustomers();
            setCustomers(data);
        } catch (err) {
            console.error("Failed to load customers", err);
        }
    };

    const handleViewHistory = async (customer: Customer) => {
        setSelectedCustomer(customer);
        setLoadingHistory(true);
        try {
            const orders = await api.getCustomerOrders(customer.phone);
            setHistory(orders);
        } catch (err) {
            alert('Failed to load history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Registered Customers</h2>
                    <p className="text-sm text-gray-500">View customer details and purchase history</p>
                </div>
                <div className="w-64">
                    <input
                        type="text"
                        placeholder="Search Name or Phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-y">
                        <tr>
                            <th className="px-4 py-3 text-sm font-bold text-gray-600">Customer Name</th>
                            <th className="px-4 py-3 text-sm font-bold text-gray-600">Phone</th>
                            <th className="px-4 py-3 text-sm font-bold text-gray-600 text-center">Total Orders</th>
                            <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">Registered On</th>
                            <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredCustomers.map(c => (
                            <tr key={c.id || c._id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 font-bold text-gray-900">{c.name}</td>
                                <td className="px-4 py-4 font-mono text-sm text-gray-600">{c.phone}</td>
                                <td className="px-4 py-4 text-center">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                                        {c.totalOrders || c.orders?.length || c.orderIds?.length || 0} Orders
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right text-sm text-gray-500">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button
                                        onClick={() => handleViewHistory(c)}
                                        className="text-orange-600 hover:text-orange-800 font-bold text-sm"
                                    >
                                        View History
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{selectedCustomer.name}</h3>
                                <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {loadingHistory ? (
                                <p className="text-center py-4 text-gray-500">Loading history...</p>
                            ) : history.length === 0 ? (
                                <p className="text-center py-4 text-gray-500">No orders found.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-2 text-left">Bill No</th>
                                            <th className="p-2 text-left">Date</th>
                                            <th className="p-2 text-center">Items</th>
                                            <th className="p-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {history.map(h => (
                                            <tr key={h._id || h.id}>
                                                <td className="p-2 font-mono font-bold text-gray-700">{h.billNo}</td>
                                                <td className="p-2 text-gray-500">{new Date(h.createdAt).toLocaleDateString()}</td>
                                                <td className="p-2 text-center">{h.items.length}</td>
                                                <td className="p-2 text-right font-bold text-gray-900">₹{(h.total || h.totalAmount || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50 rounded-b-2xl text-right">
                            <button onClick={() => setSelectedCustomer(null)} className="bg-white border px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
