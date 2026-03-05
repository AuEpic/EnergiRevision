import {
  Activity, BarChart3, Bot, Building2, Car, CheckSquare, Database, Download,
  FileSignature, FileText, Filter, Layers, Menu, Printer, RefreshCw, Scale,
  Search, Server, Settings, ShieldAlert, ShieldCheck, TrendingUp, Upload,
  Users, X, Zap, Trash2, Clock, FileUp, File, MessageCircle, Send
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Types ────────────────────────────────────────────────────────────
interface Lead {
  id: string; name: string; sni: string; industry: string;
  personnel_cost: string; rd_deduction: string; score: number;
  status: string; tags: string[]; potential: string; notes: string;
  source: string; created_at: string; updated_at: string;
}
interface ActivityEntry { id: number; timestamp: string; level: string; message: string; source: string; }
interface EngineRun { id: number; started_at: string; finished_at: string | null; status: string; leads_processed: number; leads_added: number; leads_updated: number; duration_ms: number; }
interface DashboardStats { totalLeads: number; topScoreLeads: number; readyForAudit: number; totalFiles: number; totalPotentialMSEK: number; lastEngineRun: EngineRun | null; }
interface HfdRuling { id: string; title: string; desc: string; tag: string; }
interface Agent { id: string; name: string; emoji: string; focus: string; color: string; bg: string; }

// ── API helpers ──────────────────────────────────────────────────────
const API_BASE = typeof process !== 'undefined' && process.env?.VITE_API_URL ? process.env.VITE_API_URL : '';
const api = {
  get: async (path: string) => { const r = await fetch(API_BASE + path); return r.json(); },
  del: async (path: string) => { const r = await fetch(API_BASE + path, { method: 'DELETE' }); return r.json(); },
  post: async (path: string, body?: any) => {
    const r = await fetch(API_BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return r.json();
  },
};

// ── Hooks ────────────────────────────────────────────────────────────
function useStaticData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/data.json');
      if (!res.ok) throw new Error('data.json not found');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ── Sync Status Indicator ────────────────────────────────────────────
function SyncIndicator({ lastRun }: { lastRun: EngineRun | null }) {
  if (!lastRun) return (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
      <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />Never synced
    </div>
  );
  const now = Date.now();
  const finished = lastRun.finished_at ? new Date(lastRun.finished_at + 'Z').getTime() : now;
  const hoursAgo = (now - finished) / 3600000;
  const color = lastRun.status === 'running' ? 'bg-blue-500 animate-pulse' : hoursAgo < 24 ? 'bg-emerald-500' : hoursAgo < 48 ? 'bg-amber-500' : 'bg-red-500';
  const label = lastRun.status === 'running' ? 'Syncing...' : hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${Math.round(hoursAgo)}h ago` : `${Math.round(hoursAgo / 24)}d ago`;
  return (
    <div className="flex items-center gap-2 text-xs font-bold uppercase">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-slate-500">{label}</span>
    </div>
  );
}

// ── Components ───────────────────────────────────────────────────────

function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: { activeTab: string; setActiveTab: (t: string) => void; isOpen: boolean; setIsOpen: (o: boolean) => void }) {
  const navItems = [
    { id: 'dashboard', label: 'Översikt', icon: BarChart3 },
    { id: 'leads', label: 'Prospektering', icon: Users },
    { id: 'agents', label: 'AI Agenter', icon: Bot },
    { id: 'integrations', label: 'API & Data', icon: Database },
    { id: 'checklist', label: 'Granskningsmall', icon: CheckSquare },
    { id: 'hfd', label: 'HFD-Bevakning', icon: Scale },
    { id: 'onboarding', label: 'Kund-Onboarding', icon: FileSignature },
    { id: 'architecture', label: 'Tech Stack', icon: Layers },
    { id: 'engine', label: 'Core Engine (macOS)', icon: Server },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center"><TrendingUp size={20} className="text-white" /></div>
              OpenRevision
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono uppercase">Internal Framework</div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}><X size={24} /></button>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon; const isActive = activeTab === item.id;
            return (<button key={item.id} onClick={() => { setActiveTab(item.id); setIsOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'}`}><Icon size={18} />{item.label}</button>);
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">IM</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium text-white truncate">iMac Pro Specialist</div><div className="text-[10px] text-slate-500 truncate uppercase">Level 10 Admin</div></div>
            <Settings size={16} className="text-slate-500 cursor-pointer hover:text-white" />
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardView({ stats, activity, refreshKey, onRefresh }: { stats: DashboardStats | null; activity: ActivityEntry[]; refreshKey: number; onRefresh: () => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try { await api.post('/api/refresh'); setTimeout(onRefresh, 2000); } catch { /* ignore */ }
    finally { setTimeout(() => setRefreshing(false), 3000); }
  };
  const s = stats || { totalLeads: 0, topScoreLeads: 0, readyForAudit: 0, totalFiles: 0, totalPotentialMSEK: 0, lastEngineRun: null };
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div><h1 className="text-2xl font-semibold text-slate-900">Översikt</h1><p className="text-slate-500 mt-1">Sammanställning av skatteåtervinning och aktiva leads.</p></div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${refreshing ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Uppdaterar...' : '🔄 Uppdatera från Motor'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"><Printer size={16} /> Skriv ut rapport</button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Potential</div><div className="text-2xl font-light text-slate-900">{s.totalPotentialMSEK} MSEK</div><div className="mt-3 flex items-center text-sm text-emerald-600 font-medium"><TrendingUp size={14} className="mr-1" /> Beräknad bruttoåtervinning</div></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Aktiva Leads</div><div className="text-2xl font-light text-slate-900">{s.totalLeads}</div><div className="mt-3 flex items-center text-sm text-slate-500">Från databas</div></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Top Score (9-10)</div><div className="text-2xl font-light text-slate-900">{s.topScoreLeads}</div><div className="mt-3 flex items-center text-sm text-emerald-600 font-medium">Högst potential</div></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Case-filer</div><div className="text-2xl font-light text-slate-900">{s.totalFiles}</div><div className="mt-3 flex items-center text-sm text-slate-500">Uppladdade dokument</div></div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Senaste Sync</div><SyncIndicator lastRun={s.lastEngineRun} /><div className="mt-3 text-xs text-slate-400">{s.lastEngineRun?.finished_at ? new Date(s.lastEngineRun.finished_at + 'Z').toLocaleString('sv-SE') : 'Aldrig'}</div></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center"><h2 className="text-lg font-medium text-slate-900">Systemlogg</h2><div className="w-2 h-2 rounded-full bg-emerald-500" /></div>
          <div className="p-6 font-mono text-xs space-y-3 max-h-80 overflow-y-auto">
            {activity.length === 0 && <div className="text-slate-400">Inga händelser ännu. Kör en sync för att se aktivitet här.</div>}
            {activity.map(e => (
              <div key={e.id} className="flex gap-3">
                <span className="text-slate-400 shrink-0">[{e.timestamp ? new Date(e.timestamp + 'Z').toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}]</span>
                <span className={e.level === 'SUCCESS' ? 'text-emerald-600' : e.level === 'ERROR' ? 'text-red-500' : e.level === 'WARN' ? 'text-amber-600' : 'text-blue-600'}>{e.level}</span>
                <span className="text-slate-700">{e.message}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200"><h2 className="text-lg font-medium text-slate-900">Motor-status</h2></div>
          <div className="p-6 space-y-4">
            {s.lastEngineRun ? (
              <>
                <div className="flex justify-between"><span className="text-sm text-slate-500">Status</span><span className={`text-sm font-bold ${s.lastEngineRun.status === 'success' ? 'text-emerald-600' : s.lastEngineRun.status === 'error' ? 'text-red-500' : 'text-blue-500'}`}>{s.lastEngineRun.status.toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-sm text-slate-500">Leads behandlade</span><span className="text-sm font-bold text-slate-900">{s.lastEngineRun.leads_processed}</span></div>
                <div className="flex justify-between"><span className="text-sm text-slate-500">Nya leads</span><span className="text-sm font-bold text-emerald-600">+{s.lastEngineRun.leads_added}</span></div>
                <div className="flex justify-between"><span className="text-sm text-slate-500">Uppdaterade</span><span className="text-sm font-bold text-blue-600">{s.lastEngineRun.leads_updated}</span></div>
                <div className="flex justify-between"><span className="text-sm text-slate-500">Körtid</span><span className="text-sm font-mono text-slate-600">{s.lastEngineRun.duration_ms}ms</span></div>
              </>
            ) : <div className="text-slate-400 text-sm">Ingen körning registrerad. Klicka "Uppdatera från Motor" för att starta.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileDropZone({ leadId, onUploaded }: { leadId: string; onUploaded: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  useEffect(() => { api.get(`/api/files/${leadId}`).then(d => setFiles(d.files || [])).catch(() => { }); }, [leadId]);
  const uploadFile = async (file: globalThis.File) => {
    setUploading(true);
    const fd = new FormData(); fd.append('leadId', leadId); fd.append('file', file);
    try { await fetch('/api/files/upload', { method: 'POST', body: fd }); onUploaded(); api.get(`/api/files/${leadId}`).then(d => setFiles(d.files || [])); } catch { }
    finally { setUploading(false); }
  };
  return (
    <div className="space-y-3">
      <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]); }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${dragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}
        onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.onchange = () => { if (inp.files?.[0]) uploadFile(inp.files[0]); }; inp.click(); }}>
        {uploading ? <RefreshCw size={24} className="mx-auto text-emerald-500 animate-spin" /> : <FileUp size={24} className="mx-auto text-slate-400" />}
        <p className="text-sm text-slate-500 mt-2">{uploading ? 'Laddar upp...' : 'Dra & släpp filer här, eller klicka för att välja'}</p>
        <p className="text-[10px] text-slate-400 mt-1">Alla filtyper: dokument, bilder, video</p>
      </div>
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f: any) => (
            <div key={f.id} className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
              <File size={14} className="text-slate-400 shrink-0" />
              <span className="truncate flex-1">{f.filename}</span>
              <span className="text-slate-400">{(f.size_bytes / 1024).toFixed(0)} KB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadsView({ leads, onRefresh }: { leads: Lead[]; onRefresh: () => void }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = leads;
    if (categoryFilter === 'tech') result = result.filter(l => l.sni.includes('620') || l.industry.toLowerCase().includes('it') || l.industry.toLowerCase().includes('tech'));
    if (categoryFilter === 'industry') result = result.filter(l => l.sni.includes('10') || l.sni.includes('20') || l.sni.includes('30') || l.industry.toLowerCase().includes('tillverkning') || l.industry.toLowerCase().includes('industri'));
    if (categoryFilter === 'validated') result = result.filter(l => l.status === 'Ready for Audit' || l.tags.includes('Validated'));

    return result.filter(l => !searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.sni.includes(searchTerm) || l.industry.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [leads, searchTerm, categoryFilter]);

  const chartData = useMemo(() => [...filtered].sort((a, b) => b.score - a.score).slice(0, 10).map(l => ({ name: l.name.length > 15 ? l.name.substring(0, 15) + '...' : l.name, fullName: l.name, score: l.score })), [filtered]);
  const getScoreColor = (score: number) => score >= 10 ? '#8b5cf6' : score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#64748b';
  const handleDelete = async (id: string) => { await api.del(`/api/leads/${id}`); setShowDeleteConfirm(null); setSelectedLead(null); onRefresh(); };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div><h1 className="text-2xl font-semibold text-slate-900">Prospektering & Lead Scoring</h1><p className="text-slate-500 mt-1">{leads.length} leads från databasen.</p></div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 mb-1">
            <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1 text-xs font-bold rounded-full ${categoryFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Alla</button>
            <button onClick={() => setCategoryFilter('validated')} className={`px-3 py-1 text-xs font-bold rounded-full ${categoryFilter === 'validated' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Validerade (Klarmarkerade)</button>
            <button onClick={() => setCategoryFilter('tech')} className={`px-3 py-1 text-xs font-bold rounded-full ${categoryFilter === 'tech' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Tech / FoU</button>
            <button onClick={() => setCategoryFilter('industry')} className={`px-3 py-1 text-xs font-bold rounded-full ${categoryFilter === 'industry' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>Industri / Energi</button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-lg shadow-slate-200"><Download size={16} /> Exportera Leads (PDF)</button>
            <div className="relative w-full md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Sök bolag eller SNI..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full" /></div>
          </div>
        </div>
      </header>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6"><h2 className="text-lg font-bold text-slate-900">Recovery Score Chart</h2><p className="text-xs text-slate-500">Topp-leads från databasen.</p></div>
          <div className="flex-1 h-64 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide domain={[0, 10]} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={100} />
                <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload }) => active && payload?.length ? (<div className="bg-slate-900 text-white p-2 rounded shadow-xl text-xs border border-slate-700"><p className="font-bold">{payload[0].payload.fullName}</p><p className="text-emerald-400 font-bold">Score: {payload[0].payload.score}</p></div>) : null} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>{chartData.map((entry, i) => <Cell key={i} fill={getScoreColor(entry.score)} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div className="text-sm font-bold text-slate-600">{filtered.length} leads</div>
            <Filter size={16} className="text-slate-400" />
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                <tr><th className="px-6 py-4">ID & Företag</th><th className="px-6 py-4">SNI & Bransch</th><th className="px-6 py-4">Est. Potential</th><th className="px-6 py-4 text-center">Score</th><th className="px-6 py-4">Status</th><th className="px-6 py-4"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedLead(lead)}>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="text-[10px] font-mono text-slate-400 w-8">{lead.id}</div><div><div className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{lead.name}</div><div className="flex gap-1 mt-1">{lead.tags.slice(0, 2).map(tag => <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-tighter">{tag}</span>)}</div></div></div></td>
                    <td className="px-6 py-4"><div className="font-mono text-xs text-slate-400">{lead.sni}</div><div className="text-slate-600 text-xs mt-0.5">{lead.industry}</div></td>
                    <td className="px-6 py-4"><div className="font-bold text-emerald-600">~{lead.potential || 'TBD'}</div><div className="text-[10px] text-slate-400 uppercase">Bruttoåtervinning</div></td>
                    <td className="px-6 py-4"><div className="flex flex-col items-center"><div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm ${lead.score >= 10 ? 'bg-purple-500' : lead.score >= 8 ? 'bg-emerald-500' : 'bg-amber-500'}`}>{lead.score}</div></div></td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${lead.status === 'Ready for Audit' ? 'bg-purple-100 text-purple-700' : lead.status === 'API Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{lead.status}</span></td>
                    <td className="px-6 py-4">{showDeleteConfirm === lead.id ? (
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDelete(lead.id)} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded font-bold">Radera</button>
                        <button onClick={() => setShowDeleteConfirm(null)} className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] rounded font-bold">Avbryt</button>
                      </div>
                    ) : <button onClick={e => { e.stopPropagation(); setShowDeleteConfirm(lead.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Lead detail slide-over */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">{selectedLead.name}</h2>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400 text-xs uppercase block mb-1">Score</span><span className={`text-2xl font-bold ${selectedLead.score >= 9 ? 'text-emerald-600' : 'text-slate-900'}`}>{selectedLead.score}/10</span></div>
                <div><span className="text-slate-400 text-xs uppercase block mb-1">Status</span><span className="font-bold text-slate-900">{selectedLead.status}</span></div>
                <div><span className="text-slate-400 text-xs uppercase block mb-1">SNI</span><span className="font-mono text-slate-700">{selectedLead.sni || '—'}</span></div>
                <div><span className="text-slate-400 text-xs uppercase block mb-1">Bransch</span><span className="text-slate-700">{selectedLead.industry || '—'}</span></div>
                <div><span className="text-slate-400 text-xs uppercase block mb-1">Personalkostnad</span><span className="text-slate-700">{selectedLead.personnel_cost || '—'}</span></div>
                <div><span className="text-slate-400 text-xs uppercase block mb-1">FoU-avdrag</span><span className="text-slate-700">{selectedLead.rd_deduction || '—'}</span></div>
                <div className="col-span-2"><span className="text-slate-400 text-xs uppercase block mb-1">Estimerad Potential</span><span className="text-emerald-600 font-bold text-lg">{selectedLead.potential || 'TBD'}</span></div>
              </div>
              {selectedLead.tags.length > 0 && <div className="flex flex-wrap gap-1">{selectedLead.tags.map(t => <span key={t} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{t}</span>)}</div>}
              <div className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> Skapad: {selectedLead.created_at ? new Date(selectedLead.created_at + 'Z').toLocaleString('sv-SE') : '—'} · Uppdaterad: {selectedLead.updated_at ? new Date(selectedLead.updated_at + 'Z').toLocaleString('sv-SE') : '—'}</div>
              <div><h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Upload size={14} /> Case-filer</h3><FileDropZone leadId={selectedLead.id} onUploaded={onRefresh} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AGENT_ICONS: Record<string, any> = { sanktion: ShieldAlert, fastighet: Building2, leasing: Car, energi: Zap, fou_bevis: FileText };

function AgentsView({ agents }: { agents: Agent[] }) {
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-semibold text-slate-900">Specialiserade AI Agenter</h1><p className="text-slate-500 mt-1">Drivs av Agent Zero's prospekteringslogik och Skatteverkets API:er.</p></header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => {
          const Icon = AGENT_ICONS[agent.id] || Bot;
          return (
            <div key={agent.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${agent.bg} ${agent.color} flex items-center justify-center group-hover:scale-110 transition-transform`}><Icon size={24} /></div>
                <div className="text-2xl">{agent.emoji}</div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4 h-10">{agent.focus}</p>
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kärnkompetens</div>
                  <ul className="text-sm text-slate-700 space-y-2">
                    <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" />Automatiserad API-verifiering</li>
                    <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" />HFD Prejudikat-analys</li>
                    <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" />No-Cure-No-Pay Outreach</li>
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Verktyg & Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Search', 'Shell', 'File-IO', 'Browser'].map(tool => (
                      <span key={tool} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-tighter border border-slate-200">{tool}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button className="mt-6 w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors uppercase tracking-wider">Starta Agent</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CHECKLIST_DATA = [
  {
    title: "1. Finansiella Indikatorer & Grunddata", icon: Search, items: [
      { label: "SNI-kod matchning", desc: "Fokusera på tech/programmering (62010, 62020) för FoU-avdrag, eller tillverkning/industri (10–33) för energiskatt." },
      { label: "Löneintensitetsregeln (15 %)", desc: "Flagga bolag i tech-sektorn vars personalkostnader överstiger 15 % av nettoomsättningen." },
      { label: "Personalkostnadströskel", desc: "Prioritera bolag med totala personalkostnader över 5 MSEK." },
      { label: "Ruta 475-kontroll", desc: "Verifiera via Skatteverkets Partner-API om bolaget rapporterar 0 kr i FoU-avdrag." },
      { label: "Not: Uppskjuten skattefordran", desc: "Leta efter oredovisade skattetillgångar som kan tyda på historiska fel." },
      { label: "Kassaflödesanalys - Betald skatt", desc: "Kontrollera att bolaget faktiskt är i en skattebetalande position." },
    ]
  },
  {
    title: "2. Juridiska Spearheads (Rättspraxis & Domar)", icon: ShieldAlert, items: [
      { label: "HFD 2022 ref. 38 (Energiskatt)", desc: "Hitta bolag med industriella processer som inte ses som traditionell industri." },
      { label: "HFD 2024 ref. 52 (Skattetillägg)", desc: "Identifiera företag som påförts skattetillägg trots uppenbart fel." },
      { label: "HFD 7071-24 (Moms för BRF)", desc: "Sök efter bostadsrättsföreningar med höga kommersiella lokalhyror." },
    ]
  },
];
function ChecklistView() { return (<div className="space-y-6 max-w-4xl"><header><h1 className="text-2xl font-semibold text-slate-900">Granskningsmall: Skatteåtervinning</h1><p className="text-slate-500 mt-1">Detaljerad checklista för agenter och analytiker.</p></header><div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">{CHECKLIST_DATA.map((s, idx) => { const Icon = s.icon; return (<React.Fragment key={idx}><div className={`p-6 bg-slate-50 ${idx > 0 ? 'border-t border-slate-200' : 'border-b border-slate-200'}`}><h2 className="font-semibold text-slate-900 flex items-center gap-2"><Icon size={18} className="text-emerald-600" />{s.title}</h2></div><div className="p-6 space-y-4">{s.items.map((item, i) => (<label key={i} className="flex items-start gap-3 cursor-pointer group"><input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" /><div><div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">{item.label}</div><div className="text-sm text-slate-500">{item.desc}</div></div></label>))}</div></React.Fragment>); })}</div></div>); }

const INTEGRATIONS_DATA = [
  {
    category: "1. Skatteverket (Partner-API:er)", icon: Database, color: "text-blue-600", bg: "bg-blue-100", items: [
      { name: "Ombudshantering 2.0", desc: "Kontrollerar registrerade behörigheter och verifierar fullmakter." },
      { name: "Arbetsgivardeklaration 1.2", desc: "Kontrollerar Ruta 475 (FoU-avdrag) och Ruta 470 bakåt i tiden." },
      { name: "Skattekonto 1.0", desc: "Verifierar skattebetalande position (saldo och transaktioner)." },
      { name: "Beskattningsengagemang 1.0", desc: "Hämtar F-skatt, moms- och arbetsgivarregistrering." },
    ]
  },
  {
    category: "2. Företags- och Finansdata", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-100", items: [
      { name: "Bolagsverket / Roaring", desc: "Realtidsdata om SNI-koder, anställda och personalkostnader." },
      { name: "Enento / Roaring (XBRL)", desc: "Digital parsning av noter i årsredovisningar." },
      { name: "SCB (Statistikmyndigheten)", desc: "Bransch-benchmarking av personalkostnader för 15-procentsregeln." },
    ]
  },
];
function IntegrationsView() { return (<div className="space-y-6"><header><h1 className="text-2xl font-semibold text-slate-900">API & Event-Driven Data</h1><p className="text-slate-500 mt-1">Hantera webhooks och datakällor för automatiserad prospektering.</p></header><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{INTEGRATIONS_DATA.map((cat, idx) => { const Icon = cat.icon; return (<div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"><div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-3"><div className={`w-10 h-10 rounded-lg ${cat.bg} ${cat.color} flex items-center justify-center shrink-0`}><Icon size={20} /></div><h2 className="font-semibold text-slate-900">{cat.category}</h2></div><div className="p-5 flex-1"><ul className="space-y-4">{cat.items.map((item, i) => (<li key={i} className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" /><div><div className="font-medium text-slate-900 text-sm">{item.name}</div><div className="text-sm text-slate-500 mt-0.5">{item.desc}</div></div></li>))}</ul></div></div>); })}</div></div>); }

function OnboardingView() {
  const [isSigning, setIsSigning] = useState(false);
  const [logs, setLogs] = useState<{ text: string; color: string }[]>([]);
  const startScriveFlow = () => {
    if (isSigning) return; setIsSigning(true); setLogs([]);
    const seq = [
      { text: "> Mottagit webhook: Status [Closed]. BankID verifierat.", color: "text-emerald-500", delay: 1000 },
      { text: "> Upprättar anslutning till Skatteverket Partner API...", color: "text-slate-400", delay: 2500 },
      { text: "> Auth-Token godkänd. Krypterad tunnel etablerad.", color: "text-emerald-400", delay: 3500 },
      { text: "> Hämtar Arbetsgivardeklaration 1.2 (Senaste 72 månaderna)...", color: "text-slate-400", delay: 5000 },
      { text: "[VARNING] Ruta 475 = 0 SEK för perioden 2023-2025.", color: "text-amber-400 font-medium", delay: 8000 },
      { text: "[MATCH] Dold skattetillgång verifierad. Oredovisat FoU-avdrag.", color: "text-emerald-500 font-bold", delay: 12500 },
      { text: "ESTIMERAD ÅTERVINNING: 3 140 000 SEK", color: "text-emerald-400 text-lg font-bold", delay: 14000 },
    ];
    seq.forEach(({ text, color, delay }) => { setTimeout(() => setLogs(prev => [...prev, { text, color }]), delay); });
  };
  return (<div className="space-y-6"><header><h1 className="text-2xl font-semibold text-slate-900">Kund-Onboarding (Scrive Simulation)</h1><p className="text-slate-500 mt-1">Simulering av BankID-onboarding för CFO.</p></header><div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden grid lg:grid-cols-2"><div className="p-8 lg:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-800"><h2 className="text-3xl font-bold text-white mb-4">Klartecken för <span className="text-emerald-500">Deep Audit</span></h2><button onClick={startScriveFlow} disabled={isSigning} className={`w-full py-4 px-8 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-3 ${isSigning ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'}`}>{isSigning ? 'Inväntar signatur...' : 'Signera med BankID (via Scrive)'}</button></div><div className="bg-black p-6 flex flex-col h-[400px] font-mono text-xs overflow-y-auto">{logs.map((l, i) => <div key={i} className={l.color}>{l.text}</div>)}</div></div></div>);
}

function ArchitectureView() { return (<div className="space-y-6"><header><h1 className="text-2xl font-semibold text-slate-900">Tech Stack</h1><p className="text-slate-500 mt-1">Arkitekturen bakom OpenRevision.</p></header><div className="bg-white p-6 rounded-2xl border border-slate-200"><pre className="text-xs text-slate-600 whitespace-pre-wrap">{JSON.stringify({ Core: "OpenClaw / Agent Zero", Knowledge: "NotebookLM RAG", Data: "Skatteverket / Roaring / Bolagsverket", Database: "SQLite (better-sqlite3)", Frontend: "React + Vite + TailwindCSS", API: "Express.js", Automation: "n8n / Webhooks / launchd" }, null, 2)}</pre></div></div>); }

function EngineView({ stats }: { stats: DashboardStats | null }) { return (<div className="space-y-6"><header><h1 className="text-2xl font-semibold text-slate-900">Core Engine (macOS)</h1><p className="text-slate-500 mt-1">Python-baserad lead scoring och regelmotor.</p></header><div className="bg-slate-900 p-6 rounded-2xl font-mono text-sm space-y-2"><div className="text-emerald-400">[SYSTEM ONLINE] — M4 Neural Engine active — SQLite DB Ready</div><div className="text-slate-400">rules_engine.py  → {stats?.lastEngineRun ? '✅ Loaded' : '⏳ Idle'}</div><div className="text-slate-400">lead_scoring.py  → {stats?.lastEngineRun ? '✅ Loaded' : '⏳ Idle'}</div><div className="text-slate-400">hybrid_memory.py → ✅ Persistent</div><div className="text-slate-400">sync_to_db.py    → {stats?.lastEngineRun ? `Last run: ${stats.lastEngineRun.finished_at || 'running...'}` : 'Never run'}</div></div></div>); }

function HfdView({ rulings }: { rulings: HfdRuling[] }) { return (<div className="space-y-6"><header><h1 className="text-2xl font-semibold text-slate-900">HFD-Bevakning</h1><p className="text-slate-500 mt-1">Prejudicerande domar för skatteåtervinning.</p></header><div className="grid gap-4">{(rulings || []).map(r => (<div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"><div className="flex items-center gap-2 mb-2"><h3 className="font-bold text-slate-900">{r.title}</h3>{r.tag && <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{r.tag}</span>}</div><p className="text-sm text-slate-500">{r.desc}</p></div>))}</div></div>); }

// ── AI Chat Widget ───────────────────────────────────────────────────

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Hej! Jag är Agent Zero (Lite). Hur kan jag hjälpa dig med prospektering, HFD-domar eller skatteåtervinning idag?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      let prompt = "Tidigare konversation:\\n";
      messages.forEach(m => prompt += `${m.role === 'user' ? 'Användare' : 'Agent Zero'}: ${m.text}\\n`);
      prompt += `\\nAnvändare: ${userMsg}\\nAgent Zero:`;

      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "Du är Agent Zero, en AI-assistent integrerad i OpenRevision. Du är expert på svensk skatteåtervinning (FoU-avdrag, energiskatt, fastighetsmoms m.m.). Du svarar kortfattat, professionellt och insiktsfullt på svenska.",
        }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Kunde inte generera svar.' }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Ett fel uppstod vid kontakt med Gemini API: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-emerald-500 transition-colors z-50">
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden" style={{ height: '500px', maxHeight: '80vh' }}>
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2 font-bold"><Bot size={18} className="text-emerald-500" /> Agent Zero (Lite)</div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-emerald-600 text-white rounded-br-sm whitespace-pre-wrap' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm prose prose-sm prose-emerald max-w-none'}`}>
                  {m.role === 'user' ? m.text : <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-400 flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> Analyserar...</div>}
          </div>
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Fråga om skatteåtervinning..."
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder-slate-400"
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="text-emerald-600 disabled:text-slate-400">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main App ─────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data, loading, refetch } = useStaticData();

  // Auto-refresh every 60 seconds (useful mostly when running locally)
  useEffect(() => { const iv = setInterval(refetch, 60000); return () => clearInterval(iv); }, [refetch]);

  if (loading && !data) return <div className="h-screen flex items-center justify-center text-slate-500">Laddar Data (data.json)...</div>;

  const leadsData = data?.leads || [];
  const statsData = data?.stats || null;
  const activityData = data?.activity?.entries || [];
  const hfdData = data?.hfd_rulings?.rulings || [];
  const agentsData = data?.agents?.agents || [];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
          <div className="flex-1 flex justify-center lg:justify-start">
            <div className="hidden lg:flex items-center gap-3">
              <SyncIndicator lastRun={statsData?.lastEngineRun ?? null} />
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest"><Activity size={14} className={statsData?.lastEngineRun?.status === 'success' ? "text-emerald-500" : "text-amber-500"} />System Health: {statsData?.lastEngineRun?.status === 'success' ? 'Online' : 'Pending'}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right"><div className="text-xs font-bold text-slate-900 uppercase">{new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' })}</div><div className="text-[10px] text-slate-400 uppercase">Stockholm, SE</div></div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200"><ShieldCheck size={18} /></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {activeTab === 'dashboard' && <DashboardView stats={statsData} activity={activityData} refreshKey={0} onRefresh={refetch} />}
          {activeTab === 'leads' && <LeadsView leads={leadsData} onRefresh={refetch} />}
          {activeTab === 'agents' && <AgentsView agents={agentsData} />}
          {activeTab === 'integrations' && <IntegrationsView />}
          {activeTab === 'checklist' && <ChecklistView />}
          {activeTab === 'hfd' && <HfdView rulings={hfdData} />}
          {activeTab === 'onboarding' && <OnboardingView />}
          {activeTab === 'architecture' && <ArchitectureView />}
          {activeTab === 'engine' && <EngineView stats={statsData} />}
        </main>
      </div>
      <AiChatWidget />
    </div>
  );
}
