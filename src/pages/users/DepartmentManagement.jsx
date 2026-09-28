import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Building2, Users, Briefcase, MapPin, Edit, Trash2, 
  Plus, Download, RefreshCw, Sparkles, AlertCircle, Search, 
  Filter, Eye, Printer, UserCheck, ShieldCheck, Check, X, Phone, 
  Mail, Clock, ArrowUpRight, CheckCircle2, TrendingUp, BarChart3, 
  LayoutGrid, Table, ExternalLink, Plane, Receipt, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetUsers, apiGetDashboardSummary } from '../../utils/api';

// 9 Official 19-Step Overseas Recruitment Operational Departments (FRD Section 5 & 22)
const DEPARTMENTS_SPECIFICATION = [
  {
    code: 'DEPT-EXEC',
    name: 'Executive Administration & Compliance',
    stepMapping: 'System-Wide & Step 01',
    rolesHandled: ['ADMIN', 'DATA_CONTROLLER'],
    workflowRole: 'Oversees overall recruitment operations, system masters, MEA compliance, and data controller lead pool imports.',
    slaTarget: '24/7 Governance',
    stageKey: 'NEW_LEAD',
    color: 'border-l-purple-500 bg-purple-50/15',
    accent: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    code: 'DEPT-HEAD',
    name: 'Staff Head Directorate',
    stepMapping: 'Step 02 & Step 12 Desks',
    rolesHandled: ['STAFF_HEAD'],
    workflowRole: 'Receives bulk lead pool, performs equal round-robin distribution to Calling Staff, verifies post-medical files, and executes staff swap/reassignments.',
    slaTarget: '1.2 Days Lead Allocation',
    stageKey: 'UNASSIGNED',
    color: 'border-l-blue-500 bg-blue-50/15',
    accent: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    code: 'DEPT-CALL',
    name: 'Calling, Screening & Passport Verification',
    stepMapping: 'Steps 03-06 & Step 13 Desk',
    rolesHandled: ['CALLING_STAFF'],
    workflowRole: 'Direct candidate contact, passport validity check (Passport vs Non-Passport), candidate full form capture, and destination location 4-edit limit.',
    slaTarget: '1.8 Days Primary TAT',
    stageKey: 'CALLING_SCREENING',
    color: 'border-l-emerald-500 bg-emerald-50/15',
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    code: 'DEPT-TRD',
    name: 'Technical Trade Evaluation & Assessment',
    stepMapping: 'Steps 07-09 Interview Desk',
    rolesHandled: ['INTERVIEW_PANEL'],
    workflowRole: 'Conducts hands-on bench trade testing for skilled crafts (Welders, Fitters, Electricians, Plumbers), CV selection, and records PASS / FAIL scores.',
    slaTarget: '1.5 Days Scorecard Submission',
    stageKey: 'INITIAL_INTERVIEW',
    color: 'border-l-amber-500 bg-amber-50/15',
    accent: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    code: 'DEPT-MED',
    name: 'Medical GAMCA & Clinical Compliance',
    stepMapping: 'Step 10 Medical Desk',
    rolesHandled: ['MEDICAL_DEPT'],
    workflowRole: 'Dispatches candidates to GCC GAMCA clinics, tracks serology diagnostics, uploads fitness certificates (FIT / UNFIT), and triggers payment booking.',
    slaTarget: '3.0 Days GAMCA Lab TAT',
    stageKey: 'MEDICAL_PROCESS',
    color: 'border-l-teal-500 bg-teal-50/15',
    accent: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  {
    code: 'DEPT-ACC',
    name: 'Bill Book & Accounts Directorate',
    stepMapping: 'Step 11 & Step 18 Finance Desk',
    rolesHandled: ['ACCOUNTS'],
    workflowRole: 'Maintains strict separation of Service Fee and Medical Fee collections, logs Step 11 advance bookings, and settles Step 18 final dues before flight.',
    slaTarget: '1.0 Day Receipt Issuance',
    stageKey: 'ACCOUNTS_COLLECTION',
    color: 'border-l-orange-500 bg-orange-50/15',
    accent: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    code: 'DEPT-PRV',
    name: 'Pre-Viva Verification Desk',
    stepMapping: 'Step 15 Pre-Viva Desk',
    rolesHandled: ['PRE_VISA_MANAGER'],
    workflowRole: 'Audits inward Move Files and Direct Files, verifies attested dossiers, assigns files to Visa Manager, collects final payments, and manages visa delay loop.',
    slaTarget: '2.0 Days Dossier Clearance',
    stageKey: 'PRE_VISA',
    color: 'border-l-indigo-500 bg-indigo-50/15',
    accent: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  {
    code: 'DEPT-VSA',
    name: 'Visa Operations & Consular Stamping Desk',
    stepMapping: 'Step 16 Visa Consulate Desk',
    rolesHandled: ['VISA_MANAGER'],
    workflowRole: 'Handles consular embassy filings, MOFA application submissions, biometric appointments, and embassy visa stamping verifications.',
    slaTarget: '14 Days Consular Stamping',
    stageKey: 'VISA_PROCESSING',
    color: 'border-l-cyan-500 bg-cyan-50/15',
    accent: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  {
    code: 'DEPT-PLC',
    name: 'Client Viva & Overseas Deployment Desk',
    stepMapping: 'Step 17 & Step 19 Placement Desk',
    rolesHandled: ['VIVA_MANAGER'],
    workflowRole: 'Coordinates foreign recruitment delegation vivas, candidate selection results, offer letter signings, flight ticket PNRs, and foreign camp arrivals.',
    slaTarget: '5 Days Deployment Dispatch',
    stageKey: 'VIVA_PLACEMENT',
    color: 'border-l-pink-500 bg-pink-50/15',
    accent: 'bg-pink-50 text-pink-700 border-pink-200'
  }
];

export default function DepartmentManagement() {
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedDeptModal, setSelectedDeptModal] = useState(null);

  // Fetch Live Users & Pipeline Counts
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, sumRes] = await Promise.allSettled([
        apiGetUsers(),
        apiGetDashboardSummary()
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        setUsers(usersRes.value.data);
      }
      if (sumRes.status === 'fulfilled' && sumRes.value?.data) {
        setSummary(sumRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching department data:', err);
      setError(err.message || 'Failed to connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    return DEPARTMENTS_SPECIFICATION.filter(dept => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return dept.name.toLowerCase().includes(q) ||
               dept.code.toLowerCase().includes(q) ||
               dept.workflowRole.toLowerCase().includes(q) ||
               dept.stepMapping.toLowerCase().includes(q);
      }
      return true;
    });
  }, [searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Department Code', 'Department Name', 'Pipeline Step Mapping', 'Roles Handled', 'Staff Count', 'Active Candidate Load', 'SLA Target'];
    const rows = DEPARTMENTS_SPECIFICATION.map(d => {
      const staffCount = users.filter(u => d.rolesHandled.includes(u.role)).length;
      const candidateLoad = summary?.byStage?.[d.stageKey] || 0;

      return [
        d.code,
        `"${d.name}"`,
        `"${d.stepMapping}"`,
        `"${d.rolesHandled.join(', ')}"`,
        staffCount,
        candidateLoad,
        `"${d.slaTarget}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Department_Operational_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Directory Exported',
      text: 'Department Operational Roster exported to CSV.',
      timer: 2000,
      showConfirmButton: false
    });
  };

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      {/* Sleek Header & Breadcrumbs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/users')} className="hover:text-blue-600 cursor-pointer">12. Users & Staff</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-semibold">Department List</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Department List & Operational Units
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              19-Step Operational Desks
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Monitor functional departmental desks, assigned staffing levels, SLA targets, and active candidate caseload across all 19 recruitment workflow steps.
          </p>
        </div>

        {/* Action Toolbar - strictly single-line, shrink-0, whitespace-nowrap */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button 
            onClick={loadData}
            disabled={loading}
            className="h-9.5 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap disabled:opacity-50"
            title="Sync live caseload from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} /> 
            <span>Sync Live Caseload</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="h-9.5 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
            title="Export department roster to CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" /> 
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => navigate('/users')}
            className="h-9.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" /> 
            <span>Manage Staff</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-[13px] font-medium">{error}</p>
        </div>
      )}

      {/* 4 Dynamic KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Units
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-gray-900 leading-tight">9 Operational Desks</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">End-to-End Pipeline Units</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Staff Strength
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-emerald-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : users.length} Personnel
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Active Staff Deployments</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Live Load
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-indigo-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (summary?.totalLeads || 0)} Candidates
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Total Pipeline Volume</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              SLA Standard
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-purple-600 leading-tight">100% Tracked</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Stage Turnaround Standards</div>
          </div>
        </div>
      </div>

      {/* Search & View Mode Bar */}
      <div className="mb-6 flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search department name, code, step mapping, or workflow role..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-white shadow-2xs text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-white shadow-2xs text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            title="Table View"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => {
            const staffList = users.filter(u => dept.rolesHandled.includes(u.role));
            const candidateLoad = summary?.byStage?.[dept.stageKey] || 0;

            return (
              <div
                key={dept.code}
                className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200 border-l-4"
                style={{
                  borderLeftColor: 
                    dept.code === 'DEPT-EXEC' ? '#9333ea' :
                    dept.code === 'DEPT-HEAD' ? '#2563eb' :
                    dept.code === 'DEPT-CALL' ? '#059669' :
                    dept.code === 'DEPT-TRD' ? '#d97706' :
                    dept.code === 'DEPT-MED' ? '#0d9488' :
                    dept.code === 'DEPT-ACC' ? '#ea580c' :
                    dept.code === 'DEPT-PRV' ? '#4f46e5' :
                    dept.code === 'DEPT-VSA' ? '#0891b2' : '#db2777'
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${dept.accent}`}>
                      {dept.stepMapping}
                    </span>
                    <button
                      onClick={() => setSelectedDeptModal({ ...dept, staffList, candidateLoad })}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Users className="w-3 h-3" />
                      <span>{staffList.length} Staff</span>
                    </button>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-[16px] leading-snug">
                    {dept.name}
                  </h3>
                  <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                    Code: {dept.code}
                  </div>

                  <p className="text-[12px] text-gray-600 mt-2.5 leading-relaxed line-clamp-3">
                    {dept.workflowRole}
                  </p>

                  {/* Telemetry Metrics */}
                  <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="text-[10px] text-gray-500 font-semibold">Active Caseload</div>
                      <div className="text-[15px] font-bold text-gray-900 mt-0.5">
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto text-gray-400" /> : `${candidateLoad} Files`}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-[10px] text-blue-600 font-semibold">SLA Standard</div>
                      <div className="text-[12px] font-bold text-blue-700 mt-0.5">
                        {dept.slaTarget}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {staffList.slice(0, 4).map((m, idx) => (
                      <div 
                        key={m._id || idx} 
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-600 text-white text-[9px] font-bold text-center leading-6"
                        title={m.name}
                      >
                        {m.name.slice(0, 1)}
                      </div>
                    ))}
                    {staffList.length > 4 && (
                      <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 text-gray-600 text-[9px] font-bold text-center leading-6">
                        +{staffList.length - 4}
                      </div>
                    )}
                    {staffList.length === 0 && (
                      <span className="text-[11px] text-gray-400 italic">No staff assigned</span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedDeptModal({ ...dept, staffList, candidateLoad })}
                    className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Roster</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-4">Department Name & Code</th>
                  <th className="py-3 px-4">Workflow Step Mapping</th>
                  <th className="py-3 px-4">Roles Handled</th>
                  <th className="py-3 px-4 text-center">Staff Strength</th>
                  <th className="py-3 px-4 text-center">Active Caseload</th>
                  <th className="py-3 px-4 text-center">SLA Target</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[13px]">
                {filteredDepartments.map((dept) => {
                  const staffList = users.filter(u => dept.rolesHandled.includes(u.role));
                  const candidateLoad = summary?.byStage?.[dept.stageKey] || 0;

                  return (
                    <tr key={dept.code} className="hover:bg-blue-50/30 transition-colors whitespace-nowrap">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <div>{dept.name}</div>
                        <div className="text-[11px] font-mono text-gray-400 font-normal">{dept.code}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${dept.accent}`}>
                          {dept.stepMapping}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-gray-600 font-medium">
                        {dept.rolesHandled.join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600">
                        {staffList.length} Staff
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-900">
                        {candidateLoad} Files
                      </td>
                      <td className="py-3.5 px-4 text-center text-[12px] font-semibold text-gray-600">
                        {dept.slaTarget}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedDeptModal({ ...dept, staffList, candidateLoad })}
                          className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1 inline-flex"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                          <span>View Unit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: View Department Staff Roster & Operational Details */}
      {selectedDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-[15px]">{selectedDeptModal.name}</h3>
                  <div className="text-[11px] text-blue-200 font-mono">{selectedDeptModal.stepMapping}</div>
                </div>
              </div>
              <button onClick={() => setSelectedDeptModal(null)} className="text-gray-300 hover:text-white text-xl font-bold cursor-pointer">×</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-[13px]">
              <div>
                <h4 className="font-bold text-gray-900 text-[12px] uppercase tracking-wider mb-1">Operational Mandate</h4>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
                  {selectedDeptModal.workflowRole}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[11px] text-gray-500 font-semibold">Active Caseload</div>
                  <div className="text-[18px] font-bold text-gray-900 mt-0.5">{selectedDeptModal.candidateLoad} Candidates</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-[11px] text-blue-700 font-semibold">SLA Standard</div>
                  <div className="text-[16px] font-bold text-blue-900 mt-0.5">{selectedDeptModal.slaTarget}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 text-[12px] uppercase tracking-wider">
                    Unit Personnel ({selectedDeptModal.staffList.length})
                  </h4>
                  <span className="text-[11px] text-gray-400">Live Database Roster</span>
                </div>

                {selectedDeptModal.staffList.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-400 text-[12px]">
                    No personnel currently mapped to this operational desk.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedDeptModal.staffList.map((m) => (
                      <div key={m._id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                            {m.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[12px]">{m.name}</div>
                            <div className="text-[11px] text-gray-500">{m.email} • {m.phone || 'N/A'}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {m.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  setSelectedDeptModal(null);
                  navigate('/users');
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-[12px] font-bold hover:bg-gray-100 cursor-pointer"
              >
                Manage Staff Assignments
              </button>

              <button
                onClick={() => setSelectedDeptModal(null)}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
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
