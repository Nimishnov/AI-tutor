import type { LearningState } from '../types';
import { ensureAnonymousUser, supabase } from './supabase';
import { normalizeLearningState } from './storage';

export interface CloudWorkspaceResult {
  state: LearningState;
  connected: boolean;
  userId?: string;
}

function isWorkspaceShape(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.materials)
    && Array.isArray(candidate.notes)
    && Array.isArray(candidate.attempts)
    && Array.isArray(candidate.sessions)
    && typeof candidate.activeMaterialId === 'string';
}

export async function loadOrCreateCloudWorkspace(localState: LearningState, expectedUserId?: string): Promise<CloudWorkspaceResult> {
  if (!supabase) return { state: normalizeLearningState(localState), connected: false };

  const user = await ensureAnonymousUser();
  if (expectedUserId && user.id !== expectedUserId) throw new Error('The signed-in account changed while the workspace was opening.');
  const { data, error } = await supabase
    .from('learning_workspaces')
    .select('state')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(`Could not load your saved workspace: ${error.message}`);
  if (data) {
    if (!isWorkspaceShape(data.state)) throw new Error('The saved workspace has an unexpected format. Your browser copy has been kept.');
    return { state: normalizeLearningState(data.state), connected: true, userId: user.id };
  }

  const state = normalizeLearningState(localState);
  const { error: saveError } = await supabase
    .from('learning_workspaces')
    .upsert({ user_id: user.id, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

  if (saveError) throw new Error(`Could not start cloud sync: ${saveError.message}`);
  return { state, connected: true, userId: user.id };
}

export async function saveCloudWorkspace(state: LearningState, expectedUserId?: string): Promise<void> {
  if (!supabase) return;

  const user = await ensureAnonymousUser();
  if (expectedUserId && user.id !== expectedUserId) throw new Error('The signed-in account changed before this save finished.');
  const { error } = await supabase
    .from('learning_workspaces')
    .upsert({ user_id: user.id, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

  if (error) throw new Error(`Cloud save failed: ${error.message}`);
}
