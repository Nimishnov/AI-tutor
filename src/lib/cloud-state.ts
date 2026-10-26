import type { LearningState } from '../types';
import { ensureAnonymousUser, supabase } from './supabase';

export interface CloudWorkspaceResult {
  state: LearningState;
  connected: boolean;
}

function isLearningState(value: unknown): value is LearningState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.materials)
    && Array.isArray(candidate.notes)
    && Array.isArray(candidate.attempts)
    && Array.isArray(candidate.sessions)
    && typeof candidate.activeMaterialId === 'string';
}

export async function loadOrCreateCloudWorkspace(localState: LearningState): Promise<CloudWorkspaceResult> {
  if (!supabase) return { state: localState, connected: false };

  const user = await ensureAnonymousUser();
  const { data, error } = await supabase
    .from('learning_workspaces')
    .select('state')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(`Could not load your saved workspace: ${error.message}`);
  if (data) {
    if (!isLearningState(data.state)) throw new Error('The saved workspace has an unexpected format. Your browser copy has been kept.');
    return { state: data.state, connected: true };
  }

  const { error: saveError } = await supabase
    .from('learning_workspaces')
    .upsert({
      user_id: user.id,
      state: localState,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (saveError) throw new Error(`Could not start cloud sync: ${saveError.message}`);
  return { state: localState, connected: true };
}

export async function saveCloudWorkspace(state: LearningState): Promise<void> {
  if (!supabase) return;

  const user = await ensureAnonymousUser();
  const { error } = await supabase
    .from('learning_workspaces')
    .upsert({
      user_id: user.id,
      state,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) throw new Error(`Cloud save failed: ${error.message}`);
}
