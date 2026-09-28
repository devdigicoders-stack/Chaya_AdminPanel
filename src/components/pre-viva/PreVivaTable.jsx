import React, { useState } from 'react';
import { Search, Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, UserCheck, RotateCcw, ArrowRight, Award, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const initialPreVivaCandidates = [
  { id: 1, code: 'PV-801', name: 'Rahul Sharma', passport: 'T1234567', job: 'Pipe Fitter', fileType: 'Move File', date: '12 Oct 2024', time: '10:00 AM', panelMember: 'Eng. Rajesh Verma', score: 85, status: 'Cleared', avatarBg: '#3B82F6' },
  { id: 2, code: 'PV-802', name: 'Mohammad Ali', passport: 'A9821034', job: 'Electrician', fileType: 'Direct File', date: '12 Oct 2024', time: '11:30 AM', panelMember: 'Tech Panel 2', score: 78, status: 'Scheduled', avatarBg: '#8B5CF6' },
  { id: 3, code: 'PV-803', name: 'Sandeep Kumar', passport: 'P3321908', job: 'Welder 6G', fileType: 'Move File', date: '13 Oct 2024', time: '02:00 PM', panelMember: 'Welding Inspector', score: 62, status: 'Not Cleared', avatarBg: '#EF4444' },
  { id: 4, code: 'PV-804', name: 'Arif Khan', passport: 'K4432190', job: 'AC Technician', fileType: 'Move File', date: '13 Oct 2024', time: '03:30 PM', panelMember: 'Eng. Rajesh Verma', score: 88, status: 'Cleared', avatarBg: '#10B981' },
  { id: 5, code: 'PV-805', name: 'Rajesh Patel', passport: 'M8899001', job: 'Plumber', fileType: 'Direct File', date: '14 Oct 2024', time: '10:00 AM', panelMember: 'Tech Panel 1', score: 70, status: 'Pending Review', avatarBg: '#F59E0B' },
  { id: 6, code: 'PV-806', name: 'Vikram Singh', passport: 'R6543210', job: 'Heavy Driver', fileType: 'Move File', date: '14 Oct 2024', time: '11:30 AM', panelMember: 'Driving Assessor', score: 82, status: 'Cleared', avatarBg: '#06B6D4' },
];

export default function PreVivaTable() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState(initialPreVivaCandidates);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals
  const [evalModal, setEvalModal] = useState(null);
  const [evalScore, setEvalScore] = useState(75);
  const [evalDecision, setEvalDecision] = useState('Cleared');
  const [evalRemarks, setEvalRemarks] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const filtered = candidates.filter((c) => {
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.passport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.job.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.panelMember.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleSaveEvaluation = (e) => {
    e.preventDefault();
    if (!evalModal) return;

    setCandidates(
      candidates.map((c) =>
        c.id === evalModal.id
          ? {
              ...c,
              score: Number(evalScore),
              status: evalDecision
            }
          : c
      )
    );

    if (evalDecision === 'Cleared') {
      showToast(`Candidate ${evalModal.name} CLEARED Pre-Viva with ${evalScore}/100! File ready for Step 16: Visa Management.`);
    } else {
      showToast(`Candidate ${evalModal.name} marked ${evalDecision}. Session flagged for delay/retest review.`);
    }

    setEvalModal(null);
    setEvalRemarks('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Cleared':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Cleared</span>
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shadow-2xs">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Scheduled</span>
          </span>
        );
      case 'Not Cleared':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>Not Cleared</span>
          </span>
        );
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Pending Review</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
      
      {/* Toast */}
      {toastMsg && (
        <div className="m-4 p-3.5 rounded-xl bg-emerald-600 text-white shadow-md flex items-center gap-2.5 text-[13px] font-medium animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filters & Tabs Row */}
      <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
        
        {/* Quick Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
          {[
            { key: 'All', label: 'All Candidates', count: candidates.length },
            { key: 'Cleared', label: 'Cleared', count: candidates.filter((c) => c.status === 'Cleared').length },
            { key: 'Scheduled', label: 'Scheduled', count: candidates.filter((c) => c.status === 'Scheduled').length },
            { key: 'Not Cleared', label: 'Need Retest', count: candidates.filter((c) => c.status === 'Not Cleared').length },
            { key: 'Pending Review', label: 'Pending Review', count: candidates.filter((c) => c.status === 'Pending Review').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-gray-200/70 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, trade, passport, panel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>

          {(searchTerm || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
              className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* Pre-Viva Table */}
      <div className="overflow-x-auto min-h-0">
        <table className="w-full text-left border-collapse min-w-[1180px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[22%] min-w-[210px]">Candidate & Passport</th>
              <th className="py-3.5 px-4 w-[18%] min-w-[170px]">Trade & File Origin</th>
              <th className="py-3.5 px-4 w-[16%] min-w-[160px]">Pre-Viva Schedule</th>
              <th className="py-3.5 px-4 w-[16%] min-w-[160px]">Assigned Panel</th>
              <th className="py-3.5 px-4 w-[12%] min-w-[120px] text-center">Score</th>
              <th className="py-3.5 px-4 w-[12%] min-w-[120px] text-center">Readiness</th>
              <th className="py-3.5 px-4 w-[14%] min-w-[180px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[13px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No pre-viva candidates match your current filter.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/20 transition-colors">
                  
                  {/* 1. Candidate & Passport */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full text-white text-[13px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: row.avatarBg }}
                      >
                        {row.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-[13.5px] leading-snug whitespace-nowrap">
                          {row.name}
                        </div>
                        <div className="text-[11.5px] text-gray-500 font-mono mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                          <span>{row.passport}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-blue-600 font-medium">{row.code}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Trade & File Origin */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900 text-[13px] whitespace-nowrap">
                      {row.job}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold border mt-0.5 whitespace-nowrap ${
                      row.fileType === 'Move File'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {row.fileType} (Step 15)
                    </span>
                  </td>

                  {/* 3. Pre-Viva Schedule */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 font-medium text-gray-800 text-[12.5px] whitespace-nowrap">
                      <CalendarIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{row.date}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5 whitespace-nowrap">
                      Time: <span className="font-semibold text-gray-700">{row.time}</span>
                    </div>
                  </td>

                  {/* 4. Assigned Panel */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-[12.5px] whitespace-nowrap">
                      {row.panelMember}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">
                      Technical Assessor
                    </div>
                  </td>

                  {/* 5. Score */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className={`font-mono font-bold text-[13.5px] ${
                      row.score >= 70 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {row.score} / 100
                    </span>
                  </td>

                  {/* 6. Readiness Status */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(row.status)}
                  </td>

                  {/* 7. Actions */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                      
                      {/* Evaluate / Update Score Button */}
                      <button
                        onClick={() => {
                          setEvalModal(row);
                          setEvalScore(row.score);
                          setEvalDecision(row.status === 'Not Cleared' ? 'Not Cleared' : 'Cleared');
                        }}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Evaluate Candidate Performance"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>Assess</span>
                      </button>

                      {/* If Cleared: Direct transfer to Step 16 Visa Apply */}
                      {row.status === 'Cleared' ? (
                        <button
                          onClick={() => navigate('/visa/apply')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap hover:shadow"
                          title="Candidate Cleared: Move file to Step 16 Visa Apply"
                        >
                          <span>Apply Visa</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/pre-viva/delay-confirmations')}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                          title="Manage Viva Delay or Reschedule"
                        >
                          Reschedule
                        </button>
                      )}

                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white mt-auto">
        <div className="text-[12.5px] text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-900">{filtered.length}</span> of <span className="font-bold text-gray-900">{candidates.length}</span> pre-viva candidates
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 text-[12px] hover:bg-gray-50 font-medium cursor-pointer">
            Previous
          </button>
          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[12px] font-bold">1</span>
          <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 text-[12px] hover:bg-gray-50 font-medium cursor-pointer">
            Next
          </button>
        </div>
      </div>

      {/* Assessment Modal */}
      {evalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-[15px]">Pre-Viva Technical Evaluation</h3>
              </div>
              <button onClick={() => setEvalModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>
            
            <form onSubmit={handleSaveEvaluation} className="p-6 space-y-4 text-[13px]">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">{evalModal.name} • {evalModal.job}</div>
                <div className="text-gray-600 font-mono text-[11.5px]">Passport: {evalModal.passport} • Origin: {evalModal.fileType}</div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Assessment Score (out of 100) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={evalScore}
                  onChange={(e) => setEvalScore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Readiness Verdict *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEvalDecision('Cleared')}
                    className={`py-2.5 rounded-xl text-[12.5px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      evalDecision === 'Cleared'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                        : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Cleared (Ready for Visa)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEvalDecision('Not Cleared')}
                    className={`py-2.5 rounded-xl text-[12.5px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      evalDecision === 'Not Cleared'
                        ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-100'
                        : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Not Cleared (Hold)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Assessor Feedback / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Excellent welding standards, passport & GAMCA verified..."
                  value={evalRemarks}
                  onChange={(e) => setEvalRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEvalModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Submit Verdict
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
