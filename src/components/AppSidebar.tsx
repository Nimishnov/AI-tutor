import { useMemo, useState } from 'react';
import {
  ArrowDownToLine, BookOpen, Brain, Check, ChevronDown, ChevronRight, CircleHelp, ClipboardCheck,
  FilePlus2, FileStack, FolderOpen, GraduationCap, Home, Layers2, MoreHorizontal,
  NotebookPen, RotateCcw, Split, X
} from 'lucide-react';
import type { LearningState, StudyTab, ViewKey } from '../types';

interface Props {
  state: LearningState;
  view: ViewKey;
  activeStudyTabId: string | null;
  mobileOpen: boolean;
  hasCloud: boolean;
  googleLinked: boolean;
  googleEmail?: string;
  authBusy: boolean;
  authError: string;
  onCloseMobile: () => void;
  onNavigate: (view: ViewKey) => void;
  onStartNew: () => void;
  onOpenTab: (tab: StudyTab) => void;
  onMergeTabs: (sourceId: string, targetId: string) => void;
  onSplitGroup: (groupId: string) => void;
  onFinishTab: (tabId: string) => void;
  onRestoreTab: (tabId: string) => void;
  onGoogleLink: () => void;
  onGoogleSwitch: () => void;
  onExport: () => void;
  onClearWorkspace: () => void;
}

const toolItems: Array<{ key: ViewKey; label: string; icon: typeof BookOpen }> = [
  { key: 'materials', label: 'Library', icon: FileStack },
  { key: 'notes', label: 'Notes', icon: NotebookPen },
  { key: 'tutor', label: 'Tutor', icon: Brain },
  { key: 'practice', label: 'Practice', icon: ClipboardCheck },
  { key: 'revision', label: 'Revision', icon: RotateCcw },
  { key: 'help', label: 'How to use', icon: CircleHelp }
];

function groupedEntries(tabs: StudyTab[]) {
  const groups = new Map<string, StudyTab[]>();
  for (const tab of tabs) {
    const key = tab.groupId ? `group:${tab.groupId}` : `tab:${tab.id}`;
    groups.set(key, [...(groups.get(key) ?? []), tab]);
  }
  return [...groups.entries()]
    .map(([key, members]) => ({ key, members: members.sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt)) }))
    .sort((a, b) => b.members[0].lastOpenedAt.localeCompare(a.members[0].lastOpenedAt));
}

