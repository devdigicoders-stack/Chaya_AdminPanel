import React, { useState } from 'react';
import { Bell, Mail, Phone, MessageSquare, Check, Sparkles } from 'lucide-react';

const initialEvents = [
  { id: 'lead_new', name: 'New Candidate Lead Captured', inApp: true, email: true, sms: false, whatsapp: true },
  { id: 'interview_sched', name: 'Client Viva Interview Scheduled', inApp: true, email: true, sms: true, whatsapp: true },
  { id: 'interview_pass', name: 'Client Viva Selection / Passed', inApp: true, email: true, sms: true, whatsapp: true },
  { id: 'medical_fit', name: 'GAMCA Medical "FIT" Clearance Received', inApp: true, email: true, sms: false, whatsapp: true },
  { id: 'visa_applied', name: 'Visa Docket Lodged at Consulate', inApp: true, email: true, sms: false, whatsapp: true },
  { id: 'visa_issued', name: 'Employment Visa Stamped & Approved', inApp: true, email: true, sms: true, whatsapp: true },
  { id: 'offer_dispatch', name: 'Client Offer Letter Dispatched', inApp: true, email: true, sms: false, whatsapp: true },
  { id: 'invoice_gen', name: 'Client Billing Invoice Generated', inApp: true, email: true, sms: false, whatsapp: false },
  { id: 'payment_rcv', name: 'Payment Collected & Receipt Issued', inApp: true, email: true, sms: true, whatsapp: true },
  { id: 'ticket_depart', name: 'Flight Ticket Confirmed & Candidate Departure', inApp: true, email: true, sms: true, whatsapp: true },
];

const NotificationsTab = () => {
  const [events, setEvents] = useState(initialEvents);
  const [digestTime, setDigestTime] = useState('20:00');
  const [enableDailyDigest, setEnableDailyDigest] = useState(true);

  const toggleChannel = (index, channel) => {
    setEvents(
      events.map((e, i) => (i === index ? { ...e, [channel]: !e[channel] } : e))
    );
  };

  const toggleAllChannel = (channel, state) => {
    setEvents(events.map((e) => ({ ...e, [channel]: state })));
  };

  return (
    <div className="space-y-6">
      {/* Event Matrix Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-[15px]">Automated Trigger Matrix</h4>
              <p className="text-[12px] text-gray-500">Configure multichannel dispatch channels for lifecycle recruitment stages</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-gray-500">
            <span>Quick Enable:</span>
            <button onClick={() => toggleAllChannel('whatsapp', true)} className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100">All WA</button>
            <button onClick={() => toggleAllChannel('email', true)} className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium hover:bg-blue-100">All Email</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-5">Recruitment Lifecycle Event</th>
                <th className="py-3 px-4 text-center">In-App Alert</th>
                <th className="py-3 px-4 text-center">Candidate Email</th>
                <th className="py-3 px-4 text-center">SMS Alert</th>
                <th className="py-3 px-4 text-center">WhatsApp Msg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {events.map((ev, idx) => (
                <tr key={ev.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-gray-800">
                    {ev.name}
                  </td>
                  {['inApp', 'email', 'sms', 'whatsapp'].map((ch) => (
                    <td key={ch} className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleChannel(idx, ch)}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                          ev[ch]
                            ? ch === 'whatsapp'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Digest & Management Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-gray-900 text-[15px]">Executive Daily Performance Digest</h4>
            <p className="text-[12px] text-gray-500">Automated summary of daily candidate footfall, medical results, visa approvals, and revenue</p>
          </div>
          <input
            type="checkbox"
            checked={enableDailyDigest}
            onChange={(e) => setEnableDailyDigest(e.target.checked)}
            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Dispatch Schedule Time</label>
            <input
              type="time"
              value={digestTime}
              onChange={(e) => setDigestTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-800 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Recipient Management Group</label>
            <input
              type="text"
              readOnly
              value="Directors, Branch Heads & HR Leads (8 Recipients)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
