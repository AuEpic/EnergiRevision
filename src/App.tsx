import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Bot, 
  CheckSquare, 
  Settings, 
  Search,
  ShieldAlert,
  Building2,
  Car,
  Zap,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Database,
  Terminal,
  Layers,
  Link,
  Cpu,
  FileSignature
} from 'lucide-react';

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
  },
  {
    id: 'k10',
    name: 'K10-Optimeraren',
    emoji: '📊💼',
    focus: '3:12-optimering & sparat utdelningsutrymme',
    icon: TrendingUp,
    color: 'text-indigo-500',
    bg: 'bg-indigo-100',
  },
  {
    id: 'esg',
    name: 'ESG-Auditör',
    emoji: '🌱🔋',
    focus: 'Gröna skatteavdrag & subventioner',
    icon: Zap,
    color: 'text-green-500',
    bg: 'bg-green-100',
  }
];

const LEADS = [
  {
    id: 1,
    name: 'TechNova Solutions AB',
    sni: '62010',
    industry: 'Dataprogrammering',
    personnelCost: '18.5 MSEK',
    rdDeduction: '0 SEK',
    score: 9,
    agent: 'sanktion', // Just for UI relation
    status: 'Deep Dive',
    tags: ['FoU-avdrag', 'Hög Potential']
  },
  {
    id: 2,
    name: 'Svea Finbageri AB',
    sni: '10710',
    industry: 'Tillverkning av bröd',
    personnelCost: '8.2 MSEK',
    rdDeduction: 'N/A',
    score: 8,
    agent: 'energi',
    status: 'API Verified',
    tags: ['Energiskatt', 'HFD 2022 ref. 38']
  },
  {
    id: 3,
    name: 'BRF Solrosen',
    sni: '68202',
    industry: 'Fastighetsförvaltning',
    personnelCost: '1.1 MSEK',
    rdDeduction: 'N/A',
    score: 7,
    agent: 'fastighet',
    status: 'Screening',
    tags: ['Momsåtervinning', 'Blandad verksamhet']
  },
  {
    id: 4,
    name: 'Konsultgruppen Syd AB',
    sni: '70220',
    industry: 'Företagsrådgivning',
    personnelCost: '25.4 MSEK',
    rdDeduction: '0 SEK',
    score: 6,
    agent: 'leasing',
    status: 'Screening',
    tags: ['Leasingmoms', 'Stor vagnpark']
  }
];

// --- Components ---

