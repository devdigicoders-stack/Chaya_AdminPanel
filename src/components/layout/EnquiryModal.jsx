import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Send, HelpCircle, Inbox, CheckCircle2, Clock, AlertCircle, 
  User, Phone, MapPin, Briefcase, Plus, MessageSquare, ArrowRight,
  Filter, Search, RefreshCw, FileText
} from 'lucide-react';
import { apiRaiseEnquiry, apiGetEnquiries, apiRespondToEnquiry, apiConvertEnquiryToLead, getCurrentUser } from '../../utils/api';
import Swal from 'sweetalert2';

export default function EnquiryModal({ isOpen, onClose, onEnquiryCreated }) {
  if (!isOpen) return null;

  const currentUser = getCurrentUser() || {};
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'raise' | 'my_raised'
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [candidateName, setCandidateName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [trade, setTrade] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [priority, setPriority] = useState('NORMAL');
  const [hasPassport, setHasPassport] = useState('UNKNOWN');

  // Response / Details modal state
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('IN_PROGRESS');

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const type = activeTab === 'my_raised' ? 'RAISED' : 'RECEIVED';
      const res = await apiGetEnquiries({ type });
      if (res?.data) {
        setEnquiries(res.data);
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'raise') {
      fetchEnquiries();
    }
  }, [activeTab, fetchEnquiries]);

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    if (!candidateName.trim() || !phone.trim() || !message.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields',
        text: 'Candidate Name, Phone, and Details are mandatory.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRaiseEnquiry({
        candidateName,
        phone,
        email,
        trade,
        city,
        category,
        subject,
        message,
        targetRole,
        priority,
        hasPassport
      });

      Swal.fire({
        icon: 'success',
        title: 'Enquiry Raised!',
        text: res.message || 'Your enquiry has been successfully logged.',
        confirmButtonColor: '#059669'
      });

      // Reset form
      setCandidateName('');
      setPhone('');
      setEmail('');
      setTrade('');
      setCity('');
      setSubject('');
      setMessage('');
      setActiveTab('my_raised');
      if (onEnquiryCreated) onEnquiryCreated();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Raise Enquiry',
        text: err.message || 'Server error occurred.',
        confirmButtonColor: '#DC2626'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedEnquiry) return;
    setSubmitting(true);
    try {
      await apiRespondToEnquiry(selectedEnquiry._id, {
        responseNote: replyText.trim(),
        status: replyStatus
      });
      Swal.fire({
        icon: 'success',
        title: 'Response Sent',
        text: 'Your response and status update have been saved.',
        confirmButtonColor: '#059669',
        timer: 1500,
        showConfirmButton: false
      });
      setReplyText('');
      setSelectedEnquiry(null);
      fetchEnquiries();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to submit response.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToLead = async (enq) => {
    const confirm = await Swal.fire({
      title: 'Convert to Candidate Lead?',
      text: `Create an official candidate lead for ${enq.candidateName} (${enq.phone}) in the active recruitment pipeline?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563EB',
      confirmButtonText: 'Yes, Convert to Lead'
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await apiConvertEnquiryToLead(enq._id);
      Swal.fire({
        icon: 'success',
        title: 'Converted!',
        text: res.message,
        confirmButtonColor: '#059669'
      });
      fetchEnquiries();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Conversion Failed',
        text: err.message
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0B1B3D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Universal Enquiry Desk</h2>
              <p className="text-xs text-blue-200">Raise or manage incoming candidate queries across all departments</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/70 px-6 pt-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('received')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'received'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Received Enquiries</span>
            </button>
            <button
              onClick={() => setActiveTab('raise')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'raise'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Raise New Enquiry</span>
            </button>
            <button
              onClick={() => setActiveTab('my_raised')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'my_raised'
                  ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>My Raised Enquiries</span>
            </button>
          </div>

          {activeTab !== 'raise' && (
            <button
              onClick={fetchEnquiries}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 p-1.5 mb-2 hover:bg-blue-50 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'raise' ? (
            <form onSubmit={handleRaiseSubmit} className="space-y-4 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Candidate Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Trade / Skill</label>
                  <input
                    type="text"
                    placeholder="e.g. Welder, Electrician, Mason"
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Gorakhpur, Patna"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Passport Available?</label>
                  <select
                    value={hasPassport}
                    onChange={(e) => setHasPassport(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="UNKNOWN">Not Known Yet</option>
                    <option value="YES">Yes, Has Passport</option>
                    <option value="NO">No, Passport Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Forward / Target Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ALL">All Roles / Open Pool</option>
                    <option value="CALLING_STAFF">Calling Staff</option>
                    <option value="STAFF_HEAD">Staff Head</option>
                    <option value="DATA_CONTROLLER">Data Controller</option>
                    <option value="INTERVIEW_PANEL">Interview Manager</option>
                    <option value="MEDICAL_DEPT">Medical Department</option>
                    <option value="ACCOUNTS">Accounts / Finance</option>
                    <option value="PRE_VISA_MANAGER">Pre-Visa Manager</option>
                    <option value="VISA_MANAGER">Visa Desk</option>
                    <option value="ADMIN">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Enquiry Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="GENERAL">General Enquiry</option>
                    <option value="JOB_VACANCY">Job Vacancy / Interview</option>
                    <option value="PASSPORT_QUERY">Passport / Documentation</option>
                    <option value="MEDICAL_QUERY">Medical / GAMCA Status</option>
                    <option value="ADVANCE_PAYMENT">Advance / Bill Book</option>
                    <option value="VISA_STATUS">Visa Issuance Query</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent / Immediate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Candidate inquiry for Dubai Pipe Welder vacancy"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Enquiry Details / Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide complete details about candidate requirement, deadline, or request..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('received')}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Raise Enquiry'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-600" />
                  <p className="text-xs">Loading enquiries...</p>
                </div>
              ) : enquiries.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-500" />
                  <p className="text-sm font-bold text-gray-700">No Enquiries Found</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    {activeTab === 'received' 
                      ? 'No incoming candidate enquiries have been routed to your desk currently.' 
                      : 'You have not raised any candidate enquiries yet.'}
                  </p>
                  <div className="mt-5">
                    <button
                      onClick={() => setActiveTab('raise')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Raise First Enquiry Now</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {enquiries.map((enq) => {
                    const isClosed = enq.status === 'RESOLVED' || enq.status === 'CLOSED' || enq.status === 'CONVERTED_TO_LEAD';
                    return (
                      <div 
                        key={enq._id}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              {enq.enquiryId}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              enq.status === 'OPEN' 
                                ? 'bg-amber-100 text-amber-800' 
                                : enq.status === 'IN_PROGRESS' 
                                ? 'bg-blue-100 text-blue-800'
                                : enq.status === 'CONVERTED_TO_LEAD'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {enq.status}
                            </span>
                            {enq.priority === 'URGENT' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                                URGENT
                              </span>
                            )}
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(enq.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900">{enq.candidateName}</h3>
                            <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {enq.phone}
                            </span>
                            {enq.trade && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                                {enq.trade}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 line-clamp-2">
                            {enq.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 pt-1">
                            <span>Raised by: <strong className="text-gray-700">{enq.raisedByName} ({enq.raisedByRole})</strong></span>
                            <span>Target: <strong className="text-gray-700">{enq.targetRole}</strong></span>
                            {enq.responses?.length > 0 && (
                              <span className="text-blue-600 font-semibold">
                                {enq.responses.length} response(s)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {enq.status !== 'CONVERTED_TO_LEAD' && (
                            <button
                              onClick={() => handleConvertToLead(enq)}
                              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                              title="Convert to Active Candidate Lead"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Convert to Lead</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedEnquiry(enq)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>View & Respond</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Enquiry Response Sub-Modal */}
        {selectedEnquiry && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
              <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Enquiry #{selectedEnquiry.enquiryId}</h3>
                  <p className="text-[11px] text-gray-400">{selectedEnquiry.candidateName} • {selectedEnquiry.phone}</p>
                </div>
                <button 
                  onClick={() => setSelectedEnquiry(null)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                  <div className="font-bold text-gray-900">Original Inquiry:</div>
                  <p className="text-gray-700">{selectedEnquiry.message}</p>
                  <div className="text-[10px] text-gray-500 pt-1">
                    Raised by {selectedEnquiry.raisedByName} on {new Date(selectedEnquiry.createdAt).toLocaleString()}
                  </div>
                </div>

                {selectedEnquiry.responses?.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-bold text-gray-700">Audit & Discussion History:</div>
                    {selectedEnquiry.responses.map((r, idx) => (
                      <div key={idx} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between font-semibold text-gray-800 text-[11px]">
                          <span>{r.respondedByName} ({r.respondedByRole})</span>
                          <span className="text-[10px] text-gray-400">{new Date(r.respondedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{r.responseNote}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="block font-bold text-gray-700">Add Your Response / Resolution:</label>
                  <textarea
                    rows={3}
                    placeholder="Type update or answer for this enquiry..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="IN_PROGRESS">Keep In Progress</option>
                      <option value="RESOLVED">Mark as Resolved</option>
                      <option value="CLOSED">Close Enquiry</option>
                    </select>

                    <button
                      onClick={handleSendReply}
                      disabled={submitting || !replyText.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Saving...' : 'Submit Response'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
