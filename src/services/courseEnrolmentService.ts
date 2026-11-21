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

function normalizeStatus(val: unknown, progressPercent: number, hasCurrent: boolean): CourseProgressStatus {
  if (progressPercent >= 100) return 'completed';
  if (val === 'completed' || val === 'in_progress' || val === 'enrolled') {
    return val;
  }
  if (progressPercent > 0 || hasCurrent) return 'in_progress';
  return 'enrolled';
}

function normalizeCompletedIds(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  const unique = new Set<string>();
  for (const item of val) {
    if (typeof item === 'string' && item.trim().length > 0) {
      unique.add(item.trim().slice(0, 128));
      if (unique.size >= 200) break;
    }
  }
  return Array.from(unique);
}

function normalizeEnrolmentRecord(raw: any, fallbackUserId: string): CourseEnrolmentRecord | null {
  if (!raw || typeof raw !== 'object' || !raw.courseId) return null;
  const completedLessonIds = normalizeCompletedIds(raw.completedLessonIds);
  const progressRaw = typeof raw.progressPercent === 'number' ? raw.progressPercent : 0;
  const progressPercent = Math.max(0, Math.min(100, Math.round(progressRaw)));
  const currentLessonId =
    typeof raw.currentLessonId === 'string' && raw.currentLessonId.trim().length > 0
      ? raw.currentLessonId.trim().slice(0, 128)
      : undefined;
  const enrolledAt = normalizeTimestamp(raw.enrolledAt);
  const lastAccessedAt = raw.lastAccessedAt ? normalizeTimestamp(raw.lastAccessedAt) : enrolledAt;

  return {
    courseId: String(raw.courseId).slice(0, 128),
    courseSlug: String(raw.courseSlug || '').slice(0, 128),
    courseTitle: String(raw.courseTitle || '').slice(0, 160),
    categoryId: raw.categoryId,
    userId: String(raw.userId || fallbackUserId).slice(0, 128),
    status: normalizeStatus(raw.status, progressPercent, Boolean(currentLessonId)),
    currentLessonId,
    completedLessonIds,
    progressPercent,
    enrolledAt,
    lastAccessedAt,
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
          // Prefer whichever record was accessed more recently
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
 * Automatically saves candidate's current lesson, completed lessons, accurate progress %,
 * and last accessed timestamp strictly under their own Firestore enrolment document.
 */
export async function saveCandidateCourseProgress(
  appUserId: string | null | undefined,
  course: LearningCourseItem,
  params: {
    currentLessonId?: string;
    completedLessonIds: string[];
    totalLessons: number;
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

  const sanitizedCompleted = normalizeCompletedIds(params.completedLessonIds);
  const safeTotal = Math.max(1, params.totalLessons);
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round((sanitizedCompleted.length / safeTotal) * 100))
  );
  const safeCurrentLessonId =
    params.currentLessonId && params.currentLessonId.trim().length > 0
      ? params.currentLessonId.trim().slice(0, 128)
      : undefined;

  const status: CourseProgressStatus =
    progressPercent >= 100
      ? 'completed'
      : sanitizedCompleted.length > 0 || Boolean(safeCurrentLessonId)
      ? 'in_progress'
      : 'enrolled';

  const existingLocal = readLocalEnrolments(effectiveUid).find(
    (item) => item.courseId === course.id
  );
  const nowIso = new Date().toISOString();

  const updatedRecord: CourseEnrolmentRecord = {
    courseId: course.id.slice(0, 128),
    courseSlug: course.slug.slice(0, 128),
    courseTitle: course.title.slice(0, 160),
    categoryId: course.categoryId,
    userId: effectiveUid,
    status,
    currentLessonId: safeCurrentLessonId ?? existingLocal?.currentLessonId,
    completedLessonIds: sanitizedCompleted,
    progressPercent,
    enrolledAt: existingLocal?.enrolledAt || nowIso,
    lastAccessedAt: nowIso,
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
          progressPercent,
          status,
          lastAccessedAt: serverTimestamp(),
        };
        if (updatedRecord.currentLessonId) {
          updatePayload.currentLessonId = updatedRecord.currentLessonId;
        }
        await updateDoc(docRef, updatePayload);
        savedToCloud = true;
      } else {
        // Ensure enrolment doc exists cleanly if created locally earlier
        const createPayload: Record<string, unknown> = {
          courseId: updatedRecord.courseId,
          courseSlug: updatedRecord.courseSlug,
          courseTitle: updatedRecord.courseTitle,
          categoryId: updatedRecord.categoryId,
          userId: fbUid,
          status,
          completedLessonIds: sanitizedCompleted,
          progressPercent,
          enrolledAt: serverTimestamp(),
          lastAccessedAt: serverTimestamp(),
        };
        if (updatedRecord.currentLessonId) {
          createPayload.currentLessonId = updatedRecord.currentLessonId;
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
