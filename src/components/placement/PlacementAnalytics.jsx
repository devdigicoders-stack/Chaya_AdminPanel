import React from 'react';

const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
const placedData  = [15, 20, 25, 30, 28, 35, 40];
const joinedData  = [8,  12, 18, 22, 20, 28, 34];
const maxVal = 40;

const companies = [
  { name: 'Al Falah Group', count: 28, color: 'bg-blue-600',   pct: 100 },
  { name: 'Gulf Tech',       count: 22, color: 'bg-amber-500',  pct: 79 },
  { name: 'Qatar Build',     count: 18, color: 'bg-emerald-500',pct: 64 },
  { name: 'Dubai Works',     count: 14, color: 'bg-purple-500', pct: 50 },
  { name: 'Saudi Projects',  count: 12, color: 'bg-orange-500', pct: 43 },
];

const PlacementAnalytics = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

      {/* 1. Placement Status Overview */}
      <div className="p-5 border-r border-gray-100">
        <h3 className="font-bold text-gray-900 text-[14px] mb-4">Placement Status Overview</h3>
        <div className="flex items-center gap-5">
          {/* Donut */}
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F3F4F6" strokeWidth="12" />
              {/* Placed 54% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2*(1-0.54)} strokeLinecap="round" />
              {/* Offer Pending 20% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2*(1-0.20)} strokeLinecap="round" style={{transformOrigin:'50% 50%',transform:'rotate(194.4deg)'}}/>
              {/* In Process 13% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2*(1-0.13)} strokeLinecap="round" style={{transformOrigin:'50% 50%',transform:'rotate(266.4deg)'}}/>
              {/* Not Placed 10% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#EF4444" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2*(1-0.10)} strokeLinecap="round" style={{transformOrigin:'50% 50%',transform:'rotate(313.2deg)'}}/>
              {/* Joining Confirmed 3% */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2*(1-0.03)} strokeLinecap="round" style={{transformOrigin:'50% 50%',transform:'rotate(349.2deg)'}}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[17px] font-bold text-gray-900">182</span>
              <span className="text-[8px] text-gray-500 uppercase tracking-wider">Candidates</span>
            </div>
          </div>
          {/* Legend */}
          <div className="flex-1 space-y-1.5">
            {[
              { color:'bg-emerald-500', label:'Placed',            count: 98,  pct:'54%' },
              { color:'bg-amber-500',   label:'Offer Pending',     count: 36,  pct:'20%' },
              { color:'bg-blue-500',    label:'In Process',        count: 24,  pct:'13%' },
              { color:'bg-red-500',     label:'Not Placed',        count: 18,  pct:'10%' },
              { color:'bg-purple-500',  label:'Joining Confirmed', count:  6,  pct: '3%' },
            ].map(({color,label,count,pct}) => (
              <div key={label} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <div className={`w-2 h-2 rounded-full ${color}`}></div>{label}
                </div>
                <div className="flex gap-1.5">
                  <span className="font-bold text-gray-900 w-5 text-right">{count}</span>
                  <span className="text-gray-400 w-7 text-right">({pct})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Monthly Placement Trend */}
      <div className="p-5 border-r border-gray-100">
        <h3 className="font-bold text-gray-900 text-[14px] mb-2">Monthly Placement Trend</h3>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div>Placed</div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600"><div className="w-3 h-3 rounded-sm bg-blue-500"></div>Joined</div>
        </div>
        <div className="flex items-end justify-between h-[110px] pb-5 relative">
          {/* X labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-0">
            {months.map(m => <span key={m} className="text-[9px] text-gray-400 w-8 text-center">{m}</span>)}
          </div>
          {/* Bars */}
          {months.map((m, i) => (
            <div key={m} className="flex gap-0.5 items-end" style={{height:'90px'}}>
              <div className="w-4 bg-emerald-500 rounded-t-sm transition-all" style={{height:`${(placedData[i]/maxVal)*90}px`}}></div>
              <div className="w-4 bg-blue-400 rounded-t-sm transition-all" style={{height:`${(joinedData[i]/maxVal)*90}px`}}></div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Top Hiring Companies */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-[14px] mb-4">Top Hiring Companies</h3>
        <div className="space-y-3">
          {companies.map(({ name, count, color, pct }) => (
            <div key={name} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0">
                {name.charAt(0)}
              </div>
              <span className="text-[11px] text-gray-600 font-medium w-[90px] truncate">{name}</span>
              <div className="flex-1 h-3 bg-gray-100 rounded-sm overflow-hidden">
                <div className={`h-full ${color} rounded-sm`} style={{ width: `${pct}%` }}></div>
              </div>
              <span className="text-[11px] font-bold text-gray-900 w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default PlacementAnalytics;
