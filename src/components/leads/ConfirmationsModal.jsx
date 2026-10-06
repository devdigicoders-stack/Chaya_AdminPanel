import { useState, useEffect, useRef } from 'react';
import { 
  X, FileText, Mic, Video, UploadCloud, Trash2, Loader2, CheckCircle2, ExternalLink, Check, Download, FileDown, Sparkles, Printer, AlertCircle 
} from 'lucide-react';
import { apiSaveConfirmation, apiUploadLeadMedia, resolveMediaUrl, getCurrentUser, apiGetLeadById } from '../../utils/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';
import { generateConfirmationPdf } from '../../utils/confirmationPdfGenerator';

const CONFIRMATION_TEMPLATES = [
  { docType: 'VISA_CATEGORY_SELECTION', title: '1. Visa Category Selection Confirmation', desk: 'Calling Desk' },
  { docType: 'INTERVIEW_CONFIRMATION', title: '2. Interview Confirmation', desk: 'Interview Desk' },
  { docType: 'MEDICAL_FITNESS_DECLARATION', title: '3. Medical Fitness Declaration', desk: 'Medical Desk' },
  { docType: 'COMPANY_SELECTION_OFFER', title: '4. Company Selection / Offer Acceptance', desk: 'Step 8 Desk' },
  { docType: 'PRE_VIVA_CLEARANCE', title: '5. PRI Visa Confirmation (Pre-Visa Clearance)', desk: 'Pre-Visa Desk' },
  { docType: 'VISA_SUBMISSION_APPROVAL', title: '6. After Visa Confirmation (Video & Signatures)', desk: 'Visa Desk' },
  { docType: 'VIVA_STAGE_CLEARANCE', title: '7. Viva Stage Clearance Confirmation', desk: 'Viva Desk' },
  { docType: 'FLIGHT_AND_JOINING', title: '8. Flight & Joining Confirmation', desk: 'Deployment Desk' },
];

