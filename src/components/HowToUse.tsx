import React, { useState } from 'react';
import ReactDOM from 'react-dom';

interface HowToUseProps {
  onClose: () => void;
}

export default function HowToUse({ onClose }: HowToUseProps) {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');

  const modal = (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 overflow-hidden">

        {/* Header */}
        <div className="bg-brand-500 px-6 pt-8 pb-6 text-white relative">
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-5 sm:hidden" />
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">How to use</h2>
              <p className="text-white/70 text-xs font-semibold mt-0.5">Get the most out of Fridge Whisperer</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-all flex-shrink-0 ml-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto" style={{ maxHeight: '65vh' }}>
          <div className="px-6 py-5 space-y-7">

            {/* Section 1 — Add to homescreen */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">1</span>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Add to your homescreen</h3>
              </div>
              <p className="text-xs text-slate-400 font-semibold ml-8">Use it like a native app — no App Store needed.</p>

              {/* iOS / Android toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1 ml-8">
                <button
                  onClick={() => setPlatform('ios')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide transition-all ${platform === 'ios' ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-400'}`}
                >
                  iPhone
                </button>
                <button
                  onClick={() => setPlatform('android')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide transition-all ${platform === 'android' ? 'bg-white text-brand-500 shadow-sm' : 'text-slate-400'}`}
                >
                  Android
                </button>
              </div>

              {platform === 'ios' ? (
                <ol className="ml-8 space-y-2">
                  {[
                    'Open the app in Safari (not Chrome)',
                    'Tap the Share button at the bottom of the screen',
                    'Scroll down and tap "Add to Home Screen"',
                    'Tap "Add" in the top-right corner',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-xs font-semibold text-slate-600">{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <ol className="ml-8 space-y-2">
                  {[
                    'Open the app in Chrome',
                    'Tap the three-dot menu (⋮) in the top-right',
                    'Tap "Add to Home Screen" or "Install App"',
                    'Tap "Add" to confirm',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span className="text-xs font-semibold text-slate-600">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="h-px bg-slate-100" />

            {/* Section 2 — Invite flatmates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">2</span>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Share with flatmates or family</h3>
              </div>
              <p className="text-xs text-slate-400 font-semibold ml-8">One shared fridge, everyone stays in sync.</p>
              <ol className="ml-8 space-y-2">
                {[
                  'Tap the settings icon (⚙️) in the top-right',
                  'Tap "Invite on WhatsApp" — a message with your key is ready to send',
                  'Your flatmate opens the link, enters the Household Key on the landing screen',
                  'Done — you\'re now sharing a live fridge & shopping list',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-xs font-semibold text-slate-600">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Section 3 — Enable notifications */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">3</span>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Enable notifications</h3>
              </div>
              <p className="text-xs text-slate-400 font-semibold ml-8">Get alerts before food expires and when someone updates the fridge.</p>
              <ol className="ml-8 space-y-2">
                {[
                  'Tap the settings icon (⚙️) in the top-right',
                  'Tap "Enable" under "Get Notified?"',
                  'Tap "Allow" when your browser asks for permission',
                  'You\'ll now get alerts for expiring items and household updates',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-xs font-semibold text-slate-600">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* WhatsApp share of guide */}
            <div className="pb-2">
              <button
                onClick={() => {
                  const msg = `Here's how to get started on Fridge Whisperer:\nhttps://fridge-whisperer.vercel.app/?guide=true\n\nCovers: adding the app to your homescreen, sharing the household key, and enabling notifications.`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white font-black rounded-2xl text-sm active:scale-[0.98] transition-all shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share this guide on WhatsApp
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
