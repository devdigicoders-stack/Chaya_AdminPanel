import { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, Inbox, Send, CheckCircle2, Clock, 
  RefreshCw, AlertCircle, Search, ChevronRight,
  Check, X, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  apiGetTransferInbox, 
  apiGetTransferOutbox, 
  apiAcceptTransfer, 
  apiReturnTransfer,
  apiGetLeads,
  apiGetUsers,
  apiRequestTransfer
} from '../../utils/api';
import LeadHistoryModal from '../../components/leads/LeadHistoryModal';

export default function TransferInboxPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('INBOX'); // 'INBOX' or 'OUTBOX'
  const [inboxLeads, setInboxLeads] = useState([]);
  const [outboxLeads, setOutboxLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [historyCandidate, setHistoryCandidate] = useState(null);

  // New Transfer Modal
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [allMyLeads, setAllMyLeads] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetStage, setTargetStage] = useState('MEDICAL_PROCESS');
  const [transferReason, setTransferReason] = useState('');
  const [pendingTasks, setPendingTasks] = useState('');

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const [inboxRes, outboxRes] = await Promise.allSettled([
        apiGetTransferInbox(),
        apiGetTransferOutbox()
      ]);

      if (inboxRes.status === 'fulfilled' && inboxRes.value?.data) {
        setInboxLeads(inboxRes.value.data);
      }
      if (outboxRes.status === 'fulfilled' && outboxRes.value?.data) {
        setOutboxLeads(outboxRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const openNewTransferModal = async () => {
    setShowNewTransferModal(true);
    try {
      const [leadsRes, usersRes] = await Promise.allSettled([
        apiGetLeads({ limit: 100 }),
        apiGetUsers()
      ]);
      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        setAllMyLeads(leadsRes.value.data);
        if (leadsRes.value.data.length > 0) setSelectedLeadId(leadsRes.value.data[0]._id);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        setStaffUsers(usersRes.value.data.filter(u => u.isActive !== false));
        if (usersRes.value.data.length > 0) setTargetUserId(usersRes.value.data[0]._id);
      }
    } catch (err) {
      console.error('Error opening transfer modal:', err);
    }
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!selectedLeadId) return;

    try {
      setActionLoadingId('INIT');
      const targetUser = staffUsers.find(u => u._id === targetUserId);
      const res = await apiRequestTransfer(selectedLeadId, {
        toUserId: targetUserId,
        toRole: targetUser?.role || 'STAFF',
        toStage: targetStage,
        reason: transferReason.trim() || 'Workflow stage transition',
        pendingTasks: pendingTasks.trim()
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Transfer Requested',
          text: 'File transfer has been sent for two-party acceptance.',
          confirmButtonColor: '#2563EB'
        });
        setShowNewTransferModal(false);
        setTransferReason('');
        setPendingTasks('');
        loadTransfers();
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Could Not Transfer',
          text: res?.message || 'Failed to initiate transfer.',
          confirmButtonColor: '#EF4444'
        });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#EF4444' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Accept Transfer Action
  const handleAccept = async (lead) => {
    const confirm = await Swal.fire({
      title: 'Accept File Responsibility?',
      html: `You are about to accept file for <b>${lead.candidateName}</b> from <b>${lead.pendingTransfer?.fromUserName || 'Previous Staff'}</b>.<br><br>
             <span class="text-xs text-blue-700 bg-blue-50 p-2 rounded block">
             Per FRD Section 1 & 7: You will become the sole Active File Holder and assume full handling responsibility.
             </span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Accept File',
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#64748B'
    });

    if (!confirm.isConfirmed) return;

    setActionLoadingId(lead._id);
    try {
      const res = await apiAcceptTransfer(lead._id);
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'File Accepted!',
          text: `You are now the active file holder for ${lead.candidateName}.`,
          confirmButtonColor: '#10B981'
        });
        loadTransfers();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: res?.message, confirmButtonColor: '#EF4444' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.message, confirmButtonColor: '#EF4444' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Return Transfer Action
  const handleReturn = async (lead) => {
    const { value: reason } = await Swal.fire({
      title: 'Return File to Sender?',
      html: `File for <b>${lead.candidateName}</b> will be returned to <b>${lead.pendingTransfer?.fromUserName || 'Sender'}</b>.<br>Please enter return reason:`,
      input: 'text',
      inputPlaceholder: 'e.g. Missing medical report, incorrect documents, wrong department...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Return File',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B'
    });

    if (!reason) return;

    setActionLoadingId(lead._id);
    try {
      const res = await apiReturnTransfer(lead._id, reason);
      if (res?.success) {
        Swal.fire({
          icon: 'info',
          title: 'File Returned',
          text: `File has been returned to ${lead.pendingTransfer?.fromUserName}.`,
          confirmButtonColor: '#2563EB'
        });
        loadTransfers();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: res?.message, confirmButtonColor: '#EF4444' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.message, confirmButtonColor: '#EF4444' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const currentList = activeTab === 'INBOX' ? inboxLeads : outboxLeads;
  const filteredList = currentList.filter(l => {
    const name = (l.candidateName || '').toLowerCase();
    const id = (l.leadId || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || id.includes(q);
  });

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">File Transfers</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Transfer Inbox & Outbox
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              FRD Section 1 & 7
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Two-Party File Responsibility Protocol • Single Active Holder Handover
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewTransferModal}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Request Transfer</span>
          </button>
          <button
            onClick={loadTransfers}
            disabled={loading}
            className="h-9 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Informational Banner */}
      <div className="p-3.5 mb-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[12px] text-amber-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Two-Party Transfer Rule:</span> Simply requesting a transfer does not change responsibility. The receiving staff must inspect and click <b>Accept File</b>. Until accepted, the sender remains the responsible active holder.
        </div>
      </div>

      {/* 3. Segmented Navigation (Inbox vs Outbox) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab('INBOX')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'INBOX'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Incoming Transfers (Inbox)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              inboxLeads.length > 0 ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {inboxLeads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('OUTBOX')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'OUTBOX'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Outgoing Requests (Outbox)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-gray-200 text-gray-700">
              {outboxLeads.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or ID..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4. Table / List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs">Loading transfer queue from MongoDB...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="font-bold text-gray-800 text-sm">No Pending Transfers</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'INBOX' 
                ? 'All incoming file transfers have been accepted or returned.'
                : 'You have no outgoing file transfer requests awaiting acceptance.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200 uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Transfer From</th>
                  <th className="py-3 px-4">Target Role / Stage</th>
                  <th className="py-3 px-4">Reason & Tasks</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredList.map((lead) => {
                  const pt = lead.pendingTransfer || {};
                  const isActionBusy = actionLoadingId === lead._id;

                  return (
                    <tr key={lead._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Candidate */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-[13px]">
                          {lead.candidateName}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{lead.leadId}</span>
                          <span>•</span>
                          <span>{lead.phone}</span>
                          <span>•</span>
                          <span className="text-blue-600 font-semibold">{lead.trade || 'General'}</span>
                        </div>
                      </td>

                      {/* From Staff */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">
                          {pt.fromUserName || 'System'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          Current: {lead.activeHolder?.name || 'Unassigned'}
                        </div>
                      </td>

                      {/* Target Stage */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                          {pt.toStage?.replace(/_/g, ' ') || lead.currentStage}
                        </span>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          Dept: {pt.toRole || 'Desk'}
                        </div>
                      </td>

                      {/* Reason & Tasks */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-gray-800 line-clamp-1">
                          {pt.reason || 'Handover for next stage processing'}
                        </div>
                        {pt.pendingTasks && (
                          <div className="text-[11px] text-rose-600 line-clamp-1 mt-0.5">
                            Tasks: {pt.pendingTasks}
                          </div>
                        )}
                      </td>

                      {/* Requested At */}
                      <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                        {pt.requestedAt ? new Date(pt.requestedAt).toLocaleString('en-GB') : 'Recently'}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        {activeTab === 'INBOX' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAccept(lead)}
                              disabled={isActionBusy}
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title="Accept file and become active holder"
                            >
                              {isActionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>Accept File</span>
                            </button>

                            <button
                              onClick={() => handleReturn(lead)}
                              disabled={isActionBusy}
                              className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Return file with reason"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Return</span>
                            </button>

                            <button
                              onClick={() => setHistoryCandidate(lead)}
                              className="h-8 w-8 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              title="View History Trail"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 animate-pulse" />
                              <span>Awaiting {pt.toUserName || pt.toRole}</span>
                            </span>
                            <button
                              onClick={() => setHistoryCandidate(lead)}
                              className="h-7 w-7 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              title="View History Trail"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. New Transfer Modal */}
      {showNewTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm">Initiate Two-Party File Transfer</h3>
              </div>
              <button onClick={() => setShowNewTransferModal(false)} className="text-gray-400 hover:text-gray-700 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleInitiateTransfer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Candidate File *</label>
                <select
                  required
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  {allMyLeads.map(l => (
                    <option key={l._id} value={l._id}>
                      {l.candidateName} • {l.leadId} ({l.currentStage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Target Staff / Receiver *</label>
                  <select
                    required
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {staffUsers.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Target Workflow Stage *</label>
                  <select
                    required
                    value={targetStage}
                    onChange={(e) => setTargetStage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="CALLING_SCREENING">Calling & Screening</option>
                    <option value="INITIAL_INTERVIEW">Initial Interview Panel</option>
                    <option value="MEDICAL_PROCESS">Medical Process (Bill Book)</option>
                    <option value="PRE_VISA">Receiving / Pre-Viva Desk</option>
                    <option value="VISA_PROCESSING">Visa Processing</option>
                    <option value="VIVA_PLACEMENT">Viva & Placement</option>
                    <option value="STAFF_HEAD_HANDLING">Staff Head Handling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Reason for Transfer</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Cleared selection, moving to medical..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Pending Tasks for Receiving Staff (Optional)</label>
                <textarea
                  rows={2}
                  value={pendingTasks}
                  onChange={(e) => setPendingTasks(e.target.value)}
                  placeholder="e.g. Verify original passport, collect medical fee, etc."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewTransferModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === 'INIT'}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {actionLoadingId === 'INIT' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Transfer Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Full History Audit Modal */}
      <LeadHistoryModal
        isOpen={!!historyCandidate}
        onClose={() => setHistoryCandidate(null)}
        candidate={historyCandidate}
      />
    </div>
  );
}
