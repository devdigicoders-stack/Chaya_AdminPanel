import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Send, FileText, Users } from 'lucide-react';

const upcomingInterviews = [
  { time: '10:00 AM', name: 'Rahul Sharma', job: 'Software Engineer', type: 'Technical', avatarColor: 'bg-blue-600' },
  { time: '11:30 AM', name: 'Mohammad Ali', job: 'Sales Executive', type: 'HR Round', avatarColor: 'bg-purple-600' },
  { time: '02:00 PM', name: 'Sandeep Kumar', job: 'Accountant', type: 'Technical', avatarColor: 'bg-amber-800' },
  { time: '04:00 PM', name: 'Pooja Singh', job: 'HR Manager', type: 'Final Round', avatarColor: 'bg-red-600' },
];

const InterviewWidgets = () => {
  return (
    <div className="space-y-6">
      
      {/* 1. Interview Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-[15px]">Interview Calendar</h3>
        </div>
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button className="text-gray-400 hover:text-gray-600"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-bold text-gray-900 text-[14px]">October 2024</span>
          <button className="text-gray-400 hover:text-gray-600"><ChevronRight className="w-4 h-4" /></button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center text-[11px] font-medium text-gray-400 mb-2">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-2 text-center text-[12px] font-medium text-gray-700">
          <div className="py-1 text-transparent">29</div>
          <div className="py-1 text-transparent">30</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">1</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">2</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">3</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">4</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">5</div>
          
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">6
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"></div>
          </div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">7</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">8</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">9</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">10
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-orange-500"></div>
              <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
            </div>
          </div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">11</div>
          <div className="py-1 relative cursor-pointer bg-blue-600 text-white rounded-md font-bold shadow-sm">12
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-white"></div>
            </div>
          </div>

          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">13</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">14</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">15</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">16
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-500"></div>
          </div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">17</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">18</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">19
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-blue-500"></div>
              <div className="w-1 h-1 rounded-full bg-purple-500"></div>
            </div>
          </div>

          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">20</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">21</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">22</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">23</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">24</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">25</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">26</div>

          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">27</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">28</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">29</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">30</div>
          <div className="py-1 relative cursor-pointer hover:bg-gray-50 rounded-md">31</div>
          <div className="py-1 text-transparent">1</div>
          <div className="py-1 text-transparent">2</div>
        </div>

        {/* Calendar Legend */}
        <div className="flex justify-between mt-5 pt-4 border-t border-gray-100 text-[10px] font-medium text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Scheduled</div>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Completed</div>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Cancelled</div>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> No Show</div>
        </div>
      </div>

      {/* 2. Upcoming Interviews */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-gray-900 text-[15px]">Upcoming Interviews</h3>
          <button className="text-[12px] font-medium text-blue-600 hover:underline">View All</button>
        </div>
        
        <div className="space-y-4">
          {upcomingInterviews.map((interview, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-16 text-[12px] font-medium text-gray-500">{interview.time}</div>
              <div className={`w-8 h-8 rounded-full text-white text-[12px] font-bold flex items-center justify-center shrink-0 ${interview.avatarColor}`}>
                {interview.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-gray-900 truncate">{interview.name}</div>
                <div className="text-[11px] text-gray-500 truncate">{interview.job}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                interview.type === 'Technical' ? 'bg-blue-50 text-blue-600' : 
                interview.type === 'HR Round' ? 'bg-purple-50 text-purple-600' : 'bg-purple-50 text-purple-600'
              }`}>
                {interview.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 text-[15px] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center justify-center py-4 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-colors group">
            <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-2" />
            <span className="text-[12px] font-medium text-gray-700 group-hover:text-blue-600">Schedule Interview</span>
          </button>
          <button className="flex flex-col items-center justify-center py-4 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-colors group">
            <Send className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-2" />
            <span className="text-[12px] font-medium text-gray-700 group-hover:text-blue-600">Send Invite</span>
          </button>
          <button className="flex flex-col items-center justify-center py-4 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-colors group">
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-2" />
            <span className="text-[12px] font-medium text-gray-700 group-hover:text-blue-600">Interview Templates</span>
          </button>
          <button className="flex flex-col items-center justify-center py-4 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-colors group">
            <Users className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mb-2" />
            <span className="text-[12px] font-medium text-gray-700 group-hover:text-blue-600">Panel Members</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default InterviewWidgets;
