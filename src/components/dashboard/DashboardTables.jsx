import React from 'react';
import { Eye, ArrowRight, User, Phone, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const leadsData = [
  { id: 1, name: 'Rahul Sharma', mobile: '+91 98765 43210', source: 'WhatsApp', date: '12 Oct 2024', status: 'New', assignee: 'Amit Verma', avatarBg: '#3B82F6' },
  { id: 2, name: 'Mohammed Ali', mobile: '+91 87654 32109', source: 'Facebook', date: '12 Oct 2024', status: 'Contacted', assignee: 'Pooja Singh', avatarBg: '#8B5CF6' },
  { id: 3, name: 'Sandeep Kumar', mobile: '+91 76543 21098', source: 'Excel', date: '11 Oct 2024', status: 'Follow-up', assignee: 'Rajesh Yadav', avatarBg: '#10B981' },
  { id: 4, name: 'Arif Khan', mobile: '+91 99887 76655', source: 'WhatsApp', date: '11 Oct 2024', status: 'Interested', assignee: 'Neha Gupta', avatarBg: '#F59E0B' },
  { id: 5, name: 'Rajesh Patel', mobile: '+91 88776 65544', source: 'Facebook', date: '11 Oct 2024', status: 'New', assignee: 'Amit Verma', avatarBg: '#EF4444' },
];

const activitiesData = [
  { 
    id: 1, 
    user: 'Pooja Singh', 
    role: 'Calling Staff',
    avatarBg: '#FCE7F3', 
    avatarText: '#DB2777', 
    action: 'Updated calling status', 
    candidate: 'Rahul Sharma', 
    dept: 'Calling',
    deptBg: 'bg-blue-50 text-blue-700 border-blue-200',
    time: '12 Oct, 11:20 AM' 
  },
  { 
    id: 2, 
    user: 'Panel A', 
    role: 'Interview Panel',
    avatarBg: '#FEF3C7', 
    avatarText: '#D97706', 
    action: 'Marked interview passed', 
    candidate: 'Arif Khan', 
    dept: 'Interview',
    deptBg: 'bg-purple-50 text-purple-700 border-purple-200',
    time: '12 Oct, 10:45 AM' 
  },
  { 
    id: 3, 
    user: 'Medical Dept', 
    role: 'Health Center',
    avatarBg: '#D1FAE5', 
    avatarText: '#059669', 
    action: 'Uploaded FIT report', 
    candidate: 'Sandeep Kumar', 
    dept: 'Medical',
    deptBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    time: '12 Oct, 09:30 AM' 
  },
  { 
    id: 4, 
    user: 'Farooq Al-M', 
    role: 'Visa Manager',
    avatarBg: '#E0E7FF', 
    avatarText: '#4F46E5', 
    action: 'Assigned Viva Date', 
    candidate: 'Mohd. Ali', 
    dept: 'Visa',
    deptBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    time: '11 Oct, 06:15 PM' 
  },
  { 
    id: 5, 
    user: 'Neha Gupta', 
    role: 'Accounts',
    avatarBg: '#F3E8FF', 
    avatarText: '#9333EA', 
    action: 'Advance payment collected', 
    candidate: 'Rajesh Patel', 
    dept: 'Accounts',
    deptBg: 'bg-amber-50 text-amber-700 border-amber-200',
    time: '11 Oct, 04:20 PM' 
  },
];

const StatusBadge = ({ status }) => {
  const styles = {
    'New': 'bg-blue-50 text-blue-600 border border-blue-200',
    'Contacted': 'bg-amber-50 text-amber-600 border border-amber-200',
    'Follow-up': 'bg-purple-50 text-purple-600 border border-purple-200',
    'Interested': 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

export const DashboardTables = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      
      {/* 1. Recent Leads Card */}
      <div className="bg-white rounded-[20px] shadow-xs border border-gray-100 flex flex-col justify-between overflow-hidden">
        <div>
          {/* Card Header */}
          <div className="p-5 flex justify-between items-center border-b border-gray-100 bg-white">
            <div>
              <h3 className="font-bold text-gray-900 text-[16px]">Recent Leads</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">Latest prospective candidates ingested</p>
            </div>
            <Link 
              to="/leads" 
              className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Table Container - Fits cleanly with no horizontal scrollbar */}
          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Assigned To</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[13px]">
                {leadsData.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs"
                          style={{ backgroundColor: lead.avatarBg }}
                        >
                          {lead.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate leading-tight">{lead.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">{lead.mobile}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[12.5px] text-gray-700 font-medium whitespace-nowrap">{lead.assignee}</span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link 
                        to="/leads" 
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center justify-center transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-[12px] text-gray-500">
          <span>Showing 5 of 2,580 leads</span>
          <span className="font-medium text-emerald-600">● 100% Distributed</span>
        </div>
      </div>

      {/* 2. Recent Activities Card */}
      <div className="bg-white rounded-[20px] shadow-xs border border-gray-100 flex flex-col justify-between overflow-hidden">
        <div>
          {/* Card Header */}
          <div className="p-5 flex justify-between items-center border-b border-gray-100 bg-white">
            <div>
              <h3 className="font-bold text-gray-900 text-[16px]">Recent Activities</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">Real-time team audit trail across departments</p>
            </div>
            <Link 
              to="/users/activity" 
              className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Activities List */}
          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Activity Description</th>
                  <th className="py-3 px-3 text-center">Department</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[13px]">
                {activitiesData.map((activity) => (
                  <tr key={activity.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs"
                          style={{ backgroundColor: activity.avatarBg, color: activity.avatarText }}
                        >
                          {activity.user.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 truncate leading-tight">{activity.user}</div>
                          <div className="text-[11px] text-gray-400 truncate">{activity.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[12.5px] text-gray-700 leading-snug">
                        {activity.action} for <span className="font-semibold text-gray-900">{activity.candidate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${activity.deptBg}`}>
                        {activity.dept}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-[11.5px] font-mono text-gray-400">
                      {activity.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-[12px] text-gray-500">
          <span>Live Activity Feed</span>
          <span className="font-medium text-blue-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Updated just now
          </span>
        </div>
      </div>

    </div>
  );
};
