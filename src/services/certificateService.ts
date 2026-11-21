import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth as firebaseAuth,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  CertificateVerificationResult,
  CourseCertificateRecord,
  PublicCertificateVerification,
} from '../types/learning';

const LOCAL_CERTS_PREFIX = 'abhijobs_certificates_v1_';
const PUBLIC_CERT_CACHE_KEY = 'abhijobs_public_cert_index_v1';

function getUserCertStorageKey(userId: string): string {
  return `${LOCAL_CERTS_PREFIX}${userId}`;
}

function getVerifiedFirebaseUid(): string | null {
  const fbUser = firebaseAuth.currentUser;
  if (fbUser && fbUser.uid && fbUser.emailVerified) {
    return fbUser.uid;
  }
  return null;
}

async function buildAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const fbUser = firebaseAuth.currentUser;
    if (fbUser) {
      const idToken = await fbUser.getIdToken();
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }
    }
  } catch {
    // Graceful fallback
  }
  return headers;
}

function normalizeTimestamp(val: unknown): string {
  if (typeof val === 'string' && val.trim().length > 0) return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

function normalizeCertificateRecord(
  raw: any,
  fallbackUserId: string
): CourseCertificateRecord | null {
  if (!raw || typeof raw !== 'object' || !raw.certificateId || !raw.courseId) {
    return null;
  }
  const score =
    typeof raw.finalAssessmentScore === 'number' && !Number.isNaN(raw.finalAssessmentScore)
      ? Math.max(70, Math.min(100, Math.round(raw.finalAssessmentScore)))
      : 70;

  return {
    certificateId: String(raw.certificateId).trim().toUpperCase().slice(0, 64),
    userId: String(raw.userId || fallbackUserId).trim().slice(0, 128),
    candidateName: String(raw.candidateName || 'ABHI JOBS Candidate').trim().slice(0, 120),
    courseId: String(raw.courseId).trim().slice(0, 128),
    courseSlug: String(raw.courseSlug || '').trim().slice(0, 128),
    courseTitle: String(raw.courseTitle || 'Learn with ABHI Course').trim().slice(0, 160),
    completionDate: normalizeTimestamp(raw.completionDate),
    issuedAt: normalizeTimestamp(raw.issuedAt || raw.completionDate),
    finalAssessmentScore: score,
    status: raw.status === 'revoked' ? 'revoked' : 'valid',
    verificationSignature: String(raw.verificationSignature || '').trim().slice(0, 128),
    finalAttemptId:
      typeof raw.finalAttemptId === 'string' && raw.finalAttemptId.trim()
        ? raw.finalAttemptId.trim().slice(0, 128)
        : undefined,
    templateId:
      typeof raw.templateId === 'string' && raw.templateId.trim()
        ? raw.templateId.trim().slice(0, 128)
        : 'default_abhi_certificate',
  };
}

function readLocalCertificates(userId: string): CourseCertificateRecord[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getUserCertStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const map = new Map<string, CourseCertificateRecord>();
    parsed.forEach((item) => {
      const normalized = normalizeCertificateRecord(item, userId);
      if (normalized && normalized.userId === userId) {
        map.set(normalized.courseId, normalized);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
  } catch {
    return [];
  }
}

function writeLocalCertificates(userId: string, certs: CourseCertificateRecord[]): void {
  if (!userId) return;
  try {
    const byCourse = new Map<string, CourseCertificateRecord>();
    certs.forEach((cert) => {
      if (cert && cert.courseId) {
        byCourse.set(cert.courseId, { ...cert, userId });
      }
    });
    localStorage.setItem(
      getUserCertStorageKey(userId),
      JSON.stringify(Array.from(byCourse.values()))
    );
  } catch {
    // Graceful quota handling
  }
}

/**
 * Stores strictly ONLY the 5 non-PII public verification fields in a local fallback index
 * so QR/ID verification remains responsive during local preview restarts.
 */
function savePublicVerificationProjection(cert: CourseCertificateRecord): void {
  try {
    const raw = localStorage.getItem(PUBLIC_CERT_CACHE_KEY);
    const parsed: Record<string, PublicCertificateVerification> = raw ? JSON.parse(raw) : {};
    parsed[cert.certificateId] = {
      certificateId: cert.certificateId,
      candidateName: cert.candidateName,
      courseTitle: cert.courseTitle,
      issueDate: cert.completionDate,
      status: cert.status,
    };
    localStorage.setItem(PUBLIC_CERT_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // Safe fallback
  }
}

function readPublicVerificationProjection(
  certificateId: string
): PublicCertificateVerification | null {
  try {
    const raw = localStorage.getItem(PUBLIC_CERT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const entry = parsed?.[certificateId];
    if (!entry || typeof entry !== 'object') return null;
    return {
      certificateId: String(entry.certificateId),
      candidateName: String(entry.candidateName),
      courseTitle: String(entry.courseTitle),
      issueDate: String(entry.issueDate),
      status: entry.status === 'revoked' ? 'revoked' : 'valid',
    };
  } catch {
    return null;
  }
}

/**
 * Synchronizes completed lesson IDs to the authoritative backend progress store
 * so certificate eligibility validation always reflects up-to-date lesson progress.
 */
export async function syncLessonProgressToServer(params: {
  courseId: string;
  completedLessonIds: string[];
  candidateId?: string;
}): Promise<void> {
  if (!params.courseId) return;
  try {
    const headers = await buildAuthHeaders();
    await fetch('/api/learning/progress/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        courseId: params.courseId,
        completedLessonIds: params.completedLessonIds,
        candidateId: params.candidateId,
      }),
    });
  } catch {
    // Non-blocking sync
  }
}

export interface IssueCertificateResponse {
  success: boolean;
  alreadyIssued?: boolean;
  certificate?: CourseCertificateRecord;
  error?: string;
  missingRequirements?: {
    lessonsCompleted: number;
    lessonsRequired: number;
    quizzesPassed: number;
    quizzesRequired: number;
    finalAssessmentPassed: boolean;
    bestFinalScorePercent: number | null;
  };
}

/**
 * Requests backend-validated issuance of a Course Completion Certificate.
 * Persists to Firestore atomically (private candidate certificate + public verification record)
 * when a verified Firebase user is active, without allowing duplicates for (userId, courseId).
 */
export async function issueCourseCertificate(params: {
  appUserId: string | null | undefined;
  candidateName: string;
  courseId: string;
  completedLessonIds?: string[];
}): Promise<IssueCertificateResponse> {
  if (!params.appUserId) {
    return {
      success: false,
      error: 'Please sign in to your ABHI JOBS account to earn and view certificates.',
    };
  }

  const fbUid = getVerifiedFirebaseUid();
  const effectiveUid = fbUid || params.appUserId;

  // Check if already issued in Firestore first (prevents duplicate issuance across server restarts)
  if (fbUid) {
    try {
      const existingRef = doc(db, 'users', fbUid, 'certificates', params.courseId);
      const existingSnap = await getDoc(existingRef);
      if (existingSnap.exists()) {
        const cloudCert = normalizeCertificateRecord(
          { ...existingSnap.data(), courseId: existingSnap.id, userId: fbUid },
          fbUid
        );
        if (cloudCert) {
          const nextLocal = [
            cloudCert,
            ...readLocalCertificates(effectiveUid).filter((c) => c.courseId !== cloudCert.courseId),
          ];
          writeLocalCertificates(effectiveUid, nextLocal);
          if (params.appUserId !== effectiveUid) {
            writeLocalCertificates(params.appUserId, nextLocal);
          }
          savePublicVerificationProjection(cloudCert);
          return {
            success: true,
            alreadyIssued: true,
            certificate: cloudCert,
          };
        }
      }
    } catch {
      // Proceed to backend issuance check
    }
  }

  // Call authoritative backend endpoint to validate all 3 completion rules
  const headers = await buildAuthHeaders();
  let response: Response;
  try {
    response = await fetch('/api/learning/certificates/issue', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        courseId: params.courseId,
        candidateId: effectiveUid,
        candidateName: params.candidateName.trim() || 'ABHI JOBS Candidate',
        completedLessonIds: params.completedLessonIds || [],
      }),
    });
  } catch {
    return {
      success: false,
      error: 'Could not reach the certificate verification server. Please try again.',
    };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.certificate) {
    return {
      success: false,
      error:
        data?.error ||
        'Certificate could not be issued. Please ensure all lessons, module quizzes, and the final assessment (70%+) are completed.',
      missingRequirements: data?.missingRequirements,
    };
  }

  const issuedCert = normalizeCertificateRecord(data.certificate, effectiveUid);
  if (!issuedCert) {
    return {
      success: false,
      error: 'Received malformed certificate data from server.',
    };
  }

  // Atomically persist private certificate + non-PII public verification record to Firestore
  if (fbUid) {
    const privateRef = doc(db, 'users', fbUid, 'certificates', issuedCert.courseId);
    const publicRef = doc(db, 'public_certificates', issuedCert.certificateId);
    const privatePath = `users/${fbUid}/certificates/${issuedCert.courseId}`;

    try {
      const existingSnap = await getDoc(privateRef);
      if (!existingSnap.exists()) {
        const batch = writeBatch(db);
        const privatePayload: Record<string, unknown> = {
          certificateId: issuedCert.certificateId,
          userId: fbUid,
          candidateName: issuedCert.candidateName,
          courseId: issuedCert.courseId,
          courseSlug: issuedCert.courseSlug,
          courseTitle: issuedCert.courseTitle,
          completionDate: issuedCert.completionDate,
          finalAssessmentScore: issuedCert.finalAssessmentScore,
          status: 'valid',
          verificationSignature: issuedCert.verificationSignature,
          templateId: issuedCert.templateId || 'default_abhi_certificate',
          issuedAt: serverTimestamp(),
        };
        if (issuedCert.finalAttemptId) {
          privatePayload.finalAttemptId = issuedCert.finalAttemptId;
        }
        batch.set(privateRef, privatePayload);
        batch.set(publicRef, {
          certificateId: issuedCert.certificateId,
          candidateName: issuedCert.candidateName,
          courseId: issuedCert.courseId,
          courseTitle: issuedCert.courseTitle,
          issueDate: issuedCert.completionDate,
          status: 'valid',
          issuedAt: serverTimestamp(),
        });
        await batch.commit();
      }
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, privatePath);
      } catch {
        // Logged via structured helper; backend-issued certificate remains available
      }
    }
  }

  const nextLocal = [
    issuedCert,
    ...readLocalCertificates(effectiveUid).filter((c) => c.courseId !== issuedCert.courseId),
  ];
  writeLocalCertificates(effectiveUid, nextLocal);
  if (params.appUserId !== effectiveUid) {
    writeLocalCertificates(params.appUserId, nextLocal);
  }
  savePublicVerificationProjection(issuedCert);

  return {
    success: true,
    alreadyIssued: Boolean(data.alreadyIssued),
    certificate: issuedCert,
  };
}

