import React from 'react';
import { Search, MoreHorizontal, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';

const interviewData = [
  { id: 1, name: 'Rahul Sharma', job: 'Software Engineer', type: 'Technical', date: '12 Oct 2024', time: '10:00 AM', interviewers: ['Amit', 'Neha'], extra: 1, status: 'Scheduled' },
  { id: 2, name: 'Mohammad Ali', job: 'Sales Executive', type: 'HR Round', date: '12 Oct 2024', time: '11:30 AM', interviewers: ['Pooja', 'Rajesh'], extra: 0, status: 'Completed' },
  { id: 3, name: 'Sandeep Kumar', job: 'Accountant', type: 'Technical', date: '12 Oct 2024', time: '02:00 PM', interviewers: ['Amit', 'Pooja'], extra: 0, status: 'Scheduled' },
  { id: 4, name: 'Arif Khan', job: 'Marketing Manager', type: 'Final Round', date: '13 Oct 2024', time: '10:00 AM', interviewers: ['Neha', 'Rajesh'], extra: 0, status: 'Completed' },
  { id: 5, name: 'Rajesh Patel', job: 'Operations Executive', type: 'HR Round', date: '13 Oct 2024', time: '11:00 AM', interviewers: ['Pooja', 'Amit'], extra: 0, status: 'Cancelled' },
  { id: 6, name: 'Vikram Singh', job: 'Business Development', type: 'Technical', date: '14 Oct 2024', time: '10:30 AM', interviewers: ['Rajesh', 'Neha'], extra: 0, status: 'Scheduled' },
  { id: 7, name: 'Imran Sheikh', job: 'Customer Support', type: 'HR Round', date: '14 Oct 2024', time: '12:00 PM', interviewers: ['Pooja', 'Amit'], extra: 0, status: 'No Show' },
  { id: 8, name: 'Sohail Ansari', job: 'Data Analyst', type: 'Final Round', date: '15 Oct 2024', time: '10:00 AM', interviewers: ['Neha', 'Rajesh'], extra: 0, status: 'Scheduled' },
  { id: 9, name: 'Ramesh Yadav', job: 'IT Support', type: 'Technical', date: '15 Oct 2024', time: '02:00 PM', interviewers: ['Amit', 'Pooja'], extra: 0, status: 'Completed' },
  { id: 10, name: 'Naveen Kumar', job: 'Finance Executive', type: 'HR Round', date: '16 Oct 2024', time: '11:30 AM', interviewers: ['Rajesh', 'Neha'], extra: 0, status: 'Scheduled' },
];

const getStatusStyle = (status) => {
  switch (status) {
    case 'Scheduled': return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'Completed': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    case 'Cancelled': return 'bg-red-50 text-red-600 border border-red-100';
    case 'No Show': return 'bg-red-50 text-red-600 border border-red-100'; // Or a slightly different red style if needed
    default: return 'bg-gray-50 text-gray-600 border border-gray-100';
  }
};

const getTypeStyle = (type) => {
  switch (type) {
    case 'Technical': return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'HR Round': return 'bg-purple-50 text-purple-600 border border-purple-100';
    case 'Final Round': return 'bg-purple-50 text-purple-600 border border-purple-100';
    default: return 'bg-gray-50 text-gray-600 border border-gray-100';
  }
};

const getAvatarColor = (name) => {
  if (name.includes('Amit') || name.includes('Rahul')) return 'bg-blue-600';
  if (name.includes('Pooja') || name.includes('Neha') || name.includes('Mohammad')) return 'bg-purple-600';
  if (name.includes('Rajesh') || name.includes('Sandeep')) return 'bg-indigo-600';
  if (name.includes('Arif') || name.includes('Vikram')) return 'bg-amber-600';
  return 'bg-teal-600';
};

const InterviewTable = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      
      {/* Filters Row */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 min-w-[130px]">
            All Interviews <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 min-w-[110px]">
            All Status <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 min-w-[160px]">
            All Job Categories <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            Oct 1, 2024 - Oct 31, 2024
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
          <div className="relative flex-1 xl:w-[250px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search candidate, interviewer..." 
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-colors">
            Search
          </button>
          <button className="text-gray-500 px-2 py-1.5 text-[13px] font-medium hover:text-gray-700 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto min-h-0">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 w-10"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></th>
              <th className="py-3 px-2 text-[12px] font-semibold text-gray-900 w-12">#</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Candidate Name</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Job Position</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Interview Type</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Date & Time</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Interviewers</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Status</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {interviewData.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="py-3 px-4"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                <td className="py-3 px-2 text-[13px] text-gray-500">{row.id}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 ${getAvatarColor(row.name)}`}>
                      {row.name.charAt(0)}
                    </div>
                    <span className="text-[13px] font-medium text-blue-600 group-hover:underline cursor-pointer">{row.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-[13px] text-gray-700">{row.job}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${getTypeStyle(row.type)}`}>
                    {row.type}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="text-[13px] text-gray-700">{row.date}</div>
                  <div className="text-[12px] text-gray-500">{row.time}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {row.interviewers.map((name, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white -ml-2 first:ml-0 shadow-sm ${getAvatarColor(name)}`} title={name}>
                        {name.charAt(0)}
                      </div>
                    ))}
                    {row.extra > 0 && (
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border-2 border-white text-[10px] font-bold flex items-center justify-center -ml-2 shadow-sm">
                        +{row.extra}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${getStatusStyle(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button className="p-1 hover:bg-gray-100 rounded-md text-gray-400 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white mt-auto">
        <div className="text-[13px] text-gray-500">
          Showing 1 to 10 of 124 interviews
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 text-[12px]">
              &lt;
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md bg-blue-600 text-white font-medium text-[13px]">
              1
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 text-[13px] font-medium">
              2
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 text-[13px] font-medium">
              3
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 text-[13px] font-medium">
              4
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 text-[13px] font-medium">
              5
            </button>
            <span className="text-gray-400 px-1">...</span>
            <button className="px-2 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 text-[13px] font-medium">
              13
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 text-[12px]">
              &gt;
            </button>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 hidden sm:flex">
            Show 
            <select className="border border-gray-200 rounded-md py-1 px-2 bg-white focus:outline-none focus:border-blue-500">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            per page
          </div>
        </div>
      </div>

    </div>
  );
};

export default InterviewTable;
