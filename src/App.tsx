import {
  Activity, BarChart3, Bot, Building2, Car, CheckSquare, Database, Download,
  FileSignature, FileText, Filter, Layers, Menu, Printer, RefreshCw, Scale,
  Search, Server, Settings, ShieldAlert, ShieldCheck, TrendingUp, Upload,
  Users, X, Zap, Trash2, Clock, FileUp, File, MessageCircle, Send
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const api = {
  get: async (path: string) => { const r = await fetch(path); return r.json(); },
  del: async (path: string) => { const r = await fetch(path, { method: 'DELETE' }); return r.json(); },
  post: async (path: string, body?: any) => {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
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
      <div className={`sidebar-gradient fixed lg:static inset-y-0 left-0 z-50 w-64 text-slate-300 flex flex-col h-screen border-r border-slate-800/60 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-3 font-black text-xl tracking-tight">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}><TrendingUp size={20} className="text-white" /></div>
              <span className="logo-shimmer">OpenRevision</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-widest">Internal Framework v2.0</div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}><X size={24} /></button>
        </div>
        <nav className="flex-1 px-3 space-y-0.5 mt-3 overflow-y-auto py-2">
          {navItems.map(item => {
            const Icon = item.icon; const isActive = activeTab === item.id;
            return (<button key={item.id} onClick={() => { setActiveTab(item.id); setIsOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'hover:bg-slate-800/60 hover:text-white border border-transparent'}`}>
              <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />{item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>);
          })}
        </nav>
        <div className="p-4 border-t border-slate-800/60">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/40 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>IM</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-white truncate">iMac Pro Specialist</div><div className="text-[10px] text-emerald-500 truncate uppercase font-bold">● Level 10 Admin</div></div>
            <Settings size={14} className="text-slate-500 cursor-pointer hover:text-white" />
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
        <div className="stat-glow bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }} />
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Potential</div>
          <div className="text-3xl font-black text-slate-900 stat-number">{s.totalPotentialMSEK} <span className="text-base font-medium text-slate-400">MSEK</span></div>
          <div className="mt-3 flex items-center text-sm text-emerald-600 font-semibold"><TrendingUp size={14} className="mr-1" />Bruttoåtervinning</div>
        </div>
        <div className="glass p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Aktiva Leads</div>
          <div className="text-3xl font-black text-slate-900 stat-number">{s.totalLeads}</div>
          <div className="mt-3 flex items-center text-sm text-slate-500">Totalt i pipeline</div>
        </div>
        <div className="glass p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Top Score ≥9</div>
          <div className="text-3xl font-black text-slate-900 stat-number">{s.topScoreLeads}</div>
          <div className="mt-3 flex items-center text-sm text-emerald-600 font-semibold">Högst prioritet</div>
        </div>
        <div className="glass p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Redo för Audit</div>
          <div className="text-3xl font-black text-slate-900 stat-number">{(s as any).readyForAudit ?? 0}</div>
          <div className="mt-3 flex items-center text-sm text-purple-600 font-semibold">Ready for Audit</div>
        </div>
        <div className="glass p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Senaste Sync</div>
          <SyncIndicator lastRun={s.lastEngineRun} />
          <div className="mt-3 text-xs text-slate-400">{s.lastEngineRun?.finished_at ? new Date(s.lastEngineRun.finished_at + 'Z').toLocaleString('sv-SE') : 'Aldrig'}</div>
        </div>
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

