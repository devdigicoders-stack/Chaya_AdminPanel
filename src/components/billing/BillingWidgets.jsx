import React from 'react';
import { PlusCircle, CreditCard, DollarSign, FileText, CheckCircle2, AlertCircle, Hourglass, ArrowRight, Receipt, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const recentTransactions = [
  { id: 1, type: 'Advance Collected', candidate: 'Rahul Sharma (CAN-1001)', amount: '+ ₹ 5,000', date: 'Today, 02:30 PM', mode: 'UPI / QR', status: 'received' },
  { id: 2, type: 'Full Bill Settled', candidate: 'Mohammad Ali (CAN-1002)', amount: '+ ₹ 12,300', date: 'Today, 11:15 AM', mode: 'Bank IMPS', status: 'received' },
  { id: 3, type: 'Partial Advance', candidate: 'Sandeep Kumar (CAN-1003)', amount: '+ ₹ 3,000', date: 'Yesterday', mode: 'Cash', status: 'partial' },
  { id: 4, type: 'Final Balance Paid', candidate: 'Rajesh Patel (CAN-1005)', amount: '+ ₹ 6,000', date: '18 Oct 2024', mode: 'UPI / QR', status: 'received' },
];

export default function BillingWidgets() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Quick Actions Launchpad */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Accounts Actions</h3>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            Step 11 & 18
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          
          <button
            onClick={() => navigate('/billing/advance')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-emerald-50/70 hover:border-emerald-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <Banknote className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-emerald-600 leading-tight">Collect Advance</span>
          </button>

          <button
            onClick={() => navigate('/billing/final')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-blue-50/70 hover:border-blue-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-blue-600 leading-tight">Final Balance</span>
          </button>

          <button
            onClick={() => alert('Opening Bulk Invoice Generator...')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-purple-50/70 hover:border-purple-200 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-purple-600 leading-tight">Create Invoice</span>
          </button>

          <button
            onClick={() => alert('Exporting Official Billing Ledger...')}
            className="flex flex-col items-center justify-center p-3.5 border border-gray-100 rounded-xl hover:bg-gray-50/90 hover:border-gray-300 transition-all cursor-pointer group text-center"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-2xs">
              <Receipt className="w-4.5 h-4.5" />
            </div>
            <span className="text-[12px] font-bold text-gray-800 group-hover:text-gray-900 leading-tight">Accounts Ledger</span>
          </button>

        </div>
      </div>

      {/* 2. Bill Book 2-Stage Lifecycle */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Bill Book Payment Cycle</h3>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            Official Protocol
          </span>
        </div>

        <div className="space-y-3 text-[12.5px]">
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
            <div className="font-bold text-blue-950 flex items-center justify-between">
              <span>Stage 1: Advance Fee (Step 11)</span>
              <span className="font-mono text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Medical FIT</span>
            </div>
            <p className="text-[11.5px] text-blue-800 mt-1">
              Fixed service fee + GAMCA testing fees are locked into the candidate's bill book.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="font-bold text-emerald-950 flex items-center justify-between">
              <span>Stage 2: Final Balance (Step 18)</span>
              <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Pre-Flight</span>
            </div>
            <p className="text-[11.5px] text-emerald-800 mt-1">
              Remaining balance cleared upon final interview selection & visa issuance before flight.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Recent Real-Time Transactions */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Recent Collections</h3>
          <span className="text-[11.5px] font-bold text-emerald-600">Live Entries</span>
        </div>
        
        <div className="space-y-2">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-2 rounded-xl border border-gray-100 hover:bg-gray-50/80 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-gray-900 truncate">{tx.candidate}</div>
                  <div className="text-[10.5px] text-gray-500 truncate">{tx.type} • {tx.mode}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] font-mono font-bold text-emerald-600">{tx.amount}</div>
                <div className="text-[9.5px] text-gray-400">{tx.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
