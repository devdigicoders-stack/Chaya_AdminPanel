import { useState, useEffect } from 'react';
import { 
  X, Layers, History, 
  DollarSign, CheckCircle2, AlertCircle, 
  Sparkles, Loader2,
  Download} from 'lucide-react';
import { apiReapplyCandidate, apiGetCandidateApplications } from '../../utils/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';
import { generateConfirmationPdf } from '../../utils/confirmationPdfGenerator';

const GCC_COUNTRIES = [
  'Saudi Arabia', 'United Arab Emirates', 'Qatar', 
  'Oman', 'Kuwait', 'Bahrain', 'Russia', 'Israel', 'Poland'
];

const COMMON_TRADES = [
  'Electrician', 'Plumber', 'Pipe Fitter', 'Mason', 'Carpenter',
  'Steel Fixer', 'Welder (6G/TIG/ARC)', 'HVAC Technician', 'Heavy Driver',
  'Light Driver', 'Cook / Chef', 'Waiter', 'Security Guard', 'General Helper'
];

const REAPPLY_REASONS = [
  'Employer Visa Quota Delayed / Cancelled',
  'Candidate Requested Alternative Employer / Package',
  'Trade Profile Upgraded After Skill Assessment',
  'Medical Retest Required / Fit - Shifted to Fresh Vacancy',
  'Embassy / VFS Category Change Needed',
  'Company Demand Filled Prior to Submission',
  'Salary / Overtime Terms Renegotiation',
  'Administrative Re-allocation by Staff Head'
];

