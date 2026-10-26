import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, BookOpenCheck, Brain, ClipboardCheck, FileStack, LayoutDashboard,
  Moon, NotebookPen, RotateCcw, Sparkles, GraduationCap, Menu, Sun, X
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Notes from './pages/Notes';
import Tutor from './pages/Tutor';
import Practice from './pages/Practice';
import Revision from './pages/Revision';
import { createId, loadLearningState, resetLearningState, saveLearningState } from './lib/storage';
import { loadOrCreateCloudWorkspace, saveCloudWorkspace } from './lib/cloud-state';
import { hasSupabaseConfig } from './lib/supabase';
import { demoMaterial } from './seed';
import type { LearningState, QuizAttempt, StudyMaterial, StudyNote, ViewKey } from './types';

const navItems: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { key: 'materials', label: 'Study material', icon: FileStack },
  { key: 'notes', label: 'My notes', icon: NotebookPen },
  { key: 'tutor', label: 'Ask the tutor', icon: Brain },
  { key: 'practice', label: 'Practice', icon: ClipboardCheck },
  { key: 'revision', label: 'Revision', icon: RotateCcw }
];

const pageTitles: Record<ViewKey, string> = {
  dashboard: 'Overview', materials: 'Study material', notes: 'My notes',
  tutor: 'Ask the tutor', practice: 'Practice room', revision: 'Revision'
};

type ColorMode = 'light' | 'dark';
const COLOR_MODE_KEY = 'learnloop-color-mode';
type CloudStatus = 'connecting' | 'synced' | 'syncing' | 'local' | 'offline';

const cloudStatusLabels: Record<CloudStatus, string> = {
  connecting: 'CONNECTING', synced: 'SAVED TO CLOUD', syncing: 'SAVING',
  local: 'LOCAL MODE', offline: 'OFFLINE · SAVED HERE'
};

function getInitialColorMode(): ColorMode {
  try {
    const saved = window.localStorage.getItem(COLOR_MODE_KEY);
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.dataset.theme = saved;
      return saved;
    }
  } catch {
    // Fall back to the system preference when storage is unavailable.
  }
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = preferred;
  return preferred;
}