function exportCsv(leads: Lead[]) {
  const header = ['ID', 'Namn', 'SNI', 'Bransch', 'Personalkostnad', 'FoU-avdrag', 'Potential', 'Score', 'Status', 'Tags'].join(',');
  const rows = leads.map(l => [l.id, `"${l.name}"`, l.sni, `"${l.industry}"`, l.personnel_cost, l.rd_deduction, l.potential, l.score, l.status, `"${l.tags.join('; ')}"`].join(','));
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `openrevision_leads_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function ScoreBadge({ score }: { score: number }) {
  const [show, setShow] = useState(false);
  const cls = score >= 10 ? 'score-10' : score >= 9 ? 'score-9' : score >= 8 ? 'score-8' : 'score-low';
  const tips = [
    score >= 3 ? '✅ +3 SNI tech/industri matchar utan FoU-avdrag' : null,
    score >= 6 ? '✅ +3 Ingen specialiserad skatterådgivare nämnd' : null,
    score >= 8 ? '✅ +2 Personalkostnad >15% av omsättning' : null,
    score >= 9 ? '✅ +2 Stark tillväxt i personalkostnader' : null,
  ].filter(Boolean);
  return (
    <div className="relative flex justify-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-md cursor-default ${cls}`}>{score}</div>
      {show && (
        <div className="tooltip-box w-56 whitespace-normal">
          <div className="font-bold mb-1 text-emerald-400">Score {score}/10</div>
          {tips.map((t, i) => <div key={i} className="text-slate-300 leading-relaxed">{t}</div>)}
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
  const [editNotes, setEditNotes] = useState('');

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
            <button onClick={() => exportCsv(filtered)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-lg shadow-slate-200"><Download size={16} /> Exportera CSV</button>
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
                    <td className="px-6 py-4"><ScoreBadge score={lead.score} /></td>
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
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <ScoreBadge score={selectedLead.score} />
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold">Score</div>
                  <div className={`text-2xl font-black ${selectedLead.score >= 9 ? 'text-emerald-600' : 'text-slate-900'}`}>{selectedLead.score}/10</div>
                </div>
                <div className="ml-auto"><span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${selectedLead.status === 'Ready for Audit' ? 'bg-purple-100 text-purple-700' : selectedLead.status === 'API Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{selectedLead.status}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-slate-400 text-[10px] uppercase font-bold mb-1">SNI</div><div className="font-mono font-bold text-slate-800">{selectedLead.sni || '—'}</div></div>
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Bransch</div><div className="text-slate-700 text-xs leading-snug">{selectedLead.industry || '—'}</div></div>
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Personalkostnad</div><div className="font-bold text-slate-800">{selectedLead.personnel_cost || '—'}</div></div>
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-slate-400 text-[10px] uppercase font-bold mb-1">FoU-avdrag</div><div className="font-bold text-red-500">{selectedLead.rd_deduction || '—'}</div></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <div className="text-[10px] text-emerald-600 uppercase font-bold mb-1">Estimerad Återvinningspotential</div>
                <div className="text-2xl font-black text-emerald-700">{selectedLead.potential || 'TBD'}</div>
              </div>
              {selectedLead.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{selectedLead.tags.map(t => <span key={t} className="tag-pill bg-slate-100 text-slate-600">{t}</span>)}</div>}
              <div>
                <div className="text-sm font-bold text-slate-900 mb-2">Anteckningar</div>
                <textarea defaultValue={selectedLead.notes} rows={3} className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none text-slate-700 bg-slate-50" placeholder="Lägg till anteckningar..." />
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> {selectedLead.created_at ? new Date(selectedLead.created_at + 'Z').toLocaleString('sv-SE') : '—'}</div>
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
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [agentLogs, setAgentLogs] = useState<{ text: string; color: string }[]>([]);
  const [running, setRunning] = useState(false);
  const startAgent = (agent: Agent) => {
    setActiveAgent(agent); setAgentLogs([]); setRunning(true);
    const seqs: Record<string, { text: string; color: string; delay: number }[]> = {
      energi: [
        { text: '> Söker bagerier och livsmedelsbolag med SNI 10-15...', color: 'text-slate-400', delay: 800 },
        { text: '> Hämtar energiförbrukningsdata via Greenely API...', color: 'text-slate-400', delay: 2000 },
        { text: '[MATCH] SkiStar AB — snökanoner = industriell process.', color: 'text-emerald-400 font-bold', delay: 3500 },
        { text: '> Beräknar skattebesparning: 43 öre → 0.6 öre/kWh...', color: 'text-slate-400', delay: 5000 },
        { text: 'POTENTIAL: 6.1 MSEK (3-årig retroaktivitet)', color: 'text-emerald-300 text-base font-black', delay: 6500 },
      ],
      default: [
        { text: `> Agent ${agent.name} initialiserad.`, color: 'text-slate-400', delay: 600 },
        { text: '> Läser in HFD-breviks från vektordatabas...', color: 'text-slate-400', delay: 1800 },
        { text: '> Kör Lead Scoring mot pipeline...', color: 'text-slate-400', delay: 3200 },
        { text: '[OK] 3 candidater identifierade för granskning.', color: 'text-emerald-400 font-bold', delay: 4800 },
        { text: 'REDO: No-Cure-No-Pay utkast genererat.', color: 'text-emerald-300 font-black', delay: 6000 },
      ]
    };
    const seq = seqs[agent.id] || seqs.default;
    seq.forEach(({ text, color, delay }) => setTimeout(() => setAgentLogs(p => [...p, { text, color }]), delay));
    setTimeout(() => setRunning(false), 7000);
  };
  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-semibold text-slate-900">Specialiserade AI Agenter</h1><p className="text-slate-500 mt-1">Drivs av Agent Zero's prospekteringslogik och Skatteverkets API:er.</p></header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map(agent => {
          const Icon = AGENT_ICONS[agent.id] || Bot;
          return (
            <div key={agent.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${agent.bg} ${agent.color} flex items-center justify-center group-hover:scale-110 transition-transform`}><Icon size={24} /></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs text-slate-400 font-bold">ONLINE</span></div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{agent.name}</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">{agent.focus}</p>
              <div className="space-y-1.5 border-t border-slate-100 pt-4 mb-5">
                {['API-verifiering', 'HFD Prejudikat-analys', 'No-Cure-No-Pay Outreach'].map(s => <div key={s} className="flex items-center gap-2 text-xs text-slate-600"><ShieldCheck size={12} className="text-emerald-500 shrink-0" />{s}</div>)}
              </div>
              <button onClick={() => startAgent(agent)} className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all" style={{ background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff' }}>▶ Starta Agent</button>
            </div>
          );
        })}
      </div>
      {activeAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70" onClick={() => setActiveAgent(null)}>
          <div className="bg-slate-950 rounded-2xl border border-slate-700 w-full max-w-lg mx-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
              <div className="font-bold text-white flex items-center gap-2"><span>{activeAgent.emoji}</span>{activeAgent.name}</div>
              <button onClick={() => setActiveAgent(null)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="bg-black p-5 h-56 font-mono text-xs overflow-y-auto space-y-1">
              {agentLogs.map((l, i) => <div key={i} className={`terminal-line ${l.color}`}>{l.text}</div>)}
              {running && <div className="text-slate-600 animate-pulse">_</div>}
              {agentLogs.length === 0 && <div className="text-slate-600">&gt; Initialiserar...</div>}
            </div>
            <div className="px-6 py-3 border-t border-slate-800 text-right">
              <button onClick={() => setActiveAgent(null)} className="text-xs text-slate-500 hover:text-white">Stäng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STORAGE_KEY = 'openrevision_checklist';
const CHECKLIST_DATA = [
  {
    title: "1. Finansiella Indikatorer & Grunddata", icon: Search, items: [
      { label: "SNI-kod matchning", desc: "Tech (62010/62020) för FoU-avdrag, industri (10–33) för energiskatt." },
      { label: "Löneintensitetsregeln (15 %)", desc: "Personalkostnad >15% av omsättning = stark FoU-indikator." },
      { label: "Personalkostnadströskel >5 MSEK", desc: "Minimum för att retroaktiv återvinning ska vara lönsam." },
      { label: "Ruta 475-kontroll (FoU)", desc: "Verifiera via API: 0 kr i avdrag trots höga personalkostnader." },
      { label: "Not: Uppskjuten skattefordran", desc: "Oredovisade skattetillgångar — historiska fel." },
      { label: "Kassaflöde: Betald inkomstskatt", desc: "Bolaget måste vara i skattebetalande position." },
      { label: "Not: Ersättning till revisorer", desc: "Saknas specialiserad skatterådgivning? +3 poäng." },
    ]
  },
  {
    title: "2. Juridiska Spearheads (HFD-domar)", icon: ShieldAlert, items: [
      { label: "HFD 2022 ref. 38 — Energiskatt", desc: "Bagerier/livsmedel/skidanläggningar: 0.6 öre/kWh för el i tillverkningsprocessen." },
      { label: "HFD 2024 ref. 52 — Skattetillägg", desc: "Undanröj sanktioner om felet var uppenbart för Skatteverket." },
      { label: "HFD 7071-24 — BRF Moms", desc: "Omsättningsmetod istället för ytmetod vid blandad uthyrning." },
      { label: "HFD 2026 — Högkullen", desc: "Internprissättning underkänd — koncerner med dotterbolagsstrukturer." },
    ]
  },
  {
    title: "3. Digitala Signaler & Bevisföring", icon: Search, items: [
      { label: "Platsannonser: R&D-roller", desc: "Rekrytering av 'System Architects' / 'R&D Engineers' = pågående FoU." },
      { label: "CTO/CEO presentationer (YouTube)", desc: "Teknisk osäkerhet beskriven = nyckelbevis för FoU-avdrag." },
      { label: "Företagshemsida: Vision-AI parsning", desc: "Sök efter 'ny AI-plattform' / 'unika tekniska lösningar' i fritext." },
    ]
  },
];
function ChecklistView() {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } });
  const toggle = (key: string) => setChecked(prev => { const n = { ...prev, [key]: !prev[key] }; localStorage.setItem(STORAGE_KEY, JSON.stringify(n)); return n; });
  const total = CHECKLIST_DATA.flatMap(s => s.items).length;
  const done = Object.values(checked).filter(Boolean).length;
  const copyMd = () => { const md = CHECKLIST_DATA.map(s => `## ${s.title}\n${s.items.map(i => `- [${checked[i.label] ? 'x' : ' '}] **${i.label}** — ${i.desc}`).join('\n')}`).join('\n\n'); navigator.clipboard.writeText(md); };
  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex justify-between items-end">
        <div><h1 className="text-2xl font-semibold text-slate-900">Granskningsmall: Skatteåtervinning</h1><p className="text-slate-500 mt-1">Detaljerad checklista för agenter och analytiker.</p></div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-slate-500">{done}/{total} klara</div>
          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(done / total) * 100}%` }} /></div>
          <button onClick={copyMd} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black"><Download size={12} /> Kopiera MD</button>
        </div>
      </header>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {CHECKLIST_DATA.map((s, idx) => {
          const Icon = s.icon; return (<React.Fragment key={idx}>
            <div className={`px-6 py-4 bg-slate-50 ${idx > 0 ? 'border-t' : 'border-b'} border-slate-200 flex items-center gap-2`}><Icon size={16} className="text-emerald-600" /><h2 className="font-semibold text-slate-900 text-sm">{s.title}</h2></div>
            <div className="px-6 py-4 space-y-3">{s.items.map((item) => (
              <label key={item.label} className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={!!checked[item.label]} onChange={() => toggle(item.label)} className="mt-0.5 accent-emerald-600" />
                <div><div className={`font-medium text-sm transition-colors ${checked[item.label] ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-emerald-700'}`}>{item.label}</div><div className="text-xs text-slate-500 mt-0.5">{item.desc}</div></div>
              </label>
            ))}</div>
          </React.Fragment>);
        })}
      </div>
    </div>
  );
}

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
  const [company, setCompany] = useState('Sleip AI');
  const startScriveFlow = () => {
    if (isSigning) return; setIsSigning(true); setLogs([]);
    const amount = (Math.floor(Math.random() * 2800 + 1500) * 1000).toLocaleString('sv-SE');
    const seq = [
      { text: `> Mottagit webhook: Status [Signed]. BankID verifierat för ${company}.`, color: 'text-emerald-500', delay: 1000 },
      { text: '> Upprättar anslutning till Skatteverket Partner API (Ombudshantering 2.0)...', color: 'text-slate-400', delay: 2500 },
      { text: '> Auth-Token godkänd. Krypterad tunnel etablerad. TLS 1.3.', color: 'text-emerald-400', delay: 3500 },
      { text: '> Hämtar Arbetsgivardeklaration 1.2 (Senaste 72 månaderna)...', color: 'text-slate-400', delay: 5000 },
      { text: '[VARNING] Ruta 475 = 0 SEK för perioden 2019–2025.', color: 'text-amber-400 font-semibold', delay: 8000 },
      { text: `[MATCH] Dold skattetillgång verifierad. Personalkostnad >15% utan FoU-avdrag.`, color: 'text-emerald-500 font-bold', delay: 11000 },
      { text: `► ESTIMERAD ÅTERVINNING: ${amount} SEK`, color: 'text-emerald-300 text-base font-black', delay: 13500 },
    ];
    seq.forEach(({ text, color, delay }) => { setTimeout(() => setLogs(prev => [...prev, { text, color }]), delay); });
    setTimeout(() => setIsSigning(false), 15000);
  };
  return (<div className="space-y-6"><header><h1 className="text-2xl font-semibold text-slate-900">Kund-Onboarding (Scrive Simulation)</h1><p className="text-slate-500 mt-1">Simulering av BankID-onboarding → API-audit flöde.</p></header><div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden grid lg:grid-cols-2">
    <div className="p-8 lg:p-12 flex flex-col justify-center gap-5 border-b lg:border-b-0 lg:border-r border-slate-800">
      <h2 className="text-3xl font-bold text-white">Klartecken för <span className="text-emerald-500">Deep Audit</span></h2>
      <div><label className="text-xs text-slate-400 font-bold uppercase mb-1.5 block">Bolagsnamn</label><input value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" /></div>
      <button onClick={startScriveFlow} disabled={isSigning} className={`w-full py-4 px-8 rounded-xl font-bold text-base transition-all ${isSigning ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'}`}>{isSigning ? 'Kör audit...' : '🔐 Signera med BankID (via Scrive)'}</button>
    </div>
    <div className="bg-black p-6 flex flex-col h-[400px] font-mono text-xs overflow-y-auto space-y-1">{logs.map((l, i) => <div key={i} className={`terminal-line ${l.color}`}>{l.text}</div>)}{logs.length === 0 && <div className="text-slate-600">&gt; Väntar på BankID-signatur...</div>}</div>
  </div></div>);
}

