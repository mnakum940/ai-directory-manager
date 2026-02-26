export class OllamaClient {
    constructor(baseUrl = 'http://127.0.0.1:11434') {
        this.baseUrl = baseUrl;
    }

    async checkStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    async getModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) throw new Error('Failed to fetch models');
            const data = await response.json();
            return data.models.map(m => m.name);
        } catch (error) {
            console.error('Error fetching Ollama models:', error);
            return [];
        }
    }

    async generateEmbeddings(prompt, model = 'nomic-embed-text') {
        try {
            const response = await fetch(`${this.baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt
                }),
            });

            if (!response.ok) throw new Error('Failed to generate embeddings');
            const data = await response.json();
            return data.embedding;
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw error;
        }
    }

    async generateBlueprint(directoryStructure, systemPrompt, model = 'llama3', userFeedback = null) {
        try {
            const finalPrompt = userFeedback
                ? `${systemPrompt}\n\nCRITICAL USER FEEDBACK FOR THIS ITERATION:\nThe user rejected the previous blueprint with the following feedback: "${userFeedback}".\nYou MUST adjust your directory names, groupings, and logic to perfectly satisfy this feedback.`
                : systemPrompt;

            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: finalPrompt },
                        { role: 'user', content: JSON.stringify(directoryStructure) }
                    ],
                    format: 'json',
                    stream: false
                }),
            });

            if (!response.ok) throw new Error('Failed to generate blueprint');
            const data = await response.json();
            // Parse the JSON string from the LLM
            return JSON.parse(data.message.content);
        } catch (error) {
            console.error('Error generating blueprint:', error);
            throw error;
        }
    }
}

export const ollamaClient = new OllamaClient();
