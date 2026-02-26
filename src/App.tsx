import {
    Activity,
    BarChart3,
    Bot,
    Building2,
    Car,
    CheckSquare,
    Database,
    Download,
    FileSignature,
    FileText,
    Filter,
    Layers,
    Menu,
    Printer,
    Scale,
    Search,
    Server,
    Settings,
    ShieldAlert,
    ShieldCheck,
    TrendingUp,
    Users,
    X,
    Zap
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// --- Mock Data ---

const AGENTS = [
  {
    id: 'sanktion',
    name: 'Sanktionsexperten',
    emoji: '🛡️⚖️',
    focus: 'Undanröja skattetillägg (HFD 2024 ref. 52)',
    icon: ShieldAlert,
    color: 'text-slate-500',
    bg: 'bg-slate-100',
  },
  {
    id: 'fastighet',
    name: 'Fastighetsmomsaren',
    emoji: '🏢💰',
    focus: 'Momsåtervinning för BRF:er via omsättningsmetoden',
    icon: Building2,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
  },
  {
    id: 'leasing',
    name: 'Leasing-Auditören',
    emoji: '🚗🔍',
    focus: 'Momsfel vid finansiell leasing och vagnparker',
    icon: Car,
    color: 'text-cyan-500',
    bg: 'bg-cyan-100',
  },
  {
    id: 'energi',
    name: 'Energirevision-Spearhead',
    emoji: '⚡🏭',
    focus: 'Återkrav av energiskatt (HFD 2022 ref. 38)',
    icon: Zap,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100',
  },
  {
    id: 'fou_bevis',
    name: 'FoU-Bevis-Agent',
    emoji: '🔬📝',
    focus: 'Säkrar bevisbörda via CTO-intervjuer',
    icon: FileText,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
  }
];

// Unified leads data from research
const LEADS = [
  {
    id: 'L001',
    name: 'Electrum Automation AB',
    sni: '62010 / 27120',
    industry: 'Elartiklar & Automation',
    personnelCost: '18.4 MSEK',
    rdDeduction: '0 SEK',
    score: 10,
    status: 'Ready for Audit',
    tags: ['Addtech', 'FoU-avdrag', 'Hög Potential'],
    potential: '2.4 - 3.8 MSEK'
  },
  {
    id: 'L002',
    name: 'Sleip AI',
    sni: '62010',
    industry: 'AI Plattform / Tech',
    personnelCost: '12.3 MSEK',
    rdDeduction: '0 SEK',
    score: 10,
    status: 'Ready for Audit',
    tags: ['AI-utveckling', 'FoU-avdrag'],
    potential: '1.2 - 2.0 MSEK'
  },
  {
    id: 'L003',
    name: 'SkiStar AB',
    sni: '93290',
    industry: 'Fritidsanläggningar',
    personnelCost: '450 MSEK',
    rdDeduction: 'N/A',
    score: 9,
    status: 'API Verified',
    tags: ['Energiskatt', 'Snötillverkning', 'HFD 2022 ref. 38'],
    potential: '5.2 MSEK'
  },
  {
    id: 'L004',
    name: 'Crescocito AB',
    sni: '71120',
    industry: 'Teknisk konsulting',
    personnelCost: '8.2 MSEK',
    rdDeduction: '0 SEK',
    score: 9,
    status: 'Screening',
    tags: ['Teknisk utveckling', 'FoU-avdrag'],
    potential: '0.8 - 1.2 MSEK'
  },
  {
    id: 'L005',
    name: 'C. Gunnarssons Verkstads AB',
    sni: '28410',
    industry: 'Maskintillverkning',
    personnelCost: '22.1 MSEK',
    rdDeduction: 'Partial',
    score: 9,
    status: 'Screening',
    tags: ['Maskinkonstruktion', 'FoU-avdrag'],
    potential: '1.5 MSEK'
  },
  {
    id: 'L006',
    name: 'Kry International AB',
    sni: '62010',
    industry: 'Digital Hälsa',
    personnelCost: '145 MSEK',
    rdDeduction: 'Partial',
    score: 8,
    status: 'Deep Dive',
    tags: ['Plattformsutveckling', 'FoU-avdrag'],
    potential: '4.5 - 8.0 MSEK'
  },
  {
    id: 'L007',
    name: 'Addtech Nordic AB',
    sni: '70100',
    industry: 'Huvudkontor / Koncern',
    personnelCost: '35.2 MSEK',
    rdDeduction: 'N/A',
    score: 8,
    status: 'Screening',
    tags: ['Energiskatt', 'Koncernmoms'],
    potential: '1.2 MSEK'
  }
];

// --- Components ---

function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: { activeTab: string, setActiveTab: (t: string) => void, isOpen: boolean, setIsOpen: (o: boolean) => void }) {
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
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-white" />
              </div>
              OpenRevision
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono uppercase">Internal Framework</div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">IM</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">iMac Pro Specialist</div>
              <div className="text-[10px] text-slate-500 truncate uppercase">Level 10 Admin</div>
            </div>
            <Settings size={16} className="text-slate-500 cursor-pointer hover:text-white" />
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardView() {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Översikt</h1>
          <p className="text-slate-500 mt-1">Sammanställning av skatteåtervinning och aktiva leads.</p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Printer size={16} /> Skriv ut rapport
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Potential</div>
          <div className="text-3xl font-light text-slate-900">42.5 MSEK</div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
            <TrendingUp size={16} className="mr-1" /> +12% denna månad
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Aktiva Leads</div>
          <div className="text-3xl font-light text-slate-900">124</div>
          <div className="mt-4 flex items-center text-sm text-slate-500">
            Drivs av Agent Zero Logik
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Top Score (10/10)</div>
          <div className="text-3xl font-light text-slate-900">15</div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
             Högst potential hittad
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">API Sync Status</div>
          <div className="flex items-center gap-2 text-3xl font-light text-slate-900">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-500">
            Skatteverket + Roaring
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-slate-900">Senaste HFD-bevakning</h2>
            <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700">Se alla domar</button>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="p-6 flex gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Zap size={20} className="text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">HFD 2022 ref. 38 (Energiskatt)</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">Prejudikat</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Kravet på "huvudsaklig" industriell verksamhet raderat. Bagerier och livsmedelsbutiker med tillverkning kan nu få retroaktiv nedsättning.
                </p>
              </div>
            </div>
            <div className="p-6 flex gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} className="text-slate-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">HFD 2024 ref. 52 (Sanktioner)</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">Ny Praxis</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Möjliggör undanröjande av skattetillägg om felet varit "uppenbart" eller lätt att identifiera för Skatteverket.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-slate-900">System Activity Log</h2>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="p-6 font-mono text-xs space-y-3">
             <div className="flex gap-3">
               <span className="text-slate-400">[00:32]</span>
               <span className="text-emerald-600">SUCCESS</span>
               <span className="text-slate-700">Leads consolidated into MASTER_LEADS_LIST.md</span>
             </div>
             <div className="flex gap-3">
               <span className="text-slate-400">[00:15]</span>
               <span className="text-blue-600">INFO</span>
               <span className="text-slate-700">Agent Zero started PDF parsing for Annual Reports</span>
             </div>
             <div className="flex gap-3">
               <span className="text-slate-400">[23:55]</span>
               <span className="text-amber-600">WARN</span>
               <span className="text-slate-700">Roaring API: Limit reached for today (dev tier)</span>
             </div>
             <div className="flex gap-3">
               <span className="text-slate-400">[23:35]</span>
               <span className="text-emerald-600">SUCCESS</span>
               <span className="text-slate-700">API_WISHLIST.md updated with 124 Skatteverket endpoints</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadsView() {
  const chartData = useMemo(() =>
    [...LEADS].sort((a, b) => b.score - a.score).map(lead => ({
      name: lead.name.length > 15 ? lead.name.substring(0, 15) + '...' : lead.name,
      fullName: lead.name,
      score: lead.score,
      industry: lead.industry
    })), []);

  const getScoreColor = (score: number) => {
    if (score >= 10) return '#8b5cf6'; // purple-500
    if (score >= 8) return '#10b981'; // emerald-500
    if (score >= 6) return '#f59e0b'; // amber-500
    return '#64748b'; // slate-500
  };

  const exportToPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Prospektering & Lead Scoring</h1>
          <p className="text-slate-500 mt-1">Research-leads från NotebookLM och Agent Zero.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToPdf}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-lg shadow-slate-200"
          >
            <Download size={16} /> Exportera Leads (PDF)
          </button>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Sök bolag eller SNI..."
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full"
            />
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
           <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recovery Score Chart</h2>
            <p className="text-xs text-slate-500">Topp-leads från dagens research.</p>
          </div>
          <div className="flex-1 h-64 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide domain={[0, 10]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2 rounded shadow-xl text-xs border border-slate-700">
                          <p className="font-bold">{data.fullName}</p>
                          <p className="text-emerald-400 font-bold">Score: {data.score}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <div className="flex gap-2">
               <button className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">All Leads</button>
               <button className="px-3 py-1 bg-white text-slate-600 text-xs font-medium border border-slate-200 rounded-full hover:bg-slate-50">FoU</button>
               <button className="px-3 py-1 bg-white text-slate-600 text-xs font-medium border border-slate-200 rounded-full hover:bg-slate-50">Energi</button>
             </div>
             <Filter size={16} className="text-slate-400" />
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">ID & Företag</th>
                  <th className="px-6 py-4">SNI & Bransch</th>
                  <th className="px-6 py-4">Est. Potential</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {LEADS.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] font-mono text-slate-400 w-8">{lead.id}</div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{lead.name}</div>
                          <div className="flex gap-1 mt-1">
                            {lead.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-tighter">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-400">{lead.sni}</div>
                      <div className="text-slate-600 text-xs mt-0.5">{lead.industry}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="font-bold text-emerald-600">~{lead.potential}</div>
                       <div className="text-[10px] text-slate-400 uppercase">Bruttoåtervinning</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm ${
                          lead.score >= 10 ? 'bg-purple-500' :
                          lead.score >= 8 ? 'bg-emerald-500' :
                          'bg-amber-500'
                        }`}>
                          {lead.score}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        lead.status === 'Ready for Audit' ? 'bg-purple-100 text-purple-700' :
                        lead.status === 'API Verified' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentsView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Specialiserade AI Agenter</h1>
        <p className="text-slate-500 mt-1">Drivs av Agent Zero's prospekteringslogik och Skatteverkets API:er.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          return (
            <div key={agent.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${agent.bg} ${agent.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon size={24} />
                </div>
                <div className="text-2xl">{agent.emoji}</div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4 h-10">{agent.focus}</p>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kärnkompetens</div>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    Automatiserad API-verifiering
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    HFD Prejudikat-analys
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    No-Cure-No-Pay Outreach
                  </li>
                </ul>
              </div>

              <button className="mt-6 w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors uppercase tracking-wider">
                Starta Agent
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChecklistView() {
  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Granskningsmall: Skatteåtervinning</h1>
        <p className="text-slate-500 mt-1">Detaljerad checklista för agenter och analytiker.</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {CHECKLIST_DATA.map((section, idx) => {
          const Icon = section.icon;
          return (
            <React.Fragment key={idx}>
              <div className={`p-6 bg-slate-50 ${idx > 0 ? 'border-t border-slate-200' : 'border-b border-slate-200'}`}>
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Icon size={18} className="text-emerald-600" />
                  {section.title}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {section.items.map((item, itemIdx) => (
                  <label key={itemIdx} className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" />
                    <div>
                      <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">{item.label}</div>
                      <div className="text-sm text-slate-500">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

const CHECKLIST_DATA = [
  {
    title: "1. Finansiella Indikatorer & Grunddata",
    icon: Search,
    items: [
      { label: "SNI-kod matchning", desc: "Fokusera på tech/programmering (62010, 62020) för FoU-avdrag, eller tillverkning/industri (10–33) för energiskatt." },
      { label: "Löneintensitetsregeln (15 %)", desc: "Flagga bolag i tech-sektorn vars personalkostnader överstiger 15 % av nettoomsättningen. Detta är en stark indikator på dolda FoU-möjligheter." },
      { label: "Personalkostnadströskel", desc: "Prioritera bolag med totala personalkostnader över 5 MSEK." },
      { label: "Ruta 475-kontroll", desc: "Verifiera via Skatteverkets Partner-API om bolaget rapporterar 0 kr i FoU-avdrag trots de finansiella indikatorerna ovan." },
      { label: "Not: Uppskjuten skattefordran", desc: "Leta efter oredovisade skattetillgångar som kan tyda på historiska fel." },
      { label: "Kassaflödesanalys - Betald skatt", desc: "Kontrollera att bolaget faktiskt är i en skattebetalande position (krävs för återvinning)." }
    ]
  },
  {
    title: "2. Juridiska Spearheads (Rättspraxis & Domar)",
    icon: ShieldAlert,
    items: [
      { label: "HFD 2022 ref. 38 (Energiskatt)", desc: "Hitta bolag med industriella processer som inte ses som traditionell industri (ex. bagerier, livsmedelsbutiker med chark, skidanläggningar)." },
      { label: "HFD 2024 ref. 52 (Skattetillägg)", desc: "Identifiera företag som påförts skattetillägg trots att felet i deklarationen var \"uppenbart\" för Skatteverket att se i t.ex. räkenskapsschemat." },
      { label: "HFD 7071-24 (Moms för BRF)", desc: "Sök efter bostadsrättsföreningar med höga kommersiella lokalhyror som kan använda omsättningsmetoden retroaktivt istället för ytmetoden." }
    ]
  }
];

function IntegrationsView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">API & Event-Driven Data</h1>
        <p className="text-slate-500 mt-1">Hantera webhooks och datakällor för automatiserad prospektering.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {INTEGRATIONS_DATA.map((category, idx) => {
          const Icon = category.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${category.bg} ${category.color} flex items-center justify-center shrink-0`}>
                  <Icon size={20} />
                </div>
                <h2 className="font-semibold text-slate-900">{category.category}</h2>
              </div>
              <div className="p-5 flex-1">
                <ul className="space-y-4">
                  {category.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{item.name}</div>
                        <div className="text-sm text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const INTEGRATIONS_DATA = [
  {
    category: "1. Skatteverket (Partner-API:er)",
    icon: Database,
    color: "text-blue-600",
    bg: "bg-blue-100",
    items: [
      { name: "Ombudshantering 2.0", desc: "Kontrollerar registrerade behörigheter och verifierar fullmakter." },
      { name: "Arbetsgivardeklaration 1.2", desc: "Kontrollerar Ruta 475 (FoU-avdrag) och Ruta 470 bakåt i tiden." },
      { name: "Skattekonto 1.0", desc: "Verifierar skattebetalande position (saldo och transaktioner)." },
      { name: "Beskattningsengagemang 1.0", desc: "Hämtar F-skatt, moms- och arbetsgivarregistrering." }
    ]
  },
  {
    category: "2. Företags- och Finansdata",
    icon: TrendingUp,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
    items: [
      { name: "Bolagsverket / Roaring", desc: "Realtidsdata om SNI-koder, anställda och personalkostnader." },
      { name: "Enento / Roaring (XBRL)", desc: "Digital parsning av noter i årsredovisningar (ex. uppskjuten skattefordran)." },
      { name: "SCB (Statistikmyndigheten)", desc: "Bransch-benchmarking av personalkostnader för 15-procentsregeln." }
    ]
  }
];

function OnboardingView() {
  const [isSigning, setIsSigning] = useState(false);
  const [logs, setLogs] = useState<{text: string, color: string}[]>([]);

  const startScriveFlow = () => {
    if (isSigning) return;
    setIsSigning(true);
    setLogs([]);

    const sequence = [
      { text: "> Mottagit webhook: Status [Closed]. BankID verifierat.", color: "text-emerald-500", delay: 1000 },
      { text: "> Upprättar anslutning till Skatteverket Partner API (Ombudshantering 2.0)...", color: "text-slate-400", delay: 2500 },
      { text: "> Auth-Token godkänd. Krypterad tunnel etablerad.", color: "text-emerald-400", delay: 3500 },
      { text: "> Hämtar Arbetsgivardeklaration 1.2 (Senaste 72 månaderna)...", color: "text-slate-400", delay: 5000 },
      { text: "[VARNING] Ruta 475 = 0 SEK för perioden 2023-2025.", color: "text-amber-400 font-medium", delay: 8000 },
      { text: "[MATCH] Dold skattetillgång verifierad. Oredovisat FoU-avdrag.", color: "text-emerald-500 font-bold", delay: 12500 },
      { text: "ESTIMERAD ÅTERVINNING: 3 140 000 SEK", color: "text-emerald-400 text-lg font-bold", delay: 14000 }
    ];

    sequence.forEach(({text, color, delay}) => {
      setTimeout(() => {
        setLogs(prev => [...prev, {text, color}]);
      }, delay);
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Kund-Onboarding (Scrive Simulation)</h1>
        <p className="text-slate-500 mt-1">Simulering av BankID-onboarding för CFO.</p>
      </header>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden grid lg:grid-cols-2">
        <div className="p-8 lg:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-800">
          <h2 className="text-3xl font-bold text-white mb-4">
            Klartecken för <span className="text-emerald-500">Deep Audit</span>
          </h2>
          <button
            onClick={startScriveFlow}
            disabled={isSigning}
            className={`w-full py-4 px-8 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-3 ${
              isSigning ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
            }`}
          >
            {isSigning ? 'Inväntar signatur...' : 'Signera med BankID (via Scrive)'}
          </button>
        </div>
        <div className="bg-black p-6 flex flex-col h-[400px] font-mono text-xs overflow-y-auto">
           {logs.map((log, i) => <div key={i} className={log.color}>{log.text}</div>)}
        </div>
      </div>
    </div>
  );
}

function ArchitectureView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Tech Stack</h1>
        <p className="text-slate-500 mt-1">Arkitekturen bakom OpenRevision.</p>
      </header>
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
         <pre className="text-xs text-slate-600 whitespace-pre-wrap">
           {JSON.stringify({
             "Core": "OpenClaw / Agent Zero",
             "Knowledge": "NotebookLM RAG",
             "Data": "Skatteverket / Roaring / Bolagsverket",
             "Automation": "n8n / Webhooks"
           }, null, 2)}
         </pre>
      </div>
    </div>
  );
}

function EngineView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Core Engine (macOS)</h1>
      </header>
      <div className="bg-slate-900 p-6 rounded-2xl font-mono text-emerald-400 text-sm">
        [SYSTEM ONLINE] - M4 Neural Engine active - ChromaDB Ready
      </div>
    </div>
  );
}

