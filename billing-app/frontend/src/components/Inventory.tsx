import React, { useState, useEffect } from 'react';

interface Product {
    id: number;
    name: string;
    barcode: string;
    price: number;
    stock: number;
}

const Inventory: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isAddMode, setIsAddMode] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', barcode: '', price: '', stock: '' });

    const fetchProducts = () => {
        fetch('http://localhost:3001/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetch('http://localhost:3001/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newProduct.name,
                barcode: newProduct.barcode,
                price: parseFloat(newProduct.price),
                stock: parseInt(newProduct.stock)
            })
        })
            .then(() => {
                setIsAddMode(false);
                setNewProduct({ name: '', barcode: '', price: '', stock: '' });
                fetchProducts();
            });
    };

    return (
        <div className="h-full animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Inventory Management</h2>
                <button className="btn" onClick={() => setIsAddMode(!isAddMode)}>
                    {isAddMode ? 'Cancel' : '+ Add Product'}
                </button>
            </div>

            {isAddMode && (
                <div className="card mb-6 animate-fade-in">
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-slate-400">Product Name</label>
                            <input className="input" placeholder="e.g. Apple" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-slate-400">Barcode</label>
                            <input className="input" placeholder="Scan or type..." value={newProduct.barcode} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-slate-400">Price</label>
                            <input className="input" type="number" step="0.01" placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-slate-400">Stock</label>
                            <input className="input" type="number" placeholder="0" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} required />
                        </div>
                        <div className="col-span-2 flex justify-end mt-2" style={{ gridColumn: 'span 2' }}>
                            <button type="submit" className="btn bg-green-500 hover:bg-green-600">Save Product</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card overflow-hidden">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Barcode</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id}>
                                <td>{p.name}</td>
                                <td>{p.barcode}</td>
                                <td>${p.price.toFixed(2)}</td>
                                <td>{p.stock}</td>
                                <td>
                                    <button className="btn-secondary px-2 py-1 text-xs rounded">Edit</button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center text-slate-500 py-8">No products found. Add one to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inventory;
