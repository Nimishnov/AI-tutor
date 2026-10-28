import { ArrowRight, BookOpen, Check, Clock3, FileText, NotebookPen, Target, TriangleAlert, Zap } from 'lucide-react';
import type { LearningSession, LearningState, ViewKey } from '../types';

interface Props {
  state: LearningState;
  onNavigate: (view: ViewKey) => void;
  onOpenActivity: (activity: LearningSession) => void;
  onStartNew: () => void;
}

function weakTopics(state: LearningState): string[] {
  const latestByConcept = new Map<string, LearningState['attempts'][number]>();
  [...state.attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach((attempt) => latestByConcept.set(attempt.concept, attempt));
  return [...latestByConcept.values()].filter((attempt) => !attempt.isCorrect).map((attempt) => attempt.concept);
}

function relativeTime(date: string): string {
  const age = Math.max(0, Date.now() - new Date(date).getTime());
  if (age < 60 * 60 * 1000) return 'Just now';
  const hours = Math.floor(age / (60 * 60 * 1000));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

export default function Dashboard({ state, onNavigate, onOpenActivity, onStartNew }: Props) {
  const weak = weakTopics(state);
  const followups = state.attempts.filter((attempt) => attempt.isFollowUp);
  const improved = followups.filter((attempt) => attempt.isCorrect).length;
  const recent = [...state.sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const stats = [
    { label: 'Study materials', value: state.materials.length, icon: BookOpen },
    { label: 'Questions tried', value: state.attempts.length, icon: Zap },
    { label: 'Follow-ups right', value: `${improved} / ${followups.length}`, icon: Check },
    { label: 'Topics to revisit', value: weak.length, icon: Target }
  ];
  const displayDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="dashboard-page page-stack">
      <header className="dashboard-heading"><div><p className="eyebrow">{displayDate} · YOUR STUDY DESK</p><h1>Home</h1><p>Just the useful bits from your recent work.</p></div><button type="button" className="button button-primary" onClick={onStartNew}>New study <ArrowRight size={16} /></button></header>
      <section className="dashboard-stats" aria-label="Recorded study activity">
        {stats.map(({ label, value, icon: Icon }, index) => <article className={`dashboard-stat dashboard-stat-${index}`} key={label}><span className="dashboard-stat-icon"><Icon size={19} /></span><strong>{value}</strong><span>{label}</span></article>)}
      </section>
      <section className="dashboard-recent panel" aria-labelledby="recent-heading">
        <div className="dashboard-section-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2 id="recent-heading">Your recent work</h2></div><button type="button" className="quiet-link" onClick={() => onNavigate('revision')}>Open revision <ArrowRight size={15} /></button></div>
        {recent.length ? <div className="dashboard-recent-list">{recent.map((item, index) => {
          const source = state.materials.find((entry) => entry.id === item.materialId);
          const hasNotes = state.notes.some((note) => note.materialId === item.materialId);
          const hasTutorExchange = Boolean(item.tutorExchangeId && state.tutorExchanges.some((exchange) => exchange.id === item.tutorExchangeId));
          const activityDestination = item.destination === 'tutor'
            ? hasTutorExchange ? 'Reopen this Tutor exchange' : 'Open Tutor · older exchange unavailable'
            : item.destination === 'practice' ? 'Open Practice for this topic' : source?.title ?? item.subject;
          return <button type="button" className="dashboard-recent-row" key={item.id} onClick={() => onOpenActivity(item)}>
            <span className={`recent-row-icon recent-row-icon-${index % 3}`}>{item.title.toLowerCase().includes('tutor') ? <NotebookPen size={18} /> : item.title.toLowerCase().includes('practice') || item.title.toLowerCase().includes('reteach') ? <Target size={18} /> : <FileText size={18} />}</span>
            <span className="recent-row-copy"><strong>{item.title}</strong><span>{activityDestination}{hasNotes && item.destination !== 'tutor' ? ' · Notes ready' : ''}</span></span>
            <span className="recent-row-time"><Clock3 size={14} />{relativeTime(item.createdAt)}</span><ArrowRight size={16} className="recent-row-arrow" />
          </button>;
        })}</div> : <div className="dashboard-empty-recent"><span className="empty-note-mark"><TriangleAlert size={18} /></span><div><strong>No recent activity yet.</strong><span>Start a study thread and your work will show up here.</span></div><button type="button" className="quiet-link" onClick={onStartNew}>Add material <ArrowRight size={15} /></button></div>}
      </section>
      <p className="dashboard-footnote">These counts reflect recorded activity only. No streaks or mastery score are inferred.</p>
    </div>
  );
}