/**
 * Loads all Course Completion Certificates belonging strictly to the authenticated candidate.
 */
export async function loadCandidateCertificates(
  appUserId: string | null | undefined
): Promise<{
  certificates: CourseCertificateRecord[];
  syncedFromCloud: boolean;
}> {
  if (!appUserId) {
    return { certificates: [], syncedFromCloud: false };
  }

  const fbUid = getVerifiedFirebaseUid();
  const effectiveUid = fbUid || appUserId;
  const authoritativeByCourse = new Map<string, CourseCertificateRecord>();

  // 1. Load backend-verified certificates
  let syncedFromServer = false;
  try {
    const headers = await buildAuthHeaders();
    const res = await fetch(
      `/api/learning/certificates/mine?candidateId=${encodeURIComponent(effectiveUid)}`,
      { headers }
    );
    if (res.ok) {
      const payload = await res.json();
      if (Array.isArray(payload?.certificates)) {
        payload.certificates.forEach((raw: any) => {
          const normalized = normalizeCertificateRecord(raw, effectiveUid);
          if (normalized) {
            authoritativeByCourse.set(normalized.courseId, normalized);
          }
        });
        syncedFromServer = true;
      }
    }
  } catch {
    // Graceful offline fallback
  }

  // 2. Load Firestore certificates strictly scoped to the verified owner
  let syncedFromCloud = false;
  if (fbUid) {
    const path = `users/${fbUid}/certificates`;
    try {
      const colRef = collection(db, 'users', fbUid, 'certificates');
      const q = query(colRef, where('userId', '==', fbUid));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const normalized = normalizeCertificateRecord(
          { ...docSnap.data(), courseId: docSnap.id, userId: fbUid },
          fbUid
        );
        if (normalized) {
          authoritativeByCourse.set(normalized.courseId, normalized);
        }
      });
      syncedFromCloud = true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via structured helper
      }
    }
  }

  let merged: CourseCertificateRecord[];
  if ((fbUid && syncedFromCloud) || syncedFromServer) {
    // Strictly replace local cache with authoritative cloud/backend certificates
    merged = Array.from(authoritativeByCourse.values()).sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
    merged.forEach((cert) => savePublicVerificationProjection(cert));
    writeLocalCertificates(effectiveUid, merged);
    if (appUserId !== effectiveUid) {
      writeLocalCertificates(appUserId, merged);
    }
  } else {
    merged = readLocalCertificates(effectiveUid);
  }

  return { certificates: merged, syncedFromCloud };
}

