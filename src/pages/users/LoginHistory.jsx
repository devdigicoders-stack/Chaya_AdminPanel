import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Search, Download, Laptop, Smartphone, Globe, 
  ShieldCheck, LogOut, Lock, Shield, Check, X, RefreshCw, Sparkles, 
  AlertCircle, AlertTriangle, Eye, User, Clock, CheckCircle2, 
  ArrowUpRight, ShieldAlert, Key, Filter, Laptop2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGetLoginHistory, apiTerminateSession, apiTerminateStaleSessions } from '../../utils/api';

export default function LoginHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    mobile: 0,
    terminated: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deviceFilter, setDeviceFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [terminatingId, setTerminatingId] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Fetch live session history from MongoDB
  const fetchLoginHistory = async () => {
    setLoading(true);
    try {
      const res = await apiGetLoginHistory();
      if (res && res.success) {
        setSessions(res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching login history:', err);
      showToast('Failed to sync live session ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  // Format exact date & time
  const formatExactDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format relative timestamp
  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Recently';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // Terminate a single active staff session
  const handleTerminateSession = async (sessionId, userName) => {
    setTerminatingId(sessionId);
    try {
      const res = await apiTerminateSession(sessionId);
      if (res && res.success) {
        setSessions(prev => prev.map(s => s._id === sessionId ? res.data : s));
        setStats(prev => ({
          ...prev,
          active: Math.max(0, prev.active - 1),
          terminated: prev.terminated + 1
        }));
        showToast(`Session for ${userName} terminated successfully`);
        if (selectedSession?._id === sessionId) {
          setSelectedSession(res.data);
        }
      } else {
        showToast(res.message || 'Could not terminate session');
      }
    } catch (err) {
      console.error('Error terminating session:', err);
      showToast('Failed to terminate session');
    } finally {
      setTerminatingId(null);
    }
  };

  // Bulk terminate stale non-admin sessions
  const handleBulkTerminateStale = async () => {
    try {
      const res = await apiTerminateStaleSessions();
      if (res && res.success) {
        showToast(res.message || 'Terminated background stale sessions');
        fetchLoginHistory();
      } else {
        showToast(res.message || 'Could not terminate stale sessions');
      }
    } catch (err) {
      console.error('Error bulk terminating:', err);
      showToast('Failed to bulk terminate sessions');
    }
  };

  // Filtered session records
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || (
        (s.userName || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (s.ip || '').includes(q) ||
        (s.device || '').toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q)
      );

      let matchStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchStatus = s.status === 'Active Session';
      } else if (statusFilter === 'TERMINATED') {
        matchStatus = s.status === 'Terminated' || s.status === 'Logged Out';
      } else if (statusFilter === 'MOBILE') {
        matchStatus = s.deviceType === 'mobile';
      }

      let matchDevice = true;
      if (deviceFilter !== 'ALL') {
        matchDevice = s.deviceType === deviceFilter;
      }

      return matchSearch && matchStatus && matchDevice;
    });
  }, [sessions, searchTerm, statusFilter, deviceFilter]);

  // Export filtered sessions to CSV
  const handleExportCSV = () => {
    if (!filteredSessions.length) {
      showToast('No session records to export');
      return;
    }

    const headers = ['Session ID', 'Staff Name', 'Email', 'Role', 'Department', 'Device / OS', 'Device Type', 'IP Address', 'Location', 'Login Time', 'Status', 'Duration'];
    const rows = filteredSessions.map(s => [
      `"${s._id}"`,
      `"${(s.userName || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.email || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.role || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.department || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.device || 'N/A').replace(/"/g, '""')}"`,
      `"${s.deviceType || 'desktop'}"`,
      `"${s.ip || 'N/A'}"`,
      `"${(s.location || 'N/A').replace(/"/g, '""')}"`,
      `"${formatExactDate(s.loginTime)}"`,
      `"${s.status || 'Active'}"`,
      `"${s.durationText || 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chhaya_staff_sessions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredSessions.length} session records to CSV`);
  };

  return (
    <div className="flex flex-col flex-1 pb-16">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-[13px] border border-neutral-700 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium mb-1.5">
            <span>13. History & Audit Logs</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-semibold">Staff Login History</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Staff Login History & Sessions
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {stats.active} Concurrent Active
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-flex">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Real-Time Access Control
            </span>
          </div>
          <p className="text-[12.5px] text-gray-500 leading-relaxed mt-1">
            Real-time staff access sessions, authenticated devices, IP telemetry, and remote session termination across recruitment workflow desks.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap self-start sm:self-center">
          <button 
            onClick={handleBulkTerminateStale}
            className="h-9 px-3 rounded-xl text-[12px] font-semibold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" /> 
            <span>Terminate Stale</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-xl text-[12.5px] font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500 shrink-0" /> 
            <span>Export CSV</span>
          </button>

          <button 
            onClick={() => {
              fetchLoginHistory();
              showToast('Refreshed active staff session state');
            }}
            disabled={loading}
            className="h-9 px-3.5 rounded-xl text-[12.5px] font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} /> 
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 4 Live Dynamic KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        
        {/* Card 1: Active Concurrent Sessions */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Laptop className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Now
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-[21px] font-black text-emerald-600 leading-tight">
              {loading ? '...' : stats.active} Active
            </div>
            <div className="text-[11.5px] font-medium text-gray-500 mt-0.5">Active Staff Sessions</div>
          </div>
        </div>

        {/* Card 2: Total Recorded Sessions */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Session Log
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-[21px] font-black text-gray-900 leading-tight">
              {loading ? '...' : (stats.total || sessions.length)}
            </div>
            <div className="text-[11.5px] font-medium text-gray-500 mt-0.5">Total Historical Logins</div>
          </div>
        </div>

        {/* Card 3: Mobile Access */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              Mobile App
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-[21px] font-black text-purple-600 leading-tight">
              {loading ? '...' : stats.mobile} Mobile
            </div>
            <div className="text-[11.5px] font-medium text-gray-500 mt-0.5">Mobile Device Logins</div>
          </div>
        </div>

        {/* Card 4: Terminated / Revoked */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Revoked
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-[21px] font-black text-amber-600 leading-tight">
              {loading ? '...' : stats.terminated} Revoked
            </div>
            <div className="text-[11.5px] font-medium text-gray-500 mt-0.5">Terminated Sessions</div>
          </div>
        </div>

      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3.5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Sessions', count: sessions.length },
            { id: 'ACTIVE', label: 'Active Live', count: stats.active },
            { id: 'MOBILE', label: 'Mobile Devices', count: stats.mobile },
            { id: 'TERMINATED', label: 'Terminated', count: stats.terminated }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === tab.id ? 'bg-blue-700/60 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Device Type Filter */}
        <div className="flex items-center gap-2">
          {/* Device Type Select */}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="h-9 px-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[12px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Devices</option>
            <option value="desktop">Desktop Only</option>
            <option value="mobile">Mobile Only</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search staff, email, role, IP..."
              className="w-full h-9 pl-8.5 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-[12px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Main Sessions Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
        
        {/* Table Header Bar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-[14px]">
              Authentication Sessions Ledger
            </h3>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {filteredSessions.length} Sessions
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Remote Management Enabled</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role & Dept</th>
                <th className="py-3 px-4">Device & Platform</th>
                <th className="py-3 px-4">Network IP & Location</th>
                <th className="py-3 px-4">Session Duration</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-36">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-400">
                    <RefreshCw className="w-7 h-7 mx-auto mb-2 text-blue-500 animate-spin" />
                    <p className="text-[13px] font-medium text-gray-600">Loading Active Sessions...</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Fetching telemetry from MongoDB</p>
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-gray-400">
                    <Laptop className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-[13px] font-semibold text-gray-700">No session records found</p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                      No records matched your search query or filter. Try clearing your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const isActive = session.status === 'Active Session';
                  const isMobile = session.deviceType === 'mobile';

                  return (
                    <tr 
                      key={session._id} 
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSession(session)}
                    >
                      {/* Staff Member */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-gray-900 text-[13px] group-hover:text-blue-600 transition-colors">
                          {session.userName}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
                          {session.email}
                        </div>
                      </td>

                      {/* Role & Dept */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="inline-block text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          {session.role}
                        </span>
                        <div className="text-[11px] text-gray-500 mt-1">
                          {session.department || 'Operations'}
                        </div>
                      </td>

                      {/* Device & Platform */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-800 text-[12px]">
                          {isMobile ? (
                            <Smartphone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                          <span className="truncate max-w-[190px]">{session.device || 'Desktop Browser'}</span>
                        </div>
                        <div className="text-[10.5px] text-gray-400 mt-0.5">
                          {isMobile ? 'Mobile Terminal' : 'Corporate Workstation'}
                        </div>
                      </td>

                      {/* IP & Location */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono text-[11.5px] font-bold text-gray-800">
                          {session.ip}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-[160px]">{session.location}</span>
                        </div>
                      </td>

                      {/* Duration / Login Time */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-gray-800 text-[12px]">
                          {session.durationText || 'Active Session'}
                        </div>
                        <div className="text-[10.5px] text-gray-400 mt-0.5 font-mono">
                          {formatExactDate(session.loginTime)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            Terminated
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 align-top text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="h-8 px-2.5 rounded-lg border border-gray-200 text-gray-700 hover:text-blue-700 hover:bg-blue-50 text-[11.5px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                            title="Inspect Session"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {isActive && (
                            <button
                              onClick={() => handleTerminateSession(session._id, session.userName)}
                              disabled={terminatingId === session._id}
                              className="h-8 px-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11.5px] font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Remote Disconnect Session"
                            >
                              <LogOut className="w-3 h-3 text-rose-600" />
                              <span>Disconnect</span>
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
        <div className="p-3.5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-gray-500">
          <div>
            Showing <span className="font-bold text-gray-800">{filteredSessions.length}</span> of <span className="font-bold text-gray-800">{sessions.length}</span> recorded staff sessions
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              TLS 1.3 / AES-256 Encrypted Telemetry
            </span>
          </div>
        </div>

      </div>

      {/* Session Deep-Dive Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Session Security Inspector</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedSession.userName} ({selectedSession.role})
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-base transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-[12.5px]">
              
              {/* Status Header Bar */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[11px] text-gray-500">Current Session State</span>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedSession.status}</div>
                </div>
                {selectedSession.status === 'Active Session' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-gray-200 text-gray-700">
                    Terminated
                  </span>
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                  <div className="text-[10.5px] text-gray-400 font-medium">Device / Platform</div>
                  <div className="font-bold text-gray-800 mt-0.5">{selectedSession.device}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                  <div className="text-[10.5px] text-gray-400 font-medium">Device Type</div>
                  <div className="font-bold text-gray-800 capitalize mt-0.5">{selectedSession.deviceType}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                  <div className="text-[10.5px] text-gray-400 font-medium">IP Address</div>
                  <div className="font-mono font-bold text-blue-700 mt-0.5">{selectedSession.ip}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                  <div className="text-[10.5px] text-gray-400 font-medium">Location</div>
                  <div className="font-bold text-gray-800 mt-0.5">{selectedSession.location}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                  <div className="text-[10.5px] text-gray-400 font-medium">Session Started</div>
                  <div className="font-mono text-[11.5px] font-semibold text-gray-800 mt-0.5">
                    {formatExactDate(selectedSession.loginTime)}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                  <div className="text-[10.5px] text-gray-400 font-medium">Duration</div>
                  <div className="font-bold text-gray-800 mt-0.5">{selectedSession.durationText}</div>
                </div>
              </div>

              {/* TLS Cipher & Security */}
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80 text-[11.5px]">
                <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Transport Encryption & Cipher</span>
                </div>
                <div className="font-mono text-blue-800 text-[11px]">
                  {selectedSession.tlsCipher || 'TLS_AES_256_GCM_SHA384 (ECDHE-P256)'}
                </div>
              </div>

              {/* User Agent */}
              {selectedSession.userAgent && (
                <div className="p-3 bg-gray-900 text-gray-300 rounded-xl text-[10.5px] font-mono break-all">
                  <span className="text-gray-500 font-bold block mb-1">User Agent Header:</span>
                  {selectedSession.userAgent}
                </div>
              )}

              {/* Termination Info if terminated */}
              {selectedSession.terminatedBy && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-[11.5px]">
                  <span className="font-bold">Terminated By:</span> {selectedSession.terminatedBy}
                  {selectedSession.terminatedAt && (
                    <span className="block text-[10.5px] text-rose-600 mt-0.5">
                      Terminated At: {formatExactDate(selectedSession.terminatedAt)}
                    </span>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-2xl">
              <div>
                {selectedSession.status === 'Active Session' && (
                  <button
                    onClick={() => handleTerminateSession(selectedSession._id, selectedSession.userName)}
                    disabled={terminatingId === selectedSession._id}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Remote Disconnect</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-[12px] font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
