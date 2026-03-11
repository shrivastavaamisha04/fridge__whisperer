
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
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey) {
    throw new Error('Sarvam API key not configured. Add SARVAM_API_KEY to your .env.local file.');
  }

  const formData = new FormData();
  // Sarvam accepts webm, wav, mp3, ogg, flac, aac
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'saaras:v3');
  formData.append('mode', 'transcribe');
  if (languageCode && languageCode !== 'auto') {
    formData.append('language_code', languageCode);
  }

  const response = await fetch(SARVAM_STT_URL, {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return {
    transcript: data.transcript || '',
    language_code: data.language_code,
  };
}
