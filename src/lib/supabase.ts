import { createClient, type User } from '@supabase/supabase-js';

const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const hasSupabaseConfig = Boolean(projectUrl && publishableKey);

export const supabase = hasSupabaseConfig
  ? createClient(projectUrl!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

let anonymousSignIn: Promise<User> | null = null;

export async function ensureAnonymousUser(): Promise<User> {
  if (!supabase) {
    throw new Error('Cloud sync is not configured. Add the Supabase project URL and publishable key to the deployment settings.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(`Could not restore your Supabase session: ${sessionError.message}`);
  if (sessionData.session?.user) return sessionData.session.user;

  if (!anonymousSignIn) {
    anonymousSignIn = supabase.auth.signInAnonymously().then(({ data, error }) => {
      if (error) {
        throw new Error(`Anonymous sign-in failed: ${error.message}. Check that Anonymous Sign-Ins are enabled in Supabase Auth.`);
      }
      if (!data.user) throw new Error('Supabase did not return a learner session.');
      return data.user;
    }).finally(() => {
      anonymousSignIn = null;
    });
  }
  return anonymousSignIn;
}

function appRedirectUrl(): string {
  return new URL(import.meta.env.BASE_URL || '/', window.location.origin).toString();
}

export function isGoogleLinked(user: User | null): boolean {
  return Boolean(user?.identities?.some((identity) => identity.provider === 'google'));
}

/** Link Google to the current workspace; this preserves its auth.users ID and RLS-owned data. */
export async function beginGoogleIdentityLink(): Promise<void> {
  if (!supabase) throw new Error('Google sign-in needs the Supabase URL and publishable key to be configured first.');
  const user = await ensureAnonymousUser();
  if (isGoogleLinked(user)) return;
  const { error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: appRedirectUrl(),
      queryParams: { prompt: 'select_account' }
    }
  });
  if (error) throw new Error(error.message);
}

/** Explicit switch to an existing Google account. Call only after the learner confirms the workspace switch. */
export async function beginExistingGoogleSignIn(): Promise<void> {
  if (!supabase) throw new Error('Google sign-in needs the Supabase URL and publishable key to be configured first.');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  if (sessionData.session) {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: appRedirectUrl(),
      queryParams: { prompt: 'select_account' }
    }
  });
  if (error) throw new Error(error.message);
}
