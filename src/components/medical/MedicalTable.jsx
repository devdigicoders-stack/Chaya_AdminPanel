import React, { useState } from 'react';
import { 
  Search, ChevronDown, Calendar as CalendarIcon, CheckCircle2, XCircle, 
  Clock, Eye, Edit3, ArrowRight, MapPin, FileCheck2, Filter, RotateCcw, 
  AlertTriangle, ShieldCheck, CreditCard, Receipt, Sparkles, X, User, Phone,
  FileText, History, Check, Calendar, Loader2, ArrowLeftRight, ExternalLink,
  Volume2, ShieldAlert, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  apiSubmitMedicalResult, 
  apiRecordPaymentBooking, 
  apiScheduleMedical,
  apiGetLeadHistory,
  apiSendMedicalReportPdf
} from '../../utils/api';
import BillBookModal from '../billing/BillBookModal';
import ConfirmationsModal from '../leads/ConfirmationsModal';
import TransferModal from '../leads/TransferModal';

const APPROVED_CENTERS = [
  'GAMCA Medical Center, Mumbai',
  'Gulf Diagnostics, Delhi',
  'GCC Health Care, Lucknow',
  'Al-Khaleej Diagnostic, Patna',
  'Apex Diagnostic Center, Hyderabad',
  'Bengal Diagnostic Center, Kolkata'
];

