import type { VercelRequest, VercelResponse } from '@vercel/node';

// Increase body size limit for audio files
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Sarvam API key not configured on server' });
  }

  const { audio, mimeType, languageCode } = req.body as {
    audio: string;
    mimeType: string;
    languageCode?: string;
  };

  if (!audio) {
    return res.status(400).json({ error: 'No audio data provided' });
  }

  // Decode base64 audio sent from client
  const buffer = Buffer.from(audio, 'base64');
  const ext = mimeType?.includes('mp4') ? 'mp4'
    : mimeType?.includes('aac') ? 'aac'
    : mimeType?.includes('ogg') ? 'ogg'
    : 'webm';

  const { FormData, Blob } = await import('undici');
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: mimeType }), `recording.${ext}`);
  formData.append('model', 'saaras:v3');
  formData.append('mode', 'transcribe');
  if (languageCode && languageCode !== 'auto') {
    formData.append('language_code', languageCode);
  }

  const response = await fetch('https://api.sarvam.ai/speech-to-text', {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey },
    body: formData as any,
  });

  if (!response.ok) {
    const text = await response.text();
    return res.status(response.status).json({ error: text });
  }

  const data = await response.json() as { transcript?: string; language_code?: string };
  return res.status(200).json({
    transcript: data.transcript || '',
    language_code: data.language_code,
  });
}
