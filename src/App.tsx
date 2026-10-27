import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpenCheck, Menu, Moon, Sun } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import AppSidebar from './components/AppSidebar';
import Dashboard from './pages/Dashboard';
import JourneyStart, { type MaterialStartMode } from './pages/JourneyStart';
import Materials from './pages/Materials';
import Notes from './pages/Notes';
import Practice from './pages/Practice';
import Revision from './pages/Revision';
import StudyRoom from './pages/StudyRoom';
import Tutor from './pages/Tutor';
import { loadOrCreateCloudWorkspace, saveCloudWorkspace } from './lib/cloud-state';
import {
  createId, loadLearningState, resetLearningState, saveLearningState
} from './lib/storage';
import {
  beginExistingGoogleSignIn, beginGoogleIdentityLink, ensureAnonymousUser,
  hasSupabaseConfig, isGoogleLinked, supabase
} from './lib/supabase';
import { makeDemoState, makeEmptyState, demoMaterial } from './seed';
import type { LearningState, QuizAttempt, StudyMaterial, StudyNote, StudyTab, ViewKey } from './types';

type ColorMode = 'light' | 'dark';
type CloudStatus = 'connecting' | 'synced' | 'syncing' | 'local' | 'offline';
const COLOR_MODE_KEY = 'learnloop-color-mode';
const cloudStatusLabels: Record<CloudStatus, string> = {
  connecting: 'OPENING YOUR DESK', synced: 'SAVED TO CLOUD', syncing: 'SAVING',
  local: 'SAVED ON THIS DEVICE', offline: 'OFFLINE · SAVED HERE'
};
const pageTitles: Record<ViewKey, string> = {
  journey: 'Start your journey', dashboard: 'Home', study: 'Study thread',
  materials: 'Library', notes: 'Notes', tutor: 'Tutor', practice: 'Practice', revision: 'Revision'
};

function getInitialColorMode(): ColorMode {
  try {
    const saved = window.localStorage.getItem(COLOR_MODE_KEY);
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.dataset.theme = saved;
      return saved;
    }
  } catch { /* Fall through to the system choice. */ }
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = preferred;
  return preferred;
}

