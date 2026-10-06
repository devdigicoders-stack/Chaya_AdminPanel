import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronRight, Printer, Save, CheckCircle2, ArrowLeft, 
  Sparkles, FileText, User, ShieldCheck, Phone, Mail, 
  MapPin, Briefcase, Camera, Check, AlertCircle, ArrowRight, 
  Loader2, Calendar, Building2, UploadCloud, X, DollarSign,
  HeartPulse, UserCheck, PhoneCall, Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiCreateLead, apiUpdateLead, apiGetLeadById } from '../../utils/api';
import { printRegistrationForm, generateRegistrationFormPdf } from '../../utils/registrationFormGenerator';

export default function CandidateRegistrationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef(null);

  // Read query params if redirected from Calling Queue or Leads
  const searchParams = new URLSearchParams(location.search);
  const targetLeadId = searchParams.get('leadId') || '';
  const initialName = searchParams.get('name') || '';
  const initialPhone = searchParams.get('phone') || '';
  const initialPassport = searchParams.get('passport') || '';
  const initialTrade = searchParams.get('trade') || '';

  const [form, setForm] = useState({
    // Meta
    regNo: `CIP-${Math.floor(10000 + Math.random() * 90000)}`,
    date: new Date().toISOString().split('T')[0],

    // 1. Personal Details
    fullName: initialName,
    fatherName: '',
    address: '',
    state: 'Uttar Pradesh',
    pinCode: '',
    contactNo: initialPhone,
    whatsappNo: initialPhone,
    email: '',
    familyContact: '',

    // 2. Passport Details
    passportNumber: initialPassport,
    dob: '',
    passportIssue: '',
    passportExpiry: '',
    ecrStatus: 'ECNR', // 'ECR' or 'ECNR'
    nationality: 'Indian',

    // 3. Work Details
    occupation: initialTrade || '',
    placeOfEmployment: '',
    lastExperience: '',
    lastSalaryAndPost: '',
    newExpectedSalary: '',
    medicalReport: 'Pending', // FIT, UNFIT, Pending
    pccStatus: 'Pending', // Applied, Received, Pending

    // 4. Candidate Declaration & Media
    declarationAccepted: true,
    candidateSignature: '',
    candidatePhoto: null,

    // 5. For Office Use Only
    agentCode: 'AG-771',
    officeConfirmationCountry: 'Saudi Arabia',
    officeConfirmationWork: initialTrade || 'Pipe Fitter',
    officeConfirmationSalary: 'SAR 2,500',

    // 6. Next Candidate Route
    routingOption: 'INTERVIEW', // 'INTERVIEW' or 'CV_SELECTED'
    status: 'Draft' // 'Draft' or 'Completed'
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printBlankMode, setPrintBlankMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Preload existing lead data from Calling Queue or Lead Pool
  useEffect(() => {
    if (!targetLeadId) return;
    const fetchLeadDetails = async () => {
      try {
        const res = await apiGetLeadById(targetLeadId);
        if (res?.data) {
          const l = res.data;
          setForm(prev => ({
            ...prev,
            fullName: l.candidateName || prev.fullName,
            contactNo: l.phone || prev.contactNo,
            whatsappNo: l.whatsappNumber || l.phone || prev.whatsappNo,
            passportNumber: l.passportNumber || prev.passportNumber,
            occupation: l.trade || prev.occupation,
            fatherName: l.applicationForm?.fatherName || prev.fatherName,
            address: l.address || l.applicationForm?.address || prev.address,
            state: l.state || l.applicationForm?.state || prev.state,
            pinCode: l.applicationForm?.pinCode || prev.pinCode,
            dob: l.applicationForm?.dob || prev.dob,
            email: l.email || prev.email,
            officeConfirmationCountry: l.country || prev.officeConfirmationCountry,
            lastExperience: l.applicationForm?.experienceYears ? `${l.applicationForm.experienceYears} Years` : prev.lastExperience
          }));
        }
      } catch (err) {
        console.error('Error preloading lead details:', err);
      }
    };
    fetchLeadDetails();
  }, [targetLeadId]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      updateField('candidatePhoto', file.name);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    updateField('candidatePhoto', null);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSignaturePreview(url);
      updateField('candidateSignature', file.name);
    }
  };

  const handleRemoveSignature = () => {
    setSignaturePreview(null);
    updateField('candidateSignature', '');
  };

  const handleSaveDraft = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    updateField('status', 'Draft');
    showToast(`Registration saved as Draft (${form.regNo}). You can complete it anytime.`);
  };

  const handleSubmitRegistration = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.fullName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Name Required', text: 'Please enter Candidate Full Name', confirmButtonColor: '#2563eb' });
      return;
    }
    if (!form.passportNumber.trim()) {
      Swal.fire({ icon: 'warning', title: 'Passport Required', text: 'Please enter Candidate Passport Number', confirmButtonColor: '#2563eb' });
      return;
    }
    if (!form.contactNo.trim()) {
      Swal.fire({ icon: 'warning', title: 'Contact Required', text: 'Please enter Candidate Contact Number', confirmButtonColor: '#2563eb' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        candidateName: form.fullName.trim(),
        fatherName: form.fatherName.trim(),
        passportNumber: form.passportNumber.trim().toUpperCase(),
        phone: form.contactNo.trim(),
        whatsappNumber: form.whatsappNo.trim() || form.contactNo.trim(),
        email: form.email.trim(),
        trade: form.occupation.trim() || 'General Worker',
        country: form.officeConfirmationCountry || 'Saudi Arabia',
        address: form.address,
        state: form.state,
        pinCode: form.pinCode,
        experience: form.lastExperience || 'Fresher',
        expectedSalary: form.newExpectedSalary || form.officeConfirmationSalary || 'Standard',
        selectionMode: form.routingOption === 'INTERVIEW' ? 'INTERVIEW' : 'DIRECT_CV',
        routingOption: form.routingOption,
        source: 'MANUAL',
        currentStage: form.routingOption === 'INTERVIEW' ? 'INITIAL_INTERVIEW' : 'MEDICAL_PROCESS',
        isPassportHolder: 'YES',
        notes: `Registered via Official Physical Form (${form.regNo}). ECR Status: ${form.ecrStatus}. Routing: ${form.routingOption}. Agent: ${form.agentCode || 'Direct'}.`
      };

      const res = targetLeadId
        ? await apiUpdateLead(targetLeadId, payload)
        : await apiCreateLead(payload);

      if (res?.success) {
        await Swal.fire({
          icon: 'success',
          title: targetLeadId ? 'Candidate Profile Successfully Enriched!' : 'Candidate Successfully Registered!',
          html: `
            <div style="text-align: left; font-size: 13px; line-height: 1.6;">
              <p><b>Candidate:</b> ${form.fullName}</p>
              <p><b>Registration No:</b> ${form.regNo}</p>
              <p><b>Passport:</b> ${form.passportNumber.toUpperCase()}</p>
              <p><b>Next Stage:</b> ${form.routingOption === 'INTERVIEW' ? 'Initial Technical Interview' : 'Medical Scheduling'}</p>
            </div>
          `,
          confirmButtonText: form.routingOption === 'INTERVIEW' ? 'Proceed to Interview' : 'Proceed to Medical',
          confirmButtonColor: '#2563eb',
          showCancelButton: true,
          cancelButtonText: 'View Candidate Roster',
          cancelButtonColor: '#4b5563'
        }).then((result) => {
          if (result.isConfirmed) {
            if (form.routingOption === 'INTERVIEW') {
              navigate('/interview/initial');
            } else {
              navigate('/medical/all');
            }
          } else {
            navigate('/candidates/all');
          }
        });
      }
    } catch (err) {
      console.error('Registration failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.message || 'Could not save candidate into database.',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (blank = false) => {
    printRegistrationForm(form, { photoPreview, signaturePreview, blank });
  };

  const handleDownloadPdf = (blank = false) => {
    generateRegistrationFormPdf(form, { photoPreview, signaturePreview, download: true, blank });
  };

  const inputCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all';
  const labelCls = 'block text-[11.5px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider';
  const cardCls = 'bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 sm:p-6 space-y-5';

  return (
    <div className="flex flex-col flex-1 w-full max-w-full min-w-0 pb-16 space-y-5 font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-[13px] border border-emerald-600 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/candidates/all')} className="hover:text-blue-600 cursor-pointer">Candidates & Registry</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Candidate Registration</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Candidate Official Registration
            </h1>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {form.regNo}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Official Physical Form Entry
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/candidates/all')}
            className="h-9 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Roster</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="h-9 px-3.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-purple-600" />
            <span>Print Form</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadPdf(false)}
            className="h-9 px-3.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Download official PDF file of registration form"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="h-9 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-gray-500" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handleSubmitRegistration}
            disabled={submitting}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Register & Route Candidate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Registration Form - Responsive Modular CRM Cards */}
      <form onSubmit={handleSubmitRegistration} className="space-y-6">

        {/* ── CARD 1: PERSONAL & CONTACT INFORMATION ── */}
        <div className={cardCls}>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
            <div>
              <h3 className="font-bold text-gray-900 text-[15px] sm:text-[16px] flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                1. Personal Details & Contact Information
              </h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Candidate identity as per passport, permanent address, and active contact numbers.
              </p>
            </div>
            <span className="text-[11px] font-bold text-gray-400 font-mono hidden sm:inline-block">
              Date: {form.date}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
            
            {/* Full Name */}
            <div className="lg:col-span-2">
              <label className={labelCls}>
                Full Name (as per Passport) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Yadav"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={`${inputCls} pl-10 font-medium`}
                />
              </div>
            </div>

            {/* Father's Name */}
            <div>
              <label className={labelCls}>
                Father's Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Father's full name"
                  value={form.fatherName}
                  onChange={(e) => updateField('fatherName', e.target.value)}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>

            {/* Permanent Address */}
            <div className="lg:col-span-3">
              <label className={labelCls}>
                Permanent Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Village / House No., Post, Tehsil, District"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>

            {/* State */}
            <div>
              <label className={labelCls}>
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Uttar Pradesh, Bihar..."
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                className={inputCls}
              />
            </div>

            {/* PIN Code */}
            <div>
              <label className={labelCls}>
                PIN Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 209801"
                value={form.pinCode}
                onChange={(e) => updateField('pinCode', e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>

            {/* Contact No */}
            <div>
              <label className={labelCls}>
                Candidate Contact No. <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={form.contactNo}
                  onChange={(e) => updateField('contactNo', e.target.value)}
                  className={`${inputCls} pl-10 font-mono`}
                />
              </div>
            </div>

            {/* WhatsApp No */}
            <div>
              <label className={labelCls}>
                WhatsApp Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={form.whatsappNo}
                  onChange={(e) => updateField('whatsappNo', e.target.value)}
                  className={`${inputCls} pl-10 font-mono`}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className={labelCls}>Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="candidate@gmail.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>

            {/* Family Emergency Contact */}
            <div>
              <label className={labelCls}>
                Family Emergency Contact <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <PhoneCall className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Father / Brother / Wife mobile"
                  value={form.familyContact}
                  onChange={(e) => updateField('familyContact', e.target.value)}
                  className={`${inputCls} pl-10 font-mono`}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── CARD 2: PASSPORT & IMMIGRATION STATUS ── */}
        <div className={cardCls}>
          <div className="border-b border-gray-100 pb-3.5">
            <h3 className="font-bold text-gray-900 text-[15px] sm:text-[16px] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              2. Passport Details & Immigration Status
            </h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Official travel document credentials and emigration clearance status.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
            
            {/* Passport Number */}
            <div>
              <label className={labelCls}>
                Passport Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Z9876543"
                  value={form.passportNumber}
                  onChange={(e) => updateField('passportNumber', e.target.value.toUpperCase())}
                  className={`${inputCls} pl-10 font-mono uppercase font-bold text-emerald-700`}
                />
              </div>
            </div>

            {/* Date Of Birth */}
            <div>
              <label className={labelCls}>
                Date Of Birth <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  required
                  value={form.dob}
                  onChange={(e) => updateField('dob', e.target.value)}
                  className={`${inputCls} pl-10 font-mono`}
                />
              </div>
            </div>

            {/* Passport Issue Date */}
            <div>
              <label className={labelCls}>
                Passport Issue Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  required
                  value={form.passportIssue}
                  onChange={(e) => updateField('passportIssue', e.target.value)}
                  className={`${inputCls} pl-10 font-mono`}
                />
              </div>
            </div>

            {/* Passport Expiry Date */}
            <div>
              <label className={labelCls}>
                Passport Expiry Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  required
                  value={form.passportExpiry}
                  onChange={(e) => updateField('passportExpiry', e.target.value)}
                  className={`${inputCls} pl-10 font-mono`}
                />
              </div>
            </div>

            {/* ECR / ECNR Status Selector */}
            <div>
              <label className={labelCls}>
                Emigration Check Status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => updateField('ecrStatus', 'ECNR')}
                  className={`py-2 px-3 rounded-xl border text-[12.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    form.ecrStatus === 'ECNR'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-100 shadow-2xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${form.ecrStatus === 'ECNR' ? 'text-emerald-600' : 'text-gray-300'}`} />
                  <span>ECNR (Non-Check)</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('ecrStatus', 'ECR')}
                  className={`py-2 px-3 rounded-xl border text-[12.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    form.ecrStatus === 'ECR'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-100 shadow-2xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <AlertCircle className={`w-3.5 h-3.5 ${form.ecrStatus === 'ECR' ? 'text-amber-600' : 'text-gray-300'}`} />
                  <span>ECR (Check Req)</span>
                </button>
              </div>
            </div>

            {/* Nationality */}
            <div>
              <label className={labelCls}>Nationality</label>
              <input
                type="text"
                readOnly
                value={form.nationality}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-600 font-semibold cursor-not-allowed"
              />
            </div>

          </div>
        </div>

        {/* ── CARD 3: TECHNICAL TRADE & EXPERIENCE PROFILE ── */}
        <div className={cardCls}>
          <div className="border-b border-gray-100 pb-3.5">
            <h3 className="font-bold text-gray-900 text-[15px] sm:text-[16px] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              3. Technical Trade, Experience & Compliance
            </h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Primary trade qualification, work history, expected compensation and statutory clearances.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
            
            {/* Occupation / Trade */}
            <div>
              <label className={labelCls}>
                Occupation / Technical Trade <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Pipe Fitter, Electrician, 6G Welder..."
                  value={form.occupation}
                  onChange={(e) => updateField('occupation', e.target.value)}
                  className={`${inputCls} pl-10 font-medium`}
                />
              </div>
            </div>

            {/* Place Of Employment */}
            <div>
              <label className={labelCls}>Place Of Employment (Previous / Target)</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Dubai, Riyadh, Doha, Kuwait..."
                  value={form.placeOfEmployment}
                  onChange={(e) => updateField('placeOfEmployment', e.target.value)}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </div>

            {/* Total Experience */}
            <div>
              <label className={labelCls}>
                Last Experience (Total Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 5 Years (3 Yrs Gulf + 2 Yrs India)"
                value={form.lastExperience}
                onChange={(e) => updateField('lastExperience', e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Last Salary & Post */}
            <div>
              <label className={labelCls}>Last Salary & Designation</label>
              <input
                type="text"
                placeholder="e.g. ₹28,000 / Sr. Technician (Arabtec)"
                value={form.lastSalaryAndPost}
                onChange={(e) => updateField('lastSalaryAndPost', e.target.value)}
                className={inputCls}
              />
            </div>

            {/* New Expected Salary */}
            <div>
              <label className={labelCls}>
                New Expected Salary <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. SAR 2,500 / AED 2,400"
                  value={form.newExpectedSalary}
                  onChange={(e) => updateField('newExpectedSalary', e.target.value)}
                  className={`${inputCls} pl-10 font-bold text-gray-900`}
                />
              </div>
            </div>

            {/* Medical Report Status */}
            <div>
              <label className={labelCls}>
                GAMCA Medical Status <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <HeartPulse className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.medicalReport}
                  onChange={(e) => updateField('medicalReport', e.target.value)}
                  className={`${inputCls} pl-10`}
                >
                  <option value="Pending">Awaiting / Medical Pending</option>
                  <option value="FIT">GAMCA Cleared (FIT)</option>
                  <option value="UNFIT">GAMCA UNFIT</option>
                </select>
              </div>
            </div>

            {/* PCC Status */}
            <div className="lg:col-span-3">
              <label className={labelCls}>
                PCC Status (Police Clearance Certificate) <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.pccStatus}
                onChange={(e) => updateField('pccStatus', e.target.value)}
                className={inputCls}
              >
                <option value="Pending">PCC Not Started / Pending</option>
                <option value="Applied">PCC Applied at PSK / Regional Passport Office</option>
                <option value="Received">PCC Certificate Issued & Verified</option>
              </select>
            </div>

          </div>
        </div>

        {/* ── CARD 4: ATTACHMENTS & MEDIA ── */}
        <div className={cardCls}>
          <div className="border-b border-gray-100 pb-3.5">
            <h3 className="font-bold text-gray-900 text-[15px] sm:text-[16px] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              4. Candidate Attachments (Photo & Digital Signature)
            </h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Upload standard white-background passport photograph and digital signature scan for official records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Photo Box */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50">
              <label className="block text-[12px] font-bold text-gray-800 mb-2 flex items-center justify-between">
                <span>Passport Size Photograph</span>
                <span className="text-[11px] text-gray-400 font-normal">White background</span>
              </label>

              {photoPreview ? (
                <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-gray-200">
                  <img
                    src={photoPreview}
                    alt="Candidate Preview"
                    className="w-20 h-24 object-cover rounded-lg border border-gray-200 shadow-2xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {form.candidatePhoto || 'Candidate Photo'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">✓ Ready for form attachment</p>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="mt-2 text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Remove Photo
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center bg-white flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Upload Passport Photo</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">JPG, PNG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            {/* Signature Box */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50">
              <label className="block text-[12px] font-bold text-gray-800 mb-2 flex items-center justify-between">
                <span>Candidate Signature Scan</span>
                <span className="text-[11px] text-gray-400 font-normal">On plain white paper</span>
              </label>

              {signaturePreview ? (
                <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-gray-200">
                  <div className="w-28 h-20 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-2 shrink-0">
                    <img
                      src={signaturePreview}
                      alt="Signature Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {form.fullName || 'Digital Signature'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">✓ Signature verified</p>
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="mt-2 text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Remove Signature
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-6 text-center bg-white flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-gray-800">Upload Signature Scan</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">JPG, PNG scan file</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

          </div>
        </div>

        {/* ── CARD 5: FOR OFFICE USE ONLY ── */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-800 text-[14px] sm:text-[15px] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              5. For Office Use Only (Internal Approval)
            </h3>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase tracking-wide">
              Head Desk Only
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Agent / Sub-Agent Code
              </label>
              <input
                type="text"
                value={form.agentCode}
                onChange={(e) => updateField('agentCode', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Confirmed Destination
              </label>
              <input
                type="text"
                value={form.officeConfirmationCountry}
                onChange={(e) => updateField('officeConfirmationCountry', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Approved Trade / Role
              </label>
              <input
                type="text"
                value={form.officeConfirmationWork}
                onChange={(e) => updateField('officeConfirmationWork', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Confirmed Basic Salary
              </label>
              <input
                type="text"
                value={form.officeConfirmationSalary}
                onChange={(e) => updateField('officeConfirmationSalary', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ── CARD 6: STEP 8 - CANDIDATE ROUTE ALLOCATION ── */}
        <div className={cardCls}>
          <div className="border-b border-gray-100 pb-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-[15px] sm:text-[16px] flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                6. Next Recruitment Route (Step 8 Flow)
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Pipeline Routing
              </span>
            </div>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Select where this candidate should immediately move upon registration submission.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Option A: Interview Route */}
            <div
              onClick={() => updateField('routingOption', 'INTERVIEW')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                form.routingOption === 'INTERVIEW'
                  ? 'bg-blue-50/50 border-blue-600 shadow-xs'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="routingOption"
                  checked={form.routingOption === 'INTERVIEW'}
                  onChange={() => updateField('routingOption', 'INTERVIEW')}
                  className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-[13.5px] font-bold text-gray-900">
                      Option A: Send to Interview Panel
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Stage 04
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                    Candidate will be scheduled for technical/trade testing. On passing the client interview, they proceed to GAMCA medicals.
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-lg">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Transfers to 04. Interview Panel</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Option B: CV Selection Route */}
            <div
              onClick={() => updateField('routingOption', 'CV_SELECTED')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                form.routingOption === 'CV_SELECTED'
                  ? 'bg-emerald-50/50 border-emerald-600 shadow-xs'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="routingOption"
                  checked={form.routingOption === 'CV_SELECTED'}
                  onChange={() => updateField('routingOption', 'CV_SELECTED')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-[13.5px] font-bold text-gray-900">
                      Option B: Shortlist by CV (Direct Medical)
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Stage 05
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                    Interview bypassed. Candidate qualifications verified via CV and directly eligible for GAMCA medical examination booking.
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                    <HeartPulse className="w-3.5 h-3.5" />
                    <span>Transfers to 05. Medical & Booking</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── CARD 7: DECLARATION & FORM ACTIONS ── */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 sm:p-6 space-y-4">
          <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 text-[12.5px] text-gray-700 leading-relaxed italic">
            "I hereby accept that all details filled above are correct and I certify that I will not apply my passport for another country or office during 3 months of application submitted date."
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="declaration"
              checked={form.declarationAccepted}
              onChange={(e) => updateField('declarationAccepted', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="declaration" className="text-[12.5px] font-bold text-gray-800 cursor-pointer">
              Candidate Agrees to Official Terms, Non-Duplication Declaration & Verification
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-purple-600" />
              <span>Print Physical Form</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Save as Draft
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Candidate...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Register & Route Candidate</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      {/* ── Official Printable Form Modal (1:1 Guaranteed Single Page A4 Replica) ── */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            
            {/* Modal Sticky Header */}
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-slate-50 shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">
                    Candidate Registration Form (A4 Sheet)
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    Reg No: {form.regNo} • Single Page Guaranteed (No Cut-off)
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mode Switcher */}
                <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPrintBlankMode(false)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${!printBlankMode ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-gray-600 hover:text-black'}`}
                  >
                    Filled Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintBlankMode(true)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${printBlankMode ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-gray-600 hover:text-black'}`}
                  >
                    Blank Form
                  </button>
                </div>

                {/* Print Button */}
                <button
                  type="button"
                  onClick={() => handlePrint(printBlankMode)}
                  className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Print cleanly on 1 sheet of A4 paper"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Form</span>
                </button>

                {/* Download PDF Button */}
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(printBlankMode)}
                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Download crisp vector PDF file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable A4 Sheet Preview */}
            <div className="p-3 sm:p-6 bg-slate-100 flex-1 overflow-y-auto overscroll-contain flex justify-center">
              <div 
                className="w-full max-w-[195mm] bg-white border border-gray-300 shadow-md p-5 sm:p-7 text-black font-sans text-[10px] leading-tight select-text"
              >
                {/* 1. Top Header */}
                <div className="border-b-2 border-black pb-2 mb-2.5 flex justify-between items-start">
                  <div>
                    <h1 className="text-[17px] font-black uppercase tracking-tight leading-none text-black">
                      Chhaya International Pvt. Ltd.
                    </h1>
                    <p className="text-[10px] text-gray-800 font-medium mt-1">LIG 2 Nirala Nagar Unnao, Uttar Pradesh 209801</p>
                    <p className="text-[9.5px] text-gray-900 font-semibold mt-0.5">
                      Email: chhayainternationalpvtltd@gmail.com &nbsp;•&nbsp; Contact No: +91 80814 78307
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-black text-black">Chhaya International</div>
                    <div className="text-[8.5px] text-gray-700 font-mono mt-0.5">Ministry Reg: B-1204/UP/COM/1000+/5/9821/2021</div>
                  </div>
                </div>

                {/* 2. Title & Meta Bar */}
                <div className="text-center mb-1.5">
                  <h2 className="text-[13px] font-black tracking-wider uppercase inline-block border-b-2 border-black pb-0.5">
                    Registration Form
                  </h2>
                </div>

                <div className="flex justify-between items-center text-[10.5px] font-bold border-b border-gray-400 pb-1.5 mb-2.5">
                  <div>Date: <span className="font-mono underline decoration-dotted font-bold">{form.date}</span></div>
                  <div>Reg No.: <span className="font-mono font-bold underline decoration-dotted">{form.regNo}</span></div>
                </div>

                {/* 3. Personal Details */}
                <div className="mb-2">
                  <div className="font-bold text-[10.5px] uppercase mb-1 flex items-center gap-1">
                    <span>●</span> <span>1. Personal Details</span>
                  </div>
                  <table className="w-full border-collapse text-[9.5px]">
                    <tbody>
                      <tr>
                        <td className="w-1/2 border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Full Name</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.fullName ? form.fullName : '—'}</strong>
                        </td>
                        <td className="w-1/2 border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Father Name</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.fatherName ? form.fatherName : '—'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="2" className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Permanent Address</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.address ? form.address : '—'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">State</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.state ? form.state : 'Uttar Pradesh'}</strong>
                        </td>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">PIN Code</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.pinCode ? form.pinCode : '—'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Contact No</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.contactNo ? form.contactNo : '—'}</strong>
                        </td>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">WhatsApp Number</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.whatsappNo ? form.whatsappNo : '—'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Email ID</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.email ? form.email : '—'}</strong>
                        </td>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Family / Alternate Contact</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.familyContact ? form.familyContact : '—'}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. Passport Details */}
                <div className="mb-2">
                  <div className="font-bold text-[10.5px] uppercase mb-1 flex items-center gap-1">
                    <span>●</span> <span>2. Passport Particulars</span>
                  </div>
                  <table className="w-full border-collapse text-[9.5px]">
                    <tbody>
                      <tr>
                        <td className="w-1/3 border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Passport Number</span>
                          <strong className="text-black text-[10px] font-mono">{!printBlankMode && form.passportNumber ? form.passportNumber : '—'}</strong>
                        </td>
                        <td className="w-1/3 border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Date of Birth</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.dob ? form.dob : '—'}</strong>
                        </td>
                        <td className="w-1/3 border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Issue Date</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.passportIssue ? form.passportIssue : '—'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Expiry Date</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.passportExpiry ? form.passportExpiry : '—'}</strong>
                        </td>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">ECR / ECNR Status</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.ecrStatus ? form.ecrStatus : 'ECNR'}</strong>
                        </td>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Nationality</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.nationality ? form.nationality : 'Indian'}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. Work Details */}
                <div className="mb-2">
                  <div className="font-bold text-[10.5px] uppercase mb-1 flex items-center gap-1">
                    <span>●</span> <span>3. Work & Professional Details</span>
                  </div>
                  <table className="w-full border-collapse text-[9.5px]">
                    <tbody>
                      <tr>
                        <td className="w-1/2 border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Occupation / Trade</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.occupation ? form.occupation : '—'}</strong>
                        </td>
                        <td className="w-1/2 border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Place of Employment</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.placeOfEmployment ? form.placeOfEmployment : '—'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Last Experience</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.lastExperience ? form.lastExperience : '—'}</strong>
                        </td>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Last Salary & Post</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.lastSalaryAndPost ? form.lastSalaryAndPost : '—'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">New Expected Salary</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.newExpectedSalary ? form.newExpectedSalary : '—'}</strong>
                        </td>
                        <td className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">GAMCA Medical Status</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.medicalReport ? form.medicalReport : 'Pending'}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="2" className="border border-gray-500 p-1.5">
                          <span className="text-[8.5px] font-bold text-gray-600 block uppercase">Police Clearance Certificate (PCC) Status</span>
                          <strong className="text-black text-[10px]">{!printBlankMode && form.pccStatus ? form.pccStatus : 'Pending'}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6. Declaration */}
                <div className="border border-black p-2 text-[9px] leading-snug italic text-gray-800 bg-gray-50/50 mb-2.5">
                  <strong>Candidate Declaration:</strong> I hereby accept that all details filled above are correct and I certify that I do not apply my passport for another country or office during 3 months of Application submitted date.
                </div>

                {/* 7. Signature & Photo Row */}
                <div className="flex justify-between items-end gap-3 mb-2.5">
                  <div className="flex-1">
                    <div className="border-b border-black pb-1 mb-1 font-bold text-[9.5px] uppercase">
                      Candidate Name & Signature:
                    </div>
                    <div className="h-12 border border-gray-500 rounded flex items-center justify-center p-2 text-[10px] font-mono text-gray-600">
                      {!printBlankMode && signaturePreview ? (
                        <img src={signaturePreview} alt="Signature" className="max-h-10 object-contain" />
                      ) : !printBlankMode && form.fullName ? (
                        <span className="font-bold text-black">{form.fullName}</span>
                      ) : (
                        <span className="text-gray-400 italic text-[9px]">Candidate Signature</span>
                      )}
                    </div>
                  </div>

                  <div className="w-20 text-center shrink-0">
                    <div className="border-b border-black pb-1 mb-1 font-bold text-[9.5px] uppercase">
                      Photo:
                    </div>
                    <div className="h-24 w-19 border border-gray-500 rounded mx-auto flex items-center justify-center overflow-hidden bg-gray-50 text-[8px] text-gray-500">
                      {!printBlankMode && photoPreview ? (
                        <img src={photoPreview} alt="Candidate" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-1 leading-tight">
                          <span>PASTE PHOTO</span><br />
                          <span className="text-[7px] text-gray-400">(35x45mm)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 8. For Office Use Only */}
                <div className="border-t-2 border-black pt-1.5">
                  <div className="font-black text-[9.5px] uppercase mb-1">For Office Use Only:</div>
                  <table className="w-full border-collapse border border-black bg-gray-50/60 text-[9px]">
                    <tbody>
                      <tr>
                        <td className="w-1/4 border border-black p-1.5">
                          <span className="text-[7.5px] font-bold text-gray-600 block uppercase">Agent Code</span>
                          <strong className="text-black text-[9.5px]">{!printBlankMode && form.agentCode ? form.agentCode : 'AG-771'}</strong>
                        </td>
                        <td className="w-1/4 border border-black p-1.5">
                          <span className="text-[7.5px] font-bold text-gray-600 block uppercase">Country</span>
                          <strong className="text-black text-[9.5px]">{!printBlankMode && form.officeConfirmationCountry ? form.officeConfirmationCountry : 'Saudi Arabia'}</strong>
                        </td>
                        <td className="w-1/4 border border-black p-1.5">
                          <span className="text-[7.5px] font-bold text-gray-600 block uppercase">Work / Trade</span>
                          <strong className="text-black text-[9.5px]">{!printBlankMode && (form.officeConfirmationWork || form.occupation) ? (form.officeConfirmationWork || form.occupation) : 'Pipe Fitter'}</strong>
                        </td>
                        <td className="w-1/4 border border-black p-1.5">
                          <span className="text-[7.5px] font-bold text-gray-600 block uppercase">Agreed Salary</span>
                          <strong className="text-black text-[9.5px]">{!printBlankMode && form.officeConfirmationSalary ? form.officeConfirmationSalary : 'SAR 2,500'}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 9. Legal Footer */}
                <div className="text-center text-[7.5px] text-gray-500 mt-2 border-t border-dashed border-gray-300 pt-1">
                  Official Physical Candidate Registration Sheet • Chhaya International Pvt. Ltd. • Ministry of External Affairs Licensed
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
