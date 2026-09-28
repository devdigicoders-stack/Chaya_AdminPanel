import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ban, ChevronRight, CheckCircle2, ShieldAlert, Search, 
  RotateCcw, Eye, UserX, Printer, ShieldCheck, Download, 
  AlertCircle, Calendar, Clock, RefreshCw, Loader2, History, 
  Phone, Mail, MapPin, Building2, X, Check, HeartPulse, UserCheck, 
  PlusCircle, AlertTriangle, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiTransferLeadStage, apiToggleLeadHold } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function BlacklistedCandidates() {
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
  const [showMarkModal, setShowMarkModal] = useState(false);

  // Mark Form State
  const [markForm, setMarkForm] = useState({
    candidateId: '',
    category: 'GAMCA_MEDICAL_UNFIT',
    severity: 'DISQUALIFIED',
    reason: 'GAMCA Medical Exam Unfit: Hepatitis / Clinical lab reactive',
    detailedNotes: ''
  });
  const [markingSubmitting, setMarkingSubmitting] = useState(false);

  // Fetch Unfit & Blacklisted Candidates from MongoDB Atlas
  const fetchBlacklistedCandidates = async () => {
    setLoading(true);
    setError('');
    try {
      const [blacklistedRes, allRes] = await Promise.allSettled([
        apiGetLeads({ blacklistedDesk: 'true' }),
        apiGetLeads({ stage: 'ALL' })
      ]);

      if (blacklistedRes.status === 'fulfilled' && blacklistedRes.value?.data) {
        setCandidates(blacklistedRes.value.data);
      }

      if (allRes.status === 'fulfilled' && allRes.value?.data) {
        setAllLeads(allRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load unfit candidates:', err);
      setError(err.message || 'Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklistedCandidates();
  }, []);

  // Real-time Dynamic Metrics computed from MongoDB data
  const metrics = useMemo(() => {
    const total = candidates.length;
    let gamcaUnfit = 0;
    let interviewFailed = 0;
    let regulatoryBlacklisted = 0;
    let appealable = 0;

    candidates.forEach(c => {
      const medStatus = c.medicalDetails?.status || '';
      const intStatus = c.initialInterview?.status || '';
      const vivaStatus = c.placementDetails?.vivaResult?.status || '';
      const reason = (c.holdReason || c.notes || '').toLowerCase();

      if (medStatus === 'UNFIT' || reason.includes('medical') || reason.includes('gamca') || reason.includes('hepatitis')) {
        gamcaUnfit++;
      } else if (intStatus === 'FAIL' || vivaStatus === 'NOT_SELECTED' || reason.includes('interview') || reason.includes('trade test')) {
        interviewFailed++;
      } else if (reason.includes('fake') || reason.includes('fraud') || reason.includes('ban') || reason.includes('forged')) {
        regulatoryBlacklisted++;
      } else {
        gamcaUnfit++;
      }

      // Appealable candidates (can be cured or re-tested in alternative trade)
      if (!reason.includes('fake') && !reason.includes('forged') && !reason.includes('fraud')) {
        appealable++;
      }
    });

    return { total, gamcaUnfit, interviewFailed, regulatoryBlacklisted, appealable };
  }, [candidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const medStatus = c.medicalDetails?.status || '';
      const intStatus = c.initialInterview?.status || '';
      const vivaStatus = c.placementDetails?.vivaResult?.status || '';
      const reason = (c.holdReason || c.notes || '').toLowerCase();

      if (filterTab === 'GAMCA_UNFIT') {
        if (medStatus !== 'UNFIT' && !reason.includes('medical') && !reason.includes('gamca') && !reason.includes('hepatitis')) return false;
      } else if (filterTab === 'INTERVIEW_FAIL') {
        if (intStatus !== 'FAIL' && vivaStatus !== 'NOT_SELECTED' && !reason.includes('interview') && !reason.includes('trade test')) return false;
      } else if (filterTab === 'BLACKLISTED') {
        if (!reason.includes('fake') && !reason.includes('fraud') && !reason.includes('ban') && !reason.includes('forged')) return false;
      } else if (filterTab === 'APPEALABLE') {
        if (reason.includes('fake') || reason.includes('fraud') || reason.includes('forged')) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (c.candidateName || '').toLowerCase();
        const passport = (c.passportNumber || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const trade = (c.trade || '').toLowerCase();
        const leadId = (c.leadId || '').toLowerCase();

        if (!name.includes(q) && !passport.includes(q) && !phone.includes(q) && !trade.includes(q) && !leadId.includes(q) && !reason.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, searchTerm, filterTab]);

  // Appeal / Re-screen Candidate (FRD Section 10 & 11)
  const handleAppealCandidate = async (candidate) => {
    const isMedUnfit = candidate.medicalDetails?.status === 'UNFIT';

    const { value: targetStage } = await Swal.fire({
      title: `Appeal / Re-screen Candidate?`,
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5;">
          <p>Candidate: <b>${candidate.candidateName}</b> (${candidate.passportNumber || candidate.leadId})</p>
          <p style="color: #64748b; margin-top: 6px;">Select re-screening destination upon medical cure or trade appeal:</p>
        </div>
      `,
      input: 'select',
      inputOptions: isMedUnfit ? {
        'MEDICAL_PROCESS': '05. Medical Process (Retest GAMCA Medical Appointment)',
        'CALLING_SCREENING': '03. Calling & Screening Queue (Re-evaluate)',
        'INITIAL_INTERVIEW': '04. Interview Panel (Alternative Trade Re-screen)'
      } : {
        'INITIAL_INTERVIEW': '04. Interview Panel (Retake Technical Interview)',
        'CALLING_SCREENING': '03. Calling & Screening Queue (Alternative Trade Assignment)',
        'STAFF_HEAD_HANDLING': '02. Staff Head Desk (Review & Reassignment)'
      },
      inputValue: isMedUnfit ? 'MEDICAL_PROCESS' : 'INITIAL_INTERVIEW',
      showCancelButton: true,
      confirmButtonText: 'Submit Appeal & Reopen',
      confirmButtonColor: '#2563eb',
      cancelButtonText: 'Cancel'
    });

    if (!targetStage) return;

    setActionLoadingId(candidate._id);
    try {
      const res = await apiTransferLeadStage(candidate._id, {
        toStage: targetStage,
        remarks: `Candidate successfully appealed and approved for re-screening in ${targetStage.replace(/_/g, ' ')}. Prior quarantine cleared.`
      });

      if (res?.success) {
        if (candidate.isHold) {
          await apiToggleLeadHold(candidate._id, false, 'Hold released following approved appeal');
        }

        Swal.fire({
          icon: 'success',
          title: 'Appeal Approved!',
          text: `${candidate.candidateName} has been transferred to ${targetStage.replace(/_/g, ' ')}.`,
          confirmButtonColor: '#2563eb',
          timer: 2500
        });

        fetchBlacklistedCandidates();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Appeal Failed',
        text: err.message || 'Could not process appeal.',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark Candidate as Unfit / Blacklisted
  const handleMarkCandidate = async (e) => {
    e.preventDefault();
    if (!markForm.candidateId) {
      Swal.fire({ icon: 'warning', title: 'Candidate Required', text: 'Please select a candidate to mark as unfit/blacklisted.' });
      return;
    }

    setMarkingSubmitting(true);
    try {
      const remarks = `Disqualification: [${markForm.category}] ${markForm.reason}. ${markForm.detailedNotes || ''}`.trim();
      
      const res = await apiTransferLeadStage(markForm.candidateId, {
        toStage: 'REJECTED',
        remarks
      });

      if (res?.success) {
        // Enforce administrative hold
        await apiToggleLeadHold(markForm.candidateId, true, remarks);

        Swal.fire({
          icon: 'success',
          title: 'Candidate Disqualified',
          text: 'Candidate status set to REJECTED with administrative quarantine lock.',
          confirmButtonColor: '#2563eb'
        });

        setShowMarkModal(false);
        setMarkForm({
          candidateId: '',
          category: 'GAMCA_MEDICAL_UNFIT',
          severity: 'DISQUALIFIED',
          reason: 'GAMCA Medical Exam Unfit: Hepatitis / Clinical lab reactive',
          detailedNotes: ''
        });
        fetchBlacklistedCandidates();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err.message || 'Could not mark candidate.'
      });
    } finally {
      setMarkingSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (candidates.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'No disqualified records to export.' });
      return;
    }

    const headers = ['Lead ID', 'Candidate Name', 'Passport Number', 'Phone', 'Trade', 'Stage', 'Reason', 'Disqualified Date'];
    const rows = candidates.map(c => [
      c.leadId || '',
      `"${c.candidateName || ''}"`,
      `"${c.passportNumber || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.trade || ''}"`,
      `"${c.currentStage || ''}"`,
      `"${(c.holdReason || c.notes || 'Unfit / Disqualified').replace(/"/g, '""')}"`,
      `"${c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Chhaya_Unfit_Blacklisted_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCandidatesList = allLeads.filter(l => l.currentStage !== 'REJECTED' && l.currentStage !== 'CANCELLED');

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
            <span className="text-gray-900 font-medium">Unfit & Rejected Registry</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Unfit & Disqualified Registry
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              FRD Section 10 & 11 Compliance
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
            onClick={() => setShowMarkModal(true)}
            className="h-9 px-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Mark Unfit / Blacklist</span>
          </button>

          <button
            onClick={fetchBlacklistedCandidates}
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

        {/* Total Disqualified */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Total Disqualified</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Quarantined records</div>
          </div>
        </div>

        {/* GAMCA Medical Unfit */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700">GAMCA Unfit</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-orange-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.gamcaUnfit}
            </div>
            <div className="text-[11px] text-orange-600 font-medium mt-1">Hepatitis / Lab failure</div>
          </div>
        </div>

        {/* Interview / Viva Failed */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Interview Failed</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-blue-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.interviewFailed}
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">Trade test rejected</div>
          </div>
        </div>

        {/* Appeal & Retest Eligible */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Appeal Potential</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.appealable}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Eligible for re-screening</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Disqualified', count: metrics.total },
              { key: 'GAMCA_UNFIT', label: 'GAMCA Unfit', count: metrics.gamcaUnfit },
              { key: 'INTERVIEW_FAIL', label: 'Interview Failed', count: metrics.interviewFailed },
              { key: 'BLACKLISTED', label: 'Blacklisted & Fraud', count: metrics.regulatoryBlacklisted },
              { key: 'APPEALABLE', label: 'Appeal Eligible', count: metrics.appealable },
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
                  filterTab === tab.key ? 'bg-orange-50 text-orange-700' : 'bg-gray-200/80 text-gray-600'
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
              placeholder="Search candidate, passport, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Live Unfit / Disqualified Roster Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Trade</th>
                <th className="py-3 px-4">Disqualification Category & Reason</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-600 mb-2" />
                    <span>Loading disqualified registry from database...</span>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">Clean Registry</p>
                    <p className="text-[11px] text-gray-400 mt-1">No candidates currently in this disqualified/unfit category.</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const medStatus = candidate.medicalDetails?.status || '';
                  const intStatus = candidate.initialInterview?.status || '';
                  const reason = candidate.holdReason || candidate.notes || 'Disqualified per recruitment audit';
                  const isActing = actionLoadingId === candidate._id;

                  // Determine Category Badge
                  let badge = { label: 'DISQUALIFIED', color: 'bg-rose-50 text-rose-700 border-rose-200' };
                  if (medStatus === 'UNFIT') {
                    badge = { label: 'GAMCA UNFIT', color: 'bg-orange-50 text-orange-700 border-orange-200' };
                  } else if (intStatus === 'FAIL') {
                    badge = { label: 'INTERVIEW FAILED', color: 'bg-blue-50 text-blue-700 border-blue-200' };
                  } else if (reason.toLowerCase().includes('fake') || reason.toLowerCase().includes('fraud')) {
                    badge = { label: 'REGULATORY BLACKLIST', color: 'bg-red-50 text-red-800 border-red-300' };
                  }

                  return (
                    <tr key={candidate._id} className="hover:bg-orange-50/20 transition-colors">
                      
                      {/* Candidate Name & Passport */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
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

                      {/* Trade */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{candidate.trade || 'General Worker'}</div>
                        <div className="text-[11px] text-gray-400 font-medium">
                          {candidate.country || 'Gulf Region'}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 max-w-sm truncate">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="font-medium text-gray-800 truncate" title={reason}>
                          {reason}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Ban className="w-3 h-3" />
                          QUARANTINE
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
                            title="View Lifecycle Audit Trail"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleAppealCandidate(candidate)}
                            disabled={isActing}
                            className="h-7 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            title="Appeal / Re-screen Candidate"
                          >
                            {isActing ? (
                              <Loader2 className="w-3 h-3 animate-spin text-blue-700" />
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3 text-blue-600" />
                                <span>Appeal</span>
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

      {/* 5. Mark Candidate as Unfit / Blacklist Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden my-6">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-950 text-white">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-[15px] text-white">Quarantine / Blacklist Candidate</h3>
              </div>
              <button
                onClick={() => setShowMarkModal(false)}
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMarkCandidate} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Select Candidate from Active Pool <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={markForm.candidateId}
                  onChange={(e) => setMarkForm({ ...markForm, candidateId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Choose Candidate --</option>
                  {activeCandidatesList.map(l => (
                    <option key={l._id} value={l._id}>
                      {l.candidateName} • {l.passportNumber || l.leadId} ({l.trade || 'General'} - Stage: {l.currentStage})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Disqualification Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={markForm.category}
                  onChange={(e) => setMarkForm({ ...markForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                >
                  <option value="GAMCA_MEDICAL_UNFIT">GAMCA Medical Exam Failure (Unfit Clinic Test)</option>
                  <option value="INTERVIEW_FAILED">Technical Trade Test / Interview Failed</option>
                  <option value="FORGED_DOCUMENTS">Forged Experience Certificate / Fraudulent Documents</option>
                  <option value="REGULATORY_BLACKLIST">Passport Impersonation / Regulatory Ban</option>
                  <option value="DISCIPLINARY">Disciplinary Exclusion / Unprofessional Conduct</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Primary Disqualification Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hepatitis B positive in GAMCA lab test / Failed 6G pipe welding test"
                  value={markForm.reason}
                  onChange={(e) => setMarkForm({ ...markForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Clinical / Evaluator Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter doctor report slip number, clinic name, or interviewer test remarks..."
                  value={markForm.detailedNotes}
                  onChange={(e) => setMarkForm({ ...markForm, detailedNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowMarkModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markingSubmitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {markingSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Quarantine Candidate</span>
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
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-[15px] text-white">Disqualified Candidate Dossier</h3>
              </div>
              <button
                onClick={() => setDossierCandidate(null)}
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <div className="w-12 h-12 rounded-xl bg-orange-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
                  {(dossierCandidate.candidateName || 'C').charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{dossierCandidate.candidateName}</h4>
                  <p className="text-gray-500 font-mono">{dossierCandidate.leadId} • {dossierCandidate.passportNumber || 'No Passport'}</p>
                  <p className="text-orange-700 font-semibold mt-0.5">● Status: QUARANTINED / REJECTED</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-gray-700">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10.5px] text-gray-400 block font-medium">Candidate Phone</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">{dossierCandidate.phone}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10.5px] text-gray-400 block font-medium">Trade & Role</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">{dossierCandidate.trade || 'General'}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10.5px] text-gray-400 block font-medium">GAMCA Medical Status</span>
                  <span className={`font-bold mt-0.5 block ${dossierCandidate.medicalDetails?.status === 'UNFIT' ? 'text-rose-600' : 'text-gray-900'}`}>
                    {dossierCandidate.medicalDetails?.status || 'PENDING'}
                  </span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[10.5px] text-gray-400 block font-medium">Technical Interview</span>
                  <span className={`font-bold mt-0.5 block ${dossierCandidate.initialInterview?.status === 'FAIL' ? 'text-rose-600' : 'text-gray-900'}`}>
                    {dossierCandidate.initialInterview?.status || 'NOT RECORDED'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide block mb-1">
                  Disqualification Remarks & Reason:
                </span>
                <p className="text-gray-700 leading-relaxed font-mono">
                  {dossierCandidate.holdReason || dossierCandidate.notes || 'Quarantined in compliance audit.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const c = dossierCandidate;
                    setDossierCandidate(null);
                    handleAppealCandidate(c);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Appeal / Re-screen Candidate</span>
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
