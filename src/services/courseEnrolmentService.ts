import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
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
  CourseEnrolmentRecord,
  CourseProgressStatus,
  LearningCourseItem,
} from '../types/learning';
import { syncLessonProgressToServer } from './certificateService';

const LOCAL_ENROLMENTS_PREFIX = 'abhijobs_course_enrolments_v1_';

function getStorageKey(userId: string): string {
  return `${LOCAL_ENROLMENTS_PREFIX}${userId}`;
}

function normalizeTimestamp(val: unknown): string {
  if (typeof val === 'string' && val.trim().length > 0) return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

function normalizeStringIdList(val: unknown, maxSize = 200): string[] {
  if (!Array.isArray(val)) return [];
  const unique = new Set<string>();
  for (const item of val) {
    if (typeof item === 'string' && item.trim().length > 0) {
      unique.add(item.trim().slice(0, 128));
      if (unique.size >= maxSize) break;
    }
  }
  return Array.from(unique);
}

function normalizeStatus(
  val: unknown,
  finalAssessmentPassed: boolean,
  progressPercent: number,
  hasActivity: boolean
): CourseProgressStatus {
  // Enforce strict rule: a course can only be 'completed' if the final assessment is passed
  if (val === 'completed' && finalAssessmentPassed) {
    return 'completed';
  }
  if (progressPercent > 0 || hasActivity) return 'in_progress';
  return 'enrolled';
}

function normalizeEnrolmentRecord(raw: any, fallbackUserId: string): CourseEnrolmentRecord | null {
  if (!raw || typeof raw !== 'object' || !raw.courseId) return null;
  const completedLessonIds = normalizeStringIdList(raw.completedLessonIds, 200);
  const completedModuleIds = normalizeStringIdList(raw.completedModuleIds, 40);
  const passedModuleQuizIds = normalizeStringIdList(raw.passedModuleQuizIds, 40);
  const finalAssessmentPassed = Boolean(raw.finalAssessmentPassed);
  const bestFinalScorePercent =
    typeof raw.bestFinalScorePercent === 'number' && !Number.isNaN(raw.bestFinalScorePercent)
      ? Math.max(0, Math.min(100, Math.round(raw.bestFinalScorePercent)))
      : undefined;

  const progressRaw = typeof raw.progressPercent === 'number' ? raw.progressPercent : 0;
  let progressPercent = Math.max(0, Math.min(100, Math.round(progressRaw)));
  if (!finalAssessmentPassed && progressPercent >= 100) {
    progressPercent = 95;
  }

  const currentModuleId =
    typeof raw.currentModuleId === 'string' && raw.currentModuleId.trim().length > 0
      ? raw.currentModuleId.trim().slice(0, 128)
      : undefined;
  const currentLessonId =
    typeof raw.currentLessonId === 'string' && raw.currentLessonId.trim().length > 0
      ? raw.currentLessonId.trim().slice(0, 128)
      : undefined;

  const unlockedModuleOrder =
    typeof raw.unlockedModuleOrder === 'number' && Number.isFinite(raw.unlockedModuleOrder)
      ? Math.max(1, Math.min(50, Math.round(raw.unlockedModuleOrder)))
      : Math.max(1, passedModuleQuizIds.length + 1);

  const lastVerifiedAttemptId =
    typeof raw.lastVerifiedAttemptId === 'string' && raw.lastVerifiedAttemptId.trim().length > 0
      ? raw.lastVerifiedAttemptId.trim().slice(0, 128)
      : undefined;
  const lastVerifiedFinalAttemptId =
    typeof raw.lastVerifiedFinalAttemptId === 'string' &&
    raw.lastVerifiedFinalAttemptId.trim().length > 0
      ? raw.lastVerifiedFinalAttemptId.trim().slice(0, 128)
      : undefined;

  const enrolledAt = normalizeTimestamp(raw.enrolledAt);
  const lastAccessedAt = raw.lastAccessedAt ? normalizeTimestamp(raw.lastAccessedAt) : enrolledAt;
  const completedAt =
    finalAssessmentPassed && raw.completedAt ? normalizeTimestamp(raw.completedAt) : undefined;

  const hasActivity =
    completedLessonIds.length > 0 ||
    passedModuleQuizIds.length > 0 ||
    finalAssessmentPassed ||
    Boolean(currentLessonId);

  return {
    courseId: String(raw.courseId).slice(0, 128),
    courseSlug: String(raw.courseSlug || '').slice(0, 128),
    courseTitle: String(raw.courseTitle || '').slice(0, 160),
    categoryId: raw.categoryId,
    userId: String(raw.userId || fallbackUserId).slice(0, 128),
    status: normalizeStatus(raw.status, finalAssessmentPassed, progressPercent, hasActivity),
    currentModuleId,
    currentLessonId,
    completedLessonIds,
    completedModuleIds,
    passedModuleQuizIds,
    unlockedModuleOrder,
    lastVerifiedAttemptId,
    lastVerifiedFinalAttemptId,
    finalAssessmentPassed,
    bestFinalScorePercent,
    progressPercent,
    enrolledAt,
    lastAccessedAt,
    completedAt,
  };
}

/**
 * Evaluates strict Learn with ABHI course completion rules:
 * 1. All required lessons are completed.
 * 2. All required module quizzes are passed.
 * 3. The final course assessment is passed (>= 70%).
 */
export function evaluateCourseCompletion(params: {
  completedLessonIds: string[];
  totalLessons: number;
  passedModuleQuizIds: string[];
  requiredModuleQuizIds: string[];
  finalAssessmentPassed: boolean;
  hasCurrentLesson?: boolean;
}): {
  allLessonsCompleted: boolean;
  allRequiredQuizzesPassed: boolean;
  finalAssessmentPassed: boolean;
  isCourseCompleted: boolean;
  progressPercent: number;
  status: CourseProgressStatus;
} {
  const safeTotalLessons = Math.max(1, params.totalLessons);
  const uniqueLessonsDone = Math.min(safeTotalLessons, new Set(params.completedLessonIds).size);
  const allLessonsCompleted = uniqueLessonsDone >= safeTotalLessons;

  const passedQuizSet = new Set(params.passedModuleQuizIds);
  const requiredQuizIds = Array.from(new Set(params.requiredModuleQuizIds));
  const passedRequiredQuizzesCount = requiredQuizIds.filter((id) => passedQuizSet.has(id)).length;
  const allRequiredQuizzesPassed =
    requiredQuizIds.length === 0 || passedRequiredQuizzesCount >= requiredQuizIds.length;

  const finalAssessmentPassed = Boolean(params.finalAssessmentPassed);
  const isCourseCompleted =
    allLessonsCompleted && allRequiredQuizzesPassed && finalAssessmentPassed;

  // Weight milestones: every lesson + every required module quiz + final assessment
  const totalMilestones = safeTotalLessons + requiredQuizIds.length + 1;
  const completedMilestones =
    uniqueLessonsDone + passedRequiredQuizzesCount + (finalAssessmentPassed ? 1 : 0);

  let progressPercent = isCourseCompleted
    ? 100
    : Math.min(99, Math.round((completedMilestones / totalMilestones) * 100));

  if (completedMilestones === 0) progressPercent = 0;

  const hasActivity = completedMilestones > 0 || Boolean(params.hasCurrentLesson);

  const status: CourseProgressStatus = isCourseCompleted
    ? 'completed'
    : hasActivity
    ? 'in_progress'
    : 'enrolled';

  return {
    allLessonsCompleted,
    allRequiredQuizzesPassed,
    finalAssessmentPassed,
    isCourseCompleted,
    progressPercent,
    status,
  };
}

function getVerifiedFirebaseUid(): string | null {
  const fbUser = firebaseAuth.currentUser;
  if (fbUser && fbUser.uid && fbUser.emailVerified) {
    return fbUser.uid;
  }
  return null;
}

function readLocalEnrolments(userId: string): CourseEnrolmentRecord[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const map = new Map<string, CourseEnrolmentRecord>();
    parsed.forEach((item) => {
      const normalized = normalizeEnrolmentRecord(item, userId);
      if (normalized && normalized.userId === userId) {
        map.set(normalized.courseId, normalized);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );
  } catch {
    return [];
  }
}

function writeLocalEnrolments(userId: string, enrolments: CourseEnrolmentRecord[]): void {
  if (!userId) return;
  try {
    const map = new Map<string, CourseEnrolmentRecord>();
    enrolments.forEach((item) => {
      if (item && item.courseId) {
        map.set(item.courseId, { ...item, userId });
      }
    });
    localStorage.setItem(getStorageKey(userId), JSON.stringify(Array.from(map.values())));
  } catch {
    // Graceful quota handling
  }
}

export interface ServerCourseProgressStatus {
  userId: string;
  courseId: string;
  passedModuleQuizIds: string[];
  unlockedModuleOrder: number;
  finalAssessmentPassed: boolean;
  bestFinalScorePercent: number | null;
  lastVerifiedAttemptId: string | null;
  lastVerifiedFinalAttemptId: string | null;
  completedLessonIds: string[];
}

/**
 * Fetches authoritative module unlock & assessment status from the Express backend
 * (computed strictly from HMAC-verified server-graded attempts, never browser storage).
 */
export async function fetchServerCourseProgressStatus(
  courseId: string
): Promise<ServerCourseProgressStatus | null> {
  const fbUser = firebaseAuth.currentUser;
  if (!fbUser || !courseId) return null;
  try {
    const idToken = await fbUser.getIdToken();
    const res = await fetch(
      `/api/learning/progress/course/${encodeURIComponent(courseId)}/status`,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as ServerCourseProgressStatus;
  } catch {
    return null;
  }
}

/**
 * Loads all Learn with ABHI course enrolments & progress records strictly belonging to the authenticated candidate.
 * When a verified Firebase user is active, Firestore is treated as the authoritative source of truth
 * so browser localStorage edits CANNOT alter unlocked modules, passed quizzes, or completion status.
 */
export async function loadCandidateEnrolments(
  appUserId: string | null | undefined
): Promise<{
  enrolments: CourseEnrolmentRecord[];
  syncedFromCloud: boolean;
}> {
  if (!appUserId) {
    return { enrolments: [], syncedFromCloud: false };
  }

  const fbUid = getVerifiedFirebaseUid();
  const effectiveUid = fbUid || appUserId;

  let syncedFromCloud = false;
  const cloudByCourseId = new Map<string, CourseEnrolmentRecord>();

  if (fbUid) {
    const path = `users/${fbUid}/course_enrolments`;
    try {
      const colRef = collection(db, 'users', fbUid, 'course_enrolments');
      const q = query(colRef, where('userId', '==', fbUid));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const normalized = normalizeEnrolmentRecord(
          { ...data, courseId: docSnap.id, userId: fbUid },
          fbUid
        );
        if (normalized) {
          cloudByCourseId.set(normalized.courseId, normalized);
        }
      });
      syncedFromCloud = true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via structured error helper
      }
    }
  }

  let authoritativeList: CourseEnrolmentRecord[];
  if (fbUid && syncedFromCloud) {
    // Hydrate authoritative quiz passes, module unlocks, and final assessment status from backend
    const cloudRecords = Array.from(cloudByCourseId.values());
    const hydrated = await Promise.all(
      cloudRecords.map(async (rec) => {
        const serverStatus = await fetchServerCourseProgressStatus(rec.courseId);
        if (!serverStatus) return rec;
        const mergedPassed = Array.from(
          new Set([...rec.passedModuleQuizIds, ...serverStatus.passedModuleQuizIds])
        );
        const mergedCompletedLessons = Array.from(
          new Set([...rec.completedLessonIds, ...serverStatus.completedLessonIds])
        );
        // If Firestore holds verified lesson completion that server hasn't seen yet, sync it cleanly
        if (
          rec.completedLessonIds.some((id) => !serverStatus.completedLessonIds.includes(id))
        ) {
          await syncLessonProgressToServer({
            courseId: rec.courseId,
            completedLessonIds: mergedCompletedLessons,
            candidateId: fbUid,
          });
        }
        const unlockedOrder = Math.max(rec.unlockedModuleOrder, serverStatus.unlockedModuleOrder);
        const finalPassed = rec.finalAssessmentPassed || serverStatus.finalAssessmentPassed;
        const bestFinal =
          typeof serverStatus.bestFinalScorePercent === 'number'
            ? Math.max(rec.bestFinalScorePercent ?? 0, serverStatus.bestFinalScorePercent)
            : rec.bestFinalScorePercent;
        return {
          ...rec,
          completedLessonIds: mergedCompletedLessons,
          passedModuleQuizIds: mergedPassed,
          completedModuleIds: Array.from(new Set([...rec.completedModuleIds, ...mergedPassed])),
          unlockedModuleOrder: unlockedOrder,
          finalAssessmentPassed: finalPassed,
          bestFinalScorePercent: bestFinal,
          lastVerifiedAttemptId: serverStatus.lastVerifiedAttemptId || rec.lastVerifiedAttemptId,
          lastVerifiedFinalAttemptId:
            serverStatus.lastVerifiedFinalAttemptId || rec.lastVerifiedFinalAttemptId,
        };
      })
    );

    authoritativeList = hydrated.sort(
      (a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );
    writeLocalEnrolments(effectiveUid, authoritativeList);
    if (appUserId !== effectiveUid) {
      writeLocalEnrolments(appUserId, authoritativeList);
    }
  } else {
    const localMap = new Map<string, CourseEnrolmentRecord>();
    readLocalEnrolments(effectiveUid).forEach((rec) => localMap.set(rec.courseId, rec));
    authoritativeList = Array.from(localMap.values()).sort(
      (a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );
  }

  return { enrolments: authoritativeList, syncedFromCloud };
}

/**
 * Enrols an authenticated candidate into a course without allowing duplicate enrolments.
 * Keyed by courseId under /users/{uid}/course_enrolments/{courseId}.
 * Starts strictly at `unlockedModuleOrder: 1`, `status: 'enrolled'`, `finalAssessmentPassed: false`.
 */
export async function enrolCandidateInCourse(
  appUserId: string | null | undefined,
  course: LearningCourseItem
): Promise<{
  success: boolean;
  alreadyEnrolled?: boolean;
  savedToCloud?: boolean;
  enrolment?: CourseEnrolmentRecord;
  error?: string;
}> {
  if (!appUserId) {
    return {
      success: false,
      error: 'Please sign in to your ABHI JOBS account to enrol in this course.',
    };
  }

  const fbUid = getVerifiedFirebaseUid();
  const effectiveUid = fbUid || appUserId;

  const nowIso = new Date().toISOString();
  const firstModuleId = course.modules[0]?.id;
  const firstLessonId = course.modules[0]?.lessons[0]?.id;

  const newRecord: CourseEnrolmentRecord = {
    courseId: course.id.slice(0, 128),
    courseSlug: course.slug.slice(0, 128),
    courseTitle: course.title.slice(0, 160),
    categoryId: course.categoryId,
    userId: effectiveUid,
    status: 'enrolled',
    currentModuleId: firstModuleId ? firstModuleId.slice(0, 128) : undefined,
    currentLessonId: firstLessonId ? firstLessonId.slice(0, 128) : undefined,
    completedLessonIds: [],
    completedModuleIds: [],
    passedModuleQuizIds: [],
    unlockedModuleOrder: 1,
    finalAssessmentPassed: false,
    progressPercent: 0,
    enrolledAt: nowIso,
    lastAccessedAt: nowIso,
  };

  let savedToCloud = false;

  if (fbUid) {
    const docPath = `users/${fbUid}/course_enrolments/${newRecord.courseId}`;
    const docRef = doc(db, 'users', fbUid, 'course_enrolments', newRecord.courseId);

    try {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        const existingCloud = normalizeEnrolmentRecord(
          {
            ...data,
            courseId: existingSnap.id,
            courseSlug: data.courseSlug || course.slug,
            courseTitle: data.courseTitle || course.title,
            categoryId: data.categoryId || course.categoryId,
            userId: fbUid,
          },
          fbUid
        );
        if (existingCloud) {
          const nextList = [
            existingCloud,
            ...readLocalEnrolments(effectiveUid).filter((c) => c.courseId !== existingCloud.courseId),
          ];
          writeLocalEnrolments(effectiveUid, nextList);
          if (appUserId !== effectiveUid) writeLocalEnrolments(appUserId, nextList);
          return {
            success: true,
            alreadyEnrolled: true,
            savedToCloud: true,
            enrolment: existingCloud,
          };
        }
      }

      const payload: Record<string, unknown> = {
        courseId: newRecord.courseId,
        courseSlug: newRecord.courseSlug,
        courseTitle: newRecord.courseTitle,
        categoryId: newRecord.categoryId,
        userId: fbUid,
        status: 'enrolled',
        completedLessonIds: [],
        completedModuleIds: [],
        passedModuleQuizIds: [],
        unlockedModuleOrder: 1,
        finalAssessmentPassed: false,
        progressPercent: 0,
        enrolledAt: serverTimestamp(),
        lastAccessedAt: serverTimestamp(),
      };
      if (newRecord.currentModuleId) {
        payload.currentModuleId = newRecord.currentModuleId;
      }
      if (newRecord.currentLessonId) {
        payload.currentLessonId = newRecord.currentLessonId;
      }

      await setDoc(docRef, payload);
      savedToCloud = true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, docPath);
      } catch {
        // Logged via structured error helper
      }
    }
  } else {
    const existingLocal = readLocalEnrolments(effectiveUid).find(
      (item) => item.courseId === course.id
    );
    if (existingLocal) {
      return {
        success: true,
        alreadyEnrolled: true,
        savedToCloud: false,
        enrolment: existingLocal,
      };
    }
  }

  const nextList = [
    newRecord,
    ...readLocalEnrolments(effectiveUid).filter((item) => item.courseId !== course.id),
  ];
  writeLocalEnrolments(effectiveUid, nextList);
  if (appUserId !== effectiveUid) {
    writeLocalEnrolments(appUserId, nextList);
  }

  return {
    success: true,
    alreadyEnrolled: false,
    savedToCloud,
    enrolment: newRecord,
  };
}

