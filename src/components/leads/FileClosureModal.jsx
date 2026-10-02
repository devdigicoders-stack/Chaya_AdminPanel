import React, { useState } from 'react';
import { 
  X, AlertOctagon, CheckCircle2, DollarSign, FileText, 
  HelpCircle, AlertTriangle 
} from 'lucide-react';
import { apiCloseLeadFile } from '../../utils/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';

export default function FileClosureModal({ isOpen, onClose, lead, onUpdated }) {
  if (!isOpen || !lead) return null;

  const [closureStatus, setClosureStatus] = useState(
    lead.closureStatus && lead.closureStatus !== 'ACTIVE' ? lead.closureStatus : 'CLOSED_NO_ADVANCE'
  );
  const [reason, setReason] = useState(lead.closureDetails?.reason || '');
  const [settlementAmount, setSettlementAmount] = useState(lead.closureDetails?.settlementAmount || 0);
  const [remarks, setRemarks] = useState(lead.closureDetails?.remarks || '');
  const [loading, setLoading] = useState(false);

  const totalReceived = lead.billBook?.totalReceived || lead.paymentBooking?.advanceAmount || 0;
  const balanceDue = lead.billBook?.balanceDue || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      showErrorAlert('Please provide an official reason for file closure');
      return;
    }

    if (closureStatus === 'FINAL_CLOSED' && balanceDue > 0) {
      if (!confirm(`Warning: Candidate has ₹${balanceDue} balance due in ledger. Are you sure you want to mark FINAL_CLOSED?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      await apiCloseLeadFile(lead._id, {
        closureStatus,
        reason,
        settlementAmount: parseFloat(settlementAmount) || 0,
        remarks
      });
      showSuccessAlert(`Candidate file closure updated to ${closureStatus}!`);
      onClose();
      if (onUpdated) onUpdated();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to update file closure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-700 via-red-800 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <AlertOctagon className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Formal Candidate File Closure</h2>
              <p className="text-xs text-rose-100 opacity-90">
                {lead.name || lead.candidateName} • Code: {lead.candidateCode || 'N/A'}
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
          
          {/* Current Ledger Alert */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-500 font-semibold">Total Received: </span>
              <span className="font-bold text-slate-900 dark:text-white">₹{totalReceived.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Ledger Balance: </span>
              <span className="font-bold text-amber-600">₹{balanceDue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              File Closure Type *
            </label>
            <select
              value={closureStatus}
              onChange={e => setClosureStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ACTIVE">ACTIVE (File is in progress)</option>
              <option value="CLOSED_NO_ADVANCE">CLOSED_NO_ADVANCE (Dropped/Rejected prior to advance)</option>
              <option value="REFUND_PENDING">REFUND_PENDING (Advance paid, refund to be settled)</option>
              <option value="FINANCIAL_PENDING">FINANCIAL_PENDING (Charges/fees pending resolution)</option>
              <option value="FINAL_CLOSED">FINAL_CLOSED (Deployed & settled / fully refunded)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Closure Reason *
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Candidate backed out due to family reasons / Unfit in GAMCA medical / Successful flight deployment"
              required
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {(closureStatus === 'REFUND_PENDING' || closureStatus === 'FINAL_CLOSED') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Settlement / Refund Amount (₹ INR)
              </label>
              <input
                type="number"
                value={settlementAmount}
                onChange={e => setSettlementAmount(e.target.value)}
                placeholder="0"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Remarks & Settlement Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Optional notes or account settlement references"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition"
            >
              {loading ? 'Updating...' : 'Save File Closure'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
