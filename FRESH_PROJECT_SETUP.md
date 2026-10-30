# Learnloop fresh-project setup

This guide assumes the previous GitHub repository and Supabase project are gone. Do not reuse their URLs, keys, OAuth secrets, or database settings.

## 1. Create a new Supabase project

1. Create a new project at [supabase.com](https://supabase.com/).
2. In **Project Settings → API**, copy the new **Project URL** and **Publishable key**. These are the only Supabase values that belong in the browser build.
3. In **Authentication → Providers**, enable **Anonymous** and **Google**.
4. Keep the Google Client Secret inside Supabase. Never put it in GitHub Actions variables or a `VITE_*` variable.

From the project root, install the Supabase CLI if necessary, then run:

```bash
supabase login
supabase link --project-ref YOUR_NEW_PROJECT_REF
supabase db push
```

The included migration creates the workspace table, row-level security, the daily tutor quota, and a private `study-images` Storage bucket. The bucket accepts only authenticated uploads under the current user's UUID and cannot be read by other users.

## 2. Configure Google sign-in

Create a new Google Cloud **OAuth client ID → Web application**. Use these values:

- **Authorized JavaScript origin:** `https://YOUR_GITHUB_USERNAME.github.io`
- **Authorized redirect URI:** `https://YOUR_NEW_PROJECT_REF.supabase.co/auth/v1/callback`

In Supabase **Authentication → Providers → Google**, paste the new Google Client ID and Client Secret. In **Authentication → URL Configuration**, set the Site URL and allowed redirect URL to the final Pages URL, for example:

```text
https://YOUR_GITHUB_USERNAME.github.io/AI-tutor/
```

For local testing, also allow `http://localhost:3000/`.

## 3. Configure Google Gemma

Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey). Add it in Supabase **Edge Functions → Secrets**:

```text
GEMINI_API_KEY=your-new-key
GEMMA_MODEL=gemma-4-26b-a4b-it
```

`GEMMA_MODEL` is optional. The Edge Function defaults to `gemma-4-26b-a4b-it`. Deploy it from the project root:

```bash
supabase functions deploy tutor
```

The key stays in the Edge Function. It is never included in the website or sent from the browser to Google. Text requests use Gemma's native Gemini `generateContent` API. Image study sources are downloaded from private Supabase Storage after ownership verification and sent as an image part in the same request.

## 4. Create a new GitHub repository

1. Create a new repository. `AI-tutor` is the simplest name because the included workflow uses `/AI-tutor/` as the Pages path.
2. Copy the contents of this project into the repository root, including the hidden `.github/workflows/deploy-pages.yml` folder.
3. If you choose another repository name, change `VITE_BASE_PATH` in `.github/workflows/deploy-pages.yml` from `/AI-tutor/` to `/<your-repository-name>/`.
4. Push the project to the `main` branch.
5. In **Settings → Pages**, choose **GitHub Actions**.
6. In **Settings → Secrets and variables → Actions → Variables**, add:

```text
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-new-publishable-key
```

These two values are intentionally public browser configuration. Do not add `GEMINI_API_KEY`, a Supabase secret/service key, or the Google Client Secret here.

## 5. Test locally first

Copy `.env.example` to `.env.local` and fill only the two public Supabase values:

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000/`. The app should show the Google sign-in gate, create a temporary anonymous workspace after authentication, and then allow a PDF, text, or image source. Run the production check with:

```bash
pnpm build
```

## 6. First verification checklist

- Google sign-in returns to the new Pages URL.
- A new learner sees an empty “Start your journey” screen.
- A text source can generate notes, tutor answers, quizzes, and mistake analysis.
- A JPG/PNG/WEBP/GIF source uploads to the private `study-images` bucket and can generate a Gemma response.
- A second user cannot read the first user's image path.
- The browser bundle contains no Gemini key, Supabase secret key, service-role key, or Google Client Secret.
