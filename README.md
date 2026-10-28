# Learnloop — a study desk that remembers what tripped you up

Learnloop turns your own material into source-aware notes, patient explanations, practice, misconception-aware reteaching, follow-up checks, and revision. Google sign-in is required before the study workspace opens. After sign-in, the Level 1 beta starts with a clean “Start your journey” screen and keeps one study thread per source in a left rail.

## What is in this beta

- Start from a selectable-text PDF, pasted notes, or one typed question; an optional sample lesson is clearly marked and never mixed into a new learner's blank workspace.
- Each new source opens its own study tab. Drag tabs together or group them from the three-dot menu; split them through the menu or right-click. Grouping is organizational: sources and answer history stay separate.
- A focused study thread offers notes, tutor, and practice as separate next steps. Home stays focused on real recorded stats and recent work.
- A study tab stays active after a correct answer or reteach follow-up. The learner chooses **Finish this session** when ready; the completed tab, source, notes and answer history remain available for restoration.
- Structured notes, concept tutoring, four-choice quizzes, cautious mistake hypotheses, alternate reteaching examples, follow-up questions, revision recommendations, and note-based flashcards.
- A warm classroom-notebook visual system with readable type and accessible light/dark modes.
- Supabase temporary anonymous Auth for preserving browser work during sign-in, Google-required access, per-user Postgres workspaces and row-level security, a server-only AI Edge Function, and a daily quota.
- A GitHub Actions workflow for static GitHub Pages at `/AI-tutor/`.

## 1. Create and configure Supabase

1. Create a Supabase project. In **Project Settings → API Keys**, copy the **Project URL** and **Publishable key** (`sb_publishable_…`). These are browser-safe values. Never use a Supabase Secret or `service_role` key in the website.
2. In **Authentication → Sign In / Providers**, enable **Anonymous Sign-Ins**. This temporary session preserves a private browser workspace while the learner links Google; it does not unlock Learnloop.
3. Apply the included migration and deploy the function, using the Supabase CLI:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push --dry-run
   supabase db push
   ```

   `YOUR_PROJECT_REF` is the part before `.supabase.co` in the project URL. The migration creates the per-user workspace table, RLS policies, and server-side daily quota counter.
4. In **Edge Functions → Secrets**, add `OPENAI_API_KEY` with your compatible provider's key. Optionally add `OPENAI_MODEL` (defaults to `gpt-4o-mini`) or `OPENAI_BASE_URL` (defaults to `https://api.openai.com/v1`). Provider use may have limits or charges. Deploy the function:

   ```bash
   supabase functions deploy tutor
   ```

   The included `supabase/config.toml` keeps JWT verification enabled. Keep the AI key in Supabase Edge Function Secrets only.

## 2. Set up required Google sign-in

Google sign-in links the current anonymous Supabase user rather than copying workspace rows to a new user. This keeps the same `auth.uid()` and its RLS-owned workspace.

1. In Google Cloud Console, create/select a project and configure the OAuth consent screen. Create an OAuth Client ID of type **Web application**.
2. Add your website origin as an **Authorized JavaScript origin**, for example `https://YOUR_GITHUB_USERNAME.github.io` (no `/AI-tutor/` path).
3. Add the Supabase OAuth callback URL as an **Authorized redirect URI**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
4. In Supabase **Authentication → Sign In / Providers → Google**, enable Google and paste the Google **Client ID** and **Client Secret**. If offered, enable manual identity linking. Never put the Google Client Secret in this repository or a `VITE_*` variable.
5. In Supabase **Authentication → URL Configuration**, set **Site URL** to `https://YOUR_GITHUB_USERNAME.github.io/AI-tutor/`. Add that exact URL to the allowed redirect URLs. For local development, optionally allow `http://localhost:5173/` too.
6. If Google's consent screen is in **Testing**, add the intended test accounts as test users. For wider release, complete Google's verification/consent requirements for the scopes you request.

The app stays at the sign-in screen until Google authentication succeeds. **Continue with Google** links the temporary current workspace. **Already have an account? Sign in** is an explicit account switch; it keeps the previous workspace separate rather than merging different people’s data. If OAuth has not been configured, the UI explains the missing setup rather than allowing unsigned access.

## 3. Upload the source and deploy to GitHub Pages