export default function MedicalTable({ leads = [], loading = false, onRefresh }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [centerFilter, setCenterFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Modals & Drawers
  const [viewReportModal, setViewReportModal] = useState(null);
  const [updateStatusModal, setUpdateStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState('FIT');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [reportSlipNo, setReportSlipNo] = useState('');
  const [reportCenter, setReportCenter] = useState('');
  
  // Payment Booking Modal
  const [paymentModal, setPaymentModal] = useState(null);
  const [serviceFeeInput, setServiceFeeInput] = useState('9500');
  const [servicePaidInput, setServicePaidInput] = useState('0');
  const [medicalFeeInput, setMedicalFeeInput] = useState('2500');
  const [medicalPaidInput, setMedicalPaidInput] = useState('0');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [afterAdvanceConfirmed, setAfterAdvanceConfirmed] = useState(false);
  const [recordingConfirmed, setRecordingConfirmed] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [reportSentStatus, setReportSentStatus] = useState(false);
  const [reportUrlInput, setReportUrlInput] = useState('');
  const [sendingReport, setSendingReport] = useState(false);

  // Schedule Center Modal
  const [scheduleModal, setScheduleModal] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [scheduleSlip, setScheduleSlip] = useState('');
  const [scheduleFee, setScheduleFee] = useState(2500);

  // Modals for Bill Book, Confirmations, Transfer
  const [billBookLead, setBillBookLead] = useState(null);
  const [confirmationsLead, setConfirmationsLead] = useState(null);
  const [transferLead, setTransferLead] = useState(null);

  // Candidate Audit Drawer
  const [drawerLead, setDrawerLead] = useState(null);
  const [leadHistory, setLeadHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 5000);
  };

  // Open History Drawer
  const handleOpenDrawer = async (lead) => {
    setDrawerLead(lead);
    setHistoryLoading(true);
    try {
      const res = await apiGetLeadHistory(lead._id);
      if (res?.success) {
        setLeadHistory(res.data || []);
      }
    } catch {
      setLeadHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open Update Result Modal
  const handleOpenUpdateStatus = (lead) => {
    setUpdateStatusModal(lead);
    setNewStatus(lead.medicalDetails?.status === 'FIT' ? 'FIT' : 'FIT');
    setReportCenter(lead.medicalDetails?.center || APPROVED_CENTERS[0]);
    setReportSlipNo(lead.medicalDetails?.slipNo || `GCC-${Math.floor(10000 + Math.random() * 90000)}`);
    setStatusRemarks(lead.medicalDetails?.remarks || '');
  };

  // Submit Result (FIT vs UNFIT)
  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!updateStatusModal) return;

    setActionLoading(true);
    try {
      const res = await apiSubmitMedicalResult(updateStatusModal._id, {
        status: newStatus,
        center: reportCenter,
        slipNo: reportSlipNo,
        validity: newStatus === 'FIT' ? '12 Months' : 'None',
        remarks: statusRemarks
      });

      if (res?.success) {
        if (newStatus === 'FIT') {
          showToast(`Candidate ${updateStatusModal.candidateName} declared GAMCA FIT! Forwarded to Staff Head Desk (Step 12) & Bill Book unlocked.`);
        } else {
          showToast(`Candidate ${updateStatusModal.candidateName} marked GAMCA UNFIT. Quarantined to Rejection Log per GCC safety standard.`);
        }
        setUpdateStatusModal(null);
        if (onRefresh) onRefresh();
      } else {
        alert(res?.message || 'Failed to update medical fitness status');
      }
    } catch (err) {
      alert(err.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Payment Booking Modal
  const handleOpenPaymentBooking = (lead) => {
    setPaymentModal(lead);
    setServiceFeeInput(lead.paymentDetails?.serviceFee || 9500);
    setServicePaidInput(lead.paymentDetails?.servicePaid || 0);
    setMedicalFeeInput(lead.medicalDetails?.medicalFee || lead.paymentDetails?.medicalFee || 2500);
    setMedicalPaidInput(lead.paymentDetails?.medicalPaid || 0);
    setPaymentMode(lead.paymentDetails?.paymentMode || 'UPI');
    setPaymentRef(lead.paymentDetails?.receiptNo || `REC-${Math.floor(10000 + Math.random() * 90000)}`);
    setPaymentRemarks('');
    setAfterAdvanceConfirmed(Boolean(lead.paymentDetails?.afterAdvanceConfirmed));
    setRecordingConfirmed(Boolean(lead.paymentDetails?.recordingConfirmed));
    setRecordingUrl(lead.paymentDetails?.recordingUrl || '');
    setReportSentStatus(Boolean(lead.medicalDetails?.isReportSent || lead.medicalDetails?.reportUrl));
    setReportUrlInput(lead.medicalDetails?.reportUrl || '');
  };

  // Send Medical Report PDF directly from modal
  const handleSendReportInModal = async () => {
    if (!paymentModal) return;
    setSendingReport(true);
    try {
      const res = await apiSendMedicalReportPdf(paymentModal._id, { reportUrl: reportUrlInput });
      if (res?.success) {
        setReportSentStatus(true);
        showToast(`Medical Report PDF sent to ${paymentModal.candidateName}! Advance fee collection is now unlocked.`);
        if (onRefresh) onRefresh();
      } else {
        alert(res?.message || 'Failed to send medical report');
      }
    } catch (err) {
      alert(err.message || 'Error sending medical report');
    } finally {
      setSendingReport(false);
    }
  };

  // Share Report & Verdict directly via WhatsApp
  const handleShareReportViaWhatsApp = async () => {
    if (!paymentModal) return;
    const phone = paymentModal.phone || paymentModal.applicationForm?.phone || '';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;

    if (!digits) {
      alert('Candidate phone number is not available for WhatsApp');
      return;
    }

    const cName = paymentModal.candidateName || 'Candidate';
    const passport = paymentModal.passportNumber || 'N/A';
    const slip = paymentModal.medicalDetails?.slipNo || reportSlipNo || 'GCC-GAMCA';
    const pdfUrl = reportUrlInput.trim() || paymentModal.medicalDetails?.reportUrl || '';

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
      await handleSendReportInModal();
    }
  };

  // Direct share for any lead (e.g. from drawer)
  const handleShareLeadViaWhatsApp = (lead) => {
    if (!lead) return;
    const phone = lead.phone || lead.applicationForm?.phone || '';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;

    if (!digits) {
      alert('Candidate phone number is not available for WhatsApp');
      return;
    }

    const cName = lead.candidateName || 'Candidate';
    const passport = lead.passportNumber || 'N/A';
    const slip = lead.medicalDetails?.slipNo || 'GCC-GAMCA';
    const pdfUrl = lead.medicalDetails?.reportUrl || '';

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

  // Submit Payment Booking
  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!paymentModal) return;

    const sf = Number(serviceFeeInput) || 0;
    const sp = Number(servicePaidInput) || 0;
    const mf = Number(medicalFeeInput) || 0;
    const mp = Number(medicalPaidInput) || 0;

    if (sf < 0 || sp < 0 || mf < 0 || mp < 0) {
      alert('Fee and paid amounts cannot be negative.');
      return;
    }
    if (sp > sf) {
      alert('Paid service amount cannot exceed the total service fee.');
      return;
    }
    if (mp > mf) {
      alert('Paid medical amount cannot exceed the total medical fee.');
      return;
    }

    // Strict Rule: If service fee (advance) is being collected, report must be sent and confirmations mandatory
    if (sp > 0) {
      if (!reportSentStatus) {
        alert('Medical Report PDF must be sent/uploaded to candidate before advance payment can be collected!');
        return;
      }
      if (!afterAdvanceConfirmed || !recordingConfirmed) {
        alert("Both 'After Advance Confirmation' and 'Recording Confirmation' checkboxes must be ticked to save advance payment.");
        return;
      }
      if (!recordingUrl || !recordingUrl.trim()) {
        alert('Call recording audio file/URL is strictly required to save advance payment.');
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await apiRecordPaymentBooking(paymentModal._id, {
        serviceFee: sf,
        servicePaid: sp,
        medicalFee: mf,
        medicalPaid: mp,
        paymentMode,
        receiptNo: paymentRef,
        remarks: paymentRemarks,
        afterAdvanceConfirmed: sp > 0 ? afterAdvanceConfirmed : undefined,
        recordingConfirmed: sp > 0 ? recordingConfirmed : undefined,
        recordingUrl: sp > 0 ? recordingUrl.trim() : undefined
      });

      if (res?.success) {
        showToast(`Payment booked for ${paymentModal.candidateName}! Service Fee (₹${servicePaidInput}/₹${serviceFeeInput}), Medical Fee (₹${medicalPaidInput}/₹${medicalFeeInput}). Receipt #${paymentRef}`);
        setPaymentModal(null);
        if (onRefresh) onRefresh();
      } else {
        alert(res?.message || 'Failed to record payment');
      }
    } catch (err) {
      alert(err.message || 'Error recording payment');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Schedule Modal
  const handleOpenSchedule = (lead) => {
    setScheduleModal(lead);
    setSelectedCenter(lead.medicalDetails?.center || APPROVED_CENTERS[0]);
    setSelectedDate(lead.medicalDetails?.appointmentDate ? new Date(lead.medicalDetails.appointmentDate).toISOString().split('T')[0] : '');
    setScheduleSlip(lead.medicalDetails?.slipNo || `GCC-${Math.floor(10000 + Math.random() * 90000)}`);
    setScheduleFee(lead.medicalDetails?.medicalFee || 2500);
  };

  // Submit Schedule Modal
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleModal) return;

    setActionLoading(true);
    try {
      const res = await apiScheduleMedical(scheduleModal._id, {
        center: selectedCenter,
        appointmentDate: selectedDate,
        slipNo: scheduleSlip,
        medicalFee: Number(scheduleFee)
      });

      if (res?.success) {
        showToast(`Appointment confirmed for ${scheduleModal.candidateName} at ${selectedCenter} on ${selectedDate} (Slip: ${scheduleSlip})`);
        setScheduleModal(null);
        if (onRefresh) onRefresh();
      } else {
        alert(res?.message || 'Failed to schedule appointment');
      }
    } catch (err) {
      alert(err.message || 'Error scheduling medical');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Logic
  const filteredData = leads.filter((item) => {
    const name = item.candidateName || '';
    const phone = item.phone || '';
    const passport = item.passportNumber || '';
    const leadId = item.leadId || '';
    const trade = item.trade || item.applicationForm?.trade || '';
    const country = item.country || (item.applicationForm?.preferredCountries && item.applicationForm?.preferredCountries[0]) || '';
    const center = item.medicalDetails?.center || '';
    const slipNo = item.medicalDetails?.slipNo || '';

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      passport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leadId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slipNo.toLowerCase().includes(searchQuery.toLowerCase());

    const medStatus = item.medicalDetails?.status || 'PENDING';
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'FIT' && medStatus === 'FIT') ||
      (statusFilter === 'UNFIT' && medStatus === 'UNFIT') ||
      (statusFilter === 'SCHEDULED' && medStatus === 'SCHEDULED') ||
      (statusFilter === 'PENDING' && (medStatus === 'PENDING' || !medStatus));

    const matchesCenter =
      centerFilter === 'ALL' ||
      center.toLowerCase().includes(centerFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesCenter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>GAMCA FIT</span>
          </span>
        );
      case 'UNFIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>GAMCA UNFIT</span>
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap shadow-2xs">
            <CalendarIcon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Scheduled</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Lab Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="m-4 p-3.5 rounded-xl bg-emerald-600 text-white shadow-md flex items-center gap-2.5 text-[13px] font-medium animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Filter & Search Bar */}
      <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white">
        
        {/* Quick Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
          {[
            { key: 'ALL', label: 'All Records', count: leads.length },
            { key: 'FIT', label: 'GAMCA FIT', count: leads.filter((d) => d.medicalDetails?.status === 'FIT').length },
            { key: 'UNFIT', label: 'UNFIT', count: leads.filter((d) => d.medicalDetails?.status === 'UNFIT').length },
            { key: 'SCHEDULED', label: 'Scheduled', count: leads.filter((d) => d.medicalDetails?.status === 'SCHEDULED').length },
            { key: 'PENDING', label: 'Lab Pending', count: leads.filter((d) => d.medicalDetails?.status === 'PENDING' || !d.medicalDetails?.status).length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-gray-200/70 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Center Select & Reset */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Approved Center Filter */}
          <div className="relative">
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="h-9 px-3 py-1 bg-white border border-gray-200 rounded-lg text-[12.5px] text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Centers</option>
              {APPROVED_CENTERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, passport, slip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>

          {(searchQuery || statusFilter !== 'ALL' || centerFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setCenterFilter('ALL');
              }}
              className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-0">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 whitespace-nowrap">Candidate & Passport</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Trade & Destination</th>
              <th className="py-3.5 px-4 whitespace-nowrap">GAMCA Center & Slip</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Exam / Appt Date</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Fitness Status</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Payment Booking</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[13px]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
                  Loading medical records from database...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <ShieldCheck className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                  No medical records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredData.map((row) => {
                const medStatus = row.medicalDetails?.status || 'PENDING';
                const center = row.medicalDetails?.center || 'Not Allocated';
                const slip = row.medicalDetails?.slipNo || 'Awaiting Slip';
                const appDate = row.medicalDetails?.appointmentDate
                  ? new Date(row.medicalDetails.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Needs Date';
                const validity = row.medicalDetails?.validity || (medStatus === 'FIT' ? '12 Months' : 'Pending');
                
                const sFee = row.paymentDetails?.serviceFee || 9500;
                const sPaid = row.paymentDetails?.servicePaid || 0;
                const mFee = row.medicalDetails?.medicalFee || row.paymentDetails?.medicalFee || 2500;
                const mPaid = row.paymentDetails?.medicalPaid || 0;
                const totalPaid = sPaid + mPaid;
                const totalReq = sFee + mFee;

                return (
                  <tr key={row._id} className="hover:bg-blue-50/20 transition-colors">
                    
                    {/* 1. Candidate & Passport */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-[13px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                          {row.candidateName ? row.candidateName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => handleOpenDrawer(row)}
                            className="font-semibold text-gray-900 text-[13.5px] leading-snug whitespace-nowrap hover:text-blue-600 transition-colors cursor-pointer text-left block"
                          >
                            {row.candidateName}
                          </button>
                          <div className="text-[11.5px] text-gray-500 font-mono mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-semibold text-gray-700">{row.passportNumber || 'No Passport'}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-blue-600 font-medium">{row.leadId || row._id.slice(-6)}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Trade & Destination */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 text-[13px] whitespace-nowrap">
                        {row.trade || row.applicationForm?.trade || 'Unassigned Trade'}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[11.5px] text-gray-600 mt-0.5 whitespace-nowrap">
                        <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>{row.country || (row.applicationForm?.preferredCountries && row.applicationForm?.preferredCountries[0]) || 'Gulf'}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                          {row.selectionMode === 'DIRECT_CV' ? 'CV Pass' : 'Interview Pass'}
                        </span>
                      </div>
                    </td>

                    {/* 3. GAMCA Center & Slip */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 text-[13px] whitespace-nowrap">
                        {center}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 mt-1 whitespace-nowrap">
                        <FileCheck2 className="w-3 h-3 text-purple-600 shrink-0" />
                        <span>{slip}</span>
                      </div>
                    </td>

                    {/* 4. Exam Date & Validity */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-gray-700 text-[12.5px] font-medium whitespace-nowrap">
                        <CalendarIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{appDate}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">
                        Validity: <span className="font-medium text-gray-700">{validity}</span>
                      </div>
                    </td>

                    {/* 5. Fitness Status */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(medStatus)}
                    </td>

                    {/* 6. Payment Booking Info (FRD Section 11 & 21) */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <div className="text-[12px] font-bold text-gray-900 font-mono">
                          ₹{totalPaid.toLocaleString()} <span className="text-gray-400 font-normal">/ ₹{totalReq.toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] font-medium text-gray-500 mt-0.5">
                          S: ₹{sPaid} • M: ₹{mPaid}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {row.medicalDetails?.isReportSent || row.medicalDetails?.reportUrl ? (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Medical Report PDF Sent to candidate">
                              Report Sent
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title="Medical Report PDF not sent yet">
                              No Report
                            </span>
                          )}
                          {row.paymentDetails?.recordingUrl && (
                            <a
                              href={row.paymentDetails.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 flex items-center gap-0.5"
                              title="Advance call recording attached"
                            >
                              <span>Rec</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 7. Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                        
                        {/* If not scheduled yet: Quick Schedule */}
                        {(!row.medicalDetails?.center || medStatus === 'PENDING') && (
                          <button
                            onClick={() => handleOpenSchedule(row)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            title="Schedule GAMCA Center & Date"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Schedule</span>
                          </button>
                        )}

                        {/* View Certificate / Report Modal Button */}
                        <button
                          onClick={() => setViewReportModal(row)}
                          className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="View Medical Certificate & Report"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>Report</span>
                        </button>

                        {/* Record Result Button */}
                        <button
                          onClick={() => handleOpenUpdateStatus(row)}
                          className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="Record Fitness Verdict (FIT / UNFIT)"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>Result</span>
                        </button>

                        {/* Payment Booking Button (FRD Section 11 & 21) */}
                        <button
                          onClick={() => handleOpenPaymentBooking(row)}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="Payment Booking: Separate Service Fee & Medical Fee (FRD Section 11)"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>Book Fee</span>
                        </button>

                        {/* Bill Book & Ledger Modal Button */}
                        <button
                          onClick={() => setBillBookLead(row)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="Open Candidate Bill Book & Financial Ledger"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Bill Book</span>
                        </button>

                        {/* Medical Declaration & 8 Confirmations */}
                        <button
                          onClick={() => setConfirmationsLead(row)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="Confirmations: Medical Declaration & Audio/Video Proofs"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Proofs</span>
                        </button>

                        {/* Transfer Handover Button */}
                        <button
                          onClick={() => setTransferLead(row)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="Handover File (Single Holder Protocol)"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Transfer</span>
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

      {/* Pagination / Count Footer */}
      <div className="p-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white mt-auto">
        <div className="text-[12.5px] text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{filteredData.length}</span> of <span className="font-bold text-gray-900">{leads.length}</span> medical files
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

      {/* View Medical Report Modal */}
      {viewReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-[15px]">GAMCA Health Certificate & Lab Report</h3>
              </div>
              <button onClick={() => setViewReportModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>
            
            <div className="p-6 space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
                <div><span className="text-gray-400 text-[11px] uppercase tracking-wider block">Candidate</span> <span className="font-bold text-gray-900">{viewReportModal.candidateName}</span></div>
                <div><span className="text-gray-400 text-[11px] uppercase tracking-wider block">Passport No.</span> <span className="font-mono font-bold text-gray-900">{viewReportModal.passportNumber || 'N/A'}</span></div>
                <div><span className="text-gray-400 text-[11px] uppercase tracking-wider block">GAMCA Slip No</span> <span className="font-mono text-purple-700 font-bold">{viewReportModal.medicalDetails?.slipNo || 'GCC-Central'}</span></div>
                <div><span className="text-gray-400 text-[11px] uppercase tracking-wider block">Medical Center</span> <span className="font-semibold text-gray-900">{viewReportModal.medicalDetails?.center || 'Approved GCC Lab'}</span></div>
              </div>

              <div className="border border-gray-200 p-4 rounded-xl bg-white space-y-3">
                <div className="font-bold text-gray-900 text-[13.5px] border-b border-gray-100 pb-2">GCC Central Diagnostic Lab Tests</div>
                <div className="grid grid-cols-2 gap-2.5 text-[12.5px]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-gray-600">Chest X-Ray (TB):</span>
                    <span className="font-bold text-emerald-600">NORMAL</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-gray-600">HIV 1 & 2 Screen:</span>
                    <span className="font-bold text-emerald-600">NEGATIVE</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-gray-600">Hepatitis B & C:</span>
                    <span className="font-bold text-emerald-600">NEGATIVE</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-gray-600">VDRL / Syphilis:</span>
                    <span className="font-bold text-emerald-600">NEGATIVE</span>
                  </div>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center justify-between text-[12.5px] ${
                viewReportModal.medicalDetails?.status === 'FIT'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : viewReportModal.medicalDetails?.status === 'UNFIT'
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}>
                <div className="flex items-center gap-2">
                  {viewReportModal.medicalDetails?.status === 'FIT' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold">Official Fitness Verdict: {viewReportModal.medicalDetails?.status || 'PENDING'}</div>
                    <div className="text-[11.5px] mt-0.5">
                      {viewReportModal.medicalDetails?.remarks || 'GCC health standards compliant certificate.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setViewReportModal(null)} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-[12.5px] font-medium cursor-pointer hover:bg-gray-900">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Fitness Status Modal (FIT vs UNFIT) */}
      {updateStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-teal-50/70">
              <h3 className="font-bold text-gray-900 text-[15px]">Record GAMCA Medical Fitness</h3>
              <button onClick={() => setUpdateStatusModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-6 space-y-4 text-[13px]">
              <div className="bg-gray-50 p-3 rounded-xl">
                <div className="font-bold text-gray-900">{updateStatusModal.candidateName}</div>
                <div className="text-gray-500 font-mono text-[11.5px] mt-0.5">Passport: {updateStatusModal.passportNumber || 'N/A'} • ID: {updateStatusModal.leadId}</div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Medical Decision Verdict *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewStatus('FIT')}
                    className={`py-3 rounded-xl text-[13px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      newStatus === 'FIT'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                        : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>GAMCA FIT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('UNFIT')}
                    className={`py-3 rounded-xl text-[13px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      newStatus === 'UNFIT'
                        ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-100'
                        : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>GAMCA UNFIT</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-700 mb-1">GAMCA Center</label>
                  <select
                    value={reportCenter}
                    onChange={(e) => setReportCenter(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white"
                  >
                    {APPROVED_CENTERS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-700 mb-1">Slip / Token No.</label>
                  <input
                    type="text"
                    value={reportSlipNo}
                    onChange={(e) => setReportSlipNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-[12px] font-mono"
                  />
                </div>
              </div>

              {newStatus === 'FIT' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[12px] text-emerald-800 leading-relaxed">
                  <strong>PDF Step 12 Rule:</strong> FIT candidate immediately moves forward to Staff Head Desk (Step 12) for Calling Staff assignment & Bill Book advance fee collection.
                </div>
              )}

              {newStatus === 'UNFIT' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-800 leading-relaxed">
                  <strong>Safety Rule:</strong> UNFIT candidate is marked as rejected / hold so company does not incur useless visa fees.
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Doctor Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. All laboratory screening tests normal. Cleared for GCC visa..."
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUpdateStatusModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Result</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Booking Modal (FRD Section 11 & 21) */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xl max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-gray-900 text-[15px]">Payment Booking (FRD Section 11 & 21)</h3>
                  <div className="text-[10.5px] font-semibold text-purple-700">Separate tracking of Service Fee and Medical Fee</div>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setPaymentModal(null)} 
                className="w-8 h-8 rounded-lg hover:bg-purple-100 text-gray-400 hover:text-gray-700 flex items-center justify-center text-xl font-bold cursor-pointer transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="flex-1 overflow-y-auto flex flex-col min-h-0">
              <div className="p-5 sm:p-6 space-y-4 text-[13px] flex-1">
              {/* Candidate Info Header */}
              <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">{paymentModal.candidateName}</div>
                  <div className="text-gray-500 text-[11.5px]">{paymentModal.trade || 'General'} • {paymentModal.country || 'Gulf'}</div>
                </div>
                <div className="text-right font-mono text-[11.5px]">
                  <div className="text-gray-400">Passport: <span className="font-bold text-gray-800">{paymentModal.passportNumber || 'N/A'}</span></div>
                  <div className="text-purple-600 font-semibold">{paymentModal.medicalDetails?.slipNo || 'GCC-Slip'}</div>
                </div>
              </div>

              {/* Medical Report PDF Delivery Card (Required before advance) */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                reportSentStatus 
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900' 
                  : 'border-amber-300 bg-amber-50/90 text-amber-900'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    {reportSentStatus ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-[13px] flex items-center gap-1.5">
                        <span>{reportSentStatus ? 'Medical Report PDF Delivered' : 'Medical Report PDF Required Before Advance'}</span>
                        <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                          reportSentStatus ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                        }`}>
                          {reportSentStatus ? 'Advance Unlocked' : 'Advance Locked'}
                        </span>
                      </div>
                      <p className="text-[11.5px] mt-0.5 text-gray-600 leading-relaxed">
                        {reportSentStatus 
                          ? 'The candidate has been officially sent the Medical Report PDF. Office service fee (advance) is eligible for collection.' 
                          : 'Per operating protocol, candidate must receive their official GAMCA medical fitness PDF before advance money can be collected.'}
                      </p>
                    </div>
                  </div>

                  {reportSentStatus && reportUrlInput && (
                    <a
                      href={reportUrlInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 inline-flex items-center gap-1 shrink-0 shadow-2xs"
                    >
                      <span>View PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Send / Update Report Action */}
                <div className="mt-2.5 pt-2.5 border-t border-amber-200/80 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="url"
                    placeholder="Report PDF URL or Google Drive link..."
                    value={reportUrlInput}
                    onChange={(e) => setReportUrlInput(e.target.value)}
                    className="w-full sm:flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-[12px] font-mono focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleShareReportViaWhatsApp}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-xs transition-all cursor-pointer"
                      title="Share Medical Report PDF and verdict directly to candidate's WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Share via WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSendReportInModal}
                      disabled={sendingReport}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        reportSentStatus 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                      }`}
                    >
                      {sendingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                      <span>{reportSentStatus ? 'Update PDF Link' : 'Mark Report as Sent'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid: 2 Separate Fee Tracking Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Service Fee */}
                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-blue-900 text-[12.5px]">1. Office Service Fee</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Office Charge</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Total Service Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={serviceFeeInput}
                        onChange={(e) => setServiceFeeInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Amount Paid (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={servicePaidInput}
                        onChange={(e) => setServicePaidInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-emerald-700 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="text-[11px] text-gray-500 pt-1 border-t border-blue-100 flex justify-between font-mono">
                      <span>Office Balance:</span>
                      <span className="font-bold text-gray-900">₹{Math.max(0, (parseFloat(serviceFeeInput) || 0) - (parseFloat(servicePaidInput) || 0))}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Medical Fee */}
                <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-teal-900 text-[12.5px]">2. Medical Test Fee</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">Clinic Fee</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Total Medical Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={medicalFeeInput}
                        onChange={(e) => setMedicalFeeInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">Amount Paid (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={medicalPaidInput}
                        onChange={(e) => setMedicalPaidInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold text-emerald-700 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="text-[11px] text-gray-500 pt-1 border-t border-teal-100 flex justify-between font-mono">
                      <span>Medical Balance:</span>
                      <span className="font-bold text-gray-900">₹{Math.max(0, (parseFloat(medicalFeeInput) || 0) - (parseFloat(medicalPaidInput) || 0))}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Strict Confirmations for Advance Payment (Mandatory if servicePaid > 0) */}
              {Number(servicePaidInput) > 0 && (
                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900 text-[12.5px]">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Advance Payment Verification Protocol (Mandatory)</span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                      Backend Enforced
                    </span>
                  </div>

                  {/* Checkbox 1: After Advance Confirmation */}
                  <label className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-purple-100 hover:border-purple-300 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={afterAdvanceConfirmed}
                      onChange={(e) => setAfterAdvanceConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="text-[12px] text-gray-700 leading-snug">
                      <span className="font-bold text-gray-900">After Advance Confirmation *</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Candidate has received medical report, confirmed acceptance of terms, and agreed to advance service payment.
                      </p>
                    </div>
                  </label>

                  {/* Checkbox 2: Recording Confirmation */}
                  <label className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-purple-100 hover:border-purple-300 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordingConfirmed}
                      onChange={(e) => setRecordingConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="text-[12px] text-gray-700 leading-snug">
                      <span className="font-bold text-gray-900">Recording Confirmation *</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Official call recording confirming payment terms and candidate consent has been recorded and verified.
                      </p>
                    </div>
                  </label>

                  {/* Recording URL / Audio File */}
                  <div>
                    <label className="block text-[11.5px] font-bold text-gray-800 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Call Recording Audio URL / Drive Link *</span>
                      </span>
                      {recordingUrl.trim() && (
                        <a
                          href={recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10.5px] text-purple-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Test Link</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </label>
                    <input
                      type="url"
                      required={Number(servicePaidInput) > 0}
                      placeholder="https://drive.google.com/... or cloud audio URL"
                      value={recordingUrl}
                      onChange={(e) => setRecordingUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] font-mono focus:outline-none focus:border-purple-500"
                    />
                    {!recordingUrl.trim() && (
                      <span className="text-[10.5px] text-red-600 font-semibold mt-0.5 block">
                        * Recording link is strictly required to book service advance.
                      </span>
                    )}

                    {/* Quick Access to Confirmations Modal */}
                    <div className="pt-2 mt-2 border-t border-purple-200/80 flex items-center justify-between">
                      <span className="text-[11px] text-purple-700 font-medium">Step 6 / Confirmation PDF Dossier:</span>
                      <button
                        type="button"
                        onClick={() => setConfirmationsLead(paymentModal)}
                        className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        <span>Open Confirmations & PDF Modal</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Mode & Reference */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-700 mb-1">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12.5px] focus:outline-none focus:border-purple-500"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                    <option value="Card">Debit / Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-700 mb-1">Receipt / Ref No. *</label>
                  <input
                    type="text"
                    required
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12.5px] font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Grand Total Summary Box */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-[12.5px]">
                <div>
                  <span className="text-gray-500">Total Collected Now:</span>
                  <span className="font-extrabold text-emerald-700 text-[14px] ml-1.5 font-mono">
                    ₹{(parseFloat(servicePaidInput) || 0) + (parseFloat(medicalPaidInput) || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Remaining Balance:</span>
                  <span className="font-extrabold text-gray-900 text-[14px] ml-1.5 font-mono">
                    ₹{Math.max(0, ((parseFloat(serviceFeeInput) || 0) + (parseFloat(medicalFeeInput) || 0)) - ((parseFloat(servicePaidInput) || 0) + (parseFloat(medicalPaidInput) || 0)))}
                  </span>
                </div>
              </div>
            </div>

              {/* Sticky Footer */}
              <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPaymentModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-100 cursor-pointer font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-purple-600 text-white rounded-lg text-[13px] font-semibold hover:bg-purple-700 shadow-sm cursor-pointer flex items-center gap-1.5 transition active:scale-95"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                  <span>Save Payment Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Center Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70 shrink-0">
              <h3 className="font-bold text-gray-900 text-[15px]">Schedule Approved GAMCA Center</h3>
              <button onClick={() => setScheduleModal(null)} className="w-8 h-8 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-gray-700 flex items-center justify-center text-xl font-bold cursor-pointer transition">×</button>
            </div>

            <form onSubmit={handleSaveSchedule} className="flex-1 overflow-y-auto flex flex-col min-h-0">
              <div className="p-6 space-y-4 text-[13px] flex-1">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="font-bold text-gray-900">{scheduleModal.candidateName}</div>
                  <div className="text-gray-500 font-mono text-[11.5px] mt-0.5">Passport: {scheduleModal.passportNumber || 'N/A'} • ID: {scheduleModal.leadId}</div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Approved Medical Center *</label>
                  <select
                    required
                    value={selectedCenter}
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-blue-500"
                  >
                    {APPROVED_CENTERS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Appointment Date *</label>
                    <input
                      type="date"
                      required
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1">Slip / Token No. *</label>
                    <input
                      type="text"
                      required
                      value={scheduleSlip}
                      onChange={(e) => setScheduleSlip(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Medical Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    value={scheduleFee}
                    onChange={(e) => setScheduleFee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setScheduleModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-100 cursor-pointer font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 shadow-sm cursor-pointer flex items-center gap-1.5 transition active:scale-95"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Audit Drawer */}
      {drawerLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {drawerLead.candidateName ? drawerLead.candidateName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-[16px] leading-snug">{drawerLead.candidateName}</h3>
                  <div className="text-[12px] text-slate-300 font-mono mt-0.5">{drawerLead.leadId} • {drawerLead.phone}</div>
                </div>
              </div>
              <button
                onClick={() => setDrawerLead(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer text-lg"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-[13px]">
              {/* Profile Card */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/70 space-y-3">
                <div className="font-bold text-gray-900 text-[13.5px] border-b border-gray-200 pb-1.5 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Candidate Overview
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-[12.5px]">
                  <div><span className="text-gray-500">Trade:</span> <span className="font-semibold text-gray-900">{drawerLead.trade || 'General'}</span></div>
                  <div><span className="text-gray-500">Destination:</span> <span className="font-semibold text-gray-900">{drawerLead.country || 'Gulf'}</span></div>
                  <div><span className="text-gray-500">Passport:</span> <span className="font-mono font-bold text-gray-900">{drawerLead.passportNumber || 'N/A'}</span></div>
                  <div><span className="text-gray-500">Stage:</span> <span className="font-semibold text-blue-700">{drawerLead.currentStage}</span></div>
                  <div><span className="text-gray-500">Medical Center:</span> <span className="font-semibold text-gray-900">{drawerLead.medicalDetails?.center || 'Not assigned'}</span></div>
                  <div><span className="text-gray-500">Medical Slip:</span> <span className="font-mono font-semibold text-purple-700">{drawerLead.medicalDetails?.slipNo || 'None'}</span></div>
                </div>
              </div>

              {/* Medical Report & Advance Confirmation Audit Card */}
              <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-2xs space-y-3">
                <div className="font-bold text-purple-950 text-[13.5px] border-b border-purple-100 pb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Medical & Advance Verification Audit</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    FRD Sec 11 & 21
                  </span>
                </div>

                {/* Report Sent Status */}
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11.5px] font-semibold text-gray-700 block">Medical Report PDF:</span>
                    <span className="text-[11px] text-gray-500">
                      {drawerLead.medicalDetails?.isReportSent || drawerLead.medicalDetails?.reportUrl
                        ? `Sent to candidate ${drawerLead.medicalDetails?.reportSentAt ? `on ${new Date(drawerLead.medicalDetails.reportSentAt).toLocaleDateString()}` : ''}`
                        : 'Not delivered yet (Advance payment locked)'}
                    </span>
                  </div>
                  <div>
                    {drawerLead.medicalDetails?.isReportSent || drawerLead.medicalDetails?.reportUrl ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>Delivered</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {drawerLead.medicalDetails?.reportUrl && (
                  <div className="text-[11.5px] flex items-center justify-between px-1">
                    <span className="text-gray-500">Report Document:</span>
                    <a
                      href={drawerLead.medicalDetails.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono text-[11px] inline-flex items-center gap-1"
                    >
                      <span>Open Report PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Quick Share on WhatsApp Button */}
                <button
                  type="button"
                  onClick={() => handleShareLeadViaWhatsApp(drawerLead)}
                  className="w-full py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Open candidate's WhatsApp with medical result and report PDF"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share Medical Report on WhatsApp</span>
                </button>

                {/* Step 6 Medical Confirmation Dossier & PDF Modal Button */}
                <button
                  type="button"
                  onClick={() => setConfirmationsLead(drawerLead)}
                  className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Open Official Medical Confirmation Dossier & 8 Mandatory Confirmations"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Step 6: Medical Confirmation & Dossier PDF</span>
                </button>

                {/* Advance Confirmation Badges */}
                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100">
                    <div className="text-gray-500 text-[10.5px]">After Advance Check:</div>
                    <div className="font-bold mt-0.5 flex items-center gap-1">
                      {drawerLead.paymentDetails?.afterAdvanceConfirmed ? (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmed</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Not Logged</span>
                      )}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100">
                    <div className="text-gray-500 text-[10.5px]">Recording Check:</div>
                    <div className="font-bold mt-0.5 flex items-center gap-1">
                      {drawerLead.paymentDetails?.recordingConfirmed ? (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmed</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Not Logged</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call Recording Link */}
                {drawerLead.paymentDetails?.recordingUrl ? (
                  <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-bold text-indigo-950">Call Audio Recording</div>
                        <div className="text-[10.5px] text-indigo-600 font-mono truncate max-w-[200px]">
                          {drawerLead.paymentDetails.recordingUrl}
                        </div>
                      </div>
                    </div>
                    <a
                      href={drawerLead.paymentDetails.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 font-bold text-[11px] inline-flex items-center gap-1 shrink-0 shadow-2xs"
                    >
                      <span>Listen / View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400 italic px-1">
                    No call recording logged for this candidate.
                  </div>
                )}
              </div>

              {/* History Trail */}
              <div>
                <div className="font-bold text-gray-900 text-[14px] mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" />
                  Audit Trail & History
                </div>
                {historyLoading ? (
                  <div className="py-8 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading audit trail...
                  </div>
                ) : leadHistory.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 bg-gray-50 rounded-xl">
                    No history events recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3 border-l-2 border-blue-100 ml-3 pl-4">
                    {leadHistory.map((h, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white" />
                        <div className="text-[11.5px] font-bold text-gray-900">{h.actionType}</div>
                        <div className="text-[12px] text-gray-600 mt-0.5">{h.remarks}</div>
                        <div className="text-[10.5px] text-gray-400 mt-1 flex items-center gap-2">
                          <span>By: {h.performedBy?.name}</span>
                          <span>•</span>
                          <span>{new Date(h.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setDrawerLead(null)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-[12.5px] font-medium hover:bg-gray-900"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Book & Financial Ledger Modal */}
      <BillBookModal
        isOpen={Boolean(billBookLead)}
        onClose={() => setBillBookLead(null)}
        lead={billBookLead}
        onUpdated={onRefresh}
      />

      {/* 8 Mandatory Confirmations Modal */}
      <ConfirmationsModal
        isOpen={Boolean(confirmationsLead)}
        onClose={() => setConfirmationsLead(null)}
        lead={confirmationsLead}
        onUpdated={onRefresh}
      />

      {/* Transfer Handover Modal */}
      <TransferModal
        isOpen={Boolean(transferLead)}
        onClose={() => setTransferLead(null)}
        lead={transferLead}
        onUpdated={onRefresh}
      />

    </div>
  );
}
