// Vercel serverless — proxies Gemini so the API key never reaches the browser.
// The model is fixed here and inputs are capped, so this can't be used as an open Gemini proxy.

const MODEL = 'gemini-3.1-flash-lite';
const MAX_PROMPT_CHARS = 8000;
const MAX_OUTPUT_TOKENS = 2048;

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

interface GeminiRequestBody {
  prompt?: unknown;
  json?: unknown;            // true → ask for application/json output
  schema?: unknown;          // optional responseSchema (implies json)
  temperature?: unknown;
  maxOutputTokens?: unknown;
}

// Errors use Gemini's own { error: { message } } shape so callers can handle them the same way
const fail = (res: ApiResponse, code: number, message: string) =>
  res.status(code).json({ error: { message } });

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return fail(res, 405, 'Method not allowed');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fail(res, 500, 'GEMINI_API_KEY not set in environment');
  }

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as GeminiRequestBody;
  const { prompt, json, schema, temperature, maxOutputTokens } = body;

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return fail(res, 400, 'No prompt provided');
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return fail(res, 413, 'Prompt too long');
  }

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: typeof maxOutputTokens === 'number'
      ? Math.min(Math.max(1, Math.floor(maxOutputTokens)), MAX_OUTPUT_TOKENS)
      : MAX_OUTPUT_TOKENS,
  };
  if (typeof temperature === 'number') {
    generationConfig.temperature = Math.min(Math.max(0, temperature), 2);
  }
  if (json === true || schema) {
    generationConfig.responseMimeType = 'application/json';
  }
  if (schema && typeof schema === 'object') {
    generationConfig.responseSchema = schema;
  }

  const callGemini = () => fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
    }
  );

  try {
    let response = await callGemini();
    // Gemini returns 503 during short demand spikes — one quick retry clears most of them
    if (response.status === 503) {
      await new Promise(resolve => setTimeout(resolve, 800));
      response = await callGemini();
    }

    const data = await response.json().catch(() => ({})) as {
      error?: { message?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
    };

    if (!response.ok) {
      console.error('Gemini error:', response.status, data.error?.message);
      return fail(res, response.status, data.error?.message || 'Gemini request failed');
    }

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = (parts.find(p => !p.thought) ?? parts[0])?.text ?? '';
    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini proxy error:', error);
    return fail(res, 502, 'Could not reach Gemini');
  }
}
