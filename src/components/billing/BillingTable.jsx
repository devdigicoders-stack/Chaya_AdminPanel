import React, { useState } from 'react';
import { Search, Calendar as CalendarIcon, CheckCircle2, Receipt, CreditCard, RotateCcw, ArrowRight, Banknote, ShieldCheck } from 'lucide-react';

const initialBillBooks = [
  { id: 1, billNo: 'BB-2024-001', candidateCode: 'CAN-1001', name: 'Rahul Sharma', passportNo: 'T1234567', trade: 'Pipe Fitter', serviceFee: 9500, medicalFee: 2500, totalBill: 12000, advancePaid: 5000, balance: 7000, status: 'Partially Paid', date: '16 Oct 2024', avatarBg: '#3B82F6' },
  { id: 2, billNo: 'BB-2024-002', candidateCode: 'CAN-1002', name: 'Mohammad Ali', passportNo: 'A9821034', trade: 'Electrician', serviceFee: 9500, medicalFee: 2800, totalBill: 12300, advancePaid: 12300, balance: 0, status: 'Settled', date: '16 Oct 2024', avatarBg: '#8B5CF6' },
  { id: 3, billNo: 'BB-2024-003', candidateCode: 'CAN-1003', name: 'Sandeep Kumar', passportNo: 'P3321908', trade: 'Welder 6G', serviceFee: 9500, medicalFee: 2500, totalBill: 12000, advancePaid: 3000, balance: 9000, status: 'Partially Paid', date: '17 Oct 2024', avatarBg: '#10B981' },
  { id: 4, billNo: 'BB-2024-004', candidateCode: 'CAN-1004', name: 'Arif Khan', passportNo: 'K4432190', trade: 'AC Technician', serviceFee: 9500, medicalFee: 2500, totalBill: 12000, advancePaid: 0, balance: 12000, status: 'Open', date: '18 Oct 2024', avatarBg: '#EF4444' },
  { id: 5, billNo: 'BB-2024-005', candidateCode: 'CAN-1005', name: 'Rajesh Patel', passportNo: 'M8899001', trade: 'Plumber', serviceFee: 9500, medicalFee: 2500, totalBill: 12000, advancePaid: 6000, balance: 6000, status: 'Partially Paid', date: '18 Oct 2024', avatarBg: '#F59E0B' },
  { id: 6, billNo: 'BB-2024-006', candidateCode: 'CAN-1006', name: 'Vikram Singh', passportNo: 'R6543210', trade: 'Heavy Driver', serviceFee: 9500, medicalFee: 2500, totalBill: 12000, advancePaid: 12000, balance: 0, status: 'Settled', date: '18 Oct 2024', avatarBg: '#06B6D4' },
];

