import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, PhoneCall, Plus, Search, RefreshCw,
  ShieldCheck, AlertTriangle, CheckCircle2, ChevronRight, Eye,
  X, Globe, Phone, MapPin,
  FileSpreadsheet, Share2, Layers, AlertCircle, Sparkles,
  Trash2, Edit, PauseCircle, PlayCircle, History, Clock,
  MessageCircle, Building2, UserPlus
  } from 'lucide-react';
import Swal from 'sweetalert2';
import {
  apiGetLeads,
  apiGetLeadById,
  apiDeleteLead,
  apiToggleLeadHold,
  apiUpdateLead,
  apiGetUsers,
  apiAssignLeadsToStaffHead,
  apiDistributeStaffHeadRoundRobin,
  getCurrentUser
} from '../utils/api';
import { showToast } from '../utils/alerts';
import LeadHistoryModal from '../components/leads/LeadHistoryModal';

const STAGE_OPTIONS = [
  { value: 'ALL', label: 'All Workflow Stages' },
  { value: 'UNASSIGNED', label: 'Data Controller Intake (Unassigned)' },
  { value: 'STAFF_HEAD_HANDLING', label: 'Staff Head Handling (Pending Calling)' },
  { value: 'CALLING_SCREENING', label: 'Calling & Screening' },
  { value: 'INITIAL_INTERVIEW', label: 'Technical Interview' },
  { value: 'MEDICAL_PROCESS', label: 'Medical Process' },
  { value: 'ACCOUNTS_COLLECTION', label: 'Payment Booking' },
  { value: 'PRE_VISA', label: 'Pre-Viva Verification' },
  { value: 'VISA_PROCESSING', label: 'Visa Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REJECTED', label: 'Rejected' },
];

const PASSPORT_OPTIONS = [
  { value: 'ALL', label: 'All Passport Status' },
  { value: 'YES', label: 'Passport Holder (Yes)' },
  { value: 'NO', label: 'Non-Passport (No)' },
  { value: 'NOT_CONFIRMED', label: 'Not Confirmed' },
];

const SOURCE_OPTIONS = [
  { value: 'ALL', label: 'All Sources' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'FACEBOOK', label: 'Facebook Ads' },
  { value: 'EXCEL', label: 'Excel Import' },
  { value: 'MANUAL', label: 'Manual Walk-in' },
  { value: 'AGENT_REFERRAL', label: 'Agent Referral' },
];

