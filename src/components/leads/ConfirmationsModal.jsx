import React, { useState } from 'react';
import { 
  X, FileText, CheckCircle2, Clock, Send, Mic, Video, 
  ExternalLink, Plus, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { apiSaveConfirmation, getCurrentUser } from '../../utils/api';
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

  const confirmationsList = lead.confirmations || [];

  const handleOpenEdit = (template) => {
    const existing = confirmationsList.find(c => c.docType === template.docType);
    setSelectedDoc(template);
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
                          <a href={existing.pdfUrl} target="_blank" rel="noreferrer" className="underline truncate max-w-[200px]">
                            View PDF Confirmation
                          </a>
                        </div>
                      )}
                      {existing.recordingUrl && (
                        <div className="flex items-center space-x-1.5 text-purple-600 dark:text-purple-400">
                          {existing.recordingType === 'VIDEO' ? <Video className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          <a href={existing.recordingUrl} target="_blank" rel="noreferrer" className="underline truncate max-w-[200px]">
                            {existing.recordingType} Proof Link
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

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    PDF Document URL / Link
                  </label>
                  <input 
                    type="url"
                    value={pdfUrl}
                    onChange={e => setPdfUrl(e.target.value)}
                    placeholder="https://... / docs / signed_pdf.pdf"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

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

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Mandatory Recording / Evidence URL
                  </label>
                  <input 
                    type="url"
                    value={recordingUrl}
                    onChange={e => setRecordingUrl(e.target.value)}
                    placeholder="https://... / recordings / client_confirmation.mp3"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Section 8 requirement: Client confirmation must link to audio/video proof.</p>
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
