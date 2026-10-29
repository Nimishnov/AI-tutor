import { useEffect, useState } from 'react';
import {
  ArrowRight, Check, ChevronRight, CircleHelp, FileText, Lightbulb,
  BookOpenText, LoaderCircle, RotateCcw, Target, X
} from 'lucide-react';
import { analyzeMistake, generateQuizQuestion } from '../lib/ai';
import { createId } from '../lib/storage';
import { demoMaterialId, firstQuestion } from '../seed';
import type { AIMisconception, QuizAttempt, QuizQuestion, StudyMaterial } from '../types';

interface Props {
  material: StudyMaterial;
  previousQuestions: string[];
  onRecordAttempt: (attempt: QuizAttempt) => void;
  onRecordSession: (title: string) => void;
  onCompleteSession: () => void;
  onReopenSession: () => void;
}

type QuizStage = 'ready' | 'pick' | 'answered' | 'reteach' | 'followup-answered';

function asQuestion(value: Omit<QuizQuestion, 'id'>, isFollowUp = false): QuizQuestion {
  return { ...value, id: createId('question'), isFollowUp };
}

export default function Practice({ material, previousQuestions, onRecordAttempt, onRecordSession, onCompleteSession, onReopenSession }: Props) {
  const [question, setQuestion] = useState<QuizQuestion | null>(material.id === demoMaterialId ? firstQuestion : null);
  const [stage, setStage] = useState<QuizStage>(material.id === demoMaterialId ? 'pick' : 'ready');
  const [selected, setSelected] = useState('');
  const [analysis, setAnalysis] = useState<AIMisconception | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [initialWasWrong, setInitialWasWrong] = useState(false);

  useEffect(() => {
    setQuestion(material.id === demoMaterialId ? firstQuestion : null);
    setStage(material.id === demoMaterialId ? 'pick' : 'ready');
    setSelected(''); setAnalysis(null); setError(''); setReasoning(''); setInitialWasWrong(false);
  }, [material.id]);

  const correctChoice = question?.choices.find((choice) => choice.id === question.correctId);
  const answeredCorrectly = selected === question?.correctId;

  const buildQuiz = async (topic = '') => {
    onReopenSession();
    setBusy(true); setError('');
    try {
      const generated = await generateQuizQuestion(material, topic || material.title, previousQuestions);
      setQuestion(asQuestion(generated)); setStage('pick'); setSelected(''); setAnalysis(null); setReasoning('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'A question could not be generated.');
    } finally { setBusy(false); }
  };

  const recordResponse = (current: QuizQuestion, choiceId: string) => {
    const choice = current.choices.find((item) => item.id === choiceId);
    const answer = current.choices.find((item) => item.id === current.correctId);
    const isCorrect = choiceId === current.correctId;
    const now = new Date().toISOString();
    onRecordAttempt({
      id: createId('attempt'), materialId: material.id, question: current.question, concept: current.concept,
      selectedId: choiceId, selectedText: choice?.text ?? 'No answer selected',
      correctId: current.correctId, correctText: answer?.text ?? 'Answer unavailable',
      isCorrect, isFollowUp: Boolean(current.isFollowUp), createdAt: now
    });
    if (current.isFollowUp) {
      setStage('followup-answered');
    } else {
      setStage('answered'); setInitialWasWrong(!isCorrect);
    }
  };

  const submitAnswer = () => {
    if (!selected || !question) return;
    recordResponse(question, selected);
  };

  const requestReteach = async () => {
    if (!question) return;
    setBusy(true); setError('');
    try {
      const result = await analyzeMistake(material, question.question, question.concept, question.choices, question.correctId, selected, reasoning.trim());
      setAnalysis(result); setQuestion(asQuestion(result.followup, true)); setSelected(''); setStage('reteach');
      onRecordSession(`Reteach · ${result.concept}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The tutor could not analyse that response.');
    } finally { setBusy(false); }
  };

  if (stage === 'ready' || !question) {
    return <div className="practice-page page-stack"><div className="page-intro"><div><p className="eyebrow">PRACTICE MAKES THE IDEA YOURS</p><h1>Try it, then learn from it.</h1><p className="intro-copy">A question from your own material is a good place to start.</p></div><div className="page-intro-ornament practice-ornament"><Target size={25} /></div></div><section className="quiz-empty panel"><div className="quiz-ready-mark"><BookOpenText size={19} /></div><p className="eyebrow">MAKE IT YOURS</p><h2>Build a question from {material.title}.</h2><p>The tutor will make a four-choice question based on your material. Your answer helps decide what to teach next.</p><button className="button button-primary" disabled={busy} onClick={() => void buildQuiz()}>{busy ? <><LoaderCircle className="spin" size={16} /> Writing a fair question…</> : <>Generate a question <ArrowRight size={15} /></>}</button>{error && <div className="inline-error" role="alert">{error}</div>}<div className="empty-source"><FileText size={14} /> Questions are based on: <strong>{material.title}</strong></div></section></div>;
  }

  const isFollowUp = Boolean(question.isFollowUp);
  const showFollowupResult = stage === 'followup-answered';
  const showInitialResult = stage === 'answered';

  return (
    <div className="practice-page page-stack">
      <div className="page-intro"><div><p className="eyebrow">PRACTICE MAKES THE IDEA YOURS</p><h1>Try it, then learn from it.</h1><p className="intro-copy">Your answer shapes the next explanation. No score without a reason.</p></div><div className="page-intro-ornament practice-ornament"><Target size={25} /></div></div>

      <div className="practice-progress"><div className="loop-steps"><div className="loop-step is-current"><span>01</span><strong>Try</strong></div><i /><div className={`loop-step ${stage === 'reteach' || showFollowupResult ? 'is-current' : ''}`}><span>02</span><strong>Understand</strong></div><i /><div className={`loop-step ${showFollowupResult ? 'is-current' : ''}`}><span>03</span><strong>Try again</strong></div></div><div className="source-chip"><FileText size={13} /> {material.title}</div></div>

      <div className="practice-layout">
        <section className="quiz-card panel">
          <div className="quiz-topline"><div className="quiz-type"><span className="quiz-icon"><Target size={15} /></span><span>{isFollowUp ? 'SAME IDEA · A NEW QUESTION' : 'QUICK CHECK'}</span></div><span className="question-counter">{isFollowUp ? 'FOLLOW-UP' : '01'} <span>·</span> {question.concept}</span></div>
          {stage !== 'reteach' && <h2 className="quiz-question">{question.question}</h2>}
          {stage !== 'reteach' && <div className="choice-list" role="radiogroup" aria-label="Answer choices">
            {question.choices.map((choice) => {
              const isRight = (showInitialResult || showFollowupResult) && choice.id === question.correctId;
              const isWrongSelected = (showInitialResult || showFollowupResult) && selected === choice.id && !answeredCorrectly;
              return <button key={choice.id} role="radio" aria-checked={selected === choice.id} disabled={showInitialResult || showFollowupResult} className={`choice-option ${selected === choice.id && stage !== 'answered' && stage !== 'followup-answered' ? 'choice-selected' : ''} ${isRight ? 'choice-correct' : ''} ${isWrongSelected ? 'choice-wrong' : ''}`} onClick={() => setSelected(choice.id)}><span className="choice-letter">{choice.id}</span><span>{choice.text}</span><span className="choice-state">{isRight ? <Check size={16} /> : isWrongSelected ? <X size={16} /> : selected === choice.id ? <Check size={15} /> : null}</span></button>;
            })}
          </div>}

          {stage === 'pick' && <div className="quiz-submit-row"><span className="quiz-source-citation"><FileText size={13} /> {question.sourceCitation || 'From your study material'}</span><button className="button button-primary" onClick={submitAnswer} disabled={!selected}>Check my answer <ArrowRight size={15} /></button></div>}

          {showInitialResult && <div className={`answer-feedback-card ${answeredCorrectly ? 'feedback-correct' : 'feedback-incorrect'}`}><div className="feedback-heading">{answeredCorrectly ? <><span className="feedback-check"><Check size={14} /></span> You’ve got it.</> : <><span className="feedback-x"><X size={14} /></span> Not quite — let’s see why.</>}</div><p>{question.explanation}</p>{!answeredCorrectly && <><div className="correct-answer-note"><span>The answer is</span><strong>{correctChoice?.id} · {correctChoice?.text}</strong></div><label className="field-label reasoning-label" htmlFor="reasoning">What were you thinking? <span>Optional — makes reteaching more specific</span></label><textarea id="reasoning" className="text-area reasoning-textarea" value={reasoning} onChange={(event) => setReasoning(event.target.value)} placeholder="I thought the force should…" rows={2} maxLength={500} /><button className="button button-primary button-reteach" onClick={() => void requestReteach()} disabled={busy}>{busy ? <><LoaderCircle className="spin" size={15} /> Finding another way to explain it…</> : <><Lightbulb size={15} /> Help me understand this <ArrowRight size={15} /></>}</button>{error && <div className="inline-error" role="alert">{error}</div>}</>}</div>}

          {showInitialResult && answeredCorrectly && <div className="quiz-submit-row"><span className="quiz-source-citation"><Check size={13} /> Answer saved. This session stays active.</span><div className="practice-result-actions"><button className="button button-outline" onClick={onCompleteSession}>Finish this session</button><button className="button button-primary" onClick={() => void buildQuiz(question.concept)} disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <RotateCcw size={15} />} Try another question <ArrowRight size={14} /></button></div></div>}

          {stage === 'reteach' && analysis && <div className="reteach-card"><div className="reteach-header"><div className="reteach-icon"><Lightbulb size={18} /></div><div><span className="eyebrow">A DIFFERENT WAY TO SEE IT</span><h3>Let’s try another explanation.</h3></div></div><div className="hypothesis-box"><span className="hypothesis-label"><CircleHelp size={13} /> A possibility, not a certainty <span className={`confidence-label confidence-${analysis.confidence}`}>{analysis.confidence} confidence</span></span><p>{analysis.hypothesis}</p><span className="hypothesis-foot">A wrong answer alone doesn’t tell us exactly what you were thinking.</span></div><div className="reteach-copy"><p>{analysis.reteach}</p><div className="reteach-example"><div><BookOpenText size={14} /> A different example</div><p>{analysis.example}</p></div></div><div className="followup-banner"><div className="followup-number">02</div><div><span>NOW TEST THE SAME CONCEPT</span><strong>{analysis.concept}</strong></div><ChevronRight size={18} /></div><h4 className="followup-question">{question.question}</h4><div className="choice-list followup-choices" role="radiogroup" aria-label="Follow-up answer choices">{question.choices.map((choice) => <button key={choice.id} role="radio" aria-checked={selected === choice.id} className={`choice-option ${selected === choice.id ? 'choice-selected' : ''}`} onClick={() => setSelected(choice.id)}><span className="choice-letter">{choice.id}</span><span>{choice.text}</span><span className="choice-state">{selected === choice.id ? <Check size={15} /> : null}</span></button>)}</div><div className="quiz-submit-row followup-submit"><span className="quiz-source-citation"><FileText size={13} /> Same concept, new question</span><button className="button button-primary" onClick={() => selected && recordResponse(question, selected)} disabled={!selected}>Check follow-up <ArrowRight size={15} /></button></div></div>}

          {showFollowupResult && <div className={`answer-feedback-card followup-result ${answeredCorrectly ? 'feedback-correct' : 'feedback-incorrect'}`}><div className="feedback-heading">{answeredCorrectly ? <><span className="feedback-check"><Check size={14} /></span> {initialWasWrong ? 'The new explanation helped.' : 'You got the follow-up right.'}</> : <><span className="feedback-x"><X size={14} /></span> Still working on this one? That’s okay.</>}</div><p>{question.explanation}</p><div className="improvement-summary"><div className="improvement-symbol">{answeredCorrectly ? <Check size={16} /> : <RotateCcw size={16} />}</div><span>{answeredCorrectly && initialWasWrong ? 'First try missed it. Follow-up was correct. That improvement is recorded.' : answeredCorrectly ? 'Follow-up answer recorded as correct.' : 'Follow-up answer recorded. This topic will stay on your revision list.'}</span></div><div className="followup-actions"><button className="button button-primary" onClick={() => void buildQuiz(question.concept)} disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <RotateCcw size={15} />} Practice this concept again</button><button className="button button-outline" onClick={onCompleteSession}>Finish this session</button><span className="quiz-source-citation"><FileText size={13} /> {question.sourceCitation || 'From your study material'}</span></div></div>}
        </section>

      </div>
    </div>
  );
}
