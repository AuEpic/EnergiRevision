/**
 * scoring.ts — Enhanced lead scoring engine for EnergiRevision.
 *
 * Implements a weighted, multi-criteria scoring system that evaluates
 * companies for potential tax recovery opportunities across:
 *   - Energy tax (energiskatt) reductions
 *   - R&D tax deductions (FoU-avdrag / forskningsavdrag)
 *   - VAT recovery (BRF omsättningsmetoden)
 *   - Tax penalty removal (skattetillagg)
 *   - Leasing VAT errors
 *
 * Each detection pattern contributes weighted points. The final score
 * is normalised to 0–10.
 */

// ── SNI code ranges that qualify for reduced energy tax ───────────────
// Manufacturing / industrial: SNI 10–33
// Data centres / server halls: SNI 63.11
const MANUFACTURING_SNI_PREFIXES = [
    '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
    '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
    '30', '31', '32', '33',
];
const DATACENTER_SNI = '6311';
const TECH_SNI_PREFIXES = ['6201', '6202', '6203', '6209'];
const AGRICULTURE_SNI_PREFIXES = ['01'];
const FOOD_RETAIL_SNI_PREFIXES = ['4711', '4721', '4729'];
const BRF_SNI = '6832'; // Bostadsrattsforeningar (housing associations)
const SKI_RESORT_SNI = '9311';

// ── Scoring weights ──────────────────────────────────────────────────
export interface ScoringWeights {
    sniMatch: number;
    personnelCostAboveThreshold: number;
    missingRdDeduction: number;
    noSpecializedTaxAdvisor: number;
    highEnergyConsumption: number;
    hfdRulingApplicable: number;
    recoveryWindowOpen: number;
    companySize: number;
    mixedUseIndicator: number;
    recentMergerAcquisition: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
    sniMatch: 2.0,
    personnelCostAboveThreshold: 1.5,
    missingRdDeduction: 2.0,
    noSpecializedTaxAdvisor: 1.0,
    highEnergyConsumption: 1.5,
    hfdRulingApplicable: 1.5,
    recoveryWindowOpen: 0.5,
    companySize: 0.5,
    mixedUseIndicator: 1.0,
    recentMergerAcquisition: 0.5,
};

// ── Scoring input ────────────────────────────────────────────────────

export interface ScoringInput {
    sni: string;
    industry: string;
    personnelCostMSEK: number;
    rdDeductionSEK: number;
    revenuesMSEK: number;
    energyConsumptionKwh: number;
    hasSpecializedTaxAdvisor: boolean;
    taxRateCurrent: number;         // ore/kWh currently paid
    taxRateEligible: number;        // ore/kWh they should be paying
    recoveryWindowYears: number;
    employeeCount: number;
    isMixedUse: boolean;
    recentMergerOrAcquisition: boolean;
    tags: string[];
}

// ── Scoring result ───────────────────────────────────────────────────

export interface ScoringBreakdown {
    criterion: string;
    rawScore: number;       // 0.0–1.0
    weight: number;
    weightedScore: number;
    reason: string;
}

export interface ScoringResult {
    finalScore: number;             // 0–10
    breakdown: ScoringBreakdown[];
    detectedPatterns: string[];     // human-readable pattern names
    estimatedRecoveryMSEK: number;
    confidenceLevel: 'low' | 'medium' | 'high';
    recommendedAgents: string[];    // agent IDs
}

// ── Detection pattern helpers ────────────────────────────────────────

function sniStartsWith(sni: string, prefixes: string[]): boolean {
    const cleaned = sni.replace(/[.\s-]/g, '');
    return prefixes.some(p => cleaned.startsWith(p));
}

function detectSniCategory(sni: string): {
    isManufacturing: boolean;
    isDatacenter: boolean;
    isTech: boolean;
    isAgriculture: boolean;
    isFoodRetail: boolean;
    isBrf: boolean;
    isSkiResort: boolean;
} {
    const cleaned = sni.replace(/[.\s-]/g, '');
    return {
        isManufacturing: sniStartsWith(cleaned, MANUFACTURING_SNI_PREFIXES),
        isDatacenter: cleaned.startsWith(DATACENTER_SNI),
        isTech: sniStartsWith(cleaned, TECH_SNI_PREFIXES),
        isAgriculture: sniStartsWith(cleaned, AGRICULTURE_SNI_PREFIXES),
        isFoodRetail: sniStartsWith(cleaned, FOOD_RETAIL_SNI_PREFIXES),
        isBrf: cleaned.startsWith(BRF_SNI),
        isSkiResort: cleaned.startsWith(SKI_RESORT_SNI),
    };
}

