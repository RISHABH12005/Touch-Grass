export const ollamaConfig = {
  baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llava:latest',
};

export interface VerificationResponse {
  verified: boolean;
  confidence: number;
  reason: string;
}

export async function verifyImage(challengeDescription: string, imageBase64: string): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${ollamaConfig.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaConfig.model,
        prompt: `Analyze this image and determine if it satisfies the following challenge: "${challengeDescription}". 
        You MUST respond ONLY with a JSON object in this exact format: 
        {"verified": boolean, "confidence": number, "reason": "string"}. 
        Do not include any other text or markdown formatting.`,
        images: [imageBase64],
        stream: false,
        format: 'json'
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API responded with status ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.response);

    if (typeof result.verified !== 'boolean' || typeof result.confidence !== 'number' || typeof result.reason !== 'string') {
      throw new Error('Invalid AI response format');
    }

    return result;
  } catch (error) {
    console.error('AI Verification Error:', error);
    throw error;
  }
}
