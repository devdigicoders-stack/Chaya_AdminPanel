import React from 'react';
import { ChevronRight, Users, Calendar, FileText, CheckCircle2, Building2, BarChart2, Plane, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const quickStats = [
  { label: 'Viva Scheduled', value: 42, change: '+12%', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Viva Completed', value: 146, change: '+18%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Placed', value: 98, change: '+24%', color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Joined', value: 62, change: '+16%', color: 'text-purple-600', bg: 'bg-purple-50' },
];

const quickLinks = [
  { title: 'All Candidates', desc: 'View all candidates in placement pipeline', icon: Users, path: '/placement/all', color: 'bg-blue-600' },
  { title: 'Schedule Viva', desc: 'Schedule viva for selected candidates', icon: Calendar, path: '/placement/schedule', color: 'bg-purple-600' },
  { title: 'Viva Results', desc: 'Record and manage viva results', icon: CheckCircle2, path: '/placement/results', color: 'bg-emerald-600' },
  { title: 'Offer Letters', desc: 'Generate and send offer letters', icon: FileText, path: '/placement/offer', color: 'bg-orange-600' },
  { title: 'Joining Updates', desc: 'Track joining and flight status', icon: Plane, path: '/placement/joining', color: 'bg-teal-600' },
  { title: 'Placement Reports', desc: 'Analytics and placement statistics', icon: BarChart2, path: '/placement/reports', color: 'bg-indigo-600' },
  { title: 'Company Management', desc: 'Manage employer companies and openings', icon: Building2, path: '/placement/companies', color: 'bg-pink-600' },
];

const recentActivity = [
  { text: 'Rahul Sharma\'s viva scheduled with Al Falah Group', time: '2 hours ago', type: 'schedule' },
  { text: 'Mohammad Ali selected — Offer Letter generated', time: '5 hours ago', type: 'offer' },
  { text: 'Ramesh Yadav joining confirmed for Gulf Contracting', time: 'Yesterday', type: 'joining' },
  { text: 'Arif Khan viva result: On Hold (Qatar Build)', time: 'Yesterday', type: 'result' },
  { text: 'New company added: Saudi Projects LLC', time: '2 days ago', type: 'company' },
];

const activityColors = {
  schedule: 'bg-blue-100 text-blue-600',
  offer: 'bg-emerald-100 text-emerald-600',
  joining: 'bg-purple-100 text-purple-600',
  result: 'bg-orange-100 text-orange-600',
  company: 'bg-teal-100 text-teal-600',
};

export default function PlacementManagement() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-1 pb-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span className="text-gray-900 font-medium">Viva & Placement</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">Management</span>
        </div>
        <h1 className="text-[24px] font-bold text-gray-900 leading-tight">Placement Management Hub</h1>
        <p className="text-[14px] text-gray-500 mt-1">Oversee the complete viva and placement process from one central location.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {quickStats.map(({ label, value, change, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className={`text-[26px] font-bold ${color} mb-1`}>{value}</div>
            <div className="text-[13px] font-medium text-gray-700">{label}</div>
            <div className={`inline-flex items-center gap-1 mt-2 text-[11px] font-medium px-2 py-0.5 rounded-full ${bg} ${color}`}>
              {change} this month
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Quick Links */}
        <div className="xl:col-span-2">
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map(({ title, desc, icon: Icon, path, color }) => (
              <button
                key={title}
                onClick={() => navigate(path)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:border-blue-100 transition-all text-left group"
              >
                <div className={`w-11 h-11 rounded-xl ${color} text-white flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</div>
                  <div className="text-[12px] text-gray-500 truncate">{desc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${activityColors[item.type]}`}>
                  {item.type.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-gray-800 leading-snug">{item.text}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{item.time}</div>
                </div>
              </div>
            ))}
            <button className="w-full text-center text-[12px] font-medium text-blue-600 hover:underline pt-2">View all activity →</button>
          </div>

          {/* Placement Pipeline Summary */}
          <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4">Pipeline Overview</h3>
            {[
              { stage: 'Viva Scheduled', count: 42, color: 'bg-blue-500' },
              { stage: 'Viva Completed', count: 28, color: 'bg-emerald-500' },
              { stage: 'Offer Sent', count: 18, color: 'bg-orange-500' },
              { stage: 'Offer Accepted', count: 12, color: 'bg-purple-500' },
              { stage: 'Joined', count: 8, color: 'bg-teal-500' },
            ].map(({ stage, count, color }) => (
              <div key={stage} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className="text-[12px] text-gray-600 w-[130px] shrink-0">{stage}</div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(count / 42) * 100}%` }} className={`h-full ${color} rounded-full`} />
                </div>
                <div className="text-[12px] font-bold text-gray-700 w-6 text-right">{count}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
