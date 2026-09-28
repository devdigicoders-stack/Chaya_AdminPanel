import React, { useState } from 'react';
import { Globe, Hash, Clock, CheckSquare, Settings2, Sliders } from 'lucide-react';

const GeneralPreferencesTab = () => {
  const [prefs, setPrefs] = useState({
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST +5:30)',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    language: 'English (US)',
    fiscalYearStart: 'April',
    candidatePrefix: 'CAN-2024-',
    candidateStartNum: '1001',
    leadPrefix: 'LEAD-',
    leadStartNum: '5001',
    invoicePrefix: 'INV/24-25/',
    invoiceStartNum: '0001',
    vivaPrefix: 'VIVA-',
    visaPrefix: 'DOC-VSA-',
    requirePreVivaApproval: true,
    requireMedicalBeforeVisa: true,
    autoConvertLeadOnVivaPass: true,
    allowDuplicatePassport: false,
    lockCandidateAfterPlacement: true,
  });

  return (
    <div className="space-y-6">
      {/* Localization Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">Localization & Regional Standards</h4>
            <p className="text-[12px] text-gray-500">Default currency, timezone, calendar formats for all recruitment branches</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Primary Billing Currency</label>
            <select
              value={prefs.currency}
              onChange={(e) => setPrefs({ ...prefs, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option>INR (₹) - Indian Rupee</option>
              <option>AED (د.إ) - UAE Dirham</option>
              <option>SAR (﷼) - Saudi Riyal</option>
              <option>QAR (ر.ق) - Qatari Riyal</option>
              <option>KWD (د.ك) - Kuwaiti Dinar</option>
              <option>USD ($) - US Dollar</option>
              <option>EUR (€) - Euro</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">System Timezone</label>
            <select
              value={prefs.timezone}
              onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option>Asia/Kolkata (IST +5:30) - Mumbai, Delhi</option>
              <option>Asia/Dubai (GST +4:00) - Dubai, Abu Dhabi</option>
              <option>Asia/Riyadh (AST +3:00) - Riyadh, Jeddah</option>
              <option>Asia/Qatar (AST +3:00) - Doha</option>
              <option>Europe/London (GMT/BST)</option>
              <option>UTC (+0:00) - Coordinated Universal Time</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Date Display Format</label>
            <select
              value={prefs.dateFormat}
              onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option>DD/MM/YYYY (e.g. 19/10/2024)</option>
              <option>DD-MMM-YYYY (e.g. 19-Oct-2024)</option>
              <option>MM/DD/YYYY (e.g. 10/19/2024)</option>
              <option>YYYY-MM-DD (e.g. 2024-10-19)</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Time Display Format</label>
            <select
              value={prefs.timeFormat}
              onChange={(e) => setPrefs({ ...prefs, timeFormat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="12h">12-Hour (02:30 PM)</option>
              <option value="24h">24-Hour (14:30)</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Default System Language</label>
            <select
              value={prefs.language}
              onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option>English (International)</option>
              <option>Hindi (हिंदी)</option>
              <option>Arabic (العربية)</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Financial Year Start</label>
            <select
              value={prefs.fiscalYearStart}
              onChange={(e) => setPrefs({ ...prefs, fiscalYearStart: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option>April (Indian Financial Year)</option>
              <option>January (Calendar Year)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Auto Numbering Schemes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">Document & Record Numbering Sequences</h4>
            <p className="text-[12px] text-gray-500">Configure auto-incrementing serial prefixes for candidates, leads, and invoices</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-gray-900">Candidate Registration Number</label>
              <span className="text-[11px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-bold">
                {prefs.candidatePrefix}{prefs.candidateStartNum}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Prefix"
                value={prefs.candidatePrefix}
                onChange={(e) => setPrefs({ ...prefs, candidatePrefix: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white font-mono"
              />
              <input
                type="text"
                placeholder="Start Num"
                value={prefs.candidateStartNum}
                onChange={(e) => setPrefs({ ...prefs, candidateStartNum: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-500">Generated on candidate profile creation</p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-gray-900">Lead Sourcing ID</label>
              <span className="text-[11px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-bold">
                {prefs.leadPrefix}{prefs.leadStartNum}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Prefix"
                value={prefs.leadPrefix}
                onChange={(e) => setPrefs({ ...prefs, leadPrefix: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white font-mono"
              />
              <input
                type="text"
                placeholder="Start Num"
                value={prefs.leadStartNum}
                onChange={(e) => setPrefs({ ...prefs, leadStartNum: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-500">Generated for raw incoming candidate leads</p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-gray-900">Tax Invoice Number</label>
              <span className="text-[11px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">
                {prefs.invoicePrefix}{prefs.invoiceStartNum}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Prefix"
                value={prefs.invoicePrefix}
                onChange={(e) => setPrefs({ ...prefs, invoicePrefix: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white font-mono"
              />
              <input
                type="text"
                placeholder="Start Num"
                value={prefs.invoiceStartNum}
                onChange={(e) => setPrefs({ ...prefs, invoiceStartNum: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white font-mono"
              />
            </div>
            <p className="text-[11px] text-gray-500">Sequential GST billing format</p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-gray-900">Visa Application Docket</label>
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-bold">
                {prefs.visaPrefix}2024-089
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Prefix"
                value={prefs.visaPrefix}
                onChange={(e) => setPrefs({ ...prefs, visaPrefix: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] bg-white font-mono col-span-2"
              />
            </div>
            <p className="text-[11px] text-gray-500">Assigned when candidate reaches Visa stage</p>
          </div>
        </div>
      </div>

      {/* Mandatory Workflow Gates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">Recruitment Workflow Enforcement</h4>
            <p className="text-[12px] text-gray-500">Automated validation rules preventing premature candidate advancement</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              key: 'requireMedicalBeforeVisa',
              label: 'Require GAMCA / Approved Medical clearance before Visa Application',
              desc: 'Prevents visa stamping submission until candidate medical status is marked "FIT" by medical center.',
            },
            {
              key: 'requirePreVivaApproval',
              label: 'Mandatory Pre-Viva evaluation pass before Client Viva Interview',
              desc: 'Candidates must achieve minimum 70% in trade pre-viva before client line up.',
            },
            {
              key: 'autoConvertLeadOnVivaPass',
              label: 'Auto-convert Lead into Candidate upon Client Selection',
              desc: 'Automatically promotes approved leads to formal Candidate directory without manual re-entry.',
            },
            {
              key: 'lockCandidateAfterPlacement',
              label: 'Lock candidate file upon Departure & Joining Confirmation',
              desc: 'Restricts profile modifications once candidate has successfully deployed overseas.',
            },
            {
              key: 'allowDuplicatePassport',
              label: 'Strict Duplicate Passport Prevention',
              desc: 'Rejects new leads if candidate passport number matches an existing record in system.',
            },
          ].map(({ key, label, desc }) => (
            <label
              key={key}
              className="flex items-start justify-between p-3.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50/70 transition-colors"
            >
              <div className="pr-4">
                <div className="text-[13px] font-semibold text-gray-900">{label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{desc}</div>
              </div>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                className="h-4 w-4 mt-1 rounded text-blue-600 focus:ring-blue-500 border-gray-300 shrink-0"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeneralPreferencesTab;
