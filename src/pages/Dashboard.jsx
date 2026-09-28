import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, ChevronLeft, Users, PhoneCall, HeartPulse, 
  Plane, GraduationCap, Download, Plus, 
  Search, Eye, ShieldCheck, 
  RefreshCw, Sparkles, ArrowRight, Layers, Globe, CreditCard,
  IndianRupee, Wallet, Banknote, TrendingUp} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGetDashboardSummary, apiGetLeads, apiGetAuditLogs } from '../utils/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [metricView, setMetricView] = useState('all'); // 'all' | 'pipeline' | 'revenue'
  const [searchTerm, setSearchTerm] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Live Data States
  const [summary, setSummary] = useState({
    totalLeads: 0,
    byStage: {},
    byPassport: {},
    bySource: {},
    byFileType: {},
    medicalSummary: {},
    interviewSummary: {},
    visaSummary: {},
    vivaSummary: {},
    financials: {
      totalServiceFee: 0,
      totalServicePaid: 0,
      totalMedicalFee: 0,
      totalMedicalPaid: 0,
      totalCollected: 0,
      totalPending: 0,
      fullPaidCount: 0,
      partialPaidCount: 0,
      unpaidCount: 0
    },
    counts: {
      totalOnHold: 0,
      totalCompleted: 0,
      totalCancelled: 0,
      activePipelineCount: 0
    }
  });

  const [candidates, setCandidates] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  // Pagination states (equal 5 items per page for visual balance)
  const [candidatePage, setCandidatePage] = useState(1);
  const candidatePageSize = 5;

  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 5;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Fetch Live Data from Backend APIs
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, leadsRes, logsRes] = await Promise.all([
        apiGetDashboardSummary().catch(() => null),
        apiGetLeads({ limit: 100 }).catch(() => null),
        apiGetAuditLogs({ limit: 100 }).catch(() => null)
      ]);

      if (sumRes && sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }

      if (leadsRes && leadsRes.success) {
        setCandidates(leadsRes.data || []);
      }

      if (logsRes && logsRes.success) {
        setRecentLogs(logsRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showToast('Error syncing live dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format currency in Indian format
  const formatINR = (num) => {
    const val = Number(num) || 0;
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Human friendly stage labels
  const formatStageLabel = (s) => {
    if (!s) return 'New Pool';
    switch (s) {
      case 'UNASSIGNED': return 'New Lead Pool';
      case 'CALLING_SCREENING': return 'Calling Screening';
      case 'INITIAL_INTERVIEW': return 'Interview Desk';
      case 'MEDICAL_PROCESS': return 'Medical Fitness';
      case 'FINAL_INTERVIEW': return 'Final Interview';
      case 'ACCOUNTS_COLLECTION': return 'Bill Book Accounts';
      case 'STAFF_HEAD_HANDLING': return 'Staff Head Handling';
      case 'VACANCY_MATCHING': return 'Location Matching';
      case 'PRE_VISA': return 'Pre-Visa Audit';
      case 'VISA_PROCESSING': return 'Visa Processing';
      case 'VIVA_PLACEMENT': return 'Final Client Viva';
      case 'COMPLETED': return 'Deployed Overseas';
      case 'CANCELLED': return 'Cancelled';
      default: return s.replace(/_/g, ' ');
    }
  };

  // Stage Color Badge
  const getStageColorBadge = (stage) => {
    switch (stage) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VISA_PROCESSING':
      case 'PRE_VISA':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'VIVA_PLACEMENT':
      case 'FINAL_INTERVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MEDICAL_PROCESS':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'CALLING_SCREENING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ACCOUNTS_COLLECTION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Relative Time helper
  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Recent';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // Filter Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = searchTerm.toLowerCase();
      const name = c.candidateName || c.name || '';
      const id = c.leadId || '';
      const passport = c.passportNumber || '';
      const trade = c.trade || c.jobTitle || '';
      const phone = c.phone || c.primaryPhone || '';
      const stage = c.currentStage || '';

      const matchesSearch = !searchTerm || (
        name.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q) ||
        passport.toLowerCase().includes(q) ||
        trade.toLowerCase().includes(q) ||
        phone.includes(q)
      );

      let matchesFilter = true;
      if (pipelineFilter === 'Calling') {
        matchesFilter = stage === 'CALLING_SCREENING';
      } else if (pipelineFilter === 'Medical') {
        matchesFilter = stage === 'MEDICAL_PROCESS';
      } else if (pipelineFilter === 'Visa') {
        matchesFilter = stage === 'VISA_PROCESSING' || stage === 'PRE_VISA';
      } else if (pipelineFilter === 'Deployment') {
        matchesFilter = stage === 'COMPLETED' || stage === 'VIVA_PLACEMENT';
      }

      return matchesSearch && matchesFilter;
    });
  }, [candidates, searchTerm, pipelineFilter]);

  // Reset candidate pagination when search or filter changes
  useEffect(() => {
    setCandidatePage(1);
  }, [searchTerm, pipelineFilter]);

  // Candidate Pagination Slice & Total Pages
  const totalCandidatePages = Math.max(1, Math.ceil(filteredCandidates.length / candidatePageSize));
  const paginatedCandidates = useMemo(() => {
    const start = (candidatePage - 1) * candidatePageSize;
    return filteredCandidates.slice(start, start + candidatePageSize);
  }, [filteredCandidates, candidatePage, candidatePageSize]);

  // Activity Stream Pagination Slice & Total Pages
  const totalActivityPages = Math.max(1, Math.ceil(recentLogs.length / activityPageSize));
  const paginatedLogs = useMemo(() => {
    const start = (activityPage - 1) * activityPageSize;
    return recentLogs.slice(start, start + activityPageSize);
  }, [recentLogs, activityPage, activityPageSize]);

  // 10 Major Workflow Checkpoints (Direct Navigation with live counts)
  const workflowCheckpoints = useMemo(() => [
    { step: 'Step 01', label: 'Lead Pool', count: `${summary.totalLeads} Leads`, path: '/leads', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { step: 'Step 02', label: 'Staff Head Desk', count: `${summary.byStage?.STAFF_HEAD_HANDLING || 0} Files`, path: '/staff-head/assign', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { step: 'Step 03', label: 'Calling Desk', count: `${summary.byStage?.CALLING_SCREENING || 0} Files`, path: '/calling/queue', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { step: 'Step 04', label: 'Interview Panel', count: `${summary.byStage?.INITIAL_INTERVIEW || 0} Files`, path: '/interview/initial', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { step: 'Step 05', label: 'Medical Checkup', count: `${summary.byStage?.MEDICAL_PROCESS || 0} Cases`, path: '/medical/all', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    { step: 'Step 06', label: 'Bill Book Accounts', count: `${summary.financials?.fullPaidCount || 0} Paid`, path: '/billing/advance', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    { step: 'Step 07', label: 'Pre-Viva Review', count: `${summary.byStage?.PRE_VISA || 0} Files`, path: '/pre-viva/all', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { step: 'Step 08', label: 'Visa Consulate', count: `${summary.byStage?.VISA_PROCESSING || 0} Visas`, path: '/visa/apply', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    { step: 'Step 09', label: 'Client Final Viva', count: `${summary.byStage?.VIVA_PLACEMENT || 0} Scores`, path: '/placement/schedule', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    { step: 'Step 10', label: 'Flight & Joined', count: `${summary.byStage?.COMPLETED || 0} Flights`, path: '/placement/joining', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  ], [summary]);

  // Export Dashboard Summary to CSV
  const handleExportCSV = () => {
    const rows = [
      ['METRIC', 'COUNT / VALUE'],
      ['Total Leads Ingested', summary.totalLeads],
      ['Calling Screening Queue', summary.byStage?.CALLING_SCREENING || 0],
      ['Medical Examination Desk', summary.byStage?.MEDICAL_PROCESS || 0],
      ['Pre-Viva & Move Files', summary.byStage?.PRE_VISA || 0],
      ['Visa Consulate Stamping', summary.byStage?.VISA_PROCESSING || 0],
      ['Deployed Overseas / Joined', summary.byStage?.COMPLETED || 0],
      ['Total Service Fees Booked', summary.financials?.totalServiceFee || 0],
      ['Total Service Fees Paid', summary.financials?.totalServicePaid || 0],
      ['Total Medical Fees Paid', summary.financials?.totalMedicalPaid || 0],
      ['Total Realized Collections', summary.financials?.totalCollected || 0],
      ['Total Pending Receivables', summary.financials?.totalPending || 0],
      ['', ''],
      ['LEAD ID', 'CANDIDATE NAME', 'PASSPORT', 'TRADE', 'CURRENT STAGE', 'SOURCE']
    ];

    candidates.forEach(c => {
      rows.push([
        `"${c.leadId}"`,
        `"${(c.candidateName || c.name || 'N/A').replace(/"/g, '""')}"`,
        `"${c.passportNumber || 'N/A'}"`,
        `"${(c.trade || 'N/A').replace(/"/g, '""')}"`,
        `"${c.currentStage || 'N/A'}"`,
        `"${c.source || 'N/A'}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chhaya_dashboard_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported dashboard summary to CSV');
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
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium mb-1.5">
          <span>RecruitCRM</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 font-semibold">Executive Dashboard</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Live System Active
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-flex">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                FRD End-to-End Workflow
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Overseas Recruitment Overview
            </h1>
            <p className="text-[12.5px] text-gray-500 leading-relaxed mt-1">
              Real-time candidate lifecycle telemetry across lead ingestion, calling screening, trade interview, GAMCA medical, fee booking, visa stamping, and foreign flight deployment.
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap self-start md:self-center">
            <button 
              onClick={handleExportCSV}
              className="h-9 px-3.5 rounded-xl text-[12.5px] font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4 text-gray-500 shrink-0" /> 
              <span>Export Summary</span>
            </button>

            <button 
              onClick={() => navigate('/leads/add')}
              className="h-9 px-3.5 rounded-xl text-[12.5px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" /> 
              <span>+ Register Candidate</span>
            </button>

            <button 
              onClick={() => {
                fetchDashboardData();
                showToast('Refreshed live operations telemetry');
              }}
              disabled={loading}
              className="h-9 px-3 rounded-xl text-[12.5px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              title="Sync Live Feed"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Official Process Architecture Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-4 sm:p-5 text-white mb-6 shadow-md border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-[14px] sm:text-[15px] tracking-wide text-white">
                    Candidate Placement Journey (Lead Ingestion to Overseas Deployment)
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Live System Active
                  </span>
                </div>
                <p className="text-[11.5px] sm:text-[12px] text-slate-300 mt-0.5">
                  Standardized 6-stage overseas recruitment workflow ensuring zero candidate file loss and full financial traceability.
                </p>
              </div>
            </div>
          </div>

          {/* Key Milestone Gateway Ribbon */}
          <div className="pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { step: 'Stage 01', label: '1. Lead Ingestion', desc: `${summary.totalLeads} Total Leads`, tag: 'Lead Pool', color: 'border-blue-400/30 bg-blue-500/10 text-blue-200' },
                { step: 'Stage 02', label: '2. Calling & Passport', desc: `${summary.byPassport?.YES || 0} Passport Holders`, tag: 'Screening', color: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' },
                { step: 'Stage 03', label: '3. Interview / CV', desc: `${summary.interviewSummary?.PASS || 0} Cleared Selection`, tag: 'Selection', color: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200' },
                { step: 'Stage 04', label: '4. GAMCA Medical', desc: `${summary.medicalSummary?.FIT || 0} Fit Cleared`, tag: 'Fitness', color: 'border-teal-400/30 bg-teal-500/10 text-teal-200' },
                { step: 'Stage 05', label: '5. Fee Booking', desc: `${summary.financials?.fullPaidCount || 0} Paid Bookings`, tag: 'Payment', color: 'border-amber-400/30 bg-amber-500/10 text-amber-200' },
                { step: 'Stage 06', label: '6. Visa & Deployment', desc: `${summary.byStage?.COMPLETED || 0} Deployed On Site`, tag: 'Placement', color: 'border-purple-400/30 bg-purple-500/10 text-purple-200' },
              ].map((m) => (
                <div key={m.step} className={`p-2 sm:p-2.5 rounded-xl border ${m.color} flex flex-col justify-between transition-all hover:bg-white/10`}>
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                    <span className="opacity-90">{m.step}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10">{m.tag}</span>
                  </div>
                  <div className="text-[11.5px] font-bold text-white leading-tight">
                    {m.label}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1">
                    {m.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Executive Telemetry Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <h2 className="text-[15px] sm:text-[16px] font-bold text-gray-900 tracking-tight">
            {metricView === 'all' && 'Complete Executive Telemetry & Overview'}
            {metricView === 'pipeline' && 'Candidate Operations Pipeline'}
            {metricView === 'revenue' && 'Financial Collections & Revenue Streams'}
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            {metricView === 'all' ? '10 Live Cards' : '5 Core Cards'}
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-xl border border-gray-200/80 self-start sm:self-auto shadow-2xs">
          <button
            onClick={() => setMetricView('all')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
              metricView === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Overview
          </button>
          <button
            onClick={() => setMetricView('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
              metricView === 'pipeline'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Candidate Pipeline (5)
          </button>
          <button
            onClick={() => setMetricView('revenue')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
              metricView === 'revenue'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Revenue & Collections (5)
          </button>
        </div>
      </div>

      {/* Row 1: Candidate Progression Pipeline (5 KPI Cards) */}
      {(metricView === 'all' || metricView === 'pipeline') && (
        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            {/* Card 1: Total Leads Received */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-all min-h-[140px]">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Live DB
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-[22px] font-black text-gray-900 leading-tight">
                  {loading ? '...' : summary.totalLeads}
                </div>
                <div className="text-[12px] font-bold text-gray-800 mt-1 truncate">Total Leads Received</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">
                  WP: {summary.bySource?.WHATSAPP || 0} • Excel: {summary.bySource?.EXCEL || 0}
                </div>
              </div>
            </div>

            {/* Card 2: Calling & Passport Screening */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-all min-h-[140px]">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Calling Queue
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-[22px] font-black text-emerald-600 leading-tight">
                  {loading ? '...' : (summary.byStage?.CALLING_SCREENING || 0)}
                </div>
                <div className="text-[12px] font-bold text-gray-800 mt-1 truncate">Passport Screening</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">
                  {summary.byPassport?.YES || 0} Passport Holders
                </div>
              </div>
            </div>

            {/* Card 3: Medical Fitness Clearance */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-all min-h-[140px]">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  GAMCA / GCC
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-[22px] font-black text-teal-600 leading-tight">
                  {loading ? '...' : (summary.byStage?.MEDICAL_PROCESS || 0)}
                </div>
                <div className="text-[12px] font-bold text-gray-800 mt-1 truncate">Medical Desk Cases</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">
                  {summary.medicalSummary?.FIT || 0} FIT Approved
                </div>
              </div>
            </div>

            {/* Card 4: Visa Processing */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-all min-h-[140px]">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                  <Plane className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                  Consulate Desk
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-[22px] font-black text-cyan-600 leading-tight">
                  {loading ? '...' : ((summary.byStage?.VISA_PROCESSING || 0) + (summary.byStage?.PRE_VISA || 0))}
                </div>
                <div className="text-[12px] font-bold text-gray-800 mt-1 truncate">Visa Processing</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">
                  {summary.visaSummary?.APPROVED || 0} Approved Stamps
                </div>
              </div>
            </div>

            {/* Card 5: Placed & Deployed Overseas */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-all min-h-[140px] col-span-2 sm:col-span-1 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  Job Joined
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-[22px] font-black text-purple-600 leading-tight">
                  {loading ? '...' : (summary.byStage?.COMPLETED || 0)}
                </div>
                <div className="text-[12px] font-bold text-gray-800 mt-1 truncate">Placed Overseas</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">
                  Final flight departure
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Row 2: Financial Collections & Revenue Telemetry (5 KPI Cards) */}
      {(metricView === 'all' || metricView === 'revenue') && (
        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            {/* Card 1: Total Gross Collections */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-all min-h-[140px]">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Total Paid
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-[22px] font-black text-emerald-700 leading-tight">
                  {loading ? '...' : formatINR(summary.financials?.totalCollected || 0)}
                </div>
                <div className="text-[12px] font-bold text-gray-800 mt-1 truncate">Total Revenue Collected</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">Service + Medical Fee</div>
              </div>
            </div>

            {/* Card 2: Advance Service Fees Paid */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-all min-h-[140px]">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Step 11
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-[22px] font-black text-blue-600 leading-tight">
                  {loading ? '...' : formatINR(summary.financials?.totalServicePaid || 0)}
                </div>
                <div className="text-[12px] font-bold text-gray-800 mt-1 truncate">Service Fee Realized</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">Agency processing fee</div>
              </div>
            </div>

            {/* Card 3: Medical Fees Paid */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-all min-h-[140px]">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Banknote className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  GAMCA Fee
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-[22px] font-black text-teal-600 leading-tight">
                  {loading ? '...' : formatINR(summary.financials?.totalMedicalPaid || 0)}
                </div>
                <div className="text-[12px] font-bold text-gray-800 mt-1 truncate">Medical Fee Accounted</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">Direct medical fees</div>
              </div>
            </div>

            {/* Card 4: Pending Receivables */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-all min-h-[140px]">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  Receivables
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-[22px] font-black text-amber-600 leading-tight">
                  {loading ? '...' : formatINR(summary.financials?.totalPending || 0)}
                </div>
                <div className="text-[12px] font-bold text-gray-800 mt-1 truncate">Pending Receivables</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">Balance payment due</div>
              </div>
            </div>

            {/* Card 5: Paid In Full Clients */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-all min-h-[140px] col-span-2 sm:col-span-1 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                  Settled
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-[22px] font-black text-purple-600 leading-tight">
                  {loading ? '...' : `${summary.financials?.fullPaidCount || 0} Files`}
                </div>
                <div className="text-[12px] font-bold text-gray-800 mt-1 truncate">Fully Paid Candidates</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5 truncate">100% Fee cleared</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 10-Desk Quick Workflow Stepper */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-[14px]">Recruitment Desks Quick Workload</h3>
            <p className="text-[11px] text-gray-500">1-click direct access to candidate workload across active departments</p>
          </div>
          <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            10 Main Desks
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
          {workflowCheckpoints.map((w) => (
            <div
              key={w.step}
              onClick={() => navigate(w.path)}
              className="p-2.5 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-xs bg-gray-50/50 hover:bg-blue-50/20 transition-all cursor-pointer flex flex-col justify-between text-center group"
            >
              <div>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${w.color} mb-1`}>
                  {w.step}
                </span>
                <div className="text-[11px] font-bold text-gray-900 group-hover:text-blue-600 leading-tight line-clamp-1">
                  {w.label}
                </div>
              </div>
              <div className="text-[10px] font-semibold text-gray-500 mt-1.5 pt-1 border-t border-gray-200/60">
                {w.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Column Operational & Strategic Intelligence Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Column 1: Pipeline Stage Distribution */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[13.5px] text-gray-900 leading-tight">Pipeline Distribution</h3>
                  <p className="text-[10.5px] text-gray-500">Live candidate files across recruitment desks</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {summary.totalLeads} Total
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {[
                { name: 'Lead Ingestion (New Pool)', count: summary.byStage?.UNASSIGNED || 0, color: 'bg-blue-500' },
                { name: 'Calling Screening Desk', count: summary.byStage?.CALLING_SCREENING || 0, color: 'bg-emerald-500' },
                { name: 'GAMCA Medical & Fitness', count: summary.byStage?.MEDICAL_PROCESS || 0, color: 'bg-teal-500' },
                { name: 'Pre-Visa & Move Files', count: summary.byStage?.PRE_VISA || 0, color: 'bg-purple-500' },
                { name: 'Visa Processing & Stamping', count: summary.byStage?.VISA_PROCESSING || 0, color: 'bg-cyan-500' },
                { name: 'Placed Overseas / Deployed', count: summary.byStage?.COMPLETED || 0, color: 'bg-indigo-500' },
              ].map((s) => {
                const pct = summary.totalLeads > 0 ? Math.round((s.count / summary.totalLeads) * 100) : 0;
                return (
                  <div key={s.name} className="p-2 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="flex items-center justify-between text-[11.5px] mb-1">
                      <span className="font-medium text-gray-800 truncate">{s.name}</span>
                      <span className="font-bold text-gray-900">{s.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200/80 rounded-full h-1 overflow-hidden">
                      <div className={`${s.color} h-1 rounded-full transition-all duration-500`} style={{ width: `${Math.max(4, pct)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 2: Lead Ingestion Sources */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[13.5px] text-gray-900 leading-tight">Lead Ingestion Sources</h3>
                  <p className="text-[10.5px] text-gray-500">Breakdown of candidate acquisition channels</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                FRD Sec 03
              </span>
            </div>

            <div className="space-y-2.5 mt-2">
              {[
                { source: 'WhatsApp Lead Process', count: summary.bySource?.WHATSAPP || 0, color: 'bg-emerald-500', badge: 'Automated' },
                { source: 'Excel Spreadsheet Upload', count: summary.bySource?.EXCEL || 0, color: 'bg-blue-500', badge: 'Bulk Import' },
                { source: 'Direct Walk-in / Manual', count: summary.bySource?.MANUAL || 0, color: 'bg-purple-500', badge: 'Direct' },
                { source: 'Facebook Lead Ads', count: summary.bySource?.FACEBOOK || 0, color: 'bg-sky-500', badge: 'Social Ad' },
              ].map((src) => {
                const pct = summary.totalLeads > 0 ? Math.round((src.count / summary.totalLeads) * 100) : 0;
                return (
                  <div key={src.source} className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
                    <div className="flex items-center justify-between text-[11.5px] mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${src.color}`}></div>
                        <span className="font-medium text-gray-800 truncate">{src.source}</span>
                      </div>
                      <span className="font-bold text-gray-900">{src.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200/80 rounded-full h-1 overflow-hidden mt-1">
                      <div className={`${src.color} h-1 rounded-full`} style={{ width: `${Math.max(4, pct)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 3: Billing & Financial Ledger Compliance */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[13.5px] text-gray-900 leading-tight">Ledger & Financials</h3>
                  <p className="text-[10.5px] text-gray-500">Service fee vs medical fee settlement</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/billing/all')}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 hover:bg-emerald-100 cursor-pointer"
              >
                Bill Book →
              </button>
            </div>

            <div className="space-y-2 mt-2">
              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-900">Total Collected to Date</span>
                  <span className="font-black text-emerald-700 text-[13px]">{formatINR(summary.financials?.totalCollected || 0)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/70">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-blue-900">Agency Service Fees</span>
                  <span className="font-bold text-blue-700">{formatINR(summary.financials?.totalServicePaid || 0)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200/70">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-teal-900">GAMCA Medical Fees</span>
                  <span className="font-bold text-teal-700">{formatINR(summary.financials?.totalMedicalPaid || 0)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-900">Pending Receivables</span>
                  <span className="font-bold text-amber-700">{formatINR(summary.financials?.totalPending || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Operational Data Section: Candidate Table + Live Audit Stream */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">

        {/* 2-Columns: Master Operational Candidate Pipeline Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Table Header Controls */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-[14px]">Active Candidate Pipeline</h3>
                  <p className="text-[11.5px] text-gray-500">Live candidate records across recruitment workflow desks.</p>
                </div>

                <div className="relative w-full sm:w-[240px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search candidate, passport, trade..." 
                    className="w-full h-8.5 pl-8.5 pr-3 bg-white border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer">
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Stage Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                {[
                  { key: 'All', label: 'All Candidates', count: candidates.length },
                  { key: 'Calling', label: 'Calling Queue', count: candidates.filter(c => c.currentStage === 'CALLING_SCREENING').length },
                  { key: 'Medical', label: 'Medical Desk', count: candidates.filter(c => c.currentStage === 'MEDICAL_PROCESS').length },
                  { key: 'Visa', label: 'Visa Processing', count: candidates.filter(c => ['VISA_PROCESSING', 'PRE_VISA'].includes(c.currentStage)).length },
                  { key: 'Deployment', label: 'Placed & Deployed', count: candidates.filter(c => ['COMPLETED', 'VIVA_PLACEMENT'].includes(c.currentStage)).length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setPipelineFilter(tab.key)}
                    className={`px-3 py-1 rounded-xl text-[11.5px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      pipelineFilter === tab.key
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${pipelineFilter === tab.key ? 'bg-blue-700/60 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">CANDIDATE & PASSPORT</th>
                    <th className="py-3 px-4">TRADE / JOB</th>
                    <th className="py-3 px-4">CURRENT STAGE</th>
                    <th className="py-3 px-4">SOURCE</th>
                    <th className="py-3 px-4 text-center w-24">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-14 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 mx-auto mb-2 text-blue-500 animate-spin" />
                        <span className="text-[12px]">Connecting to Live MongoDB Database...</span>
                      </td>
                    </tr>
                  ) : filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-14 text-center text-gray-400">
                        <Users className="w-7 h-7 mx-auto mb-1 text-gray-300" />
                        <span className="text-[12.5px] font-medium text-gray-600">No candidate records match active filter</span>
                      </td>
                    </tr>
                  ) : (
                    paginatedCandidates.map((c) => {
                      const name = c.candidateName || c.name || 'Candidate';
                      const stageBadge = getStageColorBadge(c.currentStage);

                      return (
                        <tr key={c._id} className="hover:bg-blue-50/20 transition-colors border-b border-gray-100">
                          
                          {/* Candidate & Passport */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900 text-[13px]">{name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                                {c.leadId}
                              </span>
                              {c.passportNumber ? (
                                <span className="font-mono text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded">
                                  PPT: {c.passportNumber}
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                                  No Passport
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Trade */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-800 text-[12px]">{c.trade || 'General Worker'}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">{c.phone || c.city || 'India'}</div>
                          </td>

                          {/* Current Stage */}
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${stageBadge}`}>
                              {formatStageLabel(c.currentStage)}
                            </span>
                            {c.selectionMode && c.selectionMode !== 'NONE' && (
                              <div className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                Mode: {c.selectionMode === 'DIRECT_CV' ? 'Direct CV' : 'Interview'}
                              </div>
                            )}
                          </td>

                          {/* Source */}
                          <td className="py-3 px-4">
                            <span className="inline-block text-[10.5px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {c.source || 'MANUAL'}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-center">
                            <button 
                              onClick={() => setSelectedCandidate(c)}
                              className="h-7.5 px-2.5 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-300 rounded-lg text-[11.5px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Profile</span>
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer with Equal Clean Pagination */}
          <div className="p-3.5 border-t border-gray-100 bg-gray-50/70 flex flex-wrap items-center justify-between gap-3 text-[12px] text-gray-500">
            <div>
              Showing <span className="font-bold text-gray-800">{filteredCandidates.length === 0 ? 0 : (candidatePage - 1) * candidatePageSize + 1}</span> to <span className="font-bold text-gray-800">{Math.min(candidatePage * candidatePageSize, filteredCandidates.length)}</span> of <span className="font-bold text-gray-800">{filteredCandidates.length}</span> live candidates
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCandidatePage(p => Math.max(1, p - 1))}
                disabled={candidatePage === 1}
                className="h-7 px-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalCandidatePages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCandidatePage(pg)}
                    className={`w-7 h-7 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                      candidatePage === pg
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCandidatePage(p => Math.min(totalCandidatePages, p + 1))}
                disabled={candidatePage >= totalCandidatePages}
                className="h-7 px-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11.5px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button 
              onClick={() => navigate('/leads')}
              className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer text-[12px]"
            >
              <span>View Full Lead Pool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 1-Column: Live Staff Activity & Audit Stream */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="font-bold text-[14px] text-gray-900">Recent Staff Activity</h3>
              </div>
              <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                Live Audit Stream
              </span>
            </div>

            <div className="space-y-2.5">
              {loading ? (
                <div className="py-14 text-center text-gray-400 text-[12px]">
                  <RefreshCw className="w-5 h-5 mx-auto mb-2 text-emerald-500 animate-spin" />
                  <span>Loading audit stream...</span>
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="py-14 text-center text-gray-400 text-[12px]">
                  No recent activity logged
                </div>
              ) : (
                paginatedLogs.map((log) => (
                  <div key={log._id} className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-blue-50/20 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-gray-900 text-[12px] truncate">{log.performedBy?.name || 'Super Admin'}</span>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                          {log.performedBy?.role || 'ADMIN'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-1">{getRelativeTime(log.createdAt)}</span>
                    </div>
                    
                    <p className="text-[11.5px] text-gray-700 leading-snug line-clamp-2">
                      {log.remarks || log.actionType?.replace(/_/g, ' ')}
                    </p>

                    <div className="mt-1.5 pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-[10px]">
                      <span className="text-blue-700 font-bold truncate max-w-[170px]">
                        {log.lead?.candidateName || log.leadIdStr || 'Candidate File'}
                      </span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded shrink-0">
                        Audited
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Footer with Matching Equal Clean Pagination */}
          <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50/70 -mx-4.5 -mb-4.5 p-3.5 rounded-b-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[11.5px] text-gray-500">
              <div>
                Showing <span className="font-bold text-gray-800">{recentLogs.length === 0 ? 0 : (activityPage - 1) * activityPageSize + 1}</span>-
                <span className="font-bold text-gray-800">{Math.min(activityPage * activityPageSize, recentLogs.length)}</span> of{' '}
                <span className="font-bold text-gray-800">{recentLogs.length}</span> audit logs
              </div>
              <button 
                onClick={() => navigate('/audit-logs')}
                className="text-[11.5px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-0.5"
              >
                <span>Full Trail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-gray-200/60">
              <button
                onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                disabled={activityPage === 1}
                className="h-7 px-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {Array.from({ length: totalActivityPages }, (_, i) => i + 1).slice(0, 5).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setActivityPage(pg)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      activityPage === pg
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                {totalActivityPages > 5 && (
                  <span className="text-[10px] text-gray-400 font-bold px-1">...</span>
                )}
              </div>

              <button
                onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))}
                disabled={activityPage >= totalActivityPages}
                className="h-7 px-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-[15px]">{selectedCandidate.candidateName || selectedCandidate.name}</h3>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-gray-300 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <div className="p-5 space-y-4 text-[12.5px] overflow-y-auto">
              
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 text-[14px]">{selectedCandidate.candidateName || selectedCandidate.name}</div>
                  <div className="text-[11px] text-gray-600 mt-0.5 font-mono">
                    ID: {selectedCandidate.leadId} • PPT: {selectedCandidate.passportNumber || 'N/A'}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getStageColorBadge(selectedCandidate.currentStage)}`}>
                  {formatStageLabel(selectedCandidate.currentStage)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-[10.5px]">Trade / Job</div>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedCandidate.trade || 'Not Specified'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-[10.5px]">Phone Number</div>
                  <div className="font-mono font-bold text-gray-900 mt-0.5">{selectedCandidate.phone || 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-[10.5px]">Lead Source</div>
                  <div className="font-bold text-blue-700 mt-0.5">{selectedCandidate.source || 'MANUAL'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-[10.5px]">Location / City</div>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedCandidate.city || 'India'}</div>
                </div>
              </div>

              {/* Fee Information */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <div className="font-bold text-emerald-900 text-[12px] mb-1">Billing & Fee Ledger:</div>
                <div className="flex items-center justify-between text-[11.5px] mt-1 text-emerald-800">
                  <span>Service Fee: {formatINR(selectedCandidate.paymentDetails?.serviceFee || 9500)}</span>
                  <span>Medical Fee: {formatINR(selectedCandidate.paymentDetails?.medicalFee || 2500)}</span>
                </div>
                <div className="flex items-center justify-between text-[11.5px] mt-1 font-bold text-emerald-900">
                  <span>Paid: {formatINR(selectedCandidate.paymentDetails?.totalPaid || 0)}</span>
                  <span>Status: {selectedCandidate.paymentDetails?.paymentStatus || 'UNPAID'}</span>
                </div>
              </div>

            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button 
                onClick={() => {
                  setSelectedCandidate(null);
                  navigate(`/leads`);
                }}
                className="px-3.5 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-[12px] font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Open in Leads
              </button>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[12px] font-bold hover:bg-black cursor-pointer shadow-xs"
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
