
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Product, Purchase } from '../types';

// Configure axios base URL if not already global
const API_URL = 'http://localhost:5000/api';

const Purchases: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [qty, setQty] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Searchable Dropdown State
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('bg_auth_token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const [productsRes, purchasesRes] = await Promise.all([
        axios.get(`${API_URL}/products`, config),
        axios.get(`${API_URL}/purchases`, config)
      ]);
      setProducts(productsRes.data);
      setPurchaseHistory(purchasesRes.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      if (err.response && err.response.status === 403) {
        setError('Access denied. Please login again.');
      } else {
        setError('Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (purchase: Purchase) => {
    setEditingId(purchase._id || purchase.id);
    setSelectedProduct(purchase.productId);
    // Find product name for search term
    const prod = products.find(p => (p._id || p.id) === purchase.productId);
    if (prod) setSearchTerm(`${prod.name} (Stock: ${prod.stock})`);

    setQty(purchase.quantity);
    setCost(purchase.unitCost);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Area you sure? This will revert the stock.')) return;
    try {
      const token = localStorage.getItem('bg_auth_token');
      await axios.delete(`${API_URL}/purchases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      // Also refresh products to see stock change if needed, handled by fetchData
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSelectedProduct('');
    setSearchTerm('');
    setQty(0);
    setCost(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p._id === selectedProduct || p.id === selectedProduct);
    if (!product) return;

    try {
      const token = localStorage.getItem('bg_auth_token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      if (editingId) {
        // UPDATE MODE
        await axios.put(`${API_URL}/purchases/${editingId}`, {
          quantity: qty,
          unitCost: cost
        }, config);
        alert('Purchase updated successfully!');
      } else {
        // CREATE MODE
        await axios.post(`${API_URL}/purchases`, {
          productId: product._id || product.id,
          productName: product.name,
          quantity: qty,
          unitCost: cost,
          supplier: 'Generic Supplier'
        }, config);
        alert('Stock updated successfully!');
      }

      handleCancelEdit(); // Reset form
      fetchData();

    } catch (err) {
      console.error('Error logging purchase:', err);
      alert('Failed to save purchase.');
    }
  };

  if (loading && products.length === 0) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Purchase Entry' : 'New Purchase Entry'}</h2>
          {editingId && (
            <button onClick={handleCancelEdit} className="text-sm text-red-600 font-bold hover:underline">Cancel Edit</button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1 relative">
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Select Product</label>
            {/* Searchable Dropdown */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search product..."
                disabled={!!editingId}
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                  if (e.target.value === '') setSelectedProduct('');
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
              />
              {isDropdownOpen && !editingId && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {products
                    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(p => (
                      <div
                        key={p._id || p.id}
                        className="p-2 hover:bg-orange-50 cursor-pointer text-sm text-gray-900"
                        onClick={() => {
                          setSelectedProduct(p._id || p.id);
                          setSearchTerm(`${p.name} (Stock: ${p.stock})`);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="font-bold">{p.name}</span> <span className="text-gray-500 text-xs">(Stock: {p.stock})</span>
                      </div>
                    ))}
                  {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                    <div className="p-2 text-sm text-gray-500">No products found</div>
                  )}
                </div>
              )}
            </div>
            {/* Hidden Input to maintain form logic compatibility if needed, though we use state direct */}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Purchase Qty</label>
            <input
              type="number"
              required
              min="1"
              value={qty || ''}
              onChange={e => setQty(+e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Unit Cost (₹)</label>
            <input
              type="number"
              required
              min="0"
              value={cost || ''}
              onChange={e => setCost(+e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button type="submit" className={`text-white py-2.5 rounded-lg font-bold transition-colors ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
            {editingId ? 'Update Purchase' : 'Log Purchase'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Purchase History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-y">
              <tr>
                <th className="px-4 py-3 text-sm font-bold text-gray-600">Date</th>
                <th className="px-4 py-3 text-sm font-bold text-gray-600">Product</th>
                <th className="px-4 py-3 text-sm font-bold text-gray-600">Qty</th>
                <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">Total</th>
                <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-gray-800">
              {purchaseHistory.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-3 text-center text-gray-500">No purchase history found</td></tr>
              ) : (
                purchaseHistory.map((ph: any) => (
                  <tr key={ph._id || ph.id} className={editingId === (ph._id || ph.id) ? 'bg-orange-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3 text-gray-600">{new Date(ph.createdAt).toLocaleDateString()} {new Date(ph.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{ph.productName}</td>
                    <td className="px-4 py-3">{ph.quantity}</td>
                    <td className="px-4 py-3 text-right">₹{ph.unitCost}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{ph.totalAmount || (ph.quantity * ph.unitCost)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => handleEdit(ph)} className="text-blue-600 font-bold hover:underline">Edit</button>
                      <button onClick={() => handleDelete(ph._id || ph.id)} className="text-red-500 font-bold hover:underline">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
