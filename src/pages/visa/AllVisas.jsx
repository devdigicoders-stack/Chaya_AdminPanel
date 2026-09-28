import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Plus, Download, FileText, CheckCircle2, Clock, 
  AlertCircle, XCircle, Calendar, ArrowRight, ShieldCheck, 
  Globe, Sparkles, Search, RotateCcw, MapPin, RefreshCw, 
  Loader2, Check, X, Sliders
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiUpdateVisaStatus } from '../../utils/api';

export default function AllVisas() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');

  // Update Status Modal
  const [updateModal, setUpdateModal] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('APPROVED');
  const [updateDate, setUpdateDate] = useState('');
  const [updateRemarks, setUpdateRemarks] = useState('');

  // Fetch leads
  const fetchAllVisas = async () => {
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
      console.error('Failed to load all visas', err);
      setError(err.message || 'Could not connect to recruitment server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVisas();
  }, []);

  // Open Update Status Modal
  const handleOpenUpdate = (lead) => {
    setUpdateModal(lead);
    setUpdateStatus(lead.visaDetails?.status === 'APPROVED' ? 'APPROVED' : 'APPROVED');
    if (lead.visaDetails?.expectedDate) {
      setUpdateDate(new Date(lead.visaDetails.expectedDate).toISOString().split('T')[0]);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setUpdateDate(d.toISOString().split('T')[0]);
    }
    setUpdateRemarks(lead.visaDetails?.remarks || '');
  };

  // Submit Status Update
  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!updateModal) return;

    setActionLoading(true);
    try {
      const res = await apiUpdateVisaStatus(updateModal._id, {
        status: updateStatus,
        expectedDate: updateDate,
        remarks: updateRemarks.trim() || `Status updated to ${updateStatus}`
      });

      if (res?.success) {
        Swal.fire({
          icon: updateStatus === 'APPROVED' ? 'success' : updateStatus === 'DELAYED' ? 'warning' : 'info',
          title: `Visa ${updateStatus}!`,
          html: `Status for <b>${updateModal.candidateName}</b> updated to <b>${updateStatus}</b>.<br>
                 <span class="text-xs text-gray-500 mt-1 block">
                   ${updateStatus === 'APPROVED' ? 'Candidate file marked Stamped & ready for Final Viva / Placement.' : updateStatus === 'DELAYED' ? 'File redirected to Pre-Viva Delay Review.' : 'Recorded in audit trail.'}
                 </span>`,
          confirmButtonColor: '#2563EB'
        });
        setUpdateModal(null);
        fetchAllVisas();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message || 'Could not update status.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const v = l.visaDetails || {};
      const status = v.status || 'SUBMITTED';
      const country = v.country || l.locationConfirmation?.confirmedLocation || '';

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const appNo = (v.applicationNumber || '').toLowerCase();
        const trade = (l.trade || l.applicationForm?.trade || '').toLowerCase();
        const embassy = (v.embassy || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !appNo.includes(q) && !trade.includes(q) && !embassy.includes(q)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && status !== statusFilter) {
        return false;
      }

      // Country filter
      if (countryFilter !== 'ALL' && !country.toLowerCase().includes(countryFilter.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [leads, searchTerm, statusFilter, countryFilter]);

  // Dynamic KPI Stats
  const stats = useMemo(() => {
    const total = leads.length;
    let approved = 0;
    let processing = 0;
    let submitted = 0;
    let delayed = 0;
    let rejected = 0;

    leads.forEach(l => {
      const st = l.visaDetails?.status || 'SUBMITTED';
      if (st === 'APPROVED') approved++;
      else if (st === 'PROCESSING') processing++;
      else if (st === 'DELAYED') delayed++;
      else if (st === 'REJECTED') rejected++;
      else submitted++;
    });

    return { total, approved, processing, submitted, delayed, rejected };
  }, [leads]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">07. Visa Processing</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">All Visas & Status</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Overseas Visa Registry & Status
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
            onClick={() => navigate('/visa/verification')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Check Documents"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check Documents</span>
          </button>

          <button 
            onClick={() => navigate('/visa/tracking')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Visa Tracking"
          >
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Visa Tracking</span>
          </button>

          <button
            onClick={fetchAllVisas}
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

      {/* 2. Dynamic KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Applications */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total Applications</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : stats.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Total active dossiers</div>
          </div>
        </div>

        {/* Approved & Stamped */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Approved & Stamped</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : stats.approved}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Visa stamping complete</div>
          </div>
        </div>

        {/* Embassy Processing */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">In Processing</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (stats.processing + stats.submitted)}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Under consular review</div>
          </div>
        </div>

        {/* Delayed Review */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-red-700">Delayed (Loop Back)</span>
            <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-red-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : stats.delayed}
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1">In Pre-Viva delay review</div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-gray-600">Consular Rejected</span>
            <div className="w-7 h-7 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-700 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : stats.rejected}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Consular denial</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Quick Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60">
            {[
              { key: 'ALL', label: 'All Visas', count: stats.total },
              { key: 'APPROVED', label: 'Approved & Stamped', count: stats.approved },
              { key: 'PROCESSING', label: 'In Processing', count: stats.processing + stats.submitted },
              { key: 'DELAYED', label: 'Delayed Loop', count: stats.delayed },
              { key: 'REJECTED', label: 'Rejected', count: stats.rejected }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
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

          {/* Search Box & Country Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidate, trade, passport, app #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Countries</option>
              <option value="UAE">UAE</option>
              <option value="Saudi">Saudi Arabia</option>
              <option value="Qatar">Qatar</option>
              <option value="Kuwait">Kuwait</option>
              <option value="Oman">Oman</option>
              <option value="Bahrain">Bahrain</option>
            </select>

            {(searchTerm || statusFilter !== 'ALL' || countryFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setCountryFilter('ALL');
                }}
                className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 4. Live Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Candidate & Passport</th>
                <th className="py-3.5 px-4">Destination & Trade</th>
                <th className="py-3.5 px-4">Embassy Center</th>
                <th className="py-3.5 px-4">App # & Visa Type</th>
                <th className="py-3.5 px-4">Expected Ready Date</th>
                <th className="py-3.5 px-4 text-center">Fee</th>
                <th className="py-3.5 px-4 text-center">Consular Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading visa registry records...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Globe className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>No visa records match your filter.</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const v = lead.visaDetails || {};
                  const status = v.status || 'SUBMITTED';
                  const country = v.country || lead.locationConfirmation?.confirmedLocation || 'UAE';
                  const trade = lead.trade || lead.applicationForm?.trade || 'Worker';
                  const appNo = v.applicationNumber || `VISA-${lead._id.substring(18, 22).toUpperCase()}`;
                  const expDate = v.expectedDate;

                  return (
                    <tr key={lead._id} className="hover:bg-blue-50/20 transition-colors">
                      
                      {/* 1. Candidate & Passport */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{lead.candidateName}</div>
                        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-gray-700">{lead.passportNumber || 'No Passport'}</span>
                          <span>•</span>
                          <span>{lead.leadId || lead._id.substring(18)}</span>
                        </div>
                      </td>

                      {/* 2. Destination & Trade */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">{trade}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{country}</span>
                        </div>
                      </td>

                      {/* 3. Embassy Center */}
                      <td className="py-3.5 px-4">
                        <span className="text-gray-800 font-medium">{v.embassy || `${country} Embassy, Delhi`}</span>
                      </td>

                      {/* 4. App # & Visa Type */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-600">{appNo}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{v.visaType || 'Work Permit'}</div>
                      </td>

                      {/* 5. Expected Ready Date */}
                      <td className="py-3.5 px-4">
                        {expDate ? (
                          <div className="flex items-center gap-1 font-mono font-semibold text-gray-800">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{new Date(expDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Pending</span>
                        )}
                      </td>

                      {/* 6. Fee */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-gray-700">
                        {v.fee || '₹4,500'}
                      </td>

                      {/* 7. Consular Status */}
                      <td className="py-3.5 px-4 text-center">
                        {status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Approved & Stamped</span>
                          </span>
                        )}
                        {status === 'PROCESSING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Embassy Processing</span>
                          </span>
                        )}
                        {status === 'SUBMITTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Submitted</span>
                          </span>
                        )}
                        {status === 'DELAYED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Delayed (Loop Back)</span>
                          </span>
                        )}
                        {status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            <XCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenUpdate(lead)}
                            className="h-8 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Update Consular Visa Status"
                          >
                            Update Status
                          </button>

                          <button
                            onClick={() => navigate('/visa/tracking')}
                            className="h-8 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Open Tracking Milestones"
                          >
                            Track
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

      {/* 5. Update Visa Status Modal */}
      {updateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Update Consular Visa Status</h3>
                <p className="text-[11px] text-gray-500">{updateModal.candidateName} • {updateModal.passportNumber}</p>
              </div>
              <button 
                onClick={() => setUpdateModal(null)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUpdate} className="p-5 space-y-4">
              
              {/* Select Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Consular Status Verdict *
                </label>
                <select
                  required
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="APPROVED">Approved & Stamped (Visa Issued)</option>
                  <option value="PROCESSING">Embassy Processing</option>
                  <option value="DELAYED">Delayed (Redirect to Pre-Viva Delay Review)</option>
                  <option value="REJECTED">Rejected by Embassy</option>
                </select>
              </div>

              {/* Expected / Stamped Date */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {updateStatus === 'APPROVED' ? 'Visa Stamped Date' : 'Expected Ready Date'}
                </label>
                <input
                  type="date"
                  value={updateDate}
                  onChange={(e) => setUpdateDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Consular Remarks / Decision Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Visa stamped on passport page 5, electronic entry permit verified..."
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUpdateModal(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Status</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
