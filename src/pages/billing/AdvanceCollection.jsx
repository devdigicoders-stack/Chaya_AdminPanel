import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Banknote, Receipt, CheckCircle2, Search, 
  RefreshCw, Loader2, DollarSign, AlertCircle, 
  CreditCard, Eye, Printer, X, Check, ShieldCheck,
  AlertTriangle, ExternalLink, Volume2, FileCheck2, MessageCircle, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiRecordPaymentBooking, apiSendMedicalReportPdf } from '../../utils/api';
import { generateInvoicePdf, printInvoiceReceipt } from '../../utils/invoicePdfGenerator';

export default function AdvanceCollection() {
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
    servicePaid: '5000',
    medicalPaid: '2500',
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

  // Fetch candidates from MongoDB Atlas
  const fetchAdvanceQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetLeads({ stage: 'ALL' });
      if (res?.success && res.data) {
        // Candidates who are at Medical, Accounts Collection, Staff Head Handling or have advance paid
        const queue = res.data.filter(l => 
          ['MEDICAL_PROCESS', 'ACCOUNTS_COLLECTION', 'STAFF_HEAD_HANDLING'].includes(l.currentStage) ||
          (l.paymentDetails?.advancePaid && l.paymentDetails.advancePaid > 0) ||
          (l.paymentDetails?.servicePaid && l.paymentDetails.servicePaid > 0)
        );
        setCandidates(queue);
      }
    } catch (err) {
      console.error('Failed to load advance candidates', err);
      setError(err.message || 'Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvanceQueue();
  }, []);

  // Send Medical Report PDF in modal
  const handleSendReportInAdvanceModal = async () => {
    if (!payModal) return;
    setSendingReport(true);
    try {
      const res = await apiSendMedicalReportPdf(payModal._id, { reportUrl: formValues.reportUrl });
      if (res?.success) {
        setReportSentStatus(true);
        Swal.fire({
          icon: 'success',
          title: 'Report Sent!',
          text: `Medical Report PDF marked as sent for ${payModal.candidateName}. Advance payment collection unlocked.`,
          timer: 2000
        });
        fetchAdvanceQueue();
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
    if (!payModal) return;
    const phone = payModal.phone || payModal.applicationForm?.phone || '';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;

    if (!digits) {
      Swal.fire({ icon: 'warning', title: 'Phone Missing', text: 'Candidate phone number is not available for WhatsApp.' });
      return;
    }

    const cName = payModal.candidateName || 'Candidate';
    const passport = payModal.passportNumber || 'N/A';
    const slip = payModal.medicalDetails?.slipNo || 'GCC-GAMCA';
    const pdfUrl = (formValues.reportUrl || '').trim() || payModal.medicalDetails?.reportUrl || '';

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
      await handleSendReportInAdvanceModal();
    }
  };

  // Save Advance Payment
  const handleCollectAdvance = async (e) => {
    e.preventDefault();
    if (!payModal) return;

    const sPaid = Number(formValues.servicePaid) || 0;
    const mPaid = Number(formValues.medicalPaid) || 0;
    const sFee = Number(payModal.paymentDetails?.serviceFee) || 9500;
    const mFee = Number(payModal.paymentDetails?.medicalFee) || 2500;

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
      if (!formValues.afterAdvanceConfirmed || !formValues.recordingConfirmed) {
        Swal.fire({
          icon: 'warning',
          title: 'Confirmations Mandatory',
          text: "Both 'After Advance Confirmation' and 'Recording Confirmation' checkboxes must be ticked to save advance payment."
        });
        return;
      }
      if (!formValues.recordingUrl || !formValues.recordingUrl.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Recording URL Required',
          text: 'Call recording audio file/URL is strictly required to save advance payment.'
        });
        return;
      }
    }

    setActionLoadingId(payModal._id);
    try {
      const res = await apiRecordPaymentBooking(payModal._id, {
        serviceFee: sFee,
        servicePaid: sPaid,
        medicalFee: mFee,
        medicalPaid: mPaid,
        paymentMode: formValues.paymentMode,
        receiptNo: formValues.receiptNo || `ADV-${Math.floor(10000 + Math.random() * 90000)}`,
        remarks: formValues.remarks || 'Advance payment collected.',
        afterAdvanceConfirmed: sPaid > 0 ? formValues.afterAdvanceConfirmed : undefined,
        recordingConfirmed: sPaid > 0 ? formValues.recordingConfirmed : undefined,
        recordingUrl: sPaid > 0 ? formValues.recordingUrl.trim() : undefined
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Advance Recorded!',
          text: `Advance payment of ₹${(sPaid + mPaid).toLocaleString()} recorded for ${payModal.candidateName}. File is now ready for Staff Head verification.`,
          confirmButtonColor: '#7c3aed',
          timer: 2500
        });
        setPayModal(null);
        fetchAdvanceQueue();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Payment Failed', text: err.message || 'Could not record advance payment.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Dynamic KPI Stats
  const metrics = useMemo(() => {
    let totalQueue = candidates.length;
    let totalCollected = 0;
    let paidCount = 0;
    let pendingCount = 0;

    candidates.forEach(c => {
      const p = c.paymentDetails || {};
      const paid = Number(p.advancePaid || p.totalPaid || (p.servicePaid || 0) + (p.medicalPaid || 0));
      totalCollected += paid;
      if (paid > 0) {
        paidCount++;
      } else {
        pendingCount++;
      }
    });

    return { totalQueue, totalCollected, paidCount, pendingCount };
  }, [candidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const p = c.paymentDetails || {};
      const paid = Number(p.advancePaid || p.totalPaid || (p.servicePaid || 0) + (p.medicalPaid || 0));
      const isPaid = paid > 0;

      if (filterTab === 'PENDING' && isPaid) return false;
      if (filterTab === 'PAID' && !isPaid) return false;

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
            <span className="text-gray-900 font-medium">Advance Collection</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Advance Amount Collection Desk
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
            onClick={() => navigate('/billing/final')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Final Settlement</span>
          </button>

          <button
            onClick={fetchAdvanceQueue}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
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
        
        {/* Candidates in Queue */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Advance Queue</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.totalQueue}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Medical & Booking stage</div>
          </div>
        </div>

        {/* Total Advance Funds Collected */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Advance Collected</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${metrics.totalCollected.toLocaleString()}`}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Booking escrow funds</div>
          </div>
        </div>

        {/* Pending Advance */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Awaiting Advance</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.pendingCount}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Collection action required</div>
          </div>
        </div>

        {/* Advance Cleared */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700">Advance Cleared</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-blue-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.paidCount}
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">Sent to Staff Head</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Candidates', count: candidates.length },
              { key: 'PENDING', label: 'Pending Advance', count: metrics.pendingCount },
              { key: 'PAID', label: 'Advance Paid', count: metrics.paidCount },
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
                  filterTab === tab.key ? 'bg-purple-50 text-purple-600' : 'bg-gray-200/80 text-gray-600'
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
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Live Advance Queue Table (Connected to MongoDB Atlas) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Trade & Country</th>
                <th className="py-3 px-4 font-mono text-right">Service Fee</th>
                <th className="py-3 px-4 font-mono text-right">Medical Fee</th>
                <th className="py-3 px-4 font-mono text-right">Total Payable</th>
                <th className="py-3 px-4 font-mono text-right">Advance Paid</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    <span>Loading advance collection queue from database...</span>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Banknote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>No candidates found in advance collection queue.</span>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const p = candidate.paymentDetails || {};
                  const sFee = Number(p.serviceFee) || 9500;
                  const mFee = Number(p.medicalFee) || 2500;
                  const totalPayable = sFee + mFee;
                  const advancePaid = Number(p.advancePaid || p.totalPaid || (p.servicePaid || 0) + (p.medicalPaid || 0));
                  const isPaid = advancePaid > 0;

                  return (
                    <tr key={candidate._id} className="hover:bg-purple-50/30 transition-colors">
                      
                      {/* Candidate */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{candidate.candidateName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {candidate.passportNumber || 'No Passport'} • {candidate.phone || 'No Phone'}
                        </div>
                      </td>

                      {/* Trade & Country */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{candidate.trade || 'General Worker'}</div>
                        <div className="text-[11px] text-purple-600">{candidate.country || 'Gulf Destination'}</div>
                      </td>

                      {/* Service Fee */}
                      <td className="py-3 px-4 font-mono text-right text-gray-700">
                        ₹ {sFee.toLocaleString()}
                      </td>

                      {/* Medical Fee */}
                      <td className="py-3 px-4 font-mono text-right text-gray-700">
                        ₹ {mFee.toLocaleString()}
                      </td>

                      {/* Total Payable */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-gray-900">
                        ₹ {totalPayable.toLocaleString()}
                      </td>

                      {/* Advance Paid */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-emerald-600">
                        {isPaid ? `₹ ${advancePaid.toLocaleString()}` : '₹ 0'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Paid ₹{advancePaid.toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Advance
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Collect Advance Button */}
                          <button
                            onClick={() => {
                              setPayModal(candidate);
                              setFormValues({
                                servicePaid: p.servicePaid || '5000',
                                medicalPaid: p.medicalPaid || (mFee ? String(mFee) : '2500'),
                                paymentMode: p.paymentMode || 'UPI',
                                receiptNo: p.receiptNo || `ADV-${Math.floor(10000 + Math.random() * 90000)}`,
                                remarks: 'Advance collected for Medical & Service Fee booking.',
                                afterAdvanceConfirmed: Boolean(p.afterAdvanceConfirmed),
                                recordingConfirmed: Boolean(p.recordingConfirmed),
                                recordingUrl: p.recordingUrl || '',
                                reportUrl: candidate.medicalDetails?.reportUrl || ''
                              });
                              setReportSentStatus(Boolean(candidate.medicalDetails?.isReportSent || candidate.medicalDetails?.reportUrl));
                            }}
                            className="h-7 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                          >
                            <Banknote className="w-3 h-3" />
                            <span>{isPaid ? 'Update' : 'Collect'}</span>
                          </button>

                          {/* View Receipt */}
                          {isPaid && (
                            <button
                              onClick={() => setViewReceiptModal(candidate)}
                              className="h-7 w-7 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              title="View Advance Receipt"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                          )}

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

      {/* 5. Collect Advance Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/70 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Collect Advance Booking Fee</h3>
                <p className="text-[11px] text-gray-500">{payModal.candidateName} • {payModal.passportNumber || 'No Passport'}</p>
              </div>
              <button onClick={() => setPayModal(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCollectAdvance} className="p-5 space-y-4 overflow-y-auto">
              
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500 block">Total Management Fee:</span>
                  <span className="font-bold text-gray-900 font-mono text-sm">
                    ₹ {((Number(payModal.paymentDetails?.serviceFee) || 9500) + (Number(payModal.paymentDetails?.medicalFee) || 2500)).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block">Candidate Trade:</span>
                  <span className="font-bold text-purple-700">{payModal.trade || 'General Worker'}</span>
                </div>
              </div>

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

                  {reportSentStatus && formValues.reportUrl && (
                    <a
                      href={formValues.reportUrl}
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
                    value={formValues.reportUrl}
                    onChange={(e) => setFormValues({ ...formValues, reportUrl: e.target.value })}
                    className="w-full sm:flex-1 px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
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
                      onClick={handleSendReportInAdvanceModal}
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
                    value={formValues.servicePaid}
                    onChange={(e) => setFormValues({ ...formValues, servicePaid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-purple-500"
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
                    value={formValues.medicalPaid}
                    onChange={(e) => setFormValues({ ...formValues, medicalPaid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Strict Confirmations when servicePaid > 0 */}
              {Number(formValues.servicePaid) > 0 && (
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
                      checked={formValues.afterAdvanceConfirmed}
                      onChange={(e) => setFormValues({ ...formValues, afterAdvanceConfirmed: e.target.checked })}
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
                      checked={formValues.recordingConfirmed}
                      onChange={(e) => setFormValues({ ...formValues, recordingConfirmed: e.target.checked })}
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
                      {formValues.recordingUrl?.trim() && (
                        <a
                          href={formValues.recordingUrl}
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
                      required={Number(formValues.servicePaid) > 0}
                      placeholder="https://drive.google.com/... or cloud audio URL"
                      value={formValues.recordingUrl}
                      onChange={(e) => setFormValues({ ...formValues, recordingUrl: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                    {!formValues.recordingUrl?.trim() && (
                      <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">
                        * Recording link is required to book service advance.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Payment Mode *
                  </label>
                  <select
                    value={formValues.paymentMode}
                    onChange={(e) => setFormValues({ ...formValues, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Receipt / Slip No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADV-99212"
                    value={formValues.receiptNo}
                    onChange={(e) => setFormValues({ ...formValues, receiptNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on advance received..."
                  value={formValues.remarks}
                  onChange={(e) => setFormValues({ ...formValues, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
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
                  className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoadingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Advance</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. View Receipt Modal */}
      {viewReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Official Advance Payment Receipt</h3>
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
                  <span className="text-gray-500">Receipt Voucher:</span>
                  <span className="font-bold font-mono text-gray-900">
                    {viewReceiptModal.paymentDetails?.receiptNo || 'ADV-OFFICIAL'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service Fee Advance:</span>
                  <span className="font-bold font-mono text-gray-900">
                    ₹ {(Number(viewReceiptModal.paymentDetails?.servicePaid) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Medical Fee Advance:</span>
                  <span className="font-bold font-mono text-gray-900">
                    ₹ {(Number(viewReceiptModal.paymentDetails?.medicalPaid) || 0).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-emerald-700">Total Advance Paid:</span>
                  <span className="font-bold font-mono text-emerald-600 text-sm">
                    ₹ {(Number(viewReceiptModal.paymentDetails?.advancePaid || viewReceiptModal.paymentDetails?.totalPaid || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Mode:</span>
                  <span className="text-gray-800 font-medium">
                    {viewReceiptModal.paymentDetails?.paymentMode || 'UPI'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recorded Date:</span>
                  <span className="text-gray-800 font-medium">
                    {viewReceiptModal.paymentDetails?.lastPaymentDate ? new Date(viewReceiptModal.paymentDetails.lastPaymentDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => printInvoiceReceipt(viewReceiptModal)}
                  className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Print official advance voucher"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => generateInvoicePdf(viewReceiptModal, { download: true })}
                  className="h-9 px-3.5 border border-gray-200 hover:bg-gray-100 active:scale-95 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer transition bg-white"
                  title="Download official PDF advance voucher"
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
