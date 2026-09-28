import { useState, useEffect } from 'react';
import { 
  History, X, Clock, User, 
  Sparkles, Loader2} from 'lucide-react';
import { apiGetLeadHistory, apiGetLeadById } from '../../utils/api';

export default function LeadHistoryModal({ isOpen, onClose, candidate }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !candidate) return;

    const candidateId = candidate._id || candidate.id;
    if (!candidateId) return;

    setLoading(true);
    setError('');

    // Fetch full immutable audit trail from LeadHistory collection
    apiGetLeadHistory(candidateId)
      .then(res => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setHistoryList(res.data);
        } else {
          // Fallback to embedded lead document history if present
          return apiGetLeadById(candidateId).then(leadRes => {
            if (leadRes?.data?.history && leadRes.data.history.length > 0) {
              setHistoryList(leadRes.data.history);
            } else if (candidate.history && Array.isArray(candidate.history)) {
              setHistoryList(candidate.history);
            } else {
              setHistoryList([]);
            }
          });
        }
      })
      .catch(err => {
        console.error('Error fetching lead history:', err);
        setError('Could not load history from database');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, candidate]);

  if (!isOpen || !candidate) return null;

  const candidateName = candidate.candidateName || candidate.name || 'Candidate';
  const passport = candidate.passportNumber || candidate.passport || 'N/A';
  const trade = candidate.trade || 'General';
  const country = candidate.country || 'Gulf';
  const currentStage = candidate.currentStage || candidate.status || 'Active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[16px] text-white">Candidate Audit History & Lifecycle Trail</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  FRD Section 19
                </span>
              </div>
              <div className="text-[11.5px] text-slate-300 font-mono mt-0.5">
                {candidateName} • {passport}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidate Quick Profile Strip */}
        <div className="bg-slate-50 px-6 py-3 border-b border-gray-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] shrink-0">
          <div>
            <span className="text-gray-400 text-[10.5px] block font-medium">Trade Skill</span>
            <span className="font-bold text-gray-900 truncate block">{trade}</span>
          </div>
          <div>
            <span className="text-gray-400 text-[10.5px] block font-medium">Target Country</span>
            <span className="font-bold text-blue-700 truncate block">{country}</span>
          </div>
          <div>
            <span className="text-gray-400 text-[10.5px] block font-medium">Current Stage</span>
            <span className="font-bold text-purple-700 truncate block">{currentStage}</span>
          </div>
          <div>
            <span className="text-gray-400 text-[10.5px] block font-medium">Hold Status</span>
            <span className={`font-bold truncate block ${candidate.isHold ? 'text-amber-600' : 'text-emerald-700'}`}>
              {candidate.isHold ? 'ON HOLD' : 'ACTIVE PIPELINE'}
            </span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-xs">Fetching live audit trail from MongoDB database...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-600">Initial Registration Recorded</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Candidate registered in database on {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'recent date'}. No subsequent stage transitions yet.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-100 ml-4 space-y-5 pl-6">
              {historyList.map((item, idx) => {
                const actionTitle = (item.actionType || item.title || 'LIFECYCLE_ACTION').replace(/_/g, ' ');
                const remarks = item.remarks || item.desc || 'Stage updated';
                const userName = item.performedBy?.name || item.user || 'System';
                const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString('en-GB') : (item.date || 'Recent');
                const badge = item.toStage || item.badge || item.actionType || 'UPDATED';

                return (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Point */}
                    <div className="absolute -left-[35px] top-0 w-7 h-7 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-xs text-indigo-600 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>

                    {/* Card */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-200 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            Event #{historyList.length - idx}
                          </span>
                          <h4 className="font-bold text-[13.5px] text-gray-900">{actionTitle}</h4>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 self-start sm:self-auto font-mono">
                          {badge}
                        </span>
                      </div>

                      <p className="text-[12px] text-gray-600 leading-relaxed mb-2.5">
                        {remarks}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 pt-2 border-t border-gray-100 font-mono">
                        <div className="flex items-center gap-1 text-gray-600">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>Action By: <strong className="text-gray-800">{userName}</strong></span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="text-[11.5px] text-gray-500">
            Immutable Audit Trail • Live Database Synchronized
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-[12.5px] font-medium cursor-pointer transition-colors"
          >
            Close Audit Trail
          </button>
        </div>

      </div>
    </div>
  );
}
