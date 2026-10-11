type OllamaMode = 'cloud' | 'local';

const mode = (process.env.OLLAMA_MODE || (process.env.OLLAMA_API_KEY ? 'cloud' : 'local')).toLowerCase() as OllamaMode;
const isCloud = mode === 'cloud';
const configuredCloudBaseUrl = (process.env.OLLAMA_CLOUD_BASE_URL || 'https://ollama.com/v1').replace(/\/+$/, '');
const cloudBaseUrl = configuredCloudBaseUrl.replace(/\/api$/i, '/v1');
const baseUrl = isCloud
  ? cloudBaseUrl
  : (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');

export const ollamaConfig = {
  mode: isCloud ? 'cloud' : 'local',
  baseUrl,
  model: process.env.OLLAMA_MODEL || (isCloud ? 'gemma4:cloud' : 'llava:latest'),
};

export interface VerificationResponse {
  verified: boolean;
  confidence: number;
  reason: string;
}

const verificationFormat = {
  type: 'object',
  properties: {
    verified: { type: 'boolean' },
    confidence: { type: 'number' },
    reason: { type: 'string' },
  },
  required: ['verified', 'confidence', 'reason'],
  additionalProperties: false,
};

function parseJsonText(text: string): unknown {
  const trimmed = text.trim();
  const candidates = [trimmed];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Some models add a short preamble or markdown despite JSON mode.
    }
  }

  // Recover a JSON object embedded in surrounding prose.
  for (let start = trimmed.indexOf('{'); start !== -1; start = trimmed.indexOf('{', start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < trimmed.length; index += 1) {
      const character = trimmed[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }

      if (character === '"') inString = true;
      else if (character === '{') depth += 1;
      else if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, index + 1));
          } catch {
            break;
          }
        }
      }
    }
  }

  throw new Error('Ollama returned invalid JSON');
}
function parseVerification(raw: unknown): VerificationResponse {
  // Ollama models may return a JSON string, or wrap structured output in
  // common envelope keys. Unwrap only known fields and keep validation strict.
  for (let depth = 0; depth < 3; depth += 1) {
    if (typeof raw === 'string') {
      raw = parseJsonText(raw);
    }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Ollama returned an invalid response');
    }

    const data = raw as Record<string, unknown>;
    const nested = data.verification ?? data.result ?? data.data ?? data.output;
    if (nested !== undefined && nested !== raw) {
      raw = nested;
      continue;
    }

    const answerValue = data.answer;
    const verifiedValue = data.verified
      ?? data.is_verified
      ?? data.is_reasonable
      ?? data.is_evidence
      ?? data.is_reasonable_evidence
      ?? (typeof answerValue === 'boolean' ? answerValue : undefined);
    const confidenceValue = data.confidence ?? data.confidence_score;
    const answerToken = typeof answerValue === 'string'
      ? answerValue.trim().toLowerCase().replace(/[.!]$/, '')
      : '';
    const answerVerdict = /^(true|yes|verified|sufficient|sufficient evidence)$/.test(answerToken)
      ? true
      : /^(false|no|rejected|insufficient|insufficient evidence)$/.test(answerToken)
        ? false
        : typeof answerValue === 'string' && /^(yes|correct|verified)\b/i.test(answerValue.trim())
          ? true
          : typeof answerValue === 'string' && /^(no|incorrect|unverified)\b/i.test(answerValue.trim())
            ? false
            : typeof answerValue === 'string' && /\b(insufficient evidence|not reasonable evidence|does not show|doesn't show|fails to show|unrelated to the challenge|cannot verify|no evidence|does not match|doesn't match)\b/i.test(answerValue)
              ? false
              : typeof answerValue === 'string' && /\b(reasonable evidence|sufficient evidence|matches the challenge|meets the challenge|clearly shows the activity|depicts an? (outdoor )?(sport|sports activity))\b/i.test(answerValue)
                ? true
                : undefined;
    const reasonValue = data.reason
      ?? data.explanation
      ?? (answerVerdict === undefined && typeof answerValue === 'string' ? answerValue : undefined);

    const verified = typeof verifiedValue === 'boolean'
      ? verifiedValue
      : typeof verifiedValue === 'string' && /^(true|false)$/i.test(verifiedValue)
        ? verifiedValue.toLowerCase() === 'true'
        : verifiedValue === undefined
          ? answerVerdict
          : undefined;
    let confidence = typeof confidenceValue === 'number'
      ? confidenceValue
      : typeof confidenceValue === 'string' && confidenceValue.trim() !== ''
        ? Number(confidenceValue)
        : Number.NaN;

    // Some models report a percentage instead of a 0-1 confidence value.
    if (confidence > 1 && confidence <= 100) confidence /= 100;

    if (verified !== undefined && Number.isFinite(confidence) && confidence >= 0 && confidence <= 1 && (typeof reasonValue === 'string' || reasonValue === undefined)) {
      return {
        verified,
        confidence,
        reason: typeof reasonValue === 'string'
          ? reasonValue.slice(0, 1000)
          : verified
            ? 'The image was marked as sufficient evidence for this challenge.'
            : 'The image was marked as insufficient evidence for this challenge.',
      };
    }

    // Log only keys and value types; never log model text or uploaded image data.
    console.error('Ollama verification response shape:', Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? 'array' : typeof value]),
    ));
    throw new Error('Ollama returned an unsupported verification response shape');
  }

  throw new Error('Ollama returned an unsupported verification response shape');
}

export async function verifyImage(challengeDescription: string, imageBase64: string): Promise<VerificationResponse> {
  const prompt = [
    'Determine whether the attached image provides reasonable visual evidence for the outdoor challenge below.',
    'Return only a JSON object with exactly these fields: verified (boolean), confidence (number from 0 to 1), and reason (short string).',
    'Example shape: {"verified":true,"confidence":0.92,"reason":"The image clearly shows the described outdoor activity."}',
    'Do not include analysis, markdown, or text outside the JSON object. Do not infer identity or exact location from the image.',
    `Challenge: "${challengeDescription.slice(0, 2000)}"`,
  ].join('\n');

  const dataUriMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]*)$/);
  const imageMimeType = dataUriMatch?.[1] || 'image/jpeg';
  const image = dataUriMatch ? dataUriMatch[2] : imageBase64;
  if (!image || image.length > 8_000_000) {
    throw new Error('Image data is missing or too large');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (isCloud) {
    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) throw new Error('OLLAMA_API_KEY is required when OLLAMA_MODE=cloud');
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const endpoint = isCloud ? `${baseUrl}/chat/completions` : `${baseUrl}/api/generate`;
  const payload = isCloud
    ? {
        model: ollamaConfig.model,
        stream: false,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: `data:${imageMimeType};base64,${image}` },
          ],
        }],
      }
    : {
        model: ollamaConfig.model,
        prompt,
        images: [image],
        stream: false,
        format: verificationFormat,
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
    if (response.status === 410) {
      throw new Error(`The configured Ollama model (\${ollamaConfig.model}) has been retired. Update OLLAMA_MODEL to an available vision-capable cloud model.`);
    }
    if (response.status === 404) {
      throw new Error(`The configured Ollama model or endpoint was not found (\${ollamaConfig.model}). Check OLLAMA_MODEL and OLLAMA_CLOUD_BASE_URL.`);
    }
    throw new Error(`Ollama verification failed (HTTP ${response.status}). Check the configured model and endpoint.`);
  }

  const data = await response.json() as {
    response?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const raw = isCloud ? data.choices?.[0]?.message?.content : data.response;
  return parseVerification(raw);
}
