function calculateQuote(request) {
    const boat = BOATS.find(b => b.id === request.boatId);
    if (!boat) throw new Error("Boat not found");

    // Parse date string to Date object
    const parts = request.date.split('-');
    // Note inputs are typically YYYY-MM-DD
    const localDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

    const tier = getTier(localDate);
    const rule = PRICING.find(r => r.boatId === request.boatId && r.tier === tier);

    if (!rule) throw new Error("Pricing rule not found for date/boat");

    const dayOfWeek = localDate.getDay(); // 0=Sun
    let price = 0;
    const notes = [];

    // COI Logic
    if (boat.type === 'COI') {
        if ([6, 0, 1, 2].indexOf(dayOfWeek) !== -1) { // Sat, Sun, Mon, Tues
            price = (rule.coiSatTues || 0) * request.durationHours;
            notes.push("Rate: $" + rule.coiSatTues + "/hr (Sat-Tues rule)");
        } else {
            price = (rule.coiWedFri || 0) * request.durationHours;
            notes.push("Rate: $" + rule.coiWedFri + "/hr (Wed-Fri rule)");
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
                if (request.durationHours === 4) price = rule.fourHourWeekend || 0;
                else if (request.durationHours === 3) price = 0; // fallback logic needed?
                if (price === 0) price = (rule.hourly || 0) * request.durationHours; // Fallback
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
        notes.push("Exact pricing configuration not found. Using hourly base.");
        price = (rule.hourly || 0) * request.durationHours;
    }

    return {
        boatName: boat.name,
        price: price,
        tier: tier,
        notes: notes
    };
}