export default function ConfirmationsModal({ isOpen, onClose, lead, onUpdated }) {
  if (!isOpen || !lead) return null;

  const currentUser = getCurrentUser() || {};
  const [localLead, setLocalLead] = useState(lead);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quickSavingDocType, setQuickSavingDocType] = useState(null);
  const [generatingPdfDocType, setGeneratingPdfDocType] = useState(null);

  useEffect(() => {
    setLocalLead(lead);
  }, [lead]);

  // Form State for Selected Confirmation
  const [status, setStatus] = useState('GENERATED'); // 'GENERATED' | 'SHARED' | 'CLIENT_CONFIRMED'
  const [sharedChannel, setSharedChannel] = useState('WHATSAPP');
  const [pdfUrl, setPdfUrl] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [recordingType, setRecordingType] = useState('CALL_RECORDING');
  const [remarks, setRemarks] = useState('');

  // File Upload State
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [mediaFileName, setMediaFileName] = useState('');
  const fileInputRefPdf = useRef(null);
  const fileInputRefMedia = useRef(null);

  const confirmationsList = localLead?.confirmations || [];

  const refreshLocalLead = async () => {
    try {
      const res = await apiGetLeadById(localLead._id);
      if (res?.data) {
        setLocalLead(res.data);
      }
    } catch (err) {
      console.error('Failed to refresh local lead confirmations:', err);
    }
    if (onUpdated) onUpdated();
  };

  const handleAutoGeneratePdf = async (tmpl, e) => {
    if (e) e.stopPropagation();
    setGeneratingPdfDocType(tmpl.docType);
    try {
      // 1. Generate & download in browser
      const result = generateConfirmationPdf(localLead, tmpl, { download: true, returnBlob: true });
      
      // 2. Upload generated blob as official file
      const pdfFile = new File([result.blob], result.fileName, { type: 'application/pdf' });
      const uploadRes = await apiUploadLeadMedia(
        localLead._id, 
        pdfFile, 
        `${tmpl.title} - Official Letterhead Confirmation`, 
        'Confirmation Document'
      );
      const uploadedUrl = uploadRes.data?.fileUrl || uploadRes.fileUrl || '';

      // 3. Auto-save confirmation with new PDF url
      const existing = confirmationsList.find(c => c.docType === tmpl.docType);
      await apiSaveConfirmation(localLead._id, {
        docType: tmpl.docType,
        title: tmpl.title,
        status: existing?.status === 'CLIENT_CONFIRMED' ? 'CLIENT_CONFIRMED' : 'SHARED',
        sharedChannel: existing?.sharedChannel || 'WHATSAPP',
        pdfUrl: uploadedUrl,
        recordingUrl: existing?.recordingUrl || '',
        recordingType: existing?.recordingType || 'CALL_RECORDING',
        remarks: existing?.remarks || 'Auto-generated official PDF attached and downloaded.'
      });

      showSuccessAlert(`✓ Official "${tmpl.title}" PDF generated, downloaded & saved to candidate file!`);
      await refreshLocalLead();
    } catch (err) {
      console.error('Failed to auto-generate confirmation PDF:', err);
      showErrorAlert(err.message || 'Failed to auto-generate PDF');
    } finally {
      setGeneratingPdfDocType(null);
    }
  };

  const handleQuickToggle = async (tmpl, e) => {
    e.stopPropagation();
    const existing = confirmationsList.find(c => c.docType === tmpl.docType);
    const currentlyConfirmed = existing?.status === 'CLIENT_CONFIRMED';
    const nextStatus = currentlyConfirmed ? 'GENERATED' : 'CLIENT_CONFIRMED';

    // Strict validation: cannot toggle to confirmed without PDF and recording proof
    if (nextStatus === 'CLIENT_CONFIRMED') {
      const existingPdf = (existing?.pdfUrl || '').trim();
      if (!existingPdf) {
        showErrorAlert(`"${tmpl.title}" cannot be confirmed: Signed PDF document is missing. Please click Details to upload or auto-generate the document first.`);
        handleOpenEdit(tmpl);
        return;
      }
      const existingRec = (existing?.recordingUrl || '').trim();
      if (!existingRec) {
        showErrorAlert(`"${tmpl.title}" cannot be confirmed: Audio/Video recording evidence is missing. Section 8 requires attached media proof before confirming.`);
        handleOpenEdit(tmpl);
        return;
      }
    }

    setQuickSavingDocType(tmpl.docType);
    try {
      await apiSaveConfirmation(localLead._id, {
        docType: tmpl.docType,
        title: tmpl.title,
        status: nextStatus,
        sharedChannel: existing?.sharedChannel || 'WHATSAPP',
        pdfUrl: existing?.pdfUrl || '',
        recordingUrl: existing?.recordingUrl || '',
        recordingType: existing?.recordingType || 'CALL_RECORDING',
        remarks: existing?.remarks || (nextStatus === 'CLIENT_CONFIRMED' ? 'Marked confirmed via 1-click quick tick' : '')
      });

      showSuccessAlert(
        nextStatus === 'CLIENT_CONFIRMED' 
          ? `✓ "${tmpl.title}" marked as Confirmed!` 
          : `"${tmpl.title}" set back to Generated.`
      );
      await refreshLocalLead();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to update confirmation status');
    } finally {
      setQuickSavingDocType(null);
    }
  };

  const handleOpenEdit = (template) => {
    const existing = confirmationsList.find(c => c.docType === template.docType);
    setSelectedDoc(template);
    setPdfFileName('');
    setMediaFileName('');
    if (existing) {
      setStatus(existing.status || 'GENERATED');
      setSharedChannel(existing.sharedChannel || 'WHATSAPP');
      setPdfUrl(existing.pdfUrl || '');
      setRecordingUrl(existing.recordingUrl || '');
      setRecordingType(existing.recordingType || 'CALL_RECORDING');
      setRemarks(existing.remarks || '');
    } else {
      setStatus('GENERATED');
      setSharedChannel('WHATSAPP');
      setPdfUrl('');
      setRecordingUrl('');
      setRecordingType(template.docType === 'VISA_SUBMISSION_APPROVAL' ? 'VIDEO' : 'CALL_RECORDING');
      setRemarks('');
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const res = await apiUploadLeadMedia(localLead._id, file, `${selectedDoc?.title || 'Document'} - Signed PDF`, 'Confirmation Document');
      const url = res.data?.fileUrl || res.fileUrl || '';
      setPdfUrl(url);
      setPdfFileName(file.name);
      showSuccessAlert(`Document "${file.name}" uploaded successfully!`);
    } catch (err) {
      showErrorAlert(err.message || 'Failed to upload document');
    } finally {
      setUploadingPdf(false);
      if (fileInputRefPdf.current) fileInputRefPdf.current.value = '';
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const res = await apiUploadLeadMedia(localLead._id, file, `${selectedDoc?.title || 'Recording'} - Evidence Media`, 'Confirmation Recording');
      const url = res.data?.fileUrl || res.fileUrl || '';
      setRecordingUrl(url);
      setMediaFileName(file.name);
      showSuccessAlert(`Media "${file.name}" uploaded successfully!`);
    } catch (err) {
      showErrorAlert(err.message || 'Failed to upload recording media');
    } finally {
      setUploadingMedia(false);
      if (fileInputRefMedia.current) fileInputRefMedia.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;

    // 1. Mandatory Signed PDF check
    const trimmedPdf = (pdfUrl || '').trim();
    if (!trimmedPdf) {
      showErrorAlert('Mandatory Signed PDF document is missing! Please upload a PDF document or click "1-Click Auto-Generate Branded PDF" before saving.');
      return;
    }

    // 2. Mandatory Audio/Video Evidence check for CLIENT_CONFIRMED
    const trimmedRec = (recordingUrl || '').trim();
    if (status === 'CLIENT_CONFIRMED' && !trimmedRec) {
      showErrorAlert('Mandatory Audio/Video recording evidence is missing! Per Section 8 rules, a client confirmation must include verified call audio or video consent before marking as Client Confirmed.');
      return;
    }

    // 3. Specifically for After Visa Confirmation (Video & Signatures)
    if (selectedDoc.docType === 'VISA_SUBMISSION_APPROVAL' && status === 'CLIENT_CONFIRMED' && !trimmedRec) {
      showErrorAlert('Video Statement / Consent recording is mandatory for After-Visa Confirmation.');
      return;
    }

    setLoading(true);
    try {
      await apiSaveConfirmation(localLead._id, {
        docType: selectedDoc.docType,
        title: selectedDoc.title,
        status,
        sharedChannel,
        pdfUrl: trimmedPdf,
        recordingUrl: trimmedRec,
        recordingType,
        remarks
      });
      showSuccessAlert(`Confirmation "${selectedDoc.title}" updated successfully!`);
      setSelectedDoc(null);
      await refreshLocalLead();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to save confirmation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-900 text-white shrink-0 shadow-md">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 pr-2">
            <div className="p-2 sm:p-2.5 bg-white/10 rounded-xl backdrop-blur-md shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg md:text-xl font-bold tracking-tight truncate">
                8 Mandatory Confirmations & Proofs
              </h2>
              <div className="text-[11px] sm:text-xs text-indigo-100/90 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span>Candidate: <strong className="font-semibold text-white">{lead.name || lead.candidateName}</strong></span>
                {lead.candidateCode && (
                  <span className="px-1.5 py-0.5 bg-indigo-500/30 rounded text-[10px] font-mono">
                    {lead.candidateCode}
                  </span>
                )}
                {lead.phone && <span className="opacity-80">({lead.phone})</span>}
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 overscroll-contain">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {CONFIRMATION_TEMPLATES.map((tmpl) => {
              const existing = confirmationsList.find(c => c.docType === tmpl.docType);
              const isConfirmed = existing?.status === 'CLIENT_CONFIRMED';
              const isShared = existing?.status === 'SHARED';

              return (
                <div 
                  key={tmpl.docType}
                  className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                    isConfirmed 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-xs' 
                      : isShared
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      {/* 1-CLICK QUICK TICK BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickToggle(tmpl, e)}
                        disabled={quickSavingDocType === tmpl.docType}
                        title={isConfirmed ? "Confirmed! Click to uncheck" : "Click to mark as Confirmed"}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 border cursor-pointer ${
                          quickSavingDocType === tmpl.docType
                            ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 text-slate-400'
                            : isConfirmed
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs hover:bg-emerald-700 hover:scale-105 active:scale-95'
                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-300 hover:border-emerald-500 hover:text-emerald-500 hover:scale-105 active:scale-95'
                        }`}
                      >
                        {quickSavingDocType === tmpl.docType ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Check className={`w-4 h-4 stroke-[3] ${isConfirmed ? 'opacity-100 text-white' : 'opacity-0 hover:opacity-100'}`} />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          {tmpl.desk}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 leading-snug break-words">
                          {tmpl.title}
                        </h4>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 self-start ${
                      isConfirmed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : isShared
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                        : existing
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {existing ? existing.status : 'NOT STARTED'}
                    </span>
                  </div>

                  {existing && (
                    <div className="mt-3 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 pt-2">
                      {existing.pdfUrl && (
                        <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <a href={resolveMediaUrl(existing.pdfUrl)} target="_blank" rel="noreferrer" className="underline truncate max-w-[200px] hover:text-blue-700">
                            View PDF Confirmation
                          </a>
                        </div>
                      )}
                      {existing.recordingUrl && (
                        <div className="flex items-center space-x-1.5 text-purple-600 dark:text-purple-400">
                          {existing.recordingType === 'VIDEO' ? <Video className="w-3.5 h-3.5 shrink-0" /> : <Mic className="w-3.5 h-3.5 shrink-0" />}
                          <a href={resolveMediaUrl(existing.recordingUrl)} target="_blank" rel="noreferrer" className="underline truncate max-w-[200px] hover:text-purple-700">
                            Play / Open {existing.recordingType} Proof
                          </a>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">
                        Handled by: {existing.handledByName || 'Staff'} • v{existing.version || 1}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => handleQuickToggle(tmpl, e)}
                      disabled={quickSavingDocType === tmpl.docType}
                      className={`text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        isConfirmed 
                          ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400' 
                          : 'text-slate-500 hover:text-emerald-600 dark:text-slate-400'
                      }`}
                    >
                      {quickSavingDocType === tmpl.docType ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          <span>Saving...</span>
                        </>
                      ) : isConfirmed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Confirmed</span>
                        </>
                      ) : (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-500 inline-block" />
                          <span>Quick Tick</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                      {/* 1-CLICK AUTO-GENERATE OFFICIAL BRANDED PDF */}
                      <button
                        type="button"
                        onClick={(e) => handleAutoGeneratePdf(tmpl, e)}
                        disabled={generatingPdfDocType === tmpl.docType}
                        title="1-Click: Auto-fill candidate details on official Chhaya International letterhead, download PDF & attach to case!"
                        className="px-2.5 py-1.5 sm:py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {generatingPdfDocType === tmpl.docType ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>PDF...</span>
                          </>
                        ) : (
                          <>
                            <FileDown className="w-3 h-3" />
                            <span>Auto PDF</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tmpl)}
                        className="px-2.5 py-1.5 sm:py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        {existing ? 'Edit Proof' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Sticky Bottom Bar */}
        <div className="px-4 py-3 sm:px-6 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs">
          <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              <strong className="font-bold text-slate-800 dark:text-slate-200">
                {confirmationsList.filter(c => c.status === 'CLIENT_CONFIRMED').length}
              </strong> of {CONFIRMATION_TEMPLATES.length} Confirmed
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Edit Sub-Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
              
              {/* Sub-modal Header (shrink-0) */}
              <div className="flex justify-between items-center px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0 bg-slate-50/70 dark:bg-slate-800/80">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block truncate">
                    {selectedDoc.desk}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                    {selectedDoc.title}
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-modal Form with Scrollable Content and Sticky Actions */}
              <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Confirmation State *
                    </label>
                    <select 
                      value={status} 
                      onChange={e => setStatus(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="GENERATED">1. Generated (Ready to Share)</option>
                      <option value="SHARED">2. Shared with Candidate</option>
                      <option value="CLIENT_CONFIRMED">3. Client Confirmed (Proof Received)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Sharing Channel
                    </label>
                    <select 
                      value={sharedChannel} 
                      onChange={e => setSharedChannel(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="PHYSICAL_SIGNED">Physical Signed Copy at Desk</option>
                      <option value="EMAIL">Email Document</option>
                      <option value="SMS">SMS Link</option>
                    </select>
                  </div>

                  {/* 1. PDF Document Upload */}
                  <div>
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Signed PDF Document <span className="text-rose-500 font-bold">*</span>
                        </label>
                        {!pdfUrl && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-1.5 py-0.5 rounded">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setUploadingPdf(true);
                            const result = generateConfirmationPdf(localLead, selectedDoc, { download: true, returnBlob: true });
                            const pdfFile = new File([result.blob], result.fileName, { type: 'application/pdf' });
                            const uploadRes = await apiUploadLeadMedia(
                              localLead._id, 
                              pdfFile, 
                              `${selectedDoc.title} - Official Letterhead Confirmation`, 
                              'Confirmation Document'
                            );
                            const uploadedUrl = uploadRes.data?.fileUrl || uploadRes.fileUrl || '';
                            setPdfUrl(uploadedUrl);
                            setPdfFileName(result.fileName);
                            showSuccessAlert('✓ Official branded PDF generated, downloaded & attached!');
                          } catch (err) {
                            showErrorAlert(err.message || 'Failed to generate PDF');
                          } finally {
                            setUploadingPdf(false);
                          }
                        }}
                        disabled={uploadingPdf}
                        className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Auto-fill details on official letterhead & attach"
                      >
                        {uploadingPdf ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" /> 1-Click Auto-Generate Branded PDF
                          </>
                        )}
                      </button>
                    </div>

                    <input 
                      ref={fileInputRefPdf}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf"
                      className="hidden"
                      onChange={handlePdfUpload}
                    />

                    {pdfUrl ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate text-left min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {pdfFileName || pdfUrl.split('/').pop() || 'signed_confirmation.pdf'}
                            </div>
                            <a 
                              href={resolveMediaUrl(pdfUrl)} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 font-medium hover:underline truncate"
                            >
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" /> Preview Document
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => fileInputRefPdf.current?.click()}
                            disabled={uploadingPdf}
                            className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPdfUrl(''); setPdfFileName(''); }}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => !uploadingPdf && fileInputRefPdf.current?.click()}
                        className="border-2 border-dashed border-rose-300 hover:border-rose-500 dark:border-rose-700/80 dark:hover:border-rose-500 rounded-xl p-3 text-center cursor-pointer transition-all bg-rose-50/20 hover:bg-rose-50/50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 group"
                      >
                        {uploadingPdf ? (
                          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 py-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading Document...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              <UploadCloud className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                              <span>Upload PDF Document (Click to Browse)</span>
                            </div>
                            <span className="text-[10.5px] text-rose-500 dark:text-rose-400 font-medium">
                              ⚠️ Document is mandatory before saving
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Recording Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Recording Type
                    </label>
                    <select 
                      value={recordingType} 
                      onChange={e => setRecordingType(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="CALL_RECORDING">Call Audio Recording (Desk Line)</option>
                      <option value="AUDIO">Audio Voice Note</option>
                      <option value="VIDEO">Video Statement / Consent</option>
                    </select>
                  </div>

                  {/* 3. Mandatory Recording / Evidence Media Upload */}
                  <div>
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Mandatory Audio / Video Evidence {(status === 'CLIENT_CONFIRMED' || selectedDoc?.docType === 'VISA_SUBMISSION_APPROVAL') && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        {status === 'CLIENT_CONFIRMED' && !recordingUrl && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      {recordingUrl && (
                        <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Attached
                        </span>
                      )}
                    </div>

                    <input 
                      ref={fileInputRefMedia}
                      type="file"
                      accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm,.3gp"
                      className="hidden"
                      onChange={handleMediaUpload}
                    />

                    {recordingUrl ? (
                      <div className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                              {recordingType === 'VIDEO' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </div>
                            <div className="truncate text-left min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {mediaFileName || recordingUrl.split('/').pop() || 'client_confirmation_recording'}
                              </div>
                              <a 
                                href={resolveMediaUrl(recordingUrl)} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 font-medium hover:underline truncate"
                              >
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" /> Play Evidence
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => fileInputRefMedia.current?.click()}
                              disabled={uploadingMedia}
                              className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => { setRecordingUrl(''); setMediaFileName(''); }}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* In-browser preview for audio recordings */}
                        {recordingUrl && !recordingUrl.match(/\.(mp4|mov|webm)$/i) && (
                          <audio controls src={resolveMediaUrl(recordingUrl)} className="w-full h-8 pt-0.5" />
                        )}
                      </div>
                    ) : (
                      <div 
                        onClick={() => !uploadingMedia && fileInputRefMedia.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all group ${
                          status === 'CLIENT_CONFIRMED' 
                            ? 'border-rose-300 hover:border-rose-500 dark:border-rose-700/80 dark:hover:border-rose-500 bg-rose-50/20 hover:bg-rose-50/50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20' 
                            : 'border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 bg-slate-50/50 hover:bg-purple-50/30 dark:bg-slate-800/30 dark:hover:bg-purple-950/20'
                        }`}
                      >
                        {uploadingMedia ? (
                          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 py-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading Audio/Video Evidence...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                              <UploadCloud className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                              <span>Upload Recording / Media File</span>
                            </div>
                            {status === 'CLIENT_CONFIRMED' && (
                              <span className="text-[10.5px] text-rose-500 dark:text-rose-400 font-medium">
                                ⚠️ Proof media required to save as Client Confirmed
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">Section 8 requirement: Client confirmation must attach audio/video proof.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Remarks / Notes
                    </label>
                    <input 
                      type="text"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Confirmation notes, candidate agreement details..."
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Validation Notice Banner */}
                  {(!pdfUrl || (status === 'CLIENT_CONFIRMED' && !recordingUrl)) && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span className="font-medium text-[11.5px]">
                        {!pdfUrl 
                          ? 'Signed PDF Document is mandatory. Please upload or auto-generate PDF before saving.' 
                          : 'Audio/Video Evidence is mandatory to save as Client Confirmed.'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub-modal Sticky Footer with Actions */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 sm:px-5 border-t border-slate-100 dark:border-slate-700 shrink-0 bg-slate-50/70 dark:bg-slate-800/80">
                  <button 
                    type="button" 
                    onClick={() => setSelectedDoc(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-lg shadow-sm cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{loading ? 'Saving...' : 'Save Confirmation'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
