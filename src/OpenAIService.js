class OpenAIService {
    constructor() {
        this.apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY') || '';
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    generateEmail(quoteDetails, userInstructions) {
        if (!this.apiKey) {
            return "Error: OPENAI_API_KEY is not set in Script Properties.";
        }

        const systemPrompt = "You are a helpful booking assistant for a boat rental company.\\n" +
            "Your task is to write a polite, professional, and exciting email quote response.\\n" +
            "Use the provided quote details (Boat, Price, Date, Notes).\\n" +
            "Incorporated the user's specific verbal instructions into the email body naturally.\\n" +
            "Be concise but warm.";

        const userPrompt = "\\nQUOTE DETAILS:\\n" + quoteDetails + "\\n\\n" +
            "VERBAL INSTRUCTIONS:\\n" + userInstructions + "\\n\\n" +
            "Please draft the email.";

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
                return "OpenAI Error: " + json.error.message;
            }
            return json.choices[0].message.content;
        } catch (e) {
            return "Error calling OpenAI: " + e;
        }
    }
}
