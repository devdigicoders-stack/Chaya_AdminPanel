import { useState, useEffect } from 'react';
import { 
  X, Receipt, PlusCircle, CheckCircle2, Clock, 
  DollarSign, ArrowDownRight, ArrowUpRight, RefreshCw,
  Volume2, ExternalLink, ShieldCheck, FileCheck2, AlertTriangle, MessageCircle
} from 'lucide-react';
import { apiAddBillBookTransaction, apiVerifyBillBookTransaction, apiAddBillBookCharge, apiGetLeadById, getCurrentUser } from '../../utils/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';

export default function BillBookModal({ isOpen, onClose, lead, onUpdated }) {
  if (!isOpen || !lead) return null;

  const [localLead, setLocalLead] = useState(lead);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLocalLead(lead);
    if (lead?._id) {
      refreshLocalLead(lead._id);
    }
  }, [lead?._id, isOpen]);

  const refreshLocalLead = async (targetId) => {
    const id = targetId || localLead?._id || lead?._id;
    if (!id) return;
    try {
      setRefreshing(true);
      const res = await apiGetLeadById(id);
      if (res?.data) {
        setLocalLead(res.data);
      }
    } catch (e) {
      console.error('Failed to refresh bill book lead data:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleShareReportViaWhatsApp = () => {
    if (!localLead) return;
    const phone = localLead.phone || localLead.applicationForm?.phone || '';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;

    if (!digits) {
      showErrorAlert('Missing Phone', 'Candidate phone number is not available for WhatsApp');
      return;
    }

    const cName = localLead.candidateName || 'Candidate';
    const passport = localLead.passportNumber || 'N/A';
    const slip = localLead.medicalDetails?.slipNo || 'GCC-GAMCA';
    const pdfUrl = localLead.medicalDetails?.reportUrl || '';

    const text = `Dear ${cName},\n\n` +
      `Greetings from Chhaya International! 🌟\n\n` +
      `Your GAMCA Medical Examination Report has been issued:\n` +
      `📋 Medical Verdict: GAMCA FIT / PASSED\n` +
      `🆔 Passport: ${passport}\n` +
      `📄 Slip / Token No: ${slip}\n` +
      (pdfUrl ? `🔗 Medical Report PDF: ${pdfUrl}\n\n` : `\n`) +
      `Congratulations on clearing your medical test! To confirm your file for visa issuance and departure scheduling, please confirm your advance booking.\n\n` +
      `Thank you,\nChhaya International`;

    const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const currentUser = getCurrentUser() || {};
  const isAccountsOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'ACCOUNTS', 'Super Administrator', 'Accounts Manager'].includes(currentUser.role) || currentUser.role?.includes('ADMIN') || currentUser.role?.includes('ACCOUNTS');

  const billBook = localLead?.billBook || {
    isLedgerOpen: false,
    approvedPayable: localLead?.paymentBooking?.totalServiceFee || 0,
    totalReceived: localLead?.paymentBooking?.advanceAmount || 0,
    balanceDue: (localLead?.paymentBooking?.totalServiceFee || 0) - (localLead?.paymentBooking?.advanceAmount || 0),
    approvedRefund: 0,
    refundPaid: 0,
    refundBalance: 0,
    charges: [],
    transactions: []
  };

  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'charges'
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAddChargeModal, setShowAddChargeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Transaction Form State
  const [txType, setTxType] = useState('ADVANCE');
  const [txAmount, setTxAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNo, setReferenceNo] = useState('');
  const [txRemarks, setTxRemarks] = useState('');

  // New Charge Form State
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0) {
      showErrorAlert('Please enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const res = await apiAddBillBookTransaction(localLead._id, {
        type: txType,
        head: txType === 'REFUND' ? 'REFUND' : txType,
        amount: parseFloat(txAmount),
        paymentMode: paymentMethod,
        paymentMethod: paymentMethod,
        referenceNo,
        remarks: txRemarks
      });
      showSuccessAlert('Payment transaction recorded successfully in Bill Book!');
      setShowAddTxModal(false);
      setTxAmount('');
      setReferenceNo('');
      setTxRemarks('');
      if (res?.data) {
        setLocalLead(prev => ({ ...prev, billBook: res.data }));
      }
      await refreshLocalLead();
      if (onUpdated) onUpdated();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!chargeDesc || !chargeAmount || parseFloat(chargeAmount) <= 0) {
      showErrorAlert('Please enter valid charge description and amount');
      return;
    }
    setLoading(true);
    try {
      const res = await apiAddBillBookCharge(localLead._id, {
        head: 'SERVICE',
        description: chargeDesc,
        amount: parseFloat(chargeAmount)
      });
      showSuccessAlert('Approved charge added to ledger!');
      setShowAddChargeModal(false);
      setChargeDesc('');
      setChargeAmount('');
      if (res?.data) {
        setLocalLead(prev => ({ ...prev, billBook: res.data }));
      }
      await refreshLocalLead();
      if (onUpdated) onUpdated();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to add charge');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (receiptNo) => {
    if (!confirm(`Verify receipt ${receiptNo}? This confirms money has been cleared by Accounts.`)) return;
    setLoading(true);
    try {
      const res = await apiVerifyBillBookTransaction(localLead._id, receiptNo);
      showSuccessAlert(`Receipt ${receiptNo} marked as VERIFIED!`);
      if (res?.data) {
        setLocalLead(prev => ({ ...prev, billBook: res.data }));
      }
      await refreshLocalLead();
      if (onUpdated) onUpdated();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to verify transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Receipt className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Official Bill Book & Ledger</h2>
              <p className="text-xs text-blue-100 opacity-90 flex items-center flex-wrap gap-1 mt-0.5">
                <span>Candidate: <span className="font-semibold text-white">{localLead.name || localLead.candidateName}</span></span> 
                {localLead.candidateCode && <span className="px-2 py-0.5 bg-blue-500/30 rounded text-[10px] font-mono">{localLead.candidateCode}</span>}
                <span className="font-mono">({localLead.phone})</span>
                {localLead.totalApplicationsCount > 1 && (
                  <span className="px-2 py-0.5 bg-purple-500/40 border border-purple-300/40 rounded text-[10px] font-mono font-bold text-amber-200">
                    CYCLE #{localLead.totalApplicationsCount} ({localLead.currentApplicationId || 'APP-01'})
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => refreshLocalLead()}
              disabled={refreshing}
              title="Refresh ledger history"
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Ledger Summary Cards */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Payable</div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                ₹{(billBook.approvedPayable || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Total official fee agreed</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center justify-between">
                <span>Total Received</span>
                <ArrowDownRight className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-600">
                ₹{(billBook.totalReceived || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-0.5">Cleared & verified in bank</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center justify-between">
                <span>Balance Due</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-1 text-2xl font-black text-amber-600">
                ₹{Math.max(0, (billBook.approvedPayable || 0) - (billBook.totalReceived || 0)).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-amber-500/80 mt-0.5">Pending collection</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center justify-between">
                <span>Refund Pending</span>
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-1 text-2xl font-black text-rose-600">
                ₹{(billBook.refundBalance || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-rose-500/80 mt-0.5">
                Paid: ₹{(billBook.refundPaid || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Medical Report & Advance Confirmation Verification Strip */}
          <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Advance Audit:</span>
              </span>

              {/* Report Sent */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                localLead?.medicalDetails?.isReportSent || localLead?.medicalDetails?.reportUrl
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
              }`}>
                {localLead?.medicalDetails?.isReportSent || localLead?.medicalDetails?.reportUrl ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Report PDF Sent</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Report PDF Not Sent</span>
                  </>
                )}
              </span>

              {/* After Advance Confirmation */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                localLead?.paymentDetails?.afterAdvanceConfirmed
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                <span>After Advance: {localLead?.paymentDetails?.afterAdvanceConfirmed ? 'Confirmed' : 'Pending'}</span>
              </span>

              {/* Recording Confirmation */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                localLead?.paymentDetails?.recordingConfirmed
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                <span>Recording: {localLead?.paymentDetails?.recordingConfirmed ? 'Confirmed' : 'Pending'}</span>
              </span>
            </div>

            {/* Recording Audio Link & Report Link & WhatsApp Share */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareReportViaWhatsApp}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                title="Share Medical Report PDF and details on candidate's WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </button>
              {localLead?.medicalDetails?.reportUrl && (
                <a
                  href={localLead.medicalDetails.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-bold"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Report PDF</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              {localLead?.paymentDetails?.recordingUrl ? (
                <a
                  href={localLead.paymentDetails.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 border border-purple-200 text-purple-700 dark:text-purple-300 rounded-lg text-[11px] font-bold"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Call Recording</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className="text-[11px] text-slate-400 italic">No recording audio</span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60">
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'transactions' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Receipts & Payments ({(billBook.transactions || []).length})
              </button>
              <button 
                onClick={() => setActiveTab('charges')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'charges' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Ledger Charges ({(billBook.charges || []).length})
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowAddChargeModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                <PlusCircle className="w-4 h-4 text-blue-500" />
                <span>Add Charge</span>
              </button>

              <button 
                onClick={() => setShowAddTxModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                <DollarSign className="w-4 h-4" />
                <span>Record Payment / Receipt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Transactions Table */}
        {activeTab === 'transactions' && (
          <div className="p-6">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method / Ref</th>
                    <th className="py-3 px-4">Date & Collector</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(!billBook.transactions || billBook.transactions.length === 0) ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No transactions recorded in this ledger yet.
                      </td>
                    </tr>
                  ) : (
                    billBook.transactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {tx.receiptNo || `RCP-${idx + 1}`}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'REFUND' 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
                              : tx.type === 'ADVANCE'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          ₹{(tx.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{tx.paymentMode || tx.paymentMethod}</div>
                          {tx.referenceNo && <div className="text-[10px] text-slate-400 font-mono">{tx.referenceNo}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-700 dark:text-slate-300">
                            {tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="text-[10px] text-slate-400">{tx.receivedBy || tx.collectedByName || 'Staff'}</div>
                        </td>
                        <td className="py-3 px-4">
                          {(tx.status === 'VERIFIED' || tx.verificationStatus === 'VERIFIED') ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Verified by Accounts</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-amber-600 font-semibold text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Pending Verification</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {tx.status !== 'VERIFIED' && tx.verificationStatus !== 'VERIFIED' && isAccountsOrAdmin && (
                            <button
                              onClick={() => handleVerify(tx.receiptNo)}
                              disabled={loading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition"
                            >
                              Verify Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Charges Table */}
        {activeTab === 'charges' && (
          <div className="p-6">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Added By</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(!billBook.charges || billBook.charges.length === 0) ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">
                        No additional charges applied. Base service fee is ₹{(localLead.paymentBooking?.totalServiceFee || 0).toLocaleString('en-IN')}.
                      </td>
                    </tr>
                  ) : (
                    billBook.charges.map((charge, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {charge.description}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          ₹{(charge.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {charge.addedByName || 'System'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {charge.addedAt ? new Date(charge.addedAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Transaction Modal */}
        {showAddTxModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">Record Bill Book Receipt / Payment</h3>
                <button onClick={() => setShowAddTxModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Transaction Type</label>
                  <select 
                    value={txType} 
                    onChange={e => setTxType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="ADVANCE">Advance Payment (Step 9)</option>
                    <option value="STAGE_PAYMENT">Stage Progress Payment</option>
                    <option value="FINAL">Final Settlement (Step 14)</option>
                    <option value="MEDICAL">Medical Center Fee</option>
                    <option value="VISA">Visa Processing Fee</option>
                    <option value="REFUND">Refund Disbursement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Amount (₹ INR) *</label>
                  <input 
                    type="number"
                    value={txAmount}
                    onChange={e => setTxAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    required
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Payment Method</label>
                  <select 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="BANK_TRANSFER">Bank IMPS / NEFT / RTGS</option>
                    <option value="CASH">Cash Deposit at Desk</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Transaction Ref / UTR / Receipt No</label>
                  <input 
                    type="text"
                    value={referenceNo}
                    onChange={e => setReferenceNo(e.target.value)}
                    placeholder="e.g. UTR8932019401"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Remarks</label>
                  <input 
                    type="text"
                    value={txRemarks}
                    onChange={e => setTxRemarks(e.target.value)}
                    placeholder="Optional notes"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddTxModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    {loading ? 'Recording...' : 'Save Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Charge Modal */}
        {showAddChargeModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">Add Approved Charge to Ledger</h3>
                <button onClick={() => setShowAddChargeModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={handleAddCharge} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Charge Description *</label>
                  <input 
                    type="text"
                    value={chargeDesc}
                    onChange={e => setChargeDesc(e.target.value)}
                    placeholder="e.g. Visa Express Stamping Fee / Insurance"
                    required
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Amount (₹ INR) *</label>
                  <input 
                    type="number"
                    value={chargeAmount}
                    onChange={e => setChargeAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddChargeModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    {loading ? 'Adding...' : 'Add Charge'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
