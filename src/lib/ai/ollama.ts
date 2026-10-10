type OllamaMode = 'cloud' | 'local';

const mode = (process.env.OLLAMA_MODE || (process.env.OLLAMA_API_KEY ? 'cloud' : 'local')).toLowerCase() as OllamaMode;
const isCloud = mode === 'cloud';
const baseUrl = (isCloud
  ? (process.env.OLLAMA_CLOUD_BASE_URL || 'https://ollama.com/api')
  : (process.env.OLLAMA_URL || 'http://127.0.0.1:11434')).replace(/\/$/, '');

export const ollamaConfig = {
  mode: isCloud ? 'cloud' : 'local',
  baseUrl,
  model: process.env.OLLAMA_MODEL || (isCloud ? 'qwen2.5vl: cloud' : 'llava:latest'),
};

export interface VerificationResponse {
  verified: boolean;
  confidence: number;
  reason: string;
}

function parseVerification(raw: unknown): VerificationResponse {
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      throw new Error('Ollama returned invalid JSON');
    }
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('Ollama returned an invalid response');
  }

  const data = raw as Record<string, unknown>;
  if (typeof data.verified !== 'boolean' || typeof data.confidence !== 'number' || typeof data.reason !== 'string') {
    throw new Error('Ollama response must contain verified, confidence, and reason fields');
  }

  return {
    verified: data.verified,
    confidence: Math.min(1, Math.max(0, data.confidence)),
    reason: data.reason.slice(0, 1000),
  };
}

export async function verifyImage(challengeDescription: string, imageBase64: string): Promise<VerificationResponse> {
  const prompt = [
    'Determine whether the attached image provides reasonable visual evidence for the outdoor challenge below.',
    'Return only a JSON object with this exact shape: {"verified": boolean, "confidence": number, "reason": "short explanation"}.',
    'Use a confidence number between 0 and 1. Do not infer identity or exact location from the image.',
    `Challenge: "${challengeDescription.slice(0, 2000)}"`,
  ].join('\n');

  const image = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  if (!image || image.length > 8_000_000) {
    throw new Error('Image data is missing or too large');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (isCloud) {
    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) throw new Error('OLLAMA_API_KEY is required when OLLAMA_MODE=cloud');
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const endpoint = isCloud ? `${baseUrl}/chat` : `${baseUrl}/api/generate`;
  const payload = isCloud
    ? {
        model: ollamaConfig.model,
        stream: false,
        format: 'json',
        messages: [{ role: 'user', content: prompt, images: [image] }],
      }
    : {
        model: ollamaConfig.model,
        prompt,
        images: [image],
        stream: false,
        format: 'json',
      };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS || 45000)),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Ollama connection error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('AI verification service is unreachable. Check the Ollama endpoint and deployment configuration.');
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('Ollama API error:', response.status, detail.slice(0, 500));
    if (response.status === 401 || response.status === 403) {
      throw new Error('Ollama authentication failed. Check OLLAMA_API_KEY.');
    }
    throw new Error(`Ollama verification failed (HTTP ${response.status}). Check the configured model and endpoint.`);
  }

  const data = await response.json() as { response?: unknown; message?: { content?: unknown } };
  const raw = isCloud ? data.message?.content : data.response;
  return parseVerification(raw);
}
