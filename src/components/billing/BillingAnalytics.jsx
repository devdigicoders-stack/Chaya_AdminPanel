import React from 'react';
import { DollarSign, TrendingUp, CheckCircle2, AlertCircle, PieChart, ShieldCheck, ArrowUpRight, BarChart2 } from 'lucide-react';

export default function BillingAnalytics() {
  const monthlyData = [
    { month: 'Apr', invoiced: 60, received: 45 },
    { month: 'May', invoiced: 75, received: 55 },
    { month: 'Jun', invoiced: 80, received: 65 },
    { month: 'Jul', invoiced: 95, received: 80 },
    { month: 'Aug', invoiced: 90, received: 78 },
    { month: 'Sep', invoiced: 110, received: 95 },
    { month: 'Oct', invoiced: 125, received: 98 },
  ];

  return (
    <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-900 text-[16px] leading-tight">
            Financial Health & Collection Analytics
          </h3>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Bill book realization rate, monthly invoicing volume, and operational fee allocation
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto shadow-2xs">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>78.7% Collection Rate</span>
        </span>
      </div>

      {/* 3 Spacious Columns (Monthly Trends | Payment Status | Expense Allocation) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8 items-stretch">
        
        {/* 1. Monthly Invoiced vs Received (Bar Chart) */}
        <div className="flex flex-col justify-between p-4.5 rounded-xl border border-gray-100 bg-gray-50/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wider">
              Monthly Invoiced vs Collected
            </span>
            <span className="text-[11px] font-semibold text-gray-400">Values in ₹ Lakhs</span>
          </div>

          <div className="flex items-end justify-between h-32 pt-2 pb-1 border-b border-gray-200 gap-2 px-1">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div 
                  className="w-full max-w-[28px] bg-slate-200/60 rounded-t-md h-24 flex items-end justify-center gap-0.5 p-0.5 transition-colors group-hover:bg-slate-200"
                  title={`${d.month}: Invoiced ₹${d.invoiced / 10}L | Received ₹${d.received / 10}L`}
                >
                  <div
                    className="w-1/2 bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-600"
                    style={{ height: `${(d.invoiced / 130) * 100}%` }}
                  ></div>
                  <div
                    className="w-1/2 bg-emerald-500 rounded-t-sm transition-all group-hover:bg-emerald-600"
                    style={{ height: `${(d.received / 130) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-900">
                  {d.month}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-[11px] text-gray-500 pt-2.5">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span> Invoiced
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span> Received
            </span>
          </div>
        </div>

        {/* 2. Payment Realization Status (Donut Chart + Legend) */}
        <div className="flex flex-col justify-between p-4.5 rounded-xl border border-gray-100 bg-gray-50/40">
          <div className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Payment Realization Breakdown
          </div>

          <div className="flex items-center justify-start gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative w-26 h-26 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                
                {/* Received (Emerald) - 78.7% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.787)}
                  strokeLinecap="round"
                />
                
                {/* Pending (Amber) - 18.1% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.181)}
                  strokeLinecap="round"
                  style={{ transformOrigin: '50% 50%', transform: 'rotate(283deg)' }}
                />
                
                {/* Overdue (Red) - 3.2% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset={238.7 * (1 - 0.032)}
                  strokeLinecap="round"
                  style={{ transformOrigin: '50% 50%', transform: 'rotate(348deg)' }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[16px] font-bold text-gray-900 leading-none">124</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Bills</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="flex-1 min-w-[140px] space-y-2.5">
              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Settled</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">₹9.80L</span>
                  <span className="text-gray-400 text-[11px]">(79%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Partially Paid</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">₹2.25L</span>
                  <span className="text-gray-400 text-[11px]">(18%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12.5px] whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Overdue</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-bold text-gray-900">₹75K</span>
                  <span className="text-gray-400 text-[11px]">(3%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Operational Fee & Expense Allocation */}
        <div className="flex flex-col justify-between p-4.5 rounded-xl border border-blue-100/70 bg-gradient-to-br from-blue-50/40 to-slate-50">
          <div className="text-[11.5px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Operational Expenses</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="my-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[26px] font-bold text-gray-900 leading-none">₹ 1,20,000</div>
                <div className="text-[12px] font-medium text-gray-500 mt-1">Total Monthly Operational Costs</div>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[11.5px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-200">
                <ArrowUpRight className="w-3.5 h-3.5" /> Normal
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200/80 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">GAMCA Lab Testing Fees:</span>
              <span className="font-bold text-purple-700 font-mono">₹ 55,000 (45%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Visa Attestation / Embassy:</span>
              <span className="font-bold text-blue-700 font-mono">₹ 40,000 (33%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Recruitment Overhead & Office:</span>
              <span className="font-bold text-gray-800 font-mono">₹ 25,000 (22%)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
