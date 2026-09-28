import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Download, DollarSign, Receipt, Banknote, FileText, 
  Clock, CheckCircle2, AlertTriangle, Search, Filter, Eye, Printer, 
  Building2, Calendar, RotateCcw, Sparkles, ShieldCheck, Check, X, 
  Plus, RefreshCw, AlertCircle, TrendingUp, BarChart3, ExternalLink, 
  FileSpreadsheet, CreditCard, Wallet, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiGetDashboardSummary, apiGetLeads } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function FinancialReports() {
  const [summary, setSummary] = useState(null);
  const [candidates, setCandidates] = useState([]);
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
        apiGetLeads({ limit: 250 })
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummary(sumRes.value.data);
      }
      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        setCandidates(leadsRes.value.data || []);
      }
    } catch (err) {
      console.error('Error loading financial reports:', err);
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
    candidates.forEach(c => {
      if (c.country) set.add(c.country);
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Aggregate Financials from summary or computed fallback
  const fin = summary?.financials || {};
  const totalServiceFee = fin.totalServiceFee || candidates.reduce((acc, c) => acc + (c.paymentDetails?.serviceFee || 0), 0);
  const totalServicePaid = fin.totalServicePaid || candidates.reduce((acc, c) => acc + (c.paymentDetails?.servicePaid || 0), 0);
  const totalMedicalFee = fin.totalMedicalFee || candidates.reduce((acc, c) => acc + (c.paymentDetails?.medicalFee || 0), 0);
  const totalMedicalPaid = fin.totalMedicalPaid || candidates.reduce((acc, c) => acc + (c.paymentDetails?.medicalPaid || 0), 0);

  const totalBilled = totalServiceFee + totalMedicalFee;
  const totalCollected = fin.totalCollected || (totalServicePaid + totalMedicalPaid);
  const totalPending = fin.totalPending || Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : 0;

  const fullPaidCount = fin.fullPaidCount ?? candidates.filter(c => c.paymentDetails?.paymentStatus === 'FULL').length;
  const partialPaidCount = fin.partialPaidCount ?? candidates.filter(c => c.paymentDetails?.paymentStatus === 'PARTIAL').length;
  const unpaidCount = fin.unpaidCount ?? candidates.filter(c => !c.paymentDetails?.paymentStatus || c.paymentDetails?.paymentStatus === 'UNPAID').length;

  // Filtered Candidate Ledgers
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const payStatus = c.paymentDetails?.paymentStatus || 'UNPAID';

      // Tab filter
      if (activeTab === 'Fully Cleared' && payStatus !== 'FULL') return false;
      if (activeTab === 'Partial Paid' && payStatus !== 'PARTIAL') return false;
      if (activeTab === 'Unpaid / Due' && payStatus !== 'UNPAID') return false;

      // Country
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
  }, [candidates, activeTab, selectedCountry, searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'No financial records match the criteria to export.' });
      return;
    }
    const headers = [
      'Lead ID', 'Candidate Name', 'Passport No', 'Phone', 'Country', 'Trade', 
      'Service Fee (Billed)', 'Service Fee (Paid)', 'Medical Fee (Billed)', 'Medical Fee (Paid)', 
      'Total Billed', 'Total Paid', 'Pending Balance', 'Payment Status'
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
        `"${c.phone || ''}"`,
        `"${c.country || ''}"`,
        `"${c.trade || ''}"`,
        p.serviceFee || 0,
        p.servicePaid || 0,
        p.medicalFee || 0,
        p.medicalPaid || 0,
        billed,
        paid,
        pending,
        p.paymentStatus || 'UNPAID'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Payment_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Export Generated',
      text: `${filteredCandidates.length} financial records exported to CSV.`,
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
              Live Fee & Payment Accounting Telemetry
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              FRD Section 11 & 17 Compliant
            </span>
          </div>
          <h1 className="text-[21px] sm:text-[26px] lg:text-[28px] font-extrabold text-gray-900 tracking-tight leading-tight">
            Fee & Payment Collection Reports
          </h1>
          <p className="text-[13px] sm:text-[14px] text-gray-500 mt-1 max-w-3xl leading-relaxed">
            Centralized financial ledger maintaining strict separation of Service Fee and Medical Fee collections, advance payments (Medical booking), and final deployment settlements.
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
        {/* Card 1: Total Billed */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Receivable
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[20px] font-bold text-gray-900 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${totalBilled.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Total Billed Volume</div>
          </div>
        </div>

        {/* Card 2: Total Collected */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {collectionRate}% Collected
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[20px] font-bold text-emerald-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${totalCollected.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Total Revenue Recovered</div>
          </div>
        </div>

        {/* Card 3: Pending Balance */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Balance Due
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[20px] font-bold text-amber-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${totalPending.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Outstanding Pending Amount</div>
          </div>
        </div>

        {/* Card 4: Service Fee Split (FRD Sec 11) */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Service Fee Pool
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[18px] font-bold text-indigo-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${totalServicePaid.toLocaleString('en-IN')} / ₹ ${totalServiceFee.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Service Fee Recovered</div>
          </div>
        </div>

        {/* Card 5: Medical Fee Split (FRD Sec 11) */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              Medical Fee Pool
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[18px] font-bold text-teal-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `₹ ${totalMedicalPaid.toLocaleString('en-IN')} / ₹ ${totalMedicalFee.toLocaleString('en-IN')}`}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Medical Fee Recovered</div>
          </div>
        </div>
      </div>

      {/* Candidate Invoices & Financial Ledger Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Top Controls Bar */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[16px]">Candidate Fee & Payment Ledger (FRD Compliant)</h3>
              <p className="text-[12px] text-gray-500">Live operational ledger displaying individual candidate payments with distinct Service and Medical fee tracking.</p>
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
              { key: 'All', label: 'All Candidates', count: candidates.length },
              { key: 'Fully Cleared', label: 'Fully Paid (FULL)', count: fullPaidCount },
              { key: 'Partial Paid', label: 'Partial Paid (PARTIAL)', count: partialPaidCount },
              { key: 'Unpaid / Due', label: 'Unpaid / Pending (UNPAID)', count: unpaidCount }
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
                <th className="py-3 px-4">Destination & Trade</th>
                <th className="py-3 px-4 text-center">Service Fee (Sec 11)</th>
                <th className="py-3 px-4 text-center">Medical Fee (Sec 11)</th>
                <th className="py-3 px-4 text-center">Total Paid</th>
                <th className="py-3 px-4 text-center">Pending Balance</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading financial ledger records from database...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No financial ledger records match your active search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((row) => {
                  const p = row.paymentDetails || {};
                  const billed = (p.serviceFee || 0) + (p.medicalFee || 0);
                  const paid = p.totalPaid || ((p.servicePaid || 0) + (p.medicalPaid || 0));
                  const pending = Math.max(0, billed - paid);
                  const status = p.paymentStatus || 'UNPAID';

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
                          {row.passportNumber || 'PENDING'}
                        </span>
                        <div className="text-[11px] text-gray-400 mt-0.5">{row.phone}</div>
                      </td>

                      {/* Destination & Trade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 text-[12px]">{row.country || 'Gulf Region'}</div>
                        <div className="text-[11px] text-gray-500">{row.trade || 'General'}</div>
                      </td>

                      {/* Service Fee */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-mono font-bold text-gray-900 text-[12px]">
                          ₹ {(p.servicePaid || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          of ₹ {(p.serviceFee || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Medical Fee */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-mono font-bold text-teal-700 text-[12px]">
                          ₹ {(p.medicalPaid || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          of ₹ {(p.medicalFee || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Total Paid */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="font-mono font-bold text-emerald-600 text-[13px]">
                          ₹ {paid.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Total Billed: ₹ {billed.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Pending Balance */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`font-mono font-bold text-[13px] ${pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₹ {pending.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          status === 'FULL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {status === 'FULL' ? 'Fully Cleared' : status === 'PARTIAL' ? 'Partial Paid' : 'Unpaid / Due'}
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
            Showing <span className="font-bold text-gray-800">{filteredCandidates.length}</span> of <span className="font-bold text-gray-800">{candidates.length}</span> candidate accounts in active ledger
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Accounts CSV</span>
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
