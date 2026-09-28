import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Download, Plane, Globe, Clock, CheckCircle2, 
  AlertTriangle, Search, Filter, Eye, Printer, Building2, Calendar, 
  RotateCcw, FileText, Sparkles, ShieldCheck, Check, X, Plus, 
  RefreshCw, AlertCircle, Award, Activity, TrendingUp, BarChart3, 
  ExternalLink, FileSpreadsheet, Luggage, DollarSign, Ticket, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiGetDashboardSummary, apiGetLeads } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function PlacementReportsPage() {
  const [summary, setSummary] = useState(null);
  const [placementLeads, setPlacementLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');

  // Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Load Data
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
        const all = leadsRes.value.data || [];
        // Placement relevant leads
        const relevant = all.filter(c => 
          c.currentStage === 'VIVA_PLACEMENT' ||
          c.currentStage === 'COMPLETED' ||
          c.placementDetails?.vivaSchedule?.status ||
          c.placementDetails?.vivaResult?.status ||
          c.placementDetails?.deployment?.status ||
          c.visaDetails?.status === 'APPROVED'
        );
        setPlacementLeads(relevant.length > 0 ? relevant : all);
      }
    } catch (err) {
      console.error('Error loading placement reports:', err);
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
    placementLeads.forEach(c => {
      if (c.country) set.add(c.country);
    });
    return Array.from(set).sort();
  }, [placementLeads]);

  // Employer & Destination Deployment Stats (Dynamically grouped)
  const employerPlacementStats = useMemo(() => {
    const map = {};
    placementLeads.forEach(c => {
      const dest = c.country || 'Gulf Region';
      if (!map[dest]) {
        map[dest] = {
          destination: dest,
          total: 0,
          vivaSelected: 0,
          flightBooked: 0,
          joinedOnSite: 0
        };
      }
      map[dest].total += 1;
      const vivaStatus = c.placementDetails?.vivaResult?.status || '';
      const deployStatus = c.placementDetails?.deployment?.status || '';

      if (vivaStatus === 'SELECTED' || c.currentStage === 'COMPLETED') {
        map[dest].vivaSelected += 1;
      }
      if (deployStatus === 'FLIGHT_BOOKED' || deployStatus === 'DEPARTED' || deployStatus === 'JOINED_ON_SITE') {
        map[dest].flightBooked += 1;
      }
      if (deployStatus === 'JOINED_ON_SITE' || c.currentStage === 'COMPLETED') {
        map[dest].joinedOnSite += 1;
      }
    });

    return Object.values(map).sort((a,b) => b.total - a.total);
  }, [placementLeads]);

  // KPI calculations
  const totalInPipeline = placementLeads.length;
  const vivaSum = summary?.vivaSummary || {};
  const selectedCount = vivaSum.SELECTED ?? placementLeads.filter(c => c.placementDetails?.vivaResult?.status === 'SELECTED' || c.currentStage === 'COMPLETED').length;
  const flightsCount = placementLeads.filter(c => {
    const s = c.placementDetails?.deployment?.status;
    return s === 'FLIGHT_BOOKED' || s === 'DEPARTED' || s === 'JOINED_ON_SITE';
  }).length;
  const joinedCount = summary?.counts?.completedCount ?? placementLeads.filter(c => c.placementDetails?.deployment?.status === 'JOINED_ON_SITE' || c.currentStage === 'COMPLETED').length;
  const scheduledCount = vivaSum.SCHEDULED ?? placementLeads.filter(c => c.placementDetails?.vivaSchedule?.status === 'SCHEDULED' || c.currentStage === 'VIVA_PLACEMENT').length;

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return placementLeads.filter(c => {
      // Tab filter
      if (activeTab === 'Viva Scheduled' && c.placementDetails?.vivaSchedule?.status !== 'SCHEDULED' && c.currentStage !== 'VIVA_PLACEMENT') return false;
      if (activeTab === 'Viva Selected' && c.placementDetails?.vivaResult?.status !== 'SELECTED' && c.currentStage !== 'COMPLETED') return false;
      if (activeTab === 'Flight Booked' && c.placementDetails?.deployment?.status !== 'FLIGHT_BOOKED' && c.placementDetails?.deployment?.status !== 'DEPARTED') return false;
      if (activeTab === 'Joined on Site' && c.placementDetails?.deployment?.status !== 'JOINED_ON_SITE' && c.currentStage !== 'COMPLETED') return false;
      if (activeTab === 'On Hold' && c.placementDetails?.vivaResult?.status !== 'ON_HOLD') return false;

      // Country filter
      if (selectedCountry !== 'All' && c.country !== selectedCountry) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (c.candidateName || '').toLowerCase();
        const passport = (c.passportNumber || '').toLowerCase();
        const leadId = (c.leadId || '').toLowerCase();
        const trade = (c.trade || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !leadId.includes(q) && !trade.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [placementLeads, activeTab, selectedCountry, searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'No placement records match the criteria to export.' });
      return;
    }
    const headers = ['Lead ID', 'Candidate Name', 'Passport No', 'Phone', 'Country', 'Trade', 'Viva Result', 'Viva Date', 'Offer Status', 'Deployment Status', 'Flight Date', 'PNR / Ticket'];
    const rows = filteredLeads.map(c => [
      c.leadId || '',
      `"${c.candidateName || ''}"`,
      `"${c.passportNumber || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.country || ''}"`,
      `"${c.trade || ''}"`,
      c.placementDetails?.vivaResult?.status || 'PENDING',
      c.placementDetails?.vivaSchedule?.scheduledDate ? new Date(c.placementDetails.vivaSchedule.scheduledDate).toLocaleDateString() : '',
      c.placementDetails?.offerLetter?.status || 'NOT_ISSUED',
      c.placementDetails?.deployment?.status || 'PENDING',
      c.placementDetails?.deployment?.flightDate ? new Date(c.placementDetails.deployment.flightDate).toLocaleDateString() : '',
      `"${c.placementDetails?.deployment?.ticketNumber || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Placement_Deployment_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Export Generated',
      text: `${filteredLeads.length} candidate deployment records exported to CSV.`,
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
              Live Placement & Deployment Telemetry
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              FRD Section 16, 17 & 18 Compliant
            </span>
          </div>
          <h1 className="text-[21px] sm:text-[26px] lg:text-[28px] font-extrabold text-gray-900 tracking-tight leading-tight">
            Client Viva, Flight & Overseas Deployment Reports
          </h1>
          <p className="text-[13px] sm:text-[14px] text-gray-500 mt-1 max-w-3xl leading-relaxed">
            End-to-end recruitment tracking auditing foreign client viva selection ratios, bilateral contract signings, flight ticketing, and on-site camp arrivals.
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
        {/* Card 1: Total in Placement Pipeline */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Pipeline Total
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-gray-900 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : totalInPipeline}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Total Candidates in Viva/Flight</div>
          </div>
        </div>

        {/* Card 2: Viva Selected */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              Client Selected
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-purple-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : selectedCount}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Client Final Viva Selected</div>
          </div>
        </div>

        {/* Card 3: Viva Scheduled */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              In Schedule
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-indigo-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : scheduledCount}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Viva Dates Booked (Sec 16)</div>
          </div>
        </div>

        {/* Card 4: Flight Bookings */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              Flight Ready
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-teal-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : flightsCount}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Tickets & Flight Booked</div>
          </div>
        </div>

        {/* Card 5: Deployed on Site */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Joined Camp
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-emerald-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : joinedCount}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Foreign Site Joined (Completed)</div>
          </div>
        </div>
      </div>

      {/* Destination Placement Summary Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden mb-6">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[15px] text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Destination Deployment Roster (Live Breakdown)
            </h3>
            <p className="text-[12px] text-gray-500">Live placement and deployment progression across target overseas markets.</p>
          </div>
          <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
            {employerPlacementStats.length} Territories
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">Destination Market</th>
                <th className="py-3 px-4 text-center">Pipeline Leads</th>
                <th className="py-3 px-4 text-center">Client Viva Selected</th>
                <th className="py-3 px-4 text-center">Flight Booked / Ticketed</th>
                <th className="py-3 px-4 text-center">Joined Foreign Site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {employerPlacementStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-[12px]">
                    No destination placement records found in the database.
                  </td>
                </tr>
              ) : (
                employerPlacementStats.map((e, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors whitespace-nowrap">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{e.destination}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-800">{e.total}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-purple-600">{e.vivaSelected}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-teal-600">{e.flightBooked}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">{e.joinedOnSite}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Deployment & Flight Ledger Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Top Controls Bar */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[16px]">Candidate Placement & Deployment Roster</h3>
              <p className="text-[12px] text-gray-500">Live operational roster displaying client viva approvals, flights, and camp deployments.</p>
            </div>

            {/* Filter Selectors */}
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
            </div>
          </div>

          {/* Workflow Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'All', label: 'All Candidates', count: placementLeads.length },
              { key: 'Viva Scheduled', label: 'Viva Scheduled', count: scheduledCount },
              { key: 'Viva Selected', label: 'Viva Selected', count: selectedCount },
              { key: 'Flight Booked', label: 'Flight Booked', count: flightsCount },
              { key: 'Joined on Site', label: 'Joined Site (Completed)', count: joinedCount },
              { key: 'On Hold', label: 'On Hold', count: placementLeads.filter(c => c.placementDetails?.vivaResult?.status === 'ON_HOLD').length }
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
                <th className="py-3 px-4">Trade & Profession</th>
                <th className="py-3 px-4">Client Viva Result</th>
                <th className="py-3 px-4">Flight & Ticket Status</th>
                <th className="py-3 px-4">Deployment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading candidate deployment records from database...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No placement records match your active search and filter criteria.
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
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-gray-900 text-[12px]">
                      {row.country || 'Gulf Region'}
                    </td>

                    {/* Trade */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-800 text-[12px]">
                      {row.trade || 'General'}
                    </td>

                    {/* Viva Result */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        row.placementDetails?.vivaResult?.status === 'SELECTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        row.placementDetails?.vivaResult?.status === 'ON_HOLD' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        row.placementDetails?.vivaResult?.status === 'NOT_SELECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {row.placementDetails?.vivaResult?.status || 'PENDING VIVA'}
                      </span>
                    </td>

                    {/* Flight Details */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {row.placementDetails?.deployment?.ticketNumber ? (
                        <div>
                          <div className="font-mono font-bold text-[11px] text-blue-700">
                            Ticket: {row.placementDetails.deployment.ticketNumber}
                          </div>
                          {row.placementDetails?.deployment?.flightDate && (
                            <div className="text-[10px] text-gray-500">
                              {new Date(row.placementDetails.deployment.flightDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Ticket Pending</span>
                      )}
                    </td>

                    {/* Deployment Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        row.currentStage === 'COMPLETED' || row.placementDetails?.deployment?.status === 'JOINED_ON_SITE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        row.placementDetails?.deployment?.status === 'FLIGHT_BOOKED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        row.placementDetails?.deployment?.status === 'DEPARTED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {row.currentStage === 'COMPLETED' ? 'JOINED ON SITE' : row.placementDetails?.deployment?.status?.replace(/_/g, ' ') || 'PROCESSING'}
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
            Showing <span className="font-bold text-gray-800">{filteredLeads.length}</span> of <span className="font-bold text-gray-800">{placementLeads.length}</span> candidates in placement roster
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Placement CSV</span>
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
