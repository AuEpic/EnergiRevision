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
  FileSignature,
  Menu,
  X
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

function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: { activeTab: string, setActiveTab: (t: string) => void, isOpen: boolean, setIsOpen: (o: boolean) => void }) {
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
    <>
      {/* Mobile overlay */}
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
              OpenClaw
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">Svensk Skatteåtervinning</div>
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

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-sm text-slate-400 hover:text-white transition-colors">
            <Settings size={18} />
            Inställningar
          </button>
        </div>
      </div>
    </>
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
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Prospektering & Lead Scoring</h1>
          <p className="text-slate-500 mt-1">Identifierade bolag baserat på SNI, personalkostnader och API-data.</p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Sök bolag eller SNI..." 
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full md:w-64"
          />
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
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
      { label: "Kassaflödesanalys - Betald skatt", desc: "Kontrollera att bolaget faktiskt är i en skattebetalande position (krävs för återvinning)." },
      { label: "Not: Ersättning till revisorer", desc: "Om ingen specialiserad skatterådgivning nämns ökar sannolikheten för missade avdrag (+3 poäng i Lead Scoring)." },
      { label: "Fysiskt avtryck", desc: "Bedöm bolagets fysiska anläggningar (lager, produktion, kylanläggningar) för potential inom energiskatt." }
    ]
  },
  {
    title: "2. Juridiska Spearheads (Rättspraxis & Domar)",
    icon: ShieldAlert,
    items: [
      { label: "HFD 2022 ref. 38 (Energiskatt)", desc: "Hitta bolag med industriella processer som inte ses som traditionell industri (ex. bagerier, livsmedelsbutiker med chark, skidanläggningar)." },
      { label: "HFD 2024 ref. 52 (Skattetillägg)", desc: "Identifiera företag som påförts skattetillägg trots att felet i deklarationen var \"uppenbart\" för Skatteverket att se i t.ex. räkenskapsschemat." },
      { label: "HFD 7071-24 (Moms för BRF)", desc: "Sök efter bostadsrättsföreningar med höga kommersiella lokalhyror som kan använda omsättningsmetoden retroaktivt istället för ytmetoden." },
      { label: "Högkullen-målet", desc: "För större koncerner som genomfört interna omstruktureringar där Skatteverket felaktigt schablonvärderat tjänster." }
    ]
  },
  {
    title: "3. Ostrukturerad Data & Digitala Signaler (Deep Web)",
    icon: Database,
    items: [
      { label: "Platsannonser & LinkedIn", desc: "Analysera om bolaget rekryterar \"R&D Engineers\", \"Systemutvecklare\" eller \"Processutvecklare\". Detta bevisar pågående FoU-verksamhet som kan berättiga till retroaktiva avdrag." },
      { label: "Företagshemsidor (Vision-AI)", desc: "Låt AI läsa förvaltningsberättelser och webbsidor efter nyckelord som \"utvecklat ny AI-plattform\" eller \"unika tekniska lösningar\"." },
      { label: "YouTube & Presentationer", desc: "Granska webbinarier från aktiedagar där CTO:er beskriver \"teknisk osäkerhet\" och komplexa problem de löst (nyckelbevis för FoU)." },
      { label: "Media-bevakning", desc: "Google Dorks (site:domstol.se HFD \"skatteåtervinning\" 2025) för att hitta konkurrenter som vunnit tvister, vilket kan användas som \"social proof\" i outreach." },
      { label: "BRF-forum", desc: "Bevaka diskussioner om stora renoveringar (fasad, hiss) i föreningar med kommersiella lokaler." }
    ]
  },
  {
    title: "4. Koncern- & Internationella strukturer",
    icon: Building2,
    items: [
      { label: "Utländska dotterbolag", desc: "Granska svenska koncerner (likt Addtech) med utländsk närvaro för att hitta felaktig internationell källskatt (WHT) via dubbelbeskattningsavtal." },
      { label: "Leasingmoms", desc: "Granska bolag med stora vagnparker. Vid avslut av finansiell leasing redovisas ofta för mycket utgående moms på \"övervärdet\" vid försäljning till bilhandlare." }
    ]
  },
  {
    title: "5. Tekniska Processer (Automatisering)",
    icon: Cpu,
    items: [
      { label: "Event-Driven Prospektering (Webhooks)", desc: "Sätt upp larm mot Roaring/Bolagsverket så att Agent Zero triggas sekunden en ny årsredovisning laddas upp." },
      { label: "RAG för Rättslig Vägledning", desc: "Mata in Skatteverkets egna löpande ställningstaganden i en vektordatabas för att kunna bemöta handläggare med deras egna ord." },
      { label: "Friktionsfri Fullmakts-onboarding", desc: "Integrera BankID-signering direkt i outreach för att omedelbart kunna köra en API-audit mot Skattekontot." }
    ]
  },
  {
    title: "6. Extra idéer för expansion",
    icon: TrendingUp,
    items: [
      { label: "Växa-stöd", desc: "Flagga startups som anställt sin första person men missat ruta 062 i deklarationen (sänkt arbetsgivaravgift)." },
      { label: "K10-optimering", desc: "Identifiera ägare i fåmansbolag som missat att räkna upp sitt sparade utdelningsutrymme korrekt retroaktivt." },
      { label: "ESG-Audit", desc: "Sök efter stora investeringar i grön teknik (solceller, laddstolpar) där bidrag som Klimatklivet inte utnyttjats fullt ut." },
      { label: "Kundförluster", desc: "Granska bolag med stora kundfordringar där moms inte återvunnits trots att betalning uteblivit (enligt nyare EU-rättslig praxis)." }
    ]
  }
];

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
      { name: "Beskattningsengagemang 1.0", desc: "Hämtar F-skatt, moms- och arbetsgivarregistrering." },
      { name: "Rättsliga regler (JSON/BPMN)", desc: "Maskinläsbara filer för uppdatering av agenternas kontrollogik." }
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
      { name: "SCB (Statistikmyndigheten)", desc: "Bransch-benchmarking av personalkostnader för 15-procentsregeln." },
      { name: "Vroom / Bilregistret", desc: "Kontroll av vagnparksstorlek för momsfel vid finansiell leasing." },
      { name: "UC / Creditsafe", desc: "Kreditvärdighet och obeståndskontroll innan audit påbörjas." }
    ]
  },
  {
    category: "3. Fastighet & Moms",
    icon: Building2,
    color: "text-amber-600",
    bg: "bg-amber-100",
    items: [
      { name: "Beskattningsunderlag fastighet", desc: "Hämtar underlag för fastighetsskatt och avgifter per fastighetsägare." },
      { name: "Lantmäteriet / Metria", desc: "Identifierar BRF:er med stora kommersiella lokalytor (HFD 7071-24)." },
      { name: "Allabrf.se", desc: "Bevakar forum och data kring lokalintäkter och planerade renoveringar." }
    ]
  },
  {
    category: "4. Ostrukturerad data & Deep Web",
    icon: Search,
    color: "text-purple-600",
    bg: "bg-purple-100",
    items: [
      { name: "LinkedIn / Platsannons-API", desc: "Söker efter rekrytering av R&D Engineers som trigger för FoU." },
      { name: "Google Dorks / Domstol.se", desc: "Automatiserad bevakning av nya HFD-domar rörande skattenedsättning." },
      { name: "YouTube API", desc: "Parsar webbinarier där CTO:er beskriver tekniska innovationer och osäkerheter." }
    ]
  },
  {
    category: "5. Tillägg för Träffsäkerhet",
    icon: Zap,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    items: [
      { name: "Greenely / Elnäts-API:er", desc: "Hämtar timdata på elförbrukning för kalkyler enligt HFD 2022 ref. 38." },
      { name: "Scrive / BankID API", desc: "Friktionsfri e-signering av fullmakter direkt i outreach-mail." },
      { name: "Skatteverkets RAG-databas", desc: "Intern vektordatabas med Skatteverkets Rättsliga vägledning." },
      { name: "Global Tax Databases (IBFD)", desc: "Mappar utländska dotterbolags utdelningar mot dubbelbeskattningsavtal." },
      { name: "Tullverket API", desc: "Identifierar felaktig tullklassificering och import/export-moms." }
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-emerald-200 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            OpenClaw
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
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
    </div>
  );
}
