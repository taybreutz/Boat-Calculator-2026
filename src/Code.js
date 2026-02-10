// --- Trigger Entry Point ---
function onGmailCompose(e) {
    return createComposeCard();
}

// --- UI Construction ---
function createComposeCard() {
    const card = CardService.newCardBuilder();

    // Section 1: Boat Selection
    const section1 = CardService.newCardSection()
        .setHeader("Quote Calculator");

    // Boat Dropdown
    const boatDropdown = CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.DROPDOWN)
        .setTitle("Select Vessel")
        .setFieldName("boatId");

    BOATS.forEach(function (boat) {
        boatDropdown.addItem(boat.name, boat.id, false);
    });
    section1.addWidget(boatDropdown);

    // Date Picker
    const datePicker = CardService.newDatePicker()
        .setTitle("Date")
        .setFieldName("date");
    section1.addWidget(datePicker);

    const customerNameInput = CardService.newTextInput()
        .setFieldName("customerName")
        .setTitle("Customer Name")
        .setHint("e.g., Jane Smith");
    section1.addWidget(customerNameInput);

    // Duration Dropdown
    const durationDropdown = CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.DROPDOWN)
        .setTitle("Duration")
        .setFieldName("duration");
    durationDropdown.addItem("3 Hours", "3", false);
    durationDropdown.addItem("4 Hours", "4", true); // Default to 4
    durationDropdown.addItem("Hourly (Custom)", "1", false);
    section1.addWidget(durationDropdown);

    const guestCountInput = CardService.newTextInput()
        .setFieldName("guestCount")
        .setTitle("Guest Count")
        .setHint("Used for beverage package pricing");
    section1.addWidget(guestCountInput);

    const discountInput = CardService.newTextInput()
        .setFieldName("discountPercent")
        .setTitle("Vessel Discount (%)")
        .setHint("Optional. Applies to vessel only.");
    section1.addWidget(discountInput);

    const foodPackageInput = CardService.newTextInput()
        .setFieldName("foodPackageAmount")
        .setTitle("Food Package ($)")
        .setHint("Optional");
    section1.addWidget(foodPackageInput);

    const beveragePackageDropdown = CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.DROPDOWN)
        .setTitle("Beverage Package")
        .setFieldName("beveragePackageType");
    beveragePackageDropdown.addItem("None", "none", true);
    BEVERAGE_PACKAGES.forEach(function (pkg) {
        beveragePackageDropdown.addItem(
            pkg.name + " (" + formatCurrency(pkg.ratePerPersonPerHour) + "/person/hour)",
            pkg.id,
            false
        );
    });
    section1.addWidget(beveragePackageDropdown);

    // Notes used by the LLM greeting/rapport section (separate from quote math).
    const instructionsInput = CardService.newTextInput()
        .setFieldName("notes")
        .setTitle("Notes for Greeting")
        .setMultiline(true)
        .setHint("Optional context for rapport and tone");
    section1.addWidget(instructionsInput);

    // Generate Button
    const action = CardService.newAction()
        .setFunctionName("generateQuoteCallback");
    const button = CardService.newTextButton()
        .setText("Generate Quote & Insert")
        .setOnClickAction(action)
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED);
    section1.addWidget(button);

    card.addSection(section1);
    return [card.build()];
}

// --- Action Handler ---
function generateQuoteCallback(e) {
    const formInputs = e.formInput;
    const boatId = formInputs.boatId;
    const selectedDate = normalizeDateInput(formInputs.date);
    const duration = parseInt(formInputs.duration);
    const customerName = toNameCase(formInputs.customerName || "Customer");
    const notes = String(formInputs.notes || "").trim();
    const guestCount = parseCountInput(formInputs.guestCount);
    const discountPercent = parsePercentInput(formInputs.discountPercent);
    const foodPackageAmount = parseCurrencyInput(formInputs.foodPackageAmount);
    const beveragePackage = getBeveragePackage(formInputs.beveragePackageType);
    const beveragePackageAmount = beveragePackage.ratePerPersonPerHour * guestCount * duration;

    if (!boatId || !selectedDate || !duration || duration < 1) {
        return CardService.newActionResponseBuilder()
            .setNotification(CardService.newNotification().setText("Please select boat, date, and duration"))
            .build();
    }

    // Calculate
    var quoteResult;
    var errorMsg = "";
    try {
        quoteResult = calculateQuote({
            boatId: boatId,
            date: selectedDate.isoDate,
            durationHours: duration
        });
    } catch (err) {
        errorMsg = "Calc Error: " + err;
    }

    if (errorMsg) {
        return CardService.newActionResponseBuilder()
            .setNotification(CardService.newNotification().setText(errorMsg))
            .build();
    }

    const vesselBase = quoteResult.price;
    const appliedDiscount = vesselBase * (discountPercent / 100);
    const discountedVessel = vesselBase - appliedDiscount;
    const foodAndBeverageSubtotal = foodPackageAmount + beveragePackageAmount;
    const packageTax = foodAndBeverageSubtotal * 0.1125;
    const serviceCharge = (discountedVessel + foodAndBeverageSubtotal) * 0.18;
    const grandTotal = discountedVessel + foodAndBeverageSubtotal + packageTax + serviceCharge;

    const beverageDisplay = beveragePackage.id === "none"
        ? "None"
        : beveragePackage.name + " x " + guestCount + " guests x " + duration + " hours";

    const aiService = new OpenAIService();
    const greetingText = aiService.generateGreeting({
        customerName: customerName,
        boatName: quoteResult.boatName,
        date: selectedDate.displayDate,
        durationHours: duration
    }, notes);
    const greetingHtml = textToHtml(greetingText);

    const quoteLines = [
        "<strong>QUOTE BREAKDOWN</strong>",
        "Customer: " + escapeHtml(customerName),
        "Vessel: " + escapeHtml(quoteResult.boatName),
        "Date: " + escapeHtml(selectedDate.displayDate),
        "Duration: " + escapeHtml(String(duration)) + " Hours",
        "",
        "Vessel Base: " + formatCurrency(vesselBase),
        "Vessel Discount (" + formatPercent(discountPercent) + "): -" + formatCurrency(appliedDiscount),
        "Vessel After Discount: " + formatCurrency(discountedVessel),
        "Food Package: " + formatCurrency(foodPackageAmount),
        "Beverage Package: " + escapeHtml(beverageDisplay),
        "Beverage Amount: " + formatCurrency(beveragePackageAmount),
        "Food + Beverage Tax (11.25%): " + formatCurrency(packageTax),
        "Service Charge (18% post-discount): " + formatCurrency(serviceCharge),
        "<strong>Total: " + formatCurrency(grandTotal) + "</strong>",
        "",
        "Pricing Notes: " + escapeHtml(quoteResult.notes.join(", "))
    ];
    const quoteHtml = quoteLines.join("<br>");
    const emailDraftHtml = greetingHtml + "<br><br>" + quoteHtml;

    // Insert into draft. Some runtimes expose this API on AddOnsResponseService.
    const responseApi =
        (typeof AddOnsResponseService !== "undefined" &&
            typeof AddOnsResponseService.newUpdateDraftBodyAction === "function")
            ? AddOnsResponseService
            : CardService;

    const bodyAction = responseApi.newUpdateDraftBodyAction()
        .addUpdateContent(emailDraftHtml, CardService.ContentType.MUTABLE_HTML);

    // Gmail backend currently requires update_body.type in UpdateDraftActionMarkup.
    if (typeof bodyAction.setUpdateType === "function") {
        bodyAction.setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT);
        return responseApi.newUpdateDraftActionResponseBuilder()
            .setUpdateDraftBodyAction(bodyAction)
            .build();
    }

    // Graceful fallback for runtimes where draft body update APIs are unavailable.
    return CardService.newActionResponseBuilder()
        .setNotification(
            CardService.newNotification().setText(
                "Your Gmail add-on runtime doesn't expose draft body update APIs in this environment."
            )
        )
        .build();
}

