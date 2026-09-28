import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Shield, ShieldCheck, Check, X, Lock, Users, Edit3, Trash2, 
  Plus, Download, RefreshCw, Sparkles, AlertCircle, AlertTriangle, Search, 
  Filter, Eye, Printer, Copy, UserCheck, Key, Settings, Briefcase, 
  FileSpreadsheet, Plane, Receipt, Phone, CheckCircle2, Sliders, 
  ExternalLink, ArrowUpRight, Clock, Award, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetUsers } from '../../utils/api';

// 10 Official 19-Step Overseas Recruitment System Roles (FRD Section 4, 21 & 22)
const ROLES_SPECIFICATION = [
  {
    code: 'ADMIN',
    name: 'Super Admin & Directorate',
    stepMapping: 'System-Wide Full Governance',
    category: 'Executive Management',
    description: 'Overall system control, masters, user provisioning, global overrides, audit logs, financial ledger authority, and settings configuration.',
    color: 'border-purple-500 bg-purple-50/15',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    soDLevel: 'Global Override Authority',
    permissions: [
      { name: 'User & Role Provisioning', allowed: true },
      { name: 'Lead Pool & Bulk Import', allowed: true },
      { name: 'Full Stage Transfers Override', allowed: true },
      { name: 'Financial Ledger & Collections', allowed: true },
      { name: 'System Settings & Audit Logs', allowed: true },
      { name: 'Candidate Deletion & Blacklist', allowed: true },
    ]
  },
  {
    code: 'DATA_CONTROLLER',
    name: 'Data Controller & Intake Desk',
    stepMapping: 'Step 01: Lead Generation & Pool',
    category: 'Data Operations',
    description: 'Manages incoming leads from WhatsApp, Facebook Ads, and Excel bulk imports, enforces duplicate phone validation, and allocates pool to Staff Heads.',
    color: 'border-blue-500 bg-blue-50/15',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    soDLevel: 'Intake Segregated',
    permissions: [
      { name: 'WhatsApp / Facebook / Excel Import', allowed: true },
      { name: 'Duplicate Phone & Lead Deduplication', allowed: true },
      { name: 'Allocate Pool to Staff Heads', allowed: true },
      { name: 'Stage Transfer Override', allowed: false },
      { name: 'Financial Bookings', allowed: false },
      { name: 'User Management', allowed: false },
    ]
  },
  {
    code: 'STAFF_HEAD',
    name: 'Staff Head & Team Manager',
    stepMapping: 'Step 02 & Step 12: Lead Assignment & Reassignment',
    category: 'Operations Management',
    description: 'Receives bulk lead pool, performs equal round-robin distribution to Calling Staff, verifies completed medical files, and executes staff swap/reassignments.',
    color: 'border-indigo-500 bg-indigo-50/15',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    soDLevel: 'Team Routing Authority',
    permissions: [
      { name: 'Round-Robin Equal Lead Allocation', allowed: true },
      { name: 'Calling Staff Swap / Reassignment', allowed: true },
      { name: 'Post-Medical File Verification', allowed: true },
      { name: 'Team Performance Monitoring', allowed: true },
      { name: 'Financial Modifications', allowed: false },
      { name: 'Direct Visa Stamping', allowed: false },
    ]
  },
  {
    code: 'CALLING_STAFF',
    name: 'Calling Staff Officer',
    stepMapping: 'Steps 03-06 & Step 13: Screening & Location Confirmation',
    category: 'Candidate Screening',
    description: 'Calls candidate, verifies passport status (Passport / Non-Passport / Not Confirmed), completes full profile form, and logs location confirmation (max 4 edits).',
    color: 'border-emerald-500 bg-emerald-50/15',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    soDLevel: 'Screening Isolated',
    permissions: [
      { name: 'Call Log & Communication Notes', allowed: true },
      { name: 'Passport Verification (YES / NO)', allowed: true },
      { name: 'Complete Candidate Full Form', allowed: true },
      { name: 'Location Confirmation (Max 4 Attempts)', allowed: true },
      { name: 'Route to Interview OR CV Selection', allowed: true },
      { name: 'Medical/Visa Direct Access', allowed: false },
    ]
  },
  {
    code: 'INTERVIEW_PANEL',
    name: 'Interview Panel & Trade Assessor',
    stepMapping: 'Steps 07-09: Technical Trade Assessment',
    category: 'Technical Evaluation',
    description: 'Conducts practical trade interviews (welders, pipe fitters, electricians), grades technical competency, submits PASS / FAIL results, and routes back to Calling Staff.',
    color: 'border-amber-500 bg-amber-50/15',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    soDLevel: 'Assessment Isolated',
    permissions: [
      { name: 'Technical Practical Evaluation', allowed: true },
      { name: 'Record Trade Bench Test Marks', allowed: true },
      { name: 'Submit Interview PASS / FAIL', allowed: true },
      { name: 'Interview Queue Management', allowed: true },
      { name: 'Payment Collections', allowed: false },
      { name: 'Visa Stage Transfer', allowed: false },
    ]
  },
  {
    code: 'MEDICAL_DEPT',
    name: 'Medical Team & GAMCA Coordinator',
    stepMapping: 'Step 10: Medical Management & Payment Booking',
    category: 'Clinical Compliance',
    description: 'Receives interview PASS and CV Selected candidates, schedules GAMCA medical appointments, uploads diagnostic certificates (FIT / UNFIT), and triggers payment booking.',
    color: 'border-teal-500 bg-teal-50/15',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    soDLevel: 'Clinical Quarantine Authority',
    permissions: [
      { name: 'GAMCA Medical Scheduling', allowed: true },
      { name: 'Diagnostic Report Certificate Upload', allowed: true },
      { name: 'Record Medical Result (FIT / UNFIT)', allowed: true },
      { name: 'Trigger Payment Booking Window', allowed: true },
      { name: 'Visa Stamping Access', allowed: false },
      { name: 'Flight Ticket Booking', allowed: false },
    ]
  },
  {
    code: 'ACCOUNTS',
    name: 'Accounts & Bill Book Controller',
    stepMapping: 'Step 11 & Step 18: Service & Medical Fee Collections',
    category: 'Financial Operations',
    description: 'Maintains strict separation between Service Fee and Medical Fee, issues receipts, records Step 11 advance bookings and Step 18 final settlements.',
    color: 'border-orange-500 bg-orange-50/15',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    soDLevel: 'Financial Segregation Enforced',
    permissions: [
      { name: 'Service Fee Collection & Receipts', allowed: true },
      { name: 'Medical Fee Collection & Receipts', allowed: true },
      { name: 'Step 11 Advance Payment Booking', allowed: true },
      { name: 'Step 18 Final Payment Settlement', allowed: true },
      { name: 'Outstanding Balance Ledger', allowed: true },
      { name: 'Interview Result Modification', allowed: false },
    ]
  },
  {
    code: 'PRE_VISA_MANAGER',
    name: 'Pre-Viva Manager',
    stepMapping: 'Step 15: Move / Direct File Inward Verification',
    category: 'Pre-Consular Coordination',
    description: 'Audits Move Files and Direct Files, verifies attested dossiers, assigns files to Visa Manager, collects remaining payment, and handles the Visa Delay loop.',
    color: 'border-indigo-600 bg-indigo-50/15',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    soDLevel: 'Verification Gatekeeper',
    permissions: [
      { name: 'Move File / Direct File Inward Audit', allowed: true },
      { name: 'Assign Files to Visa Manager', allowed: true },
      { name: 'Coordinate Remaining Complete Payment', allowed: true },
      { name: 'Manage Visa Delay Loop Confirmations', allowed: true },
      { name: 'Pre-Viva Evaluation Scoring', allowed: true },
      { name: 'Direct Embassy Stamping', allowed: false },
    ]
  },
  {
    code: 'VISA_MANAGER',
    name: 'Visa Operations Manager',
    stepMapping: 'Step 16: Visa Consular Processing Desk',
    category: 'Consular Operations',
    description: 'Receives verified files from Pre-Viva Manager, processes embassy filings, captures MOFA/application numbers, tracks stamping status, and initiates date change requests.',
    color: 'border-cyan-500 bg-cyan-50/15',
    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    soDLevel: 'Consular Stamping Authority',
    permissions: [
      { name: 'Lodge Visa Embassy Applications', allowed: true },
      { name: 'Capture MOFA & Application Numbers', allowed: true },
      { name: 'Update Visa Status (Approved/Delayed)', allowed: true },
      { name: 'Route Change Requests to Pre-Viva', allowed: true },
      { name: 'Financial Bookings', allowed: false },
      { name: 'Lead Distribution', allowed: false },
    ]
  },
  {
    code: 'VIVA_MANAGER',
    name: 'Viva & Placement Manager',
    stepMapping: 'Step 17 & Step 19: Foreign Client Viva & Site Joining',
    category: 'Overseas Placement',
    description: 'Schedules foreign client viva dates, records delegate selection outcomes, coordinates offer letter issuances, books international flights, and confirms site arrival.',
    color: 'border-pink-500 bg-pink-50/15',
    badge: 'bg-pink-100 text-pink-700 border-pink-200',
    soDLevel: 'Placement Authority',
    permissions: [
      { name: 'Schedule Foreign Client Viva Date', allowed: true },
      { name: 'Record Viva Outcomes (Selected/On-Hold)', allowed: true },
      { name: 'Offer Letter Dispatch & Verification', allowed: true },
      { name: 'Flight Ticket & PNR Booking', allowed: true },
      { name: 'Confirm On-Site Camp Arrival', allowed: true },
      { name: 'Lead Deletion', allowed: false },
    ]
  }
];

