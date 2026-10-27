import { useMemo, useState } from 'react';
import {
  ArrowRight, BookOpenCheck, Check, ChevronLeft, ChevronRight, Clock3,
  FileText, Lightbulb, RotateCcw, Target, TriangleAlert
} from 'lucide-react';
import type { LearningState, ViewKey } from '../types';

interface Props { state: LearningState; onNavigate: (view: ViewKey) => void; }
interface RevisionCard { front: string; back: string; topic: string; source: string }

function latestOutcomes(state: LearningState) {
  const latest = new Map<string, LearningState['attempts'][number]>();
  [...state.attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((attempt) => latest.set(attempt.concept, attempt));
  return [...latest.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function ago(value: string) {
  const hours = Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000);
  return hours < 24 ? `${Math.max(1, hours)}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export default function Revision({ state, onNavigate }: Props) {
  const outcomes = useMemo(() => latestOutcomes(state), [state.attempts]);
  const weakTopics = outcomes.filter((attempt) => !attempt.isCorrect);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const flashcards: RevisionCard[] = state.notes.flatMap((note) => note.sections.flatMap((section) => section.bullets.map((bullet) => ({
    front: `What should you remember about ${section.heading.toLowerCase()}?`,
    back: bullet,
    topic: section.heading,
    source: note.title
  }))));
  const card = flashcards.length ? flashcards[cardIndex % flashcards.length] : null;
  const improved = state.attempts.filter((attempt) => attempt.isFollowUp && attempt.isCorrect).length;

  return (
    <div className="revision-page page-stack">
      <div className="page-intro"><div><p className="eyebrow">MAKE ANOTHER PASS, AT THE RIGHT TIME</p><h1>Revision that listens.</h1><p className="intro-copy">Your next steps come from what you actually answered—not a guessed mastery score.</p></div><div className="page-intro-ornament revision-ornament"><RotateCcw size={24} /></div></div>

      <section className="revision-hero"><div className="revision-hero-copy"><span className="revision-kicker"><BookOpenCheck size={15} /> FROM YOUR PRACTICE</span><h2>{weakTopics.length ? 'Return to one idea at a time.' : 'Build a revision trail as you go.'}</h2><p>{weakTopics.length ? `Your latest answers suggest another look at ${weakTopics[0].concept}. A short revisit now may help it settle.` : 'Complete a few questions and your revision list will grow from the concepts you actually find tricky.'}</p></div></section>

      <div className="revision-columns">
        <section className="revision-topics panel"><div className="panel-heading"><div><p className="eyebrow">BASED ON YOUR ANSWERS</p><h3>Topics to revisit</h3></div><div className="count-pill">{weakTopics.length}</div></div>{weakTopics.length ? <div className="revision-topic-list">{weakTopics.map((attempt, index) => <article className="revision-topic" key={attempt.concept}><div className={`topic-rank rank-${index % 3}`}><TriangleAlert size={16} /></div><div className="revision-topic-copy"><strong>{attempt.concept}</strong><span>Last answer: “{attempt.selectedText}”</span><em>Correct answer: {attempt.correctText}</em></div><div className="revision-topic-meta"><span><Clock3 size={13} /> {ago(attempt.createdAt)}</span><button className="revision-practice-link" onClick={() => onNavigate('practice')}>Practice <ArrowRight size={13} /></button></div></article>)}</div> : <div className="revision-clear"><div className="clear-icon"><Check size={17} /></div><div><strong>Nothing to revisit just yet.</strong><span>Your answers will add a topic here if it needs another pass.</span></div><button className="text-arrow" onClick={() => onNavigate('practice')}>Try a question <ArrowRight size={14} /></button></div>}<div className="revision-evidence"><Lightbulb size={14} /> A topic appears here when your most recent recorded answer was incorrect.</div></section>

        <section className="followup-summary panel"><div className="panel-heading"><div><p className="eyebrow">AFTER A RETEACH</p><h3>Follow-up checks</h3></div><div className="followup-icon"><Target size={17} /></div></div><div className="followup-count"><strong>{improved}</strong><span>correct follow-up answers</span></div><p className="followup-disclaimer">This counts recorded correct answers after reteaching. It isn’t a measure of overall mastery.</p><div className="followup-bar"><span style={{ width: `${state.attempts.filter((a) => a.isFollowUp).length ? Math.max(4, improved / state.attempts.filter((a) => a.isFollowUp).length * 100) : 0}%` }} /></div><div className="followup-total">{state.attempts.filter((a) => a.isFollowUp).length} follow-up question{state.attempts.filter((a) => a.isFollowUp).length === 1 ? '' : 's'} recorded</div></section>
      </div>

      <section className="flashcards-panel panel"><div className="flashcards-heading"><div><p className="eyebrow">A QUICK RECALL BREAK</p><h2>Review from your notes.</h2><p>Try to say it in your own words before you turn the card over.</p></div><div className="flashcard-stack-icon"><div /><div /><div><BookOpenCheck size={18} /></div></div></div>{card ? <div className={`flashcard ${revealed ? 'flashcard-revealed' : ''}`}><div className="flashcard-top"><span><FileText size={13} /> {card.source}</span><span>{String(cardIndex + 1).padStart(2, '0')} / {String(flashcards.length).padStart(2, '0')}</span></div><div className="flashcard-content"><span className="flashcard-topic">{card.topic}</span><h3>{revealed ? card.back : card.front}</h3>{revealed && <div className="flashcard-source"><Check size={13} /> From your saved notes</div>}</div><div className="flashcard-controls"><button className="flashcard-back" disabled={cardIndex === 0} onClick={() => { setCardIndex((index) => Math.max(0, index - 1)); setRevealed(false); }}><ChevronLeft size={16} /> Previous</button><button className="button button-primary" onClick={() => revealed ? (setCardIndex((index) => (index + 1) % flashcards.length), setRevealed(false)) : setRevealed(true)}>{revealed ? <>Next card <ChevronRight size={15} /></> : <>Reveal answer <ArrowRight size={15} /></>}</button><button className="flashcard-next" onClick={() => { setCardIndex((index) => (index + 1) % flashcards.length); setRevealed(false); }}>Skip <ChevronRight size={15} /></button></div></div> : <div className="flashcard-empty"><div className="flashcard-empty-icon"><BookOpenCheck size={19} /></div><strong>Your flashcards will appear here.</strong><span>Generate notes first, then use them to review key ideas.</span><button className="text-arrow" onClick={() => onNavigate('notes')}>Open notes <ArrowRight size={14} /></button></div>}</section>

      <div className="revision-footer-note"><span>✳</span> Revision follows your saved materials and the answers you actually recorded.</div>
    </div>
  );
}
