import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Download, FileText, Banknote, Hourglass, 
  AlertCircle, CreditCard, CheckCircle2, 
  Search, RefreshCw, Loader2, Eye, Receipt, Printer, X, Check,
  ShieldCheck, AlertTriangle, ExternalLink, Volume2, FileCheck2, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiRecordPaymentBooking, apiRecordFinalPayment, apiSendMedicalReportPdf } from '../../utils/api';
import BillBookModal from '../../components/billing/BillBookModal';
import { generateInvoicePdf, printInvoiceReceipt } from '../../utils/invoicePdfGenerator';

export default function AllInvoices() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [viewInvoiceLead, setViewInvoiceLead] = useState(null);
  const [billBookLead, setBillBookLead] = useState(null);
  const [paymentModalLead, setPaymentModalLead] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentType: 'ADVANCE', // 'ADVANCE' or 'FINAL'
    servicePaid: '',
    medicalPaid: '',
    paymentMode: 'UPI',
    receiptNo: '',
    remarks: '',
    afterAdvanceConfirmed: false,
    recordingConfirmed: false,
    recordingUrl: '',
    reportUrl: ''
  });
  const [reportSentStatus, setReportSentStatus] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  // Fetch leads with billing & accounts data
  const fetchBillingLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetLeads({ stage: 'ALL' });
      if (res?.success && res.data) {
        // Filter candidates who have reached medical or beyond, or have payment records
        const billingCandidates = res.data.filter(l => 
          ['MEDICAL_PROCESS', 'ACCOUNTS_COLLECTION', 'STAFF_HEAD_HANDLING', 'PRE_VISA', 'VISA_PROCESSING', 'VIVA_PLACEMENT', 'COMPLETED'].includes(l.currentStage) ||
          (l.paymentDetails?.totalPaid && l.paymentDetails.totalPaid > 0) ||
          (l.paymentDetails?.advancePaid && l.paymentDetails.advancePaid > 0) ||
          (l.paymentDetails?.servicePaid && l.paymentDetails.servicePaid > 0)
        );
        setLeads(billingCandidates);
      }
    } catch (err) {
      console.error('Failed to load billing leads', err);
      setError(err.message || 'Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingLeads();
  }, []);

  // Send Medical Report PDF in modal
  const handleSendReportInInvoiceModal = async () => {
    if (!paymentModalLead) return;
    setSendingReport(true);
    try {
      const res = await apiSendMedicalReportPdf(paymentModalLead._id, { reportUrl: paymentForm.reportUrl });
      if (res?.success) {
        setReportSentStatus(true);
        Swal.fire({
          icon: 'success',
          title: 'Report Sent!',
          text: `Medical Report PDF marked as sent for ${paymentModalLead.candidateName}. Advance payment collection unlocked.`,
          timer: 2000
        });
        fetchBillingLeads();
      } else {
        Swal.fire({ icon: 'error', title: 'Failed', text: res?.message || 'Could not send medical report' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Error sending report' });
    } finally {
      setSendingReport(false);
    }
  };

  // Share Medical Report PDF & Confirmation on candidate's WhatsApp
  const handleShareReportViaWhatsApp = async () => {
    if (!paymentModalLead) return;
    const phone = paymentModalLead.phone || paymentModalLead.applicationForm?.phone || '';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;

    if (!digits) {
      Swal.fire({ icon: 'warning', title: 'Phone Missing', text: 'Candidate phone number is not available for WhatsApp.' });
      return;
    }

    const cName = paymentModalLead.candidateName || 'Candidate';
    const passport = paymentModalLead.passportNumber || 'N/A';
    const slip = paymentModalLead.medicalDetails?.slipNo || 'GCC-GAMCA';
    const pdfUrl = (paymentForm.reportUrl || '').trim() || paymentModalLead.medicalDetails?.reportUrl || '';

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

    if (!reportSentStatus) {
      await handleSendReportInInvoiceModal();
    }
  };

  // Save Payment
  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!paymentModalLead) return;

    setActionLoadingId(paymentModalLead._id);
    try {
      if (paymentForm.paymentType === 'ADVANCE') {
        const sPaid = Number(paymentForm.servicePaid) || 0;
        const mPaid = Number(paymentForm.medicalPaid) || 0;
        const sFee = Number(paymentModalLead.paymentDetails?.serviceFee) || 9500;
        const mFee = Number(paymentModalLead.paymentDetails?.medicalFee) || 2500;

        // Strict validation rules for advance (service fee)
        if (sPaid > 0) {
          if (!reportSentStatus) {
            Swal.fire({
              icon: 'warning',
              title: 'Medical Report Required',
              text: 'Medical Report PDF must be sent/uploaded to candidate before advance payment can be collected!'
            });
            return;
          }
          if (!paymentForm.afterAdvanceConfirmed || !paymentForm.recordingConfirmed) {
            Swal.fire({
              icon: 'warning',
              title: 'Confirmations Mandatory',
              text: "Both 'After Advance Confirmation' and 'Recording Confirmation' checkboxes must be ticked to save advance payment."
            });
            return;
          }
          if (!paymentForm.recordingUrl || !paymentForm.recordingUrl.trim()) {
            Swal.fire({
              icon: 'warning',
              title: 'Recording URL Required',
              text: 'Call recording audio file/URL is strictly required to save advance payment.'
            });
            return;
          }
        }

        const res = await apiRecordPaymentBooking(paymentModalLead._id, {
          serviceFee: sFee,
          servicePaid: sPaid,
          medicalFee: mFee,
          medicalPaid: mPaid,
          paymentMode: paymentForm.paymentMode,
          receiptNo: paymentForm.receiptNo,
          remarks: paymentForm.remarks,
          afterAdvanceConfirmed: sPaid > 0 ? paymentForm.afterAdvanceConfirmed : undefined,
          recordingConfirmed: sPaid > 0 ? paymentForm.recordingConfirmed : undefined,
          recordingUrl: sPaid > 0 ? paymentForm.recordingUrl.trim() : undefined
        });

        if (res?.success) {
          Swal.fire({
            icon: 'success',
            title: 'Payment Recorded!',
            text: `Payment of ₹${(sPaid + mPaid).toLocaleString()} recorded for ${paymentModalLead.candidateName}.`,
            confirmButtonColor: '#059669',
            timer: 2000
          });
          setPaymentModalLead(null);
          fetchBillingLeads();
        }
      } else {
        // Final Payment
        const amount = Number(paymentForm.amount) || 0;
        const res = await apiRecordFinalPayment(paymentModalLead._id, {
          amount,
          paymentMode: paymentForm.paymentMode,
          receiptNo: paymentForm.receiptNo,
          remarks: paymentForm.remarks
        });

        if (res?.success) {
          Swal.fire({
            icon: 'success',
            title: 'Final Settlement Recorded!',
            text: `Payment of ₹${amount.toLocaleString()} recorded for ${paymentModalLead.candidateName}.`,
            confirmButtonColor: '#059669',
            timer: 2000
          });
          setPaymentModalLead(null);
          fetchBillingLeads();
        }
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Payment Failed', text: err.message || 'Could not record payment.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export Ledger to CSV
  const handleExportLedger = () => {
    if (leads.length === 0) {
      Swal.fire('No Data', 'No billing records to export.', 'info');
      return;
    }

    const headers = ['Candidate Name', 'Passport No', 'Trade', 'Country', 'Service Fee', 'Medical Fee', 'Total Billed', 'Total Paid', 'Balance Due', 'Status', 'Receipt No'];
    const rows = leads.map(l => {
      const p = l.paymentDetails || {};
      const sFee = Number(p.serviceFee) || 9500;
      const mFee = Number(p.medicalFee) || 2500;
      const totalBilled = sFee + mFee;
      const totalPaid = Number(p.totalPaid || p.advancePaid || 0);
      const balance = Math.max(0, totalBilled - totalPaid);
      const status = balance === 0 && totalPaid > 0 ? 'Settled' : totalPaid > 0 ? 'Partially Paid' : 'Open';

      return [
        `"${l.candidateName || ''}"`,
        `"${l.passportNumber || ''}"`,
        `"${l.trade || ''}"`,
        `"${l.country || ''}"`,
        sFee,
        mFee,
        totalBilled,
        totalPaid,
        balance,
        status,
        `"${p.receiptNo || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Chhaya_Billing_Ledger_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic KPI Stats calculated from live MongoDB data
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let settledCount = 0;
    let partialCount = 0;
    let openCount = 0;

    leads.forEach(l => {
      const p = l.paymentDetails || {};
      const sFee = Number(p.serviceFee) || 9500;
      const mFee = Number(p.medicalFee) || 2500;
      const billed = sFee + mFee;
      const paid = Number(p.totalPaid || p.advancePaid || (p.servicePaid || 0) + (p.medicalPaid || 0));
      const bal = Math.max(0, billed - paid);

      totalInvoiced += billed;
      totalPaid += paid;
      totalBalance += bal;

      if (bal === 0 && paid > 0) settledCount++;
      else if (paid > 0) partialCount++;
      else openCount++;
    });

    return { totalInvoiced, totalPaid, totalBalance, settledCount, partialCount, openCount };
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const p = l.paymentDetails || {};
      const sFee = Number(p.serviceFee) || 9500;
      const mFee = Number(p.medicalFee) || 2500;
      const totalBilled = sFee + mFee;
      const totalPaid = Number(p.totalPaid || p.advancePaid || (p.servicePaid || 0) + (p.medicalPaid || 0));
      const balance = Math.max(0, totalBilled - totalPaid);
      const status = balance === 0 && totalPaid > 0 ? 'Settled' : totalPaid > 0 ? 'Partially Paid' : 'Open';

      if (statusFilter !== 'ALL' && status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const phone = (l.phone || '').toLowerCase();
        const trade = (l.trade || '').toLowerCase();
        const receipt = (p.receiptNo || '').toLowerCase();

        if (!name.includes(q) && !passport.includes(q) && !phone.includes(q) && !trade.includes(q) && !receipt.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [leads, searchTerm, statusFilter]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">06. Bill Book & Accounts</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">All Bills & Invoices</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Bill Book & Invoices Registry
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportLedger}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Download CSV Ledger"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export Ledger</span>
          </button>

          <button
            onClick={() => navigate('/billing/advance')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Banknote className="w-3.5 h-3.5 text-purple-600" />
            <span>Advance Desk</span>
          </button>

          <button
            onClick={() => navigate('/billing/final')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Final Settlement</span>
          </button>

          <button
            onClick={fetchBillingLeads}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
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
        
        {/* Total Invoiced */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700">Total Billed</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${metrics.totalInvoiced.toLocaleString()}`}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Across all accounts</div>
          </div>
        </div>

        {/* Payments Received */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Collected Funds</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${metrics.totalPaid.toLocaleString()}`}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              {metrics.totalInvoiced > 0 ? `${Math.round((metrics.totalPaid / metrics.totalInvoiced) * 100)}% realization rate` : '0%'}
            </div>
          </div>
        </div>

        {/* Pending Balances */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Pending Balances</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${metrics.totalBalance.toLocaleString()}`}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Due before flight</div>
          </div>
        </div>

        {/* Settled Accounts */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Fully Settled</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-purple-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.settledCount}
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">Candidates cleared</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Bill Books', count: leads.length },
              { key: 'Open', label: 'Open (No Payment)', count: metrics.openCount },
              { key: 'Partially Paid', label: 'Partially Paid', count: metrics.partialCount },
              { key: 'Settled', label: 'Settled', count: metrics.settledCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.key ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/80 text-gray-600'
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
              placeholder="Search candidate, passport, receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Live Billing Table (Connected to MongoDB Atlas) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice / Receipt</th>
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Trade & Country</th>
                <th className="py-3 px-4 font-mono text-right">Service Fee</th>
                <th className="py-3 px-4 font-mono text-right">Medical Fee</th>
                <th className="py-3 px-4 font-mono text-right">Total Billed</th>
                <th className="py-3 px-4 font-mono text-right">Total Paid</th>
                <th className="py-3 px-4 font-mono text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading billing and accounts records...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-gray-400">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>No billing accounts found matching filter.</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const p = lead.paymentDetails || {};
                  const sFee = Number(p.serviceFee) || 9500;
                  const mFee = Number(p.medicalFee) || 2500;
                  const totalBilled = sFee + mFee;
                  const totalPaid = Number(p.totalPaid || p.advancePaid || (p.servicePaid || 0) + (p.medicalPaid || 0));
                  const balance = Math.max(0, totalBilled - totalPaid);
                  const status = balance === 0 && totalPaid > 0 ? 'Settled' : totalPaid > 0 ? 'Partially Paid' : 'Open';
                  const receiptNo = p.receiptNo || `BB-${lead._id.substring(lead._id.length - 4).toUpperCase()}`;

                  return (
                    <tr key={lead._id} className="hover:bg-blue-50/30 transition-colors">
                      
                      {/* Invoice No */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-gray-900">{receiptNo}</div>
                        <div className="text-[11px] text-gray-400">
                          {p.lastPaymentDate ? new Date(p.lastPaymentDate).toLocaleDateString() : 'Pending'}
                        </div>
                      </td>

                      {/* Candidate */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{lead.candidateName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {lead.passportNumber || 'No Passport'} • {lead.phone || 'No Phone'}
                        </div>
                      </td>

                      {/* Trade & Country */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{lead.trade || 'General Worker'}</div>
                        <div className="text-[11px] text-blue-600">{lead.country || 'Gulf Region'}</div>
                      </td>

                      {/* Service Fee */}
                      <td className="py-3 px-4 font-mono text-right text-gray-700">
                        ₹ {sFee.toLocaleString()}
                      </td>

                      {/* Medical Fee */}
                      <td className="py-3 px-4 font-mono text-right text-gray-700">
                        ₹ {mFee.toLocaleString()}
                      </td>

                      {/* Total Billed */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-gray-900">
                        ₹ {totalBilled.toLocaleString()}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-emerald-600">
                        ₹ {totalPaid.toLocaleString()}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-amber-600">
                        ₹ {balance.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {status === 'Settled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Settled
                          </span>
                        ) : status === 'Partially Paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Hourglass className="w-3 h-3 text-amber-600" />
                            Partially Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            Open
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Record Payment Button */}
                          {balance > 0 && (
                            <button
                              onClick={() => {
                                setPaymentModalLead(lead);
                                setPaymentForm({
                                  amount: balance,
                                  paymentType: totalPaid === 0 ? 'ADVANCE' : 'FINAL',
                                  servicePaid: p.servicePaid || Math.min(sFee, balance),
                                  medicalPaid: p.medicalPaid || (balance > sFee ? mFee : 0),
                                  paymentMode: p.paymentMode || 'UPI',
                                  receiptNo: `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
                                  remarks: 'Payment collected via Billing Registry.',
                                  afterAdvanceConfirmed: Boolean(p.afterAdvanceConfirmed),
                                  recordingConfirmed: Boolean(p.recordingConfirmed),
                                  recordingUrl: p.recordingUrl || '',
                                  reportUrl: lead.medicalDetails?.reportUrl || ''
                                });
                                setReportSentStatus(Boolean(lead.medicalDetails?.isReportSent || lead.medicalDetails?.reportUrl));
                              }}
                              className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                              title="Record Payment for candidate"
                            >
                              <Banknote className="w-3 h-3" />
                              <span>Collect</span>
                            </button>
                          )}

                          {/* Official Bill Book Ledger & Verification */}
                          <button
                            onClick={() => setBillBookLead(lead)}
                            className="h-7 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            title="Official Bill Book Ledger & Receipt Verification"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ledger</span>
                          </button>

                          {/* Quick Print Invoice Receipt */}
                          <button
                            type="button"
                            onClick={() => printInvoiceReceipt(lead)}
                            className="h-7 w-7 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="Quick Print Invoice / Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* View Invoice Dossier */}
                          <button
                            type="button"
                            onClick={() => setViewInvoiceLead(lead)}
                            className="h-7 w-7 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="View Invoice & Receipt"
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

      {/* 5. View Invoice Dossier Modal */}
      {viewInvoiceLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">Official Billing & Invoice Statement</h3>
                  <p className="text-[11px] text-gray-500 truncate">{viewInvoiceLead.candidateName} • {viewInvoiceLead.passportNumber || 'No Passport'}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setViewInvoiceLead(null)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer shrink-0 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs flex-1 overflow-y-auto overscroll-contain">
              
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Invoice / Receipt No:</span>
                  <span className="font-bold font-mono text-gray-900 text-xs sm:text-sm">
                    {viewInvoiceLead.paymentDetails?.receiptNo || `REC-FIN-${viewInvoiceLead._id ? viewInvoiceLead._id.substring(viewInvoiceLead._id.length - 4).toUpperCase() : '8428'}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Fee (Recruitment & Processing):</span>
                  <span className="font-bold font-mono text-gray-900">
                    ₹ {(Number(viewInvoiceLead.paymentDetails?.serviceFee) || 9500).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Medical Examination Fee:</span>
                  <span className="font-bold font-mono text-gray-900">
                    ₹ {(Number(viewInvoiceLead.paymentDetails?.medicalFee) || 2500).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800">Total Billed:</span>
                  <span className="font-bold font-mono text-blue-600 text-sm">
                    ₹ {((Number(viewInvoiceLead.paymentDetails?.serviceFee) || 9500) + (Number(viewInvoiceLead.paymentDetails?.medicalFee) || 2500)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-emerald-700">Total Amount Paid:</span>
                  <span className="font-bold font-mono text-emerald-600 text-sm">
                    ₹ {(Number(viewInvoiceLead.paymentDetails?.totalPaid || viewInvoiceLead.paymentDetails?.advancePaid || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-amber-700">Outstanding Balance:</span>
                  <span className="font-bold font-mono text-amber-600 text-sm">
                    ₹ {Math.max(0, ((Number(viewInvoiceLead.paymentDetails?.serviceFee) || 9500) + (Number(viewInvoiceLead.paymentDetails?.medicalFee) || 2500)) - (Number(viewInvoiceLead.paymentDetails?.totalPaid || viewInvoiceLead.paymentDetails?.advancePaid || 0))).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500">Payment Mode & Date:</span>
                  <span className="text-gray-800 font-medium">
                    {viewInvoiceLead.paymentDetails?.paymentMode || 'NetBanking'} • {viewInvoiceLead.paymentDetails?.lastPaymentDate ? new Date(viewInvoiceLead.paymentDetails.lastPaymentDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

            </div>

            {/* Sticky Actions Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => printInvoiceReceipt(viewInvoiceLead)}
                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                title="Print official receipt via browser print preview"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => generateInvoicePdf(viewInvoiceLead, { download: true })}
                className="h-9 px-3.5 border border-gray-200 hover:bg-gray-100 active:scale-95 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer transition bg-white"
                title="Download official PDF invoice file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setViewInvoiceLead(null)}
                className="h-9 px-4 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. Record Payment Modal */}
      {paymentModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Record Payment Collection</h3>
                <p className="text-[11px] text-gray-500">{paymentModalLead.candidateName} • {paymentModalLead.passportNumber || 'No Passport'}</p>
              </div>
              <button onClick={() => setPaymentModalLead(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Payment Collection Stage *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentType: 'ADVANCE' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentForm.paymentType === 'ADVANCE'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    Advance Booking (Medical)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentType: 'FINAL' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentForm.paymentType === 'FINAL'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    Final Balance Settlement
                  </button>
                </div>
              </div>

              {paymentForm.paymentType === 'ADVANCE' ? (
                <>
                  {/* Medical Report PDF Delivery Status (Mandatory before advance) */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    reportSentStatus 
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900' 
                      : 'border-amber-300 bg-amber-50/90 text-amber-900'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {reportSentStatus ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>{reportSentStatus ? 'Medical Report PDF Delivered' : 'Medical Report PDF Required'}</span>
                            <span className={`text-[9.5px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                              reportSentStatus ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                            }`}>
                              {reportSentStatus ? 'Unlocked' : 'Locked'}
                            </span>
                          </div>
                          <p className="text-[11px] mt-0.5 text-gray-600 leading-snug">
                            {reportSentStatus 
                              ? 'Candidate has received the official Medical Report PDF. Advance service fee can be collected.' 
                              : 'Medical Report PDF must be sent to candidate before service fee advance can be saved.'}
                          </p>
                        </div>
                      </div>

                      {reportSentStatus && paymentForm.reportUrl && (
                        <a
                          href={paymentForm.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 text-[10.5px] font-bold bg-white border border-emerald-300 text-emerald-700 rounded-md hover:bg-emerald-50 inline-flex items-center gap-1 shrink-0"
                        >
                          <span>PDF</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    {/* Send / Update Action */}
                    <div className="mt-2 pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="url"
                        placeholder="Report PDF URL or Google Drive link..."
                        value={paymentForm.reportUrl}
                        onChange={(e) => setPaymentForm({ ...paymentForm, reportUrl: e.target.value })}
                        className="w-full sm:flex-1 px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                        <button
                          type="button"
                          onClick={handleShareReportViaWhatsApp}
                          className="flex-1 sm:flex-none px-2.5 py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-2xs transition-all cursor-pointer"
                          title="Share report PDF and verdict on candidate's WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Share on WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSendReportInInvoiceModal}
                          disabled={sendingReport}
                          className={`flex-1 sm:flex-none px-2.5 py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            reportSentStatus 
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                          }`}
                        >
                          {sendingReport ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileCheck2 className="w-3 h-3" />}
                          <span>{reportSentStatus ? 'Update PDF' : 'Mark Report Sent'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Service Fee Paid (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 5000"
                        value={paymentForm.servicePaid}
                        onChange={(e) => setPaymentForm({ ...paymentForm, servicePaid: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Medical Fee Paid (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 2500"
                        value={paymentForm.medicalPaid}
                        onChange={(e) => setPaymentForm({ ...paymentForm, medicalPaid: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Strict Confirmations when servicePaid > 0 */}
                  {Number(paymentForm.servicePaid) > 0 && (
                    <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          Advance Verification Protocol (Mandatory)
                        </span>
                        <span className="text-[9.5px] font-bold bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded-full">
                          Required
                        </span>
                      </div>

                      {/* Checkbox 1: After Advance Confirmation */}
                      <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-purple-100 hover:border-purple-300 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentForm.afterAdvanceConfirmed}
                          onChange={(e) => setPaymentForm({ ...paymentForm, afterAdvanceConfirmed: e.target.checked })}
                          className="mt-0.5 h-3.5 w-3.5 rounded text-purple-600 border-gray-300 focus:ring-purple-500 cursor-pointer"
                        />
                        <div className="text-xs text-gray-700 leading-snug">
                          <span className="font-bold text-gray-900">After Advance Confirmation *</span>
                          <p className="text-[10.5px] text-gray-500 mt-0.5">
                            Candidate has received medical report, agreed to service terms, and confirmed advance payment.
                          </p>
                        </div>
                      </label>

                      {/* Checkbox 2: Recording Confirmation */}
                      <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-purple-100 hover:border-purple-300 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentForm.recordingConfirmed}
                          onChange={(e) => setPaymentForm({ ...paymentForm, recordingConfirmed: e.target.checked })}
                          className="mt-0.5 h-3.5 w-3.5 rounded text-purple-600 border-gray-300 focus:ring-purple-500 cursor-pointer"
                        />
                        <div className="text-xs text-gray-700 leading-snug">
                          <span className="font-bold text-gray-900">Recording Confirmation *</span>
                          <p className="text-[10.5px] text-gray-500 mt-0.5">
                            Audio call recording confirming agreement to advance payment terms is completed and archived.
                          </p>
                        </div>
                      </label>

                      {/* Recording URL */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                            <span>Call Recording Audio URL / Drive Link *</span>
                          </span>
                          {paymentForm.recordingUrl?.trim() && (
                            <a
                              href={paymentForm.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-purple-600 hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>Test Link</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </label>
                        <input
                          type="url"
                          required={Number(paymentForm.servicePaid) > 0}
                          placeholder="https://drive.google.com/... or cloud audio URL"
                          value={paymentForm.recordingUrl}
                          onChange={(e) => setPaymentForm({ ...paymentForm, recordingUrl: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                        />
                        {!paymentForm.recordingUrl?.trim() && (
                          <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">
                            * Recording link is required to book service advance.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Final Balance Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 7000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Receipt / UTR No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RCP-89212"
                    value={paymentForm.receiptNo}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receiptNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional payment details or accountant remarks..."
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalLead(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoadingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Payment</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. Official Bill Book & Financial Ledger Modal */}
      <BillBookModal
        isOpen={Boolean(billBookLead)}
        onClose={() => setBillBookLead(null)}
        lead={billBookLead}
        onUpdated={fetchBillingLeads}
      />

    </div>
  );
}