function ArchitectureView() { return (<div className="space-y-6"><header><h1 className="text-2xl font-semibold text-slate-900">Tech Stack</h1><p className="text-slate-500 mt-1">Arkitekturen bakom OpenRevision.</p></header><div className="bg-white p-6 rounded-2xl border border-slate-200"><pre className="text-xs text-slate-600 whitespace-pre-wrap">{JSON.stringify({ Core: "OpenClaw / Agent Zero", Knowledge: "NotebookLM RAG", Data: "Skatteverket / Roaring / Bolagsverket", Database: "SQLite (better-sqlite3)", Frontend: "React + Vite + TailwindCSS", API: "Express.js", Automation: "n8n / Webhooks / launchd" }, null, 2)}</pre></div></div>); }

function EngineView({ stats }: { stats: DashboardStats | null }) { return (<div className="space-y-6"><header><h1 className="text-2xl font-semibold text-slate-900">Core Engine (macOS)</h1><p className="text-slate-500 mt-1">Python-baserad lead scoring och regelmotor.</p></header><div className="bg-slate-900 p-6 rounded-2xl font-mono text-sm space-y-2"><div className="text-emerald-400">[SYSTEM ONLINE] — M4 Neural Engine active — SQLite DB Ready</div><div className="text-slate-400">rules_engine.py  → {stats?.lastEngineRun ? '✅ Loaded' : '⏳ Idle'}</div><div className="text-slate-400">lead_scoring.py  → {stats?.lastEngineRun ? '✅ Loaded' : '⏳ Idle'}</div><div className="text-slate-400">hybrid_memory.py → ✅ Persistent</div><div className="text-slate-400">sync_to_db.py    → {stats?.lastEngineRun ? `Last run: ${stats.lastEngineRun.finished_at || 'running...'}` : 'Never run'}</div></div></div>); }

