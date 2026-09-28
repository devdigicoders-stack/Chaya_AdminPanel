import React from 'react';
import { Search, MoreHorizontal, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';

const placementData = [
  { id: 1, name: 'Rahul Sharma',   job: 'Pipe Fitter',    vivaDate: '10 Oct 2024', company: 'Al Falah Group',    result: 'Selected',     status: 'Offer Sent',        joiningDate: '-' },
  { id: 2, name: 'Mohammad Ali',  job: 'Electrician',    vivaDate: '11 Oct 2024', company: 'Gulf Tech',         result: 'Selected',     status: 'Placed',            joiningDate: '01 Nov 2024' },
  { id: 3, name: 'Sandeep Kumar', job: 'Welder',         vivaDate: '11 Oct 2024', company: 'Arabian Co.',       result: 'Not Selected', status: 'Not Placed',        joiningDate: '-' },
  { id: 4, name: 'Arif Khan',     job: 'AC Technician',  vivaDate: '12 Oct 2024', company: 'Qatar Build',       result: 'Selected',     status: 'Offer Pending',     joiningDate: '-' },
  { id: 5, name: 'Rajesh Patel',  job: 'Plumber',        vivaDate: '12 Oct 2024', company: 'Dubai Works',       result: 'Selected',     status: 'Placed',            joiningDate: '15 Nov 2024' },
  { id: 6, name: 'Vikram Singh',  job: 'Driver',         vivaDate: '13 Oct 2024', company: 'Saudi Projects',    result: 'Selected',     status: 'Offer Sent',        joiningDate: '-' },
  { id: 7, name: 'Imran Sheikh',  job: 'Helper',         vivaDate: '13 Oct 2024', company: 'Al Noor Co.',      result: 'Not Selected', status: 'Not Placed',        joiningDate: '-' },
  { id: 8, name: 'Sohail Ansari', job: 'Carpenter',      vivaDate: '14 Oct 2024', company: 'UAE Homes',         result: 'Selected',     status: 'Placed',            joiningDate: '20 Nov 2024' },
  { id: 9, name: 'Ramesh Yadav',  job: 'Mason',          vivaDate: '14 Oct 2024', company: 'Gulf Contracting',  result: 'Selected',     status: 'Joining Confirmed', joiningDate: '25 Nov 2024' },
  { id: 10, name: 'Naveen Kumar', job: 'Painter',        vivaDate: '15 Oct 2024', company: 'Al Falah Group',   result: 'Pending',      status: 'In Process',        joiningDate: '-' },
];

const getResultStyle = (r) => {
  if (r === 'Selected')     return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  if (r === 'Not Selected') return 'bg-red-50 text-red-600 border border-red-100';
  return 'bg-orange-50 text-orange-600 border border-orange-100';
};

const getStatusStyle = (s) => {
  if (s === 'Placed')            return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  if (s === 'Offer Sent')        return 'bg-blue-50 text-blue-600 border border-blue-100';
  if (s === 'Offer Pending')     return 'bg-orange-50 text-orange-600 border border-orange-100';
  if (s === 'Not Placed')        return 'bg-red-50 text-red-600 border border-red-100';
  if (s === 'Joining Confirmed') return 'bg-purple-50 text-purple-600 border border-purple-100';
  return 'bg-gray-50 text-gray-600 border border-gray-100';
};

const getAvatarColor = (name) => {
  const map = { R: 'bg-blue-600', M: 'bg-purple-600', S: 'bg-indigo-600', A: 'bg-blue-500', V: 'bg-teal-600', I: 'bg-pink-600', N: 'bg-violet-600' };
  return map[name.charAt(0)] || 'bg-gray-500';
};

const PlacementTable = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">

      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 min-w-[110px]">
            All Status <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 min-w-[150px]">
            All Job Categories <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 min-w-[130px]">
            All Companies <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            Oct 1, 2024 - Oct 31, 2024
          </button>
        </div>
        <div className="flex items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
          <div className="relative flex-1 xl:w-[300px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search candidate, company, or job..." className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500" />
          </div>
          <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-colors">Search</button>
          <button className="text-gray-500 px-2 py-1.5 text-[13px] font-medium hover:text-gray-700">Reset</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 w-10"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="py-3 px-2 text-[12px] font-semibold text-gray-900 w-10">#</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Candidate Name</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Job Position</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Viva Date</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Company</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900 text-center">Viva Result</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900 text-center">Placement Status</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Joining Date</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {placementData.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="py-3 px-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                <td className="py-3 px-2 text-[13px] text-gray-500">{row.id}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 ${getAvatarColor(row.name)}`}>
                      {row.name.charAt(0)}
                    </div>
                    <span className="text-[13px] font-medium text-blue-600 cursor-pointer group-hover:underline">{row.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-[13px] text-gray-700">{row.job}</td>
                <td className="py-3 px-4 text-[13px] text-gray-700">{row.vivaDate}</td>
                <td className="py-3 px-4 text-[13px] font-medium text-gray-800">{row.company}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-block min-w-[90px] text-center ${getResultStyle(row.result)}`}>{row.result}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-block min-w-[120px] text-center ${getStatusStyle(row.status)}`}>{row.status}</span>
                </td>
                <td className="py-3 px-4 text-[13px] text-gray-600">{row.joiningDate}</td>
                <td className="py-3 px-4 text-center">
                  <button className="p-1 hover:bg-gray-100 rounded-md text-gray-400 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
        <div className="text-[13px] text-gray-500">Showing 1 to 10 of 182 candidates</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 text-[12px]">&lt;</button>
            {[1,2,3,4,5].map(n => (
              <button key={n} className={`w-7 h-7 flex items-center justify-center rounded-md text-[13px] font-medium ${n === 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>{n}</button>
            ))}
            <span className="text-gray-400 px-1">...</span>
            <button className="px-2 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 text-[13px] font-medium">19</button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 text-[12px]">&gt;</button>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[13px] text-gray-500">
            Show
            <select className="border border-gray-200 rounded-md py-1 px-2 bg-white focus:outline-none text-[13px]">
              <option>10</option><option>25</option><option>50</option>
            </select>
            per page
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementTable;
