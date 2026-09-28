import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Plus, Download, Users, CheckCircle2, Hourglass, 
  Briefcase, XCircle, Search, RefreshCw, Loader2, Eye, History, 
  Phone, Mail, MapPin, Building2, ShieldCheck, AlertCircle, 
  Ban, ArrowRight, UserCheck, X, FileText, Check, PauseCircle, PlayCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiToggleLeadHold } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function AllCandidatesPage() {
  const navigate = useNavigate();

  // State
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');

  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [dossierCandidate, setDossierCandidate] = useState(null);

  // Fetch candidates from MongoDB Atlas
  const fetchCandidates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetLeads({ stage: 'ALL' });
      if (res?.success && res.data) {
        setCandidates(res.data);
      }
    } catch (err) {
      console.error('Failed to load candidate registry:', err);
      setError(err.message || 'Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Hold / Unhold candidate toggle
  const handleToggleHold = async (candidate) => {
    const isCurrentlyHold = candidate.isHold;
    const action = isCurrentlyHold ? 'Release from Hold' : 'Place on Hold';

    const result = await Swal.fire({
      title: `${action}?`,
      text: `Are you sure you want to ${action.toLowerCase()} for candidate ${candidate.candidateName}?`,
      icon: isCurrentlyHold ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isCurrentlyHold ? '#059669' : '#d97706',
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setActionLoadingId(candidate._id);
    try {
      const res = await apiToggleLeadHold(
        candidate._id, 
        !isCurrentlyHold, 
        isCurrentlyHold ? 'Released from hold via Master Registry' : 'Placed on administrative hold via Master Registry'
      );
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: `Status Updated`,
          text: `Candidate ${candidate.candidateName} is now ${!isCurrentlyHold ? 'ON HOLD' : 'ACTIVE'}.`,
          confirmButtonColor: '#2563eb',
          timer: 2000
        });
        fetchCandidates();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Action Failed', text: err.message || 'Could not update hold status' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (candidates.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'No candidates available to export.' });
      return;
    }

    const headers = ['ID', 'Name', 'Passport', 'Phone', 'Trade', 'Country', 'Stage', 'Status', 'Medical', 'Registration Date'];
    const rows = candidates.map(c => [
      c._id,
      `"${c.candidateName || ''}"`,
      `"${c.passportNumber || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.trade || ''}"`,
      `"${c.country || ''}"`,
      `"${c.currentStage || ''}"`,
      `"${c.status || ''}"`,
      `"${c.medicalDetails?.status || 'PENDING'}"`,
      `"${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Chhaya_Candidate_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Real-time KPI Stats from MongoDB Atlas
  const metrics = useMemo(() => {
    let total = candidates.length;
    let active = 0;
    let medicalVisa = 0;
    let placed = 0;
    let onHoldOrCancelled = 0;

    candidates.forEach(c => {
      const stage = c.currentStage || '';
      const status = c.status || '';

      if (c.isHold || status === 'CANCELLED' || status === 'UNFIT' || status === 'REJECTED') {
        onHoldOrCancelled++;
      } else if (stage.includes('PLACEMENT') || stage === 'FINAL_PAYMENT_COMPLETED' || stage === 'JOINED') {
        placed++;
      } else if (stage.includes('VISA') || stage.includes('PRE_VIVA') || stage.includes('MEDICAL')) {
        medicalVisa++;
      } else {
        active++;
      }
    });

    return { total, active, medicalVisa, placed, onHoldOrCancelled };
  }, [candidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const stage = c.currentStage || '';
      const status = c.status || '';

      if (filterTab === 'ACTIVE') {
        if (c.isHold || status === 'CANCELLED' || status === 'UNFIT') return false;
      } else if (filterTab === 'MEDICAL_VISA') {
        if (!stage.includes('VISA') && !stage.includes('PRE_VIVA') && !stage.includes('MEDICAL')) return false;
      } else if (filterTab === 'PLACED') {
        if (!stage.includes('PLACEMENT') && stage !== 'FINAL_PAYMENT_COMPLETED' && stage !== 'JOINED') return false;
      } else if (filterTab === 'HOLD_CANCEL') {
        if (!c.isHold && status !== 'CANCELLED' && status !== 'UNFIT') return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (c.candidateName || '').toLowerCase();
        const passport = (c.passportNumber || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const trade = (c.trade || '').toLowerCase();
        const country = (c.country || '').toLowerCase();

        if (!name.includes(q) && !passport.includes(q) && !phone.includes(q) && !trade.includes(q) && !country.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, searchTerm, filterTab]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">10. Candidates & Registry</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Master Roster</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Candidate Master Registry
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handleExportCSV}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export Roster (CSV)</span>
          </button>

          <button 
            onClick={() => navigate('/candidates/cancelled')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            <span>Cancelled Desk</span>
          </button>

          <button 
            onClick={() => navigate('/candidates/blacklisted')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5 text-orange-500" />
            <span>Unfit & Blacklist</span>
          </button>

          <button 
            onClick={() => navigate('/candidates/add')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Candidate</span>
          </button>

          <button
            onClick={fetchCandidates}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Real-time Dynamic KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Registered */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700">Total Registry</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Full candidate roster</div>
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Active Pipeline</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.active}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">In active processing</div>
          </div>
        </div>

        {/* Medical & Visa Ready */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-orange-700">Medical / Visa</span>
            <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-orange-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.medicalVisa}
            </div>
            <div className="text-[11px] text-orange-600 font-medium mt-1">GAMCA & Embassy process</div>
          </div>
        </div>

        {/* Placed & Deployed */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Placed / Deployed</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-purple-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.placed}
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">Flight booked & joined</div>
          </div>
        </div>

        {/* On Hold / Inactive */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-red-700">Hold / Cancelled</span>
            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[22px] font-black text-red-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.onHoldOrCancelled}
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1">Locked or disqualified</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Candidates', count: metrics.total },
              { key: 'ACTIVE', label: 'Active Pipeline', count: metrics.active },
              { key: 'MEDICAL_VISA', label: 'Medical / Visa', count: metrics.medicalVisa },
              { key: 'PLACED', label: 'Placed / Deployed', count: metrics.placed },
              { key: 'HOLD_CANCEL', label: 'Hold / Disqualified', count: metrics.onHoldOrCancelled },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterTab === tab.key
                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTab === tab.key ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/80 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, passport, phone, trade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Live Candidate Master Registry Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Trade & Target Country</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4 text-center">Medical Status</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading candidate master registry from database...</span>
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
                filteredCandidates.map((candidate) => {
                  const isHold = candidate.isHold;
                  const medicalStatus = candidate.medicalDetails?.status || 'PENDING';
                  const stage = candidate.currentStage || 'UNASSIGNED';

                  return (
                    <tr key={candidate._id} className="hover:bg-blue-50/30 transition-colors">
                      
                      {/* Candidate */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {(candidate.candidateName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{candidate.candidateName}</span>
                              {isHold && (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800">
                                  HOLD
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">
                              {candidate.passportNumber || 'No Passport'} • {candidate.phone || 'No Phone'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trade & Country */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{candidate.trade || 'General Worker'}</div>
                        <div className="text-[11px] text-blue-600 font-medium">
                          {candidate.country || 'Gulf Region'} {candidate.assignedTo ? `• Caller: ${candidate.assignedTo}` : ''}
                        </div>
                      </td>

                      {/* Current Stage */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {stage.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Medical Status */}
                      <td className="py-3 px-4 text-center">
                        {medicalStatus === 'FIT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            FIT
                          </span>
                        ) : medicalStatus === 'UNFIT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <X className="w-3 h-3 text-red-600" />
                            UNFIT
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-gray-100 text-gray-600">
                            {medicalStatus}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                          candidate.status === 'COMPLETED' || candidate.status === 'PLACED'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : candidate.status === 'CANCELLED' || candidate.status === 'UNFIT'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {candidate.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Dossier Modal */}
                          <button
                            onClick={() => setDossierCandidate(candidate)}
                            className="h-7 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="View Full Candidate Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Dossier</span>
                          </button>

                          {/* Audit History */}
                          <button
                            onClick={() => setSelectedCandidate(candidate)}
                            className="h-7 w-7 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="Audit History & Lifecycle Trail"
                          >
                            <History className="w-3.5 h-3.5 text-gray-500" />
                          </button>

                          {/* Hold / Unhold Toggle */}
                          <button
                            onClick={() => handleToggleHold(candidate)}
                            disabled={actionLoadingId === candidate._id}
                            className={`h-7 w-7 border rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                              isHold 
                                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' 
                                : 'border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-amber-600'
                            }`}
                            title={isHold ? 'Release Candidate Hold' : 'Place on Hold'}
                          >
                            {actionLoadingId === candidate._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isHold ? (
                              <PlayCircle className="w-3.5 h-3.5" />
                            ) : (
                              <PauseCircle className="w-3.5 h-3.5" />
                            )}
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Candidate Dossier Modal */}
      {dossierCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  {(dossierCandidate.candidateName || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{dossierCandidate.candidateName}</h3>
                  <p className="text-[11px] text-gray-500">{dossierCandidate.passportNumber || 'No Passport'} • {dossierCandidate.phone}</p>
                </div>
              </div>
              <button onClick={() => setDossierCandidate(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                <div>
                  <span className="text-gray-400 block text-[10.5px]">Trade / Job Role:</span>
                  <span className="font-bold text-gray-900">{dossierCandidate.trade || 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10.5px]">Target Country:</span>
                  <span className="font-bold text-blue-600">{dossierCandidate.country || 'Gulf Region'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10.5px]">Current Lifecycle Stage:</span>
                  <span className="font-bold text-emerald-700">{dossierCandidate.currentStage?.replace(/_/g, ' ') || 'UNASSIGNED'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10.5px]">Assigned Staff:</span>
                  <span className="font-bold text-gray-800">{dossierCandidate.assignedTo || 'Unassigned'}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <h4 className="font-bold text-blue-900 text-[11.5px] uppercase tracking-wider">Process & Compliance</h4>
                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  <div>
                    <span className="text-gray-500">Medical Fitness:</span>{' '}
                    <span className="font-bold text-gray-900">{dossierCandidate.medicalDetails?.status || 'Pending'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Advance Paid:</span>{' '}
                    <span className="font-bold text-emerald-700">₹ {dossierCandidate.paymentDetails?.advancePaid || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Billed:</span>{' '}
                    <span className="font-bold text-gray-900">₹ {(Number(dossierCandidate.paymentDetails?.serviceFee) || 9500) + (Number(dossierCandidate.paymentDetails?.medicalFee) || 2500)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Balance:</span>{' '}
                    <span className="font-bold text-amber-700">₹ {Math.max(0, ((Number(dossierCandidate.paymentDetails?.serviceFee) || 9500) + (Number(dossierCandidate.paymentDetails?.medicalFee) || 2500)) - (Number(dossierCandidate.paymentDetails?.totalPaid || dossierCandidate.paymentDetails?.advancePaid || 0)))}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setDossierCandidate(null);
                    setSelectedCandidate(dossierCandidate);
                  }}
                  className="h-9 px-3.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>View Audit Trail</span>
                </button>
                <button
                  onClick={() => setDossierCandidate(null)}
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. Lead History Audit Trail Modal */}
      <LeadHistoryModal
        isOpen={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        candidate={selectedCandidate}
      />

    </div>
  );
}
