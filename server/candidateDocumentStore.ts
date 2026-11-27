import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type CandidateDocumentCategory = 'resume' | 'certificate' | 'supporting';

export interface StoredCandidateDocument {
  id: string;
  candidateUid: string;
  category: CandidateDocumentCategory;
  originalFilename: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  versionNumber: number;
  isLatest: boolean;
  uploadedAt: string;
  uploadedByUid: string;
  sha256: string;
  storedRelativePath: string;
}

interface DocumentIndexState {
  byCandidateUid: Record<string, StoredCandidateDocument[]>;
}

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg']);

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

function sanitizePathSegment(input: string): string {
  const cleaned = String(input || '').trim();
  if (!/^[a-zA-Z0-9_-]{3,128}$/.test(cleaned)) {
    throw new Error('Invalid identifier segment');
  }
  return cleaned;
}

function sanitizeOriginalFilename(raw: string): string {
  const base = path.basename(String(raw || 'document.pdf')).replace(/[\r\n\0<>:"/\\|?*]+/g, '_');
  const trimmed = base.trim().slice(0, 140);
  return trimmed || 'document.pdf';
}

function detectFileSignatureValid(ext: string, buf: Buffer): boolean {
  if (buf.length < 4) return false;
  if (ext === '.pdf') {
    return buf.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (ext === '.docx') {
    // ZIP header PK\x03\x04
    return buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05);
  }
  if (ext === '.doc') {
    // OLE2 Compound Document header D0 CF 11 E0 (or RTF {\rtf)
    const isOle2 = buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
    const isRtf = buf.subarray(0, 5).toString('ascii') === '{\\rtf';
    return isOle2 || isRtf;
  }
  if (ext === '.png') {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  return false;
}

export class CandidateDocumentStore {
  private readonly baseDir: string;
  private readonly indexPath: string;
  private state: DocumentIndexState;

  constructor(baseDir?: string) {
    this.baseDir = baseDir
      ? path.resolve(baseDir)
      : path.resolve(process.cwd(), '.learning-data', 'candidate-documents');
    this.indexPath = path.join(this.baseDir, 'index.json');
    this.state = this.loadIndex();
  }

  private loadIndex(): DocumentIndexState {
    try {
      if (fs.existsSync(this.indexPath)) {
        const parsed = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
        if (parsed && typeof parsed === 'object' && parsed.byCandidateUid) {
          return { byCandidateUid: parsed.byCandidateUid };
        }
      }
    } catch {
      // ignore corrupted index
    }
    return { byCandidateUid: {} };
  }

  private persistIndex(): void {
    fs.mkdirSync(this.baseDir, { recursive: true });
    const tmp = `${this.indexPath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.state, null, 2), 'utf8');
    fs.renameSync(tmp, this.indexPath);
  }

  private resolveSafeFilePath(relativePath: string): string {
    const resolvedBase = path.resolve(this.baseDir);
    const resolvedTarget = path.resolve(resolvedBase, relativePath);
    if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
      throw new Error('Blocked unsafe document path traversal attempt.');
    }
    return resolvedTarget;
  }

  public saveDocument(params: {
    candidateUid: string;
    uploadedByUid: string;
    originalFilename: string;
    category: CandidateDocumentCategory;
    buffer: Buffer;
    declaredMimeType?: string;
  }): StoredCandidateDocument {
    const safeUid = sanitizePathSegment(params.candidateUid);
    const safeUploader = sanitizePathSegment(params.uploadedByUid);
    const safeCategory: CandidateDocumentCategory =
      params.category === 'certificate' || params.category === 'supporting'
        ? params.category
        : 'resume';

    if (!Buffer.isBuffer(params.buffer) || params.buffer.length === 0) {
      throw new Error('Uploaded file is empty.');
    }
    if (params.buffer.length > MAX_DOCUMENT_BYTES) {
      throw new Error('File exceeds the maximum allowed size of 10 MB.');
    }

    const cleanName = sanitizeOriginalFilename(params.originalFilename);
    const ext = path.extname(cleanName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error('Unsupported file format. Please upload PDF, DOC, DOCX, PNG, or JPG.');
    }
    if (!detectFileSignatureValid(ext, params.buffer)) {
      throw new Error(
        `Uploaded file content does not match its ${ext.toUpperCase().slice(1)} format.`
      );
    }

    const mimeType = MIME_BY_EXT[ext] || 'application/octet-stream';
    const docId = `doc_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const storedRelativePath = path.join(safeUid, `${docId}${ext}`);
    const absoluteTarget = this.resolveSafeFilePath(storedRelativePath);

    fs.mkdirSync(path.dirname(absoluteTarget), { recursive: true });
    fs.writeFileSync(absoluteTarget, params.buffer);

    const existingList = this.state.byCandidateUid[safeUid] || [];
    const sameCategoryDocs = existingList.filter((d) => d.category === safeCategory);
    const nextVersion =
      sameCategoryDocs.reduce((max, item) => Math.max(max, item.versionNumber || 0), 0) + 1;

    // Mark previous versions in the same category as not latest (preserving complete history)
    const updatedList = existingList.map((item) =>
      item.category === safeCategory ? { ...item, isLatest: false } : item
    );

    const sha256 = crypto.createHash('sha256').update(params.buffer).digest('hex');
    const record: StoredCandidateDocument = {
      id: docId,
      candidateUid: safeUid,
      category: safeCategory,
      originalFilename: cleanName,
      mimeType,
      extension: ext,
      sizeBytes: params.buffer.length,
      versionNumber: nextVersion,
      isLatest: true,
      uploadedAt: new Date().toISOString(),
      uploadedByUid: safeUploader,
      sha256,
      storedRelativePath,
    };

    this.state.byCandidateUid[safeUid] = [record, ...updatedList];
    this.persistIndex();
    return record;
  }

  public listDocuments(candidateUid: string): Omit<StoredCandidateDocument, 'storedRelativePath'>[] {
    const safeUid = sanitizePathSegment(candidateUid);
    const list = this.state.byCandidateUid[safeUid] || [];
    return list
      .filter((item) => {
        try {
          const full = this.resolveSafeFilePath(item.storedRelativePath);
          return fs.existsSync(full);
        } catch {
          return false;
        }
      })
      .map(({ storedRelativePath: _omit, ...publicMeta }) => publicMeta);
  }

  public readDocumentContent(
    candidateUid: string,
    docId: string
  ): { meta: Omit<StoredCandidateDocument, 'storedRelativePath'>; buffer: Buffer } | null {
    const safeUid = sanitizePathSegment(candidateUid);
    const safeDocId = sanitizePathSegment(docId);
    const list = this.state.byCandidateUid[safeUid] || [];
    const found = list.find((d) => d.id === safeDocId);
    if (!found) return null;

    const fullPath = this.resolveSafeFilePath(found.storedRelativePath);
    if (!fs.existsSync(fullPath)) return null;

    const buffer = fs.readFileSync(fullPath);
    const { storedRelativePath: _omit, ...publicMeta } = found;
    return { meta: publicMeta, buffer };
  }
}

export const defaultCandidateDocumentStore = new CandidateDocumentStore();
