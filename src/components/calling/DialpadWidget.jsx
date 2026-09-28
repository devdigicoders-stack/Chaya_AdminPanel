import React, { useState } from 'react';
import { Phone, ChevronDown, Check, Clock } from 'lucide-react';

const DialpadWidget = () => {
  const [activeTab, setActiveTab] = useState('Keypad');
  
  return (
    <div className="space-y-6">
      
      {/* Make a Call Widget */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Make a Call</h3>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-5 relative">
          <button 
            className={`flex-1 pb-2 text-[13px] font-medium transition-colors ${activeTab === 'Keypad' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('Keypad')}
          >
            Keypad
          </button>
          <button 
            className={`flex-1 pb-2 text-[13px] font-medium transition-colors ${activeTab === 'Recent Calls' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('Recent Calls')}
          >
            Recent Calls
          </button>
          {/* Active indicator */}
          <div className={`absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300 w-1/2 ${activeTab === 'Keypad' ? 'left-0' : 'left-1/2'}`} />
        </div>

        {/* Input */}
        <div className="flex mb-6">
          <button className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 border-r-0 rounded-l-lg bg-white text-[13px] text-gray-700 shrink-0">
            <span className="text-base leading-none">🇮🇳</span> +91 <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <input 
            type="text" 
            placeholder="Enter mobile number" 
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-r-lg text-[13px] focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {/* Dialpad Grid */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-4 mb-6 px-4">
          {[
            { num: '1', sub: '' },
            { num: '2', sub: 'ABC' },
            { num: '3', sub: 'DEF' },
            { num: '4', sub: 'GHI' },
            { num: '5', sub: 'JKL' },
            { num: '6', sub: 'MNO' },
            { num: '7', sub: 'PQRS' },
            { num: '8', sub: 'TUV' },
            { num: '9', sub: 'WXYZ' },
            { num: '*', sub: '' },
            { num: '0', sub: '+' },
            { num: '#', sub: '' },
          ].map((key, i) => (
            <button key={i} className="flex flex-col items-center justify-center py-2 rounded-full hover:bg-gray-50 transition-colors w-14 h-14 mx-auto text-gray-700 hover:text-blue-600">
              <span className={`font-medium ${key.num === '*' || key.num === '#' ? 'text-[24px] mt-1' : 'text-[20px] leading-none'}`}>{key.num}</span>
              {key.sub && <span className="text-[9px] text-gray-400 uppercase tracking-widest leading-none mt-1">{key.sub}</span>}
            </button>
          ))}
        </div>

        {/* Call Button */}
        <div className="flex justify-center">
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white w-24 h-10 rounded-full flex items-center justify-center shadow-sm shadow-emerald-200 transition-colors">
            <Phone className="w-5 h-5 fill-current" /> <span className="ml-2 font-medium text-[15px]">Call</span>
          </button>
        </div>
      </div>

      {/* Today's Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-5">Today's Activity</h3>
        <div className="flex gap-6 items-center">
          
          {/* Circular Chart */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F3F4F6" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#059669" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 * 0.28} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[18px] font-bold text-gray-900">72%</span>
            </div>
            <div className="text-center w-full mt-1.5 text-[10px] text-gray-500 font-medium">
              <span className="text-gray-900 font-bold">32 / 45</span><br/>
              Calls Completed
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex-1 space-y-2.5 mt-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Connected
              </div>
              <span>32</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Not Interested
              </div>
              <span>6</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Follow-up
              </div>
              <span>4</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-800"></div> No Answer
              </div>
              <span>3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">Quick Notes</h3>
        <textarea 
          placeholder="Add call notes here..." 
          className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-[13px] resize-none h-24 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors mb-3"
        ></textarea>
        <div className="flex items-center justify-between">
          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Clock className="w-4 h-4" />
          </button>
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-[13px] font-medium hover:bg-blue-700 transition-colors shadow-sm">
            Save Note
          </button>
        </div>
      </div>

    </div>
  );
};

export default DialpadWidget;
