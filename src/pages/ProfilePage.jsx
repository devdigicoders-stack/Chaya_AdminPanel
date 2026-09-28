import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Building2, ShieldCheck, Lock, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Edit3, Save, X, Camera, Clock,
  Globe, Key, Activity, LogIn, Monitor, Loader2
} from 'lucide-react';
import {
  apiGetProfile,
  apiUpdateProfile,
  apiChangePassword,
  getFullAvatarUrl,
  getCurrentUser
} from '../utils/api';

const DEFAULT_PERMISSIONS = [
  'Manage Users',
  'View All Reports',
  'Edit System Settings',
  'Export Data',
  'Manage Roles',
  'Delete Records',
  'Import Bulk Leads',
  'Override Workflow'
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // User state from backend API
  const [user, setUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || 'Administrator',
    phone: user?.phone || '+91 98765 43210',
    dept: user?.department || 'System Administration'
  });

  // Avatar file state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Password state
  const [pwSection, setPwSection] = useState(false);
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 4500);
  };

  // Fetch real profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await apiGetProfile();
        setUser(data);
        setProfileForm({
          name: data.name || '',
          phone: data.phone || '',
          dept: data.department || 'System Administration'
        });
      } catch (err) {
        console.error('Failed to load profile from backend:', err);
        // If not logged in, keep existing or fallback
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle avatar file selection
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPG, PNG, WEBP)', 'error');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setEditMode(true);
      showToast('New profile photo selected! Click "Save Changes" to upload.', 'success');
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      showToast('Full name cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name.trim());
      formData.append('phone', profileForm.phone.trim());
      formData.append('department', profileForm.dept.trim());
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const updated = await apiUpdateProfile(formData);
      setUser(updated);
      setAvatarFile(null);
      setAvatarPreview('');
      setEditMode(false);
      showToast('Profile and photo updated successfully in database!');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Change Password
  const handlePasswordChange = async () => {
    setPwError('');
    if (!pw.current) { setPwError('Please enter your current password'); return; }
    if (pw.newPw.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    if (pw.newPw !== pw.confirm) { setPwError('New passwords do not match'); return; }
    if (pw.current === pw.newPw) { setPwError('New password must be different from current password'); return; }

    setPwSaving(true);
    try {
      await apiChangePassword(pw.current, pw.newPw);
      setPw({ current: '', newPw: '', confirm: '' });
      setPwSection(false);
      showToast('Password changed successfully! Securely updated on backend.');
    } catch (err) {
      setPwError(err.message || 'Password update failed');
    } finally {
      setPwSaving(false);
    }
  };

  // Password strength calculation
  const strength = (() => {
    const p = pw.newPw;
    if (!p) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score <= 1
      ? { label: 'Weak', color: 'bg-rose-500', width: '25%' }
      : score === 2
      ? { label: 'Fair', color: 'bg-amber-400', width: '50%' }
      : score === 3
      ? { label: 'Good', color: 'bg-blue-500', width: '75%' }
      : { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  })();

  const inputCls = 'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors';
  const labelCls = 'block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5';

  const userInitials = (user?.name || 'Admin')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const avatarDisplayUrl = avatarPreview || (user?.avatar ? getFullAvatarUrl(user.avatar) : '');

  return (
    <div className="flex flex-col flex-1 pb-16 max-w-5xl">

      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-[13px] border animate-in fade-in ${
          toastType === 'success'
            ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
            : 'bg-rose-900 text-rose-100 border-rose-700'
        }`}>
          {toastType === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight">My Profile</h1>
          <p className="text-[14px] text-gray-500 mt-1">Manage your administrative credentials, photo and account security.</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Syncing backend…
          </div>
        )}
      </div>

      {/* Top Profile Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 mb-5 text-white shadow-lg border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Avatar with Camera Overlay */}
          <div className="relative shrink-0 group">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-22 h-22 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-[28px] shadow-lg overflow-hidden border-2 border-white/20 cursor-pointer relative"
              title="Click to change profile picture"
            >
              {avatarDisplayUrl ? (
                <img
                  src={avatarDisplayUrl}
                  alt={user?.name || 'Admin'}
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitials
              )}

              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[9px] font-semibold text-white mt-0.5">Change</span>
              </div>
            </div>

            {/* Quick Camera Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-md cursor-pointer transition-colors"
              title="Upload new photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-[20px] font-extrabold">
                {editMode ? profileForm.name : (user?.name || 'Administrator')}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 whitespace-nowrap">
                {user?.role || 'ADMIN'}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 whitespace-nowrap">
                Active
              </span>
            </div>
            <p className="text-[13px] text-slate-300 mt-1">
              {editMode ? profileForm.dept : (user?.department || 'System Administration')}
            </p>
            <p className="text-[12px] text-slate-400 mt-0.5 font-mono">{user?.email}</p>
          </div>

          {/* Edit toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setAvatarFile(null);
                    setAvatarPreview('');
                    setProfileForm({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      dept: user?.department || 'System Administration'
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl text-[12px] font-bold border border-white/20 text-white/70 hover:bg-white/10 cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveProfile}
                  className="px-4 py-2 rounded-xl text-[12px] font-bold bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-70"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="px-4 py-2 rounded-xl text-[12px] font-bold border border-white/20 text-white hover:bg-white/10 cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/10">
          {[
            { label: 'Role Authority', value: user?.role || 'ADMIN', icon: ShieldCheck },
            { label: 'Account Created', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'Active', icon: Clock },
            { label: 'System Access', value: 'Full Control', icon: Activity },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-[16px] font-extrabold">{item.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT: Profile Details + Password ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
            <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-2 mb-5">
              <User className="w-4 h-4 text-blue-600" />
              Personal Information (Backend Synchronized)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className={labelCls}>Full Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    className={inputCls}
                    placeholder="Enter full name"
                  />
                ) : (
                  <div className="px-3 py-2.5 bg-gray-50 rounded-xl text-[13px] font-semibold text-gray-900 border border-gray-100">
                    {user?.name || 'Administrator'}
                  </div>
                )}
              </div>

              {/* Email — always read-only */}
              <div>
                <label className={labelCls}>Email Address <span className="text-gray-400 normal-case tracking-normal font-medium">(read-only)</span></label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-[13px] text-gray-700 border border-gray-100 font-mono">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {user?.email || 'admin@crm.com'}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className={labelCls}>Mobile Number</label>
                {editMode ? (
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className={inputCls}
                    placeholder="+91 98765 43210"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-[13px] text-gray-700 border border-gray-100">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {user?.phone || 'Not configured'}
                  </div>
                )}
              </div>

              {/* Department */}
              <div>
                <label className={labelCls}>Department</label>
                {editMode ? (
                  <input
                    type="text"
                    value={profileForm.dept}
                    onChange={e => setProfileForm(p => ({ ...p, dept: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. System Administration"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-[13px] text-gray-700 border border-gray-100">
                    <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {user?.department || 'System Administration'}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className={labelCls}>System Role <span className="text-gray-400 normal-case tracking-normal font-medium">(read-only)</span></label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl text-[13px] text-gray-700 border border-gray-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {user?.role || 'ADMIN'}
                </div>
              </div>

            </div>

            {editMode && (
              <div className="flex justify-end gap-2.5 mt-5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setAvatarFile(null);
                    setAvatarPreview('');
                    setProfileForm({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      dept: user?.department || 'System Administration'
                    });
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-[13px] font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveProfile}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-70"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Change Password (Backend API Integrated)
              </h3>
              {!pwSection && (
                <button
                  type="button"
                  onClick={() => setPwSection(true)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-[12px] font-bold hover:bg-gray-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" /> Change Password
                </button>
              )}
            </div>

            {!pwSection ? (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Lock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[13px] font-semibold text-gray-700">Account Password Security</div>
                  <div className="text-[12px] text-gray-500 mt-0.5">
                    Click "Change Password" to verify your current password and securely set a new password.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className={labelCls}>Current Password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPw.current ? 'text' : 'password'}
                      value={pw.current}
                      onChange={e => { setPw(p => ({ ...p, current: e.target.value })); setPwError(''); }}
                      placeholder="Enter your current password"
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className={labelCls}>New Password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPw.newPw ? 'text' : 'password'}
                      value={pw.newPw}
                      onChange={e => { setPw(p => ({ ...p, newPw: e.target.value })); setPwError(''); }}
                      placeholder="Minimum 6 characters"
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, newPw: !p.newPw }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPw.newPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength Meter */}
                  {pw.newPw && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px]">
                        <span className="text-gray-400">Password strength</span>
                        <span className={`font-bold ${
                          strength.label === 'Strong' ? 'text-emerald-600' :
                          strength.label === 'Good' ? 'text-blue-600' :
                          strength.label === 'Fair' ? 'text-amber-600' : 'text-rose-600'
                        }`}>{strength.label}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={labelCls}>Confirm New Password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPw.confirm ? 'text' : 'password'}
                      value={pw.confirm}
                      onChange={e => { setPw(p => ({ ...p, confirm: e.target.value })); setPwError(''); }}
                      placeholder="Re-enter new password"
                      className={`${inputCls} pr-10 ${pw.confirm && pw.confirm !== pw.newPw ? 'border-rose-400 focus:border-rose-400' : pw.confirm && pw.confirm === pw.newPw ? 'border-emerald-400' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pw.confirm && pw.confirm === pw.newPw && (
                    <div className="mt-1.5 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </div>
                  )}
                </div>

                {/* Error */}
                {pwError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-[12px] text-rose-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{pwError}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => { setPwSection(false); setPw({ current: '', newPw: '', confirm: '' }); setPwError(''); }}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-[12px] font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={pwSaving}
                    onClick={handlePasswordChange}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold cursor-pointer flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-70"
                  >
                    {pwSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    {pwSaving ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT Sidebar ── */}
        <div className="space-y-4">

          {/* Permissions Widget */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <h3 className="font-bold text-gray-900 text-[13px] flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              System Permissions
            </h3>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_PERMISSIONS.map(perm => (
                <span key={perm} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-100 whitespace-nowrap">
                  ✓ {perm}
                </span>
              ))}
            </div>
          </div>

          {/* Connected Server Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <h3 className="font-bold text-gray-900 text-[13px] flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-emerald-600" />
              API Server Status
            </h3>
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800">
                <span className="font-medium">Backend Server</span>
                <span className="font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Port 5005 (Live)
                </span>
              </div>
              <div className="text-[11px] text-gray-500 pt-1">
                Profile picture uploads are stored under <span className="font-mono text-gray-700 bg-gray-100 px-1 py-0.5 rounded">/uploads/profiles/</span> in the backend.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
