
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, Clock, RefreshCw, CheckCircle2, XCircle, 
  ChevronRight, Phone, Calendar, ArrowRight, History, MapPin, 
  Search, RotateCcw, ShieldCheck, UserX, Sparkles, Loader2, 
  X, AlertCircle, FileText, Send, Check , Plus 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiConfirmVisaDelay } from '../../utils/api';

export default function VisaDelayConfirmations() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedHistoryCase, setSelectedHistoryCase] = useState(null);
  const [confirmReadyModal, setConfirmReadyModal] = useState(null);
  const [newExpectedDate, setNewExpectedDate] = useState('');
  const [delayReason, setDelayReason] = useState('Consulate security clearance backlog');
  const [candidateRemarks, setCandidateRemarks] = useState('');
  
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('Candidate unwilling to wait for consular extension');

  // Fetch delayed leads
  const fetchDelayedLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetLeads({ preVisaDesk: 'true' });
      if (res?.success && res.data) {
        // Find leads with pending revision or delay history or visaDate in the past
        const relevant = res.data.filter(l => 
          l.visaDetails?.revisionRequest?.isPending ||
          (l.preVivaDetails?.delayHistory && l.preVivaDetails.delayHistory.length > 0) ||
          l.currentStage === 'PRE_VISA' ||
          l.currentStage === 'VISA_PROCESSING'
        );
        setLeads(relevant.length > 0 ? relevant : res.data);
      }
    } catch (err) {
      console.error('Failed to load delay cases', err);
      setError(err.message || 'Could not connect to recruitment server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelayedLeads();
  }, []);

  // Open Confirm Ready Modal
  const handleOpenConfirmReady = (lead) => {
    setConfirmReadyModal(lead);
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks out
    setNewExpectedDate(d.toISOString().split('T')[0]);
    setDelayReason(lead.visaDetails?.revisionRequest?.reason || 'GCC Ministry of Interior processing quota extension');
    setCandidateRemarks('Candidate called on mobile; confirmed willing to wait for new visa issuance date.');
  };

  // Submit Confirm Ready
  const handleSubmitConfirmReady = async (e) => {
    e.preventDefault();
    if (!confirmReadyModal || !newExpectedDate) return;

    setActionLoading(true);
    try {
      const res = await apiConfirmVisaDelay(confirmReadyModal._id, {
        action: 'CONFIRM',
        newExpectedDate,
        reason: delayReason.trim(),
        candidateRemarks: candidateRemarks.trim()
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Candidate Confirmed Ready!',
          html: `Extension confirmed for <b>${confirmReadyModal.candidateName}</b>.<br>
                 <span class="text-xs text-gray-500 mt-1 block">New expected date: <b>${newExpectedDate}</b>. Reassigned to Visa Processing.</span>`,
          confirmButtonColor: '#2563EB'
        });
        setConfirmReadyModal(null);
        fetchDelayedLeads();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Confirmation Failed',
        text: err.message || 'Could not confirm delay extension.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Cancel Candidate Modal
  const handleOpenCancel = (lead) => {
    setCancelModal(lead);
    setCancelReason('Candidate unwilling to wait for consular extension and requested refund/exit');
  };

  // Submit Cancel Candidate
  const handleSubmitCancel = async (e) => {
    e.preventDefault();
    if (!cancelModal) return;

    setActionLoading(true);
    try {
      const res = await apiConfirmVisaDelay(cancelModal._id, {
        action: 'CANCEL',
        candidateRemarks: cancelReason.trim(),
        reason: cancelReason.trim()
      });

      if (res?.success) {
        Swal.fire({
          icon: 'warning',
          title: 'Candidate Cancelled',
          text: `File for ${cancelModal.candidateName} has been marked CANCELLED in database.`,
          confirmButtonColor: '#EF4444'
        });
        setCancelModal(null);
        fetchDelayedLeads();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Cancellation Failed',
        text: err.message || 'Could not cancel candidate.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to determine delay status
  const getDelayStatus = (l) => {
    if (l.currentStage === 'CANCELLED') return 'CANCELLED';
    if (l.visaDetails?.revisionRequest?.isPending) return 'PENDING_CALL';
    if (l.preVivaDetails?.delayHistory?.length > 0) return 'CONFIRMED_READY';
    return 'PENDING_CALL';
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const st = getDelayStatus(l);

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const id = (l.leadId || '').toLowerCase();
        const trade = (l.trade || l.applicationForm?.trade || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !id.includes(q) && !trade.includes(q)) {
          return false;
        }
      }

      // Status tab
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING' && st !== 'PENDING_CALL') return false;
        if (statusFilter === 'CONFIRMED' && st !== 'CONFIRMED_READY') return false;
        if (statusFilter === 'CANCELLED' && st !== 'CANCELLED') return false;
      }

      return true;
    });
  }, [leads, searchTerm, statusFilter]);

  // Dynamic KPI Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    let pendingCall = 0;
    let confirmedReady = 0;
    let cancelled = 0;

    leads.forEach(l => {
      const st = getDelayStatus(l);
      if (st === 'PENDING_CALL') pendingCall++;
      else if (st === 'CONFIRMED_READY') confirmedReady++;
      else if (st === 'CANCELLED') cancelled++;
    });

    return { total, pendingCall, confirmedReady, cancelled };
  }, [leads]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">07. Pre-Viva Management</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Visa Date Change Requests</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Visa Date Change Requests & Delay Review
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => navigate('/pre-viva/schedule')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            title="Check Inward Files"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Check Files & Send to Visa</span>
          </button>

          <button 
            onClick={() => navigate('/pre-viva/all')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="All Pre-Viva Files"
          >
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>All Pre-Viva Files</span>
          </button>

          <button
            onClick={fetchDelayedLeads}
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

      {/* 2. KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Delay Cases */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total Delay Files</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Consular delay cycle</div>
          </div>
        </div>

        {/* Pending Calls */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Pending Calls</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.pendingCall}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Awaiting candidate contact</div>
          </div>
        </div>

        {/* Confirmed & Reassigned */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Confirmed Ready</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.confirmedReady}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Agreed to new expected date</div>
          </div>
        </div>

        {/* Cancelled Files */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-red-700">Declined / Cancelled</span>
            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-red-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.cancelled}
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1">Opted out of recruitment</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Quick Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60">
            {[
              { key: 'ALL', label: 'All Delay Cases', count: metrics.total },
              { key: 'PENDING', label: 'Pending Call', count: metrics.pendingCall },
              { key: 'CONFIRMED', label: 'Confirmed Ready', count: metrics.confirmedReady },
              { key: 'CANCELLED', label: 'Declined / Cancelled', count: metrics.cancelled },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
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

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidate, trade, passport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {(searchTerm || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 4. Live Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Candidate & Passport</th>
                <th className="py-3.5 px-4">Trade & Location</th>
                <th className="py-3.5 px-4 text-center">Delay Cycle</th>
                <th className="py-3.5 px-4">Expected Visa Date</th>
                <th className="py-3.5 px-4">Logged Delay Reason</th>
                <th className="py-3.5 px-4 text-center">Current Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading visa delay confirmation records...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span>No delayed visa cases match your filter.</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const status = getDelayStatus(lead);
                  const cycles = (lead.preVivaDetails?.delayHistory?.length || 0) + 1;
                  const vDate = lead.visaDetails?.visaDate || lead.preVivaDetails?.vivaDate;
                  const reason = lead.visaDetails?.revisionRequest?.reason || 
                    lead.preVivaDetails?.delayHistory?.[lead.preVivaDetails.delayHistory.length - 1]?.reason || 
                    'Consular quota / security check backlog';

                  return (
                    <tr key={lead._id} className="hover:bg-blue-50/20 transition-colors">
                      
                      {/* 1. Candidate & Passport */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{lead.candidateName}</div>
                        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-gray-700">{lead.passportNumber || 'No Passport'}</span>
                          <span>•</span>
                          <span>{lead.leadId || lead._id.substring(18)}</span>
                        </div>
                      </td>

                      {/* 2. Trade & Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">{lead.trade || lead.applicationForm?.trade || 'Worker'}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{lead.locationConfirmation?.confirmedLocation || lead.applicationForm?.preferredCountries?.[0] || 'Gulf Destination'}</span>
                        </div>
                      </td>

                      {/* 3. Delay Cycle */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Cycle #{cycles}
                        </span>
                      </td>

                      {/* 4. Expected Date */}
                      <td className="py-3.5 px-4">
                        {vDate ? (
                          <div className="inline-flex items-center gap-1.5 text-red-600 font-mono font-bold text-xs">
                            <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span>{new Date(vDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Pending setup</span>
                        )}
                      </td>

                      {/* 5. Logged Reason */}
                      <td className="py-3.5 px-4 max-w-[220px] truncate" title={reason}>
                        <span className="text-gray-700 text-xs">{reason}</span>
                      </td>

                      {/* 6. Current Status */}
                      <td className="py-3.5 px-4 text-center">
                        {status === 'CONFIRMED_READY' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Confirmed Ready</span>
                          </span>
                        )}
                        {status === 'PENDING_CALL' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Pending Call</span>
                          </span>
                        )}
                        {status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                            <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Cancelled File</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {status !== 'CANCELLED' && (
                            <>
                              <button
                                onClick={() => handleOpenConfirmReady(lead)}
                                className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer active:scale-[0.98] shadow-xs"
                                title="Candidate agreed to wait, set new date"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirm Ready</span>
                              </button>

                              <button
                                onClick={() => handleOpenCancel(lead)}
                                className="h-8 px-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                title="Candidate declines to wait, cancel file"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {lead.preVivaDetails?.delayHistory?.length > 0 && (
                            <button
                              onClick={() => setSelectedHistoryCase(lead)}
                              className="h-8 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="View delay cycle history"
                            >
                              <History className="w-3.5 h-3.5 text-gray-500" />
                              <span>History</span>
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

      {/* 5. Confirm Ready & Set Revised Date Modal */}
      {confirmReadyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Candidate Confirmed Ready</h3>
                <p className="text-[11px] text-gray-500">Record telephonic consent & set new expected date</p>
              </div>
              <button 
                onClick={() => setConfirmReadyModal(null)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitConfirmReady} className="p-5 space-y-4">
              
              <div className="bg-gray-50 p-3 rounded-xl text-xs border border-gray-200/70">
                <div className="font-bold text-gray-900">{confirmReadyModal.candidateName} • {confirmReadyModal.trade || 'Worker'}</div>
                <div className="text-gray-500 font-mono mt-0.5">
                  Passport: {confirmReadyModal.passportNumber || 'N/A'} • Phone: {confirmReadyModal.phone || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  New Expected Visa Stamping Date *
                </label>
                <input
                  type="date"
                  required
                  value={newExpectedDate}
                  onChange={(e) => setNewExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Consular Delay Reason
                </label>
                <input
                  type="text"
                  required
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Candidate Telephonic Agreement & Remarks
                </label>
                <textarea
                  rows={2}
                  required
                  value={candidateRemarks}
                  onChange={(e) => setCandidateRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setConfirmReadyModal(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save & Reassign to Visa</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. Cancel Candidate Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Cancel Candidate File</h3>
                <p className="text-[11px] text-gray-500">Candidate opted out due to visa processing delays</p>
              </div>
              <button 
                onClick={() => setCancelModal(null)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCancel} className="p-5 space-y-4">
              
              <div className="bg-red-50/50 p-3 rounded-xl text-xs border border-red-200/70">
                <div className="font-bold text-red-900">{cancelModal.candidateName} • {cancelModal.trade || 'Worker'}</div>
                <div className="text-red-700 font-mono mt-0.5">Passport: {cancelModal.passportNumber || 'N/A'}</div>
                <p className="text-[11px] text-red-600 mt-2">
                  ⚠️ This action will mark the candidate as CANCELLED and withdraw the file from active recruitment.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Cancellation Reason & Candidate Feedback *
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCancelModal(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 7. Full History Audit Modal */}
      {selectedHistoryCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/60">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Visa Delay Cycle History</h3>
                <p className="text-[11px] text-gray-500">{selectedHistoryCase.candidateName} • {selectedHistoryCase.passportNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedHistoryCase(null)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[400px] overflow-y-auto space-y-3">
              {(selectedHistoryCase.preVivaDetails?.delayHistory || []).map((h, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-gray-900">Cycle #{h.attempt || idx + 1}</span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {h.delayDate ? new Date(h.delayDate).toLocaleDateString('en-GB') : 'Recorded'}
                    </span>
                  </div>
                  <div className="text-gray-700"><b>Reason:</b> {h.reason || 'Consular delay'}</div>
                  <div className="text-gray-600 mt-1"><b>Feedback:</b> {h.candidateRemarks || 'Confirmed'}</div>
                  <div className="text-[11px] text-gray-400 mt-1.5 flex items-center justify-between">
                    <span>Officer: {h.user || 'Pre-Viva Manager'}</span>
                    {h.expectedDate && (
                      <span className="font-mono text-emerald-700 font-semibold">
                        Expected: {new Date(h.expectedDate).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedHistoryCase(null)}
                className="h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
