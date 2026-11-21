import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  auth as firebaseAuth,
  db,
  OperationType,
  handleFirestoreError,
} from '../lib/firebase';
import {
  AdminAssessmentConfig,
  AdminAttemptSummary,
  AssessmentAttemptRecord,
  AssessmentType,
  CourseAssessmentOverview,
  StartedAssessmentSession,
} from '../types/learning';

const LOCAL_ATTEMPTS_PREFIX = 'abhijobs_assessment_attempts_v1_';

// Admin session token held strictly in memory (never written to localStorage/sessionStorage)
let inMemoryAdminToken: string | null = null;

function getAttemptsStorageKey(userId: string): string {
  return `${LOCAL_ATTEMPTS_PREFIX}${userId}`;
}

function getVerifiedFirebaseUid(): string | null {
  const fbUser = firebaseAuth.currentUser;
  if (fbUser && fbUser.uid && fbUser.emailVerified) {
    return fbUser.uid;
  }
  return null;
}

async function getFirebaseIdTokenHeader(): Promise<Record<string, string>> {
  const fbUser = firebaseAuth.currentUser;
  if (!fbUser) return {};
  try {
    const idToken = await fbUser.getIdToken();
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
  } catch {
    return {};
  }
}

async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  if (inMemoryAdminToken) {
    return { Authorization: `Bearer ${inMemoryAdminToken}` };
  }
  return getFirebaseIdTokenHeader();
}

function normalizeTimestamp(val: unknown): string {
  if (typeof val === 'string' && val.trim().length > 0) return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

function normalizeAttempt(raw: any, fallbackUserId: string): AssessmentAttemptRecord | null {
  if (!raw || typeof raw !== 'object' || !raw.id || !raw.courseId) return null;
  return {
    id: String(raw.id).slice(0, 128),
    userId: String(raw.userId || fallbackUserId).slice(0, 128),
    courseId: String(raw.courseId).slice(0, 128),
    courseSlug: typeof raw.courseSlug === 'string' && raw.courseSlug.trim()
      ? raw.courseSlug.trim().slice(0, 128)
      : String(raw.courseId).slice(0, 128),
    courseTitle: String(raw.courseTitle || '').slice(0, 160),
    assessmentType: raw.assessmentType === 'final_assessment' ? 'final_assessment' : 'module_quiz',
    moduleId: typeof raw.moduleId === 'string' && raw.moduleId.trim() ? raw.moduleId.trim() : undefined,
    assessmentTitle: String(raw.assessmentTitle || '').slice(0, 180),
    attemptNumber: Math.max(1, Math.round(Number(raw.attemptNumber || 1))),
    totalQuestions: Math.max(1, Math.round(Number(raw.totalQuestions || 1))),
    correctAnswers: Math.max(0, Math.round(Number(raw.correctAnswers || 0))),
    incorrectAnswers: Math.max(0, Math.round(Number(raw.incorrectAnswers || 0))),
    scorePercent: Math.max(0, Math.min(100, Math.round(Number(raw.scorePercent || 0)))),
    passPercentage: Math.max(0, Math.min(100, Math.round(Number(raw.passPercentage || 70)))),
    passed: Boolean(raw.passed),
    submittedAt: normalizeTimestamp(raw.submittedAt),
    answers: raw.answers && typeof raw.answers === 'object' ? raw.answers : undefined,
    verificationSignature:
      typeof raw.verificationSignature === 'string'
        ? raw.verificationSignature.trim().slice(0, 128)
        : undefined,
    questionResults: Array.isArray(raw.questionResults) ? raw.questionResults : undefined,
  };
}

function readLocalAttempts(userId: string): AssessmentAttemptRecord[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getAttemptsStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const map = new Map<string, AssessmentAttemptRecord>();
    parsed.forEach((item) => {
      const norm = normalizeAttempt(item, userId);
      if (norm && norm.userId === userId) {
        map.set(norm.id, norm);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  } catch {
    return [];
  }
}

function writeLocalAttempts(userId: string, attempts: AssessmentAttemptRecord[]): void {
  if (!userId) return;
  try {
    const map = new Map<string, AssessmentAttemptRecord>();
    attempts.forEach((a) => {
      if (a && a.id) {
        map.set(a.id, { ...a, userId });
      }
    });
    const sorted = Array.from(map.values())
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 200);
    localStorage.setItem(getAttemptsStorageKey(userId), JSON.stringify(sorted));
  } catch {
    // Graceful quota handling
  }
}

async function parseApiResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof (data as any)?.error === 'string'
        ? (data as any).error
        : `Request failed (${res.status})`
    );
  }
  return data as T;
}

