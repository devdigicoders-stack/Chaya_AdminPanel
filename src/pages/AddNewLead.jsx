import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, User, Calendar, Mail, Phone, Globe, MapPin,
  Share2, Briefcase, Info, CheckCircle2, ArrowRight,
  AlertTriangle, Sparkles, ShieldCheck, FileSpreadsheet,
  Clock, X, Plus, PhoneCall, RefreshCw, Layers
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiCreateLead, apiGetUsers, apiGetLeads } from '../utils/api';

const steps = [
  { id: 1, label: 'Candidate Identity', sub: 'Name, phone & sourcing channel' },
  { id: 2, label: 'Passport & Trade Profile', sub: 'Passport verification & technical skill' },
  { id: 3, label: 'Overseas & Route Allocation', sub: 'Destination, salary & processing route' },
];

const gccCountries = [
  { label: 'Saudi Arabia 🇸🇦', value: 'Saudi Arabia' },
  { label: 'United Arab Emirates 🇦🇪', value: 'United Arab Emirates' },
  { label: 'Qatar 🇶🇦', value: 'Qatar' },
  { label: 'Oman 🇴🇲', value: 'Oman' },
  { label: 'Kuwait 🇰🇼', value: 'Kuwait' },
  { label: 'Bahrain 🇧🇭', value: 'Bahrain' },
];

const tradesList = [
  '6G Pipe Fabricator & Welder (TIG/MIG)',
  'Industrial Electrician (HV/LV 11KV)',
  'Heavy Duty Trailer / Crane Driver',
  'HVAC Duct Fabricator & Chiller Tech',
  'Civil Finishing Mason & Tiler',
  'Scaffolder & Rigger Level-2',
  'Shuttering Carpenter & Formwork Tech',
  'Plumber & Pipefitter (GI/CPVC)',
  'Steel Fabricator & Fitter',
  'AC Technician (Split & VRV)',
  'Safety Officer (NEBOSH IGC)',
  'QC Inspector (AWS / ASNT Level-2)',
  'Forklift & Heavy Equipment Operator',
  'Painter & Blaster (Industrial)',
  'Helper & General Worker',
];

const sourceOptions = [
  { label: 'WhatsApp Business', value: 'WHATSAPP' },
  { label: 'Facebook / Meta Ads', value: 'FACEBOOK' },
  { label: 'Excel Bulk Import', value: 'EXCEL' },
  { label: 'Branch Walk-in', value: 'WALK_IN' },
  { label: 'Agent / Sub-agent Referral', value: 'AGENT_REFERRAL' },
  { label: 'Direct Cold Call / Other', value: 'MANUAL' },
];

const indianStates = [
  'Bihar', 'Uttar Pradesh', 'Jharkhand', 'West Bengal', 'Rajasthan',
  'Odisha', 'Maharashtra', 'Gujarat', 'Madhya Pradesh', 'Haryana',
  'Delhi', 'Punjab', 'Uttarakhand', 'Other'
];

const INITIAL_FORM = {
  // Step 1: Identity & Contact
  fullName: '',
  fatherName: '',
  dob: '',
  gender: 'Male',
  phone: '',
  altPhone: '',
  email: '',
  state: '',
  city: '',
  source: 'WHATSAPP',
  assignedTo: '',
  // Step 2: Passport & Trade
  hasPassport: 'Yes',
  passportNumber: '',
  passportIssueDate: '',
  passportExpiry: '',
  trade: '',
  experience: '',
  hasPreviousGCC: 'No',
  previousCountry: '',
  notes: '',
  // Step 3: Overseas Preferences & Route
  targetCountry: 'Saudi Arabia',
  expectedSalary: '',
  routingOption: 'INTERVIEW', // 'INTERVIEW' or 'CV_SELECTED'
};