export default function Leads() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Data & Loading States
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    inCalling: 0,
    passportHolders: 0,
    onHold: 0,
    unassigned: 0,
    staffHeadQueue: 0,
  });

  // Filter & Search States
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [passportFilter, setPassportFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [holdFilter, setHoldFilter] = useState('ALL');
  const [intakeFilter, setIntakeFilter] = useState('ALL'); // 'ALL' | 'UNASSIGNED_INTAKE' | 'STAFF_HEAD_POOL'

  // Selection & Staff Head Transfer States
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [staffHeadModalOpen, setStaffHeadModalOpen] = useState(false);
  const [staffHeads, setStaffHeads] = useState([]);
  const [selectedStaffHeadId, setSelectedStaffHeadId] = useState('');
  const [assigningHead, setAssigningHead] = useState(false);

  // Modal States
  const [selectedLead, setSelectedLead] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Load Staff Heads for distribution
  const loadStaffHeads = useCallback(async () => {
    try {
      const res = await apiGetUsers();
      if (res && res.data) {
        const heads = res.data.filter(u => u.role === 'STAFF_HEAD' && u.isActive !== false);
        setStaffHeads(heads);
        if (heads.length > 0) {
          setSelectedStaffHeadId(prev => prev || heads[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load staff heads', err);
    }
  }, []);

  useEffect(() => {
    loadStaffHeads();
  }, [loadStaffHeads]);

  // Fetch Leads from Backend
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetLeads({
        search,
        stage: stageFilter,
        isPassportHolder: passportFilter,
        source: sourceFilter,
        isHold: holdFilter === 'HOLD' ? 'true' : holdFilter === 'ACTIVE' ? 'false' : undefined,
        unassignedIntake: intakeFilter === 'UNASSIGNED_INTAKE' ? 'true' : undefined,
        headQueue: intakeFilter === 'STAFF_HEAD_POOL' ? 'true' : undefined,
      });

      setLeads(res.data || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load leads from database');
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, passportFilter, sourceFilter, holdFilter, intakeFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Selection Checkbox Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeadIds(leads.map(l => l._id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectBatch = (count) => {
    if (!leads.length) return;
    const num = Math.min(count, leads.length);
    setSelectedLeadIds(leads.slice(0, num).map(l => l._id));
  };

  // Staff Head Transfer Logic (Step 01 Flow)
  const handleAssignToStaffHead = async (targetHeadId) => {
    const headId = targetHeadId || selectedStaffHeadId;
    if (!selectedLeadIds.length) {
      showToast('Please select at least one candidate lead', 'warning');
      return;
    }
    if (!headId) {
      showToast('Please select a Staff Head', 'warning');
      return;
    }

    const headObj = staffHeads.find(h => h._id === headId);
    const headName = headObj ? headObj.name : 'Selected Staff Head';

    setAssigningHead(true);
    try {
      await apiAssignLeadsToStaffHead(selectedLeadIds, headId);
      Swal.fire({
        icon: 'success',
        title: 'Transferred to Head Staff!',
        html: `<b>${selectedLeadIds.length} candidate(s)</b> have been assigned to Staff Head: <b>${headName}</b>.<br/><br/><span class="text-xs text-gray-500">Staff Head will now allocate them to Calling Staff.</span>`,
        confirmButtonColor: '#2563EB'
      });
      setSelectedLeadIds([]);
      setStaffHeadModalOpen(false);
      fetchLeads();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: err.message || 'Could not transfer leads to Staff Head',
        confirmButtonColor: '#2563EB'
      });
    } finally {
      setAssigningHead(false);
    }
  };

  const handleRoundRobinStaffHeads = async () => {
    if (!selectedLeadIds.length) {
      showToast('Please select at least one candidate lead', 'warning');
      return;
    }
    if (!staffHeads.length) {
      showToast('No active Staff Head found in the system', 'warning');
      return;
    }

    const confirm = await Swal.fire({
      title: 'Distribute Round-Robin?',
      html: `Do you want to distribute <b>${selectedLeadIds.length} candidate(s)</b> equally across all <b>${staffHeads.length} Staff Head(s)</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Distribute Equally',
      confirmButtonColor: '#7C3AED',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      setAssigningHead(true);
      try {
        const res = await apiDistributeStaffHeadRoundRobin(selectedLeadIds);
        Swal.fire({
          icon: 'success',
          title: 'Distributed Successfully!',
          text: res.message || `Distributed ${selectedLeadIds.length} leads across Staff Heads.`,
          confirmButtonColor: '#2563EB'
        });
        setSelectedLeadIds([]);
        setStaffHeadModalOpen(false);
        fetchLeads();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Distribution Failed',
          text: err.message || 'Failed to distribute leads',
          confirmButtonColor: '#2563EB'
        });
      } finally {
        setAssigningHead(false);
      }
    }
  };

  const handleOpenAssignModalForLead = (lead) => {
    setSelectedLeadIds([lead._id]);
    setStaffHeadModalOpen(true);
    loadStaffHeads();
  };

  // Open History Modal with fresh data from backend
  const handleViewLead = async (leadId) => {
    try {
      const res = await apiGetLeadById(leadId);
      setSelectedLead(res.data);
      setHistoryModalOpen(true);
    } catch (err) {
      showToast(err.message || 'Failed to load lead details', 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (lead) => {
    setSelectedLead(lead);
    setEditFormData({
      candidateName: lead.candidateName || '',
      phone: lead.phone || '',
      email: lead.email || '',
      trade: lead.trade || lead.applicationForm?.trade || '',
      passportNumber: lead.passportNumber || '',
      isPassportHolder: lead.isPassportHolder || 'NOT_CONFIRMED',
      city: lead.city || lead.applicationForm?.city || '',
      state: lead.state || lead.applicationForm?.state || '',
      notes: lead.notes || '',
      experienceYears: lead.applicationForm?.experienceYears || '',
      fatherName: lead.applicationForm?.fatherName || '',
    });
    setEditModalOpen(true);
  };

  // Save Lead Updates
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSavingEdit(true);
    try {
      await apiUpdateLead(selectedLead._id, {
        candidateName: editFormData.candidateName,
        phone: editFormData.phone,
        email: editFormData.email,
        trade: editFormData.trade,
        passportNumber: editFormData.passportNumber,
        isPassportHolder: editFormData.isPassportHolder,
        city: editFormData.city,
        state: editFormData.state,
        notes: editFormData.notes,
        applicationForm: {
          trade: editFormData.trade,
          experienceYears: editFormData.experienceYears,
          fatherName: editFormData.fatherName,
          city: editFormData.city,
          state: editFormData.state,
        }
      });
      showToast('Lead updated successfully', 'success');
      setEditModalOpen(false);
      fetchLeads();
    } catch (err) {
      showToast(err.message || 'Failed to update lead', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Toggle Lead Hold
  const handleToggleHold = async (lead) => {
    const actionText = lead.isHold ? 'Resume processing' : 'Place on Hold';
    const { value: reason, isConfirmed } = await Swal.fire({
      title: `${actionText}?`,
      text: lead.isHold 
        ? `Lead ${lead.leadId} will be resumed into the active pipeline.` 
        : `Provide a reason to put Lead ${lead.leadId} on hold:`,
      input: lead.isHold ? undefined : 'text',
      inputPlaceholder: 'e.g. Waiting for passport issuance / candidate delayed',
      showCancelButton: true,
      confirmButtonColor: lead.isHold ? '#2563EB' : '#D97706',
      confirmButtonText: lead.isHold ? 'Yes, Resume' : 'Yes, Hold Lead',
      cancelButtonText: 'Cancel',
      inputValidator: (val) => {
        if (!lead.isHold && !val) return 'Please enter a reason for placing on hold!';
      }
    });

    if (isConfirmed) {
      try {
        await apiToggleLeadHold(lead._id, !lead.isHold, reason || '');
        showToast(lead.isHold ? 'Lead resumed' : 'Lead placed on hold', 'success');
        fetchLeads();
      } catch (err) {
        showToast(err.message || 'Failed to update hold status', 'error');
      }
    }
  };

  // Delete Lead (Admin Only)
  const handleDeleteLead = async (lead) => {
    const result = await Swal.fire({
      title: `Delete Lead ${lead.leadId}?`,
      text: `Are you sure you want to permanently delete candidate "${lead.candidateName}"? All history logs will be removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Delete Permanently',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await apiDeleteLead(lead._id);
        showToast('Lead deleted successfully', 'success');
        fetchLeads();
      } catch (err) {
        showToast(err.message || 'Failed to delete lead', 'error');
      }
    }
  };

  // Helper: Candidate Initials
  const getInitials = (name) => {
    if (!name) return 'CD';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Helper: Avatar Background
  const getAvatarGradient = (name) => {
    const gradients = [
      'from-blue-600 to-indigo-600 text-white',
      'from-emerald-600 to-teal-700 text-white',
      'from-purple-600 to-indigo-700 text-white',
      'from-amber-600 to-orange-600 text-white',
      'from-cyan-600 to-blue-700 text-white'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
    return gradients[hash % gradients.length];
  };

  // Helper: Clean Experience String (Concise and clean)
  const formatExperience = (exp) => {
    if (!exp) return 'Fresh / Entry Level';
    const str = String(exp).trim();
    if (/year/i.test(str)) return str;
    return `${str} Years`;
  };

  // Helper: Stage Badge
  const getStageBadge = (stage) => {
    const map = {
      UNASSIGNED: { label: 'Unassigned Pool', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
      CALLING_SCREENING: { label: 'Calling Queue', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
      INITIAL_INTERVIEW: { label: 'Tech Interview', dot: 'bg-purple-500', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
      MEDICAL_PROCESS: { label: 'Medical Stage', dot: 'bg-teal-500', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
      ACCOUNTS_COLLECTION: { label: 'Payment Booking', dot: 'bg-indigo-500', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      STAFF_HEAD_HANDLING: { label: 'Staff Head Review', dot: 'bg-orange-500', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
      PRE_VISA: { label: 'Pre-Viva Verification', dot: 'bg-sky-500', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
      VISA_PROCESSING: { label: 'Visa Processing', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      COMPLETED: { label: 'Completed', dot: 'bg-green-600', bg: 'bg-green-50 text-green-800 border-green-200' },
      CANCELLED: { label: 'Cancelled', dot: 'bg-rose-500', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
      REJECTED: { label: 'Rejected', dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200' },
    };
    return map[stage] || { label: stage || 'Active', dot: 'bg-gray-400', bg: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  // Helper: Sourcing Channel Badge
  const getSourceBadge = (source) => {
    const s = (source || 'MANUAL').toUpperCase();
    if (s.includes('WHATSAPP')) {
      return { label: 'WhatsApp', icon: MessageCircle, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (s.includes('FACEBOOK')) {
      return { label: 'Facebook', icon: Globe, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (s.includes('EXCEL')) {
      return { label: 'Excel Import', icon: FileSpreadsheet, bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (s.includes('AGENT')) {
      return { label: 'Agent Referral', icon: Share2, bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    return { label: 'Manual Walk-in', icon: Building2, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  // Helper: Passport Status Badge
  const getPassportBadge = (status, passportNumber) => {
    if (status === 'YES') {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-mono tracking-tight">{passportNumber ? passportNumber : 'Valid Passport'}</span>
        </div>
      );
    }
    if (status === 'NO') {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/90">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>No Passport</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/90">
        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Not Confirmed</span>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-12 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span className="text-gray-500 font-medium">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Candidate Leads Pool</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Candidate Leads Pool
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              {stats.total || leads.length} Live
            </span>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/leads/add')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Candidate</span>
          </button>

          <button
            onClick={() => navigate('/leads/import')}
            className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={() => navigate('/leads/sources')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-gray-500" />
            <span>Sources</span>
          </button>

          <button
            onClick={fetchLeads}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Dynamic KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div 
          onClick={() => { setIntakeFilter('ALL'); setStageFilter('ALL'); }}
          className={`bg-white rounded-2xl p-4 border shadow-xs cursor-pointer transition-all hover:border-blue-300 ${
            intakeFilter === 'ALL' && stageFilter === 'ALL' ? 'ring-2 ring-blue-500/20 border-blue-500' : 'border-gray-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 text-[12px] font-medium mb-1">
            <span>Total In Pool</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-[24px] font-black text-gray-900">{stats.total}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Central database records</div>
        </div>

        {/* Data Controller Intake Pool (Waiting for Staff Head) */}
        <div 
          onClick={() => {
            setIntakeFilter(prev => prev === 'UNASSIGNED_INTAKE' ? 'ALL' : 'UNASSIGNED_INTAKE');
          }}
          className={`rounded-2xl p-4 border shadow-xs cursor-pointer transition-all ${
            intakeFilter === 'UNASSIGNED_INTAKE' 
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30' 
              : 'bg-white border-gray-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 text-[12px] font-bold mb-1">
            <span>Data Controller Intake</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-[24px] font-black text-amber-600">{stats.unassigned}</div>
          <div className="text-[11px] text-amber-700/80 font-medium mt-0.5">Needs Staff Head allocation</div>
        </div>

        {/* Staff Head Queue (Waiting for Calling Staff) */}
        <div 
          onClick={() => {
            setIntakeFilter(prev => prev === 'STAFF_HEAD_POOL' ? 'ALL' : 'STAFF_HEAD_POOL');
          }}
          className={`rounded-2xl p-4 border shadow-xs cursor-pointer transition-all ${
            intakeFilter === 'STAFF_HEAD_POOL' 
              ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/30' 
              : 'bg-white border-gray-200/80 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between text-purple-700 text-[12px] font-bold mb-1">
            <span>Staff Head Desk</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-[24px] font-black text-purple-600">{stats.staffHeadQueue || 0}</div>
          <div className="text-[11px] text-purple-700/80 font-medium mt-0.5">Pending Calling Staff split</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-[12px] font-medium mb-1">
            <span>Calling Queue</span>
            <PhoneCall className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-[24px] font-black text-indigo-600">{stats.inCalling}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Under active screening</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-[12px] font-medium mb-1">
            <span>Passport Holders</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-[24px] font-black text-emerald-600">{stats.passportHolders}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Eligible for interview/CV</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name, phone, passport, trade..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-[13px] text-gray-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Passport Filter */}
          <div>
            <select
              value={passportFilter}
              onChange={(e) => setPassportFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-[13px] text-gray-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              {PASSPORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-[13px] text-gray-700 font-medium focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Badges */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap text-[12px]">
          <span className="text-gray-400 font-medium">Quick Filter:</span>
          
          <button
            onClick={() => { setHoldFilter('ALL'); setIntakeFilter('ALL'); }}
            className={`px-3 py-1 rounded-full text-[11.5px] font-semibold cursor-pointer transition-colors ${
              holdFilter === 'ALL' && intakeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Active & Hold ({leads.length})
          </button>

          {/* Step 1 Intake Pill: Data Controller Pool */}
          <button
            onClick={() => setIntakeFilter(prev => prev === 'UNASSIGNED_INTAKE' ? 'ALL' : 'UNASSIGNED_INTAKE')}
            className={`px-3 py-1 rounded-full text-[11.5px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              intakeFilter === 'UNASSIGNED_INTAKE' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${intakeFilter === 'UNASSIGNED_INTAKE' ? 'bg-white' : 'bg-amber-500'}`} />
            <span>Data Controller Intake ({stats.unassigned})</span>
          </button>

          {/* Step 1 to Step 2: Staff Head Queue */}
          <button
            onClick={() => setIntakeFilter(prev => prev === 'STAFF_HEAD_POOL' ? 'ALL' : 'STAFF_HEAD_POOL')}
            className={`px-3 py-1 rounded-full text-[11.5px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              intakeFilter === 'STAFF_HEAD_POOL' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'bg-purple-50 text-purple-800 border border-purple-300 hover:bg-purple-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${intakeFilter === 'STAFF_HEAD_POOL' ? 'bg-white' : 'bg-purple-500'}`} />
            <span>Staff Head Queue ({stats.staffHeadQueue || 0})</span>
          </button>

          <button
            onClick={() => setHoldFilter('ACTIVE')}
            className={`px-3 py-1 rounded-full text-[11.5px] font-semibold cursor-pointer transition-colors ${
              holdFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Active Pipeline
          </button>

          <button
            onClick={() => setHoldFilter('HOLD')}
            className={`px-3 py-1 rounded-full text-[11.5px] font-semibold cursor-pointer transition-colors ${
              holdFilter === 'HOLD' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            On Hold ({stats.onHold})
          </button>

          {(search || stageFilter !== 'ALL' || passportFilter !== 'ALL' || sourceFilter !== 'ALL' || holdFilter !== 'ALL' || intakeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStageFilter('ALL');
                setPassportFilter('ALL');
                setSourceFilter('ALL');
                setHoldFilter('ALL');
                setIntakeFilter('ALL');
              }}
              className="ml-auto text-[11.5px] text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Batch Selection Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 flex-wrap text-[12px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-400 font-medium">Batch Select:</span>
            <button
              onClick={() => handleSelectBatch(10)}
              className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] cursor-pointer transition-colors"
            >
              Top 10
            </button>
            <button
              onClick={() => handleSelectBatch(25)}
              className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] cursor-pointer transition-colors"
            >
              Top 25
            </button>
            <button
              onClick={() => handleSelectBatch(50)}
              className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] cursor-pointer transition-colors"
            >
              Top 50
            </button>
            <button
              onClick={() => {
                const unassignedIds = leads.filter(l => !l.assignedStaffHead).map(l => l._id);
                setSelectedLeadIds(unassignedIds);
              }}
              className="px-2.5 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] cursor-pointer transition-colors"
            >
              Select All Intake Leads ({leads.filter(l => !l.assignedStaffHead).length})
            </button>
          </div>

          {selectedLeadIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {selectedLeadIds.length} Selected
              </span>
              <button
                onClick={() => {
                  setStaffHeadModalOpen(true);
                  loadStaffHeads();
                }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Forward to Head Staff</span>
              </button>
              <button
                onClick={() => setSelectedLeadIds([])}
                className="text-[11px] text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Beautifully Formatted Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-rose-700 text-[13px]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchLeads} className="font-bold underline hover:text-rose-900 cursor-pointer">
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <h4 className="text-[15px] font-bold text-gray-800">Loading Candidate Records...</h4>
            <p className="text-[12px] text-gray-400 mt-0.5">Synchronizing live from database</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && leads.length === 0 && (
          <div className="py-16 px-4 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3.5 shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-[17px] font-bold text-gray-900">No Candidates Found</h3>
            <p className="text-[13px] text-gray-500 mt-1 mb-5">
              {search || stageFilter !== 'ALL'
                ? 'No candidate records match your search or filter parameters. Try adjusting the query.'
                : 'The central lead pool is currently empty. Start by creating a lead or importing from Excel.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => navigate('/leads/add')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold cursor-pointer"
              >
                + Add First Lead
              </button>
              <button
                onClick={() => navigate('/leads/import')}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[13px] font-medium cursor-pointer"
              >
                Bulk Import (.xlsx)
              </button>
            </div>
          </div>
        )}

        {/* Polished Table with Fixed Column Widths & Zero-Wrap Guarantee */}
        {!loading && leads.length > 0 && (
          <div className="overflow-x-auto custom-scrollbar w-full">
            <table className="w-full text-left border-collapse min-w-[1260px]">
              <thead>
                <tr className="bg-slate-50/95 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                  <th className="py-3.5 px-3 whitespace-nowrap w-10 text-center">
                    <input
                      type="checkbox"
                      checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                      title="Select all leads"
                    />
                  </th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[210px]">Candidate & ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[155px]">Contact & Location</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[220px]">Trade & Experience</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">Passport Verification</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Source</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">Workflow Stage</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[190px]">Assigned Officer</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[120px] sticky right-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.06)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {leads.map((lead) => {
                  const stageBadge = getStageBadge(lead.currentStage);
                  const sourceBadge = getSourceBadge(lead.source);
                  const candidateCity = lead.city || lead.applicationForm?.city || lead.state || '';
                  const candidateTrade = lead.trade || lead.applicationForm?.trade || 'General Worker';
                  const candidateExp = lead.applicationForm?.experienceYears || '';
                  const initials = getInitials(lead.candidateName);
                  const avatarColor = getAvatarGradient(lead.candidateName);
                  const SourceIcon = sourceBadge.icon;

                  return (
                    <tr
                      key={lead._id}
                      className={`group hover:bg-blue-50/40 transition-colors ${lead.isHold ? 'bg-amber-50/30' : ''} ${selectedLeadIds.includes(lead._id) ? 'bg-purple-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 align-middle text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(lead._id)}
                          onChange={() => handleSelectOne(lead._id)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                        />
                      </td>

                      {/* 1. Candidate Avatar & Lead ID */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-[12px] font-black shrink-0 shadow-2xs`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 text-[13px] leading-snug whitespace-nowrap">
                              {lead.candidateName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                              <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                                {lead.leadId}
                              </span>
                              <span className="text-[10.5px] text-gray-400">
                                {lead.createdAt 
                                  ? new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                                  : ''}
                              </span>
                              {lead.isHold && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">
                                  HOLD
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact & Location */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-800 font-semibold text-[12.5px] whitespace-nowrap">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="font-mono tracking-tight">{lead.phone}</span>
                          </div>
                          {candidateCity ? (
                            <div className="flex items-center gap-1.5 text-gray-500 text-[11.5px] whitespace-nowrap">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[130px]">{candidateCity}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-gray-400 pl-5 whitespace-nowrap">Location pending</div>
                          )}
                        </div>
                      </td>

                      {/* 3. Trade & Experience (Single Line + Clean Pill) */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className="space-y-1">
                          <div 
                            className="font-bold text-gray-800 text-[12.5px] leading-tight whitespace-nowrap max-w-[220px] truncate"
                            title={candidateTrade}
                          >
                            {candidateTrade}
                          </div>
                          <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10.5px] font-semibold whitespace-nowrap border border-gray-200/60">
                            {formatExperience(candidateExp)}
                          </div>
                        </div>
                      </td>

                      {/* 4. Passport Verification */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        {getPassportBadge(lead.isPassportHolder, lead.passportNumber)}
                      </td>

                      {/* 5. Source */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-bold border ${sourceBadge.bg} whitespace-nowrap`}>
                          <SourceIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{sourceBadge.label}</span>
                        </div>
                      </td>

                      {/* 6. Current Workflow Stage */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold border ${stageBadge.bg} whitespace-nowrap`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stageBadge.dot}`} />
                          <span>{stageBadge.label}</span>
                        </div>
                      </td>

                      {/* 7. Assigned Officer */}
                      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                        {lead.assignedCallingStaff ? (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10.5px] font-black flex items-center justify-center shrink-0">
                              {getInitials(lead.assignedCallingStaff.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 text-[12.5px] leading-tight whitespace-nowrap">
                                {lead.assignedCallingStaff.name}
                              </div>
                              <div className="text-[10px] text-blue-600 font-semibold mt-0.5 whitespace-nowrap">Calling Staff</div>
                            </div>
                          </div>
                        ) : lead.assignedStaffHead ? (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-[10.5px] font-black flex items-center justify-center shrink-0">
                              {getInitials(lead.assignedStaffHead.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 text-[12.5px] leading-tight whitespace-nowrap">
                                {lead.assignedStaffHead.name}
                              </div>
                              <div className="text-[10px] text-purple-600 font-semibold mt-0.5 whitespace-nowrap flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                Staff Head Desk (Pending Calling)
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 font-bold whitespace-nowrap inline-flex items-center gap-1 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Data Controller Intake
                            </span>
                            <button
                              onClick={() => handleOpenAssignModalForLead(lead)}
                              className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs active:scale-95"
                              title="Assign this candidate to Head Staff"
                            >
                              <UserPlus className="w-3 h-3 text-purple-600" />
                              <span>Assign Head</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 8. Actions Group (Sticky Right) */}
                      <td className={`py-3.5 px-4 align-middle text-right whitespace-nowrap sticky right-0 ${lead.isHold ? 'bg-[#FFFDF7]' : 'bg-white'} group-hover:bg-[#F4F8FE] z-10 shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.06)] transition-colors`}>
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                          {/* View Detail & History */}
                          <button
                            onClick={() => handleViewLead(lead._id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="View Full Profile & Audit History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Edit */}
                          <button
                            onClick={() => handleOpenEdit(lead)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                            title="Edit Candidate Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Toggle Hold */}
                          <button
                            onClick={() => handleToggleHold(lead)}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              lead.isHold
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                            }`}
                            title={lead.isHold ? 'Resume Processing' : 'Place on Hold'}
                          >
                            {lead.isHold ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                          </button>

                          {/* Delete Lead */}
                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary Strip */}
        {!loading && leads.length > 0 && (
          <div className="p-3.5 bg-gray-50/80 border-t border-gray-200 flex items-center justify-between text-[12px] text-gray-500">
            <span>Showing <b>{leads.length}</b> leads matching active criteria</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Next Action:</span>
              <button
                onClick={() => navigate('/staff-head/assign')}
                className="text-blue-600 hover:underline font-bold cursor-pointer"
              >
                Go to Staff Assignment Desk &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Lead History & Audit Trail Modal */}
      {historyModalOpen && selectedLead && (
        <LeadHistoryModal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          candidate={{
            ...selectedLead,
            name: selectedLead.candidateName,
            id: selectedLead.leadId,
            assignedTo: selectedLead.assignedCallingStaff?.name || selectedLead.assignedStaffHead?.name || 'Unassigned',
            auditTrail: selectedLead.history?.map((h) => ({
              step: h.actionType.replace(/_/g, ' '),
              title: h.remarks || h.actionType,
              desc: h.remarks,
              user: `${h.performedBy?.name || 'System'} (${h.performedBy?.role || 'System'})`,
              date: new Date(h.createdAt).toLocaleString('en-GB'),
              badge: h.actionType,
              badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
              icon: History,
            })),
          }}
        />
      )}

      {/* 6. Quick Edit Modal */}
      {editModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <Edit className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-[16px]">Edit Candidate Lead</h3>
                  <p className="text-[11px] text-gray-400">ID: {selectedLead.leadId}</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.candidateName}
                    onChange={(e) => setEditFormData({ ...editFormData, candidateName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-700">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-700">Technical Trade</label>
                  <input
                    type="text"
                    value={editFormData.trade}
                    onChange={(e) => setEditFormData({ ...editFormData, trade: e.target.value })}
                    placeholder="e.g. 6G Pipe Welder / Electrician"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-700">Experience (Years)</label>
                  <input
                    type="text"
                    value={editFormData.experienceYears}
                    onChange={(e) => setEditFormData({ ...editFormData, experienceYears: e.target.value })}
                    placeholder="e.g. 5 Years (Ex-GCC)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-700">Passport Status</label>
                  <select
                    value={editFormData.isPassportHolder}
                    onChange={(e) => setEditFormData({ ...editFormData, isPassportHolder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px]"
                  >
                    <option value="YES">Passport Holder (Yes)</option>
                    <option value="NO">Non-Passport (No)</option>
                    <option value="NOT_CONFIRMED">Not Confirmed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-700">Passport Number</label>
                  <input
                    type="text"
                    value={editFormData.passportNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, passportNumber: e.target.value })}
                    placeholder="e.g. Z8941203"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-700">City / District</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    placeholder="e.g. Gorakhpur"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-gray-700">State</label>
                  <input
                    type="text"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-gray-700">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Candidate preferences, trade testing readiness, etc."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px]"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-[13px] font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold cursor-pointer disabled:opacity-70 shadow-sm"
                >
                  {savingEdit ? 'Saving Updates...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Bar for Multi-selected Leads */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-gray-700/80 backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold">{selectedLeadIds.length} candidate(s) selected</span>
          </div>
          <div className="h-4 w-px bg-gray-700" />
          <button
            onClick={() => {
              setStaffHeadModalOpen(true);
              loadStaffHeads();
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Forward to Head Staff</span>
          </button>
          <button
            onClick={handleRoundRobinStaffHeads}
            disabled={assigningHead || staffHeads.length === 0}
            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-purple-500/30 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Round-Robin Split</span>
          </button>
          <button
            onClick={() => setSelectedLeadIds([])}
            className="text-gray-400 hover:text-white text-xs font-semibold px-2 py-1 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Staff Head Assignment Modal (Step 01 Flow) */}
      {staffHeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-purple-600 font-bold mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>STEP 01: DATA CONTROLLER TO HEAD STAFF</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Assign {selectedLeadIds.length} Candidate(s) to Head Staff
                </h3>
              </div>
              <button
                onClick={() => setStaffHeadModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3 mb-4 leading-relaxed">
              Leads from the <b>Data Controller intake pool</b> are assigned directly to <b>Head Staff (Staff Head)</b>. Calling Staff will only receive these candidates after Staff Head distributes them.
            </p>

            {/* Staff Head Selection Cards */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {staffHeads.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-xl">
                  No active Staff Head users found in the system.
                </div>
              ) : (
                staffHeads.map(head => {
                  const isSelected = selectedStaffHeadId === head._id;
                  const initials = (head.name || 'SH')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={head._id}
                      onClick={() => setSelectedStaffHeadId(head._id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-600/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-2xs ${
                          isSelected ? 'bg-purple-600' : 'bg-gray-700'
                        }`}>
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{head.name}</div>
                          <div className="text-xs text-gray-500">{head.email}</div>
                          <div className="text-[10px] text-purple-600 font-semibold mt-0.5">
                            {head.department || 'Operations Team'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                          Staff Head
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col gap-2.5">
              <button
                onClick={() => handleAssignToStaffHead(selectedStaffHeadId)}
                disabled={assigningHead || !selectedStaffHeadId || staffHeads.length === 0}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {assigningHead ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Confirm Assignment to Selected Staff Head</span>
              </button>

              <button
                onClick={handleRoundRobinStaffHeads}
                disabled={assigningHead || staffHeads.length === 0}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Distribute Round-Robin Across All ({staffHeads.length}) Staff Heads</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
