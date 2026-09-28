import React from 'react';
import { Activity, Award, CheckCircle2, TrendingUp, Users } from 'lucide-react';

export default function PreVivaAnalytics() {
  const scoreBands = [
    { range: '<50', count: 8, color: 'bg-red-500' },
    { range: '50-60', count: 18, color: 'bg-orange-500' },
    { range: '60-70', count: 32, color: 'bg-amber-500' },
    { range: '70-80', count: 56, color: 'bg-blue-500' },
    { range: '80-90', count: 78, color: 'bg-emerald-500' },
    { range: '90-100', count: 56, color: 'bg-emerald-600' },
  ];

  const tradeData = [
    { trade: 'Pipe Fitter', count: 48, pct: '100%', color: 'bg-blue-600' },
    { trade: 'Electrician', count: 36, pct: '75%', color: 'bg-purple-500' },
    { trade: 'Welder 6G', count: 32, pct: '66%', color: 'bg-emerald-500' },
    { trade: 'Plumber', count: 28, pct: '58%', color: 'bg-orange-500' },
    { trade: 'AC Tech', count: 24, pct: '50%', color: 'bg-teal-500' },
  ];

  return (
    <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-900 text-[16px] leading-tight">
            Pre-Viva Performance & Readiness Analytics
          </h3>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Technical readiness metrics, score distribution, and trade evaluation benchmarks
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto shadow-2xs">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>75.0% Overall Clearance</span>
        </span>
      </div>

      {/* 3 Spacious Columns (Clearance Breakdown | Score Distribution | Trade Evaluation) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 items-stretch">
        
        {/* 1. Pre-Viva Clearance Status (Donut + Legend) */}
        <div className="flex flex-col justify-between p-4.5 rounded-xl border border-gray-100 bg-gray-50/40">
          <div className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Status Breakdown
          </div>

          <div className="flex items-center justify-start gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative w-26 h-26 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                
                {/* Cleared (Emerald) - 75% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.75)}
                  strokeLinecap="round"
                />
                
                {/* Scheduled (Blue) - 17% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.17)}
                  strokeLinecap="round"
                  style={{ transformOrigin: '50% 50%', transform: 'rotate(270deg)' }}
                />
                
                {/* Not Cleared (Red) - 7% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.07)}
                  strokeLinecap="round"
                  style={{ transformOrigin: '50% 50%', transform: 'rotate(331deg)' }}
                />

                {/* Pending Review (Purple) - 5% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.05)}
                  strokeLinecap="round"
                  style={{ transformOrigin: '50% 50%', transform: 'rotate(356deg)' }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[20px] font-bold text-gray-900 leading-none">248</span>
                <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="flex-1 min-w-[140px] space-y-2">
              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Cleared</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">186</span>
                  <span className="text-gray-400 text-[11px]">(75%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Scheduled</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">42</span>
                  <span className="text-gray-400 text-[11px]">(17%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Need Retest</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">18</span>
                  <span className="text-gray-400 text-[11px]">(7%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">In Review</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">12</span>
                  <span className="text-gray-400 text-[11px]">(5%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Evaluation Score Distribution (Vertical Bar Chart) */}
        <div className="flex flex-col justify-between p-4.5 rounded-xl border border-gray-100 bg-gray-50/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wider">
              Score Distribution
            </span>
            <span className="text-[11px] font-semibold text-gray-400">Total Scores</span>
          </div>

          <div className="flex items-end justify-between h-30 pt-2 pb-1 border-b border-gray-200 gap-2 px-1">
            {scoreBands.map((bar) => (
              <div key={bar.range} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-[9.5px] font-bold text-gray-500 group-hover:text-gray-900">
                  {bar.count}
                </span>
                <div 
                  className="w-full max-w-[26px] bg-slate-200/60 rounded-t-md h-20 flex flex-col justify-end p-0.5 group-hover:bg-slate-300 transition-colors"
                  title={`${bar.range}: ${bar.count} Candidates`}
                >
                  <div
                    className={`w-full ${bar.color} rounded-t-sm transition-all`}
                    style={{ height: `${(bar.count / 80) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-900">
                  {bar.range}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-2">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span> Passed (&ge;70)
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span> Average (50-70)
            </span>
          </div>
        </div>

        {/* 3. Pre-Viva by Job Category (Horizontal Bar Chart) */}
        <div className="flex flex-col justify-between p-4.5 rounded-xl border border-blue-100/70 bg-gradient-to-br from-blue-50/40 to-slate-50">
          <div className="text-[11.5px] font-bold text-slate-700 uppercase tracking-wider mb-2">
            Candidates by Trade
          </div>

          <div className="space-y-2.5 my-auto">
            {tradeData.map((item) => (
              <div key={item.trade} className="flex items-center gap-2.5 text-[12px]">
                <span className="text-gray-700 font-semibold w-22 truncate">{item.trade}</span>
                <div className="flex-1 h-3 bg-slate-200/80 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: item.pct }}></div>
                </div>
                <span className="font-bold text-gray-900 font-mono w-6 text-right">{item.count}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11.5px] text-gray-500 mt-2">
            <span>Pass Threshold: <strong>70 / 100</strong></span>
            <span className="text-emerald-700 font-bold">Top: Pipe Fitter (48)</span>
          </div>
        </div>

      </div>

    </div>
  );
}
