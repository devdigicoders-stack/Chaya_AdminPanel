import React from 'react';
import { Clock, ArrowDownRight } from 'lucide-react';

const InterviewAnalytics = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full">
      
      {/* 1. Interview Status Overview */}
      <div className="flex flex-col border-r border-gray-100 pr-4 last:border-0 last:pr-0">
        <h3 className="font-bold text-gray-900 mb-5 text-[14px]">Interview Status Overview</h3>
        <div className="flex items-center gap-6 mt-auto mb-auto">
          {/* Custom Donut Chart (CSS) */}
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F3F4F6" strokeWidth="12" />
              {/* Scheduled (blue) - 22% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.22)} strokeLinecap="round" />
              {/* Completed (green) - 58% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.58)} strokeLinecap="round" strokeDasharrayOffset="0" style={{ transformOrigin: '50% 50%', transform: 'rotate(80deg)' }}/>
              {/* Cancelled (red) - 10% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#EF4444" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.10)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(290deg)' }}/>
              {/* No Show (purple) - 10% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.10)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(330deg)' }}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[18px] font-bold text-gray-900 leading-tight">124</span>
              <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider">Interviews</span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-700">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Scheduled</div>
              <div className="flex gap-2">
                <span className="font-bold text-gray-900 w-4 text-right">28</span>
                <span className="text-gray-400 w-8 text-right">(22%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-700">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed</div>
              <div className="flex gap-2">
                <span className="font-bold text-gray-900 w-4 text-right">72</span>
                <span className="text-gray-400 w-8 text-right">(58%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-700">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Cancelled</div>
              <div className="flex gap-2">
                <span className="font-bold text-gray-900 w-4 text-right">12</span>
                <span className="text-gray-400 w-8 text-right">(10%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-700">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"></div> No Show</div>
              <div className="flex gap-2">
                <span className="font-bold text-gray-900 w-4 text-right">12</span>
                <span className="text-gray-400 w-8 text-right">(10%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interviews by Type */}
      <div className="flex flex-col border-r border-gray-100 pr-4 last:border-0 last:pr-0 pl-4 md:pl-0">
        <h3 className="font-bold text-gray-900 mb-5 text-[14px]">Interviews by Type</h3>
        <div className="space-y-3 mt-auto mb-auto">
          
          <div className="flex items-center gap-3">
            <div className="w-20 text-[11px] text-gray-600 font-medium truncate">Technical</div>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <div className="w-6 text-[12px] font-bold text-gray-900 text-right">48</div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-20 text-[11px] text-gray-600 font-medium truncate">HR Round</div>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <div className="w-6 text-[12px] font-bold text-gray-900 text-right">36</div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-20 text-[11px] text-gray-600 font-medium truncate">Final Round</div>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <div className="w-6 text-[12px] font-bold text-gray-900 text-right">24</div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-20 text-[11px] text-gray-600 font-medium truncate">Telephonic</div>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '30%' }}></div>
            </div>
            <div className="w-6 text-[12px] font-bold text-gray-900 text-right">16</div>
          </div>

        </div>
      </div>

      {/* 3. Average Time to Hire */}
      <div className="flex flex-col pl-4 md:pl-0">
        <h3 className="font-bold text-gray-900 mb-5 text-[14px]">Average Time to Hire</h3>
        <div className="flex flex-col justify-center h-full mt-auto mb-auto pb-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[28px] font-bold text-gray-900 leading-none">12 Days</span>
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-100">
                  <ArrowDownRight className="w-3 h-3" /> 18%
                </span>
              </div>
            </div>
          </div>
          <p className="text-[12px] text-gray-500 font-medium pl-16">From first interview to offer</p>
        </div>
      </div>

    </div>
  );
};

export default InterviewAnalytics;
