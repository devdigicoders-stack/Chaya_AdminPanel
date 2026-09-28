import React, { useState } from 'react';
import {
  ChevronRight,
  Save,
  Building2,
  MapPin,
  Globe,
  Mail,
  MessageSquare,
  Shield,
  Bell,
  Database,
  CheckCircle2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

import AgencyProfileTab from '../../components/settings/AgencyProfileTab';
import BranchesTab from '../../components/settings/BranchesTab';
import GeneralPreferencesTab from '../../components/settings/GeneralPreferencesTab';
import EmailConfigTab from '../../components/settings/EmailConfigTab';
import MessagingConfigTab from '../../components/settings/MessagingConfigTab';
import SecurityTab from '../../components/settings/SecurityTab';
import NotificationsTab from '../../components/settings/NotificationsTab';
import BackupTab from '../../components/settings/BackupTab';

const navItems = [
  {
    category: 'ORGANIZATION',
    items: [
      { id: 'profile', label: 'Agency Profile & License', icon: Building2, desc: 'MEA registration, tax IDs, HQ address' },
      { id: 'branches', label: 'Branches & Regional Hubs', icon: MapPin, desc: 'Multi-city offices and GCC liaison' },
    ],
  },
  {
    category: 'CONFIGURATION',
    items: [
      { id: 'general', label: 'General & Localization', icon: Globe, desc: 'Currencies, serial numbering, gates' },
      { id: 'notifications', label: 'Notification Triggers', icon: Bell, desc: 'Multichannel event dispatch matrix' },
    ],
  },
  {
    category: 'COMMUNICATIONS',
    items: [
      { id: 'email', label: 'Email & SMTP Gateway', icon: Mail, desc: 'SendGrid, Amazon SES, sender email' },
      { id: 'messaging', label: 'WhatsApp & SMS Gateway', icon: MessageSquare, desc: 'Meta Cloud API, DLT SMS headers' },
    ],
  },
  {
    category: 'SECURITY & STORAGE',
    items: [
      { id: 'security', label: 'Security & Access Policy', icon: Shield, desc: '2FA rules, session timeout, IP filter' },
      { id: 'backup', label: 'Database Backup & Recovery', icon: Database, desc: 'Automated S3 snapshots, SQL dumps' },
    ],
  },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saveToast, setSaveToast] = useState(false);

  const handleGlobalSave = (e) => {
    e.preventDefault();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 4000);
  };

  return (
    <div className="flex flex-col flex-1 pb-12">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Enterprise System Governance
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              MEA Compliant Architecture
            </span>
          </div>
          <h1 className="text-[21px] sm:text-[26px] lg:text-[28px] font-extrabold text-gray-900 tracking-tight leading-tight">
            Settings & System Configurations
          </h1>
          <p className="text-[13px] sm:text-[14px] text-gray-500 mt-1 max-w-3xl leading-relaxed">
            Enterprise configurations for MEA compliance, multi-branch operations, communication gateways, and security.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            className="h-10 px-3 sm:px-4 rounded-xl text-[12.5px] sm:text-[13px] font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-gray-500 shrink-0" /> 
            <span className="truncate">Discard</span>
          </button>
          <button
            onClick={handleGlobalSave}
            className="h-10 px-3 sm:px-4 rounded-xl text-[12.5px] sm:text-[13px] font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Save className="w-4 h-4 shrink-0" /> 
            <span className="truncate">Save Settings</span>
          </button>
        </div>
      </div>

      {/* Floating Save Toast */}
      {saveToast && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[14px] font-bold">Configurations Saved Successfully!</div>
              <div className="text-[12px] text-emerald-100">All updated agency settings and gateway tokens are now active.</div>
            </div>
          </div>
          <button onClick={() => setSaveToast(false)} className="text-white/80 hover:text-white text-sm font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Health Strip */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <div className="truncate">
            <span className="text-gray-400 text-[10px] block font-semibold uppercase">MEA License</span>
            <span className="font-bold text-gray-800">RA-0928/MUM (1000+)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <div className="truncate">
            <span className="text-gray-400 text-[10px] block font-semibold uppercase">WhatsApp API</span>
            <span className="font-bold text-gray-800">Cloud API Connected</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <div className="truncate">
            <span className="text-gray-400 text-[10px] block font-semibold uppercase">Outbound SMTP</span>
            <span className="font-bold text-gray-800">SendGrid TLS Active</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
          <div className="truncate">
            <span className="text-gray-400 text-[10px] block font-semibold uppercase">Cloud Backup</span>
            <span className="font-bold text-gray-800">S3 Synced Today 02:00 AM</span>
          </div>
        </div>
      </div>

      {/* Main Settings Body: Left Navigation + Right Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Vertical Navigation */}
        <div className="w-full lg:w-[280px] bg-white rounded-xl shadow-sm border border-gray-100 p-3 shrink-0">
          <div className="space-y-5">
            {navItems.map((group) => (
              <div key={group.category}>
                <div className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1.5">
                  {group.category}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] leading-tight truncate">{item.label}</div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5 font-normal">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Active Content Panel */}
        <div className="flex-1 min-w-0 w-full">
          {activeTab === 'profile' && <AgencyProfileTab />}
          {activeTab === 'branches' && <BranchesTab />}
          {activeTab === 'general' && <GeneralPreferencesTab />}
          {activeTab === 'email' && <EmailConfigTab />}
          {activeTab === 'messaging' && <MessagingConfigTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'backup' && <BackupTab />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
