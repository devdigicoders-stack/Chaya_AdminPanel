import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, FileSpreadsheet, ChevronRight, CheckCircle2, AlertCircle,
  Download, ArrowRight, X, Sparkles, ShieldCheck, AlertTriangle,
  Users, RefreshCw, BarChart3, Clock, Filter, Share2,
  FileText, ClipboardPaste
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
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      const phone = cleanPhone ? (cleanPhone.length > 10 ? `+${cleanPhone}` : `+91 ${cleanPhone}`) : '';
      const trade = getVal(['trade', 'skill', 'category', 'role', 'job']) || 'General Worker';
      const country = getVal(['country', 'destination', 'gcc']) || 'Saudi Arabia';
      const state = getVal(['state', 'region', 'city', 'location']) || '';
      const rawPassport = getVal(['passportstatus', 'passport', 'passportholder']);
      const passportNumber = getVal(['passportno', 'passportnumber', 'docno']);

      let status = 'valid';
      let passportStatus = 'Yes';

      const pLower = rawPassport.toLowerCase();
      if (pLower.includes('no') || pLower === 'n' || pLower.includes('without')) {
        passportStatus = 'No';
        status = 'invalid';
      } else if (pLower.includes('appl') || pLower.includes('process') || pLower.includes('pend')) {
        passportStatus = 'Applied';
        status = 'pending';
      } else if (passportNumber || pLower.includes('yes') || pLower === 'y') {
        passportStatus = 'Yes';
        status = 'valid';
      } else {
        passportStatus = 'Pending';
        status = 'pending';
      }

      if (!name || !cleanPhone || cleanPhone.length < 10) {
        status = 'invalid';
      }

      const isDuplicateInBatch = cleanPhone && seenPhones.has(cleanPhone);
      if (cleanPhone) seenPhones.add(cleanPhone);

      return {
        id: `ROW-${String(idx + 1).padStart(3, '0')}`,
        name,
        phone,
        trade,
        country,
        state,
        passport: passportStatus,
        passportNumber: passportNumber || null,
        status: isDuplicateInBatch ? 'invalid' : status,
        duplicateNote: isDuplicateInBatch ? 'Duplicate phone in sheet' : null
      };
    });
  };

  // 1. Real File Upload & Parse (.xlsx, .xls, .csv)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setUploadState('parsing');
    setProgress(40);
    setFileName('Pasted_Clipboard_Batch.tsv');

    setTimeout(() => {
      try {
        const lines = pastedText.trim().split('\n');
        if (lines.length === 0) throw new Error('No lines found');

        // Check if first line contains header or directly data
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
          // Default positional columns: Name, Phone, Trade, Country, State
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

  // 3. Download Real CSV Template
  const handleDownloadTemplate = () => {
    const headers = ['Candidate Name', 'Mobile Number', 'Trade Skill', 'Target Country', 'State', 'Passport Status', 'Passport Number'];
    const sampleRows = [
      ['Ramesh Kumar Yadav', '9876543210', '6G Pipe Fabricator & Welder', 'Saudi Arabia', 'Bihar', 'Yes', 'P7823901'],
      ['Vikram Singh Rawat', '9988776655', 'HVAC Technician & Chiller Operator', 'United Arab Emirates', 'Uttar Pradesh', 'Applied', ''],
      ['Sandeep Kumar', '9123456789', 'Heavy Duty Trailer Driver', 'Qatar', 'Jharkhand', 'No', '']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'overseas_recruitment_candidate_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Submit to MongoDB API
  const handleConfirmImport = async () => {
    const validRows = batchData.filter(r => r.name && r.phone);
    if (validRows.length === 0) {
      Swal.fire({ icon: 'warning', title: 'No Valid Candidates', text: 'No rows have both candidate name and valid phone number.', confirmButtonColor: '#2563EB' });
      return;
    }

    setImporting(true);
    try {
      const formatted = validRows.map(r => ({
        candidateName: r.name.trim(),
        phone: r.phone.replace(/[^0-9]/g, '').slice(-10),
        trade: r.trade || 'General Worker',
        state: r.state || '',
        city: '',
        country: r.country ? r.country.replace(/[^\w\s]/g, '').trim() : 'Saudi Arabia',
        passportNumber: r.passportNumber || null,
        isPassportHolder: r.passport === 'Yes' ? 'YES' : r.passport === 'No' ? 'NO' : 'NOT_CONFIRMED',
        source: activeSource
      }));

      const res = await apiBulkImportLeads(formatted, activeSource, true);

      await Swal.fire({
        title: 'Bulk Ingestion Completed!',
        html: `
          <div style="text-align: left; font-size: 13.5px; line-height: 1.6;">
            <p>✅ <b>${res.importedCount}</b> candidates ingested into the Live Central Pool.</p>
            <p style="color: #6B7280; font-size: 12px; margin-top: 4px;">⚠️ <b>${res.duplicateCount}</b> duplicate phone records automatically skipped.</p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#2563EB',
        confirmButtonText: 'View in Leads Pool'
      });

      fetchLiveMetrics();
      navigate('/leads');
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
  const pendingCount = batchData.filter(r => r.status === 'pending').length;
  const invalidCount = batchData.filter(r => r.status === 'invalid').length;
  const activeSrc = SOURCES.find(s => s.key === activeSource) || SOURCES[0];

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">Leads</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Bulk Ingest</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Bulk Ingest Candidate Leads
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/leads/add')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Single Lead</span>
          </button>
          <button
            onClick={() => navigate('/leads')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* 2. Source Channel Selection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {SOURCES.map((src) => {
          const isActive = activeSource === src.key;
          return (
            <div
              key={src.key}
              onClick={() => {
                setActiveSource(src.key);
                setUploadState('idle');
                setBatchData([]);
                setFileName('');
              }}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white ${
                isActive
                  ? `${src.color.border} shadow-sm ring-2 ${src.color.ring}`
                  : 'border-gray-200/80 hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl ${src.color.bg} ${src.color.text} flex items-center justify-center font-bold mb-3`}>
                {src.icon}
              </div>
              <div className="font-bold text-gray-900 text-[13px]">{src.label}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{src.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Ingestion Layout */}
      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── LEFT: File Dropzone / Paste Area & Preview Table ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Mode Switch Tabs */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIngestMode('file')}
                  className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    ingestMode === 'file'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Spreadsheet (.xlsx / .csv)</span>
                </button>

                <button
                  onClick={() => setIngestMode('paste')}
                  className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    ingestMode === 'paste'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>Quick Clipboard Paste</span>
                </button>
              </div>

              {/* Download Template Quick Link */}
              <button
                onClick={handleDownloadTemplate}
                className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download .CSV Template</span>
              </button>
            </div>

            {/* Mode 1: Real File Upload */}
            {ingestMode === 'file' && uploadState === 'idle' && (
              <div className="text-center py-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed ${activeSrc.color.border} rounded-2xl p-8 cursor-pointer hover:bg-gray-50/80 transition-colors group max-w-xl mx-auto`}
                >
                  <FileSpreadsheet className={`w-12 h-12 mx-auto mb-3.5 ${activeSrc.color.text} opacity-70 group-hover:scale-105 transition-all`} />
                  <h3 className="font-bold text-gray-900 text-[15px]">
                    Drag & Drop your {activeSrc.label} Spreadsheet
                  </h3>
                  <p className="text-[12.5px] text-gray-500 mt-1">
                    Accepts <b>.xlsx, .xls, .csv</b> — parses candidate name, mobile, trade, country, and passport.
                  </p>
                  <span className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-bold rounded-xl shadow-xs transition-colors">
                    Browse File on Device
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="mt-4 sm:hidden">
                  <button
                    onClick={handleDownloadTemplate}
                    className="text-[12px] font-bold text-emerald-600 underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .CSV Template
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Paste Clipboard Text */}
            {ingestMode === 'paste' && uploadState === 'idle' && (
              <div className="space-y-3 max-w-xl mx-auto py-2">
                <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wide">
                  Paste rows directly from Excel / Google Sheets:
                </label>
                <textarea
                  rows={5}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Ramesh Yadav\t9876543210\tPipe Welder\tSaudi Arabia\tBihar\tYes\nArjun Rawat\t8765432109\tElectrician\tUAE\tUP\tYes`}
                  className="w-full px-3.5 py-3 font-mono text-[12px] bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] text-gray-400">
                    Format: Name [Tab] Mobile [Tab] Trade [Tab] Country [Tab] State
                  </span>
                  <button
                    onClick={handleParsePastedData}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12.5px] font-bold cursor-pointer transition-colors shadow-xs"
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
                <p className="text-[12px] text-gray-500 mt-0.5">{fileName}</p>
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

            {/* Done: Preview & Action Header */}
            {uploadState === 'done' && (
              <div className="space-y-4">
                
                {/* File Header Bar */}
                <div className={`p-4 rounded-xl ${activeSrc.color.bg} border ${activeSrc.color.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className={`w-8 h-8 ${activeSrc.color.text} shrink-0`} />
                    <div>
                      <div className="font-bold text-gray-900 text-[13.5px]">{fileName}</div>
                      <div className={`text-[11.5px] ${activeSrc.color.text} font-medium`}>
                        {batchData.length} records parsed • {validCount} qualified for pool • Source: {activeSrc.label}
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
                      className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-xl text-[12px] font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Reset
                    </button>

                    <button
                      onClick={handleConfirmImport}
                      disabled={importing || validCount === 0}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                    >
                      {importing ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Ingesting to MongoDB...</>
                      ) : (
                        <>Ingest {validCount} Qualified Leads <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 flex-wrap text-[12px]">
                  {[
                    { key: 'all', label: `All Rows (${batchData.length})` },
                    { key: 'valid', label: `✓ Qualified (${validCount})` },
                    { key: 'pending', label: `⏳ Pending (${pendingCount})` },
                    { key: 'invalid', label: `✗ Disqualified (${invalidCount})` },
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
                  <table className="w-full text-left border-collapse min-w-[780px] text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-3.5 whitespace-nowrap">ID</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Candidate Name</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Phone</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Trade</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Target Country</th>
                        <th className="py-3 px-3.5 whitespace-nowrap">Passport</th>
                        <th className="py-3 px-3.5 whitespace-nowrap text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {displayed.map((row) => (
                        <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-3.5 font-mono text-[11px] text-gray-400 whitespace-nowrap">{row.id}</td>
                          <td className="py-3 px-3.5 whitespace-nowrap font-bold text-gray-900">
                            {row.name || <span className="text-rose-500 italic">Missing Name</span>}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap font-mono text-gray-700">
                            {row.phone || <span className="text-rose-500 font-bold">Missing Phone</span>}
                            {row.duplicateNote && (
                              <span className="block text-[10px] text-rose-600 font-bold">{row.duplicateNote}</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-gray-800">{row.trade}</td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-gray-600">{row.country}</td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                              row.status === 'valid' ? 'bg-emerald-100 text-emerald-800' :
                              row.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {row.passport === 'Yes' ? '✓ Valid Holder' : row.passport === 'No' ? '✗ No Passport' : '⏳ Applied / Pending'}
                            </span>
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

          {/* Download Official CSV Template */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[14px] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Download Ready-to-Use Import Template (.csv)
              </h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Pre-formatted CSV template with candidate columns (Name, Mobile, Trade, Country, State, Passport Status).
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12.5px] font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>

        </div>

        {/* ── RIGHT: Live Database Metrics & Helper ── */}
        <div className="w-full xl:w-[320px] shrink-0 space-y-4">

          {/* Live Ingestion Metrics from MongoDB Atlas */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-[13.5px] flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Live Pool Metrics
              </h3>
              <button
                onClick={fetchLiveMetrics}
                className="text-[11px] text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                title="Refresh counts"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${liveStats.loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11.5px] mb-1">
                  <span className="text-gray-500 font-medium">WhatsApp Leads</span>
                  <span className="font-bold text-gray-900">{liveStats.bySource['WHATSAPP'] || 0}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${liveStats.totalLeads > 0 ? ((liveStats.bySource['WHATSAPP'] || 0) / liveStats.totalLeads) * 100 : 0}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11.5px] mb-1">
                  <span className="text-gray-500 font-medium">Excel Bulk Ingested</span>
                  <span className="font-bold text-gray-900">{liveStats.bySource['EXCEL'] || 0}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${liveStats.totalLeads > 0 ? ((liveStats.bySource['EXCEL'] || 0) / liveStats.totalLeads) * 100 : 0}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11.5px] mb-1">
                  <span className="text-gray-500 font-medium">Meta Ads Campaign</span>
                  <span className="font-bold text-gray-900">{liveStats.bySource['FACEBOOK'] || 0}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${liveStats.totalLeads > 0 ? ((liveStats.bySource['FACEBOOK'] || 0) / liveStats.totalLeads) * 100 : 0}%` }} 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11.5px] mb-1">
                  <span className="text-gray-500 font-medium">Partner Agent Referrals</span>
                  <span className="font-bold text-gray-900">{liveStats.bySource['AGENT_REFERRAL'] || 0}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full" 
                    style={{ width: `${liveStats.totalLeads > 0 ? ((liveStats.bySource['AGENT_REFERRAL'] || 0) / liveStats.totalLeads) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[12px]">
              <span className="text-gray-500">Total in MongoDB:</span>
              <span className="font-black text-gray-900 font-mono text-[14px]">{liveStats.totalLeads} Leads</span>
            </div>
          </div>

          {/* Supported Columns Guide */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-gray-900 text-[13px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Column Recognition Guide
            </h3>
            <p className="text-[11.5px] text-gray-500 leading-relaxed">
              The engine automatically maps columns irrespective of exact naming case:
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

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4">
            <div className="space-y-1.5">
              <button
                onClick={() => navigate('/leads')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 text-[12.5px] font-semibold text-gray-700 cursor-pointer"
              >
                <span>View All Leads Pool</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => navigate('/leads/sources')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 text-[12.5px] font-semibold text-gray-700 cursor-pointer"
              >
                <span>Sourcing Channels Analytics</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => navigate('/staff-head/assign')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 text-[12.5px] font-semibold text-gray-700 cursor-pointer"
              >
                <span>Staff Head Lead Distribution</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
