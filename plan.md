# Learnloop Level 1 — redesign and learning-session plan

## Product and implementation

Evolve the current React 19 + TypeScript + Vite tutor into a calmer beta product without removing the source-aware learning loop: study material → notes → explanation → quiz → mistake analysis → reteaching → follow-up → revision. Keep Supabase as the selected Auth/database/AI-hosting layer, GitHub Pages as static frontend hosting, localStorage as the offline fallback, and Manus' existing Vite AI proxy for Preview/local development.

On a genuinely new installation, initialize an empty workspace and present a dedicated “Start your journey” screen rather than seeded activity. Let the learner start by uploading a selectable-text PDF, pasting notes, or typing a question; also offer an explicit optional sample lesson. Creating a study item opens a new active study tab in the left rail. Each tab selects its own material and the associated learning context. Keep Home limited to recorded stats and recent activity; move notes, tutor, practice, revision, and material/library actions to the rail or an on-demand tool section so the study canvas stays focused.

Model study tabs as learner-visible sessions connected to their source material(s). Dragging an active tab onto another adds both to a named visual group, displayed as a compact bundle with its members available on expansion. Provide an accessible ellipsis/context menu action to split the group back into its original tabs; also accept right-click as a shortcut and provide a non-drag grouping action for keyboard/touch users. A group is visual organization, not a destructive content merge: notes, answers, and original material IDs remain separate. Persist group membership, active tab, and completion status in the existing per-user JSON workspace row; migrate older workspace JSON at load time without a destructive SQL schema change.

Keep a study tab active after a correct first answer or a completed reteach follow-up so learners can continue studying. Archive the tab only when the learner explicitly chooses “Finish this session.” Preserve its material, notes, and recorded answers in the Completed area; allow restoration. Delete-tab is a separate confirmed action that removes only the tab and preserves its learning history.

For Google sign-in, use Supabase browser OAuth through `linkIdentity({ provider: 'google', options: { redirectTo } })` when an anonymous session already exists, so linking preserves the existing `auth.uid()` workspace. Observe the restored auth session after the OAuth redirect and show whether the workspace is anonymous or linked to Google. Include documented Supabase/Google Console setup steps: Google web OAuth credentials, the Supabase callback URI, enabling Google and manual identity linking, and an exact production/site redirect allowlist. Keep OAuth Client Secret and AI provider keys in the Supabase dashboard, never browser variables or GitHub. Handle unconfigured OAuth and provider/linking errors in the UI without losing local work.

Refit the whole interface as a warm classroom notebook: paper/cream and warm white in light mode; ink/navy or charcoal paper in dark mode; cobalt or teal as the wayfinding color, with a restrained orange/rust for corrections and annotations. Use fewer surface panels, obvious whitespace, one primary action per screen, and concise human-written microcopy. Raise normal reading text to 17–18px, supporting text to at least 14px, and utility labels to at least 12px. Keep contrast strong in both modes, preserve the existing light/dark preference behavior, add visible keyboard focus, support reduced motion, and maintain usable mobile layouts. Favor real paper rules, chapter tabs, handwritten margin-like labels made with CSS, and warm type over generic AI imagery or sparkle-heavy cards.

## Project structure

- `src/App.tsx`: workspace hydration, onboarding, selected-session state, left rail, auth state, global tool navigation, and completion/group actions.
- `src/pages/JourneyStart.tsx`: concise first-run “Start your journey” intake and optional sample lesson.
- `src/pages/Dashboard.tsx`: home activity and supported metrics, without an overstuffed feature collage.
- `src/pages/Materials.tsx`: PDF/paste/question input; each saved item creates a new session tab.
- `src/pages/Notes.tsx`, `Tutor.tsx`, `Practice.tsx`, `Revision.tsx`: existing source-aware learning flow with simpler page density and session-bound callbacks.
- `src/lib/storage.ts`: empty first-run state, backward-compatible normalization, local persistence, and session IDs.
- `src/lib/cloud-state.ts`: backward-compatible JSON workspace hydration and Supabase sync.
- `src/lib/supabase.ts`: optional Supabase client, anonymous session, Google identity linking, and auth observation.
- `src/types.ts`: workspace/session lifecycle and grouping fields.
- `src/styles.css`: complete warm-notebook light/dark system, larger typography, responsive session rail, accessible menus, and onboarding.
- `supabase/migrations/`: existing per-user workspace JSONB row and RLS remain valid; no destructive migration is required for JSON-session fields. Apply a new SQL migration only if implementation proves the current table cannot support the feature.
- `supabase/functions/tutor/`: retain authenticated bounded AI gateway and server-only provider secrets.
- `README.md`, `BEGINNER_SETUP.md`, `.github/workflows/deploy-pages.yml`: explain OAuth setup, the app's callback allowlist, Supabase deployment, Pages variables, and safe source upload.

## Constraints and release assumptions

A Google provider client ID/secret and Supabase project settings are required before Google OAuth can work on the user's deployed site. The application's source will include working OAuth integration and click-by-click setup; this coding task will not invent or commit those credentials. The same is true for the AI provider key and deploying Supabase SQL/Edge Function: source/configuration can be tested here, but live Supabase services require the user's own account and secrets. Anonymous Auth continues to work before the learner links Google. A complete UI/product claim does not imply that the separate external Supabase project is configured.

The output is a beta-ready source bundle. Keep the `/AI-tutor/` GitHub Pages workflow unless the user changes their repository name, keep the required `public/manus-routes.json` synchronized, preserve the existing project modifications, build both normal and Pages-base variants, and do not put secrets into the archive.

## Design system

- **Design Movement:** Warm classroom notebook / contemporary school field journal, with the readability of a printed workbook and light hand-annotation.
- **Core Principles:** One focus at a time; generous paper-like breathing room; plain language before decoration; learner work is always retained unless they choose to delete it.
- **Color Philosophy:** Light mode feels like warm paper with ink-dark copy; dark mode is a quiet chalkboard/ink desk with warm light text. Cobalt-teal directs navigation and active states. Rust orange marks corrections or a useful snag, never every button. Both modes keep readable contrast instead of simply inverting pale colors.
- **Layout Paradigm:** Persistent, compact left rail for study tabs plus tools; one broad, calm reading canvas. The first-run view is a spacious invitation with one clear starting path, not a dashboard of cards.
- **Signature Elements:** Notebook page-rule/margin, small chapter/index tabs for sessions, and a drawn underline or orange correction mark used sparingly.
- **Interaction Philosophy:** Tabs behave like study threads: select, drag together, split from a visible menu, and move to a recoverable Completed section only when the learner chooses Finish. Confirmed tab removal preserves study content. Every action has a visible acknowledgement and a safe keyboard/touch alternative.
- **Animation:** 150–220ms ease-out for tab selection, grouping, and reveal; a short collapse/slide into Completed when a session closes. No looping decorative motion; respect `prefers-reduced-motion`.
- **Typography System:** Readable system sans for body/UI at 17–18px; sturdy system-serif display headings for warmth. Minimum 14px for secondary copy and 12px for labels; monospace only for short page/source markers.
- **Brand Essence:** “A calm study desk for getting unstuck and remembering what worked”; warm, clear, dependable.
- **Brand Voice:** Short, grounded and welcoming, with no generic hype. Examples: “Start with one page or one question.” “That thread is finished. Your notes are still here if you need them.”
- **Wordmark & Logo:** Retain the Learnloop wordmark; keep the page-tab/loop mark but recolor it as an ink outline with a cobalt page edge and a small rust annotation.
- **Signature Brand Color:** Ink-cobalt (`#315FC4` family), balanced by warm paper and sparing burnt orange.
