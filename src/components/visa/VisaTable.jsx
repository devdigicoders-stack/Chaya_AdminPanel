import React, { useState } from 'react';
import { Search, MoreHorizontal, ChevronDown, Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, XCircle, RotateCcw, MapPin, Eye, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const visaData = [
  { id: 1, appId: 'VISA-401', name: 'Rahul Sharma', passport: 'T1234567', country: 'UAE', trade: 'Pipe Fitter', embassy: 'UAE Embassy, Delhi', type: 'Work Permit', appDate: '15 Oct 2024', readyDate: '28 Oct 2024', fee: '₹4,500', status: 'Approved', avatarBg: '#3B82F6' },
  { id: 2, appId: 'VISA-402', name: 'Mohammad Ali', passport: 'A9821034', country: 'Qatar', trade: 'Electrician', embassy: 'Qatar Visa Center (QVC), Delhi', type: 'Employment Visa', appDate: '16 Oct 2024', readyDate: '02 Nov 2024', fee: '₹5,000', status: 'Processing', avatarBg: '#8B5CF6' },
  { id: 3, appId: 'VISA-403', name: 'Arif Khan', passport: 'K4432190', country: 'Qatar', trade: 'AC Technician', embassy: 'QVC, Mumbai', type: 'Employment Visa', appDate: '17 Oct 2024', readyDate: '30 Oct 2024', fee: '₹5,000', status: 'Approved', avatarBg: '#10B981' },
  { id: 4, appId: 'VISA-404', name: 'Rajesh Patel', passport: 'M8899001', country: 'UAE', trade: 'Plumber', embassy: 'UAE Embassy, Delhi', type: 'Work Permit', appDate: '18 Oct 2024', readyDate: '05 Nov 2024', fee: '₹4,500', status: 'Submitted', avatarBg: '#F59E0B' },
  { id: 5, appId: 'VISA-405', name: 'Vikram Singh', passport: 'V8921034', country: 'Saudi Arabia', trade: 'Driver', embassy: 'Saudi Embassy, Delhi', type: 'Work Visa', appDate: '19 Oct 2024', readyDate: '15 Oct 2024', fee: '₹3,800', status: 'Delayed', avatarBg: '#EF4444' },
  { id: 6, appId: 'VISA-406', name: 'Santosh Bind', passport: 'P7788912', country: 'Kuwait', trade: 'Mason', embassy: 'Kuwait Embassy, Mumbai', type: 'Work Visa', appDate: '14 Oct 2024', readyDate: '08 Nov 2024', fee: '₹4,200', status: 'Processing', avatarBg: '#06B6D4' },
  { id: 7, appId: 'VISA-407', name: 'Imran Sheikh', passport: 'S3322110', country: 'Saudi Arabia', trade: 'Welder 6G', embassy: 'Saudi Embassy, Delhi', type: 'Work Visa', appDate: '12 Oct 2024', readyDate: '26 Oct 2024', fee: '₹4,000', status: 'Approved', avatarBg: '#8B5CF6' },
  { id: 8, appId: 'VISA-408', name: 'Sohail Ansari', passport: 'B5544332', country: 'Oman', trade: 'Heavy Driver', embassy: 'Oman Embassy, Delhi', type: 'Employment Visa', appDate: '11 Oct 2024', readyDate: '04 Nov 2024', fee: '₹4,200', status: 'Processing', avatarBg: '#10B981' },
];

export default function VisaTable() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');

  const filtered = visaData.filter((row) => {
    const matchStatus = statusFilter === 'All' || row.status === statusFilter;
    const matchCountry = countryFilter === 'All' || row.country === countryFilter;
    const matchSearch =
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.passport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.appId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.embassy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchCountry && matchSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Approved & Stamped</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Embassy Processing</span>
          </span>
        );
      case 'Submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shadow-2xs">
            <span>Documents Lodged</span>
          </span>
        );
      case 'Delayed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Delayed (Loop Back)</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Filters Header */}
      <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
          {[
            { key: 'All', label: 'All Visas', count: visaData.length },
            { key: 'Approved', label: 'Approved & Stamped', count: visaData.filter((a) => a.status === 'Approved').length },
            { key: 'Processing', label: 'Processing', count: visaData.filter((a) => a.status === 'Processing').length },
            { key: 'Delayed', label: 'Delayed Loop', count: visaData.filter((a) => a.status === 'Delayed').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-gray-200/70 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Country Filter */}
        <div className="flex items-center gap-2.5">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="All">All GCC Nations</option>
            <option value="UAE">UAE</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
            <option value="Qatar">Qatar</option>
            <option value="Kuwait">Kuwait</option>
            <option value="Oman">Oman</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, passport, token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>

          {(searchTerm || statusFilter !== 'All' || countryFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setCountryFilter('All');
              }}
              className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* Table Content (min-w-[1240px]) */}
      <div className="overflow-x-auto min-h-0">
        <table className="w-full text-left border-collapse min-w-[1240px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[20%] min-w-[200px]">Candidate & Passport</th>
              <th className="py-3.5 px-4 w-[18%] min-w-[180px]">Trade & Destination</th>
              <th className="py-3.5 px-4 w-[18%] min-w-[180px]">Embassy / Visa Center</th>
              <th className="py-3.5 px-4 w-[14%] min-w-[140px]">Visa Category</th>
              <th className="py-3.5 px-4 w-[14%] min-w-[140px]">Expected Ready Date</th>
              <th className="py-3.5 px-4 w-[14%] min-w-[150px] text-center">Status</th>
              <th className="py-3.5 px-4 w-[16%] min-w-[180px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[13px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  No visa applications found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/20 transition-colors">
                  
                  {/* Candidate & Passport */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full text-white text-[13px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                        style={{ backgroundColor: row.avatarBg }}
                      >
                        {row.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-[13.5px] leading-snug whitespace-nowrap">
                          {row.name}
                        </div>
                        <div className="text-[11.5px] text-gray-500 font-mono mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                          <span>{row.passport}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-blue-600 font-medium">{row.appId}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Trade & Destination */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900 text-[13px] whitespace-nowrap">
                      {row.trade}
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[11.5px] text-gray-600 mt-0.5 whitespace-nowrap">
                      <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>{row.country}</span>
                    </div>
                  </td>

                  {/* Embassy / Center */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-medium text-gray-800 text-[12.5px] whitespace-nowrap">
                      {row.embassy}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5 font-mono whitespace-nowrap">
                      Fee: {row.fee}
                    </div>
                  </td>

                  {/* Visa Category */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11.5px] font-medium bg-gray-50 text-gray-700 border border-gray-200 whitespace-nowrap">
                      {row.type}
                    </span>
                    <div className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">
                      Applied: {row.appDate}
                    </div>
                  </td>

                  {/* Expected Ready Date */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className={`inline-flex items-center gap-1.5 font-mono font-bold text-[12.5px] whitespace-nowrap ${
                      row.status === 'Delayed' ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      <CalendarIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{row.readyDate}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(row.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                      {row.status === 'Approved' ? (
                        <button
                          onClick={() => navigate('/billing/all')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Step 18 Balance</span>
                        </button>
                      ) : row.status === 'Delayed' ? (
                        <button
                          onClick={() => navigate('/pre-viva/delay-confirmations')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[12px] font-semibold transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                        >
                          <span>Delay Loop</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/visa/apply')}
                          className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          View File
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
