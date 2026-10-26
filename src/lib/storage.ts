import { makeDemoState } from '../seed';
import type { LearningState } from '../types';

const STORAGE_KEY = 'learnloop.level0.v1';

export function loadLearningState(): LearningState {
  if (typeof window === 'undefined') return makeDemoState();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return makeDemoState();
    const parsed = JSON.parse(stored) as Partial<LearningState>;
    if (!Array.isArray(parsed.materials) || !Array.isArray(parsed.attempts)) return makeDemoState();
    return {
      materials: parsed.materials,
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      attempts: parsed.attempts,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      activeMaterialId: typeof parsed.activeMaterialId === 'string'
        ? parsed.activeMaterialId
        : parsed.materials[0]?.id ?? ''
    };
  } catch {
    return makeDemoState();
  }
}

export function saveLearningState(state: LearningState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The current session still works if browser storage is full or unavailable.
  }
}

export function resetLearningState(): LearningState {
  const fresh = makeDemoState();
  saveLearningState(fresh);
  return fresh;
}

export function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;
}
