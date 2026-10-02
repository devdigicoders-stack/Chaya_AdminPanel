import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, CheckCircle2, XCircle, Clock, Star, Filter, Download, 
  Eye, ChevronDown, Search, RotateCcw, MapPin, Building, ArrowRight, 
  ShieldCheck, Check, Plus, FileText, Globe, Sparkles, Award, 
  RefreshCw, AlertCircle, FileCheck, Loader2, Edit3, X, DollarSign, Calendar, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiSubmitPlacementVivaResult, apiIssuePlacementOfferLetter } from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function VivaResults() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [historyCandidate, setHistoryCandidate] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');

  // Scorecard View Modal
  const [viewLead, setViewLead] = useState(null);

  // Edit / Re-grade Modal
  const [editLead, setEditLead] = useState(null);
  const [editForm, setEditForm] = useState({
    status: 'SELECTED',
    skillScore: 35,
    theoryScore: 25,
    safetyScore: 13,
    commScore: 12,
    remarks: ''
  });

  // Issue Quick Offer Modal
  const [offerLead, setOfferLead] = useState(null);
  const [offerForm, setOfferForm] = useState({
    company: '',
    country: 'UAE',
    job: '',
    basicSalary: 'AED 2,000',
    allowance: 'AED 400',
    totalSalary: 'AED 2,400',
    food: 'Company Provided',
    accommodation: 'Company Provided',
    contractYears: '2 Years (Renewable)',
    status: 'SENT',
    notes: 'Official client offer issued post-viva clearance.'
  });

  // Fetch leads
  const fetchVivaLeads = async () => {
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
            l.placementDetails?.vivaResult?.resId || 
            l.placementDetails?.vivaSchedule?.vivaId ||
            l.currentStage === 'VIVA_PLACEMENT' ||
            l.currentStage === 'COMPLETED'
          );
          setLeads(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to load viva results', err);
      setError(err.message || 'Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVivaLeads();
  }, []);

  // Save Scorecard Edit
  const handleSaveScorecard = async (e) => {
    e.preventDefault();
    if (!editLead) return;

    setActionLoadingId(editLead._id);
    try {
      const totalScore = Number(editForm.skillScore) + Number(editForm.theoryScore) + Number(editForm.safetyScore) + Number(editForm.commScore);
      const res = await apiSubmitPlacementVivaResult(editLead._id, {
        score: totalScore,
        breakdown: {
          skill: Number(editForm.skillScore),
          theory: Number(editForm.theoryScore),
          safety: Number(editForm.safetyScore),
          comm: Number(editForm.commScore)
        },
        status: editForm.status,
        remarks: editForm.remarks
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Scorecard Updated!',
          text: `Scorecard for ${editLead.candidateName} updated to ${totalScore}% (${editForm.status}).`,
          confirmButtonColor: '#7C3AED',
          timer: 2000
        });
        setEditLead(null);
        fetchVivaLeads();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message || 'Could not update scorecard.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Issue Offer Letter
  const handleIssueOffer = async (e) => {
    e.preventDefault();
    if (!offerLead) return;

    setActionLoadingId(offerLead._id);
    try {
      const res = await apiIssuePlacementOfferLetter(offerLead._id, offerForm);
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Offer Letter Dispatched!',
          text: `Offer issued to ${offerLead.candidateName} for ${offerForm.company || 'Foreign Employer'}.`,
          confirmButtonColor: '#2563EB',
          timer: 2000
        });
        setOfferLead(null);
        fetchVivaLeads();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Offer Dispatch Failed', text: err.message || 'Could not issue offer.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const resObj = l.placementDetails?.vivaResult || {};
      const status = resObj.status || (l.currentStage === 'COMPLETED' ? 'SELECTED' : 'SELECTED');

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const trade = (l.trade || l.applicationForm?.trade || '').toLowerCase();
        const company = (l.placementDetails?.vivaSchedule?.company || l.placementDetails?.offerLetter?.company || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !trade.includes(q) && !company.includes(q)) {
          return false;
        }
      }

      // Status filter
      if (resultFilter !== 'ALL' && status !== resultFilter) {
        return false;
      }

      return true;
    });
  }, [leads, searchTerm, resultFilter]);

  // Dynamic KPI Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    let selected = 0;
    let onHold = 0;
    let notSelected = 0;

    leads.forEach(l => {
      const st = l.placementDetails?.vivaResult?.status;
      if (st === 'ON_HOLD') onHold++;
      else if (st === 'NOT_SELECTED') notSelected++;
      else selected++;
    });

    return { total, selected, onHold, notSelected };
  }, [leads]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">09. Viva & Placement</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Viva Results & Scorecards</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Viva Results & Technical Scorecards
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => navigate('/placement/schedule')}
            className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            title="Schedule Viva Date"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Viva</span>
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
            onClick={fetchVivaLeads}
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

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Assessed */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total Evaluated</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Viva candidates</div>
          </div>
        </div>

        {/* Selected Candidates */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Selected & Ready</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.selected}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Ready for contract</div>
          </div>
        </div>

        {/* On Hold */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">On Hold</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.onHold}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Borderline quota</div>
          </div>
        </div>

        {/* Not Selected */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-red-700">Not Selected</span>
            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-red-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.notSelected}
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1">Re-assignment pool</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Results', count: metrics.total },
              { key: 'SELECTED', label: 'Selected', count: metrics.selected },
              { key: 'ON_HOLD', label: 'On Hold', count: metrics.onHold },
              { key: 'NOT_SELECTED', label: 'Not Selected', count: metrics.notSelected },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setResultFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  resultFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  resultFilter === tab.key ? 'bg-purple-50 text-purple-600' : 'bg-gray-200/80 text-gray-600'
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
              placeholder="Search candidate, trade, company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Live Scorecards Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Employer & Trade</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4 text-center">Total Score</th>
                <th className="py-3 px-4">Breakdown (Skill/Thy/Sft/Com)</th>
                <th className="py-3 px-4">Delegate / Evaluator</th>
                <th className="py-3 px-4 text-center">Verdict</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    <span>Loading viva scorecards...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>No viva results found matching filter.</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const resObj = lead.placementDetails?.vivaResult || {};
                  const schedule = lead.placementDetails?.vivaSchedule || {};
                  const totalScore = resObj.score !== undefined && resObj.score !== null ? resObj.score : 85;
                  const breakdown = resObj.breakdown || { skill: 35, theory: 25, safety: 13, comm: 12 };
                  const company = schedule.company || lead.placementDetails?.offerLetter?.company || 'Foreign Employer';
                  const trade = lead.trade || lead.applicationForm?.trade || 'Technician';
                  const country = schedule.country || lead.visaDetails?.country || 'UAE';
                  const status = resObj.status || (lead.currentStage === 'COMPLETED' ? 'SELECTED' : 'SELECTED');
                  const evaluator = resObj.evaluatedBy || schedule.panel || 'Client Delegate';

                  // Score badge coloring
                  const scoreBadgeClass = totalScore >= 80 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : totalScore >= 60 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-red-50 text-red-700 border-red-200';

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

                      {/* Total Score */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${scoreBadgeClass}`}>
                          {totalScore}%
                        </span>
                      </td>

                      {/* Breakdown */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold" title="Practical Skill">
                            Sk:{breakdown.skill}
                          </span>
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded font-semibold" title="Trade Theory">
                            Th:{breakdown.theory}
                          </span>
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold" title="Site Safety">
                            Sf:{breakdown.safety}
                          </span>
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-semibold" title="Communication">
                            Cm:{breakdown.comm}
                          </span>
                        </div>
                      </td>

                      {/* Delegate */}
                      <td className="py-3 px-4">
                        <span className="text-gray-900 font-medium truncate max-w-[130px] block">
                          {evaluator}
                        </span>
                      </td>

                      {/* Verdict Status */}
                      <td className="py-3 px-4 text-center">
                        {status === 'SELECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Selected
                          </span>
                        ) : status === 'ON_HOLD' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            On Hold
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <X className="w-3 h-3 text-red-600" />
                            Not Selected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Issue Offer Letter Button */}
                          <button
                            onClick={() => {
                              setOfferLead(lead);
                              setOfferForm({
                                company: company,
                                country: country,
                                job: trade,
                                basicSalary: 'AED 2,200',
                                allowance: 'AED 400',
                                totalSalary: 'AED 2,600',
                                food: 'Company Provided',
                                accommodation: 'Company Provided',
                                contractYears: '2 Years (Renewable)',
                                status: 'SENT',
                                notes: 'Signed offer letter prepared post-viva clearance.'
                              });
                            }}
                            className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                            title="Issue Official Foreign Offer Letter"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Offer</span>
                          </button>

                          {/* Re-grade / Edit Button */}
                          <button
                            onClick={() => {
                              setEditLead(lead);
                              setEditForm({
                                status: status,
                                skillScore: breakdown.skill,
                                theoryScore: breakdown.theory,
                                safetyScore: breakdown.safety,
                                commScore: breakdown.comm,
                                remarks: resObj.remarks || 'Cleared evaluation'
                              });
                            }}
                            className="h-7 px-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Scorecard / Remarks"
                          >
                            <Edit3 className="w-3 h-3 text-gray-500" />
                            <span>Edit</span>
                          </button>

                          {/* View Scorecard */}
                          <button
                            onClick={() => setViewLead(lead)}
                            className="h-7 w-7 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="View Detailed Scorecard"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </button>

                          {/* View Lifecycle Audit History */}
                          <button
                            onClick={() => setHistoryCandidate(lead)}
                            className="h-7 w-7 border border-indigo-200 hover:bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="View Full Candidate Audit History"
                          >
                            <History className="w-3.5 h-3.5" />
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

      {/* 5. Scorecard View Modal */}
      {viewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Official Technical Scorecard</h3>
                  <p className="text-[11px] text-gray-500">{viewLead.candidateName} • {viewLead.passportNumber || 'No Passport'}</p>
                </div>
              </div>
              <button onClick={() => setViewLead(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                <div>
                  <div className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">Final Verdict</div>
                  <div className="text-base font-black text-gray-900">
                    {viewLead.placementDetails?.vivaResult?.status || 'SELECTED'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">Overall Score</div>
                  <div className="text-2xl font-black text-purple-600 font-mono">
                    {viewLead.placementDetails?.vivaResult?.score || 85}%
                  </div>
                </div>
              </div>

              {/* 4 Score Breakdown Bars */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>Practical Trade Skills (Max 40)</span>
                  <span className="font-mono font-bold text-blue-600">{viewLead.placementDetails?.vivaResult?.breakdown?.skill || 35}/40</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${((viewLead.placementDetails?.vivaResult?.breakdown?.skill || 35) / 40) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-gray-700 pt-1">
                  <span>Trade Theory & Drawings (Max 30)</span>
                  <span className="font-mono font-bold text-purple-600">{viewLead.placementDetails?.vivaResult?.breakdown?.theory || 25}/30</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${((viewLead.placementDetails?.vivaResult?.breakdown?.theory || 25) / 30) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-gray-700 pt-1">
                  <span>GCC Site Safety Compliance (Max 15)</span>
                  <span className="font-mono font-bold text-emerald-600">{viewLead.placementDetails?.vivaResult?.breakdown?.safety || 13}/15</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${((viewLead.placementDetails?.vivaResult?.breakdown?.safety || 13) / 15) * 100}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-gray-700 pt-1">
                  <span>Communication & Site English (Max 15)</span>
                  <span className="font-mono font-bold text-amber-600">{viewLead.placementDetails?.vivaResult?.breakdown?.comm || 12}/15</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${((viewLead.placementDetails?.vivaResult?.breakdown?.comm || 12) / 15) * 100}%` }} />
                </div>
              </div>

              {/* Assessment Remarks */}
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs">
                <span className="font-bold text-purple-900 block mb-1">Delegate Assessment Notes:</span>
                <p className="text-gray-600 leading-relaxed">
                  {viewLead.placementDetails?.vivaResult?.remarks || 'Candidate demonstrated strong practical aptitude. Cleared for offer letter issuance.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setViewLead(null)}
                  className="w-full h-9 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close Scorecard
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 6. Edit Scorecard Modal */}
      {editLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Edit Candidate Scorecard</h3>
                <p className="text-[11px] text-gray-500">{editLead.candidateName} • {editLead.trade || 'Worker'}</p>
              </div>
              <button onClick={() => setEditLead(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScorecard} className="p-5 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Result Status *
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="SELECTED">SELECTED (Passed & Cleared)</option>
                  <option value="ON_HOLD">ON HOLD (Borderline)</option>
                  <option value="NOT_SELECTED">NOT SELECTED (Failed)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Skill (Max 40)</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={editForm.skillScore}
                    onChange={(e) => setEditForm({ ...editForm, skillScore: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Theory (Max 30)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={editForm.theoryScore}
                    onChange={(e) => setEditForm({ ...editForm, theoryScore: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Safety (Max 15)</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={editForm.safetyScore}
                    onChange={(e) => setEditForm({ ...editForm, safetyScore: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Comm (Max 15)</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={editForm.commScore}
                    onChange={(e) => setEditForm({ ...editForm, commScore: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-800">New Total Score:</span>
                <span className="font-black text-emerald-700 text-sm font-mono">
                  {Number(editForm.skillScore) + Number(editForm.theoryScore) + Number(editForm.safetyScore) + Number(editForm.commScore)} / 100
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditLead(null)}
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
                  <span>Save Changes</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 7. Quick Issue Offer Letter Modal */}
      {offerLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Issue Foreign Offer Letter</h3>
                  <p className="text-[11px] text-gray-500">{offerLead.candidateName} • {offerLead.passportNumber || 'No Passport'}</p>
                </div>
              </div>
              <button onClick={() => setOfferLead(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueOffer} className="p-5 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Hiring Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={offerForm.company}
                    onChange={(e) => setOfferForm({ ...offerForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Destination Country *
                  </label>
                  <select
                    value={offerForm.country}
                    onChange={(e) => setOfferForm({ ...offerForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500"
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Basic Salary *
                  </label>
                  <input
                    type="text"
                    required
                    value={offerForm.basicSalary}
                    onChange={(e) => setOfferForm({ ...offerForm, basicSalary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Allowances *
                  </label>
                  <input
                    type="text"
                    required
                    value={offerForm.allowance}
                    onChange={(e) => setOfferForm({ ...offerForm, allowance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Total Salary *
                  </label>
                  <input
                    type="text"
                    required
                    value={offerForm.totalSalary}
                    onChange={(e) => setOfferForm({ ...offerForm, totalSalary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Food Provision *
                  </label>
                  <input
                    type="text"
                    value={offerForm.food}
                    onChange={(e) => setOfferForm({ ...offerForm, food: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Accommodation *
                  </label>
                  <input
                    type="text"
                    value={offerForm.accommodation}
                    onChange={(e) => setOfferForm({ ...offerForm, accommodation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Offer Status
                </label>
                <select
                  value={offerForm.status}
                  onChange={(e) => setOfferForm({ ...offerForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="SENT">SENT (Dispatched to Candidate)</option>
                  <option value="ACCEPTED">ACCEPTED (Candidate Signed)</option>
                  <option value="DRAFT">DRAFT (Under Review)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setOfferLead(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoadingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>Dispatch Offer</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. Candidate Full Lifecycle Audit Trail Modal */}
      <LeadHistoryModal
        isOpen={!!historyCandidate}
        onClose={() => setHistoryCandidate(null)}
        candidate={historyCandidate}
      />

    </div>
  );
}
