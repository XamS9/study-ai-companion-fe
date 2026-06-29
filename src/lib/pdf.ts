import { extractText, isAvailable } from 'expo-pdf-text-extract';

/**
 * Extracts embedded text from a PDF at the given local URI using native APIs
 * (PDFKit on iOS, PDFBox on Android).
 *
 * Returns null for scanned/image-only PDFs that have no embedded text layer,
 * or when the native module is unavailable (Expo Go).
 */
export async function extractPdfText(uri: string): Promise<string | null> {
  if (!isAvailable()) return null;
  const text = await extractText(uri);
  return text.trim() || null;
}
