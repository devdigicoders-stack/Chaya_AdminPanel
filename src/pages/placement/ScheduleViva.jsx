import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Plus, Calendar, Clock, Users, Building, Search, 
  ChevronDown, X, CheckCircle2, RotateCcw, MapPin, ArrowRight, 
  ShieldCheck, Check, Download, FileText, Globe, Sparkles, Award, 
  Video, RefreshCw, XCircle, AlertCircle, AlertTriangle, Eye, Loader2,
  FileCheck, Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiSchedulePlacementViva, apiSubmitPlacementVivaResult } from '../../utils/api';

const INTERVIEW_MODES = [
  'Foreign Delegate (In-Person)',
  'Video Conference (Zoom)',
  'Video Conference (Teams)',
  'Trade Testing Workshop',
  'Client Driving Track',
  'Direct Client CV Selection'
];

export default function ScheduleViva() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLeadForSchedule, setSelectedLeadForSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    company: '',
    country: 'UAE',
    date: '',
    time: '10:00 AM',
    mode: 'Foreign Delegate (In-Person)',
    panel: '',
    room: 'Interview Hall A',
    remarks: ''
  });

  // Grade Result Modal
  const [gradeModalLead, setGradeModalLead] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    score: 85,
    status: 'SELECTED',
    skillScore: 35,
    theoryScore: 25,
    safetyScore: 13,
    commScore: 12,
    remarks: 'Candidate cleared technical standards successfully.'
  });

  // Fetch leads
  const fetchPlacementLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetLeads({ placementDesk: 'true' });
      if (res?.success && res.data) {
        setLeads(res.data);
      } else {
        const fallback = await apiGetLeads({ stage: 'ALL' });
        if (fallback?.success && fallback.data) {
          const filtered = fallback.data.filter(l => 
            l.currentStage === 'VIVA_PLACEMENT' || 
            l.currentStage === 'COMPLETED' ||
            l.visaDetails?.status === 'APPROVED' ||
            l.placementDetails?.vivaSchedule?.vivaId
          );
          setLeads(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to load placement viva leads', err);
      setError(err.message || 'Could not connect to recruitment server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacementLeads();
  }, []);

  // Handle Submit Schedule Form
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!selectedLeadForSchedule) {
      Swal.fire({ icon: 'warning', title: 'Select Candidate', text: 'Please choose a candidate to schedule viva.' });
      return;
    }

    setActionLoadingId(selectedLeadForSchedule._id);
    try {
      const res = await apiSchedulePlacementViva(selectedLeadForSchedule._id, scheduleForm);
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Viva Scheduled!',
          text: `Client Viva confirmed for ${selectedLeadForSchedule.candidateName}.`,
          confirmButtonColor: '#7C3AED',
          timer: 2000
        });
        setShowScheduleModal(false);
        setSelectedLeadForSchedule(null);
        fetchPlacementLeads();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Schedule Failed', text: err.message || 'Could not schedule viva.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Grade Result
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradeModalLead) return;

    setActionLoadingId(gradeModalLead._id);
    try {
      const totalScore = Number(gradeForm.skillScore) + Number(gradeForm.theoryScore) + Number(gradeForm.safetyScore) + Number(gradeForm.commScore);
      const res = await apiSubmitPlacementVivaResult(gradeModalLead._id, {
        score: totalScore,
        breakdown: {
          skill: Number(gradeForm.skillScore),
          theory: Number(gradeForm.theoryScore),
          safety: Number(gradeForm.safetyScore),
          comm: Number(gradeForm.commScore)
        },
        status: gradeForm.status,
        remarks: gradeForm.remarks
      });

      if (res?.success) {
        Swal.fire({
          icon: gradeForm.status === 'SELECTED' ? 'success' : 'info',
          title: `Result Recorded: ${gradeForm.status}`,
          text: `Score: ${totalScore}/100. Candidate is now ready for offer letter.`,
          confirmButtonColor: '#7C3AED',
          timer: 2000
        });
        setGradeModalLead(null);
        fetchPlacementLeads();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Grade Submission Failed', text: err.message || 'Could not record score.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const p = l.placementDetails?.vivaSchedule || {};
      const status = p.status || (l.currentStage === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED');

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const trade = (l.trade || l.applicationForm?.trade || '').toLowerCase();
        const company = (p.company || '').toLowerCase();
        const country = (p.country || l.visaDetails?.country || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !trade.includes(q) && !company.includes(q) && !country.includes(q)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [leads, searchTerm, statusFilter]);

  // Dynamic KPI Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    let scheduled = 0;
    let completed = 0;
    let rescheduled = 0;

    leads.forEach(l => {
      const st = l.placementDetails?.vivaSchedule?.status;
      if (st === 'COMPLETED' || l.currentStage === 'COMPLETED') completed++;
      else if (st === 'RESCHEDULED') rescheduled++;
      else scheduled++;
    });

    return { total, scheduled, completed, rescheduled };
  }, [leads]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">08. Viva & Placement</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Schedule Viva Date</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Client Final Viva & Placement Interview Desk
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => {
              if (leads.length > 0) setSelectedLeadForSchedule(leads[0]);
              setShowScheduleModal(true);
            }}
            className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            title="Schedule New Client Viva"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Viva</span>
          </button>

          <button 
            onClick={() => navigate('/placement/results')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Viva Results & Scorecards"
          >
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span>Results & Scorecards</span>
          </button>

          <button 
            onClick={() => navigate('/placement/offer')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Offer Letters"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Offer Letters</span>
          </button>

          <button 
            onClick={() => navigate('/placement/joining')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Flight & Joining"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Flight & Joining</span>
          </button>

          <button
            onClick={fetchPlacementLeads}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Viva Candidates */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total Candidates</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">In placement pipeline</div>
          </div>
        </div>

        {/* Scheduled & Active */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700">Scheduled Vivas</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-blue-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.scheduled}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold mt-1">Awaiting interview</div>
          </div>
        </div>

        {/* Cleared / Completed */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Completed & Selected</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.completed}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Cleared for contract</div>
          </div>
        </div>

        {/* Rescheduled / On Hold */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Rescheduled / Hold</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.rescheduled}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Pending new slot</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Quick Status Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Vivas', count: metrics.total },
              { key: 'SCHEDULED', label: 'Scheduled', count: metrics.scheduled },
              { key: 'COMPLETED', label: 'Completed', count: metrics.completed },
              { key: 'RESCHEDULED', label: 'Rescheduled', count: metrics.rescheduled },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.key ? 'bg-purple-50 text-purple-600' : 'bg-gray-200/80 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, passport, trade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Live Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Employer & Trade</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Viva Schedule</th>
                <th className="py-3 px-4">Mode & Venue</th>
                <th className="py-3 px-4">Panel / Room</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    <span>Loading viva schedules...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>No viva schedules found matching your filter.</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const p = lead.placementDetails?.vivaSchedule || {};
                  const vivaDate = p.date ? new Date(p.date).toLocaleDateString() : 'Pending Date';
                  const vivaTime = p.time || '10:00 AM';
                  const company = p.company || lead.applicationForm?.company || 'Foreign Employer';
                  const trade = lead.trade || lead.applicationForm?.trade || 'Technician';
                  const country = p.country || lead.visaDetails?.country || lead.locationConfirmation?.confirmedLocation || 'UAE';
                  const status = p.status || (lead.currentStage === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED');
                  const score = lead.placementDetails?.vivaResult?.score;

                  return (
                    <tr key={lead._id} className="hover:bg-purple-50/30 transition-colors">
                      
                      {/* Candidate */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{lead.candidateName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {lead.passportNumber || 'No Passport'} • {lead.phone}
                        </div>
                      </td>

                      {/* Employer & Trade */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{company}</div>
                        <div className="text-[11px] text-purple-600 font-medium">{trade}</div>
                      </td>

                      {/* Country */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800">{country}</span>
                      </td>

                      {/* Schedule */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-semibold text-gray-900">{vivaDate}</div>
                        <div className="text-[11px] text-gray-400">{vivaTime}</div>
                      </td>

                      {/* Mode */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          {p.mode?.includes('Video') ? <Video className="w-3.5 h-3.5 text-blue-500" /> : <Building className="w-3.5 h-3.5 text-gray-400" />}
                          <span className="truncate max-w-[130px]">{p.mode || 'Foreign Delegate'}</span>
                        </span>
                      </td>

                      {/* Panel / Room */}
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-medium truncate max-w-[120px]">{p.panel || 'Delegate Panel'}</div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[120px]">{p.room || 'Interview Hall A'}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Completed {score ? `(${score}%)` : ''}
                          </span>
                        ) : status === 'RESCHEDULED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Rescheduled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Calendar className="w-3 h-3 text-purple-600" />
                            Scheduled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setGradeModalLead(lead);
                              setGradeForm({
                                score: score || 85,
                                status: lead.placementDetails?.vivaResult?.status || 'SELECTED',
                                skillScore: lead.placementDetails?.vivaResult?.breakdown?.skill || 35,
                                theoryScore: lead.placementDetails?.vivaResult?.breakdown?.theory || 25,
                                safetyScore: lead.placementDetails?.vivaResult?.breakdown?.safety || 13,
                                commScore: lead.placementDetails?.vivaResult?.breakdown?.comm || 12,
                                remarks: lead.placementDetails?.vivaResult?.remarks || 'Evaluated successfully'
                              });
                            }}
                            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                            title="Record Viva Scorecard / Result"
                          >
                            <Award className="w-3 h-3" />
                            <span>Grade</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedLeadForSchedule(lead);
                              setScheduleForm({
                                company: p.company || '',
                                country: country,
                                date: p.date ? new Date(p.date).toISOString().substring(0, 10) : '',
                                time: p.time || '10:00 AM',
                                mode: p.mode || 'Foreign Delegate (In-Person)',
                                panel: p.panel || '',
                                room: p.room || 'Interview Hall A',
                                remarks: p.remarks || ''
                              });
                              setShowScheduleModal(true);
                            }}
                            className="h-7 px-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit / Reschedule Viva Date"
                          >
                            <Edit3 className="w-3 h-3 text-gray-500" />
                            <span>Edit</span>
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

      {/* 5. Schedule Viva Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Schedule Client Final Viva</h3>
                <p className="text-[11px] text-gray-500">Foreign delegate interview slot allocation</p>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-5 space-y-4">
              
              {/* Candidate Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Candidate *
                </label>
                <select
                  required
                  value={selectedLeadForSchedule?._id || ''}
                  onChange={(e) => {
                    const sel = leads.find(l => l._id === e.target.value);
                    setSelectedLeadForSchedule(sel);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Choose Candidate --</option>
                  {leads.map(l => (
                    <option key={l._id} value={l._id}>
                      {l.candidateName} ({l.passportNumber || 'No Passport'} • {l.trade || 'Worker'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Company & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Client Employer / Company *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al Falah Group"
                    value={scheduleForm.company}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Country *
                  </label>
                  <select
                    value={scheduleForm.country}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="UAE">UAE</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Oman">Oman</option>
                    <option value="Bahrain">Bahrain</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Viva Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Viva Time *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Mode & Venue */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Interview Mode *
                  </label>
                  <select
                    value={scheduleForm.mode}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, mode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-purple-500"
                  >
                    {INTERVIEW_MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Venue / Room *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Interview Hall A"
                    value={scheduleForm.room}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Panel Member */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Foreign Panel Delegate Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Eng. Ahmed Al-Mansoor"
                  value={scheduleForm.panel}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, panel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Interview Instructions / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Candidate instructions for technical pipe isometry, welding coupons, etc."
                  value={scheduleForm.remarks}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoadingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                  <span>Confirm Schedule</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. Grade Scorecard Modal */}
      {gradeModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Record Viva Scorecard</h3>
                <p className="text-[11px] text-gray-500">{gradeModalLead.candidateName} • {gradeModalLead.trade || 'Worker'}</p>
              </div>
              <button 
                onClick={() => setGradeModalLead(null)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-5 space-y-4">
              
              {/* Verdict Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Viva Result Verdict *
                </label>
                <select
                  value={gradeForm.status}
                  onChange={(e) => setGradeForm({ ...gradeForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="SELECTED">SELECTED (Cleared for Offer Letter)</option>
                  <option value="ON_HOLD">ON HOLD (Borderline / Client Review)</option>
                  <option value="NOT_SELECTED">NOT SELECTED (Re-assignment Pool)</option>
                </select>
              </div>

              {/* 4 Score Breakdown Fields */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Practical Skill (Max 40)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={gradeForm.skillScore}
                    onChange={(e) => setGradeForm({ ...gradeForm, skillScore: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Trade Theory (Max 30)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={gradeForm.theoryScore}
                    onChange={(e) => setGradeForm({ ...gradeForm, theoryScore: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Site Safety (Max 15)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={gradeForm.safetyScore}
                    onChange={(e) => setGradeForm({ ...gradeForm, safetyScore: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Communication (Max 15)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={gradeForm.commScore}
                    onChange={(e) => setGradeForm({ ...gradeForm, commScore: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              {/* Total Score Readout */}
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-800">Calculated Total Score:</span>
                <span className="font-black text-emerald-700 text-sm font-mono">
                  {Number(gradeForm.skillScore) + Number(gradeForm.theoryScore) + Number(gradeForm.safetyScore) + Number(gradeForm.commScore)} / 100
                </span>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Delegate Assessment Remarks
                </label>
                <textarea
                  rows={2}
                  value={gradeForm.remarks}
                  onChange={(e) => setGradeForm({ ...gradeForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setGradeModalLead(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoadingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Result</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
