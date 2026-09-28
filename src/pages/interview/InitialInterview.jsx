import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, ChevronRight, CheckCircle2, XCircle, FileText, Award,
  Eye, ThumbsUp, ThumbsDown, ShieldAlert, Clock, MapPin, Phone, Search,
  Sparkles, Briefcase, RefreshCw, X, RotateCcw, Send, ShieldCheck,
  User, Check, Globe
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  apiGetLeads,
  apiGetUsers,
  apiSubmitInterviewResult,
  apiTransferLeadStage,
  apiGetLeadById
} from '../../utils/api';

export default function InitialInterview() {
  const navigate = useNavigate();

  // Database States
  const [candidates, setCandidates] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [resultFilter, setResultFilter] = useState('ALL'); // ALL | PENDING | PASS | FAIL
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [evalModal, setEvalModal] = useState(null);
  const [evalResult, setEvalResult] = useState('PASS');
  const [evalRemarks, setEvalRemarks] = useState('');
  const [evalScore, setEvalScore] = useState('Grade A (Passed)');

  const [detailCandidate, setDetailCandidate] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 1. Fetch live interview candidates from MongoDB Atlas
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.allSettled([
        apiGetLeads({
          stage: 'INITIAL_INTERVIEW',
          callingStaff: staffFilter !== 'ALL' ? staffFilter : undefined,
          search: searchQuery.trim() || undefined
        }),
        apiGetUsers()
      ]);

      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        setCandidates(leadsRes.value.data);
      } else {
        setCandidates([]);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        const callingStaff = usersRes.value.data.filter(
          u => u.role === 'CALLING_STAFF' && u.isActive !== false
        );
        setStaffList(callingStaff);
      }
    } catch (err) {
      console.error('Failed to load initial interview queue', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Candidates',
        text: 'Failed to retrieve candidates from database.',
        confirmButtonColor: '#2563EB'
      });
    } finally {
      setLoading(false);
    }
  }, [staffFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute Live Metrics
  const metrics = useMemo(() => {
    const total = candidates.length;
    const passed = candidates.filter(c => c.initialInterview?.status === 'PASS').length;
    const failed = candidates.filter(c => c.initialInterview?.status === 'FAIL').length;
    const pending = candidates.filter(c => !c.initialInterview?.status || c.initialInterview?.status === 'PENDING').length;

    return { total, passed, failed, pending };
  }, [candidates]);

  // 2. Open Evaluation Modal
  const handleOpenEvalModal = (candidate) => {
    setEvalModal(candidate);
    setEvalResult('PASS');
    setEvalRemarks('');
    setEvalScore('Grade A (Passed)');
  };

  // Submit Evaluation (PASS moves to MEDICAL_PROCESS per FRD Section 10)
  const handleApplyEvaluation = async (e) => {
    e.preventDefault();
    if (!evalModal) return;

    setActionLoading(true);
    try {
      await apiSubmitInterviewResult(evalModal._id, {
        interviewType: 'INITIAL',
        status: evalResult,
        remarks: `${evalScore} - ${evalRemarks.trim() || 'Technical evaluation completed'}`
      });

      Swal.fire({
        icon: evalResult === 'PASS' ? 'success' : 'info',
        title: evalResult === 'PASS' ? 'Candidate PASSED Interview!' : 'Candidate Marked as FAIL',
        html: evalResult === 'PASS'
          ? `Candidate <b>${evalModal.candidateName}</b> passed technical trade assessment.<br>
             <span class="text-xs text-emerald-700 font-bold block mt-1">Automatically transferred to Step 05: Medical Process (FRD Section 10).</span>`
          : `Candidate <b>${evalModal.candidateName}</b> marked as Failed.<br>
             <span class="text-xs text-rose-600 block mt-1">Lead moved to Rejected status.</span>`,
        confirmButtonColor: '#2563EB'
      });

      setEvalModal(null);
      setEvalRemarks('');
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Evaluation Failed',
        text: err.message || 'Could not record interview result.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Direct CV Selection (FRD Section 09: Bypasses interview and moves straight to Medical)
  const handleDirectCvSelect = async (candidate) => {
    const confirm = await Swal.fire({
      title: 'Approve via CV Selection?',
      html: `Candidate <b>${candidate.candidateName}</b> (${candidate.leadId}) will bypass the interview bench and be approved directly by CV.<br><br>
             <span class="text-xs text-emerald-700 font-bold">Candidate will immediately move to Step 05: Medical & Payment Booking (FRD Section 09).</span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Approve by CV'
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiTransferLeadStage(candidate._id, {
        fromStage: 'INITIAL_INTERVIEW',
        toStage: 'MEDICAL_PROCESS',
        selectionMode: 'DIRECT_CV',
        remarks: 'Candidate approved directly via CV selection by Interview Bench'
      });

      Swal.fire({
        icon: 'success',
        title: 'Approved by CV Selection!',
        html: `Candidate <b>${candidate.candidateName}</b> moved to <b>Medical Process</b>.`,
        confirmButtonColor: '#2563EB'
      });

      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: err.message,
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // 4. Open Candidate Details & Audit Drawer
  const handleOpenDetails = async (candidate) => {
    setDetailLoading(true);
    setDetailCandidate(candidate);
    try {
      const res = await apiGetLeadById(candidate._id);
      if (res?.data) {
        setDetailCandidate(res.data);
      }
    } catch (err) {
      console.error('Failed to load candidate details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const resetFilters = () => {
    setResultFilter('ALL');
    setStaffFilter('ALL');
    setSearchQuery('');
  };

  const isFilterActive = resultFilter !== 'ALL' || staffFilter !== 'ALL' || searchQuery;

  // Filtered List
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const status = c.initialInterview?.status || 'PENDING';
      if (resultFilter === 'PENDING' && status !== 'PENDING') return false;
      if (resultFilter === 'PASS' && status !== 'PASS') return false;
      if (resultFilter === 'FAIL' && status !== 'FAIL') return false;
      return true;
    });
  }, [candidates, resultFilter]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Interview Panel</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Initial Technical Assessment</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Interview Panel & Assessment
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/interview/final')}
            className="h-9 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Go to Final Interview Desk"
          >
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span>Final Confirmations</span>
          </button>

          <button
            onClick={() => navigate('/medical/all')}
            className="h-9 px-3 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Go to Medical Desk"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Medical Desk</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Interview Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        
        {/* Card 1: Total in Interview Bench */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total in Bench</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Candidates for technical test</div>
          </div>
        </div>

        {/* Card 2: Passed Assessment */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Interview Passed</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-700 font-mono leading-none">
              {metrics.passed}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">Eligible for Medical</div>
          </div>
        </div>

        {/* Card 3: Failed / Rejected */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-rose-700">Interview Failed</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-rose-700 font-mono leading-none">
              {metrics.failed}
            </div>
            <div className="text-[11px] text-rose-600/80 mt-1 font-medium">Closed / Rejected</div>
          </div>
        </div>

        {/* Card 4: Pending Evaluation */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Pending Evaluation</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-700 font-mono leading-none">
              {metrics.pending}
            </div>
            <div className="text-[11px] text-amber-600/80 mt-1 font-medium">Awaiting panel assessment</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Toolbar & Search */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 mb-5 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            {[
              { id: 'ALL', label: 'All Candidates', count: metrics.total },
              { id: 'PENDING', label: 'Pending Evaluation', count: metrics.pending },
              { id: 'PASS', label: 'Passed Assessment', count: metrics.passed },
              { id: 'FAIL', label: 'Failed Assessment', count: metrics.failed },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setResultFilter(tab.id)}
                className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  resultFilter === tab.id
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${
                  resultFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Staff Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Calling Staff Selector */}
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-700 focus:outline-none focus:border-purple-500 cursor-pointer min-w-[150px]"
            >
              <option value="ALL">All Calling Officers</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate, trade, passport, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-purple-500 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Reset Button */}
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-[12px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 4. Candidates Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        
        {/* Table Header Summary */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-gray-900 text-[15px]">
              Candidates Scheduled for Interview
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
              {filteredCandidates.length} Candidates
            </span>
          </div>

          <div className="text-[11.5px] text-gray-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>FRD Rule: Pass results proceed to Step 05 Medical Process</span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
            <span className="text-[13px] font-medium text-gray-600">Loading interview queue from database...</span>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-[15px]">No Candidates in Queue</h4>
            <p className="text-[12.5px] text-gray-500 mt-1 mb-4 leading-relaxed">
              There are currently no candidates in the initial interview queue matching your filter.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[12px] font-bold cursor-pointer transition-colors shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1050px] text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                  <th className="py-3.5 px-4 whitespace-nowrap">Candidate & ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Contact & Origin</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Trade & Experience</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Calling Staff</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Evaluation Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Panel Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCandidates.map((candidate) => {
                  const initial = candidate.candidateName?.charAt(0) || 'C';
                  const status = candidate.initialInterview?.status || 'PENDING';
                  const staffName = candidate.assignedCallingStaff?.name || 'Unassigned';
                  const expYears = candidate.applicationForm?.experienceYears || 'Fresher';

                  return (
                    <tr
                      key={candidate._id}
                      className="hover:bg-purple-50/20 transition-colors"
                    >
                      {/* 1. Candidate & ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 text-[11px] font-black flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div 
                              onClick={() => handleOpenDetails(candidate)}
                              className="font-bold text-gray-900 text-[13px] hover:text-purple-600 hover:underline cursor-pointer"
                            >
                              {candidate.candidateName}
                            </div>
                            <div className="font-mono text-[10.5px] text-purple-600 font-semibold flex items-center gap-1">
                              <span>{candidate.leadId}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-600">{candidate.passportNumber || 'No Passport'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact & Origin */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-gray-800 text-[12px] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{candidate.phone}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 pl-5">
                          {candidate.city || candidate.state || 'India'}
                        </div>
                      </td>

                      {/* 3. Trade & Experience */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800 text-[12.5px] max-w-[180px] truncate" title={candidate.trade}>
                          {candidate.trade || 'General Worker'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium">
                          Exp: {expYears} yrs • Mode: {candidate.selectionMode || 'INTERVIEW'}
                        </div>
                      </td>

                      {/* 4. Calling Staff */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0">
                            {staffName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[12px]">{staffName}</div>
                            <div className="text-[10px] text-gray-400">Assigned Officer</div>
                          </div>
                        </div>
                      </td>

                      {/* 5. Evaluation Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {status === 'PASS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Passed (Medical Ready)</span>
                          </span>
                        ) : status === 'FAIL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Failed (Rejected)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Evaluation</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Panel Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Evaluate Candidate Button */}
                          <button
                            onClick={() => handleOpenEvalModal(candidate)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11.5px] font-bold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1"
                            title="Conduct Technical Evaluation (Pass / Fail)"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Evaluate</span>
                          </button>

                          {/* Direct CV Select Button */}
                          <button
                            onClick={() => handleDirectCvSelect(candidate)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11.5px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                            title="Approve directly by CV without interview (FRD Section 09)"
                          >
                            <Check className="w-3 h-3" />
                            <span>CV Select</span>
                          </button>

                          {/* View Details */}
                          <button
                            onClick={() => handleOpenDetails(candidate)}
                            className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl cursor-pointer"
                            title="View Full Profile & History"
                          >
                            <Eye className="w-4 h-4" />
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

        {/* Footer */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500 flex-wrap gap-2">
          <span>Showing <b>{filteredCandidates.length}</b> candidates in Technical Bench queue</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Need to check post-medical confirmations?</span>
            <button
              onClick={() => navigate('/interview/final')}
              className="text-purple-600 hover:underline font-bold cursor-pointer flex items-center gap-0.5"
            >
              <span>Go to Final Interview Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Evaluation Modal (Pass / Fail per FRD Section 10) */}
      {evalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-900 text-white">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-purple-300" />
                <div>
                  <h3 className="font-bold text-[16px]">Technical Evaluation & Result</h3>
                  <p className="text-[11px] text-purple-200 font-medium">FRD Section 10 • Pass transfers to Medical</p>
                </div>
              </div>
              <button 
                onClick={() => setEvalModal(null)} 
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyEvaluation} className="p-6 space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[12.5px] space-y-0.5">
                <div>Candidate: <strong>{evalModal.candidateName}</strong> ({evalModal.leadId})</div>
                <div>Trade Skill: <strong className="text-purple-800">{evalModal.trade || 'General Worker'}</strong></div>
                <div className="text-gray-500 text-[11.5px]">Passport: {evalModal.passportNumber || 'N/A'} • Phone: {evalModal.phone}</div>
              </div>

              {/* Evaluation Outcome: Pass vs Fail */}
              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Evaluation Result *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    evalResult === 'PASS' ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold' : 'border-gray-200 text-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="evalResult"
                      value="PASS"
                      checked={evalResult === 'PASS'}
                      onChange={() => setEvalResult('PASS')}
                      className="text-emerald-600"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PASS Assessment</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    evalResult === 'FAIL' ? 'border-rose-500 bg-rose-50/50 text-rose-800 font-bold' : 'border-gray-200 text-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="evalResult"
                      value="FAIL"
                      checked={evalResult === 'FAIL'}
                      onChange={() => setEvalResult('FAIL')}
                      className="text-rose-600"
                    />
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>FAIL Assessment</span>
                  </label>
                </div>
              </div>

              {/* Score / Grade Selector */}
              {evalResult === 'PASS' && (
                <div>
                  <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Technical Bench Grade
                  </label>
                  <select
                    value={evalScore}
                    onChange={(e) => setEvalScore(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-purple-500 bg-white cursor-pointer"
                  >
                    <option value="Grade A+ (Expert Gulf Certified)">Grade A+ (Expert Gulf Certified)</option>
                    <option value="Grade A (Passed with Distinction)">Grade A (Passed with Distinction)</option>
                    <option value="Grade B (Satisfactory Trade Skill)">Grade B (Satisfactory Trade Skill)</option>
                    <option value="Grade C (Basic Helper / Assistant)">Grade C (Basic Helper / Assistant)</option>
                  </select>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Interview Remarks & Technical Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Performed 6G welding pipe beveling, verified GCC driving license, good language..."
                  value={evalRemarks}
                  onChange={(e) => setEvalRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEvalModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2.5 rounded-xl text-[12.5px] font-bold text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                    evalResult === 'PASS' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionLoading ? 'Saving...' : evalResult === 'PASS' ? 'Confirm PASS & Move to Medical' : 'Confirm FAIL & Close'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 6. Candidate Full Detail Drawer */}
      {detailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-[13px] flex items-center justify-center">
                  {detailCandidate.candidateName?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-[16px]">{detailCandidate.candidateName}</h3>
                  <p className="text-[11.5px] text-purple-300 font-mono">
                    {detailCandidate.leadId} • {detailCandidate.passportNumber || 'No Passport'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDetailCandidate(null)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Phone Number</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5 font-mono">{detailCandidate.phone}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Trade Skill</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.trade || 'General Worker'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Calling Officer</div>
                  <div className="font-bold text-purple-700 text-[13px] mt-0.5">
                    {detailCandidate.assignedCallingStaff?.name || 'Unassigned'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Interview Status</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.initialInterview?.status || 'PENDING'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Selection Mode</div>
                  <div className="font-bold text-purple-700 text-[13px] mt-0.5 font-mono">
                    {detailCandidate.selectionMode || 'INTERVIEW'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Workflow Stage</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.currentStage?.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* History Log */}
              <div>
                <h4 className="font-bold text-gray-900 text-[13.5px] flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Immutable Evaluation & Audit Trail</span>
                </h4>

                {detailLoading ? (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-purple-600" />
                    Loading audit trail...
                  </div>
                ) : !detailCandidate.history || detailCandidate.history.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500 text-xs">
                    No history logs recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {detailCandidate.history.map((h, i) => (
                      <div key={h._id || i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px]">
                        <div className="flex items-center justify-between text-gray-500 mb-1">
                          <span className="font-bold text-purple-800 font-mono text-[11px] bg-purple-100 px-2 py-0.5 rounded">
                            {h.actionType?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(h.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-gray-800 font-medium">{h.remarks}</div>
                        {h.performedBy && (
                          <div className="text-[10.5px] text-gray-400 mt-1">
                            Logged by: <b>{h.performedBy.name || 'User'}</b> ({h.performedBy.role || 'Staff'})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end shrink-0">
              <button
                onClick={() => setDetailCandidate(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[12px] font-bold cursor-pointer"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
