import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, Plus, Download, Users, CheckCircle2, XCircle, 
  Clock, CalendarDays, ArrowUpRight, ArrowDownRight, Activity, 
  Sparkles, ShieldCheck, RefreshCw, Loader2, ArrowRight, HeartPulse, 
  CreditCard, Upload, FileSpreadsheet, AlertTriangle, AlertCircle, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import MedicalTable from '../../components/medical/MedicalTable';
import { apiGetLeads, apiBulkUpdateMedicalResults } from '../../utils/api';

export default function AllMedicals() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bulk Result Modal & Breakdown State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      let res = await apiGetLeads({ medicalDesk: true });
      if (res?.success && res.data) {
        setLeads(res.data);
      } else {
        const fallbackRes = await apiGetLeads({ stage: 'ALL' });
        if (fallbackRes?.success && fallbackRes.data) {
          setLeads(fallbackRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load medical leads:', err);
      setError(err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Real-time KPI Stats
  const totalCount = leads.length;
  const fitCount = leads.filter(l => l.medicalDetails?.status === 'FIT').length;
  const unfitCount = leads.filter(l => l.medicalDetails?.status === 'UNFIT').length;
  const scheduledCount = leads.filter(l => l.medicalDetails?.status === 'SCHEDULED').length;
  const pendingCount = leads.filter(l => l.medicalDetails?.status === 'PENDING' || !l.medicalDetails?.status).length;
  
  const fitPercent = totalCount > 0 ? ((fitCount / totalCount) * 100).toFixed(1) : '0.0';
  const unfitPercent = totalCount > 0 ? ((unfitCount / totalCount) * 100).toFixed(1) : '0.0';

  // 1. Download Medical Lab Excel (.xlsx) Template
  const handleDownloadLabTemplate = () => {
    const data = [
      {
        'Lead ID / Mobile / Passport': 'CHY-1001',
        'Candidate Name': 'Ramesh Kumar Yadav',
        'Medical Status (FIT / UNFIT)': 'FIT',
        'Medical Center / Lab': 'Al-Hayat Diagnostic GAMCA',
        'Lab Slip No': 'GAMCA-98124',
        'Doctor Remarks': 'Chest clear, Blood profile fit for GCC'
      },
      {
        'Lead ID / Mobile / Passport': '9988776655',
        'Candidate Name': 'Vikram Singh Rawat',
        'Medical Status (FIT / UNFIT)': 'UNFIT',
        'Medical Center / Lab': 'Central Diagnostic GAMCA',
        'Lab Slip No': 'GAMCA-98125',
        'Doctor Remarks': 'Hypertension and Elevated sugar levels'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 28 }, // Identifier
      { wch: 22 }, // Candidate Name
      { wch: 28 }, // Status
      { wch: 28 }, // Center
      { wch: 18 }, // Slip No
      { wch: 38 }  // Remarks
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lab_Results_Template');
    XLSX.writeFile(workbook, 'gamca_medical_results_template.xlsx');
  };

  // 2. Export Current Medical Roster to Excel (.xlsx)
  const handleExportExcelRoster = () => {
    if (leads.length === 0) {
      Swal.fire('No Data', 'No medical records available to export.', 'info');
      return;
    }

    const data = leads.map(l => ({
      'Lead ID': l.leadId || l._id,
      'Candidate Name': l.candidateName || '',
      'Phone Number': l.phone || '',
      'Passport Number': l.passportNumber || '',
      'Trade Skill': l.trade || '',
      'Target Country': l.country || '',
      'Medical Center': l.medicalDetails?.center || '',
      'Slip No': l.medicalDetails?.slipNo || '',
      'Medical Status': l.medicalDetails?.status || 'PENDING',
      'Appointment Date': l.medicalDetails?.appointmentDate ? new Date(l.medicalDetails.appointmentDate).toISOString().split('T')[0] : '',
      'Doctor Remarks': l.medicalDetails?.remarks || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 16 }, { wch: 24 }, { wch: 16 }, { wch: 18 },
      { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 16 },
      { wch: 16 }, { wch: 18 }, { wch: 32 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GAMCA_Medicals');
    XLSX.writeFile(workbook, `GAMCA_Medical_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // 3. Handle File Upload for Bulk Medical Results (.xlsx / .csv)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkUploading(true);
    setBulkResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          throw new Error('Spreadsheet has no data rows.');
        }

        // Map flexible column headers
        const parsedResults = jsonData.map((row, idx) => {
          const getVal = (keys) => {
            for (const k of Object.keys(row)) {
              const clean = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
              for (const search of keys) {
                if (clean.includes(search)) return String(row[k]).trim();
              }
            }
            return '';
          };

          const identifier = getVal(['leadid', 'mobile', 'phone', 'passport', 'id', 'contact']);
          const status = getVal(['status', 'result', 'fit', 'fitness', 'medicalstatus']);
          const center = getVal(['center', 'lab', 'hospital', 'clinic']);
          const slipNo = getVal(['slip', 'slipno', 'token', 'gamcano', 'receipt']);
          const remarks = getVal(['remark', 'notes', 'doctor', 'reason']);
          const candidateName = getVal(['name', 'candidate', 'candidatename']);

          return {
            rowNumber: idx + 1,
            leadId: identifier,
            phone: identifier,
            passportNumber: identifier,
            status: status || 'FIT',
            center,
            slipNo,
            remarks,
            candidateName
          };
        });

        // Call Backend API
        const res = await apiBulkUpdateMedicalResults(parsedResults);

        setBulkResult({
          total: parsedResults.length,
          updatedCount: res.updatedCount || 0,
          failedCount: res.failedCount || 0,
          failedRecords: res.failedRecords || []
        });

        fetchLeads();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Import Failed',
          text: err.message || 'Error parsing medical results spreadsheet.',
          confirmButtonColor: '#EF4444'
        });
      } finally {
        setBulkUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">Medical Desk</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-semibold">GAMCA Medical Roster</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Medical List (Fit / Unfit)
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              GAMCA Desk
            </span>
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/medical/schedule')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            title="Schedule Approved GAMCA Center"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Medical</span>
          </button>

          {/* Bulk Update Medical Results via Excel Button */}
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            title="Upload Lab Results Excel (.xlsx / .csv)"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Lab Results</span>
          </button>

          <button
            onClick={handleExportExcelRoster}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Export Medical Records to Excel"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={fetchLeads}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-center gap-2 mb-5">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Dynamic KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-5 sm:mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Records</span>
          <div className="text-2xl font-black text-gray-900 font-mono mt-1">{totalCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Fit Cleared</span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{fitCount} <span className="text-xs font-normal">({fitPercent}%)</span></div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs flex flex-col justify-between bg-rose-50/20">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Unfit / Hold</span>
          <div className="text-2xl font-black text-rose-700 font-mono mt-1">{unfitCount} <span className="text-xs font-normal">({unfitPercent}%)</span></div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Scheduled</span>
          <div className="text-2xl font-black text-blue-800 font-mono mt-1">{scheduledCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Lab</span>
          <div className="text-2xl font-black text-amber-800 font-mono mt-1">{pendingCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Fitness Ratio</span>
          <div className="text-2xl font-black text-purple-800 font-mono mt-1">{fitPercent}%</div>
        </div>
      </div>

      {/* 3. Main Medical Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <MedicalTable 
          leads={leads} 
          loading={loading} 
          onRefresh={fetchLeads} 
        />
      </div>

      {/* 4. MODAL: Bulk Import Medical Lab Results */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Bulk Import Lab Results (FIT/UNFIT)</h3>
                  <p className="text-xs text-gray-500">Update medical status in bulk from external diagnostic lab sheet</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsBulkModalOpen(false); setBulkResult(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download Banner */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div className="text-xs">
                <span className="font-bold text-gray-900 block">Need Lab Results Excel Template?</span>
                <span className="text-gray-500">Columns: Lead ID/Phone, Status (FIT/UNFIT), Lab Name, Slip No</span>
              </div>
              <button
                onClick={handleDownloadLabTemplate}
                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Template (.xlsx)</span>
              </button>
            </div>

            {/* Dropzone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer bg-gray-50/50 hover:bg-emerald-50/20 transition-colors"
            >
              <input 
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-bold text-gray-900 text-xs">
                {bulkUploading ? 'Parsing & Updating Candidates...' : 'Select Lab Excel / CSV Spreadsheet'}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Matches candidate automatically by Lead ID (`CHY-XXXX`), Mobile Phone, or Passport Number
              </div>
            </div>

            {/* Success vs Failed Breakdown Card */}
            {bulkResult && (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="font-bold text-gray-900 text-xs">Upload Processing Summary:</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-500 block">Total In Sheet</span>
                    <span className="text-base font-black text-gray-900 font-mono">{bulkResult.total}</span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-bold block">✓ Successfully Updated</span>
                    <span className="text-base font-black text-emerald-700 font-mono">{bulkResult.updatedCount}</span>
                  </div>
                  <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                    <span className="text-[10px] text-rose-700 font-bold block">✗ Failed / Missing</span>
                    <span className="text-base font-black text-rose-700 font-mono">{bulkResult.failedCount}</span>
                  </div>
                </div>

                {bulkResult.failedCount > 0 && (
                  <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl bg-white p-2">
                    <div className="text-[11px] font-bold text-rose-600 mb-1">Failed Records Breakdown:</div>
                    {bulkResult.failedRecords.map((f, i) => (
                      <div key={i} className="text-[11px] text-gray-600 py-0.5 border-b border-gray-100 last:border-0">
                        Row #{f.row} ({f.identifier}): <span className="text-rose-500 font-medium">{f.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => { setIsBulkModalOpen(false); setBulkResult(null); }}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
