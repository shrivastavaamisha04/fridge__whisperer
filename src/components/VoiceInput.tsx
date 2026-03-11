import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { transcribeAudio, INDIAN_LANGUAGES } from '../services/sarvamService';

type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

interface VoiceInputProps {
  lang: string;
  onLangChange: (lang: string) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onRelease: (transcript: string) => void;
  disabled?: boolean;
}

const ERROR_DISMISS_MS = 2500;
const MAX_RECORDING_MS = 30_000;

// iOS Safari's webkitSpeechRecognition cannot be restarted from async callbacks
// (not a user gesture) — route iOS to MediaRecorder+Sarvam instead
const isIOS = typeof window !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

const hasSpeechRecognition = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

const SpeechRecognitionAPI = hasSpeechRecognition
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

// Pick the best supported MIME type for this device.
// iOS Safari's isTypeSupported() falsely reports webm as supported but can
// only actually record audio/mp4 — so we force mp4 on iOS.
const getAudioMimeType = () => {
  if (isIOS) return 'audio/mp4';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
  for (const t of candidates) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {}
  }
  return 'audio/mp4'; // safe fallback
};

export default function VoiceInput({ lang, onLangChange, onTranscript, onRelease, disabled }: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const langBtnRef = useRef<HTMLButtonElement>(null);
  const fullTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const isHoldingRef = useRef(false);

  const currentLang = INDIAN_LANGUAGES.find(l => l.code === lang) ?? INDIAN_LANGUAGES[0];

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setState('error');
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setErrorMsg('');
      setState('idle');
    }, ERROR_DISMISS_MS);
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Web Speech API ────────────────────────────────────────────────────────
  const startWithSpeechAPI = useCallback(() => {
    // Force-kill any lingering recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    // Transcripts are cleared in handlePointerDown (not here) so restarts accumulate text

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      // If user already released before recognition started, abort immediately
      if (!isHoldingRef.current) {
        try { recognition.abort(); } catch {}
        return;
      }
      maxTimerRef.current = setTimeout(stopRecording, MAX_RECORDING_MS);
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          fullTranscriptRef.current += t + ' ';
        } else {
          interimText += t;
        }
      }
      interimTranscriptRef.current = interimText;
      const display = (fullTranscriptRef.current + interimText).trim();
      if (display) onTranscript(display, false);
    };

    recognition.onerror = (event: any) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      if (event.error === 'not-allowed') showError('Mic access denied');
      else if (event.error === 'no-speech') setState('idle'); // silent reset for quick taps
      else if (event.error !== 'aborted') showError('Could not transcribe');
      else setState('idle');
    };

    recognition.onend = () => {
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      recognitionRef.current = null;

      // Mobile workaround: continuous mode fires onend after brief silence.
      // If user is still holding, restart recognition to keep recording.
      if (isHoldingRef.current) {
        setTimeout(() => {
          if (isHoldingRef.current) startWithSpeechAPI(); // restart, accumulated text preserved
        }, 100);
        return;
      }

      // User released — fire onRelease with everything captured
      if (timerRef.current) clearInterval(timerRef.current);
      const final = (fullTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();
      if (final) onRelease(final);
      fullTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      setState('idle');
    };

    try {
      recognition.start();
    } catch {
      showError('Could not start mic');
    }
  }, [lang, onTranscript, onRelease, stopRecording, showError]);

  // ── Sarvam fallback ───────────────────────────────────────────────────────
  const startWithSarvam = useCallback(async () => {
    setElapsed(0);
    audioChunksRef.current = [];
    fullTranscriptRef.current = '';

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      showError('Mic access denied');
      return;
    }

    const mimeType = getAudioMimeType();

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setState('processing');
      try {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const result = await transcribeAudio(blob, lang);
        const text = result.transcript.trim();
        if (text) {
          onRelease(text);
          setState('idle');
        } else {
          showError('Nothing heard — try again');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[VoiceInput] transcribe error:', msg);
        if (msg.toLowerCase().includes('api') || msg.includes('500') || msg.includes('key')) {
          showError('Sarvam API not configured');
        } else if (msg.includes('413')) {
          showError('Recording too long — try shorter');
        } else {
          showError('Could not transcribe');
        }
      }
    };

    recorder.start(250);
    maxTimerRef.current = setTimeout(stopRecording, MAX_RECORDING_MS);
  }, [lang, onRelease, stopRecording, showError]);

  // ── Hold-to-speak handlers ────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || state === 'processing' || state === 'recording') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isHoldingRef.current = true;
    fullTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    // Immediate visual feedback — don't wait for recognition.onstart (async)
    setState('recording');
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    setShowLangMenu(false);
    // iOS: skip webkitSpeechRecognition (can't restart from async callbacks)
    if (hasSpeechRecognition && !isIOS) startWithSpeechAPI();
    else startWithSarvam();
  };

  const handlePointerUp = () => {
    isHoldingRef.current = false;
    // Always call stop — don't rely on stale `state` value (race condition)
    stopRecording();
  };

  const handleLangBtnClick = () => {
    if (state === 'recording' || state === 'processing') return;
    if (langBtnRef.current) {
      const rect = langBtnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 196),
      });
    }
    setShowLangMenu(v => !v);
  };

  const handleLangSelect = (code: string) => {
    onLangChange(code);
    setShowLangMenu(false);
  };

  // Close lang menu on outside click
  useEffect(() => {
    if (!showLangMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-lang-menu]')) setShowLangMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLangMenu]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Language picker portal ────────────────────────────────────────────────
  const langMenuPortal = showLangMenu ? ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 z-[190]" onClick={() => setShowLangMenu(false)} />
      <div
        data-lang-menu
        className="fixed z-[200] bg-white rounded-2xl shadow-2xl border border-slate-100 w-48 animate-in fade-in zoom-in-95 duration-150"
        style={{ top: menuPos.top, left: menuPos.left, maxHeight: '55vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Language</span>
          <button
            onClick={() => setShowLangMenu(false)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-1.5 space-y-0.5">
          {INDIAN_LANGUAGES.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleLangSelect(l.code)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                ${lang === l.code ? 'bg-brand-500 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              <span className="w-4 text-center font-black text-sm flex-shrink-0">{l.script}</span>
              <span className="text-xs font-bold flex-1">{l.label}</span>
              {lang === l.code && (
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      {/* Toasts */}
      {state === 'error' && errorMsg && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[200] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200" style={{ whiteSpace: 'nowrap', top: 'calc(env(safe-area-inset-top, 16px) + 52px)' }}>
          <span className="bg-slate-800/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl">
            ⚠️ {errorMsg}
          </span>
        </div>
      )}
      {state === 'recording' && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[200] pointer-events-none animate-in fade-in duration-200" style={{ whiteSpace: 'nowrap', top: 'calc(env(safe-area-inset-top, 16px) + 52px)' }}>
          <span className="bg-rose-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {formatTime(elapsed)} · hold to speak, release to add
          </span>
        </div>
      )}

      {langMenuPortal}

      {/* Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Globe / language button */}
        <button
          ref={langBtnRef}
          type="button"
          data-lang-menu
          onClick={handleLangBtnClick}
          disabled={state === 'recording' || state === 'processing'}
          className={`flex flex-col items-center justify-center w-11 h-11 rounded-2xl border transition-all
            ${state === 'recording' || state === 'processing'
              ? 'opacity-30 cursor-default bg-slate-50 border-slate-100'
              : showLangMenu
              ? 'bg-brand-50 border-brand-200 text-brand-500'
              : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-500 active:scale-95'}`}
          title="Select language"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="text-[8px] font-black leading-none mt-0.5 text-brand-500">
            {currentLang.script}
          </span>
        </button>

        {/* Mic button — hold to speak */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          disabled={state === 'processing' || disabled}
          title={state === 'recording' ? 'Release to add' : 'Hold to speak'}
          style={{ touchAction: 'none' }}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 select-none
            ${state === 'recording'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-125'
              : state === 'processing'
              ? 'bg-slate-100 text-slate-400 cursor-wait'
              : 'bg-slate-50 text-slate-400 hover:bg-brand-50 hover:text-brand-500 active:scale-95'}`}
        >
          {state === 'recording' && (
            <span className="absolute inset-0 rounded-2xl bg-rose-400 animate-ping opacity-25 pointer-events-none" />
          )}
          {state === 'processing' ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 100 16v-2a6 6 0 010-12z" />
            </svg>
          ) : state === 'recording' ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0014 0" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="9" y1="22" x2="15" y2="22" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
