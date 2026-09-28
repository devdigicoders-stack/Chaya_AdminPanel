import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Download, Plane, Globe, Clock, CheckCircle2, 
  AlertTriangle, Search, Filter, Eye, Printer, Building2, Calendar, 
  RotateCcw, FileText, Sparkles, ShieldCheck, Check, X, Plus, 
  RefreshCw, AlertCircle, Award, Activity, TrendingUp, BarChart3, 
  ExternalLink, FileSpreadsheet, Loader2, ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiGetDashboardSummary, apiGetLeads } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function VisaReports() {
  const [summary, setSummary] = useState(null);
  const [visaLeads, setVisaLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedFileType, setSelectedFileType] = useState('All');

  // Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Load Data from backend
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
        // Filter leads relevant to pre-visa / visa or location confirmation
        const all = leadsRes.value.data || [];
        const relevant = all.filter(c => 
          c.currentStage === 'VISA_PROCESSING' || 
          c.currentStage === 'PRE_VISA' ||
          c.currentStage === 'VIVA_PLACEMENT' ||
          c.currentStage === 'COMPLETED' ||
          c.visaDetails?.status ||
          c.fileType ||
          c.locationConfirmation?.isConfirmed
        );
        setVisaLeads(relevant.length > 0 ? relevant : all);
      }
    } catch (err) {
      console.error('Error loading visa reports:', err);
      setError(err.message || 'Failed to connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Distinct countries for filter
  const availableCountries = useMemo(() => {
    const set = new Set();
    visaLeads.forEach(c => {
      if (c.country) set.add(c.country);
    });
    return Array.from(set).sort();
  }, [visaLeads]);

  // Consular Country Turnaround Analytics (Dynamically grouped by country)
  const countryTurnaroundStats = useMemo(() => {
    const map = {};
    visaLeads.forEach(c => {
      const country = c.country || 'Gulf Region';
      if (!map[country]) {
        map[country] = {
          country,
          applied: 0,
          stamped: 0,
          inProcess: 0,
          delayed: 0,
        };
      }
      map[country].applied += 1;
      const status = c.visaDetails?.status || '';
      if (status === 'APPROVED' || c.currentStage === 'COMPLETED' || c.currentStage === 'VIVA_PLACEMENT') {
        map[country].stamped += 1;
      } else if (status === 'PROCESSING' || status === 'SUBMITTED' || c.currentStage === 'VISA_PROCESSING') {
        map[country].inProcess += 1;
      } else if (status === 'DELAYED' || status === 'REJECTED') {
        map[country].delayed += 1;
      }
    });

    return Object.values(map).map(item => {
      const rate = item.applied > 0 ? ((item.stamped / item.applied) * 100).toFixed(1) : 0;
      return {
        ...item,
        approvalRate: `${rate}%`
      };
    }).sort((a,b) => b.applied - a.applied);
  }, [visaLeads]);

  // KPI Calculations
  const visaSum = summary?.visaSummary || {};
  const totalVisaPipeline = visaLeads.length;
  const approvedCount = visaSum.APPROVED ?? visaLeads.filter(c => c.visaDetails?.status === 'APPROVED' || c.currentStage === 'COMPLETED').length;
  const inProcessCount = (visaSum.PROCESSING || 0) + (visaSum.SUBMITTED || 0) || visaLeads.filter(c => c.visaDetails?.status === 'PROCESSING' || c.visaDetails?.status === 'SUBMITTED' || c.currentStage === 'VISA_PROCESSING').length;
  const moveFileCount = summary?.byFileType?.MOVE_FILE ?? visaLeads.filter(c => c.fileType === 'MOVE_FILE').length;
  const directFileCount = summary?.byFileType?.DIRECT_FILE ?? visaLeads.filter(c => c.fileType === 'DIRECT_FILE').length;
  const delayedCount = visaSum.DELAYED ?? visaLeads.filter(c => c.visaDetails?.status === 'DELAYED').length;

  // Filtered Visa Filings
  const filteredLeads = useMemo(() => {
    return visaLeads.filter(c => {
      // Tab filter
      if (activeTab === 'Ready to Apply' && c.visaDetails?.status !== 'READY_TO_APPLY') return false;
      if (activeTab === 'Submitted / Processing' && c.visaDetails?.status !== 'PROCESSING' && c.visaDetails?.status !== 'SUBMITTED' && c.currentStage !== 'VISA_PROCESSING') return false;
      if (activeTab === 'Approved / Stamped' && c.visaDetails?.status !== 'APPROVED' && c.currentStage !== 'COMPLETED') return false;
      if (activeTab === 'Move File' && c.fileType !== 'MOVE_FILE') return false;
      if (activeTab === 'Direct File' && c.fileType !== 'DIRECT_FILE') return false;
      if (activeTab === 'Delayed / Exception' && c.visaDetails?.status !== 'DELAYED' && c.visaDetails?.status !== 'REJECTED') return false;

      // Country
      if (selectedCountry !== 'All' && c.country !== selectedCountry) return false;

      // File type selector
      if (selectedFileType !== 'All' && c.fileType !== selectedFileType) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (c.candidateName || '').toLowerCase();
        const passport = (c.passportNumber || '').toLowerCase();
        const leadId = (c.leadId || '').toLowerCase();
        const appNo = (c.visaDetails?.applicationNumber || '').toLowerCase();
        const trade = (c.trade || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !leadId.includes(q) && !appNo.includes(q) && !trade.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [visaLeads, activeTab, selectedCountry, selectedFileType, searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'No visa records match the criteria to export.' });
      return;
    }
    const headers = ['Lead ID', 'Candidate Name', 'Passport No', 'Phone', 'Country', 'Trade', 'Pre-Viva File Type', 'Visa Status', 'Visa Type', 'Application / MOFA No', 'Submission Date', 'Current Stage'];
    const rows = filteredLeads.map(c => [
      c.leadId || '',
      `"${c.candidateName || ''}"`,
      `"${c.passportNumber || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.country || ''}"`,
      `"${c.trade || ''}"`,
      c.fileType || 'NOT_SET',
      c.visaDetails?.status || 'PENDING',
      `"${c.visaDetails?.visaType || 'Employment'}"`,
      `"${c.visaDetails?.applicationNumber || c.visaDetails?.mofaNumber || ''}"`,
      c.visaDetails?.submissionDate ? new Date(c.visaDetails.submissionDate).toLocaleDateString() : '',
      c.currentStage || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Visa_Filing_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Export Generated',
      text: `${filteredLeads.length} visa filing records exported to CSV.`,
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
              Live Consular & Pre-Viva Telemetry
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              FRD Section 13, 14 & 15 Compliant
            </span>
          </div>
          <h1 className="text-[21px] sm:text-[26px] lg:text-[28px] font-extrabold text-gray-900 tracking-tight leading-tight">
            Visa Consular & Stamping Velocity Reports
          </h1>
          <p className="text-[13px] sm:text-[14px] text-gray-500 mt-1 max-w-3xl leading-relaxed">
            Real-time embassy submission telemetry auditing Move File vs Direct File classifications, location confirmations (4-attempt rule), and consular stamping turnaround.
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
        {/* Card 1: Total in Visa Pipeline */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Pipeline Total
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-gray-900 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : totalVisaPipeline}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Total Visa Operations Roster</div>
          </div>
        </div>

        {/* Card 2: Visa Approved */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Stamped & Ready
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-emerald-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : approvedCount}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Visas Approved / Stamped</div>
          </div>
        </div>

        {/* Card 3: Processing in Consulates */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              In Consulates
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-purple-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : inProcessCount}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Submitted / In Processing</div>
          </div>
        </div>

        {/* Card 4: Move vs Direct Files (FRD Sec 14) */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              FRD Sec 14
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[20px] font-bold text-teal-700 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `${moveFileCount} Move / ${directFileCount} Direct`}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Pre-Viva Routing Split</div>
          </div>
        </div>

        {/* Card 5: Delayed / Review Required */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Exceptions
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-amber-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : delayedCount}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Delayed / Query Responded</div>
          </div>
        </div>
      </div>

      {/* Destination Country Turnaround Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[15px] text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Country Consular Stamping Performance (Live Grouping)
            </h3>
            <p className="text-[12px] text-gray-500">Live breakdown of visas filed, stamped, and under consular review per destination territory.</p>
          </div>
          <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
            {countryTurnaroundStats.length} Destinations Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">Destination Territory</th>
                <th className="py-3 px-4 text-center">Total Applied</th>
                <th className="py-3 px-4 text-center">Visas Stamped</th>
                <th className="py-3 px-4 text-center">In Processing</th>
                <th className="py-3 px-4 text-center">Delayed / Queries</th>
                <th className="py-3 px-4 text-center">Approval Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {countryTurnaroundStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-[12px]">
                    No country visa filings recorded in the database.
                  </td>
                </tr>
              ) : (
                countryTurnaroundStats.map((c, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors whitespace-nowrap">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{c.country}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-800">{c.applied}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">{c.stamped}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-600">{c.inProcess}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600">{c.delayed}</td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {c.approvalRate}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Visa Filing Roster Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Top Controls Bar */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[16px]">Consular Visa Filings & Pre-Viva Roster</h3>
              <p className="text-[12px] text-gray-500">Live registry connecting candidates to their respective visa documentation and consular timeline.</p>
            </div>

            {/* Filter Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, passport, MOFA..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Country Selector */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-[12px]">
                <span className="text-gray-500">Country:</span>
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

              {/* File Type Selector */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-[12px]">
                <span className="text-gray-500">File Type:</span>
                <select 
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="bg-transparent font-medium text-gray-800 focus:outline-none cursor-pointer text-[12px]"
                >
                  <option value="All">All Types</option>
                  <option value="MOVE_FILE">Move File (Sec 14)</option>
                  <option value="DIRECT_FILE">Direct File (Sec 14)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Workflow Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'All', label: 'All Files', count: visaLeads.length },
              { key: 'Approved / Stamped', label: 'Visa Approved / Stamped', count: approvedCount },
              { key: 'Submitted / Processing', label: 'In Processing', count: inProcessCount },
              { key: 'Move File', label: 'Move File', count: moveFileCount },
              { key: 'Direct File', label: 'Direct File', count: directFileCount },
              { key: 'Delayed / Exception', label: 'Delayed / Queries', count: delayedCount }
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
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">Candidate & Lead ID</th>
                <th className="py-3 px-4">Passport & Phone</th>
                <th className="py-3 px-4">Destination Territory</th>
                <th className="py-3 px-4">Pre-Viva Routing (Sec 14)</th>
                <th className="py-3 px-4">Location Confirmation (Sec 13)</th>
                <th className="py-3 px-4">Application / MOFA No</th>
                <th className="py-3 px-4">Visa Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading consular visa filings from database...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No visa records match your active search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((row) => (
                  <tr key={row._id} className="hover:bg-blue-50/30 transition-colors whitespace-nowrap">
                    {/* Candidate & ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {(row.candidateName || 'U').split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 leading-snug">{row.candidateName || 'Unnamed Candidate'}</div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {row.leadId || row._id?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Passport & Contact */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-[12px] bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                        {row.passportNumber || 'PENDING'}
                      </span>
                      <div className="text-[11px] text-gray-400 mt-0.5">{row.phone}</div>
                    </td>

                    {/* Destination Country */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-[12px]">{row.country || 'Gulf Region'}</div>
                      <div className="text-[11px] text-gray-500">{row.trade || 'General'}</div>
                    </td>

                    {/* Pre-Viva File Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        row.fileType === 'MOVE_FILE' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : row.fileType === 'DIRECT_FILE'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {row.fileType === 'MOVE_FILE' ? 'Move File' : row.fileType === 'DIRECT_FILE' ? 'Direct File' : 'Standard'}
                      </span>
                    </td>

                    {/* Location Confirmation Tracker (FRD Section 13) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          row.locationConfirmation?.isConfirmed 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {row.locationConfirmation?.isConfirmed ? 'Confirmed' : 'Pending'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          (Att: {row.locationConfirmation?.editCount || 0}/4)
                        </span>
                      </div>
                      {row.locationConfirmation?.confirmedLocation && (
                        <div className="text-[10px] text-gray-500 mt-0.5 truncate max-w-[140px]">
                          {row.locationConfirmation.confirmedLocation}
                        </div>
                      )}
                    </td>

                    {/* MOFA / Application No */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[12px]">
                      {row.visaDetails?.applicationNumber || row.visaDetails?.mofaNumber || (
                        <span className="text-gray-400 font-sans italic text-[11px]">Pending Submission</span>
                      )}
                    </td>

                    {/* Visa Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        row.visaDetails?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        row.visaDetails?.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        row.visaDetails?.status === 'SUBMITTED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        row.visaDetails?.status === 'DELAYED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        row.visaDetails?.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {row.visaDetails?.status || row.currentStage?.replace(/_/g, ' ') || 'READY_TO_APPLY'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedCandidate(row)}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-600" />
                        <span>Audit Trail</span>
                      </button>
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
            Showing <span className="font-bold text-gray-800">{filteredLeads.length}</span> of <span className="font-bold text-gray-800">{visaLeads.length}</span> visa records in active pipeline
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Visa CSV</span>
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
