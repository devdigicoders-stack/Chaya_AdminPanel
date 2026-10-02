import React, { useState } from 'react';
import { 
  X, Briefcase, CheckCircle2, Clock, FileText, Video, Mic, Building2, MapPin
} from 'lucide-react';
import { apiUpdateCompanyConfirmation } from '../../utils/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';

export default function CompanyConfirmationModal({ isOpen, onClose, lead, onUpdated }) {
  if (!isOpen || !lead) return null;

  const currentConf = lead.companyConfirmation || {};

  const [status, setStatus] = useState(currentConf.status || 'PENDING');
  const [companyName, setCompanyName] = useState(currentConf.companyName || lead.trade?.company || '');
  const [positionOffered, setPositionOffered] = useState(currentConf.positionOffered || lead.trade?.tradeName || lead.trade?.name || '');
  const [terms, setTerms] = useState(currentConf.terms || '');
  const [agreementPdfUrl, setAgreementPdfUrl] = useState(currentConf.agreementPdfUrl || '');
  const [recordingUrl, setRecordingUrl] = useState(currentConf.recordingUrl || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showErrorAlert('Company name is required');
      return;
    }

    setLoading(true);
    try {
      await apiUpdateCompanyConfirmation(lead._id, {
        status,
        companyName,
        positionOffered,
        terms,
        agreementPdfUrl,
        recordingUrl
      });
      showSuccessAlert('Step 8: Company Confirmation & Agreement updated successfully!');
      onClose();
      if (onUpdated) onUpdated();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to update company confirmation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Building2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Step 8: Company Confirmation & Offer</h2>
              <p className="text-xs text-teal-100 opacity-90">
                {lead.name || lead.candidateName} • Passport: {lead.passportNumber || 'N/A'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Candidate Selection & Acceptance Status *
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="PENDING">PENDING (Proposal Under Review)</option>
              <option value="PROPOSED">PROPOSED (Company & Terms Shared with Candidate)</option>
              <option value="ACCEPTED">ACCEPTED (Candidate Confirmed & Signed Agreement)</option>
              <option value="REJECTED">REJECTED (Candidate Declined Offer)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Al Habtoor Group LLC"
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Position / Trade Offered
              </label>
              <input
                type="text"
                value={positionOffered}
                onChange={e => setPositionOffered(e.target.value)}
                placeholder="e.g. Pipe Welder 6G"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Salary & Contract Terms
            </label>
            <textarea
              rows={2}
              value={terms}
              onChange={e => setTerms(e.target.value)}
              placeholder="e.g. Basic Salary: 1500 AED + Food + Accommodation + 2-Year Contract"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Signed Proposal / Agreement PDF Link
            </label>
            <input
              type="url"
              value={agreementPdfUrl}
              onChange={e => setAgreementPdfUrl(e.target.value)}
              placeholder="https://... / docs / signed_offer.pdf"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Mandatory Audio / Video Confirmation Proof
            </label>
            <input
              type="url"
              value={recordingUrl}
              onChange={e => setRecordingUrl(e.target.value)}
              placeholder="https://... / audio / proposal_acceptance.mp3"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
            >
              {loading ? 'Saving...' : 'Save Step 8 Agreement'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
