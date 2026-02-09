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

    // Duration Dropdown
    const durationDropdown = CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.DROPDOWN)
        .setTitle("Duration")
        .setFieldName("duration");
    durationDropdown.addItem("3 Hours", "3", false);
    durationDropdown.addItem("4 Hours", "4", true); // Default to 4
    durationDropdown.addItem("Hourly (Custom)", "1", false);
    section1.addWidget(durationDropdown);

    // Verbal Instructions Input
    const instructionsInput = CardService.newTextInput()
        .setFieldName("instructions")
        .setTitle("Verbal Instructions for AI")
        .setMultiline(true)
        .setHint("e.g., Mention the sunset view, offer a discount, etc.");
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
    const dateStr = formInputs.date;
    const duration = parseInt(formInputs.duration);
    const instructions = formInputs.instructions || "No special instructions.";

    if (!boatId || !dateStr) {
        return CardService.newActionResponseBuilder()
            .setNotification(CardService.newNotification().setText("Please select boat and date"))
            .build();
    }

    // Calculate
    var quoteResult;
    var errorMsg = "";
    try {
        quoteResult = calculateQuote({
            boatId: boatId,
            date: dateStr.toString(),
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

    // Call OpenAI
    const aiService = new OpenAIService();
    const quoteDetailsString =
        "Vessel: " + quoteResult.boatName + "\\n" +
        "Date: " + dateStr + "\\n" +
        "Duration: " + duration + " Hours\\n" +
        "Price: $" + quoteResult.price + "\\n" +
        "Pricing Notes: " + quoteResult.notes.join(', ');

    const emailDraft = aiService.generateEmail(quoteDetailsString, instructions);

    // Insert into Draft
    const response = CardService.newUpdateDraftActionResponseBuilder()
        .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
            .addUpdateContent(emailDraft, CardService.ContentType.TEXT)
            .setUpdateType(CardService.UpdateDraftBodyType.INSERT_AT_CURSOR))
        .build();

    return response;
}
