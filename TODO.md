# TODO — AI Tutor Level 0 Prototype

## Study-material intake and source-aware notes
- [x] Study-material intake supports PDF uploads, pasted text, and directly typed questions, with readable text extraction and source references where available. It also accepts `.txt`, validates file types and a 15 MB file limit, and reports empty, unreadable, and scanned/no-selectable-text PDFs instead of pretending extraction succeeded. PDF page references and source snippets are retained where possible. OCR, photographed pages, and slide files are not implemented in this Level 0 build.
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

## Appearance preferences
- [x] Provide an accessible light/dark mode toggle in the application chrome, apply the selected palette throughout every screen, respect the operating-system preference until the student makes a choice, and persist an explicit choice across reloads.

## GitHub Pages deployment
- [x] Build the Vite frontend with the repository-specific `/AI-tutor/` asset base and provide a GitHub Actions workflow that deploys the compiled `dist` directory to Pages; static hosting does not provide the AI API, so explain that limit clearly in the interface and setup guide.

## Supabase backend and secure AI
- [ ] With `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` configured, create/restore an anonymous Supabase Auth session and synchronize the student's materials, notes, quiz attempts, sessions, and active material to a per-user Postgres workspace row. Keep localStorage as an offline fallback, hydrate an existing remote row, seed a missing remote row from existing browser state, and expose sync/local-only status. Explain that anonymous identity cannot be recovered across cleared browser storage or another device without linking a real sign-in method. Source implementation is included; live behavior awaits configuration in the user's Supabase project.
- [x] Restrict workspace access with Postgres Row Level Security so each authenticated user can only select, insert, or update their own `auth.uid()` row; do not ship a service-role key to the browser. The checked-in migration enforces per-user policies and the frontend contains no service-role credential.
- [ ] Route note/tutor/quiz/mistake-analysis generation through an authenticated Supabase Edge Function that verifies the user's JWT, validates the four supported task shapes and bounded request size, enforces a per-user daily request quota, calls an OpenAI-compatible provider, and reads its API key only from server-side Supabase function secrets. Keep the current Vite middleware as the Manus Preview/local fallback when Supabase is not configured. Edge Function source is included; deployment and live requests await user-side secrets/project setup.

## Distinctive responsive interaction design
- [x] Replace the green-first generic dashboard style with a distinctive high-contrast black/white/electric-blue/burnt-orange editorial study-journal design; provide dark mode and a matching light mode with similarly strong text contrast.
- [x] Make the interface feel human-authored and more interactive through specific microcopy, distinctive branded motifs, clear loading/save/sync/error/answer feedback, keyboard focus states, restrained transitions, reduced-motion support, and responsive layouts; preserve the study-material intake, notes, concept tutor, quiz/mistake/reteach/follow-up, and revision paths.

## Portable GitHub + Supabase handoff
- [x] Include a safe `.env.example`, secret-safe `.gitignore`, Supabase CLI configuration, database migration, authenticated Edge Function source, Pages workflow with the `/AI-tutor/` base path and public Supabase build variables, and a complete README with step-by-step GitHub Pages/Supabase setup and the anonymous-account/API-key limitations.
- [x] Provide the complete updated source and configuration as a validated archive without `node_modules`, build output, private keys, or the user's secrets.
