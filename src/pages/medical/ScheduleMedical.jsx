import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, ChevronRight, CheckCircle2, XCircle, Calendar, 
  Building2, Upload, FileCheck, ShieldAlert, Award, Sparkles, 
  ShieldCheck, Search, Filter, RotateCcw, Loader2, ArrowRight,
  FileCheck2, MapPin, Clock, DollarSign, RefreshCw, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGetLeads, apiScheduleMedical, apiSubmitMedicalResult } from '../../utils/api';

const APPROVED_CENTERS = [
  'GAMCA Medical Center, Mumbai',
  'Gulf Diagnostics, Delhi',
  'GCC Health Care, Lucknow',
  'Al-Khaleej Diagnostic, Patna',
  'Apex Diagnostic Center, Hyderabad',
  'Bengal Diagnostic Center, Kolkata'
];

export default function ScheduleMedical() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState('');

  // Modals
  const [activeModal, setActiveModal] = useState(null);
  const [resultModal, setResultModal] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(APPROVED_CENTERS[0]);
  const [medicalDate, setMedicalDate] = useState('');
  const [slipNo, setSlipNo] = useState('');
  const [medicalFee, setMedicalFee] = useState(2500);
  const [remarks, setRemarks] = useState('');

  // Result Modal State
  const [fitStatus, setFitStatus] = useState('FIT');
  const [resultRemarks, setResultRemarks] = useState('');
  const [resultCenter, setResultCenter] = useState('');
  const [resultSlip, setResultSlip] = useState('');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      let res = await apiGetLeads({ medicalDesk: true });
      if (res?.success && res.data) {
        setCandidates(res.data);
      } else {
        const fallback = await apiGetLeads({ stage: 'ALL' });
        if (fallback?.success && fallback.data) {
          setCandidates(fallback.data);
        }
      }
    } catch (err) {
      console.error('Error fetching medical candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 5000);
  };

  // Open Schedule Modal
  const handleOpenScheduleModal = (candidate) => {
    setActiveModal(candidate);
    setSelectedCenter(candidate.medicalDetails?.center || APPROVED_CENTERS[0]);
    setMedicalDate(
      candidate.medicalDetails?.appointmentDate
        ? new Date(candidate.medicalDetails.appointmentDate).toISOString().split('T')[0]
        : ''
    );
    setSlipNo(candidate.medicalDetails?.slipNo || `GCC-${Math.floor(10000 + Math.random() * 90000)}`);
    setMedicalFee(candidate.medicalDetails?.medicalFee || candidate.paymentDetails?.medicalFee || 2500);
    setRemarks(candidate.medicalDetails?.remarks || '');
  };

  // Handle Schedule Submit
  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!activeModal || !selectedCenter || !medicalDate) return;

    setActionLoading(true);
    try {
      const res = await apiScheduleMedical(activeModal._id, {
        center: selectedCenter,
        appointmentDate: medicalDate,
        slipNo,
        medicalFee: Number(medicalFee),
        remarks
      });

      if (res?.success) {
        showToast(`Medical scheduled for ${activeModal.candidateName} at ${selectedCenter} on ${medicalDate} (Slip: ${slipNo}, Fee: ₹${medicalFee}).`);
        setActiveModal(null);
        fetchCandidates();
      } else {
        alert(res?.message || 'Failed to schedule appointment');
      }
    } catch (err) {
      alert(err.message || 'Error scheduling appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Result Modal
  const handleOpenResultModal = (candidate) => {
    setResultModal(candidate);
    setFitStatus(candidate.medicalDetails?.status === 'FIT' ? 'FIT' : 'FIT');
    setResultCenter(candidate.medicalDetails?.center || APPROVED_CENTERS[0]);
    setResultSlip(candidate.medicalDetails?.slipNo || `GCC-${Math.floor(10000 + Math.random() * 90000)}`);
    setResultRemarks(candidate.medicalDetails?.remarks || '');
  };

  // Handle Result Submit (FIT vs UNFIT)
  const handleUpdateResult = async (e) => {
    e.preventDefault();
    if (!resultModal) return;

    setActionLoading(true);
    try {
      const res = await apiSubmitMedicalResult(resultModal._id, {
        status: fitStatus,
        center: resultCenter,
        slipNo: resultSlip,
        validity: fitStatus === 'FIT' ? '12 Months' : 'None',
        remarks: resultRemarks
      });

      if (res?.success) {
        if (fitStatus === 'FIT') {
          showToast(`Medical FIT clearance recorded for ${resultModal.candidateName}! Candidate automatically moved to Staff Head Desk (Step 12) & Bill Book unlocked.`);
        } else {
          showToast(`Candidate ${resultModal.candidateName} declared GAMCA UNFIT. Quarantined to Rejection Log per GCC compliance standard.`);
        }
        setResultModal(null);
        fetchCandidates();
      } else {
        alert(res?.message || 'Failed to record medical result');
      }
    } catch (err) {
      alert(err.message || 'Error recording result');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Logic
  const filteredCandidates = candidates.filter((c) => {
    const name = c.candidateName || '';
    const phone = c.phone || '';
    const passport = c.passportNumber || '';
    const leadId = c.leadId || '';
    const trade = c.trade || c.applicationForm?.trade || '';
    const country = c.country || (c.applicationForm?.preferredCountries && c.applicationForm?.preferredCountries[0]) || '';
    const center = c.medicalDetails?.center || '';
    const slip = c.medicalDetails?.slipNo || '';

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      passport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leadId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slip.toLowerCase().includes(searchQuery.toLowerCase());

    const medStatus = c.medicalDetails?.status || 'PENDING';
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && (medStatus === 'PENDING' || !c.medicalDetails?.center)) ||
      (statusFilter === 'SCHEDULED' && medStatus === 'SCHEDULED') ||
      (statusFilter === 'FIT' && medStatus === 'FIT') ||
      (statusFilter === 'UNFIT' && medStatus === 'UNFIT');

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const pendingCount = candidates.filter(c => !c.medicalDetails?.center || c.medicalDetails?.status === 'PENDING').length;
  const scheduledCount = candidates.filter(c => c.medicalDetails?.status === 'SCHEDULED').length;
  const fitCount = candidates.filter(c => c.medicalDetails?.status === 'FIT').length;

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/medical/all')} className="hover:text-blue-600 cursor-pointer">Medical</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Schedule Medical Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Schedule Medical Center
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/medical/all')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Go to Medical Records"
          >
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <span>All Medicals</span>
          </button>

          <button
            onClick={() => {
              if (candidates.length > 0) {
                handleOpenScheduleModal(candidates[0]);
              } else {
                alert('No candidates available to schedule.');
              }
            }}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Slot</span>
          </button>

          <button
            onClick={fetchCandidates}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Candidates"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-600 text-white shadow-md flex items-center gap-2.5 text-[13px] font-medium animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. Dynamic 4-KPI Row (Clean, Professional) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Needs Center Allocation</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : pendingCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Pending clinic designation</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Scheduled Appointments</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-purple-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : scheduledCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Confirmed appointments</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Cleared GAMCA FIT</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : fitCount}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Forwarded to Step 12</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700">Approved GCC Hubs</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-blue-600 font-mono leading-none">
              {APPROVED_CENTERS.length} Hubs
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Mumbai, Delhi, Lucknow, Patna</div>
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Bar + Candidates Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
            {[
              { key: 'ALL', label: 'All Candidates', count: candidates.length },
              { key: 'PENDING', label: 'Needs Allocation', count: pendingCount },
              { key: 'SCHEDULED', label: 'Scheduled', count: scheduledCount },
              { key: 'FIT', label: 'FIT Passed', count: fitCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-gray-200 text-gray-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidate, passport, slip..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[12.5px] focus:outline-none focus:border-blue-500"
              />
            </div>
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[12px] font-medium flex items-center gap-1 cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Candidates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 whitespace-nowrap">Candidate & Passport</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Trade & Destination</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Selection Route</th>
                <th className="py-3.5 px-4 whitespace-nowrap">GAMCA Medical Center</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Scheduled Date & Slip</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Medical Fee</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading medical candidates from database...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                    No candidates found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const center = c.medicalDetails?.center;
                  const dateStr = c.medicalDetails?.appointmentDate
                    ? new Date(c.medicalDetails.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '';
                  const slip = c.medicalDetails?.slipNo;
                  const fee = c.medicalDetails?.medicalFee || c.paymentDetails?.medicalFee || 2500;
                  const isScheduled = !!center && !!dateStr;

                  return (
                    <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* 1. Candidate & Passport */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{c.candidateName}</div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>{c.passportNumber || 'No Passport'}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-blue-600 font-medium">{c.leadId || c._id.slice(-6)}</span>
                        </div>
                      </td>

                      {/* 2. Trade & Country */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{c.trade || c.applicationForm?.trade || 'Unassigned'}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span>{c.country || (c.applicationForm?.preferredCountries && c.applicationForm?.preferredCountries[0]) || 'Gulf'}</span>
                        </div>
                      </td>

                      {/* 3. Selection Route */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          c.selectionMode === 'DIRECT_CV'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {c.selectionMode === 'DIRECT_CV' ? 'CV Selected' : 'Interview Pass'}
                        </span>
                      </td>

                      {/* 4. GAMCA Medical Center */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {center ? (
                          <div className="text-gray-900 font-medium">{center}</div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                            <Clock className="w-3 h-3" /> Needs Center
                          </span>
                        )}
                      </td>

                      {/* 5. Scheduled Date & Slip */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {dateStr ? (
                          <div>
                            <div className="font-mono text-gray-800 font-medium">{dateStr}</div>
                            {slip && <div className="text-[11px] text-purple-600 font-mono mt-0.5">Slip: {slip}</div>}
                          </div>
                        ) : (
                          <span className="text-amber-600 font-medium text-[11.5px]">Awaiting Date</span>
                        )}
                      </td>

                      {/* 6. Medical Fee */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-gray-900">
                        ₹{fee.toLocaleString()}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenScheduleModal(c)}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
                          >
                            {isScheduled ? 'Reschedule' : 'Assign Center'}
                          </button>

                          <button
                            onClick={() => handleOpenResultModal(c)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Record Result</span>
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

      {/* Schedule Center Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50">
              <h3 className="font-bold text-gray-900 text-[16px]">Assign GAMCA Medical Center</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>
            
            <form onSubmit={handleSchedule} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl text-[12px]">
                <div className="font-bold text-gray-900">{activeModal.candidateName} • {activeModal.trade || 'Candidate'}</div>
                <div className="text-gray-500 font-mono mt-0.5">Passport: {activeModal.passportNumber || 'N/A'} • ID: {activeModal.leadId}</div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Approved Medical Center *</label>
                <select
                  required
                  value={selectedCenter}
                  onChange={(e) => setSelectedCenter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 bg-white"
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
                    value={medicalDate}
                    onChange={(e) => setMedicalDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Medical Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    value={medicalFee}
                    onChange={(e) => setMedicalFee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">GAMCA Slip / Barcode Token *</label>
                <input
                  type="text"
                  required
                  value={slipNo}
                  onChange={(e) => setSlipNo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Special Instructions / Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Fasting required for blood sugar, report at 9:00 AM..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
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
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Fitness Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
              <h3 className="font-bold text-gray-900 text-[16px]">Record Medical Fitness Result</h3>
              <button onClick={() => setResultModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleUpdateResult} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl text-[12px]">
                <div className="font-bold text-gray-900">{resultModal.candidateName} ({resultModal.trade || 'Trade'})</div>
                <div className="text-gray-500 font-mono">Passport: {resultModal.passportNumber || 'N/A'} • Slip: {resultModal.medicalDetails?.slipNo || 'Central'}</div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Medical Result Decision *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFitStatus('FIT')}
                    className={`py-2.5 rounded-xl text-[13px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      fitStatus === 'FIT'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                        : 'border-gray-200 text-gray-600 bg-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>✓ FIT (Opens Bill Book)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFitStatus('UNFIT')}
                    className={`py-2.5 rounded-xl text-[13px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      fitStatus === 'UNFIT'
                        ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-100'
                        : 'border-gray-200 text-gray-600 bg-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>✗ UNFIT (Reject / Hold)</span>
                  </button>
                </div>
              </div>

              {fitStatus === 'FIT' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[12px] text-emerald-800 leading-snug">
                  <strong>FRD Step 12 Rule:</strong> FIT candidate immediately transfers to Staff Head Desk for Calling Staff assignment & Bill Book advance collection.
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[12px] text-red-800 leading-snug">
                  <strong>Quarantine Rule:</strong> Candidate marked UNFIT is archived to avoid unnecessary visa processing costs.
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Doctor Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chest X-Ray Normal, HIV & Hepatitis Negative..."
                  value={resultRemarks}
                  onChange={(e) => setResultRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setResultModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-[13px] font-semibold hover:bg-emerald-700 shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Result</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
