import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, FileText, Download, Send, Eye, Plus, X, CheckCircle2, 
  Clock, ChevronDown, Search, RotateCcw, MapPin, Building, ArrowRight, 
  ShieldCheck, Check, Printer, Sparkles, AlertCircle, RefreshCw, 
  XCircle, Award, DollarSign, Loader2, Edit3, Plane, Globe, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiIssuePlacementOfferLetter } from '../../utils/api';

export default function OfferLetter() {
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
  const [viewOfferLead, setViewOfferLead] = useState(null);
  const [editOfferLead, setEditOfferLead] = useState(null);
  const [offerForm, setOfferForm] = useState({
    company: '',
    country: 'UAE',
    job: '',
    basicSalary: 'AED 2,200',
    allowance: 'AED 400',
    totalSalary: 'AED 2,600',
    food: 'Free Company Mess',
    accommodation: 'Company Provided',
    contractYears: '2 Years (Renewable)',
    status: 'ACCEPTED',
    notes: 'Signed bilateral employment contract on file.'
  });

  // Fetch leads
  const fetchOffers = async () => {
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
            l.placementDetails?.offerLetter?.offId || 
            l.placementDetails?.vivaResult?.status === 'SELECTED' ||
            l.currentStage === 'VIVA_PLACEMENT' ||
            l.currentStage === 'COMPLETED'
          );
          setLeads(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to load offer letters', err);
      setError(err.message || 'Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Save / Update Offer
  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!editOfferLead) return;

    setActionLoadingId(editOfferLead._id);
    try {
      const res = await apiIssuePlacementOfferLetter(editOfferLead._id, offerForm);
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Offer Updated!',
          text: `Offer Letter for ${editOfferLead.candidateName} updated to status "${offerForm.status}".`,
          confirmButtonColor: '#2563EB',
          timer: 2000
        });
        setEditOfferLead(null);
        fetchOffers();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message || 'Could not save offer.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Status Change
  const handleQuickStatusChange = async (lead, newStatus) => {
    setActionLoadingId(lead._id);
    try {
      const existing = lead.placementDetails?.offerLetter || {};
      const res = await apiIssuePlacementOfferLetter(lead._id, {
        ...existing,
        status: newStatus
      });
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: `Status: ${newStatus}`,
          text: `Offer status updated for ${lead.candidateName}.`,
          confirmButtonColor: '#2563EB',
          timer: 1500
        });
        fetchOffers();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const off = l.placementDetails?.offerLetter || {};
      const status = off.status || (l.currentStage === 'COMPLETED' ? 'ACCEPTED' : 'ACCEPTED');

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const trade = (off.job || l.trade || '').toLowerCase();
        const company = (off.company || l.placementDetails?.vivaSchedule?.company || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !trade.includes(q) && !company.includes(q)) {
          return false;
        }
      }

      if (statusFilter !== 'ALL' && status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [leads, searchTerm, statusFilter]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    let accepted = 0;
    let sent = 0;
    let draft = 0;

    leads.forEach(l => {
      const st = l.placementDetails?.offerLetter?.status;
      if (st === 'SENT') sent++;
      else if (st === 'DRAFT' || st === 'REJECTED') draft++;
      else accepted++;
    });

    return { total, accepted, sent, draft };
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
            <span className="text-gray-900 font-medium">Offer Letters</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Overseas Offer Letters & Bilateral Contracts
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => {
              if (leads.length > 0) {
                const target = leads[0];
                setEditOfferLead(target);
                setOfferForm({
                  company: target.placementDetails?.vivaSchedule?.company || 'Al Falah Group',
                  country: target.placementDetails?.vivaSchedule?.country || 'UAE',
                  job: target.trade || 'Technician',
                  basicSalary: 'AED 2,200',
                  allowance: 'AED 400',
                  totalSalary: 'AED 2,600',
                  food: 'Company Provided',
                  accommodation: 'Company Provided',
                  contractYears: '2 Years (Renewable)',
                  status: 'SENT',
                  notes: 'Official contract generated post viva clearance.'
                });
              }
            }}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            title="Generate New Offer Letter"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Offer</span>
          </button>

          <button 
            onClick={() => navigate('/placement/schedule')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Schedule Viva Date"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Schedule Viva</span>
          </button>

          <button 
            onClick={() => navigate('/placement/results')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Viva Results"
          >
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Results & Scorecards</span>
          </button>

          <button 
            onClick={() => navigate('/placement/joining')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Flight & Joining"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>Flight & Joining</span>
          </button>

          <button
            onClick={fetchOffers}
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

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Offers */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total Contracts</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Generated offers</div>
          </div>
        </div>

        {/* Accepted & Signed */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Accepted & Signed</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.accepted}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Ready for ticket booking</div>
          </div>
        </div>

        {/* Sent / Pending Sign */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Dispatched (Sent)</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.sent}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Awaiting candidate return</div>
          </div>
        </div>

        {/* Draft / In Review */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Draft / In Review</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-purple-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.draft}
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">Chamber endorsement</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Offers', count: metrics.total },
              { key: 'ACCEPTED', label: 'Accepted', count: metrics.accepted },
              { key: 'SENT', label: 'Dispatched', count: metrics.sent },
              { key: 'DRAFT', label: 'Draft', count: metrics.draft },
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
                  statusFilter === tab.key ? 'bg-blue-50 text-blue-600' : 'bg-gray-200/80 text-gray-600'
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
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
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
                <th className="py-3 px-4">Employer & Job</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Monthly Salary</th>
                <th className="py-3 px-4">Food & Housing</th>
                <th className="py-3 px-4">Contract Term</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading offer letters...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>No offer letters found matching filter.</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const off = lead.placementDetails?.offerLetter || {};
                  const company = off.company || lead.placementDetails?.vivaSchedule?.company || 'Foreign Employer';
                  const job = off.job || lead.trade || 'Technician';
                  const country = off.country || lead.placementDetails?.vivaSchedule?.country || 'UAE';
                  const salary = off.totalSalary || (off.basicSalary ? `${off.basicSalary} + ${off.allowance || ''}` : 'AED 2,200/mo');
                  const food = off.food || 'Company Provided';
                  const accommodation = off.accommodation || 'Company Provided';
                  const contractYears = off.contractYears || '2 Years (Renewable)';
                  const status = off.status || (lead.currentStage === 'COMPLETED' ? 'ACCEPTED' : 'ACCEPTED');

                  return (
                    <tr key={lead._id} className="hover:bg-blue-50/30 transition-colors">
                      
                      {/* Candidate */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{lead.candidateName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {lead.passportNumber || 'No Passport'} • {lead.phone}
                        </div>
                      </td>

                      {/* Employer & Job */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{company}</div>
                        <div className="text-[11px] text-blue-600 font-medium">{job}</div>
                      </td>

                      {/* Country */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800">{country}</span>
                      </td>

                      {/* Salary */}
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-gray-900">{salary}</span>
                        {off.basicSalary && (
                          <div className="text-[10.5px] text-gray-400">Basic: {off.basicSalary}</div>
                        )}
                      </td>

                      {/* Benefits */}
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-medium">{food}</div>
                        <div className="text-[11px] text-gray-400">{accommodation}</div>
                      </td>

                      {/* Contract */}
                      <td className="py-3 px-4 text-gray-700">
                        <span>{contractYears}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {status === 'ACCEPTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Accepted
                          </span>
                        ) : status === 'SENT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Send className="w-3 h-3 text-amber-600" />
                            Dispatched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            <Clock className="w-3 h-3 text-gray-500" />
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Book Flight shortcut */}
                          <button
                            onClick={() => navigate('/placement/joining')}
                            className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                            title="Proceed to Flight Booking & Joining"
                          >
                            <Plane className="w-3 h-3" />
                            <span>Flight</span>
                          </button>

                          {/* Quick Toggle Status */}
                          {status !== 'ACCEPTED' && (
                            <button
                              onClick={() => handleQuickStatusChange(lead, 'ACCEPTED')}
                              disabled={actionLoadingId === lead._id}
                              className="h-7 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Mark Accepted by Candidate"
                            >
                              <Check className="w-3 h-3 text-blue-600" />
                              <span>Accept</span>
                            </button>
                          )}

                          {/* Edit Offer */}
                          <button
                            onClick={() => {
                              setEditOfferLead(lead);
                              setOfferForm({
                                company: company,
                                country: country,
                                job: job,
                                basicSalary: off.basicSalary || 'AED 2,200',
                                allowance: off.allowance || 'AED 400',
                                totalSalary: off.totalSalary || 'AED 2,600',
                                food: food,
                                accommodation: accommodation,
                                contractYears: contractYears,
                                status: status,
                                notes: off.notes || ''
                              });
                            }}
                            className="h-7 px-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Offer Terms"
                          >
                            <Edit3 className="w-3 h-3 text-gray-500" />
                            <span>Edit</span>
                          </button>

                          {/* View Offer Modal */}
                          <button
                            onClick={() => setViewOfferLead(lead)}
                            className="h-7 w-7 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="View Full Offer Letter"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
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

      {/* 5. View Full Offer Letter Modal */}
      {viewOfferLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Official Bilateral Employment Contract</h3>
                  <p className="text-[11px] text-gray-500">{viewOfferLead.candidateName} • {viewOfferLead.passportNumber || 'No Passport'}</p>
                </div>
              </div>
              <button onClick={() => setViewOfferLead(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Employer:</span>
                  <span className="font-bold text-gray-900">{viewOfferLead.placementDetails?.offerLetter?.company || 'Foreign Employer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Designated Trade:</span>
                  <span className="font-bold text-blue-600">{viewOfferLead.trade || 'Technician'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Destination:</span>
                  <span className="font-bold text-gray-900">{viewOfferLead.placementDetails?.offerLetter?.country || 'UAE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Monthly Compensation:</span>
                  <span className="font-bold font-mono text-emerald-700">{viewOfferLead.placementDetails?.offerLetter?.totalSalary || 'AED 2,600'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contract Duration:</span>
                  <span className="font-bold text-gray-900">{viewOfferLead.placementDetails?.offerLetter?.contractYears || '2 Years (Renewable)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Food & Mess:</span>
                  <span className="font-bold text-gray-900">{viewOfferLead.placementDetails?.offerLetter?.food || 'Company Provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Housing / Camp:</span>
                  <span className="font-bold text-gray-900">{viewOfferLead.placementDetails?.offerLetter?.accommodation || 'Company Provided'}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="font-bold text-blue-900 block mb-1">Contract Endorsement Note:</span>
                <p className="text-gray-600 leading-relaxed">
                  {viewOfferLead.placementDetails?.offerLetter?.notes || 'Bilateral contract signed by employer and registered with the Ministry of Human Resources.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => alert('Printing official bilateral offer letter PDF with employer stamp...')}
                  className="h-9 px-3.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
                <button
                  onClick={() => setViewOfferLead(null)}
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 6. Edit Offer Terms Modal */}
      {editOfferLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Edit Offer Letter Terms</h3>
                <p className="text-[11px] text-gray-500">{editOfferLead.candidateName} • {editOfferLead.trade || 'Worker'}</p>
              </div>
              <button onClick={() => setEditOfferLead(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="p-5 space-y-4">
              
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
                    Allowance *
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
                    Food Provision
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
                    Housing / Camp
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
                  Offer Acceptance Status *
                </label>
                <select
                  value={offerForm.status}
                  onChange={(e) => setOfferForm({ ...offerForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white font-bold text-blue-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="ACCEPTED">ACCEPTED (Candidate Signed Contract)</option>
                  <option value="SENT">SENT (Dispatched for Signature)</option>
                  <option value="DRAFT">DRAFT (Under Legal Review)</option>
                  <option value="REJECTED">REJECTED (Candidate Declined)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditOfferLead(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoadingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Offer</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
