
import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, UserRole } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const POS: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>('Cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("API returned non-array product data:", data);
        setProducts([]);
      }
    } catch (err: any) {
      console.error("Failed to load products", err);
      if (err.message === 'Unauthorized') {
        alert("Session expired. Please logout and login again.");
      }
      setProducts([]); // Ensure valid state on error
    }
  };

  // Filter products for search suggestion
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm)
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("Out of stock!");
      return;
    }

    // Normalize ID to handle both _id (backend) and id (frontend types)
    const productId = product._id || product.id;

    setCart(prev => {
      // Find using normalized ID
      const existing = prev.find(item => (item._id || item.id) === productId);

      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("Maximum stock reached!");
          return prev;
        }
        // Update existing item
        return prev.map(item =>
          (item._id || item.id) === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // Add new item - preserving all product fields and ensuring numeric price
      return [...prev, { ...product, price: Number(product.price), quantity: 1 }];
    });

    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomerPhone(val);
    if (val.length === 10) {
      try {
        const customer = await api.getCustomerByPhone(val);
        if (customer) {
          setCustomerName(customer.name);
        }
      } catch (err) {
        // Silent catch for lookup failures (e.g. network up/down while typing)
        console.debug("Error fetching customer", err);
      }
    }
  };

  const handleBarcodeScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const scannedBarcode = e.currentTarget.value.trim();
      if (!scannedBarcode) return;

      // Try to find exact match in local specific list first for speed
      const exactMatch = products.find(p => p.barcode === scannedBarcode);
      if (exactMatch) {
        addToCart(exactMatch);
        return;
      }

      // Check backend via API for precise barcode lookup (in case local list is stale or large)
      try {
        const product = await api.getProductByBarcode(scannedBarcode);
        if (product) {
          addToCart(product);
        } else {
          // Try name search if not barcode
          // If only one product in filtered list matches, select it
          if (filteredProducts.length === 1) {
            addToCart(filteredProducts[0]);
          } else {
            // Optional: Play error sound or shake UI
            console.log("Product not found");
          }
        }
      } catch (err) {
        console.log("Barcode lookup failed:", scannedBarcode);
      }
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => (item._id || item.id) !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if ((item._id || item.id) === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > item.stock) {
          alert("Insufficient stock!");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // GST Inclusive Logic
  // Total = Sum of (Item Price * Qty) [Since Price is Inclusive]
  // Subtotal = Total - GST
  // GST = Total - (Total / (1 + gstRate/100))

  const cartGrandTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const cartGstTotal = cart.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity;
    const gstPortion = itemTotal - (itemTotal / (1 + (item.gst / 100)));
    return acc + gstPortion;
  }, 0);

  const cartSubtotal = cartGrandTotal - cartGstTotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const billData = {
        items: cart.map(item => ({
          productId: item._id || item.id,
          name: item.name,
          qty: item.quantity,
          mrp: item.mrp || item.price, // Fallback to price if MRP not set
          price: item.price,
          gst: item.gst
        })),
        subTotal: cartSubtotal,
        taxAmount: cartGstTotal,
        totalAmount: cartGrandTotal,
        paymentMode,
        employeeName: user?.name || 'Unknown',
        customer: {
          name: customerName,
          phone: customerPhone
        },
        customerName,
        customerPhone
      };

      const bill = await api.createBill(billData);
      setReceipt(bill);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      loadProducts(); // Refresh stock
    } catch (err: any) {
      alert("Checkout Failed: " + err.message);
    }
  };

  if (receipt) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 shadow-xl rounded-lg border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 uppercase">Sri Purna Chandra General Store</h2>
          <p className="text-sm text-gray-500">11-16-63 Bolisetty Vari Street railpeta repalle</p>
          <p className="text-sm font-semibold mt-2 text-gray-700">GSTIN: 37BFBPB8270A1ZX</p>
        </div>

        <div className="flex justify-between text-sm mb-4 border-b pb-2 text-gray-600">
          <span>Bill No: {receipt.billNo}</span>
          <span>{new Date(receipt.createdAt).toLocaleString()}</span>
        </div>

        {receipt.customerName && (
          <div className="text-sm mb-4 border-b pb-2 text-gray-600">
            <p className="font-bold text-gray-700">Customer Details:</p>
            <p>{receipt.customerName}</p>
          </div>
        )}

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b text-gray-700">
              <th className="text-left py-2 font-bold">Item</th>
              <th className="text-left font-bold">MRP</th>
              <th className="text-center font-bold">Qty</th>
              <th className="text-right font-bold">Our Price</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item: any, i: number) => (
              <tr key={i} className="text-gray-800">
                <td className="py-1">{item.name}</td>
                <td className="text-left">₹{((Number(item.mrp) || Number(item.price)) * Number(item.qty)).toFixed(2)}</td>
                <td className="text-center">{item.qty}</td>
                <td className="text-right">₹{(Number(item.price) * Number(item.qty)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t pt-2 space-y-1 text-sm text-gray-800">
          <div className="flex justify-between">
            <span>Subtotal (Excl. Tax)</span>
            <span>₹{(receipt.subTotal || (receipt.totalAmount - receipt.taxAmount) || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total GST (Included)</span>
            <span>₹{(receipt.taxAmount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2 text-gray-900 border-dashed">
            <span>GRAND TOTAL</span>
            <span>₹{(receipt.totalAmount || 0).toFixed(2)}</span>
          </div>

          <div className="flex justify-between font-bold text-md mt-1 border-t border-b border-gray-300 py-1">
            <span>You Saved</span>
            <span>₹{(
              receipt.items.reduce((acc: number, item: any) =>
                acc + ((Number(item.mrp) || Number(item.price)) * Number(item.qty)), 0)
              - (receipt.totalAmount || 0)
            ).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Payment Mode: {receipt.paymentMode}</p>
          <p>Cashier: {receipt.employeeName}</p>
          <p className="mt-4 font-bold text-gray-900">Thank you for shopping with us!</p>
        </div>

        <div className="mt-8 flex gap-4 no-print">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-900 transition-colors"
          >
            Print
          </button>
          <button
            onClick={() => setReceipt(null)}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Scan Barcode or Search Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleBarcodeScan}
            autoFocus
            className="w-full p-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {filteredProducts.map(p => (
            <button
              key={p._id || p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className={`p-4 rounded-xl shadow-sm border text-left transition-all hover:scale-105 active:scale-95 ${p.stock <= 0 ? 'bg-gray-100 opacity-50' : 'bg-white hover:border-orange-500'
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase">{p.category}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                  Stock: {p.stock}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 truncate mb-1">{p.name}</h3>
              <p className="text-lg font-black text-slate-800">₹{p.price}</p>
              <p className="text-[10px] text-gray-400 font-medium">GST: {p.gst}%</p>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col h-full">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col lg:h-[calc(100vh-100px)] h-auto">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
            <h2 className="font-bold text-lg text-gray-900">Current Order</h2>
            <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-bold">{cart.length} Items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full mb-2 flex items-center justify-center text-2xl">🛒</div>
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item._id || item.id} className="flex justify-between items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 font-medium">₹{item.price} + {item.gst}% GST</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item._id || item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded text-lg font-bold hover:bg-gray-200 text-gray-900">-</button>
                    <span className="w-6 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id || item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded text-lg font-bold hover:bg-gray-200 text-gray-900">+</button>
                  </div>
                  <div className="text-right w-20">
                    <p className="font-bold text-sm text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item._id || item.id)} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-gray-200 space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Phone (10 digits)"
                className="flex-1 min-w-[140px] p-2 text-sm border rounded"
                value={customerPhone}
                onChange={handlePhoneChange}
                maxLength={10}
              />
              <input
                type="text"
                placeholder="Customer Name"
                className="flex-[2] min-w-[160px] p-2 text-sm border rounded"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-b-xl space-y-4">
            <div className="space-y-1 text-sm font-medium text-gray-100 border-b border-slate-700 pb-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Subtotal (Excl. Tax)</span>
                <span className="font-bold">₹{cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">GST (Included)</span>
                <span className="font-bold">₹{cartGstTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between font-black text-2xl">
              <span>Total Payable</span>
              <span className="text-orange-400">₹{cartGrandTotal.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {['Cash', 'UPI'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode as any)}
                  className={`py-2 text-xs rounded font-bold transition-all border ${paymentMode === mode ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-2 ${cart.length === 0 ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-orange-600 hover:bg-orange-500 active:scale-[0.98]'
                }`}
            >
              COMPLETE ORDER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