export default function AddNewLead() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdLead, setCreatedLead] = useState(null);

  // Dynamic database records
  const [staffList, setStaffList] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // 1. Fetch live staff & recent leads from MongoDB
  const loadInitialData = async () => {
    try {
      setLoadingRecent(true);
      const [usersRes, leadsRes] = await Promise.allSettled([
        apiGetUsers(),
        apiGetLeads({ limit: 5 })
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        const users = usersRes.value.data.filter(u => u.isActive !== false);
        setStaffList(users);
      }

      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        setRecentLeads(leadsRes.value.data.slice(0, 4));
      }
    } catch (err) {
      console.error('Error loading initial data', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Validation
  const validateStep = () => {
    if (currentStep === 1) {
      if (!form.fullName.trim()) {
        Swal.fire({ icon: 'warning', title: 'Candidate Name Required', text: 'Please enter the candidate’s full name.', confirmButtonColor: '#2563EB' });
        return false;
      }
      if (!form.phone.trim()) {
        Swal.fire({ icon: 'warning', title: 'Phone Number Required', text: 'Please enter a valid 10-digit mobile number.', confirmButtonColor: '#2563EB' });
        return false;
      }
      const cleanPhone = form.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        Swal.fire({ icon: 'warning', title: 'Invalid Phone Number', text: 'Mobile number must be at least 10 digits.', confirmButtonColor: '#2563EB' });
        return false;
      }
    }

    if (currentStep === 2) {
      if (form.hasPassport === 'Yes' && !form.passportNumber.trim()) {
        Swal.fire({ icon: 'warning', title: 'Passport Number Required', text: 'Please enter the candidate’s Indian passport number.', confirmButtonColor: '#2563EB' });
        return false;
      }
      if (!form.trade) {
        Swal.fire({ icon: 'warning', title: 'Trade Category Required', text: 'Please select candidate’s primary technical trade.', confirmButtonColor: '#2563EB' });
        return false;
      }
      if (!form.experience) {
        Swal.fire({ icon: 'warning', title: 'Experience Required', text: 'Please select candidate’s total years of experience.', confirmButtonColor: '#2563EB' });
        return false;
      }
    }

    if (currentStep === 3) {
      if (!form.targetCountry) {
        Swal.fire({ icon: 'warning', title: 'Target Country Required', text: 'Please select target overseas destination country.', confirmButtonColor: '#2563EB' });
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setCurrentStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit to Backend
  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const staffUser = staffList.find(s => s._id === form.assignedTo);
      const assignedCallingStaff = staffUser?.role === 'CALLING_STAFF' ? staffUser._id : null;
      const assignedStaffHead = staffUser?.role === 'STAFF_HEAD' ? staffUser._id : (staffUser?.teamHeadId || null);

      const payload = {
        candidateName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email?.trim() || '',
        city: form.city.trim() || '',
        state: form.state || '',
        trade: form.trade || '',
        source: form.source || 'MANUAL',
        passportNumber: form.hasPassport === 'Yes' ? form.passportNumber.trim().toUpperCase() : null,
        isPassportHolder: form.hasPassport === 'Yes' ? 'YES' : form.hasPassport === 'No' ? 'NO' : 'NOT_CONFIRMED',
        notes: form.notes?.trim() || '',
        assignedCallingStaff,
        assignedStaffHead,
        selectionMode: form.routingOption === 'CV_SELECTED' ? 'DIRECT_CV' : 'INTERVIEW',
        applicationForm: {
          trade: form.trade || '',
          experienceYears: form.experience || '',
          preferredCountries: form.targetCountry ? [form.targetCountry] : [],
          expectedSalary: form.expectedSalary?.trim() || '',
          fatherName: form.fatherName?.trim() || '',
          dob: form.dob || '',
          gender: form.gender || 'Male',
          altPhone: form.altPhone?.trim() || '',
          city: form.city?.trim() || '',
          state: form.state || '',
          passportIssueDate: form.passportIssueDate || '',
          passportExpiry: form.passportExpiry || '',
          hasPreviousGCC: form.hasPreviousGCC || 'No',
          previousCountry: form.previousCountry || '',
        }
      };

      const res = await apiCreateLead(payload);
      const leadData = res.data;
      setCreatedLead(leadData);
      setSubmitted(true);

      // Refresh recent leads list
      loadInitialData();

      Swal.fire({
        icon: 'success',
        title: 'Candidate Onboarded!',
        html: `Lead ID <b>${leadData?.leadId || 'CONFIRMED'}</b> has been successfully recorded in the central recruitment pool.`,
        confirmButtonColor: '#2563EB',
        confirmButtonText: 'Great!'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: err.message || 'Could not register lead in database. Check phone duplicate or network.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic Readiness Calculation
  const calculateReadiness = () => {
    let score = 0;
    if (form.fullName.trim()) score += 20;
    if (form.phone.trim()) score += 20;
    if (form.source) score += 10;
    if (form.trade) score += 15;
    if (form.experience) score += 10;
    if (form.hasPassport === 'Yes' && form.passportNumber.trim()) score += 15;
    else if (form.hasPassport !== 'Yes') score += 10;
    if (form.targetCountry) score += 10;
    return Math.min(score, 100);
  };

  const readinessScore = calculateReadiness();

  const inputCls = 'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors';
  const selectCls = 'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-800 focus:outline-none focus:border-blue-500 appearance-none transition-colors cursor-pointer';
  const labelCls = 'block text-[11.5px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider';

  /* ──────────────────────────────────────────────────────────
     SUCCESS VIEW
  ────────────────────────────────────────────────────────── */
  if (submitted && createdLead) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center py-16 px-4 text-center">
        <div className="w-18 h-18 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <h2 className="text-[24px] font-black text-gray-900 mb-1.5">
          Candidate Onboarded Successfully!
        </h2>
        <p className="text-[13.5px] text-gray-500 max-w-md mx-auto mb-4">
          <b className="text-gray-900">{createdLead.candidateName}</b> is registered into the central recruitment pool.
        </p>

        <div className="mb-6 px-5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 inline-flex items-center gap-2 text-blue-700 font-mono font-bold text-[16px] shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          {createdLead.leadId}
        </div>

        {/* Lead Summary Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full mb-8 text-[12.5px] text-left">
          <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] text-gray-400 block font-medium">Candidate Phone</span>
            <span className="font-bold text-gray-900 mt-0.5 block">{createdLead.phone}</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] text-gray-400 block font-medium">Trade & Role</span>
            <span className="font-bold text-gray-900 mt-0.5 block truncate">{createdLead.trade || 'General'}</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] text-gray-400 block font-medium">Passport Status</span>
            <span className={`font-bold mt-0.5 block ${createdLead.isPassportHolder === 'YES' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {createdLead.isPassportHolder === 'YES' ? `✓ ${createdLead.passportNumber || 'Holder'}` : '✗ No Passport'}
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] text-gray-400 block font-medium">Assigned Route</span>
            <span className="font-bold text-purple-700 mt-0.5 block">
              {form.routingOption === 'INTERVIEW' ? 'Interview Panel' : 'CV Direct Medical'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 justify-center">
          <button
            onClick={() => navigate('/leads')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <span>View in Leads Pool</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {form.routingOption === 'INTERVIEW' ? (
            <button
              onClick={() => navigate('/interview/initial')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[13px] flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Proceed to Technical Interview</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/medical/all')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[13px] flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Proceed to Medical Screening</span>
            </button>
          )}

          <button
            onClick={() => {
              setSubmitted(false);
              setCreatedLead(null);
              setForm(INITIAL_FORM);
              setCurrentStep(1);
            }}
            className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-[13px] cursor-pointer transition-colors"
          >
            + Add Another Lead
          </button>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     MAIN FORM VIEW
  ────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">Leads</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">New Candidate</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Register New Candidate
          </h1>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/leads/import')}
            className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={() => navigate('/leads')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* 2. 3-Step Clean Navigation Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-3 sm:p-4 mb-6">
        <div className="flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (step.id < currentStep) setCurrentStep(step.id);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    step.id < currentStep ? 'hover:bg-gray-50' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 transition-all ${
                    isCompleted ? 'bg-emerald-500 text-white shadow-xs' :
                    isActive ? 'bg-blue-600 text-white shadow-sm ring-4 ring-blue-100' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="text-left">
                    <div className={`text-[12px] font-bold whitespace-nowrap ${
                      isActive ? 'text-blue-700' : isCompleted ? 'text-emerald-700' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-[10px] text-gray-400 hidden sm:block whitespace-nowrap">
                      {step.sub}
                    </div>
                  </div>
                </button>

                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-[2px] rounded-full min-w-[20px] max-w-[80px] ${
                    currentStep > step.id ? 'bg-emerald-400' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Main Form Grid */}
      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── LEFT: Active Form Step ── */}
        <div className="flex-1 min-w-0">

          {/* ────── STEP 1: CANDIDATE IDENTITY ────── */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 sm:p-6 space-y-5">
              <div className="border-b border-gray-100 pb-3.5">
                <h3 className="font-bold text-gray-900 text-[16px] flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-blue-600" />
                  Step 1: Candidate Personal Details & Sourcing
                </h3>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  Core identity fields required for anti-duplicate verification and CRM tracking.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className={labelCls}>
                    Full Name (as per Passport) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => updateForm('fullName', e.target.value)}
                      placeholder="e.g. Ramesh Kumar Yadav"
                      className={`${inputCls} pl-9 font-medium`}
                    />
                  </div>
                </div>

                {/* Father's Name */}
                <div>
                  <label className={labelCls}>Father's Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.fatherName}
                      onChange={(e) => updateForm('fatherName', e.target.value)}
                      placeholder="e.g. Ram Babu Yadav"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className={labelCls}>Date of Birth</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => updateForm('dob', e.target.value)}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className={labelCls}>Gender</label>
                  <div className="flex gap-2">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateForm('gender', g)}
                        className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all cursor-pointer ${
                          form.gender === g
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile / WhatsApp */}
                <div>
                  <label className={labelCls}>
                    Mobile / WhatsApp (Unique) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex">
                    <div className="flex items-center gap-1 px-3 py-2.5 border border-gray-200 border-r-0 rounded-l-xl bg-gray-50 text-[12px] font-bold text-gray-700 shrink-0 whitespace-nowrap">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateForm('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-r-xl text-[13px] font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Alt Phone */}
                <div>
                  <label className={labelCls}>Alternate Contact Number (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={form.altPhone}
                      onChange={(e) => updateForm('altPhone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      placeholder="Family or alternate phone"
                      className={`${inputCls} pl-9 font-mono`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={labelCls}>Email Address (Optional)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      placeholder="candidate@gmail.com"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label className={labelCls}>State / Region</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.state}
                      onChange={(e) => updateForm('state', e.target.value)}
                      className={`${selectCls} pl-9`}
                    >
                      <option value="">Select State</option>
                      {indianStates.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                  </div>
                </div>

                {/* City / District */}
                <div>
                  <label className={labelCls}>City / District</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateForm('city', e.target.value)}
                      placeholder="e.g. Siwan, Gopalganj, Balia"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                {/* Sourcing Channel */}
                <div>
                  <label className={labelCls}>
                    Lead Ingestion Source <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Share2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.source}
                      onChange={(e) => updateForm('source', e.target.value)}
                      className={`${selectCls} pl-9 font-medium`}
                    >
                      {sourceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                  </div>
                </div>

                {/* Dynamic Staff Assignment Dropdown */}
                <div>
                  <label className={labelCls}>
                    Assign to Staff Member (Optional)
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.assignedTo}
                      onChange={(e) => updateForm('assignedTo', e.target.value)}
                      className={`${selectCls} pl-9 font-medium`}
                    >
                      <option value="">Unassigned Pool (Staff Head will distribute)</option>
                      {staffList.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.role?.replace('_', ' ') || 'Staff'})
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ────── STEP 2: PASSPORT & TRADE PROFILE ────── */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 sm:p-6 space-y-5">
              <div className="border-b border-gray-100 pb-3.5">
                <h3 className="font-bold text-gray-900 text-[16px] flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
                  Step 2: Passport Verification & Technical Trade
                </h3>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  FRD Section 7 & 8 gatekeeper: passport credentials and overseas work skills.
                </p>
              </div>

              <div className="space-y-5">
                
                {/* Passport Status 3-Way Selector */}
                <div>
                  <label className={labelCls}>
                    Passport Verification Status <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { key: 'Yes', label: '✓ Valid Passport Holder', desc: 'Eligible for Calling Queue & Interview', color: 'border-emerald-500 bg-emerald-50/70 text-emerald-800' },
                      { key: 'No', label: '✗ No Passport', desc: 'Auto-quarantined on hold to protect fee', color: 'border-rose-500 bg-rose-50/70 text-rose-800' },
                      { key: 'Applied', label: '⏳ Applied / In Process', desc: 'Awaiting passport book issuance', color: 'border-amber-500 bg-amber-50/70 text-amber-800' },
                    ].map((opt) => (
                      <div
                        key={opt.key}
                        onClick={() => updateForm('hasPassport', opt.key)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          form.hasPassport === opt.key
                            ? `${opt.color} shadow-xs`
                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-[12.5px] font-bold">{opt.label}</div>
                        <div className="text-[10.5px] text-gray-500 mt-0.5 leading-snug">{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Passport Details (only if Yes) */}
                {form.hasPassport === 'Yes' && (
                  <div className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>
                        Passport Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.passportNumber}
                        onChange={(e) => updateForm('passportNumber', e.target.value.toUpperCase())}
                        placeholder="e.g. P7823901"
                        className={`${inputCls} font-mono uppercase tracking-widest font-bold`}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Passport Issue Date</label>
                      <input
                        type="date"
                        value={form.passportIssueDate}
                        onChange={(e) => updateForm('passportIssueDate', e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Passport Expiry Date</label>
                      <input
                        type="date"
                        value={form.passportExpiry}
                        onChange={(e) => updateForm('passportExpiry', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}

                {/* Technical Trade */}
                <div>
                  <label className={labelCls}>
                    Technical Trade / Job Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.trade}
                      onChange={(e) => updateForm('trade', e.target.value)}
                      className={`${selectCls} pl-9 font-semibold`}
                    >
                      <option value="">Select Technical Skill Trade</option>
                      {tradesList.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                  </div>
                </div>

                {/* Experience & GCC History */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Experience */}
                  <div>
                    <label className={labelCls}>
                      Total Work Experience <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={form.experience}
                        onChange={(e) => updateForm('experience', e.target.value)}
                        className={`${selectCls} pl-9`}
                      >
                        <option value="">Select Years of Experience</option>
                        {['Fresher (0-1 Year)', '1-2 Years', '2-3 Years', '3-5 Years', '5-7 Years', '7-10 Years', '10+ Years'].map((exp) => (
                          <option key={exp} value={exp}>{exp}</option>
                        ))}
                      </select>
                      <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                    </div>
                  </div>

                  {/* GCC Experience */}
                  <div>
                    <label className={labelCls}>Prior Gulf / GCC Experience?</label>
                    <div className="flex gap-2">
                      {['No', 'Yes'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateForm('hasPreviousGCC', opt)}
                          className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all cursor-pointer ${
                            form.hasPreviousGCC === opt
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Previous GCC Country if Yes */}
                {form.hasPreviousGCC === 'Yes' && (
                  <div>
                    <label className={labelCls}>Previous GCC Country Worked In</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={form.previousCountry}
                        onChange={(e) => updateForm('previousCountry', e.target.value)}
                        className={`${selectCls} pl-9`}
                      >
                        <option value="">Select Country</option>
                        {gccCountries.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                    </div>
                  </div>
                )}

                {/* Calling Staff Observations / Notes */}
                <div>
                  <label className={labelCls}>Calling Staff Remarks / Operator Notes</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => updateForm('notes', e.target.value)}
                    placeholder="Candidate fitness, readiness, English/Hindi communication, GCC returnee notes..."
                    className={`${inputCls} resize-none`}
                  />
                </div>

              </div>
            </div>
          )}

          {/* ────── STEP 3: OVERSEAS PREFERENCE & ROUTE ────── */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 sm:p-6 space-y-5">
              <div className="border-b border-gray-100 pb-3.5">
                <h3 className="font-bold text-gray-900 text-[16px] flex items-center gap-2">
                  <Globe className="w-4.5 h-4.5 text-blue-600" />
                  Step 3: Target Country & Processing Route Allocation
                </h3>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  FRD Section 9: Candidate allocation between Technical Interview or CV Direct Medical.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Target GCC Country */}
                <div>
                  <label className={labelCls}>
                    Target GCC Destination <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={form.targetCountry}
                      onChange={(e) => updateForm('targetCountry', e.target.value)}
                      className={`${selectCls} pl-9 font-semibold`}
                    >
                      {gccCountries.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
                  </div>
                </div>

                {/* Expected Salary */}
                <div>
                  <label className={labelCls}>Expected Monthly Salary (Optional)</label>
                  <input
                    type="text"
                    value={form.expectedSalary}
                    onChange={(e) => updateForm('expectedSalary', e.target.value)}
                    placeholder="e.g. 2,000 SAR / 1,800 AED"
                    className={inputCls}
                  />
                </div>

              </div>

              {/* FRD Section 9: Route Selection Options */}
              <div className="p-4.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Candidate Processing Route (FRD Section 9)
                  </label>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full uppercase">
                    Mandatory
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Route A: Interview */}
                  <div
                    onClick={() => updateForm('routingOption', 'INTERVIEW')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.routingOption === 'INTERVIEW'
                        ? 'bg-white border-purple-600 shadow-xs ring-2 ring-purple-100'
                        : 'bg-white/70 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="routingOption"
                        checked={form.routingOption === 'INTERVIEW'}
                        onChange={() => updateForm('routingOption', 'INTERVIEW')}
                        className="mt-1 text-purple-600 cursor-pointer"
                      />
                      <div>
                        <div className="text-[13px] font-bold text-gray-900">
                          Option A: Transfer to Interview Panel
                        </div>
                        <p className="text-[11.5px] text-gray-500 mt-1 leading-snug">
                          Candidate will appear for technical trade interview. Once <b>PASSED</b>, they move to Medical & Booking.
                        </p>
                        <span className="inline-block mt-2 text-[10.5px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          → Step 04 Interview Desk
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Route B: CV Selected */}
                  <div
                    onClick={() => updateForm('routingOption', 'CV_SELECTED')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.routingOption === 'CV_SELECTED'
                        ? 'bg-white border-emerald-600 shadow-xs ring-2 ring-emerald-100'
                        : 'bg-white/70 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="routingOption"
                        checked={form.routingOption === 'CV_SELECTED'}
                        onChange={() => updateForm('routingOption', 'CV_SELECTED')}
                        className="mt-1 text-emerald-600 cursor-pointer"
                      />
                      <div>
                        <div className="text-[13px] font-bold text-gray-900">
                          Option B: Selected by CV (Direct Medical)
                        </div>
                        <p className="text-[11.5px] text-gray-500 mt-1 leading-snug">
                          Bypasses interview panel. Direct overseas employer CV approval, eligible directly for Medical exam.
                        </p>
                        <span className="inline-block mt-2 text-[10.5px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          → Step 05 Medical Desk
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Review Summary Card */}
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 text-[12.5px]">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-[13px]">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Pre-Submission Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-gray-600">
                  <div>Name: <b className="text-gray-900">{form.fullName || '—'}</b></div>
                  <div>Phone: <b className="text-gray-900 font-mono">+91 {form.phone || '—'}</b></div>
                  <div>Trade: <b className="text-gray-900">{form.trade || '—'}</b></div>
                  <div>Passport: <b className="text-gray-900 font-mono">{form.hasPassport === 'Yes' ? (form.passportNumber || 'Pending') : 'No'}</b></div>
                  <div>Target: <b className="text-gray-900">{form.targetCountry || '—'}</b></div>
                  <div>Route: <b className="text-purple-700">{form.routingOption === 'INTERVIEW' ? 'Interview' : 'Direct CV'}</b></div>
                </div>
              </div>

            </div>
          )}

          {/* Stepper Bottom Navigation */}
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={currentStep === 1 ? () => navigate('/leads') : handleBack}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-50 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              {currentStep === 1 ? (
                <><X className="w-4 h-4" /> Cancel</>
              ) : (
                <><ChevronRight className="w-4 h-4 rotate-180" /> Back</>
              )}
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-bold cursor-pointer flex items-center gap-2 shadow-sm transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Saving to Database...</>
                ) : (
                  <><Plus className="w-4 h-4 stroke-[2.5]" /> Confirm & Onboard Lead</>
                )}
              </button>
            )}
          </div>

        </div>

        {/* ── RIGHT: Sidebar Widgets ── */}
        <div className="w-full xl:w-[320px] shrink-0 space-y-4">

          {/* 1. Dynamic Readiness Score Widget */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5">
            <h3 className="font-bold text-gray-900 text-[13.5px] mb-3 flex items-center justify-between">
              <span>Profile Readiness</span>
              <span className="text-[12px] font-mono font-bold text-blue-600">{readinessScore}%</span>
            </h3>

            <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  readinessScore === 100 ? 'bg-emerald-500' :
                  readinessScore > 50 ? 'bg-blue-600' : 'bg-amber-500'
                }`}
                style={{ width: `${readinessScore}%` }}
              />
            </div>

            <div className="space-y-1.5 text-[11.5px]">
              {[
                { label: 'Candidate Name', done: !!form.fullName.trim() },
                { label: '10-Digit Mobile', done: !!form.phone.trim() },
                { label: 'Sourcing Channel', done: !!form.source },
                { label: 'Passport Verified', done: form.hasPassport === 'Yes' ? !!form.passportNumber.trim() : true },
                { label: 'Trade Skill Selected', done: !!form.trade },
                { label: 'Target GCC Country', done: !!form.targetCountry },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {item.done ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[9px]">—</span>}
                  </div>
                  <span className={item.done ? 'text-gray-800 font-medium' : 'text-gray-400'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Dynamic Passport Policy Advisory */}
          <div className={`rounded-2xl border p-4 shadow-xs ${
            form.hasPassport === 'Yes' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' :
            form.hasPassport === 'No' ? 'bg-rose-50/70 border-rose-200 text-rose-900' :
            'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-1.5 font-bold text-[12.5px] mb-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {form.hasPassport === 'Yes' ? 'Passport Verified' :
                 form.hasPassport === 'No' ? 'No Passport — Hold Protocol' :
                 'Passport In Process'}
              </span>
            </div>
            <p className="text-[11.5px] leading-relaxed opacity-90">
              {form.hasPassport === 'Yes'
                ? 'Candidate holds valid Indian passport and qualifies directly for calling queue & tech interview.'
                : form.hasPassport === 'No'
                ? 'Per Image 2 FRD rules, candidate will be placed on hold until passport is arranged to prevent wasted medical test fee.'
                : 'Lead is recorded in follow-up queue pending passport book issue.'}
            </p>
          </div>

          {/* 3. Recently Onboarded Candidates (100% REAL LIVE DATA) */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-900 text-[13px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Recently Ingested Leads
              </h3>
              <button 
                onClick={() => navigate('/leads')} 
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                View Pool
              </button>
            </div>

            {loadingRecent ? (
              <div className="py-6 flex justify-center text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            ) : recentLeads.length > 0 ? (
              <div className="space-y-2.5">
                {recentLeads.map((lead) => (
                  <div key={lead._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-[10.5px] font-black flex items-center justify-center shrink-0">
                        {lead.candidateName?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold text-gray-900 truncate">{lead.candidateName}</div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {lead.trade || 'General'} • <span className="font-mono">{lead.leadId}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 border border-blue-100">
                      {lead.currentStage?.replace('_', ' ') || 'ACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11.5px] text-gray-400 py-3 text-center">
                Central pool is ready for first candidate
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
