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
  const passedModuleQuizIds = normalizeStringIdList(raw.passedModuleQuizIds, 50);
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

  const currentLessonId =
    typeof raw.currentLessonId === 'string' && raw.currentLessonId.trim().length > 0
      ? raw.currentLessonId.trim().slice(0, 128)
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
    currentLessonId,
    completedLessonIds,
    passedModuleQuizIds,
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

  const hasActivity =
    completedMilestones > 0 || Boolean(params.hasCurrentLesson);

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

/**
 * Loads all Learn with ABHI course enrolments & progress records strictly belonging to the authenticated candidate.
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

  const byCourseId = new Map<string, CourseEnrolmentRecord>();

  readLocalEnrolments(effectiveUid).forEach((rec) => byCourseId.set(rec.courseId, rec));
  if (fbUid && appUserId !== fbUid) {
    readLocalEnrolments(appUserId).forEach((rec) => {
      if (!byCourseId.has(rec.courseId)) {
        byCourseId.set(rec.courseId, { ...rec, userId: effectiveUid });
      }
    });
  }

  let syncedFromCloud = false;

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
          const existingLocal = byCourseId.get(normalized.courseId);
          if (
            !existingLocal ||
            new Date(normalized.lastAccessedAt).getTime() >=
              new Date(existingLocal.lastAccessedAt).getTime()
          ) {
            byCourseId.set(normalized.courseId, normalized);
          }
        }
      });
      syncedFromCloud = true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via structured error helper; continue safely with local state
      }
    }
  }

  const merged = Array.from(byCourseId.values()).sort(
    (a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
  );

  writeLocalEnrolments(effectiveUid, merged);
  if (appUserId !== effectiveUid) {
    writeLocalEnrolments(appUserId, merged);
  }

  return { enrolments: merged, syncedFromCloud };
}

/**
 * Enrols an authenticated candidate into a course without allowing duplicate enrolments.
 * Keyed by courseId under /users/{uid}/course_enrolments/{courseId}.
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

  const existingLocal = readLocalEnrolments(effectiveUid).find(
    (item) => item.courseId === course.id
  );
  if (existingLocal) {
    return {
      success: true,
      alreadyEnrolled: true,
      savedToCloud: Boolean(fbUid),
      enrolment: existingLocal,
    };
  }

  const nowIso = new Date().toISOString();
  const firstLessonId = course.modules[0]?.lessons[0]?.id;

  const newRecord: CourseEnrolmentRecord = {
    courseId: course.id.slice(0, 128),
    courseSlug: course.slug.slice(0, 128),
    courseTitle: course.title.slice(0, 160),
    categoryId: course.categoryId,
    userId: effectiveUid,
    status: 'enrolled',
    currentLessonId: firstLessonId ? firstLessonId.slice(0, 128) : undefined,
    completedLessonIds: [],
    passedModuleQuizIds: [],
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
          const nextList = [existingCloud, ...readLocalEnrolments(effectiveUid)];
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
        passedModuleQuizIds: [],
        finalAssessmentPassed: false,
        progressPercent: 0,
        enrolledAt: serverTimestamp(),
        lastAccessedAt: serverTimestamp(),
      };
      if (newRecord.currentLessonId) {
        payload.currentLessonId = newRecord.currentLessonId;
      }

      await setDoc(docRef, payload);
      savedToCloud = true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, docPath);
      } catch {
        // Logged via structured error helper; local enrolment still saved cleanly
      }
    }
  }

  const nextList = [newRecord, ...readLocalEnrolments(effectiveUid)];
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
 * Saves candidate's lessons, module quizzes, final assessment state, and strictly enforces
 * Learn with ABHI completion rules (all required lessons + required module quizzes + final assessment >= 70%).
 */
export async function saveCandidateCourseProgress(
  appUserId: string | null | undefined,
  course: LearningCourseItem,
  params: {
    currentLessonId?: string;
    completedLessonIds: string[];
    totalLessons: number;
    passedModuleQuizIds?: string[];
    requiredModuleQuizIds?: string[];
    finalAssessmentPassed?: boolean;
    bestFinalScorePercent?: number;
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
    50
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

  const safeCurrentLessonId =
    params.currentLessonId && params.currentLessonId.trim().length > 0
      ? params.currentLessonId.trim().slice(0, 128)
      : existingLocal?.currentLessonId;

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
    currentLessonId: safeCurrentLessonId,
    completedLessonIds: sanitizedCompleted,
    passedModuleQuizIds: sanitizedPassedQuizzes,
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
      if (snap.exists()) {
        const updatePayload: Record<string, unknown> = {
          completedLessonIds: sanitizedCompleted,
          passedModuleQuizIds: sanitizedPassedQuizzes,
          finalAssessmentPassed,
          progressPercent: evalResult.progressPercent,
          status: evalResult.status,
          lastAccessedAt: serverTimestamp(),
        };
        if (updatedRecord.currentLessonId) {
          updatePayload.currentLessonId = updatedRecord.currentLessonId;
        }
        if (typeof bestFinalScorePercent === 'number') {
          updatePayload.bestFinalScorePercent = bestFinalScorePercent;
        }
        if (evalResult.isCourseCompleted && !snap.data()?.completedAt) {
          updatePayload.completedAt = serverTimestamp();
        }
        await updateDoc(docRef, updatePayload);
        savedToCloud = true;
      } else {
        const createPayload: Record<string, unknown> = {
          courseId: updatedRecord.courseId,
          courseSlug: updatedRecord.courseSlug,
          courseTitle: updatedRecord.courseTitle,
          categoryId: updatedRecord.categoryId,
          userId: fbUid,
          status: evalResult.status,
          completedLessonIds: sanitizedCompleted,
          passedModuleQuizIds: sanitizedPassedQuizzes,
          finalAssessmentPassed,
          progressPercent: evalResult.progressPercent,
          enrolledAt: serverTimestamp(),
          lastAccessedAt: serverTimestamp(),
        };
        if (updatedRecord.currentLessonId) {
          createPayload.currentLessonId = updatedRecord.currentLessonId;
        }
        if (typeof bestFinalScorePercent === 'number') {
          createPayload.bestFinalScorePercent = bestFinalScorePercent;
        }
        if (evalResult.isCourseCompleted) {
          createPayload.completedAt = serverTimestamp();
        }
        await setDoc(docRef, createPayload);
        savedToCloud = true;
      }
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      } catch {
        // Logged via structured error helper; local state still updated cleanly
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

  return {
    success: true,
    savedToCloud,
    enrolment: updatedRecord,
  };
}
