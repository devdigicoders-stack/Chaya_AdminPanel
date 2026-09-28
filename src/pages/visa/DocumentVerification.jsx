import { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight, FileCheck, CheckCircle2, AlertCircle, X,
  Clock, Search, ArrowRight,
  Check, Plus, Globe, RefreshCw,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiVerifyVisaDocuments } from '../../utils/api';

const DEFAULT_DOC_TYPES = [
  { docKey: 'passport', name: 'Original International Passport', fileName: 'PASSPORT_SCAN.pdf', mandatory: true },
  { docKey: 'gamca', name: 'GAMCA Medical FIT Report', fileName: 'GAMCA_FIT_BARCODE.pdf', mandatory: true },
  { docKey: 'pcc', name: 'Police Clearance Certificate (PCC)', fileName: 'PCC_MEA_ATTESTED.pdf', mandatory: true },
  { docKey: 'tradeTest', name: 'Trade Skill Test Certification', fileName: 'TRADE_TEST_CERT.pdf', mandatory: true },
  { docKey: 'demandLetter', name: 'Employer Demand Letter & Wakala', fileName: 'GCC_DEMAND_LETTER.pdf', mandatory: true },
  { docKey: 'photos', name: 'GCC White Background Photos (6)', fileName: 'STUDIO_PORTRAIT.jpg', mandatory: false },
];

