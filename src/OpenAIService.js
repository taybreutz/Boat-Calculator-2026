class OpenAIService {
    constructor() {
        this.apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY') || '';
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    generateGreeting(context, notes) {
        if (!this.apiKey) {
            return this.defaultGreeting(context);
        }

        const systemPrompt = "You write only the greeting and rapport section for a yacht charter quote email.\\n" +
            "Do not include prices, totals, taxes, fees, discounts, or any quote line items.\\n" +
            "Do not include subject lines or signatures.\\n" +
            "Keep it warm, professional, and concise (2-4 short paragraphs).";

        const userPrompt = "CUSTOMER: " + context.customerName + "\\n" +
            "VESSEL: " + context.boatName + "\\n" +
            "DATE: " + context.date + "\\n" +
            "DURATION: " + context.durationHours + " hours\\n\\n" +
            "NOTES FOR TONE/RAPPORT:\\n" + (notes || "No additional notes.") + "\\n\\n" +
            "Write only the greeting/rapport text.";

        const payload = {
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7
        };

        const options = {
            method: 'post',
            contentType: 'application/json',
            headers: {
                'Authorization': 'Bearer ' + this.apiKey
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        try {
            const response = UrlFetchApp.fetch(this.apiUrl, options);
            const json = JSON.parse(response.getContentText());
            if (json.error) {
                return this.defaultGreeting(context);
            }
            return json.choices[0].message.content;
        } catch (e) {
            return this.defaultGreeting(context);
        }
    }

    defaultGreeting(context) {
        return "Hi " + context.customerName + ",\n\n" +
            "Thank you for reaching out about your charter plans. I put together your quote details below for the " +
            context.boatName + " on " + context.date + ".\n\n" +
            "If you'd like, I can also tailor options based on your preferred onboard experience.";
    }
}
