import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, FileSpreadsheet, ChevronRight, CheckCircle2, AlertCircle,
  Download, ArrowRight, X, Sparkles, ShieldCheck, AlertTriangle,
  Users, RefreshCw, BarChart3, Clock, Filter, Share2,
  FileText, ClipboardPaste, Check, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { apiBulkImportLeads, apiGetDashboardSummary } from '../utils/api';

const SOURCES = [
  {
    key: 'EXCEL',
    label: 'Excel / CSV',
    sub: 'Spreadsheets & walk-in lists',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    color: { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-200' },
  },
  {
    key: 'WHATSAPP',
    label: 'WhatsApp Export',
    sub: 'Direct message inquiry batches',
    icon: <span className="text-[15px] font-black">WA</span>,
    color: { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200' },
  },
  {
    key: 'FACEBOOK',
    label: 'Meta Ads CRM',
    sub: 'Facebook lead form exports',
    icon: <span className="text-[15px] font-black">FB</span>,
    color: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-200' },
  },
  {
    key: 'AGENT_REFERRAL',
    label: 'Partner Agents',
    sub: 'Sub-agent candidate rosters',
    icon: <Users className="w-5 h-5" />,
    color: { border: 'border-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-200' },
  },
];

export default function ImportLeads() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [activeSource, setActiveSource] = useState('EXCEL');
  const [ingestMode, setIngestMode] = useState('file'); // 'file' | 'paste'
  const [uploadState, setUploadState] = useState('idle'); // 'idle' | 'parsing' | 'done'
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [batchData, setBatchData] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [importing, setImporting] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Results State (Success vs Failed breakdown after upload)
  const [uploadResult, setUploadResult] = useState(null);
  const [resultFilter, setResultFilter] = useState('all'); // 'all' | 'failed' | 'duplicates' | 'success'

  // Live Database Metrics from MongoDB
  const [liveStats, setLiveStats] = useState({
    totalLeads: 0,
    bySource: {},
    byPassport: {},
    loading: true,
  });

  // Fetch live dashboard metrics from MongoDB
  const fetchLiveMetrics = async () => {
    try {
      const res = await apiGetDashboardSummary();
      if (res?.data) {
        setLiveStats({
          totalLeads: res.data.totalLeads || 0,
          bySource: res.data.bySource || {},
          byPassport: res.data.byPassport || {},
          loading: false,
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
      setLiveStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchLiveMetrics();
  }, []);

  // Map & Validate Spreadsheets Rows flexibly
  const mapAndValidateRows = (rawRows) => {
    const seenPhones = new Set();

    return rawRows.map((row, idx) => {
      const getVal = (possibleKeys) => {
        for (const key of Object.keys(row)) {
          const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const pk of possibleKeys) {
            if (cleanKey.includes(pk)) {
              return String(row[key]).trim();
            }
          }
        }
        return '';
      };

      const name = getVal(['candidatename', 'name', 'fullname', 'candidate']);
      let rawPhone = getVal(['phone', 'mobile', 'mobilenumber', 'contact']);
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '').slice(-10);
      const phone = cleanPhone ? (cleanPhone.length >= 10 ? `+91 ${cleanPhone}` : cleanPhone) : '';
      const trade = getVal(['trade', 'skill', 'category', 'role', 'job']) || 'General Worker';
      const country = getVal(['country', 'destination', 'gcc']) || 'Saudi Arabia';
      const state = getVal(['state', 'region', 'city', 'location']) || '';
      const rawPassport = getVal(['passportstatus', 'passport', 'passportholder']);
      const passportNumber = getVal(['passportno', 'passportnumber', 'docno']);

      let status = 'valid';
      let passportStatus = 'Yes';
      let failureReason = null;

      const pLower = rawPassport.toLowerCase();
      if (pLower.includes('no') || pLower === 'n' || pLower.includes('without')) {
        passportStatus = 'No';
      } else if (pLower.includes('appl') || pLower.includes('process') || pLower.includes('pend')) {
        passportStatus = 'Applied';
      } else if (passportNumber || pLower.includes('yes') || pLower === 'y') {
        passportStatus = 'Yes';
      } else {
        passportStatus = 'Pending';
      }

      if (!name) {
        status = 'invalid';
        failureReason = 'Candidate Name is missing';
      } else if (!cleanPhone) {
        status = 'invalid';
        failureReason = 'Mobile number is missing';
      } else if (cleanPhone.length < 10) {
        status = 'invalid';
        failureReason = `Mobile number must be 10 digits (got ${cleanPhone.length})`;
      } else if (seenPhones.has(cleanPhone)) {
        status = 'invalid';
        failureReason = 'Duplicate mobile number in this sheet';
      } else {
        seenPhones.add(cleanPhone);
      }

      return {
        id: `ROW-${String(idx + 1).padStart(3, '0')}`,
        rowNumber: idx + 1,
        name,
        phone,
        rawPhone,
        cleanPhone,
        trade,
        country,
        state,
        passport: passportStatus,
        passportNumber: passportNumber || null,
        status,
        failureReason
      };
    });
  };

  // 1. Real File Upload & Parse (.xlsx, .xls, .csv)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadResult(null);
    setFileName(file.name);
    setUploadState('parsing');
    setProgress(20);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        setProgress(50);
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        setProgress(85);
        if (jsonData.length === 0) {
          throw new Error('Spreadsheet has no data rows.');
        }

        const parsedRows = mapAndValidateRows(jsonData);
        setBatchData(parsedRows);
        setProgress(100);
        setUploadState('done');
      } catch (err) {
        console.error('File parsing error', err);
        Swal.fire({
          icon: 'error',
          title: 'File Read Failed',
          text: err.message || 'Could not parse spreadsheet. Make sure it contains columns: Name, Phone, Trade.',
          confirmButtonColor: '#2563EB'
        });
        setUploadState('idle');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 2. Parse Pasted Data from Google Sheets or Excel
  const handleParsePastedData = () => {
    if (!pastedText.trim()) {
      Swal.fire({ icon: 'warning', title: 'Empty Clipboard', text: 'Please paste rows from your spreadsheet first.', confirmButtonColor: '#2563EB' });
      return;
    }

    setUploadResult(null);
    setUploadState('parsing');
    setProgress(40);
    setFileName('Pasted_Clipboard_Batch.tsv');

    setTimeout(() => {
      try {
        const lines = pastedText.trim().split('\n');
        if (lines.length === 0) throw new Error('No lines found');

        const firstRowCells = lines[0].split(/\t|,/);
        const hasHeader = firstRowCells.some(c => /name|phone|trade|mobile/i.test(c));

        let rowsToParse = [];
        if (hasHeader) {
          const headers = firstRowCells.map(h => h.trim());
          rowsToParse = lines.slice(1).map(line => {
            const cells = line.split(/\t|,/);
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = cells[i] || '';
            });
            return obj;
          });
        } else {
          rowsToParse = lines.map(line => {
            const cells = line.split(/\t|,/).map(c => c.trim());
            return {
              name: cells[0] || '',
              phone: cells[1] || '',
              trade: cells[2] || '',
              country: cells[3] || '',
              state: cells[4] || '',
              passport: cells[5] || 'Yes',
              passportNumber: cells[6] || ''
            };
          });
        }

        const parsed = mapAndValidateRows(rowsToParse);
        setBatchData(parsed);
        setProgress(100);
        setUploadState('done');
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Parsing Error', text: 'Could not parse pasted data. Ensure columns are separated by tabs or commas.', confirmButtonColor: '#2563EB' });
        setUploadState('idle');
      }
    }, 400);
  };

  // 3. Download Real Excel (.xlsx) Template with formatted sample rows
  const handleDownloadTemplate = () => {
    const data = [
      {
        'Candidate Name': 'Ramesh Kumar Yadav',
        'Mobile Number': '9876543210',
        'Trade Skill': '6G Pipe Fabricator & Welder',
        'Target Country': 'Saudi Arabia',
        'State': 'Bihar',
        'Passport Status': 'Yes',
        'Passport Number': 'P7823901'
      },
      {
        'Candidate Name': 'Vikram Singh Rawat',
        'Mobile Number': '9988776655',
        'Trade Skill': 'HVAC Technician & Chiller Operator',
        'Target Country': 'United Arab Emirates',
        'State': 'Uttar Pradesh',
        'Passport Status': 'Applied',
        'Passport Number': ''
      },
      {
        'Candidate Name': 'Sandeep Kumar',
        'Mobile Number': '9123456789',
        'Trade Skill': 'Heavy Duty Trailer Driver',
        'Target Country': 'Qatar',
        'State': 'Jharkhand',
        'Passport Status': 'No',
        'Passport Number': ''
      }
    ];

    // Create a new Excel workbook & sheet using SheetJS (XLSX)
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto set column widths for a clean professional look
    worksheet['!cols'] = [
      { wch: 24 }, // Candidate Name
      { wch: 16 }, // Mobile Number
      { wch: 32 }, // Trade Skill
      { wch: 22 }, // Target Country
      { wch: 16 }, // State
      { wch: 16 }, // Passport Status
      { wch: 18 }  // Passport Number
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates_Template');

    // Trigger true .xlsx Excel file download
    XLSX.writeFile(workbook, 'overseas_recruitment_candidate_template.xlsx');
  };

  // 4. Download Failed Records for Re-editing
  const handleDownloadFailedRecords = () => {
    if (!uploadResult?.failedRecords || uploadResult.failedRecords.length === 0) {
      Swal.fire('No Failed Records', 'There are no failed records to export.', 'info');
      return;
    }

    const headers = ['Row Number', 'Candidate Name', 'Mobile Number', 'Trade', 'Failure Reason'];
    const rows = uploadResult.failedRecords.map(f => [
      f.row,
      `"${f.candidateName || ''}"`,
      f.phone || '',
      `"${f.trade || ''}"`,
      `"${f.reason || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `failed_import_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Submit to MongoDB API with Live Breakdown
  const handleConfirmImport = async () => {
    if (batchData.length === 0) {
      Swal.fire({ icon: 'warning', title: 'No Data', text: 'No rows available to import.', confirmButtonColor: '#2563EB' });
      return;
    }

    setImporting(true);
    try {
      const payloadLeads = batchData.map(r => ({
        rowNumber: r.rowNumber,
        candidateName: r.name ? r.name.trim() : '',
        phone: r.cleanPhone || r.rawPhone || '',
        trade: r.trade || 'General Worker',
        state: r.state || '',
        city: '',
        country: r.country ? r.country.replace(/[^\w\s]/g, '').trim() : 'Saudi Arabia',
        passportNumber: r.passportNumber || null,
        isPassportHolder: r.passport === 'Yes' ? 'YES' : r.passport === 'No' ? 'NO' : 'NOT_CONFIRMED',
        source: activeSource
      }));

      const res = await apiBulkImportLeads(payloadLeads, activeSource, true);

      setUploadResult({
        total: payloadLeads.length,
        importedCount: res.importedCount || 0,
        failedCount: res.failedCount || 0,
        duplicateCount: res.duplicateCount || 0,
        failedRecords: res.failedRecords || [],
        duplicates: res.duplicates || []
      });

      fetchLiveMetrics();

      if (res.failedCount === 0) {
        Swal.fire({
          icon: 'success',
          title: 'All Leads Ingested Successfully! 🎉',
          text: `Total ${res.importedCount} candidates uploaded without any errors.`,
          confirmButtonColor: '#2563EB'
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Import Completed With Errors',
          html: `
            <div style="text-align: left; font-size: 13px; line-height: 1.6;">
              <p>✅ <b>${res.importedCount}</b> Successfully Ingested.</p>
              <p style="color: #DC2626;">❌ <b>${res.failedCount}</b> Failed / Skipped.</p>
              <p style="color: #6B7280; font-size: 11px; margin-top: 4px;">Scroll down to review the failure reasons or download the error report.</p>
            </div>
          `,
          confirmButtonColor: '#2563EB'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Import Failed',
        text: err.message || 'Database connection error during bulk ingestion.',
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setImporting(false);
    }
  };

  const removeRow = (id) => setBatchData(prev => prev.filter(r => r.id !== id));

  const displayed = filterStatus === 'all' ? batchData : batchData.filter(r => r.status === filterStatus);
  const validCount = batchData.filter(r => r.status === 'valid').length;
  const invalidCount = batchData.filter(r => r.status === 'invalid').length;
  const activeSrc = SOURCES.find(s => s.key === activeSource) || SOURCES[0];

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-semibold">Bulk Ingestion Engine</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            Excel / CSV Lead Ingest
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              Bulk Uploader
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Upload candidate spreadsheets with automatic duplicate check and detailed failure inspection.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="h-9.5 px-3.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Download Ready-to-Use Import Template (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download Excel Template (.xlsx)</span>
          </button>

          <button
            onClick={() => navigate('/leads')}
            className="h-9.5 px-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>View Leads Pool</span>
          </button>
        </div>
      </div>

      {/* 2. Source Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {SOURCES.map((src) => {
          const isSelected = activeSource === src.key;
          return (
            <div
              key={src.key}
              onClick={() => setActiveSource(src.key)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? `${src.color.bg} ${src.color.border} ring-2 ${src.color.ring} shadow-xs`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-white shadow-xs' : 'bg-gray-50'} ${src.color.text}`}>
                  {src.icon}
                </div>
                {isSelected && (
                  <CheckCircle2 className={`w-4 h-4 ${src.color.text}`} />
                )}
              </div>
              <div className="font-bold text-gray-900 text-xs">{src.label}</div>
              <div className="text-[10.5px] text-gray-500 mt-0.5 line-clamp-1">{src.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 3. POST-UPLOAD BREAKDOWN MODAL / BANNER (Success vs Failed View) */}
      {uploadResult && (
        <div className="mb-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Upload Process Breakdown</h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Processed <b>{uploadResult.total}</b> total records from <b>{fileName || 'Spreadsheet'}</b>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {uploadResult.failedCount > 0 && (
                <button
                  onClick={handleDownloadFailedRecords}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Failed Records (.csv)
                </button>
              )}
              <button
                onClick={() => setUploadResult(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                title="Dismiss breakdown"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Total Submitted</span>
              <span className="text-xl font-black text-gray-900 font-mono mt-0.5 block">{uploadResult.total}</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">✓ Successfully Uploaded</span>
              <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">{uploadResult.importedCount}</span>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">✗ Failed / Disqualified</span>
              <span className="text-xl font-black text-rose-700 font-mono mt-0.5 block">{uploadResult.failedCount}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">⚠️ Duplicates Skipped</span>
              <span className="text-xl font-black text-amber-700 font-mono mt-0.5 block">{uploadResult.duplicateCount}</span>
            </div>
          </div>

          {/* Failed Records Table */}
          {uploadResult.failedCount > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Failed Records Details ({uploadResult.failedRecords.length})
                </div>
                <span className="text-[11px] text-gray-500">Correct these records in Excel and upload again</span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-rose-50/60 sticky top-0 text-[11px] font-bold text-gray-600 uppercase border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Row #</th>
                      <th className="py-2.5 px-3">Candidate Name</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Trade</th>
                      <th className="py-2.5 px-3 text-rose-700">Failure Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {uploadResult.failedRecords.map((f, i) => (
                      <tr key={i} className="hover:bg-rose-50/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-500">#{f.row}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900">{f.candidateName}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-700">{f.phone}</td>
                        <td className="py-2.5 px-3 text-gray-600">{f.trade}</td>
                        <td className="py-2.5 px-3 font-medium text-rose-600 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{f.reason}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Main Upload Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Dropzone & Review */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5">
            
            {/* Mode Switcher (File vs Paste) */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setIngestMode('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    ingestMode === 'file' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload Spreadsheet (.xlsx / .csv)</span>
                </button>
                <button
                  onClick={() => setIngestMode('paste')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    ingestMode === 'paste' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-purple-600" />
                  <span>Quick Paste from Clipboard</span>
                </button>
              </div>

              <div className="text-[11.5px] text-gray-400 font-medium hidden sm:block">
                Auto-cleans special characters & formats +91
              </div>
            </div>

            {/* Ingest Mode 1: File Dropzone */}
            {ingestMode === 'file' && uploadState !== 'done' && (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-blue-50/20 group"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-white rounded-2xl shadow-xs border border-gray-200 flex items-center justify-center mx-auto mb-3 text-blue-600 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Click or drag your Excel file here
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Accepts <b>.xlsx, .xls, .csv</b> — parses candidate name, mobile, trade, country, and passport.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                  <Download className="w-3.5 h-3.5" /> Need template? Download above
                </div>
              </div>
            )}

            {/* Ingest Mode 2: Paste Rows Directly */}
            {ingestMode === 'paste' && uploadState !== 'done' && (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste rows copied from Google Sheets / Excel here (Tab or comma separated)...&#10;E.g.: Ramesh Kumar   9876543210   Pipe Welder   Saudi Arabia   Bihar"
                  className="w-full text-xs font-mono p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-500">
                    Supports positional columns or rows with headers.
                  </span>
                  <button
                    onClick={handleParsePastedData}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Parse Pasted Rows
                  </button>
                </div>
              </div>
            )}

            {/* Parsing State */}
            {uploadState === 'parsing' && (
              <div className="text-center py-8">
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 text-[15px]">Reading & Parsing Records...</h3>
                <p className="text-xs text-gray-500 mt-0.5">{fileName}</p>
                <div className="max-w-xs mx-auto mt-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Done: Preview & Ingestion Action */}
            {uploadState === 'done' && (
              <div className="space-y-4">
                
                {/* File Header Bar */}
                <div className={`p-4 rounded-xl ${activeSrc.color.bg} border ${activeSrc.color.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className={`w-8 h-8 ${activeSrc.color.text} shrink-0`} />
                    <div>
                      <div className="font-bold text-gray-900 text-[13.5px]">{fileName}</div>
                      <div className={`text-[11.5px] ${activeSrc.color.text} font-medium`}>
                        {batchData.length} records parsed • {validCount} valid • {invalidCount} with issues • Source: {activeSrc.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button
                      onClick={() => {
                        setUploadState('idle');
                        setBatchData([]);
                        setFileName('');
                        setPastedText('');
                      }}
                      className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Reset
                    </button>

                    <button
                      onClick={handleConfirmImport}
                      disabled={importing || batchData.length === 0}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                    >
                      {importing ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Ingesting to MongoDB...</>
                      ) : (
                        <>Start Import ({batchData.length} Leads) <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {[
                    { key: 'all', label: `All Rows (${batchData.length})` },
                    { key: 'valid', label: `✓ Valid (${validCount})` },
                    { key: 'invalid', label: `✗ Has Issues (${invalidCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilterStatus(tab.key)}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                        filterStatus === tab.key
                          ? 'bg-gray-900 text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Data Preview Table */}
                <div className="overflow-x-auto custom-scrollbar border border-gray-200 rounded-xl">
                  <table className="w-full text-left border-collapse min-w-[780px] text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-3.5 whitespace-nowrap">Row #</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Candidate Name</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Phone</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Trade</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Target Country</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Validation Status</th>
                        <th className="py-3 px-3.5 whitespace-nowrap text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {displayed.map((row) => (
                        <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-3.5 font-mono text-[11px] text-gray-400 whitespace-nowrap">#{row.rowNumber}</td>
                          <td className="py-3 px-3.5 whitespace-nowrap font-bold text-gray-900">
                            {row.name || <span className="text-rose-500 italic">Missing Name</span>}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap font-mono text-gray-700">
                            {row.phone || <span className="text-rose-500 font-bold">Missing Phone</span>}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-gray-800">{row.trade}</td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-gray-600">{row.country}</td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            {row.status === 'valid' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ Ready to Ingest
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100 text-rose-800" title={row.failureReason}>
                                ✗ {row.failureReason || 'Disqualified'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => removeRow(row.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Remove row"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Right Column: Database Health & Instructions */}
        <div className="space-y-4">
          
          {/* Live MongoDB Status Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Live Ingestion Metrics
              </span>
              <button
                onClick={fetchLiveMetrics}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${liveStats.loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 mb-3">
              <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                Candidates in Central Pool
              </div>
              <div className="text-2xl font-black text-blue-900 font-mono mt-0.5">
                {liveStats.loading ? '...' : liveStats.totalLeads}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Excel / Offline Sourced:</span>
                <span className="font-bold text-gray-800 font-mono">
                  {liveStats.bySource?.EXCEL || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">WhatsApp Exported:</span>
                <span className="font-bold text-gray-800 font-mono">
                  {liveStats.bySource?.WHATSAPP || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Meta Ads CRM:</span>
                <span className="font-bold text-gray-800 font-mono">
                  {liveStats.bySource?.FACEBOOK || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Supported Columns Guide */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Column Recognition Rules
            </h3>
            <p className="text-[11.5px] text-gray-500 leading-relaxed">
              Column names are auto-detected (case-insensitive):
            </p>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 bg-gray-50 rounded-lg">
                <b className="text-gray-900">Name:</b> <span className="text-gray-500">Name, Candidate Name, Full Name</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <b className="text-gray-900">Phone:</b> <span className="text-gray-500">Mobile, Phone, Contact Number</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <b className="text-gray-900">Trade:</b> <span className="text-gray-500">Trade, Skill, Job Role, Category</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <b className="text-gray-900">Passport:</b> <span className="text-gray-500">Passport Status, Passport Number</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
