import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Download, Users, CheckCircle2, Hourglass, 
  Plane, Briefcase, XCircle, ArrowUpRight, ArrowDownRight, 
  Filter, Search, Eye, Printer, Building2, Calendar, RotateCcw, 
  FileText, Sparkles, ShieldCheck, Check, X, Plus, RefreshCw, 
  AlertCircle, Award, Activity, TrendingUp, BarChart3, Target,
  Loader2, ExternalLink
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiGetDashboardSummary, apiGetLeads } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function CandidateReports() {
  const [summary, setSummary] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedTrade, setSelectedTrade] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');

  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [dossierModal, setDossierModal] = useState(null);
  const [tradeModal, setTradeModal] = useState(null);

  // Fetch Live Data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, leadsRes] = await Promise.allSettled([
        apiGetDashboardSummary(),
        apiGetLeads({ limit: 200 })
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummary(sumRes.value.data);
      }
      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        setCandidates(leadsRes.value.data || []);
      }
    } catch (err) {
      console.error('Error fetching candidate reports data:', err);
      setError(err.message || 'Failed to connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Distinct Trades & Countries for Filter Dropdowns
  const availableTrades = useMemo(() => {
    const set = new Set();
    candidates.forEach(c => {
      if (c.trade) set.add(c.trade);
    });
    return Array.from(set).sort();
  }, [candidates]);

  const availableCountries = useMemo(() => {
    const set = new Set();
    candidates.forEach(c => {
      if (c.country) set.add(c.country);
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Dynamic Trade Skills Matrix Calculation
  const tradeStats = useMemo(() => {
    const map = {};
    candidates.forEach(c => {
      const t = c.trade || 'General Trade';
      if (!map[t]) {
        map[t] = {
          trade: t,
          total: 0,
          passedInterview: 0,
          medicalFit: 0,
          vivaSelected: 0,
          placed: 0,
          destinations: {},
        };
      }
      map[t].total += 1;
      if (c.initialInterview?.status === 'PASS' || c.selectionMode === 'DIRECT_CV') {
        map[t].passedInterview += 1;
      }
      if (c.medicalDetails?.status === 'FIT') {
        map[t].medicalFit += 1;
      }
      if (c.placementDetails?.vivaResult?.status === 'SELECTED' || c.currentStage === 'VIVA_PLACEMENT' || c.currentStage === 'COMPLETED') {
        map[t].vivaSelected += 1;
      }
      if (c.currentStage === 'COMPLETED' || c.placementDetails?.deployment?.status === 'JOINED_ON_SITE') {
        map[t].placed += 1;
      }
      if (c.country) {
        map[t].destinations[c.country] = (map[t].destinations[c.country] || 0) + 1;
      }
    });

    return Object.values(map).map(item => {
      const topDest = Object.entries(item.destinations).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Gulf Region';
      const convRate = item.total > 0 ? ((item.placed / item.total) * 100).toFixed(1) : 0;
      return {
        ...item,
        topDest,
        conversion: `${convRate}%`
      };
    }).sort((a,b) => b.total - a.total);
  }, [candidates]);

  // Overall KPI numbers
  const totalRegistered = summary?.totalLeads || candidates.length;
  const passportYes = summary?.byPassport?.YES ?? candidates.filter(c => c.isPassportHolder === 'YES').length;
  const interviewPass = summary?.interviewSummary?.PASS ?? candidates.filter(c => c.initialInterview?.status === 'PASS').length;
  const medicalFit = summary?.medicalSummary?.FIT ?? candidates.filter(c => c.medicalDetails?.status === 'FIT').length;
  const vivaSelected = summary?.vivaSummary?.SELECTED ?? candidates.filter(c => c.placementDetails?.vivaResult?.status === 'SELECTED').length;
  const placedCount = summary?.counts?.completedCount ?? candidates.filter(c => c.currentStage === 'COMPLETED').length;

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Tab filter
      if (activeTab === 'Passport Holders' && c.isPassportHolder !== 'YES') return false;
      if (activeTab === 'Non-Passport' && c.isPassportHolder !== 'NO') return false;
      if (activeTab === 'Interview Pass' && c.initialInterview?.status !== 'PASS') return false;
      if (activeTab === 'CV Selected' && c.selectionMode !== 'DIRECT_CV') return false;
      if (activeTab === 'GAMCA Fit' && c.medicalDetails?.status !== 'FIT') return false;
      if (activeTab === 'Placed' && c.currentStage !== 'COMPLETED' && c.placementDetails?.deployment?.status !== 'JOINED_ON_SITE') return false;

      // Trade filter
      if (selectedTrade !== 'All' && c.trade !== selectedTrade) return false;

      // Country filter
      if (selectedCountry !== 'All' && c.country !== selectedCountry) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (c.candidateName || '').toLowerCase();
        const passport = (c.passportNumber || '').toLowerCase();
        const leadId = (c.leadId || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const city = (c.city || '').toLowerCase();
        const trade = (c.trade || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !leadId.includes(q) && !phone.includes(q) && !city.includes(q) && !trade.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [candidates, activeTab, selectedTrade, selectedCountry, searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'No candidate records match the active criteria to export.' });
      return;
    }
    const headers = ['Lead ID', 'Candidate Name', 'Passport No', 'ECR Status', 'Phone', 'City', 'Trade', 'Route Mode', 'Interview Result', 'Medical Status', 'Target Country', 'Current Stage'];
    const rows = filteredCandidates.map(c => [
      c.leadId || '',
      `"${c.candidateName || ''}"`,
      `"${c.passportNumber || ''}"`,
      c.ecrStatus || 'ECNR',
      `"${c.phone || ''}"`,
      `"${c.city || ''}"`,
      `"${c.trade || ''}"`,
      c.selectionMode === 'DIRECT_CV' ? 'CV Selection' : 'Technical Interview',
      c.initialInterview?.status || 'PENDING',
      c.medicalDetails?.status || 'PENDING',
      `"${c.country || ''}"`,
      c.currentStage || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Candidate_Conversion_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Export Generated',
      text: `${filteredCandidates.length} candidate conversion records exported to CSV.`,
      timer: 2500,
      showConfirmButton: false
    });
  };

  return (
    <div className="flex flex-col flex-1 pb-16">
      {/* Header & Protocol Alert */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Live Candidate Conversion Telemetry
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              FRD Section 20 Analytics
            </span>
          </div>
          <h1 className="text-[21px] sm:text-[26px] lg:text-[28px] font-extrabold text-gray-900 tracking-tight leading-tight">
            Candidate Pipeline & Conversion Intelligence
          </h1>
          <p className="text-[13px] sm:text-[14px] text-gray-500 mt-1 max-w-3xl leading-relaxed">
            Multi-stage recruitment telemetry auditing candidate intake volume, passport verification ratios, GAMCA medical certifications, and final overseas employer deployment.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={loadData}
            disabled={loading}
            className="h-10 px-4 rounded-xl text-[13px] font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} /> 
            <span>Sync Live Data</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="h-10 px-4 rounded-xl text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4" /> 
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-[13px] font-medium">{error}</p>
        </div>
      )}

      {/* 5 Dynamic KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Card 1: Total Registered */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Total Pool
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-gray-900 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : totalRegistered}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Total Sourced Candidates</div>
          </div>
        </div>

        {/* Card 2: Passport Holders */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {totalRegistered > 0 ? `${Math.round((passportYes / totalRegistered) * 100)}% Verified` : '0%'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-indigo-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `${passportYes} / ${totalRegistered}`}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Passport Holders (Sec 7)</div>
          </div>
        </div>

        {/* Card 3: Interview Qualification Rate */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {passportYes > 0 ? `${Math.round((interviewPass / passportYes) * 100)}% Pass` : '0%'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-emerald-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : interviewPass}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Technical Interview Passed</div>
          </div>
        </div>

        {/* Card 4: GAMCA Medical Fitness */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              Fit Approved
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-teal-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : medicalFit}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">GAMCA Medically Certified</div>
          </div>
        </div>

        {/* Card 5: Deployed / Placed */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Placed Yield
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-amber-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : vivaSelected}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Viva Selected / Placed</div>
          </div>
        </div>
      </div>

      {/* Dynamic Trade Skills Conversion Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[15px] text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Trade Craft Conversion Performance (Live Aggregate)
            </h3>
            <p className="text-[12px] text-gray-500">Live conversion matrix computed from all registered candidates categorized by trade specialty.</p>
          </div>
          <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
            {tradeStats.length} Unique Trades Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">Trade Craft</th>
                <th className="py-3 px-4 text-center">Total Ingested</th>
                <th className="py-3 px-4 text-center">Interview / CV Cleared</th>
                <th className="py-3 px-4 text-center">GAMCA Medical Fit</th>
                <th className="py-3 px-4 text-center">Viva Selected</th>
                <th className="py-3 px-4 text-center">Placed</th>
                <th className="py-3 px-4 text-center">Conversion Yield</th>
                <th className="py-3 px-4">Top Destination</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {tradeStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 text-[12px]">
                    No trade records found in the database.
                  </td>
                </tr>
              ) : (
                tradeStats.slice(0, 8).map((t, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors whitespace-nowrap">
                    <td className="py-3 px-4 font-bold text-gray-900">{t.trade}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-gray-800">{t.total}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">{t.passedInterview}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-teal-600">{t.medicalFit}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-purple-600">{t.vivaSelected}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">{t.placed}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.conversion}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700">{t.topDest}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Pipeline Roster Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Top Controls Bar */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[16px]">Candidate Skill & Technical Progression Roster</h3>
              <p className="text-[12px] text-gray-500">Real-time candidate roster connected directly to MongoDB database records.</p>
            </div>

            {/* Live Search & Filter Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, passport, lead ID..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Trade Selector */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-[12px]">
                <span className="text-gray-500">Trade:</span>
                <select 
                  value={selectedTrade}
                  onChange={(e) => setSelectedTrade(e.target.value)}
                  className="bg-transparent font-medium text-gray-800 focus:outline-none cursor-pointer text-[12px]"
                >
                  <option value="All">All Trades</option>
                  {availableTrades.map(tr => (
                    <option key={tr} value={tr}>{tr}</option>
                  ))}
                </select>
              </div>

              {/* Country Selector */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-[12px]">
                <span className="text-gray-500">Destination:</span>
                <select 
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-transparent font-medium text-gray-800 focus:outline-none cursor-pointer text-[12px]"
                >
                  <option value="All">All Countries</option>
                  {availableCountries.map(co => (
                    <option key={co} value={co}>{co}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Workflow Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'All', label: 'All Candidates', count: candidates.length },
              { key: 'Passport Holders', label: 'Passport Holders', count: candidates.filter(c => c.isPassportHolder === 'YES').length },
              { key: 'Non-Passport', label: 'Non-Passport', count: candidates.filter(c => c.isPassportHolder === 'NO').length },
              { key: 'Interview Pass', label: 'Interview Pass', count: candidates.filter(c => c.initialInterview?.status === 'PASS').length },
              { key: 'CV Selected', label: 'CV Selected', count: candidates.filter(c => c.selectionMode === 'DIRECT_CV').length },
              { key: 'GAMCA Fit', label: 'GAMCA Fit', count: candidates.filter(c => c.medicalDetails?.status === 'FIT').length },
              { key: 'Placed', label: 'Placed / Deployed', count: candidates.filter(c => c.currentStage === 'COMPLETED').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.key ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Full Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1250px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">Candidate & Lead ID</th>
                <th className="py-3 px-4">Passport & ECR</th>
                <th className="py-3 px-4">Trade & Craft</th>
                <th className="py-3 px-4">Route Mode (FRD Sec 9)</th>
                <th className="py-3 px-4">Technical Interview</th>
                <th className="py-3 px-4">GAMCA Medical</th>
                <th className="py-3 px-4">Target Country</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading candidate conversion records from database...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No candidate records match your active search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((row) => (
                  <tr key={row._id} className="hover:bg-blue-50/30 transition-colors whitespace-nowrap">
                    {/* Candidate & ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {(row.candidateName || 'U').split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 leading-snug">{row.candidateName || 'Unnamed Candidate'}</div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                            <span>{row.leadId || row._id?.slice(-6)}</span>
                            {row.city && (
                              <>
                                <span>•</span>
                                <span>{row.city}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Passport & ECR */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[12px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                          {row.passportNumber || 'NO PASSPORT'}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          row.ecrStatus === 'ECNR' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {row.ecrStatus || 'ECNR'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{row.phone}</div>
                    </td>

                    {/* Trade */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-gray-900 text-[12px]">
                      {row.trade || 'General'}
                    </td>

                    {/* Route Mode */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        row.selectionMode === 'DIRECT_CV' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {row.selectionMode === 'DIRECT_CV' ? 'Selected by CV' : 'Technical Interview'}
                      </span>
                    </td>

                    {/* Interview */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        row.initialInterview?.status === 'PASS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        row.initialInterview?.status === 'FAIL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {row.initialInterview?.status || 'PENDING'}
                      </span>
                    </td>

                    {/* Medical */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        row.medicalDetails?.status === 'FIT' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                        row.medicalDetails?.status === 'UNFIT' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {row.medicalDetails?.status || 'PENDING'}
                      </span>
                    </td>

                    {/* Target Country */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-800 text-[12px]">
                      {row.country || 'Gulf Region'}
                    </td>

                    {/* Current Stage */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {row.currentStage?.replace(/_/g, ' ') || 'ACTIVE'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCandidate(row)}
                          className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                          <span>Audit Trail</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-gray-500">
          <div>
            Showing <span className="font-bold text-gray-800">{filteredCandidates.length}</span> of <span className="font-bold text-gray-800">{candidates.length}</span> candidates from database
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster CSV</span>
          </button>
        </div>
      </div>

      {/* Audit Trail Modal */}
      {selectedCandidate && (
        <LeadHistoryModal 
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          leadId={selectedCandidate._id}
        />
      )}
    </div>
  );
}
