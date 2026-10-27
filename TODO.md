# TODO — Learnloop Level 1 Beta

## Study-material intake and source-aware notes
- [x] Study-material intake supports PDF uploads, pasted text, and directly typed questions, with readable text extraction and source references where available. It also accepts `.txt`, validates file types and a 15 MB file limit, and reports empty, unreadable, and scanned/no-selectable-text PDFs instead of pretending extraction succeeded. PDF page references and source snippets are retained where possible. OCR, photographed pages, and slide files are not implemented in this build.
- [x] Structured note generation organizes content into concepts, definitions, formulas or key facts, examples, summaries, important distinctions, and common confusion points; source citations are included where available, and the tutor is instructed to say when the supplied source is insufficient.

## Concept tutor and quiz practice
- [x] Student-friendly concept tutoring provides clear explanations, step-by-step reasoning, worked examples, follow-up questions, and source-aware answers tied back to supplied material where possible; additional general context is distinguished from source-supported facts.
- [x] Multiple-choice quizzes provide four plausible answer choices based on the selected study material, notes, or topic; the answer key stays hidden until the student responds.
- [x] Immediate quiz feedback records the answer and shows correctness, the right answer, and a clear explanation for each response.

## Mistake diagnosis and targeted reteaching
- [x] Mistake analysis considers the question, expected answer, selected answer, and optional student reasoning; it presents possible misconceptions as hypotheses, caps displayed confidence at medium, avoids claiming certainty about the student's thinking, and explains errors without blame or shame.
- [x] Weak concepts are retaught using a different framing or example from the original explanation.
- [x] A follow-up assessment tests the same underlying concept and problem-solving skill with a new question after reteaching. Its result is recorded and used to show whether understanding improved and whether the topic remains on the revision list.

## Revision and learning-history dashboard
- [x] Revision recommendations derive only from recorded sessions, quiz results, mistakes, follow-up performance, and identified weak topics; note-based flashcards and short revision practice are available.
- [x] A responsive student dashboard shows recent sessions, saved study materials, generated-note status, recorded question history, weak topics, follow-up performance, and revision recommendations. Counts and history reflect the demo or student's recorded activity; no invented mastery score or streak is shown.
- [x] Materials, notes, sessions, answers, and follow-up performance persist in the current browser's local storage, with a reset control to restore the clearly labelled sample workspace.
- [x] Navigation clearly supports the full learning loop: study material → notes → concept explanation → quiz → mistake analysis → targeted reteaching → follow-up question → revision.

## Existing appearance and GitHub Pages behavior
- [x] Provide an accessible light/dark mode toggle in the application chrome, apply the selected palette throughout every screen, respect the operating-system preference until the student makes a choice, and persist an explicit choice across reloads.
- [x] Build the Vite frontend with the repository-specific `/AI-tutor/` asset base and provide a GitHub Actions workflow that deploys the compiled `dist` directory to Pages; static hosting does not provide the AI API, so explain that limit clearly in the interface and setup guide.

## Existing Supabase workspace and secure AI
- [ ] With `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` configured, create/restore an anonymous Supabase Auth session and synchronize the student's materials, notes, quiz attempts, sessions, and active material to a per-user Postgres workspace row. Keep localStorage as an offline fallback, hydrate an existing remote row, seed a missing remote row from existing browser state, and expose sync/local-only status. Explain that anonymous identity cannot be recovered across cleared browser storage or another device without linking a real sign-in method. Source implementation is included; live behavior awaits configuration in the user's Supabase project.
- [x] Restrict workspace access with Postgres Row Level Security so each authenticated user can only select, insert, or update their own `auth.uid()` row; do not ship a service-role key to the browser. The checked-in migration enforces per-user policies and the frontend contains no service-role credential.
- [ ] Route note/tutor/quiz/mistake-analysis generation through an authenticated Supabase Edge Function that verifies the user's JWT, validates the four supported task shapes and bounded request size, enforces a per-user daily request quota, calls an OpenAI-compatible provider, and reads its API key only from server-side Supabase function secrets. Keep the current Vite middleware as the Manus Preview/local fallback when Supabase is not configured. Edge Function source is included; deployment and live requests await user-side secrets/project setup.

