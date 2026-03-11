
const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';

export interface SarvamSTTResponse {
  transcript: string;
  language_code?: string;
}

export const INDIAN_LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi',     script: 'हि' },
  { code: 'ta-IN', label: 'Tamil',     script: 'த' },
  { code: 'te-IN', label: 'Telugu',    script: 'తె' },
  { code: 'bn-IN', label: 'Bengali',   script: 'বা' },
  { code: 'mr-IN', label: 'Marathi',   script: 'म' },
  { code: 'gu-IN', label: 'Gujarati',  script: 'ગ' },
  { code: 'kn-IN', label: 'Kannada',   script: 'ಕ' },
  { code: 'ml-IN', label: 'Malayalam', script: 'മ' },
  { code: 'pa-IN', label: 'Punjabi',   script: 'ਪ' },
  { code: 'od-IN', label: 'Odia',      script: 'ଓ' },
];

export async function transcribeAudio(
  audioBlob: Blob,
  languageCode: string = 'auto'
): Promise<SarvamSTTResponse> {
  // Convert blob to base64 — sent to our serverless proxy which holds the API key
  const buffer = await audioBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  // Process in chunks to avoid stack overflow on large files
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio: base64,
      mimeType: audioBlob.type || 'audio/webm',
      languageCode,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || `API error ${response.status}`);
  }

  const data = await response.json();
  return {
    transcript: data.transcript || '',
    language_code: data.language_code,
  };
}
