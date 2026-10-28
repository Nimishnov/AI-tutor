import { ArrowRight, BookOpenText, Check, FileUp, MessageCircle, RotateCcw, Target } from 'lucide-react';
import type { CloudStatus, ViewKey } from '../types';

interface Props {
  onNavigate: (view: ViewKey) => void;
  cloudStatus: CloudStatus;
  googleEmail?: string;
}

const guide = [
  { icon: FileUp, title: '1. Bring one thing to study', copy: 'Choose Library to upload a selectable-text PDF, paste notes, or start with a question. Each new source becomes its own study tab on the left.' },
  { icon: BookOpenText, title: '2. Start where you need help', copy: 'Open Notes for a source-based outline, Tutor to ask questions in your own words, or Practice for a multiple-choice check.' },
  { icon: Target, title: '3. Let an answer guide the next step', copy: 'If you miss a question, explain your reasoning if you want. The tutor treats a guessed misconception as a possibility, reteaches the idea another way, and asks a new question about the same concept.' },
  { icon: RotateCcw, title: '4. Review and finish when you choose', copy: 'Revision collects topics tied to your recorded answers. A correct answer does not finish a study tab; use Finish this session when you are ready. Finished tabs stay under Completed and can be restored.' },
  { icon: MessageCircle, title: '5. Return to a conversation', copy: 'Home shows recent work. Select a Tutor item to return to that saved question and answer; other activity opens its recorded study section.' }
];

export default function Help({ onNavigate, cloudStatus, googleEmail }: Props) {
  const savingCopy = cloudStatus === 'synced'
    ? `Saved to your signed-in workspace${googleEmail ? ` (${googleEmail})` : ''}.`
    : cloudStatus === 'syncing' || cloudStatus === 'connecting'
      ? 'The app is checking or saving to your account. Wait for “Saved to account” before assuming the latest changes have synced.'
      : 'This copy is saved on this device only and is not currently synced. Reconnect before relying on another device.';
  return <div className="help-page page-stack">
    <header className="page-intro"><div><p className="eyebrow">A SHORT FIELD GUIDE</p><h1>How to use Learnloop</h1><p className="intro-copy">A quick walk-through of the study desk and what happens after an answer.</p></div></header>
    <section className="help-guide" aria-label="Learnloop guide">{guide.map(({ icon: Icon, title, copy }) => <article className="help-step" key={title}><span className="help-step-icon"><Icon size={19} /></span><div><h2>{title}</h2><p>{copy}</p></div></article>)}</section>
    <section className="help-save-note"><Check size={17} /><div><strong>About saving</strong><p>{savingCopy} Google sign-in is required to use the workspace. A device backup can be downloaded under Workspace settings.</p></div></section>
    <div className="help-actions"><button type="button" className="button button-primary" onClick={() => onNavigate('materials')}>Add study material <ArrowRight size={15} /></button><button type="button" className="button button-outline" onClick={() => onNavigate('dashboard')}>Back to Home</button></div>
  </div>;
}