/**
 * Publicly verifies a certificate by Certificate ID.
 * Accessible without login. Returns strictly non-PII verification metadata only:
 * candidateName, courseTitle, certificateId, issueDate, and status.
 */
export async function verifyCertificatePublic(
  rawCertificateId: string
): Promise<CertificateVerificationResult> {
  const normalizedId = rawCertificateId.trim().toUpperCase();
  if (!/^[A-Z0-9-]{8,64}$/.test(normalizedId)) {
    return {
      found: false,
      valid: false,
      status: 'not_found',
    };
  }

  // 1. Check authoritative backend public verification endpoint
  try {
    const res = await fetch(
      `/api/learning/certificates/verify/${encodeURIComponent(normalizedId)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.found && data?.certificate) {
        const pubCert: PublicCertificateVerification = {
          certificateId: String(data.certificate.certificateId),
          candidateName: String(data.certificate.candidateName),
          courseTitle: String(data.certificate.courseTitle),
          issueDate: String(data.certificate.issueDate),
          status: data.certificate.status === 'revoked' ? 'revoked' : 'valid',
        };
        return {
          found: true,
          valid: pubCert.status === 'valid',
          status: pubCert.status,
          certificate: pubCert,
        };
      }
    }
  } catch {
    // Fall through to Firestore public lookup
  }

  // 2. Check Firestore single-document public verification registry (/public_certificates/{certId})
  try {
    const publicDocRef = doc(db, 'public_certificates', normalizedId);
    const snap = await getDoc(publicDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const pubCert: PublicCertificateVerification = {
        certificateId: String(data.certificateId || snap.id),
        candidateName: String(data.candidateName || ''),
        courseTitle: String(data.courseTitle || ''),
        issueDate: String(data.issueDate || normalizeTimestamp(data.issuedAt)),
        status: data.status === 'revoked' ? 'revoked' : 'valid',
      };
      return {
        found: true,
        valid: pubCert.status === 'valid',
        status: pubCert.status,
        certificate: pubCert,
      };
    }
  } catch {
    // Fall through to local preview projection
  }

  // 3. Same-browser preview fallback (strictly non-PII projection only)
  const localPub = readPublicVerificationProjection(normalizedId);
  if (localPub) {
    return {
      found: true,
      valid: localPub.status === 'valid',
      status: localPub.status,
      certificate: localPub,
    };
  }

  return {
    found: false,
    valid: false,
    status: 'not_found',
  };
}