// ============================================================================
// CANDIDATE ASSESSMENT APIs
// ============================================================================

export async function fetchCourseAssessmentOverview(
  courseId: string
): Promise<CourseAssessmentOverview> {
  const res = await fetch(
    `/api/learning/assessments/course/${encodeURIComponent(courseId)}/summary`
  );
  return parseApiResponse<CourseAssessmentOverview>(res);
}

export async function startAssessmentSession(params: {
  courseId: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
}): Promise<StartedAssessmentSession> {
  const authHeaders = await getFirebaseIdTokenHeader();
  const res = await fetch('/api/learning/assessments/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(params),
  });
  return parseApiResponse<StartedAssessmentSession>(res);
}

/**
 * Submits candidate answers to the Express backend for authoritative grading,
 * then persists the verified attempt strictly under the candidate's own Firestore subcollection
 * (/users/{uid}/assessment_attempts/{attemptId}) and user-scoped local cache.
 */
export async function submitAssessmentSession(params: {
  sessionId: string;
  answers: Record<string, number>;
  appUserId: string;
}): Promise<{
  attempt: AssessmentAttemptRecord;
  savedToCloud: boolean;
}> {
  const authHeaders = await getFirebaseIdTokenHeader();
  const res = await fetch('/api/learning/assessments/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({
      sessionId: params.sessionId,
      answers: params.answers,
    }),
  });

  const graded = await parseApiResponse<AssessmentAttemptRecord>(res);

  const fbUid = getVerifiedFirebaseUid();
  const effectiveUid = fbUid || params.appUserId;

  const normalizedAttempt: AssessmentAttemptRecord = {
    ...graded,
    userId: effectiveUid,
  };

  let savedToCloud = false;

  if (fbUid) {
    const docPath = `users/${fbUid}/assessment_attempts/${normalizedAttempt.id}`;
    const docRef = doc(db, 'users', fbUid, 'assessment_attempts', normalizedAttempt.id);
    try {
      const sanitizedAnswers: Record<string, number> = {};
      for (const [qId, opt] of Object.entries(normalizedAttempt.answers || params.answers || {})) {
        if (typeof opt === 'number' && Number.isInteger(opt) && opt >= 0 && opt <= 3) {
          sanitizedAnswers[String(qId).slice(0, 100)] = opt;
        }
      }

      const payload: Record<string, unknown> = {
        id: normalizedAttempt.id,
        userId: fbUid,
        courseId: normalizedAttempt.courseId,
        courseSlug: normalizedAttempt.courseSlug || normalizedAttempt.courseId,
        courseTitle: normalizedAttempt.courseTitle,
        assessmentType: normalizedAttempt.assessmentType,
        assessmentTitle: normalizedAttempt.assessmentTitle,
        attemptNumber: normalizedAttempt.attemptNumber,
        totalQuestions: normalizedAttempt.totalQuestions,
        correctAnswers: normalizedAttempt.correctAnswers,
        incorrectAnswers: normalizedAttempt.incorrectAnswers,
        scorePercent: normalizedAttempt.scorePercent,
        passPercentage: normalizedAttempt.passPercentage,
        passed: normalizedAttempt.passed,
        answers: sanitizedAnswers,
        questionResults: (normalizedAttempt.questionResults || []).slice(0, 30),
        verificationSignature: normalizedAttempt.verificationSignature || '',
        submittedAt: serverTimestamp(),
      };
      if (normalizedAttempt.moduleId) {
        payload.moduleId = normalizedAttempt.moduleId;
      }
      await setDoc(docRef, payload);
      savedToCloud = true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, docPath);
      } catch {
        // Logged via structured helper
      }
    }
  }

  const nextLocal = [normalizedAttempt, ...readLocalAttempts(effectiveUid)];
  writeLocalAttempts(effectiveUid, nextLocal);
  if (params.appUserId !== effectiveUid) {
    writeLocalAttempts(params.appUserId, nextLocal);
  }

  return { attempt: normalizedAttempt, savedToCloud };
}

