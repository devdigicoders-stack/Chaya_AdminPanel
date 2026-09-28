import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Share2, Users, 
  TrendingUp, Sparkles, ShieldCheck, FileSpreadsheet, ArrowLeft,
  RefreshCw, Globe, Layers, Plus, Search, 
  Eye, Building2, MessageCircle} from 'lucide-react';
import { apiGetDashboardSummary, apiGetLeads } from '../utils/api';

const SOURCES_CONFIG = [
  {
    key: 'ALL',
    label: 'All Channels',
    sub: 'Combined central sourcing pool',
    icon: Layers,
    color: '#2563EB',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    tag: 'Total Pool'
  },
  {
    key: 'WHATSAPP',
    label: 'WhatsApp Business',
    sub: 'Direct chat & inbound inquiry flow',
    icon: MessageCircle,
    color: '#10B981',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    tag: 'Direct Inbound'
  },
  {
    key: 'FACEBOOK',
    label: 'Meta Ads Campaigns',
    sub: 'Facebook & Instagram lead forms',
    icon: Globe,
    color: '#3B82F6',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    tag: 'Digital Campaigns'
  },
  {
    key: 'EXCEL',
    label: 'Excel Spreadsheets',
    sub: 'Bulk roster & recruiter uploads',
    icon: FileSpreadsheet,
    color: '#F59E0B',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    tag: 'Bulk Ingestion'
  },
  {
    key: 'AGENT_REFERRAL',
    label: 'Partner Agents',
    sub: 'Field sub-broker & recruiter referrals',
    icon: Users,
    color: '#8B5CF6',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    tag: 'Field Network'
  },
  {
    key: 'MANUAL',
    label: 'Branch Walk-in',
    sub: 'Physical counter candidate registration',
    icon: Building2,
    color: '#64748B',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    text: 'text-slate-700',
    tag: 'Counter Walk-in'
  }
];