/**
 * Saves candidate's lessons, verified module quiz passes, or verified final assessment pass.
 * Strictly maps each update to the corresponding action-based Firestore rule so students
 * cannot self-unlock modules or mark a course complete without a verified attempt record.
 */
export async function saveCandidateCourseProgress(
  appUserId: string | null | undefined,
  course: LearningCourseItem,
  params: {
    currentModuleId?: string;
    currentLessonId?: string;
    completedLessonIds: string[];
    totalLessons: number;
    passedModuleQuizIds?: string[];
    completedModuleIds?: string[];
    unlockedModuleOrder?: number;
    requiredModuleQuizIds?: string[];
    finalAssessmentPassed?: boolean;
    bestFinalScorePercent?: number;
    /** Server-graded passing module quiz attempt ID (required by Firestore rules to advance quiz unlock) */
    verifiedAttemptId?: string;
    /** Server-graded passing final assessment attempt ID (required by Firestore rules to mark course completed) */
    verifiedFinalAttemptId?: string;
  }
): Promise<{
  success: boolean;
  savedToCloud: boolean;
  enrolment?: CourseEnrolmentRecord;
  error?: string;
}> {
  if (!appUserId) {
    return {
      success: false,
      savedToCloud: false,
      error: 'Please sign in to save your learning progress.',
    };
  }

  const fbUid = getVerifiedFirebaseUid();
  const effectiveUid = fbUid || appUserId;

  const existingLocal = readLocalEnrolments(effectiveUid).find(
    (item) => item.courseId === course.id
  );

  const sanitizedCompleted = normalizeStringIdList(params.completedLessonIds, 200);
  const sanitizedPassedQuizzes = normalizeStringIdList(
    params.passedModuleQuizIds ?? existingLocal?.passedModuleQuizIds ?? [],
    40
  );
  const sanitizedCompletedModules = normalizeStringIdList(
    params.completedModuleIds ??
      existingLocal?.completedModuleIds ??
      sanitizedPassedQuizzes,
    40
  );
  const requiredQuizIds =
    params.requiredModuleQuizIds ?? course.modules.map((m) => m.id);

  const finalAssessmentPassed =
    params.finalAssessmentPassed !== undefined
      ? Boolean(params.finalAssessmentPassed)
      : Boolean(existingLocal?.finalAssessmentPassed);

  const bestFinalScorePercent =
    typeof params.bestFinalScorePercent === 'number'
      ? Math.max(
          existingLocal?.bestFinalScorePercent ?? 0,
          Math.max(0, Math.min(100, Math.round(params.bestFinalScorePercent)))
        )
      : existingLocal?.bestFinalScorePercent;

  const safeCurrentModuleId =
    params.currentModuleId && params.currentModuleId.trim().length > 0
      ? params.currentModuleId.trim().slice(0, 128)
      : existingLocal?.currentModuleId;
  const safeCurrentLessonId =
    params.currentLessonId && params.currentLessonId.trim().length > 0
      ? params.currentLessonId.trim().slice(0, 128)
      : existingLocal?.currentLessonId;

  const currentUnlocked = existingLocal?.unlockedModuleOrder ?? 1;
  const computedUnlocked =
    typeof params.unlockedModuleOrder === 'number'
      ? Math.max(currentUnlocked, Math.min(50, Math.round(params.unlockedModuleOrder)))
      : Math.max(currentUnlocked, sanitizedPassedQuizzes.length + 1);

  const evalResult = evaluateCourseCompletion({
    completedLessonIds: sanitizedCompleted,
    totalLessons: params.totalLessons,
    passedModuleQuizIds: sanitizedPassedQuizzes,
    requiredModuleQuizIds: requiredQuizIds,
    finalAssessmentPassed,
    hasCurrentLesson: Boolean(safeCurrentLessonId),
  });

  const nowIso = new Date().toISOString();
  const completedAt = evalResult.isCourseCompleted
    ? existingLocal?.completedAt || nowIso
    : undefined;

  const updatedRecord: CourseEnrolmentRecord = {
    courseId: course.id.slice(0, 128),
    courseSlug: course.slug.slice(0, 128),
    courseTitle: course.title.slice(0, 160),
    categoryId: course.categoryId,
    userId: effectiveUid,
    status: evalResult.status,
    currentModuleId: safeCurrentModuleId,
    currentLessonId: safeCurrentLessonId,
    completedLessonIds: sanitizedCompleted,
    completedModuleIds: sanitizedCompletedModules,
    passedModuleQuizIds: sanitizedPassedQuizzes,
    unlockedModuleOrder: computedUnlocked,
    lastVerifiedAttemptId: params.verifiedAttemptId || existingLocal?.lastVerifiedAttemptId,
    lastVerifiedFinalAttemptId:
      params.verifiedFinalAttemptId || existingLocal?.lastVerifiedFinalAttemptId,
    finalAssessmentPassed,
    bestFinalScorePercent,
    progressPercent: evalResult.progressPercent,
    enrolledAt: existingLocal?.enrolledAt || nowIso,
    lastAccessedAt: nowIso,
    completedAt,
  };

  let savedToCloud = false;

  if (fbUid) {
    const docPath = `users/${fbUid}/course_enrolments/${updatedRecord.courseId}`;
    const docRef = doc(db, 'users', fbUid, 'course_enrolments', updatedRecord.courseId);

    try {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        // Initial creation MUST always begin in clean initial state (no pre-completed enrolment)
        const createPayload: Record<string, unknown> = {
          courseId: updatedRecord.courseId,
          courseSlug: updatedRecord.courseSlug,
          courseTitle: updatedRecord.courseTitle,
          categoryId: updatedRecord.categoryId,
          userId: fbUid,
          status: 'enrolled',
          completedLessonIds: [],
          completedModuleIds: [],
          passedModuleQuizIds: [],
          unlockedModuleOrder: 1,
          finalAssessmentPassed: false,
          progressPercent: 0,
          enrolledAt: serverTimestamp(),
          lastAccessedAt: serverTimestamp(),
        };
        if (updatedRecord.currentModuleId) {
          createPayload.currentModuleId = updatedRecord.currentModuleId;
        }
        if (updatedRecord.currentLessonId) {
          createPayload.currentLessonId = updatedRecord.currentLessonId;
        }
        await setDoc(docRef, createPayload);
      }

      const freshSnap = snap.exists() ? snap : await getDoc(docRef);
      const existingData = freshSnap.data() || {};

      // Respect hardened firestore.rules: students may ONLY update non-authoritative
      // lesson resume/completion bookmarks. Quiz passes, module unlocks, final assessment
      // scores, progressPercent, and 'completed' status are strictly server/admin-controlled.
      if (existingData.status !== 'completed') {
        if (!params.verifiedAttemptId && !params.verifiedFinalAttemptId) {
          const lessonPayload: Record<string, unknown> = {
            completedLessonIds: sanitizedCompleted,
            status: sanitizedCompleted.length > 0 || safeCurrentLessonId ? 'in_progress' : 'enrolled',
            lastAccessedAt: serverTimestamp(),
          };
          if (updatedRecord.currentModuleId) {
            lessonPayload.currentModuleId = updatedRecord.currentModuleId;
          }
          if (updatedRecord.currentLessonId) {
            lessonPayload.currentLessonId = updatedRecord.currentLessonId;
          }
          await updateDoc(docRef, lessonPayload);
          savedToCloud = true;
        }
      } else {
        savedToCloud = true;
      }
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      } catch {
        // Logged via structured error helper
      }
    }
  }

  const nextList = [
    updatedRecord,
    ...readLocalEnrolments(effectiveUid).filter((item) => item.courseId !== course.id),
  ];
  writeLocalEnrolments(effectiveUid, nextList);
  if (appUserId !== effectiveUid) {
    writeLocalEnrolments(appUserId, nextList);
  }

  // Keep backend lesson progress synchronously aligned before unlocking quiz/certificate endpoints
  await syncLessonProgressToServer({
    courseId: course.id,
    completedLessonIds: sanitizedCompleted,
    candidateId: effectiveUid,
  });

  return {
    success: true,
    savedToCloud,
    enrolment: updatedRecord,
  };
}
