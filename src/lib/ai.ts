import type { AIMisconception, AIExplanation, NoteSection, QuizQuestion, StudyMaterial, StudyNote } from '../types';
import { createId } from './storage';
import { ensureAnonymousUser, supabase } from './supabase';

type AITask = 'notes' | 'tutor' | 'quiz' | 'diagnose';
interface AIEnvelope { content?: string; error?: string }

async function getEdgeFunctionError(error: unknown): Promise<string> {
  const candidate = error as { message?: string; context?: unknown };
  if (candidate.context instanceof Response) {
    try {
      const body = await candidate.context.clone().json() as { error?: string; message?: string };
      if (body.error || body.message) return body.error || body.message || 'The tutor could not complete that request.';
    } catch {
      // The platform can return a non-JSON gateway error; use the safe client message below.
    }
  }
  return candidate.message || 'The tutor service could not be reached. Your saved work is still here.';
}

async function requestEnvelope(task: AITask, context: unknown): Promise<AIEnvelope> {
  if (supabase) {
    await ensureAnonymousUser();
    const { data, error } = await supabase.functions.invoke<AIEnvelope>('tutor', {
      body: { task, context }
    });
    if (error) throw new Error(await getEdgeFunctionError(error));
    if (!data || typeof data.content !== 'string') throw new Error(data?.error || 'The tutor returned an empty response.');
    return data;
  }

  const response = await fetch(`${import.meta.env.BASE_URL}api/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, context })
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    if (import.meta.env.PROD) {
      throw new Error('Live AI is not configured for this static site yet. Add the Supabase URL and publishable key, then deploy the tutor Edge Function; the sample practice still works.');
    }
    throw new Error('The tutor service returned an unexpected response. Please try again.');
  }
  const result = await response.json() as AIEnvelope;
  if (!response.ok || result.error) throw new Error(result.error || 'The tutor could not complete that request.');
  if (!result.content) throw new Error('The tutor returned an empty response. Please try again.');
  return result;
}

async function requestJson<T>(task: AITask, context: unknown): Promise<T> {
  const envelope = await requestEnvelope(task, context);
  const cleaned = envelope.content!.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error('The tutor response was not in a usable format. Please try once more.');
  try {
    return JSON.parse(cleaned.slice(first, last + 1)) as T;
  } catch {
    throw new Error('The tutor returned an incomplete response. Please try again.');
  }
}

function materialContext(material: StudyMaterial) {
  return {
    title: material.title,
    subject: material.subject,
    sourceText: material.body.slice(0, 12_000),
    sources: material.sourcePages.map((source) => `p. ${source.page}: ${source.excerpt}`)
  };
}

export async function generateNotes(material: StudyMaterial): Promise<StudyNote> {
  const generated = await requestJson<{
    title: string;
    summary: string;
    sections: NoteSection[];
    confusions: string[];
  }>('notes', materialContext(material));
  if (!generated.title || !generated.summary || !Array.isArray(generated.sections)) {
    throw new Error('The note response is missing required sections. Please try again.');
  }
  return {
    id: createId('note'), materialId: material.id, title: generated.title,
    summary: generated.summary, sections: generated.sections,
    confusions: Array.isArray(generated.confusions) ? generated.confusions : [],
    createdAt: new Date().toISOString()
  };
}

export async function explainConcept(material: StudyMaterial, question: string): Promise<AIExplanation> {
  const result = await requestJson<AIExplanation>('tutor', {
    ...materialContext(material), question
  });
  if (!result.answer || !Array.isArray(result.steps)) throw new Error('The tutor response is incomplete. Please try again.');
  return result;
}

export async function generateQuizQuestion(material: StudyMaterial, topic: string): Promise<Omit<QuizQuestion, 'id'>> {
  const result = await requestJson<Omit<QuizQuestion, 'id'>>('quiz', {
    ...materialContext(material), topic
  });
  validateQuestion(result);
  return result;
}

export async function analyzeMistake(
  material: StudyMaterial,
  question: string,
  concept: string,
  choices: QuizQuestion['choices'],
  correctId: string,
  selectedId: string,
  reasoning: string
): Promise<AIMisconception> {
  const result = await requestJson<AIMisconception>('diagnose', {
    ...materialContext(material), question, concept, choices, correctId, selectedId,
    studentReasoning: reasoning || 'No reasoning provided. Treat any explanation of the student\'s thinking as a tentative hypothesis.'
  });
  if (!result.hypothesis || !result.reteach || !result.followup) {
    throw new Error('The mistake analysis is incomplete. Please try again.');
  }
  validateQuestion(result.followup);
  return {
    ...result,
    confidence: result.confidence === 'medium' ? 'medium' : 'low',
    concept,
    followup: { ...result.followup, concept }
  };
}

function validateQuestion(question: Omit<QuizQuestion, 'id'>): void {
  if (!question.question || !Array.isArray(question.choices) || question.choices.length !== 4) {
    throw new Error('The quiz question needs four answer choices. Please try again.');
  }
  if (!question.choices.some((choice) => choice.id === question.correctId)) {
    throw new Error('The quiz answer key was not valid. Please generate another question.');
  }
}
