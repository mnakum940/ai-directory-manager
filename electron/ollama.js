import http from 'node:http';
import path from 'node:path';

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

            const postData = JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: finalPrompt },
                    { role: 'user', content: JSON.stringify(directoryStructure) }
                ],
                options: {
                    num_predict: 8000,
                    temperature: 0.1
                },
                stream: false
            });

            return new Promise((resolve, reject) => {
                const req = http.request(new URL('/api/chat', this.baseUrl), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    },
                    timeout: 3600000 // 1 hour timeout instead of standard 5 minutes
                }, (res) => {
                    let rawData = '';
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => { rawData += chunk; });
                    res.on('end', () => {
                        if (res.statusCode !== 200) {
                            return reject(new Error('Failed to generate blueprint: HTTP ' + res.statusCode));
                        }
                        try {
                            const data = JSON.parse(rawData);
                            let content = data.message.content;

                            // Try extracting from markdown first
                            const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
                            if (markdownMatch) {
                                content = markdownMatch[1];
                            }

                            // Fallback: find first { and last }
                            const firstBrace = content.indexOf('{');
                            const lastBrace = content.lastIndexOf('}');
                            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
                                content = content.substring(firstBrace, lastBrace + 1);
                            }

                            const parsedJson = JSON.parse(content.trim());

                            // POST-PROCESSING SAFETY LAYER: Forcefully correct LLM filename hallucinations
                            if (parsedJson && parsedJson.actions && Array.isArray(parsedJson.actions)) {
                                parsedJson.actions = parsedJson.actions.map(action => {
                                    if (action.type === 'move' && action.source && action.target) {
                                        const sourceFile = path.basename(action.source);
                                        const targetFile = path.basename(action.target);
                                        // If the LLM hallucinated a new filename, stitch the target folder with the original sequence source filename
                                        if (sourceFile !== targetFile) {
                                            const targetDir = path.dirname(action.target);
                                            action.target = path.join(targetDir, sourceFile);
                                            action.reason = (action.reason || '') + ' [System Note: Corrected hallucinated filename.]';
                                        }
                                    }
                                    return action;
                                });
                            }

                            resolve(parsedJson);
                        } catch (e) {
                            reject(new Error('Failed to parse JSON response from Ollama: ' + e.message + ' | Raw output length: ' + rawData.length));
                        }
                    });
                });

                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Ollama took too long to respond (timeout after 1 hour).'));
                });

                req.on('error', (error) => {
                    reject(error);
                });

                req.write(postData);
                req.end();
            });
        } catch (error) {
            console.error('Error generating blueprint:', error);
            throw error;
        }
    }
}

export const ollamaClient = new OllamaClient();