export default function AppSidebar(props: Props) {
  const {
    state, view, activeStudyTabId, mobileOpen, hasCloud,
    googleLinked, googleEmail, authBusy, authError, onCloseMobile, onNavigate,
    onStartNew, onOpenTab, onMergeTabs, onSplitGroup, onFinishTab, onRestoreTab,
    onGoogleLink, onGoogleSwitch, onExport, onClearWorkspace
  } = props;
  const [menuTabId, setMenuTabId] = useState<string | null>(null);
  const [groupChooserFor, setGroupChooserFor] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [completedOpen, setCompletedOpen] = useState(false);
  const activeTabs = useMemo(() => groupedEntries(state.studyTabs.filter((tab) => tab.status === 'active')), [state.studyTabs]);
  const completedTabs = useMemo(() => [...state.studyTabs]
    .filter((tab) => tab.status === 'completed')
    .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt)), [state.studyTabs]);

  const dropOn = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) onMergeTabs(sourceId, targetId);
  };

  const renderTab = (tab: StudyTab, nested = false) => {
    const isActive = activeStudyTabId === tab.id && view === 'study';
    return (
      <div
        className={`study-tab-row ${nested ? 'study-tab-member' : ''} ${isActive ? 'is-selected' : ''}`}
        key={tab.id}
        draggable={tab.status === 'active'}
        onDragStart={(event) => { event.dataTransfer.setData('text/plain', tab.id); event.dataTransfer.effectAllowed = 'move'; }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => dropOn(event, tab.id)}
        onDragEnd={() => { /* Native drag state is owned by the browser. */ }}
        onContextMenu={(event) => { event.preventDefault(); setMenuTabId(tab.id); setGroupChooserFor(null); }}
      >
        <button
          className={`study-tab-button ${isActive ? 'active' : ''} ${tab.status === 'completed' ? 'completed' : ''}`}
          type="button"
          title={tab.title}
          onClick={() => tab.status === 'completed' ? onRestoreTab(tab.id) : onOpenTab(tab)}
        >
          <span className="study-tab-marker" aria-hidden="true">{tab.status === 'completed' ? <Check size={13} /> : null}</span>
          <span className="study-tab-copy"><strong>{tab.title}</strong><span>{tab.subject}</span></span>
        </button>
        <button
          className="study-tab-menu-trigger"
          type="button"
          aria-label={`Options for ${tab.title}`}
          aria-haspopup="menu"
          aria-expanded={menuTabId === tab.id}
          onClick={() => { setMenuTabId((current) => current === tab.id ? null : tab.id); setGroupChooserFor(null); }}
          onContextMenu={(event) => { event.preventDefault(); setMenuTabId(tab.id); }}
        ><MoreHorizontal size={18} /></button>
        {menuTabId === tab.id && (
          <div className="study-tab-menu" role="menu" aria-label={`${tab.title} options`}>
            {tab.status === 'active' ? (
              <button type="button" role="menuitem" onClick={() => { onFinishTab(tab.id); setMenuTabId(null); }}><Check size={14} /> Finish this session</button>
            ) : (
              <button type="button" role="menuitem" onClick={() => { onRestoreTab(tab.id); setMenuTabId(null); }}><RotateCcw size={14} /> Reopen session</button>
            )}
            {tab.groupId ? (
              <button type="button" role="menuitem" onClick={() => { onSplitGroup(tab.groupId!); setMenuTabId(null); }}><Split size={14} /> Separate this group</button>
            ) : tab.status === 'active' ? (
              <>
                <button type="button" role="menuitem" onClick={() => setGroupChooserFor((current) => current === tab.id ? null : tab.id)}><Layers2 size={14} /> Group with another tab</button>
                {groupChooserFor === tab.id && (
                  <div className="study-tab-group-chooser" role="group" aria-label="Choose a study tab to group with">
                    {state.studyTabs.filter((item) => item.status === 'active' && item.id !== tab.id).map((item) => (
                      <button key={item.id} type="button" onClick={() => { onMergeTabs(tab.id, item.id); setMenuTabId(null); setGroupChooserFor(null); }}>
                        <FolderOpen size={13} /><span>{item.title}</span>
                      </button>
                    ))}
                    {state.studyTabs.filter((item) => item.status === 'active' && item.id !== tab.id).length === 0 && <span className="group-chooser-empty">Add another study tab first.</span>}
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Study navigation">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <span className="brand-name">learnloop</span>
          <button className="icon-button mobile-close" type="button" aria-label="Close menu" onClick={onCloseMobile}><X size={18} /></button>
        </div>

        <button className={`sidebar-home ${view === 'dashboard' ? 'active' : ''}`} type="button" onClick={() => onNavigate('dashboard')}>
          <Home size={18} /><span>Home</span>
        </button>

        <div className="study-tabs-section">
          <div className="sidebar-section-heading"><span>YOUR STUDY TABS</span><span>{state.studyTabs.filter((tab) => tab.status === 'active').length}</span></div>
          <button className="sidebar-new-study" type="button" onClick={onStartNew}><FilePlus2 size={17} /><span>New study</span><span className="new-study-plus">+</span></button>
          <div className="study-tab-list" aria-label="Active study sessions">
            {activeTabs.map(({ key, members }) => {
              if (members.length === 1) return renderTab(members[0]);
              const groupId = members[0].groupId!;
              const expanded = expandedGroups.includes(groupId);
              return (
                <div
                  className="study-tab-group"
                  key={key}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropOn(event, members[0].id)}
                >
                  <button className="study-tab-group-button" type="button" aria-expanded={expanded} onClick={() => {
                    setExpandedGroups((current) => current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]);
                    onOpenTab(members[0]);
                  }}>
                    <Layers2 size={16} /><span className="study-group-title">{members[0].title}</span><span className="study-group-count">+{members.length - 1}</span>
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expanded && <div className="study-tab-group-members">{members.map((tab) => renderTab(tab, true))}</div>}
                </div>
              );
            })}
            {activeTabs.length === 0 && <p className="empty-tab-list">New study sessions will appear here.</p>}
          </div>
          <div className="completed-tabs-section">
            <button type="button" className="completed-tabs-toggle" aria-expanded={completedOpen} onClick={() => setCompletedOpen((open) => !open)}>
              {completedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}<span>Completed</span><span className="completed-count">{completedTabs.length}</span>
            </button>
            {completedOpen && <div className="completed-tab-list">{completedTabs.length ? completedTabs.map((tab) => renderTab(tab)) : <p className="empty-tab-list">Finished sessions are kept here.</p>}</div>}
          </div>
        </div>

        <div className="tool-nav">
          <div className="sidebar-section-heading"><span>TOOLS</span></div>
          {toolItems.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" disabled={state.materials.length === 0 && key !== 'materials' && key !== 'help'} className={`nav-item ${view === key ? 'active' : ''}`} onClick={() => onNavigate(key)}><Icon size={18} /><span>{label}</span></button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="auth-card">
            <div className="auth-card-heading"><GraduationCap size={16} /><span>{googleLinked ? 'Google connected' : 'Keep your study space'}</span></div>
            {googleLinked ? <><strong className="auth-email">{googleEmail || 'Google account'}</strong><button type="button" className="auth-link-button secondary" disabled={authBusy} onClick={onGoogleSwitch}>Switch account</button></> : <><p>Link Google to bring your saved desk to another device.</p><button type="button" className="auth-link-button" disabled={authBusy || !hasCloud} onClick={onGoogleLink}><GoogleMark />{authBusy ? 'Opening Google…' : 'Continue with Google'}</button><button type="button" className="auth-link-button secondary" disabled={authBusy || !hasCloud} onClick={onGoogleSwitch}>Already have an account? Sign in</button></>}
            {!hasCloud && <span className="auth-config-note">Google sign-in needs Supabase project settings.</span>}
            {authError && <span className="auth-error" role="alert">{authError}</span>}
          </div>
          <details className="sidebar-account-tools">
            <summary>Workspace settings</summary>
            <button type="button" className="export-workspace-button" onClick={onExport}><ArrowDownToLine size={15} /> Download a workspace backup</button>
            <button type="button" className="clear-workspace-button" onClick={onClearWorkspace}>Clear this workspace</button>
          </details>
        </div>
      </aside>
      {mobileOpen && <button className="mobile-scrim" type="button" aria-label="Close menu" onClick={onCloseMobile} />}
    </>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" className="google-mark" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.2-1.8 13.6-4.9l-6.7-5.1c-1.9 1.3-4.2 2.1-6.9 2.1-5.3 0-9.8-3.6-11.4-8.5H5.7v5.3A20.5 20.5 0 0 0 24 44Z"/><path fill="#4285F4" d="M12.6 27.6a12.3 12.3 0 0 1 0-7.2v-5.3H5.7a20.5 20.5 0 0 0 0 17.8l6.9-5.3Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20.5 20.5 0 0 0 5.7 15.1l6.9 5.3C14.2 15.6 18.7 12 24 12Z"/></svg>;
}
