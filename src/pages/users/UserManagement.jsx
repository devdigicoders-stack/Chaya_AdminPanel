import { useState, useEffect, useMemo } from 'react';
import {
  UserPlus, Download, Users, UserCheck, Shield,
  Building2, Search, Eye, 
  ShieldCheck, X, RefreshCw, AlertCircle, 
  Mail, Phone,
  Edit, Trash2, 
  Loader2, Power,
  ChevronRight, History, Clock, Sparkles, Activity, Globe, ArrowUpRight,
  Lock, EyeOff, Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { 
  apiGetUsers, 
  apiRegisterUser, 
  apiUpdateUser, 
  apiToggleUserStatus, 
  apiDeleteUser,
  apiGetUserHistory,
  getCurrentUser 
} from '../../utils/api';

// Official System Roles based on FRD Section 4 & 22
const SYSTEM_ROLES = [
  { code: 'ADMIN', label: 'Admin (System Administrator)', dept: 'System Administration' },
  { code: 'DATA_CONTROLLER', label: 'Data Controller (Lead Pool)', dept: 'Lead Ingestion & Data' },
  { code: 'STAFF_HEAD', label: 'Staff Head (Team Manager)', dept: 'Staff Head Directorate' },
  { code: 'CALLING_STAFF', label: 'Calling Staff (Candidate Screening)', dept: 'Calling & Screening Desk' },
  { code: 'INTERVIEW_PANEL', label: 'Interview Panel (Trade Assessor)', dept: 'Technical Trade Evaluation' },
  { code: 'MEDICAL_DEPT', label: 'Medical Team (GAMCA Coordinator)', dept: 'Medical GAMCA Desk' },
  { code: 'ACCOUNTS', label: 'Accounts (Bill Book & Finance)', dept: 'Bill Book & Accounts' },
  { code: 'PRE_VISA_MANAGER', label: 'Pre-Viva Manager (Verification)', dept: 'Pre-Viva Verification Desk' },
  { code: 'VISA_MANAGER', label: 'Visa Manager (Consular Stamping)', dept: 'Visa Operations Desk' },
  { code: 'VIVA_MANAGER', label: 'Viva Manager (Client Placement)', dept: 'Viva & Placement Desk' }
];

export default function UserManagement() {
  const navigate = useNavigate();
  const currentLoggedInUser = getCurrentUser();

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState(null);
  const [viewModalUser, setViewModalUser] = useState(null);
  const [historyModalUser, setHistoryModalUser] = useState(null);
  const [userHistoryData, setUserHistoryData] = useState(null);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [historyActiveTab, setHistoryActiveTab] = useState('ACTIONS'); // 'ACTIONS' | 'LOGINS'
  const [showViewPassword, setShowViewPassword] = useState(true);

  // Form State for Add User
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('CALLING_STAFF');
  const [formDepartment, setFormDepartment] = useState('Calling & Screening Desk');
  const [formTeamHeadId, setFormTeamHeadId] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch Users
  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetUsers();
      if (res && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Open dynamic user activity & audit history modal
  const handleOpenUserHistory = async (user) => {
    setHistoryModalUser(user);
    setUserHistoryLoading(true);
    setUserHistoryData(null);
    setHistoryActiveTab('ACTIONS');
    try {
      const res = await apiGetUserHistory(user._id);
      if (res?.success && res.data) {
        setUserHistoryData(res.data);
      }
    } catch (err) {
      console.error('Error fetching user history:', err);
      Swal.fire({
        icon: 'error',
        title: 'Failed to load history',
        text: err.message || 'Could not load staff activity history.'
      });
    } finally {
      setUserHistoryLoading(false);
    }
  };

  // Filter available Staff Heads for team mapping
  const staffHeads = useMemo(() => {
    return users.filter(u => u.role === 'STAFF_HEAD' && u.isActive);
  }, [users]);

  // Distinct Departments
  const availableDepartments = useMemo(() => {
    const set = new Set();
    users.forEach(u => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set).sort();
  }, [users]);

  // Handle Role Change in Add Form to automatically suggest department
  const handleRoleSelection = (roleCode) => {
    setFormRole(roleCode);
    const found = SYSTEM_ROLES.find(r => r.code === roleCode);
    if (found) {
      setFormDepartment(found.dept);
    }
    if (roleCode !== 'CALLING_STAFF') {
      setFormTeamHeadId('');
    }
  };

  // Add User Submission
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      Swal.fire({ icon: 'warning', title: 'Required Fields', text: 'Name, Email, and Password are required.' });
      return;
    }

    if (formPassword.trim().length < 6) {
      Swal.fire({ icon: 'warning', title: 'Weak Password', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setFormSubmitting(true);
    try {
      await apiRegisterUser({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        password: formPassword.trim(),
        role: formRole,
        department: formDepartment.trim() || 'Operations',
        teamHeadId: formRole === 'CALLING_STAFF' && formTeamHeadId ? formTeamHeadId : null
      });

      Swal.fire({
        icon: 'success',
        title: 'Staff Onboarded',
        text: `User '${formName}' with role '${formRole}' created successfully!`,
        timer: 2500,
        showConfirmButton: false
      });

      setIsAddModalOpen(false);
      // Reset form
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormPassword('');
      setFormRole('CALLING_STAFF');
      setFormDepartment('Calling & Screening Desk');
      setFormTeamHeadId('');

      loadUsers();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Creation Failed', text: err.message || 'Could not onboard user.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Edit User Submission
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editModalUser) return;

    try {
      await apiUpdateUser(editModalUser._id, {
        name: editModalUser.name,
        email: editModalUser.email,
        phone: editModalUser.phone,
        role: editModalUser.role,
        department: editModalUser.department,
        teamHeadId: editModalUser.role === 'CALLING_STAFF' ? editModalUser.teamHeadId || null : null,
        password: editModalUser.password || undefined
      });

      Swal.fire({
        icon: 'success',
        title: 'User Updated',
        text: `Details for '${editModalUser.name}' updated successfully!`,
        timer: 2000,
        showConfirmButton: false
      });

      setEditModalUser(null);
      loadUsers();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message || 'Could not update user details.' });
    }
  };

  // Toggle Active / Deactivate
  const handleToggleStatus = async (user) => {
    if (user._id === currentLoggedInUser?._id) {
      Swal.fire({ icon: 'warning', title: 'Unauthorized', text: 'You cannot deactivate your own account.' });
      return;
    }

    const action = user.isActive ? 'Deactivate' : 'Activate';
    const result = await Swal.fire({
      title: `${action} Staff Member?`,
      text: `Are you sure you want to ${action.toLowerCase()} access for ${user.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: user.isActive ? '#e11d48' : '#2563eb',
      confirmButtonText: `Yes, ${action}`
    });

    if (result.isConfirmed) {
      try {
        await apiToggleUserStatus(user._id);
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `Staff member ${user.name} is now ${user.isActive ? 'Inactive' : 'Active'}.`,
          timer: 2000,
          showConfirmButton: false
        });
        loadUsers();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Action Failed', text: err.message || 'Could not update status.' });
      }
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    if (user._id === currentLoggedInUser?._id) {
      Swal.fire({ icon: 'warning', title: 'Unauthorized', text: 'You cannot delete your own account.' });
      return;
    }

    const result = await Swal.fire({
      title: `Delete User: ${user.name}?`,
      text: 'This action is permanent and will remove credentials from the database.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      confirmButtonText: 'Yes, Delete Permanently'
    });

    if (result.isConfirmed) {
      try {
        await apiDeleteUser(user._id);
        Swal.fire({
          icon: 'success',
          title: 'User Deleted',
          text: `Staff member ${user.name} removed from system.`,
          timer: 2000,
          showConfirmButton: false
        });
        loadUsers();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.message || 'Could not delete user.' });
      }
    }
  };

  // Dynamic KPI Metrics
  const totalStaff = users.length;
  const activeStaff = users.filter(u => u.isActive).length;
  const callingStaffCount = users.filter(u => u.role === 'CALLING_STAFF').length;
  const staffHeadCount = users.filter(u => u.role === 'STAFF_HEAD').length;
  const managersCount = users.filter(u => ['VISA_MANAGER', 'PRE_VISA_MANAGER', 'VIVA_MANAGER', 'MEDICAL_DEPT', 'ACCOUNTS', 'INTERVIEW_PANEL'].includes(u.role)).length;

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Tab filter
      if (activeTab === 'Calling' && u.role !== 'CALLING_STAFF') return false;
      if (activeTab === 'Staff Heads' && u.role !== 'STAFF_HEAD') return false;
      if (activeTab === 'Interview & Medical' && !['INTERVIEW_PANEL', 'MEDICAL_DEPT'].includes(u.role)) return false;
      if (activeTab === 'Visa & Pre-Viva' && !['VISA_MANAGER', 'PRE_VISA_MANAGER', 'VIVA_MANAGER'].includes(u.role)) return false;
      if (activeTab === 'Accounts & Admin' && !['ACCOUNTS', 'ADMIN', 'DATA_CONTROLLER'].includes(u.role)) return false;

      // Role filter
      if (roleFilter !== 'All' && u.role !== roleFilter) return false;

      // Department filter
      if (deptFilter !== 'All' && u.department !== deptFilter) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const role = (u.role || '').toLowerCase();
        const dept = (u.department || '').toLowerCase();

        if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !role.includes(q) && !dept.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [users, activeTab, roleFilter, deptFilter, searchTerm]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'No staff records to export.' });
      return;
    }

    const headers = ['User ID', 'Full Name', 'Email', 'Phone', 'Role', 'Department', 'Status', 'Created At'];
    const rows = filteredUsers.map(u => [
      u._id,
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      u.role || '',
      `"${u.department || ''}"`,
      u.isActive ? 'Active' : 'Inactive',
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Directory Exported',
      text: `${filteredUsers.length} staff member records exported to CSV.`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  // Helper for role badge colors
  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'STAFF_HEAD':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CALLING_STAFF':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INTERVIEW_PANEL':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDICAL_DEPT':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'ACCOUNTS':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'PRE_VISA_MANAGER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'VISA_MANAGER':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'VIVA_MANAGER':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      {/* Sleek Header & Breadcrumbs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">12. Users & Staff</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-semibold">All Staff Members</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Staff Members & User Directory
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              FRD Sec 4 & 6 Governance
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Provision and administer system credentials, calling officers, staff head team mappings, visa managers, and accounts controllers across all 19 workflow stages.
          </p>
        </div>

        {/* Action Toolbar - strictly single-line, shrink-0, whitespace-nowrap */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button 
            onClick={loadUsers}
            disabled={loading}
            className="h-9.5 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap disabled:opacity-50"
            title="Sync live user credentials from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} /> 
            <span>Sync Users</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="h-9.5 px-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
            title="Export staff directory to CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" /> 
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="h-9.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" /> 
            <span>Onboard Staff</span>
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

      {/* 5 Dynamic KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Card 1: Total Staff */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Total Staff
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-gray-900 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : totalStaff}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Total System Users</div>
          </div>
        </div>

        {/* Card 2: Active Accounts */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {totalStaff > 0 ? `${Math.round((activeStaff / totalStaff) * 100)}% Active` : '0%'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-emerald-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : `${activeStaff} / ${totalStaff}`}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Active Staff Credentials</div>
          </div>
        </div>

        {/* Card 3: Calling Staff (FRD Sec 6) */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              FRD Sec 6
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-teal-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : callingStaffCount}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Calling Staff Officers</div>
          </div>
        </div>

        {/* Card 4: Staff Heads (FRD Sec 4 & 6) */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Team Leaders
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-indigo-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : staffHeadCount}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Staff Head Managers</div>
          </div>
        </div>

        {/* Card 5: Operational Managers */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              Departmental
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-purple-600 leading-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : managersCount}
            </div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Operational Desk Heads</div>
          </div>
        </div>
      </div>

      {/* Staff Directory Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Top Controls Bar */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[16px]">Active Staff Roster & Hierarchy</h3>
              <p className="text-[12px] text-gray-500">Live operational personnel roster connected directly to MongoDB system credentials.</p>
            </div>

            {/* Filter Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, email, phone, role..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role Selector */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-[12px]">
                <span className="text-gray-500">Role:</span>
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent font-medium text-gray-800 focus:outline-none cursor-pointer text-[12px]"
                >
                  <option value="All">All Roles</option>
                  {SYSTEM_ROLES.map(r => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Department Selector */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-[12px]">
                <span className="text-gray-500">Dept:</span>
                <select 
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-transparent font-medium text-gray-800 focus:outline-none cursor-pointer text-[12px]"
                >
                  <option value="All">All Departments</option>
                  {availableDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Workflow Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: 'All', label: 'All Personnel', count: users.length },
              { key: 'Calling', label: 'Calling Staff (Sec 6)', count: callingStaffCount },
              { key: 'Staff Heads', label: 'Staff Heads', count: staffHeadCount },
              { key: 'Interview & Medical', label: 'Interview & Medical', count: users.filter(u => ['INTERVIEW_PANEL', 'MEDICAL_DEPT'].includes(u.role)).length },
              { key: 'Visa & Pre-Viva', label: 'Visa & Pre-Viva', count: users.filter(u => ['VISA_MANAGER', 'PRE_VISA_MANAGER', 'VIVA_MANAGER'].includes(u.role)).length },
              { key: 'Accounts & Admin', label: 'Accounts & Admin', count: users.filter(u => ['ACCOUNTS', 'ADMIN', 'DATA_CONTROLLER'].includes(u.role)).length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.key ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Full Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4">Staff Member & ID</th>
                <th className="py-3 px-4">Contact Information</th>
                <th className="py-3 px-4">System Role (FRD Sec 4)</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Reporting Head</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading staff directory from database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No staff records match your active search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const initials = (user.name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                  const reportingHead = user.teamHeadId ? users.find(u => u._id === user.teamHeadId) : null;
                  const isSelf = user._id === currentLoggedInUser?._id;

                  return (
                    <tr key={user._id} className="hover:bg-blue-50/30 transition-colors whitespace-nowrap">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-[12px] flex items-center justify-center shrink-0 shadow-2xs">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 leading-snug flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isSelf && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                              ID: {user._id?.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[12px] text-gray-800 font-medium">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{user.phone || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-800 text-[12px]">
                        {user.department || 'Operations'}
                      </td>

                      {/* Reporting Head (FRD Sec 6) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {reportingHead ? (
                          <div className="text-[12px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                            {reportingHead.name}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Direct / Self</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={isSelf}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            user.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title={isSelf ? 'Cannot toggle self' : 'Click to toggle status'}
                        >
                          <Power className="w-3 h-3" />
                          <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[12px] text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenUserHistory(user)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="View Full Activity History & Audit Trail"
                          >
                            <History className="w-4 h-4 text-indigo-600" />
                          </button>

                          <button
                            onClick={() => {
                              setShowViewPassword(true);
                              setViewModalUser(user);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditModalUser({ ...user })}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Edit Credentials & Role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-gray-500">
          <div>
            Showing <span className="font-bold text-gray-800">{filteredUsers.length}</span> of <span className="font-bold text-gray-800">{users.length}</span> staff personnel from database
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster CSV</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Onboard New Staff Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-[15px]">Onboard New System Personnel</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-gray-300 hover:text-white text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 overflow-y-auto space-y-4 text-[13px]">
              {/* Full Name */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">Initial Password * (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Role Selection (FRD Sec 4) */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">Assigned System Role (FRD Sec 4) *</label>
                <select
                  value={formRole}
                  onChange={(e) => handleRoleSelection(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  {SYSTEM_ROLES.map(r => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Calling & Screening Desk"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Assigned Staff Head (If Calling Staff selected) */}
              {formRole === 'CALLING_STAFF' && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <label className="block text-[12px] font-bold text-blue-900 mb-1">
                    Map to Staff Head Team (FRD Section 6)
                  </label>
                  <p className="text-[11px] text-blue-700 mb-2">
                    Calling staff will receive round-robin lead allocations from their assigned Staff Head.
                  </p>
                  <select
                    value={formTeamHeadId}
                    onChange={(e) => setFormTeamHeadId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-[12px] font-medium text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">No Staff Head (Unmapped)</option>
                    {staffHeads.map(head => (
                      <option key={head._id} value={head._id}>{head.name} ({head.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Onboard Personnel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Staff Credentials & Role */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-[15px]">Edit Staff Member: {editModalUser.name}</h3>
              </div>
              <button onClick={() => setEditModalUser(null)} className="text-gray-300 hover:text-white text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 overflow-y-auto space-y-4 text-[13px]">
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editModalUser.name}
                  onChange={(e) => setEditModalUser({ ...editModalUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editModalUser.email}
                    onChange={(e) => setEditModalUser({ ...editModalUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editModalUser.phone || ''}
                    onChange={(e) => setEditModalUser({ ...editModalUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">System Role</label>
                <select
                  value={editModalUser.role}
                  onChange={(e) => setEditModalUser({ ...editModalUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  {SYSTEM_ROLES.map(r => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editModalUser.department || ''}
                  onChange={(e) => setEditModalUser({ ...editModalUser, department: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              {editModalUser.role === 'CALLING_STAFF' && (
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Assigned Staff Head</label>
                  <select
                    value={editModalUser.teamHeadId || ''}
                    onChange={(e) => setEditModalUser({ ...editModalUser, teamHeadId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">No Staff Head (Direct)</option>
                    {staffHeads.map(head => (
                      <option key={head._id} value={head._id}>{head.name} ({head.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-bold text-amber-900">Login Password</label>
                  <span className="text-[10px] text-amber-700 font-bold uppercase">Plain Text Editable</span>
                </div>
                <input
                  type="text"
                  placeholder="Enter login password"
                  value={editModalUser.password || ''}
                  onChange={(e) => setEditModalUser({ ...editModalUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-[13px] font-mono font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-[13px] font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Full Staff Details Dossier */}
      {viewModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-[15px]">Personnel Profile Dossier</h3>
              </div>
              <button onClick={() => setViewModalUser(null)} className="text-gray-300 hover:text-white text-xl font-bold cursor-pointer">×</button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-[16px] flex items-center justify-center">
                  {(viewModalUser.name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-[16px]">{viewModalUser.name}</h4>
                  <div className="text-[11px] text-gray-500 font-mono">ID: {viewModalUser._id}</div>
                  <span className={`inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getRoleBadge(viewModalUser.role)}`}>
                    {viewModalUser.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium text-gray-900">{viewModalUser.email}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium text-gray-900">{viewModalUser.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-medium text-gray-900">{viewModalUser.department || 'Operations'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Account Status:</span>
                  <span className={`font-bold ${viewModalUser.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {viewModalUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Login Password Display Card */}
                <div className="p-3.5 bg-gradient-to-r from-amber-50/80 to-amber-100/60 border border-amber-300 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-900 font-bold text-[12px] flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-600" />
                      Login Password (Plain Text):
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 uppercase tracking-wide">
                      Admin View
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-amber-200 shadow-2xs">
                    <div className="font-mono text-[14px] font-bold text-gray-900 tracking-wider select-all">
                      {showViewPassword ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {viewModalUser.password || 'password123'}
                        </span>
                      ) : (
                        <span className="text-gray-400">••••••••••••</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowViewPassword(!showViewPassword)}
                        className="p-1.5 text-gray-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg cursor-pointer transition-colors"
                        title={showViewPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showViewPassword ? <EyeOff className="w-4 h-4 text-amber-700" /> : <Eye className="w-4 h-4 text-gray-600" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(viewModalUser.password || 'password123');
                          Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'Password copied to clipboard!',
                            showConfirmButton: false,
                            timer: 2000
                          });
                        }}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                        title="Copy Password"
                      >
                        <Copy className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-800/80 mt-1.5 font-medium">
                    Stored unhashed as requested. Can be viewed and edited by Administrator.
                  </p>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-500">Created At:</span>
                  <span className="font-medium text-gray-700">
                    {viewModalUser.createdAt ? new Date(viewModalUser.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const u = viewModalUser;
                  setViewModalUser(null);
                  handleOpenUserHistory(u);
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[12px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span>View Full Audit History</span>
              </button>

              <button
                onClick={() => setViewModalUser(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl text-[12px] font-bold hover:bg-black cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: User Full Activity History & Audit Trail */}
      {historyModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[16px] text-white">
                      Personnel Activity & Audit History Dossier
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      FRD Sec 19
                    </span>
                  </div>
                  <div className="text-[11.5px] text-slate-300 flex items-center gap-2 mt-0.5 font-mono">
                    <span className="font-bold text-white">{historyModalUser.name}</span>
                    <span>•</span>
                    <span className="text-indigo-300 font-semibold">{historyModalUser.role}</span>
                    <span>•</span>
                    <span className="text-slate-400">{historyModalUser.email}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setHistoryModalUser(null)} 
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
              {userHistoryLoading ? (
                <div className="py-24 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                  <p className="text-xs font-semibold text-gray-700">Syncing live user activity & audit logs from MongoDB...</p>
                  <p className="text-[11px] text-gray-400 mt-1">Aggregating immutable stage transitions and session logs</p>
                </div>
              ) : (
                <>
                  {/* KPI Summary Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                        <span>Total Actions</span>
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="text-2xl font-black text-blue-700">
                        {userHistoryData?.summary?.totalActions || 0}
                      </div>
                      <div className="text-[10.5px] text-gray-400 mt-0.5">Recorded lifecycle events</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                        <span>Leads Handled</span>
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="text-2xl font-black text-emerald-700">
                        {userHistoryData?.summary?.uniqueLeadsCount || 0}
                      </div>
                      <div className="text-[10.5px] text-gray-400 mt-0.5">Unique candidates touched</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                        <span>Login Sessions</span>
                        <Globe className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <div className="text-2xl font-black text-purple-700">
                        {userHistoryData?.summary?.totalLogins || 0}
                      </div>
                      <div className="text-[10.5px] text-gray-400 mt-0.5">Audit-tracked login records</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <div className="flex items-center justify-between text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                        <span>Last Active</span>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="text-[13px] font-bold text-gray-900 truncate mt-1">
                        {userHistoryData?.summary?.lastActive 
                          ? new Date(userHistoryData.summary.lastActive).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : 'N/A'}
                      </div>
                      <div className="text-[10.5px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Synchronized</span>
                      </div>
                    </div>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <button
                      onClick={() => setHistoryActiveTab('ACTIONS')}
                      className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        historyActiveTab === 'ACTIONS'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Operational Actions & Stage Transitions</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        historyActiveTab === 'ACTIONS' ? 'bg-indigo-700 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {userHistoryData?.actions?.length || 0}
                      </span>
                    </button>

                    <button
                      onClick={() => setHistoryActiveTab('LOGINS')}
                      className={`px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        historyActiveTab === 'LOGINS'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Login Sessions & Security Audit</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        historyActiveTab === 'LOGINS' ? 'bg-indigo-700 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {userHistoryData?.logins?.length || 0}
                      </span>
                    </button>
                  </div>

                  {/* TAB 1: Actions Audit Trail */}
                  {historyActiveTab === 'ACTIONS' && (
                    <div className="space-y-3">
                      {!userHistoryData?.actions || userHistoryData.actions.length === 0 ? (
                        <div className="bg-white rounded-xl p-10 text-center text-gray-400 border border-gray-200">
                          <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-gray-700">No Operational Actions Recorded</p>
                          <p className="text-[11px] text-gray-400 mt-1">This staff member has not performed any candidate stage updates or actions yet.</p>
                        </div>
                      ) : (
                        <div className="relative border-l-2 border-indigo-200 ml-4 space-y-4 pl-6">
                          {userHistoryData.actions.map((act, idx) => {
                            const actionTitle = (act.actionType || 'LIFECYCLE_ACTION').replace(/_/g, ' ');
                            const leadName = act.lead?.candidateName || act.leadIdStr || 'Candidate File';
                            const leadId = act.lead?.leadId || act.leadIdStr || 'N/A';
                            const dateStr = act.createdAt ? new Date(act.createdAt).toLocaleString('en-GB') : 'Recent';

                            return (
                              <div key={act._id || idx} className="relative group">
                                <div className="absolute -left-[35px] top-0 w-7 h-7 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-xs text-indigo-600 group-hover:scale-110 transition-transform">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-2xs hover:shadow-xs transition-shadow">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                        #{userHistoryData.actions.length - idx} • {actionTitle}
                                      </span>
                                      <span className="text-xs font-bold text-gray-900">
                                        Candidate: <span className="text-blue-700 font-mono">{leadName}</span> ({leadId})
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span>{dateStr}</span>
                                    </div>
                                  </div>

                                  {(act.fromStage || act.toStage) && (
                                    <div className="my-1.5 flex items-center gap-2 text-[11px] font-mono">
                                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                        {act.fromStage || 'INITIAL'}
                                      </span>
                                      <span className="text-indigo-600 font-bold">➔</span>
                                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                                        {act.toStage || 'UPDATED'}
                                      </span>
                                    </div>
                                  )}

                                  <p className="text-[12px] text-gray-700 leading-relaxed bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                                    {act.remarks || 'Action successfully recorded in candidate history.'}
                                  </p>

                                  {act.lead?.trade && (
                                    <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-3">
                                      <span>Trade: <b>{act.lead.trade}</b></span>
                                      <span>Stage: <b>{act.lead.currentStage}</b></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Login Sessions */}
                  {historyActiveTab === 'LOGINS' && (
                    <div className="space-y-3">
                      {!userHistoryData?.logins || userHistoryData.logins.length === 0 ? (
                        <div className="bg-white rounded-xl p-10 text-center text-gray-400 border border-gray-200">
                          <Globe className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-gray-700">No Login Sessions Recorded</p>
                          <p className="text-[11px] text-gray-400 mt-1">No security session audits found for this user.</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10.5px]">
                                <th className="py-2.5 px-3">Login Timestamp</th>
                                <th className="py-2.5 px-3">IP Address</th>
                                <th className="py-2.5 px-3">Location</th>
                                <th className="py-2.5 px-3">Device / Browser</th>
                                <th className="py-2.5 px-3 text-right">Session Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[12px]">
                              {userHistoryData.logins.map((lg, i) => (
                                <tr key={lg._id || i} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 font-mono font-medium text-gray-800">
                                    {new Date(lg.loginTime).toLocaleString('en-GB')}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-gray-600">
                                    {lg.ip || '127.0.0.1'}
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-700">
                                    {lg.location || 'Local Terminal'}
                                  </td>
                                  <td className="py-2.5 px-3 text-gray-600 truncate max-w-[200px]" title={lg.device}>
                                    {lg.device || 'Chrome / Windows'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] border ${
                                      lg.status === 'Active Session'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                      {lg.status || 'Active'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const uname = historyModalUser.name;
                  setHistoryModalUser(null);
                  navigate('/audit-logs?search=' + encodeURIComponent(uname));
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[12px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Open in Global Audit Logs</span>
              </button>

              <button
                onClick={() => setHistoryModalUser(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl text-[12px] font-bold hover:bg-black cursor-pointer shadow-xs"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