// ── Main scoring function ────────────────────────────────────────────

export function scoreLead(
    input: ScoringInput,
    weights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoringResult {
    const breakdown: ScoringBreakdown[] = [];
    const detectedPatterns: string[] = [];
    const recommendedAgents: string[] = [];

    const cat = detectSniCategory(input.sni);

    // 1. SNI code match
    let sniRaw = 0;
    if (cat.isManufacturing) {
        sniRaw = 1.0;
        detectedPatterns.push('Tillverkande industri (SNI 10-33) — energiskattereduktion');
        recommendedAgents.push('energi');
    } else if (cat.isDatacenter) {
        sniRaw = 0.9;
        detectedPatterns.push('Datacenter/Serverhall (SNI 63.11) — energiskattereduktion');
        recommendedAgents.push('datacenter');
    } else if (cat.isTech) {
        sniRaw = 0.85;
        detectedPatterns.push('Tech/Programmering (SNI 62) — FoU-avdrag');
        recommendedAgents.push('fou_bevis');
    } else if (cat.isFoodRetail) {
        sniRaw = 0.7;
        detectedPatterns.push('Livsmedel med tillverkning (HFD 2022 ref. 38) — energiskattereduktion');
        recommendedAgents.push('energi');
    } else if (cat.isAgriculture) {
        sniRaw = 0.65;
        detectedPatterns.push('Jordbruk/Vaxthus — energiskattereduktion uppvarmning');
        recommendedAgents.push('jordbruk');
    } else if (cat.isBrf) {
        sniRaw = 0.8;
        detectedPatterns.push('BRF (HFD 7071-24) — momsatervinning omsattningsmetoden');
        recommendedAgents.push('fastighet');
    } else if (cat.isSkiResort) {
        sniRaw = 0.75;
        detectedPatterns.push('Skidanlaggning — snokanoner energiskattereduktion');
        recommendedAgents.push('energi');
    } else if (input.industry) {
        // Fuzzy industry matching
        const lowerInd = input.industry.toLowerCase();
        if (lowerInd.includes('tillverkn') || lowerInd.includes('industri') || lowerInd.includes('produktion')) {
            sniRaw = 0.6;
            detectedPatterns.push('Industri (fritext-matchning) — potentiell energiskattereduktion');
            recommendedAgents.push('energi');
        } else if (lowerInd.includes('tech') || lowerInd.includes('it') || lowerInd.includes('software') || lowerInd.includes('digital')) {
            sniRaw = 0.6;
            detectedPatterns.push('Tech (fritext-matchning) — potentiell FoU-avdrag');
            recommendedAgents.push('fou_bevis');
        }
    }
    breakdown.push({
        criterion: 'SNI-kod/Branschmatchning',
        rawScore: sniRaw,
        weight: weights.sniMatch,
        weightedScore: sniRaw * weights.sniMatch,
        reason: sniRaw > 0 ? `SNI "${input.sni}" matchar kvalificerande kategori` : 'Ingen SNI-matchning',
    });

    // 2. Personnel cost above threshold (>5 MSEK indicates significant workforce)
    let personnelRaw = 0;
    if (input.personnelCostMSEK > 0) {
        if (input.personnelCostMSEK >= 20) personnelRaw = 1.0;
        else if (input.personnelCostMSEK >= 10) personnelRaw = 0.8;
        else if (input.personnelCostMSEK >= 5) personnelRaw = 0.6;
        else if (input.personnelCostMSEK >= 2) personnelRaw = 0.3;
    }
    breakdown.push({
        criterion: 'Personalkostnad (>5 MSEK)',
        rawScore: personnelRaw,
        weight: weights.personnelCostAboveThreshold,
        weightedScore: personnelRaw * weights.personnelCostAboveThreshold,
        reason: input.personnelCostMSEK > 0 ? `${input.personnelCostMSEK} MSEK personalkostnad` : 'Personalkostnad okand',
    });

    // 3. Missing R&D deduction (Ruta 475 = 0 SEK)
    let rdRaw = 0;
    const wageIntensity = input.revenuesMSEK > 0
        ? (input.personnelCostMSEK / input.revenuesMSEK)
        : 0;
    const qualifiesForRd = cat.isTech || wageIntensity >= 0.15;

    if (qualifiesForRd && input.rdDeductionSEK === 0) {
        rdRaw = 1.0;
        detectedPatterns.push('Ruta 475 = 0 SEK — missat FoU-avdrag (forskningsavdrag)');
        if (!recommendedAgents.includes('fou_bevis')) recommendedAgents.push('fou_bevis');
    } else if (qualifiesForRd && input.rdDeductionSEK > 0) {
        // They claim something, but might be under-claiming
        const maxMonthlyBase = 3_064_129; // SEK per month (since July 2023)
        const maxAnnual = maxMonthlyBase * 12;
        if (input.rdDeductionSEK < maxAnnual * 0.3 && input.personnelCostMSEK >= 10) {
            rdRaw = 0.5;
            detectedPatterns.push('FoU-avdrag under forvantad niva — mojligen underutnyttjat');
            if (!recommendedAgents.includes('fou_bevis')) recommendedAgents.push('fou_bevis');
        }
    }
    breakdown.push({
        criterion: 'Missat FoU-avdrag (Ruta 475)',
        rawScore: rdRaw,
        weight: weights.missingRdDeduction,
        weightedScore: rdRaw * weights.missingRdDeduction,
        reason: rdRaw > 0 ? `Kvalificerar for FoU-avdrag men redovisar ${input.rdDeductionSEK} SEK` : 'Ej tillampligt eller redan redovisat',
    });

    // 4. No specialized tax advisor
    let advisorRaw = 0;
    if (!input.hasSpecializedTaxAdvisor) {
        advisorRaw = 0.8;
        detectedPatterns.push('Saknar specialiserad skatteradgivare — hogre risk for missade avdrag');
    }
    breakdown.push({
        criterion: 'Avsaknad av specialiserad skatteradgivare',
        rawScore: advisorRaw,
        weight: weights.noSpecializedTaxAdvisor,
        weightedScore: advisorRaw * weights.noSpecializedTaxAdvisor,
        reason: !input.hasSpecializedTaxAdvisor ? 'Ingen specialiserad skatteradgivare noterad' : 'Har specialiserad skatteradgivare',
    });

    // 5. High energy consumption with wrong tax rate
    let energyRaw = 0;
    if (input.energyConsumptionKwh > 0 && input.taxRateCurrent > input.taxRateEligible) {
        const overpaymentPerKwh = input.taxRateCurrent - input.taxRateEligible;
        if (overpaymentPerKwh >= 30) energyRaw = 1.0;
        else if (overpaymentPerKwh >= 10) energyRaw = 0.7;
        else energyRaw = 0.4;
        detectedPatterns.push(`Betalar ${input.taxRateCurrent} ore/kWh men berattigad till ${input.taxRateEligible} ore/kWh`);
        if (!recommendedAgents.includes('energi')) recommendedAgents.push('energi');
    }
    breakdown.push({
        criterion: 'Energiforbrukning med fel skattesats',
        rawScore: energyRaw,
        weight: weights.highEnergyConsumption,
        weightedScore: energyRaw * weights.highEnergyConsumption,
        reason: energyRaw > 0 ? `Overbetalning energiskatt detekterad` : 'Ingen energiskatte-avvikelse',
    });

    // 6. HFD ruling applicable
    let hfdRaw = 0;
    // HFD 2022 ref. 38 — Expanded definition of industrial manufacturing
    if (cat.isFoodRetail || cat.isSkiResort || input.isMixedUse) {
        hfdRaw = Math.max(hfdRaw, 0.9);
        detectedPatterns.push('HFD 2022 ref. 38 tillampligt — utvidgad definition av tillverkning');
    }
    // HFD 7071-24 — BRF omsattningsmetoden
    if (cat.isBrf) {
        hfdRaw = Math.max(hfdRaw, 0.85);
        detectedPatterns.push('HFD 7071-24 tillampligt — BRF omsattningsmetoden');
    }
    // HFD 2024 ref. 52 — Tax penalty removal
    if (input.tags.includes('Skattetillagg')) {
        hfdRaw = Math.max(hfdRaw, 0.8);
        detectedPatterns.push('HFD 2024 ref. 52 tillampligt — skattetillagg kan undanrojas');
        if (!recommendedAgents.includes('sanktion')) recommendedAgents.push('sanktion');
    }
    breakdown.push({
        criterion: 'HFD-dom tillamplig',
        rawScore: hfdRaw,
        weight: weights.hfdRulingApplicable,
        weightedScore: hfdRaw * weights.hfdRulingApplicable,
        reason: hfdRaw > 0 ? 'En eller flera HFD-domar tillampliga' : 'Ingen direkt HFD-koppling',
    });

    // 7. Recovery window open
    let windowRaw = 0;
    if (input.recoveryWindowYears >= 5) windowRaw = 1.0;
    else if (input.recoveryWindowYears >= 3) windowRaw = 0.7;
    else if (input.recoveryWindowYears >= 1) windowRaw = 0.4;
    breakdown.push({
        criterion: 'Atervinningstid (recovery window)',
        rawScore: windowRaw,
        weight: weights.recoveryWindowOpen,
        weightedScore: windowRaw * weights.recoveryWindowOpen,
        reason: input.recoveryWindowYears > 0 ? `${input.recoveryWindowYears} ar kvar` : 'Okand atervinningstid',
    });

    // 8. Company size (employee count)
    let sizeRaw = 0;
    if (input.employeeCount >= 200) sizeRaw = 1.0;
    else if (input.employeeCount >= 50) sizeRaw = 0.7;
    else if (input.employeeCount >= 10) sizeRaw = 0.4;
    else if (input.employeeCount > 0) sizeRaw = 0.2;
    breakdown.push({
        criterion: 'Foretagsstorlek (antal anstallda)',
        rawScore: sizeRaw,
        weight: weights.companySize,
        weightedScore: sizeRaw * weights.companySize,
        reason: input.employeeCount > 0 ? `${input.employeeCount} anstallda` : 'Okant antal anstallda',
    });

    // 9. Mixed-use indicator (manufacturing + non-manufacturing on same site)
    let mixedRaw = 0;
    if (input.isMixedUse) {
        mixedRaw = 0.8;
        detectedPatterns.push('Blandad verksamhet — tillverkning + ovrig pa samma anlaggning');
    }
    breakdown.push({
        criterion: 'Blandad verksamhet (mixed-use)',
        rawScore: mixedRaw,
        weight: weights.mixedUseIndicator,
        weightedScore: mixedRaw * weights.mixedUseIndicator,
        reason: input.isMixedUse ? 'Blandad verksamhet detekterad' : 'Ej blandad verksamhet',
    });

    // 10. Recent merger or acquisition
    let maRaw = 0;
    if (input.recentMergerOrAcquisition) {
        maRaw = 0.7;
        detectedPatterns.push('Nyligen forvarv/fusion — hogre risk for skattestrukturfel');
    }
    breakdown.push({
        criterion: 'Nyligt forvarv/fusion (M&A)',
        rawScore: maRaw,
        weight: weights.recentMergerAcquisition,
        weightedScore: maRaw * weights.recentMergerAcquisition,
        reason: input.recentMergerOrAcquisition ? 'Nyligen genomford transaktion' : 'Inget forvarv noterat',
    });

    // ── Calculate final score ────────────────────────────────────────
    const totalWeighted = breakdown.reduce((sum, b) => sum + b.weightedScore, 0);
    const maxPossible = breakdown.reduce((sum, b) => sum + b.weight, 0);
    const finalScore = maxPossible > 0
        ? Math.round((totalWeighted / maxPossible) * 10 * 10) / 10
        : 0;

    // ── Estimate recovery ────────────────────────────────────────────
    let estimatedRecoveryMSEK = 0;

    // Energy tax recovery estimate
    if (input.energyConsumptionKwh > 0 && input.taxRateCurrent > input.taxRateEligible) {
        const overpayPerKwh = (input.taxRateCurrent - input.taxRateEligible) / 100; // ore -> SEK
        const annualOverpay = overpayPerKwh * input.energyConsumptionKwh;
        const years = Math.min(input.recoveryWindowYears || 3, 6);
        estimatedRecoveryMSEK += (annualOverpay * years) / 1_000_000;
    }

    // FoU-avdrag recovery estimate
    if (rdRaw > 0 && input.personnelCostMSEK > 0) {
        // Rough estimate: 19.59% of qualifying personnel costs over recovery window
        const qualifyingCost = Math.min(input.personnelCostMSEK * 0.5, 36.77); // max ~36.77 MSEK/year
        const annualSaving = qualifyingCost * 0.1959;
        const years = Math.min(input.recoveryWindowYears || 6, 6);
        estimatedRecoveryMSEK += annualSaving * years;
    }

    estimatedRecoveryMSEK = Math.round(estimatedRecoveryMSEK * 10) / 10;

    // ── Confidence level ─────────────────────────────────────────────
    const filledFields = [
        input.sni, input.personnelCostMSEK, input.energyConsumptionKwh,
        input.employeeCount, input.revenuesMSEK,
    ].filter(v => v !== 0 && v !== '').length;

    let confidenceLevel: 'low' | 'medium' | 'high' = 'low';
    if (filledFields >= 4) confidenceLevel = 'high';
    else if (filledFields >= 2) confidenceLevel = 'medium';

    return {
        finalScore: Math.min(finalScore, 10),
        breakdown,
        detectedPatterns,
        estimatedRecoveryMSEK,
        confidenceLevel,
        recommendedAgents: [...new Set(recommendedAgents)],
    };
}

// ── Detection patterns registry ──────────────────────────────────────
// These define the configurable rules for finding leads from raw data

export interface DetectionPattern {
    id: string;
    name: string;
    description: string;
    category: 'energiskatt' | 'fou_avdrag' | 'moms' | 'skattetillagg' | 'leasing';
    applicableHfdRulings: string[];
    sniPrefixes: string[];
    agentId: string;
    estimatedRecoveryRange: string;
    retroactiveYears: number;
}

export const DETECTION_PATTERNS: DetectionPattern[] = [
    {
        id: 'energy_manufacturing',
        name: 'Tillverkande industri — energiskatt',
        description: 'Industriforetag (SNI 10-33) som betalar full energiskatt istallet for reducerad sats (0.6 ore/kWh). Riksrevisionen uppskattar att nedsattningen minskar statens intakter med ~18 miljarder/ar.',
        category: 'energiskatt',
        applicableHfdRulings: ['HFD-2022-38'],
        sniPrefixes: MANUFACTURING_SNI_PREFIXES,
        agentId: 'energi',
        estimatedRecoveryRange: '0.5 - 15 MSEK',
        retroactiveYears: 3,
    },
    {
        id: 'energy_datacenter',
        name: 'Datacenter/Serverhall — energiskatt',
        description: 'Datacenter och serverhallar ar berattigade till reducerad energiskatt (0.6 ore/kWh) sedan 2017. Manga mindre datacenter missar detta avdrag.',
        category: 'energiskatt',
        applicableHfdRulings: [],
        sniPrefixes: [DATACENTER_SNI],
        agentId: 'datacenter',
        estimatedRecoveryRange: '0.3 - 8 MSEK',
        retroactiveYears: 3,
    },
    {
        id: 'energy_food_manufacturing',
        name: 'Livsmedel med tillverkning — energiskatt (HFD 2022 ref. 38)',
        description: 'Efter HFD 2022 ref. 38 ar kravet pa "huvudsaklig" industriell verksamhet borttaget. Bagerier och livsmedelsbutiker med tillverkning kan nu fa retroaktiv nedsattning av energiskatt.',
        category: 'energiskatt',
        applicableHfdRulings: ['HFD-2022-38'],
        sniPrefixes: [...FOOD_RETAIL_SNI_PREFIXES, '1071', '1072'],
        agentId: 'energi',
        estimatedRecoveryRange: '0.1 - 3 MSEK',
        retroactiveYears: 3,
    },
    {
        id: 'energy_agriculture',
        name: 'Jordbruk/Vaxthus — energiskatt uppvarmning',
        description: 'Jordbrukare och vaxthusodlare har ratt till reducerad energiskatt for uppvarmning i produktionen.',
        category: 'energiskatt',
        applicableHfdRulings: [],
        sniPrefixes: AGRICULTURE_SNI_PREFIXES,
        agentId: 'jordbruk',
        estimatedRecoveryRange: '0.1 - 2 MSEK',
        retroactiveYears: 3,
    },
    {
        id: 'energy_snow_production',
        name: 'Snoproduktion — energiskatt (HFD 2022 ref. 38)',
        description: 'Skidanlaggningar med snokanoner kan kvalificera for reducerad energiskatt. Snokanonsproduktion kan klassas som industriell process.',
        category: 'energiskatt',
        applicableHfdRulings: ['HFD-2022-38'],
        sniPrefixes: [SKI_RESORT_SNI],
        agentId: 'energi',
        estimatedRecoveryRange: '0.5 - 5 MSEK',
        retroactiveYears: 3,
    },
    {
        id: 'energy_mixed_use',
        name: 'Blandad verksamhet — energiskatt',
        description: 'Foretag med bade tillverkning och ovrig verksamhet pa samma anlaggning, dar tillverkningsdelen kvalificerar for reducerad energiskatt.',
        category: 'energiskatt',
        applicableHfdRulings: ['HFD-2022-38'],
        sniPrefixes: [],
        agentId: 'energi',
        estimatedRecoveryRange: '0.2 - 5 MSEK',
        retroactiveYears: 3,
    },
    {
        id: 'rd_tech_missing_deduction',
        name: 'Tech-foretag utan FoU-avdrag',
        description: 'Tech-foretag (SNI 62) med hoga personalkostnader men noll i Ruta 475. FoU-avdrag ger 19.59% reduktion av arbetsgivaravgifter pa kvalificerande FoU-lon, max 3 064 129 SEK/manad.',
        category: 'fou_avdrag',
        applicableHfdRulings: [],
        sniPrefixes: TECH_SNI_PREFIXES,
        agentId: 'fou_bevis',
        estimatedRecoveryRange: '1 - 20 MSEK',
        retroactiveYears: 6,
    },
    {
        id: 'rd_wage_intensity',
        name: 'Hog loneintensitet (>15%) utan FoU-avdrag',
        description: 'Foretag med personalkostnader over 15% av nettoomsattningen som inte utnyttjar forskningsavdraget. Dessa ar mycket troliga FoU-kandidater.',
        category: 'fou_avdrag',
        applicableHfdRulings: [],
        sniPrefixes: [],
        agentId: 'fou_bevis',
        estimatedRecoveryRange: '0.5 - 15 MSEK',
        retroactiveYears: 6,
    },
    {
        id: 'brf_vat_method',
        name: 'BRF momsatervinning — omsattningsmetoden (HFD 7071-24)',
        description: 'Bostadsrattsforeningar med hoga kommersiella lokalhyror kan anvanda omsattningsmetoden retroaktivt istallet for ytmetoden, enligt HFD 7071-24.',
        category: 'moms',
        applicableHfdRulings: ['HFD-7071-24'],
        sniPrefixes: [BRF_SNI],
        agentId: 'fastighet',
        estimatedRecoveryRange: '0.2 - 5 MSEK',
        retroactiveYears: 6,
    },
    {
        id: 'tax_penalty_removal',
        name: 'Skattetillagg — undanrojande (HFD 2024 ref. 52)',
        description: 'Mojliggor undanrojande av skattetillagg om felet varit "uppenbart" eller latt att identifiera for Skatteverket.',
        category: 'skattetillagg',
        applicableHfdRulings: ['HFD-2024-52'],
        sniPrefixes: [],
        agentId: 'sanktion',
        estimatedRecoveryRange: '0.1 - 10 MSEK',
        retroactiveYears: 6,
    },
    {
        id: 'leasing_vat',
        name: 'Momsfel vid finansiell leasing',
        description: 'Foretag med stora vagnparker eller leasingavtal dar momsen hanterats felaktigt. Vanligt vid finansiell leasing vs operationell leasing.',
        category: 'leasing',
        applicableHfdRulings: [],
        sniPrefixes: [],
        agentId: 'leasing',
        estimatedRecoveryRange: '0.1 - 3 MSEK',
        retroactiveYears: 6,
    },
];
