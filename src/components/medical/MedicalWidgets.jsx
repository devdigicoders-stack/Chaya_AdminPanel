import React from 'react';
import { Calendar as CalendarIcon, UploadCloud, Building2, FileText, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const APPROVED_CENTERS_INFO = [
  { name: 'GAMCA Medical Center, Mumbai', location: 'Mumbai, Maharashtra', key: 'Mumbai' },
  { name: 'Gulf Diagnostics, Delhi', location: 'Connaught Place, New Delhi', key: 'Delhi' },
  { name: 'GCC Health Care, Lucknow', location: 'Hazratganj, Lucknow', key: 'Lucknow' },
  { name: 'Al-Khaleej Diagnostic, Patna', location: 'Fraser Road, Patna', key: 'Patna' },
  { name: 'Apex Diagnostic Center, Hyderabad', location: 'Banjara Hills, Hyderabad', key: 'Hyderabad' }
];

export default function MedicalWidgets({ leads = [] }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Medical Process Stepper (Step 10 Alignment) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[14.5px]">GAMCA Medical Lifecycle</h3>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            Step 10 • Protocol
          </span>
        </div>
        
        <div className="relative pl-1 space-y-4">
          <div className="absolute top-3 bottom-3 left-3.5 w-[2px] bg-blue-100"></div>

          {/* Step 1 */}
          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-2xs">
              <Check className="w-3 h-3" />
            </div>
            <div>
              <div className="text-[12.5px] font-bold text-gray-900 leading-snug">1. Center Scheduling</div>
              <div className="text-[11px] text-gray-500">GAMCA slip token generated & center scheduled</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-xs text-[10.5px] font-bold">
              2
            </div>
            <div>
              <div className="text-[12.5px] font-bold text-blue-700 leading-snug">2. Clinical & Lab Exam</div>
              <div className="text-[11px] text-gray-500">X-Ray, Blood, VDRL, Hepatitis screening</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white text-[10.5px] font-bold">
              3
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-teal-800 leading-snug">3. Fitness Verdict</div>
              <div className="text-[11px] text-gray-500">FIT forward to Step 12; UNFIT quarantined</div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white text-[10.5px] font-bold">
              4
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-purple-800 leading-snug">4. Bill Book Opening (Step 11)</div>
              <div className="text-[11px] text-gray-500">Advance service fee + medical fee tracking</div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Quick Actions</h3>
          <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            Shortcuts
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          
          <button
            onClick={() => navigate('/medical/schedule')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-blue-50/70 hover:border-blue-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <CalendarIcon className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-blue-600 leading-tight">Schedule Center</span>
          </button>

          <button
            onClick={() => navigate('/billing/all')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-emerald-50/70 hover:border-emerald-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-emerald-600 leading-tight">Bill Book Desk</span>
          </button>

          <button
            onClick={() => navigate('/staff-head/handling')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-purple-50/70 hover:border-purple-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <UploadCloud className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-purple-600 leading-tight">Staff Head Desk</span>
          </button>

          <button
            onClick={() => navigate('/medical/all')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-red-50/70 hover:border-red-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-red-600 leading-tight">All Medicals</span>
          </button>

        </div>
      </div>

      {/* 3. Approved GCC Medical Centers Directory (Dynamic Counts from Live Leads) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Approved GCC Centers</h3>
          <span className="text-[11.5px] font-bold text-blue-600">{APPROVED_CENTERS_INFO.length} Active Hubs</span>
        </div>
        
        <div className="space-y-2">
          {APPROVED_CENTERS_INFO.map((center, index) => {
            const count = leads.filter(l => l.medicalDetails?.center?.toLowerCase().includes(center.key.toLowerCase())).length;
            return (
              <div key={index} className="flex items-center justify-between p-2 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-gray-900 truncate">{center.name}</div>
                    <div className="text-[10.5px] text-gray-500 truncate">{center.location}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11.5px] font-bold text-gray-900">{count} candidates</div>
                  <div className="text-[9.5px] text-emerald-600 font-medium">WAFID Online</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