/**
 * Loads assessment attempts strictly owned by the signed-in candidate.
 * When a verified Firebase user is active, Firestore is the authoritative source of truth
 * so manipulated browser localStorage cannot inject forged passes or altered scores.
 */
export async function loadCandidateAssessmentAttempts(
  appUserId: string | null | undefined,
  courseId?: string
): Promise<{
  attempts: AssessmentAttemptRecord[];
  syncedFromCloud: boolean;
}> {
  if (!appUserId) {
    return { attempts: [], syncedFromCloud: false };
  }

  const fbUid = getVerifiedFirebaseUid();
  const effectiveUid = fbUid || appUserId;

  let syncedFromCloud = false;
  const cloudById = new Map<string, AssessmentAttemptRecord>();

  if (fbUid) {
    const path = `users/${fbUid}/assessment_attempts`;
    try {
      const colRef = collection(db, 'users', fbUid, 'assessment_attempts');
      const q = query(colRef, where('userId', '==', fbUid));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const norm = normalizeAttempt({ ...data, id: docSnap.id, userId: fbUid }, fbUid);
        if (norm) {
          cloudById.set(norm.id, norm);
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

  let authoritativeList: AssessmentAttemptRecord[];
  if (fbUid && syncedFromCloud) {
    // Strictly replace local cache with authoritative Firestore records
    authoritativeList = Array.from(cloudById.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    writeLocalAttempts(effectiveUid, authoritativeList);
    if (appUserId !== effectiveUid) {
      writeLocalAttempts(appUserId, authoritativeList);
    }
  } else {
    const byId = new Map<string, AssessmentAttemptRecord>();
    readLocalAttempts(effectiveUid).forEach((a) => byId.set(a.id, a));
    authoritativeList = Array.from(byId.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  const filtered = courseId
    ? authoritativeList.filter((a) => a.courseId === courseId)
    : authoritativeList;

  return { attempts: filtered, syncedFromCloud };
}

// ============================================================================
// ADMIN ASSESSMENT MANAGEMENT APIs
// ============================================================================

export function clearAdminAssessmentToken(): void {
  inMemoryAdminToken = null;
}

export async function checkAdminAssessmentAuthStatus(): Promise<{
  authenticated: boolean;
  method: 'firebase' | 'passcode' | null;
  passcodeMode: 'env' | 'claimed' | 'needs_setup';
}> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch('/api/learning/admin/assessments/auth-status', { headers });
  return parseApiResponse(res);
}

export async function claimAdminAssessmentPasscode(passcode: string): Promise<void> {
  const res = await fetch('/api/learning/admin/assessments/auth/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  const data = await parseApiResponse<{ token: string }>(res);
  inMemoryAdminToken = data.token;
}

export async function loginAdminAssessmentPasscode(passcode: string): Promise<void> {
  const res = await fetch('/api/learning/admin/assessments/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  const data = await parseApiResponse<{ token: string }>(res);
  inMemoryAdminToken = data.token;
}

async function mirrorAdminQuizConfigToFirestore(cfg: AdminAssessmentConfig): Promise<void> {
  const fbUser = firebaseAuth.currentUser;
  if (!fbUser || !fbUser.emailVerified || fbUser.email?.toLowerCase() !== 'ezanwalmani@gmail.com') {
    return;
  }
  const path = `learning_courses/${cfg.courseId}/quiz_configs/${cfg.id}`;
  try {
    const ref = doc(db, 'learning_courses', cfg.courseId, 'quiz_configs', cfg.id);
    await setDoc(ref, {
      id: cfg.id,
      courseId: cfg.courseId,
      assessmentType: cfg.assessmentType,
      moduleId: cfg.moduleId || '',
      title: cfg.title,
      passPercentage: cfg.passPercentage,
      questionCount: cfg.questionCount,
      randomizeOrder: cfg.randomizeOrder,
      requiredForCompletion: cfg.requiredForCompletion,
      questions: cfg.questions,
      updatedBy: fbUser.uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Non-fatal mirror failure; backend config remains authoritative
    }
  }
}

export async function fetchAdminCourseAssessments(courseId: string): Promise<{
  courseId: string;
  moduleQuizzes: AdminAssessmentConfig[];
  finalAssessment: AdminAssessmentConfig | null;
}> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch(
    `/api/learning/admin/assessments/course/${encodeURIComponent(courseId)}`,
    { headers }
  );
  return parseApiResponse(res);
}

export async function upsertAdminAssessmentConfig(params: {
  courseId: string;
  courseSlug?: string;
  courseTitle: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  moduleOrder?: number;
  title: string;
  description?: string;
  passPercentage?: number;
  questionCount?: number;
  randomizeOrder?: boolean;
  requiredForCompletion?: boolean;
  questions?: AdminAssessmentConfig['questions'];
}): Promise<AdminAssessmentConfig> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch('/api/learning/admin/assessments/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ config: AdminAssessmentConfig }>(res);
  void mirrorAdminQuizConfigToFirestore(data.config);
  return data.config;
}

export async function updateAdminAssessmentConfig(params: {
  configId: string;
  title?: string;
  passPercentage?: number;
  questionCount?: number;
  randomizeOrder?: boolean;
  requiredForCompletion?: boolean;
}): Promise<AdminAssessmentConfig> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch('/api/learning/admin/assessments/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ config: AdminAssessmentConfig }>(res);
  void mirrorAdminQuizConfigToFirestore(data.config);
  return data.config;
}

export async function createAdminQuestion(params: {
  configId: string;
  prompt: string;
  options: [string, string, string, string];
  correctOptionIndex: 0 | 1 | 2 | 3;
  explanation: string;
}): Promise<AdminAssessmentConfig> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch('/api/learning/admin/assessments/question', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ config: AdminAssessmentConfig }>(res);
  void mirrorAdminQuizConfigToFirestore(data.config);
  return data.config;
}

export async function updateAdminQuestion(params: {
  questionId: string;
  configId: string;
  prompt: string;
  options: [string, string, string, string];
  correctOptionIndex: 0 | 1 | 2 | 3;
  explanation: string;
}): Promise<AdminAssessmentConfig> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch(
    `/api/learning/admin/assessments/question/${encodeURIComponent(params.questionId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        configId: params.configId,
        prompt: params.prompt,
        options: params.options,
        correctOptionIndex: params.correctOptionIndex,
        explanation: params.explanation,
      }),
    }
  );
  const data = await parseApiResponse<{ config: AdminAssessmentConfig }>(res);
  void mirrorAdminQuizConfigToFirestore(data.config);
  return data.config;
}

export async function deleteAdminQuestion(
  configId: string,
  questionId: string
): Promise<AdminAssessmentConfig> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch(
    `/api/learning/admin/assessments/question/${encodeURIComponent(questionId)}?configId=${encodeURIComponent(configId)}`,
    {
      method: 'DELETE',
      headers,
    }
  );
  const data = await parseApiResponse<{ config: AdminAssessmentConfig }>(res);
  void mirrorAdminQuizConfigToFirestore(data.config);
  return data.config;
}

export async function fetchAdminAssessmentAttempts(filters?: {
  courseId?: string;
  assessmentType?: string;
}): Promise<AdminAttemptSummary[]> {
  const headers = await getAdminAuthHeaders();
  const qs = new URLSearchParams();
  if (filters?.courseId && filters.courseId !== 'all') qs.set('courseId', filters.courseId);
  if (filters?.assessmentType && filters.assessmentType !== 'all') {
    qs.set('assessmentType', filters.assessmentType);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/learning/admin/assessments/attempts${suffix}`, { headers });
  const data = await parseApiResponse<{ attempts: AdminAttemptSummary[] }>(res);
  return data.attempts;
}

export async function deleteAdminAssessmentAttempt(attemptId: string): Promise<void> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch(
    `/api/learning/admin/assessments/attempts/${encodeURIComponent(attemptId)}`,
    {
      method: 'DELETE',
      headers,
    }
  );
  await parseApiResponse(res);
}
