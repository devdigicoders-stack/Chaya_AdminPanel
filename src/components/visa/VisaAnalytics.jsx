import React from 'react';
import { Clock } from 'lucide-react';

export default function VisaAnalytics() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Stamping Status Breakdown (Donut Chart) */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-[14.5px]">Visa Stamping Breakdown</h3>
            <p className="text-[11.5px] text-gray-500">Live embassy dossier pipeline</p>
          </div>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
            Live GCC
          </span>
        </div>

        <div className="flex items-center gap-6 my-auto">
          {/* Donut Chart SVG */}
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F3F4F6" strokeWidth="12" />
              {/* Approved (emerald) - 65% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.65)} strokeLinecap="round" />
              {/* Processing (orange) - 20% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.20)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(234deg)' }} />
              {/* Delayed (amber) - 10% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#EF4444" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.10)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(306deg)' }} />
              {/* Rejected (gray) - 5% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#9CA3AF" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.05)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(342deg)' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[19px] font-extrabold text-gray-900 leading-none">256</span>
              <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">Files</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11.5px]">
                <span className="font-bold text-gray-900">166</span>
                <span className="text-gray-400">(65%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></div>
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11.5px]">
                <span className="font-bold text-gray-900">52</span>
                <span className="text-gray-400">(20%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></div>
                <span>Delayed</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11.5px]">
                <span className="font-bold text-gray-900">26</span>
                <span className="text-gray-400">(10%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0"></div>
                <span>Rejected</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11.5px]">
                <span className="font-bold text-gray-900">12</span>
                <span className="text-gray-400">(5%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GCC Destination Demand (Bar Chart) */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-[14.5px]">GCC Destination Demand</h3>
            <p className="text-[11.5px] text-gray-500">Active visa slots across Gulf nations</p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            6 Countries
          </span>
        </div>

        <div className="flex items-end justify-between h-[120px] w-full pt-2 px-1">
          {[
            { country: 'UAE', count: 76, pct: '100%', color: 'bg-blue-600' },
            { country: 'Saudi', count: 62, pct: '82%', color: 'bg-emerald-600' },
            { country: 'Qatar', count: 48, pct: '63%', color: 'bg-purple-600' },
            { country: 'Kuwait', count: 34, pct: '45%', color: 'bg-orange-500' },
            { country: 'Oman', count: 24, pct: '32%', color: 'bg-cyan-600' },
            { country: 'Bahrain', count: 12, pct: '16%', color: 'bg-amber-500' },
          ].map((item) => (
            <div key={item.country} className="flex flex-col items-center gap-1.5 flex-1 group">
              <span className="text-[10.5px] font-bold text-gray-800 opacity-90 group-hover:opacity-100 font-mono">
                {item.count}
              </span>
              <div className="w-6 sm:w-7 bg-gray-100 rounded-t-lg relative flex items-end justify-center overflow-hidden h-[75px]">
                <div
                  className={`w-full ${item.color} rounded-t-lg transition-all duration-500 group-hover:brightness-110`}
                  style={{ height: item.pct }}
                ></div>
              </div>
              <span className="text-[11px] text-gray-600 font-semibold truncate w-full text-center">
                {item.country}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Embassy Stamping SLAs */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-[14.5px]">Embassy Stamping SLAs</h3>
            <p className="text-[11.5px] text-gray-500">Average days to visa issuance</p>
          </div>
          <Clock className="w-4 h-4 text-gray-400" />
        </div>

        <div className="space-y-3 my-auto">
          <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[11px]">
                QVC
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-gray-900">Qatar Visa Center</div>
                <div className="text-[11px] text-gray-500">Biometrics & medical pass</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-bold text-emerald-600 font-mono">8 - 12 Days</span>
              <div className="text-[10px] text-gray-400">Fastest SLA</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[11px]">
                UAE
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-gray-900">UAE Embassy Delhi</div>
                <div className="text-[11px] text-gray-500">MOHRE e-visa issuance</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-bold text-blue-600 font-mono">12 - 15 Days</span>
              <div className="text-[10px] text-gray-400">Standard SLA</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[11px]">
                KSA
              </div>
              <div>
                <div className="text-[12.5px] font-bold text-gray-900">Saudi Embassy / Tasheel</div>
                <div className="text-[11px] text-gray-500">Enjaz barcode endorsement</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-bold text-orange-600 font-mono">15 - 18 Days</span>
              <div className="text-[10px] text-gray-400">Moderate SLA</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
