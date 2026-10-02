import React, { useState, useEffect } from 'react';
import { X, Send, ArrowRight, UserCheck, AlertCircle, ShieldAlert } from 'lucide-react';
import { apiRequestTransfer, apiGetStaffMembers, getCurrentUser } from '../../utils/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';

export default function TransferModal({ isOpen, onClose, lead, onUpdated }) {
  if (!isOpen || !lead) return null;

  const currentUser = getCurrentUser() || {};
  const [users, setUsers] = useState([]);
  const [toUserId, setToUserId] = useState('');
  const [toRole, setToRole] = useState('INTERVIEW_OFFICER');
  const [toStage, setToStage] = useState('');
  const [reason, setReason] = useState('');
  const [pendingTasks, setPendingTasks] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiGetStaffMembers();
      if (res && res.users) {
        setUsers(res.users);
      } else if (Array.isArray(res)) {
        setUsers(res);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!toUserId) {
      showErrorAlert('Please select a target recipient for file handover');
      return;
    }
    if (!reason.trim()) {
      showErrorAlert('Please provide a mandatory reason for transfer handover');
      return;
    }

    setLoading(true);
    try {
      const selectedUser = users.find(u => u._id === toUserId);
      await apiRequestTransfer(lead._id, {
        toUserId,
        toRole: selectedUser?.role || toRole,
        toStage: toStage || lead.stage,
        reason,
        pendingTasks
      });
      showSuccessAlert(`Handover request sent to ${selectedUser?.name || 'Staff'}! The file will be pending until they accept.`);
      onClose();
      if (onUpdated) onUpdated();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to submit transfer request');
    } finally {
      setLoading(false);
    }
  };

  const activeHolderName = lead.activeHolder?.name || lead.assignedTo?.name || 'Unassigned';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Send className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Initiate File Handover Protocol</h2>
              <p className="text-xs text-blue-100 opacity-90">
                Single Active File Holder Transfer (Two-Party Acceptance)
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

        {/* Current State Info */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-400">Candidate: </span>
                <span className="font-bold text-slate-800 dark:text-white">{lead.name || lead.candidateName}</span>
                {lead.candidateCode && <span className="ml-1 text-blue-600 font-mono">({lead.candidateCode})</span>}
              </div>
              <div>
                <span className="text-slate-400">Current Stage: </span>
                <span className="font-bold text-indigo-600">{lead.stage || lead.currentStage || 'NEW'}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Current Active Holder:</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded font-bold">
                {activeHolderName}
              </span>
            </div>
          </div>

          {lead.pendingTransfer?.hasPending && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Pending Transfer Exists: </span>
                This file is currently awaiting acceptance from recipient. Submitting a new handover will re-route the transfer.
              </div>
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Transfer To Staff Member *
              </label>
              <select
                value={toUserId}
                onChange={e => {
                  setToUserId(e.target.value);
                  const sel = users.find(u => u._id === e.target.value);
                  if (sel) setToRole(sel.role);
                }}
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">-- Select Recipient Officer / Desk --</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role}) - {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Target Stage (Optional - Leave blank to maintain current)
              </label>
              <select
                value={toStage}
                onChange={e => setToStage(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Keep Current Stage ({lead.stage})</option>
                <option value="CALLING_QUEUE">Calling & Screening Desk</option>
                <option value="INITIAL_INTERVIEW">Interview Panel Desk</option>
                <option value="MEDICAL_PROCESS">Medical Center Desk</option>
                <option value="COMPANY_CONFIRMATION">Step 8: Company Proposal Desk</option>
                <option value="ADVANCE_PAYMENT">Advance Collection / Accounts Desk</option>
                <option value="PRE_VIVA">Pre-Viva Verification Desk</option>
                <option value="VISA_APPLY">Visa Processing Desk</option>
                <option value="VIVA_INTERVIEW">Viva Examination Desk</option>
                <option value="DEPLOYMENT">Flight & Deployment Desk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Handover Reason & Checklist *
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Passport verified, candidate cleared interview, sending to Medical desk..."
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Pending Tasks for Recipient (Optional)
              </label>
              <input
                type="text"
                value={pendingTasks}
                onChange={e => setPendingTasks(e.target.value)}
                placeholder="e.g. Schedule GAMCA slot at Delhi Center"
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
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition inline-flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Sending...' : 'Send Handover Request'}</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
