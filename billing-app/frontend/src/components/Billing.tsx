import React, { useState, useEffect } from 'react';

interface Product {
    id: number;
    name: string;
    barcode: string;
    price: number;
    stock: number;
}

interface CartItem extends Product {
    quantity: number;
}

const Billing: React.FC = () => {
    const [query, setQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // TODO: Fetch products from backend
    useEffect(() => {
        fetch('http://localhost:3001/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error('Error fetching products:', err));
    }, []);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return item; // Don't remove, just min 1 or implement remove
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handlePrint = () => {
        // Send to backend
        fetch('http://localhost:3001/api/print-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart, total })
        })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    alert('Printed successfully!');
                    setCart([]);
                }
            })
            .catch(err => alert('Print failed: ' + err));
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.barcode.includes(query)
    );

    return (
        <div className="h-full flex gap-4 animate-fade-in" style={{ height: '100%', display: 'flex', gap: '1rem' }}>
            {/* Product Selection */}
            <div className="flex-1 flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Search product or scan barcode..."
                    className="input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />

                <div className="grid grid-cols-3 gap-4 overflow-y-auto pr-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', overflowY: 'auto' }}>
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="card flex flex-col justify-between cursor-pointer hover:bg-slate-700 transition"
                            style={{ cursor: 'pointer' }}
                            onClick={() => addToCart(product)}
                        >
                            <div>
                                <h3 className="font-bold text-lg">{product.name}</h3>
                                <p className="text-sm text-slate-400">#{product.barcode}</p>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <span className="font-bold text-green-400">${product.price.toFixed(2)}</span>
                                <span className="text-xs bg-slate-600 px-2 py-1 rounded">Stock: {product.stock}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart */}
            <div className="w-96 card flex flex-col" style={{ width: '24rem', display: 'flex', flexDirection: 'column' }}>
                <h2 className="text-xl font-bold mb-4 border-b border-slate-700 pb-2">Current Bill</h2>

                <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                    {cart.length === 0 && <p className="text-center text-slate-500 mt-10">Cart is empty</p>}
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                            <div className="flex-1">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                    ${item.price} x
                                    <div className="flex items-center gap-1 bg-slate-700 rounded px-1">
                                        <button className="px-1 hover:text-white" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                        <span>{item.quantity}</span>
                                        <button className="px-1 hover:text-white" onClick={() => updateQuantity(item.id, 1)}>+</button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="font-bold mr-2">${(item.price * item.quantity).toFixed(2)}</div>
                                <button className="text-red-400 hover:text-red-300" onClick={() => removeFromCart(item.id)}>✕</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between text-xl font-bold mb-4">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>

                    <button
                        className="btn w-full justify-center text-lg py-3"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1.125rem' }}
                        onClick={handlePrint}
                        disabled={cart.length === 0}
                    >
                        🖨️ Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Billing;
