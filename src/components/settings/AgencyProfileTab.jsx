import React, { useState } from 'react';
import { Building2, Upload, FileText, CheckCircle2, Globe, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

const AgencyProfileTab = () => {
  const [profile, setProfile] = useState({
    agencyName: 'Chhaya International Recruitment Services',
    legalEntity: 'Chhaya Overseas Placement Pvt. Ltd.',
    licenseNo: 'RA-0928/MUM/PER/1000+/5/9820/2021',
    licenseExpiry: '2027-12-31',
    poeOffice: 'Protector of Emigrants, Mumbai',
    cinNumber: 'U74999MH2016PTC284901',
    gstin: '27AABCC8920K1ZX',
    panNumber: 'AABCC8920K',
    website: 'https://chhayainternational.com',
    primaryEmail: 'info@chhayainternational.com',
    complianceEmail: 'compliance@chhayainternational.com',
    primaryPhone: '+91 22 2847 9900',
    tollFreePhone: '1800 220 990',
    addressLine1: '402, Trade Square, Sakinaka Junction',
    addressLine2: 'Andheri-Kurla Road, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400072',
    country: 'India',
    signatoryName: 'Rajesh Kumar Chhaya',
    signatoryDesignation: 'Managing Director & Authorized Representative',
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Card: License Status */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Building2 className="w-7 h-7 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-bold tracking-tight">{profile.agencyName}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3" /> MEA Approved
                </span>
              </div>
              <p className="text-[12px] text-blue-200/80 mt-0.5">
                License No: <span className="font-mono text-white font-medium">{profile.licenseNo}</span> • Valid till 31 Dec 2027
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-[12px] font-medium text-blue-100 border border-white/10">
              1000+ Capacity
            </span>
          </div>
        </div>
      </div>

      {/* Agency Identity & Government Registration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">Government Registration & RA License</h4>
            <p className="text-[12px] text-gray-500">Ministry of External Affairs (MEA) and corporate legal identifiers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Trade Name *</label>
            <input
              type="text"
              value={profile.agencyName}
              onChange={(e) => setProfile({ ...profile, agencyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Registered Legal Entity *</label>
            <input
              type="text"
              value={profile.legalEntity}
              onChange={(e) => setProfile({ ...profile, legalEntity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">MEA Recruiting Agent (RA) License *</label>
            <input
              type="text"
              value={profile.licenseNo}
              onChange={(e) => setProfile({ ...profile, licenseNo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">PoE Jurisdiction</label>
            <input
              type="text"
              value={profile.poeOffice}
              onChange={(e) => setProfile({ ...profile, poeOffice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">License Valid Upto</label>
            <input
              type="date"
              value={profile.licenseExpiry}
              onChange={(e) => setProfile({ ...profile, licenseExpiry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Corporate Identity No (CIN)</label>
            <input
              type="text"
              value={profile.cinNumber}
              onChange={(e) => setProfile({ ...profile, cinNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">GSTIN Number</label>
            <input
              type="text"
              value={profile.gstin}
              onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Income Tax PAN</label>
            <input
              type="text"
              value={profile.panNumber}
              onChange={(e) => setProfile({ ...profile, panNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Official Website</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Official Contact & Headquarters Address */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">Headquarters & Official Communications</h4>
            <p className="text-[12px] text-gray-500">Contact addresses shown on candidate invoices, agreements, and notices</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Primary Official Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={profile.primaryEmail}
                onChange={(e) => setProfile({ ...profile, primaryEmail: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Compliance & Grievance Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={profile.complianceEmail}
                onChange={(e) => setProfile({ ...profile, complianceEmail: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Direct Line Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profile.primaryPhone}
                onChange={(e) => setProfile({ ...profile, primaryPhone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Toll-Free Support</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profile.tollFreePhone}
                onChange={(e) => setProfile({ ...profile, tollFreePhone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Authorized Signatory Name</label>
            <input
              type="text"
              value={profile.signatoryName}
              onChange={(e) => setProfile({ ...profile, signatoryName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Address Lines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Address Line 1</label>
            <input
              type="text"
              value={profile.addressLine1}
              onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Address Line 2 (Area/Locality)</label>
            <input
              type="text"
              value={profile.addressLine2}
              onChange={(e) => setProfile({ ...profile, addressLine2: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">City</label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">State</label>
            <input
              type="text"
              value={profile.state}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Postal / Pin Code</label>
            <input
              type="text"
              value={profile.pincode}
              onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Country</label>
            <input
              type="text"
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyProfileTab;
