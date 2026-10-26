import {
  ArrowRight, ArrowUpRight, BookOpen, Check, ChevronRight, Clock3, FileText,
  ClipboardCheck, Flame, NotebookPen, Target, TriangleAlert, Trophy, Zap
} from 'lucide-react';
import type { LearningState, StudyMaterial, ViewKey } from '../types';

interface Props {
  state: LearningState;
  material: StudyMaterial;
  onNavigate: (view: ViewKey) => void;
}

function weakTopics(state: LearningState): string[] {
  const latestByConcept = new Map<string, LearningState['attempts'][number]>();
  [...state.attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((attempt) => latestByConcept.set(attempt.concept, attempt));
  return [...latestByConcept.values()].filter((attempt) => !attempt.isCorrect).map((attempt) => attempt.concept);
}

function relativeTime(date: string): string {
  const age = Date.now() - new Date(date).getTime();
  if (age < 60 * 60 * 1000) return 'Just now';
  const hours = Math.floor(age / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export default function Dashboard({ state, material, onNavigate }: Props) {
  const revisits = weakTopics(state);
  const followUps = state.attempts.filter((attempt) => attempt.isFollowUp);
  const improved = followUps.filter((attempt) => attempt.isCorrect).length;
  const sessions = [...state.sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const recentAttempts = [...state.attempts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const date = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  const stats = [
    { label: 'Study materials', value: state.materials.length, note: 'in your library', icon: BookOpen, color: 'mint' },
    { label: 'Question attempts', value: state.attempts.length, note: 'recorded so far', icon: Zap, color: 'yellow' },
    { label: 'Follow-ups improved', value: improved, note: followUps.length ? `out of ${followUps.length} retests` : 'no retests yet', icon: Trophy, color: 'lilac' },
    { label: 'Topics to revisit', value: revisits.length, note: revisits.length ? 'based on your answers' : 'nothing flagged yet', icon: Target, color: 'peach' }
  ];

  return (
    <div className="dashboard-page">
      <div className="page-intro dashboard-intro">
        <div><p className="eyebrow">{date} · YOUR STUDY DESK</p><h1>{greeting}<span className="greeting-period">.</span></h1><p className="intro-copy">Pick up one useful thread. The rest can wait.</p></div>
        <button className="button button-outline new-session-btn" onClick={() => onNavigate('materials')}><span className="button-plus">+</span> New study session</button>
      </div>

      <section className="hero-card">
        <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" /><div className="hero-sun" />
        <div className="hero-copy">
          <div className="hero-kicker"><span className="sparkle-mini">01 / 03</span> THE PART THAT MATTERS</div>
          <h2>Get curious about<br />the answer you missed.</h2>
          <p>Try it. Notice what got tangled.<br className="desktop-break" /> Take another run at the same idea.</p>
          <button className="button button-lime" onClick={() => onNavigate('practice')}>Take a quick check <ArrowRight size={16} /></button>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <div className="study-path-line path-line-one" /><div className="study-path-line path-line-two" />
          <div className="field-slip field-slip-source"><span>01 / READ</span><strong>Start with the source</strong><em>What’s on the page</em></div>
          <div className="field-slip field-slip-clue"><span>02 / NOTICE</span><strong>Find the snag</strong><em>A clue, not a verdict</em></div>
          <div className="field-slip field-slip-retry"><span>03 / TRY AGAIN</span><strong>Same idea. New angle.</strong><em>Your next question</em></div>
          <div className="field-stamp">FIELD NOTE<br />NO. 03</div>
        </div>
        <div className="hero-corner-label">THE STUDY CYCLE, YOUR WAY</div>
      </section>

      <section className="stats-grid" aria-label="Learning activity from recorded demo data">
        {stats.map(({ label, value, note, icon: Icon, color }) => (
          <article className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><Icon size={17} strokeWidth={2} /></div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-note">{note}</div>
          </article>
        ))}
      </section>

      <div className="dashboard-lower-grid">
        <section className="panel continue-panel">
          <div className="panel-heading"><div><p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h3>Your learning desk</h3></div><button className="quiet-icon-link" aria-label="Open study material" onClick={() => onNavigate('materials')}><ArrowUpRight size={17} /></button></div>
          <div className="desk-card">
            <div className="desk-cover"><span className="cover-overline">PHYSICS · MECHANICS</span><div className="cover-graphic"><span className="cover-circle" /><span className="cover-line line-one" /><span className="cover-line line-two" /><span className="cover-dot" /></div><span className="cover-title">FORCES<br />IN MOTION</span></div>
            <div className="desk-info"><div className="desk-status"><span className="status-dot" /> IN PROGRESS</div><h4>{material.title}</h4><p>Make the connection between force, mass, and acceleration.</p><div className="desk-meta"><span><FileText size={14} /> {state.notes.some((note) => note.materialId === material.id) ? 'Notes ready' : 'Notes not made yet'}</span><span><Clock3 size={14} /> Your source material</span></div><div className="desk-actions"><button className="button button-primary button-small" onClick={() => onNavigate('practice')}>Resume session <ArrowRight size={15} /></button><button className="text-button" onClick={() => onNavigate('notes')}>View notes</button></div></div>
          </div>
        </section>

        <section className="panel next-panel">
          <div className="panel-heading"><div><p className="eyebrow">A GOOD NEXT STEP</p><h3>Keep the loop going</h3></div><div className="panel-star">✳</div></div>
          {revisits.length > 0 ? (
            <div className="next-focus">
              <div className="focus-symbol"><TriangleAlert size={19} /></div>
              <div className="focus-label">WORTH ANOTHER LOOK</div>
              <h4>{revisits[0]}</h4>
              <p>Your recent answer suggests this concept could use one more example.</p>
              <button className="text-arrow" onClick={() => onNavigate('revision')}>Open revision plan <ChevronRight size={16} /></button>
            </div>
          ) : (
            <div className="next-focus next-focus-clear"><div className="focus-symbol"><Check size={19} /></div><div className="focus-label">LOOKING GOOD</div><h4>No weak topics flagged.</h4><p>Complete a practice question and your next steps will come from your answers.</p><button className="text-arrow" onClick={() => onNavigate('practice')}>Try a practice question <ChevronRight size={16} /></button></div>
          )}
          <div className="next-footnote"><Flame size={14} /> Your plan changes as you practice—not from a made-up mastery score.</div>
        </section>
      </div>

      <section className="panel activity-panel">
        <div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h3>What you’ve been working on</h3></div><button className="text-arrow activity-link" onClick={() => onNavigate('revision')}>See your revision plan <ChevronRight size={16} /></button></div>
        <div className="activity-list">
          {sessions.map((session, index) => (
            <div className="activity-row" key={session.id}><div className={`activity-icon activity-${index % 3}`}>{index === 0 ? <ClipboardCheck size={17} /> : index === 1 ? <BookOpen size={17} /> : <NotebookPen size={17} />}</div><div className="activity-copy"><strong>{session.title}</strong><span>{session.subject}</span></div><span className="activity-time"><Clock3 size={13} /> {relativeTime(session.createdAt)}</span><button className="activity-open" aria-label={`Open ${session.title}`} onClick={() => onNavigate(session.title.toLowerCase().includes('note') ? 'notes' : 'practice')}><ChevronRight size={17} /></button></div>
          ))}
          {sessions.length === 0 && <div className="empty-activity">Your study sessions will appear here after you add material or practice.</div>}
        </div>
      </section>

      <section className="panel answer-history-panel">
        <div className="panel-heading"><div><p className="eyebrow">ANSWERS YOU’VE RECORDED</p><h3>Recent question history</h3></div><button className="text-arrow activity-link" onClick={() => onNavigate('revision')}>Open revision plan <ChevronRight size={16} /></button></div>
        <div className="answer-history-list">
          {recentAttempts.length ? recentAttempts.map((attempt) => <div className="answer-history-row" key={attempt.id}><div className={`history-verdict ${attempt.isCorrect ? 'history-correct' : 'history-incorrect'}`}>{attempt.isCorrect ? <Check size={15} /> : <TriangleAlert size={15} />}</div><div className="history-question-copy"><strong>{attempt.question}</strong><span>{attempt.concept} · {attempt.isFollowUp ? 'Follow-up check' : 'Practice question'}</span><span className="history-answer">Your answer: {attempt.selectedText}</span>{!attempt.isCorrect && <em>Answer: {attempt.correctText}</em>}</div><span className="activity-time"><Clock3 size={13} /> {relativeTime(attempt.createdAt)}</span></div>) : <div className="empty-activity">Your answers and corrections will appear here after practice.</div>}
        </div>
      </section>

      <div className="dashboard-bottom-cta"><div className="bottom-cta-symbol"><FileText size={19} /></div><div><strong>Have a new chapter to study?</strong><span>Drop in your material and start a fresh loop.</span></div><button className="button button-outline button-small" onClick={() => onNavigate('materials')}>Add material <ArrowRight size={15} /></button></div>
    </div>
  );
}
