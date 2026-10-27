import { useEffect, useState } from 'react';
import {
  ArrowRight, BookMarked, BookOpenText, Check, ChevronDown, FileText,
  Lightbulb, LoaderCircle, NotebookPen, RefreshCw
} from 'lucide-react';
import { generateNotes } from '../lib/ai';
import type { StudyMaterial, StudyNote, ViewKey } from '../types';

interface Props {
  material: StudyMaterial;
  note?: StudyNote;
  materials: StudyMaterial[];
  onSelectMaterial: (id: string) => void;
  onSaveNote: (note: StudyNote) => void;
  onNavigate: (view: ViewKey) => void;
}

export default function Notes({ material, note, materials, onSelectMaterial, onSaveNote, onNavigate }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showAllSections, setShowAllSections] = useState(false);
  const visibleSections = note ? (showAllSections ? note.sections : note.sections.slice(0, 2)) : [];
  const totalSections = note?.sections.length ?? 0;

  useEffect(() => setShowAllSections(false), [material.id, note?.title]);

  const createNotes = async () => {
    setBusy(true);
    setError('');
    try {
      const generated = await generateNotes(material);
      onSaveNote(generated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Notes could not be generated.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="notes-page page-stack">
      <div className="page-intro"><div><p className="eyebrow">THE THREADS WORTH KEEPING</p><h1>Find the shape of it.</h1><p className="intro-copy">Short notes, tied back to the page they came from.</p></div><div className="page-intro-ornament notes-ornament"><BookOpenText size={26} /></div></div>

      <div className="notes-topline"><div className="material-select-wrap"><FileText size={15} /><select aria-label="Choose study material" value={material.id} onChange={(event) => onSelectMaterial(event.target.value)}>{materials.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><ChevronDown size={14} className="select-chevron" /></div><div className="source-state"><span className="status-dot" /> SOURCE ATTACHED</div></div>

      {!note ? (
        <section className="notes-empty panel"><div className="notes-empty-art"><div className="paper paper-one" /><div className="paper paper-two" /><div className="paper paper-three"><NotebookPen size={20} /></div></div><p className="eyebrow">START WITH THE SOURCE</p><h2>Make a study guide from this.</h2><p>Pull out the main ideas, useful distinctions, and easy-to-mix-up bits. Each note points back to the source where possible.</p><button className="button button-primary" onClick={() => void createNotes()} disabled={busy}>{busy ? <><LoaderCircle className="spin" size={16} /> Reading your material…</> : <>Make my notes <ArrowRight size={15} /></>}</button>{error && <div className="inline-error notes-error" role="alert">{error}</div>}<div className="notes-source-foot"><FileText size={14} /> Using: <strong>{material.title}</strong></div></section>
      ) : (
        <>
          <section className="note-summary-card"><div className="note-summary-label"><span><BookMarked size={15} /> A QUICK OVERVIEW</span><span className="source-count">{note.sections.reduce((count, section) => count + section.sourceCitations.length, 0)} source references</span></div><h2>{note.title}</h2><p>{note.summary}</p><div className="note-summary-foot"><span><FileText size={14} /> {material.title}</span><button className="text-button light-text-button" onClick={() => onNavigate('tutor')}>Ask about this <ArrowRight size={14} /></button></div><div className="summary-deco summary-deco-one" /><div className="summary-deco summary-deco-two" /></section>
          <div className="notes-generated-heading"><div><p className="eyebrow">THE KEY IDEAS</p><h2>Built for understanding.</h2></div><button className="button button-outline button-small" onClick={() => void createNotes()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={14} />} Regenerate</button></div>
          {error && <div className="inline-error" role="alert">{error}</div>}
          <div className="note-sections-grid">
            {visibleSections.map((section, index) => <article className="note-section-card" key={`${section.heading}-${index}`}><div className="note-section-top"><span className={`note-index note-index-${index % 3}`}>0{index + 1}</span><h3>{section.heading}</h3></div><ul>{section.bullets.map((bullet, bulletIndex) => <li key={`${bulletIndex}-${bullet.slice(0, 20)}`}><span className="bullet-check"><Check size={11} /></span><span>{bullet}</span></li>)}</ul><div className="citation-list">{section.sourceCitations.length ? section.sourceCitations.map((citation) => <span key={citation}><FileText size={12} /> {citation}</span>) : <span className="uncited-label">No direct reference returned</span>}</div></article>)}
          </div>
          {totalSections > 2 && <button type="button" className="notes-expand-button" onClick={() => setShowAllSections((show) => !show)}><ChevronDown size={16} className={showAllSections ? 'is-expanded' : ''} />{showAllSections ? 'Show fewer ideas' : `Show ${totalSections - 2} more ${totalSections - 2 === 1 ? 'idea' : 'ideas'}`}</button>}
          {note.confusions.length > 0 && <details className="note-confusions"><summary><Lightbulb size={16} /> Common mix-ups <span>({note.confusions.length})</span><ChevronDown size={15} /></summary><div className="confusion-list">{note.confusions.map((item) => <p key={item}><span>↳</span>{item}</p>)}</div></details>}
        </>
      )}
    </div>
  );
}
