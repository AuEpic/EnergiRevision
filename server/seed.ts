/**
 * seed.ts — Seeds the OpenRevision database with baseline data.
 *
 * Run: npx tsx server/seed.ts
 *
 * This seeds the existing hardcoded leads, HFD rulings, agents, and an initial
 * activity log entry. Safe to run multiple times — uses INSERT OR IGNORE so
 * existing data is never overwritten.
 */

import { getDb, upsertLead, logActivity } from './db';

function seed() {
    const db = getDb();

    console.log('🌱 Seeding OpenRevision database...');

    // ── Leads (from existing App.tsx hardcoded data) ───────────────────
    const SEED_LEADS = [
        {
            id: 'L001',
            name: 'Electrum Automation AB',
            sni: '62010 / 27120',
            industry: 'Elartiklar & Automation',
            personnel_cost: '18.4 MSEK',
            rd_deduction: '0 SEK',
            score: 10,
            status: 'Ready for Audit',
            tags: ['Addtech', 'FoU-avdrag', 'Hög Potential'],
            potential: '2.4 - 3.8 MSEK',
        },
        {
            id: 'L002',
            name: 'Sleip AI',
            sni: '62010',
            industry: 'AI Plattform / Tech',
            personnel_cost: '12.3 MSEK',
            rd_deduction: '0 SEK',
            score: 10,
            status: 'Ready for Audit',
            tags: ['AI-utveckling', 'FoU-avdrag'],
            potential: '1.2 - 2.0 MSEK',
        },
        {
            id: 'L003',
            name: 'SkiStar AB',
            sni: '93290',
            industry: 'Fritidsanläggningar',
            personnel_cost: '450 MSEK',
            rd_deduction: 'N/A',
            score: 9,
            status: 'API Verified',
            tags: ['Energiskatt', 'Snötillverkning', 'HFD 2022 ref. 38'],
            potential: '5.2 MSEK',
        },
        {
            id: 'L004',
            name: 'Crescocito AB',
            sni: '71120',
            industry: 'Teknisk konsulting',
            personnel_cost: '8.2 MSEK',
            rd_deduction: '0 SEK',
            score: 9,
            status: 'Screening',
            tags: ['Teknisk utveckling', 'FoU-avdrag'],
            potential: '0.8 - 1.2 MSEK',
        },
        {
            id: 'L005',
            name: 'C. Gunnarssons Verkstads AB',
            sni: '28410',
            industry: 'Maskintillverkning',
            personnel_cost: '22.1 MSEK',
            rd_deduction: 'Partial',
            score: 9,
            status: 'Screening',
            tags: ['Maskinkonstruktion', 'FoU-avdrag'],
            potential: '1.5 MSEK',
        },
        {
            id: 'L006',
            name: 'Kry International AB',
            sni: '62010',
            industry: 'Digital Hälsa',
            personnel_cost: '145 MSEK',
            rd_deduction: 'Partial',
            score: 8,
            status: 'Deep Dive',
            tags: ['Plattformsutveckling', 'FoU-avdrag'],
            potential: '4.5 - 8.0 MSEK',
        },
        {
            id: 'L007',
            name: 'Addtech Nordic AB',
            sni: '70100',
            industry: 'Huvudkontor / Koncern',
            personnel_cost: '35.2 MSEK',
            rd_deduction: 'N/A',
            score: 8,
            status: 'Screening',
            tags: ['Energiskatt', 'Koncernmoms'],
            potential: '1.2 MSEK',
        },
    ];

    for (const lead of SEED_LEADS) {
        upsertLead({ ...lead, source: 'seed' });
    }
    console.log(`  ✅ ${SEED_LEADS.length} leads seeded`);

    // ── HFD Rulings ───────────────────────────────────────────────────
    const HFD_RULINGS = [
        {
            id: 'HFD-2022-38',
            title: 'HFD 2022 ref. 38 (Energiskatt)',
            desc: 'Kravet på "huvudsaklig" industriell verksamhet raderat. Bagerier och livsmedelsbutiker med tillverkning kan nu få retroaktiv nedsättning.',
            tag: 'Prejudikat',
        },
        {
            id: 'HFD-2024-52',
            title: 'HFD 2024 ref. 52 (Skattetillägg / Sanktioner)',
            desc: 'Möjliggör undanröjande av skattetillägg om felet varit "uppenbart" eller lätt att identifiera för Skatteverket.',
            tag: 'Ny Praxis',
        },
        {
            id: 'HFD-7071-24',
            title: 'HFD 7071-24 (Moms för BRF)',
            desc: 'Bostadsrättsföreningar med höga kommersiella lokalhyror kan använda omsättningsmetoden retroaktivt istället för ytmetoden.',
            tag: 'Praxis',
        },
    ];

    const insertRuling = db.prepare(
        `INSERT OR IGNORE INTO hfd_rulings (id, title, desc, tag) VALUES (?, ?, ?, ?)`
    );
    for (const r of HFD_RULINGS) {
        insertRuling.run(r.id, r.title, r.desc, r.tag);
    }
    console.log(`  ✅ ${HFD_RULINGS.length} HFD rulings seeded`);

    // ── Agents ─────────────────────────────────────────────────────────
    const AGENTS = [
        { id: 'sanktion', name: 'Sanktionsexperten', emoji: '🛡️⚖️', focus: 'Undanröja skattetillägg (HFD 2024 ref. 52)', color: 'text-slate-500', bg: 'bg-slate-100' },
        { id: 'fastighet', name: 'Fastighetsmomsaren', emoji: '🏢💰', focus: 'Momsåtervinning för BRF:er via omsättningsmetoden', color: 'text-amber-500', bg: 'bg-amber-100' },
        { id: 'leasing', name: 'Leasing-Auditören', emoji: '🚗🔍', focus: 'Momsfel vid finansiell leasing och vagnparker', color: 'text-cyan-500', bg: 'bg-cyan-100' },
        { id: 'energi', name: 'Energirevision-Spearhead', emoji: '⚡🏭', focus: 'Återkrav av energiskatt (HFD 2022 ref. 38)', color: 'text-emerald-500', bg: 'bg-emerald-100' },
        { id: 'fou_bevis', name: 'FoU-Bevis-Agent', emoji: '🔬📝', focus: 'Säkrar bevisbörda via CTO-intervjuer', color: 'text-blue-500', bg: 'bg-blue-100' },
    ];

    const insertAgent = db.prepare(
        `INSERT OR IGNORE INTO agents (id, name, emoji, focus, color, bg) VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const a of AGENTS) {
        insertAgent.run(a.id, a.name, a.emoji, a.focus, a.color, a.bg);
    }
    console.log(`  ✅ ${AGENTS.length} agents seeded`);

    // ── Initial activity log ───────────────────────────────────────────
    logActivity('SUCCESS', 'Database seeded with baseline data from research exports.', 'system');
    logActivity('INFO', 'OpenRevision system initialized — ready for engine sync.', 'system');

    console.log('🎉 Seed complete!');
}

seed();
