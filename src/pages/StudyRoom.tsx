import { ArrowRight, BookOpenText, Check, FileText, MessageCircleQuestion, NotebookPen, Target } from 'lucide-react';
import type { StudyMaterial, StudyNote, StudyTab, ViewKey } from '../types';

interface Props {
  tab: StudyTab;
  material: StudyMaterial;
  note?: StudyNote;
  onNavigate: (view: ViewKey) => void;
  onFinish: () => void;
}

function sourceExcerpt(material: StudyMaterial): string {
  const excerpt = material.sourcePages[0]?.excerpt?.trim();
  return excerpt || material.body.slice(0, 420).trim();
}

export default function StudyRoom({ tab, material, note, onNavigate, onFinish }: Props) {
  const excerpt = sourceExcerpt(material);
  return (
    <div className="study-room page-stack">
      <header className="study-room-heading">
        <div>
          <p className="eyebrow">STUDY THREAD · {tab.subject.toUpperCase()}</p>
          <h1>{tab.title}</h1>
          <p className="intro-copy">One source, one place to work through the parts that matter.</p>
        </div>
        <button type="button" className="quiet-finish-button" onClick={onFinish}><Check size={15} /> Finish this session</button>
      </header>

      <section className="study-room-source" aria-labelledby="source-heading">
        <div className="study-source-label"><FileText size={16} /><span>YOUR SOURCE</span><span className="source-page-tag">Page {material.sourcePages[0]?.page ?? 1}</span></div>
        <h2 id="source-heading">{material.title}</h2>
        <p className="study-source-excerpt">{excerpt}{material.body.length > excerpt.length ? '…' : ''}</p>
        <details className="study-full-source">
          <summary>{material.body.length > excerpt.length ? 'Read the full source' : 'Source details'}</summary>
          <div className="study-source-fulltext">{material.body}</div>
          {material.sourcePages.length > 1 && <ol className="source-page-list">{material.sourcePages.map((page) => <li key={page.page}><strong>Page {page.page}.</strong> {page.excerpt}</li>)}</ol>}
        </details>
      </section>

      <section className="study-next-step" aria-labelledby="next-step-heading">
        <div className="study-next-step-copy"><p className="eyebrow">WHAT WOULD HELP RIGHT NOW?</p><h2 id="next-step-heading">Choose one next step.</h2><p>No need to use every tool. Pick what feels useful for this material.</p></div>
        <div className="study-tool-actions">
          <button type="button" className="study-tool-action study-tool-action-primary" onClick={() => onNavigate('notes')}><NotebookPen size={19} /><span><strong>{note ? 'Review your notes' : 'Make study notes'}</strong><small>{note ? 'Your notes are saved with this thread.' : 'Turn the source into a short, cited outline.'}</small></span><ArrowRight size={17} /></button>
          <button type="button" className="study-tool-action" onClick={() => onNavigate('tutor')}><MessageCircleQuestion size={19} /><span><strong>Ask the tutor</strong><small>Get a patient explanation grounded in this source.</small></span><ArrowRight size={17} /></button>
          <button type="button" className="study-tool-action" onClick={() => onNavigate('practice')}><Target size={19} /><span><strong>Try a quick check</strong><small>See what stuck, then get help with what didn’t.</small></span><ArrowRight size={17} /></button>
        </div>
      </section>
      <p className="study-room-footnote"><BookOpenText size={15} /> Your material, notes, and answer history stay in Completed if this study tab is finished.</p>
    </div>
  );
}
