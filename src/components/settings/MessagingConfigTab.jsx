import React, { useState } from 'react';
import { MessageSquare, Phone, CheckCircle2, ShieldCheck, ExternalLink, Key, Eye, EyeOff } from 'lucide-react';

const MessagingConfigTab = () => {
  const [waConnected, setWaConnected] = useState(true);
  const [smsGateway, setSmsGateway] = useState('msg91');
  const [showToken, setShowToken] = useState(false);

  const [waConfig, setWaConfig] = useState({
    businessAccountId: 'WABA_849201948201',
    phoneNumberId: 'PHONE_98201948201',
    accessToken: 'EAAOx82910aklsjd981273EAABa8129038',
    webhookUrl: 'https://api.recruitcrm.com/webhooks/whatsapp',
  });

  const [smsConfig, setSmsConfig] = useState({
    authKey: '382910AKSJ98127398127',
    senderId: 'CHHAYA',
    dltEntityId: '1101582910000034912',
  });

  return (
    <div className="space-y-6">
      {/* WhatsApp Business Cloud API */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-[15px]">WhatsApp Business Cloud API (Meta)</h4>
              <p className="text-[12px] text-gray-500">Official Meta WhatsApp API for sending automated interview alerts and visa statuses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">WhatsApp Business Account ID (WABA ID) *</label>
            <input
              type="text"
              value={waConfig.businessAccountId}
              onChange={(e) => setWaConfig({ ...waConfig, businessAccountId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Phone Number ID *</label>
            <input
              type="text"
              value={waConfig.phoneNumberId}
              onChange={(e) => setWaConfig({ ...waConfig, phoneNumberId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Permanent System User Access Token *</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={waConfig.accessToken}
                onChange={(e) => setWaConfig({ ...waConfig, accessToken: e.target.value })}
                className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-800 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Callback Webhook Endpoint</label>
            <input
              type="text"
              readOnly
              value={waConfig.webhookUrl}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-500 bg-gray-50"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">Copy this URL to Meta Developer Portal under WhatsApp &gt; Configuration &gt; Webhooks</span>
          </div>
        </div>

        {/* WhatsApp Message Template Previews */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <h5 className="text-[13px] font-bold text-gray-800 mb-3">Approved Pre-configured WhatsApp Templates</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: 'Interview Scheduled', text: 'Dear {{1}}, your client viva interview for {{2}} position is confirmed on {{3}} at {{4}}.', approved: true },
              { title: 'Medical Slip Issued', text: 'Dear {{1}}, please report to {{2}} for GAMCA medical examination with original passport.', approved: true },
              { title: 'Visa Stamped & Ready', text: 'Congratulations {{1}}! Your employment visa for {{2}} has been issued. Flight details will follow.', approved: true },
            ].map((t) => (
              <div key={t.title} className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-bold text-emerald-900">{t.title}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Active</span>
                </div>
                <p className="text-[11px] text-gray-600 font-sans leading-relaxed">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SMS Gateway & Telecom DLT Compliance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">SMS Gateway & Telecom DLT Configuration</h4>
            <p className="text-[12px] text-gray-500">TRAI DLT-approved header and SMS route for candidate OTPs and flash alerts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">SMS Service Provider</label>
            <select
              value={smsGateway}
              onChange={(e) => setSmsGateway(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="msg91">MSG91 Enterprise</option>
              <option value="twilio">Twilio Programmable SMS</option>
              <option value="fast2sms">Fast2SMS (Quick Route)</option>
              <option value="gupshup">Gupshup Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">DLT Approved Sender ID (6 Chars)</label>
            <input
              type="text"
              maxLength={6}
              value={smsConfig.senderId}
              onChange={(e) => setSmsConfig({ ...smsConfig, senderId: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono uppercase font-bold text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">DLT Principal Entity ID (PE ID)</label>
            <input
              type="text"
              value={smsConfig.dltEntityId}
              onChange={(e) => setSmsConfig({ ...smsConfig, dltEntityId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">API Authentication Secret / Token</label>
            <input
              type="password"
              value={smsConfig.authKey}
              onChange={(e) => setSmsConfig({ ...smsConfig, authKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingConfigTab;