function parseCurrencyInput(value) {
    if (value === null || value === undefined || value === "") return 0;
    const numeric = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
    if (isNaN(numeric) || numeric < 0) return 0;
    return numeric;
}

function parsePercentInput(value) {
    if (value === null || value === undefined || value === "") return 0;
    const numeric = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
    if (isNaN(numeric)) return 0;
    if (numeric < 0) return 0;
    if (numeric > 100) return 100;
    return numeric;
}

function parseCountInput(value) {
    if (value === null || value === undefined || value === "") return 1;
    const numeric = parseInt(String(value).replace(/[^0-9]/g, ""), 10);
    if (isNaN(numeric) || numeric < 1) return 1;
    return numeric;
}

function sanitizeSingleLine(value) {
    return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

function formatCurrency(value) {
    return "$" + Number(value || 0).toFixed(2);
}

function formatPercent(value) {
    return Number(value || 0).toFixed(2) + "%";
}

function toNameCase(value) {
    var cleaned = sanitizeSingleLine(value || "Customer").toLowerCase();
    if (!cleaned) return "Customer";
    return cleaned.replace(/\b([a-z])/g, function (_, letter) {
        return letter.toUpperCase();
    });
}

function normalizeDateInput(value) {
    if (value === null || value === undefined || value === "") return null;

    if (Array.isArray(value) && value.length > 0) {
        return normalizeDateInput(value[0]);
    }

    if (typeof value === "object") {
        if (value.msSinceEpoch !== undefined) return normalizeDateInput(value.msSinceEpoch);
        if (value.dateMs !== undefined) return normalizeDateInput(value.dateMs);
        if (value.dateInput !== undefined) return normalizeDateInput(value.dateInput);
        if (value.value !== undefined) return normalizeDateInput(value.value);
    }

    var asString = String(value).trim();
    if (!asString) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) {
        var yyyyMmDd = asString;
        var displayFromIso = Utilities.formatDate(
            new Date(yyyyMmDd + "T00:00:00"),
            Session.getScriptTimeZone(),
            "MMMM d, yyyy"
        );
        return {
            isoDate: yyyyMmDd,
            displayDate: displayFromIso
        };
    }

    var ms = Number(asString);
    if (isNaN(ms)) return null;
    var dateObj = new Date(ms);
    if (isNaN(dateObj.getTime())) return null;

    return {
        isoDate: Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "yyyy-MM-dd"),
        displayDate: Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "MMMM d, yyyy")
    };
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function textToHtml(value) {
    var safe = escapeHtml(value || "");
    safe = safe.replace(/\r\n/g, "\n");
    safe = safe.replace(/\n\n+/g, "</p><p>");
    safe = safe.replace(/\n/g, "<br>");
    return "<p>" + safe + "</p>";
}

const BEVERAGE_PACKAGES = [
    { id: "beer_wine", name: "Beer & Wine", ratePerPersonPerHour: 12.5 },
    { id: "call", name: "Call Package", ratePerPersonPerHour: 16.5 },
    { id: "premium", name: "Premium Package", ratePerPersonPerHour: 20.0 }
];

function getBeveragePackage(id) {
    const selectedId = id || "none";
    for (var i = 0; i < BEVERAGE_PACKAGES.length; i += 1) {
        if (BEVERAGE_PACKAGES[i].id === selectedId) return BEVERAGE_PACKAGES[i];
    }
    return { id: "none", name: "None", ratePerPersonPerHour: 0 };
}
