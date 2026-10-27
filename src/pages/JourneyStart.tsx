import { ArrowRight, BookOpen, FileText, FileUp, MessageCircleQuestion } from 'lucide-react';
import type { ViewKey } from '../types';

export type MaterialStartMode = 'upload' | 'paste' | 'question';

interface Props {
  onStart: (mode: MaterialStartMode) => void;
  onTrySample: () => void;
  hasCloud: boolean;
  googleLinked: boolean;
  googleEmail?: string;
  authBusy: boolean;
  authError: string;
  onGoogleLink: () => void;
  onNavigate: (view: ViewKey) => void;
}

function GoogleMark() {
  return <svg aria-hidden="true" className="google-mark" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.2-1.8 13.6-4.9l-6.7-5.1c-1.9 1.3-4.2 2.1-6.9 2.1-5.3 0-9.8-3.6-11.4-8.5H5.7v5.3A20.5 20.5 0 0 0 24 44Z"/><path fill="#4285F4" d="M12.6 27.6a12.3 12.3 0 0 1 0-7.2v-5.3H5.7a20.5 20.5 0 0 0 0 17.8l6.9-5.3Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20.5 20.5 0 0 0 5.7 15.1l6.9 5.3C14.2 15.6 18.7 12 24 12Z"/></svg>;
}

export default function JourneyStart({ onStart, onTrySample, hasCloud, googleLinked, googleEmail, authBusy, authError, onGoogleLink, onNavigate }: Props) {
  return (
    <section className="journey-page page-stack" aria-labelledby="journey-title">
      <div className="journey-content">
        <p className="eyebrow">LEARNLOOP · YOUR STUDY DESK</p>
        <h1 id="journey-title">Start your journey.</h1>
        <p className="intro-copy">Bring one thing you want to understand. We’ll make a study thread for it, then follow what your answers tell us.</p>

        <div className="journey-actions" aria-label="Choose how to begin">
          <button type="button" className="journey-choice" onClick={() => onStart('upload')}>
            <span className="journey-choice-icon"><FileUp size={21} /></span>
            <span className="journey-choice-copy"><strong>Upload a PDF</strong><span>Start from a chapter or class handout.</span></span>
            <ArrowRight size={17} />
          </button>
          <button type="button" className="journey-choice" onClick={() => onStart('paste')}>
            <span className="journey-choice-icon"><FileText size={21} /></span>
            <span className="journey-choice-copy"><strong>Paste your notes</strong><span>Bring a short passage or your own notes.</span></span>
            <ArrowRight size={17} />
          </button>
          <button type="button" className="journey-choice journey-choice-question" onClick={() => onStart('question')}>
            <span className="journey-choice-icon"><MessageCircleQuestion size={21} /></span>
            <span className="journey-choice-copy"><strong>Ask one question</strong><span>Begin with the part that feels confusing.</span></span>
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="journey-footer-actions">
          <button type="button" className="sample-action" onClick={onTrySample}><BookOpen size={16} /> Take a look at a sample lesson</button>
          <span className="journey-separator" aria-hidden="true">·</span>
          <button type="button" className="text-button" onClick={() => onNavigate('materials')}>Open my library <ArrowRight size={14} /></button>
        </div>

        <div className="journey-save-note" role="status">
          <span className={`journey-save-mark ${hasCloud ? 'is-cloud' : ''}`} aria-hidden="true" />
          <span>{googleLinked ? `Google linked · ${googleEmail ?? 'your workspace is protected'}` : hasCloud ? 'Saved in this browser until you link Google.' : 'Saved on this device. Connect Supabase to enable Google sign-in and cloud sync.'}</span>
        </div>
        {hasCloud && !googleLinked && <button type="button" className="journey-google-button" disabled={authBusy} onClick={onGoogleLink}><GoogleMark />{authBusy ? 'Opening Google…' : 'Continue with Google to keep your study space'}</button>}
        {!hasCloud && <p className="journey-config-note">Google sign-in becomes available after Supabase is configured.</p>}
        {authError && <p className="auth-error journey-auth-error" role="alert">{authError}</p>}
      </div>
    </section>
  );
}