1. Create a **public** GitHub repository named `AI-tutor` (or use that existing repository if you want the address `https://YOUR_GITHUB_USERNAME.github.io/AI-tutor/`).
2. Extract the project ZIP. Copy everything **inside** the extracted folder into the repository root; do not add another nested folder. Include hidden `.github/workflows/deploy-pages.yml`, plus `package.json`, `src/`, `public/`, and `supabase/`.
3. Commit and push to `main`. With GitHub Desktop, review the changed files, commit, then click **Push origin**. Or use the terminal from the repository root:

   ```bash
   git add -A
   git commit -m "Add Learnloop Level 1 beta"
   git branch -M main
   git push -u origin main
   ```
4. In GitHub **Settings → Secrets and variables → Actions → Variables**, add:
   - `VITE_SUPABASE_URL` — the Supabase Project URL.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — the Supabase Publishable key.

   These browser configuration values are expected to appear in the compiled site. Keep private keys out of them.
5. In GitHub **Settings → Pages**, select **GitHub Actions** for the source. Open **Actions → Deploy Learnloop to GitHub Pages** and wait for the latest build and deployment to succeed.
6. Open `https://YOUR_GITHUB_USERNAME.github.io/AI-tutor/`. If your repository has another name, change `VITE_BASE_PATH` in `.github/workflows/deploy-pages.yml` to `/<repository-name>/` before pushing.

## 4. First-use walkthrough

1. A learner first sees the Google sign-in screen. After successful sign-in, a new learner sees **Start your journey**. Choose **Upload a PDF**, **Paste your notes**, or **Ask one question**. The optional sample is separate.
2. Saving a source creates a new active study tab in the left rail and opens its study thread. Pick one next step: make notes, ask the tutor, or try a quick check.
3. A wrong first response stays in Active while the tutor explains another way and presents a same-concept follow-up. Correct answers and follow-up answers do not finish a tab. Choose **Finish this session** to move it to **Completed**; the answer history remains saved.
4. Drag an active tab onto another to group it, or use its three-dot menu. Right-click opens the same options. Touch and keyboard users can choose **Group with another tab** from the menu. Use **Separate this group** to ungroup it.
5. Open **Completed** to restore a finished thread. Home shows recent activity; a recent Tutor item reopens its saved question and answer. Open **How to use** for the short in-app guide. **Workspace settings** contains a JSON backup and an explicitly confirmed clear action.
6. The header says **SAVED TO ACCOUNT** only after Supabase confirms a cloud save. If it says **SAVING TO ACCOUNT**, wait; **NOT SYNCED** means only the local device copy is confirmed.

## 5. Run locally

Install Node.js 22 and pnpm 11.25.0. Copy `.env.example` to `.env.local`, enter the two public Supabase values, and run:

```bash
pnpm install
pnpm dev
```

`pnpm build` checks and compiles the site. Outside Manus Preview, AI requests require the deployed Supabase function. Supabase and Google OAuth must be configured to enter the application; without those settings, Learnloop shows a sign-in/configuration screen and keeps the workspace locked.

## Privacy and limits

Temporary anonymous Supabase workspaces are tied to the browser's saved auth session until the learner links Google. Clearing that session before linking may make that temporary workspace unrecoverable. A Google identity switch opens that identity's own workspace and never merges two accounts. The header distinguishes account-synced data from an unsynced device copy. Download a workspace backup before clearing or switching if you need an extra copy.

The tutor Edge Function allows up to 60 AI requests per user per UTC day. Configure Supabase Auth CAPTCHA or other abuse controls before a wide public launch. Row-level security protects workspace rows. Never put `OPENAI_API_KEY`, a Supabase Secret key, a service-role key, or a Google OAuth Client Secret in GitHub Pages variables, `VITE_*`, browser code, or committed files.

## Key files

- `BEGINNER_SETUP.md` — click-by-click setup for Supabase, Google OAuth, GitHub Desktop, and GitHub Pages.
- `supabase/migrations/202610260001_learnloop_backend.sql` — workspace, row ownership policies, and daily AI quota.
- `supabase/functions/tutor/index.ts` — authenticated AI endpoint.
- `supabase/config.toml` — Supabase CLI config and JWT enforcement.
- `.github/workflows/deploy-pages.yml` — GitHub Pages build/deployment.
- `.env.example` — placeholders only; not a real secrets file.
- `docs/implementation-references.md` — official integration references.
