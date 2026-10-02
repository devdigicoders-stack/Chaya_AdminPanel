import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, ChevronRight, CheckCircle2, PauseCircle, ArrowRightLeft,
  Send, Search, Building2, Globe, Wrench, ShieldAlert, Lock, Unlock,
  PlayCircle, Sparkles, ShieldCheck, ArrowLeft, ArrowRight, RefreshCw,
  Phone, User, Clock, AlertTriangle, Layers, Eye, X, Filter, CheckSquare,
  Square, FileText, CreditCard, Stethoscope, BadgeCheck, Users, MapPin,
  Calendar, RotateCcw
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  apiGetLeads,
  apiGetUsers,
  apiReassignCallingStaff,
  apiBulkReassignCallingStaff,
  apiToggleLeadHold,
  apiTransferLeadStage,
  apiGetLeadById
} from '../../utils/api';

const STAGE_FILTERS = [
  { value: 'ALL', label: 'All Handled Files' },
  { value: 'STAFF_HEAD_HANDLING', label: 'Staff Head Desk (Post-Medical)' },
  { value: 'CALLING_SCREENING', label: 'In Calling Queue (Screening/Location)' },
  { value: 'MEDICAL_PROCESS', label: 'Medical Verification (GAMCA)' },
  { value: 'ACCOUNTS_COLLECTION', label: 'Payment Booking / Bill Book' },
  { value: 'PRE_VISA', label: 'Pre-Viva Verification Desk' },
];

