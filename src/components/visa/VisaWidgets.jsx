import React from 'react';
import { Check, ArrowRight, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VisaWidgets() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. Visa Lifecycle Stage Tracker */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Visa Stamping Lifecycle</h3>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            Step 16
          </span>
        </div>
        
        <div className="relative pl-1 space-y-3.5 my-auto">
          {/* Connecting line */}
          <div className="absolute top-3 bottom-3 left-3.5 w-[2px] bg-blue-100"></div>

          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-2xs">
              <Check className="w-3 h-3" />
            </div>
            <div>
              <div className="text-[12.5px] font-bold text-gray-900 leading-snug">1. Pre-Viva Clearance Passed</div>
              <div className="text-[11px] text-gray-500">Candidate verified and inward dispatched</div>
            </div>
          </div>

          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-xs text-[10.5px] font-bold">
              2
            </div>
            <div>
              <div className="text-[12.5px] font-bold text-blue-700 leading-snug">2. Embassy Dossier Lodged</div>
              <div className="text-[11px] text-gray-500">GAMCA FIT report + Passport filed</div>
            </div>
          </div>

          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-300 text-gray-500 flex items-center justify-center shrink-0 z-10 ring-4 ring-white text-[10.5px] font-bold">
              3
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-gray-700 leading-snug">3. Biometrics / Stamping</div>
              <div className="text-[11px] text-gray-400">Embassy processing & security review</div>
            </div>
          </div>

          <div className="relative flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-300 text-gray-500 flex items-center justify-center shrink-0 z-10 ring-4 ring-white text-[10.5px] font-bold">
              4
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-gray-700 leading-snug">4. Step 18 Payment & Departure</div>
              <div className="text-[11px] text-gray-400">Collect flight balance & deploy candidate</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Urgent Delay Loop Review (Step 15 Connection) */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Visa Delay Loop Review</h3>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Step 15 Action
          </span>
        </div>

        <div className="space-y-3 my-auto">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold text-amber-950">Vikram Singh</div>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.2 rounded border border-red-200">
                Expired 15 Oct
              </span>
            </div>
            <div className="text-[11.5px] text-amber-800 mt-1">
              Driver • Saudi Embassy Delhi (Fee: ₹3,800)
            </div>
            <div className="text-[11px] text-amber-700 mt-1 italic">
              Candidate re-confirmation call pending to avoid contract cancellation.
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/pre-viva/delay-confirmations')}
          className="w-full mt-4 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:shadow"
        >
          <span>Open Delay Confirmations Desk</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Approved Visa Clearance & Handover */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="font-bold text-gray-900 text-[14.5px]">Stamped Visas Ready</h3>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Ready to Fly
          </span>
        </div>

        <div className="space-y-2.5 my-auto">
          <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[12.5px] font-bold text-gray-900">Rahul Sharma</div>
              <div className="text-[11px] text-emerald-800">Pipe Fitter • UAE Embassy Stamped</div>
            </div>
            <span className="text-[11.5px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
              Ready
            </span>
          </div>

          <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[12.5px] font-bold text-gray-900">Arif Khan</div>
              <div className="text-[11px] text-emerald-800">AC Technician • Qatar QVC Stamped</div>
            </div>
            <span className="text-[11.5px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
              Ready
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/billing/all')}
          className="w-full mt-4 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:shadow"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Collect Step 18 Final Balance</span>
        </button>
      </div>

    </div>
  );
}