export default function BillingTable() {
  const [bills, setBills] = useState(initialBillBooks);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals
  const [paymentModal, setPaymentModal] = useState(null);
  const [viewReceiptModal, setViewReceiptModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI / QR Code');
  const [receiptNo, setReceiptNo] = useState('RCP-9821');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const filtered = bills.filter((b) => {
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.passportNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.candidateCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.trade.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleCollectPayment = (e) => {
    e.preventDefault();
    if (!paymentModal || !payAmount) return;
    const amount = Number(payAmount);
    
    setBills(
      bills.map((b) => {
        if (b.id === paymentModal.id) {
          const newPaid = b.advancePaid + amount;
          const newBalance = Math.max(0, b.totalBill - newPaid);
          const newStatus = newBalance === 0 ? 'Settled' : 'Partially Paid';
          return { ...b, advancePaid: newPaid, balance: newBalance, status: newStatus };
        }
        return b;
      })
    );

    showToast(`Payment of ₹${amount.toLocaleString()} recorded for ${paymentModal.name}! Receipt #${receiptNo} generated.`);
    setPaymentModal(null);
    setPayAmount('');
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="m-4 p-3.5 rounded-xl bg-emerald-600 text-white shadow-md flex items-center gap-2.5 text-[13px] font-medium animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filters & Tabs Row */}
      <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
        
        {/* Left: Quick Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
          {[
            { key: 'All', label: 'All Bill Books', count: bills.length },
            { key: 'Open', label: 'Open (No Advance)', count: bills.filter((b) => b.status === 'Open').length },
            { key: 'Partially Paid', label: 'Partially Paid', count: bills.filter((b) => b.status === 'Partially Paid').length },
            { key: 'Settled', label: 'Settled (Fully Paid)', count: bills.filter((b) => b.status === 'Settled').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-gray-200/70 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Search Box & Reset */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, passport, bill no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>

          {(searchTerm || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
              className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* Bill Book Table */}
      <div className="overflow-x-auto min-h-0">
        <table className="w-full text-left border-collapse min-w-[1180px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[12%] min-w-[120px]">Bill Book #</th>
              <th className="py-3.5 px-4 w-[22%] min-w-[210px]">Candidate & Passport</th>
              <th className="py-3.5 px-4 w-[12%] min-w-[120px]">Trade</th>
              <th className="py-3.5 px-4 w-[11%] min-w-[110px] text-center">Service Fee</th>
              <th className="py-3.5 px-4 w-[11%] min-w-[110px] text-center">Medical Fee</th>
              <th className="py-3.5 px-4 w-[11%] min-w-[110px] text-center font-bold text-gray-900">Total Bill</th>
              <th className="py-3.5 px-4 w-[11%] min-w-[110px] text-center text-emerald-700 font-bold">Advance Paid</th>
              <th className="py-3.5 px-4 w-[11%] min-w-[110px] text-center text-red-600 font-bold">Balance Due</th>
              <th className="py-3.5 px-4 w-[10%] min-w-[110px] text-center">Status</th>
              <th className="py-3.5 px-4 w-[13%] min-w-[180px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[13px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-gray-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No bill books found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/20 transition-colors">
                  
                  {/* 1. Bill Book # */}
                  <td className="py-4 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                    {row.billNo}
                  </td>

                  {/* 2. Candidate & Passport */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full text-white text-[13px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: row.avatarBg }}
                      >
                        {row.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-[13.5px] leading-snug whitespace-nowrap">
                          {row.name}
                        </div>
                        <div className="text-[11.5px] text-gray-500 font-mono mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                          <span>{row.passportNo}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-blue-600 font-medium">{row.candidateCode}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 3. Trade */}
                  <td className="py-4 px-4 font-semibold text-gray-800 whitespace-nowrap">
                    {row.trade}
                  </td>

                  {/* 4. Fixed Service Fee */}
                  <td className="py-4 px-4 text-center font-mono font-medium text-gray-700 whitespace-nowrap">
                    ₹{row.serviceFee.toLocaleString()}
                  </td>

                  {/* 5. Medical Fee */}
                  <td className="py-4 px-4 text-center font-mono font-medium text-purple-700 whitespace-nowrap">
                    ₹{row.medicalFee.toLocaleString()}
                  </td>

                  {/* 6. Total Bill */}
                  <td className="py-4 px-4 text-center font-mono font-bold text-gray-900 bg-gray-50/60 whitespace-nowrap">
                    ₹{row.totalBill.toLocaleString()}
                  </td>

                  {/* 7. Advance Paid */}
                  <td className="py-4 px-4 text-center font-mono font-bold text-emerald-600 whitespace-nowrap">
                    ₹{row.advancePaid.toLocaleString()}
                  </td>

                  {/* 8. Remaining Balance */}
                  <td className="py-4 px-4 text-center font-mono font-bold text-red-600 whitespace-nowrap">
                    ₹{row.balance.toLocaleString()}
                  </td>

                  {/* 9. Status */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                        row.status === 'Settled'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : row.status === 'Partially Paid'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>

                  {/* 10. Actions */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                      
                      {/* Receipt View Button */}
                      <button
                        onClick={() => setViewReceiptModal(row)}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="View Official Receipt"
                      >
                        <Receipt className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>Receipt</span>
                      </button>

                      {/* Collect Payment Button (if balance remains) */}
                      {row.balance > 0 ? (
                        <button
                          onClick={() => {
                            setPaymentModal(row);
                            setPayAmount(row.balance);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap hover:shadow"
                          title="Record Advance or Balance Payment"
                        >
                          <CreditCard className="w-3.5 h-3.5 shrink-0" />
                          <span>Collect</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Settled
                        </span>
                      )}

                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white mt-auto">
        <div className="text-[12.5px] text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{filtered.length}</span> of <span className="font-bold text-gray-900">{bills.length}</span> bill books
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 text-[12px] hover:bg-gray-50 font-medium cursor-pointer">
            Previous
          </button>
          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[12px] font-bold">1</span>
          <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 text-[12px] hover:bg-gray-50 font-medium cursor-pointer">
            Next
          </button>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-[15px]">Record Payment Entry</h3>
              </div>
              <button onClick={() => setPaymentModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>
            
            <form onSubmit={handleCollectPayment} className="p-6 space-y-4 text-[13px]">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">{paymentModal.name} ({paymentModal.billNo})</div>
                <div className="text-gray-600 font-mono text-[11.5px]">Passport: {paymentModal.passportNo} • Total Bill: ₹{paymentModal.totalBill.toLocaleString()}</div>
                <div className="flex justify-between font-bold pt-1.5 border-t border-gray-200 text-[12.5px]">
                  <span className="text-emerald-700">Advance Paid: ₹{paymentModal.advancePaid.toLocaleString()}</span>
                  <span className="text-red-600">Balance Due: ₹{paymentModal.balance.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Amount to Collect (INR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentModal.balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] font-mono font-bold text-gray-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option>UPI / QR Code</option>
                    <option>Bank IMPS / NEFT</option>
                    <option>Cash Receipt</option>
                    <option>Debit / Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-[13px] font-semibold hover:bg-emerald-700 shadow-sm cursor-pointer"
                >
                  Confirm & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Receipt Modal */}
      {viewReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-gray-900 text-[15px]">Official Payment Voucher</h3>
              </div>
              <button onClick={() => setViewReceiptModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <div className="border border-dashed border-gray-300 p-4 rounded-xl space-y-2 bg-gray-50/50">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-bold text-gray-900">CHHAYA INTERNATIONAL</span>
                  <span className="font-mono text-[11px] text-blue-600 font-bold">{viewReceiptModal.billNo}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500">Candidate:</span>
                  <span className="font-bold text-gray-900">{viewReceiptModal.name}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500">Passport / Code:</span>
                  <span className="font-mono text-gray-700">{viewReceiptModal.passportNo} ({viewReceiptModal.candidateCode})</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-500">Trade:</span>
                  <span className="font-semibold text-gray-800">{viewReceiptModal.trade}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 space-y-1">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-600">Fixed Service Charge:</span>
                    <span className="font-mono font-medium">₹{viewReceiptModal.serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-600">GAMCA Medical Test Fee:</span>
                    <span className="font-mono font-medium">₹{viewReceiptModal.medicalFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total Bill:</span>
                    <span className="font-mono">₹{viewReceiptModal.totalBill.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Advance Collected:</span>
                    <span className="font-mono">₹{viewReceiptModal.advancePaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Balance Due:</span>
                    <span className="font-mono">₹{viewReceiptModal.balance.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewReceiptModal(null)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-[12.5px] font-medium hover:bg-gray-900 cursor-pointer"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
