import React from 'react';
import { Calendar as CalendarIcon, Users, FileText, Send, Check, Clock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const upcomingPreVivas = [
  { id: 1, time: '10:00 AM', name: 'Rahul Sharma', job: 'Pipe Fitter', date: 'Today', status: 'In Session' },
  { id: 2, time: '11:30 AM', name: 'Mohammad Ali', job: 'Electrician', date: 'Today', status: 'Upcoming' },
  { id: 3, time: '02:00 PM', name: 'Arif Khan', job: 'AC Technician', date: 'Tomorrow', status: 'Confirmed' },
  { id: 4, time: '03:30 PM', name: 'Rajesh Patel', job: 'Plumber', date: 'Tomorrow', status: 'Confirmed' },
];

export default function PreVivaWidgets() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Quick Actions Launchpad */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Pre-Viva Operations</h3>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            Step 15
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          
          <button
            onClick={() => navigate('/pre-viva/schedule')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-blue-50/70 hover:border-blue-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <CalendarIcon className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-blue-600 leading-tight">Schedule Viva</span>
          </button>

          <button
            onClick={() => navigate('/pre-viva/delay-confirmations')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-amber-50/70 hover:border-amber-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-amber-600 leading-tight">Delay Review</span>
          </button>

          <button
            onClick={() => alert('Opening Technical Evaluation Sheet Template...')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-purple-50/70 hover:border-purple-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-purple-600 leading-tight">Evaluation Sheet</span>
          </button>

          <button
            onClick={() => navigate('/visa/apply')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-emerald-50/70 hover:border-emerald-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-emerald-600 leading-tight">To Step 16 (Visa)</span>
          </button>

        </div>
      </div>

      {/* 2. Upcoming Live Pre-Viva Sessions */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Upcoming Sessions</h3>
          <span className="text-[11.5px] font-bold text-blue-600">Active Queue</span>
        </div>
        
        <div className="space-y-2.5">
          {upcomingPreVivas.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
                  {item.time.split(' ')[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-gray-900 truncate">{item.name}</div>
                  <div className="text-[10.5px] text-gray-500 truncate">{item.job} • {item.date}</div>
                </div>
              </div>
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                item.status === 'In Session'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Pre-Viva 5-Step Evaluation Lifecycle */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Assessment Protocol</h3>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            Lifecycle
          </span>
        </div>

        <div className="relative pl-1 space-y-3.5">
          {/* Connecting Line */}
          <div className="absolute top-2.5 bottom-2.5 left-3.5 w-[2px] bg-blue-100"></div>

          {/* Step 1 */}
          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-2xs">
              <Check className="w-3 h-3" />
            </div>
            <div>
              <div className="text-[12px] font-bold text-gray-900 leading-snug">1. File Inward (Move & Direct)</div>
              <div className="text-[10.5px] text-gray-500">Files received from Calling confirmation</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-xs text-[10.5px] font-bold">
              2
            </div>
            <div>
              <div className="text-[12px] font-bold text-blue-700 leading-snug">2. Allocate Viva Session</div>
              <div className="text-[10.5px] text-gray-500">Date & Technical panel assigned</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-300 text-gray-500 flex items-center justify-center shrink-0 z-10 ring-4 ring-white text-[10.5px] font-bold">
              3
            </div>
            <div>
              <div className="text-[12px] font-semibold text-gray-700 leading-snug">3. Technical Assessment</div>
              <div className="text-[10.5px] text-gray-400">Oral & trade readiness evaluation</div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-300 text-gray-500 flex items-center justify-center shrink-0 z-10 ring-4 ring-white text-[10.5px] font-bold">
              4
            </div>
            <div>
              <div className="text-[12px] font-semibold text-gray-700 leading-snug">4. Step 16 Visa Transfer</div>
              <div className="text-[10.5px] text-gray-400">Cleared files move to Visa Application</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
