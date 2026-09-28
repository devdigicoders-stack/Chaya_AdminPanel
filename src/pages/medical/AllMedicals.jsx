import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, Plus, Download, Users, CheckCircle2, XCircle, 
  Clock, CalendarDays, ArrowUpRight, ArrowDownRight, Activity, 
  Sparkles, ShieldCheck, RefreshCw, Loader2, ArrowRight, HeartPulse, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MedicalTable from '../../components/medical/MedicalTable';
import { apiGetLeads } from '../../utils/api';

export default function AllMedicals() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      let res = await apiGetLeads({ medicalDesk: true });
      if (res?.success && res.data) {
        setLeads(res.data);
      } else {
        const fallbackRes = await apiGetLeads({ stage: 'ALL' });
        if (fallbackRes?.success && fallbackRes.data) {
          setLeads(fallbackRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load medical leads:', err);
      setError(err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Real-time KPI Stats
  const totalCount = leads.length;
  const fitCount = leads.filter(l => l.medicalDetails?.status === 'FIT').length;
  const unfitCount = leads.filter(l => l.medicalDetails?.status === 'UNFIT').length;
  const scheduledCount = leads.filter(l => l.medicalDetails?.status === 'SCHEDULED').length;
  const pendingCount = leads.filter(l => l.medicalDetails?.status === 'PENDING' || !l.medicalDetails?.status).length;
  
  const fitPercent = totalCount > 0 ? ((fitCount / totalCount) * 100).toFixed(1) : '0.0';
  const unfitPercent = totalCount > 0 ? ((unfitCount / totalCount) * 100).toFixed(1) : '0.0';

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('No medical records available to export.');
      return;
    }

    const headers = ['Lead ID', 'Candidate Name', 'Phone', 'Passport No', 'Trade', 'Destination', 'Medical Center', 'Slip No', 'Status', 'Exam Date', 'Service Fee', 'Medical Fee'];
    const rows = leads.map(l => [
      l.leadId || l._id,
      `"${l.candidateName || ''}"`,
      l.phone || '',
      l.passportNumber || '',
      `"${l.trade || ''}"`,
      `"${l.country || ''}"`,
      `"${l.medicalDetails?.center || ''}"`,
      l.medicalDetails?.slipNo || '',
      l.medicalDetails?.status || 'PENDING',
      l.medicalDetails?.appointmentDate ? new Date(l.medicalDetails.appointmentDate).toISOString().split('T')[0] : '',
      l.paymentDetails?.serviceFee || 9500,
      l.medicalDetails?.medicalFee || l.paymentDetails?.medicalFee || 2500
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GAMCA_Medical_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Medical & Booking</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Medical List (Fit / Unfit)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Medical List (Fit / Unfit)
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/medical/schedule')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            title="Schedule Approved GAMCA Center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Medical</span>
          </button>

          <button
            onClick={() => navigate('/billing/all')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Go to Step 11 Bill Book"
          >
            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
            <span>Bill Book</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Export Medical Records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export</span>
          </button>

          <button
            onClick={fetchLeads}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-center gap-2 mb-5">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Dynamic KPI Stat Cards (Clean 5-Card Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Medicals */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total Medical Files</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : totalCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Total active candidates</div>
          </div>
        </div>

        {/* Passed (FIT) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">GAMCA FIT (Passed)</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : fitCount}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">{fitPercent}% clearance rate</div>
          </div>
        </div>

        {/* Failed (UNFIT) */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-red-700">GAMCA UNFIT</span>
            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-red-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : unfitCount}
            </div>
            <div className="text-[11px] text-red-600 font-semibold mt-1">{unfitPercent}% quarantined</div>
          </div>
        </div>

        {/* Lab Pending */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Lab Pending</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : pendingCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Awaiting clinic allocation</div>
          </div>
        </div>

        {/* Scheduled Appointments */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Scheduled Slots</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-purple-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : scheduledCount}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Confirmed appointments</div>
          </div>
        </div>

      </div>

      {/* 3. Direct Medical Records Table (Clean, Professional, Zero Clutter) */}
      <div className="w-full">
        <MedicalTable leads={leads} loading={loading} onRefresh={fetchLeads} />
      </div>

    </div>
  );
}
