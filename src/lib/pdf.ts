import { File } from 'expo-file-system';

/**
 * Extracts embedded text from a PDF at the given local URI using PDF.js.
 *
 * Works only for text-based PDFs (digitally created). Scanned/image-only PDFs
 * have no embedded text layer and will return null — the user must type content
 * manually in that case.
 *
 * Workers are disabled (no Web Worker API in React Native) and eval is disabled
 * for Hermes compatibility.
 */
export async function extractPdfText(uri: string): Promise<string | null> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = '';

  const bytes = await new File(uri).bytes();
  const doc = await getDocument({
    data: bytes,
    useWorkerFetch: false,
    useSystemFonts: true,
  }).promise;

  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const { items } = await page.getTextContent();
    const text = items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim();
    if (text) parts.push(text);
  }

  return parts.join('\n') || null;
}
