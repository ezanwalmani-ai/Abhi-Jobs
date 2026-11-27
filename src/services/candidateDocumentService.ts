import {
  auth,
  db,
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  serverTimestamp,
} from '../lib/firebase';
import type { CandidateDocumentRecord } from '../types';

async function getBearerAuthHeaders(includeJson = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.readAsDataURL(file);
  });
}

function toIsoDate(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof (val as any)?.toDate === 'function') {
    try {
      return (val as any).toDate().toISOString();
    } catch {
      return '';
    }
  }
  return '';
}

/**
 * Privately uploads a candidate resume, certificate, or supporting document to the
 * authenticated backend store and records immutable version metadata in Firestore
 * /candidates/{uid}/documents/{docId}.
 */
export async function uploadCandidateDocument(params: {
  uid: string;
  file: File;
  category?: 'resume' | 'certificate' | 'supporting';
}): Promise<CandidateDocumentRecord> {
  const { uid, file, category = 'resume' } = params;
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('You must be signed in as this candidate to upload documents.');
  }

  const contentBase64 = await fileToBase64(file);
  const headers = await getBearerAuthHeaders(true);

  const resp = await fetch(`/api/candidates/${encodeURIComponent(uid)}/documents/upload`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      originalFilename: file.name,
      category,
      mimeType: file.type || 'application/octet-stream',
      contentBase64,
    }),
  });

  const payload: any = await resp.json().catch(() => ({}));
  if (!resp.ok || !payload?.document) {
    throw new Error(payload?.error || 'Failed to upload document securely.');
  }

  const savedDoc = payload.document as CandidateDocumentRecord;

  // Persist immutable document metadata in Firestore subcollection /candidates/{uid}/documents/{docId}
  try {
    await setDoc(doc(db, 'candidates', uid, 'documents', savedDoc.id), {
      id: savedDoc.id,
      candidateUid: uid,
      category: savedDoc.category,
      originalFilename: savedDoc.originalFilename,
      mimeType: savedDoc.mimeType,
      extension: savedDoc.extension,
      sizeBytes: savedDoc.sizeBytes,
      versionNumber: savedDoc.versionNumber,
      isLatest: savedDoc.isLatest,
      uploadedByUid: uid,
      ...(savedDoc.sha256 ? { sha256: savedDoc.sha256 } : {}),
      uploadedAt: serverTimestamp(),
    });
  } catch (fsErr) {
    console.warn('Firestore document metadata sync notice:', fsErr);
  }

  return savedDoc;
}

/**
 * Lists all uploaded documents & version history for a candidate.
 * Restricted strictly to the candidate owner or authorized Recruitment/Support/Super Admins.
 */
export async function listCandidateDocuments(uid: string): Promise<CandidateDocumentRecord[]> {
  if (!uid || !auth.currentUser) return [];

  const merged = new Map<string, CandidateDocumentRecord>();

  // 1. Authoritative backend file index (verifies file exists on private storage)
  try {
    const headers = await getBearerAuthHeaders(false);
    const resp = await fetch(`/api/candidates/${encodeURIComponent(uid)}/documents`, { headers });
    if (resp.ok) {
      const payload: any = await resp.json().catch(() => ({}));
      const serverDocs: CandidateDocumentRecord[] = Array.isArray(payload?.documents)
        ? payload.documents
        : [];
      serverDocs.forEach((docItem) => {
        merged.set(docItem.id, docItem);
      });
    }
  } catch {
    // Non-fatal; merge with Firestore metadata below
  }

  // 2. Firestore subcollection metadata (for cross-session visibility)
  try {
    const q = query(
      collection(db, 'candidates', uid, 'documents'),
      orderBy('uploadedAt', 'desc')
    );
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const raw = d.data();
      if (!merged.has(d.id)) {
        merged.set(d.id, {
          id: d.id,
          candidateUid: String(raw.candidateUid || uid),
          category:
            raw.category === 'certificate' || raw.category === 'supporting'
              ? raw.category
              : 'resume',
          originalFilename: String(raw.originalFilename || 'document.pdf'),
          mimeType: String(raw.mimeType || 'application/pdf'),
          extension: String(raw.extension || '.pdf'),
          sizeBytes: Number(raw.sizeBytes || 0),
          versionNumber: Number(raw.versionNumber || 1),
          isLatest: Boolean(raw.isLatest),
          uploadedAt: toIsoDate(raw.uploadedAt),
          uploadedByUid: String(raw.uploadedByUid || uid),
          sha256: typeof raw.sha256 === 'string' ? raw.sha256 : undefined,
        });
      }
    });
  } catch {
    // Ignore if subcollection has no records yet
  }

  return Array.from(merged.values()).sort((a, b) =>
    (b.uploadedAt || '').localeCompare(a.uploadedAt || '')
  );
}

/**
 * Fetches an authenticated binary document blob for secure in-app preview or download.
 * Never exposes public URLs; uses the caller's Firebase Bearer token.
 */
export async function fetchAuthorizedCandidateDocumentBlob(params: {
  uid: string;
  docId: string;
  disposition: 'inline' | 'attachment';
}): Promise<{ blob: Blob; objectUrl: string; mimeType: string }> {
  const { uid, docId, disposition } = params;
  const headers = await getBearerAuthHeaders(false);
  const resp = await fetch(
    `/api/candidates/${encodeURIComponent(uid)}/documents/${encodeURIComponent(
      docId
    )}/content?disposition=${disposition}`,
    { headers }
  );

  if (!resp.ok) {
    const errPayload: any = await resp.json().catch(() => ({}));
    throw new Error(
      errPayload?.error || `Could not retrieve document (HTTP ${resp.status}).`
    );
  }

  const blob = await resp.blob();
  const objectUrl = URL.createObjectURL(blob);
  return {
    blob,
    objectUrl,
    mimeType: resp.headers.get('Content-Type') || blob.type || 'application/octet-stream',
  };
}

/**
 * Triggers a secure browser download of an authorized candidate document.
 */
export async function downloadAuthorizedCandidateDocument(params: {
  uid: string;
  docId: string;
  filename: string;
}): Promise<void> {
  const { objectUrl } = await fetchAuthorizedCandidateDocumentBlob({
    uid: params.uid,
    docId: params.docId,
    disposition: 'attachment',
  });
  try {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = params.filename || 'document.pdf';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  }
}