export default function DocumentVerification() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
      console.error('Failed to load candidates for doc verification', err);
      setError(err.message || 'Could not connect to recruitment server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisaLeads();
  }, []);

  // Helper: Get Candidate Docs (merges saved DB verifiedDocuments with DEFAULT_DOC_TYPES)
  const getCandidateDocs = (lead) => {
    const saved = lead.visaDetails?.verifiedDocuments || [];
    return DEFAULT_DOC_TYPES.map(def => {
      const found = saved.find(s => s.docKey === def.docKey);
      if (found) {
        return found;
      }
      // If candidate has passport number, default passport to VERIFIED
      if (def.docKey === 'passport' && lead.passportNumber) {
        return { ...def, status: 'VERIFIED', fileName: `PASSPORT_${lead.passportNumber}.pdf`, verifiedBy: 'System Auto' };
      }
      // If candidate has GAMCA FIT, default gamca to VERIFIED
      if (def.docKey === 'gamca' && (lead.medicalDetails?.status === 'FIT' || lead.medicalFit)) {
        return { ...def, status: 'VERIFIED', fileName: 'GAMCA_FIT_BARCODE.pdf', verifiedBy: 'Medical Desk' };
      }
      // If candidate cleared Pre-Viva, trade test is VERIFIED
      if (def.docKey === 'tradeTest' && lead.preVivaDetails?.status === 'CLEARED') {
        return { ...def, status: 'VERIFIED', fileName: 'PRE_VIVA_CLEARANCE.pdf', verifiedBy: 'Technical Desk' };
      }
      return { ...def, status: 'PENDING', verifiedBy: '-' };
    });
  };

  // Helper: Check if all mandatory docs are verified
  const isCandidateFullyVerified = (lead) => {
    const docs = getCandidateDocs(lead);
    return docs.every(d => !d.mandatory || d.status === 'VERIFIED');
  };

  // Toggle single document status
  const handleToggleDoc = async (lead, docKey) => {
    const currentDocs = getCandidateDocs(lead);
    const updatedDocs = currentDocs.map(d => {
      if (d.docKey === docKey) {
        const nextStatus = d.status === 'VERIFIED' ? 'MISSING' : 'VERIFIED';
        return {
          ...d,
          status: nextStatus,
          verifiedBy: nextStatus === 'VERIFIED' ? 'Visa Officer' : '-',
          verifiedAt: nextStatus === 'VERIFIED' ? new Date().toISOString() : null
        };
      }
      return d;
    });

    setActionLoadingId(lead._id);
    try {
      const res = await apiVerifyVisaDocuments(lead._id, { verifiedDocuments: updatedDocs });
      if (res?.success) {
        // Update local state
        setLeads(leads.map(l => l._id === lead._id ? {
          ...l,
          visaDetails: { ...(l.visaDetails || {}), verifiedDocuments: updatedDocs }
        } : l));
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message || 'Could not toggle document.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Verify all documents for a candidate at once
  const handleVerifyAll = async (lead) => {
    const currentDocs = getCandidateDocs(lead);
    const updatedDocs = currentDocs.map(d => ({
      ...d,
      status: 'VERIFIED',
      verifiedBy: 'Visa Officer (Batch)',
      verifiedAt: new Date().toISOString()
    }));

    setActionLoadingId(lead._id);
    try {
      const res = await apiVerifyVisaDocuments(lead._id, { verifiedDocuments: updatedDocs });
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'All Documents Verified!',
          text: `Dossier for ${lead.candidateName} is 100% verified and ready for consular submission.`,
          confirmButtonColor: '#2563EB',
          timer: 2000
        });
        setLeads(leads.map(l => l._id === lead._id ? {
          ...l,
          visaDetails: { ...(l.visaDetails || {}), verifiedDocuments: updatedDocs }
        } : l));
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Verification Failed', text: err.message || 'Could not verify all docs.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const fullyVerified = isCandidateFullyVerified(l);

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const trade = (l.trade || l.applicationForm?.trade || '').toLowerCase();
        const country = (l.locationConfirmation?.confirmedLocation || '').toLowerCase();
        if (!name.includes(q) && !passport.includes(q) && !trade.includes(q) && !country.includes(q)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'VERIFIED' && !fullyVerified) return false;
      if (statusFilter === 'PENDING' && fullyVerified) return false;

      return true;
    });
  }, [leads, searchTerm, statusFilter]);

  // Dynamic KPI Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    let fullyVerifiedCount = 0;
    let pendingCount = 0;

    leads.forEach(l => {
      if (isCandidateFullyVerified(l)) fullyVerifiedCount++;
      else pendingCount++;
    });

    return { total, fullyVerifiedCount, pendingCount };
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
            <span className="text-gray-900 font-medium">Check Documents</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Check Visa Documents & Consular Dossier
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => navigate('/visa/apply')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            title="Lodge Visa Application"
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
            onClick={() => navigate('/visa/tracking')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Visa Tracking"
          >
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Visa Tracking</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Candidates */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Candidates In Verification</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Dossiers awaiting verification</div>
          </div>
        </div>

        {/* 100% Verified Ready */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">100% Verified Ready</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.fullyVerifiedCount}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Ready for consular submission</div>
          </div>
        </div>

        {/* Pending Documents */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">Pending Checks</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.pendingCount}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Awaiting doc checks / attestation</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Quick Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60">
            {[
              { key: 'ALL', label: 'All Dossiers', count: metrics.total },
              { key: 'VERIFIED', label: 'Verified Ready', count: metrics.fullyVerifiedCount },
              { key: 'PENDING', label: 'Pending Checks', count: metrics.pendingCount },
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

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, trade, passport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Candidate Document Dossier Cards */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200/80">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <span className="text-xs">Loading candidate document dossiers...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200/80">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <span className="text-xs">No candidate dossiers match your filter.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const docs = getCandidateDocs(lead);
            const fullyVerified = isCandidateFullyVerified(lead);
            const country = lead.visaDetails?.country || lead.locationConfirmation?.confirmedLocation || 'UAE';
            const trade = lead.trade || lead.applicationForm?.trade || 'Worker';
            const isActing = actionLoadingId === lead._id;

            return (
              <div key={lead._id} className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 sm:p-5 transition-all">
                
                {/* Dossier Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0">
                      {lead.candidateName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-sm">{lead.candidateName}</h3>
                        {fullyVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Dossier 100% Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Verification
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-gray-700">{lead.passportNumber || 'Passport Pending'}</span>
                        <span>•</span>
                        <span>{trade}</span>
                        <span>•</span>
                        <span className="text-gray-700 font-medium">{country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {!fullyVerified && (
                      <button
                        onClick={() => handleVerifyAll(lead)}
                        disabled={isActing}
                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                        title="Mark all 6 documents verified"
                      >
                        {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        <span>Verify All</span>
                      </button>
                    )}

                    {fullyVerified && (
                      <button
                        onClick={() => navigate('/visa/apply')}
                        className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                        title="Lodge application to Embassy"
                      >
                        <span>Apply for Visa</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 6 Documents Checklist Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-3.5">
                  {docs.map((doc) => {
                    const isVerified = doc.status === 'VERIFIED';
                    const isMissing = doc.status === 'MISSING';

                    return (
                      <div
                        key={doc.docKey}
                        onClick={() => handleToggleDoc(lead, doc.docKey)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isVerified 
                            ? 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/80' 
                            : isMissing
                            ? 'bg-red-50/40 border-red-200/80 hover:bg-red-50/80'
                            : 'bg-gray-50/70 border-gray-200/70 hover:bg-gray-100'
                        }`}
                        title="Click to toggle Verified / Missing"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-gray-900 truncate">{doc.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono truncate mt-0.5">
                            {doc.fileName || 'Doc on File'}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isVerified ? (
                            <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : isMissing ? (
                            <span className="w-6 h-6 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-xs">
                              <X className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center">
                              <Clock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
