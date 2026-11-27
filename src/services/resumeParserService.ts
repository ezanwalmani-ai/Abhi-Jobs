import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
export {
  parseStructuredResumeText,
  type ParsedResumeResult,
} from '../utils/resumeTextParser';

// Configure PDF.js worker using Vite bundled asset URL
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'Please select a file.' };
  const ext = file.name.toLowerCase().split('.').pop() || '';
  if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc') {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a PDF (.pdf), Word (.docx), or legacy Word (.doc) document.',
    };
  }
  if (file.size === 0) {
    return { valid: false, error: 'The selected file appears to be empty.' };
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds 10MB. Please upload a smaller resume file.' };
  }
  return { valid: true };
}

/**
 * Extracts readable plain text runs from a legacy binary Microsoft Word (.doc) file.
 * Handles both UTF-16LE Word text streams and ASCII text segments cleanly in the browser.
 */
function extractTextFromLegacyDoc(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);

  // Attempt 1: Decode ASCII/Latin-1 printable text runs
  const asciiChunks: string[] = [];
  let currentAscii = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13) {
      currentAscii += String.fromCharCode(b);
    } else {
      if (currentAscii.trim().length >= 4) {
        asciiChunks.push(currentAscii);
      }
      currentAscii = '';
    }
  }
  if (currentAscii.trim().length >= 4) asciiChunks.push(currentAscii);

  // Attempt 2: Decode UTF-16LE readable text runs (Word 97-2003 Unicode streams)
  const utf16Chunks: string[] = [];
  let currentUtf16 = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = bytes[i] | (bytes[i + 1] << 8);
    if (
      (code >= 32 && code <= 126) ||
      code === 9 ||
      code === 10 ||
      code === 13 ||
      code === 0x2022 ||
      code === 0x2013 ||
      code === 0x2014
    ) {
      currentUtf16 += code === 13 ? '\n' : String.fromCharCode(code);
    } else {
      if (currentUtf16.trim().length >= 4) {
        utf16Chunks.push(currentUtf16);
      }
      currentUtf16 = '';
    }
  }
  if (currentUtf16.trim().length >= 4) utf16Chunks.push(currentUtf16);

  const cleanLines = (chunks: string[]) =>
    chunks
      .join('\n')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter((l) => {
        if (l.length < 2) return false;
        if (
          /^(Microsoft Word|Normal\.dot|Root Entry|WordDocument|SummaryInformation|CompObj|1Table|0Table|HYPERLINK|MERGEFORMAT|Times New Roman|Calibri|Cambria|Arial|Symbol|Wingdings)/i.test(
            l
          )
        ) {
          return false;
        }
        const alphaCount = (l.match(/[A-Za-z0-9]/g) || []).length;
        return alphaCount >= 2 && alphaCount / l.length >= 0.45;
      });

  const utf16Lines = cleanLines(utf16Chunks);
  const asciiLines = cleanLines(asciiChunks);
  const chosen = utf16Lines.join('\n').length >= asciiLines.join('\n').length ? utf16Lines : asciiLines;
  return chosen.join('\n').trim();
}

/**
 * Extracts raw plain text from an uploaded PDF, DOC, or DOCX resume file in the browser.
 * Preserves row ordering (left-to-right x sorting) and paragraph gaps for accurate section parsing.
 */
export async function extractTextFromResumeFile(file: File): Promise<string> {
  const validation = validateResumeFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const ext = file.name.toLowerCase().split('.').pop();
  const arrayBuffer = await file.arrayBuffer();

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = (result.value || '').trim();
    if (!text) {
      throw new Error(
        'Could not find readable text inside this DOCX file. Try saving it as a standard Word document.'
      );
    }
    return text;
  }

  if (ext === 'doc') {
    const header = new Uint8Array(arrayBuffer.slice(0, 4));
    if (header[0] === 0x50 && header[1] === 0x4b) {
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = (result.value || '').trim();
        if (text) return text;
      } catch {
        // Fall through to legacy binary extraction
      }
    }
    const text = extractTextFromLegacyDoc(arrayBuffer);
    if (!text || text.length < 20) {
      throw new Error(
        'Could not extract readable text from this legacy .doc file. Please re-save it as .docx or .pdf and try again.'
      );
    }
    return text;
  }

  if (ext === 'pdf') {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pagesText: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group text items into horizontal visual lines with 4pt vertical tolerance
      const rows: Array<{ y: number; items: Array<{ x: number; str: string }> }> = [];
      for (const item of textContent.items as any[]) {
        const str: string = typeof item?.str === 'string' ? item.str : '';
        if (!str) continue;
        const x: number = Array.isArray(item.transform) ? Number(item.transform[4]) || 0 : 0;
        const y: number = Array.isArray(item.transform) ? Number(item.transform[5]) || 0 : 0;

        let targetRow = rows.find((r) => Math.abs(r.y - y) <= 4);
        if (!targetRow) {
          targetRow = { y, items: [] };
          rows.push(targetRow);
        }
        targetRow.items.push({ x, str });
      }

      // Sort rows top-to-bottom (higher y first in PDF coordinates)
      rows.sort((a, b) => b.y - a.y);

      const pageLines: string[] = [];
      let prevY: number | null = null;

      for (const row of rows) {
        row.items.sort((a, b) => a.x - b.x);
        let lineText = '';
        for (const piece of row.items) {
          const s = piece.str;
          if (!s) continue;
          if (lineText && !lineText.endsWith(' ') && !s.startsWith(' ')) {
            lineText += ' ' + s;
          } else {
            lineText += s;
          }
        }
        const trimmedLine = lineText.replace(/\s+/g, ' ').trim();
        if (!trimmedLine) continue;

        // Preserve paragraph gaps between separate jobs, degrees, and sections
        if (prevY !== null && Math.abs(prevY - row.y) > 20 && pageLines.length > 0) {
          pageLines.push('');
        }
        pageLines.push(trimmedLine);
        prevY = row.y;
      }

      pagesText.push(pageLines.join('\n'));
    }

    const fullText = pagesText.join('\n\n').trim();
    if (!fullText) {
      throw new Error(
        'This PDF appears to be an image scan without selectable text. Please upload a text-based PDF, DOC, or DOCX file.'
      );
    }
    return fullText;
  }

  throw new Error('Unsupported file format.');
}
