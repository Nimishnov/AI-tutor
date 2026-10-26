import type { SourcePage } from '../types';

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['application/pdf', 'text/plain']);

export interface ExtractedDocument {
  text: string;
  pages: SourcePage[];
}

export async function extractDocument(file: File): Promise<ExtractedDocument> {
  if (file.size > MAX_FILE_SIZE) throw new Error('Choose a file smaller than 15 MB.');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isText = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
  if (!ACCEPTED_TYPES.has(file.type) && !isPdf && !isText) {
    throw new Error('For this prototype, upload a PDF or plain-text (.txt) file.');
  }
  if (isText) {
    const text = (await file.text()).trim();
    if (!text) throw new Error('That text file is empty.');
    return { text, pages: [{ page: 1, excerpt: text.slice(0, 240) }] };
  }

  try {
    const [pdfjs, workerUrl] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: SourcePage[] = [];
    const pageTexts: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) {
        pages.push({ page: pageNumber, excerpt: text.slice(0, 260) });
        pageTexts.push(`[Page ${pageNumber}] ${text}`);
      }
    }
    const fullText = pageTexts.join('\n\n');
    if (!fullText) throw new Error('No selectable text was found. This may be a scanned image; OCR is not included in this prototype.');
    return { text: fullText, pages };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No selectable text')) throw error;
    throw new Error('We could not read this PDF. Try a text-based PDF or paste the passage instead.');
  }
}
