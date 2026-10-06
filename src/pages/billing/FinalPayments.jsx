import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, DollarSign, Receipt, CheckCircle2, Search, 
  RefreshCw, Loader2, ArrowRight, Banknote, AlertCircle, 
  CreditCard, Eye, Printer, X, Check, ShieldCheck, Plane, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiRecordFinalPayment } from '../../utils/api';
import { generateInvoicePdf, printInvoiceReceipt } from '../../utils/invoicePdfGenerator';

export default function FinalPayments() {
  const navigate = useNavigate();

  // State
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');

  // Modals
  const [payModal, setPayModal] = useState(null);
  const [viewReceiptModal, setViewReceiptModal] = useState(null);
  const [formValues, setFormValues] = useState({
    amount: '',
    paymentMode: 'Bank Transfer',
    receiptNo: '',
    remarks: ''
  });

  // Fetch candidates from MongoDB Atlas
  const fetchFinalPaymentQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetLeads({ stage: 'ALL' });
      if (res?.success && res.data) {
        // Candidates who are at Pre-Viva, Visa Processing, Viva Placement, Completed or have payments recorded
        const queue = res.data.filter(l => 
          ['PRE_VISA', 'VISA_PROCESSING', 'VIVA_PLACEMENT', 'COMPLETED'].includes(l.currentStage) ||
          l.visaDetails?.status === 'APPROVED' ||
          (l.paymentDetails?.totalPaid && l.paymentDetails.totalPaid > 0)
        );
        setCandidates(queue);
      }
    } catch (err) {
      console.error('Failed to load final payment candidates', err);
      setError(err.message || 'Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinalPaymentQueue();
  }, []);

  // Save Final Payment
  const handleCollectFinal = async (e) => {
    e.preventDefault();
    if (!payModal) return;

    setActionLoadingId(payModal._id);
    try {
      const amount = Number(formValues.amount) || 0;
      const res = await apiRecordFinalPayment(payModal._id, {
        amount,
        paymentMode: formValues.paymentMode,
        receiptNo: formValues.receiptNo || `FP-${Math.floor(10000 + Math.random() * 90000)}`,
        remarks: formValues.remarks || 'Final balance payment cleared prior to flight deployment.'
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Final Payment Cleared!',
          text: `Payment of ₹${amount.toLocaleString()} received for ${payModal.candidateName}. Candidate is now cleared for ticket issuance & flight deployment.`,
          confirmButtonColor: '#059669',
          timer: 2500
        });
        setPayModal(null);
        fetchFinalPaymentQueue();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Payment Failed', text: err.message || 'Could not record final payment.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dynamic KPI Stats
  const metrics = useMemo(() => {
    let totalQueue = candidates.length;
    let totalBalanceDue = 0;
    let clearedCount = 0;
    let pendingCount = 0;

    candidates.forEach(c => {
      const p = c.paymentDetails || {};
      const sFee = Number(p.serviceFee) || 9500;
      const mFee = Number(p.medicalFee) || 2500;
      const totalBilled = sFee + mFee;
      const totalPaid = Number(p.totalPaid || p.advancePaid || (p.servicePaid || 0) + (p.medicalPaid || 0));
      const balance = Math.max(0, totalBilled - totalPaid);

      if (balance === 0 && totalPaid > 0) {
        clearedCount++;
      } else {
        totalBalanceDue += balance;
        pendingCount++;
      }
    });

    return { totalQueue, totalBalanceDue, clearedCount, pendingCount };
  }, [candidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const p = c.paymentDetails || {};
      const sFee = Number(p.serviceFee) || 9500;
      const mFee = Number(p.medicalFee) || 2500;
      const totalBilled = sFee + mFee;
      const totalPaid = Number(p.totalPaid || p.advancePaid || (p.servicePaid || 0) + (p.medicalPaid || 0));
      const balance = Math.max(0, totalBilled - totalPaid);
      const isCleared = balance === 0 && totalPaid > 0;

      if (filterTab === 'PENDING' && isCleared) return false;
      if (filterTab === 'CLEARED' && !isCleared) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (c.candidateName || '').toLowerCase();
        const passport = (c.passportNumber || '').toLowerCase();
        const trade = (c.trade || '').toLowerCase();
        const country = (c.country || '').toLowerCase();
        const receipt = (p.receiptNo || '').toLowerCase();

        if (!name.includes(q) && !passport.includes(q) && !trade.includes(q) && !country.includes(q) && !receipt.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, searchTerm, filterTab]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/billing/all')} className="hover:text-blue-600 cursor-pointer">06. Bill Book & Accounts</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Final Settlement</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Final Balance Payment Collection Desk
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/billing/all')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-gray-500" />
            <span>All Bill Books</span>
          </button>

          <button
            onClick={() => navigate('/billing/advance')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Banknote className="w-3.5 h-3.5 text-purple-600" />
            <span>Advance Desk</span>
          </button>

          <button
            onClick={() => navigate('/placement/joining')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plane className="w-3.5 h-3.5 text-blue-600" />
            <span>Flight & Joining</span>
          </button>

          <button
            onClick={fetchFinalPaymentQueue}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Real-time Dynamic KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        
        {/* Candidates in Final Stage */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Settlement Queue</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.totalQueue}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Pre-flight candidate pipeline</div>
          </div>
        </div>

        {/* Total Outstanding Balance */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Balance Due</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${metrics.totalBalanceDue.toLocaleString()}`}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Due before deployment</div>
          </div>
        </div>

        {/* Cleared / Settled */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Full Paid (Cleared)</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.clearedCount}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Cleared for flight</div>
          </div>
        </div>

        {/* Pending Settlement */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Action Required</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-purple-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.pendingCount}
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">Awaiting final payment</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Candidates', count: candidates.length },
              { key: 'PENDING', label: 'Pending Balance', count: metrics.pendingCount },
              { key: 'CLEARED', label: 'Full Paid (Cleared)', count: metrics.clearedCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterTab === tab.key
                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTab === tab.key ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-200/80 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, passport, trade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Live Final Payments Table (Connected to MongoDB Atlas) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Stage & Destination</th>
                <th className="py-3 px-4 font-mono text-right">Total Billed Fee</th>
                <th className="py-3 px-4 font-mono text-right">Advance Paid</th>
                <th className="py-3 px-4 font-mono text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Loading final settlement queue from database...</span>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>No candidates found matching final settlement filter.</span>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const p = candidate.paymentDetails || {};
                  const sFee = Number(p.serviceFee) || 9500;
                  const mFee = Number(p.medicalFee) || 2500;
                  const totalBilled = sFee + mFee;
                  const totalPaid = Number(p.totalPaid || p.advancePaid || (p.servicePaid || 0) + (p.medicalPaid || 0));
                  const balance = Math.max(0, totalBilled - totalPaid);
                  const isCleared = balance === 0 && totalPaid > 0;

                  return (
                    <tr key={candidate._id} className="hover:bg-emerald-50/30 transition-colors">
                      
                      {/* Candidate */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{candidate.candidateName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {candidate.passportNumber || 'No Passport'} • {candidate.phone || 'No Phone'}
                        </div>
                      </td>

                      {/* Stage & Destination */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{candidate.trade || 'General Worker'}</div>
                        <div className="text-[11px] text-emerald-600">
                          {candidate.country || 'Gulf Region'} • {candidate.currentStage?.replace(/_/g, ' ') || 'Stage Pending'}
                        </div>
                      </td>

                      {/* Total Billed */}
                      <td className="py-3 px-4 font-mono text-right text-gray-700">
                        ₹ {totalBilled.toLocaleString()}
                      </td>

                      {/* Advance Paid */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-blue-600">
                        ₹ {totalPaid.toLocaleString()}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-amber-600">
                        {balance > 0 ? `₹ ${balance.toLocaleString()}` : '₹ 0'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isCleared ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Full Paid (Cleared)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Final Balance
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Collect Final Balance Button */}
                          {balance > 0 && (
                            <button
                              onClick={() => {
                                setPayModal(candidate);
                                setFormValues({
                                  amount: String(balance),
                                  paymentMode: 'Bank Transfer',
                                  receiptNo: `FP-${Math.floor(10000 + Math.random() * 90000)}`,
                                  remarks: 'Final balance payment cleared.'
                                });
                              }}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Collect Final</span>
                            </button>
                          )}

                          {/* Quick Print Receipt */}
                          <button
                            type="button"
                            onClick={() => printInvoiceReceipt(candidate)}
                            className="h-7 w-7 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="Quick Print Settlement Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Download PDF */}
                          <button
                            type="button"
                            onClick={() => generateInvoicePdf(candidate, { download: true })}
                            className="h-7 w-7 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 text-gray-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="Quick Download PDF Voucher"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* View Receipt */}
                          <button
                            onClick={() => setViewReceiptModal(candidate)}
                            className="h-7 w-7 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="View Settlement Receipt"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Collect Final Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Collect Final Balance Settlement</h3>
                <p className="text-[11px] text-gray-500">{payModal.candidateName} • {payModal.passportNumber || 'No Passport'}</p>
              </div>
              <button onClick={() => setPayModal(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCollectFinal} className="p-5 space-y-4">
              
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Billed Fee:</span>
                  <span className="font-bold text-gray-900 font-mono">
                    ₹ {((Number(payModal.paymentDetails?.serviceFee) || 9500) + (Number(payModal.paymentDetails?.medicalFee) || 2500)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Advance Already Paid:</span>
                  <span className="font-bold text-blue-600 font-mono">
                    ₹ {(Number(payModal.paymentDetails?.totalPaid || payModal.paymentDetails?.advancePaid || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-emerald-200 pt-1 flex justify-between font-bold text-amber-700">
                  <span>Balance Due:</span>
                  <span className="font-mono text-sm">
                    ₹ {Math.max(0, ((Number(payModal.paymentDetails?.serviceFee) || 9500) + (Number(payModal.paymentDetails?.medicalFee) || 2500)) - (Number(payModal.paymentDetails?.totalPaid || payModal.paymentDetails?.advancePaid || 0))).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Final Settlement Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 7000"
                  value={formValues.amount}
                  onChange={(e) => setFormValues({ ...formValues, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Payment Mode *
                  </label>
                  <select
                    value={formValues.paymentMode}
                    onChange={(e) => setFormValues({ ...formValues, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    UTR / Receipt No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR-99882"
                    value={formValues.receiptNo}
                    onChange={(e) => setFormValues({ ...formValues, receiptNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Remarks / Clearance Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on balance settlement..."
                  value={formValues.remarks}
                  onChange={(e) => setFormValues({ ...formValues, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPayModal(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoadingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Clear Full Payment</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. View Settlement Receipt Modal */}
      {viewReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Settlement & Deployment Clearance</h3>
                  <p className="text-[11px] text-gray-500">{viewReceiptModal.candidateName} • {viewReceiptModal.passportNumber || 'No Passport'}</p>
                </div>
              </div>
              <button onClick={() => setViewReceiptModal(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Settlement Voucher:</span>
                  <span className="font-bold font-mono text-gray-900">
                    {viewReceiptModal.paymentDetails?.receiptNo || 'SETTLE-CLEARED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Billed:</span>
                  <span className="font-bold font-mono text-gray-900">
                    ₹ {((Number(viewReceiptModal.paymentDetails?.serviceFee) || 9500) + (Number(viewReceiptModal.paymentDetails?.medicalFee) || 2500)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Paid:</span>
                  <span className="font-bold font-mono text-emerald-600">
                    ₹ {(Number(viewReceiptModal.paymentDetails?.totalPaid || viewReceiptModal.paymentDetails?.advancePaid || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-700">Deployment Clearance:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cleared For Flight</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Mode:</span>
                  <span className="text-gray-800 font-medium">
                    {viewReceiptModal.paymentDetails?.paymentMode || 'Bank Transfer'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => printInvoiceReceipt(viewReceiptModal)}
                  className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Print official settlement voucher"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => generateInvoicePdf(viewReceiptModal, { download: true })}
                  className="h-9 px-3.5 border border-gray-200 hover:bg-gray-100 active:scale-95 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer transition bg-white"
                  title="Download official PDF voucher"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewReceiptModal(null)}
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
