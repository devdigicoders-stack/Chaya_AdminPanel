import React, { useState } from 'react';
import { HeartPulse, DollarSign, CheckCircle2, Building, ChevronRight, Edit2, Save, FileText } from 'lucide-react';

const initialMedicalRecords = [
  { id: 1, name: 'Rahul Sharma', passportNo: 'T1234567', center: 'GAMCA Medical Diagnostic Center - Mumbai', testDate: '12 Oct 2024', status: 'Fit', fee: 2500, receiptNo: 'MED-BOM-8921', billSynced: true },
  { id: 2, name: 'Mohammad Ali', passportNo: 'A9821034', center: 'Gulf Health Examination Hub - Delhi', testDate: '14 Oct 2024', status: 'Fit', fee: 2800, receiptNo: 'MED-DEL-4412', billSynced: true },
  { id: 3, name: 'Sandeep Kumar', passportNo: 'P3321908', center: 'GAMCA Medical Diagnostic Center - Mumbai', testDate: '15 Oct 2024', status: 'Fit', fee: 2500, receiptNo: 'MED-BOM-8945', billSynced: true },
  { id: 4, name: 'Arif Khan', passportNo: 'K4432190', center: 'Kerala Gulf Medical Trust - Kochi', testDate: '16 Oct 2024', status: 'Fit', fee: 2500, receiptNo: 'MED-COK-1102', billSynced: true },
  { id: 5, name: 'Imran Sheikh', passportNo: 'S9081234', center: 'GAMCA Medical Diagnostic Center - Mumbai', testDate: '17 Oct 2024', status: 'Unfit (Chest X-Ray)', fee: 2500, receiptNo: 'MED-BOM-8980', billSynced: false },
];

const MedicalFeeConfig = () => {
  const [records, setRecords] = useState(initialMedicalRecords);
  const [editingId, setEditingId] = useState(null);
  const [editFee, setEditFee] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const handleSaveFee = (id) => {
    setRecords(records.map((r) => (r.id === id ? { ...r, fee: Number(editFee) } : r)));
    setEditingId(null);
    setToastMsg('Medical Fee updated and synced with Candidate Bill Book!');
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="flex flex-col flex-1 pb-10">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span className="hover:text-blue-600 cursor-pointer">CRM Workflow</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="hover:text-blue-600 cursor-pointer">Medical Management</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Medical Fee Configuration</span>
          </div>
          <h1 className="text-[24px] font-bold text-gray-900 leading-tight">
            Medical Fee Setup & Dynamic Bill Book Sync
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Medical Staff configures the diagnostic fee for each candidate. This variable fee feeds directly into the candidate's Bill Book formula (₹9,500 Service Fee + Medical Fee).
          </p>
        </div>
      </div>

      {toastMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center gap-3 animate-in slide-in-from-top">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-[13px] font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Formula Explainer Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-6 text-white shadow-md mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[12px] text-emerald-300 font-semibold uppercase tracking-wider">
              Financial Integration Rule (Bill Book)
            </div>
            <div className="text-[20px] font-bold mt-1">
              Total Bill = ₹9,500 (Fixed Service Fee) + Medical Fee (Variable)
            </div>
            <p className="text-[12px] text-emerald-200/80 mt-1">
              Medical Fee is set by Medical Staff based on diagnostic center rates and GAMCA slip fees.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
            <span className="text-[12px] text-emerald-200">Average Medical Fee:</span>
            <span className="text-[18px] font-bold text-white">₹2,560</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Diagnostic Center</th>
                <th className="py-3 px-4">Medical Date</th>
                <th className="py-3 px-4 text-center">Result Status</th>
                <th className="py-3 px-4">Medical Fee (INR)</th>
                <th className="py-3 px-4 text-center">Bill Book Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">{r.passportNo}</div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">
                    <div className="text-[12px] font-medium">{r.center}</div>
                    <div className="text-[10px] text-gray-400 font-mono">Ref: {r.receiptNo}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[12px] text-gray-600 font-medium">
                    {r.testDate}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        r.status === 'Fit'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {r.status === 'Fit' && <CheckCircle2 className="w-3 h-3" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {editingId === r.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editFee}
                          onChange={(e) => setEditFee(e.target.value)}
                          className="w-24 px-2 py-1 border border-blue-500 rounded text-[13px] font-mono font-bold"
                        />
                        <button
                          onClick={() => handleSaveFee(r.id)}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-gray-900 text-[14px]">
                        ₹{r.fee.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {r.billSynced ? (
                      <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Synced to Bill Book
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">Not Applicable (Unfit)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {editingId !== r.id && (
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setEditFee(r.fee);
                        }}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 rounded-md text-[12px] font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit Fee
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MedicalFeeConfig;
