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
