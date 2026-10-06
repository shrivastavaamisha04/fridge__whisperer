# The Fridge Whisperer

A React + TypeScript PWA for Indian households to manage shared fridge inventory and a shopping list, with multilingual voice input and real-time flatmate sync.

- **Live**: https://fridge-whisperer.vercel.app (Vercel project `fridge-whisperer`, auto-deploys from GitHub `main`)
- **Repo**: https://github.com/shrivastavaamisha04/fridge__whisperer (**public**, so never commit keys)

## Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 3, Vite
- **Database**: Supabase (real-time Postgres — `fridge_items`, `shopping_items`, `household_members`)
- **AI**: Gemini `gemini-3.1-flash-lite` for food shelf-life lookup + multilingual item parsing, called only through the `api/gemini.ts` serverless proxy (the `@google/genai` package is no longer used client-side)
- **Voice**: Web Speech API (non-iOS) / Sarvam AI STT (iOS fallback via `/api/transcribe` Vercel serverless)
- **Deployment**: Vercel (`api/` directory = serverless functions)
- **PWA**: `manifest.json` + `sw.js` service worker

## Project Structure

```
src/
  App.tsx                    # Root — landing + dashboard views, all state
  types.ts                   # FridgeItem, ShoppingItem, ConfirmItem, etc.
  constants.ts               # FALLBACK_FOOD_DATA (common foods in EN + Indian scripts)
  services/
    geminiService.ts         # getFoodInfo, parseItemList, parseShoppingItems (all via generate() → POST /api/gemini)
    supabaseService.ts       # All DB operations + real-time subscribe
    sarvamService.ts         # Audio → /api/transcribe proxy call
    storageService.ts        # localStorage fallback (legacy, not wired up)
  components/
    FridgeCard.tsx           # Single fridge item — expiry bar, bilingual name, qty picker
    VoiceInput.tsx           # Full mic component (language picker + hold-to-speak)
    HoldMicButton.tsx        # Simpler mic for shopping list (no language picker)
    VoiceConfirmSheet.tsx    # Review/edit parsed voice items before adding
    HowToUse.tsx             # Onboarding modal (PWA install + flatmate invite + notifs)
api/
  gemini.ts                  # Vercel serverless: holds GEMINI_API_KEY, pins model, caps input, retries 503 once
  transcribe.ts              # Vercel serverless — proxies audio to Sarvam AI STT
```

## Key Concepts

- **Household ID**: shared code that scopes all Supabase data; shared via WhatsApp
- **Voice flow**: hold mic → transcribe → Gemini parses items → VoiceConfirmSheet review → Supabase insert
- **Bilingual display**: `localName`/`localLang` on FridgeItem; shows local script as primary if viewer's language matches
- **iOS routing**: Web Speech API can't restart from async callbacks on iOS — always routes to Sarvam there
- **selfInsertedIds ref**: suppresses real-time notifications for your own inserts
- **Gemini proxy contract**: client sends `{ prompt, json?, schema? }` and gets `{ text }`. Errors come back as `{ error: { message } }` with Gemini's status. `generate()` throws on non-2xx so each caller's `catch` falls back (split-by-commas parsing, `FALLBACK_FOOD_DATA`, default 5-day shelf life). Proxy limits: 8,000-char prompt, 2,048 output tokens.
- **JSON clean-up**: `stripFences()` removes any run of backticks at either end; the model sometimes appends two stray backticks after its JSON.

## Environment Variables (`.env.local`, gitignored; same names in Vercel)

```
GEMINI_API_KEY=...         # Gemini key (server-side only, used by api/gemini.ts; never VITE_-prefixed)
VITE_SUPABASE_URL=...      # Supabase project URL (public by design)
VITE_SUPABASE_KEY=...      # Supabase anon key (public by design)
SARVAM_API_KEY=...         # Sarvam STT key (server-side only, used by api/transcribe.ts)
```

Never add a `VITE_`-prefixed Gemini/Sarvam key or a `define` for one in `vite.config.ts`: that bundles it into public JS. In Vercel, `GEMINI_API_KEY` is set for Production + Preview; the old `VITE_API_KEY` was deleted.

## Dev

```bash
npm install
npm run dev      # runs on localhost:3000 (vite.config serves api/*.ts locally too, using .env.local)
npm run build
npm run lint     # tsc --noEmit; 19 pre-existing errors, all Supabase typing in supabaseService.ts (build still succeeds)
```

## Gotchas

- **Model choice**: Google retired `gemini-2.0-flash` (404). Thinking models (`gemini-3.5/3.7/3.8-flash`) are slow (15–100s), so stay on a non-thinking Flash-Lite model for snappy voice-add.
- **Gemini 503 "high demand"** spikes are common; the proxy retries once after 800ms, then callers fall back.
- **Bundle strings that look like app code but aren't**: `/api/broadcast` comes from Supabase realtime-js and `gemini-embedding-001` from the `@google/genai` library. Neither is a missing app feature.
- **Desktop is iCloud-synced**: many `node_modules` files are cloud-only ("dataless"), so builds, `tsc` and big greps here can hang for many minutes. For verification, copy the project without `node_modules` to a temp dir and `npm ci` there, or mark the folder "Keep Downloaded" in Finder.

## Status (2026-10-06)

- Gemini moved server-side and model switched to `gemini-3.1-flash-lite`: commit `cd624af`, deployed and verified live (`/api/gemini` answers; no key in the JS bundle; `/api/transcribe` still works).
- **Supabase is down**: project `lngvijyxgnjrwowaxijj` no longer resolves (deleted or paused), so fridge list, shopping list, household sharing and realtime sync don't work. Restore it, or create a new project with the 3 tables and update `VITE_SUPABASE_URL`/`VITE_SUPABASE_KEY` in Vercel + `.env.local`.
- **To do**: rotate the Gemini key (the old one was publicly visible in the pre-proxy bundle). Optionally re-save `SARVAM_API_KEY` as a Secret in Vercel (dashboard flags it "Needs Attention"). Redeploy after changing either.
- This `CLAUDE.md` is untracked (not committed).

## Brand

- Brand color: `#10b981` (emerald-500) — referenced as `brand-500` throughout
- Font: Plus Jakarta Sans
- Design style: rounded cards, soft shadows, mobile-first

## Planned: Swiggy MCP Integration

Adding Swiggy's MCP (https://mcp.swiggy.com/builders/) to connect the app to Swiggy Instamart — enabling direct grocery ordering from the shopping list and expiry-triggered reorders. Integration will be proxied through a new Vercel serverless function (`api/swiggy.ts`) to keep API keys server-side, with Gemini as the MCP orchestrator.
