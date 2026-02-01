
import React, { useState, useEffect } from 'react';
import Barcode from 'react-barcode';
import { Product } from '../types';
import { api } from '../services/api';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (product?: Product) => {
    setEditingProduct(product || {
      name: '',
      barcode: '', // Can be empty now, backend will auto-generate
      category: '',
      subCategory: '',
      price: 0,
      mrp: 0,
      costPrice: 0,
      gst: 0,
      stock: 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      try {
        await api.saveProduct(editingProduct);
        await loadProducts();
        setIsModalOpen(false);
      } catch (err: any) {
        alert("Failed to save product: " + err.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        await loadProducts();
      } catch (err: any) {
        alert("Failed to delete product: " + err.message);
      }
    }
  };

  // Helper to get sub-categories for the selected category
  const getSubCategories = () => {
    if (!editingProduct?.category) return [];
    const cat = categories.find(c => c.name === editingProduct.category);
    return cat?.subCategories || [];
  };

  // State for printing
  const [printingProduct, setPrintingProduct] = useState<Product | null>(null);

  const handlePrintBarcode = async (product: Product) => {
    try {
      // Direct printing via backend for TSC TE244 (TSPL)
      // This bypasses browser print dialog completely
      const response = await fetch('/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          barcode: product.barcode || product._id || product.id,
          mrp: product.mrp || 0,
          offer: product.price // Using 'price' as offer price
        })
      });

      const res = await response.json();
      if (!res.success) {
        alert("Print Failed: " + res.message);
      }
    } catch (err) {
      console.error("Print Request Error:", err);
      alert("Failed to send print job. Is Printer Service running?");
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-sm text-gray-500">Add or edit products and monitor stock levels</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-500 transition-all flex items-center gap-2"
        >
          <span>+</span> Add New Product
        </button>
      </div>

      <div className="overflow-x-auto no-print">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-y border-gray-100">
            <tr>
              <th className="px-4 py-3 text-sm font-bold text-gray-600">Product Details</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600">Barcode</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">MRP</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">Selling Price</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600 text-center">GST %</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600 text-center">Stock</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(p => (
              <tr key={p._id || p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="font-bold text-gray-900">{p.name}</div>
                  <div className="text-xs text-orange-600 font-semibold uppercase flex gap-1">
                    <span>{p.category}</span>
                    {p.subCategory && <span className="text-gray-400">/ {p.subCategory}</span>}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col items-center">
                    {/* Show visual barcode if value exists, otherwise show text */}
                    {p.barcode ? (
                      <div className="scale-75 origin-left">
                        <Barcode value={p.barcode} width={1.5} height={40} fontSize={12} displayValue={true} />
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">No Barcode</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-bold text-gray-500">
                  {p.mrp ? `₹${p.mrp}` : '-'}
                </td>
                <td className="px-4 py-4 text-right font-bold text-gray-900">₹{p.price}</td>
                <td className="px-4 py-4 text-center text-gray-700">{p.gst}%</td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                    }`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-4 text-right space-x-2">
                  <button onClick={() => handlePrintBarcode(p)} className="text-slate-600 hover:text-slate-900 font-bold text-sm" title="Print Barcode Label">Print</button>
                  <button onClick={() => openModal(p)} className="text-blue-600 hover:underline font-bold text-sm">Edit</button>
                  <button onClick={() => handleDelete(p._id || p.id)} className="text-red-500 hover:underline font-bold text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden Printable Area */}
      {/* Hidden Printable Area Removed - Using Direct TSPL Backend Printing */}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white sticky top-0 z-10">
              <h3 className="text-xl font-bold">{editingProduct?._id || editingProduct?.id ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[80vh]">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Product Name</label>
                <input required value={editingProduct?.name || ''} onChange={e => setEditingProduct({ ...editingProduct!, name: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Barcode (Optional)</label>
                <input
                  placeholder="Leave empty to auto-generate"
                  value={editingProduct?.barcode || ''}
                  onChange={e => setEditingProduct({ ...editingProduct!, barcode: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Category</label>
                <select
                  required
                  value={editingProduct?.category || ''}
                  onChange={e => setEditingProduct({ ...editingProduct!, category: e.target.value, subCategory: '' })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((c: any) => (
                    <option key={c._id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Category Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Sub Category</label>
                <select
                  value={editingProduct?.subCategory || ''}
                  onChange={e => setEditingProduct({ ...editingProduct!, subCategory: e.target.value })}
                  disabled={!editingProduct?.category}
                  className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                >
                  <option value="">Select Sub-Category</option>
                  {getSubCategories().map((s: any, i: number) => (
                    <option key={i} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">MRP</label>
                <input type="number" value={editingProduct?.mrp || ''} onChange={e => setEditingProduct({ ...editingProduct!, mrp: +e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500" placeholder="Optional" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cost Price</label>
                <input type="number" required value={editingProduct?.costPrice || ''} onChange={e => setEditingProduct({ ...editingProduct!, costPrice: +e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Selling Price</label>
                <input type="number" required value={editingProduct?.price || ''} onChange={e => setEditingProduct({ ...editingProduct!, price: +e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">GST %</label>
                <select value={editingProduct?.gst || 0} onChange={e => setEditingProduct({ ...editingProduct!, gst: +e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500">
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Initial Stock</label>
                <input type="number" required value={editingProduct?.stock || ''} onChange={e => setEditingProduct({ ...editingProduct!, stock: +e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="col-span-2 pt-4">
                <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors">Save Product Information</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
