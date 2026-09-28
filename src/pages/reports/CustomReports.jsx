import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Filter, Download, Calendar, Users, FileText, 
  CheckCircle2, Search, Eye, Printer, Building2, RotateCcw, 
  Sparkles, ShieldCheck, Check, X, Plus, RefreshCw, AlertCircle, 
  TrendingUp, BarChart3, ExternalLink, FileSpreadsheet, Bookmark, 
  Save, Plane, DollarSign, Receipt, Clock, Tag, Loader2, ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiGetDashboardSummary, apiGetLeads } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function CustomReports() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Multi-dimensional Query Builder Filters
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedPassport, setSelectedPassport] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedTrade, setSelectedTrade] = useState('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Fetch Leads dynamically based on server query parameters
  const runQuery = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 300 };
      if (selectedStage !== 'ALL') params.stage = selectedStage;
      if (selectedPassport !== 'ALL') params.isPassportHolder = selectedPassport;
      if (selectedSource !== 'ALL') params.source = selectedSource;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await apiGetLeads(params);
      if (res && res.data) {
        setCandidates(res.data);
      }
    } catch (err) {
      console.error('Error querying custom reports:', err);
      setError(err.message || 'Failed to query database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runQuery();
  }, [selectedStage, selectedPassport, selectedSource]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedStage('ALL');
    setSelectedPassport('ALL');
    setSelectedSource('ALL');
    setSelectedCountry('ALL');
    setSelectedTrade('ALL');
    setSelectedPaymentStatus('ALL');
    setSearchTerm('');
  };

  // Extract distinct trades and countries from data
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

  // Client-side refined filtering for multidimensional parameters
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (selectedCountry !== 'ALL' && c.country !== selectedCountry) return false;
      if (selectedTrade !== 'ALL' && c.trade !== selectedTrade) return false;
      if (selectedPaymentStatus !== 'ALL') {
        const pay = c.paymentDetails?.paymentStatus || 'UNPAID';
        if (pay !== selectedPaymentStatus) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (c.candidateName || '').toLowerCase();
        const passport = (c.passportNumber || '').toLowerCase();
        const leadId = (c.leadId || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const trade = (c.trade || '').toLowerCase();
        const city = (c.city || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !leadId.includes(q) && !phone.includes(q) && !trade.includes(q) && !city.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [candidates, selectedCountry, selectedTrade, selectedPaymentStatus, searchTerm]);

  // Computed summary of the queried dataset
  const totalQueried = filteredCandidates.length;
  const passportYesQueried = filteredCandidates.filter(c => c.isPassportHolder === 'YES').length;
  const totalQueriedPaid = filteredCandidates.reduce((acc, c) => acc + (c.paymentDetails?.totalPaid || 0), 0);
  const totalQueriedPending = filteredCandidates.reduce((acc, c) => {
    const p = c.paymentDetails || {};
    const billed = (p.serviceFee || 0) + (p.medicalFee || 0);
    const paid = p.totalPaid || ((p.servicePaid || 0) + (p.medicalPaid || 0));
    return acc + Math.max(0, billed - paid);
  }, 0);

  // Dynamic CSV Export
  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'No custom report records match your query.' });
      return;
    }
    const headers = [
      'Lead ID', 'Candidate Name', 'Passport No', 'ECR Status', 'Phone', 'City', 
      'Sourcing Channel', 'Trade', 'Destination', 'Current Stage', 'Medical Status', 
      'Visa Status', 'Total Paid', 'Pending Due', 'Payment Status'
    ];
    const rows = filteredCandidates.map(c => {
      const p = c.paymentDetails || {};
      const billed = (p.serviceFee || 0) + (p.medicalFee || 0);
      const paid = p.totalPaid || ((p.servicePaid || 0) + (p.medicalPaid || 0));
      const pending = Math.max(0, billed - paid);

      return [
        c.leadId || '',
        `"${c.candidateName || ''}"`,
        `"${c.passportNumber || ''}"`,
        c.ecrStatus || 'ECNR',
        `"${c.phone || ''}"`,
        `"${c.city || ''}"`,
        c.source || 'DIRECT',
        `"${c.trade || ''}"`,
        `"${c.country || ''}"`,
        c.currentStage || '',
        c.medicalDetails?.status || 'PENDING',
        c.visaDetails?.status || 'NOT_APPLIED',
        paid,
        pending,
        p.paymentStatus || 'UNPAID'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Custom_Matrix_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Export Generated',
      text: `${filteredCandidates.length} custom matrix records exported to CSV.`,
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
              Multi-Dimensional Query Engine
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              FRD Section 20 Multi-Axis Reporting
            </span>
          </div>
          <h1 className="text-[21px] sm:text-[26px] lg:text-[28px] font-extrabold text-gray-900 tracking-tight leading-tight">
            Custom Query Builder & Cross-Stage Analytics
          </h1>
          <p className="text-[13px] sm:text-[14px] text-gray-500 mt-1 max-w-3xl leading-relaxed">
            Construct tailored cross-departmental queries across recruitment stages, passport classifications, sourcing channels, trades, and payment statuses.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={runQuery}
            disabled={loading}
            className="h-10 px-4 rounded-xl text-[13px] font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} /> 
            <span>Re-Execute Query</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="h-10 px-4 rounded-xl text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4" /> 
            <span>Export Custom CSV</span>
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

      {/* Interactive Query Builder Matrix Panel */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-[15px] text-gray-900">Custom Query Parameters</h3>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[12px] font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Parameters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Stage Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Recruitment Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Stages</option>
              <option value="NEW_LEAD">New Lead</option>
              <option value="CALLING_SCREENING">Calling Screening</option>
              <option value="INITIAL_INTERVIEW">Initial Interview</option>
              <option value="MEDICAL_PROCESS">GAMCA Medical</option>
              <option value="PRE_VISA">Pre-Viva Review</option>
              <option value="VISA_PROCESSING">Visa Processing</option>
              <option value="VIVA_PLACEMENT">Client Viva / Placement</option>
              <option value="COMPLETED">Completed / Deployed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected / Unfit</option>
            </select>
          </div>

          {/* Passport Status (FRD Sec 7) */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Passport Status</label>
            <select
              value={selectedPassport}
              onChange={(e) => setSelectedPassport(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Passports</option>
              <option value="YES">Passport Holder (YES)</option>
              <option value="NO">Non-Passport (NO)</option>
              <option value="NOT_CONFIRMED">Not Confirmed</option>
            </select>
          </div>

          {/* Sourcing Channel (FRD Sec 3) */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Lead Source</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Sources</option>
              <option value="WHATSAPP">WhatsApp Pool</option>
              <option value="FACEBOOK">Facebook Lead Ads</option>
              <option value="EXCEL">Excel Bulk Import</option>
              <option value="DIRECT">Direct Office Intake</option>
            </select>
          </div>

          {/* Destination Territory */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Destination</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Destinations</option>
              {availableCountries.map(co => (
                <option key={co} value={co}>{co}</option>
              ))}
            </select>
          </div>

          {/* Trade Craft */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Trade Craft</label>
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Trades</option>
              {availableTrades.map(tr => (
                <option key={tr} value={tr}>{tr}</option>
              ))}
            </select>
          </div>

          {/* Payment Status (FRD Sec 11 & 17) */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Fee Status</label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[12px] font-medium text-gray-800 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="FULL">Fully Cleared (FULL)</option>
              <option value="PARTIAL">Partial Paid</option>
              <option value="UNPAID">Unpaid / Due</option>
            </select>
          </div>
        </div>

        {/* Search Bar in Builder */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate name, passport number, lead ID, phone, or city..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={runQuery}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-[12px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Apply Query</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Query Telemetry Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[20px] font-bold text-gray-900 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : totalQueried}
            </div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">Matching Candidates Found</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[20px] font-bold text-indigo-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `${passportYesQueried} (${totalQueried > 0 ? Math.round((passportYesQueried/totalQueried)*100) : 0}%)`}
            </div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">Passport Holders Matched</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[18px] font-bold text-emerald-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${totalQueriedPaid.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">Total Revenue Collected</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[18px] font-bold text-amber-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${totalQueriedPending.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5">Total Pending Due</div>
          </div>
        </div>
      </div>

      {/* Query Results Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[16px] text-gray-900">Custom Query Execution Results</h3>
            <p className="text-[12px] text-gray-500">Live multi-column data matching active parameter constraints.</p>
          </div>
          <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
            {filteredCandidates.length} Records Returned
          </span>
        </div>

        {/* Full Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">Candidate & Lead ID</th>
                <th className="py-3 px-4">Passport & Phone</th>
                <th className="py-3 px-4">Channel & Destination</th>
                <th className="py-3 px-4">Trade Craft</th>
                <th className="py-3 px-4">Recruitment Stage</th>
                <th className="py-3 px-4">Medical & Visa</th>
                <th className="py-3 px-4 text-center">Fee Paid / Due</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    Executing live query against database...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No records found matching your active multi-dimensional query parameters.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((row) => {
                  const p = row.paymentDetails || {};
                  const billed = (p.serviceFee || 0) + (p.medicalFee || 0);
                  const paid = p.totalPaid || ((p.servicePaid || 0) + (p.medicalPaid || 0));
                  const pending = Math.max(0, billed - paid);

                  return (
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
                          {row.passportNumber || 'NO PASSPORT'}
                        </span>
                        <div className="text-[11px] text-gray-400 mt-0.5">{row.phone}</div>
                      </td>

                      {/* Channel & Destination */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 text-[12px]">{row.country || 'Gulf Region'}</div>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-700">
                          {row.source || 'DIRECT'}
                        </span>
                      </td>

                      {/* Trade */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-800 text-[12px]">
                        {row.trade || 'General'}
                      </td>

                      {/* Recruitment Stage */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {row.currentStage?.replace(/_/g, ' ') || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Medical & Visa */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            row.medicalDetails?.status === 'FIT' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            Med: {row.medicalDetails?.status || 'PENDING'}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            row.visaDetails?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            Visa: {row.visaDetails?.status || 'PENDING'}
                          </span>
                        </div>
                      </td>

                      {/* Fee Paid / Due */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-mono font-bold text-emerald-600 text-[12px]">
                          ₹ {paid.toLocaleString('en-IN')}
                        </div>
                        <div className="font-mono text-[10px] text-gray-400">
                          Due: ₹ {pending.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          p.paymentStatus === 'FULL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          p.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {p.paymentStatus || 'UNPAID'}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-gray-500">
          <div>
            Showing <span className="font-bold text-gray-800">{filteredCandidates.length}</span> of <span className="font-bold text-gray-800">{candidates.length}</span> candidates returned by query
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Query Results CSV</span>
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