## Level 1 first-run journey
- [x] When a visitor has no prior workspace or study material, show a focused “Start your journey” screen instead of a pre-filled demo dashboard. Offer clear paths to upload a PDF, paste notes/text, or type a question; offer a sample lesson only as an explicit optional choice. After a real or sample material is created, take the learner into its new study session.
- [x] Keep first-run instructions brief, make the next action obvious, explain in plain language that work is saved locally or to Supabase depending on connection, and avoid displaying fabricated stats or activity for a new learner.

## Left-side study tabs, tools, groups, and lifecycle
- [x] Show each newly created study session as an active, selectable tab in a persistent left-side rail, visually similar to a familiar chat/session list. Each tab opens the correct material and its own notes/tutor/practice context instead of changing a single global active material without a clear indication.
- [x] Keep Home for recorded learner stats and recent activity. Move Notes, Tutor, Practice, Revision, and the study-material/library actions into a clearly separated sidebar/tools area so those secondary controls do not compete with the active study canvas.
- [x] Let learners drag one active study tab onto another to group/merge two or more tabs. Show grouped membership clearly and retain each original material and learning history separately; grouping is organization, not destructive merging.
- [x] Let a learner split/un-group tabs by right-clicking a tab or opening its visible three-dot menu. Provide an equivalent labeled keyboard/touch-accessible control; do not require drag or context-click to operate grouping.
- [x] When a learner completes a first practice check correctly, or after an incorrect response completes its reteach and same-concept follow-up check, automatically remove that session tab from Active and move it to a Completed/archive area. Preserve its material, notes, and answer history; show where it went, permit reopening/restoring, and keep permanent deletion separate and explicit. Provide a clear Finish session action for learners who want to finish before the practice sequence.

## Google sign-in and account-safe workspace retention
- [ ] Add a functional “Continue with Google” action through Supabase Auth for the GitHub Pages app. If the learner is using an anonymous Supabase session, link the Google identity to that same user so existing `auth.uid()` workspace data is retained; after OAuth returns, show the linked account status. Provide readable error handling when Google Auth or linking is not configured.
- [x] Document the exact Google Cloud and Supabase setup: create a Web OAuth client; add the app origin as an authorized JavaScript origin; add the Supabase `/auth/v1/callback` as an authorized redirect URI in Google; configure Google Client ID/Secret in Supabase Auth; enable manual identity linking if the chosen link flow requires it; set the app URL as Supabase Site URL and allow the exact GitHub Pages `/AI-tutor/` redirect. Keep Google client secrets, Supabase secret keys, and AI provider keys out of browser builds and GitHub source.
- [ ] Make anonymous/local-to-Google behavior clear: distinguish anonymous browser work from Google-linked cloud work, preserve the current workspace during identity linking, never silently overwrite one learner's data with another account's workspace, and explain that local-only data is not cloud-recoverable until Supabase sync succeeds.

## Warm classroom notebook UI and accessibility
- [x] Replace the current compact, AI-generic dashboard presentation with a calm warm classroom notebook identity, using a considered light/dark palette that suits the existing brand and black/blue/orange direction; keep light and dark modes similarly high-contrast.
- [x] Reduce simultaneous competing cards and long explanatory copy; preserve stats and recent activity on Home but make the primary next action visually dominant. Raise main reading text to approximately 17–18 px, supporting text to at least 14 px, and small utility labels to at least 12 px. Maintain readable line lengths, spacing, responsive behavior, visible keyboard focus, reduced-motion support, and accessible alternatives for drag/context-menu actions.

## Portable GitHub + Supabase beta handoff
- [x] Include a safe `.env.example`, secret-safe `.gitignore`, Supabase CLI configuration, database migration, authenticated Edge Function source, Pages workflow with the `/AI-tutor/` base path and public Supabase build variables, and a complete README with step-by-step GitHub Pages/Supabase setup and the anonymous-account/API-key limitations.
- [x] Update the beginner guide and source bundle to include Google OAuth setup and the Level 1 beta behavior, then produce a validated archive that contains all updated hidden workflows/backend/config files and excludes `node_modules`, build output, private keys, and actual user secrets.
