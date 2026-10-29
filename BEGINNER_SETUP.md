# Beginner’s guide: publish Learnloop on GitHub Pages and Supabase

This guide assumes you have not deployed a website before. Follow the sections in order. You do **not** need to edit the application code.

When you finish, the website address will look like:

```text
https://YOUR-GITHUB-USERNAME.github.io/AI-tutor/
```

GitHub Pages hosts the website. Supabase stores each learner’s private study workspace and runs the AI function. Google sign-in is required before anyone can use the study workspace. Supabase may create a temporary anonymous workspace behind the sign-in screen so existing browser work can be linked to Google without losing its user ID. The AI provider key stays in Supabase; it does not go in the website or GitHub repository.

## Before you start

You will need a GitHub account and a Supabase account. Download the Learnloop source ZIP attached to the message that came with this guide. The ZIP already contains the hidden `.github` workflow folder, the Supabase migration, the Edge Function, and this website’s setup files. Do not unzip its contents into an extra nested folder.

For the simplest upload, install [GitHub Desktop](https://desktop.github.com/). You will also need the Supabase CLI. Follow the [official Supabase CLI installation guide](https://supabase.com/docs/guides/local-development/cli/getting-started). On macOS, the guide gives a Homebrew command. On Windows, it documents Scoop. On Linux, use its package instructions. Check that the install worked by opening a terminal and running `supabase --version`.[1]

**Windows PowerShell shortcut:** if `supabase` is not recognized and PowerShell says scripts are disabled when you run `npx`, use `npx.cmd supabase` instead. For example, `npx.cmd supabase --version`. In the commands below, put `npx.cmd` before each `supabase` command. This uses the Windows command shim and avoids the blocked `npx.ps1` script; do not change your computer's execution policy just for this project.

## Part 1 — Set up your Supabase project

### 1. Create the project

1. Sign in at [supabase.com](https://supabase.com/) and create a new project.
2. Give it a name such as `learnloop` and choose a region near you.
3. Create a database password. Save it somewhere private. You will need it when the CLI links this folder to your project. It is **not** the publishable key.
4. Wait for Supabase to finish creating the project.

### 2. Turn on anonymous sign-in

The app uses Supabase anonymous sign-in behind the scenes to preserve a browser workspace while Google OAuth is being linked. This does **not** let a learner into the app: the study workspace stays locked until Google sign-in succeeds.

1. In the Supabase project dashboard, open **Authentication**.
2. Open **Sign In / Providers** (the label may be slightly different in a future dashboard layout).
3. Find **Anonymous Sign-Ins** and turn it on.
4. Save the change.

Anonymous accounts are tied to the browser’s saved session. The app’s required Google step links the account and keeps the same Supabase user ID and workspace. Until that link succeeds, the learner cannot enter the study workspace; clearing browser storage can make the temporary copy unrecoverable. Supabase describes this limitation in its [anonymous sign-in guide].[2]

### 2A. Set up Google sign-in

This step creates the Google provider connection used by the **Continue with Google** button. The Google client secret belongs in Supabase only.

1. In Google Cloud Console, create or select a project and configure the OAuth consent screen. Create credentials with type **Web application**.
2. Add your website origin under **Authorized JavaScript origins**, for example `https://YOUR-GITHUB-USERNAME.github.io`. Do not add `/AI-tutor/` to this origin.
3. Find the Supabase project reference from Step 3. Under **Authorized redirect URIs** in Google, add `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
4. In Supabase, open **Authentication → Sign In / Providers → Google**. Turn Google on and enter the Google OAuth **Client ID** and **Client Secret**. If the dashboard shows **Allow manual linking**, enable it so the app can link Google to the existing anonymous workspace.
5. In Supabase, open **Authentication → URL Configuration**. Set **Site URL** to `https://YOUR-GITHUB-USERNAME.github.io/AI-tutor/`, then add that exact URL under **Redirect URLs**. If testing locally, also allow `http://localhost:5173/`.
6. If Google's consent screen is still in **Testing**, add your Google account as a test user.

The app requires Google authentication before showing any study materials or tools. **Continue with Google** links the current temporary workspace so its user ID and data are preserved. If you already have a different Google-linked workspace, use **Already have an account? Sign in**; this switches to that workspace and does not merge accounts. If Google is not configured, the app remains locked and explains which configuration is missing.

### 3. Copy the two browser-safe project values

In Supabase, open **Project Settings → API Keys**. Copy these two values and keep them available while you configure GitHub:

- **Project URL**, which looks like `https://abcdefghijk.supabase.co`.
- **Publishable key**, which starts with `sb_publishable_`.

These two values are meant to be used by a website. Do not copy a value labelled **Secret key** or **service_role** into the website.

The short project reference is the part between `https://` and `.supabase.co`. In `https://abcdefghijk.supabase.co`, the project reference is `abcdefghijk`.

### 4. Apply the database migration

The migration creates the learning-workspace table, rules so each learner can access only their own row, and the daily AI request counter.

1. On your computer, extract the ZIP to a temporary folder.
2. Open the extracted project folder in your terminal. This is the folder containing `package.json` and the `supabase` folder. In Windows File Explorer, right-click the folder and choose **Open in Terminal**. On macOS, open Terminal and type `cd ` (with a space), drag the folder into the Terminal window, and press Enter.
3. Sign in to the Supabase CLI. This opens a browser so you can approve access:

   ```bash
   supabase login
   ```

4. Link this folder to the project you created. Replace the example reference with the one from your own Project URL:

   ```bash
   supabase link --project-ref abcdefghijk
   ```

   The CLI asks for your **database password** from Step 1. Enter it in the terminal prompt; do not send it to anyone.
5. Preview the migration before applying it:

   ```bash
   supabase db push --dry-run
   ```

   Check that the linked project is the one you just created. Then apply the migration:

   ```bash
   supabase db push
   ```

   This applies the included migration to that Supabase project. Supabase’s [remote migration guide](https://supabase.com/docs/guides/local-development/cli-workflows) documents the `login`, `link`, dry-run, and push sequence.[3]

### 5. Add the AI provider key and deploy the function

The AI function needs an API key from an OpenAI-compatible model provider. This is separate from your Supabase publishable key and may incur charges with that provider.

1. In Supabase, open **Edge Functions → Secrets**.
2. Add a secret named exactly `OPENAI_API_KEY` and paste your provider key as its value.
3. Optionally add `OPENAI_MODEL` if you want to use a different model from the default. Optionally add `OPENAI_BASE_URL` if you use a different OpenAI-compatible provider.
4. Save the secrets.
5. Return to the same project folder in the terminal and deploy the function:

   ```bash
   supabase functions deploy tutor
   ```

6. In Supabase, check **Edge Functions** and confirm that `tutor` appears as deployed.

On Windows PowerShell, run the deploy from the extracted project folder as `npx.cmd supabase functions deploy tutor --project-ref YOUR_PROJECT_REF`. Use the same project reference shown in the Supabase dashboard. The latest function also accepts common equivalent JSON field names and code-fenced provider output, gives the learner a retryable task-specific message when a response is genuinely incomplete, and asks Practice for varied questions. Redeploy it after replacing the source. This update does not add a database table or require a new migration.

Put provider keys only in Supabase Edge Function Secrets. Supabase documents both the Dashboard secrets form and how functions read these values.[4] Do not add `OPENAI_API_KEY` to GitHub, the `.env.example` file, or any variable beginning with `VITE_`.

## Part 2 — Upload the website to GitHub

### 6. Create the GitHub repository

1. Sign in at [github.com](https://github.com/).
2. Select **New repository**.
3. Name it exactly `AI-tutor`. The workflow in this ZIP is configured for that repository name.
4. Choose **Public** if you are using GitHub’s free public Pages setup.
5. Leave **Add a README**, **Add .gitignore**, and **Choose a license** unchecked so the new repository starts empty.
6. Select **Create repository**.

If you already have a repository named `AI-tutor`, use that repository instead. If your repository has a different name, you will need to change the Pages base path in `.github/workflows/deploy-pages.yml` to match it.

### 7. Clone the repository with GitHub Desktop

1. Install and open GitHub Desktop. Sign in to the same GitHub account.
2. Choose **File → Clone repository**.
3. Select your `AI-tutor` repository, choose where to put it on your computer, and click **Clone**.
4. Keep GitHub Desktop open, or remember the folder you chose. This is your local copy of the GitHub repository.

### 8. Copy the ZIP contents into the repository

1. Extract the source ZIP you downloaded earlier.
2. Open the extracted folder. You should see `package.json`, `pnpm-lock.yaml`, `src`, `public`, and `supabase`.
3. Copy **everything inside** that folder into the cloned `AI-tutor` folder. Do not copy an extra enclosing folder. `package.json` should be directly inside `AI-tutor`.
4. Include the hidden `.github` folder. On Windows, turn on **View → Show → Hidden items** in File Explorer. On macOS, press **Command + Shift + .** in Finder to show hidden files. Confirm this file exists after copying:

   ```text
   AI-tutor/.github/workflows/deploy-pages.yml
   ```

5. Switch to GitHub Desktop. The left side should show a long list of changed files. If it says there are no changes, the files were probably copied to the wrong folder.

### 9. Save the files to GitHub

1. In GitHub Desktop, enter a summary such as `Add Learnloop tutor and Supabase backend`.
2. Select **Commit to main** at the bottom left.
3. Select **Push origin** near the top of the window. This uploads the files to GitHub.
4. On GitHub.com, open your `AI-tutor` repository and check that `package.json`, `src`, `supabase`, and `.github` are visible.

The `.github` folder is hidden on some computers, but it must be uploaded. GitHub’s custom workflow guide explains that Pages can be deployed from a workflow and that **GitHub Actions** must be selected as the repository’s Pages source.[5]

## Part 3 — Connect GitHub to Supabase and publish the site

### 10. Add the two Supabase values to GitHub Actions

1. In your GitHub repository, open **Settings**.
2. In the left menu, open **Secrets and variables → Actions**.
3. Select the **Variables** tab—not Secrets—and choose **New repository variable**.
4. Add the first variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: the Project URL you copied in Step 3.
5. Add another repository variable:
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: the Publishable key you copied in Step 3.
6. Save each variable.

The publishable key is designed to appear in the built website. The database’s row-level security is what protects learner data. The AI provider key is different and must stay in Supabase Edge Function Secrets.

### 11. Select GitHub Actions as the Pages source

1. In the same repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Save if GitHub shows a Save button.

### 12. Wait for the website deployment

1. Open the repository’s **Actions** tab.
2. Select the workflow named **Deploy Learnloop to GitHub Pages**.
3. Open the latest run. Wait for both the build and deploy steps to finish with green check marks.
4. Open **Settings → Pages** again. GitHub will show the published website link. It should be:

   ```text
   https://YOUR-GITHUB-USERNAME.github.io/AI-tutor/
   ```

The first deployment can take several minutes. Do not judge the result until the Actions run completes successfully.

## Part 4 — Check that the app works

1. Open the site link. A learner must see the Google sign-in screen first. After sign-in succeeds, a new learner should see **Start your journey**, not a pre-filled results dashboard. Choose **Upload a PDF**, **Paste your notes**, or **Ask one question**. The sample lesson is optional and clearly marked.
2. After saving material, confirm a new study tab appears on the left and opens a thread with three choices: notes, tutor, or a quick check. Home should contain recorded stats and recent work only.
3. Drag two study tabs together to group them, or use the tab’s three-dot menu. Right-click also opens the menu. On touch screens, use the menu to group or separate tabs. Grouping does not combine their learning histories.
4. In **Practice**, answer the first check correctly. The tab should remain active; choose **Finish this session** to move it to **Completed**. The tab also remains active after a reteach follow-up until the learner chooses Finish. Reopen a completed tab from **Completed** if needed.
5. Google sign-in must succeed before the workspace opens. After returning from Google, the signed-in email should appear. The header says **SAVED TO ACCOUNT** only after Supabase confirms a save; during a save it says **SAVING TO ACCOUNT**, and in an offline or local-only state it explicitly says the device copy is **NOT SYNCED**. If account saving fails, confirm the GitHub Actions variables, migration, Anonymous Sign-Ins setting and Google OAuth configuration.
6. Use the moon/sun button to compare light and dark modes. To save a backup or clear data, open **Workspace settings** at the bottom of the sidebar.

## If something goes wrong

**The page shows 404.** Check that the repository name is exactly `AI-tutor`, the repository is public for the free public Pages setup, the `.github/workflows/deploy-pages.yml` file is present on `main`, and **Settings → Pages → Source** is set to **GitHub Actions**. Then open **Actions** and confirm the latest deployment succeeded.

**The Actions build fails.** Open the failed run and click the first step marked with a red X to see its message. Confirm that the files were copied to the repository root and that both GitHub Actions variables have the exact names above. If you changed the repository name, update `VITE_BASE_PATH` in the workflow to `/<your-repository-name>/`, then commit and push again.

**The sign-in screen says Supabase is not configured, or the header says DEVICE ONLY / OFFLINE.** Confirm the two repository variables match your Supabase Project URL and Publishable key. Confirm Anonymous Sign-Ins are enabled, Google OAuth is configured, and `supabase db push` completed against the same project. Push a new commit or rerun the Actions workflow after adding the variables so the site is rebuilt.

**Notes or Tutor says the AI response was incomplete.** The source and question stay saved; use the retry button. If you recently replaced the source code, redeploy the Edge Function from the project folder. In Windows PowerShell, run `npx.cmd supabase functions deploy tutor --project-ref YOUR_PROJECT_REF`. Then open Supabase **Edge Functions → tutor → Invocations/Logs** and check the new invocation. The updated function accepts common provider JSON variations, but it cannot repair a provider error, an exhausted quota, or a response with no usable answer.

**AI requests fail but the rest of the site works.** Confirm `OPENAI_API_KEY` is set under Supabase **Edge Functions → Secrets** and that the `tutor` function deployment completed. Check that your provider key is active, the configured base URL/model belong to that provider, and the account has available usage. Never paste the key into GitHub or a support chat.

**Google sign-in does not start or return to the site.** Confirm Google is enabled in Supabase, the Google OAuth Client ID and Client Secret were saved in Supabase, the Google callback is exactly `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`, and the GitHub Pages URL is in Supabase’s allowed redirect URLs. For linking an anonymous workspace, enable manual identity linking if that option is shown.

**You want to use another device.** First choose **Continue with Google** while the original workspace is open. After the browser returns, confirm the Google email appears in the app. On the other device, open the same site and choose **Already have an account? Sign in**. Anonymous/local-only data is not recoverable across devices until linking and cloud sync have completed. Do not use account switching to merge two people's workspaces.

## Optional: run the site on your computer

This is not required to publish it. Install Node.js 22 LTS and pnpm 11.25.0. Copy `.env.example` to `.env.local`, then put the Project URL and Publishable key into that local file. From the project folder, run:

```bash
pnpm install
pnpm dev
```

Open the local address printed by the command. `.env.local` is ignored by Git. Do not put your OpenAI-compatible provider key in this file.

## Official references

[1]: https://supabase.com/docs/guides/local-development/cli/getting-started "Supabase CLI installation"
[2]: https://supabase.com/docs/guides/auth/auth-anonymous "Supabase Anonymous Sign-Ins"
[3]: https://supabase.com/docs/guides/local-development/cli-workflows "Supabase CLI remote migrations"
[4]: https://supabase.com/docs/guides/functions/secrets "Supabase Edge Function secrets"
[5]: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages "GitHub Pages custom workflows"
