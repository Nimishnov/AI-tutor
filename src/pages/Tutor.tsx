import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight, BookOpenText, Check, CircleHelp, FileText, Lightbulb,
  LoaderCircle, MessageCircle, RotateCcw, Send, Sparkles, WandSparkles
} from 'lucide-react';
import { explainConcept } from '../lib/ai';
import type { AIExplanation, StudyMaterial, ViewKey } from '../types';

interface Props {
  material: StudyMaterial;
  onRecordSession: (title: string) => void;
  onNavigate: (view: ViewKey) => void;
}

interface TutorTurn {
  id: string;
  question: string;
  answer?: AIExplanation;
  error?: string;
}

const prompts = [
  'Why does a heavier object accelerate less if I push it just as hard?',
  'Do forces make an object move, or change how it moves?',
  'Why don’t action and reaction forces cancel each other out?'
];

export default function Tutor({ material, onRecordSession, onNavigate }: Props) {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<TutorTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, 'helped' | 'again'>>({});

  useEffect(() => { setTurns([]); setQuestion(''); setFeedback({}); }, [material.id]);

  const ask = async (text: string) => {
    const clean = text.trim();
    if (!clean || pending) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setQuestion('');
    setPending(true);
    setTurns((current) => [...current, { id, question: clean }]);
    onRecordSession(clean.slice(0, 56));
    try {
      const answer = await explainConcept(material, clean);
      setTurns((current) => current.map((turn) => turn.id === id ? { ...turn, answer } : turn));
    } catch (error) {
      setTurns((current) => current.map((turn) => turn.id === id ? {
        ...turn,
        error: error instanceof Error ? error.message : 'The tutor could not answer just now.'
      } : turn));
    } finally {
      setPending(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(question);
  };

  return (
    <div className="tutor-page page-stack">
      <div className="page-intro"><div><p className="eyebrow">A PATIENT EXPLANATION, ON DEMAND</p><h1>Let’s work through it.</h1><p className="intro-copy">Ask the why, the how, or the part that still feels fuzzy.</p></div><div className="page-intro-ornament tutor-ornament"><WandSparkles size={25} /></div></div>

      <div className="tutor-layout">
        <section className="tutor-main panel">
          <div className="tutor-context"><div className="tutor-context-icon"><BookOpenText size={17} /></div><div><span>ANSWERING WITH YOUR MATERIAL</span><strong>{material.title}</strong></div><span className="context-dot" /></div>
          <div className="chat-thread">
            <div className="tutor-welcome"><div className="tutor-avatar"><Sparkles size={17} /></div><div className="welcome-message"><span className="tutor-name">The tutor <span>· no question too small</span></span><p>Let’s find the bit that feels slippery. I’ll use this source first and flag any extra explanation.</p><div className="welcome-source"><FileText size={13} /> Working from: {material.title}</div></div></div>
            {turns.map((turn) => <div className="chat-turn" key={turn.id}>
              <div className="student-question"><span>{turn.question}</span><div className="avatar avatar-chat">YOU</div></div>
              {turn.answer ? <div className="tutor-answer"><div className="tutor-avatar"><Sparkles size={16} /></div><div className="answer-body"><span className="tutor-name">The tutor <span>· an explanation</span></span><p className="answer-lead">{turn.answer.answer}</p>{turn.answer.steps.length > 0 && <div className="step-list">{turn.answer.steps.map((step, index) => <div className="tutor-step" key={`${index}-${step.slice(0, 18)}`}><span className="step-number">{index + 1}</span><p>{step}</p></div>)}</div>}<div className="example-box"><div className="example-box-title"><Lightbulb size={14} /> Try this picture</div><p>{turn.answer.example}</p></div><div className="answer-source"><FileText size={13} /><span>{turn.answer.sourceStatus || 'Source-based explanation'}</span></div><div className="answer-feedback"><span>{feedback[turn.id] === 'helped' ? 'Good. We’ll build from here.' : feedback[turn.id] === 'again' ? 'Fair. Try asking for another example.' : 'Did that land?'}</span><button type="button" aria-pressed={feedback[turn.id] === 'helped'} onClick={() => setFeedback((current) => ({ ...current, [turn.id]: current[turn.id] === 'helped' ? 'again' : 'helped' }))}><Check size={13} /> {feedback[turn.id] === 'helped' ? 'Got it' : 'That helped'}</button><button type="button" aria-pressed={feedback[turn.id] === 'again'} onClick={() => { setFeedback((current) => ({ ...current, [turn.id]: 'again' })); setQuestion(`Can you explain this another way? ${turn.question}`); }}><RotateCcw size={13} /> Try again</button></div></div></div> : turn.error ? <div className="tutor-error"><CircleHelp size={17} /><div><strong>That answer didn’t come through.</strong><span>{turn.error}</span><button className="text-button" onClick={() => void ask(turn.question)}>Try that again <ArrowRight size={13} /></button></div></div> : <div className="typing-row"><span /><span /><span /> Thinking it through…</div>}
            </div>)}
          </div>

          {!turns.length && <div className="suggested-questions"><div className="suggestions-label">SOME PLACES TO START</div>{prompts.map((prompt, index) => <button className="suggestion-chip" key={prompt} onClick={() => void ask(prompt)} disabled={pending}><span className={`suggestion-number suggestion-${index}`}>0{index + 1}</span>{prompt}<ArrowRight size={14} /></button>)}</div>}

          <form className="tutor-composer" onSubmit={submit}><div className="composer-wrap"><MessageCircle size={17} /><input aria-label="Ask your tutor a question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a follow-up or tell me what’s confusing…" disabled={pending} /><button className="send-button" type="submit" disabled={pending || !question.trim()} aria-label="Send question">{pending ? <LoaderCircle className="spin" size={17} /> : <Send size={16} />}</button></div><div className="composer-hint"><span><Sparkles size={12} /> Try a different example if you’re still unsure.</span><span>Enter to send</span></div></form>
        </section>

        <aside className="tutor-side">
          <section className="tutor-side-card source-card"><div className="side-card-icon source-card-icon"><FileText size={17} /></div><p className="eyebrow">YOUR ACTIVE SOURCE</p><h3>{material.title}</h3><p>{material.subject}</p><div className="source-rule" /><div className="source-detail"><span>Material snippets</span><strong>{material.sourcePages.length || 1} reference{material.sourcePages.length === 1 ? '' : 's'}</strong></div><div className="source-detail"><span>Origin</span><strong>{material.origin === 'sample' ? 'Sample material' : material.origin === 'pdf' ? 'PDF upload' : 'Pasted text'}</strong></div><div className="source-grounding"><Check size={13} /> Source comes first</div></section>
          <section className="tutor-side-card support-card"><div className="support-top"><div className="side-card-icon support-icon"><Lightbulb size={16} /></div><span>HOW THIS WORKS</span></div><h3>Questions are welcome here.</h3><p>The tutor uses your material as its starting point and labels extra context. Ask it to rephrase or try another example any time.</p><div className="support-tag"><span className="support-tag-dot" /> No judgement. Just another way in.</div></section>
          <div className="tutor-nudge"><div className="nudge-star">✳</div><span>Something still unclear after practice?</span><button onClick={() => onNavigate('practice')}>Try a question <ArrowRight size={13} /></button></div>
        </aside>
      </div>
    </div>
  );
}
