import type { VercelRequest, VercelResponse } from '@vercel/node';

// Increase body size limit for audio files (~1-5MB typical)
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'SARVAM_API_KEY not set in environment' });
  }

  const { audio, mimeType, languageCode } = req.body as {
    audio: string;
    mimeType: string;
    languageCode?: string;
  };

  if (!audio) {
    return res.status(400).json({ error: 'No audio data provided' });
  }

  // Decode base64 audio — Node.js Buffer handles this natively
  const buffer = Buffer.from(audio, 'base64');
  const ext = (mimeType || '').includes('mp4') ? 'mp4'
    : (mimeType || '').includes('aac') ? 'aac'
    : (mimeType || '').includes('ogg') ? 'ogg'
    : 'webm';

  // Node.js 18+ (Vercel default) has native fetch, FormData, Blob — no imports needed
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: mimeType || 'audio/webm' }), `recording.${ext}`);
  formData.append('model', 'saaras:v3');
  formData.append('mode', 'transcribe');
  if (languageCode && languageCode !== 'auto') {
    formData.append('language_code', languageCode);
  }

  const response = await fetch('https://api.sarvam.ai/speech-to-text', {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Sarvam error:', response.status, text);
    return res.status(response.status).json({ error: text });
  }

  const data = await response.json() as { transcript?: string; language_code?: string };
  return res.status(200).json({
    transcript: data.transcript || '',
    language_code: data.language_code,
  });
}
