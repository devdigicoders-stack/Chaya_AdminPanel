import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Download, Users, Ban, FileX, AlertCircle, 
  RotateCcw, UserX, Search, RefreshCw, Loader2, Eye, History, 
  
  X, Check, AlertTriangle} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiTransferLeadStage, apiToggleLeadHold } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function CancelledCandidates() {
  const navigate = useNavigate();

  // State
  const [candidates, setCandidates] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');

  // Modals
  const [historyCandidate, setHistoryCandidate] = useState(null);
  const [dossierCandidate, setDossierCandidate] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Log Cancellation Form State
  const [logForm, setLogForm] = useState({
    candidateId: '',
    reason: 'Candidate opted out (Personal / Family Reason)',
    customNotes: ''
  });
  const [loggingSubmitting, setLoggingSubmitting] = useState(false);

  // Fetch Cancelled Candidates from MongoDB Atlas
  const fetchCancelledCandidates = async () => {
    setLoading(true);
    setError('');
    try {
      const [cancelledRes, allRes] = await Promise.allSettled([
        apiGetLeads({ cancelledDesk: 'true' }),
        apiGetLeads({ stage: 'ALL' })
      ]);

      if (cancelledRes.status === 'fulfilled' && cancelledRes.value?.data) {
        setCandidates(cancelledRes.value.data);
      }

      if (allRes.status === 'fulfilled' && allRes.value?.data) {
        setAllLeads(allRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load cancelled candidates:', err);
      setError(err.message || 'Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelledCandidates();
  }, []);

  // Real-time Dynamic Metrics computed from MongoDB data
  const metrics = useMemo(() => {
    const total = candidates.length;
    let locationDropouts = 0;
    let candidateWithdrawn = 0;
    let clientOrDocIssue = 0;
    let eligibleForReactivation = 0;

    candidates.forEach(c => {
      const reason = (c.holdReason || c.notes || '').toLowerCase();
      const locEdits = c.locationConfirmation?.editCount || 0;

      if (locEdits >= 4 || reason.includes('location') || reason.includes('attempt')) {
        locationDropouts++;
      } else if (reason.includes('withdraw') || reason.includes('personal') || reason.includes('family') || reason.includes('opted')) {
        candidateWithdrawn++;
      } else if (reason.includes('client') || reason.includes('document') || reason.includes('passport')) {
        clientOrDocIssue++;
      } else {
        candidateWithdrawn++;
      }

      // If not permanently blacklisted or regulatory banned, candidate is eligible for re-activation
      if (!reason.includes('ban') && !reason.includes('fake') && !reason.includes('fraud')) {
        eligibleForReactivation++;
      }
    });

    return { total, locationDropouts, candidateWithdrawn, clientOrDocIssue, eligibleForReactivation };
  }, [candidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const reason = (c.holdReason || c.notes || '').toLowerCase();
      const locEdits = c.locationConfirmation?.editCount || 0;

      if (filterTab === 'LOCATION_DROPOUTS') {
        if (locEdits < 4 && !reason.includes('location') && !reason.includes('attempt')) return false;
      } else if (filterTab === 'WITHDRAWN') {
        if (!reason.includes('withdraw') && !reason.includes('personal') && !reason.includes('opted') && !reason.includes('family')) return false;
      } else if (filterTab === 'ELIGIBLE') {
        if (reason.includes('ban') || reason.includes('fraud') || reason.includes('fake')) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (c.candidateName || '').toLowerCase();
        const passport = (c.passportNumber || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const trade = (c.trade || '').toLowerCase();
        const country = (c.country || '').toLowerCase();
        const leadId = (c.leadId || '').toLowerCase();

        if (!name.includes(q) && !passport.includes(q) && !phone.includes(q) && !trade.includes(q) && !country.includes(q) && !leadId.includes(q) && !reason.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, searchTerm, filterTab]);

  // Re-activate Candidate (FRD Section 21)
  const handleReactivate = async (candidate) => {
    const { value: targetStage } = await Swal.fire({
      title: `Re-activate Candidate?`,
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5;">
          <p>You are reopening candidate <b>${candidate.candidateName}</b> (${candidate.passportNumber || candidate.leadId}).</p>
          <p style="color: #64748b; margin-top: 6px;">Select the stage to restore candidate into active recruitment pipeline:</p>
        </div>
      `,
      input: 'select',
      inputOptions: {
        'CALLING_SCREENING': '03. Calling & Screening Queue (Re-contact candidate)',
        'STAFF_HEAD_HANDLING': '02. Staff Head Desk (Reassignment to new staff)',
        'INITIAL_INTERVIEW': '04. Interview Panel (Re-screen trade)',
        'UNASSIGNED': '01. Central Lead Pool (Unassigned Pool)'
      },
      inputValue: 'CALLING_SCREENING',
      showCancelButton: true,
      confirmButtonText: 'Re-activate Candidate',
      confirmButtonColor: '#2563eb',
      cancelButtonText: 'Cancel'
    });

    if (!targetStage) return;

    setActionLoadingId(candidate._id);
    try {
      const res = await apiTransferLeadStage(candidate._id, {
        toStage: targetStage,
        remarks: `Candidate reopened and re-activated from Cancelled status to ${targetStage} per authorized admin request.`
      });

      if (res?.success) {
        // Also release hold if candidate was on hold
        if (candidate.isHold) {
          await apiToggleLeadHold(candidate._id, false, 'Reopened from Cancelled status');
        }

        Swal.fire({
          icon: 'success',
          title: 'Candidate Re-activated!',
          text: `${candidate.candidateName} has been successfully restored to ${targetStage.replace(/_/g, ' ')}.`,
          confirmButtonColor: '#2563eb',
          timer: 2500
        });

        fetchCancelledCandidates();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: err.message || 'Could not re-activate candidate.',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Log Candidate Cancellation to Backend
  const handleLogCancellation = async (e) => {
    e.preventDefault();
    if (!logForm.candidateId) {
      Swal.fire({ icon: 'warning', title: 'Candidate Required', text: 'Please select a candidate to cancel.' });
      return;
    }

    setLoggingSubmitting(true);
    try {
      const remarks = `Cancelled Desk: ${logForm.reason}. ${logForm.customNotes || ''}`.trim();
      const res = await apiTransferLeadStage(logForm.candidateId, {
        toStage: 'CANCELLED',
        remarks
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Cancellation Recorded',
          text: 'Candidate status moved to CANCELLED and logged in lifecycle audit trail.',
          confirmButtonColor: '#2563eb'
        });
        setShowLogModal(false);
        setLogForm({
          candidateId: '',
          reason: 'Candidate opted out (Personal / Family Reason)',
          customNotes: ''
        });
        fetchCancelledCandidates();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err.message || 'Could not record cancellation.'
      });
    } finally {
      setLoggingSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (candidates.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'No cancelled candidates to export.' });
      return;
    }

    const headers = ['Lead ID', 'Candidate Name', 'Passport Number', 'Phone', 'Trade', 'Target Country', 'Reason', 'Cancelled Date'];
    const rows = candidates.map(c => [
      c.leadId || '',
      `"${c.candidateName || ''}"`,
      `"${c.passportNumber || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.trade || ''}"`,
      `"${c.country || ''}"`,
      `"${(c.holdReason || c.notes || 'Candidate Withdrawn').replace(/"/g, '""')}"`,
      `"${c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Chhaya_Cancelled_Candidates_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCandidatesList = allLeads.filter(l => l.currentStage !== 'CANCELLED' && l.currentStage !== 'REJECTED');

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">

      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/candidates/all')} className="hover:text-blue-600 cursor-pointer">10. Candidates & Registry</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Cancelled Candidates Desk</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Cancelled Candidates Audit Desk
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              FRD Section 13 & 21
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => navigate('/candidates/all')}
            className="h-9 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Master Registry</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="h-9 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => setShowLogModal(true)}
            className="h-9 px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Log Cancellation</span>
          </button>

          <button
            onClick={fetchCancelledCandidates}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Real-time Live KPI Metric Cards from MongoDB Atlas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5 sm:mb-6">

        {/* Total Cancelled */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Total Cancelled</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Archived Candidate Files</div>
          </div>
        </div>

        {/* Location Dropouts (4 attempts rule) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Location Dropouts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileX className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-purple-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.locationDropouts}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Exceeded 4 attempts / Cancelled</div>
          </div>
        </div>

        {/* Candidate Withdrawn */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Candidate Withdrawn</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.candidateWithdrawn}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Personal or financial opt-out</div>
          </div>
        </div>

        {/* Re-activation Potential */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Eligible to Reopen</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.eligibleForReactivation}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Restorable to active pipeline</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Cancelled', count: metrics.total },
              { key: 'LOCATION_DROPOUTS', label: 'Location Dropouts', count: metrics.locationDropouts },
              { key: 'WITHDRAWN', label: 'Candidate Withdrawn', count: metrics.candidateWithdrawn },
              { key: 'ELIGIBLE', label: 'Eligible for Re-activation', count: metrics.eligibleForReactivation },
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
                  filterTab === tab.key ? 'bg-red-50 text-red-600' : 'bg-gray-200/80 text-gray-600'
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
              placeholder="Search by name, passport, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Live Cancelled Candidates Roster Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Trade & Country</th>
                <th className="py-3 px-4">Cancellation Reason</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading cancelled candidates from database...</span>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <UserX className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">No Cancelled Candidates</p>
                    <p className="text-[11px] text-gray-400 mt-1">There are no candidates matching this cancellation filter in the database.</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const reason = candidate.holdReason || candidate.notes || 'Candidate Withdrawn from Pipeline';
                  const isActing = actionLoadingId === candidate._id;

                  return (
                    <tr key={candidate._id} className="hover:bg-red-50/20 transition-colors">
                      
                      {/* Candidate Name & Passport */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {(candidate.candidateName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{candidate.candidateName}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-semibold">
                                {candidate.leadId}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">
                              {candidate.passportNumber || 'No Passport'} • {candidate.phone || 'No Phone'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trade & Target Destination */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{candidate.trade || 'General Worker'}</div>
                        <div className="text-[11px] text-blue-600 font-medium">
                          {candidate.country || 'Gulf Region'}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="font-medium text-gray-800 truncate" title={reason}>
                          {reason}
                        </div>
                        <div className="text-[10.5px] text-gray-400 font-mono mt-0.5">
                          Date: {candidate.updatedAt ? new Date(candidate.updatedAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <X className="w-3 h-3" />
                          CANCELLED
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDossierCandidate(candidate)}
                            className="p-1.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                            title="View Candidate Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setHistoryCandidate(candidate)}
                            className="p-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                            title="View Lifecycle History Audit Trail"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleReactivate(candidate)}
                            disabled={isActing}
                            className="h-7 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            title="Re-activate Candidate back into active pipeline"
                          >
                            {isActing ? (
                              <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3 text-emerald-600" />
                                <span>Re-activate</span>
                              </>
                            )}
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

      {/* 5. Log Candidate Cancellation Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden my-6">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-900 text-white">
              <div className="flex items-center gap-2.5">
                <Ban className="w-5 h-5 text-red-300" />
                <h3 className="font-bold text-[15px] text-white">Log Candidate Cancellation</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogCancellation} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Select Active Candidate <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={logForm.candidateId}
                  onChange={(e) => setLogForm({ ...logForm, candidateId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="">-- Choose Candidate from Database --</option>
                  {activeCandidatesList.map(l => (
                    <option key={l._id} value={l._id}>
                      {l.candidateName} • {l.passportNumber || l.leadId} ({l.trade || 'General'} - Stage: {l.currentStage})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Primary Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={logForm.reason}
                  onChange={(e) => setLogForm({ ...logForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="Candidate opted out (Personal / Family Reason)">Candidate opted out (Personal / Family Reason)</option>
                  <option value="Exceeded 4 Location Confirmation Attempts without confirmation">Exceeded 4 Location Attempts without confirmation (FRD Sec 13)</option>
                  <option value="Client Destination Rejected / Unavailable">Client Destination Rejected / Unavailable</option>
                  <option value="Accepted Local Employment in India">Accepted Local Employment in India</option>
                  <option value="Unresponsive to Multiple Calling Follow-ups">Unresponsive to Multiple Calling Follow-ups</option>
                  <option value="Passport Renewal / Document Issue Withdrawn">Passport Renewal / Document Issue Withdrawn</option>
                  <option value="Fee Payment Withdrawn / Refunded">Fee Payment Withdrawn / Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Official Detailed Remarks / Audit Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed explanation of cancellation reason for immutable audit trail..."
                  value={logForm.customNotes}
                  onChange={(e) => setLogForm({ ...logForm, customNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loggingSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Record Cancellation</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. Candidate Dossier Modal */}
      {dossierCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden my-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <UserX className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-[15px] text-white">Candidate Dossier — Cancelled File</h3>
              </div>
              <button
                onClick={() => setDossierCandidate(null)}
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
                  {(dossierCandidate.candidateName || 'C').charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{dossierCandidate.candidateName}</h4>
                  <p className="text-gray-500 font-mono">{dossierCandidate.leadId} • {dossierCandidate.passportNumber || 'No Passport'}</p>
                  <p className="text-red-700 font-semibold mt-0.5">● Status: CANCELLED</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-gray-700">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10.5px] text-gray-400 block font-medium">Contact Phone</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">{dossierCandidate.phone}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10.5px] text-gray-400 block font-medium">Trade & Skill</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">{dossierCandidate.trade || 'General'}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10.5px] text-gray-400 block font-medium">Target Country</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">{dossierCandidate.country || 'Saudi Arabia'}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10.5px] text-gray-400 block font-medium">Assigned Caller</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">{dossierCandidate.assignedCallingStaff?.name || 'Admin'}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1">
                  Cancellation Reason & Remarks:
                </span>
                <p className="text-gray-700 leading-relaxed font-mono">
                  {dossierCandidate.holdReason || dossierCandidate.notes || 'Candidate opted out from recruitment pipeline.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const c = dossierCandidate;
                    setDossierCandidate(null);
                    handleReactivate(c);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-activate Candidate</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. Lead History Lifecycle Modal */}
      {historyCandidate && (
        <LeadHistoryModal
          isOpen={!!historyCandidate}
          onClose={() => setHistoryCandidate(null)}
          candidate={historyCandidate}
        />
      )}

    </div>
  );
}
