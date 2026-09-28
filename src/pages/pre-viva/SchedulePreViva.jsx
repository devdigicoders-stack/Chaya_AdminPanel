import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, ChevronRight, CheckCircle2, FileText, Calendar, 
  Send, ShieldCheck, ArrowRight, UserCheck, FolderInput, Sparkles, 
  Clock, Search, Filter, RefreshCw, X, Loader2, AlertCircle, 
  MapPin, Phone, User, Award, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  apiGetLeads, 
  apiGetUsers, 
  apiVerifyPreVivaDocs, 
  apiAssignPreVivaVisa 
} from '../../utils/api';

export default function SchedulePreViva() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('ALL');
  const [docFilter, setDocFilter] = useState('ALL');

  // Modal State
  const [assignModal, setAssignModal] = useState(null);
  const [selectedVisaManagerId, setSelectedVisaManagerId] = useState('');
  const [selectedVisaManagerName, setSelectedVisaManagerName] = useState('');
  const [vivaDate, setVivaDate] = useState('');
  const [dispatchToVisa, setDispatchToVisa] = useState(true);
  const [assignRemarks, setAssignRemarks] = useState('');

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [leadsRes, usersRes] = await Promise.allSettled([
        apiGetLeads({ preVisaDesk: 'true' }),
        apiGetUsers()
      ]);

      if (leadsRes.status === 'fulfilled' && leadsRes.value?.success) {
        setLeads(leadsRes.value.data || []);
      } else {
        // Fallback to fetch all leads and filter client side
        const fallbackRes = await apiGetLeads({ stage: 'ALL' });
        if (fallbackRes?.success && fallbackRes.data) {
          const filtered = fallbackRes.data.filter(l => 
            l.currentStage === 'PRE_VISA' || 
            l.currentStage === 'VISA_PROCESSING' || 
            l.fileType === 'MOVE_FILE' || 
            l.fileType === 'DIRECT_FILE' ||
            l.locationConfirmation?.isConfirmed ||
            l.preVivaDetails?.documentsVerified
          );
          setLeads(filtered);
        }
      }

      if (usersRes.status === 'fulfilled' && usersRes.value?.success) {
        setUsers(usersRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load Pre-Viva files', err);
      setError(err.message || 'Failed to connect to recruitment server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter available visa managers
  const visaManagersList = useMemo(() => {
    const list = users.filter(u => 
      u.role === 'VISA_MANAGER' || 
      u.role === 'PRE_VISA_MANAGER' || 
      u.role === 'ADMIN' ||
      u.department?.toLowerCase().includes('visa')
    );
    if (list.length > 0) return list;
    return users.filter(u => u.isActive !== false);
  }, [users]);

  // Document Verification Action
  const handleVerifyDocs = async (lead) => {
    const confirm = await Swal.fire({
      title: 'Verify Candidate Documents?',
      html: `Confirm verification for <b>${lead.candidateName}</b>?<br>
             <div class="mt-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs text-blue-900">
               ✓ Passport Validity & Biometrics<br>
               ✓ Trade Skill Benchmark Certification<br>
               ✓ GAMCA Medical Clearance Slip<br>
               ✓ Police Clearance Certificate (PCC)
             </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Mark Verified'
    });

    if (!confirm.isConfirmed) return;

    setActionLoading(true);
    try {
      const res = await apiVerifyPreVivaDocs(lead._id, {
        remarks: 'Candidate passport and technical certificates verified by Pre-Viva Desk.'
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Documents Verified!',
          text: `File for ${lead.candidateName} is now ready for Visa Allocation.`,
          timer: 2000,
          showConfirmButton: false
        });
        loadData();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: err.message || 'Could not verify documents.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Assign Visa Modal
  const handleOpenAssign = (lead) => {
    setAssignModal(lead);
    const defaultManager = visaManagersList[0];
    setSelectedVisaManagerId(defaultManager?._id || '');
    setSelectedVisaManagerName(defaultManager?.name || 'Farooq Al-Marzouqi');
    
    // Default to existing date if available, or 7 days from now
    if (lead.visaDetails?.visaDate) {
      setVivaDate(new Date(lead.visaDetails.visaDate).toISOString().split('T')[0]);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setVivaDate(d.toISOString().split('T')[0]);
    }
    setDispatchToVisa(true);
    setAssignRemarks('');
  };

  // Submit Assign Visa Form
  const handleSubmitAssign = async (e) => {
    e.preventDefault();
    if (!assignModal || !vivaDate) return;

    setActionLoading(true);
    try {
      const res = await apiAssignPreVivaVisa(assignModal._id, {
        vivaDate,
        visaManagerId: selectedVisaManagerId || null,
        visaManagerName: selectedVisaManagerName || 'Visa Officer',
        dispatchToVisa,
        remarks: assignRemarks.trim() || `Assigned to ${selectedVisaManagerName} with Viva Examination Date: ${vivaDate}`
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'File Assigned Successfully!',
          html: `File for <b>${assignModal.candidateName}</b> assigned to <b>${selectedVisaManagerName}</b>.<br>
                 <span class="text-xs text-gray-500 mt-1 block">Viva Date scheduled for ${vivaDate}.</span>`,
          confirmButtonColor: '#2563EB'
        });
        setAssignModal(null);
        loadData();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: err.message || 'Could not assign file.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const id = (l.leadId || '').toLowerCase();
        const trade = (l.trade || l.applicationForm?.trade || '').toLowerCase();
        const phone = (l.phone || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !id.includes(q) && !trade.includes(q) && !phone.includes(q)) {
          return false;
        }
      }

      // File Type Stream
      if (fileTypeFilter !== 'ALL') {
        const isMove = l.fileType === 'MOVE_FILE' || l.locationConfirmation?.isConfirmed;
        const isDirect = l.fileType === 'DIRECT_FILE' || (!isMove && l.medicalDetails?.status === 'FIT');
        if (fileTypeFilter === 'MOVE_FILE' && !isMove) return false;
        if (fileTypeFilter === 'DIRECT_FILE' && !isDirect) return false;
      }

      // Doc Verification Status
      if (docFilter !== 'ALL') {
        const isVerified = l.preVivaDetails?.documentsVerified;
        if (docFilter === 'VERIFIED' && !isVerified) return false;
        if (docFilter === 'PENDING' && isVerified) return false;
      }

      return true;
    });
  }, [leads, searchTerm, fileTypeFilter, docFilter]);

  // Computed Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const verified = leads.filter(l => l.preVivaDetails?.documentsVerified).length;
    const pendingDoc = total - verified;
    const assignedVisa = leads.filter(l => l.visaDetails?.isDateAssigned || l.currentStage === 'VISA_PROCESSING').length;
    return { total, verified, pendingDoc, assignedVisa };
  }, [leads]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">06. Pre-Viva Management</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Check Files & Send to Visa</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Check Files & Send to Visa
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/pre-viva/all')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="View All Pre-Viva Files"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>All Pre-Viva Files</span>
          </button>

          <button
            onClick={() => navigate('/pre-viva/delay-confirmations')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Review Visa Date Change Requests"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Date Change Requests</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Inward Queue"
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
        
        {/* Total Inward Files */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Total Inward Files</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderInput className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Move & Direct candidate files</div>
          </div>
        </div>

        {/* Verified Docs */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Verified Documents</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.verified}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Dossier check cleared</div>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Pending Doc Check</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.pendingDoc}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Awaiting verification</div>
          </div>
        </div>

        {/* Assigned to Visa */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-purple-700">Assigned / Dispatched</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-purple-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.assignedVisa}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1">Dispatched to Visa Processing</div>
          </div>
        </div>

      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by candidate, passport, trade, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50/50 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Stream Filter */}
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Inward Streams</option>
              <option value="MOVE_FILE">Move Files (Calling Staff)</option>
              <option value="DIRECT_FILE">Direct Files (Medical)</option>
            </select>

            {/* Doc Verification Status */}
            <select
              value={docFilter}
              onChange={(e) => setDocFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Doc Statuses</option>
              <option value="VERIFIED">Verified Documents</option>
              <option value="PENDING">Pending Check</option>
            </select>

            {(searchTerm || fileTypeFilter !== 'ALL' || docFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFileTypeFilter('ALL');
                  setDocFilter('ALL');
                }}
                className="px-2.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Reset
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
                <th className="py-3.5 px-4">File Source Stream</th>
                <th className="py-3.5 px-4">Trade & Location</th>
                <th className="py-3.5 px-4 text-center">Docs Verified</th>
                <th className="py-3.5 px-4">Assigned Visa Manager</th>
                <th className="py-3.5 px-4">Viva Exam Date</th>
                <th className="py-3.5 px-4 text-center">Stage Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Loading Pre-Viva inward records...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <FolderInput className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <span>No inward candidate files match the selected filter.</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isMove = lead.fileType === 'MOVE_FILE' || lead.locationConfirmation?.isConfirmed;
                  const docsOk = lead.preVivaDetails?.documentsVerified;
                  const vDate = lead.preVivaDetails?.vivaDate || lead.visaDetails?.visaDate;
                  const vManager = lead.preVivaDetails?.visaManagerName || lead.assignedVisaManager?.name || 'Unassigned';

                  return (
                    <tr key={lead._id} className="hover:bg-blue-50/20 transition-colors">
                      
                      {/* Candidate & Passport */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{lead.candidateName}</div>
                        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-gray-700">{lead.passportNumber || 'No Passport'}</span>
                          <span>•</span>
                          <span>{lead.leadId || lead._id.substring(18)}</span>
                        </div>
                      </td>

                      {/* File Source Stream */}
                      <td className="py-3.5 px-4">
                        {isMove ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Move File (Calling)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Direct File (Medical)
                          </span>
                        )}
                      </td>

                      {/* Trade & Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">{lead.trade || lead.applicationForm?.trade || 'General Worker'}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{lead.locationConfirmation?.confirmedLocation || lead.applicationForm?.preferredCountries?.[0] || 'Gulf Destination'}</span>
                        </div>
                      </td>

                      {/* Docs Verified */}
                      <td className="py-3.5 px-4 text-center">
                        {docsOk ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Check
                          </span>
                        )}
                      </td>

                      {/* Assigned Visa Manager */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-800">
                          {vManager !== 'Unassigned' ? (
                            <span className="text-gray-900 font-semibold">{vManager}</span>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </span>
                      </td>

                      {/* Viva Exam Date */}
                      <td className="py-3.5 px-4">
                        {vDate ? (
                          <span className="font-mono font-bold text-gray-900">
                            {new Date(vDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium text-[11px]">Not Scheduled</span>
                        )}
                      </td>

                      {/* Stage Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          lead.currentStage === 'VISA_PROCESSING'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : docsOk
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {lead.currentStage === 'VISA_PROCESSING' ? 'Visa Processing' : docsOk ? 'Ready for Visa' : 'Inward Review'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!docsOk ? (
                            <button
                              onClick={() => handleVerifyDocs(lead)}
                              disabled={actionLoading}
                              className="h-8 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Verify passport and certifications"
                            >
                              Verify Docs
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenAssign(lead)}
                              disabled={actionLoading}
                              className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer active:scale-[0.98] shadow-xs"
                              title="Assign Visa Manager and Set Viva Date"
                            >
                              <Send className="w-3 h-3" />
                              <span>{vDate ? 'Edit Visa & Date' : 'Assign Visa & Date'}</span>
                            </button>
                          )}
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

      {/* 5. Assign Visa Manager & Viva Date Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/60">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Assign Visa Manager & Set Viva Date</h3>
                <p className="text-[11px] text-gray-500">Step 15: Pre-Viva file dispatch to Visa Management</p>
              </div>
              <button 
                onClick={() => setAssignModal(null)} 
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssign} className="p-5 space-y-4">
              
              {/* Candidate Info Box */}
              <div className="bg-gray-50 p-3 rounded-xl text-xs border border-gray-200/70">
                <div className="font-bold text-gray-900">{assignModal.candidateName} • {assignModal.trade || assignModal.applicationForm?.trade || 'Worker'}</div>
                <div className="text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                  <span>Passport: <b>{assignModal.passportNumber || 'N/A'}</b></span>
                  <span>•</span>
                  <span>Target: <b>{assignModal.locationConfirmation?.confirmedLocation || 'Gulf'}</b></span>
                </div>
              </div>

              {/* Select Visa Manager */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Visa Processing Officer *
                </label>
                <select
                  required
                  value={selectedVisaManagerId}
                  onChange={(e) => {
                    setSelectedVisaManagerId(e.target.value);
                    const found = visaManagersList.find(u => u._id === e.target.value);
                    if (found) setSelectedVisaManagerName(found.name);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-white"
                >
                  {visaManagersList.map((vm) => (
                    <option key={vm._id} value={vm._id}>
                      {vm.name} ({vm.role?.replace(/_/g, ' ') || 'Visa Desk'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Viva Date */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Set Viva Examination Date *
                </label>
                <input
                  type="date"
                  required
                  value={vivaDate}
                  onChange={(e) => setVivaDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Dispatch Immediately Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer bg-gray-50/50 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={dispatchToVisa}
                  onChange={(e) => setDispatchToVisa(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <div>
                  <div className="font-semibold text-xs text-gray-900">Transfer directly to Step 07: Visa Processing</div>
                  <div className="text-[11px] text-gray-500">Candidate file will immediately move to Visa officer desk.</div>
                </div>
              </label>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Instructions / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified biometric slips, express visa submission approved..."
                  value={assignRemarks}
                  onChange={(e) => setAssignRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Assign & Confirm</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
