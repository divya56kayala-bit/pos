
import React, { useState, useEffect } from 'react';
import { Bill } from '../types';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const BILLS_PER_PAGE = 10;

// Correctly extend jsPDF with autoTable type definitions
type jsPDFWithPlugin = jsPDF & {
  autoTable: (options: any) => jsPDF;
};

const ReprintModal: React.FC<{ bill: Bill; onClose: () => void }> = ({ bill, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Thermal Receipt Preview</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 flex justify-center">
          <div id="thermal-receipt" className="bg-white p-6 shadow-sm w-[300px] text-gray-900 font-mono text-xs leading-tight border border-gray-200">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold uppercase tracking-tighter">Bharat Grocery</h2>
              <p>11-16-63 Bolisetty Vari Street railpeta repalle</p>
              <p className="mt-1 font-bold">GSTIN: 37BFBPB8270A1ZX</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            <div className="space-y-1 mb-2">
              <div className="flex justify-between">
                <span>Bill No:</span>
                <span className="font-bold">{bill.billNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {bill.customerName && (
                <>
                  <div className="border-t border-dashed border-gray-400 my-1"></div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold truncate max-w-[150px]">{bill.customerName}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            <table className="w-full text-left">
              <thead>
                <tr className="font-bold border-b border-gray-200">
                  <th className="py-1">Item</th>
                  <th className="text-left">MRP</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Our Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bill.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1 max-w-[120px] truncate">{item.name}</td>
                    <td className="text-left">{(item.mrp || item.price).toFixed(2)}</td>
                    <td className="text-center">{item.qty}</td>
                    <td className="text-right">{(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-400 mt-4 pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{(bill.subTotal || (bill.total - bill.gstTotal) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST:</span>
                <span>₹{(bill.taxAmount || bill.gstTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm mt-1">
                <span>TOTAL:</span>
                <span>₹{(bill.totalAmount || bill.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm mt-1 border-y border-dashed border-gray-400 py-1">
                <span>You Saved:</span>
                <span>₹{(
                  bill.items.reduce((acc, item) => acc + ((item.mrp || item.price) * item.qty), 0) -
                  (bill.totalAmount || bill.total || 0)
                ).toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 mt-4 pt-2 text-center text-[10px]">
              <p>Payment: {bill.paymentMode}</p>
              <p>Cashier: {bill.employeeName}</p>
              <p className="mt-4 font-bold uppercase italic tracking-widest">Thank You! Visit Again</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg active:scale-95"
          >
            🖨️ Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #thermal-receipt, #thermal-receipt * { visibility: visible; }
          #thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 10px;
            margin: 0;
            box-shadow: none;
            border: none;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

const BillHistory: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const data = await api.getBills();
      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bills", err);
    }
  };

  // Filter logic including Date Range and Search Term
  const filteredBills = bills.filter(b => {
    const matchesSearch = b.billNo.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (startDate || endDate) {
      const billDate = new Date(b.createdAt);
      billDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (billDate < start) matchesDate = false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (billDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredBills.length / BILLS_PER_PAGE);
  const startIndex = (currentPage - 1) * BILLS_PER_PAGE;
  const currentBills = filteredBills.slice(startIndex, startIndex + BILLS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const exportToPDF = (bill: Bill) => {
    const doc = new jsPDF() as jsPDFWithPlugin;

    doc.setFontSize(20);
    doc.text('BHARAT GROCERY', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text('11-16-63 Bolisetty Vari Street railpeta repalle', 105, 22, { align: 'center' });
    doc.text('GSTIN: 37BFBPB8270A1ZX', 105, 27, { align: 'center' });

    doc.line(10, 32, 200, 32);

    doc.setFontSize(11);
    doc.text(`Bill No: ${bill.billNo}`, 10, 40);
    doc.text(`Date: ${new Date(bill.createdAt).toLocaleString()}`, 10, 47);
    doc.text(`Employee: ${bill.employeeName}`, 140, 40);
    doc.text(`Payment: ${bill.paymentMode}`, 140, 47);

    const tableData = bill.items.map(item => [
      item.name,
      item.qty.toString(),
      `INR ${item.price.toFixed(2)}`,
      `${item.gst}%`,
      `INR ${(item.price * item.qty).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 55,
      head: [['Item Name', 'Qty', 'Price', 'GST', 'Subtotal']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12] },
    });

    const finalY = (doc as any).lastAutoTable.cursor.y + 10;
    doc.setFontSize(12);
    doc.text(`GST Total: INR ${bill.gstTotal.toFixed(2)}`, 140, finalY);
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total: INR ${bill.total.toFixed(2)}`, 140, finalY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text('Thank you for shopping with Bharat Grocery!', 105, finalY + 25, { align: 'center' });

    doc.save(`Bill_${bill.billNo}.pdf`);
  };

  const isFilterActive = searchTerm !== '' || startDate !== '' || endDate !== '';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex flex-col mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
            <p className="text-sm text-gray-500">View, search, and reprint past invoices</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Search Bill</label>
            <input
              type="text"
              placeholder="Ex: INV-1001"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-2.5 text-center">
              <span className="text-xs font-bold text-slate-500">{filteredBills.length} Bills Found</span>
            </div>
            {isFilterActive && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 bg-white border border-orange-200 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-50 transition-colors shrink-0"
                title="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-y">
            <tr>
              <th className="px-4 py-3 text-sm font-bold text-gray-600">Bill No</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600">Date & Time</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600">Customer</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600">Employee</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600 text-center">Payment</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">Amount</th>
              <th className="px-4 py-3 text-sm font-bold text-gray-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {currentBills.map(b => (
              <tr key={b._id || b.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 font-bold text-slate-900">{b.billNo}</td>
                <td className="px-4 py-4 text-sm">{new Date(b.createdAt).toLocaleString()}</td>
                <td className="px-4 py-4 text-sm">
                  {b.customerName ? (
                    <div>
                      <div className="font-bold text-gray-900">{b.customerName}</div>
                      <div className="text-xs text-gray-500">{b.customerPhone}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Walk-in</span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm">{b.employeeName}</td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${b.paymentMode === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                    {b.paymentMode}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-black text-gray-900">₹{b.total.toFixed(2)}</td>
                <td className="px-4 py-4 text-right space-x-3">
                  <button
                    onClick={() => exportToPDF(b)}
                    className="text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={() => setSelectedBill(b)}
                    className="text-orange-600 hover:text-orange-800 font-bold text-sm transition-colors"
                  >
                    Reprint
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredBills.length === 0 && (
          <div className="py-12 text-center text-gray-400 italic">No transactions match your current filters.</div>
        )}
      </div>

      {filteredBills.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
          <p className="text-sm text-gray-500 font-medium">
            Showing <span className="text-gray-900 font-bold">{startIndex + 1}</span> to <span className="text-gray-900 font-bold">{Math.min(startIndex + BILLS_PER_PAGE, filteredBills.length)}</span> of <span className="text-gray-900 font-bold">{filteredBills.length}</span> bills
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${currentPage === 1
                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-500 hover:text-orange-600'
                }`}
            >
              Previous
            </button>

            <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] sm:max-w-none no-scrollbar">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-bold transition-all ${currentPage === page
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-orange-50'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${currentPage === totalPages
                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-500 hover:text-orange-600'
                }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedBill && (
        <ReprintModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
      )}
    </div>
  );
};

export default BillHistory;
