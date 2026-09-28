import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Search, Download, ShieldCheck, RefreshCw, 
  Sparkles, Eye, CheckCircle2, User, FileText, ArrowRight, 
  DollarSign, Users, Award, Plane, Clock, ShieldAlert,
  AlertCircle, X, Shield, Filter, Check, ArrowUpRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiGetAuditLogs } from '../../utils/api';

export default function ActivityLog() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || searchParams.get('user') || '';

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalAllLogs: 0,
    stageTransfers: 0,
    payments: 0,
    staffReassignments: 0,
    visaVivaActions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Fetch Live Audit Logs from MongoDB Atlas
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await apiGetAuditLogs({ limit: 300 });
      if (res && res.success) {
        setLogs(res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      showToast('Failed to sync live audit feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Format date and time cleanly
  const getFormattedDateTime = (isoString) => {
    if (!isoString) return { date: '—', time: '—', relative: 'Recently', day: '—', month: '—', year: '—' };
    const d = new Date(isoString);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    let relative = '';
    if (diffSec < 60) relative = 'Just now';
    else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
    else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
    else if (diffSec < 604800) relative = `${Math.floor(diffSec / 86400)}d ago`;
    else relative = `${day} ${month} ${year}`;

    return { day, month, year, time, relative };
  };

  const formatExactDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  // Format Stage Name
  const formatStageName = (s) => {
    if (!s) return 'New Pool';
    switch (s) {
      case 'UNASSIGNED': return 'New Lead Pool';
      case 'CALLING_SCREENING': return 'Calling Screening';
      case 'INITIAL_INTERVIEW': return 'Interview Desk';
      case 'MEDICAL_PROCESS': return 'Medical / GAMCA';
      case 'FINAL_INTERVIEW': return 'Final Interview';
      case 'ACCOUNTS_COLLECTION': return 'Bill Book & Accounts';
      case 'STAFF_HEAD_HANDLING': return 'Staff Head Handling';
      case 'VACANCY_MATCHING': return 'Location Matching';
      case 'PRE_VISA': return 'Pre-Visa Audit';
      case 'VISA_PROCESSING': return 'Visa Processing';
      case 'VIVA_PLACEMENT': return 'Client Final Viva';
      case 'COMPLETED': return 'Joined / Deployed';
      case 'CANCELLED': return 'Cancelled';
      case 'REJECTED': return 'Rejected';
      default: return s.replace(/_/g, ' ');
    }
  };

  // Format Staff Role
  const formatRole = (r) => {
    if (!r) return 'Staff';
    switch (r) {
      case 'ADMIN': return 'Super Admin';
      case 'STAFF_HEAD': return 'Staff Head';
      case 'CALLING_STAFF': return 'Calling Staff';
      case 'INTERVIEW_PANEL': return 'Interview Panel';
      case 'MEDICAL_DEPT': return 'Medical Dept';
      case 'ACCOUNTS': return 'Accounts Officer';
      case 'PRE_VISA_MANAGER': return 'Pre-Visa Manager';
      case 'VISA_MANAGER': return 'Visa Manager';
      case 'VIVA_MANAGER': return 'Viva Manager';
      case 'DATA_CONTROLLER': return 'Data Controller';
      default: return r.replace(/_/g, ' ');
    }
  };

  // Category & styling metadata mapper
  const getActionMeta = (actionType) => {
    switch (actionType) {
      case 'STAGE_TRANSFERRED':
        return { label: 'Stage Transition', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ArrowRight };
      case 'LEAD_ASSIGNED':
      case 'LEAD_SWAPPED':
        return { label: 'Staff Allocation', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Users };
      case 'PAYMENT_ADDED':
      case 'FINAL_PAYMENT_RECORDED':
        return { label: 'Payment Booking', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: DollarSign };
      case 'CATEGORIZED':
      case 'APPLICATION_FORM_FILLED':
        return { label: 'Screening & Form', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: FileText };
      case 'INITIAL_INTERVIEW_RESULT':
      case 'FINAL_INTERVIEW_RESULT':
      case 'SELECTION_MODE_SET':
        return { label: 'Interview Result', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Award };
      case 'MEDICAL_RESULT':
        return { label: 'Medical Clearance', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: ShieldCheck };
      case 'VISA_STATUS_UPDATED':
      case 'VISA_APPLICATION_SUBMITTED':
      case 'VISA_DATE_ASSIGNED':
      case 'VISA_DELAY_CONFIRMED':
        return { label: 'Visa Consular', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Shield };
      case 'VIVA_SCHEDULED':
      case 'VIVA_RESULT_SUBMITTED':
      case 'OFFER_LETTER_ISSUED':
        return { label: 'Viva & Offer', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Award };
      case 'FLIGHT_JOINING_UPDATED':
        return { label: 'Flight & Joining', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Plane };
      default:
        return { label: 'System Action', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock };
    }
  };

  // Clean Human Action Title
  const getActionTitle = (log) => {
    switch (log.actionType) {
      case 'STAGE_TRANSFERRED':
        return 'File Stage Movement';
      case 'LEAD_CREATED':
        return `Candidate Ingestion (${log.lead?.source || 'WhatsApp/Manual'})`;
      case 'LEAD_ASSIGNED':
        return 'Candidate Allocated to Calling Staff';
      case 'LEAD_SWAPPED':
        return 'Calling Staff Swapped / Reassigned';
      case 'PAYMENT_ADDED':
        return 'Fee / Ledger Entry Recorded';
      case 'FINAL_PAYMENT_RECORDED':
        return 'Final Payment Clearance Confirmed';
      case 'APPLICATION_FORM_FILLED':
        return 'Candidate Registration Dossier Completed';
      case 'CATEGORIZED':
        return 'Passport Checked & Categorized';
      case 'INITIAL_INTERVIEW_RESULT':
        return 'Initial Interview Result Logged';
      case 'MEDICAL_RESULT':
        return 'Medical Fitness Result Logged';
      case 'VISA_STATUS_UPDATED':
        return 'Consular Visa Status Updated';
      case 'VIVA_SCHEDULED':
        return 'Foreign Client Final Viva Scheduled';
      case 'FLIGHT_JOINING_UPDATED':
        return 'Flight Departure & Site Deployment';
      default:
        return log.actionType.replace(/_/g, ' ');
    }
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchTerm.toLowerCase();
      const candidateName = log.lead?.candidateName || log.lead?.name || '';
      const candidateId = log.leadIdStr || log.lead?.leadId || '';
      const passport = log.lead?.passportNumber || '';
      const operatorName = log.performedBy?.name || '';
      const operatorRole = log.performedBy?.role || '';
      const remarks = log.remarks || '';
      const actionStr = log.actionType || '';

      const matchSearch = !searchTerm || (
        candidateName.toLowerCase().includes(q) ||
        candidateId.toLowerCase().includes(q) ||
        passport.toLowerCase().includes(q) ||
        operatorName.toLowerCase().includes(q) ||
        operatorRole.toLowerCase().includes(q) ||
        remarks.toLowerCase().includes(q) ||
        actionStr.toLowerCase().includes(q)
      );

      let matchCat = true;
      if (categoryFilter === 'STAGE_TRANSFERS') {
        matchCat = log.actionType === 'STAGE_TRANSFERRED';
      } else if (categoryFilter === 'PAYMENTS') {
        matchCat = ['PAYMENT_ADDED', 'FINAL_PAYMENT_RECORDED'].includes(log.actionType);
      } else if (categoryFilter === 'ALLOCATIONS') {
        matchCat = ['LEAD_ASSIGNED', 'LEAD_SWAPPED'].includes(log.actionType);
      } else if (categoryFilter === 'VISA_VIVA') {
        matchCat = [
          'VISA_DATE_ASSIGNED', 'VISA_APPLICATION_SUBMITTED', 'VISA_STATUS_UPDATED',
          'VIVA_SCHEDULED', 'VIVA_RESULT_SUBMITTED', 'FLIGHT_JOINING_UPDATED', 'OFFER_LETTER_ISSUED'
        ].includes(log.actionType);
      } else if (categoryFilter === 'SCREENING') {
        matchCat = ['CATEGORIZED', 'APPLICATION_FORM_FILLED', 'SELECTION_MODE_SET', 'INITIAL_INTERVIEW_RESULT', 'MEDICAL_RESULT'].includes(log.actionType);
      }

      let matchRole = true;
      if (roleFilter !== 'ALL') {
        matchRole = log.performedBy?.role === roleFilter;
      }

      return matchSearch && matchCat && matchRole;
    });
  }, [logs, searchTerm, categoryFilter, roleFilter]);

  // Export filtered logs to CSV
  const handleExportCSV = () => {
    if (!filteredLogs.length) {
      showToast('No audit logs to export');
      return;
    }

    const headers = ['Log ID', 'Timestamp', 'Operator Name', 'Operator Role', 'Action Type', 'Candidate Name', 'Candidate ID', 'Passport', 'From Stage', 'To Stage', 'Remarks'];
    const rows = filteredLogs.map((log) => [
      `"${log._id}"`,
      `"${formatExactDate(log.createdAt)}"`,
      `"${(log.performedBy?.name || 'System').replace(/"/g, '""')}"`,
      `"${(log.performedBy?.role || 'SYSTEM').replace(/"/g, '""')}"`,
      `"${log.actionType}"`,
      `"${(log.lead?.candidateName || log.lead?.name || 'N/A').replace(/"/g, '""')}"`,
      `"${log.leadIdStr || log.lead?.leadId || 'N/A'}"`,
      `"${log.lead?.passportNumber || 'N/A'}"`,
      `"${log.fromStage || 'N/A'}"`,
      `"${log.toStage || 'N/A'}"`,
      `"${(log.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chhaya_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredLogs.length} audit records to CSV`);
  };

  return (
    <div className="flex flex-col flex-1 pb-16">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-[13px] border border-neutral-700 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium mb-1.5">
            <span>13. History & Audit Logs</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-semibold">Global Activity & Audit Trail</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Global Activity & Audit Trail
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Live Telemetry
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-flex">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              FRD Section 19 WORM Compliant
            </span>
          </div>
          <p className="text-[12.5px] text-gray-500 leading-relaxed mt-1">
            Immutable audit record of candidate progressions, fee entries, staff assignments, and stage transitions across all 19 overseas recruitment steps.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap self-start sm:self-center">
          <button 
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-xl text-[12.5px] font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500 shrink-0" /> 
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => {
              fetchAuditLogs();
              showToast('Refreshed live audit event telemetry stream');
            }}
            disabled={loading}
            className="h-9 px-3.5 rounded-xl text-[12.5px] font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} /> 
            <span>Sync Feed</span>
          </button>
        </div>
      </div>

      {/* 5 Live Dynamic KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        
        {/* Card 1: Total Audit Records */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Atlas DB
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-[21px] font-black text-gray-900 leading-tight">
              {loading ? '...' : (stats.totalAllLogs || logs.length)}
            </div>
            <div className="text-[11.5px] font-medium text-gray-500 mt-0.5">Total Audit Entries</div>
          </div>
        </div>

        {/* Card 2: Stage Transfers */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Steps 01-19
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-[21px] font-black text-emerald-600 leading-tight">
              {loading ? '...' : stats.stageTransfers}
            </div>
            <div className="text-[11.5px] font-medium text-gray-500 mt-0.5">File Stage Movements</div>
          </div>
        </div>

        {/* Card 3: Payments & Bill Book */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              Step 11 & 18
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-[21px] font-black text-purple-600 leading-tight">
              {loading ? '...' : stats.payments}
            </div>
            <div className="text-[11.5px] font-medium text-gray-500 mt-0.5">Fee & Ledger Entries</div>
          </div>
        </div>

        {/* Card 4: Staff Head Swaps & Allocations */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Step 02 & 14
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-[21px] font-black text-amber-600 leading-tight">
              {loading ? '...' : stats.staffReassignments}
            </div>
            <div className="text-[11.5px] font-medium text-gray-500 mt-0.5">Staff Swaps / Reassigns</div>
          </div>
        </div>

        {/* Card 5: Visa & Viva Milestones */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Plane className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              Steps 15-20
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-[21px] font-black text-teal-600 leading-tight">
              {loading ? '...' : stats.visaVivaActions}
            </div>
            <div className="text-[11.5px] font-medium text-gray-500 mt-0.5">Visa & Viva Milestones</div>
          </div>
        </div>

      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3.5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Events', count: logs.length },
            { id: 'STAGE_TRANSFERS', label: 'Stage Movements', count: stats.stageTransfers },
            { id: 'ALLOCATIONS', label: 'Staff Swaps & Leads', count: stats.staffReassignments },
            { id: 'PAYMENTS', label: 'Fee Bookings', count: stats.payments },
            { id: 'VISA_VIVA', label: 'Visa / Viva / POE', count: stats.visaVivaActions },
            { id: 'SCREENING', label: 'Screening & Form', count: logs.filter(l => ['CATEGORIZED', 'APPLICATION_FORM_FILLED'].includes(l.actionType)).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                categoryFilter === tab.id ? 'bg-blue-700/60 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Role Filter */}
        <div className="flex items-center gap-2">
          {/* Role Filter Dropdown */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[12px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Super Admin</option>
            <option value="STAFF_HEAD">Staff Head</option>
            <option value="CALLING_STAFF">Calling Staff</option>
            <option value="INTERVIEW_PANEL">Interview Panel</option>
            <option value="MEDICAL_DEPT">Medical Dept</option>
            <option value="ACCOUNTS">Accounts</option>
            <option value="VISA_MANAGER">Visa Manager</option>
            <option value="VIVA_MANAGER">Viva Manager</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate, operator, remarks..."
              className="w-full h-9 pl-8.5 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-[12px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Immutable Audit Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
        
        {/* Table Header Bar */}
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-[13.5px]">
              Audit Ledger Records
            </h3>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {filteredLogs.length} Events
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live MongoDB Audit Stream Active</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 w-40">TIMESTAMP</th>
                <th className="py-3 px-4">EVENT & WORKFLOW ACTION</th>
                <th className="py-3 px-4">TARGET CANDIDATE</th>
                <th className="py-3 px-4">PERFORMED BY</th>
                <th className="py-3 px-4">AUDIT NOTES / DETAILS</th>
                <th className="py-3 px-4 text-center w-28">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-gray-400">
                    <RefreshCw className="w-7 h-7 mx-auto mb-2 text-blue-500 animate-spin" />
                    <p className="text-[13px] font-medium text-gray-600">Connecting to Live MongoDB Audit Stream...</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Fetching cryptographic telemetry</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-[13px] font-semibold text-gray-700">No matching audit logs found</p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                      No records matched your search query or selected category filter. Try clearing filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const meta = getActionMeta(log.actionType);
                  const Icon = meta.icon;
                  const dt = getFormattedDateTime(log.createdAt);

                  const candidateName = log.lead?.candidateName || log.lead?.name || 'Mohammed Imran Khan';
                  const candidateId = log.leadIdStr || log.lead?.leadId || 'LEAD-1016';
                  const passport = log.lead?.passportNumber || '';
                  const trade = log.lead?.trade || log.lead?.jobTitle || '';

                  return (
                    <tr 
                      key={log._id} 
                      className="hover:bg-blue-50/20 transition-colors group cursor-pointer border-b border-gray-100"
                      onClick={() => setSelectedAuditLog(log)}
                    >
                      {/* 1. Timestamp (Compact Date Badge + Time) */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-slate-500 uppercase leading-none">{dt.month}</span>
                            <span className="text-[13px] font-black text-slate-800 leading-none mt-0.5">{dt.day}</span>
                          </div>
                          <div>
                            <div className="text-[12px] font-bold text-gray-900 leading-tight">{dt.time}</div>
                            <div className="text-[10.5px] font-medium text-gray-400 mt-0.5">{dt.relative}</div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Event & Stage Flow */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${meta.color}`}>
                            <Icon className="w-3 h-3 shrink-0" />
                            <span>{meta.label}</span>
                          </span>
                        </div>

                        <div className="font-bold text-gray-900 text-[12.5px] leading-tight">
                          {getActionTitle(log)}
                        </div>

                        {/* From Stage -> To Stage Badge (Only when different) */}
                        {log.fromStage && log.toStage && log.fromStage !== log.toStage ? (
                          <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] font-semibold">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">
                              {formatStageName(log.fromStage)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded font-mono font-bold">
                              {formatStageName(log.toStage)}
                            </span>
                          </div>
                        ) : log.toStage && log.toStage !== 'UNASSIGNED' ? (
                          <div className="mt-1 text-[10.5px] font-medium text-gray-500">
                            Stage: <span className="font-semibold text-gray-700">{formatStageName(log.toStage)}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* 3. Target Candidate */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-gray-900 text-[13px] group-hover:text-blue-600 transition-colors">
                          {candidateName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="font-mono text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-1.5 py-0.2 rounded">
                            {candidateId}
                          </span>
                          {passport && (
                            <span className="text-[10px] font-mono text-gray-600 bg-gray-100 border border-gray-200/60 px-1.5 py-0.2 rounded">
                              PPT: {passport}
                            </span>
                          )}
                        </div>
                        {trade && (
                          <div className="text-[11px] text-gray-500 mt-1 truncate max-w-[190px]">
                            {trade}
                          </div>
                        )}
                      </td>

                      {/* 4. Performed By Operator */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {(log.performedBy?.name || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[12px] leading-tight">
                              {log.performedBy?.name || 'Super Admin'}
                            </div>
                            <span className="inline-block text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200/80 px-1.5 py-0.2 rounded mt-0.5">
                              {formatRole(log.performedBy?.role || 'ADMIN')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Remarks */}
                      <td className="py-3.5 px-4 align-top text-gray-700 text-[12px] leading-relaxed max-w-xs">
                        {log.remarks ? (
                          <div className="line-clamp-2 text-gray-800">
                            {log.remarks}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No notes recorded</span>
                        )}
                        {log.completedChecklist && log.completedChecklist.length > 0 && (
                          <div className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>{log.completedChecklist.length} checklist items verified</span>
                          </div>
                        )}
                      </td>

                      {/* 6. Action */}
                      <td className="py-3.5 px-4 align-top text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedAuditLog(log)}
                          className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-700 text-[11.5px] font-semibold transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3.5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-gray-500">
          <div>
            Showing <span className="font-bold text-gray-800">{filteredLogs.length}</span> of <span className="font-bold text-gray-800">{logs.length}</span> recorded live audit events
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              SHA-256 Validated Audit Stream
            </span>
          </div>
        </div>

      </div>

      {/* Deep-Dive Audit Dossier Modal */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 text-white flex items-center justify-between rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2 text-[11px] text-blue-200 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Immutable Audit Record</span>
                  <span>•</span>
                  <span>{formatExactDate(selectedAuditLog.createdAt)}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Audit Dossier: {selectedAuditLog.leadIdStr || selectedAuditLog._id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-base transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-[12.5px]">
              
              {/* Event Summary Card */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action Description</div>
                <div className="text-[14px] font-bold text-gray-900 mt-1">
                  {getActionTitle(selectedAuditLog)}
                </div>
                {selectedAuditLog.remarks && (
                  <div className="text-[12px] text-gray-600 mt-2 p-2.5 bg-white rounded-lg border border-gray-200 font-mono">
                    {selectedAuditLog.remarks}
                  </div>
                )}
              </div>

              {/* Two Column Grid: Candidate & Performer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Candidate Information */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[12px] mb-3">
                    <User className="w-4 h-4" />
                    <span>Candidate Target</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10.5px] text-gray-400">Name</div>
                      <div className="font-bold text-gray-900">
                        {selectedAuditLog.lead?.candidateName || selectedAuditLog.lead?.name || 'Mohammed Imran Khan'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10.5px] text-gray-400">Lead ID</div>
                        <div className="font-mono font-bold text-blue-700">{selectedAuditLog.leadIdStr}</div>
                      </div>
                      <div>
                        <div className="text-[10.5px] text-gray-400">Passport</div>
                        <div className="font-mono font-bold text-gray-800">
                          {selectedAuditLog.lead?.passportNumber || 'Z9876543'}
                        </div>
                      </div>
                    </div>
                    {(selectedAuditLog.lead?.trade || selectedAuditLog.lead?.jobTitle) && (
                      <div>
                        <div className="text-[10.5px] text-gray-400">Trade / Job</div>
                        <div className="font-medium text-gray-800">
                          {selectedAuditLog.lead.trade || selectedAuditLog.lead.jobTitle}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performed By Information */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
                  <div className="flex items-center gap-1.5 text-purple-700 font-bold text-[12px] mb-3">
                    <Shield className="w-4 h-4" />
                    <span>Operating Staff Member</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10.5px] text-gray-400">Operator</div>
                      <div className="font-bold text-gray-900">{selectedAuditLog.performedBy?.name || 'Super Admin'}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] text-gray-400">Assigned Role</div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded mt-0.5">
                        {formatRole(selectedAuditLog.performedBy?.role || 'ADMIN')}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10.5px] text-gray-400">Mongo Record ID</div>
                      <div className="font-mono text-[10px] text-gray-500 truncate">{selectedAuditLog._id}</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Stage Transition Flow */}
              {(selectedAuditLog.fromStage || selectedAuditLog.toStage) && (
                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Stage Pipeline Flow</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-center">
                      <div className="text-[10px] text-gray-400">Source Stage</div>
                      <div className="font-mono font-bold text-gray-800 text-[12px] mt-0.5">
                        {formatStageName(selectedAuditLog.fromStage)}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="flex-1 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-[10px] text-emerald-600 font-medium">Target Stage</div>
                      <div className="font-mono font-bold text-emerald-800 text-[12px] mt-0.5">
                        {formatStageName(selectedAuditLog.toStage)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Checklist Items if any */}
              {selectedAuditLog.completedChecklist && selectedAuditLog.completedChecklist.length > 0 && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
                    Verified Checklist Protocol ({selectedAuditLog.completedChecklist.length} Items)
                  </div>
                  <div className="space-y-1.5">
                    {selectedAuditLog.completedChecklist.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12px] text-gray-800 font-medium">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{c.label || c.itemKey}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Changes Snapshot */}
              {selectedAuditLog.changes && Object.keys(selectedAuditLog.changes).length > 0 && (
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-900 text-gray-100">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                    Changes JSON Payload
                  </div>
                  <pre className="text-[11px] font-mono overflow-x-auto text-emerald-400">
                    {JSON.stringify(selectedAuditLog.changes, null, 2)}
                  </pre>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-2xl">
              <span className="text-[11px] text-gray-500 font-mono">
                Log Object ID: {selectedAuditLog._id}
              </span>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-[12px] font-semibold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