function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const navItems = [
    { id: 'dashboard', label: 'Översikt', icon: BarChart3 },
    { id: 'leads', label: 'Prospektering', icon: Users },
    { id: 'agents', label: 'AI Agenter', icon: Bot },
    { id: 'integrations', label: 'API & Data', icon: Database },
    { id: 'checklist', label: 'Granskningsmall', icon: CheckSquare },
    { id: 'onboarding', label: 'Kund-Onboarding', icon: FileSignature },
    { id: 'architecture', label: 'Tech Stack', icon: Layers },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          OpenClaw
        </div>
        <div className="text-xs text-slate-500 mt-1 font-mono">Svensk Skatteåtervinning AB</div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-sm text-slate-400 hover:text-white transition-colors">
          <Settings size={18} />
          Inställningar
        </button>
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Översikt</h1>
        <p className="text-slate-500 mt-1">Sammanställning av skatteåtervinning och aktiva leads.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Identifierad Potential (Est.)</div>
          <div className="text-3xl font-light text-slate-900">42.5 MSEK</div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
            <TrendingUp size={16} className="mr-1" /> +12% denna månad
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Aktiva Leads (Score &gt; 7)</div>
          <div className="text-3xl font-light text-slate-900">124</div>
          <div className="mt-4 flex items-center text-sm text-slate-500">
            Drivs av Agent Zero Logik
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">API Anrop (Skatteverket/Roaring)</div>
          <div className="text-3xl font-light text-slate-900">8,402</div>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium">
            Systemet är uppkopplat
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-900">Senaste HFD-bevakning</h2>
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
                Kravet på "huvudsaklig" industriell verksamhet raderat. Bagerier och livsmedelsbutiker med tillverkning kan nu få retroaktiv nedsättning till 0,6 öre/kWh.
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
                Möjliggör undanröjande av skattetillägg om felet varit "uppenbart" eller lätt att identifiera för Skatteverket vid normal granskning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadsView() {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Prospektering & Lead Scoring</h1>
          <p className="text-slate-500 mt-1">Identifierade bolag baserat på SNI, personalkostnader och API-data.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Sök bolag eller SNI..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64"
          />
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Företag</th>
              <th className="px-6 py-4">SNI & Bransch</th>
              <th className="px-6 py-4">Personalkostnad</th>
              <th className="px-6 py-4">FoU-avdrag</th>
              <th className="px-6 py-4">Lead Score</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {LEADS.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{lead.name}</div>
                  <div className="flex gap-1 mt-1">
                    {lead.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-xs text-slate-500">{lead.sni}</div>
                  <div className="text-slate-700 mt-0.5">{lead.industry}</div>
                </td>
                <td className="px-6 py-4 text-slate-700">{lead.personnelCost}</td>
                <td className="px-6 py-4">
                  {lead.rdDeduction === '0 SEK' ? (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                      <AlertCircle size={14} /> 0 SEK
                    </span>
                  ) : (
                    <span className="text-slate-500">{lead.rdDeduction}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      {lead.score}
                    </div>
                    <span className="text-xs text-slate-500">/ 10</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    lead.status === 'Deep Dive' ? 'bg-purple-100 text-purple-700' :
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
  );
}

function AgentsView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Specialiserade AI Agenter</h1>
        <p className="text-slate-500 mt-1">Drivs av Agent Zero's prospekteringslogik och Skatteverkets API:er.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          return (
            <div key={agent.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${agent.bg} ${agent.color} flex items-center justify-center`}>
                  <Icon size={24} />
                </div>
                <div className="text-2xl">{agent.emoji}</div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4 h-10">{agent.focus}</p>
              
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kärnkompetens</div>
                <ul className="text-sm text-slate-700 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Automatiserad API-verifiering
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    HFD Prejudikat-analys
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    No-Cure-No-Pay Outreach
                  </li>
                </ul>
              </div>
              
              <button className="mt-6 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors">
                Konfigurera Agent
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
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Search size={18} className="text-emerald-600" />
            Steg 1: Initial screening & Lead Scoring
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" />
            <div>
              <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">SNI-kod check</div>
              <div className="text-sm text-slate-500">Tillhör bolaget en tech-sektor (62010, 62020) eller tillverkning (10–33)?</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" />
            <div>
              <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">Löneintensitets-analys</div>
              <div className="text-sm text-slate-500">Överstiger bolagets personalkostnader 15 % av nettoomsättningen? (Kritiskt för FoU-avdrag i techbolag).</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" />
            <div>
              <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">Energiskatte-potential</div>
              <div className="text-sm text-slate-500">Har bolaget industriella processer (ex. bageri, chark) men är inte klassat som ett renodlat industribolag?</div>
            </div>
          </label>
        </div>

        <div className="p-6 border-y border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" />
            Steg 2: Djupanalys av årsredovisningen (Deep Dive)
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" />
            <div>
              <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">Not: FoU-avdrag</div>
              <div className="text-sm text-slate-500">Rapporterar bolaget 0 kr i FoU-avdrag trots aktiverade utgifter för mjukvaruutveckling?</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" />
            <div>
              <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">Kassaflödesanalys: Betald skatt</div>
              <div className="text-sm text-slate-500">Är bolaget i en skattebetalande position? (Krävs för avräkning).</div>
            </div>
          </label>
        </div>

        <div className="p-6 border-y border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Database size={18} className="text-emerald-600" />
            Steg 3: Verifiering via Skatteverkets API:er (kräver fullmakt)
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" />
            <div>
              <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">Kontroll av Arbetsgivardeklaration (Ruta 475)</div>
              <div className="text-sm text-slate-500">Visa det faktiska nyttjade FoU-avdraget månad för månad under de senaste 6 åren.</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input type="checkbox" className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" />
            <div>
              <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">Skattekonto-avstämning</div>
              <div className="text-sm text-slate-500">Verifiera att inga tidigare rättelser eller utbetalningar redan har registrerats.</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

function IntegrationsView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">API & Event-Driven Data</h1>
        <p className="text-slate-500 mt-1">Hantera webhooks och datakällor för automatiserad prospektering.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Link size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Roaring / Bolagsverket Webhooks</h3>
              <p className="text-sm text-slate-500">Event-driven prospektering</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Triggar Agent Zero direkt när en ny årsredovisning laddas upp för mål-SNI-koder. Möjliggör outreach samma vecka som datan blir offentlig.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Aktiv</span>
            <button className="text-blue-600 hover:underline font-medium">Konfigurera</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <FileSignature size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Scrive E-signering</h3>
              <p className="text-sm text-slate-500">BankID Fullmaktshantering</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Webhook-mottagare som lyssnar på signerade fullmakter och automatiskt hämtar Skatteverkets API-data (Arbetsgivardeklaration & Skattekonto).
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">Aktiv</span>
            <button className="text-blue-600 hover:underline font-medium">Konfigurera</button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      { text: "> Parsar Ruta 475 (FoU-avdrag) och Ruta 470 (Underlag)...", color: "text-slate-400", delay: 6500 },
      { text: "[VARNING] Ruta 475 = 0 SEK för perioden 2023-2025.", color: "text-amber-400 font-medium", delay: 8000 },
      { text: "> Hämtar Roaring-data: Personalkostnader uppgår till 18.4 MSEK.", color: "text-slate-400", delay: 9500 },
      { text: "> Matchar mot SNI 62010 (Dataprogrammering) & HFD 2024 praxis...", color: "text-slate-400", delay: 11000 },
      { text: "[MATCH] Dold skattetillgång verifierad. Oredovisat FoU-avdrag.", color: "text-emerald-500 font-bold", delay: 12500 },
      { text: "> Beräknar retroaktiv återbetalningspotential...", color: "text-slate-400", delay: 14000 },
      { text: "========================================", color: "text-slate-500", delay: 15000 },
      { text: "ESTIMERAD ÅTERVINNING: 3 140 000 SEK", color: "text-emerald-400 text-lg font-bold", delay: 15500 },
      { text: "========================================", color: "text-slate-500", delay: 16000 },
      { text: "> Genererar No-Cure-No-Pay avtal... Klar.", color: "text-slate-400", delay: 17500 }
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
        <p className="text-slate-500 mt-1">Så här upplever CFO:n den friktionsfria BankID-signeringen.</p>
      </header>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden grid lg:grid-cols-2">
        <div className="p-8 lg:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-800">
          <h2 className="text-3xl font-bold text-white mb-4">
            Klartecken för <span className="text-emerald-500">Deep Audit</span>
          </h2>
          <p className="text-slate-400 mb-8">
            Vi har identifierat anomalier i era offentliga finansiella data som tyder på outnyttjade avdrag. För att exakt beräkna återvinningsbeloppet behöver vår AI en tillfällig läsbehörighet.
          </p>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-8">
            <h4 className="text-white font-medium mb-1">Läsbehörighet i 30 dagar (NDA inkluderat)</h4>
            <p className="text-sm text-slate-400">Ger endast rätt att läsa Arbetsgivardeklaration och Skattekonto. Vi kan inte ändra uppgifter eller bankkonton.</p>
          </div>

          <button 
            onClick={startScriveFlow}
            disabled={isSigning}
            className={`w-full py-4 px-8 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-3 ${
              isSigning 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isSigning ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                Inväntar signatur...
              </>
            ) : (
              <>Signera med BankID (via Scrive)</>
            )}
          </button>
        </div>

        <div className="bg-black p-6 flex flex-col h-[500px] lg:h-auto font-mono text-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-slate-500 text-xs ml-2">Agent Zero - Terminal Process</div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2">
            <div className="text-slate-500">OpenClaw Framework v2.4.1 initierat...</div>
            <div className="text-slate-500">Laddar prospekteringslogik för [FÖRETAGET AB]...</div>
            <div className="text-blue-400 animate-pulse">&gt; Inväntar BankID-auktorisering från CFO...</div>
            
            {logs.map((log, i) => (
              <div key={i} className={`${log.color} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {log.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureView() {
  const stack = [
    { name: 'NotebookLM', role: 'Chief Legal Officer', desc: 'RAG-arkitektur för Rättslig Vägledning och djup juridisk förståelse av HFD-domar.', color: 'bg-blue-100 text-blue-700' },
    { name: 'Clay.com / Roaring', role: 'Prospekteringsmotor', desc: 'Bygger leads-listor och hittar CFO-kontaktuppgifter baserat på finansiella filter (>15% personalkostnad).', color: 'bg-purple-100 text-purple-700' },
    { name: 'Vercel & Namecheap', role: 'Hosting & Routing', desc: 'Serverless frontend, webhook-mottagare och e-post routing (cfo@energirevision.com).', color: 'bg-slate-200 text-slate-800' },
    { name: 'n8n / Make.com', role: 'Centralstation', desc: 'Visuell automation som binder ihop Scrive-webhooks med Skatteverkets API och OpenClaw.', color: 'bg-orange-100 text-orange-700' },
    { name: 'OpenClaw / Agent Zero', role: 'Execution Engine', desc: 'Utför själva revisionen, integrerar med fullmakts-API och skriver uppdragsavtal.', color: 'bg-emerald-100 text-emerald-700' }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Tech Stack & Ekosystem</h1>
        <p className="text-slate-500 mt-1">Den ultimata arkitekturen för automatiserad skatteåtervinning.</p>
      </header>

      <div className="grid gap-4">
        {stack.map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className={`shrink-0 px-4 py-2 rounded-lg font-bold text-sm ${item.color} w-48 text-center`}>
              {item.name}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{item.role}</h3>
              <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-emerald-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'leads' && <LeadsView />}
          {activeTab === 'agents' && <AgentsView />}
          {activeTab === 'checklist' && <ChecklistView />}
          {activeTab === 'integrations' && <IntegrationsView />}
          {activeTab === 'onboarding' && <OnboardingView />}
          {activeTab === 'architecture' && <ArchitectureView />}
        </div>
      </main>
    </div>
  );
}