export default function StaffHeadHandling() {
  const navigate = useNavigate();

  // Live Database States
  const [candidates, setCandidates] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [holdFilter, setHoldFilter] = useState('ALL');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers
  const [swapModal, setSwapModal] = useState(null); // Candidate to swap
  const [swapTargetStaff, setSwapTargetStaff] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [swapTargetStage, setSwapTargetStage] = useState('CALLING_SCREENING');

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTargetStaff, setBulkTargetStaff] = useState('');
  const [bulkReason, setBulkReason] = useState('');

  const [forwardModal, setForwardModal] = useState(null); // Candidate to forward
  const [forwardTargetStage, setForwardTargetStage] = useState('CALLING_SCREENING');
  const [forwardRemarks, setForwardRemarks] = useState('');

  const [detailCandidate, setDetailCandidate] = useState(null); // Full detail drawer
  const [detailLoading, setDetailLoading] = useState(false);

  // 1. Fetch live candidates and calling staff from MongoDB Atlas
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.allSettled([
        apiGetLeads({
          stage: stageFilter !== 'ALL' ? stageFilter : undefined,
          callingStaff: staffFilter !== 'ALL' ? staffFilter : undefined,
          isHold: holdFilter === 'HOLD' ? 'true' : holdFilter === 'ACTIVE' ? 'false' : undefined,
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
      console.error('Failed to load staff head candidate handling data', err);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to load candidates from database.',
        confirmButtonColor: '#2563EB'
      });
    } finally {
      setLoading(false);
    }
  }, [stageFilter, staffFilter, holdFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute Live Statistics from Candidate List
  const stats = useMemo(() => {
    const total = candidates.length;
    const postMedicalReady = candidates.filter(
      c => c.currentStage === 'STAFF_HEAD_HANDLING' || c.medicalDetails?.status === 'FIT'
    ).length;
    const inCalling = candidates.filter(c => c.currentStage === 'CALLING_SCREENING').length;
    const onHold = candidates.filter(c => c.isHold).length;
    const activeStaffCount = staffList.length;

    return {
      total,
      postMedicalReady,
      inCalling,
      onHold,
      activeStaffCount
    };
  }, [candidates, staffList]);

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(candidates.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // 2. Swap Single Calling Staff (FRD Section 12 Reassignment)
  const handleApplySwap = async (e) => {
    e.preventDefault();
    if (!swapModal || !swapTargetStaff) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Calling Staff',
        text: 'Please select the new Calling Officer to assign.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }
    if (!swapReason.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Reason Required',
        text: 'Per FRD Section 12, a valid reason for staff swap must be recorded in the audit trail.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    const newStaff = staffList.find(s => s._id === swapTargetStaff);
    const oldStaffName = swapModal.assignedCallingStaff?.name || 'Unassigned';

    setActionLoading(true);
    try {
      await apiReassignCallingStaff(swapModal._id, {
        newCallingStaffId: swapTargetStaff,
        reason: swapReason.trim(),
        newStage: swapTargetStage
      });

      Swal.fire({
        icon: 'success',
        title: 'Calling Staff Reassigned!',
        html: `Candidate <b>${swapModal.candidateName}</b> (${swapModal.leadId}) reassigned:<br><br>
               <span class="text-rose-600 line-through font-semibold">${oldStaffName}</span> &rarr; <b class="text-emerald-700">${newStaff?.name || 'New Staff'}</b><br>
               <div class="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded text-left text-xs text-gray-600">
                 <b>Audit Reason:</b> "${swapReason.trim()}"<br>
                 <b>Next Workflow Stage:</b> ${swapTargetStage.replace(/_/g, ' ')}
               </div>`,
        confirmButtonColor: '#2563EB'
      });

      setSwapModal(null);
      setSwapTargetStaff('');
      setSwapReason('');
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Swap Failed',
        text: err.message || 'Could not reassign calling staff.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Bulk Reassign Calling Staff
  const handleApplyBulkSwap = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !bulkTargetStaff) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Calling Staff',
        text: 'Please select candidates and a Calling Officer.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }
    if (!bulkReason.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Reason Required',
        text: 'Audit reason is mandatory for bulk reassignment.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    const newStaff = staffList.find(s => s._id === bulkTargetStaff);

    setActionLoading(true);
    try {
      const res = await apiBulkReassignCallingStaff({
        leadIds: selectedIds,
        newCallingStaffId: bulkTargetStaff,
        reason: bulkReason.trim()
      });

      Swal.fire({
        icon: 'success',
        title: 'Bulk Reassignment Complete!',
        html: `Successfully reassigned <b>${selectedIds.length} candidate(s)</b> to <b>${newStaff?.name}</b>.<br>
               <span class="text-xs text-gray-500 mt-2 block">Audit reason logged for each file.</span>`,
        confirmButtonColor: '#2563EB'
      });

      setBulkModalOpen(false);
      setBulkTargetStaff('');
      setBulkReason('');
      setSelectedIds([]);
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Bulk Reassignment Failed',
        text: err.message || 'Could not perform bulk reassignment.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Toggle Hold Status (FRD Section 21)
  const handleToggleHold = async (candidate) => {
    const isCurrentlyHold = candidate.isHold;
    const actionText = isCurrentlyHold ? 'Resume Processing' : 'Place on Hold';

    const { value: reason } = await Swal.fire({
      title: `${actionText}?`,
      text: isCurrentlyHold
        ? `Resume recruitment workflow for ${candidate.candidateName} (${candidate.leadId})?`
        : `Enter reason for placing ${candidate.candidateName} on hold:`,
      input: isCurrentlyHold ? undefined : 'text',
      inputPlaceholder: 'e.g. Passport renewal pending, family delay, medical review...',
      showCancelButton: true,
      confirmButtonColor: isCurrentlyHold ? '#10B981' : '#F59E0B',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${actionText}`
    });

    if (reason === undefined && !isCurrentlyHold) return;

    try {
      await apiToggleLeadHold(candidate._id, !isCurrentlyHold, reason || '');

      Swal.fire({
        icon: 'success',
        title: isCurrentlyHold ? 'Candidate File Resumed' : 'Candidate Placed on Hold',
        text: `Status for ${candidate.candidateName} updated in database.`,
        confirmButtonColor: '#2563EB'
      });

      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Could not update hold status.',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // 5. Forward File to Step 13 (Calling Staff Location) or Step 14/15 (Pre-Viva Direct File)
  const handleApplyForward = async (e) => {
    e.preventDefault();
    if (!forwardModal) return;

    setActionLoading(true);
    try {
      await apiTransferLeadStage(forwardModal._id, {
        fromStage: forwardModal.currentStage,
        toStage: forwardTargetStage,
        fileType: forwardTargetStage === 'PRE_VISA' ? 'DIRECT_FILE' : undefined,
        remarks: forwardRemarks.trim() || `Transferred by Staff Head to ${forwardTargetStage} as ${forwardTargetStage === 'PRE_VISA' ? 'DIRECT FILE' : 'LOCATION CONFIRMATION'}`
      });

      Swal.fire({
        icon: 'success',
        title: 'File Forwarded Successfully!',
        html: `Candidate <b>${forwardModal.candidateName}</b> transferred to <b>${forwardTargetStage.replace(/_/g, ' ')}</b>.<br>
               <span class="text-xs text-gray-500 mt-1 block">File is now visible in downstream workflow.</span>`,
        confirmButtonColor: '#2563EB'
      });

      setForwardModal(null);
      setForwardRemarks('');
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Forwarding Failed',
        text: err.message || 'Could not transfer candidate.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 6. View Candidate Details & Full Audit History
  const handleOpenDetails = async (candidate) => {
    setDetailLoading(true);
    setDetailCandidate(candidate);
    try {
      const res = await apiGetLeadById(candidate._id);
      if (res?.data) {
        setDetailCandidate(res.data);
      }
    } catch (err) {
      console.error('Failed to load full lead details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStageFilter('ALL');
    setStaffFilter('ALL');
    setHoldFilter('ALL');
  };

  const isFilterActive = searchQuery || stageFilter !== 'ALL' || staffFilter !== 'ALL' || holdFilter !== 'ALL';

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/staff-head/assign')} className="hover:text-blue-600 cursor-pointer">Staff Head</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Change Calling Staff</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Change Calling Staff & Reassignment
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/staff-head/assign')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Go to Step 02 Lead Distribution Desk"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Distribute Leads</span>
          </button>

          <button
            onClick={() => navigate('/calling/location-confirm')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Go to Step 13 Visa Location Confirmation Desk"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Interested Country &rarr;</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Dynamic KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5 sm:mb-6">
        
        {/* Card 1: Total Handled Files */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total Managed</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {stats.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Total active candidate files</div>
          </div>
        </div>

        {/* Card 2: Post-Medical / Ready to Reassign */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Post-Medical</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-purple-700 font-mono leading-none">
              {stats.postMedicalReady}
            </div>
            <div className="text-[11px] text-purple-600/80 mt-1 font-medium">Ready for Reassignment</div>
          </div>
        </div>

        {/* Card 3: In Calling Queue */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">In Calling</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-700 font-mono leading-none">
              {stats.inCalling}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">Assigned & Active</div>
          </div>
        </div>

        {/* Card 4: On Hold Files */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">On Hold</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PauseCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-700 font-mono leading-none">
              {stats.onHold}
            </div>
            <div className="text-[11px] text-amber-600/80 mt-1 font-medium">Paused files needing action</div>
          </div>
        </div>

        {/* Card 5: Calling Staff Available */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700">Calling Officers</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-blue-700 font-mono leading-none">
              {stats.activeStaffCount}
            </div>
            <div className="text-[11px] text-blue-600/80 mt-1 font-medium">Available for allocation</div>
          </div>
        </div>

      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 mb-5 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate, passport, phone, trade, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-purple-500 focus:bg-white transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Filter by Calling Staff (Dynamic from MongoDB) */}
            <div className="relative">
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-700 focus:outline-none focus:border-purple-500 cursor-pointer min-w-[160px]"
              >
                <option value="ALL">All Calling Officers</option>
                <option value="UNASSIGNED">Unassigned Candidates</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Stage Selector */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-700 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {STAGE_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Hold Status Filter */}
            <select
              value={holdFilter}
              onChange={(e) => setHoldFilter(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-700 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="ALL">All File Status</option>
              <option value="ACTIVE">Active Files Only</option>
              <option value="HOLD">On Hold Only</option>
            </select>

            {/* Reset Filters Button */}
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="px-3 py-2.5 text-[12px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset all search and filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bulk Action Floating Bar (When items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-purple-900 text-white rounded-2xl p-4 mb-4 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-700 flex items-center justify-center font-bold text-[13px] font-mono">
              {selectedIds.length}
            </div>
            <div>
              <div className="font-bold text-[13.5px]">
                {selectedIds.length} Candidate File{selectedIds.length > 1 ? 's' : ''} Selected
              </div>
              <div className="text-[11px] text-purple-200">
                You can bulk reassign selected files to another Calling Officer per FRD Section 12.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-[12px] font-semibold text-purple-200 hover:text-white cursor-pointer"
            >
              Cancel Selection
            </button>
            <button
              onClick={() => {
                setBulkTargetStaff('');
                setBulkReason('');
                setBulkModalOpen(true);
              }}
              className="px-4 py-2 bg-white text-purple-900 hover:bg-purple-50 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4 text-purple-700" />
              <span>Bulk Reassign Calling Staff</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Candidate Handling Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        
        {/* Table Header Summary */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-gray-900 text-[15px]">
              Candidate Files in Staff Head Desk
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
              {candidates.length} Files
            </span>
          </div>

          <div className="text-[11.5px] text-gray-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>FRD Rule: All staff swaps logged to immutable audit history</span>
          </div>
        </div>

        {/* Table Rows */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
            <span className="text-[13px] font-medium text-gray-600">Loading candidate files from database...</span>
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-[15px]">No Candidate Files Found</h4>
            <p className="text-[12.5px] text-gray-500 mt-1 mb-4 leading-relaxed">
              There are currently no candidates matching the active stage or search criteria.
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
            <table className="w-full text-left border-collapse min-w-[1100px] text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                  <th className="py-3.5 px-3 whitespace-nowrap w-10 text-center">
                    <input
                      type="checkbox"
                      checked={candidates.length > 0 && selectedIds.length === candidates.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Candidate & ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Contact & Origin</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Trade & Country</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Medical & Fee Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Current Calling Staff</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Stage</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Hold Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((candidate) => {
                  const initial = candidate.candidateName?.charAt(0) || 'C';
                  const isHold = candidate.isHold;
                  const currentStaff = candidate.assignedCallingStaff?.name || 'Unassigned';
                  const isSelected = selectedIds.includes(candidate._id);
                  const medStatus = candidate.medicalDetails?.status || 'PENDING';
                  const prefCountry = candidate.applicationForm?.preferredCountries?.[0] || 'Gulf / General';

                  return (
                    <tr
                      key={candidate._id}
                      className={`hover:bg-purple-50/30 transition-colors ${
                        isSelected ? 'bg-purple-50/50' : isHold ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* 0. Checkbox */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(candidate._id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>

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
                              <span className={candidate.passportNumber ? 'text-gray-600' : 'text-amber-600 font-normal'}>
                                {candidate.passportNumber || 'No Passport'}
                              </span>
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

                      {/* 3. Trade & Country */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800 text-[12.5px] max-w-[180px] truncate" title={candidate.trade}>
                          {candidate.trade || 'General Worker'}
                        </div>
                        <div className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
                          <Globe className="w-3 h-3 text-purple-400" />
                          <span>{prefCountry}</span>
                        </div>
                      </td>

                      {/* 4. Medical & Fee Status (FRD Section 11 & 12 Post-Medical Verification) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {/* Medical Badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border w-fit ${
                            medStatus === 'FIT' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : medStatus === 'UNFIT'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <Stethoscope className="w-2.5 h-2.5" />
                            <span>GAMCA: {medStatus}</span>
                          </span>

                          {/* Fee Badge */}
                          <span className="text-[10.5px] text-gray-500 font-mono">
                            Fee: <strong className="text-gray-800">₹{candidate.paymentDetails?.advancePaid || 0}</strong> / ₹{candidate.paymentDetails?.serviceFee || 12000}
                          </span>
                        </div>
                      </td>

                      {/* 5. Current Calling Staff */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                            candidate.assignedCallingStaff 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {currentStaff.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[12px]">{currentStaff}</div>
                            <div className="text-[10px] text-gray-400">Current Owner</div>
                          </div>
                        </div>
                      </td>

                      {/* 6. Stage */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {candidate.currentStage?.replace(/_/g, ' ') || 'ACTIVE'}
                        </span>
                      </td>

                      {/* 7. Hold Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isHold 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isHold ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span>{isHold ? 'On Hold' : 'Active'}</span>
                        </span>
                      </td>

                      {/* 8. Desk Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Swap Staff Button */}
                          <button
                            onClick={() => {
                              setSwapModal(candidate);
                              setSwapTargetStaff('');
                              setSwapReason('');
                              setSwapTargetStage('CALLING_SCREENING');
                            }}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-[11.5px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1 shadow-2xs"
                            title="Reassign to another Calling Staff (FRD Sec. 12)"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Swap Staff</span>
                          </button>

                          {/* Forward to Next Step */}
                          <button
                            onClick={() => {
                              setForwardModal(candidate);
                              setForwardTargetStage('CALLING_SCREENING');
                              setForwardRemarks('');
                            }}
                            disabled={isHold}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-[11.5px] font-bold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1"
                            title="Forward file to Step 13 Location Confirmation or Pre-Viva"
                          >
                            <Send className="w-3 h-3" />
                            <span>Forward</span>
                          </button>

                          {/* Hold / Resume */}
                          <button
                            onClick={() => handleToggleHold(candidate)}
                            className={`p-1.5 rounded-xl border cursor-pointer transition-colors ${
                              isHold
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                            title={isHold ? 'Resume Processing' : 'Place on Hold'}
                          >
                            {isHold ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                          </button>

                          {/* View Details */}
                          <button
                            onClick={() => handleOpenDetails(candidate)}
                            className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl cursor-pointer transition-colors"
                            title="View Full Profile & Audit Trail"
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
          <span>Showing <b>{candidates.length}</b> candidate files in Staff Head Desk</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Need to allocate incoming leads equally?</span>
            <button
              onClick={() => navigate('/staff-head/assign')}
              className="text-purple-600 hover:underline font-bold cursor-pointer flex items-center gap-0.5"
            >
              <span>Go to Equal Distribution Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Swap Single Calling Staff Modal (FRD Section 12 Reassignment) */}
      {swapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <ArrowRightLeft className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-[16px]">Reassign Calling Staff</h3>
                  <p className="text-[11px] text-purple-300 font-medium">FRD Section 12 • Audit History Recorded</p>
                </div>
              </div>
              <button 
                onClick={() => setSwapModal(null)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleApplySwap} className="p-6 space-y-4">
              
              {/* Candidate Info Strip */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] space-y-1">
                <div>Candidate: <strong className="text-gray-900">{swapModal.candidateName}</strong> ({swapModal.leadId})</div>
                <div>Trade Skill: <span className="font-semibold text-gray-700">{swapModal.trade || 'General Worker'}</span></div>
                <div className="text-gray-500">
                  Current Owner: <span className="font-bold text-rose-700">{swapModal.assignedCallingStaff?.name || 'Unassigned'}</span>
                </div>
              </div>

              {/* Target Staff Dropdown (100% REAL LIVE CALLING STAFF) */}
              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select New Calling Officer *
                </label>
                <select
                  required
                  value={swapTargetStaff}
                  onChange={(e) => setSwapTargetStaff(e.target.value)}
                  disabled={staffList.length === 0}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-purple-500 bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">{staffList.length === 0 ? 'No Calling Officers Available' : 'Select New Calling Officer…'}</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Stage */}
              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Post-Swap Workflow Stage
                </label>
                <select
                  value={swapTargetStage}
                  onChange={(e) => setSwapTargetStage(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[12.5px] font-medium focus:outline-none focus:border-purple-500 bg-white cursor-pointer"
                >
                  <option value="CALLING_SCREENING">Step 13: Calling Queue (Visa Location Confirmation)</option>
                  <option value="STAFF_HEAD_HANDLING">Stay in Staff Head Desk</option>
                </select>
              </div>

              {/* Reassignment Reason Input (Mandatory per FRD) */}
              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reason for Staff Reassignment * (Audit Mandate)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workload balancing, Gulf language match, Regional expertise..."
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSwapModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || staffList.length === 0}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-[12.5px] font-bold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Swapping...</>
                  ) : (
                    <>Confirm & Audit Swap</>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 7. Bulk Reassign Calling Staff Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-900 text-white">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-purple-300" />
                <div>
                  <h3 className="font-bold text-[16px]">Bulk Reassign Calling Staff</h3>
                  <p className="text-[11px] text-purple-200 font-medium">Reassigning {selectedIds.length} candidate files</p>
                </div>
              </div>
              <button 
                onClick={() => setBulkModalOpen(false)} 
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBulkSwap} className="p-6 space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[12.5px] text-purple-900">
                You are about to reassign <b>{selectedIds.length} candidate files</b> to a new Calling Officer. Each swap will be recorded individually in the audit log.
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select New Calling Officer *
                </label>
                <select
                  required
                  value={bulkTargetStaff}
                  onChange={(e) => setBulkTargetStaff(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-purple-500 bg-white cursor-pointer"
                >
                  <option value="">Select New Calling Officer…</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reason for Bulk Reassignment * (Audit Mandate)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Officer on leave, portfolio rebalancing, regional campaign..."
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-[12.5px] font-bold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Reassigning...</>
                  ) : (
                    <>Confirm Bulk Reassignment</>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 8. Forward File Modal (Step 13 Calling vs Step 14/15 Pre-Viva Direct) */}
      {forwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-900 text-white">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="font-bold text-[16px]">Forward Candidate File</h3>
                  <p className="text-[11px] text-blue-200 font-medium">Downstream Workflow Transition</p>
                </div>
              </div>
              <button 
                onClick={() => setForwardModal(null)} 
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyForward} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px]">
                Forwarding <strong>{forwardModal.candidateName}</strong> ({forwardModal.leadId})
                <div className="text-gray-500 text-[11px] mt-0.5">
                  Current Owner: {forwardModal.assignedCallingStaff?.name || 'Unassigned'}
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Destination Stage *
                </label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    forwardTargetStage === 'CALLING_SCREENING' ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="forwardStage"
                      value="CALLING_SCREENING"
                      checked={forwardTargetStage === 'CALLING_SCREENING'}
                      onChange={() => setForwardTargetStage('CALLING_SCREENING')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-bold text-[12.5px] text-gray-900">Step 13: Visa Location Confirmation</div>
                      <div className="text-[11px] text-gray-500">Calling Staff contacts candidate to confirm overseas job location (up to 4 attempts).</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    forwardTargetStage === 'PRE_VISA' ? 'border-purple-500 bg-purple-50/40' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="forwardStage"
                      value="PRE_VISA"
                      checked={forwardTargetStage === 'PRE_VISA'}
                      onChange={() => setForwardTargetStage('PRE_VISA')}
                      className="mt-0.5 text-purple-600"
                    />
                    <div>
                      <div className="font-bold text-[12.5px] text-gray-900">Step 14: Direct File to Pre-Viva Manager</div>
                      <div className="text-[11px] text-gray-500">Direct transfer after medical verification for Pre-Viva file verification.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Transfer Remarks / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Medical FIT verified, candidate ready for Riyadh visa confirmation..."
                  value={forwardRemarks}
                  onChange={(e) => setForwardRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setForwardModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-[12.5px] font-bold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Forwarding...</>
                  ) : (
                    <>Confirm Forward</>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 9. Candidate Verification & Full Audit Details Drawer/Modal */}
      {detailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Phone Number</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">{detailCandidate.phone}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Trade & Experience</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.trade || 'General Worker'} ({detailCandidate.applicationForm?.experienceYears || '0'} yrs)
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Current Owner</div>
                  <div className="font-bold text-purple-700 text-[13px] mt-0.5">
                    {detailCandidate.assignedCallingStaff?.name || 'Unassigned'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Medical Fitness</div>
                  <div className="font-bold text-[13px] mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      detailCandidate.medicalDetails?.status === 'FIT' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <span>{detailCandidate.medicalDetails?.status || 'PENDING'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Advance Booking</div>
                  <div className="font-bold text-emerald-700 text-[13px] mt-0.5 font-mono">
                    ₹{detailCandidate.paymentDetails?.advancePaid || 0} Paid
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Hold Status</div>
                  <div className="font-bold text-[13px] mt-0.5">
                    {detailCandidate.isHold ? (
                      <span className="text-rose-600 font-bold">On Hold ({detailCandidate.holdReason || 'No reason'})</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">Active File</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Immutable Audit Trail Section */}
              <div>
                <h4 className="font-bold text-gray-900 text-[13.5px] flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Immutable Audit Trail & Assignment History</span>
                </h4>

                {detailLoading ? (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-purple-600" />
                    Loading audit history...
                  </div>
                ) : !detailCandidate.history || detailCandidate.history.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500 text-xs">
                    No stage transfers or staff swap logs recorded yet for this candidate.
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
                            Logged by: <b>{h.performedBy.name || 'System'}</b> ({h.performedBy.role || 'Staff'})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const target = detailCandidate;
                  setDetailCandidate(null);
                  setSwapModal(target);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Reassign Calling Staff</span>
              </button>

              <button
                onClick={() => setDetailCandidate(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-[12px] font-semibold text-gray-700 hover:bg-white cursor-pointer"
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