function downloadWorkspace(state: LearningState): void {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), format: 'learnloop-workspace-v1', workspace: state }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `learnloop-backup-${date}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function newStudyTab(material: StudyMaterial): StudyTab {
  const now = new Date().toISOString();
  return {
    id: createId('tab'), title: material.title, subject: material.subject,
    materialId: material.id, createdAt: material.createdAt || now, lastOpenedAt: now, status: 'active'
  };
}

export default function App() {
  const [state, setState] = useState<LearningState>(() => hasSupabaseConfig ? makeEmptyState() : loadLearningState());
  const [view, setView] = useState<ViewKey>(() => hasSupabaseConfig || !loadLearningState().onboardingComplete ? 'journey' : 'dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [colorMode, setColorMode] = useState<ColorMode>(() => getInitialColorMode());
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(hasSupabaseConfig ? 'connecting' : 'local');
  const [cloudReady, setCloudReady] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [materialStartMode, setMaterialStartMode] = useState<MaterialStartMode>('upload');
  const cloudStatusRef = useRef<CloudStatus>(cloudStatus);
  const authUserIdRef = useRef<string | null>(null);
  const initialHydrationDoneRef = useRef(false);

  const googleLinked = isGoogleLinked(authUser);

  useEffect(() => { cloudStatusRef.current = cloudStatus; }, [cloudStatus]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setCloudStatus('local');
      setCloudReady(true);
      initialHydrationDoneRef.current = true;
      return;
    }

    let mounted = true;
    let generation = 0;
    let initialAuthResolved = false;

    const hydrate = async (userId: string) => {
      const thisGeneration = ++generation;
      setCloudReady(false);
      setCloudStatus('connecting');
      cloudStatusRef.current = 'connecting';
      try {
        const result = await loadOrCreateCloudWorkspace(loadLearningState(userId), userId);
        if (!mounted || thisGeneration !== generation) return;
        authUserIdRef.current = result.userId ?? userId;
        const { data: userResult } = await supabase!.auth.getUser();
        setAuthUser(userResult.user);
        setState(result.state);
        saveLearningState(result.state, result.userId ?? userId);
        setView(result.state.onboardingComplete ? 'dashboard' : 'journey');
        setCloudStatus(result.connected ? 'synced' : 'local');
        cloudStatusRef.current = result.connected ? 'synced' : 'local';
      } catch (error) {
        if (!mounted || thisGeneration !== generation) return;
        const localState = loadLearningState(userId);
        authUserIdRef.current = userId;
        setState(localState);
        setView(localState.onboardingComplete ? 'dashboard' : 'journey');
        setCloudStatus('offline');
        cloudStatusRef.current = 'offline';
        setToast(error instanceof Error ? `${error.message} Your browser copy is still available.` : 'Cloud sync is not ready. Your browser copy is still available.');
      } finally {
        if (mounted && thisGeneration === generation) {
          initialAuthResolved = true;
          initialHydrationDoneRef.current = true;
          setCloudReady(true);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      if (!initialAuthResolved || !initialHydrationDoneRef.current) return;
      const nextId = user?.id ?? null;
      if (nextId === authUserIdRef.current) return;
      authUserIdRef.current = nextId;
      if (!nextId) {
        setCloudStatus('local');
        cloudStatusRef.current = 'local';
        setCloudReady(true);
        return;
      }
      // Avoid calling Supabase Auth again inside its auth-state callback lock.
      window.setTimeout(() => { if (mounted) void hydrate(nextId); }, 0);
    });

    void (async () => {
      try {
        const user = await ensureAnonymousUser();
        if (!mounted) return;
        setAuthUser(user);
        await hydrate(user.id);
      } catch (error) {
        if (!mounted) return;
        const localState = loadLearningState();
        setState(localState);
        setView(localState.onboardingComplete ? 'dashboard' : 'journey');
        setCloudStatus('offline');
        cloudStatusRef.current = 'offline';
        initialAuthResolved = true;
        initialHydrationDoneRef.current = true;
        setCloudReady(true);
        setToast(error instanceof Error ? `${error.message} Your browser copy is still available.` : 'Cloud sync is not ready. Your browser copy is still available.');
      }
    })();

    return () => {
      mounted = false;
      generation += 1;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!cloudReady) return;
    saveLearningState(state, authUser?.id);
    if (cloudStatusRef.current !== 'synced' && cloudStatusRef.current !== 'syncing') return;
    const expectedUserId = authUser?.id;
    const timeout = window.setTimeout(async () => {
      cloudStatusRef.current = 'syncing';
      setCloudStatus('syncing');
      try {
        await saveCloudWorkspace(state, expectedUserId);
        cloudStatusRef.current = 'synced';
        setCloudStatus('synced');
      } catch {
        cloudStatusRef.current = 'offline';
        setCloudStatus('offline');
        setToast('Cloud save paused. Your copy is still saved on this device.');
      }
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [state, cloudReady, authUser?.id]);

  useEffect(() => { document.documentElement.dataset.theme = colorMode; }, [colorMode]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const activeTab = useMemo(() =>
    state.studyTabs.find((tab) => tab.id === state.activeStudyTabId) ??
    state.studyTabs.find((tab) => tab.status === 'active') ??
    state.studyTabs.find((tab) => tab.materialId === state.activeMaterialId) ?? null,
    [state.activeStudyTabId, state.activeMaterialId, state.studyTabs]
  );
  const activeMaterial = useMemo(() =>
    state.materials.find((material) => material.id === (activeTab?.materialId ?? state.activeMaterialId)) ??
    state.materials[0] ?? demoMaterial,
    [activeTab?.materialId, state.activeMaterialId, state.materials]
  );
  const activeNote = state.notes.find((note) => note.materialId === activeMaterial.id);

  const navigate = (next: ViewKey) => {
    setView(next);
    setMobileNavOpen(false);
    setAuthError('');
  };

  const toggleColorMode = () => {
    const nextMode = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(nextMode);
    try { window.localStorage.setItem(COLOR_MODE_KEY, nextMode); } catch { /* Theme still applies for this session. */ }
  };

  const startNewStudy = () => {
    setMaterialStartMode('upload');
    navigate('materials');
  };

  const addMaterial = (material: StudyMaterial, nextView: ViewKey = 'study') => {
    const tab = newStudyTab(material);
    const activity = {
      id: createId('activity'), title: `Started · ${material.title}`, subject: material.subject,
      materialId: material.id, createdAt: new Date().toISOString()
    };
    setState((current) => ({
      ...current,
      materials: [material, ...current.materials],
      sessions: [activity, ...current.sessions],
      studyTabs: [tab, ...current.studyTabs],
      activeMaterialId: material.id,
      activeStudyTabId: tab.id,
      onboardingComplete: true
    }));
    navigate(nextView);
    setToast('New study tab opened. Start with the step that feels useful.');
  };

  const addSample = () => {
    const sample = makeDemoState();
    setState(sample);
    setView('study');
    setToast('Sample lesson opened. Its example activity is clearly labeled.');
  };

  const saveNote = (note: StudyNote) => {
    const createdAt = new Date().toISOString();
    setState((current) => ({
      ...current,
      notes: [note, ...current.notes.filter((item) => item.materialId !== note.materialId)],
      sessions: [{ id: createId('activity'), title: `Notes · ${note.title}`, subject: activeMaterial.subject, materialId: note.materialId, createdAt }, ...current.sessions]
    }));
    setToast('Notes saved to this study thread.');
  };

  const recordActivity = (title: string, material = activeMaterial) => {
    setState((current) => ({
      ...current,
      sessions: [{ id: createId('activity'), title, subject: material.subject, materialId: material.id, createdAt: new Date().toISOString() }, ...current.sessions]
    }));
  };

  const recordAttempt = (attempt: QuizAttempt) => {
    setState((current) => ({
      ...current,
      attempts: [attempt, ...current.attempts],
      sessions: attempt.isFollowUp ? current.sessions : [{
        id: createId('activity'), title: `Practice · ${attempt.concept}`,
        subject: activeMaterial.subject, materialId: activeMaterial.id, createdAt: attempt.createdAt
      }, ...current.sessions]
    }));
  };

  const openStudyTab = (tab: StudyTab) => {
    const now = new Date().toISOString();
    setState((current) => ({ ...current, activeMaterialId: tab.materialId, activeStudyTabId: tab.id,
      studyTabs: current.studyTabs.map((item) => item.id === tab.id ? { ...item, lastOpenedAt: now } : item) }));
    navigate('study');
  };

  const openMaterial = (materialId: string) => {
    const found = state.studyTabs.find((tab) => tab.materialId === materialId && tab.status === 'active') ??
      state.studyTabs.find((tab) => tab.materialId === materialId);
    if (found) {
      if (found.status === 'completed') restoreStudyTab(found.id);
      else openStudyTab(found);
      return;
    }
    const material = state.materials.find((item) => item.id === materialId);
    if (!material) return;
    const tab = newStudyTab(material);
    setState((current) => ({ ...current, studyTabs: [tab, ...current.studyTabs], activeMaterialId: material.id, activeStudyTabId: tab.id }));
    navigate('study');
  };

  const selectMaterial = (materialId: string) => {
    const found = state.studyTabs.find((tab) => tab.materialId === materialId);
    setState((current) => ({ ...current, activeMaterialId: materialId, activeStudyTabId: found?.id ?? current.activeStudyTabId }));
  };

  const finishStudyTab = (tabId: string) => {
    const now = new Date().toISOString();
    setState((current) => {
      const tab = current.studyTabs.find((item) => item.id === tabId);
      if (!tab || tab.status === 'completed') return current;
      return {
        ...current,
        studyTabs: current.studyTabs.map((item) => item.id === tabId ? { ...item, status: 'completed', completedAt: now } : item),
        activeStudyTabId: current.activeStudyTabId
      };
    });
    if (view === 'study' && state.activeStudyTabId === tabId) setView('dashboard');
    setToast('Moved to Completed. Your source, notes, and answers are still saved.');
  };

  const reopenStudyTabInPlace = (tabId: string) => {
    setState((current) => {
      const tab = current.studyTabs.find((item) => item.id === tabId);
      if (!tab) return current;
      return {
        ...current,
        studyTabs: current.studyTabs.map((item) => item.id === tabId ? { ...item, status: 'active', completedAt: undefined, lastOpenedAt: new Date().toISOString() } : item),
        activeStudyTabId: tab.id,
        activeMaterialId: tab.materialId
      };
    });
  };

  const restoreStudyTab = (tabId: string) => {
    reopenStudyTabInPlace(tabId);
    setView('study');
    setMobileNavOpen(false);
    setToast('Study tab restored to Active.');
  };

  const mergeStudyTabs = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const source = state.studyTabs.find((tab) => tab.id === sourceId && tab.status === 'active');
    const target = state.studyTabs.find((tab) => tab.id === targetId && tab.status === 'active');
    if (!source || !target) return;
    const groupId = target.groupId ?? source.groupId ?? createId('group');
    const includedGroups = new Set([source.groupId, target.groupId].filter(Boolean));
    setState((current) => ({
      ...current,
      studyTabs: current.studyTabs.map((tab) =>
        tab.id === sourceId || tab.id === targetId || (tab.groupId && includedGroups.has(tab.groupId))
          ? { ...tab, groupId }
          : tab
      )
    }));
    setToast('Study tabs grouped. Their sources and answer histories remain separate.');
  };

  const splitStudyGroup = (groupId: string) => {
    setState((current) => ({
      ...current,
      studyTabs: current.studyTabs.map((tab) => tab.groupId === groupId ? { ...tab, groupId: undefined } : tab)
    }));
    setToast('Study tabs separated into their own threads.');
  };

  const clearWorkspace = () => {
    if (!window.confirm('Clear this workspace? Its study tabs, materials, notes, and answer history will be removed from this account and this browser. Download a backup first if you may need these items.')) return;
    setState(resetLearningState(authUser?.id));
    setView('journey');
    setToast('Your study desk is clear. Start a new journey whenever you are ready.');
  };

  const startGoogleLink = async () => {
    setAuthError('');
    setAuthBusy(true);
    try { await beginGoogleIdentityLink(); }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in could not start.';
      setAuthError(/already|identity|linked/i.test(message)
        ? 'That Google identity is already connected to another workspace. Use “Already have an account? Sign in” to switch without merging.'
        : `${message} Your current study space has not been replaced.`);
    } finally { setAuthBusy(false); }
  };

  const startGoogleSwitch = async () => {
    setAuthError('');
    const confirmed = window.confirm('You are switching to a Google-linked workspace. Your current workspace will not be merged; its saved local and cloud copy will stay under its current account. Continue to Google sign-in?');
    if (!confirmed) return;
    setAuthBusy(true);
    try {
      saveLearningState(state, authUser?.id);
      if (authUser?.id && (cloudStatus === 'synced' || cloudStatus === 'syncing')) {
        await saveCloudWorkspace(state, authUser.id);
      }
      await beginExistingGoogleSignIn();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Google sign-in could not start. Your current study space remains available.');
      setAuthBusy(false);
    }
  };

  const renderPage = () => {
    switch (view) {
      case 'journey':
        return <JourneyStart onStart={(mode) => { setMaterialStartMode(mode); navigate('materials'); }} onTrySample={addSample} hasCloud={hasSupabaseConfig} googleLinked={googleLinked} googleEmail={authUser?.email} authBusy={authBusy} authError={authError} onGoogleLink={() => void startGoogleLink()} onNavigate={navigate} />;
      case 'dashboard':
        return <Dashboard state={state} onNavigate={navigate} onOpenMaterial={openMaterial} onStartNew={startNewStudy} />;
      case 'study':
        return activeTab ? <StudyRoom tab={activeTab} material={activeMaterial} note={activeNote} onNavigate={navigate} onFinish={() => finishStudyTab(activeTab.id)} />
          : <section className="empty-state"><h2>No active study tab.</h2><p>Finished tabs are kept in Completed. Restore one or start a new study.</p><button className="button button-primary" onClick={startNewStudy}>Start a new study <ArrowRight size={15} /></button></section>;
      case 'materials':
        return <Materials materials={state.materials} activeMaterialId={activeMaterial.id} initialMode={materialStartMode} onAddMaterial={addMaterial} onSelectMaterial={(id) => openMaterial(id)} onNavigate={navigate} />;
      case 'notes':
        return <Notes material={activeMaterial} note={activeNote} materials={state.materials} onSelectMaterial={selectMaterial} onSaveNote={saveNote} onNavigate={navigate} />;
      case 'tutor':
        return <Tutor material={activeMaterial} onRecordSession={(title) => recordActivity(`Tutor · ${title}`)} />;
      case 'practice':
        return <Practice material={activeMaterial} onRecordAttempt={recordAttempt} onRecordSession={(title) => recordActivity(title)} onCompleteSession={() => { if (activeTab) finishStudyTab(activeTab.id); }} onReopenSession={() => { if (activeTab) reopenStudyTabInPlace(activeTab.id); }} />;
      case 'revision':
        return <Revision state={state} onNavigate={navigate} />;
      default:
        return <Dashboard state={state} onNavigate={navigate} onOpenMaterial={openMaterial} onStartNew={startNewStudy} />;
    }
  };

  const topbarStatus = googleLinked ? `GOOGLE · ${authUser?.email ?? 'CONNECTED'}` : cloudStatusLabels[cloudStatus];
  const profileText = googleLinked ? authUser?.email?.slice(0, 1).toUpperCase() ?? 'G' : 'YOU';

  return (
    <div className="app-frame">
      <AppSidebar
        state={state} view={view} activeStudyTabId={state.activeStudyTabId} mobileOpen={mobileNavOpen}
        hasCloud={hasSupabaseConfig}
        googleLinked={googleLinked} googleEmail={authUser?.email} authBusy={authBusy} authError={authError}
        onCloseMobile={() => setMobileNavOpen(false)} onNavigate={navigate} onStartNew={startNewStudy}
        onOpenTab={openStudyTab} onMergeTabs={mergeStudyTabs} onSplitGroup={splitStudyGroup}
        onFinishTab={finishStudyTab} onRestoreTab={restoreStudyTab}
        onGoogleLink={() => void startGoogleLink()} onGoogleSwitch={() => void startGoogleSwitch()}
        onExport={() => { downloadWorkspace(state); setToast('Workspace backup downloaded to your device.'); }}
        onClearWorkspace={clearWorkspace}
      />

      <main className="main-shell">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" aria-label="Open study navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <div className="topbar-crumb"><span>Learnloop</span><span className="crumb-slash">/</span><strong>{pageTitles[view]}</strong></div>
          <div className="topbar-right">
            <span className={`cloud-pill cloud-${cloudStatus}`} role="status" aria-live="polite" title={googleLinked ? `Linked with ${authUser?.email ?? 'Google'}` : 'Anonymous and browser-local work is not recoverable across devices until a Google identity is linked.'}><span className="demo-pill-dot" />{topbarStatus}</span>
            <button className="theme-toggle" type="button" onClick={toggleColorMode} aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{colorMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            <div className="topbar-divider" />
            <div className="avatar avatar-top" aria-label={googleLinked ? `Signed in as ${authUser?.email ?? 'Google account'}` : 'Anonymous study workspace'} title={googleLinked ? authUser?.email : 'Anonymous study workspace'}>{profileText}</div>
          </div>
        </header>

        <div className="page-content" key={view} aria-busy={!cloudReady}>
          {cloudReady ? renderPage() : <div className="workspace-loading" role="status"><span className="loading-rule" /><div><strong>Opening your study desk…</strong><span>Getting the right saved workspace in place before you start.</span></div></div>}
        </div>
        <footer className="prototype-footer"><span>Learnloop · Level 1 beta</span><span>Learning follows your answers, not a guessed mastery score.</span></footer>
      </main>

      {toast && <div className="toast" role="status"><BookOpenCheck size={17} />{toast}<ArrowRight size={15} /></div>}
    </div>
  );
}
