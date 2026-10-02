import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, CheckCircle2, ArrowRight, Sparkles, Users, PhoneCall,
  Clock, ShieldCheck, AlertTriangle, BarChart3, TrendingUp, Zap,
  Filter, Search, Eye, X, UserCheck, FileSpreadsheet, Globe,
  RefreshCw, Award, CalendarDays, Phone, MapPin, Briefcase,
  Layers, CheckSquare, Square
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  apiGetLeads,
  apiGetUsers,
  apiAssignLeads,
  apiDistributeRoundRobin
} from '../../utils/api';

const SOURCE_STYLE = {
  WHATSAPP: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FACEBOOK: 'bg-blue-50 text-blue-700 border-blue-200',
  EXCEL: 'bg-amber-50 text-amber-700 border-amber-200',
  MANUAL: 'bg-slate-50 text-slate-700 border-slate-200',
  WALK_IN: 'bg-purple-50 text-purple-700 border-purple-200',
  AGENT_REFERRAL: 'bg-orange-50 text-orange-700 border-orange-200',
};

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 'bg-purple-600',
  'bg-emerald-600', 'bg-teal-600', 'bg-amber-600', 'bg-rose-600'
];

export default function LeadAssignment() {
  const navigate = useNavigate();

  // Live Database States
  const [unassignedLeads, setUnassignedLeads] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Selection & Form States
  const [selected, setSelected] = useState([]);
  const [targetStaff, setTargetStaff] = useState('');
  const [detailLead, setDetailLead] = useState(null);
  const [customBatchCount, setCustomBatchCount] = useState('');

  // Search & Filter States
  const [searchQ, setSearchQ] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterPassport, setFilterPassport] = useState('ALL');

  // 1. Fetch live data from MongoDB Atlas
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.allSettled([
        apiGetLeads({ stage: 'UNASSIGNED' }),
        apiGetUsers()
      ]);

      let leads = [];
      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        leads = leadsRes.value.data;
        setUnassignedLeads(leads);
      }

      let allCallingStaff = [];
      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        // Filter users who are active Calling Staff
        allCallingStaff = usersRes.value.data.filter(
          u => u.role === 'CALLING_STAFF' && u.isActive !== false
        );

        // Fetch all leads to compute current assignment load for each staff
        const allLeadsRes = await apiGetLeads();
        const allLeads = allLeadsRes?.data || [];

        const staffWithMetrics = allCallingStaff.map((staff, idx) => {
          const assignedCount = allLeads.filter(
            l => l.assignedCallingStaff?._id === staff._id || l.assignedCallingStaff === staff._id
          ).length;

          const initials = staff.name
            ? staff.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'CS';

          return {
            ...staff,
            id: staff._id,
            initials,
            assigned: assignedCount,
            max: 80, // Default capacity guardrail
            color: AVATAR_COLORS[idx % AVATAR_COLORS.length]
          };
        });

        setStaffList(staffWithMetrics);
      }
    } catch (err) {
      console.error('Failed to load lead distribution data', err);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Failed to load leads from database. Please check connection.',
        confirmButtonColor: '#2563EB'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter Leads
  const filteredLeads = unassignedLeads.filter((l) => {
    const q = searchQ.toLowerCase().trim();
    const name = l.candidateName || '';
    const phone = l.phone || '';
    const trade = l.trade || l.applicationForm?.trade || '';
    const leadId = l.leadId || '';

    const matchQ = !q ||
      name.toLowerCase().includes(q) ||
      phone.includes(q) ||
      trade.toLowerCase().includes(q) ||
      leadId.toLowerCase().includes(q);

    const matchSrc = filterSource === 'ALL' || l.source === filterSource;
    const matchPassport = filterPassport === 'ALL' || l.isPassportHolder === filterPassport;

    return matchQ && matchSrc && matchPassport;
  });

  // Selection Checkbox Logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(filteredLeads.map(l => l._id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Quick Batch Selection Logic (Pair selection: 10, 20, 25, 30, 40 etc.)
  const handleSelectBatch = (count) => {
    if (!filteredLeads.length) return;
    const num = Math.min(count, filteredLeads.length);
    const topIds = filteredLeads.slice(0, num).map(l => l._id);
    setSelected(topIds);
  };

  const handleCustomBatchSelect = (e) => {
    if (e) e.preventDefault();
    const count = parseInt(customBatchCount, 10);
    if (isNaN(count) || count <= 0) return;
    handleSelectBatch(count);
  };

  // 2. Selective Manual Assignment to 1 Calling Staff (with Already-Assigned Alert & Reassignment System)
  const handleManualAssign = async (forceConfirm = false) => {
    if (!selected.length || !targetStaff) return;
    const staff = staffList.find(s => s.id === targetStaff);
    if (!staff) return;

    // Check selected lead objects
    const selectedObjs = unassignedLeads.filter(l => selected.includes(l._id));

    // Case A: Leads already assigned to THIS EXACT staff member
    const alreadySameStaff = selectedObjs.filter(l => {
      const currentStaffId = l.assignedCallingStaff?._id || l.assignedCallingStaff;
      return currentStaffId && currentStaffId.toString() === targetStaff.toString();
    });

    if (alreadySameStaff.length > 0 && alreadySameStaff.length === selected.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Already Assigned!',
        html: `All selected <b>${selected.length} lead(s)</b> are already assigned to <b>${staff.name}</b>.<br><span class="text-xs text-gray-500">Duplicate assignment to the same officer is prevented.</span>`,
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    // Case B: Leads currently assigned to OTHER staff members
    const assignedOtherStaff = selectedObjs.filter(l => {
      const currentStaffId = l.assignedCallingStaff?._id || l.assignedCallingStaff;
      return currentStaffId && currentStaffId.toString() !== targetStaff.toString();
    });

    if (assignedOtherStaff.length > 0 && !forceConfirm) {
      const sampleNames = assignedOtherStaff.slice(0, 3).map(l => `• <b>${l.candidateName || 'Lead'}</b> (with <i>${l.assignedCallingStaff?.name || 'Other Officer'}</i>)`).join('<br>');
      const confirmResult = await Swal.fire({
        icon: 'warning',
        title: 'Confirm Lead Reassignment',
        html: `<div class="text-left text-sm space-y-2">
          <p><b>${assignedOtherStaff.length} of ${selected.length} lead(s)</b> are already assigned to another calling officer:</p>
          <div class="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-900">${sampleNames}${assignedOtherStaff.length > 3 ? `<br><i>...and ${assignedOtherStaff.length - 3} more</i>` : ''}</div>
          <p class="pt-1">Do you want to reassign them to <b>${staff.name}</b>?</p>
        </div>`,
        showCancelButton: true,
        confirmButtonColor: '#2563EB',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, Reassign Leads',
        cancelButtonText: 'Cancel'
      });

      if (!confirmResult.isConfirmed) return;
    }

    setActionLoading(true);
    try {
      await apiAssignLeads(selected, targetStaff, true);

      Swal.fire({
        icon: 'success',
        title: 'Leads Successfully Assigned!',
        html: `<b>${selected.length} lead(s)</b> have been assigned to <b>${staff.name}</b>.<br><span class="text-sm text-gray-500">Transferred to Step 03: Calling Queue.</span>`,
        confirmButtonColor: '#2563EB'
      });

      setSelected([]);
      setTargetStaff('');
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: err.message || 'Could not assign leads.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Equal / Round-Robin Auto Distribution across ALL active Calling Staff (FRD Section 6)
  const handleEqualDist = async () => {
    if (!unassignedLeads.length) {
      Swal.fire({ icon: 'info', title: 'No Unassigned Leads', text: 'All incoming leads have already been assigned.', confirmButtonColor: '#2563EB' });
      return;
    }
    if (!staffList.length) {
      Swal.fire({ icon: 'warning', title: 'No Calling Staff Found', text: 'Please create Calling Staff members first in User Management.', confirmButtonColor: '#2563EB' });
      return;
    }

    const leadsToDistribute = selected.length > 0 ? selected : unassignedLeads.map(l => l._id);
    const staffIds = staffList.map(s => s.id);

    const result = await Swal.fire({
      title: 'Run Equal Lead Distribution?',
      html: `You are about to distribute <b>${leadsToDistribute.length} leads</b> equally across <b>${staffList.length} Calling Officers</b>.<br><br>Approx. <b>~${Math.floor(leadsToDistribute.length / staffList.length)} leads per staff</b> (FRD Section 6 Round-Robin).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Distribute Equally',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      const res = await apiDistributeRoundRobin(leadsToDistribute, staffIds);

      Swal.fire({
        icon: 'success',
        title: 'Round-Robin Distribution Complete!',
        html: `<b>${leadsToDistribute.length} leads</b> were equally divided among <b>${staffList.length} Calling Officers</b>.<br><br><div class="text-left text-xs bg-gray-50 p-2.5 rounded-lg max-h-36 overflow-y-auto space-y-1">${res.distribution?.map(d => `<div>• <b>${d.staffName}</b>: +${d.assignedCount} leads</div>`).join('') || ''}</div>`,
        confirmButtonColor: '#2563EB'
      });

      setSelected([]);
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Distribution Failed',
        text: err.message || 'Could not complete round-robin distribution.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamic KPI Metrics
  const totalUnassigned = unassignedLeads.length;
  const passportValidCount = unassignedLeads.filter(l => l.isPassportHolder === 'YES').length;
  const nonPassportCount = unassignedLeads.filter(l => l.isPassportHolder === 'NO').length;
  const totalAssignedStaffCount = staffList.reduce((acc, s) => acc + s.assigned, 0);
  const totalStaffCapacity = staffList.length * 80;

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Distribute Leads</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Distribute Leads to Calling Staff
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/leads/import')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Leads</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleEqualDist}
            disabled={loading || actionLoading || totalUnassigned === 0 || staffList.length === 0}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {staffList.length === 0 
                ? 'No Staff' 
                : totalUnassigned === 0 
                ? 'Pool Empty' 
                : `Distribute Equally (${totalUnassigned})`}
            </span>
          </button>
        </div>
      </div>

      {/* Warning if no Calling Staff exists in team */}
      {!loading && staffList.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-6 flex items-start gap-3.5 text-amber-900 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[14px]">Calling Team Not Configured</h4>
            <p className="text-[12.5px] text-amber-700 mt-0.5 leading-relaxed">
              Leads cannot be distributed because there are currently no active Calling Officers available in your team. 
              Please register Calling Staff in <b>User Management</b> or verify team mapping.
            </p>
            <button
              onClick={() => navigate('/users')}
              className="mt-2.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[12px] font-bold cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Go to User Management &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. KPI Summary Cards (100% Dynamic MongoDB Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[20px] font-black text-gray-900 font-mono leading-none">{totalUnassigned}</div>
            <div className="text-[11.5px] font-bold text-gray-600 mt-0.5">Unassigned Pool</div>
            <div className="text-[10px] text-gray-400">Waiting for allocation</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[20px] font-black text-gray-900 font-mono leading-none">{passportValidCount}</div>
            <div className="text-[11.5px] font-bold text-gray-600 mt-0.5">Passport Valid</div>
            <div className="text-[10px] text-emerald-600 font-semibold">Ready for calling queue</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[20px] font-black text-gray-900 font-mono leading-none">{nonPassportCount}</div>
            <div className="text-[11.5px] font-bold text-gray-600 mt-0.5">Non-Passport Leads</div>
            <div className="text-[10px] text-rose-600 font-semibold">Auto-quarantine protocol</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[20px] font-black text-gray-900 font-mono leading-none">
              {staffList.length} <span className="text-[13px] text-gray-400 font-normal">Officers</span>
            </div>
            <div className="text-[11.5px] font-bold text-gray-600 mt-0.5">Active Calling Staff</div>
            <div className="text-[10px] text-blue-600 font-semibold">{totalAssignedStaffCount} currently active</div>
          </div>
        </div>
      </div>

      {/* 3. Calling Team Capacity Dashboard */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 mb-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Calling Team Active Load & Capacity
            </h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Live workload distribution across mapped Calling Staff members in MongoDB.
            </p>
          </div>
          <span className="text-[12px] font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
            {staffList.length} Calling Officers
          </span>
        </div>

        {staffList.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-[13px]">
            No Calling Staff users found in database. Please register Calling Staff in User Management.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {staffList.map((staff) => {
              const pct = Math.min(Math.round((staff.assigned / staff.max) * 100), 100);
              const barColor = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-600';

              return (
                <div key={staff.id} className="p-3.5 border border-gray-200 rounded-xl hover:border-blue-300 transition-all bg-slate-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl ${staff.color} text-white text-[11px] font-black flex items-center justify-center shadow-2xs`}>
                      {staff.initials}
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      pct >= 90 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {pct}% load
                    </span>
                  </div>

                  <div className="font-bold text-gray-900 text-[13px] leading-tight truncate mb-0.5">
                    {staff.name}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono truncate mb-2">
                    {staff.email}
                  </div>

                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                    <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="text-[11px] text-gray-500 flex justify-between font-medium">
                    <span>{staff.assigned} active leads</span>
                    <span className="text-gray-400">Cap: {staff.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Batch Pair Selection & Manual Assignment Action Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                <span>Batch Pair Selection & Lead Assignment</span>
                {selected.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-600 text-white font-mono shadow-2xs">
                    {selected.length} Selected
                  </span>
                )}
              </div>
              <div className="text-[12px] text-gray-500">
                Pick a batch size (10, 20, 25, 30, 40...) to auto-select and assign leads instantly to calling staff.
              </div>
            </div>
          </div>

          {selected.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold self-start md:self-auto cursor-pointer"
            >
              ✕ Clear Selection ({selected.length})
            </button>
          )}
        </div>

        {/* Quick Batch Presets & Custom Qty */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11.5px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Quick Batch:
            </span>
            {[10, 20, 25, 30, 40, 50].map((batchSize) => (
              <button
                key={batchSize}
                type="button"
                onClick={() => handleSelectBatch(batchSize)}
                disabled={filteredLeads.length === 0}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  selected.length === batchSize
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200'
                }`}
                title={`Select first ${batchSize} leads from queue`}
              >
                {batchSize} Leads
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleSelectBatch(filteredLeads.length)}
              disabled={filteredLeads.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 transition-all cursor-pointer shadow-2xs"
            >
              All ({filteredLeads.length})
            </button>
          </div>

          {/* Custom Batch Selector */}
          <form onSubmit={handleCustomBatchSelect} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Custom:</span>
            <input
              type="number"
              min="1"
              max={filteredLeads.length || 1000}
              placeholder="e.g. 15"
              value={customBatchCount}
              onChange={(e) => setCustomBatchCount(e.target.value)}
              className="w-20 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 font-mono font-bold focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!customBatchCount || filteredLeads.length === 0}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              Select
            </button>
          </form>
        </div>

        {/* Staff Target Selection & Final Assignment Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>
              {selected.length > 0 
                ? `Ready to assign ${selected.length} candidate(s). Choose target calling officer:`
                : 'Click any batch preset above (10, 20, 25, 30, 40) to select candidates.'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <select
              value={targetStaff}
              onChange={(e) => setTargetStaff(e.target.value)}
              disabled={staffList.length === 0}
              className="border border-gray-200 rounded-xl px-3.5 py-2 text-[12.5px] font-medium focus:outline-none focus:border-blue-500 bg-white min-w-[240px] cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">{staffList.length === 0 ? 'No Calling Officers Available' : 'Select Target Calling Officer…'}</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.assigned} leads active)
                </option>
              ))}
            </select>

            <button
              onClick={handleManualAssign}
              disabled={!selected.length || !targetStaff || actionLoading || staffList.length === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-[12.5px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
            >
              {actionLoading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Assigning...</>
              ) : (
                <>Assign {selected.length > 0 ? `${selected.length} ` : ''}Leads <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Unassigned Central Pool Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        
        {/* Table Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-gray-900 text-[16px]">
              Unassigned Leads Queue
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
              {filteredLeads.length} Candidates
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, trade, ID..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Source Filter */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Sources</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="EXCEL">Excel Sheet</option>
              <option value="MANUAL">Manual / Walk-in</option>
              <option value="AGENT_REFERRAL">Agent Referral</option>
            </select>

            {/* Passport Filter */}
            <select
              value={filterPassport}
              onChange={(e) => setFilterPassport(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Passports</option>
              <option value="YES">✓ Passport Holder</option>
              <option value="NO">✗ Non-Passport</option>
              <option value="NOT_CONFIRMED">⏳ Not Confirmed</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <span className="text-[13px] font-medium text-gray-600">Loading unassigned leads from database...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-[15px]">Zero Pending Leads</h4>
            <p className="text-[12.5px] text-gray-500 mt-1 mb-4">
              All leads in the central pool have been successfully distributed to calling staff!
            </p>
            <button
              onClick={() => navigate('/leads/import')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12.5px] font-bold cursor-pointer transition-colors shadow-xs"
            >
              + Ingest New Leads Pool
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[950px] text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                  <th className="py-3.5 px-4 w-12 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selected.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Candidate & ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Contact Number</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Trade Skill</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Target Country</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Passport Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Source Channel</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => {
                  const isChecked = selected.includes(lead._id);
                  const isPassport = lead.isPassportHolder === 'YES';
                  const trade = lead.trade || lead.applicationForm?.trade || 'General Worker';
                  const country = lead.applicationForm?.preferredCountries?.[0] || 'Saudi Arabia';

                  return (
                    <tr
                      key={lead._id}
                      className={`hover:bg-blue-50/40 transition-colors ${isChecked ? 'bg-blue-50/60' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(lead._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Candidate */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 text-[11px] font-black flex items-center justify-center shrink-0">
                            {lead.candidateName?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[13px]">{lead.candidateName}</div>
                            <div className="font-mono text-[10.5px] text-blue-600 font-semibold">{lead.leadId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-gray-800 text-[12px] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 pl-5">{lead.city || lead.state || 'India'}</div>
                      </td>

                      {/* Trade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800 text-[12.5px] max-w-[200px] truncate" title={trade}>
                          {trade}
                        </div>
                        <div className="text-[10.5px] text-gray-400">
                          {lead.applicationForm?.experienceYears || 'Fresher / Standard'}
                        </div>
                      </td>

                      {/* Country */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-700 text-[12.5px]">{country}</div>
                      </td>

                      {/* Passport */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                          isPassport ? 'bg-emerald-100 text-emerald-800' :
                          lead.isPassportHolder === 'NO' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {isPassport ? `✓ ${lead.passportNumber || 'Passport Holder'}` :
                           lead.isPassportHolder === 'NO' ? '✗ No Passport' : '⏳ Pending'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          SOURCE_STYLE[lead.source] || 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {lead.source?.replace('_', ' ') || 'MANUAL'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setDetailLead(lead)}
                          className="px-2.5 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-[11.5px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Bar */}
        {filteredLeads.length > 0 && (
          <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500">
            <span>
              {selected.length > 0 ? (
                <strong className="text-blue-700">{selected.length} of {filteredLeads.length} leads selected</strong>
              ) : (
                `Showing ${filteredLeads.length} unassigned leads in pool`
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Next Stage:</span>
              <button
                onClick={() => navigate('/calling/queue')}
                className="text-blue-600 hover:underline font-bold cursor-pointer"
              >
                Go to Step 03 Calling Queue &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Lead Detail Quick Drawer */}
      {detailLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <div className="font-bold text-[16px]">{detailLead.candidateName}</div>
                <div className="text-[11px] font-mono text-blue-400 mt-0.5">{detailLead.leadId}</div>
              </div>
              <button 
                onClick={() => setDetailLead(null)} 
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px] flex-1">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-100 pb-2.5">
                  <span className="text-gray-500">Phone Number</span>
                  <span className="font-mono font-bold text-gray-900">{detailLead.phone}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2.5">
                  <span className="text-gray-500">Technical Trade</span>
                  <span className="font-bold text-gray-900">{detailLead.trade || 'General Worker'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2.5">
                  <span className="text-gray-500">Passport Status</span>
                  <span className={`font-bold ${detailLead.isPassportHolder === 'YES' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {detailLead.isPassportHolder === 'YES' ? `✓ ${detailLead.passportNumber || 'Holder'}` : '✗ No Passport'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2.5">
                  <span className="text-gray-500">Target Country</span>
                  <span className="font-bold text-gray-900">{detailLead.applicationForm?.preferredCountries?.[0] || 'Saudi Arabia'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2.5">
                  <span className="text-gray-500">Location</span>
                  <span className="font-bold text-gray-900">{detailLead.city || ''}, {detailLead.state || 'India'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2.5">
                  <span className="text-gray-500">Sourcing Channel</span>
                  <span className="font-semibold text-gray-800">{detailLead.source}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2.5">
                  <span className="text-gray-500">Current Workflow Stage</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{detailLead.currentStage}</span>
                </div>
                {detailLead.notes && (
                  <div className="pt-2">
                    <span className="text-gray-500 text-[12px] block mb-1">Notes / Remarks:</span>
                    <p className="p-3 bg-gray-50 rounded-xl text-gray-700 text-[12px] italic border border-gray-100">
                      "{detailLead.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setDetailLead(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-[12.5px] font-semibold cursor-pointer"
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
