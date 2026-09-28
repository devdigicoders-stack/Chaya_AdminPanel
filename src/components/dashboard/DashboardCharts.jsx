import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { ChevronDown } from 'lucide-react';

const pipelineData = [
  { name: 'Leads', value: 458 },
  { name: 'Calling', value: 360 },
  { name: 'Initial\nInterview', value: 180 },
  { name: 'Medical', value: 120 },
  { name: 'Bill Book', value: 95 },
  { name: 'Visa', value: 65 },
  { name: 'Placed', value: 128 },
];

const sourceData = [
  { name: 'WhatsApp', value: 40, color: '#3B82F6' },
  { name: 'Facebook', value: 25, color: '#A855F7' },
  { name: 'Excel', value: 15, color: '#22C55E' },
  { name: 'Website', value: 10, color: '#EF4444' },
  { name: 'Other', value: 10, color: '#A8A29E' },
];

const trendData = [
  { name: 'May', leads: 150, selected: 80, placed: 40 },
  { name: 'Jun', leads: 220, selected: 100, placed: 50 },
  { name: 'Jul', leads: 280, selected: 120, placed: 60 },
  { name: 'Aug', leads: 310, selected: 140, placed: 70 },
  { name: 'Sep', leads: 350, selected: 150, placed: 80 },
  { name: 'Oct', leads: 380, selected: 180, placed: 120 },
];

const departmentData = [
  { name: 'Calling Management', value: 1420, color: '#3B82F6' },
  { name: 'Interview Management', value: 360, color: '#14B8A6' },
  { name: 'Medical Management', value: 240, color: '#F59E0B' },
  { name: 'Pre-Viva Management', value: 165, color: '#A855F7' },
  { name: 'Visa Management', value: 165, color: '#EF4444' },
  { name: 'Viva & Placement', value: 128, color: '#0EA5E9' },
];

const interviewData = [
  { name: 'Selected', value: 360, percentage: 69, color: '#10B981' },
  { name: 'Failed', value: 120, percentage: 23, color: '#EF4444' },
  { name: 'Pending', value: 40, percentage: 8, color: '#F59E0B' },
];

const medicalData = [
  { name: 'Pass', value: 200, percentage: 83, color: '#10B981' },
  { name: 'Fail', value: 40, percentage: 17, color: '#EF4444' },
];

const visaData = [
  { name: 'In Process', value: 98, percentage: 59, color: '#6366F1' },
  { name: 'Delayed', value: 32, percentage: 19, color: '#EF4444' },
  { name: 'Completed', value: 28, percentage: 17, color: '#10B981' },
  { name: 'Not Started', value: 7, percentage: 5, color: '#8B5CF6' },
];

const ChartCard = ({ title, subtitle, children, dropdown }) => (
  <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col h-full">
    <div className="flex justify-between items-center mb-6">
      <h3 className="font-bold text-gray-900">{title}</h3>
      {dropdown && (
        <button className="flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-700 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
          {dropdown} <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
    <div className="flex-1 w-full h-[220px]">
      {children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-[12px]">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-bold text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom shape for pipeline bars to match design
const CustomBar = (props) => {
  const { fill, x, y, width, height } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />
      <text x={x + width / 2} y={y - 10} fill="#111827" textAnchor="middle" fontSize={12} fontWeight="bold">
        {props.value}
      </text>
    </g>
  );
};

export const DashboardCharts = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Row 1: Pipeline, Source, Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruitment Pipeline */}
        <div className="lg:col-span-1">
          <ChartCard title="Recruitment Pipeline" dropdown="This Month">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                <Bar dataKey="value" shape={<CustomBar />}>
                  {pipelineData.map((entry, index) => {
                    const colors = ['#3B82F6', '#60A5FA', '#34D399', '#FBBF24', '#A855F7', '#F43F5E', '#14B8A6'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Lead Source */}
        <div className="lg:col-span-1">
          <ChartCard title="Lead Source">
            <div className="flex h-full items-center justify-between">
              <div className="w-[50%] h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[20px] font-bold text-gray-900 leading-none">2,580</span>
                </div>
              </div>
              <div className="w-[45%] flex flex-col justify-center gap-3">
                {sourceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600 font-medium">{item.name}</span>
                    </div>
                    <span className="text-gray-900 font-bold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Monthly Trend */}
        <div className="lg:col-span-1">
          <ChartCard title="Monthly Trend" dropdown="Last 6 Months">
            <div className="flex justify-end gap-4 mb-2 text-[11px] font-medium pr-2">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>Leads</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10B981]"></div>Selected</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>Placed</div>
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
                <Line type="monotone" dataKey="selected" name="Selected" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} />
                <Line type="monotone" dataKey="placed" name="Placed" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Row 2: Department Status and Donuts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Department Wise Status */}
        <div className="lg:col-span-1">
          <ChartCard title="Department Wise Status">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4B5563' }} width={110} />
                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                <Bar dataKey="value" barSize={12} radius={[0, 4, 4, 0]}>
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Interview Result */}
        <div className="lg:col-span-1">
          <ChartCard title="Interview Result (Initial)">
            <div className="flex h-full items-center justify-between">
              <div className="w-[45%] h-[120px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={interviewData} innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                      {interviewData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[18px] font-bold text-gray-900 leading-none">520</span>
                  <span className="text-[10px] text-gray-500 font-medium">Total</span>
                </div>
              </div>
              <div className="w-[50%] flex flex-col gap-2.5">
                {interviewData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">{item.value}</span>
                      <span className="text-gray-400">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Medical Result */}
        <div className="lg:col-span-1">
          <ChartCard title="Medical Result">
            <div className="flex h-full items-center justify-between">
              <div className="w-[45%] h-[120px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={medicalData} innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                      {medicalData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[18px] font-bold text-gray-900 leading-none">240</span>
                  <span className="text-[10px] text-gray-500 font-medium">Total</span>
                </div>
              </div>
              <div className="w-[50%] flex flex-col gap-2.5">
                {medicalData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">{item.value}</span>
                      <span className="text-gray-400">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Visa Status */}
        <div className="lg:col-span-1">
          <ChartCard title="Visa Status">
            <div className="flex h-full items-center justify-between">
              <div className="w-[45%] h-[120px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={visaData} innerRadius={40} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none">
                      {visaData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[18px] font-bold text-gray-900 leading-none">165</span>
                  <span className="text-[10px] text-gray-500 font-medium">Total</span>
                </div>
              </div>
              <div className="w-[50%] flex flex-col gap-2">
                {visaData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600 font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="font-bold text-gray-900">{item.value}</span>
                      <span className="text-gray-400">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  );
};
