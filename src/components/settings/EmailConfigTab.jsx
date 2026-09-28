import React, { useState } from 'react';
import { Mail, Server, Shield, Send, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';

const EmailConfigTab = () => {
  const [provider, setProvider] = useState('smtp');
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState(null); // 'sending' | 'success' | 'error'

  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.sendgrid.net',
    port: '587',
    encryption: 'TLS',
    username: 'apikey',
    password: 'SG.9x82910aklsjd981273.a8129038',
    fromName: 'Chhaya International Recruitment Services',
    fromEmail: 'noreply@chhayainternational.com',
    replyTo: 'support@chhayainternational.com',
  });

  const handleSendTest = (e) => {
    e.preventDefault();
    if (!testEmail) return;
    setTestStatus('sending');
    setTimeout(() => {
      setTestStatus('success');
      setTimeout(() => setTestStatus(null), 5000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Email Provider Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">Outbound Email Gateway</h4>
            <p className="text-[12px] text-gray-500">Configure transactional SMTP delivery for candidate notifications and offer letters</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          {[
            { id: 'smtp', name: 'Custom SMTP Server', badge: 'Standard Relay' },
            { id: 'sendgrid', name: 'SendGrid API', badge: 'Recommended' },
            { id: 'ses', name: 'Amazon SES', badge: 'High Volume' },
            { id: 'google', name: 'Google Workspace', badge: 'OAuth Relay' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                provider === p.id
                  ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">{p.badge}</div>
              <div className="text-[14px] font-bold text-gray-900 mt-1">{p.name}</div>
            </button>
          ))}
        </div>

        {/* SMTP Server Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">SMTP Host / Server Endpoint *</label>
            <div className="relative">
              <Server className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">SMTP Port *</label>
            <input
              type="text"
              value={smtpConfig.port}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Security / Encryption</label>
            <select
              value={smtpConfig.encryption}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, encryption: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option>TLS (Port 587 - Recommended)</option>
              <option>SSL (Port 465)</option>
              <option>STARTTLS</option>
              <option>None (Insecure)</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">SMTP Username / API Key *</label>
            <input
              type="text"
              value={smtpConfig.username}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">SMTP Password / Token *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={smtpConfig.password}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-800 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sender Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 text-[15px] mb-1">Sender Email Identity</h4>
        <p className="text-[12px] text-gray-500 mb-4">Email name and address shown in candidate inboxes</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">From Display Name</label>
            <input
              type="text"
              value={smtpConfig.fromName}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">From Email Address</label>
            <input
              type="email"
              value={smtpConfig.fromEmail}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Reply-To Address</label>
            <input
              type="email"
              value={smtpConfig.replyTo}
              onChange={(e) => setSmtpConfig({ ...smtpConfig, replyTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Test Email Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-bold text-gray-900 text-[15px] mb-1">Send Test Email</h4>
        <p className="text-[12px] text-gray-500 mb-4">Verify that your SMTP relay credentials and DKIM/SPF settings deliver without bouncing</p>

        <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="email"
            required
            placeholder="Enter your email to receive test message (e.g. admin@yourdomain.com)"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={testStatus === 'sending'}
            className="w-full sm:w-auto px-5 py-2 bg-gray-900 text-white rounded-lg text-[13px] font-medium hover:bg-black transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {testStatus === 'sending' ? 'Sending Test...' : 'Send Test Email'}
          </button>
        </form>

        {testStatus === 'success' && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[12px] font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Test email dispatched successfully! Please check your inbox and spam folder.
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailConfigTab;