export default function ReApplyHistoryModal({ isOpen, onClose, lead, onUpdated }) {
  if (!isOpen || !lead) return null;

  const [activeTab, setActiveTab] = useState('TIMELINE'); // 'TIMELINE' | 'REAPPLY_FORM' | 'ARCHIVE_DETAILS'
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inspectingArchive, setInspectingArchive] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Re-apply Form State
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCountry, setNewCountry] = useState(lead.country || 'Saudi Arabia');
  const [newTrade, setNewTrade] = useState(lead.trade || 'General');
  const [newSalary, setNewSalary] = useState('');
  const [reasonForMove, setReasonForMove] = useState(REAPPLY_REASONS[0]);
  const [targetStage, setTargetStage] = useState('STAFF_HEAD_HANDLING');
  const [advanceAction, setAdvanceAction] = useState('CARRY_FORWARD');
  const [advanceCarriedForward, setAdvanceCarriedForward] = useState(
    lead.paymentDetails?.advancePaid || lead.billBook?.totalReceived || 0
  );
  const [newServiceFee, setNewServiceFee] = useState(
    lead.paymentDetails?.serviceFee || lead.billBook?.totalPayable || 0
  );
  const [remarks, setRemarks] = useState('');

  // Fetch full application history & cross-linked duplicates
  const fetchApplications = async () => {
    const leadId = lead._id || lead.id;
    if (!leadId) return;

    setLoading(true);
    try {
      const res = await apiGetCandidateApplications(leadId);
      if (res?.success && res.data) {
        setAppData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && lead) {
      fetchApplications();
      // Set defaults for form
      setNewCountry(lead.country || 'Saudi Arabia');
      setNewTrade(lead.trade || 'General');
      setAdvanceCarriedForward(lead.paymentDetails?.advancePaid || lead.billBook?.totalReceived || 0);
      setNewServiceFee(lead.paymentDetails?.serviceFee || lead.billBook?.totalPayable || 0);
    }
  }, [isOpen, lead]);

  const handleCopyId = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadConfirmationPdf = () => {
    try {
      generateConfirmationPdf(lead, {
        docType: 'RE_APPLY_CONFIRMATION',
        title: 'Re-Apply & Vacancy Re-Allocation Confirmation',
        desk: 'Processing Desk'
      }, { download: true });
      showSuccessAlert('Official Re-Apply Confirmation PDF generated successfully!');
    } catch (err) {
      console.error('PDF error:', err);
      showErrorAlert('Could not generate Re-Apply PDF');
    }
  };

  const handleSubmitReapply = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      showErrorAlert('Please provide the new Company / Employer name');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        newCompanyName: newCompanyName.trim(),
        newCountry,
        newTrade,
        newSalary,
        reasonForMove,
        targetStage,
        advanceAction,
        advanceCarriedForward: Number(advanceCarriedForward) || 0,
        newServiceFee: Number(newServiceFee) || 0,
        remarks: remarks.trim()
      };

      const res = await apiReapplyCandidate(lead._id || lead.id, payload);
      if (res?.success) {
        showSuccessAlert(res.message || 'Candidate re-applied successfully!');
        setActiveTab('TIMELINE');
        await fetchApplications();
        if (onUpdated) onUpdated();
      } else {
        showErrorAlert(res?.message || 'Failed to re-apply candidate');
      }
    } catch (err) {
      console.error('Error re-applying:', err);
      showErrorAlert(err.message || 'Network error during candidate re-application');
    } finally {
      setSubmitting(false);
    }
  };

  const candidateName = lead.candidateName || lead.name || 'Candidate';
  const passport = lead.passportNumber || lead.passport || 'N/A';
  const phone = lead.phone || lead.mobile || 'N/A';
  const clientId = lead.leadId || lead._id?.slice(-6) || 'CHH-000';
  const currentAppId = appData?.currentApplicationId || lead.currentApplicationId || 'APP-01';
  const totalApps = appData?.totalApplicationsCount || lead.totalApplicationsCount || 1;
  const archivedApps = appData?.archivedApplications || lead.applications || [];
  const crossLinked = appData?.crossLinkedLeads || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* 1. Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-400/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[16px] text-white">Multi-Application Tracking & Re-Apply Lifecycle</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  FRD Section 6 & 11
                </span>
                {totalApps > 1 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Cycle #{totalApps} (Re-Applied)
                  </span>
                )}
              </div>
              <div className="text-[12px] text-slate-300 font-mono mt-0.5 flex items-center gap-2">
                <span>Client ID: <b className="text-white">{clientId}</b></span>
                <span>•</span>
                <span>Name: <b className="text-white">{candidateName}</b></span>
                <span>•</span>
                <span>Passport: {passport}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadConfirmationPdf}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Re-Apply Confirmation PDF"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Re-Apply PDF</span>
            </button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Top Navigation Tabs */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-gray-200/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'TIMELINE' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-200/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Applications Timeline ({totalApps})</span>
            </button>
            <button
              onClick={() => setActiveTab('REAPPLY_FORM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'REAPPLY_FORM' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Re-Apply / Move to New Vacancy</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Active Case ID:</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">
              {currentAppId}
            </span>
          </div>
        </div>

        {/* 3. Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-xs font-medium">Loading candidate multi-application cycles...</p>
            </div>
          ) : activeTab === 'REAPPLY_FORM' ? (
            
            /* --- RE-APPLY ACTION FORM --- */
            <form onSubmit={handleSubmitReapply} className="max-w-2xl mx-auto bg-white rounded-xl border border-purple-100 shadow-sm p-6 space-y-5">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900 text-sm">Initiate Re-Apply / Move to Alternative Vacancy</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                    FRD Step 11
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Moves candidate to a new employer/country without overwriting prior history. Current case ({currentAppId}) will be archived into immutable application logs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    New Employer / Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al Falah Co / Saudi Binladin"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Target Country
                  </label>
                  <select
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    {GCC_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Designated Trade / Job Title
                  </label>
                  <input
                    type="text"
                    list="tradesList"
                    value={newTrade}
                    onChange={(e) => setNewTrade(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    placeholder="e.g. Electrician"
                  />
                  <datalist id="tradesList">
                    {COMMON_TRADES.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Agreed / Offered Salary
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1500 SAR + OT"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Moving / Re-Applying <span className="text-red-500">*</span>
                </label>
                <select
                  value={reasonForMove}
                  onChange={(e) => setReasonForMove(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  {REAPPLY_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Financial Ledger Carry Forward Section */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-900">Financial Ledger & Advance Policy</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700">FRD Section 9: No Double Counting</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-amber-800 mb-1">Advance Carry-Forward Action</label>
                    <select
                      value={advanceAction}
                      onChange={(e) => setAdvanceAction(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg"
                    >
                      <option value="CARRY_FORWARD">Carry Forward Prior Advance to New File</option>
                      <option value="FRESH">Fresh Fee Structure (Zero Carry Forward)</option>
                    </select>
                  </div>

                  {advanceAction === 'CARRY_FORWARD' && (
                    <div>
                      <label className="block text-[11px] font-medium text-amber-800 mb-1">Carry Forward Amount (₹)</label>
                      <input
                        type="number"
                        value={advanceCarriedForward}
                        onChange={(e) => setAdvanceCarriedForward(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono font-bold"
                        placeholder="0"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-amber-800 mb-1">New Total Package / Service Fee (₹)</label>
                    <input
                      type="number"
                      value={newServiceFee}
                      onChange={(e) => setNewServiceFee(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-amber-800 mb-1">Destination Workflow Stage</label>
                    <select
                      value={targetStage}
                      onChange={(e) => setTargetStage(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg"
                    >
                      <option value="STAFF_HEAD_HANDLING">Staff Head Desk (Allocation Verification)</option>
                      <option value="CALLING_QUEUE">Calling Queue Desk (Re-Interview)</option>
                      <option value="PRE_VISA">Pre-Viva Clearance Desk (Direct Move)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Additional Notes / Case Handover Remarks
                </label>
                <textarea
                  rows="2"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record specifics about client consent, quota availability, or special terms..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('TIMELINE')}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Re-Applying Candidate...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm & Re-Apply (Create APP-0{totalApps + 1})</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          ) : (

            /* --- TIMELINE VIEW --- */
            <div className="space-y-6">

              {/* Cross-Linked Lead Notice (Multi-record matching) */}
              {crossLinked.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-blue-900">
                      Cross-File Intelligence: {crossLinked.length} other registered lead record(s) found with matching Phone/Passport
                    </h5>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      The candidate has prior historical entries in the database. All records are automatically linked under this profile.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {crossLinked.map((cl) => (
                        <div key={cl._id} className="bg-white border border-blue-200 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-2 text-gray-800">
                          <span className="font-mono font-bold text-blue-700">{cl.leadId || cl._id.slice(-6)}</span>
                          <span>•</span>
                          <span>{cl.candidateName}</span>
                          <span>•</span>
                          <span className="text-gray-500">{cl.country} ({cl.trade})</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 bg-gray-100 rounded text-[10px] font-semibold">{cl.currentStage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIVE APPLICATION CARD */}
              <div className="bg-white rounded-xl border-2 border-purple-500/30 shadow-xs p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  Active Application Cycle
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm font-mono border border-purple-200">
                    {currentAppId}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <span>{lead.companyConfirmation?.companyName || lead.tradeDetails?.targetCompany || 'Employer Pending / Under Process'}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {lead.currentStage}
                      </span>
                    </h4>
                    <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                      <span>Country: <b className="text-gray-800">{lead.country || 'N/A'}</b></span>
                      <span>•</span>
                      <span>Trade: <b className="text-gray-800">{lead.trade || 'General'}</b></span>
                      <span>•</span>
                      <span>File Type: <b className="text-purple-700">{lead.fileType || 'FRESH'}</b></span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Offered Salary</span>
                    <span className="font-bold text-gray-900">{lead.applicationForm?.expectedSalary || 'Standard GCC Scale'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Advance Collected</span>
                    <span className="font-bold text-emerald-700">₹{lead.paymentDetails?.advancePaid || lead.billBook?.totalReceived || 0}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Outstanding Balance</span>
                    <span className="font-bold text-amber-700">₹{lead.paymentDetails?.balanceDue || lead.billBook?.balanceDue || 0}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400 block">Application Status</span>
                    <span className="font-bold text-purple-700">{lead.closureStatus || 'ACTIVE'}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2">
                  <div className="text-[11px] text-gray-400">
                    Applied On: {new Date(lead.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <button
                    onClick={() => setActiveTab('REAPPLY_FORM')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Re-Apply / Move to New Job</span>
                  </button>
                </div>
              </div>

              {/* ARCHIVED / HISTORICAL APPLICATIONS TIMELINE */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-600" />
                    <span>Historical Applications Archive ({archivedApps.length})</span>
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    FRD Section 6: Old Company, Charges & Consents preserved permanently
                  </span>
                </div>

                {archivedApps.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
                    <p className="text-xs text-gray-500">
                      No previous applications archived. This candidate is currently in their initial application cycle ({currentAppId}).
                    </p>
                    <button
                      onClick={() => setActiveTab('REAPPLY_FORM')}
                      className="mt-3 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Initiate First Re-Apply</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {archivedApps.map((app, index) => {
                      const isInspecting = inspectingArchive === (app.applicationId || index);
                      return (
                        <div key={app.applicationId || index} className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
                          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs font-mono shrink-0 mt-0.5">
                                {app.applicationId || `APP-0${index + 1}`}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-gray-900 text-xs">
                                    {app.companyName || 'Previous Company'}
                                  </h5>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                    {app.status || 'MOVED'}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {app.targetCountry} • {app.trade}
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  <span>Stage Reached: <b className="text-gray-700">{app.stageReached || 'N/A'}</b></span>
                                  <span>Reason: <span className="text-purple-700 italic">{app.reasonForMove}</span></span>
                                  {app.closedAt && (
                                    <span>Closed/Moved: {new Date(app.closedAt).toLocaleDateString('en-GB')}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <div className="text-right text-xs">
                                <span className="text-[10px] text-gray-400 block">Advance Adjusted</span>
                                <span className="font-bold text-emerald-700">₹{app.financials?.advancePaid || 0}</span>
                              </div>
                              <button
                                onClick={() => setInspectingArchive(isInspecting ? null : (app.applicationId || index))}
                                className="px-2.5 py-1 text-xs border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
                              >
                                {isInspecting ? 'Hide Snapshot' : 'View Snapshot'}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Snapshot View */}
                          {isInspecting && (
                            <div className="bg-slate-50 border-t border-gray-100 p-4 text-xs space-y-3">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <span className="text-[10px] text-gray-400 block font-medium">Recorded Salary</span>
                                  <span className="font-bold text-gray-800">{app.salaryOffered || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 block font-medium">Handled By Staff</span>
                                  <span className="font-bold text-gray-800">{app.handledBy || 'Processing Team'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 block font-medium">Carried Forward Amount</span>
                                  <span className="font-bold text-emerald-700">₹{app.financials?.adjustmentCarriedForward || 0}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-400 block font-medium">Total Package Fee</span>
                                  <span className="font-bold text-gray-800">₹{app.financials?.serviceFee || 0}</span>
                                </div>
                              </div>
                              {app.remarks && (
                                <div className="text-[11px] text-gray-600 bg-white p-2 rounded border border-gray-200/80">
                                  <b>Notes:</b> {app.remarks}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* 4. Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-between text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-2">
            <span>Candidate Ref: <b className="font-mono text-gray-800">{clientId}</b></span>
            <span>•</span>
            <span>Phone: <b className="text-gray-800">{phone}</b></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
