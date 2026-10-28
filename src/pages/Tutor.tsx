import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  ArrowRight, BookOpenText, Check, CircleHelp, FileText, Lightbulb,
  LoaderCircle, MessageCircle, MessageCircleQuestion, RotateCcw, Send
} from 'lucide-react';
import { explainConcept } from '../lib/ai';
import { createId } from '../lib/storage';
import type { StudyMaterial, TutorExchange } from '../types';

interface Props {
  material: StudyMaterial;
  exchanges: TutorExchange[];
  focusExchangeId: string | null;
  onRecordSession: (title: string, exchangeId: string) => void;
  onSaveExchange: (exchange: TutorExchange) => void;
}

const prompts = [
  'Explain the main idea in simpler words.',
  'Can you walk through one example?',
  'What do I need to know beyond this source?'
];

export default function Tutor({ material, exchanges, focusExchangeId, onRecordSession, onSaveExchange }: Props) {
  const [question, setQuestion] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'helped' | 'again'>>({});
  const focusRef = useRef<HTMLDivElement>(null);
  const turns = exchanges.filter((exchange) => exchange.materialId === material.id);

  useEffect(() => {
    setQuestion('');
    setFeedback({});
  }, [material.id]);

  useEffect(() => {
    if (!focusExchangeId || !focusRef.current) return;
    const timeout = window.setTimeout(() => focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    return () => window.clearTimeout(timeout);
  }, [focusExchangeId, material.id, turns.length]);

  const runExchange = async (exchange: TutorExchange) => {
    setPendingId(exchange.id);
    onSaveExchange({ ...exchange, answer: undefined, error: undefined });
    try {
      const answer = await explainConcept(material, exchange.question);
      onSaveExchange({ ...exchange, answer, error: undefined });
    } catch (error) {
      onSaveExchange({
        ...exchange,
        error: error instanceof Error ? error.message : 'The tutor could not answer just now.'
      });
    } finally {
      setPendingId(null);
    }
  };

  const ask = (text: string) => {
    const clean = text.trim();
    if (!clean || pendingId) return;
    const exchange: TutorExchange = {
      id: createId('tutor'), materialId: material.id,
      question: clean, createdAt: new Date().toISOString()
    };
    setQuestion('');
    onSaveExchange(exchange);
    onRecordSession(clean.slice(0, 56), exchange.id);
    void runExchange(exchange);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    ask(question);
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      ask(question);
    }
  };

  return (
    <div className="tutor-page page-stack">
      <div className="page-intro"><div><p className="eyebrow">TUTOR</p><h1>Let’s work through it.</h1><p className="intro-copy">Ask about your material—or ask a wider question. I’ll tell you which is which.</p></div><div className="page-intro-ornament tutor-ornament"><MessageCircleQuestion size={25} /></div></div>

      <div className="tutor-layout">
        <section className="tutor-main panel">
          <div className="tutor-context"><div className="tutor-context-icon"><BookOpenText size={17} /></div><div><span>STUDYING FROM</span><strong>{material.title}</strong></div></div>
          <div className="chat-thread" aria-live="polite">
            <div className="tutor-welcome"><div className="tutor-avatar"><BookOpenText size={17} /></div><div className="welcome-message"><span className="tutor-name">Tutor</span><p>I’ll use this source first. If I draw on general knowledge, I’ll label it clearly.</p><div className="welcome-source"><FileText size={13} /> {material.title}</div></div></div>
            {turns.map((turn) => <div className={`chat-turn ${turn.id === focusExchangeId ? 'chat-turn-focused' : ''}`} key={turn.id} ref={turn.id === focusExchangeId ? focusRef : undefined}>
              <div className="student-question"><span>{turn.question}</span><div className="avatar avatar-chat">YOU</div></div>
              {turn.answer ? <div className="tutor-answer"><div className="tutor-avatar"><BookOpenText size={16} /></div><div className="answer-body"><span className="tutor-name">Tutor</span><p className="answer-lead">{turn.answer.answer}</p>{turn.answer.steps.length > 0 && <div className="step-list">{turn.answer.steps.map((step, index) => <div className="tutor-step" key={`${index}-${step.slice(0, 18)}`}><span className="step-number">{index + 1}</span><p>{step}</p></div>)}</div>}<div className="example-box"><div className="example-box-title"><Lightbulb size={14} /> Example</div><p>{turn.answer.example}</p></div><div className="answer-source"><FileText size={13} /><span>{turn.answer.sourceStatus || 'General explanation; source relationship not specified.'}</span></div><div className="answer-feedback"><span>{feedback[turn.id] === 'helped' ? 'Good. We’ll build from here.' : feedback[turn.id] === 'again' ? 'Try asking for another example.' : 'Did that help?'}</span><button type="button" aria-pressed={feedback[turn.id] === 'helped'} onClick={() => setFeedback((current) => ({ ...current, [turn.id]: current[turn.id] === 'helped' ? 'again' : 'helped' }))}><Check size={13} /> {feedback[turn.id] === 'helped' ? 'Got it' : 'That helped'}</button><button type="button" aria-pressed={feedback[turn.id] === 'again'} onClick={() => { setFeedback((current) => ({ ...current, [turn.id]: 'again' })); setQuestion(`Can you explain this another way? ${turn.question}`); }}><RotateCcw size={13} /> Try again</button></div></div></div> : turn.error ? <div className="tutor-error"><CircleHelp size={17} /><div><strong>That answer didn’t come through.</strong><span>{turn.error}</span><button className="text-button" onClick={() => void runExchange(turn)}>Try that again <ArrowRight size={13} /></button></div></div> : pendingId === turn.id ? <div className="typing-row"><span /><span /><span /> Thinking it through…</div> : <div className="tutor-error"><CircleHelp size={17} /><div><strong>This answer was interrupted.</strong><span>Your question is saved. Ask it again when you’re ready.</span><button className="text-button" onClick={() => void runExchange(turn)}>Get the answer <ArrowRight size={13} /></button></div></div>}
            </div>)}
          </div>

          {!turns.length && <div className="suggested-questions"><div className="suggestions-label">A FEW WAYS TO START</div>{prompts.map((prompt, index) => <button className="suggestion-chip" key={prompt} onClick={() => ask(prompt)} disabled={Boolean(pendingId)}><span className={`suggestion-number suggestion-${index}`}>0{index + 1}</span>{prompt}<ArrowRight size={14} /></button>)}</div>}

          <form className="tutor-composer" onSubmit={submit}><div className="composer-wrap"><MessageCircle size={17} /><input aria-label="Ask your tutor a question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={onComposerKeyDown} placeholder="Ask about the source or anything else…" disabled={Boolean(pendingId)} /><button className="send-button" type="submit" disabled={Boolean(pendingId) || !question.trim()} aria-label="Send question">{pendingId ? <LoaderCircle className="spin" size={17} /> : <Send size={16} />}</button></div><div className="composer-hint"><span><Lightbulb size={12} /> The tutor labels when it goes beyond your material.</span><span>Enter sends</span></div></form>
        </section>
      </div>
    </div>
  );
}
