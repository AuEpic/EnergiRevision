/**
 * seed.ts — Seeds the OpenRevision database with baseline data.
 *
 * Run: npx tsx server/seed.ts
 *
 * Seeds HFD rulings, agents (with orchestration metadata),
 * detection patterns, and an initial activity log entry.
 * Safe to run multiple times — uses INSERT OR IGNORE so
 * existing data is never overwritten.
 */

import { getDb, logActivity } from './db';

function seed() {
    const db = getDb();

    console.log('Seeding OpenRevision database...');

    // ── HFD Rulings ───────────────────────────────────────────────────
    const HFD_RULINGS = [
        {
            id: 'HFD-2022-38',
            title: 'HFD 2022 ref. 38 (Energiskatt)',
            desc: 'Kravet pa "huvudsaklig" industriell verksamhet raderat. Bagerier och livsmedelsbutiker med tillverkning kan nu fa retroaktiv nedsattning av energiskatt. Oppnar for manga nya kategorier av foretag.',
            tag: 'Prejudikat',
        },
        {
            id: 'HFD-2024-52',
            title: 'HFD 2024 ref. 52 (Skattetillagg / Sanktioner)',
            desc: 'Mojliggor undanrojande av skattetillagg om felet varit "uppenbart" eller latt att identifiera for Skatteverket. Sarskilt relevant for foretag som palagts skattetillagg i samband med energiskatt.',
            tag: 'Ny Praxis',
        },
        {
            id: 'HFD-7071-24',
            title: 'HFD 7071-24 (Moms for BRF)',
            desc: 'Bostadsrattsforeningar med hoga kommersiella lokalhyror kan anvanda omsattningsmetoden retroaktivt istallet for ytmetoden. Kan ge betydande momsaterbetalning.',
            tag: 'Praxis',
        },
        {
            id: 'HFD-2023-REF-16',
            title: 'HFD 2023 ref. 16 (Datacenter energiskatt)',
            desc: 'Forstarker ratt till reducerad energiskatt for serverhallar och datacenter. Klargor att hela anlaggningens elforbrukning kvalificerar, inte bara servrar.',
            tag: 'Prejudikat',
        },
        {
            id: 'HFD-2021-REF-42',
            title: 'HFD 2021 ref. 42 (FoU-avdrag gransavdragning)',
            desc: 'Klargor att forskningsavdraget (FoU-avdrag) ska beranas pa samtliga kvalificerande anstallda, inte bara de som arbetar heltid med FoU. Deltids-FoU racknas proportionellt.',
            tag: 'Praxis',
        },
        {
            id: 'HFD-2020-REF-29',
            title: 'HFD 2020 ref. 29 (Tillverkningsbegreppet)',
            desc: 'Vidgad tolkning av "tillverkningsprocess" som kan inkludera forpackning, kvalitetskontroll och lagring som del av en integrerad produktionsprocess.',
            tag: 'Prejudikat',
        },
    ];

    const insertRuling = db.prepare(
        `INSERT OR IGNORE INTO hfd_rulings (id, title, desc, tag) VALUES (?, ?, ?, ?)`
    );
    for (const r of HFD_RULINGS) {
        insertRuling.run(r.id, r.title, r.desc, r.tag);
    }
    console.log(`  ${HFD_RULINGS.length} HFD rulings seeded`);

    // ── Agents (with orchestration metadata) ─────────────────────────
    const AGENTS = [
        {
            id: 'energi',
            name: 'Energirevision-Spearhead',
            emoji: '⚡🏭',
            focus: 'Aterkrav av energiskatt for tillverkande industri, datacenter, jordbruk och blandad verksamhet (HFD 2022 ref. 38)',
            color: 'text-emerald-500',
            bg: 'bg-emerald-100',
            category: 'energiskatt',
            data_sources: JSON.stringify([
                'Skatteverket Partner-API (Beskattningsengagemang 1.0)',
                'Bolagsverket / Roaring (SNI-koder)',
                'SCB energistatistik',
                'Energimyndigheten (forbrukningsdata)',
            ]),
            triggers: JSON.stringify([
                'SNI-kod 10-33 (tillverkande industri)',
                'SNI 63.11 (datacenter/serverhall)',
                'SNI 01 (jordbruk/vaxthus)',
                'Hog elforbrukning (>500 MWh/ar)',
                'Betalar full energiskatt (43.9 ore/kWh)',
            ]),
            workflow_steps: JSON.stringify([
                '1. Identifiera foretag via SNI-kod och branschfilter',
                '2. Verifiera aktuell skattesats via Skatteverket Partner-API',
                '3. Berakna potentiell overbetalning (43.9 - 0.6 ore/kWh * arlig forbrukning)',
                '4. Kontrollera retroaktivt fonster (3 ar for energiskatt)',
                '5. Verifiera att foretaget har ratt till statligt stod',
                '6. Kontrollera minsta aterbetalningstroskel (>8000 SEK/ar)',
                '7. Generera rapport med estimerad atervinning',
                '8. Eskalera till Sanktionsexperten om skattetillagg palagts',
            ]),
            escalation_criteria: 'Om skattetillagg palagts -> eskalera till Sanktionsexperten. Om foretaget har >20 GWh/ar -> rekommendera frivillig skattskyldighet.',
            output_format: 'Lead-rapport med: foretag, SNI, arlig elforbrukning, betalad skattesats, berattigad skattesats, retroaktiv period, estimerad atervinning MSEK, konfidensgrad.',
        },
        {
            id: 'fou_bevis',
            name: 'FoU-Bevis-Agent',
            emoji: '🔬📝',
            focus: 'Sakrar FoU-avdrag (forskningsavdrag) for tech- och innovationsforetag. Max 3 064 129 SEK/manad i avdragsunderlag. 19.59% reduktion av arbetsgivaravgifter.',
            color: 'text-blue-500',
            bg: 'bg-blue-100',
            category: 'fou_avdrag',
            data_sources: JSON.stringify([
                'Skatteverket Partner-API (Arbetsgivardeklaration 1.2, Ruta 475/470)',
                'Bolagsverket / Roaring (SNI, personalkostnader)',
                'Enento / Roaring XBRL (arsredovisningsnoter)',
                'SCB lonestatistik (bransch-benchmarking 15%-regeln)',
            ]),
            triggers: JSON.stringify([
                'SNI 62010/62020 (tech/programmering)',
                'Personalkostnader >5 MSEK',
                'Loneintensitet >15% av nettoomsattning',
                'Ruta 475 = 0 SEK (inget FoU-avdrag redovisat)',
            ]),
            workflow_steps: JSON.stringify([
                '1. Identifiera foretag med hog loneintensitet (>15%) via SCB-benchmarking',
                '2. Kontrollera Ruta 475 via Arbetsgivardeklaration 1.2 (senaste 72 manader)',
                '3. Om Ruta 475 = 0: flagga som "Missat FoU-avdrag"',
                '4. Berakna maximal avdragsbas: min(kvalificerande personalkostnad, 3 064 129 * 12)',
                '5. Estimera atervinning: avdragsbas * 19.59% * antal retroaktiva ar (max 6)',
                '6. Boka CTO-intervju for att dokumentera FoU-aktiviteter',
                '7. Granska arsredovisning efter uppskjuten skattefordran',
                '8. Generera FoU-rapport med detaljerad berakningsgrund',
            ]),
            escalation_criteria: 'Om foretaget ocksa har hog elforbrukning -> eskalera till Energi-agenten. Om skattetillagg finns -> eskalera till Sanktionsexperten.',
            output_format: 'FoU-rapport med: foretag, kvalificerande anstallda, total loneunderlag, beraknad avdragsbas, estimerad atervinning per ar och totalt, konfidensgrad.',
        },
        {
            id: 'sanktion',
            name: 'Sanktionsexperten',
            emoji: '🛡️⚖️',
            focus: 'Undanroja skattetillagg och sanktioner (HFD 2024 ref. 52). Specialiserad pa att identifiera "uppenbara" fel dar Skatteverket borde ha upptackt felet.',
            color: 'text-slate-500',
            bg: 'bg-slate-100',
            category: 'skattetillagg',
            data_sources: JSON.stringify([
                'Skatteverket Partner-API (Skattekonto 1.0)',
                'Forvaltningsdomstolens domar (HFD, kammarratt)',
                'Skattetillaggsregister',
            ]),
            triggers: JSON.stringify([
                'Skattetillagg palagt i samband med energiskatt',
                'Skattetillagg palagt i samband med momsredovisning',
                'Felet ar "uppenbart" enligt HFD 2024 ref. 52',
                'Eskalering fran Energi-agent eller FoU-agent',
            ]),
            workflow_steps: JSON.stringify([
                '1. Mottag eskalering fran annan agent med skattetillagg-flagga',
                '2. Granska skattetillgasbeslut — identifiera om felet var "uppenbart"',
                '3. Jamfor med HFD 2024 ref. 52 — kan skattetillagget undanrojas?',
                '4. Berakna skattetillaggsbelopp + ranta',
                '5. Forbereda overklagan till forvaltningsratt om tillampligt',
                '6. Generera rapport med juridisk argumentation',
            ]),
            escalation_criteria: 'Om fallet kraver overklagan till kammarratt -> flagga for juridisk granskning.',
            output_format: 'Sanktionsrapport med: foretag, skattetillaggsbeslut, belopp, HFD-tillamplighet, rekommenderad atgard, estimerad besparing.',
        },
        {
            id: 'fastighet',
            name: 'Fastighetsmomsaren',
            emoji: '🏢💰',
            focus: 'Momsatervinning for BRF:er via omsattningsmetoden (HFD 7071-24). Identifierar bostadsrattsforeningar med hoga kommersiella lokalhyror.',
            color: 'text-amber-500',
            bg: 'bg-amber-100',
            category: 'moms',
            data_sources: JSON.stringify([
                'Bolagsverket (BRF-register)',
                'Skatteverket Partner-API (momsdeklarationer)',
                'Fastighetsregistret (lokalytor)',
                'Arsredovisningar (hyresinkomster)',
            ]),
            triggers: JSON.stringify([
                'SNI 68.32 (bostadsrattsforeningar)',
                'Kommersiell lokalhyra >1 MSEK/ar',
                'Anvander ytmetoden for momsfordelning',
            ]),
            workflow_steps: JSON.stringify([
                '1. Identifiera BRF:er med kommersiella lokaler',
                '2. Hamta hyresinkomstdata fran arsredovisning',
                '3. Jamfor ytmetoden vs omsattningsmetoden',
                '4. Om omsattningsmetoden ger hogre momsatervinning -> flagga',
                '5. Berakna retroaktiv momsatervinning (max 6 ar)',
                '6. Generera rapport for BRF-styrelse',
            ]),
            escalation_criteria: 'Om BRF:en ocksa har problem med energiskatt pa fastigheten -> eskalera till Energi-agenten.',
            output_format: 'BRF-momsrapport med: forening, lokalytor, hyresinkomster, nuvarande metod, estimerad atervinning vid byte till omsattningsmetoden.',
        },
        {
            id: 'leasing',
            name: 'Leasing-Auditoren',
            emoji: '🚗🔍',
            focus: 'Momsfel vid finansiell leasing och vagnparker. Identifierar felaktig momshantering vid finansiell vs operationell leasing.',
            color: 'text-cyan-500',
            bg: 'bg-cyan-100',
            category: 'leasing',
            data_sources: JSON.stringify([
                'Bolagsverket / Roaring (fordonsinformation)',
                'Skatteverket Partner-API (momsdeklarationer)',
                'Leasingavtal (manuell granskning)',
            ]),
            triggers: JSON.stringify([
                'Foretag med >10 leasade fordon',
                'Finansiell leasing felklassificerad som operationell',
                'Momsavdrag saknas pa leasingavgifter',
            ]),
            workflow_steps: JSON.stringify([
                '1. Identifiera foretag med stora vagnparker eller leasingavtal',
                '2. Granska leasingavtalens klassificering (finansiell vs operationell)',
                '3. Kontrollera momsbehandling for varje avtalstyp',
                '4. Identifiera felaktigt hanterade momsavdrag',
                '5. Berakna retroaktiv momsatervinning',
                '6. Generera rapport med avtalspecifika rekommendationer',
            ]),
            escalation_criteria: 'Om skattetillagg palagts -> eskalera till Sanktionsexperten.',
            output_format: 'Leasing-rapport med: foretag, antal avtal, klassificering, identifierade momsfel, estimerad atervinning.',
        },
        {
            id: 'datacenter',
            name: 'Datacenter-Specialisten',
            emoji: '🖥️⚡',
            focus: 'Energiskattereduktion for serverhallar och datacenter (0.6 ore/kWh). Manga mindre datacenter och hostingforetag missar detta avdrag.',
            color: 'text-violet-500',
            bg: 'bg-violet-100',
            category: 'energiskatt',
            data_sources: JSON.stringify([
                'Skatteverket Partner-API',
                'Bolagsverket / Roaring (SNI 63.11)',
                'Energimyndigheten (datacenter-register)',
                'PTS (Post- och telestyrelsen)',
            ]),
            triggers: JSON.stringify([
                'SNI 63.11 (datacenter/hosting)',
                'Elforbrukning >100 MWh/ar',
                'Betalar full energiskatt',
            ]),
            workflow_steps: JSON.stringify([
                '1. Identifiera datacenter/hostingforetag via SNI 63.11',
                '2. Verifiera att anlaggningen uppfyller serverhallsdefinitionen',
                '3. Kontrollera aktuell energiskattesats via Skatteverket',
                '4. Om full skatt betalas -> flagga for reduktion till 0.6 ore/kWh',
                '5. Berakna retroaktiv atervinning (3 ar)',
                '6. Om >20 GWh/ar -> rekommendera frivillig skattskyldighet',
            ]),
            escalation_criteria: 'Om foretaget ocksa bedriver tillverkning -> eskalera till Energi-agenten for helhetsbedoming.',
            output_format: 'Datacenter-rapport med: foretag, anlaggning, elforbrukning, nuvarande skattesats, berattigad sats, retroaktiv atervinning.',
        },
        {
            id: 'jordbruk',
            name: 'Jordbruk-Agenten',
            emoji: '🌱🔋',
            focus: 'Energiskattereduktion for jordbruk, vaxthusodling och livsmedelsproduktion. Uppvarmning i produktion kvalificerar for reducerad sats.',
            color: 'text-green-500',
            bg: 'bg-green-100',
            category: 'energiskatt',
            data_sources: JSON.stringify([
                'Jordbruksverket (foretagsregister)',
                'Bolagsverket / Roaring (SNI 01)',
                'Skatteverket Partner-API',
                'LRF (Lantbrukarnas Riksforbund) medlemsdata',
            ]),
            triggers: JSON.stringify([
                'SNI 01 (jordbruk)',
                'Vaxthusodling med uppvarmning',
                'Livsmedelsproduktion (bageri, mejeri etc)',
            ]),
            workflow_steps: JSON.stringify([
                '1. Identifiera jordbruksforetag och vaxthus via SNI/Jordbruksverket',
                '2. Kartlagg energiforbrukning for uppvarmning i produktion',
                '3. Kontrollera om reducerad energiskatt tillampas',
                '4. Tillampa HFD 2022 ref. 38 om relevant (utvidgad tillverkningsdefinition)',
                '5. Berakna retroaktiv atervinning',
                '6. Generera rapport for jordbrukare/vaxthusforstagare',
            ]),
            escalation_criteria: 'Om foretaget har bade jordbruk och livsmedelsforsakring -> samordna med Energi-agenten.',
            output_format: 'Jordbruk-rapport med: foretag, produktionstyp, energiforbrukning, nuvarande skattebehandling, tillampliga undantag, estimerad atervinning.',
        },
    ];

    const insertAgent = db.prepare(
        `INSERT OR IGNORE INTO agents (id, name, emoji, focus, color, bg, category, data_sources, triggers, workflow_steps, escalation_criteria, output_format)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const a of AGENTS) {
        insertAgent.run(
            a.id, a.name, a.emoji, a.focus, a.color, a.bg,
            a.category, a.data_sources, a.triggers, a.workflow_steps,
            a.escalation_criteria, a.output_format
        );
    }
    console.log(`  ${AGENTS.length} agents seeded (with orchestration metadata)`);

    // ── Detection Patterns ───────────────────────────────────────────
    const DETECTION_PATTERNS = [
        {
            id: 'energy_manufacturing',
            name: 'Tillverkande industri — energiskatt',
            description: 'Industriforetag (SNI 10-33) som betalar full energiskatt istallet for reducerad sats (0.6 ore/kWh).',
            category: 'energiskatt',
            applicable_hfd_rulings: JSON.stringify(['HFD-2022-38']),
            sni_prefixes: JSON.stringify(['10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33']),
            agent_id: 'energi',
            estimated_recovery_range: '0.5 - 15 MSEK',
            retroactive_years: 3,
        },
        {
            id: 'energy_datacenter',
            name: 'Datacenter/Serverhall — energiskatt',
            description: 'Datacenter och serverhallar berattigade till reducerad energiskatt (0.6 ore/kWh) sedan 2017.',
            category: 'energiskatt',
            applicable_hfd_rulings: JSON.stringify(['HFD-2023-REF-16']),
            sni_prefixes: JSON.stringify(['6311']),
            agent_id: 'datacenter',
            estimated_recovery_range: '0.3 - 8 MSEK',
            retroactive_years: 3,
        },
        {
            id: 'energy_food_manufacturing',
            name: 'Livsmedel med tillverkning — energiskatt (HFD 2022 ref. 38)',
            description: 'Bagerier och livsmedelsbutiker med tillverkning kan nu fa retroaktiv nedsattning efter HFD 2022 ref. 38.',
            category: 'energiskatt',
            applicable_hfd_rulings: JSON.stringify(['HFD-2022-38']),
            sni_prefixes: JSON.stringify(['4711','4721','4729','1071','1072']),
            agent_id: 'energi',
            estimated_recovery_range: '0.1 - 3 MSEK',
            retroactive_years: 3,
        },
        {
            id: 'energy_agriculture',
            name: 'Jordbruk/Vaxthus — energiskatt uppvarmning',
            description: 'Jordbrukare och vaxthusodlare har ratt till reducerad energiskatt for uppvarmning i produktionen.',
            category: 'energiskatt',
            applicable_hfd_rulings: JSON.stringify([]),
            sni_prefixes: JSON.stringify(['01']),
            agent_id: 'jordbruk',
            estimated_recovery_range: '0.1 - 2 MSEK',
            retroactive_years: 3,
        },
        {
            id: 'energy_snow_production',
            name: 'Snoproduktion — energiskatt (HFD 2022 ref. 38)',
            description: 'Skidanlaggningar med snokanoner kan kvalificera for reducerad energiskatt.',
            category: 'energiskatt',
            applicable_hfd_rulings: JSON.stringify(['HFD-2022-38']),
            sni_prefixes: JSON.stringify(['9311']),
            agent_id: 'energi',
            estimated_recovery_range: '0.5 - 5 MSEK',
            retroactive_years: 3,
        },
        {
            id: 'energy_mixed_use',
            name: 'Blandad verksamhet — energiskatt',
            description: 'Foretag med bade tillverkning och ovrig verksamhet pa samma anlaggning.',
            category: 'energiskatt',
            applicable_hfd_rulings: JSON.stringify(['HFD-2022-38', 'HFD-2020-REF-29']),
            sni_prefixes: JSON.stringify([]),
            agent_id: 'energi',
            estimated_recovery_range: '0.2 - 5 MSEK',
            retroactive_years: 3,
        },
        {
            id: 'rd_tech_missing_deduction',
            name: 'Tech-foretag utan FoU-avdrag',
            description: 'Tech-foretag (SNI 62) med hoga personalkostnader men noll i Ruta 475.',
            category: 'fou_avdrag',
            applicable_hfd_rulings: JSON.stringify(['HFD-2021-REF-42']),
            sni_prefixes: JSON.stringify(['6201','6202','6203','6209']),
            agent_id: 'fou_bevis',
            estimated_recovery_range: '1 - 20 MSEK',
            retroactive_years: 6,
        },
        {
            id: 'rd_wage_intensity',
            name: 'Hog loneintensitet (>15%) utan FoU-avdrag',
            description: 'Foretag med personalkostnader over 15% av nettoomsattning utan forskningsavdrag.',
            category: 'fou_avdrag',
            applicable_hfd_rulings: JSON.stringify(['HFD-2021-REF-42']),
            sni_prefixes: JSON.stringify([]),
            agent_id: 'fou_bevis',
            estimated_recovery_range: '0.5 - 15 MSEK',
            retroactive_years: 6,
        },
        {
            id: 'brf_vat_method',
            name: 'BRF momsatervinning — omsattningsmetoden (HFD 7071-24)',
            description: 'BRF:er med hoga kommersiella lokalhyror kan anvanda omsattningsmetoden retroaktivt.',
            category: 'moms',
            applicable_hfd_rulings: JSON.stringify(['HFD-7071-24']),
            sni_prefixes: JSON.stringify(['6832']),
            agent_id: 'fastighet',
            estimated_recovery_range: '0.2 - 5 MSEK',
            retroactive_years: 6,
        },
        {
            id: 'tax_penalty_removal',
            name: 'Skattetillagg — undanrojande (HFD 2024 ref. 52)',
            description: 'Undanrojande av skattetillagg om felet var "uppenbart" for Skatteverket.',
            category: 'skattetillagg',
            applicable_hfd_rulings: JSON.stringify(['HFD-2024-52']),
            sni_prefixes: JSON.stringify([]),
            agent_id: 'sanktion',
            estimated_recovery_range: '0.1 - 10 MSEK',
            retroactive_years: 6,
        },
        {
            id: 'leasing_vat',
            name: 'Momsfel vid finansiell leasing',
            description: 'Foretag med stora vagnparker eller leasingavtal dar momsen hanterats felaktigt.',
            category: 'leasing',
            applicable_hfd_rulings: JSON.stringify([]),
            sni_prefixes: JSON.stringify([]),
            agent_id: 'leasing',
            estimated_recovery_range: '0.1 - 3 MSEK',
            retroactive_years: 6,
        },
    ];

    const insertPattern = db.prepare(
        `INSERT OR IGNORE INTO detection_patterns (id, name, description, category, applicable_hfd_rulings, sni_prefixes, agent_id, estimated_recovery_range, retroactive_years)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const p of DETECTION_PATTERNS) {
        insertPattern.run(
            p.id, p.name, p.description, p.category,
            p.applicable_hfd_rulings, p.sni_prefixes,
            p.agent_id, p.estimated_recovery_range, p.retroactive_years
        );
    }
    console.log(`  ${DETECTION_PATTERNS.length} detection patterns seeded`);

    // ── Initial activity log ───────────────────────────────────────────
    logActivity('SUCCESS', 'Database seeded with baseline data from research exports.', 'system');
    logActivity('INFO', 'OpenRevision system initialized — ready for engine sync.', 'system');

    console.log('Seed complete!');
}

seed();
