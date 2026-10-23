import { useState, useEffect } from 'react';
import { 
  X, Send, UserCheck, 
  CheckCircle2, Briefcase, AlertTriangle, ExternalLink
} from 'lucide-react';
import { apiInitiateStaffHeadTransfer, apiGetStaffMembers, getCurrentUser } from '../../utils/api';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';

const DEPARTMENTS = [
  { value: 'VISA_PROCESSING', label: 'Visa Processing Desk', stage: 'VISA_PROCESSING' },
  { value: 'PRE_VIVA', label: 'Pre-Viva Verification Desk', stage: 'PRE_VIVA' },
  { value: 'CALLING_STAFF', label: 'Operations & Calling Desk', stage: 'CALLING_SCREENING' },
  { value: 'MEDICAL_PROCESS', label: 'Medical Verification Desk', stage: 'MEDICAL_PROCESS' },
  { value: 'DEPLOYMENT', label: 'Flight & Deployment Desk', stage: 'DEPLOYMENT' },
];

export default function StaffHeadTransferModal({ 
  isOpen, 
  onClose, 
  lead, 
  onUpdated,
  onOpenAdvanceDesk 
}) {
  if (!isOpen || !lead) return null;

  const currentUser = getCurrentUser() || {};
  const [users, setUsers] = useState([]);
  const [targetDepartment, setTargetDepartment] = useState('VISA_PROCESSING');
  const [toUserId, setToUserId] = useState('');
  const [staffHeadInstructions, setStaffHeadInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  // Check Step 8 Advance Gate
  const billBook = lead.billBook || {};
  const paymentDetails = lead.paymentDetails || {};
  const totalReceived = Number(billBook.totalReceived || paymentDetails.advancePaid || 0);
  const isAdvanceConfirmed = 
    totalReceived > 0 || 
    paymentDetails.afterAdvanceConfirmed === true ||
    (lead.confirmations || []).some(c => 
      (c.docType === 'AFTER_ADVANCE_CONFIRMATION' || c.docType === 'ADVANCE_RECEIPT') && 
      (c.status === 'CLIENT_CONFIRMED' || c.status === 'SHARED')
    );

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

  const filteredUsers = users.filter(u => {
    if (!targetDepartment) return true;
    if (targetDepartment === 'VISA_PROCESSING') return u.role === 'VISA_MANAGER' || u.role === 'ADMIN' || u.role === 'STAFF_HEAD';
    if (targetDepartment === 'PRE_VIVA') return u.role === 'PRE_VISA_MANAGER' || u.role === 'ADMIN';
    if (targetDepartment === 'CALLING_STAFF') return u.role === 'CALLING_STAFF' || u.role === 'STAFF_HEAD';
    return true;
  });

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!isAdvanceConfirmed) {
      showErrorAlert('Advance payment verify hona aniwarya hai pehle! Please verify advance payment before transferring.');
      return;
    }

    if (!staffHeadInstructions.trim()) {
      showErrorAlert('Staff Head ke nirdesh (Instructions) likhna aniwarya hai!');
      return;
    }

    setLoading(true);
    try {
      const selectedUser = users.find(u => u._id === toUserId);
      const selectedDept = DEPARTMENTS.find(d => d.value === targetDepartment);

      await apiInitiateStaffHeadTransfer(lead._id, {
        toUserId: toUserId || undefined,
        toRole: selectedUser?.role || targetDepartment,
        toStage: selectedDept?.stage || 'VISA_PROCESSING',
        targetDepartment,
        staffHeadInstructions: staffHeadInstructions.trim()
      });

      showSuccessAlert(
        `File transfer successfully initiated for ${lead.candidateName}! Receiving staff will now contact client and verify receiving.`
      );
      onClose();
      if (onUpdated) onUpdated();
    } catch (err) {
      showErrorAlert(err.message || 'Failed to initiate Staff Head transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header - Strictly NO 'Step 9' */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 text-white shrink-0 shadow-md">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="p-2.5 bg-white/10 rounded-2xl shrink-0 backdrop-blur-xs">
              <Send className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black truncate">Staff Head File Transfer</h2>
              <p className="text-xs text-purple-100 opacity-90 truncate">
                Departmental Transfer Under Staff Head Direction & Advance Verification
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Candidate Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-400 font-medium">Candidate: </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{lead.candidateName}</span>
                {lead.leadId && <span className="ml-1 text-xs text-purple-600 font-mono">({lead.leadId})</span>}
              </div>
              <div className="text-xs">
                <span className="text-slate-400 font-medium">Current Stage: </span>
                <span className="font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                  {lead.currentStage || lead.stage || 'ACTIVE'}
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Trade:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{lead.trade || 'General Worker'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Country:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{lead.country || 'Gulf'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Advance Verified:</span>
                <span className={`font-black ${totalReceived > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  ₹ {totalReceived.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Advance Confirmation Gate Warning */}
          {!isAdvanceConfirmed ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl text-xs space-y-2 text-amber-900 dark:text-amber-200">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-amber-900 dark:text-amber-100 text-sm">Advance Confirmation Pending!</h4>
                  <p className="mt-0.5 leading-relaxed">
                    Niyam ke anushar Staff Head file transfer karne se pehle Step 8 advance payment confirm aur verify hona aniwarya hai.
                  </p>
                </div>
              </div>
              {onOpenAdvanceDesk && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdvanceDesk(lead);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Verify Advance in Bill Book / Desk</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <b>Advance Payment Confirmed (₹{totalReceived.toLocaleString()}):</b> Gate cleared. Staff Head can now assign file with directions.
              </span>
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-4">
            
            {/* Target Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Target Department / Desk *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEPARTMENTS.map(dept => (
                  <button
                    type="button"
                    key={dept.value}
                    onClick={() => setTargetDepartment(dept.value)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center space-x-2 cursor-pointer ${
                      targetDepartment === dept.value
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-900 dark:text-purple-200 font-bold ring-2 ring-purple-400/40'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className={`w-4 h-4 shrink-0 ${targetDepartment === dept.value ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className="truncate">{dept.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Specific Staff Member */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Assign Specific Staff Member (Optional)
              </label>
              <select
                value={toUserId}
                onChange={e => setToUserId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Let Department Officer Accept (Open for Department) --</option>
                {filteredUsers.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role}) - {u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Staff Head Mandatory Instructions */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Staff Head Ke Nirdesh (Mandatory Instructions) *
                </label>
                <span className="text-[11px] text-purple-600 font-semibold">
                  Receiving staff will see these instructions
                </span>
              </div>
              <textarea
                rows={3}
                value={staffHeadInstructions}
                onChange={e => setStaffHeadInstructions(e.target.value)}
                placeholder="Udaharan: Candidate ka advance Jama ho chuka hai. Sambandhit staff turant client se call par baat kare, Receiving PDF share kare, aur audio call recording upload karke file confirm kare..."
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Responsibility Notice */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-[11.5px] text-slate-600 dark:text-slate-300 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Two-Party Handover Protocol:</span>
              </div>
              <p>
                File transfer hone par receiving staff ke paas jayegi. Receiving staff client se sampark karke, confirmation PDF bhej kar, aur recording save karke file ki sampurna jimmedari lega. Dono staff ke paas complete record rahega.
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
                disabled={loading || !isAdvanceConfirmed || !staffHeadInstructions.trim()}
                className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition inline-flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5 text-amber-300" />
                <span>{loading ? 'Transferring...' : 'Send File With Instructions'}</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
