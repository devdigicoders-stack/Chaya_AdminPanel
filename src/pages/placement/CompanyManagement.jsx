import React, { useState } from 'react';
import { 
  ChevronRight, Briefcase, Users, CheckCircle2, Clock, Search, Plus, 
  ChevronDown, X, Building2, Globe, Phone, Mail, RotateCcw, MapPin, 
  Building, ArrowRight, ShieldCheck, Check, Printer, Sparkles, AlertCircle, 
  RefreshCw, XCircle, Award, DollarSign, LayoutGrid, List, Download, 
  ExternalLink, FileText 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const initialCompanies = [
  { 
    id: 1, 
    name: 'Al Falah Group', 
    country: 'UAE', 
    city: 'Dubai',
    sector: 'Construction', 
    crNumber: 'UAE-CR-99210',
    meaId: 'FE-8812',
    contact: 'Ahmed Al Falah', 
    title: 'HR Director',
    phone: '+971-50-1234567', 
    email: 'hiring@alfalah.ae', 
    activePositions: 18, 
    placed: 42, 
    avgSalary: 'AED 2,200/mo',
    attestation: 'Valid till Nov 2025',
    status: 'Active Partner', 
    avatarBg: '#3B82F6',
    demandSummary: '10 Pipe Fitters, 5 Electricians, 3 Site Foremen. Food & Bachelor camp included.',
    embassyVerified: true
  },
  { 
    id: 2, 
    name: 'Gulf Tech Services', 
    country: 'Qatar', 
    city: 'Doha',
    sector: 'Oil & Gas', 
    crNumber: 'QTR-CR-33412',
    meaId: 'FE-7734',
    contact: 'Khalid Hassan', 
    title: 'Recruitment Lead',
    phone: '+974-55-7654321', 
    email: 'hr@gulftech.qa', 
    activePositions: 12, 
    placed: 28, 
    avgSalary: 'QAR 2,600/mo',
    attestation: 'Valid till Dec 2025',
    status: 'Active Partner', 
    avatarBg: '#8B5CF6',
    demandSummary: '8 Industrial Electricians, 4 Instrument Techs. Overtime allowance guaranteed.',
    embassyVerified: true
  },
  { 
    id: 3, 
    name: 'Arabian Construction Co. (ACC)', 
    country: 'Saudi Arabia', 
    city: 'Riyadh',
    sector: 'Construction', 
    crNumber: 'SA-CR-88201',
    meaId: 'FE-6621',
    contact: 'Omar Al Rashid', 
    title: 'VP Talent Acquisition',
    phone: '+966-50-9876543', 
    email: 'recruit@arabian.sa', 
    activePositions: 25, 
    placed: 64, 
    avgSalary: 'SAR 2,400/mo',
    attestation: 'Valid till Oct 2025',
    status: 'High Demand', 
    avatarBg: '#10B981',
    demandSummary: '15 Masons, 10 Shuttering Carpenters for Riyadh Metro Project Phase 2.',
    embassyVerified: true
  },
  { 
    id: 4, 
    name: 'Qatar Build Corp.', 
    country: 'Qatar', 
    city: 'Doha',
    sector: 'Infrastructure', 
    crNumber: 'QTR-CR-11920',
    meaId: 'FE-5541',
    contact: 'Nasser Al Khalifa', 
    title: 'HR Operations Manager',
    phone: '+974-44-1111222', 
    email: 'jobs@qatarbuild.qa', 
    activePositions: 6, 
    placed: 18, 
    avgSalary: 'QAR 2,300/mo',
    attestation: 'Renewal in Progress',
    status: 'Under Renewal', 
    avatarBg: '#F59E0B',
    demandSummary: '6 Heavy Equipment Operators. Attestation extension under Qatar MOL review.',
    embassyVerified: false
  },
  { 
    id: 5, 
    name: 'Dubai Works Group', 
    country: 'UAE', 
    city: 'Sharjah',
    sector: 'Facilities & MEP', 
    crNumber: 'UAE-CR-44321',
    meaId: 'FE-4421',
    contact: 'Rashid Al Maktoum', 
    title: 'Managing Director',
    phone: '+971-55-3334444', 
    email: 'hr@dubaiworks.ae', 
    activePositions: 20, 
    placed: 52, 
    avgSalary: 'AED 2,100/mo',
    attestation: 'Valid till Jan 2026',
    status: 'High Demand', 
    avatarBg: '#06B6D4',
    demandSummary: '10 Plumbers, 10 AC Ductmen. Free accommodation in Jebel Ali.',
    embassyVerified: true
  },
  { 
    id: 6, 
    name: 'Saudi Projects LLC', 
    country: 'Saudi Arabia', 
    city: 'Jeddah',
    sector: 'Heavy Logistics', 
    crNumber: 'SA-CR-55431',
    meaId: 'FE-3310',
    contact: 'Abdullah Al Saud', 
    title: 'Operations Head',
    phone: '+966-55-5556666', 
    email: 'recruit@saudiprojects.sa', 
    activePositions: 10, 
    placed: 31, 
    avgSalary: 'SAR 2,200/mo',
    attestation: 'Valid till Aug 2025',
    status: 'Active Partner', 
    avatarBg: '#EC4899',
    demandSummary: '10 Heavy Trailer Drivers with GCC license preferred. Trip allowances extra.',
    embassyVerified: true
  },
  { 
    id: 7, 
    name: 'Galfar Engineering', 
    country: 'Oman', 
    city: 'Muscat',
    sector: 'Infrastructure', 
    crNumber: 'OM-CR-77219',
    meaId: 'FE-2291',
    contact: 'Salim Al Harthy', 
    title: 'HR Delegate',
    phone: '+968-99-123456', 
    email: 'hiring@galfar.om', 
    activePositions: 8, 
    placed: 24, 
    avgSalary: 'OMR 180/mo',
    attestation: 'Valid till Sep 2025',
    status: 'Active Partner', 
    avatarBg: '#6366F1',
    demandSummary: '8 Steel Fixers for highway bridge projects. Oman Ministry of Labour approved.',
    embassyVerified: true
  },
  { 
    id: 8, 
    name: 'Saudi Aramco Sub-Contractors', 
    country: 'Saudi Arabia', 
    city: 'Dammam',
    sector: 'Oil & Gas', 
    crNumber: 'SA-CR-99012',
    meaId: 'FE-1188',
    contact: 'Faisal Al Ghamdi', 
    title: 'Recruitment Head',
    phone: '+966-13-8899000', 
    email: 'careers@aramcosub.sa', 
    activePositions: 15, 
    placed: 45, 
    avgSalary: 'SAR 3,200/mo',
    attestation: 'Valid till Mar 2026',
    status: 'High Demand', 
    avatarBg: '#10B981',
    demandSummary: '15 TIG & ARC 6G certified welders. Aramco plant badge provided.',
    embassyVerified: true
  },
];

const sectorPills = {
  Construction: 'bg-orange-50 text-orange-700 border border-orange-200',
  'Oil & Gas': 'bg-blue-50 text-blue-700 border border-blue-200',
  Infrastructure: 'bg-purple-50 text-purple-700 border border-purple-200',
  'Facilities & MEP': 'bg-teal-50 text-teal-700 border border-teal-200',
  'Heavy Logistics': 'bg-rose-50 text-rose-700 border border-rose-200',
};

export default function CompanyManagement() {
  const navigate = useNavigate();
  const [companiesList, setCompaniesList] = useState(initialCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [toastMsg, setToastMsg] = useState('');

  // Modals
  const [dossierModal, setDossierModal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);

  // New Company Form State
  const [newName, setNewName] = useState('');
  const [newCountry, setNewCountry] = useState('UAE');
  const [newCity, setNewCity] = useState('');
  const [newSector, setNewSector] = useState('Construction');
  const [newCr, setNewCr] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newTitle, setNewTitle] = useState('HR Manager');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPositions, setNewPositions] = useState(10);
  const [newSalary, setNewSalary] = useState('AED 2,200/mo');
  const [newDemandNotes, setNewDemandNotes] = useState('');

  // Edit State
  const [editStatus, setEditStatus] = useState('Active Partner');
  const [editPositions, setEditPositions] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const handleCreateCompany = (e) => {
    e.preventDefault();
    if (!newName || !newContact || !newEmail) return;

    const newCompany = {
      id: companiesList.length + 1,
      name: newName,
      country: newCountry,
      city: newCity || (newCountry === 'UAE' ? 'Dubai' : newCountry === 'Qatar' ? 'Doha' : 'Riyadh'),
      sector: newSector,
      crNumber: newCr || `${newCountry.slice(0, 3).toUpperCase()}-CR-${Math.floor(10000 + Math.random() * 90000)}`,
      meaId: `FE-${Math.floor(1000 + Math.random() * 9000)}`,
      contact: newContact,
      title: newTitle,
      phone: newPhone,
      email: newEmail,
      activePositions: Number(newPositions) || 0,
      placed: 0,
      avgSalary: newSalary,
      attestation: 'Valid (New Registration)',
      status: 'Active Partner',
      avatarBg: '#3B82F6',
      demandSummary: newDemandNotes || `${newPositions} open positions in ${newSector} category. Registered for final viva testing.`,
      embassyVerified: true
    };

    setCompaniesList([newCompany, ...companiesList]);
    setShowCreateModal(false);
    showToast(`Foreign Employer ${newName} registered successfully with ${newPositions} open demands!`);

    // Reset Form
    setNewName('');
    setNewCity('');
    setNewCr('');
    setNewContact('');
    setNewPhone('');
    setNewEmail('');
    setNewDemandNotes('');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editModal) return;

    setCompaniesList(prev => prev.map(c => {
      if (c.id !== editModal.id) return c;
      return {
        ...c,
        status: editStatus,
        activePositions: Number(editPositions),
        demandSummary: editNotes || c.demandSummary
      };
    }));

    showToast(`Employer status updated for ${editModal.name}: ${editStatus}`);
    setEditModal(null);
  };

  const totalCompanies = companiesList.length;
  const totalPositions = companiesList.reduce((a, b) => a + b.activePositions, 0);
  const totalPlaced = companiesList.reduce((a, b) => a + b.placed, 0);
  const activeCount = companiesList.filter(c => c.status === 'Active Partner' || c.status === 'High Demand').length;
  const highDemandCount = companiesList.filter(c => c.status === 'High Demand').length;

  const filtered = companiesList.filter(c => {
    const matchStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Active' && (c.status === 'Active Partner' || c.status === 'High Demand')) ||
      (statusFilter === 'HighDemand' && c.status === 'High Demand') ||
      (statusFilter === 'Renewal' && c.status === 'Under Renewal');

    const matchCountry = countryFilter === 'All' || c.country.toLowerCase().includes(countryFilter.toLowerCase());
    const matchSector = sectorFilter === 'All' || c.sector.toLowerCase().includes(sectorFilter.toLowerCase());

    const matchSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.crNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.meaId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchStatus && matchCountry && matchSector && matchSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active Partner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Active Partner</span>
          </span>
        );
      case 'High Demand':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>High Demand Quota</span>
          </span>
        );
      case 'Under Renewal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Under Renewal</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-12 space-y-6">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span onClick={() => navigate('/placement/viva')} className="hover:text-blue-600 cursor-pointer">Placement</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Employer Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Foreign Employer Companies & Demand Desk
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => alert('Exporting Foreign Employer Corporate Directory (PDF/Excel)...')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export Directory</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Employer</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center gap-3 text-[13px] font-medium animate-in slide-in-from-top">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}


      {/* 3. Top Metrics Row (5 Clean Cards, Zero Overflow) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Total Companies */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Corporations
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-gray-900 leading-tight">{totalCompanies}</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Registered Employers</div>
          </div>
        </div>

        {/* Active Partners */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Verified
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-emerald-600 leading-tight">{activeCount}</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Active Partners</div>
          </div>
        </div>

        {/* Open Visa Demands */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
              Open Quota
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-orange-600 leading-tight">{totalPositions}</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Open Demand Positions</div>
          </div>
        </div>

        {/* Total Placed Candidates */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
              Deployed
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-purple-600 leading-tight">{totalPlaced}</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Total Placed Candidates</div>
          </div>
        </div>

        {/* Client Retention Index */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Satisfaction
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[22px] font-bold text-indigo-600 leading-tight">96%</div>
            <div className="text-[12px] font-medium text-gray-500 mt-0.5">Employer Retention Rate</div>
          </div>
        </div>

      </div>

      {/* 4. Employer Intelligence & GCC Sector Analytics (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Country Allocation Donut Chart */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[14.5px]">Employers by Country</h3>
              <p className="text-[11.5px] text-gray-500">GCC regional corporate presence</p>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              8 Clients
            </span>
          </div>

          <div className="flex items-center gap-6 my-auto">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F3F4F6" strokeWidth="12" />
                {/* Saudi Arabia (emerald) - 37.5% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.375)} strokeLinecap="round" />
                {/* UAE (blue) - 25% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.25)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(135deg)' }} />
                {/* Qatar (purple) - 25% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.25)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(225deg)' }} />
                {/* Oman (indigo) - 12.5% */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366F1" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.125)} strokeLinecap="round" style={{ transformOrigin: '50% 50%', transform: 'rotate(315deg)' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[19px] font-extrabold text-gray-900 leading-none">4</span>
                <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">Gulf States</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                  <span>Saudi Arabia</span>
                </div>
                <span className="font-bold text-gray-900 font-mono">3 (38%)</span>
              </div>
              <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></div>
                  <span>UAE</span>
                </div>
                <span className="font-bold text-gray-900 font-mono">2 (25%)</span>
              </div>
              <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></div>
                  <span>Qatar</span>
                </div>
                <span className="font-bold text-gray-900 font-mono">2 (25%)</span>
              </div>
              <div className="flex items-center justify-between text-[12px] font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></div>
                  <span>Oman</span>
                </div>
                <span className="font-bold text-gray-900 font-mono">1 (13%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Industry Sector Demand Volume (Bar Chart) */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-[14.5px]">Demand Quota by Sector</h3>
              <p className="text-[11.5px] text-gray-500">Live positions open across trades</p>
            </div>
            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
              109 Quota
            </span>
          </div>

          <div className="flex items-end justify-between h-[120px] w-full pt-2 px-1">
            {[
              { sector: 'Civil/Const', count: 43, pct: '100%', color: 'bg-orange-500' },
              { sector: 'Oil & Gas', count: 27, pct: '63%', color: 'bg-blue-600' },
              { sector: 'MEP/HVAC', count: 20, pct: '46%', color: 'bg-teal-500' },
              { sector: 'Logistics', count: 10, pct: '23%', color: 'bg-purple-600' },
              { sector: 'Infras.', count: 14, pct: '32%', color: 'bg-indigo-600' },
            ].map((item) => (
              <div key={item.sector} className="flex flex-col items-center gap-1.5 flex-1 group">
                <span className="text-[10.5px] font-bold text-gray-800 opacity-90 group-hover:opacity-100 font-mono">
                  {item.count}
                </span>
                <div className="w-8 sm:w-9 bg-gray-100 rounded-t-lg relative flex items-end justify-center overflow-hidden h-[75px]">
                  <div
                    className={`w-full ${item.color} rounded-t-lg transition-all duration-500 group-hover:brightness-110`}
                    style={{ height: item.pct }}
                  ></div>
                </div>
                <span className="text-[11px] text-gray-600 font-semibold truncate w-full text-center">
                  {item.sector}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Legal Accreditation & Compliance Index */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-[14.5px]">Legal Accreditation Index</h3>
              <p className="text-[11.5px] text-gray-500">Government compliance benchmarks</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-3 my-auto">
            <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[11px]">
                  EMB
                </div>
                <div>
                  <div className="text-[12.5px] font-bold text-gray-900">Embassy Attested POA</div>
                  <div className="text-[11px] text-gray-500">Power of attorney & specimen contracts</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                100% Attested
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[11px]">
                  MEA
                </div>
                <div>
                  <div className="text-[12.5px] font-bold text-gray-900">E-Migrate MEA Verified</div>
                  <div className="text-[11px] text-gray-500">Foreign employer portal registration</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Active ID
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[11px]">
                  SLA
                </div>
                <div>
                  <div className="text-[12.5px] font-bold text-gray-900">Direct Employer SLA</div>
                  <div className="text-[11px] text-gray-500">Free medical, visa & return tickets</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Guaranteed
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. Filter Toolbar & View Mode Switcher */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
          {[
            { key: 'All', label: 'All Employers', count: totalCompanies },
            { key: 'Active', label: 'Active Partners', count: activeCount },
            { key: 'HighDemand', label: 'High Demand Quota', count: highDemandCount },
            { key: 'Renewal', label: 'Under Renewal', count: companiesList.filter(c => c.status === 'Under Renewal').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full ${statusFilter === tab.key ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-gray-200/70 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Dropdowns, Search, and Grid/Table Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Country Dropdown */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="All">All Countries</option>
            <option value="UAE">UAE</option>
            <option value="Qatar">Qatar</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
            <option value="Oman">Oman</option>
          </select>

          {/* Sector Dropdown */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] bg-white text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="All">All Sectors</option>
            <option value="Construction">Construction</option>
            <option value="Oil & Gas">Oil & Gas</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Facilities">Facilities & MEP</option>
            <option value="Logistics">Heavy Logistics</option>
          </select>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search company, CR, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>

          {(searchTerm || statusFilter !== 'All' || countryFilter !== 'All' || sectorFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setCountryFilter('All');
                setSectorFilter('All');
              }}
              className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[12px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 ml-auto sm:ml-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-900'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-900'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* 6. Display Area (Grid View or Table View) */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <div className="text-[14px] font-bold text-gray-700">No overseas employer companies found</div>
          <div className="text-[12.5px] text-gray-400 mt-1">Try resetting your filters or search keywords.</div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Modern Corporate Cards) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(company => (
            <div 
              key={company.id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Avatar & Company Info */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div 
                    className="w-11 h-11 rounded-xl text-white text-[16px] font-extrabold flex items-center justify-center shrink-0 shadow-xs mt-0.5"
                    style={{ backgroundColor: company.avatarBg }}
                  >
                    {company.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 text-[15px] leading-snug group-hover:text-blue-600 transition-colors">
                      {company.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-gray-700 font-medium whitespace-nowrap">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{company.city}, {company.country}</span>
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="font-mono text-[11px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100 whitespace-nowrap">
                        {company.crNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badges Row: Clean Dedicated Row with Sector & Status */}
                <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-gray-100">
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${sectorPills[company.sector] || 'bg-gray-50 text-gray-600 border border-gray-200'} whitespace-nowrap`}>
                    {company.sector}
                  </span>
                  <div className="shrink-0">
                    {getStatusBadge(company.status)}
                  </div>
                </div>

                {/* Demand Summary Pill */}
                <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-[12px] text-gray-700 mb-4 line-clamp-2">
                  <span className="font-semibold text-gray-900">Demand: </span>
                  {company.demandSummary}
                </div>

                {/* HR & Contact Grid */}
                <div className="border-t border-gray-50 pt-3 space-y-1.5 text-[12.5px]">
                  <div className="flex items-center justify-between text-gray-700 gap-2">
                    <span className="text-gray-400 text-[11.5px] flex items-center gap-1.5 shrink-0">
                      <Users className="w-3.5 h-3.5 text-gray-400" /> Delegate:
                    </span>
                    <span className="font-medium text-gray-900 truncate text-right" title={`${company.contact} (${company.title})`}>
                      {company.contact} ({company.title})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700 gap-2">
                    <span className="text-gray-400 text-[11.5px] flex items-center gap-1.5 shrink-0">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone:
                    </span>
                    <a href={`tel:${company.phone}`} className="font-mono text-blue-600 hover:underline whitespace-nowrap">{company.phone}</a>
                  </div>
                  <div className="flex items-center justify-between text-gray-700 gap-2">
                    <span className="text-gray-400 text-[11.5px] flex items-center gap-1.5 shrink-0">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> Email:
                    </span>
                    <a href={`mailto:${company.email}`} className="text-gray-800 hover:text-blue-600 truncate max-w-[180px]">{company.email}</a>
                  </div>
                </div>

                {/* Quota & Placed Progress Box */}
                <div className="border-t border-gray-100 mt-4 pt-4 grid grid-cols-2 gap-3">
                  <div className="bg-orange-50/80 border border-orange-100 rounded-xl p-3 text-center">
                    <div className="text-[20px] font-bold text-orange-600 leading-none">{company.activePositions}</div>
                    <div className="text-[11px] font-medium text-orange-800 mt-1">Open Visa Quota</div>
                  </div>
                  <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 text-center">
                    <div className="text-[20px] font-bold text-emerald-600 leading-none">{company.placed}</div>
                    <div className="text-[11px] font-medium text-emerald-800 mt-1">Total Placed</div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button 
                  onClick={() => setDossierModal(company)}
                  className="flex-1 py-2 text-[12.5px] font-semibold text-blue-600 bg-blue-50/70 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Demand Dossier</span>
                </button>
                <button 
                  onClick={() => {
                    setEditModal(company);
                    setEditStatus(company.status);
                    setEditPositions(company.activePositions);
                    setEditNotes(company.demandSummary);
                  }}
                  className="px-3.5 py-2 text-[12.5px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button 
                  onClick={() => navigate('/placement/schedule')}
                  className="px-3 py-2 text-[12px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer whitespace-nowrap"
                  title="Schedule Client Final Viva"
                >
                  Viva
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW (Master Full-Width Table) */
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse min-w-[1240px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-[22%] min-w-[220px]">Employer & CR Number</th>
                  <th className="py-3.5 px-4 w-[16%] min-w-[160px]">Country & Sector</th>
                  <th className="py-3.5 px-4 w-[20%] min-w-[200px]">HR Delegate & Contact</th>
                  <th className="py-3.5 px-4 w-[12%] min-w-[120px] text-center">Open Demand</th>
                  <th className="py-3.5 px-4 w-[12%] min-w-[120px] text-center">Placed</th>
                  <th className="py-3.5 px-4 w-[14%] min-w-[150px] text-center">Accreditation</th>
                  <th className="py-3.5 px-4 w-[16%] min-w-[180px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px]">
                {filtered.map(row => (
                  <tr key={row.id} className="hover:bg-blue-50/20 transition-colors">
                    
                    {/* Employer */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl text-white text-[14px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: row.avatarBg }}
                        >
                          {row.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 text-[14px] whitespace-nowrap">
                            {row.name}
                          </div>
                          <div className="text-[11.5px] text-gray-500 font-mono mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-purple-700 font-medium">{row.crNumber}</span>
                            <span className="text-gray-300">•</span>
                            <span>MEA: {row.meaId}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Country & Sector */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[13px] font-semibold text-gray-900">
                        <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{row.city}, {row.country}</span>
                      </div>
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${sectorPills[row.sector] || 'bg-gray-50 text-gray-600'}`}>
                          {row.sector}
                        </span>
                      </div>
                    </td>

                    {/* HR Contact */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 text-[13px]">{row.contact}</div>
                      <div className="text-[11.5px] text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>{row.phone}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-blue-600 font-sans">{row.email}</span>
                      </div>
                    </td>

                    {/* Open Demand */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 rounded-full text-[13px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 font-mono">
                        {row.activePositions}
                      </span>
                    </td>

                    {/* Placed */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 rounded-full text-[13px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 font-mono">
                        {row.placed}
                      </span>
                    </td>

                    {/* Accreditation Status */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2 whitespace-nowrap">
                        <button
                          onClick={() => setDossierModal(row)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditModal(row);
                            setEditStatus(row.status);
                            setEditPositions(row.activePositions);
                            setEditNotes(row.demandSummary);
                          }}
                          className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Company Profile & Attested Demand Letter Dossier */}
      {dossierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-300" />
                <h3 className="font-bold text-[15px]">Foreign Employer Accreditation & Demand Letter Dossier</h3>
              </div>
              <button onClick={() => setDossierModal(null)} className="text-gray-300 hover:text-white text-xl font-bold cursor-pointer">×</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-[13px]">
              
              {/* Employer Profile Certificate Sheet */}
              <div className="p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-xs space-y-4">
                
                {/* Header Letterhead */}
                <div className="flex items-start justify-between pb-4 border-b-2 border-gray-900">
                  <div>
                    <div className="text-[19px] font-extrabold text-gray-900 tracking-tight">{dossierModal.name.toUpperCase()}</div>
                    <div className="text-[12px] text-gray-500 font-medium">Headquarters: {dossierModal.city}, {dossierModal.country} • Licensed Gulf Corporation</div>
                    <div className="text-[11.5px] text-gray-400 font-mono mt-0.5">CR Number: {dossierModal.crNumber} • MEA ID: {dossierModal.meaId}</div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(dossierModal.status)}
                    <div className="text-[11.5px] text-emerald-800 font-bold mt-1 font-mono">{dossierModal.attestation}</div>
                  </div>
                </div>

                {/* Legal Accreditation Grid */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                    <div>
                      <span className="text-gray-500">Authorized Delegate / HR:</span>
                      <div className="font-bold text-gray-900">{dossierModal.contact} ({dossierModal.title})</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Direct Contact & WhatsApp:</span>
                      <div className="font-bold text-gray-900 font-mono">{dossierModal.phone}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Corporate Email:</span>
                      <div className="font-bold text-blue-700">{dossierModal.email}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Average Salary Bracket:</span>
                      <div className="font-bold text-emerald-700 font-mono">{dossierModal.avgSalary}</div>
                    </div>
                  </div>
                </div>

                {/* Demand Letter Summary & Active Quota */}
                <div>
                  <h4 className="font-bold text-gray-900 text-[13.5px] mb-2 pb-1 border-b border-gray-100 flex items-center justify-between">
                    <span>Verified Demand Letter & Trade Quota</span>
                    <span className="text-orange-700 font-mono font-bold">{dossierModal.activePositions} Open Visas</span>
                  </h4>
                  <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-xl text-[12.5px] text-gray-800 leading-relaxed">
                    {dossierModal.demandSummary}
                  </div>
                </div>

                {/* Mandated Employer Provisions */}
                <div className="grid grid-cols-3 gap-3 text-[12px] pt-1">
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-center">
                    <span className="text-gray-500 text-[11px]">Accommodation:</span>
                    <div className="font-bold text-gray-900 mt-0.5">Free Company Camp</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-center">
                    <span className="text-gray-500 text-[11px]">Medical Insurance:</span>
                    <div className="font-bold text-emerald-700 mt-0.5">MOH Approved</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-center">
                    <span className="text-gray-500 text-[11px]">Air Ticket:</span>
                    <div className="font-bold text-purple-700 mt-0.5">Return (2 Years)</div>
                  </div>
                </div>

                {/* Signatures & Seal Box */}
                <div className="pt-4 border-t-2 border-gray-200 grid grid-cols-2 gap-6 text-[11.5px]">
                  <div className="text-center p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                    <div className="text-gray-400 italic mb-3">Chamber of Commerce Corporate Seal</div>
                    <div className="font-bold text-gray-900 font-serif text-[13px]">{dossierModal.name}</div>
                    <div className="text-gray-500 text-[10.5px]">CR: {dossierModal.crNumber}</div>
                  </div>

                  <div className="text-center p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                    <div className="text-gray-400 italic mb-3">Embassy Attestation Seal</div>
                    <div className="font-bold text-blue-800 font-serif text-[13px]">Consular Labor Office</div>
                    <div className="text-gray-500 text-[10.5px]">e-Migrate MEA Verified</div>
                  </div>
                </div>

              </div>

            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => alert('Printing official demand letter dossier...')}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-[13px] font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Demand Letter Dossier</span>
              </button>

              <button
                type="button"
                onClick={() => setDossierModal(null)}
                className="px-5 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-600 hover:bg-gray-100 cursor-pointer font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Register New Foreign Employer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-[15px]">Register New Foreign Employer</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleCreateCompany} className="p-6 overflow-y-auto space-y-4 text-[13px]">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Falah Group"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Country *</label>
                  <select
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option>UAE</option>
                    <option>Saudi Arabia</option>
                    <option>Qatar</option>
                    <option>Oman</option>
                    <option>Kuwait</option>
                    <option>Bahrain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">City / Base HQ</label>
                  <input
                    type="text"
                    placeholder="e.g. Dubai"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Industry Sector</label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option>Construction</option>
                    <option>Oil & Gas</option>
                    <option>Infrastructure</option>
                    <option>Facilities & MEP</option>
                    <option>Heavy Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">CR / Registration No.</label>
                  <input
                    type="text"
                    placeholder="e.g. UAE-CR-99210"
                    value={newCr}
                    onChange={(e) => setNewCr(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Authorized Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmed Al Falah"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Designation / Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+971-50-..."
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="hiring@company.ae"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Active Visa Quota *</label>
                  <input
                    type="number"
                    min="1"
                    value={newPositions}
                    onChange={(e) => setNewPositions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Avg Monthly Salary</label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-blue-500 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Demand Letter Summary & Special Terms</label>
                <textarea
                  rows={2}
                  value={newDemandNotes}
                  onChange={(e) => setNewDemandNotes(e.target.value)}
                  placeholder="e.g. 10 Pipe Fitters, 5 Electricians. Company mess provided."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold cursor-pointer shadow-sm"
                >
                  Register Employer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit / Update Employer Status Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/70">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-[15px]">Update Employer Demand & Status</h3>
              </div>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-[13px]">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div className="font-bold text-gray-900">{editModal.name}</div>
                <div className="text-gray-500 font-mono text-[11.5px]">CR: {editModal.crNumber} • {editModal.city}, {editModal.country}</div>
                <div className="text-blue-700 text-[12px] mt-1 font-medium">Delegate: {editModal.contact} ({editModal.phone})</div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Partnership Status *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                >
                  <option value="Active Partner">Active Partner (Approved Demand)</option>
                  <option value="High Demand">High Demand Quota (Urgent Mobilization)</option>
                  <option value="Under Renewal">Under Renewal (Awaiting Embassy Attestation)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Active Visa Quota</label>
                <input
                  type="number"
                  min="0"
                  value={editPositions}
                  onChange={(e) => setEditPositions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Demand Notes & Scope</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Update trades and numbers required..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
