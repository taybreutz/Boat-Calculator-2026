export enum SeasonTier {
    TIER_1 = 'TIER_1', // May 1 - June 19, Sept 7 - Oct 31
    TIER_2 = 'TIER_2', // June 20 - Sept 6
}

export interface Boat {
    id: string;
    name: string;
    capacity: number;
    type: 'Standard' | 'COI';
}

export const BOATS: Boat[] = [
    { id: '37_sear', name: "37' Sea Ray", capacity: 12, type: 'Standard' },
    { id: '46_sear', name: "46' Sea Ray Express", capacity: 12, type: 'Standard' },
    { id: '48_sear', name: "48' Sea Ray Express Bridge", capacity: 12, type: 'Standard' },
    { id: '50_sear', name: "50' Sea Ray Sundancer", capacity: 12, type: 'Standard' },
    { id: '56_sear', name: "56' Sea Ray Sundancer", capacity: 12, type: 'Standard' },
    { id: '57_azim', name: "57' Azimut Flybridge", capacity: 12, type: 'Standard' },
    { id: '57_pcat', name: "57' Power Catamaran", capacity: 40, type: 'COI' }, // Approx capacity for COI
    { id: '72_clas', name: "72' Classic Chris Craft", capacity: 40, type: 'COI' },
    { id: '85_pcat', name: "85' Power Catamaran", capacity: 40, type: 'COI' },
];

export interface PricingRule {
    boatId: string;
    tier: SeasonTier;
    hourly?: number;
    threeHour?: number;
    fourHour?: number;
    threeHourWeekend?: number; // Sat in Tier 2, Sat/Sun in Tier 1 context varies
    fourHourWeekend?: number; // Sat in Tier 2, Sat/Sun in Tier 1
    fourHourSun?: number; // Specific for Tier 2 Sunday
    threeHourSun?: number; // Specific for Tier 2 Sunday
    coiSatTues?: number; // Hourly rate
    coiWedFri?: number; // Hourly rate
}

export const PRICING: PricingRule[] = [
    // --- TIER 1 (May 1 - June 19, Sept 7 - Oct 31) ---
    // Note: Tier 1 headers are "Sunday-Friday" (base) and "Saturday" (weekend)
    { boatId: '37_sear', tier: SeasonTier.TIER_1, hourly: 275, threeHour: 825, fourHour: 1000, fourHourWeekend: 1100, threeHourWeekend: 900 },
    { boatId: '46_sear', tier: SeasonTier.TIER_1, hourly: 300, threeHour: 900, fourHour: 1150, fourHourWeekend: 1300, threeHourWeekend: 1100 },
    { boatId: '48_sear', tier: SeasonTier.TIER_1, hourly: 325, threeHour: 975, fourHour: 1225, fourHourWeekend: 1350, threeHourWeekend: 1150 },
    { boatId: '50_sear', tier: SeasonTier.TIER_1, hourly: 350, threeHour: 1050, fourHour: 1300, fourHourWeekend: 1400, threeHourWeekend: 1200 },
    { boatId: '56_sear', tier: SeasonTier.TIER_1, hourly: 400, threeHour: 1200, fourHour: 1550, fourHourWeekend: 1700, threeHourWeekend: 1425 },
    { boatId: '57_azim', tier: SeasonTier.TIER_1, hourly: 600, threeHour: 1800, fourHour: 2250, fourHourWeekend: 2400, threeHourWeekend: 2000 },
    // COI Boats Tier 1
    { boatId: '57_pcat', tier: SeasonTier.TIER_1, coiSatTues: 1000, coiWedFri: 1750 },
    { boatId: '72_clas', tier: SeasonTier.TIER_1, coiSatTues: 1350, coiWedFri: 2000 },
    { boatId: '85_pcat', tier: SeasonTier.TIER_1, coiSatTues: 1750, coiWedFri: 2500 },

    // --- TIER 2 (June 20 - Sept 6) ---
    // Note: Tier 2 headers are "Monday-Friday", "Saturday - Sunday" (but detailed columns split Sat/Sun often)
    { boatId: '37_sear', tier: SeasonTier.TIER_2, hourly: 275, threeHour: 825, fourHour: 1100, fourHourWeekend: 1600, threeHourSun: 1150, fourHourSun: 1400 },
    { boatId: '46_sear', tier: SeasonTier.TIER_2, hourly: 300, threeHour: 900, fourHour: 1200, fourHourWeekend: 1900, threeHourSun: 1250, fourHourSun: 1650 },
    { boatId: '48_sear', tier: SeasonTier.TIER_2, hourly: 325, threeHour: 975, fourHour: 1300, fourHourWeekend: 1975, threeHourSun: 1300, fourHourSun: 1700 }, // Check 48' Sat price, image blur, inferred 1975
    { boatId: '50_sear', tier: SeasonTier.TIER_2, hourly: 350, threeHour: 1050, fourHour: 1400, fourHourWeekend: 2050, threeHourSun: 1350, fourHourSun: 1750 },
    { boatId: '56_sear', tier: SeasonTier.TIER_2, hourly: 400, threeHour: 1200, fourHour: 1600, fourHourWeekend: 2350, threeHourSun: 1500, fourHourSun: 1950 },
    { boatId: '57_azim', tier: SeasonTier.TIER_2, hourly: 800, threeHour: 1800, fourHour: 2400, fourHourWeekend: 2950, threeHourSun: 1950, fourHourSun: 2550 },
    // COI Boats Tier 2
    { boatId: '57_pcat', tier: SeasonTier.TIER_2, coiSatTues: 1500, coiWedFri: 1750 },
    { boatId: '72_clas', tier: SeasonTier.TIER_2, coiSatTues: 1750, coiWedFri: 2000 },
    { boatId: '85_pcat', tier: SeasonTier.TIER_2, coiSatTues: 2000, coiWedFri: 2500 },
];

export const HOLIDAYS = [
    { name: "MDW", start: "2026-05-22", end: "2026-05-25" },
    { name: "Juneteenth", start: "2026-06-19", end: "2026-06-19" }, // Friday
    { name: "Black Yacht Weekend", start: "2026-06-19", end: "2026-06-21" },
    { name: "4th of July Week", start: "2026-07-03", end: "2026-07-05" },
    { name: "Air & Water Show", start: "2026-08-29", end: "2026-08-30" },
];

export function getTier(date: Date): SeasonTier {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // Tier 1: May 1 - June 19
    if ((month === 5) || (month === 6 && day <= 19)) return SeasonTier.TIER_1;
    // Tier 2: June 20 - Sept 6
    if ((month === 6 && day >= 20) || (month === 7) || (month === 8) || (month === 9 && day <= 6)) return SeasonTier.TIER_2;
    // Tier 1: Sept 7 - Oct 31
    if ((month === 9 && day >= 7) || (month === 10)) return SeasonTier.TIER_1;

    return SeasonTier.TIER_1; // Default fallthrough (or error)
}
