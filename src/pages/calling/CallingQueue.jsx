import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, ChevronRight, CheckCircle2, XCircle, Clock, FileText, Search,
  ShieldCheck, Sparkles, UserPlus, MapPin, AlertTriangle, RefreshCw,
  User, ArrowRight, Send, Eye, X, RotateCcw, Filter, Calendar, Check,
  PhoneCall, Building2, Globe, Users
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  apiGetLeads,
  apiGetUsers,
  apiCategorizeLead,
  apiTransferLeadStage,
  apiGetLeadById,
  apiGetLeadHistory
} from '../../utils/api';

export default function CallingQueue() {
  const navigate = useNavigate();

  // Database States
  const [leads, setLeads] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [filterCategory, setFilterCategory] = useState('ALL'); // ALL | YES | NO | NOT_CONFIRMED
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [passportModal, setPassportModal] = useState(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');

  const [followUpModal, setFollowUpModal] = useState(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const [routeModal, setRouteModal] = useState(null); // Route candidate (Interview vs CV Selection)
  const [selectedRoute, setSelectedRoute] = useState('INTERVIEW');
  const [routeRemarks, setRouteRemarks] = useState('');

  const [detailCandidate, setDetailCandidate] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 1. Fetch live calling leads from MongoDB Atlas
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.allSettled([
        apiGetLeads({
          stage: 'CALLING_SCREENING',
          isPassportHolder: filterCategory !== 'ALL' ? filterCategory : undefined,
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
      console.error('Failed to load calling queue', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Leads',
        text: 'Failed to retrieve calling queue from database.',
        confirmButtonColor: '#2563EB'
      });
    } finally {
      setLoading(false);
    }
  }, [filterCategory, staffFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute Live Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const passportHolders = leads.filter(l => l.isPassportHolder === 'YES').length;
    const nonPassport = leads.filter(l => l.isPassportHolder === 'NO').length;
    const notConfirmed = leads.filter(l => l.isPassportHolder === 'NOT_CONFIRMED').length;

    return { total, passportHolders, nonPassport, notConfirmed };
  }, [leads]);

  // 2. Mark as Passport Holder (Capture Passport Number + Phone per FRD Section 6 & 7)
  const handleOpenPassportModal = (lead) => {
    setPassportModal(lead);
    setPassportNumber(lead.passportNumber || '');
    setConfirmPhone(lead.phone || '');
  };

  const handleSavePassport = async (e) => {
    e.preventDefault();
    if (!passportModal || !passportNumber.trim() || !confirmPhone.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Details',
        text: 'Both Passport Number and Confirmed Mobile Number are mandatory per FRD Section 6.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    setActionLoading(true);
    try {
      await apiCategorizeLead(passportModal._id, {
        isPassportHolder: 'YES',
        phone: confirmPhone.trim(),
        passportNumber: passportNumber.trim().toUpperCase()
      });

      const savedLead = passportModal;
      const validPassport = passportNumber.trim().toUpperCase();
      const validPhone = confirmPhone.trim();

      setPassportModal(null);
      setPassportNumber('');
      setConfirmPhone('');
      loadData();

      const result = await Swal.fire({
        icon: 'success',
        title: 'Passport Verified!',
        html: `Candidate <b>${savedLead.candidateName}</b> verified as Passport Holder.<br>
               <span class="font-mono text-xs text-blue-700 font-bold block mt-1">Passport: ${validPassport}</span>
               <div class="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 text-left">
                 Per FRD Section 8, complete the <b>Candidate Full Form</b> (trade, GCC experience, declaration & route allocation).
               </div>`,
        showCancelButton: true,
        confirmButtonText: 'Complete Full Candidate Form →',
        confirmButtonColor: '#2563EB',
        cancelButtonText: 'Stay in Queue',
        cancelButtonColor: '#6B7280'
      });

      if (result.isConfirmed) {
        navigate(`/candidates/add?leadId=${savedLead._id}&name=${encodeURIComponent(savedLead.candidateName)}&phone=${encodeURIComponent(validPhone)}&passport=${encodeURIComponent(validPassport)}&trade=${encodeURIComponent(savedLead.trade || '')}`);
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: err.message || 'Could not save passport status.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Mark as Non-Passport Holder (FRD Section 7: Auto-Close/Pending)
  const handleMarkNonPassport = async (lead) => {
    const confirm = await Swal.fire({
      title: 'No Passport?',
      html: `Mark <b>${lead.candidateName}</b> as <b>Non-Passport Holder</b>?<br><br>
             <span class="text-xs text-gray-500">Per CRM Rule: Candidates without a valid passport cannot proceed to Medical or Visa processing.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Mark No Passport'
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiCategorizeLead(lead._id, {
        isPassportHolder: 'NO',
        phone: lead.phone,
        passportNumber: null
      });

      Swal.fire({
        icon: 'info',
        title: 'Categorized as Non-Passport',
        text: `Candidate ${lead.candidateName} status updated to Non-Passport Holder.`,
        confirmButtonColor: '#2563EB'
      });

      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Could not update status.',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // 4. Mark as Not Confirmed / Schedule Follow-up (FRD Section 7)
  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpModal || !followUpDate) return;

    setActionLoading(true);
    try {
      await apiCategorizeLead(followUpModal._id, {
        isPassportHolder: 'NOT_CONFIRMED',
        phone: followUpModal.phone,
        passportNumber: followUpModal.passportNumber || null
      });

      Swal.fire({
        icon: 'success',
        title: 'Follow-up Scheduled',
        html: `Follow-up set for <b>${followUpModal.candidateName}</b> on <b>${followUpDate}</b>.<br>
               <span class="text-xs text-gray-500">${followUpNotes || 'No notes added'}</span>`,
        confirmButtonColor: '#2563EB'
      });

      setFollowUpModal(null);
      setFollowUpDate('');
      setFollowUpNotes('');
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Save Follow-up',
        text: err.message,
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Candidate Routing: Interview vs Direct CV Selection (FRD Section 9)
  const handleApplyRouting = async (e) => {
    e.preventDefault();
    if (!routeModal) return;

    const toStage = selectedRoute === 'INTERVIEW' ? 'INITIAL_INTERVIEW' : 'MEDICAL_PROCESS';
    const selectionMode = selectedRoute === 'INTERVIEW' ? 'INTERVIEW' : 'DIRECT_CV';

    setActionLoading(true);
    try {
      await apiTransferLeadStage(routeModal._id, {
        fromStage: 'CALLING_SCREENING',
        toStage,
        selectionMode,
        remarks: routeRemarks.trim() || `Candidate routed via ${selectedRoute === 'INTERVIEW' ? 'Interview Panel' : 'Direct CV Selection'} by Calling Staff`
      });

      Swal.fire({
        icon: 'success',
        title: selectedRoute === 'INTERVIEW' ? 'Transferred to Interview Panel!' : 'Selected by CV & Moved to Medical!',
        html: `Candidate <b>${routeModal.candidateName}</b> successfully transferred to <b>${toStage.replace(/_/g, ' ')}</b>.<br>
               <span class="text-xs text-gray-500 mt-2 block">Action logged to immutable audit history.</span>`,
        confirmButtonColor: '#2563EB'
      });

      setRouteModal(null);
      setRouteRemarks('');
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Routing Failed',
        text: err.message || 'Could not route candidate.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 6. View Candidate Details & Audit Log
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
    setFilterCategory('ALL');
    setStaffFilter('ALL');
    setSearchQuery('');
  };

  const isFilterActive = filterCategory !== 'ALL' || staffFilter !== 'ALL' || searchQuery;

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Calling & Screening</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Calling List & Passport Verification
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/calling/location-confirm')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Go to Step 13 Visa Location Confirmation Desk"
          >
            <MapPin className="w-3.5 h-3.5 text-purple-600" />
            <span>Confirm Visa Location &rarr;</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Calling Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        
        {/* Card 1: Total Leads in Queue */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total in Queue</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Assigned leads for calling</div>
          </div>
        </div>

        {/* Card 2: Passport Holders (Ready) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Has Passport</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-700 font-mono leading-none">
              {metrics.passportHolders}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">Eligible for interview/CV</div>
          </div>
        </div>

        {/* Card 3: Non-Passport Holders (Closed) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-rose-700">No Passport</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-rose-700 font-mono leading-none">
              {metrics.nonPassport}
            </div>
            <div className="text-[11px] text-rose-600/80 mt-1 font-medium">Closed / Pending passport</div>
          </div>
        </div>

        {/* Card 4: Follow-up / Not Confirmed */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Not Confirmed</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-700 font-mono leading-none">
              {metrics.notConfirmed}
            </div>
            <div className="text-[11px] text-amber-600/80 mt-1 font-medium">Follow-up re-call needed</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Toolbar & Search */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 mb-5 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            {[
              { id: 'ALL', label: 'All Leads', count: metrics.total },
              { id: 'YES', label: 'Has Passport', count: metrics.passportHolders, color: 'text-emerald-700' },
              { id: 'NO', label: 'No Passport', count: metrics.nonPassport, color: 'text-rose-700' },
              { id: 'NOT_CONFIRMED', label: 'Pending Follow-up', count: metrics.notConfirmed, color: 'text-amber-700' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  filterCategory === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${
                  filterCategory === tab.id ? 'bg-white/20 text-white' : 'bg-white text-gray-700 border border-gray-200'
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
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer min-w-[150px]"
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
                placeholder="Search candidate, phone, trade, passport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-gray-400"
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

            {/* Reset Filter Button */}
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

      {/* 4. Leads Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        
        {/* Table Header Summary */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-gray-900 text-[15px]">
              Assigned Candidate Queue
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              {leads.length} Leads
            </span>
          </div>

          <div className="text-[11.5px] text-gray-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>FRD Rule: Capture Passport + Phone for verified candidates</span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <span className="text-[13px] font-medium text-gray-600">Loading calling queue from database...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-[15px]">No Candidates in Queue</h4>
            <p className="text-[12.5px] text-gray-500 mt-1 mb-4 leading-relaxed">
              There are currently no leads in the calling screening queue matching your filter.
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
                  <th className="py-3.5 px-4 whitespace-nowrap">Phone & Origin</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Trade & Experience</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Passport Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Calling Staff</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Classification Action</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Next Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => {
                  const initial = lead.candidateName?.charAt(0) || 'C';
                  const isPassport = lead.isPassportHolder === 'YES';
                  const isNonPassport = lead.isPassportHolder === 'NO';
                  const staffName = lead.assignedCallingStaff?.name || 'Unassigned';

                  return (
                    <tr
                      key={lead._id}
                      className="hover:bg-emerald-50/20 transition-colors"
                    >
                      {/* 1. Candidate & ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div 
                              onClick={() => handleOpenDetails(lead)}
                              className="font-bold text-gray-900 text-[13px] hover:text-emerald-700 hover:underline cursor-pointer"
                            >
                              {lead.candidateName}
                            </div>
                            <div className="font-mono text-[10.5px] text-emerald-600 font-semibold flex items-center gap-1">
                              <span>{lead.leadId}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-500 font-normal">{lead.source}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Phone & Origin */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <a 
                          href={`tel:${lead.phone}`}
                          className="font-mono font-bold text-gray-900 hover:text-blue-600 text-[12px] flex items-center gap-1.5"
                          title="Click to call candidate"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lead.phone}</span>
                        </a>
                        <div className="text-[11px] text-gray-400 pl-5">
                          {lead.city || lead.state || 'India'}
                        </div>
                      </td>

                      {/* 3. Trade & Experience */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800 text-[12.5px] max-w-[180px] truncate" title={lead.trade}>
                          {lead.trade || 'General Worker'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium">
                          Exp: {lead.applicationForm?.experienceYears || 'Fresher'} yrs
                        </div>
                      </td>

                      {/* 4. Passport Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPassport ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Passport Holder</span>
                            </span>
                            <span className="font-mono text-[11px] font-bold text-gray-700 pl-1">
                              {lead.passportNumber || 'Pending Entry'}
                            </span>
                          </div>
                        ) : isNonPassport ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>No Passport</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Not Confirmed</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Calling Staff */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0">
                            {staffName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[12px]">{staffName}</div>
                            <div className="text-[10px] text-gray-400">Calling Officer</div>
                          </div>
                        </div>
                      </td>

                      {/* 6. Classification Action Buttons */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Has Passport */}
                          <button
                            onClick={() => handleOpenPassportModal(lead)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11.5px] font-bold cursor-pointer transition-colors shadow-2xs"
                            title="Verify Indian Passport"
                          >
                            ✓ Has Passport
                          </button>

                          {/* No Passport */}
                          <button
                            onClick={() => handleMarkNonPassport(lead)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11.5px] font-medium cursor-pointer transition-colors shadow-2xs"
                            title="Candidate does not hold passport"
                          >
                            ✗ No Passport
                          </button>

                          {/* Call Later */}
                          <button
                            onClick={() => {
                              setFollowUpModal(lead);
                              setFollowUpDate('');
                              setFollowUpNotes('');
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11.5px] font-medium cursor-pointer transition-colors shadow-2xs"
                            title="Schedule follow-up reminder"
                          >
                            ⏰ Call Later
                          </button>
                        </div>
                      </td>

                      {/* 7. Next Step: Full Form + Route to Interview / CV Selection (FRD Section 8 & 9) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isPassport ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Complete Full Form Button (FRD Section 8) */}
                            <button
                              onClick={() => navigate(`/candidates/add?leadId=${lead._id}&name=${encodeURIComponent(lead.candidateName)}&phone=${encodeURIComponent(lead.phone)}&passport=${encodeURIComponent(lead.passportNumber || '')}&trade=${encodeURIComponent(lead.trade || '')}`)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1 border ${
                                lead.applicationForm?.fatherName || lead.applicationForm?.dob
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              }`}
                              title="Fill / Edit Full Candidate Official Form (FRD Section 8)"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{lead.applicationForm?.fatherName || lead.applicationForm?.dob ? 'Form OK' : 'Full Form'}</span>
                            </button>

                            <button
                              onClick={() => {
                                setRouteModal(lead);
                                setSelectedRoute('INTERVIEW');
                                setRouteRemarks('');
                              }}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11.5px] font-bold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1"
                              title="Route candidate to Interview Panel or Direct CV Selection"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Route</span>
                            </button>

                            <button
                              onClick={() => handleOpenDetails(lead)}
                              className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11.5px] italic">Verify Passport First</span>
                        )}
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
          <span>Showing <b>{leads.length}</b> leads in Calling Screening queue</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Need to confirm overseas job location?</span>
            <button
              onClick={() => navigate('/calling/location-confirm')}
              className="text-purple-600 hover:underline font-bold cursor-pointer flex items-center gap-0.5"
            >
              <span>Go to Step 13 Location Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Passport Details Entry Modal */}
      {passportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-800 text-white">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-[16px]">Capture Indian Passport</h3>
                  <p className="text-[11px] text-emerald-200 font-medium">FRD Section 06 • Passport Number & Phone Mandate</p>
                </div>
              </div>
              <button 
                onClick={() => setPassportModal(null)} 
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassport} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[12.5px] space-y-0.5">
                <div>Candidate: <strong className="text-gray-900">{passportModal.candidateName}</strong> ({passportModal.leadId})</div>
                <div>Trade: <span className="font-semibold text-gray-700">{passportModal.trade || 'General Worker'}</span></div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Valid Passport Number * (Format: A1234567)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Z9876543"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirmed Calling Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={confirmPhone}
                  onChange={(e) => setConfirmPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPassportModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[12.5px] font-bold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</>
                  ) : (
                    <>Save & Unlock Candidate Form</>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 6. Schedule Follow-up Modal */}
      {followUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-800 text-white">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-[16px]">Schedule Follow-up Call</h3>
                  <p className="text-[11px] text-amber-200 font-medium">Candidate not yet confirmed or requested callback</p>
                </div>
              </div>
              <button 
                onClick={() => setFollowUpModal(null)} 
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12.5px]">
                Calling Candidate: <strong>{followUpModal.candidateName}</strong> ({followUpModal.phone})
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Follow-up Date *
                </label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Follow-up Notes / Calling Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Candidate was driving, requested callback at 4 PM tomorrow..."
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setFollowUpModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-[12.5px] font-bold cursor-pointer shadow-sm transition-all"
                >
                  {actionLoading ? 'Saving...' : 'Set Follow-up'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 7. Candidate Routing Modal (FRD Section 9: Interview vs CV Selection) */}
      {routeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-900 text-white">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="font-bold text-[16px]">Route Candidate to Next Stage</h3>
                  <p className="text-[11px] text-blue-200 font-medium">FRD Section 09 • Interview vs CV Selection</p>
                </div>
              </div>
              <button 
                onClick={() => setRouteModal(null)} 
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyRouting} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px]">
                Candidate: <strong>{routeModal.candidateName}</strong> ({routeModal.leadId})<br />
                Passport: <strong className="font-mono text-emerald-700">{routeModal.passportNumber}</strong> • Trade: {routeModal.trade}
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Workflow Route *
                </label>
                <div className="space-y-2">
                  
                  {/* Option A: Interview Panel */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRoute === 'INTERVIEW' ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="candidateRoute"
                      value="INTERVIEW"
                      checked={selectedRoute === 'INTERVIEW'}
                      onChange={() => setSelectedRoute('INTERVIEW')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-bold text-[12.5px] text-gray-900">Option A: Transfer to Interview Panel</div>
                      <div className="text-[11px] text-gray-500">Candidate moves to Interview Panel (Step 04) for trade test & viva evaluation.</div>
                    </div>
                  </label>

                  {/* Option B: CV Selection */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRoute === 'DIRECT_CV' ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="candidateRoute"
                      value="DIRECT_CV"
                      checked={selectedRoute === 'DIRECT_CV'}
                      onChange={() => setSelectedRoute('DIRECT_CV')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <div className="font-bold text-[12.5px] text-gray-900">Option B: Selected by CV (Bypass Interview)</div>
                      <div className="text-[11px] text-gray-500">Candidate bypasses interview panel and moves straight to Medical & Payment Booking (Step 05).</div>
                    </div>
                  </label>

                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Routing Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. GCC returned driver, Gulf license verified, sent for trade test..."
                  value={routeRemarks}
                  onChange={(e) => setRouteRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRouteModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-[12.5px] font-bold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? 'Routing...' : 'Confirm Stage Transfer'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 8. Candidate Full Detail & Audit History Modal */}
      {detailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-[13px] flex items-center justify-center">
                  {detailCandidate.candidateName?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-[16px]">{detailCandidate.candidateName}</h3>
                  <p className="text-[11.5px] text-emerald-300 font-mono">
                    {detailCandidate.leadId} • {detailCandidate.phone}
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
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Passport Number</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5 font-mono">
                    {detailCandidate.passportNumber || 'No Passport'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Trade Skill</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.trade || 'General Worker'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Calling Officer</div>
                  <div className="font-bold text-blue-700 text-[13px] mt-0.5">
                    {detailCandidate.assignedCallingStaff?.name || 'Unassigned'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Location / State</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.city || detailCandidate.state || 'India'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Lead Source</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.source}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Hold Status</div>
                  <div className="font-bold text-[13px] mt-0.5">
                    {detailCandidate.isHold ? (
                      <span className="text-rose-600 font-bold">On Hold</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">Active</span>
                    )}
                  </div>
                </div>
              </div>

              {/* History Log */}
              <div>
                <h4 className="font-bold text-gray-900 text-[13.5px] flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Immutable Activity & Audit History</span>
                </h4>

                {detailLoading ? (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                    Loading audit trail...
                  </div>
                ) : !detailCandidate.history || detailCandidate.history.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500 text-xs">
                    No activity history recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {detailCandidate.history.map((h, i) => (
                      <div key={h._id || i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px]">
                        <div className="flex items-center justify-between text-gray-500 mb-1">
                          <span className="font-bold text-emerald-800 font-mono text-[11px] bg-emerald-100 px-2 py-0.5 rounded">
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
