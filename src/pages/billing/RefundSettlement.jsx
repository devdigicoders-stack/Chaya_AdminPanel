import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCcw, Banknote, CheckCircle2, Clock, AlertTriangle, 
  Search, RefreshCw, Loader2, Download, Printer, Eye, 
  CreditCard, FileText, Plus, X, ArrowUpRight, ShieldCheck,
  Building, User, Check, AlertCircle, Copy, CheckCheck, Landmark
} from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  apiGetRefundLeads, 
  apiProcessRefundPayout, 
  apiCloseLeadFile, 
  apiGetLeads, 
  apiUploadLeadMedia,
  apiGetLeadById,
  getCurrentUser 
} from '../../utils/api';
import BillBookModal from '../../components/billing/BillBookModal';
import { generateRefundPdf } from '../../utils/refundPdfGenerator';

export default function RefundSettlement() {
  const currentUser = getCurrentUser();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, REFUND_PENDING, FINANCIAL_PENDING, FINAL_CLOSED, CLOSED_NO_ADVANCE

  // Modals
  const [selectedBillBookLead, setSelectedBillBookLead] = useState(null);
  const [payoutModalLead, setPayoutModalLead] = useState(null);
  const [newCancellationModal, setNewCancellationModal] = useState(false);
  const [bankEditModalLead, setBankEditModalLead] = useState(null);

  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    paymentMode: 'BANK_TRANSFER',
    referenceNo: '',
    remarks: '',
    receiptUrl: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // New Cancellation Form
  const [allActiveCandidates, setAllActiveCandidates] = useState([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [cancellationForm, setCancellationForm] = useState({
    leadId: '',
    closureType: 'REFUND_PENDING',
    reason: '',
    refundPayable: '',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  // Fetch refund and cancellation leads
  const fetchRefundLeads = async () => {
    setLoading(true);
    try {
      const res = await apiGetRefundLeads();
      if (res?.success && res.data) {
        setLeads(res.data);
      }
    } catch (err) {
      console.error('Failed to load refund leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundLeads();
  }, []);

  // Filter leads based on Tab and Search
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // Tab filter
      if (activeTab === 'REFUND_PENDING') {
        if (l.closureStatus !== 'REFUND_PENDING' && !(l.billBook?.refundBalance > 0)) return false;
      } else if (activeTab === 'FINANCIAL_PENDING') {
        if (l.closureStatus !== 'FINANCIAL_PENDING') return false;
      } else if (activeTab === 'FINAL_CLOSED') {
        if (l.closureStatus !== 'FINAL_CLOSED') return false;
      } else if (activeTab === 'CLOSED_NO_ADVANCE') {
        if (l.closureStatus !== 'CLOSED_NO_ADVANCE') return false;
      }

      // Search filter
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const name = (l.candidateName || '').toLowerCase();
      const phone = (l.phone || '').toLowerCase();
      const passport = (l.passportNumber || '').toLowerCase();
      const id = (l.leadId || l._id || '').toLowerCase();
      const reason = (l.closureDetails?.reason || '').toLowerCase();

      return name.includes(term) || phone.includes(term) || passport.includes(term) || id.includes(term) || reason.includes(term);
    });
  }, [leads, activeTab, searchTerm]);

  // Financial Stats Calculation
  const stats = useMemo(() => {
    let totalApproved = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let pendingCount = 0;
    let settledCount = 0;

    leads.forEach(l => {
      const approved = l.billBook?.approvedRefund || l.closureDetails?.refundPayable || 0;
      const paid = l.billBook?.refundPaid || l.closureDetails?.refundPaid || 0;
      const balance = Math.max(0, approved - paid);

      totalApproved += approved;
      totalPaid += paid;
      totalBalance += balance;

      if (l.closureStatus === 'FINAL_CLOSED' || (approved > 0 && balance === 0)) {
        settledCount++;
      } else if (balance > 0 || l.closureStatus === 'REFUND_PENDING') {
        pendingCount++;
      }
    });

    return { totalApproved, totalPaid, totalBalance, pendingCount, settledCount };
  }, [leads]);

  // Open Payout Modal
  const openPayoutModal = (lead) => {
    const approved = lead.billBook?.approvedRefund || lead.closureDetails?.refundPayable || 0;
    const paid = lead.billBook?.refundPaid || lead.closureDetails?.refundPaid || 0;
    const balance = Math.max(0, approved - paid);
    const bank = lead.closureDetails?.bankDetails || {};

    setPayoutModalLead(lead);
    setPayoutForm({
      amount: balance > 0 ? balance : '',
      paymentMode: 'BANK_TRANSFER',
      referenceNo: '',
      remarks: `Refund payout against Case ${lead.leadId || lead._id.slice(-6)}`,
      receiptUrl: '',
      accountHolderName: bank.accountHolderName || lead.candidateName || '',
      bankName: bank.bankName || '',
      accountNumber: bank.accountNumber || '',
      ifscCode: bank.ifscCode || '',
      upiId: bank.upiId || ''
    });
  };

  // Upload Payment Proof Slip
  const handleUploadSlip = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !payoutModalLead) return;

    setUploadingSlip(true);
    try {
      const res = await apiUploadLeadMedia(payoutModalLead._id, file, 'PAYMENT_SLIP');
      if (res?.success && res.data?.url) {
        setPayoutForm(prev => ({ ...prev, receiptUrl: res.data.url }));
        Swal.fire({
          icon: 'success',
          title: 'Slip Uploaded!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
      }
    } catch (err) {
      Swal.fire('Upload Failed', err.message || 'Error uploading slip', 'error');
    } finally {
      setUploadingSlip(false);
    }
  };

  // Submit Refund Payout
  const handleDisburseRefund = async (e) => {
    e.preventDefault();
    if (!payoutModalLead) return;

    const numAmount = Number(payoutForm.amount);
    if (!numAmount || numAmount <= 0) {
      return Swal.fire('Error', 'Please enter a valid disbursement amount', 'warning');
    }

    if (payoutForm.paymentMode !== 'CASH' && !payoutForm.referenceNo.trim()) {
      return Swal.fire('UTR Required', 'Please enter Bank UTR / Transaction Reference Number', 'warning');
    }

    setActionLoadingId(payoutModalLead._id);
    try {
      const res = await apiProcessRefundPayout(payoutModalLead._id, {
        amount: numAmount,
        paymentMode: payoutForm.paymentMode,
        referenceNo: payoutForm.referenceNo,
        remarks: payoutForm.remarks,
        receiptUrl: payoutForm.receiptUrl,
        bankDetails: {
          accountHolderName: payoutForm.accountHolderName,
          bankName: payoutForm.bankName,
          accountNumber: payoutForm.accountNumber,
          ifscCode: payoutForm.ifscCode,
          upiId: payoutForm.upiId
        }
      });

      if (res?.success) {
        const updatedLead = res.data;
        const isFullySettled = updatedLead.closureStatus === 'FINAL_CLOSED' || updatedLead.billBook?.refundBalance === 0;

        Swal.fire({
          icon: 'success',
          title: isFullySettled ? '🎉 Final Settlement Completed!' : 'Refund Disbursed!',
          html: `
            <div class="text-left text-sm space-y-2">
              <p>Disbursed <b>₹${numAmount.toLocaleString('en-IN')}</b> to <b>${payoutModalLead.candidateName}</b>.</p>
              <p>Status: <span class="font-bold ${isFullySettled ? 'text-emerald-600' : 'text-amber-600'}">${updatedLead.closureStatus}</span></p>
              <p>Remaining Balance: <b>₹${(updatedLead.billBook?.refundBalance || 0).toLocaleString('en-IN')}</b></p>
            </div>
          `,
          showDenyButton: true,
          confirmButtonText: 'OK',
          denyButtonText: '📄 Download Official Statement',
          confirmButtonColor: '#059669',
          denyButtonColor: '#2563eb'
        }).then((result) => {
          if (result.isDenied) {
            generateRefundPdf(updatedLead, { download: true });
          }
        });

        setPayoutModalLead(null);
        fetchRefundLeads();
      }
    } catch (err) {
      Swal.fire('Disbursement Failed', err.message || 'Error recording payout', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open New Cancellation Modal & load active leads
  const openNewCancellationModal = async () => {
    setNewCancellationModal(true);
    setLoadingActive(true);
    try {
      const res = await apiGetLeads({ stage: 'ALL' });
      if (res?.success && res.data) {
        // Active candidates with some advance or registered file
        const candidates = res.data.filter(l => l.closureStatus === 'ACTIVE' || !l.closureStatus);
        setAllActiveCandidates(candidates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActive(false);
    }
  };

  // Submit New Cancellation Request
  const handleSubmitCancellation = async (e) => {
    e.preventDefault();
    if (!cancellationForm.leadId) {
      return Swal.fire('Select Candidate', 'Please choose a candidate file to close/cancel', 'warning');
    }

    try {
      const res = await apiCloseLeadFile(cancellationForm.leadId, {
        closureType: cancellationForm.closureType,
        reason: cancellationForm.reason,
        refundPayable: Number(cancellationForm.refundPayable) || 0
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'File Closed / Cancellation Logged',
          text: `File marked as ${cancellationForm.closureType} with refund liability ₹${cancellationForm.refundPayable || 0}`,
          confirmButtonColor: '#059669'
        });
        setNewCancellationModal(false);
        fetchRefundLeads();
      }
    } catch (err) {
      Swal.fire('Action Failed', err.message || 'Error closing file', 'error');
    }
  };

  // Copy helper
  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
              Accounts Desk • Section 5 & 9
            </span>
            <span className="text-xs text-slate-500 font-medium">Chhaya Financial Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-rose-600" />
            Refund & Cancellation Settlement Desk
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Audit approved refunds, track deduction penalties, and disburse bank settlements with official PDF statements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchRefundLeads}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : ''}`} />
            Refresh
          </button>

          <button
            onClick={openNewCancellationModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Initiate Cancellation / Refund
          </button>
        </div>
      </div>

      {/* ─── KPI Stats Row ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Card 1: Total Cases */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Cases</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{leads.length}</h3>
            <span className="text-[11px] text-slate-500">Cancellations logged</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Approved Liability */}
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-rose-50/40">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Approved Liability</p>
            <h3 className="text-2xl font-black text-rose-900 mt-0.5">₹{stats.totalApproved.toLocaleString('en-IN')}</h3>
            <span className="text-[11px] text-rose-600 font-medium">Sanctioned refunds</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Disbursed to Date */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/40">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Disbursed</p>
            <h3 className="text-2xl font-black text-emerald-900 mt-0.5">₹{stats.totalPaid.toLocaleString('en-IN')}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Credited to candidates</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Outstanding Balance */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-amber-50/50">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Outstanding Balance</p>
            <h3 className="text-2xl font-black text-amber-900 mt-0.5">₹{stats.totalBalance.toLocaleString('en-IN')}</h3>
            <span className="text-[11px] text-amber-700 font-semibold">{stats.pendingCount} cases pending</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Fully Settled */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-indigo-50/40">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Fully Settled</p>
            <h3 className="text-2xl font-black text-indigo-900 mt-0.5">{stats.settledCount}</h3>
            <span className="text-[11px] text-indigo-600 font-medium">Final closed (NIL due)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── Filter Tabs & Search Bar ─── */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Cases', count: leads.length },
            { id: 'REFUND_PENDING', label: 'Refund Pending', count: stats.pendingCount },
            { id: 'FINANCIAL_PENDING', label: 'Financial Pending' },
            { id: 'FINAL_CLOSED', label: 'Final Closed (Settled)', count: stats.settledCount },
            { id: 'CLOSED_NO_ADVANCE', label: 'Closed (No Advance)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, phone, passport, UTR..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Main Refunds Table ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Fetching accounts refund settlements...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-center px-4">
            <RotateCcw className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-bold text-slate-700 mt-2">No refund records found</p>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchTerm ? 'No candidates match your search query.' : 'No candidates currently logged for refund settlement or cancellation under this status.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3.5">Candidate & Case</th>
                  <th className="py-3 px-3.5">Cancellation Details</th>
                  <th className="py-3 px-3.5 text-right">Total Recv.</th>
                  <th className="py-3 px-3.5 text-right">Approved Refund</th>
                  <th className="py-3 px-3.5 text-right">Disbursed</th>
                  <th className="py-3 px-3.5 text-right">Balance Due</th>
                  <th className="py-3 px-3.5">Candidate Bank / Payout</th>
                  <th className="py-3 px-3.5 text-center">Settlement Status</th>
                  <th className="py-3 px-3.5 text-right">Accounts Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeads.map(lead => {
                  const bill = lead.billBook || {};
                  const totalRecv = bill.totalReceived || lead.paymentDetails?.totalPaid || lead.paymentDetails?.advancePaid || 0;
                  const approved = bill.approvedRefund || lead.closureDetails?.refundPayable || 0;
                  const paid = bill.refundPaid || lead.closureDetails?.refundPaid || 0;
                  const balance = Math.max(0, approved - paid);
                  const isSettled = lead.closureStatus === 'FINAL_CLOSED' || (approved > 0 && balance === 0);
                  const bank = lead.closureDetails?.bankDetails || {};

                  return (
                    <tr key={lead._id} className="hover:bg-slate-50/70 transition">
                      {/* Candidate & Case */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shrink-0">
                            {lead.candidateName?.[0] || 'C'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{lead.candidateName}</span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <span>{lead.phone}</span>
                              {lead.passportNumber && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{lead.passportNumber}</span>
                                </>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              ID: {lead.leadId || lead._id.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cancellation Details */}
                      <td className="py-3.5 px-3.5">
                        <div className="max-w-xs">
                          <span className="text-slate-800 font-medium block truncate">
                            {lead.closureDetails?.reason || lead.holdReason || 'Client withdrew / Cancellation'}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {lead.closureDetails?.closedAt ? new Date(lead.closureDetails.closedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date: N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Total Received */}
                      <td className="py-3.5 px-3.5 text-right font-mono font-medium text-slate-700">
                        ₹{totalRecv.toLocaleString('en-IN')}
                      </td>

                      {/* Approved Refund */}
                      <td className="py-3.5 px-3.5 text-right font-mono font-bold text-rose-700">
                        ₹{approved.toLocaleString('en-IN')}
                      </td>

                      {/* Disbursed */}
                      <td className="py-3.5 px-3.5 text-right font-mono font-bold text-emerald-700">
                        ₹{paid.toLocaleString('en-IN')}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-3.5 text-right font-mono">
                        {balance > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded font-black text-amber-900 bg-amber-100 border border-amber-200">
                            ₹{balance.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <Check className="w-3.5 h-3.5" />
                            ₹0 (NIL)
                          </span>
                        )}
                      </td>

                      {/* Bank Details */}
                      <td className="py-3.5 px-3.5">
                        {bank.accountNumber || bank.upiId ? (
                          <div className="text-[11px] space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            {bank.accountNumber && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-500 font-mono">A/C: {bank.accountNumber}</span>
                                <button
                                  onClick={() => copyToClipboard(bank.accountNumber, `ac_${lead._id}`)}
                                  className="text-slate-400 hover:text-slate-700"
                                  title="Copy Account Number"
                                >
                                  {copiedField === `ac_${lead._id}` ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}
                            {bank.ifscCode && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-500 font-mono">IFSC: {bank.ifscCode}</span>
                                <button
                                  onClick={() => copyToClipboard(bank.ifscCode, `ifsc_${lead._id}`)}
                                  className="text-slate-400 hover:text-slate-700"
                                  title="Copy IFSC"
                                >
                                  {copiedField === `ifsc_${lead._id}` ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}
                            {bank.upiId && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-indigo-600 font-mono">UPI: {bank.upiId}</span>
                                <button
                                  onClick={() => copyToClipboard(bank.upiId, `upi_${lead._id}`)}
                                  className="text-slate-400 hover:text-slate-700"
                                  title="Copy UPI ID"
                                >
                                  {copiedField === `upi_${lead._id}` ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setBankEditModalLead(lead);
                            }}
                            className="text-[11px] text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-md flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            + Add Bank Details
                          </button>
                        )}
                      </td>

                      {/* Settlement Status */}
                      <td className="py-3.5 px-3.5 text-center">
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            FINAL CLOSED
                          </span>
                        ) : lead.closureStatus === 'CLOSED_NO_ADVANCE' ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            CLOSED (NO ADV)
                          </span>
                        ) : lead.closureStatus === 'FINANCIAL_PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <AlertCircle className="w-3 h-3" />
                            FINANCIAL PENDING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            REFUND PENDING
                          </span>
                        )}
                      </td>

                      {/* Accounts Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Disburse Payout Button */}
                          {balance > 0 ? (
                            <button
                              onClick={() => openPayoutModal(lead)}
                              disabled={actionLoadingId === lead._id}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
                              title="Disburse Refund Payout"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              Pay Refund
                            </button>
                          ) : (
                            <button
                              onClick={() => openPayoutModal(lead)}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
                              title="Record Adjustment / Reversal"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              Adjust
                            </button>
                          )}

                          {/* 2. Bill Book Modal */}
                          <button
                            onClick={() => setSelectedBillBookLead(lead)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition shadow-xs"
                            title="Open Central Bill Book Ledger"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Official PDF Voucher */}
                          <button
                            onClick={() => generateRefundPdf(lead, { download: true })}
                            className="p-1.5 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition shadow-xs"
                            title="Download Official Refund & Settlement Statement PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: Disburse Refund Payout ─── */}
      {payoutModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  Accounts Disbursement Voucher
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  Disburse Refund Payout
                </h3>
              </div>
              <button
                onClick={() => setPayoutModalLead(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate & Balance Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Candidate</span>
                <span className="font-bold text-slate-900 text-xs truncate block">{payoutModalLead.candidateName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Approved</span>
                <span className="font-bold text-rose-700 text-xs block">
                  ₹{(payoutModalLead.billBook?.approvedRefund || payoutModalLead.closureDetails?.refundPayable || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Paid So Far</span>
                <span className="font-bold text-emerald-700 text-xs block">
                  ₹{(payoutModalLead.billBook?.refundPaid || payoutModalLead.closureDetails?.refundPaid || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Balance Due</span>
                <span className="font-black text-amber-700 text-xs block">
                  ₹{Math.max(0, (payoutModalLead.billBook?.approvedRefund || payoutModalLead.closureDetails?.refundPayable || 0) - (payoutModalLead.billBook?.refundPaid || payoutModalLead.closureDetails?.refundPaid || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <form onSubmit={handleDisburseRefund} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payout Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    placeholder="Enter refund amount"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Disbursement Channel <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={payoutForm.paymentMode}
                    onChange={(e) => setPayoutForm({ ...payoutForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="UPI">UPI Transfer (GPay / PhonePe / Paytm)</option>
                    <option value="CHEQUE">Bank Cheque</option>
                    <option value="CASH">Cash Voucher</option>
                  </select>
                </div>
              </div>

              {/* UTR / Reference No */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Reference No / UTR / Cheque No {payoutForm.paymentMode !== 'CASH' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  required={payoutForm.paymentMode !== 'CASH'}
                  value={payoutForm.referenceNo}
                  onChange={(e) => setPayoutForm({ ...payoutForm, referenceNo: e.target.value })}
                  placeholder="e.g. UTR1234567890 / UPI Ref 418293..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Candidate Bank Account Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-slate-500" />
                  Candidate Account / Payout Destination
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Account Holder Name</label>
                    <input
                      type="text"
                      value={payoutForm.accountHolderName}
                      onChange={(e) => setPayoutForm({ ...payoutForm, accountHolderName: e.target.value })}
                      placeholder="Name on bank passbook"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Bank Name</label>
                    <input
                      type="text"
                      value={payoutForm.bankName}
                      onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                      placeholder="e.g. State Bank of India"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Account Number</label>
                    <input
                      type="text"
                      value={payoutForm.accountNumber}
                      onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                      placeholder="Bank Account Number"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">IFSC Code</label>
                    <input
                      type="text"
                      value={payoutForm.ifscCode}
                      onChange={(e) => setPayoutForm({ ...payoutForm, ifscCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono uppercase"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">UPI ID / VPA</label>
                    <input
                      type="text"
                      value={payoutForm.upiId}
                      onChange={(e) => setPayoutForm({ ...payoutForm, upiId: e.target.value })}
                      placeholder="candidate@upi"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Upload Bank Transfer Slip */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Payment Slip / Screenshot</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleUploadSlip}
                    className="block w-full text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  />
                  {uploadingSlip && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />}
                </div>
                {payoutForm.receiptUrl && (
                  <span className="text-[11px] text-emerald-600 font-medium block mt-1">✓ Slip uploaded and attached</span>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Accounts Audit Remarks</label>
                <textarea
                  rows="2"
                  value={payoutForm.remarks}
                  onChange={(e) => setPayoutForm({ ...payoutForm, remarks: e.target.value })}
                  placeholder="Notes regarding disbursement..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPayoutModalLead(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === payoutModalLead._id}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-60 active:scale-95"
                >
                  {actionLoadingId === payoutModalLead._id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Disbursing...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Confirm & Clear Payout
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Initiate Cancellation & Refund ─── */}
      {newCancellationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  FRD Section 5 Protocol
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                  Initiate File Cancellation & Refund
                </h3>
              </div>
              <button
                onClick={() => setNewCancellationModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCancellation} className="space-y-4">
              {/* Select Active Candidate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Candidate File <span className="text-rose-500">*</span>
                </label>
                {loadingActive ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    Loading active candidate pool...
                  </div>
                ) : (
                  <select
                    required
                    value={cancellationForm.leadId}
                    onChange={(e) => {
                      const sel = allActiveCandidates.find(c => c._id === e.target.value);
                      const adv = sel?.paymentDetails?.totalPaid || sel?.paymentDetails?.advancePaid || 0;
                      setCancellationForm({
                        ...cancellationForm,
                        leadId: e.target.value,
                        refundPayable: adv > 0 ? adv : '',
                        closureType: adv > 0 ? 'REFUND_PENDING' : 'CLOSED_NO_ADVANCE'
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {allActiveCandidates.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.candidateName} (Ph: {c.phone} | Stage: {c.currentStage} | Adv: ₹{c.paymentDetails?.totalPaid || c.paymentDetails?.advancePaid || 0})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Closure Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Closure Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={cancellationForm.closureType}
                    onChange={(e) => setCancellationForm({ ...cancellationForm, closureType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="REFUND_PENDING">REFUND_PENDING (Advance Paid, Refund Sanctioned)</option>
                    <option value="FINANCIAL_PENDING">FINANCIAL_PENDING (Admin Closed, Accounts Audit)</option>
                    <option value="CLOSED_NO_ADVANCE">CLOSED_NO_ADVANCE (Zero Liability)</option>
                    <option value="FINAL_CLOSED">FINAL_CLOSED (Instant NIL Settlement)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Approved Refund Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={cancellationForm.refundPayable}
                    onChange={(e) => setCancellationForm({ ...cancellationForm, refundPayable: e.target.value })}
                    placeholder="Approved refund amount"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows="2"
                  value={cancellationForm.reason}
                  onChange={(e) => setCancellationForm({ ...cancellationForm, reason: e.target.value })}
                  placeholder="e.g. Candidate withdrew due to personal reasons / Medical unfit / Family emergency..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewCancellationModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition flex items-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Log Cancellation & Open Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Update Bank Details ─── */}
      {bankEditModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Candidate Payout Details
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Update Bank Details
                </h3>
              </div>
              <button
                onClick={() => setBankEditModalLead(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                try {
                  const res = await apiCloseLeadFile(bankEditModalLead._id, {
                    closureType: bankEditModalLead.closureStatus,
                    reason: bankEditModalLead.closureDetails?.reason || '',
                    refundPayable: bankEditModalLead.closureDetails?.refundPayable || 0,
                    bankDetails: {
                      accountHolderName: form.accountHolderName.value,
                      bankName: form.bankName.value,
                      accountNumber: form.accountNumber.value,
                      ifscCode: form.ifscCode.value.toUpperCase(),
                      upiId: form.upiId.value
                    }
                  });

                  if (res?.success) {
                    Swal.fire({
                      icon: 'success',
                      title: 'Bank Details Updated!',
                      toast: true,
                      position: 'top-end',
                      showConfirmButton: false,
                      timer: 2000
                    });
                    setBankEditModalLead(null);
                    fetchRefundLeads();
                  }
                } catch (err) {
                  Swal.fire('Error', err.message || 'Failed to update bank details', 'error');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                <input
                  name="accountHolderName"
                  type="text"
                  defaultValue={bankEditModalLead.closureDetails?.bankDetails?.accountHolderName || bankEditModalLead.candidateName}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  name="bankName"
                  type="text"
                  defaultValue={bankEditModalLead.closureDetails?.bankDetails?.bankName}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                <input
                  name="accountNumber"
                  type="text"
                  defaultValue={bankEditModalLead.closureDetails?.bankDetails?.accountNumber}
                  placeholder="Account Number"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                <input
                  name="ifscCode"
                  type="text"
                  defaultValue={bankEditModalLead.closureDetails?.bankDetails?.ifscCode}
                  placeholder="e.g. SBIN0001234"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID / VPA</label>
                <input
                  name="upiId"
                  type="text"
                  defaultValue={bankEditModalLead.closureDetails?.bankDetails?.upiId}
                  placeholder="candidate@upi"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setBankEditModalLead(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition active:scale-95"
                >
                  Save Bank Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Central Bill Book Ledger ─── */}
      {selectedBillBookLead && (
        <BillBookModal
          lead={selectedBillBookLead}
          isOpen={!!selectedBillBookLead}
          onClose={() => setSelectedBillBookLead(null)}
          onUpdated={() => {
            fetchRefundLeads();
          }}
        />
      )}
    </div>
  );
}