export default function LeadSources() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);
  const [bySource, setBySource] = useState({});
  const [byPassport, setByPassport] = useState({});
  const [selectedChannel, setSelectedChannel] = useState('ALL');

  // Channel Drilldown leads
  const [channelLeads, setChannelLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch live metrics from MongoDB Atlas
  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await apiGetDashboardSummary();
      if (res?.data) {
        setTotalLeads(res.data.totalLeads || 0);
        setBySource(res.data.bySource || {});
        setByPassport(res.data.byPassport || {});
      }
    } catch (err) {
      console.error('Failed to fetch sourcing metrics', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch live leads for the active channel filter
  const loadChannelLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const params = {};
      if (selectedChannel !== 'ALL') {
        params.source = selectedChannel;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await apiGetLeads(params);
      setChannelLeads(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch channel leads', err);
    } finally {
      setLoadingLeads(false);
    }
  }, [selectedChannel, searchQuery]);

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    loadChannelLeads();
  }, [loadChannelLeads]);

  // Compute live counts per source
  const getSourceCount = (key) => {
    if (key === 'ALL') return totalLeads;
    if (key === 'MANUAL') {
      return (bySource['MANUAL'] || 0) + (bySource['WALK_IN'] || 0) + (bySource['OTHER'] || 0);
    }
    return bySource[key] || 0;
  };

  // Find top acquisition channel
  const activeSources = SOURCES_CONFIG.filter(s => s.key !== 'ALL');
  const sortedByVolume = [...activeSources].sort((a, b) => getSourceCount(b.key) - getSourceCount(a.key));
  const topSource = sortedByVolume[0];
  const topCount = getSourceCount(topSource?.key);

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
            <span className="text-gray-900 font-medium">Channel Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Sourcing Channel Analytics
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/leads/add')}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>

          <button
            onClick={() => navigate('/leads/import')}
            className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bulk Ingest</span>
          </button>

          <button
            onClick={() => { loadMetrics(); loadChannelLeads(); }}
            disabled={loading}
            className="h-9 w-9 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/leads')}
            className="h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
            <span>All Leads</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Sourcing Channel KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {SOURCES_CONFIG.map((src) => {
          const count = getSourceCount(src.key);
          const pct = totalLeads > 0 && src.key !== 'ALL' ? ((count / totalLeads) * 100).toFixed(1) : (src.key === 'ALL' ? '100' : '0.0');
          const isSelected = selectedChannel === src.key;
          const IconComponent = src.icon;

          return (
            <div
              key={src.key}
              onClick={() => setSelectedChannel(src.key)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 shadow-md ring-2 ring-blue-100'
                  : 'border-gray-200/80 hover:border-gray-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl ${src.bg} ${src.text} flex items-center justify-center font-bold shrink-0`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                  )}
                </div>

                <div className="font-bold text-gray-900 text-[13px] leading-tight line-clamp-1">
                  {src.label}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{src.tag}</div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-baseline justify-between">
                <span className="text-[20px] font-black text-gray-900 font-mono">{count}</span>
                <span className="text-[10.5px] font-bold text-gray-500">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Analytical Overview Breakdown (2 Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Card A: Channel Market Share Progress Bars */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                Live Inflow Distribution by Acquisition Channel
              </h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Proportionate distribution of {totalLeads} candidate records tracked in central MongoDB database.
              </p>
            </div>
            {topSource && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Top: {topSource.label} ({topCount})
              </span>
            )}
          </div>

          <div className="space-y-3.5 pt-1">
            {activeSources.map((s) => {
              const count = getSourceCount(s.key);
              const percentage = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(1) : 0;
              const IconComp = s.icon;

              return (
                <div key={s.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <div className="flex items-center gap-2 font-semibold text-gray-800">
                      <IconComp className={`w-3.5 h-3.5 ${s.text}`} />
                      <span>{s.label}</span>
                    </div>
                    <div className="font-mono text-gray-600 font-bold">
                      {count} leads <span className="text-gray-400 font-normal">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card B: Passport Qualification Status Gatekeeper */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                Passport Quality Ratio
              </h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                FRD Gatekeeper: Overseas readiness audit.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[12px] font-bold text-emerald-800">✓ Valid Passport Holders</span>
                  <span className="font-mono font-black text-emerald-700 text-[16px]">{byPassport['YES'] || 0}</span>
                </div>
                <div className="text-[11px] text-emerald-600">
                  {totalLeads > 0 ? (((byPassport['YES'] || 0) / totalLeads) * 100).toFixed(1) : 0}% of Central Pool (Interview/CV Ready)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[12px] font-bold text-amber-800">⏳ Passport Pending / Applied</span>
                  <span className="font-mono font-black text-amber-700 text-[16px]">{byPassport['NOT_CONFIRMED'] || 0}</span>
                </div>
                <div className="text-[11px] text-amber-600">
                  {totalLeads > 0 ? (((byPassport['NOT_CONFIRMED'] || 0) / totalLeads) * 100).toFixed(1) : 0}% in Calling Follow-up
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[12px] font-bold text-rose-800">✗ Non-Passport Leads</span>
                  <span className="font-mono font-black text-rose-700 text-[16px]">{byPassport['NO'] || 0}</span>
                </div>
                <div className="text-[11px] text-rose-600">
                  Auto-quarantined to protect candidate fee
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[12px]">
            <span className="text-gray-500">Pipeline Quality:</span>
            <span className="font-bold text-emerald-700">
              {totalLeads > 0 ? (((byPassport['YES'] || 0) / totalLeads) * 100).toFixed(0) : 0}% Qualified
            </span>
          </div>
        </div>

      </div>

      {/* 4. Live Channel Candidate Drilldown Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        
        {/* Table Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-[16px]">
                {selectedChannel === 'ALL'
                  ? 'All Ingested Candidates'
                  : `${SOURCES_CONFIG.find(s => s.key === selectedChannel)?.label || selectedChannel} Candidates`}
              </h3>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full border border-blue-200 font-mono">
                {channelLeads.length} Records
              </span>
            </div>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Live candidates currently mapped to this sourcing channel in MongoDB.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, phone, trade..."
              className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12.5px] focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Drilldown Table */}
        {loadingLeads ? (
          <div className="py-16 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <span className="text-[13px] font-medium text-gray-600">Loading channel leads from database...</span>
          </div>
        ) : channelLeads.length === 0 ? (
          <div className="py-14 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Share2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-800 text-[14px]">No Candidates Found</h4>
            <p className="text-[12px] text-gray-500 mt-0.5 mb-4">
              There are currently no candidate records mapped to {selectedChannel === 'ALL' ? 'the central pool' : selectedChannel}.
            </p>
            <button
              onClick={() => navigate('/leads/import')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold cursor-pointer transition-colors shadow-xs"
            >
              + Ingest Leads for this Channel
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[780px] text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                  <th className="py-3 px-3.5 whitespace-nowrap">Candidate</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Contact & Location</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Trade Skill</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Passport</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Source</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Workflow Stage</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {channelLeads.map((lead) => {
                  const initial = lead.candidateName?.charAt(0) || 'C';
                  const isPassport = lead.isPassportHolder === 'YES';

                  return (
                    <tr key={lead._id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Candidate */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-[11px] font-black flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-[13px]">{lead.candidateName}</div>
                            <div className="font-mono text-[10.5px] text-blue-600 font-semibold">{lead.leadId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="font-mono font-medium text-gray-800 text-[12px]">{lead.phone}</div>
                        <div className="text-[11px] text-gray-400">{lead.city || lead.state || 'India'}</div>
                      </td>

                      {/* Trade */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <div className="font-bold text-gray-800 text-[12.5px] max-w-[200px] truncate" title={lead.trade}>
                          {lead.trade || 'General Worker'}
                        </div>
                      </td>

                      {/* Passport */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                          isPassport ? 'bg-emerald-100 text-emerald-800' :
                          lead.isPassportHolder === 'NO' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {isPassport ? `✓ ${lead.passportNumber || 'Passport Holder'}` :
                           lead.isPassportHolder === 'NO' ? '✗ No Passport' : '⏳ Pending'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                          {lead.source?.replace('_', ' ') || 'MANUAL'}
                        </span>
                      </td>

                      {/* Stage */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {lead.currentStage?.replace('_', ' ') || 'UNASSIGNED'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate('/leads')}
                          className="px-2.5 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-[11.5px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
