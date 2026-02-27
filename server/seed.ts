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

    console.log('🌱 Seeding OpenRevision database...');

    // Leads are now strictly pulled from the engine via sync_to_db.py


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
