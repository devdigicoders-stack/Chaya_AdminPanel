import { useState, useRef } from 'react';
import { 
  X, FileText, Mic, Video} from 'lucide-react';
import { apiSaveConfirmation, apiUploadLeadMedia, getCurrentUser } from '../../utils/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';

const CONFIRMATION_TEMPLATES = [
  { docType: 'VISA_CATEGORY_SELECTION', title: '1. Visa Category Selection Confirmation', desk: 'Calling Desk' },
  { docType: 'INTERVIEW_CONFIRMATION', title: '2. Interview Confirmation', desk: 'Interview Desk' },
  { docType: 'MEDICAL_FITNESS_DECLARATION', title: '3. Medical Fitness Declaration', desk: 'Medical Desk' },
  { docType: 'COMPANY_SELECTION_OFFER', title: '4. Company Selection / Offer Acceptance', desk: 'Step 8 Desk' },
  { docType: 'PRE_VIVA_CLEARANCE', title: '5. Pre-Viva Clearance Confirmation', desk: 'Pre-Viva Desk' },
  { docType: 'VISA_SUBMISSION_APPROVAL', title: '6. Visa Submission Approval', desk: 'Visa Desk' },
  { docType: 'VIVA_STAGE_CLEARANCE', title: '7. Viva Stage Clearance Confirmation', desk: 'Viva Desk' },
  { docType: 'FLIGHT_AND_JOINING', title: '8. Flight & Joining Confirmation', desk: 'Deployment Desk' },
];

export default function ConfirmationsModal({ isOpen, onClose, lead, onUpdated }) {
  if (!isOpen || !lead) return null;

  const currentUser = getCurrentUser() || {};
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const confirmationsList = lead.confirmations || [];

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
      setRecordingType('CALL_RECORDING');
      setRemarks('');
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const res = await apiUploadLeadMedia(lead._id, file, `${selectedDoc?.title || 'Document'} - Signed PDF`, 'Confirmation Document');
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
      const res = await apiUploadLeadMedia(lead._id, file, `${selectedDoc?.title || 'Recording'} - Evidence Media`, 'Confirmation Recording');
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

    if (status === 'CLIENT_CONFIRMED' && !recordingUrl) {
      if (!confirm('Warning: Spec requires an Audio/Video recording link for final client confirmation. Do you want to proceed anyway?')) {
        return;
      }
    }

    setLoading(true);
    try {
      await apiSaveConfirmation(lead._id, {
        docType: selectedDoc.docType,
        title: selectedDoc.title,
        status,
        sharedChannel,
        pdfUrl,
        recordingUrl,
        recordingType,
        remarks
      });
      showSuccessAlert(`Confirmation "${selectedDoc.title}" updated successfully!`);
      setSelectedDoc(null);
      if (onUpdated) onUpdated();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to save confirmation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-700 via-purple-700 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <FileText className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">8 Mandatory Confirmations & Proofs</h2>
              <p className="text-xs text-indigo-100 opacity-90">
                Candidate: <span className="font-semibold text-white">{lead.name || lead.candidateName}</span> 
                {lead.candidateCode && <span className="ml-2 px-2 py-0.5 bg-indigo-500/30 rounded text-[10px] font-mono">{lead.candidateCode}</span>}
                <span className="ml-2">({lead.phone})</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONFIRMATION_TEMPLATES.map((tmpl) => {
              const existing = confirmationsList.find(c => c.docType === tmpl.docType);
              const isConfirmed = existing?.status === 'CLIENT_CONFIRMED';
              const isShared = existing?.status === 'SHARED';

              return (
                <div 
                  key={tmpl.docType}
                  className={`p-4 rounded-xl border transition-all ${
                    isConfirmed 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
                      : isShared
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {tmpl.desk}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {tmpl.title}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                          <FileText className="w-3.5 h-3.5" />
                          <a href={resolveMediaUrl(existing.pdfUrl)} target="_blank" rel="noreferrer" className="underline truncate max-w-[200px] hover:text-blue-700">
                            View PDF Confirmation
                          </a>
                        </div>
                      )}
                      {existing.recordingUrl && (
                        <div className="flex items-center space-x-1.5 text-purple-600 dark:text-purple-400">
                          {existing.recordingType === 'VIDEO' ? <Video className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
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

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleOpenEdit(tmpl)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      {existing ? 'Update Status / Links' : 'Record Confirmation'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit Sub-Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedDoc.title}
                </h3>
                <button onClick={() => setSelectedDoc(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Signed PDF Document
                    </label>
                    {pdfUrl && (
                      <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded
                      </span>
                    )}
                  </div>

                  <input 
                    ref={fileInputRefPdf}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                  />

                  {pdfUrl ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate text-left">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {pdfFileName || pdfUrl.split('/').pop() || 'signed_confirmation.pdf'}
                          </div>
                          <a 
                            href={resolveMediaUrl(pdfUrl)} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 font-medium hover:underline"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> Preview Document
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
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-3 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/30 dark:bg-slate-800/30 dark:hover:bg-indigo-950/20 group"
                    >
                      {uploadingPdf ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 py-1">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading Document...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 py-0.5">
                          <UploadCloud className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                          <span>Upload PDF Document (Click to Browse)</span>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mandatory Audio / Video Evidence
                    </label>
                    {recordingUrl && (
                      <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                            {recordingType === 'VIDEO' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </div>
                          <div className="truncate text-left">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {mediaFileName || recordingUrl.split('/').pop() || 'client_confirmation_recording'}
                            </div>
                            <a 
                              href={resolveMediaUrl(recordingUrl)} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 font-medium hover:underline"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> Play / Open Evidence
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
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-400 rounded-xl p-3 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-purple-50/30 dark:bg-slate-800/30 dark:hover:bg-purple-950/20 group"
                    >
                      {uploadingMedia ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 py-1">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading Audio/Video Evidence...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 py-0.5">
                          <UploadCloud className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                          <span>Upload Recording / Media File (Audio / Video)</span>
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

                <div className="flex justify-end space-x-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setSelectedDoc(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    {loading ? 'Saving...' : 'Save Confirmation'}
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
