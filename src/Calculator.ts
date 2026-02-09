import { BOATS, PRICING, PricingRule, SeasonTier, getTier } from './BoatData';

export interface QuoteRequest {
    boatId: string;
    date: string; // YYYY-MM-DD
    durationHours: number;
}

export interface QuoteResult {
    boatName: string;
    price: number;
    tier: string;
    notes: string[];
}

export function calculateQuote(request: QuoteRequest): QuoteResult {
    const boat = BOATS.find(b => b.id === request.boatId);
    if (!boat) throw new Error("Boat not found");

    const dateDate = new Date(request.date);
    // Fix timezone issue by treating input string as local date parts
    // (Quick hack: append T00:00:00 to ensure we parse the day correctly without UTC shifts, assuming input is accurate)
    const parts = request.date.split('-');
    const localDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

    const tier = getTier(localDate);
    const rule = PRICING.find(r => r.boatId === request.boatId && r.tier === tier);

    if (!rule) throw new Error("Pricing rule not found for date/boat");

    const dayOfWeek = localDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    let price = 0;
    const notes: string[] = [];

    // COI Logic
    if (boat.type === 'COI') {
        // Sat-Tues (6, 0, 1, 2)
        if ([6, 0, 1, 2].indexOf(dayOfWeek) !== -1) {
            price = (rule.coiSatTues || 0) * request.durationHours;
            notes.push(`Rate: $${rule.coiSatTues}/hr (Sat-Tues rule)`);
        } else {
            // Wed-Fri (3, 4, 5)
            price = (rule.coiWedFri || 0) * request.durationHours;
            notes.push(`Rate: $${rule.coiWedFri}/hr (Wed-Fri rule)`);
        }
    }
    // Standard Logic
    else {
        if (tier === SeasonTier.TIER_1) {
            if (dayOfWeek === 6) { // Saturday
                if (request.durationHours === 4) price = rule.fourHourWeekend || 0;
                else if (request.durationHours === 3) price = rule.threeHourWeekend || 0;
                else price = (rule.hourly || 0) * request.durationHours;
                notes.push("Tier 1 Saturday Pricing");
            } else { // Sun-Fri
                if (request.durationHours === 4) price = rule.fourHour || 0;
                else if (request.durationHours === 3) price = rule.threeHour || 0;
                else price = (rule.hourly || 0) * request.durationHours;
                notes.push("Tier 1 Sun-Fri Pricing");
            }
        }
        else if (tier === SeasonTier.TIER_2) {
            if (dayOfWeek === 6) { // Saturday
                // Note: Image says "4 Hour SAT" for Tier 2. Doesn't explicitly list 3 Hour for SAT in Tier 2 column?
                // Wait, Header is "4 Hour SAT". Column "3 Hour SUN" is next.
                // Assuming Sat is 4h only or custom?
                // Let's assume if 3h requested on Sat in Tier 2, we fallback or error?
                // For now, if they request 3h and we have no price, price is 0 (error).
                if (request.durationHours === 4) price = rule.fourHourWeekend || 0;
                notes.push("Tier 2 Saturday Pricing");
            } else if (dayOfWeek === 0) { // Sunday
                if (request.durationHours === 4) price = rule.fourHourSun || 0;
                else if (request.durationHours === 3) price = rule.threeHourSun || 0;
                notes.push("Tier 2 Sunday Pricing");
            } else { // Mon-Fri
                if (request.durationHours === 4) price = rule.fourHour || 0;
                else if (request.durationHours === 3) price = rule.threeHour || 0;
                else price = (rule.hourly || 0) * request.durationHours;
                notes.push("Tier 2 Mon-Fri Pricing");
            }
        }
    }

    if (price === 0) {
        notes.push("Exact pricing configuration not found for this duration/day combination. Using hourly base rate fallback.");
        // Fallback?
        price = (rule.hourly || 0) * request.durationHours;
    }

    return {
        boatName: boat.name,
        price,
        tier,
        notes
    };
}