function HfdView({ rulings }: { rulings: HfdRuling[] }) {
  const tagColors: Record<string, string> = { 'Prejudikat': 'bg-purple-100 text-purple-700', 'Ny Praxis': 'bg-blue-100 text-blue-700', 'Praxis 2025': 'bg-emerald-100 text-emerald-700', 'Ny Dom 2026': 'bg-red-100 text-red-700', 'Praxis': 'bg-amber-100 text-amber-700', 'Ny Dom': 'bg-indigo-100 text-indigo-700' };
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div><h1 className="text-2xl font-semibold text-slate-900">HFD-Bevakning</h1><p className="text-slate-500 mt-1">Prejudicerande domar — juridiska spearheads för skatteåtervinning.</p></div>
        <div className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-full">{(rulings || []).length} aktiva domar</div>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {(rulings || []).map(r => (
          <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors leading-snug">{r.title}</h3>
              {r.tag && <span className={`tag-pill shrink-0 ${tagColors[r.tag] || 'bg-slate-100 text-slate-600'}`}>{r.tag}</span>}
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Chat Widget ───────────────────────────────────────────────────

const SUGGESTIONS = [
  'Förklara HFD 2022 ref. 38',
  'Vad är lead scoring?',
  'Hur fungerar No-Cure-No-Pay?',
  'Vilka SNI-koder matchar FoU-avdrag?',
];

function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Hej! Jag är Agent Zero (Lite). Hur kan jag hjälpa dig med prospektering, HFD-domar eller skatteåtervinning idag?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    const updatedMsgs = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(updatedMsgs);
    setLoading(true);

    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      const client = new GoogleGenAI({ apiKey });
      const contents = updatedMsgs.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
        config: {
          systemInstruction: 'Du är Agent Zero, en AI-assistent i OpenRevision. Du är expert på svensk skatteåtervinning (FoU-avdrag, energiskatt, fastighetsmoms, HFD-domar). Svara kortfattat, professionellt och på svenska.',
        }
      });
      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Kunde inte generera svar.' }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ Fel: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

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
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="p-2 rounded-xl disabled:opacity-40 transition-all text-white" style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}>
                <Send size={16} />
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
