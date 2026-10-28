import { ArrowRight, BookOpenText, ShieldCheck } from 'lucide-react';

interface Props {
  hasCloud: boolean;
  hasCurrentWorkspace: boolean;
  authBusy: boolean;
  authError: string;
  onLinkCurrent: () => void;
  onSignInExisting: () => void;
}

function GoogleMark() {
  return <svg aria-hidden="true" className="google-mark" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.2-1.8 13.6-4.9l-6.7-5.1c-1.9 1.3-4.2 2.1-6.9 2.1-5.3 0-9.8-3.6-11.4-8.5H5.7v5.3A20.5 20.5 0 0 0 24 44Z"/><path fill="#4285F4" d="M12.6 27.6a12.3 12.3 0 0 1 0-7.2v-5.3H5.7a20.5 20.5 0 0 0 0 17.8l6.9-5.3Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20.5 20.5 0 0 0 5.7 15.1l6.9 5.3C14.2 15.6 18.7 12 24 12Z"/></svg>;
}

export default function SignInGate({ hasCloud, hasCurrentWorkspace, authBusy, authError, onLinkCurrent, onSignInExisting }: Props) {
  return <main className="signin-gate"><section className="signin-card" aria-labelledby="signin-title">
    <div className="signin-brand"><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><strong>learnloop</strong></div>
    <p className="eyebrow">YOUR STUDY DESK</p>
    <h1 id="signin-title">Sign in before you study.</h1>
    <p className="signin-copy">Your workspace belongs to you. Sign in with Google to open Learnloop and keep your study material, notes, and answers with your account.</p>
    <div className="signin-privacy"><ShieldCheck size={18} /><span>Study workspace features stay locked until Google sign-in succeeds.</span></div>
    {hasCloud ? <>
      <button type="button" className="signin-google-button" disabled={authBusy} onClick={onLinkCurrent}><GoogleMark />{authBusy ? 'Opening Google…' : hasCurrentWorkspace ? 'Continue with Google and keep this workspace' : 'Continue with Google'}<ArrowRight size={16} /></button>
      {hasCurrentWorkspace && <p className="signin-note"><BookOpenText size={15} /> Linking Google keeps the current workspace. If this Google account already has a separate Learnloop workspace, choose sign-in below; accounts are not merged.</p>}
      <button type="button" className="signin-existing-button" disabled={authBusy} onClick={onSignInExisting}>Already have an account? Sign in instead</button>
    </> : <div className="signin-config-error" role="status"><strong>Sign-in isn’t configured for this copy yet.</strong><p>Add the Supabase project URL and publishable key to the site, then enable Google under Supabase Authentication. No study workspace is accessible until that setup is complete.</p></div>}
    {authError && <p className="auth-error signin-error" role="alert">{authError}</p>}
    <p className="signin-footnote">You can read the setup guide in the project files if Google sign-in has not been connected yet.</p>
  </section></main>;
}
