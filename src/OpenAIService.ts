export class OpenAIService {
    private apiKey: string;
    private apiUrl: string = 'https://api.openai.com/v1/chat/completions';

    constructor() {
        this.apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY') || '';
    }

    public generateEmail(quoteDetails: string, userInstructions: string): string {
        if (!this.apiKey) {
            return "Error: OPENAI_API_KEY is not set in Script Properties.";
        }

        const systemPrompt = `You are a helpful booking assistant for a boat rental company.
    Your task is to write a polite, professional, and exciting email quote response.
    Use the provided quote details (Boat, Price, Date, Notes).
    Incorporated the user's specific verbal instructions into the email body naturally.
    Be concise but warm.`;

        const userPrompt = `
    QUOTE DETAILS:
    ${quoteDetails}

    VERBAL INSTRUCTIONS:
    ${userInstructions}
    
    Please draft the email.`;

        const payload = {
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7
        };

        const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            method: 'post',
            contentType: 'application/json',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        try {
            const response = UrlFetchApp.fetch(this.apiUrl, options);
            const json = JSON.parse(response.getContentText());
            if (json.error) {
                return `OpenAI Error: ${json.error.message}`;
            }
            return json.choices[0].message.content;
        } catch (e) {
            return `Error calling OpenAI: ${e}`;
        }
    }
}
