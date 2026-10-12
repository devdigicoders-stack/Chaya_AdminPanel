import { useState } from 'react';
import { 
  X, CheckCircle2, Building2, Send} from 'lucide-react';
import { apiUpdateCompanyConfirmation } from '../../utils/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';

export default function CompanyConfirmationModal({ isOpen, onClose, lead, onUpdated }) {
  if (!isOpen || !lead) return null;

  const currentConf = lead.companyConfirmation || {};

  const [status, setStatus] = useState(currentConf.status || 'COMPANY_CONFIRMED');
  const [companyName, setCompanyName] = useState(currentConf.companyName || lead.trade?.company || 'Al Habtoor Group LLC');
  const [country, setCountry] = useState(currentConf.country || lead.preferredCountry || 'UAE');
  const [city, setCity] = useState(currentConf.city || lead.preferredCity || 'Dubai');
  const [positionOffered, setPositionOffered] = useState(currentConf.positionOffered || lead.trade?.tradeName || lead.trade?.name || lead.trade || 'General Worker');
  const [salary, setSalary] = useState(currentConf.salary || '1,500 AED + Overtime');
  const [dutyHours, setDutyHours] = useState(currentConf.dutyHours || '8 Hours / Day (6 Days) + Overtime');
  const [contractDuration, setContractDuration] = useState(currentConf.contractDuration || '2 Years Renewable');
  
  // Facilities
  const [accommodation, setAccommodation] = useState(currentConf.accommodation || 'Company Provided');
  const [food, setFood] = useState(currentConf.food || 'Company Provided / Allowance');
  const [transport, setTransport] = useState(currentConf.transport || 'Company Provided');
  const [insurance, setInsurance] = useState(currentConf.insurance || 'Company Provided');

  // Step 7 Conditions Checklists
  const [jobConditionsExplained, setJobConditionsExplained] = useState(currentConf.jobConditionsExplained || false);
  const [processConditionsExplained, setProcessConditionsExplained] = useState(currentConf.processConditionsExplained || false);
  const [clientAccepted, setClientAccepted] = useState(currentConf.clientAccepted || currentConf.status === 'AGREEMENT_ACCEPTED');

  const [agreementPdfUrl, setAgreementPdfUrl] = useState(currentConf.agreementPdfUrl || '');
  const [recordingUrl, setRecordingUrl] = useState(currentConf.recordingUrl || '');
  const [remarks, setRemarks] = useState(currentConf.remarks || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showErrorAlert('Company name is required');
      return;
    }

    const isAccepting = status === 'AGREEMENT_ACCEPTED' || clientAccepted;
    if (isAccepting) {
      if (!recordingUrl.trim()) {
        showErrorAlert('Client Confirmation Call Recording URL is MANDATORY before accepting agreement and advancing to Step 8!');
        return;
      }
      if (!jobConditionsExplained || !processConditionsExplained) {
        showErrorAlert('Please confirm that both Job and Process conditions were explained clearly to the client!');
        return;
      }
    }

    setLoading(true);
    try {
      await apiUpdateCompanyConfirmation(lead._id, {
        status: isAccepting ? 'AGREEMENT_ACCEPTED' : status,
        clientAccepted: isAccepting,
        companyName,
        country,
        city,
        positionOffered,
        salary,
        dutyHours,
        contractDuration,
        accommodation,
        food,
        transport,
        insurance,
        jobConditionsExplained,
        processConditionsExplained,
        agreementPdfUrl,
        recordingUrl,
        remarks
      });
      showSuccessAlert(
        isAccepting
          ? 'Step 7 Complete: Proposal Accepted! Candidate moved to Step 8: Advance Collection.'
          : 'Company Confirmation & Proposal updated successfully!'
      );
      onClose();
      if (onUpdated) onUpdated();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to update company confirmation');
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const phone = (lead.phone || '').replace(/[^0-9+]/g, '');
    const text = `*CHHAYA INTERNATIONAL PVT LTD*\n*EMPLOYMENT PROPOSAL & AGREEMENT (STEP 7)*\n----------------------------------------\nDear *${lead.candidateName || lead.name}*,\nYour profile has been confirmed by the overseas employer:\n\n🏢 Company: ${companyName}\n📍 Location: ${country} - ${city}\n🛠️ Position: ${positionOffered}\n💰 Salary: ${salary}\n⏰ Duty Hours: ${dutyHours}\n📄 Contract: ${contractDuration}\n\n*Included Facilities:*\n• Accommodation: ${accommodation}\n• Food: ${food}\n• Transport: ${transport}\n• Insurance: ${insurance}\n\nPlease confirm your acceptance to proceed with Step 8 Advance Collection & Visa Processing.`;
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Building2 className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Step 7: Company Confirmation & Proposal</h2>
              <p className="text-xs text-teal-100 opacity-90">
                {lead.name || lead.candidateName} • Trade: {positionOffered} • ID: {lead.leadId || lead._id}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Status Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Workflow Status *
            </label>
            <select
              value={status}
              onChange={e => {
                setStatus(e.target.value);
                if (e.target.value === 'AGREEMENT_ACCEPTED') setClientAccepted(true);
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="SENT_TO_COMPANY">SENT_TO_COMPANY (File Forwarded for Employer Review)</option>
              <option value="COMPANY_CONFIRMED">COMPANY_CONFIRMED (Employer Accepted Profile)</option>
              <option value="PROPOSAL_SENT">PROPOSAL_SENT (Proposal / Agreement Shared with Client)</option>
              <option value="AGREEMENT_ACCEPTED">AGREEMENT_ACCEPTED (Client Accepted ➔ Move to Step 8 Advance)</option>
              <option value="REJECTED">REJECTED (Candidate Declined Offer)</option>
            </select>
          </div>

          {/* Employer & Trade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Employer / Company *
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

          {/* Location & Salary */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Country & City
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="UAE"
                  className="w-1/2 text-xs px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Dubai"
                  className="w-1/2 text-xs px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Salary & Allowances
              </label>
              <input
                type="text"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                placeholder="1500 AED + Overtime"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Working Hours & Contract */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Duty Hours
              </label>
              <input
                type="text"
                value={dutyHours}
                onChange={e => setDutyHours(e.target.value)}
                placeholder="8 Hours / Day (6 Days)"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Contract Period
              </label>
              <input
                type="text"
                value={contractDuration}
                onChange={e => setContractDuration(e.target.value)}
                placeholder="2 Years Renewable"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Facilities Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Employer Provided Amenities:</span>
            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={accommodation === 'Company Provided'} onChange={e => setAccommodation(e.target.checked ? 'Company Provided' : 'Self')} />
                Accommodation Provided
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={food.includes('Provided')} onChange={e => setFood(e.target.checked ? 'Company Provided / Allowance' : 'Self')} />
                Food / Allowance Provided
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={transport === 'Company Provided'} onChange={e => setTransport(e.target.checked ? 'Company Provided' : 'Self')} />
                Transportation Provided
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={insurance === 'Company Provided'} onChange={e => setInsurance(e.target.checked ? 'Company Provided' : 'Self')} />
                Medical & Insurance Included
              </label>
            </div>
          </div>

          {/* WhatsApp Share Button */}
          <div>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Share Proposal / Agreement via WhatsApp
            </button>
          </div>

          {/* Conditions Explained Checklists (Mandatory per Step 7) */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3 rounded-xl space-y-2">
            <span className="font-bold text-xs text-amber-900 dark:text-amber-200 block">
              Step 7 Mandatory Conditions & Verification Checklist:
            </span>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={jobConditionsExplained}
                onChange={e => setJobConditionsExplained(e.target.checked)}
                className="mt-0.5 rounded text-teal-600"
              />
              <span><strong>Job & Company Conditions:</strong> Working hours, duties, food, accommodation, overtime aur 2-year contract terms candidate ko clear samjhaye gaye.</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={processConditionsExplained}
                onChange={e => setProcessConditionsExplained(e.target.checked)}
                className="mt-0.5 rounded text-teal-600"
              />
              <span><strong>Process & Visa Terms:</strong> Visa filing timeline, document verification aur Step 8 advance collection terms candidate ko samjhaye gaye.</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={clientAccepted}
                onChange={e => {
                  setClientAccepted(e.target.checked);
                  if (e.target.checked) setStatus('AGREEMENT_ACCEPTED');
                }}
                className="mt-0.5 rounded text-teal-600"
              />
              <span><strong>Client Accepted Proposal / Agreement:</strong> Candidate ne company offer, salary aur conditions ko sweekar kar liya hai.</span>
            </label>
          </div>

          {/* Agreement PDF URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Signed Proposal / Agreement Document Link (Optional)
            </label>
            <input
              type="url"
              value={agreementPdfUrl}
              onChange={e => setAgreementPdfUrl(e.target.value)}
              placeholder="https://.../agreement.pdf"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          {/* Mandatory Call Recording */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Mandatory Confirmation Call Recording Link *
            </label>
            <input
              type="url"
              value={recordingUrl}
              onChange={e => setRecordingUrl(e.target.value)}
              placeholder="https://.../audio/proposal_acceptance.mp3"
              required={status === 'AGREEMENT_ACCEPTED' || clientAccepted}
              className="w-full text-xs px-3 py-2 rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Calling staff aur client ke beech proposal samjhane aur acceptance ki recording link paste karein.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-lg transition-all shadow-md flex items-center space-x-1.5"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {status === 'AGREEMENT_ACCEPTED' || clientAccepted
                      ? 'Accept & Forward to Step 8 (Advance)'
                      : 'Save Company Proposal'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
