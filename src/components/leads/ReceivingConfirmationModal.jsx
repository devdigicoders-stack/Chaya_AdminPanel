import React, { useState } from 'react';
import { 
  X, CheckCircle2, Phone, MessageCircle, FileCheck2, 
  Mic, Volume2, ShieldCheck, AlertCircle, Copy, Check, 
  ExternalLink, ArrowRight, UserCheck, Clock, Clipboard
} from 'lucide-react';
import { apiConfirmReceivingTransfer, getCurrentUser } from '../../utils/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';

export default function ReceivingConfirmationModal({ 
  isOpen, 
  onClose, 
  lead, 
  onUpdated 
}) {
  if (!isOpen || !lead) return null;

  const currentUser = getCurrentUser() || {};
  const transferDetails = lead.fileTransferDetails || {};
  const pendingTransfer = lead.pendingTransfer || {};

  // Form State
  const [clientContacted, setClientContacted] = useState(Boolean(transferDetails.clientContacted));
  const [receivingPdfShared, setReceivingPdfShared] = useState(Boolean(transferDetails.receivingPdfShared));
  const [recordingUrl, setRecordingUrl] = useState(transferDetails.recordingUrl || '');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sender details
  const senderName = transferDetails.transferredByName || pendingTransfer.fromUserName || 'Staff Head';
  const instructions = transferDetails.staffHeadInstructions || pendingTransfer.reason || 'Kripya client se sampark karke confirmation dossier share karein aur recording save karein.';
  const candidatePhone = lead.phone || lead.whatsappNumber || '';
  const candidateName = lead.candidateName || lead.name || 'Candidate';
  const trade = lead.trade || 'General Worker';
  const country = lead.country || 'Gulf';

  // Quick WhatsApp message generator for Receiving Confirmation Dossier
  const handleOpenWhatsAppShare = () => {
    if (!candidatePhone) {
      showErrorAlert('Candidate ka phone / WhatsApp number uplabdh nahi hai.');
      return;
    }

    const cleanPhone = candidatePhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const msg = `*INTERNATIONAL CHHAYA OVERSEAS RECRUITMENT*\n` +
      `*FILE RECEIVING & PROCESS ONBOARDING CONFIRMATION*\n\n` +
      `Namaste *${candidateName}* Ji,\n\n` +
      `Aapki file hamare department me safaltapoorvak receive kar li gayi hai.\n` +
      `📌 *Candidate Code:* ${lead.leadId || lead.candidateCode || 'N/A'}\n` +
      `📌 *Applied Trade:* ${trade}\n` +
      `📌 *Target Country:* ${country}\n` +
      `📌 *Receiving Officer:* ${currentUser.name || 'Assigned Officer'}\n` +
      `📌 *Department:* ${transferDetails.targetDepartment || pendingTransfer.toRole || 'Visa Operations'}\n\n` +
      `Aapka process aage badhane ke liye Receiving Confirmation Dossier generate kiya gaya hai. Kisi bhi jaankari ya sahayata ke liye aap mujhse is number par sampark kar sakte hain.\n\n` +
      `Dhanyawaad,\n*International Chhaya Team*`;

    const encoded = encodeURIComponent(msg);
    const waUrl = `https://wa.me/${fullPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');

    setReceivingPdfShared(true);
  };

  const handlePasteRecordingUrl = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRecordingUrl(text.trim());
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleConfirmReceiving = async (e) => {
    e.preventDefault();

    if (!clientContacted) {
      showErrorAlert('Receiving staff ko client se sampark (Contact) karna aniwarya hai!');
      return;
    }

    if (!receivingPdfShared) {
      showErrorAlert('Client ko Receiving Confirmation PDF / Dossier share karna aniwarya hai!');
      return;
    }

    if (!recordingUrl.trim()) {
      showErrorAlert('Receiving confirmation ki call recording URL save karna aniwarya hai!');
      return;
    }

    setLoading(true);
    try {
      await apiConfirmReceivingTransfer(lead._id, {
        clientContacted: true,
        receivingPdfShared: true,
        recordingUrl: recordingUrl.trim(),
        remarks: remarks.trim()
      });

      showSuccessAlert(
        `File successfully received! Aap ab ${candidateName} ke official Active File Holder hain. Full responsibility transferred.`
      );
      onClose();
      if (onUpdated) onUpdated();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to confirm file receiving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header - Strictly NO 'Step 9' */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 text-white shrink-0 shadow-md">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="p-2.5 bg-white/10 rounded-2xl shrink-0 backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black truncate">File Receiving & Handover Confirmation</h2>
              <p className="text-xs text-teal-100 opacity-90 truncate">
                Client Contact, Dossier Sharing & Call Recording Mandatory Verification
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Staff Head Instructions Banner */}
          <div className="p-4 bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between text-amber-800 dark:text-amber-200 font-bold">
              <span className="flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Staff Head Ke Nirdesh (Mandatory Instructions):</span>
              </span>
              <span className="text-[11px] font-normal text-amber-700">From: <b>{senderName}</b></span>
            </div>
            <p className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-amber-200 dark:border-amber-800 font-medium text-slate-800 dark:text-slate-100 italic">
              "{instructions}"
            </p>
          </div>

          {/* Candidate Snapshot */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-400 font-medium">Candidate: </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{candidateName}</span>
              <span className="ml-2 text-slate-500">({trade} • {country})</span>
            </div>
            {candidatePhone && (
              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${candidatePhone}`}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold flex items-center space-x-1 transition"
                  title="Direct Call"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call: {candidatePhone}</span>
                </a>
              </div>
            )}
          </div>

          <form onSubmit={handleConfirmReceiving} className="space-y-4">
            
            {/* Step 1 Check: Client Se Sampark Karega */}
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 transition hover:border-teal-400">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientContacted}
                  onChange={e => setClientContacted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <span>1. Client Se Sampark Karega (Mandatory) *</span>
                    {clientContacted && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11.5px] mt-0.5">
                    Receiving staff ne client se phone call / WhatsApp par baat karke file receive hone ki suchna de di hai.
                  </p>
                </div>
              </label>
            </div>

            {/* Step 2 Check: Receiving Confirmation PDF Share Karega */}
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 transition hover:border-emerald-400">
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start space-x-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={receivingPdfShared}
                    onChange={e => setReceivingPdfShared(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <span>2. Receiving Confirmation PDF / Dossier Share Karega *</span>
                      {receivingPdfShared && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11.5px] mt-0.5">
                      Client ke WhatsApp par official confirmation letter / dossier successfully bhej diya gaya hai.
                    </p>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={handleOpenWhatsAppShare}
                  className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebc59] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shrink-0 cursor-pointer shadow-xs active:scale-95"
                  title="Share Receiving Dossier via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Share Dossier</span>
                </button>
              </div>
            </div>

            {/* Step 3: Call Recording URL Mandatory */}
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 transition hover:border-purple-400">
              <div className="text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Mic className="w-4 h-4 text-purple-600" />
                    <span>3. Receiving Confirmation Ki Recording Save Karega *</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteRecordingUrl}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center space-x-1 cursor-pointer"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>{copiedLink ? 'Pasted!' : 'Paste Link'}</span>
                  </button>
                </div>
                <input
                  type="url"
                  value={recordingUrl}
                  onChange={e => setRecordingUrl(e.target.value)}
                  placeholder="https://drive.google.com/... ya audio recording link yahan paste karein *"
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Client se sampark aur receiving confirmation ki call recording save karna aniwarya hai.
                </p>
              </div>
            </div>

            {/* Responsibility Handover Notice */}
            <div className="p-3.5 bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl text-xs text-teal-900 dark:text-teal-100 space-y-1.5">
              <div className="font-black flex items-center space-x-1.5 text-teal-800 dark:text-teal-200">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>Single Active File Holder Jimmedari:</span>
              </div>
              <p className="text-[11.5px] leading-relaxed">
                <b>Is step se client ki sampurna jimmedari receiving staff ki hogi.</b> Transfer aur receiving ka permanent record dono staff (Staff Head evam Receiving Staff) ke pass surakshit rahega.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !clientContacted || !receivingPdfShared || !recordingUrl.trim()}
                className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition inline-flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{loading ? 'Confirming...' : 'Confirm Receiving & Assume Responsibility'}</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
