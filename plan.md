# Learnloop — Supabase-backed redesign plan

## Product and implementation

Preserve the current React 19 + TypeScript + Vite application and its core loop: material → notes → explanation → quiz → mistake analysis → reteaching → follow-up → revision. Replace the current green, generic dashboard look with an editorial “study field-notes” identity built from inky black, paper white, confident cobalt, and a small amount of burnt orange. Keep a genuinely light counterpart with near-black type and similarly legible contrast. Make the interface feel authored through distinctive copy, handwritten-style marginal labels made with CSS, varied card proportions, responsive layouts, clear progress states, keyboard-visible focus, and short feedback animations—not stock AI imagery or a generic chatbot layout.

Add `@supabase/supabase-js` as a browser-safe client dependency. With `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, create a Supabase anonymous session, load and autosave the student's workspace in one owner-scoped JSONB row, and show whether the workspace is syncing or local-only. Keep the existing localStorage data as an offline fallback and seed a newly created remote workspace from that local state. Explain that anonymous accounts are tied to their browser session and cannot be recovered after clearing it unless a sign-in identity is added later.

Move production AI calls from the development-only Vite middleware to an authenticated Supabase Edge Function. The function validates user JWTs, accepts only the existing four actions (`notes`, `tutor`, `quiz`, `diagnose`), applies an atomic per-user daily request quota, and reads an OpenAI-compatible API key only from Supabase Edge Function secrets. The client sends no secret. Keep the Vite middleware as the Manus Preview/local fallback when Supabase environment variables are absent.

Ship a PostgreSQL migration with strict `auth.uid()` row ownership, a Supabase CLI function configuration that keeps JWT verification enabled, `.env.example`, `.gitignore` secret protection, a GitHub Pages workflow that builds with the repo subpath and public Supabase values, and a step-by-step README for Supabase and GitHub setup. Do not commit real project IDs, keys, or provider secrets.

## Project structure

- `src/`: existing responsive React application and learning-flow pages.
- `src/lib/supabase.ts`: optional browser Supabase client and anonymous identity setup.
- `src/lib/cloud-state.ts`: per-user state hydrate/save and sync status.
- `src/lib/ai.ts`: invoke the protected Edge Function when configured, otherwise use the current local/Manus Vite proxy.
- `supabase/config.toml`: CLI project defaults and JWT enforcement.
- `supabase/migrations/`: workspace row, RLS, private usage counter, and safe quota RPC.
- `supabase/functions/tutor/`: authenticated, bounded AI gateway; provider secrets remain server-side.
- `.github/workflows/deploy-pages.yml`: GitHub Pages static build using `/AI-tutor/` and repo-configured public Supabase variables.
- `.env.example`, `README.md`, and `docs/implementation-references.md`: safe environment template, deployment steps, and official references.

## Design system

- **Design Movement:** Contemporary editorial field-notes / Swiss-inspired study journal, with the high-contrast utility of a print workbook and the energy of a music-zine margin.
- **Core Principles:** Content first; loud hierarchy, quiet surfaces; personality in concise human copy; every action acknowledges what the learner just did.
- **Color Philosophy:** Dark mode uses near-black ink, cool white text, cobalt as an active learning signal, and sparing orange for attention or correction. Light mode reverses the field to paper white and charcoal while retaining cobalt/orange accents and strong text contrast.
- **Layout Paradigm:** A compact working sidebar plus a wide, asymmetrical learning canvas. Use a few deliberately offset panels and timeline-like learning steps rather than uniform center-aligned dashboard tiles.
- **Signature Elements:** A cobalt “margin line” and chapter-number markers; orange annotation tabs for useful friction/mistakes; a restrained grain/rule treatment that suggests paper without image assets.
- **Interaction Philosophy:** Immediate visual acknowledgment on tab changes, answers, save/sync status, and flashcard reveal; small menus/chips remain keyboard accessible; motion never hides state.
- **Animation:** 150–240 ms ease-out transitions for hover/focus and reveal; brief slide/fade only on new feedback; respect `prefers-reduced-motion`; no looping decorative motion.
- **Typography System:** A readable system sans for UI and a strong system-serif display face for selected editorial headings; monospace only for tiny source/page annotations. Keep body text calm and readable.
- **Brand Essence:** “A study desk that remembers what tripped you up”; focused, candid, encouraging.
- **Brand Voice:** Short and human, never motivational filler. Examples: “Let’s make the tricky bit less slippery.” “Good catch. Want another shot at the same idea?”
- **Wordmark & Logo:** Keep the Learnloop wordmark, redraw the mark as a cobalt page tab crossing an ink-black loop; no default chatbot sparkle icon.
- **Signature Brand Color:** Electric cobalt blue (`#356BFF` family), balanced by paper-white and a restrained burnt orange.

## Constraints

Supabase is the database/auth/Edge hosting layer; GitHub Pages remains a static frontend host. Anonymous Auth supports per-browser persistence, not account recovery or cross-device identity. Live AI requires the user to provide a provider key as a Supabase Edge Function secret; it must never be set as a `VITE_*` variable. The current Manus Preview still supports the existing Vite AI proxy and localStorage fallback. The Supabase function and SQL cannot be applied to the user's Supabase account from this file-only handoff; the README will give the CLI steps.
