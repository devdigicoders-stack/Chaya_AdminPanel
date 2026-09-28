import React from 'react';
import { Activity, ShieldCheck, ArrowUpRight, TrendingUp, CheckCircle2, Clock, Zap } from 'lucide-react';

export default function MedicalAnalytics({ leads = [] }) {
  const total = leads.length;
  const fitCount = leads.filter(l => l.medicalDetails?.status === 'FIT').length;
  const unfitCount = leads.filter(l => l.medicalDetails?.status === 'UNFIT').length;
  const scheduledCount = leads.filter(l => l.medicalDetails?.status === 'SCHEDULED').length;
  const pendingCount = leads.filter(l => l.medicalDetails?.status === 'PENDING' || !l.medicalDetails?.status).length;

  const fitPercent = total > 0 ? Math.round((fitCount / total) * 100) : 0;
  const unfitPercent = total > 0 ? Math.round((unfitCount / total) * 100) : 0;
  const scheduledPercent = total > 0 ? Math.round((scheduledCount / total) * 100) : 0;
  const pendingPercent = total > 0 ? Math.max(0, 100 - fitPercent - unfitPercent - scheduledPercent) : 0;

  // Donut circumference = 2 * PI * 38 ≈ 238.7
  const circumference = 238.7;
  const fitOffset = circumference * (1 - fitPercent / 100);
  const unfitOffset = circumference * (1 - unfitPercent / 100);
  const schedOffset = circumference * (1 - scheduledPercent / 100);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-900 text-[16px] leading-tight">
            Medical Performance & Result Analytics
          </h3>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Real-time clearance rates, GCC sync health, and testing status
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto shadow-2xs">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>{fitPercent}% Clearance Rate</span>
        </span>
      </div>

      {/* 3 Spacious Columns (Clearance Breakdown | Testing Distribution | Operational SLA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 items-stretch">
        
        {/* 1. Clearance Breakdown (Dynamic Donut + Legend) */}
        <div className="flex flex-col justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/40">
          <div className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wider mb-3">
            Clearance Breakdown
          </div>

          <div className="flex items-center justify-start gap-6 py-2">
            {/* SVG Donut Chart */}
            <div className="relative w-26 h-26 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                
                {/* Passed FIT (Emerald) */}
                {fitPercent > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={fitOffset}
                    strokeLinecap="round"
                  />
                )}
                
                {/* Failed UNFIT (Red) */}
                {unfitPercent > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={unfitOffset}
                    strokeLinecap="round"
                    style={{ transformOrigin: '50% 50%', transform: `rotate(${fitPercent * 3.6}deg)` }}
                  />
                )}
                
                {/* Scheduled (Purple) */}
                {scheduledPercent > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={schedOffset}
                    strokeLinecap="round"
                    style={{ transformOrigin: '50% 50%', transform: `rotate(${(fitPercent + unfitPercent) * 3.6}deg)` }}
                  />
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[20px] font-bold text-gray-900 leading-none">{total}</span>
                <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="flex-1 min-w-[140px] space-y-2">
              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">GAMCA FIT</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">{fitCount}</span>
                  <span className="text-gray-400 text-[11px]">({fitPercent}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">UNFIT</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">{unfitCount}</span>
                  <span className="text-gray-400 text-[11px]">({unfitPercent}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Scheduled</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">{scheduledCount}</span>
                  <span className="text-gray-400 text-[11px]">({scheduledPercent}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Pending Lab</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">{pendingCount}</span>
                  <span className="text-gray-400 text-[11px]">({pendingPercent}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Medical Queue Distribution */}
        <div className="flex flex-col justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wider">
              Testing Flow Distribution
            </span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Live Mongo
            </span>
          </div>

          <div className="space-y-3 py-1">
            <div>
              <div className="flex justify-between text-[12px] font-medium text-gray-700 mb-1">
                <span>FIT Cleared Rate</span>
                <span className="font-bold text-emerald-600">{fitPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${fitPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[12px] font-medium text-gray-700 mb-1">
                <span>Scheduled / In Pipeline</span>
                <span className="font-bold text-purple-600">{scheduledPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${scheduledPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[12px] font-medium text-gray-700 mb-1">
                <span>Awaiting Clinic Allocation</span>
                <span className="font-bold text-amber-600">{pendingPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pendingPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-200/60 flex items-center justify-between">
            <span>GAMCA Protocol SLA</span>
            <span className="font-semibold text-gray-900">48h Lab Results</span>
          </div>
        </div>

        {/* 3. Operational Standards & Compliance */}
        <div className="flex flex-col justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/40">
          <div className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wider mb-3">
            GCC & WAFID Protocol Compliance
          </div>

          <div className="space-y-2.5">
            <div className="p-2.5 rounded-lg bg-white border border-gray-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[12px] font-medium text-gray-700">WAFID Online Barcode Sync</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-gray-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-[12px] font-medium text-gray-700">Automatic Step 12 Forwarding</span>
              </div>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Enabled</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-gray-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-[12px] font-medium text-gray-700">Bill Book Fee Gate</span>
              </div>
              <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">FIT Required</span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-200/60 flex items-center justify-between">
            <span>Disqualification Rule</span>
            <span className="font-semibold text-rose-600">Quarantine Unfit Files</span>
          </div>
        </div>

      </div>

    </div>
  );
}