function HfdView() {
  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-2xl font-semibold text-slate-900">HFD-Bevakning</h1>
      </header>
      <div className="grid gap-4">
        {HFD_RULINGS.map(r => (
          <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold">{r.title}</h3>
            <p className="text-sm text-slate-500">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('leads'); // Default to leads for tomorrow
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          <div className="flex-1 flex justify-center lg:justify-start">
             <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Activity size={14} className="text-emerald-500" />
                System Health: Optimal
             </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-slate-900 uppercase">Feb 25, 2026</div>
              <div className="text-[10px] text-slate-400 uppercase">Stockholm, SE</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">
               <ShieldCheck size={18} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 print:p-0">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'leads' && <LeadsView />}
          {activeTab === 'agents' && <AgentsView />}
          {activeTab === 'integrations' && <IntegrationsView />}
          {activeTab === 'checklist' && <ChecklistView />}
          {activeTab === 'hfd' && <HfdView />}
          {activeTab === 'onboarding' && <OnboardingView />}
          {activeTab === 'architecture' && <ArchitectureView />}
          {activeTab === 'engine' && <EngineView />}
        </main>
      </div>

      {/* --- Print View: Lead Prospecting Report --- */}
      <div className="hidden print:block fixed inset-0 bg-white p-10 text-slate-900 z-[9999]">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-5">
            <div>
              <h1 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900">Lead Prospecting Report</h1>
              <p className="text-slate-500 mt-1 text-sm">EnergiRevision — Genererat {new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <TrendingUp size={40} className="text-emerald-600 ml-auto" />
              <p className="text-[10px] text-slate-400 mt-1">OpenRevision Framework</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-2xl font-bold text-emerald-600">{LEADS.length}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Totala Leads</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-2xl font-bold text-emerald-600">{LEADS.filter(l => l.score >= 9).length}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Score 9–10 (Hög Potential)</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-2xl font-bold text-emerald-600">{LEADS.filter(l => l.status === 'Ready for Audit').length}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Klara för Revision</p>
            </div>
          </div>

          {/* Leads Table */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 border-b pb-2">Identifierade Prospekt</h2>
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[9px] tracking-wider">
                  <th className="py-2 px-2">ID</th>
                  <th className="py-2 px-2">Bolag</th>
                  <th className="py-2 px-2">Bransch</th>
                  <th className="py-2 px-2">Personalkostnad</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2 text-right">Score</th>
                  <th className="py-2 px-2 text-right">Estimerad Potential</th>
                </tr>
              </thead>
              <tbody>
                {LEADS.map((lead, i) => (
                  <tr key={lead.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2 px-2 text-slate-400">{lead.id}</td>
                    <td className="py-2 px-2 font-bold text-slate-900">{lead.name}</td>
                    <td className="py-2 px-2 text-slate-600">{lead.industry}</td>
                    <td className="py-2 px-2 text-slate-600">{lead.personnelCost}</td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-100 text-emerald-700">{lead.status}</span>
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-slate-800">{lead.score}/10</td>
                    <td className="py-2 px-2 text-right font-bold text-emerald-700">{lead.potential}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="fixed bottom-8 left-10 right-10 text-[8px] text-slate-400 border-t pt-3 flex justify-between">
            <span>EnergiRevision — Konfidentiellt — Rapport-ID: {Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
            <span>Sida 1 av 1 · {new Date().toLocaleDateString('sv-SE')}</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: white !important; }
          header, nav, aside, button, .no-print { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          @page { margin: 0; }
        }
      `}} />
    </div>
  );
}
