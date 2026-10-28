import { makeEmptyState } from '../seed';
import type { LearningState, StudyMaterial, StudyTab } from '../types';

const LEGACY_STORAGE_KEY = 'learnloop.level0.v1';
const STORAGE_PREFIX = 'learnloop.workspace.v1.';
const LEGACY_MIGRATED_KEY = 'learnloop.legacy-workspace-migrated.v1';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeWorkspace(value: unknown): LearningState {
  if (!isObject(value)) return makeEmptyState();
  const candidate = value as Partial<LearningState>;
  if (!Array.isArray(candidate.materials) || !Array.isArray(candidate.attempts)) return makeEmptyState();
  const materials = candidate.materials as StudyMaterial[];
  const notes = Array.isArray(candidate.notes) ? candidate.notes : [];
  const attempts = candidate.attempts;
  const tutorExchanges = Array.isArray(candidate.tutorExchanges) ? candidate.tutorExchanges : [];
  const sessions = Array.isArray(candidate.sessions) ? candidate.sessions : [];
  if (typeof candidate.onboardingComplete !== 'boolean' && materials.length > 0 && materials.every((material) => material.origin === 'sample')) {
    return makeEmptyState();
  }
  const suppliedTabs = Array.isArray(candidate.studyTabs) ? candidate.studyTabs as StudyTab[] : null;
  const defaultTabs: StudyTab[] = materials.map((material) => ({
    id: `legacy-tab-${material.id}`,
    title: material.title,
    subject: material.subject,
    materialId: material.id,
    createdAt: material.createdAt,
    lastOpenedAt: material.createdAt,
    status: 'active'
  }));
  const studyTabs: StudyTab[] = (suppliedTabs ?? defaultTabs).filter((tab) =>
    isObject(tab) && typeof tab.id === 'string' && typeof tab.materialId === 'string' &&
    materials.some((material) => material.id === tab.materialId)
  );

  const activeMaterialId = typeof candidate.activeMaterialId === 'string' &&
    materials.some((material) => material.id === candidate.activeMaterialId)
    ? candidate.activeMaterialId
    : materials[0]?.id ?? '';
  const validActiveTab = typeof candidate.activeStudyTabId === 'string' &&
    studyTabs.some((tab) => tab.id === candidate.activeStudyTabId);
  const activeStudyTabId = validActiveTab
    ? candidate.activeStudyTabId as string
    : studyTabs.find((tab) => tab.status === 'active' && tab.materialId === activeMaterialId)?.id ??
      studyTabs.find((tab) => tab.status === 'active')?.id ?? null;

  return {
    materials,
    notes,
    attempts,
    tutorExchanges,
    sessions,
    studyTabs: studyTabs.map((tab) => {
      const material = materials.find((item) => item.id === tab.materialId);
      const createdAt = typeof tab.createdAt === 'string' ? tab.createdAt : material?.createdAt ?? new Date().toISOString();
      return {
        ...tab,
        title: typeof tab.title === 'string' ? tab.title : material?.title ?? 'Study session',
        subject: typeof tab.subject === 'string' ? tab.subject : material?.subject ?? 'Study session',
        createdAt,
        lastOpenedAt: typeof tab.lastOpenedAt === 'string' ? tab.lastOpenedAt : createdAt,
        status: tab.status === 'completed' ? 'completed' as const : 'active' as const,
        groupId: typeof tab.groupId === 'string' ? tab.groupId : undefined,
        completedAt: typeof tab.completedAt === 'string' ? tab.completedAt : undefined
      };
    }),
    activeMaterialId,
    activeStudyTabId,
    onboardingComplete: typeof candidate.onboardingComplete === 'boolean'
      ? candidate.onboardingComplete
      : materials.some((material) => material.origin !== 'sample')
  };
}

function userStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function safeRead(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

export function normalizeLearningState(value: unknown): LearningState {
  return normalizeWorkspace(value);
}

/** Without an ID, read the pre-cloud local workspace. An ID-scoped cache never reads another user's data. */
export function loadLearningState(userId?: string | null): LearningState {
  if (typeof window === 'undefined') return makeEmptyState();
  if (userId) {
    const userSaved = safeRead(userStorageKey(userId));
    if (userSaved) {
      try { return normalizeWorkspace(JSON.parse(userSaved)); } catch { return makeEmptyState(); }
    }
    if (safeRead(LEGACY_MIGRATED_KEY) === '1') return makeEmptyState();
  }
  const stored = safeRead(LEGACY_STORAGE_KEY);
  if (!stored) return makeEmptyState();
  try { return normalizeWorkspace(JSON.parse(stored)); } catch { return makeEmptyState(); }
}

export function saveLearningState(state: LearningState, userId?: string | null): void {
  try {
    if (userId) {
      window.localStorage.setItem(userStorageKey(userId), JSON.stringify(state));
      window.localStorage.setItem(LEGACY_MIGRATED_KEY, '1');
      return;
    }
    window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The current session still works if browser storage is full or unavailable.
  }
}

export function resetLearningState(userId?: string | null): LearningState {
  const fresh = makeEmptyState();
  saveLearningState(fresh, userId);
  return fresh;
}

export function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;
}
