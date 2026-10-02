import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Plus, Users, CheckCircle2, Clock, XCircle, 
  UserCheck, ArrowUpRight, ArrowDownRight, Award, ShieldCheck, 
  Sparkles, Search, Filter, RotateCcw, Send, Calendar as CalendarIcon,
  RefreshCw, Loader2, AlertCircle, MapPin, Check, Sliders, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiEvaluatePreViva } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function AllPreVivas() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyCandidate, setHistoryCandidate] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Evaluation Modal State
  const [evalModal, setEvalModal] = useState(null);
  const [evalScore, setEvalScore] = useState(75);
  const [evalDecision, setEvalDecision] = useState('CLEARED');
  const [evalPanelMember, setEvalPanelMember] = useState('');
  const [evalRemarks, setEvalRemarks] = useState('');

  // Fetch leads
  const fetchPreVivaLeads = async () => {
    setLoading(true);
    setError('');
    try {
      let res = await apiGetLeads({ preVisaDesk: 'true' });
      if (res?.success && res.data) {
        setLeads(res.data);
      } else {
        const fallback = await apiGetLeads({ stage: 'ALL' });
        if (fallback?.success && fallback.data) {
          const filtered = fallback.data.filter(l => 
            l.currentStage === 'PRE_VISA' || 
            l.currentStage === 'VISA_PROCESSING' || 
            l.fileType === 'MOVE_FILE' || 
            l.fileType === 'DIRECT_FILE' ||
            l.locationConfirmation?.isConfirmed ||
            l.preVivaDetails?.documentsVerified
          );
          setLeads(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to load Pre-Viva files', err);
      setError(err.message || 'Could not connect to recruitment server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreVivaLeads();
  }, []);

  // Open Evaluation Modal
  const handleOpenEval = (lead) => {
    setEvalModal(lead);
    setEvalScore(lead.preVivaDetails?.score || 75);
    setEvalDecision(lead.preVivaDetails?.status === 'CLEARED' ? 'CLEARED' : 'CLEARED');
    setEvalPanelMember(lead.preVivaDetails?.panelMember || 'Eng. Rajesh Verma (Technical Assessor)');
    setEvalRemarks(lead.preVivaDetails?.remarks || '');
  };

  // Submit Evaluation
  const handleSubmitEval = async (e) => {
    e.preventDefault();
    if (!evalModal) return;

    setActionLoading(true);
    try {
      const res = await apiEvaluatePreViva(evalModal._id, {
        score: Number(evalScore),
        decision: evalDecision,
        panelMember: evalPanelMember.trim() || 'Technical Assessor',
        remarks: evalRemarks.trim() || `Candidate scored ${evalScore}/100 in oral trade viva.`
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Evaluation Recorded!',
          html: `Candidate <b>${evalModal.candidateName}</b> evaluated as <b>${evalDecision}</b> (Score: ${evalScore}/100).<br>
                 <span class="text-xs text-gray-500 mt-1 block">
                   ${evalDecision === 'CLEARED' ? 'Transferred to Step 07 Visa Processing.' : 'Marked for Retest / Hold.'}
                 </span>`,
          confirmButtonColor: '#2563EB'
        });
        setEvalModal(null);
        fetchPreVivaLeads();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Evaluation Failed',
        text: err.message || 'Could not save evaluation result.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper for Normalized Status
  const getCandidateStatus = (l) => {
    if (l.preVivaDetails?.status) {
      return l.preVivaDetails.status;
    }
    if (l.currentStage === 'VISA_PROCESSING') return 'CLEARED';
    if (l.isHold) return 'RETEST_HOLD';
    if (l.visaDetails?.visaDate || l.preVivaDetails?.vivaDate) return 'SCHEDULED';
    return 'PENDING_VERIFICATION';
  };

  // Filtered List
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const status = getCandidateStatus(l);

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const id = (l.leadId || '').toLowerCase();
        const trade = (l.trade || l.applicationForm?.trade || '').toLowerCase();
        const panel = (l.preVivaDetails?.panelMember || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !id.includes(q) && !trade.includes(q) && !panel.includes(q)) {
          return false;
        }
      }

      // Status tab
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'CLEARED' && status !== 'CLEARED') return false;
        if (statusFilter === 'SCHEDULED' && status !== 'SCHEDULED') return false;
        if (statusFilter === 'RETEST_HOLD' && status !== 'RETEST_HOLD' && status !== 'NOT_CLEARED') return false;
        if (statusFilter === 'PENDING' && status !== 'PENDING_VERIFICATION' && status !== 'READY_FOR_VISA') return false;
      }

      return true;
    });
  }, [leads, searchTerm, statusFilter]);

  // Dynamic KPI Stats
  const stats = useMemo(() => {
    const total = leads.length;
    let cleared = 0;
    let scheduled = 0;
    let retest = 0;
    let pending = 0;

    leads.forEach(l => {
      const st = getCandidateStatus(l);
      if (st === 'CLEARED') cleared++;
      else if (st === 'SCHEDULED') scheduled++;
      else if (st === 'RETEST_HOLD' || st === 'NOT_CLEARED') retest++;
      else pending++;
    });

    return { total, cleared, scheduled, retest, pending };
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
            <span className="text-gray-900 font-medium">All Pre-Viva Files</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            All Pre-Viva Files & Evaluations
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => navigate('/pre-viva/schedule')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            title="Check inward files and assign to Visa"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Check Files & Send to Visa</span>
          </button>

          <button 
            onClick={() => navigate('/pre-viva/delay-confirmations')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Visa Date Change Requests"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Date Change Requests</span>
          </button>

          <button
            onClick={fetchPreVivaLeads}
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

      {/* 2. Dynamic KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Inward */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total Inward Files</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : stats.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Live candidate pool</div>
          </div>
        </div>

        {/* Cleared for Visa */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Cleared for Visa</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : stats.cleared}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Passed technical viva</div>
          </div>
        </div>

        {/* Scheduled */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700">Scheduled Sessions</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-blue-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : stats.scheduled}
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">Active examination dates</div>
          </div>
        </div>

        {/* Retest / Hold */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-red-700">Retest / Hold</span>
            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-red-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : stats.retest}
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1">Below benchmark score</div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Pending Review</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-purple-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : stats.pending}
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">Inward doc evaluation</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Quick Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60">
            {[
              { key: 'ALL', label: 'All Candidates', count: stats.total },
              { key: 'CLEARED', label: 'Cleared for Visa', count: stats.cleared },
              { key: 'SCHEDULED', label: 'Scheduled', count: stats.scheduled },
              { key: 'RETEST_HOLD', label: 'Need Retest', count: stats.retest },
              { key: 'PENDING', label: 'Pending Review', count: stats.pending }
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

      {/* 4. Live Candidates Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Candidate & Passport</th>
                <th className="py-3.5 px-4">Trade & Destination</th>
                <th className="py-3.5 px-4">File Source Stream</th>
                <th className="py-3.5 px-4">Viva Exam Schedule</th>
                <th className="py-3.5 px-4">Assigned Panel Member</th>
                <th className="py-3.5 px-4 text-center">Technical Score</th>
                <th className="py-3.5 px-4 text-center">Readiness Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading Pre-Viva candidate dossiers...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span>No candidate files match your selected filter.</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const status = getCandidateStatus(lead);
                  const isMove = lead.fileType === 'MOVE_FILE' || lead.locationConfirmation?.isConfirmed;
                  const vDate = lead.preVivaDetails?.vivaDate || lead.visaDetails?.visaDate;
                  const score = lead.preVivaDetails?.score || 0;
                  const panel = lead.preVivaDetails?.panelMember || 'Tech Panel';

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

                      {/* 2. Trade & Destination */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">{lead.trade || lead.applicationForm?.trade || 'Worker'}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{lead.locationConfirmation?.confirmedLocation || lead.applicationForm?.preferredCountries?.[0] || 'Gulf Destination'}</span>
                        </div>
                      </td>

                      {/* 3. File Source Stream */}
                      <td className="py-3.5 px-4">
                        {isMove ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Move File
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Direct File
                          </span>
                        )}
                      </td>

                      {/* 4. Viva Exam Schedule */}
                      <td className="py-3.5 px-4">
                        {vDate ? (
                          <div className="flex items-center gap-1.5 text-gray-900 font-mono font-bold">
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                            <span>{new Date(vDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-medium text-[11px]">Unscheduled</span>
                        )}
                      </td>

                      {/* 5. Assigned Panel Member */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-800">{panel}</span>
                      </td>

                      {/* 6. Technical Score */}
                      <td className="py-3.5 px-4 text-center">
                        {score > 0 ? (
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                            score >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            score >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {score} / 100
                          </span>
                        ) : (
                          <span className="text-gray-400 font-mono text-xs">-- / 100</span>
                        )}
                      </td>

                      {/* 7. Readiness Status */}
                      <td className="py-3.5 px-4 text-center">
                        {status === 'CLEARED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Cleared for Visa</span>
                          </span>
                        )}
                        {status === 'SCHEDULED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Scheduled</span>
                          </span>
                        )}
                        {status === 'RETEST_HOLD' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                            <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Retest / Hold</span>
                          </span>
                        )}
                        {status === 'PENDING_VERIFICATION' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </td>

                      {/* 8. Action */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEval(lead)}
                            className="h-8 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer active:scale-[0.98]"
                            title="Evaluate candidate in trade viva"
                          >
                            <Sliders className="w-3 h-3 text-purple-600" />
                            <span>{score > 0 ? 'Edit Score' : 'Evaluate'}</span>
                          </button>

                          <button
                            onClick={() => setHistoryCandidate(lead)}
                            className="h-8 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="View Full Candidate Audit History"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>History</span>
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

      {/* 5. Evaluation & Clearance Modal */}
      {evalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Pre-Viva Evaluation & Score</h3>
                <p className="text-[11px] text-gray-500">Assess candidate trade readiness & oral comprehension</p>
              </div>
              <button 
                onClick={() => setEvalModal(null)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitEval} className="p-5 space-y-4">
              
              {/* Candidate Info Box */}
              <div className="bg-gray-50 p-3 rounded-xl text-xs border border-gray-200/70">
                <div className="font-bold text-gray-900">{evalModal.candidateName} • {evalModal.trade || evalModal.applicationForm?.trade || 'Worker'}</div>
                <div className="text-gray-500 font-mono mt-0.5">
                  Passport: {evalModal.passportNumber || 'N/A'} • Target: {evalModal.locationConfirmation?.confirmedLocation || 'Gulf'}
                </div>
              </div>

              {/* Score Slider & Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Technical Viva Score (0 - 100) *
                  </label>
                  <span className="font-mono font-bold text-sm text-purple-700">{evalScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={evalScore}
                  onChange={(e) => setEvalScore(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Decision Radio */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Readiness Verdict *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    evalDecision === 'CLEARED' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="CLEARED"
                      checked={evalDecision === 'CLEARED'}
                      onChange={() => setEvalDecision('CLEARED')}
                      className="text-emerald-600"
                    />
                    <span className="text-xs">Cleared for Visa</span>
                  </label>

                  <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    evalDecision === 'RETEST_HOLD' ? 'border-red-500 bg-red-50 text-red-900 font-bold' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="RETEST_HOLD"
                      checked={evalDecision === 'RETEST_HOLD'}
                      onChange={() => setEvalDecision('RETEST_HOLD')}
                      className="text-red-600"
                    />
                    <span className="text-xs">Retest / Hold</span>
                  </label>
                </div>
              </div>

              {/* Panel Member */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Assigned Panel Assessor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eng. Rajesh Verma"
                  value={evalPanelMember}
                  onChange={(e) => setEvalPanelMember(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Assessor Feedback & Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Good command of Gulf trade standards, cleared for embassy submission..."
                  value={evalRemarks}
                  onChange={(e) => setEvalRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEvalModal(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                  <span>Save Evaluation</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. Candidate Full Lifecycle Audit Trail Modal */}
      <LeadHistoryModal
        isOpen={!!historyCandidate}
        onClose={() => setHistoryCandidate(null)}
        candidate={historyCandidate}
      />

    </div>
  );
}
