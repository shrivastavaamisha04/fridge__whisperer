import React, { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../services/sarvamService';

type MicState = 'idle' | 'recording' | 'processing' | 'error';

interface HoldMicButtonProps {
  lang: string;
  onRelease: (transcript: string) => void;
  disabled?: boolean;
}

const hasSpeechRecognition = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
const SpeechRecognitionAPI = hasSpeechRecognition
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

const MAX_MS = 30_000;

export default function HoldMicButton({ lang, onRelease, disabled }: HoldMicButtonProps) {
  const [state, setState] = useState<MicState>('idle');
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const isHoldingRef = useRef(false);

  const stop = useCallback(() => {
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startSpeechAPI = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    fullTranscriptRef.current = '';
    interimTranscriptRef.current = '';

    const r = new SpeechRecognitionAPI();
    recognitionRef.current = r;
    r.lang = lang;
    r.interimResults = true;
    r.continuous = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      // If user already released before recognition started, abort immediately
      if (!isHoldingRef.current) {
        try { r.abort(); } catch {}
        return;
      }
      maxTimerRef.current = setTimeout(stop, MAX_MS);
    };

    r.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) fullTranscriptRef.current += t + ' ';
        else interim += t;
      }
      interimTranscriptRef.current = interim;
    };

    r.onerror = (event: any) => {
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      // Silently reset for no-speech/aborted (quick taps), show nothing
      if (event.error === 'not-allowed') setState('error');
      else setState('idle');
      setTimeout(() => setState('idle'), event.error === 'not-allowed' ? 2000 : 0);
    };

    r.onend = () => {
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
      const final = (fullTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();
      if (final) onRelease(final);
      fullTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      setState('idle');
      recognitionRef.current = null;
    };

    try { r.start(); } catch { setState('idle'); }
  }, [lang, onRelease, stop]);

  const startSarvam = useCallback(async () => {
    audioChunksRef.current = [];
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setState('idle'); return; }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setState('processing');
      try {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const result = await transcribeAudio(blob, lang);
        const text = result.transcript.trim();
        if (text) onRelease(text);
      } catch {}
      setState('idle');
    };

    recorder.start(250);
    maxTimerRef.current = setTimeout(stop, MAX_MS);
  }, [lang, onRelease, stop]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || state !== 'idle') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isHoldingRef.current = true;
    // Immediate visual feedback
    setState('recording');
    if (hasSpeechRecognition) startSpeechAPI();
    else startSarvam();
  };

  const handlePointerUp = () => {
    isHoldingRef.current = false;
    // Always call stop — don't check stale state
    stop();
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      disabled={disabled || state === 'processing'}
      title={state === 'recording' ? 'Release to add' : 'Hold to speak'}
      style={{ touchAction: 'none' }}
      className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all select-none flex-shrink-0
        ${state === 'recording'
          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-125'
          : state === 'processing'
          ? 'bg-slate-100 text-slate-300 cursor-wait'
          : state === 'error'
          ? 'bg-rose-50 text-rose-400'
          : 'bg-slate-100 text-slate-400 hover:bg-brand-50 hover:text-brand-500 active:scale-95'}`}
    >
      {state === 'recording' && (
        <span className="absolute inset-0 rounded-2xl bg-rose-400 animate-ping opacity-25 pointer-events-none" />
      )}
      {state === 'processing' ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 100 16v-2a6 6 0 010-12z" />
        </svg>
      ) : state === 'recording' ? (
        // Stop icon when recording
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        // Mic icon when idle/error
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0014 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      )}
    </button>
  );
}
