import React from 'react';
import { Search, MoreHorizontal, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';

const callData = [
  { id: 1, name: 'Rahul Sharma', mobile: '9876543210', country: '🇦🇪', callType: 'Outbound', duration: '04:32', disposition: 'Interested', caller: 'Amit Verma', time: '12 Oct, 11:20 AM' },
  { id: 2, name: 'Mohammad Ali', mobile: '8765432109', country: '🇸🇦', callType: 'Inbound', duration: '02:18', disposition: 'Not Interested', caller: 'Pooja Singh', time: '12 Oct, 10:15 AM' },
  { id: 3, name: 'Sandeep Kumar', mobile: '7654321098', country: '🇶🇦', callType: 'Outbound', duration: '06:12', disposition: 'Follow-up', caller: 'Rajesh Yadav', time: '12 Oct, 09:50 AM' },
  { id: 4, name: 'Arif Khan', mobile: '9988776655', country: '🇰🇼', callType: 'Outbound', duration: '03:08', disposition: 'Interested', caller: 'Neha Gupta', time: '11 Oct, 05:30 PM' },
  { id: 5, name: 'Rajesh Patel', mobile: '8877665544', country: '🇴🇲', callType: 'Inbound', duration: '01:45', disposition: 'Switched Off', caller: 'Amit Verma', time: '11 Oct, 04:10 PM' },
  { id: 6, name: 'Vikram Singh', mobile: '7766554433', country: '🇧🇭', callType: 'Outbound', duration: '05:20', disposition: 'Follow-up', caller: 'Pooja Singh', time: '11 Oct, 02:40 PM' },
  { id: 7, name: 'Imran Sheikh', mobile: '7655443322', country: '🇲🇾', callType: 'Outbound', duration: '00:00', disposition: 'No Answer', caller: 'Rajesh Yadav', time: '10 Oct, 06:15 PM' },
  { id: 8, name: 'Sohail Ansari', mobile: '6544332211', country: '🇸🇬', callType: 'Inbound', duration: '03:55', disposition: 'Interested', caller: 'Neha Gupta', time: '10 Oct, 03:25 PM' },
  { id: 9, name: 'Ramesh Yadav', mobile: '9433221100', country: '🇦🇪', callType: 'Outbound', duration: '04:10', disposition: 'Not Interested', caller: 'Amit Verma', time: '10 Oct, 12:45 PM' },
  { id: 10, name: 'Naveen Kumar', mobile: '9322110099', country: '🇸🇦', callType: 'Outbound', duration: '02:30', disposition: 'Follow-up', caller: 'Pooja Singh', time: '09 Oct, 05:20 PM' },
  { id: 11, name: 'Salman Khan', mobile: '9211009988', country: '🇶🇦', callType: 'Inbound', duration: '07:18', disposition: 'Interested', caller: 'Rajesh Yadav', time: '09 Oct, 01:10 PM' },
  { id: 12, name: 'Akhilesh Tiwari', mobile: '9110098776', country: '🇴🇲', callType: 'Outbound', duration: '00:45', disposition: 'No Answer', caller: 'Neha Gupta', time: '09 Oct, 11:35 AM' },
];

const CallLogsTable = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      
      {/* Filters Row */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 min-w-[120px]">
            All Teams <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 min-w-[130px]">
            All Call Types <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button className="flex items-center justify-between gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] text-gray-700 bg-white hover:bg-gray-50 min-w-[140px]">
            All Dispositions <ChevronDown className="w-4 h-4 text-gray-400" />
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
              placeholder="Search by name, mobile, lead ID..." 
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
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Mobile</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Country</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Call Type</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Duration</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Disposition</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Called By</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900">Call Time</th>
              <th className="py-3 px-4 text-[12px] font-semibold text-gray-900 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {callData.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="py-2.5 px-4"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                <td className="py-2.5 px-2 text-[13px] text-gray-500">{row.id}</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 ${
                      row.id % 3 === 0 ? 'bg-amber-600' : row.id % 2 === 0 ? 'bg-purple-600' : 'bg-blue-600'
                    }`}>
                      {row.name.charAt(0)}
                    </div>
                    <span className="text-[13px] font-medium text-blue-600 group-hover:underline cursor-pointer">{row.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-[13px] text-gray-600 font-medium">{row.mobile}</td>
                <td className="py-2.5 px-4 text-lg leading-none">{row.country}</td>
                <td className="py-2.5 px-4">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                    row.callType === 'Outbound' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'
                  }`}>
                    {row.callType}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-[13px] text-gray-600">{row.duration}</td>
                <td className="py-2.5 px-4">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                    row.disposition === 'Interested' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    row.disposition === 'Not Interested' ? 'bg-red-50 text-red-600 border border-red-100' :
                    row.disposition === 'Follow-up' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    row.disposition === 'Switched Off' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                    'bg-red-50 text-red-600 border border-red-100' // No Answer
                  }`}>
                    {row.disposition}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      row.caller.includes('Amit') ? 'bg-blue-600' : row.caller.includes('Pooja') ? 'bg-pink-600' : row.caller.includes('Rajesh') ? 'bg-indigo-600' : 'bg-teal-600'
                    }`}>
                      {row.caller.charAt(0)}
                    </div>
                    <span className="text-[13px] text-gray-700">{row.caller}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-[12px] text-gray-500 whitespace-nowrap">{row.time}</td>
                <td className="py-2.5 px-4 text-center">
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
          Showing 1 to 12 of 1,245 calls
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
              104
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 text-[12px]">
              &gt;
            </button>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 hidden sm:flex">
            Show 
            <select className="border border-gray-200 rounded-md py-1 px-2 bg-white focus:outline-none focus:border-blue-500">
              <option>12</option>
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

export default CallLogsTable;
