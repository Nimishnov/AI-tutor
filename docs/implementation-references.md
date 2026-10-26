# Supabase implementation references

These official documentation pages were checked while implementing the backend handoff:

- [Anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous): `signInAnonymously()` creates an authenticated anonymous user with a user ID. Anonymous accounts are not recoverable after sign-out, clearing browser storage, or switching devices unless an identity is linked. Anonymous users use the `authenticated` Postgres role; they are not the same thing as the `anon` API-key role. Supabase recommends abuse controls such as CAPTCHA for public anonymous sign-up.
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): scope per-user reads/writes by `auth.uid()` and enable RLS; issue separate policies for each operation and grant only the required table operations.
- [JavaScript `functions.invoke`](https://supabase.com/docs/reference/javascript/functions-invoke): the browser client invokes a named Edge Function with a JSON body and sends the signed-in user's JWT in the authorization header.
- [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth): leave user-facing function JWT verification enabled and validate authenticated callers with the supported Supabase server context.
- [Edge Function secrets](https://supabase.com/docs/guides/functions/secrets): production function secrets are configured through the Dashboard or `supabase secrets set`; function code reads secrets through `Deno.env.get`. Never commit secret files or expose server keys to browser output.
- [React + Vite quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs): configure browser-safe project URL/publishable key through deployment environment values instead of committing credentials.