export default function App() {
  const [state, setState] = useState<LearningState>(() => loadLearningState());
  const [view, setView] = useState<ViewKey>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [colorMode, setColorMode] = useState<ColorMode>(() => getInitialColorMode());
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(hasSupabaseConfig ? 'connecting' : 'local');
  const [cloudReady, setCloudReady] = useState(false);
  const cloudStatusRef = useRef(cloudStatus);

  useEffect(() => {
    cloudStatusRef.current = cloudStatus;
  }, [cloudStatus]);
  useEffect(() => {
    let active = true;
    if (!hasSupabaseConfig) {
      setCloudStatus('local');
      setCloudReady(true);
      return () => { active = false; };
    }
    loadOrCreateCloudWorkspace(loadLearningState()).then(({ state: workspace }) => {
      if (!active) return;
      setState(workspace);
      setCloudStatus('synced');
      setCloudReady(true);
    }).catch((error: unknown) => {
      if (!active) return;
      setCloudStatus('offline');
      setCloudReady(true);
      setToast(error instanceof Error
        ? 'Cloud sync is not ready. Your work is still saved on this browser.'
        : 'Cloud sync is offline. Your work is still saved on this browser.');
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!cloudReady) return;
    saveLearningState(state);
    if (cloudStatusRef.current !== 'synced' && cloudStatusRef.current !== 'syncing') return;
    const timeout = window.setTimeout(async () => {
      cloudStatusRef.current = 'syncing';
      setCloudStatus('syncing');
      try {
        await saveCloudWorkspace(state);
        cloudStatusRef.current = 'synced';
        setCloudStatus('synced');
      } catch {
        cloudStatusRef.current = 'offline';
        setCloudStatus('offline');
        setToast('Cloud save paused. Your local copy is safe on this browser.');
      }
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [state, cloudReady]);
  useEffect(() => {
    document.documentElement.dataset.theme = colorMode;
  }, [colorMode]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const toggleColorMode = () => {
    const nextMode = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(nextMode);
    try { window.localStorage.setItem(COLOR_MODE_KEY, nextMode); } catch { /* Theme still applies for this session. */ }
  };

  const activeMaterial = useMemo(() =>
    state.materials.find((material) => material.id === state.activeMaterialId) ?? state.materials[0] ?? demoMaterial,
    [state.activeMaterialId, state.materials]
  );

  const addMaterial = (material: StudyMaterial, nextView: ViewKey = 'notes') => {
    setState((current) => ({
      ...current,
      materials: [material, ...current.materials],
      activeMaterialId: material.id,
      sessions: [{
        id: createId('session'), title: `Started · ${material.title}`, subject: material.subject,
        materialId: material.id, createdAt: new Date().toISOString()
      }, ...current.sessions]
    }));
    setView(nextView);
    setToast('Material saved in this browser. Create notes or start a tutor session.');
  };

  const saveNote = (note: StudyNote) => {
    setState((current) => ({
      ...current,
      notes: [note, ...current.notes.filter((item) => item.materialId !== note.materialId)]
    }));
    setToast('Your notes are saved in this browser.');
  };

  const recordAttempt = (attempt: QuizAttempt) => {
    setState((current) => ({
      ...current,
      attempts: [attempt, ...current.attempts],
      sessions: attempt.isFollowUp
        ? current.sessions
        : [{
            id: createId('session'), title: `Practice · ${attempt.concept}`,
            subject: activeMaterial.subject, materialId: activeMaterial.id,
            createdAt: attempt.createdAt
          }, ...current.sessions]
    }));
  };

  const resetDemo = () => {
    if (!window.confirm('Reset this study space to the sample workspace? Added material and quiz history will be replaced here and sent to Supabase when sync is available.')) return;
    setState(resetLearningState());
    setView('dashboard');
    setToast('Sample study space restored.');
  };

  const navigate = (next: ViewKey) => {
    setView(next);
    setMobileNavOpen(false);
  };

  const renderPage = () => {
    switch (view) {
      case 'materials': return <Materials materials={state.materials} activeMaterialId={activeMaterial.id} onAddMaterial={addMaterial} onSelectMaterial={(id) => setState((current) => ({ ...current, activeMaterialId: id }))} onNavigate={navigate} />;
      case 'notes': return <Notes material={activeMaterial} note={state.notes.find((item) => item.materialId === activeMaterial.id)} materials={state.materials} onSelectMaterial={(id) => setState((current) => ({ ...current, activeMaterialId: id }))} onSaveNote={saveNote} onNavigate={navigate} />;
      case 'tutor': return <Tutor material={activeMaterial} onNavigate={navigate} onRecordSession={(title) => setState((current) => ({ ...current, sessions: [{ id: createId('session'), title: `Tutor · ${title}`, subject: activeMaterial.subject, materialId: activeMaterial.id, createdAt: new Date().toISOString() }, ...current.sessions] }))} />;
      case 'practice': return <Practice material={activeMaterial} onRecordAttempt={recordAttempt} onRecordSession={(title) => setState((current) => ({ ...current, sessions: [{ id: createId('session'), title, subject: activeMaterial.subject, materialId: activeMaterial.id, createdAt: new Date().toISOString() }, ...current.sessions] }))} />;
      case 'revision': return <Revision state={state} onNavigate={navigate} />;
      case 'dashboard':
      default: return <Dashboard state={state} material={activeMaterial} onNavigate={navigate} />;
    }
  };

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <span className="brand-name">learnloop</span>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}><X size={18} /></button>
        </div>
        <div className="workspace-label">YOUR STUDY SPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`nav-item ${view === key ? 'active' : ''}`} onClick={() => navigate(key)}>
              <Icon size={18} strokeWidth={view === key ? 2.1 : 1.8} />
              <span>{label}</span>
              {key === 'practice' && <span className="nav-dot" aria-label="New practice" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="sidebar-note-icon"><Sparkles size={15} /></div>
            <strong>Wrong turns leave clues.</strong>
            <span>Each answer gives the next explanation somewhere real to start.</span>
          </div>
          <button className="reset-link" onClick={resetDemo}><RotateCcw size={14} /> Reset sample workspace</button>
          <div className="profile-row">
            <div className="avatar avatar-sidebar">YOU</div>
            <div className="profile-copy"><strong>Your desk</strong><span>Study workspace</span></div>
            <span className="profile-menu-dot">···</span>
          </div>
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-shell">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <div className="topbar-crumb"><span>Study desk</span><span className="crumb-slash">/</span><strong>{pageTitles[view]}</strong></div>
          <div className="topbar-right">
            <span className={`demo-pill cloud-pill cloud-${cloudStatus}`} role="status" aria-live="polite" title={cloudStatus === 'synced' || cloudStatus === 'syncing' ? 'This anonymous workspace is tied to this browser session.' : 'Your work is saved in this browser until Supabase sync is configured.'}><span className="demo-pill-dot" /> {cloudStatusLabels[cloudStatus]}</span>
            <button className="theme-toggle" type="button" onClick={toggleColorMode} aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{colorMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
            <div className="topbar-divider" />
            <div className="avatar avatar-top">YOU</div>
          </div>
        </header>

        <div className="page-content" key={view} aria-busy={!cloudReady}>
          {cloudReady ? renderPage() : <div className="workspace-loading" role="status"><span className="loading-rule" /><div><strong>Opening your study desk…</strong><span>Getting your saved work in place before you start.</span></div></div>}
        </div>
        <footer className="prototype-footer">
          <span><GraduationCap size={14} /> Level 0 prototype</span>
          <span>Learning follows your answers, not a guessed mastery score.</span>
        </footer>
      </main>

      {toast && <div className="toast" role="status"><BookOpenCheck size={17} />{toast}<ArrowRight size={15} /></div>}
    </div>
  );
}
