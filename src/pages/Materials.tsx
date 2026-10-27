import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight, BookOpen, Check, FileText, FileUp, Files, FilePlus2, Link2,
  Lightbulb, LoaderCircle, MessageCircleQuestion, UploadCloud
} from 'lucide-react';
import { extractDocument } from '../lib/documents';
import { createId } from '../lib/storage';
import type { StudyMaterial, ViewKey } from '../types';

interface Props {
  materials: StudyMaterial[];
  activeMaterialId: string;
  initialMode?: InputMode;
  onAddMaterial: (material: StudyMaterial, nextView?: ViewKey) => void;
  onSelectMaterial: (id: string) => void;
  onNavigate: (view: ViewKey) => void;
}

type InputMode = 'upload' | 'paste' | 'question';

export default function Materials({ materials, activeMaterialId, initialMode = 'upload', onAddMaterial, onSelectMaterial, onNavigate }: Props) {
  const [mode, setMode] = useState<InputMode>(initialMode);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sourcePages, setSourcePages] = useState<StudyMaterial['sourcePages']>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const extracted = await extractDocument(file);
      setBody(extracted.text);
      setSourcePages(extracted.pages);
      setTitle(file.name.replace(/\.(pdf|txt)$/i, '').replace(/[_-]+/g, ' '));
      setSelectedFile(file.name);
      setMode('paste');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The file could not be read.');
    } finally {
      setBusy(false);
    }
  };

  const addMaterial = (event: FormEvent) => {
    event.preventDefault();
    const cleanBody = body.trim();
    if (!cleanBody) {
      setError(mode === 'question' ? 'Type a question first.' : 'Paste or upload a passage first.');
      return;
    }
    if (cleanBody.length > 24_000) {
      setError('This prototype accepts up to 24,000 characters per study item. Split a longer chapter into sections.');
      return;
    }
    const isQuestion = mode === 'question';
    const material: StudyMaterial = {
      id: createId('material'),
      title: title.trim() || (isQuestion ? `Question: ${cleanBody.slice(0, 42)}${cleanBody.length > 42 ? '…' : ''}` : 'Untitled study material'),
      subject: subject.trim() || 'Study material',
      body: cleanBody,
      origin: mode === 'upload' || selectedFile.toLowerCase().endsWith('.pdf') ? 'pdf' : 'pasted',
      sourcePages: sourcePages.length ? sourcePages : [{ page: 1, excerpt: cleanBody.slice(0, 260) }],
      createdAt: new Date().toISOString()
    };
    onAddMaterial(material, 'study');
  };

  return (
    <div className="materials-page page-stack">
      <div className="page-intro"><div><p className="eyebrow">DROP A PIN IN THE CHAPTER</p><h1>Bring the messy bit.</h1><p className="intro-copy">A source, a half-remembered passage, or the question you keep circling.</p></div><div className="page-intro-ornament"><Files size={25} /></div></div>

      <section className="input-workspace panel">
        <div className="workspace-heading"><div><div className="section-step"><span>01</span> PICK YOUR STARTING POINT</div><h2>What are you working through?</h2><p>Use a passage when you have one. Type a question when you don’t.</p></div><div className="workspace-heading-mark"><div className="mark-stack"><span /><span /><span /></div></div></div>

        <div className="intake-tabs" role="tablist" aria-label="Study material input">
          <button className={`intake-tab ${mode === 'upload' ? 'selected' : ''}`} role="tab" aria-selected={mode === 'upload'} onClick={() => { setMode('upload'); setError(''); }}><FileUp size={16} /> Upload a file</button>
          <button className={`intake-tab ${mode === 'paste' ? 'selected' : ''}`} role="tab" aria-selected={mode === 'paste'} onClick={() => { setMode('paste'); setError(''); }}><FileText size={16} /> Paste text</button>
          <button className={`intake-tab ${mode === 'question' ? 'selected' : ''}`} role="tab" aria-selected={mode === 'question'} onClick={() => { setMode('question'); setTitle(''); setBody(''); setSourcePages([]); setError(''); }}><MessageCircleQuestion size={16} /> Ask a question</button>
        </div>

        <form className="intake-form" onSubmit={addMaterial}>
          {mode === 'upload' && (
            <div className="upload-zone" role="button" tabIndex={0} onClick={() => fileRef.current?.click()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') fileRef.current?.click(); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleFile(event.dataTransfer.files[0]); }}>
              <input ref={fileRef} className="visually-hidden" type="file" accept="application/pdf,.pdf,text/plain,.txt" onChange={(event) => void handleFile(event.target.files?.[0])} />
              <div className="upload-symbol">{busy ? <LoaderCircle className="spin" size={23} /> : <UploadCloud size={23} />}</div>
              <strong>{busy ? 'Reading your file…' : selectedFile || 'Drop your file here, or browse'}</strong>
              <span>{selectedFile ? 'Text extracted. Review or edit it in the Paste text tab.' : 'PDF or plain text · up to 15 MB · selectable text PDFs'}</span>
              {!busy && <span className="browse-link">Choose file <ArrowRight size={13} /></span>}
            </div>
          )}

          {mode === 'paste' && (
            <>
              <label className="field-label" htmlFor="material-title">Give this session a name <span>Optional</span></label>
              <input id="material-title" className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Newton's laws of motion" maxLength={90} />
              <label className="field-label" htmlFor="material-subject">Subject <span>Optional</span></label>
              <input id="material-subject" className="text-input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Physics · Mechanics" maxLength={70} />
              <label className="field-label" htmlFor="material-body">Your study material <span>{body.length.toLocaleString()} / 24,000 characters</span></label>
              <textarea id="material-body" className="text-area material-textarea" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Paste a section from your textbook, class notes, or a short passage…" maxLength={24_000} rows={9} />
              <div className="field-hint"><Link2 size={13} /> Page references are kept when extracted from PDFs.</div>
            </>
          )}

          {mode === 'question' && (
            <>
              <div className="question-illustration"><div className="question-bubble"><Lightbulb size={18} /></div><span>Curiosity is a good place to start.</span></div>
              <label className="field-label" htmlFor="typed-question">What would you like to understand?</label>
              <textarea id="typed-question" className="text-area question-textarea" value={body} onChange={(event) => setBody(event.target.value)} placeholder="For example: Why does a heavier cart accelerate less if I push it just as hard?" rows={5} maxLength={2000} />
              <div className="field-hint"><FileText size={13} /> This question becomes its own study thread.</div>
            </>
          )}

          {error && <div className="inline-error" role="alert">{error}</div>}
          <div className="form-footer"><span className="privacy-note"><Check size={14} /> Saved on this device; synced when connected</span><button className="button button-primary" type="submit">{mode === 'question' ? 'Open this study thread' : 'Start a study session'} <ArrowRight size={16} /></button></div>
        </form>
        <div className="prototype-note"><FileText size={15} /><span>PDFs need selectable text. This beta cannot read photographed pages or slide decks.</span></div>
      </section>

      <section className="library-section">
        <div className="section-heading-row"><div><p className="eyebrow">YOUR MATERIALS</p><h2>Saved study material <span className="count-pill">{materials.length}</span></h2></div><button className="text-button" onClick={() => onNavigate('notes')}>Open notes <ArrowRight size={14} /></button></div>
        {materials.length ? (
          <div className="material-list">
            {materials.map((material) => {
              const active = material.id === activeMaterialId;
              return <button key={material.id} className={`material-row ${active ? 'material-row-active' : ''}`} onClick={() => onSelectMaterial(material.id)}><div className={`material-row-icon ${material.origin === 'sample' ? 'icon-sample' : material.origin === 'pdf' ? 'icon-pdf' : 'icon-paste'}`}>{material.origin === 'sample' ? <BookOpen size={17} /> : material.origin === 'pdf' ? <FileText size={17} /> : <FilePlus2 size={17} />}</div><div className="material-row-copy"><strong>{material.title}</strong><span>{material.subject} · {material.origin === 'sample' ? 'Sample source' : material.origin === 'pdf' ? 'PDF upload' : 'Pasted text'}</span></div><span className="material-selected">{active ? <><Check size={14} /> Selected</> : <ArrowRight size={15} />}</span></button>;
            })}
          </div>
        ) : <div className="empty-library"><FileText size={20} /><span>Your saved materials will live here.</span></div>}
      </section>
    </div>
  );
}
