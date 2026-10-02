import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, Plane, Calendar, Search, 
  X, CheckCircle2, 
  Check, FileText, Globe, Award, 
  RefreshCw, AlertCircle, Loader2, Edit3, Eye, Printer, Navigation,
  Ticket} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetLeads, apiUpdatePlacementDeployment } from '../../utils/api';

const AIRLINES = [
  'Emirates Airlines',
  'Air India Express',
  'IndiGo',
  'Qatar Airways',
  'Flydubai',
  'Gulf Air',
  'Saudia',
  'Oman Air',
  'Air Arabia'
];

export default function JoiningUpdate() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [viewLead, setViewLead] = useState(null);
  const [editFlightLead, setEditFlightLead] = useState(null);
  const [flightForm, setFlightForm] = useState({
    airline: 'Emirates Airlines',
    flightNumber: 'EK 511',
    pnr: 'EK79201',
    sector: 'DEL - DXB',
    departureAirport: 'Indira Gandhi Int Airport (DEL)',
    arrivalAirport: 'Dubai Int Airport (DXB)',
    flightDate: '',
    flightTime: '09:45 AM',
    joiningDate: '',
    poeStatus: 'POE Cleared (Emigration OK)',
    baggage: '30 KG Check-in + 7 KG Cabin',
    pickupOfficer: 'Mr. Tariq (HR Officer)',
    campLocation: 'Jebel Ali Camp 4, Dubai',
    status: 'FLIGHT_BOOKED',
    notes: 'All airport documents and boarding pass shared with candidate.'
  });

  // Fetch leads
  const fetchDeployments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGetLeads({ placementDesk: 'true' });
      if (res?.success && res.data) {
        setLeads(res.data);
      } else {
        const fallback = await apiGetLeads({ stage: 'ALL' });
        if (fallback?.success && fallback.data) {
          const filtered = fallback.data.filter(l => 
            l.placementDetails?.deployment?.deployId || 
            l.placementDetails?.offerLetter?.status === 'ACCEPTED' ||
            l.currentStage === 'VIVA_PLACEMENT' ||
            l.currentStage === 'COMPLETED'
          );
          setLeads(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to load deployment leads', err);
      setError(err.message || 'Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  // Save / Update Flight & Deployment
  const handleSaveFlight = async (e) => {
    e.preventDefault();
    if (!editFlightLead) return;

    setActionLoadingId(editFlightLead._id);
    try {
      const res = await apiUpdatePlacementDeployment(editFlightLead._id, flightForm);
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Deployment Saved!',
          text: `Flight & deployment updated for ${editFlightLead.candidateName}.`,
          confirmButtonColor: '#059669',
          timer: 2000
        });
        setEditFlightLead(null);
        fetchDeployments();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message || 'Could not update flight.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Confirm Joining On-Site
  const handleConfirmJoining = async (lead) => {
    const confirm = await Swal.fire({
      title: 'Confirm On-Site Joining?',
      text: `Confirm that candidate ${lead.candidateName} has reported to work site overseas? This officially completes their 24-step CRM lifecycle.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm Joining',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#059669'
    });

    if (!confirm.isConfirmed) return;

    setActionLoadingId(lead._id);
    try {
      const existing = lead.placementDetails?.deployment || {};
      const res = await apiUpdatePlacementDeployment(lead._id, {
        ...existing,
        status: 'JOINED_ON_SITE',
        joiningDate: new Date()
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Candidate Successfully Joined!',
          text: `${lead.candidateName} reported on site. CRM lifecycle marked as COMPLETED.`,
          confirmButtonColor: '#059669',
          timer: 2500
        });
        fetchDeployments();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Confirmation Failed', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const dep = l.placementDetails?.deployment || {};
      const status = dep.status || (l.currentStage === 'COMPLETED' ? 'JOINED_ON_SITE' : 'FLIGHT_BOOKED');

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (l.candidateName || '').toLowerCase();
        const passport = (l.passportNumber || '').toLowerCase();
        const pnr = (dep.pnr || '').toLowerCase();
        const flightNo = (dep.flightNumber || '').toLowerCase();
        const airline = (dep.airline || '').toLowerCase();
        const company = (dep.company || l.placementDetails?.offerLetter?.company || '').toLowerCase();

        if (!name.includes(q) && !passport.includes(q) && !pnr.includes(q) && !flightNo.includes(q) && !airline.includes(q) && !company.includes(q)) {
          return false;
        }
      }

      if (statusFilter !== 'ALL' && status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [leads, searchTerm, statusFilter]);

  // Dynamic KPI Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    let joined = 0;
    let booked = 0;
    let transit = 0;

    leads.forEach(l => {
      const st = l.placementDetails?.deployment?.status;
      if (st === 'JOINED_ON_SITE' || l.currentStage === 'COMPLETED') joined++;
      else if (st === 'IN_TRANSIT') transit++;
      else booked++;
    });

    return { total, joined, booked, transit };
  }, [leads]);

  return (
    <div className="flex flex-col flex-1 pb-16 font-sans">
      
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span onClick={() => navigate('/leads')} className="hover:text-blue-600 cursor-pointer">CRM</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500">09. Viva & Placement</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-900 font-medium">Flight & Joining</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Flight Ticketing & On-Site Deployment Desk
          </h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => {
              if (leads.length > 0) {
                const target = leads[0];
                setEditFlightLead(target);
                setFlightForm({
                  airline: 'Emirates Airlines',
                  flightNumber: 'EK 511',
                  pnr: `EK${Math.floor(10000 + Math.random() * 89999)}`,
                  sector: 'DEL - DXB',
                  departureAirport: 'Indira Gandhi Int Airport (DEL)',
                  arrivalAirport: 'Dubai Int Airport (DXB)',
                  flightDate: new Date().toISOString().substring(0, 10),
                  flightTime: '10:15 AM',
                  joiningDate: '',
                  poeStatus: 'POE Cleared (Emigration OK)',
                  baggage: '30 KG Check-in + 7 KG Cabin',
                  pickupOfficer: 'Mr. Tariq (HR Officer)',
                  campLocation: 'Jebel Ali Camp 4, Dubai',
                  status: 'FLIGHT_BOOKED',
                  notes: 'Tickets issued and candidate briefing completed.'
                });
              }
            }}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            title="Book Flight Ticket / Schedule Departure"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Book Flight</span>
          </button>

          <button 
            onClick={() => navigate('/placement/schedule')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Schedule Viva Date"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Schedule Viva</span>
          </button>

          <button 
            onClick={() => navigate('/placement/results')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Viva Results & Scorecards"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Scorecards</span>
          </button>

          <button 
            onClick={() => navigate('/placement/offer')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Offer Letters"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Offer Letters</span>
          </button>

          <button
            onClick={fetchDeployments}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5 sm:mb-6">
        
        {/* Total Candidates in Deployment */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider">Deployment Pipeline</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-gray-900 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.total}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Deployment pool</div>
          </div>
        </div>

        {/* Flight Booked */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-blue-700">Flight Booked</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-blue-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.booked}
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">Ticket confirmed</div>
          </div>
        </div>

        {/* In Transit */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-amber-700">In Transit</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-amber-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.transit}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-1">Departed origin</div>
          </div>
        </div>

        {/* Joined On-Site */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-emerald-700">Joined On-Site</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[24px] font-black text-emerald-600 font-mono leading-none">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : metrics.joined}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Deployment completed</div>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1.5 bg-gray-50/80 p-1 rounded-xl border border-gray-200/60 overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Deployments', count: metrics.total },
              { key: 'FLIGHT_BOOKED', label: 'Flight Booked', count: metrics.booked },
              { key: 'IN_TRANSIT', label: 'In Transit', count: metrics.transit },
              { key: 'JOINED_ON_SITE', label: 'Joined On-Site', count: metrics.joined },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.key ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-200/80 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidate, PNR, flight, airline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 focus:bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

        </div>
      </div>

      {/* 4. Live Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Candidate & Passport</th>
                <th className="py-3 px-4">Airline & Flight</th>
                <th className="py-3 px-4">PNR & Sector</th>
                <th className="py-3 px-4">Flight Date & Time</th>
                <th className="py-3 px-4">Camp & Pickup Officer</th>
                <th className="py-3 px-4">Emigration (POE)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Loading flight and deployment details...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    <Plane className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <span>No deployment records found matching filter.</span>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const dep = lead.placementDetails?.deployment || {};
                  const flightDate = dep.flightDate ? new Date(dep.flightDate).toLocaleDateString() : 'Upcoming';
                  const flightTime = dep.flightTime || '10:00 AM';
                  const airline = dep.airline || 'Emirates Airlines';
                  const flightNumber = dep.flightNumber || 'EK 511';
                  const pnr = dep.pnr || 'PNR-Pending';
                  const sector = dep.sector || 'DEL - DXB';
                  const poe = dep.poeStatus || 'POE Cleared';
                  const camp = dep.campLocation || 'Jebel Ali Camp, Dubai';
                  const pickup = dep.pickupOfficer || 'HR Representative';
                  const status = dep.status || (lead.currentStage === 'COMPLETED' ? 'JOINED_ON_SITE' : 'FLIGHT_BOOKED');

                  return (
                    <tr key={lead._id} className="hover:bg-emerald-50/30 transition-colors">
                      
                      {/* Candidate */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{lead.candidateName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {lead.passportNumber || 'No Passport'} • {lead.trade || 'Worker'}
                        </div>
                      </td>

                      {/* Airline & Flight */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{airline}</div>
                        <div className="text-[11px] text-emerald-600 font-mono font-medium">{flightNumber}</div>
                      </td>

                      {/* PNR & Sector */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-gray-900">{pnr}</div>
                        <div className="text-[11px] text-blue-600">{sector}</div>
                      </td>

                      {/* Flight Date & Time */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-medium text-gray-900">{flightDate}</div>
                        <div className="text-[11px] text-gray-400">{flightTime}</div>
                      </td>

                      {/* Camp & Pickup */}
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-medium truncate max-w-[130px]">{camp}</div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[130px]">{pickup}</div>
                      </td>

                      {/* Emigration */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {poe}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {status === 'JOINED_ON_SITE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Joined On-Site
                          </span>
                        ) : status === 'IN_TRANSIT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Navigation className="w-3 h-3 text-amber-600" />
                            In Transit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Plane className="w-3 h-3 text-blue-600" />
                            Flight Booked
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Confirm Joining Button */}
                          {status !== 'JOINED_ON_SITE' && (
                            <button
                              onClick={() => handleConfirmJoining(lead)}
                              disabled={actionLoadingId === lead._id}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
                              title="Confirm Candidate Joined Company On-Site"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Joined</span>
                            </button>
                          )}

                          {/* Edit Flight */}
                          <button
                            onClick={() => {
                              setEditFlightLead(lead);
                              setFlightForm({
                                airline: dep.airline || 'Emirates Airlines',
                                flightNumber: dep.flightNumber || 'EK 511',
                                pnr: dep.pnr || 'EK79201',
                                sector: dep.sector || 'DEL - DXB',
                                departureAirport: dep.departureAirport || 'Indira Gandhi Int Airport (DEL)',
                                arrivalAirport: dep.arrivalAirport || 'Dubai Int Airport (DXB)',
                                flightDate: dep.flightDate ? new Date(dep.flightDate).toISOString().substring(0, 10) : '',
                                flightTime: dep.flightTime || '10:00 AM',
                                joiningDate: dep.joiningDate ? new Date(dep.joiningDate).toISOString().substring(0, 10) : '',
                                poeStatus: dep.poeStatus || 'POE Cleared (Emigration OK)',
                                baggage: dep.baggage || '30 KG Check-in + 7 KG Cabin',
                                pickupOfficer: dep.pickupOfficer || 'HR Representative',
                                campLocation: dep.campLocation || 'Jebel Ali Camp 4, Dubai',
                                status: status,
                                notes: dep.notes || ''
                              });
                            }}
                            className="h-7 px-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Ticket / Deployment Details"
                          >
                            <Edit3 className="w-3 h-3 text-gray-500" />
                            <span>Edit</span>
                          </button>

                          {/* View Boarding & Itinerary */}
                          <button
                            onClick={() => setViewLead(lead)}
                            className="h-7 w-7 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                            title="View Flight Dossier & Itinerary"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. View Flight Dossier Modal */}
      {viewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Deployment & Flight Dossier</h3>
                  <p className="text-[11px] text-gray-500">{viewLead.candidateName} • {viewLead.passportNumber || 'No Passport'}</p>
                </div>
              </div>
              <button onClick={() => setViewLead(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Airline Carrier:</span>
                  <span className="font-bold text-gray-900">{viewLead.placementDetails?.deployment?.airline || 'Emirates Airlines'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Flight Number & PNR:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {viewLead.placementDetails?.deployment?.flightNumber || 'EK 511'} (PNR: {viewLead.placementDetails?.deployment?.pnr || 'EK79201'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Flight Sector:</span>
                  <span className="font-bold text-blue-600">{viewLead.placementDetails?.deployment?.sector || 'DEL - DXB'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Scheduled Flight Date:</span>
                  <span className="font-bold text-gray-900">
                    {viewLead.placementDetails?.deployment?.flightDate ? new Date(viewLead.placementDetails.deployment.flightDate).toLocaleDateString() : 'Confirmed'} at {viewLead.placementDetails?.deployment?.flightTime || '10:00 AM'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Luggage Allowance:</span>
                  <span className="font-bold text-gray-900">{viewLead.placementDetails?.deployment?.baggage || '30 KG Check-in + 7 KG Cabin'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">On-Site Camp / Accommodation:</span>
                  <span className="font-bold text-gray-900">{viewLead.placementDetails?.deployment?.campLocation || 'Jebel Ali Camp 4, Dubai'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Airport Pickup Officer:</span>
                  <span className="font-bold text-gray-900">{viewLead.placementDetails?.deployment?.pickupOfficer || 'Mr. Tariq (HR Officer)'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => alert('Printing boarding itinerary & emergency protocol document...')}
                  className="h-9 px-3.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Itinerary</span>
                </button>
                <button
                  onClick={() => setViewLead(null)}
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 6. Edit Flight & Deployment Modal */}
      {editFlightLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/70">
              <div>
                <h3 className="font-bold text-gray-900 text-[15px]">Edit Flight Booking & Deployment</h3>
                <p className="text-[11px] text-gray-500">{editFlightLead.candidateName} • {editFlightLead.passportNumber || 'No Passport'}</p>
              </div>
              <button onClick={() => setEditFlightLead(null)} className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFlight} className="p-5 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Airline Carrier *
                  </label>
                  <select
                    value={flightForm.airline}
                    onChange={(e) => setFlightForm({ ...flightForm, airline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500"
                  >
                    {AIRLINES.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Flight Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EK 511"
                    value={flightForm.flightNumber}
                    onChange={(e) => setFlightForm({ ...flightForm, flightNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Ticket PNR *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EK79201"
                    value={flightForm.pnr}
                    onChange={(e) => setFlightForm({ ...flightForm, pnr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Flight Sector *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DEL - DXB"
                    value={flightForm.sector}
                    onChange={(e) => setFlightForm({ ...flightForm, sector: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Flight Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={flightForm.flightDate}
                    onChange={(e) => setFlightForm({ ...flightForm, flightDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Departure Time *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={flightForm.flightTime}
                    onChange={(e) => setFlightForm({ ...flightForm, flightTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Airport Pickup Officer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Tariq"
                    value={flightForm.pickupOfficer}
                    onChange={(e) => setFlightForm({ ...flightForm, pickupOfficer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Camp / Site Accommodation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jebel Ali Camp 4"
                    value={flightForm.campLocation}
                    onChange={(e) => setFlightForm({ ...flightForm, campLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Deployment Status *
                </label>
                <select
                  value={flightForm.status}
                  onChange={(e) => setFlightForm({ ...flightForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="FLIGHT_BOOKED">FLIGHT_BOOKED (Tickets Issued & Briefed)</option>
                  <option value="IN_TRANSIT">IN_TRANSIT (Departed Origin Airport)</option>
                  <option value="JOINED_ON_SITE">JOINED_ON_SITE (Candidate Reported & Deployed)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditFlightLead(null)}
                  className="h-9 px-3.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {actionLoadingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Deployment</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
