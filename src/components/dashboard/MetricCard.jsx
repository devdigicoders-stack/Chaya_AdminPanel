import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricCard = ({ title, value, change, isPositive, icon: Icon, iconBgColor, iconColor, comparedTo }) => {
  return (
    <div className="bg-white rounded-[16px] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBgColor }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-gray-500 text-[13px] font-medium mb-1">{title}</h3>
          <div className="text-[24px] font-bold text-gray-900 leading-none">{value}</div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        <div className={`flex items-center gap-1 text-[13px] font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {change}%
        </div>
        {comparedTo && (
          <div className="text-[10px] text-gray-400 font-medium">
            vs {comparedTo}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
