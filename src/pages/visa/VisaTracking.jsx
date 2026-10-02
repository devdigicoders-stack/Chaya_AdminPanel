import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Plane, CheckCircle2, Clock, AlertTriangle, Globe, 
  Search, RotateCcw, MapPin, Building, ArrowRight, ShieldCheck, Check, 
  Plus, Download, FileText, Sparkles, RefreshCw, XCircle, AlertCircle, 
  Eye, Calendar, Loader2, Send, History, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiUpdateVisaTracking } from '../../utils/api';

const TRACKING_STAGES = [
  { stage: 1, title: 'Dossier Lodged', subtitle: 'Consular Submission' },
  { stage: 2, title: 'Biometrics & Medical', subtitle: 'VFS / QVC / Wafid' },
  { stage: 3, title: 'Security & MOFA', subtitle: 'Contract Legalization' },
  { stage: 4, title: 'Consular Stamping', subtitle: 'Entry Permit Endorsement' },
  { stage: 5, title: 'Visa Issued', subtitle: 'Flight Readiness' },
];

export default function VisaTracking() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Modals
  const [historyModalLead, setHistoryModalLead] = useState(null);
  const [delayModalLead, setDelayModalLead] = useState(null);
  const [delayReason, setDelayReason] = useState('');

  // Fetch leads
  const fetchVisaLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetLeads({ visaDesk: 'true' });
      if (res?.success && res.data) {
        setLeads(res.data);
      } else {
        const fallback = await apiGetLeads({ stage: 'ALL' });
        if (fallback?.success && fallback.data) {
          const filtered = fallback.data.filter(l => 
            l.currentStage === 'VISA_PROCESSING' || 
            l.preVivaDetails?.status === 'CLEARED' ||
            l.visaDetails?.isDateAssigned ||
            l.visaDetails?.applicationNumber
          );
          setLeads(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to load tracking leads', err);
      setError(err.message || 'Could not connect to recruitment server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisaLeads();
  }, []);

  // Advance tracking stage
  const handleAdvanceStage = async (lead) => {
    const currentStage = lead.visaDetails?.trackingStage || 1;
    if (currentStage >= 5) {
      Swal.fire({ icon: 'info', title: 'Already at Final Stage', text: 'Visa is already stamped and issued!' });
      return;
    }

    const nextStage = currentStage + 1;
    const stageInfo = TRACKING_STAGES.find(s => s.stage === nextStage);
    const eventName = `Candidate reached Stage ${nextStage}: ${stageInfo?.title || ''}`;

    setActionLoadingId(lead._id);
    try {
      const res = await apiUpdateVisaTracking(lead._id, {
        stage: nextStage,
        event: eventName,
        remarks: `Progressed to ${stageInfo?.title} (${stageInfo?.subtitle})`
      });

      if (res?.success) {
        Swal.fire({
          icon: nextStage === 5 ? 'success' : 'info',
          title: nextStage === 5 ? 'Visa Stamped & Issued!' : `Advanced to Stage ${nextStage}`,
          text: eventName,
          confirmButtonColor: '#2563EB',
          timer: 2000
        });
        fetchVisaLeads();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message || 'Could not update tracking stage.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Submit Delay Modal
  const handleSubmitDelay = async (e) => {
    e.preventDefault();
    if (!delayModalLead) return;

    setActionLoadingId(delayModalLead._id);
    try {
      const res = await apiUpdateVisaTracking(delayModalLead._id, {
        stage: delayModalLead.visaDetails?.trackingStage || 2,
        event: `Visa Delay Reported: ${delayReason || 'Consular backlog'}`,
        remarks: delayReason.trim() || 'Delayed during embassy tracking',
        isDelayed: true
      });

      if (res?.success) {
        Swal.fire({
          icon: 'warning',
          title: 'Marked Delayed',
          text: `File for ${delayModalLead.candidateName} redirected to Pre-Viva Delay Review.`,
          confirmButtonColor: '#2563EB'
        });
        setDelayModalLead(null);
        setDelayReason('');
        fetchVisaLeads();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Delay Update Failed', text: err.message || 'Could not mark delayed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const v = l.visaDetails || {};
      const stage = v.trackingStage || 1;

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const appNo = (v.applicationNumber || '').toLowerCase();
        const trade = (l.trade || l.applicationForm?.trade || '').toLowerCase();
        const country = (v.country || l.locationConfirmation?.confirmedLocation || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !appNo.includes(q) && !trade.includes(q) && !country.includes(q)) {
          return false;
        }
      }

      // Stage filter
      if (stageFilter !== 'ALL' && stage !== Number(stageFilter)) {
        return false;
      }

      return true;
    });
  }, [leads, searchTerm, stageFilter]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    let stage5Issued = 0;
    let midStages = 0;
    let delayed = 0;

    leads.forEach(l => {
      const v = l.visaDetails || {};
      const st = v.status;
      const stage = v.trackingStage || 1;

      if (st === 'DELAYED') delayed++;
      else if (stage === 5 || st === 'APPROVED') stage5Issued++;
      else midStages++;
    });

    return { total, stage5Issued, midStages, delayed };
  }, [leads]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">08. Visa Processing</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Visa Tracking</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Consular Visa Tracking & Milestones
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => navigate('/visa/apply')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            title="Lodge New Visa Application"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply for Visa</span>
          </button>

          <button 
            onClick={() => navigate('/visa/all')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="All Visas & Status"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>All Visas & Status</span>
          </button>

          <button 
            onClick={() => navigate('/visa/verification')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Check Documents"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check Documents</span>
          </button>

          <button
            onClick={fetchVisaLeads}
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

      {/* 2. KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Tracking */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Active In Tracking</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Dossiers in pipeline</div>
          </div>
        </div>

        {/* Stage 5 Issued */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Stage 5: Visa Issued</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.stage5Issued}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Flight ready candidates</div>
          </div>
        </div>

        {/* Mid-Stages */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Mid-Stage Progress</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-purple-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.midStages}
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">Stages 1 to 4 active</div>
          </div>
        </div>

        {/* Delayed */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-red-700">Consular Delayed</span>
            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-red-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.delayed}
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1">Redirected to Pre-Viva</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Quick Stage Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            <button
              onClick={() => setStageFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                stageFilter === 'ALL' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              All Stages ({metrics.total})
            </button>
            {TRACKING_STAGES.map(s => (
              <button
                key={s.stage}
                onClick={() => setStageFilter(String(s.stage))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  stageFilter === String(s.stage) ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Stage {s.stage}: {s.title}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, trade, passport, app #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Live Candidate Tracking Cards */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200/80">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <span className="text-xs">Loading visa tracking dossiers...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200/80">
          <Plane className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <span className="text-xs">No dossiers match your filter.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const v = lead.visaDetails || {};
            const currentStage = v.trackingStage || 1;
            const isDelayed = v.status === 'DELAYED';
            const country = v.country || lead.locationConfirmation?.confirmedLocation || 'UAE';
            const trade = lead.trade || lead.applicationForm?.trade || 'Worker';
            const appNo = v.applicationNumber || `VISA-${lead._id.substring(18, 22).toUpperCase()}`;
            const isActing = actionLoadingId === lead._id;
            const history = v.trackingHistory || [];

            return (
              <div key={lead._id} className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 transition-all">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center shrink-0">
                      {lead.candidateName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-sm">{lead.candidateName}</h3>
                        {isDelayed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            Delayed (Loop Back)
                          </span>
                        ) : currentStage === 5 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Visa Issued
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Stage {currentStage} Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-gray-700">{lead.passportNumber || 'No Passport'}</span>
                        <span>•</span>
                        <span className="text-blue-600 font-bold">{appNo}</span>
                        <span>•</span>
                        <span>{trade}</span>
                        <span>•</span>
                        <span className="text-gray-700 font-medium">{country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {history.length > 0 && (
                      <button
                        onClick={() => setHistoryModalLead(lead)}
                        className="h-8 px-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Full Consular Tracking History"
                      >
                        <History className="w-3.5 h-3.5 text-gray-500" />
                        <span>Timeline ({history.length})</span>
                      </button>
                    )}

                    {!isDelayed && currentStage < 5 && (
                      <button
                        onClick={() => {
                          setDelayModalLead(lead);
                          setDelayReason('');
                        }}
                        className="h-8 px-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Mark Consular Delay"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Mark Delayed</span>
                      </button>
                    )}

                    {currentStage < 5 && (
                      <button
                        onClick={() => handleAdvanceStage(lead)}
                        disabled={isActing}
                        className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                        title="Advance candidate to next consular stage"
                      >
                        {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        <span>Advance to Stage {currentStage + 1}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 5-Stage Stepper Bar */}
                <div className="pt-5 pb-2">
                  <div className="grid grid-cols-5 gap-2 relative">
                    {TRACKING_STAGES.map((s) => {
                      const isCompleted = currentStage > s.stage;
                      const isCurrent = currentStage === s.stage;

                      return (
                        <div key={s.stage} className="flex flex-col items-center text-center">
                          
                          {/* Circle Icon */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${
                            isCompleted 
                              ? 'bg-emerald-500 text-white' 
                              : isCurrent
                              ? isDelayed 
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-blue-600 text-white ring-4 ring-blue-100'
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}>
                            {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.stage}
                          </div>

                          {/* Stage Title */}
                          <div className={`mt-2 text-xs font-bold ${
                            isCurrent ? (isDelayed ? 'text-red-600' : 'text-blue-600') : isCompleted ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {s.title}
                          </div>
                          
                          {/* Stage Subtitle */}
                          <div className="text-[10.5px] text-gray-400 hidden sm:block mt-0.5">
                            {s.subtitle}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Latest Tracking Remark */}
                {v.remarks && (
                  <div className="mt-3.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span><b>Latest Note:</b> {v.remarks}</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* 5. Tracking History Timeline Modal */}
      {historyModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Consular Tracking Timeline</h3>
                <p className="text-[11px] text-gray-500">{historyModalLead.candidateName} • {historyModalLead.passportNumber}</p>
              </div>
              <button 
                onClick={() => setHistoryModalLead(null)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-4">
              {(!historyModalLead.visaDetails?.trackingHistory || historyModalLead.visaDetails.trackingHistory.length === 0) ? (
                <div className="text-center text-gray-400 py-6 text-xs">
                  No tracking milestones logged yet.
                </div>
              ) : (
                historyModalLead.visaDetails.trackingHistory.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold font-mono">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900">{item.event}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>{new Date(item.date).toLocaleString()}</span>
                        <span>•</span>
                        <span>By {item.user || 'Visa Desk'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50 text-right">
              <button
                onClick={() => setHistoryModalLead(null)}
                className="h-8 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. Mark Delay Modal */}
      {delayModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Report Consular Delay</h3>
                <p className="text-[11px] text-gray-500">{delayModalLead.candidateName} • {delayModalLead.passportNumber}</p>
              </div>
              <button 
                onClick={() => setDelayModalLead(null)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDelay} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Consular Delay Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Saudi MOFA portal under maintenance, Biometrics re-appointment requested by embassy..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 leading-relaxed">
                ⚠️ Marking delayed will redirect this candidate file to <b>07. Pre-Viva Management &gt; Visa Date Change Requests</b> for candidate call consent.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDelayModalLead(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === delayModalLead._id}
                  className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoadingId === delayModalLead._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>Confirm Delay</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
