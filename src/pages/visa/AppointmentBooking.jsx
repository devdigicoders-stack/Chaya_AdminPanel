import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Plus, Calendar, MapPin, Clock, X, CheckCircle2,
  Search, RotateCcw, Building, ArrowRight, ShieldCheck, Check,
  Download, FileText, Globe, Printer, AlertCircle, RefreshCw,
  Sparkles, Ticket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGetLeads, apiUpdateLead } from '../../utils/api';

export default function AppointmentBooking() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [centerFilter, setCenterFilter] = useState('All');
  const [toastMsg, setToastMsg] = useState('');

  // Fetch live candidates with visa appointments from MongoDB Atlas
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await apiGetLeads({ stage: 'ALL' });
      if (res?.success && res.data) {
        const visaLeads = res.data.filter(l => 
          ['PRE_VISA', 'VISA_PROCESSING', 'VIVA_PLACEMENT', 'COMPLETED'].includes(l.currentStage) ||
          l.visaDetails?.applicationNumber ||
          l.visaDetails?.status
        );
        const mapped = visaLeads.map((l, idx) => ({
          id: l._id,
          aptId: l.visaDetails?.applicationNumber || ('APT-' + (l.leadId ? l.leadId.replace('LEAD-', '') : (idx + 100))),
          candidate: l.candidateName,
          leadId: l.leadId,
          passportNo: l.passportNumber || 'N/A',
          job: l.trade || 'Worker',
          country: l.country || l.visaDetails?.country || 'Saudi Arabia',
          center: l.visaDetails?.embassy || 'Royal Embassy / VFS Global, Delhi',
          address: l.visaDetails?.embassy || 'VFS Global / Consular Section, New Delhi',
          date: l.visaDetails?.expectedDate ? new Date(l.visaDetails.expectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Scheduled',
          time: '10:30 AM',
          tokenNo: l.visaDetails?.applicationNumber || ('TOK-' + (l.leadId ? l.leadId.slice(-4) : '101')),
          type: l.visaDetails?.visaType || 'Biometric & Consular Stamping',
          status: l.visaDetails?.status === 'APPROVED' ? 'Completed' : (l.visaDetails?.status === 'DELAYED' ? 'Rescheduled' : 'Confirmed'),
          avatarBg: ['#3B82F6', '#8B5CF6', '#10B981', '#06B6D4', '#F59E0B'][idx % 5],
          notes: l.visaDetails?.remarks || 'Consular appointment scheduled. Passport & original documents verified.',
          rawLead: l
        }));
        setAppointments(mapped);
      }
    } catch (err) {
      console.error('Error fetching appointments from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [slipModal, setSlipModal] = useState(null);

  // New Booking Form State
  const [newCandidate, setNewCandidate] = useState('');
  const [newPassport, setNewPassport] = useState('');
  const [newJob, setNewJob] = useState('Pipe Fitter');
  const [newCountry, setNewCountry] = useState('UAE');
  const [newCenter, setNewCenter] = useState('UAE VFS Global, Delhi');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newType, setNewType] = useState('Biometric + Document Submission');
  const [newNotes, setNewNotes] = useState('');

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00 AM');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const handleCreateBooking = (e) => {
    e.preventDefault();
    if (!newCandidate || !newPassport || !newDate) return;

    const newApt = {
      id: appointments.length + 1,
      aptId: `APT-${900 + appointments.length + 1}`,
      candidate: newCandidate,
      passportNo: newPassport,
      job: newJob,
      country: newCountry,
      center: newCenter,
      address: newCenter.includes('QVC') ? 'QVC Aerocity, Worldmark 1, New Delhi' : 'VFS Shivaji Stadium, New Delhi',
      date: newDate,
      time: newTime,
      tokenNo: `${newCountry.substring(0, 3).toUpperCase()}-DEL-${Math.floor(1000 + Math.random() * 9000)}`,
      type: newType,
      status: 'Confirmed',
      avatarBg: '#3B82F6',
      notes: newNotes || 'Slot confirmed by Visa Desk. Reporting slip issued.',
    };

    setAppointments([newApt, ...appointments]);
    setShowBookModal(false);
    showToast(`Embassy slot booked successfully for ${newCandidate}! Token: ${newApt.tokenNo}`);
    
    // Reset
    setNewCandidate('');
    setNewPassport('');
    setNewDate('');
    setNewNotes('');
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!rescheduleModal || !rescheduleDate) return;

    setAppointments(prev => prev.map(a => {
      if (a.id !== rescheduleModal.id) return a;
      return {
        ...a,
        date: rescheduleDate,
        time: rescheduleTime || a.time,
        status: 'Rescheduled',
        notes: `Rescheduled to ${rescheduleDate} at ${rescheduleTime}. Reason: ${rescheduleReason || 'Operational re-slotting'}`
      };
    }));

    showToast(`Appointment rescheduled for ${rescheduleModal.candidate} to ${rescheduleDate}!`);
    setRescheduleModal(null);
    setRescheduleReason('');
  };

  const handleMarkCompleted = (apt) => {
    setAppointments(prev => prev.map(a => {
      if (a.id !== apt.id) return a;
      return {
        ...a,
        status: 'Completed',
        notes: 'Biometrics and iris scan completed at center. File dispatched for embassy stamping.'
      };
    }));
    showToast(`Biometrics completed for ${apt.candidate}! Dossier ready for Step 16 Visa Apply.`);
  };

  const filtered = appointments.filter(a => {
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    const matchCenter = centerFilter === 'All' || a.center.toLowerCase().includes(centerFilter.toLowerCase());
    const matchSearch =
      a.candidate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.passportNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.aptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tokenNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.job.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.center.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchCenter && matchSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Confirmed Slot</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap shadow-2xs">
            <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Biometrics Completed</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Pending Slot</span>
          </span>
        );
      case 'Rescheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Rescheduled</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-12 space-y-6">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/visa/all')} className="hover:text-blue-600 cursor-pointer">Visa Desk</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Biometric Appointments</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Embassy & Biometric Appointment Booking Desk
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => alert('Downloading official Appointment Slips batch (PDF/Zip)...')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Download Slips</span>
          </button>

          <button
            onClick={() => setShowBookModal(true)}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Slot</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white shadow-md flex items-center gap-2.5 text-xs font-medium mb-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 3. Top Metrics Row (5 Cards - Clean, Zero Overflow) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Total Bookings */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Active
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-gray-900 leading-tight">{appointments.length}</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Total Booked Slots</div>
          </div>
        </div>

        {/* Confirmed Slots */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Ready
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-emerald-600 leading-tight">
              {appointments.filter(a => a.status === 'Confirmed').length}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Confirmed Slots</div>
          </div>
        </div>

        {/* Biometrics Completed */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              Done
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-purple-600 leading-tight">
              {appointments.filter(a => a.status === 'Completed').length}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Biometrics Completed</div>
          </div>
        </div>

        {/* Pending Slots */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
              Waiting
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-orange-600 leading-tight">
              {appointments.filter(a => a.status === 'Pending').length}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Pending Slots</div>
          </div>
        </div>

        {/* Rescheduled */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Re-booked
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-blue-600 leading-tight">
              {appointments.filter(a => a.status === 'Rescheduled').length}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Rescheduled Slots</div>
          </div>
        </div>

      </div>

      {/* 4. Booking Intelligence & Center Analytics (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Slot Status Donut Chart */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[14.5px]">Appointment Breakdown</h3>
              <p className="text-[11.5px] text-gray-500">Live slot confirmation telemetry</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              8 Bookings
            </span>
          </div>

          <div className="flex items-center gap-6 my-auto">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F3F4F6" strokeWidth="12" />
                {/* Confirmed (emerald) - 50% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.50)} strokeLinecap="round" />
                {/* Completed (purple) - 25% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.25)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(180deg)' }} />
                {/* Pending (orange) - 13% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.13)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(270deg)' }} />
                {/* Rescheduled (blue) - 12% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.12)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(316.8deg)' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[19px] font-extrabold text-gray-900 leading-none">{appointments.length}</span>
                <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">Slots</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                  <span>Confirmed</span>
                </div>
                <span className="font-bold text-gray-900 font-mono">4 (50%)</span>
              </div>
              <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></div>
                  <span>Completed</span>
                </div>
                <span className="font-bold text-gray-900 font-mono">2 (25%)</span>
              </div>
              <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></div>
                  <span>Pending Slot</span>
                </div>
                <span className="font-bold text-gray-900 font-mono">1 (13%)</span>
              </div>
              <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></div>
                  <span>Rescheduled</span>
                </div>
                <span className="font-bold text-gray-900 font-mono">1 (12%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Bookings by GCC Center (Bar Chart) */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[14.5px]">Slots by Consular Center</h3>
              <p className="text-[11.5px] text-gray-500">Center traffic distribution</p>
            </div>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              5 Centers
            </span>
          </div>

          <div className="flex items-end justify-between h-[120px] w-full pt-2 px-1">
            {[
              { center: 'VFS UAE', count: 3, pct: '100%', color: 'bg-blue-600' },
              { center: 'QVC Del', count: 2, pct: '67%', color: 'bg-purple-600' },
              { center: 'Tasheel', count: 2, pct: '67%', color: 'bg-emerald-600' },
              { center: 'QVC Bom', count: 1, pct: '33%', color: 'bg-indigo-600' },
              { center: 'Kuwait', count: 1, pct: '33%', color: 'bg-cyan-600' },
            ].map((item) => (
              <div key={item.center} className="flex flex-col items-center gap-1.5 flex-1 group">
                <span className="text-[10.5px] font-bold text-gray-800 opacity-90 group-hover:opacity-100 font-mono">
                  {item.count}
                </span>
                <div className="w-8 sm:w-9 bg-gray-100 rounded-t-lg relative flex items-end justify-center overflow-hidden h-[75px]">
                  <div
                    className={`w-full ${item.color} rounded-t-lg transition-all duration-500 group-hover:brightness-110`}
                    style={{ height: item.pct }}
                  ></div>
                </div>
                <span className="text-[11px] text-gray-600 font-semibold truncate w-full text-center">
                  {item.center}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Consular Center Slot Velocity */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-[14.5px]">Center Slot Availability</h3>
              <p className="text-[11.5px] text-gray-500">Live booking lead times</p>
            </div>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-3 my-auto">
            <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[11px]">
                  QVC
                </div>
                <div>
                  <div className="text-[12.5px] font-bold text-gray-900">Qatar Visa Center Delhi</div>
                  <div className="text-[11px] text-gray-500">Next available: 24 Oct</div>
                </div>
              </div>
              <span className="text-[12px] font-bold text-emerald-600 font-mono">2 Days Lead</span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[11px]">
                  VFS
                </div>
                <div>
                  <div className="text-[12.5px] font-bold text-gray-900">UAE VFS Global Delhi</div>
                  <div className="text-[11px] text-gray-500">Next available: 26 Oct</div>
                </div>
              </div>
              <span className="text-[12px] font-bold text-blue-600 font-mono">4 Days Lead</span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[11px]">
                  TSH
                </div>
                <div>
                  <div className="text-[12.5px] font-bold text-gray-900">Saudi Tasheel Delhi</div>
                  <div className="text-[11px] text-gray-500">Next available: 28 Oct</div>
                </div>
              </div>
              <span className="text-[12px] font-bold text-orange-600 font-mono">5 Days Lead</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
          {[
            { key: 'All', label: 'All Slots', count: appointments.length },
            { key: 'Confirmed', label: 'Confirmed', count: appointments.filter(a => a.status === 'Confirmed').length },
            { key: 'Completed', label: 'Biometrics Done', count: appointments.filter(a => a.status === 'Completed').length },
            { key: 'Pending', label: 'Pending Slot', count: appointments.filter(a => a.status === 'Pending').length },
            { key: 'Rescheduled', label: 'Rescheduled', count: appointments.filter(a => a.status === 'Rescheduled').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-gray-200/70 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Center & Search Filter */}
        <div className="flex items-center gap-2.5">
          <select
            value={centerFilter}
            onChange={(e) => setCenterFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="All">All Centers</option>
            <option value="VFS">VFS Global (UAE)</option>
            <option value="QVC">Qatar Visa Center (QVC)</option>
            <option value="Tasheel">Saudi Tasheel</option>
            <option value="Kuwait">Kuwait Consulate</option>
            <option value="Oman">Oman Embassy</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, passport, token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>

          {(searchTerm || statusFilter !== 'All' || centerFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setCenterFilter('All');
              }}
              className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* 6. Candidate Appointment Cards Grid (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
            <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <div className="font-semibold text-gray-700 text-[15px]">No appointments found matching your filters</div>
            <p className="text-[13px] text-gray-400 mt-1">Try resetting your status or center filter.</p>
          </div>
        ) : (
          filtered.map(a => (
            <div
              key={a.id}
              className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5.5 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: a.avatarBg }}
                    >
                      {a.candidate.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15.5px] font-bold text-gray-900">{a.candidate}</span>
                        <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {a.tokenNo}
                        </span>
                      </div>
                      <div className="text-[12px] text-gray-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <span>{a.passportNo}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-800 font-semibold">{a.job}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-blue-600 font-medium">{a.country}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {getStatusBadge(a.status)}
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="py-4 space-y-2.5 text-[13px]">
                  <div className="flex items-start gap-2 text-gray-800">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900">{a.center}</span>
                      <div className="text-[11.5px] text-gray-500 leading-tight mt-0.5">{a.address}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-1">
                    <div className="flex items-center gap-2 text-gray-700 font-mono text-[12.5px]">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-bold">{a.date}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-700 font-mono text-[12.5px]">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-bold">{a.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[12px] text-gray-600 pt-1">
                    <Ticket className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Purpose: <strong>{a.type}</strong></span>
                  </div>

                  <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-[12px] text-gray-600 flex items-start gap-2 mt-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{a.notes}</span>
                  </div>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                
                {/* Print Appointment Slip */}
                <button
                  onClick={() => setSlipModal(a)}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Print Official Appointment Slip"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-500" />
                  <span>Print Slip</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Reschedule Button */}
                  <button
                    onClick={() => {
                      setRescheduleModal(a);
                      setRescheduleDate(a.date);
                      setRescheduleTime(a.time);
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Reschedule</span>
                  </button>

                  {/* Mark Completed Button */}
                  {a.status !== 'Completed' ? (
                    <button
                      onClick={() => handleMarkCompleted(a)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Biometrics Done</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/visa/apply')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[12px] font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <span>Visa Apply</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))
        )}
      </div>

      {/* MODAL 1: Book New Embassy Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-[15px]">Book Embassy Biometric Slot</h3>
              </div>
              <button onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Candidate Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Kumar"
                    value={newCandidate}
                    onChange={(e) => setNewCandidate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Passport Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. T9918234"
                    value={newPassport}
                    onChange={(e) => setNewPassport(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Job / Trade</label>
                  <input
                    type="text"
                    placeholder="e.g. Electrician"
                    value={newJob}
                    onChange={(e) => setNewJob(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">GCC Destination</label>
                  <select
                    value={newCountry}
                    onChange={(e) => {
                      setNewCountry(e.target.value);
                      if (e.target.value === 'Qatar') setNewCenter('Qatar Visa Center (QVC), Delhi');
                      else if (e.target.value === 'Saudi Arabia') setNewCenter('Saudi Tasheel, Delhi');
                      else setNewCenter('UAE VFS Global, Delhi');
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option>UAE</option>
                    <option>Qatar</option>
                    <option>Saudi Arabia</option>
                    <option>Kuwait</option>
                    <option>Oman</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Appointment Center *</label>
                <input
                  type="text"
                  required
                  value={newCenter}
                  onChange={(e) => setNewCenter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Time Slot *</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option>09:00 AM</option>
                    <option>09:30 AM</option>
                    <option>10:00 AM</option>
                    <option>10:30 AM</option>
                    <option>11:00 AM</option>
                    <option>11:30 AM</option>
                    <option>01:30 PM</option>
                    <option>02:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Appointment Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option>Biometric + Document Submission</option>
                  <option>Iris Scan + Medical Finalization</option>
                  <option>Biometric Only</option>
                  <option>Passport Surrender & Stamping</option>
                  <option>Driving License Verification</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Reporting Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Report 30 mins early with original passport and 4 white-bg photos."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold cursor-pointer shadow-sm"
                >
                  Confirm & Generate Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reschedule Appointment Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-[15px]">Reschedule Consular Slot</h3>
              </div>
              <button onClick={() => setRescheduleModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4 text-[13px]">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div className="font-bold text-gray-900">{rescheduleModal.candidate} ({rescheduleModal.tokenNo})</div>
                <div className="text-gray-500 font-mono text-[11.5px]">Center: {rescheduleModal.center} • Current: {rescheduleModal.date}</div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">New Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">New Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option>09:30 AM</option>
                  <option>10:00 AM</option>
                  <option>10:30 AM</option>
                  <option>11:00 AM</option>
                  <option>11:30 AM</option>
                  <option>02:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Reason for Rescheduling</label>
                <textarea
                  rows={2}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Candidate out of station; center slot adjusted."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRescheduleModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold cursor-pointer shadow-sm"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable Official Appointment Slip & Token */}
      {slipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-[15px]">Official Consular Appointment Slip</h3>
              </div>
              <button onClick={() => setSlipModal(null)} className="text-gray-400 hover:text-white text-xl font-bold cursor-pointer">×</button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              {/* Slip Card */}
              <div className="p-5 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10.5px] uppercase tracking-wider font-bold text-blue-600">Embassy Token</span>
                    <div className="text-[20px] font-black text-gray-900 font-mono leading-tight">{slipModal.tokenNo}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10.5px] uppercase tracking-wider font-bold text-gray-400">File ID</span>
                    <div className="text-[14px] font-bold text-gray-700 font-mono">{slipModal.aptId}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100 text-[12.5px]">
                  <div>
                    <span className="text-gray-500">Candidate Name:</span>
                    <div className="font-bold text-gray-900">{slipModal.candidate}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Passport Number:</span>
                    <div className="font-bold text-gray-900 font-mono">{slipModal.passportNo}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Destination:</span>
                    <div className="font-bold text-gray-900">{slipModal.country} ({slipModal.job})</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Appointment Slot:</span>
                    <div className="font-bold text-blue-700 font-mono">{slipModal.date} at {slipModal.time}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-100">
                  <span className="text-gray-500 text-[11.5px]">Reporting Center & Address:</span>
                  <div className="font-semibold text-gray-900 text-[12.5px]">{slipModal.center}</div>
                  <div className="text-[11.5px] text-gray-600 leading-tight mt-0.5">{slipModal.address}</div>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                  <strong>Instructions:</strong> Carry original passport with $\ge$6 months validity, GAMCA FIT barcode report, PCC, and 4 white-background photographs.
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => alert('Printing official consular slip...')}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-[13px] font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Appointment Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSlipModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
