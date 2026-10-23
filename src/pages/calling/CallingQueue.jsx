import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Phone, ChevronRight, CheckCircle2, XCircle, Clock, FileText, Search,
  ShieldCheck, Sparkles, UserPlus, MapPin, AlertTriangle, RefreshCw,
  User, ArrowRight, Send, Eye, X, RotateCcw, Filter, Calendar, Check,
  PhoneCall, Building2, Globe, Users, Layers, Award, Stethoscope, Briefcase,
  FolderOpen, DollarSign, Ban, ChevronDown, CheckCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  apiGetLeads,
  apiGetUsers,
  apiCategorizeLead,
  apiTransferLeadStage,
  apiGetLeadById,
  apiGetLeadHistory,
  apiGetCallingPipelineSummary,
  apiRaiseEnquiry,
  apiGetEnquiries,
  apiRespondToEnquiry,
  apiCancelTransfer,
  getCurrentUser
} from '../../utils/api';

export default function CallingQueue() {
  const navigate = useNavigate();
  const location = useLocation();

  // Active Stage & Sub-Tab (Matches Mobile App 10-Step Pipeline)
  const queryParams = new URLSearchParams(location.search);
  const initialStageParam = queryParams.get('stage') || '01';
  const [activeStage, setActiveStage] = useState(initialStageParam);
  const [activeSubTab, setActiveSubTab] = useState('ALL');

  // Universal Timeline Date Filter (Phase 1)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Universal Enquiry Desk (Phase 1)
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [receivedEnquiriesOpen, setReceivedEnquiriesOpen] = useState(false);
  const [enquiryList, setEnquiryList] = useState([]);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    candidateName: '',
    phone: '',
    trade: '',
    category: 'CALLING',
    targetRole: 'STAFF_HEAD',
    priority: 'NORMAL',
    subject: '',
    message: ''
  });

  // Pipeline telemetry from backend
  const [pipelineSummary, setPipelineSummary] = useState(null);

  // Database States
  const [leads, setLeads] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [filterCategory, setFilterCategory] = useState('ALL'); // ALL | YES | NO | NOT_CONFIRMED
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [passportModal, setPassportModal] = useState(null);
  const [passportNumber, setPassportNumber] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');

  const [followUpModal, setFollowUpModal] = useState(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const [routeModal, setRouteModal] = useState(null); // Route candidate (Interview vs CV Selection)
  const [selectedRoute, setSelectedRoute] = useState('INTERVIEW');
  const [routeRemarks, setRouteRemarks] = useState('');

  const [detailCandidate, setDetailCandidate] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 1. Fetch live calling leads & pipeline summary from MongoDB Atlas
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes, summaryRes] = await Promise.allSettled([
        apiGetLeads({
          allPool: true,
          limit: 1000,
          callingStaff: staffFilter !== 'ALL' ? staffFilter : undefined,
          search: searchQuery.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }),
        apiGetUsers(),
        apiGetCallingPipelineSummary()
      ]);

      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        setLeads(leadsRes.value.data);
      } else {
        setLeads([]);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        const callingStaff = usersRes.value.data.filter(
          u => u.role === 'CALLING_STAFF' && u.isActive !== false
        );
        setStaffList(callingStaff);
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
        setPipelineSummary(summaryRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load calling queue', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Leads',
        text: 'Failed to retrieve calling queue from database.',
        confirmButtonColor: '#2563EB'
      });
    } finally {
      setLoading(false);
    }
  }, [staffFilter, searchQuery, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync stage from URL query params if changed
  useEffect(() => {
    const stage = queryParams.get('stage');
    if (stage && stage !== activeStage) {
      setActiveStage(stage);
      setActiveSubTab('ALL');
    }
  }, [location.search]);

  // 10-Step Pipeline Definition matching Mobile App
  const pipelineStages = useMemo(() => [
    {
      id: '01',
      title: 'Received Data',
      subtitle: 'From Data Controller / Upload',
      icon: Layers,
      color: 'bg-blue-600',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      subTabs: [
        { id: 'ALL', label: 'All Leads' },
        { id: 'NEW', label: 'New Leads' },
        { id: 'NOT_INTERESTED', label: 'Not Interested' }
      ]
    },
    {
      id: '02',
      title: 'Interested',
      subtitle: 'Candidate expressed overseas interest',
      icon: PhoneCall,
      color: 'bg-emerald-600',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      subTabs: [
        { id: 'ALL', label: 'All Interested' },
        { id: 'PASSPORT', label: 'Passport Holder' },
        { id: 'NON_PASSPORT', label: 'Non-Passport' }
      ]
    },
    {
      id: '03',
      title: 'Passport Holders',
      subtitle: 'Verified passport records',
      icon: ShieldCheck,
      color: 'bg-teal-600',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      subTabs: [
        { id: 'ALL', label: 'All Passport Holders' },
        { id: 'WITH_NUMBER', label: 'Passport No. Added' },
        { id: 'FOLLOW_UP', label: 'Follow-up Scheduled' }
      ]
    },
    {
      id: '04',
      title: 'Form Filling',
      subtitle: 'Full candidate official registration',
      icon: FileText,
      color: 'bg-amber-600',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      subTabs: [
        { id: 'ALL', label: 'All Forms' },
        { id: 'INCOMPLETE', label: 'Incomplete' },
        { id: 'COMPLETE', label: 'Complete' }
      ]
    },
    {
      id: '05',
      title: 'Interview / CV Selection',
      subtitle: 'Screening evaluation & selection channel',
      icon: Award,
      color: 'bg-indigo-600',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      subTabs: [
        { id: 'ALL', label: 'All Candidates' },
        { id: 'INTERVIEW', label: 'Interview Desk' },
        { id: 'CV_SELECTION', label: 'Direct CV Selection' }
      ]
    },
    {
      id: '06',
      title: 'My Selections',
      subtitle: 'Selected candidates ready for processing',
      icon: CheckCircle2,
      color: 'bg-violet-600',
      badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
      subTabs: [
        { id: 'ALL', label: 'All Selections' }
      ]
    },
    {
      id: '07',
      title: 'My Medicals',
      subtitle: 'GAMCA / Normal medical examination',
      icon: Stethoscope,
      color: 'bg-sky-600',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      subTabs: [
        { id: 'ALL', label: 'All Medicals' },
        { id: 'PENDING', label: 'Medical Pending' },
        { id: 'FIT', label: 'Medical Fit' }
      ]
    },
    {
      id: '08',
      title: 'HR Confirmation',
      subtitle: 'Company offer letter & visa contract agreement',
      icon: Briefcase,
      color: 'bg-cyan-600',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      subTabs: [
        { id: 'ALL', label: 'All Offers' },
        { id: 'PENDING', label: 'Pending Confirmation' },
        { id: 'CONFIRMED', label: 'Confirmed / Accepted' }
      ]
    },
    {
      id: '09',
      title: 'Pending Advance',
      subtitle: 'Awaiting candidate bill book advance payment',
      icon: DollarSign,
      color: 'bg-amber-600',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      subTabs: [
        { id: 'ALL', label: 'Pending Payment' }
      ]
    },
    {
      id: '10',
      title: 'Advance Collected',
      subtitle: 'Advance payment verified & bill book generated',
      icon: CheckCircle,
      color: 'bg-emerald-600',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      subTabs: [
        { id: 'ALL', label: 'All Advances' }
      ]
    },
    {
      id: 'STAFF_HEAD_FILES',
      title: 'Staff Head Desk',
      subtitle: 'Files transferred / receiving pending',
      icon: FolderOpen,
      color: 'bg-purple-600',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      subTabs: [
        { id: 'ALL', label: 'All Transferred Files' }
      ]
    },
    {
      id: 'CANCELLATION_FILES',
      title: 'Cancellation Files',
      subtitle: 'Refund pending or closed files',
      icon: Ban,
      color: 'bg-rose-600',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      subTabs: [
        { id: 'ALL', label: 'All Cancellations' }
      ]
    }
  ], []);

  // Filter Helper matching Flutter app criteria
  const filterLeadByStageAndSubTab = useCallback((lead, stageId, subTabId) => {
    // Calling Queue is strictly for leads assigned to Calling Staff.
    // Unassigned raw leads belong in Data Controller intake / Lead Pool.
    // Leads without assignedCallingStaff or currently with Staff Head belong in Staff Head Handling.
    if (!lead.assignedCallingStaff && lead.currentStage === 'UNASSIGNED') {
      return false;
    }
    if (!lead.assignedCallingStaff && lead.currentStage === 'STAFF_HEAD_HANDLING') {
      return false;
    }

    const stage = (lead.currentStage || 'UNASSIGNED').toString();
    const isPass = (lead.isPassportHolder || 'NOT_CONFIRMED').toString();
    const notes = (lead.notes || '').toString().toLowerCase();
    const appForm = lead.applicationForm || null;
    const selMode = (lead.selectionMode || 'NONE').toString();
    const initInterview = lead.initialInterview || null;
    const interviewStatus = (initInterview?.status || '').toString().toUpperCase();
    const medDetails = lead.medicalDetails || null;
    const medStatus = (medDetails?.status || '').toString().toUpperCase();
    const companyConf = lead.companyConfirmation || null;
    const companyStatus = (companyConf?.status || '').toString().toUpperCase();
    const pay = lead.paymentDetails || null;
    const billBook = lead.billBook || null;

    const bbReceived = Number(billBook?.totalReceived) || 0;
    const payAdvance = Number(pay?.advancePaid) || 0;
    const payTotal = Number(pay?.totalPaid) || 0;
    const txList = Array.isArray(billBook?.transactions) ? billBook.transactions : [];
    const hasVerifiedTx = txList.some(t => t?.status === 'VERIFIED');
    const totalPaidAmount = payAdvance > 0 ? payAdvance : (payTotal > 0 ? payTotal : bbReceived);
    const hasCollectedPayment = totalPaidAmount > 0 || bbReceived > 0 || hasVerifiedTx || stage === 'STAFF_HEAD_HANDLING';

    const father = (appForm?.fatherName || '').toString().trim();
    const dob = (appForm?.dob || '').toString().trim();
    const address = (appForm?.address || '').toString().trim();
    const passIssue = (appForm?.passportIssueDate || '').toString().trim();
    const passExpiry = (appForm?.passportExpiry || '').toString().trim();
    const hasPhoto = Boolean(appForm?.hasPhoto || appForm?.photoUrl);
    const hasSig = Boolean(appForm?.hasSignature || appForm?.signatureUrl);
    const isFormComplete = Boolean(lead.isFormFilled) || (father && dob && address && passIssue && passExpiry && (hasPhoto || hasSig));
    const isNotInterested = isPass === 'NOT_INTERESTED' || notes.includes('not interested') || stage === 'REJECTED' || stage === 'CANCELLED';

    switch (stageId) {
      case '01':
        if (subTabId === 'NOT_INTERESTED') return isNotInterested;
        if (subTabId === 'NEW') return !isNotInterested && isPass !== 'YES' && isPass !== 'NO';
        return true;
      case '02':
        if (subTabId === 'PASSPORT') return !isNotInterested && isPass === 'YES';
        if (subTabId === 'NON_PASSPORT') return !isNotInterested && isPass === 'NO';
        return !isNotInterested && (isPass === 'YES' || isPass === 'NO');
      case '03':
        if (subTabId === 'WITH_NUMBER') return isPass === 'YES' && Boolean(lead.passportNumber && lead.passportNumber !== 'No Passport');
        if (subTabId === 'FOLLOW_UP') return isPass === 'YES' && Boolean(lead.followUpDate);
        return isPass === 'YES';
      case '04':
        if (subTabId === 'INCOMPLETE') return isPass === 'YES' && !isFormComplete;
        if (subTabId === 'COMPLETE') return isPass === 'YES' && isFormComplete;
        return isPass === 'YES';
      case '05':
        if (subTabId === 'INTERVIEW') return stage === 'INITIAL_INTERVIEW' || stage === 'FINAL_INTERVIEW' || selMode === 'INTERVIEW';
        if (subTabId === 'CV_SELECTION') return selMode === 'DIRECT_CV' || stage === 'CV_SELECTED';
        return stage === 'INITIAL_INTERVIEW' || stage === 'FINAL_INTERVIEW' || selMode === 'INTERVIEW' || selMode === 'DIRECT_CV' || stage === 'CV_SELECTED';
      case '06':
        return interviewStatus === 'PASS' || selMode === 'DIRECT_CV' || stage === 'MEDICAL_PROCESS' || stage === 'COMPANY_CONFIRMATION' || stage === 'ACCOUNTS_COLLECTION';
      case '07':
        if (subTabId === 'PENDING') return (stage === 'MEDICAL_PROCESS' || Boolean(medDetails && medStatus)) && medStatus !== 'FIT';
        if (subTabId === 'FIT') return medStatus === 'FIT';
        return stage === 'MEDICAL_PROCESS' || Boolean(medDetails && medStatus);
      case '08':
        if (subTabId === 'PENDING') return (stage === 'COMPANY_CONFIRMATION' || Boolean(companyStatus)) && companyStatus !== 'COMPANY_CONFIRMED' && companyStatus !== 'AGREEMENT_ACCEPTED';
        if (subTabId === 'CONFIRMED') return companyStatus === 'COMPANY_CONFIRMED' || companyStatus === 'AGREEMENT_ACCEPTED';
        return stage === 'COMPANY_CONFIRMATION' || Boolean(companyStatus);
      case '09': {
        const isSelected = interviewStatus === 'PASS' || selMode === 'DIRECT_CV' || stage === 'COMPANY_CONFIRMATION' || stage === 'ACCOUNTS_COLLECTION';
        return isSelected && !hasCollectedPayment;
      }
      case '10':
        return hasCollectedPayment;
      case 'STAFF_HEAD_FILES':
        return stage === 'STAFF_HEAD_HANDLING' || lead.fileTransferDetails?.status === 'PENDING_RECEIVING';
      case 'CANCELLATION_FILES': {
        const closure = (lead.closureStatus || '').toString();
        return closure === 'REFUND_PENDING' || closure === 'CLOSED_NO_ADVANCE' || closure === 'FINAL_CLOSED' || stage === 'CANCELLED';
      }
      default:
        return true;
    }
  }, []);

  // Compute Live Metrics for each stage
  const stageCounts = useMemo(() => {
    const counts = {};
    pipelineStages.forEach(st => {
      counts[st.id] = leads.filter(l => filterLeadByStageAndSubTab(l, st.id, 'ALL')).length;
    });
    return counts;
  }, [leads, pipelineStages, filterLeadByStageAndSubTab]);

  // Leads filtered by active stage and subTab
  const currentFilteredLeads = useMemo(() => {
    return leads.filter(l => filterLeadByStageAndSubTab(l, activeStage, activeSubTab));
  }, [leads, activeStage, activeSubTab, filterLeadByStageAndSubTab]);

  // 2. Mark as Passport Holder (Capture Passport Number + Phone per FRD Section 6 & 7)
  const handleOpenPassportModal = (lead) => {
    setPassportModal(lead);
    setPassportNumber(lead.passportNumber || '');
    setConfirmPhone(lead.phone || '');
  };

  const handleSavePassport = async (e) => {
    e.preventDefault();
    if (!passportModal || !passportNumber.trim() || !confirmPhone.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Details',
        text: 'Both Passport Number and Confirmed Mobile Number are mandatory per FRD Section 6.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiCategorizeLead(passportModal._id, {
        isPassportHolder: 'YES',
        phone: confirmPhone.trim(),
        passportNumber: passportNumber.trim().toUpperCase()
      });

      const updatedLead = res?.data || {
        ...passportModal,
        isPassportHolder: 'YES',
        phone: confirmPhone.trim(),
        passportNumber: passportNumber.trim().toUpperCase()
      };

      // Optimistically update the table state immediately
      setLeads(prev => prev.map(l => l._id === passportModal._id ? { ...l, ...updatedLead } : l));

      const savedLead = passportModal;
      const validPassport = passportNumber.trim().toUpperCase();
      const validPhone = confirmPhone.trim();

      setPassportModal(null);
      setPassportNumber('');
      setConfirmPhone('');
      loadData();

      const result = await Swal.fire({
        icon: 'success',
        title: 'Passport Verified!',
        html: `Candidate <b>${savedLead.candidateName}</b> verified as Passport Holder.<br>
               <span class="font-mono text-xs text-blue-700 font-bold block mt-1">Passport: ${validPassport}</span>
               <div class="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 text-left">
                 Per FRD Section 8, complete the <b>Candidate Full Form</b> (trade, GCC experience, declaration & route allocation).
               </div>`,
        showCancelButton: true,
        confirmButtonText: 'Complete Full Candidate Form →',
        confirmButtonColor: '#2563EB',
        cancelButtonText: 'Stay in Queue',
        cancelButtonColor: '#6B7280'
      });

      if (result.isConfirmed) {
        navigate(`/candidates/add?leadId=${savedLead._id}&name=${encodeURIComponent(savedLead.candidateName)}&phone=${encodeURIComponent(validPhone)}&passport=${encodeURIComponent(validPassport)}&trade=${encodeURIComponent(savedLead.trade || '')}`);
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: err.message || 'Could not save passport status.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Mark as Non-Passport Holder (FRD Section 7: Auto-Close/Pending)
  const handleMarkNonPassport = async (lead) => {
    const confirm = await Swal.fire({
      title: 'No Passport?',
      html: `Mark <b>${lead.candidateName}</b> as <b>Non-Passport Holder</b>?<br><br>
             <span class="text-xs text-gray-500">Per CRM Rule: Candidates without a valid passport cannot proceed to Medical or Visa processing.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Mark No Passport'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await apiCategorizeLead(lead._id, {
        isPassportHolder: 'NO',
        phone: lead.phone,
        passportNumber: null
      });

      const updatedLead = res?.data || {
        ...lead,
        isPassportHolder: 'NO',
        passportNumber: null
      };
      setLeads(prev => prev.map(l => l._id === lead._id ? { ...l, ...updatedLead } : l));

      Swal.fire({
        icon: 'info',
        title: 'Categorized as Non-Passport',
        text: `Candidate ${lead.candidateName} status updated to Non-Passport Holder.`,
        confirmButtonColor: '#2563EB'
      });

      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Could not update status.',
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // 3b. Mark as Not Interested (Counts in Not Interested, separate from Passport/No Passport)
  const handleMarkNotInterested = async (lead) => {
    const { value: reason } = await Swal.fire({
      title: 'Mark as Not Interested?',
      html: `Confirm that <b>${lead.candidateName}</b> is <b>Not Interested</b> in overseas placement?<br><br>
             <span class="text-xs text-gray-500">Candidate will be archived into Not Interested count.</span>`,
      input: 'text',
      inputPlaceholder: 'Enter reason (e.g. Salary low, family refused, got other job)...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6B7280',
      cancelButtonColor: '#2563EB',
      confirmButtonText: 'Yes, Mark Not Interested'
    });

    if (reason === undefined) return;

    setActionLoading(true);
    try {
      const res = await apiCategorizeLead(lead._id, {
        isPassportHolder: 'NOT_INTERESTED',
        phone: lead.phone,
        remarks: reason ? `Not Interested Reason: ${reason}` : 'Candidate marked Not Interested during calling'
      });

      const updatedLead = res?.data || {
        ...lead,
        isPassportHolder: 'NOT_INTERESTED',
        currentStage: 'CANCELLED',
        isHold: true
      };
      setLeads(prev => prev.map(l => l._id === lead._id ? { ...l, ...updatedLead } : l));

      Swal.fire({
        icon: 'info',
        title: 'Marked Not Interested',
        text: `Candidate ${lead.candidateName} has been recorded in the Not Interested list.`,
        confirmButtonColor: '#2563EB'
      });

      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.message || 'Could not update status.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Mark as Not Confirmed / Schedule Follow-up (FRD Section 7)
  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpModal || !followUpDate) return;

    setActionLoading(true);
    try {
      await apiCategorizeLead(followUpModal._id, {
        isPassportHolder: 'NOT_CONFIRMED',
        phone: followUpModal.phone,
        passportNumber: followUpModal.passportNumber || null,
        followUpDate: followUpDate,
        remarks: followUpNotes.trim()
      });

      Swal.fire({
        icon: 'success',
        title: 'Follow-up Scheduled',
        html: `Follow-up set for <b>${followUpModal.candidateName}</b> on <b>${followUpDate}</b>.<br>
               <span class="text-xs text-gray-500">${followUpNotes || 'No notes added'}</span>`,
        confirmButtonColor: '#2563EB'
      });

      setFollowUpModal(null);
      setFollowUpDate('');
      setFollowUpNotes('');
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Save Follow-up',
        text: err.message,
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Candidate Routing: Interview vs Direct CV Selection vs Staff Head Handover (FRD Section 9 & Phase 3)
  const handleApplyRouting = async (e) => {
    e.preventDefault();
    if (!routeModal) return;

    let toStage = 'INITIAL_INTERVIEW';
    let selectionMode = 'INTERVIEW';

    if (selectedRoute === 'DIRECT_CV') {
      toStage = 'MEDICAL_PROCESS';
      selectionMode = 'DIRECT_CV';
    } else if (selectedRoute === 'STAFF_HEAD') {
      toStage = 'STAFF_HEAD_HANDLING';
      selectionMode = 'STAFF_HEAD_HANDOVER';
    }

    setActionLoading(true);
    try {
      await apiTransferLeadStage(routeModal._id, {
        fromStage: 'CALLING_SCREENING',
        toStage,
        selectionMode,
        remarks: routeRemarks.trim() || `Candidate routed via ${
          selectedRoute === 'INTERVIEW' ? 'Interview Panel' : selectedRoute === 'STAFF_HEAD' ? 'Staff Head Desk' : 'Direct CV Selection'
        } by Calling Staff`
      });

      Swal.fire({
        icon: 'success',
        title: selectedRoute === 'INTERVIEW' 
          ? 'Transferred to Interview Panel!' 
          : selectedRoute === 'STAFF_HEAD' 
          ? 'Transferred to Staff Head Desk!' 
          : 'Selected by CV & Moved to Medical!',
        html: `Candidate <b>${routeModal.candidateName}</b> successfully transferred to <b>${toStage.replace(/_/g, ' ')}</b>.<br>
               <span class="text-xs text-gray-500 mt-2 block">Action logged to immutable audit history.</span>`,
        confirmButtonColor: '#2563EB'
      });

      setRouteModal(null);
      setRouteRemarks('');
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Routing Failed',
        text: err.message || 'Could not route candidate.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 6. View Candidate Details & Audit Log
  const handleOpenDetails = async (lead) => {
    setDetailLoading(true);
    setDetailCandidate(lead);
    try {
      const [leadRes, histRes] = await Promise.allSettled([
        apiGetLeadById(lead._id),
        apiGetLeadHistory(lead._id)
      ]);
      const fullLead = leadRes.status === 'fulfilled' && leadRes.value?.data ? leadRes.value.data : lead;
      const historyEvents = histRes.status === 'fulfilled' && histRes.value?.data ? histRes.value.data : [];
      setDetailCandidate({
        ...fullLead,
        history: historyEvents.length > 0 ? historyEvents : fullLead.history || []
      });
    } catch (err) {
      console.error('Failed to load candidate details', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // 6b. Two-Party Handover Handlers: Cancel Transfer & Confirm Receiving (Phase 2)
  const handleCancelTransfer = async (lead) => {
    const user = getCurrentUser();
    const isSender = lead.pendingTransfer?.fromUser?.toString() === user?._id?.toString();
    const isPrivileged = user?.role === 'STAFF_HEAD' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    if (!isSender && !isPrivileged) {
      Swal.fire({
        icon: 'error',
        title: 'Action Prohibited',
        text: 'Only the initiator (Calling Staff) or Staff Head can cancel this file transfer.',
        confirmButtonColor: '#EF4444'
      });
      return;
    }

    const { value: cancelReason } = await Swal.fire({
      title: 'Cancel Outgoing Transfer?',
      html: `Revert file for <b>${lead.candidateName}</b> back to your desk.<br><span class="text-xs text-gray-500">Provide a mandatory reason for cancellation:</span>`,
      input: 'text',
      inputPlaceholder: 'Reason for cancellation (e.g. Candidate changed selection)...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel Transfer',
      confirmButtonColor: '#DC2626'
    });

    if (cancelReason === undefined) return;

    setActionLoading(true);
    try {
      await apiCancelTransfer(lead._id, cancelReason || 'Cancelled by staff');
      Swal.fire({
        icon: 'success',
        title: 'Transfer Cancelled',
        text: 'File transfer cancelled. File returned to original queue.',
        confirmButtonColor: '#2563EB'
      });
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Cancellation Failed',
        text: err.message || 'Failed to cancel transfer.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceiveTransfer = async (lead) => {
    const { value: notes } = await Swal.fire({
      title: 'Receive & Accept File?',
      html: `You are taking official ownership of <b>${lead.candidateName}</b>'s file.<br><span class="text-xs text-emerald-600 font-bold">This will confirm two-party handover.</span>`,
      input: 'textarea',
      inputPlaceholder: 'Optional receiving remarks or physical file condition...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Accept & Take Custody',
      confirmButtonColor: '#059669'
    });

    if (notes === undefined) return;

    setActionLoading(true);
    try {
      await apiTransferLeadStage(lead._id, {
        fromStage: lead.currentStage,
        toStage: 'STAFF_HEAD_HANDLING',
        selectionMode: lead.selectionMode || 'NONE',
        remarks: notes || 'File received & accepted into custody'
      });
      Swal.fire({
        icon: 'success',
        title: 'File Received!',
        text: `You have successfully accepted ${lead.candidateName}'s file.`,
        confirmButtonColor: '#2563EB'
      });
      loadData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Receiving Failed',
        text: err.message || 'Failed to receive file.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setFilterCategory('ALL');
    setStaffFilter('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const isFilterActive = staffFilter !== 'ALL' || searchQuery || startDate || endDate;

  // Enquiry Action Handlers (Phase 1)
  const handleOpenRaiseEnquiry = (lead = null) => {
    setEnquiryForm({
      candidateName: lead ? lead.candidateName : '',
      phone: lead ? lead.phone : '',
      trade: lead ? (lead.trade || '') : '',
      category: 'CALLING',
      targetRole: 'STAFF_HEAD',
      priority: 'NORMAL',
      subject: lead ? `Enquiry for ${lead.candidateName} (${lead.leadId})` : '',
      message: ''
    });
    setEnquiryModalOpen(true);
  };

  const handleOpenReceivedEnquiries = async () => {
    setReceivedEnquiriesOpen(true);
    setEnquiryLoading(true);
    try {
      const res = await apiGetEnquiries({ type: 'RECEIVED' });
      if (res && res.success && Array.isArray(res.data)) {
        setEnquiryList(res.data);
      } else {
        setEnquiryList([]);
      }
    } catch (e) {
      console.error('Failed to load enquiries', e);
    } finally {
      setEnquiryLoading(false);
    }
  };

  const handleSubmitEnquiry = async (e) => {
    e.preventDefault();
    if (!enquiryForm.candidateName.trim() || !enquiryForm.phone.trim() || !enquiryForm.message.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Required Fields',
        text: 'Candidate Name, Phone Number, and Details are mandatory to raise an enquiry.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiRaiseEnquiry(enquiryForm);
      if (res && res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Enquiry Raised Successfully!',
          text: `Enquiry #${res.data?.enquiryId || ''} sent to ${enquiryForm.targetRole.replace(/_/g, ' ')}.`,
          confirmButtonColor: '#2563EB'
        });
        setEnquiryModalOpen(false);
      } else {
        throw new Error(res?.message || 'Failed to submit enquiry');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Enquiry Failed',
        text: err.message,
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickResolveEnquiry = async (enquiryId) => {
    const { value: responseText } = await Swal.fire({
      title: 'Respond & Resolve Enquiry',
      input: 'textarea',
      inputPlaceholder: 'Enter resolution details or remarks...',
      showCancelButton: true,
      confirmButtonText: 'Resolve Enquiry',
      confirmButtonColor: '#10B981'
    });

    if (!responseText) return;

    try {
      await apiRespondToEnquiry(enquiryId, responseText, 'RESOLVED');
      Swal.fire({
        icon: 'success',
        title: 'Enquiry Resolved',
        text: 'The enquiry has been marked as resolved.',
        confirmButtonColor: '#2563EB'
      });
      handleOpenReceivedEnquiries();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Resolution Failed',
        text: err.message,
        confirmButtonColor: '#EF4444'
      });
    }
  };

  // Direct Call Action with Feedback
  const handleCallCandidate = (lead) => {
    if (!lead.phone) {
      Swal.fire({
        icon: 'warning',
        title: 'No Phone Number',
        text: 'This candidate record does not have a valid contact number.',
        confirmButtonColor: '#2563EB'
      });
      return;
    }
    window.location.href = `tel:${lead.phone}`;
  };

  const activeStageObj = pipelineStages.find(s => s.id === activeStage) || pipelineStages[0];

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Calling & Client Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Client Pipeline & Candidate Queue</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              10 Dynamic Stages
            </span>
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Raise Enquiry Button (Phase 1) */}
          <button
            onClick={() => handleOpenRaiseEnquiry()}
            className="h-9 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Raise enquiry to any department/role"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Raise Enquiry</span>
          </button>

          {/* Received Enquiries Button (Phase 1) */}
          <button
            onClick={handleOpenReceivedEnquiries}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="View received enquiries for calling desk"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Enquiries Desk</span>
          </button>

          <button
            onClick={() => navigate('/calling/location-confirm')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Go to Step 13 Visa Location Confirmation Desk"
          >
            <MapPin className="w-3.5 h-3.5 text-purple-600" />
            <span>Interested Country &rarr;</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Calling Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. 10-Step Interactive Pipeline Strip (Mirroring Mobile App Flow) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-3.5 mb-5 overflow-hidden">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Client Pipeline Stages (01 — 10)</span>
          </div>
          <span className="text-[11px] font-semibold text-gray-400">
            Total Ingested: <b className="text-gray-900 font-mono">{leads.length}</b> leads
          </span>
        </div>

        {/* Horizontal Pipeline Steps */}
        <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            const count = stageCounts[stage.id] ?? 0;
            const isSelected = activeStage === stage.id;

            return (
              <button
                key={stage.id}
                onClick={() => {
                  setActiveStage(stage.id);
                  setActiveSubTab('ALL');
                }}
                className={`min-w-[170px] max-w-[200px] shrink-0 p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/30'
                    : 'bg-slate-50/70 hover:bg-white text-gray-700 border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {stage.id}
                  </span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-white/10 text-white' : 'bg-white text-gray-500 border border-gray-200'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <div className={`text-[12.5px] font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {stage.title}
                  </div>
                  <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                    {stage.subtitle}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between">
                  <span className="text-[10.5px] font-bold font-mono opacity-80">COUNT</span>
                  <span className={`text-[13px] font-black font-mono ${
                    isSelected ? 'text-emerald-300' : 'text-emerald-700'
                  }`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sub-Tab Pills & Filter Toolbar (With Universal Timeline Date Filter) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          {/* Stage Sub-Tabs (Dynamic Per Selected Stage) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
            {activeStageObj.subTabs.map(subTab => {
              const count = leads.filter(l => filterLeadByStageAndSubTab(l, activeStage, subTab.id)).length;
              const isSubActive = activeSubTab === subTab.id;

              return (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    isSubActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 bg-gray-50'
                  }`}
                >
                  <span>{subTab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-bold font-mono ${
                    isSubActive ? 'bg-white/20 text-white' : 'bg-white text-gray-700 border border-gray-200'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Timeline Date Filter & Staff Filter & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Universal Timeline From-To Date Range Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[11.5px] font-medium text-gray-700 focus:outline-none cursor-pointer"
                title="Filter by start date"
              />
              <span className="text-gray-400 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[11.5px] font-medium text-gray-700 focus:outline-none cursor-pointer"
                title="Filter by end date"
              />
            </div>

            {/* Calling Staff Selector */}
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-medium text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[140px]"
            >
              <option value="ALL">All Calling Officers</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Reset Filter Button */}
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-[12px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 4. Leads Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        
        {/* Table Header Summary */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
              <span>Stage {activeStage}: {activeStageObj.title}</span>
              <span className="text-gray-400 font-normal">/</span>
              <span className="text-blue-700 text-xs font-semibold">{activeSubTab.replace(/_/g, ' ')}</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {currentFilteredLeads.length} Candidates
            </span>
          </div>

          <div className="text-[11.5px] text-gray-500 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Live MongoDB Telemetry • Auto-synced with Flutter Mobile App</span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <span className="text-[13px] font-medium text-gray-600">Loading live pipeline candidates from database...</span>
          </div>
        ) : currentFilteredLeads.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-[15px]">No Candidates in this Stage</h4>
            <p className="text-[12.5px] text-gray-500 mt-1 mb-4 leading-relaxed">
              There are currently no candidates in <b>Stage {activeStage} ({activeStageObj.title})</b> matching sub-tab <b>{activeSubTab}</b>.
            </p>
            <button
              onClick={() => {
                setActiveSubTab('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold cursor-pointer transition-colors shadow-xs"
            >
              View All in Stage {activeStage}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1050px] text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                  <th className="py-3.5 px-4 whitespace-nowrap">Candidate & ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Phone & Origin</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Trade & Experience</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Passport Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Calling Staff</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Classification Action</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Next Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentFilteredLeads.map((lead) => {
                  const initial = lead.candidateName?.charAt(0) || 'C';
                  const isPassport = lead.isPassportHolder === 'YES';
                  const isNonPassport = lead.isPassportHolder === 'NO';
                  const staffName = lead.assignedCallingStaff?.name || 'Unassigned';

                  return (
                    <tr
                      key={lead._id}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* 1. Candidate & ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 text-[11px] font-black flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div 
                              onClick={() => handleOpenDetails(lead)}
                              className="font-bold text-gray-900 text-[13px] hover:text-blue-700 hover:underline cursor-pointer"
                            >
                              {lead.candidateName}
                            </div>
                            <div className="font-mono text-[10.5px] text-blue-600 font-semibold flex items-center gap-1">
                              <span>{lead.leadId}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-500 font-normal">{lead.source}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Phone & Origin */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a 
                            href={`tel:${lead.phone}`}
                            className="font-mono font-bold text-gray-900 hover:text-blue-600 text-[12px] flex items-center gap-1.5"
                            title="Click to call candidate"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            <span>{lead.phone}</span>
                          </a>
                          <button
                            onClick={() => handleCallCandidate(lead)}
                            className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer text-[10px] font-bold"
                            title="Quick Call Candidate"
                          >
                            Call
                          </button>
                        </div>
                        <div className="text-[11px] text-gray-400 pl-5">
                          {lead.city || lead.state || 'India'}
                        </div>
                      </td>

                      {/* 3. Trade & Experience */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800 text-[12.5px] max-w-[180px] truncate" title={lead.trade}>
                          {lead.trade || 'General Worker'}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium">
                          Exp: {lead.applicationForm?.experienceYears || 'Fresher'} yrs
                        </div>
                      </td>

                      {/* 4. Passport Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPassport ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Passport Holder</span>
                            </span>
                            <span className="font-mono text-[11px] font-bold text-gray-700 pl-1">
                              {lead.passportNumber || 'Pending Entry'}
                            </span>
                            {lead.followUpDate && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit mt-0.5" title={lead.followUpRemarks || ''}>
                                ⏰ Next Call: {new Date(lead.followUpDate).toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        ) : isNonPassport ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 w-fit">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>No Passport</span>
                            </span>
                            {lead.followUpDate && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit mt-0.5" title={lead.followUpRemarks || ''}>
                                ⏰ Next Call: {new Date(lead.followUpDate).toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        ) : lead.isPassportHolder === 'NOT_INTERESTED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            <RotateCcw className="w-3 h-3 text-gray-500" />
                            <span>Not Interested</span>
                          </span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Not Confirmed</span>
                            </span>
                            {lead.followUpDate && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit mt-0.5" title={lead.followUpRemarks || ''}>
                                ⏰ Next Call: {new Date(lead.followUpDate).toLocaleDateString('en-GB')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 5. Calling Staff */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0">
                            {staffName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[12px]">{staffName}</div>
                            <div className="text-[10px] text-gray-400">Calling Officer</div>
                          </div>
                        </div>
                      </td>

                      {/* 6. Classification Action Buttons */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Has Passport */}
                          <button
                            onClick={() => handleOpenPassportModal(lead)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-[11.5px] font-bold cursor-pointer transition-colors shadow-2xs"
                            title="Verify Indian Passport"
                          >
                            ✓ Has Passport
                          </button>

                          {/* No Passport */}
                          <button
                            onClick={() => handleMarkNonPassport(lead)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11.5px] font-medium cursor-pointer transition-colors shadow-2xs"
                            title="Candidate does not hold passport"
                          >
                            ✗ No Passport
                          </button>

                          {/* Not Interested */}
                          <button
                            onClick={() => handleMarkNotInterested(lead)}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl text-[11.5px] font-medium cursor-pointer transition-colors shadow-2xs"
                            title="Candidate is not interested in job/placement"
                          >
                            🚫 Not Interested
                          </button>

                          {/* Call Later */}
                          <button
                            onClick={() => {
                              setFollowUpModal(lead);
                              setFollowUpDate('');
                              setFollowUpNotes('');
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11.5px] font-medium cursor-pointer transition-colors shadow-2xs"
                            title="Schedule follow-up reminder"
                          >
                            ⏰ Call Later
                          </button>
                        </div>
                      </td>

                      {/* 7. Next Step: Full Form + Route to Interview / CV Selection (FRD Section 8 & 9) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isPassport ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Complete Full Form Button (FRD Section 8) */}
                            <button
                              onClick={() => navigate(`/candidates/add?leadId=${lead._id}&name=${encodeURIComponent(lead.candidateName)}&phone=${encodeURIComponent(lead.phone)}&passport=${encodeURIComponent(lead.passportNumber || '')}&trade=${encodeURIComponent(lead.trade || '')}`)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1 border ${
                                lead.applicationForm?.fatherName || lead.applicationForm?.dob
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              }`}
                              title="Fill / Edit Full Candidate Official Form (FRD Section 8)"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>{lead.applicationForm?.fatherName || lead.applicationForm?.dob ? 'Form OK' : 'Full Form'}</span>
                            </button>

                            {/* Staff Head & Transfer Action Buttons (Phase 2) */}
                            {lead.fileTransferDetails?.status === 'PENDING_RECEIVING' || lead.pendingTransfer?.hasPending ? (
                              <>
                                <button
                                  onClick={() => handleReceiveTransfer(lead)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
                                  title="Receive & Accept File Custody"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Receive</span>
                                </button>
                                <button
                                  onClick={() => handleCancelTransfer(lead)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
                                  title="Cancel Outgoing Transfer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Cancel</span>
                                </button>
                              </>
                            ) : null}

                            <button
                              onClick={() => {
                                setRouteModal(lead);
                                setSelectedRoute('INTERVIEW');
                                setRouteRemarks('');
                              }}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11.5px] font-bold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1"
                              title="Route candidate to Interview Panel or Direct CV Selection"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Route</span>
                            </button>

                            <button
                              onClick={() => handleOpenDetails(lead)}
                              className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {lead.pendingTransfer?.hasPending && (
                              <button
                                onClick={() => handleCancelTransfer(lead)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold cursor-pointer"
                              >
                                Cancel Transfer
                              </button>
                            )}
                            <span className="text-gray-400 text-[11.5px] italic">Verify Passport First</span>
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

        {/* Footer */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500 flex-wrap gap-2">
          <span>Showing <b>{currentFilteredLeads.length}</b> candidates in Stage {activeStage} ({activeStageObj.title})</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Need to confirm overseas job location?</span>
            <button
              onClick={() => navigate('/calling/location-confirm')}
              className="text-purple-600 hover:underline font-bold cursor-pointer flex items-center gap-0.5"
            >
              <span>Go to Step 13 Location Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Passport Details Entry Modal */}
      {passportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-800 text-white">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-[16px]">Capture Indian Passport</h3>
                  <p className="text-[11px] text-emerald-200 font-medium">FRD Section 06 • Passport Number & Phone Mandate</p>
                </div>
              </div>
              <button 
                onClick={() => setPassportModal(null)} 
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassport} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[12.5px] space-y-0.5">
                <div>Candidate: <strong className="text-gray-900">{passportModal.candidateName}</strong> ({passportModal.leadId})</div>
                <div>Trade: <span className="font-semibold text-gray-700">{passportModal.trade || 'General Worker'}</span></div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Valid Passport Number * (Format: A1234567)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Z9876543"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirmed Calling Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={confirmPhone}
                  onChange={(e) => setConfirmPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPassportModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[12.5px] font-bold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</>
                  ) : (
                    <>Save & Unlock Candidate Form</>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 6. Schedule Follow-up Modal */}
      {followUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-800 text-white">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-[16px]">Schedule Follow-up Call</h3>
                  <p className="text-[11px] text-amber-200 font-medium">Candidate not yet confirmed or requested callback</p>
                </div>
              </div>
              <button 
                onClick={() => setFollowUpModal(null)} 
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12.5px]">
                Calling Candidate: <strong>{followUpModal.candidateName}</strong> ({followUpModal.phone})
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Follow-up Date *
                </label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Follow-up Notes / Calling Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Candidate was driving, requested callback at 4 PM tomorrow..."
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setFollowUpModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-[12.5px] font-bold cursor-pointer shadow-sm transition-all"
                >
                  {actionLoading ? 'Saving...' : 'Set Follow-up'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 7. Candidate Routing Modal (FRD Section 9: Interview vs CV Selection) */}
      {routeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-900 text-white">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="font-bold text-[16px]">Route Candidate to Next Stage</h3>
                  <p className="text-[11px] text-blue-200 font-medium">FRD Section 09 • Interview vs CV Selection</p>
                </div>
              </div>
              <button 
                onClick={() => setRouteModal(null)} 
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyRouting} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px]">
                Candidate: <strong>{routeModal.candidateName}</strong> ({routeModal.leadId})<br />
                Passport: <strong className="font-mono text-emerald-700">{routeModal.passportNumber}</strong> • Trade: {routeModal.trade}
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Workflow Route *
                </label>
                <div className="space-y-2">
                  
                  {/* Option A: Interview Panel */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRoute === 'INTERVIEW' ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="candidateRoute"
                      value="INTERVIEW"
                      checked={selectedRoute === 'INTERVIEW'}
                      onChange={() => setSelectedRoute('INTERVIEW')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-bold text-[12.5px] text-gray-900">Option A: Transfer to Interview Panel</div>
                      <div className="text-[11px] text-gray-500">Candidate moves to Interview Panel (Step 04) for trade test & viva evaluation.</div>
                    </div>
                  </label>

                  {/* Option B: CV Selection */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRoute === 'DIRECT_CV' ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="candidateRoute"
                      value="DIRECT_CV"
                      checked={selectedRoute === 'DIRECT_CV'}
                      onChange={() => setSelectedRoute('DIRECT_CV')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <div className="font-bold text-[12.5px] text-gray-900">Option B: Selected by CV (Bypass Interview)</div>
                      <div className="text-[11px] text-gray-500">Candidate bypasses interview panel and moves straight to Medical & Payment Booking (Step 05).</div>
                    </div>
                  </label>

                  {/* Option C: Transfer to Staff Head (Phase 3 Requirement) */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRoute === 'STAFF_HEAD' ? 'border-purple-500 bg-purple-50/40' : 'border-gray-200'
                  }`}>
                    <input
                      type="radio"
                      name="candidateRoute"
                      value="STAFF_HEAD"
                      checked={selectedRoute === 'STAFF_HEAD'}
                      onChange={() => setSelectedRoute('STAFF_HEAD')}
                      className="mt-0.5 text-purple-600"
                    />
                    <div>
                      <div className="font-bold text-[12.5px] text-gray-900">Option C: Send to Staff Head Desk (Handover)</div>
                      <div className="text-[11px] text-gray-500">Send candidate file to Staff Head for client pipeline approval, vacancy slot, or reassignment.</div>
                    </div>
                  </label>

                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Routing Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. GCC returned driver, Gulf license verified, sent for trade test..."
                  value={routeRemarks}
                  onChange={(e) => setRouteRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRouteModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-[12.5px] font-bold cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? 'Routing...' : 'Confirm Stage Transfer'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 8. Candidate Full Detail & Audit History Modal */}
      {detailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-[13px] flex items-center justify-center">
                  {detailCandidate.candidateName?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-[16px]">{detailCandidate.candidateName}</h3>
                  <p className="text-[11.5px] text-emerald-300 font-mono">
                    {detailCandidate.leadId} • {detailCandidate.phone}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDetailCandidate(null)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Passport Number</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5 font-mono">
                    {detailCandidate.passportNumber || 'No Passport'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Trade Skill</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.trade || 'General Worker'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Calling Officer</div>
                  <div className="font-bold text-blue-700 text-[13px] mt-0.5">
                    {detailCandidate.assignedCallingStaff?.name || 'Unassigned'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Location / State</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.city || detailCandidate.state || 'India'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Lead Source</div>
                  <div className="font-bold text-gray-900 text-[13px] mt-0.5">
                    {detailCandidate.source}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10.5px] text-gray-400 font-bold uppercase">Hold Status</div>
                  <div className="font-bold text-[13px] mt-0.5">
                    {detailCandidate.isHold ? (
                      <span className="text-rose-600 font-bold">On Hold</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">Active</span>
                    )}
                  </div>
                </div>
              </div>

              {/* History Log */}
              <div>
                <h4 className="font-bold text-gray-900 text-[13.5px] flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Immutable Activity & Audit History</span>
                </h4>

                {detailLoading ? (
                  <div className="py-6 text-center text-gray-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                    Loading audit trail...
                  </div>
                ) : !detailCandidate.history || detailCandidate.history.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-gray-500 text-xs">
                    No activity history recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {detailCandidate.history.map((h, i) => (
                      <div key={h._id || i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px]">
                        <div className="flex items-center justify-between text-gray-500 mb-1">
                          <span className="font-bold text-emerald-800 font-mono text-[11px] bg-emerald-100 px-2 py-0.5 rounded">
                            {h.actionType?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(h.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-gray-800 font-medium">{h.remarks}</div>
                        {h.performedBy && (
                          <div className="text-[10.5px] text-gray-400 mt-1">
                            Logged by: <b>{h.performedBy.name || 'User'}</b> ({h.performedBy.role || 'Staff'})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end shrink-0">
              <button
                onClick={() => setDetailCandidate(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[12px] font-bold cursor-pointer"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 9. Universal Raise Enquiry Modal (Phase 1) */}
      {enquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-[15px]">Raise Enquiry Across Roles</h3>
                  <p className="text-[11px] text-gray-300">Send dynamic enquiry to Staff Head, Data Controller, or Accounts</p>
                </div>
              </div>
              <button
                onClick={() => setEnquiryModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEnquiry} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Candidate Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.candidateName}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, candidateName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500"
                    placeholder="Candidate name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500"
                    placeholder="Candidate mobile"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Target Department / Role *
                  </label>
                  <select
                    value={enquiryForm.targetRole}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, targetRole: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="STAFF_HEAD">Staff Head</option>
                    <option value="DATA_CONTROLLER">Data Controller</option>
                    <option value="ACCOUNTS">Accounts Desk</option>
                    <option value="MEDICAL_DEPT">Medical Department</option>
                    <option value="INTERVIEW_PANEL">Interview Panel</option>
                    <option value="PRE_VISA_MANAGER">Pre-Visa Manager</option>
                    <option value="VISA_MANAGER">Visa Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={enquiryForm.priority}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Escalation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Enquiry Subject
                </label>
                <input
                  type="text"
                  value={enquiryForm.subject}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Passport check issue, advance payment verification..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Detailed Enquiry Message *
                </label>
                <textarea
                  required
                  rows={3}
                  value={enquiryForm.message}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500"
                  placeholder="Explain clearly what assistance or verification is needed..."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEnquiryModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-[12px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Received Enquiries Desk Drawer (Phase 1) */}
      {receivedEnquiriesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-300" />
                <div>
                  <h3 className="font-bold text-[15px]">Calling Desk Enquiry Box</h3>
                  <p className="text-[11px] text-blue-200 font-medium">All enquiries received & awaiting response</p>
                </div>
              </div>
              <button
                onClick={() => setReceivedEnquiriesOpen(false)}
                className="text-gray-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {enquiryLoading ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading enquiries...
                </div>
              ) : enquiryList.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No enquiries received at this time.
                </div>
              ) : (
                enquiryList.map((enq) => (
                  <div key={enq._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[12px] space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {enq.enquiryId}
                        </span>
                        <span className="font-bold text-gray-900 text-[13px]">{enq.candidateName}</span>
                        <span className="text-gray-400 text-[11px]">({enq.phone})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                        enq.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {enq.status}
                      </span>
                    </div>

                    <div className="text-gray-800 font-semibold">{enq.subject}</div>
                    <div className="text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100">
                      {enq.message}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                      <span>Raised by: <b>{enq.raisedByName}</b> ({enq.raisedByRole})</span>
                      {enq.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleQuickResolveEnquiry(enq._id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                        >
                          Respond & Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end shrink-0">
              <button
                onClick={() => setReceivedEnquiriesOpen(false)}
                className="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-[12px] font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