export default function RolesPermissions() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleModal, setSelectedRoleModal] = useState(null);

  // Fetch live users
  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetUsers();
      if (res && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Error fetching users for roles:', err);
      setError(err.message || 'Failed to connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return ROLES_SPECIFICATION.filter(r => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return r.name.toLowerCase().includes(q) || 
               r.code.toLowerCase().includes(q) || 
               r.description.toLowerCase().includes(q) ||
               r.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [searchTerm]);

  // Export Matrix CSV
  const handleExportMatrixCSV = () => {
    const headers = ['Role Code', 'Role Name', 'Category', 'Pipeline Mapping', 'Active Users Count', 'SoD Level', 'Core Responsibilities'];
    const rows = ROLES_SPECIFICATION.map(r => {
      const memberCount = users.filter(u => u.role === r.code).length;
      return [
        r.code,
        `"${r.name}"`,
        `"${r.category}"`,
        `"${r.stepMapping}"`,
        memberCount,
        `"${r.soDLevel}"`,
        `"${r.description}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RBAC_Roles_Permissions_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Matrix Exported',
      text: 'RBAC Roles and Permissions Matrix downloaded successfully.',
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
            <span className="text-gray-900 font-semibold">Roles & Permissions</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Staff Roles & Permission Matrix
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              FRD Sec 4 & 22 RBAC
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Role-Based Access Control (RBAC) governing desk segregation across all 19 recruitment workflow stages with strict Segregation of Duties (SoD).
          </p>
        </div>

        {/* Action Toolbar - strictly single-line, shrink-0, whitespace-nowrap */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button 
            onClick={loadUsers}
            disabled={loading}
            className="h-9.5 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap disabled:opacity-50"
            title="Refresh user counts from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} /> 
            <span>Sync Live Counts</span>
          </button>

          <button 
            onClick={handleExportMatrixCSV}
            className="h-9.5 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
            title="Export RBAC permission matrix as CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" /> 
            <span>Export Matrix</span>
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
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              10 Roles
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-gray-900 leading-tight">10 Master Roles</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Defined in FRD Architecture</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Assigned
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-blue-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : users.length}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Total System Personnel</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Compliant
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-emerald-600 leading-tight">100% SoD Isolated</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Role Segregation Enforced</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              19 Steps
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-amber-600 leading-tight">19 Workflow Desks</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">End-to-End Audit Trail</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search role name, code, description, or step mapping..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Dynamic Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRoles.map((role) => {
          const members = users.filter(u => u.role === role.code);

          return (
            <div 
              key={role.code}
              className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200 border-t-4"
              style={{ borderTopColor: role.code === 'ADMIN' ? '#9333ea' : role.code === 'STAFF_HEAD' ? '#2563eb' : role.code === 'CALLING_STAFF' ? '#059669' : '#0891b2' }}
            >
              <div>
                {/* Top Badge & Member Count */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${role.badge}`}>
                    {role.category}
                  </span>
                  <button
                    onClick={() => setSelectedRoleModal({ ...role, members })}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    <span>{members.length} Assigned</span>
                  </button>
                </div>

                {/* Role Title */}
                <h3 className="font-extrabold text-gray-900 text-[16px] leading-snug">
                  {role.name}
                </h3>
                <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                  Code: <span className="font-bold text-gray-700">{role.code}</span> • {role.stepMapping}
                </div>

                {/* Description */}
                <p className="text-[12px] text-gray-600 mt-2.5 leading-relaxed line-clamp-3">
                  {role.description}
                </p>

                {/* Permission Highlights */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="text-[11px] font-bold text-gray-700 mb-2">Permitted Action Matrix:</div>
                  <div className="space-y-1.5">
                    {role.permissions.map((perm, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className={perm.allowed ? 'text-gray-700' : 'text-gray-400'}>
                          {perm.name}
                        </span>
                        {perm.allowed ? (
                          <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-gray-300">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer with Member Quick Peek */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {members.slice(0, 4).map((m, idx) => (
                    <div 
                      key={m._id || idx} 
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-600 text-white text-[9px] font-bold text-center leading-6"
                      title={m.name}
                    >
                      {m.name.slice(0, 1)}
                    </div>
                  ))}
                  {members.length > 4 && (
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 text-gray-600 text-[9px] font-bold text-center leading-6">
                      +{members.length - 4}
                    </div>
                  )}
                  {members.length === 0 && (
                    <span className="text-[11px] text-gray-400 italic">No staff assigned</span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedRoleModal({ ...role, members })}
                  className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: View Role Members & Permissions Deep Dive */}
      {selectedRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-[15px]">{selectedRoleModal.name}</h3>
                  <div className="text-[11px] text-blue-200 font-mono">Role: {selectedRoleModal.code}</div>
                </div>
              </div>
              <button onClick={() => setSelectedRoleModal(null)} className="text-gray-300 hover:text-white text-xl font-bold cursor-pointer">×</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-[13px]">
              <div>
                <h4 className="font-bold text-gray-900 text-[12px] uppercase tracking-wider mb-1">Functional Description & Scope</h4>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
                  {selectedRoleModal.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-900 text-[12px] uppercase tracking-wider">
                    Assigned Personnel ({selectedRoleModal.members.length})
                  </h4>
                  <span className="text-[11px] text-gray-400">Live Database Records</span>
                </div>

                {selectedRoleModal.members.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-400 text-[12px]">
                    No staff members currently assigned to this role.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedRoleModal.members.map((m) => (
                      <div key={m._id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                            {m.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[12px]">{m.name}</div>
                            <div className="text-[11px] text-gray-500">{m.email}</div>
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
                  setSelectedRoleModal(null);
                  navigate('/users');
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-[12px] font-bold hover:bg-gray-100 cursor-pointer"
              >
                Manage Staff Assignments
              </button>

              <button
                onClick={() => setSelectedRoleModal(null)}
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
