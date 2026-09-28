import React, { useState } from 'react';
import { Shield, Lock, Smartphone, Globe, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const SecurityTab = () => {
  const [twoFactorPolicy, setTwoFactorPolicy] = useState('all');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [maxFailedAttempts, setMaxFailedAttempts] = useState('5');
  const [lockoutDuration, setLockoutDuration] = useState('30');
  const [passwordExpiry, setPasswordExpiry] = useState('90');
  const [minPasswordLength, setMinPasswordLength] = useState('8');
  const [requireSpecialChar, setRequireSpecialChar] = useState(true);
  const [enableIpWhitelist, setEnableIpWhitelist] = useState(false);
  const [allowConcurrent, setAllowConcurrent] = useState(false);
  
  const [whitelistedIps, setWhitelistedIps] = useState([
    { id: 1, ip: '103.21.58.12', label: 'Mumbai HQ Primary Static IP' },
    { id: 2, ip: '157.34.12.90', label: 'Delhi NCR Office Fiber' },
  ]);
  const [newIp, setNewIp] = useState('');
  const [newIpLabel, setNewIpLabel] = useState('');

  const handleAddIp = (e) => {
    e.preventDefault();
    if (!newIp) return;
    setWhitelistedIps([...whitelistedIps, { id: Date.now(), ip: newIp, label: newIpLabel || 'Office Static IP' }]);
    setNewIp('');
    setNewIpLabel('');
  };

  const handleRemoveIp = (id) => {
    setWhitelistedIps(whitelistedIps.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 2FA Policy Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">Two-Factor Authentication (2FA / OTP)</h4>
            <p className="text-[12px] text-gray-500">Enforce secondary verification via Authenticator App (TOTP) or SMS OTP</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'all', title: 'Enforce for All Users', desc: 'Mandatory for all 48 recruiters, managers & administrators', recommended: true },
            { id: 'admin_only', title: 'Admins & Finance Only', desc: 'Required only for accounts with financial & user privileges', recommended: false },
            { id: 'optional', title: 'Optional (User Choice)', desc: 'Users can opt-in to 2FA from their individual profile settings', recommended: false },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                twoFactorPolicy === opt.id
                  ? 'border-purple-600 bg-purple-50/30 ring-2 ring-purple-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-[13px]">{opt.title}</span>
                  <input
                    type="radio"
                    name="twoFactorPolicy"
                    checked={twoFactorPolicy === opt.id}
                    onChange={() => setTwoFactorPolicy(opt.id)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{opt.desc}</p>
              </div>
              {opt.recommended && (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full w-fit mt-3">
                  Recommended
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Session Timeout & Lockout */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">Session Timeout & Account Lockout</h4>
            <p className="text-[12px] text-gray-500">Prevent unauthorized access on unattended recruiter workstations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Inactivity Auto-Logout</label>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes (Recommended)</option>
              <option value="60">1 Hour</option>
              <option value="120">2 Hours</option>
              <option value="480">8 Hours (Full Shift)</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Max Failed Passwords</label>
            <select
              value={maxFailedAttempts}
              onChange={(e) => setMaxFailedAttempts(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="3">3 Attempts (Strict)</option>
              <option value="5">5 Attempts (Standard)</option>
              <option value="10">10 Attempts</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Lockout Duration</label>
            <select
              value={lockoutDuration}
              onChange={(e) => setLockoutDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="60">1 Hour</option>
              <option value="admin">Requires Admin Unlock</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Password Expiration</label>
            <select
              value={passwordExpiry}
              onChange={(e) => setPasswordExpiry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="30">Every 30 Days</option>
              <option value="60">Every 60 Days</option>
              <option value="90">Every 90 Days</option>
              <option value="never">Never Expire</option>
            </select>
          </div>
        </div>

        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50/70">
          <div>
            <div className="font-semibold text-gray-900 text-[13px]">Allow Concurrent User Logins</div>
            <div className="text-[11px] text-gray-500">When disabled, logging in from a new device terminates existing active browser sessions.</div>
          </div>
          <input
            type="checkbox"
            checked={allowConcurrent}
            onChange={(e) => setAllowConcurrent(e.target.checked)}
            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
          />
        </label>
      </div>

      {/* IP Whitelisting */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-[15px]">IP Whitelist Restrictions</h4>
              <p className="text-[12px] text-gray-500">Restrict admin panel access exclusively to trusted corporate office static IPs</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[12px] font-medium text-gray-600">Enforce Whitelist</span>
            <input
              type="checkbox"
              checked={enableIpWhitelist}
              onChange={(e) => setEnableIpWhitelist(e.target.checked)}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            />
          </label>
        </div>

        {/* IP List */}
        <div className="space-y-2 mb-4">
          {whitelistedIps.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 text-[13px]">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-gray-900 bg-white px-2.5 py-1 rounded border border-gray-200">
                  {item.ip}
                </span>
                <span className="text-gray-600 font-medium">{item.label}</span>
              </div>
              <button
                onClick={() => handleRemoveIp(item.id)}
                className="text-gray-400 hover:text-red-600 p-1 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add IP Form */}
        <form onSubmit={handleAddIp} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            placeholder="Static IP (e.g. 103.45.89.20)"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Label (e.g. Kochi Branch Office)"
            value={newIpLabel}
            onChange={(e) => setNewIpLabel(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-[13px] font-medium hover:bg-black transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add IP
          </button>
        </form>
      </div>
    </div>
  );
};

export default SecurityTab;
