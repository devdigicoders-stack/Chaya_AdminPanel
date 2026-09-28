import React from 'react';
import { Check } from 'lucide-react';

const upcomingViva = [
  { id: 1, time: '10:00 AM', name: 'Rahul Sharma',   job: 'Pipe Fitter',   company: 'Al Falah Group',   color: 'bg-blue-600' },
  { id: 2, time: '11:30 AM', name: 'Mohammad Ali',  job: 'Electrician',   company: 'Gulf Tech',         color: 'bg-purple-600' },
  { id: 3, time: '01:00 PM', name: 'Arif Khan',     job: 'AC Technician', company: 'Qatar Build',       color: 'bg-blue-500' },
  { id: 4, time: '02:30 PM', name: 'Rajesh Patel',  job: 'Plumber',       company: 'Dubai Works',       color: 'bg-blue-600' },
];

const recentPlacements = [
  { id: 1, name: 'Mohammad Ali',  job: 'Electrician', company: 'Gulf Tech',         joined: '01 Nov 2024', color: 'bg-purple-600' },
  { id: 2, name: 'Sohail Ansari', job: 'Carpenter',   company: 'UAE Homes',         joined: '20 Oct 2024', color: 'bg-indigo-600' },
  { id: 3, name: 'Ramesh Yadav',  job: 'Mason',       company: 'Gulf Contracting',  joined: '18 Oct 2024', color: 'bg-blue-600' },
];

const PlacementWidgets = () => {
  return (
    <div className="space-y-6">

      {/* 1. Placement Process */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 text-[15px] mb-5">Placement Process</h3>
        <div className="relative">
          <div className="absolute top-3 bottom-3 left-[11px] w-[2px] bg-gray-100"></div>

          {[
            { step: 1, label: 'Conduct Viva', desc: 'Evaluate candidate performance', done: true },
            { step: 2, label: 'Shortlist & Share with Company', desc: 'Send profiles to employers', active: true },
            { step: 3, label: 'Receive Offer', desc: 'Collect offer letter from company' },
            { step: 4, label: 'Candidate Acceptance', desc: 'Confirm offer and willingness' },
            { step: 5, label: 'Joining & Update', desc: 'Mark as joined and close placement' },
          ].map(({ step, label, desc, done, active }) => (
            <div key={step} className="relative flex gap-3.5 mb-5 last:mb-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white text-[11px] font-bold
                ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>
                {done ? <Check className="w-3.5 h-3.5" /> : step}
              </div>
              <div>
                <div className={`text-[13px] font-bold ${active ? 'text-blue-600' : done ? 'text-gray-900' : 'text-gray-400'}`}>{label}</div>
                <div className={`text-[11px] ${done || active ? 'text-gray-500' : 'text-gray-400'}`}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Upcoming Viva */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-[15px]">Upcoming Viva</h3>
          <button className="text-[12px] font-medium text-blue-600 hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {upcomingViva.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="text-[11px] text-gray-500 font-medium w-[55px] shrink-0">{item.time}</div>
              <div className={`w-7 h-7 rounded-full ${item.color} text-white text-[11px] font-bold flex items-center justify-center shrink-0`}>
                {item.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-gray-900 truncate">{item.name}</div>
                <div className="text-[11px] text-gray-500 truncate">{item.job}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-gray-500 truncate max-w-[80px]">{item.company}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Recent Placements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-[15px]">Recent Placements</h3>
          <button className="text-[12px] font-medium text-blue-600 hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {recentPlacements.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full ${item.color} text-white text-[12px] font-bold flex items-center justify-center shrink-0`}>
                {item.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-gray-900 truncate">{item.name}</div>
                <div className="text-[11px] text-gray-500">{item.job}</div>
                <div className="text-[11px] text-gray-500">{item.company}</div>
                <div className="text-[10px] text-gray-400">Joined: {item.joined}</div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[11px] font-medium shrink-0">Joined</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default PlacementWidgets;
