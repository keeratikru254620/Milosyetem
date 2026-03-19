import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_PDF_PAGES = 20;
const MAX_PDF_TEXT_LENGTH = 24000;

const normalizeExtractedText = (value: string) =>
  value.replace(/\s+/g, ' ').trim().slice(0, MAX_PDF_TEXT_LENGTH);

export async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({
    data: buffer,
    isEvalSupported: false,
    useWorkerFetch: false,
  });

  let pdf: PDFDocumentProxy | null = null;

  try {
    pdf = await loadingTask.promise;
    const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = (textContent.items as Array<{ str?: string }>)
        .map((item) => item.str ?? '')
        .join(' ');

      pages.push(pageText);
      page.cleanup();

      if (pages.join(' ').length >= MAX_PDF_TEXT_LENGTH) {
        break;
      }
    }

    return normalizeExtractedText(pages.join(' '));
  } finally {
    if (pdf) {
      await pdf.destroy();
    } else {
      await loadingTask.destroy();
    }
  }
}
