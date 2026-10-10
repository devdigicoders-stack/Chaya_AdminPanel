import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, ChevronRight, CheckCircle2, AlertTriangle, Send, MapPin,
  Edit3, XCircle, ArrowRight, ShieldAlert, Search, AlertCircle,
  Sparkles, ShieldCheck, PhoneCall, RefreshCw, Clock, X, RotateCcw,
  Check, Eye, Globe, User, Building2, Layers
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  apiGetLeads,
  apiGetUsers,
  apiUpdateLocationConfirmation,
  apiGetLeadById,
  apiGetLeadHistory
} from '../../utils/api';

const POPULAR_GULF_LOCATIONS = [
  'Riyadh, Saudi Arabia',
  'Jeddah, Saudi Arabia',
  'Dammam, Saudi Arabia',
  'Dubai, UAE',
  'Abu Dhabi, UAE',
  'Sharjah, UAE',
  'Doha, Qatar',
  'Kuwait City, Kuwait',
  'Muscat, Oman',
  'Manama, Bahrain'
];

export default function VisaLocationConfirmation() {
  const navigate = useNavigate();

  // Database States
  const [leads, setLeads] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | PENDING | CONFIRMED | CRITICAL
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [editModal, setEditModal] = useState(null);
  const [newLocation, setNewLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');

  const [detailCandidate, setDetailCandidate] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 1. Fetch live candidates in location confirmation queue
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.allSettled([
        apiGetLeads({
          stage: 'CALLING_SCREENING',
          callingStaff: staffFilter !== 'ALL' ? staffFilter : undefined,
          search: searchQuery.trim() || undefined
        }),
        apiGetUsers()
      ]);

      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        setLeads(leadsRes.value.data);
      } else {
        setLeads([]);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        const callingStaff = usersRes.value.data.filter(
          u => u.role === 'CALLING_STAFF' && u.isActive !== false
        );
        setStaffList(callingStaff);
      }
    } catch (err) {
      console.error('Failed to load visa location confirmation leads', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Leads',
        text: 'Failed to retrieve location confirmation queue from database.',
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
    const total = leads.length;
    const confirmed = leads.filter(l => l.locationConfirmation?.isConfirmed).length;
    const closedNoAdvance = leads.filter(l => l.closureStatus === 'CLOSED_NO_ADVANCE').length;
    const pending = leads.filter(l => !l.locationConfirmation?.isConfirmed && (l.locationConfirmation?.editCount || 0) < 4 && l.closureStatus !== 'CLOSED_NO_ADVANCE').length;
    const critical = leads.filter(l => !l.locationConfirmation?.isConfirmed && (l.locationConfirmation?.editCount || 0) >= 3 && l.closureStatus !== 'CLOSED_NO_ADVANCE').length;

    return { total, confirmed, pending, critical, closedNoAdvance };
  }, [leads]);

  // 2. Open Edit Location Modal (FRD Section 13: Max 4 Attempts Rule)
  const handleOpenEditModal = (lead) => {
    const currentEdits = lead.locationConfirmation?.editCount || 0;
    if (currentEdits >= 4) {
      Swal.fire({
        icon: 'error',
        title: 'Max Attempts Exceeded',
        text: 'This candidate has already used all 4 location change attempts. Per FRD Section 13, this file cannot be edited further without supervisor approval.',
        confirmButtonColor: '#EF4444'
      });
      return;
    }

    setEditModal(lead);
    setNewLocation(lead.locationConfirmation?.confirmedLocation || POPULAR_GULF_LOCATIONS[0]);
    setCustomLocation('');
  };

  // Submit Location Edit (Increments editCount)
  const handleSaveLocationEdit = async (e) => {
    e.preventDefault();
    if (!editModal) return;

    const locationToSave = customLocation.trim() || newLocation;
    if (!locationToSave) {
      Swal.fire({
        icon: 'warning',
        title: 'Location Required',
        text: 'Please choose or type a destination location.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    const nextAttempt = (editModal.locationConfirmation?.editCount || 0) + 1;

    setActionLoading(true);
    try {
      await apiUpdateLocationConfirmation(editModal._id, {
        confirmedLocation: locationToSave,
        isConfirmed: false
      });

      Swal.fire({
        icon: 'success',
        title: `Location Updated (Attempt ${nextAttempt}/4)`,
        html: `Target location for <b>${editModal.candidateName}</b> updated to:<br>
               <b class="text-purple-700 text-sm mt-1 block">${locationToSave}</b><br>
               <span class="text-xs text-gray-500">Attempt <b>${nextAttempt} of 4</b> logged to immutable audit history.</span>`,
        confirmButtonColor: '#2563EB'
      });

      setEditModal(null);
      setNewLocation('');
      setCustomLocation('');
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Could not update location.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Confirm Medical & Forward to Advance Collection / Accounts
  const handleConfirmLocation = async (lead) => {
    const loc = lead.locationConfirmation?.confirmedLocation || lead.applicationForm?.preferredCountries?.[0] || 'Saudi Arabia';
    const existingRec = lead.locationConfirmation?.recordingUrl || lead.closureDetails?.recordingUrl || '';

    const { value: formValues } = await Swal.fire({
      title: 'Confirm Medical & Proceed to Advance',
      html: `
        <p class="text-xs text-gray-500 mb-2 text-left">
          Confirm 5-in-1 Medical Confirmation Dossier & forward <b>${lead.candidateName}</b> to <b>Advance Collection / Accounts Desk</b>.
        </p>
        <div class="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-left text-xs text-purple-900 mb-3 space-y-1">
          <div><b>Target Country/Location:</b> ${loc}</div>
          <div><b>Dossier Checklist:</b> 1. CV, 2. Passport, 3. Client Detail Form, 4. Medical Report, 5. Medical Condition Letter</div>
          <div><b>Next Stage:</b> ACCOUNTS_COLLECTION (Advance Billing)</div>
        </div>
        <div class="text-left mb-2">
          <label class="block text-xs font-bold text-gray-700 mb-1">
            Medical Confirmation Call Recording URL <span class="text-red-500">* (MANDATORY)</span>
          </label>
          <input id="swal-rec-url-conf" class="swal2-input !mt-0 !w-full !text-xs font-mono" placeholder="https://drive.google.com/... or audio URL" value="${existingRec}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#16A34A',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Confirm & Move to Advance',
      preConfirm: () => {
        const rec = document.getElementById('swal-rec-url-conf')?.value || '';
        if (!rec.trim()) {
          Swal.showValidationMessage('Call Recording URL is strictly MANDATORY before confirming medical placement!');
          return false;
        }
        return { recordingUrl: rec.trim() };
      }
    });

    if (!formValues) return;

    setActionLoading(true);
    try {
      await apiUpdateLocationConfirmation(lead._id, {
        confirmedLocation: loc,
        isConfirmed: true,
        outcome: 'PROCEED_ADVANCE',
        recordingUrl: formValues.recordingUrl,
        medicalPdfShared: true,
        medicalConditionsExplained: true
      });

      Swal.fire({
        icon: 'success',
        title: 'Medical Confirmed!',
        html: `File for <b>${lead.candidateName}</b> forwarded to <b>Advance Collection / Accounts</b> with verified recording.`,
        confirmButtonColor: '#2563EB'
      });

      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Confirmation Failed',
        text: err.message || 'Could not confirm location.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 3b. Client Refuses Advance -> Closed / No Advance (Mandatory Recording)
  const handleCloseNoAdvance = async (lead) => {
    const existingRec = lead.locationConfirmation?.recordingUrl || lead.closureDetails?.recordingUrl || '';

    const { value: formValues } = await Swal.fire({
      title: 'Close as "Closed / No Advance"?',
      html: `
        <div class="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 mb-3 leading-relaxed">
          <b>📌 User SOP & Compliance Notice:</b><br>
          Yadi client aage advance nahi deta hai, to uski file Calling Staff ke pass <b>Closed / No Advance</b> status me rahegi aur delete nahi hogi.<br>
          <b>Es sthiti me bhi medical confirmation call recording aniwarya hai!</b>
        </div>
        <div class="text-left mb-2">
          <label class="block text-xs font-bold text-gray-700 mb-1">
            Medical Confirmation Call Recording URL <span class="text-red-500">* (MANDATORY)</span>
          </label>
          <input id="swal-rec-url-noadv" class="swal2-input !mt-0 !w-full !text-xs font-mono" placeholder="https://drive.google.com/... or audio URL" value="${existingRec}">
        </div>
        <div class="text-left">
          <label class="block text-xs font-bold text-gray-700 mb-1">Reason / Remarks</label>
          <input id="swal-rem-noadv" class="swal2-input !mt-0 !w-full !text-xs" placeholder="Reason for not paying advance" value="Client declined advance payment after medical examination. File retained under Calling Staff as Closed / No Advance.">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: '#D97706',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Confirm (Closed / No Advance)',
      preConfirm: () => {
        const rec = document.getElementById('swal-rec-url-noadv')?.value || '';
        const rem = document.getElementById('swal-rem-noadv')?.value || '';
        if (!rec.trim()) {
          Swal.showValidationMessage('Call Recording URL is strictly MANDATORY before marking as Closed / No Advance!');
          return false;
        }
        return { recordingUrl: rec.trim(), remarks: rem.trim() };
      }
    });

    if (!formValues) return;

    setActionLoading(true);
    try {
      await apiUpdateLocationConfirmation(lead._id, {
        outcome: 'CLOSED_NO_ADVANCE',
        isNoAdvance: true,
        recordingUrl: formValues.recordingUrl,
        remarks: formValues.remarks,
        medicalPdfShared: true,
        medicalConditionsExplained: true
      });

      Swal.fire({
        icon: 'success',
        title: 'Closed (No Advance)',
        text: `Candidate ${lead.candidateName} marked as Closed / No Advance with mandatory recording saved. Retained under Calling Staff.`,
        confirmButtonColor: '#2563EB'
      });

      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Close File',
        text: err.message,
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Cancel Candidate (FRD Section 13: Cancellation exits active pipeline)
  const handleCancelCandidate = async (lead) => {
    const { value: reason } = await Swal.fire({
      title: 'Cancel Candidate File?',
      html: `Candidate <b>${lead.candidateName}</b> will be marked as <b>CANCELLED</b> and exit active recruitment.<br><br>
             Please enter the cancellation reason:`,
      input: 'text',
      inputPlaceholder: 'e.g. Candidate withdrew, visa location terms rejected...',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Cancel File'
    });

    if (!reason) return;

    try {
      await apiUpdateLocationConfirmation(lead._id, {
        isCancelled: true,
        cancellationReason: reason.trim()
      });

      Swal.fire({
        icon: 'info',
        title: 'File Cancelled',
        text: `Candidate ${lead.candidateName} has been marked CANCELLED.`,
        confirmButtonColor: '#2563EB'
      });

      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Cancellation Failed',
        text: err.message,
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // 5. Open Candidate Details & Audit Drawer
  const handleOpenDetails = async (lead) => {
    setDetailLoading(true);
    setDetailCandidate(lead);
    try {
      const [leadRes, histRes] = await Promise.allSettled([
        apiGetLeadById(lead._id),
        apiGetLeadHistory(lead._id)
      ]);
      const fullLead = leadRes.status === 'fulfilled' && leadRes.value?.data ? leadRes.value.data : lead;
      const historyEvents = histRes.status === 'fulfilled' && histRes.value?.data ? histRes.value.data : [];
      setDetailCandidate({
        ...fullLead,
        history: historyEvents.length > 0 ? historyEvents : fullLead.history || []
      });
    } catch (err) {
      console.error('Failed to load candidate details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('ALL');
    setStaffFilter('ALL');
    setSearchQuery('');
  };

  const isFilterActive = statusFilter !== 'ALL' || staffFilter !== 'ALL' || searchQuery;

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const edits = l.locationConfirmation?.editCount || 0;
      const isConfirmed = l.locationConfirmation?.isConfirmed;
      const isClosedNoAdvance = l.closureStatus === 'CLOSED_NO_ADVANCE';

      if (statusFilter === 'CLOSED_NO_ADVANCE' && !isClosedNoAdvance) return false;
      if (statusFilter === 'CONFIRMED' && !isConfirmed) return false;
      if (statusFilter === 'PENDING' && (isConfirmed || edits >= 4 || isClosedNoAdvance)) return false;
      if (statusFilter === 'CRITICAL' && (isConfirmed || edits < 3 || isClosedNoAdvance)) return false;

      return true;
    });
  }, [leads, statusFilter]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/calling/queue')} className="hover:text-blue-600 cursor-pointer">Calling Desk</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Interested Country</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Interested Country
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/calling/queue')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Go back to Calling Queue"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>Calling Queue</span>
          </button>

          <button
            onClick={() => navigate('/pre-viva/schedule')}
            className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="View Pre-Viva Management Desk"
          >
            <Send className="w-3.5 h-3.5 text-purple-200" />
            <span>Pre-Viva Desk &rarr;</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Location Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        
        {/* Card 1: Total in Location Desk */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total in Desk</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Candidates in confirmation</div>
          </div>
        </div>

        {/* Card 2: Confirmed & Ready for Pre-Viva */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Location Confirmed</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-700 font-mono leading-none">
              {metrics.confirmed}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">Ready as Move File</div>
          </div>
        </div>

        {/* Card 3: Pending Confirmation */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700">Under Discussion</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-blue-700 font-mono leading-none">
              {metrics.pending}
            </div>
            <div className="text-[11px] text-blue-600/80 mt-1 font-medium">1 to 2 edits used</div>
          </div>
        </div>

        {/* Card 4: High Edit Warning (3-4 Edits) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-rose-700">High Edit Warning</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-rose-700 font-mono leading-none">
              {metrics.critical}
            </div>
            <div className="text-[11px] text-rose-600/80 mt-1 font-medium">3+ edits (Near limit)</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Toolbar & Search */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 mb-5 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            {[
              { id: 'ALL', label: 'All Files', count: metrics.total },
              { id: 'PENDING', label: 'Under Discussion', count: metrics.pending },
              { id: 'CONFIRMED', label: 'Confirmed (Move File)', count: metrics.confirmed },
              { id: 'CRITICAL', label: 'Near 4-Edit Limit', count: metrics.critical },
              { id: 'CLOSED_NO_ADVANCE', label: 'Closed (No Advance)', count: metrics.closedNoAdvance },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white text-gray-700 border border-gray-200'
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
                placeholder="Search candidate, location, passport..."
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

      {/* 4. Location Confirmation Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        
        {/* Table Header Summary */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-gray-900 text-[15px]">
              Candidate Visa Location Records
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
              {filteredLeads.length} Candidates
            </span>
          </div>

          <div className="text-[11.5px] text-gray-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>FRD Rule: Up to 4 edit attempts permitted before auto-cancellation</span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
            <span className="text-[13px] font-medium text-gray-600">Loading location confirmation records...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-[15px]">No Candidate Records Found</h4>
            <p className="text-[12.5px] text-gray-500 mt-1 mb-4 leading-relaxed">
              There are currently no candidates matching the active location filter.
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
                  <th className="py-3.5 px-4 whitespace-nowrap">Candidate & ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Contact & Trade</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Target Location</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Edit Attempts (Max 4)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Calling Officer</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-center">Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Desk Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => {
                  const initial = lead.candidateName?.charAt(0) || 'C';
                  const edits = lead.locationConfirmation?.editCount || 0;
                  const isConfirmed = lead.locationConfirmation?.isConfirmed;
                  const targetLoc = lead.locationConfirmation?.confirmedLocation || lead.applicationForm?.preferredCountries?.[0] || 'Saudi Arabia (Pending Choice)';
                  const staffName = lead.assignedCallingStaff?.name || 'Unassigned';

                  return (
                    <tr
                      key={lead._id}
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
                              onClick={() => handleOpenDetails(lead)}
                              className="font-bold text-gray-900 text-[13px] hover:text-purple-600 hover:underline cursor-pointer"
                            >
                              {lead.candidateName}
                            </div>
                            <div className="font-mono text-[10.5px] text-purple-600 font-semibold flex items-center gap-1">
                              <span>{lead.leadId}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-600">{lead.passportNumber || 'No Passport'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact & Trade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-gray-800 text-[12px] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium pl-5">
                          {lead.trade || 'General Worker'}
                        </div>
                      </td>

                      {/* 3. Target Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-bold text-gray-900 text-[12.5px]">{targetLoc}</span>
                        </div>
                        <div className="text-[10.5px] text-gray-400 pl-5">
                          Target Destination
                        </div>
                      </td>

                      {/* 4. Edit Attempts Gauge (Max 4 Rule) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map((step) => {
                              const isFilled = step <= edits;
                              const isCurrent = step === edits;
                              return (
                                <div
                                  key={step}
                                  className={`w-5 h-2 rounded-full transition-all ${
                                    isFilled
                                      ? edits >= 4
                                        ? 'bg-rose-500'
                                        : edits >= 3
                                        ? 'bg-amber-500'
                                        : 'bg-purple-600'
                                      : 'bg-gray-200'
                                  }`}
                                  title={`Attempt ${step} of 4`}
                                />
                              );
                            })}
                          </div>
                          <span className={`text-[10.5px] font-bold font-mono ${
                            edits >= 4 ? 'text-rose-600' : edits >= 3 ? 'text-amber-600' : 'text-gray-600'
                          }`}>
                            {edits} / 4 Attempts Used
                          </span>
                        </div>
                      </td>

                      {/* 5. Calling Officer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0">
                            {staffName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[12px]">{staffName}</div>
                            <div className="text-[10px] text-gray-400">Assigned Staff</div>
                          </div>
                        </div>
                      </td>

                      {/* 6. Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {lead.closureStatus === 'CLOSED_NO_ADVANCE' ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              <span>Closed (No Advance)</span>
                            </span>
                            {(lead.closureDetails?.recordingUrl || lead.locationConfirmation?.recordingUrl) && (
                              <a
                                href={lead.closureDetails?.recordingUrl || lead.locationConfirmation?.recordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-amber-700 hover:text-amber-900 underline font-semibold flex items-center gap-0.5"
                                title="Play confirmation recording"
                              >
                                <span>Play Recording 🎧</span>
                              </a>
                            )}
                          </div>
                        ) : isConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Confirmed (Move File)</span>
                          </span>
                        ) : edits >= 4 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Final Attempt Limit</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Pending Confirmation</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Desk Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Edit Location (Attempt #X/4) */}
                          <button
                            onClick={() => handleOpenEditModal(lead)}
                            disabled={edits >= 4 || isConfirmed || lead.closureStatus === 'CLOSED_NO_ADVANCE'}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 disabled:opacity-40 text-purple-700 border border-purple-200 rounded-xl text-[11.5px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1 shadow-2xs"
                            title="Update Destination Location (Increments edit count)"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Change Loc</span>
                          </button>

                          {/* Confirm & Move to Advance Collection */}
                          <button
                            onClick={() => handleConfirmLocation(lead)}
                            disabled={isConfirmed || lead.closureStatus === 'CLOSED_NO_ADVANCE'}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-[11.5px] font-bold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1"
                            title="Confirm 5-in-1 Medical Dossier and forward to Advance Collection / Accounts"
                          >
                            <Check className="w-3 h-3" />
                            <span>Confirm & Advance</span>
                          </button>

                          {/* Client Refuses Advance -> Closed / No Advance */}
                          {lead.closureStatus !== 'CLOSED_NO_ADVANCE' && !isConfirmed && (
                            <button
                              onClick={() => handleCloseNoAdvance(lead)}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-[11.5px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1 shadow-2xs"
                              title="Client refused advance; retain file with Calling Staff with mandatory recording"
                            >
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              <span>No Adv Close</span>
                            </button>
                          )}

                          {/* Cancel Candidate */}
                          <button
                            onClick={() => handleCancelCandidate(lead)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl cursor-pointer transition-colors"
                            title="Candidate withdrew or rejected location"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>

                          {/* View Details */}
                          <button
                            onClick={() => handleOpenDetails(lead)}
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
          <span>Showing <b>{filteredLeads.length}</b> candidates in Visa Location Confirmation</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Need to check initial calling screening?</span>
            <button
              onClick={() => navigate('/calling/queue')}
              className="text-purple-600 hover:underline font-bold cursor-pointer flex items-center gap-0.5"
            >
              <span>Back to Calling Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Edit Location Modal (FRD Section 13: 4 Attempt Rule) */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-900 text-white">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-purple-300" />
                <div>
                  <h3 className="font-bold text-[16px]">Change Visa Location</h3>
                  <p className="text-[11px] text-purple-200 font-medium">
                    Attempt {(editModal.locationConfirmation?.editCount || 0) + 1} of 4 • FRD Section 13
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditModal(null)} 
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocationEdit} className="p-6 space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[12.5px]">
                Candidate: <strong>{editModal.candidateName}</strong> ({editModal.leadId})<br />
                Trade: <span className="font-semibold text-gray-700">{editModal.trade || 'General Worker'}</span>
                <div className="text-rose-600 font-bold text-[11px] mt-1">
                  ⚠️ Note: This change will consume Attempt #{(editModal.locationConfirmation?.editCount || 0) + 1} of 4.
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Popular Gulf Location
                </label>
                <select
                  value={newLocation}
                  onChange={(e) => {
                    setNewLocation(e.target.value);
                    setCustomLocation('');
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-purple-500 bg-white cursor-pointer"
                >
                  {POPULAR_GULF_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Or Enter Custom Overseas Destination / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Al-Khobar, Saudi Arabia or Salalah, Oman"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-[12.5px] font-bold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? 'Saving...' : `Save Attempt #${(editModal.locationConfirmation?.editCount || 0) + 1}`}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 6. Candidate Full Detail & Audit History Modal */}
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
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Confirmed Location</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.locationConfirmation?.confirmedLocation || 'Not Set'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Edit Attempts Used</div>
                  <div className="font-bold text-purple-700 text-[13px] mt-0.5 font-mono">
                    {detailCandidate.locationConfirmation?.editCount || 0} / 4
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">File Type</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.fileType || 'NOT_SET'}
                  </div>
                </div>
              </div>

              {/* History Log */}
              <div>
                <h4 className="font-bold text-gray-900 text-[13.5px] flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Immutable Location Change & Workflow History</span>
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
