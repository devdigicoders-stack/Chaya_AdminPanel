import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Download, Clock, Users, CheckCircle2, Hourglass, 
  Plane, Briefcase, XCircle, ArrowUpRight, ArrowDownRight, ChevronDown, 
  Filter, Search, Eye, Printer, Building2, Calendar, RotateCcw, 
  FileText, Sparkles, ShieldCheck, Check, X, Plus, RefreshCw, 
  AlertCircle, ExternalLink, Share2, FileSpreadsheet,
  Layers, Globe, Activity, PhoneCall, HeartPulse, CreditCard, Award,
  Loader2, TrendingUp, BarChart3, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetDashboardSummary, apiGetLeads } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function ReportsOverview() {
  const navigate = useNavigate();

  // State
  const [summary, setSummary] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Fetch Live Analytics & Candidate Roster from MongoDB Atlas
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, leadsRes] = await Promise.allSettled([
        apiGetDashboardSummary(),
        apiGetLeads({ limit: 100 })
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummary(sumRes.value.data);
      }
      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        setCandidates(leadsRes.value.data);
      }
    } catch (err) {
      console.error('Error loading reports overview:', err);
      setError(err.message || 'Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Funnel Metrics from live data
  const funnel = useMemo(() => {
    const total = summary?.totalLeads || candidates.length || 0;
    const passportYes = summary?.byPassport?.YES || candidates.filter(c => c.isPassportHolder === 'YES').length || 0;
    const interviewPass = summary?.interviewSummary?.PASS || candidates.filter(c => c.initialInterview?.status === 'PASS').length || 0;
    const medicalFit = summary?.medicalSummary?.FIT || candidates.filter(c => c.medicalDetails?.status === 'FIT').length || 0;
    const visaApproved = summary?.visaSummary?.APPROVED || candidates.filter(c => c.visaDetails?.status === 'APPROVED' || c.currentStage === 'VISA_PROCESSING').length || 0;
    const placed = summary?.vivaSummary?.SELECTED || candidates.filter(c => c.currentStage === 'VIVA_PLACEMENT' || c.currentStage === 'COMPLETED').length || 0;

    return [
      { step: '1. Ingestion', label: 'Total Sourced Pool', count: total, pct: '100%', color: 'bg-blue-600', textCol: 'text-blue-600' },
      { step: '2. Passport Verified', label: 'Passport Holders', count: passportYes, pct: total ? `${Math.round((passportYes / total) * 100)}%` : '0%', color: 'bg-indigo-600', textCol: 'text-indigo-600' },
      { step: '3. Technical Interview', label: 'Interview Cleared', count: interviewPass, pct: passportYes ? `${Math.round((interviewPass / passportYes) * 100)}%` : '0%', color: 'bg-amber-600', textCol: 'text-amber-600' },
      { step: '4. GAMCA Medical', label: 'Medically FIT', count: medicalFit, pct: total ? `${Math.round((medicalFit / total) * 100)}%` : '0%', color: 'bg-teal-600', textCol: 'text-teal-600' },
      { step: '5. Visa Stamping', label: 'Visa Approved', count: visaApproved, pct: total ? `${Math.round((visaApproved / total) * 100)}%` : '0%', color: 'bg-purple-600', textCol: 'text-purple-600' },
      { step: '6. Placement & Flight', label: 'Deployed / Placed', count: placed, pct: total ? `${Math.round((placed / total) * 100)}%` : '0%', color: 'bg-emerald-600', textCol: 'text-emerald-600' },
    ];
  }, [summary, candidates]);

  // Financial Summary
  const fin = summary?.financials || {};
  const totalBilled = (fin.totalServiceFee || 0) + (fin.totalMedicalFee || 0);
  const totalCollected = fin.totalCollected || (fin.totalServicePaid || 0) + (fin.totalMedicalPaid || 0);
  const totalPending = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (stageFilter !== 'ALL' && c.currentStage !== stageFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (c.candidateName || '').toLowerCase();
        const passport = (c.passportNumber || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const trade = (c.trade || '').toLowerCase();
        const country = (c.country || '').toLowerCase();
        const leadId = (c.leadId || '').toLowerCase();

        if (!name.includes(q) && !passport.includes(q) && !phone.includes(q) && !trade.includes(q) && !country.includes(q) && !leadId.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [candidates, searchTerm, stageFilter]);

  // Export CSV
  const handleExportCSV = () => {
    if (candidates.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'No candidates available to export.' });
      return;
    }
    const headers = ['Lead ID', 'Candidate Name', 'Passport Number', 'Phone', 'Trade', 'Target Country', 'Current Stage', 'Medical', 'Visa Status', 'Fee Paid'];
    const rows = candidates.map(c => [
      c.leadId || '',
      `"${c.candidateName || ''}"`,
      `"${c.passportNumber || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.trade || ''}"`,
      `"${c.country || ''}"`,
      `"${c.currentStage || ''}"`,
      `"${c.medicalDetails?.status || 'PENDING'}"`,
      `"${c.visaDetails?.status || 'NOT_APPLIED'}"`,
      `"₹ ${c.paymentDetails?.totalPaid || 0}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Chhaya_Overall_Recruitment_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">11. Reports & Analytics</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Executive Overview</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Recruitment Analytics & Executive Summary
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              FRD Section 20
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handleExportCSV}
            className="h-9 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export Summary (CSV)</span>
          </button>

          <button 
            onClick={() => navigate('/reports/custom')}
            className="h-9 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            <span>Custom Query</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh database analytics"
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

      {/* 2. Top KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
        
        {/* Total Ingested */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-700">Total Leads</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-[20px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (summary?.totalLeads ?? candidates.length)}
            </div>
            <div className="text-[10.5px] text-gray-400 mt-1">Central Pool Sourced</div>
          </div>
        </div>

        {/* Passport Holders */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-indigo-700">Passports</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-[20px] font-black text-indigo-700 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (summary?.byPassport?.YES ?? candidates.filter(c => c.isPassportHolder === 'YES').length)}
            </div>
            <div className="text-[10.5px] text-indigo-600 font-medium mt-1">Verified Travel Docs</div>
          </div>
        </div>

        {/* Medical FIT */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-teal-700">GAMCA FIT</span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <HeartPulse className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-[20px] font-black text-teal-700 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (summary?.medicalSummary?.FIT ?? 0)}
            </div>
            <div className="text-[10.5px] text-teal-600 font-medium mt-1">Medically Approved</div>
          </div>
        </div>

        {/* Visa Approved */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-purple-700">Visa Stamped</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Plane className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-[20px] font-black text-purple-700 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (summary?.visaSummary?.APPROVED ?? 0)}
            </div>
            <div className="text-[10.5px] text-purple-600 font-medium mt-1">Embassy Endorsed</div>
          </div>
        </div>

        {/* Deployed Abroad */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">Deployed</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-[20px] font-black text-emerald-700 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (summary?.byStage?.COMPLETED ?? candidates.filter(c => c.currentStage === 'COMPLETED').length)}
            </div>
            <div className="text-[10.5px] text-emerald-600 font-medium mt-1">Joined Foreign GCC</div>
          </div>
        </div>

        {/* Collections */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700">Collections</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-[18px] font-black text-amber-700 font-mono leading-none truncate">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${(totalCollected / 1000).toFixed(0)}k`}
            </div>
            <div className="text-[10.5px] text-amber-600 font-medium mt-1">{collectionRate}% Recovery</div>
          </div>
        </div>

      </div>

      {/* 3. Recruitment Funnel Visualizer (FRD Section 5 & 23) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-5">
          <div>
            <h3 className="font-bold text-gray-900 text-[15px] sm:text-[16px] flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
              End-to-End Candidate Recruitment Funnel (FRD Section 23)
            </h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Stage-by-stage candidate retention and attrition across the full recruitment lifecycle.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg hidden sm:inline-block">
            Full Lifecycle Funnel
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {funnel.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/70 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
                  {item.step}
                </span>
                <span className="text-[12.5px] font-bold text-gray-900 block truncate">
                  {item.label}
                </span>
              </div>
              <div className="mt-4">
                <div className={`text-[20px] font-black font-mono leading-none ${item.textCol}`}>
                  {item.count}
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }} />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Conversion: <strong>{item.pct}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Sourcing & Financial Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Sourcing Channel Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Sourcing Channels (FRD Section 3)
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'WhatsApp Leads', key: 'WHATSAPP', col: 'bg-emerald-500' },
              { label: 'Facebook Ads', key: 'FACEBOOK', col: 'bg-blue-500' },
              { label: 'Excel Bulk Import', key: 'EXCEL', col: 'bg-teal-500' },
              { label: 'Branch Walk-in', key: 'WALK_IN', col: 'bg-amber-500' },
              { label: 'Agent Referral', key: 'AGENT_REFERRAL', col: 'bg-purple-500' },
              { label: 'Manual Direct', key: 'MANUAL', col: 'bg-slate-500' },
            ].map((src, i) => {
              const count = summary?.bySource?.[src.key] || candidates.filter(c => c.source === src.key).length || 0;
              const total = summary?.totalLeads || candidates.length || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700">{src.label}</span>
                    <span className="font-mono text-gray-900 font-bold">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${src.col} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Fee Health */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Service & Medical Fee Recovery (FRD Section 11 & 17)
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Separate accounting of Service Fee vs GAMCA Medical Booking.</p>
            </div>
            <button
              onClick={() => navigate('/reports/financial')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Ledger Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 uppercase block mb-1">Total Receivables</span>
              <span className="text-[20px] font-black text-gray-900 font-mono block">₹ {totalBilled.toLocaleString()}</span>
              <span className="text-[10.5px] text-gray-500 mt-1 block">Contracted candidate fees</span>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">Total Realized</span>
              <span className="text-[20px] font-black text-emerald-700 font-mono block">₹ {totalCollected.toLocaleString()}</span>
              <span className="text-[10.5px] text-emerald-600 mt-1 block">Paid into agency account</span>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
              <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1">Pending Balance</span>
              <span className="text-[20px] font-black text-amber-700 font-mono block">₹ {totalPending.toLocaleString()}</span>
              <span className="text-[10.5px] text-amber-600 mt-1 block">Due at flight / visa milestone</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-gray-700">Overall Recovery Progress</span>
              <span className="font-mono font-bold text-emerald-700">{collectionRate}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
        </div>

      </div>

      {/* 5. Live Candidate Pipeline Movement Roster */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Live Candidate Lifecycle Ledger
            </h3>
            <p className="text-[11.5px] text-gray-500 mt-0.5">Real-time candidate tracking across all operational stages.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Stages</option>
              <option value="CALLING_SCREENING">Calling Screening</option>
              <option value="INITIAL_INTERVIEW">Technical Interview</option>
              <option value="MEDICAL_PROCESS">Medical Process</option>
              <option value="STAFF_HEAD_HANDLING">Staff Head Handling</option>
              <option value="PRE_VISA">Pre-Viva Management</option>
              <option value="VISA_PROCESSING">Visa Processing</option>
              <option value="VIVA_PLACEMENT">Placement Viva</option>
              <option value="COMPLETED">Completed / Joined</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Quarantine / Unfit</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Trade & Destination</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4 text-center">Medical</th>
                <th className="py-3 px-4 text-center">Total Paid</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading live recruitment ledger...</span>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>No candidates found matching the selected filter.</span>
                  </td>
                </tr>
              ) : (
                filteredCandidates.slice(0, 20).map((c) => (
                  <tr key={c._id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {(c.candidateName || 'C').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{c.candidateName}</div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {c.passportNumber || 'No Passport'} • {c.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{c.trade || 'General Worker'}</div>
                      <div className="text-[11px] text-blue-600 font-medium">{c.country || 'Saudi Arabia'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {c.currentStage?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        c.medicalDetails?.status === 'FIT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.medicalDetails?.status === 'UNFIT'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.medicalDetails?.status || 'PENDING'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                      ₹ {c.paymentDetails?.totalPaid || 0}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCandidate(c)}
                        className="h-7 px-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border border-gray-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 ml-auto cursor-pointer transition-colors"
                        title="View Full Lifecycle Audit Trail"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Audit Trail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 6. Lead History Modal */}
      {selectedCandidate && (
        <LeadHistoryModal
          isOpen={Boolean(selectedCandidate)}
          onClose={() => setSelectedCandidate(null)}
          candidate={selectedCandidate}
        />
      )}

    </div>
  );
}
