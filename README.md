# Learnloop — a study desk that remembers what tripped you up

Learnloop turns study material into source-aware notes, explanations, practice, mistake analysis, reteaching, follow-up checks, and revision. This package adds Supabase-backed anonymous workspace sync and an authenticated AI Edge Function, while preserving the local fallback.

## Included

- PDF/text/pasted-question intake with selectable-text PDF extraction and source snippets.
- Structured study notes, a concept tutor, multiple-choice practice, cautious mistake analysis, a different reteaching example, and a same-concept follow-up check.
- A dashboard, activity/history, revision suggestions, and note-based flashcards.
- A bespoke editorial study-journal design in high-contrast ink, paper-white, cobalt blue, and orange; the dark and light modes use matching contrast.
- Supabase anonymous Auth, one private JSON workspace per user, RLS ownership policies, a daily per-user AI quota, and an authenticated Edge Function.
- A static GitHub Pages workflow configured for the `/AI-tutor/` repository path.

## 1. Create and configure Supabase

1. Create a Supabase project. In **Project Settings → API Keys**, copy its **Project URL** and **Publishable key** (`sb_publishable_…`). Use the publishable key in browser settings. Never use a secret or service-role key in the website.
2. In **Authentication → Sign In / Providers**, enable **Anonymous Sign-Ins**. This gives each browser session a user ID without requiring email or a password.
3. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) using Supabase’s current instructions. From the project folder, link your project and apply the included migration:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

   `YOUR_PROJECT_REF` is the project reference in your Supabase URL, such as `abcdefghijk` in `https://abcdefghijk.supabase.co`. The migration creates the workspace table, RLS policies, and server-only quota function.
4. In **Edge Functions → Secrets**, add `OPENAI_API_KEY` with your own OpenAI-compatible provider key. This is the only place the provider key should go. Optionally add `OPENAI_MODEL` (defaults to `gpt-4o-mini`) and `OPENAI_BASE_URL` (defaults to `https://api.openai.com/v1`). AI usage may create charges with your provider.
5. Deploy the AI function:

   ```bash
   supabase functions deploy tutor
   ```

   The included `supabase/config.toml` keeps JWT verification enabled. Do not disable it for this user-facing function.

## 2. Upload the source and deploy through GitHub Pages

1. Create a **public** GitHub repository named `AI-tutor`, or restore that repository if you still want the old `.../AI-tutor/` link. This package does not publish anything by itself.
2. Clone the empty repository to your computer. Extract the ZIP contents into the cloned repository root. The files should sit directly at the top level: `package.json`, `src/`, `supabase/`, and `.github/`. Do not put the contents in a second nested `learnloop/` directory. Make sure the hidden `.github/workflows/deploy-pages.yml` is included; the terminal steps below include hidden files automatically.
3. From the cloned `AI-tutor` folder, commit and push the files:

   ```bash
   git add -A
   git commit -m "Add Learnloop tutor and Supabase backend"
   git branch -M main
   git push -u origin main
   ```

   If Git reports there is nothing to commit, confirm the ZIP was extracted to the repository root and that hidden files were included.
4. In GitHub, open **Settings → Secrets and variables → Actions → Variables**. Add two repository variables. They are public browser configuration values, not secrets:
   - `VITE_SUPABASE_URL` — your Supabase Project URL.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — your Supabase publishable key.
5. In **Settings → Pages**, select **GitHub Actions** as the build and deployment source. Then open **Actions**, choose **Deploy Learnloop to GitHub Pages**, and wait for the deploy job to finish successfully.
6. Your live address will be `https://YOUR_GITHUB_USERNAME.github.io/AI-tutor/`. It will not work until the repository is public, the workflow is present on `main`, Pages uses GitHub Actions, and the action completes successfully.

If the repository is named something other than `AI-tutor`, update `VITE_BASE_PATH` in `.github/workflows/deploy-pages.yml` to `/<repository-name>/` before pushing.

## 3. Run locally

Copy `.env.example` to `.env.local` and fill in the two browser-safe Supabase values. Then run:

```bash
pnpm install
pnpm dev
```

Run the production build with:

```bash
pnpm build
```

Without those two Supabase values, the app uses the sample workspace and browser `localStorage`. In the Manus Preview, AI generation can use the existing managed development proxy. On GitHub Pages, AI requests need the deployed Supabase function.

## Privacy and limits to know

Anonymous accounts are tied to the browser’s saved Supabase session. They are not recoverable if the user clears browser storage, signs out, or switches devices. Add email/OAuth account linking before using this as a permanent multi-device account. Before inviting a large public audience, configure Supabase Auth CAPTCHA or another abuse control; per-user quotas can be bypassed by creating additional anonymous users.

The Edge Function allows up to 60 AI requests per anonymous user per UTC day. The publishable key is designed to be visible in browser code; row-level security limits data access. Never put `OPENAI_API_KEY`, a Supabase secret key, or a service-role key in GitHub Actions variables, `VITE_*` values, browser code, or a committed file. `.env.local` and Supabase function `.env` files are ignored by Git.

## Key files

- `supabase/migrations/202610260001_learnloop_backend.sql` — workspace schema, ownership policies, and daily quota.
- `supabase/functions/tutor/index.ts` — authenticated AI endpoint for notes, tutoring, quizzes, and mistake analysis.
- `supabase/config.toml` — Supabase CLI project configuration and Edge Function JWT enforcement.
- `.github/workflows/deploy-pages.yml` — GitHub Pages build and deployment.
- `.env.example` — local environment template with placeholders only.
- `BEGINNER_SETUP.md` — click-by-click GitHub Desktop and Supabase setup instructions.
- `docs/implementation-references.md` — official Supabase documentation used for the integration.
