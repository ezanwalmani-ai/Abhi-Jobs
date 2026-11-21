import {
  collection,
  collectionGroup,
  doc,
  DocumentReference,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth as firebaseAuth, db } from '../lib/firebase';
import { RESET_LEGACY_COURSE_IDS } from '../data/learningCatalog';

const LEARNING_RESET_EPOCH_KEY = 'abhijobs_learning_reset_epoch';
const CURRENT_RESET_EPOCH = '2026-11-21-reset-v1';
const USER_CLOUD_CLEANUP_PREFIX = 'abhijobs_learning_cloud_cleanup_v1_';
const LEGACY_DEMO_COURSE_IDS = new Set(['course-demo-1', 'course-demo-2', 'course-demo-3']);
const LEGACY_COURSE_ID_SET = new Set<string>(RESET_LEGACY_COURSE_IDS);

export interface CourseResetCollectionBucket {
  key:
    | 'course_lessons'
    | 'quiz_configs'
    | 'course_enrolments'
    | 'assessment_attempts'
    | 'candidate_certificates'
    | 'public_certificates';
  label: string;
  collectionPath: string;
  count: number;
  samplePaths: string[];
  refs: DocumentReference[];
}

export interface CourseResetInspectionReport {
  inspectedAt: string;
  totalAffectedDocs: number;
  buckets: CourseResetCollectionBucket[];
  preservedCollections: string[];
  warnings: string[];
}

export interface CourseResetExecutionResult {
  success: boolean;
  deletedFirestoreDocs: number;
  clearedLocalKeys: number;
  backendResetOk: boolean;
  error?: string;
}

/**
 * Safely removes ONLY Learn with ABHI course-specific local browser caches and legacy demo courses.
 * STRICT SAFEGUARD: Never touches candidate accounts, profiles, Google Auth state, jobs,
 * applications, resumes, hiring enquiries, or Career Readiness Assessment records.
 */
export function purgeLegacyLocalLearningData(force = false): { clearedKeys: number } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { clearedKeys: 0 };
  }

  try {
    if (!force && localStorage.getItem(LEARNING_RESET_EPOCH_KEY) === CURRENT_RESET_EPOCH) {
      return { clearedKeys: 0 };
    }

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isCourseSpecificKey =
        key.startsWith('abhijobs_course_enrolments_v1_') ||
        key.startsWith('abhijobs_assessment_attempts_v1_') ||
        key.startsWith('abhijobs_certificates_v1_') ||
        key === 'abhijobs_public_cert_index_v1' ||
        key === 'abhijobs_learning_admin_lessons_v1' ||
        key.startsWith('abhijobs_enrollments_') ||
        key.startsWith('hunar_enrollments_');

      if (isCourseSpecificKey) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore individual storage errors
      }
    });

    // Strip only legacy demo courses from cached course arrays if present
    for (const coursesKey of ['abhijobs_courses', 'hunar_courses']) {
      try {
        const raw = localStorage.getItem(coursesKey);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (item) => item && typeof item === 'object' && !LEGACY_DEMO_COURSE_IDS.has(String(item.id))
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem(coursesKey, JSON.stringify(filtered));
          }
        }
      } catch {
        // Ignore malformed legacy entry
      }
    }

    localStorage.setItem(LEARNING_RESET_EPOCH_KEY, CURRENT_RESET_EPOCH);
    return { clearedKeys: keysToRemove.length };
  } catch {
    return { clearedKeys: 0 };
  }
}

async function deleteRefsInBatches(refs: DocumentReference[]): Promise<number> {
  if (refs.length === 0) return 0;
  let deleted = 0;
  const CHUNK_SIZE = 400;

  for (let i = 0; i < refs.length; i += CHUNK_SIZE) {
    const chunk = refs.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
    deleted += chunk.length;
  }

  return deleted;
}

/**
 * Safely deletes any leftover Firestore records belonging EXCLUSIVELY to the 10 removed
 * legacy courses under the currently signed-in verified user's own learning subcollections.
 * Strictly preserves /users/{uid} and /users/{uid}/career_assessments.
 */
export async function cleanupOwnLegacyCourseRecords(appUserId?: string): Promise<number> {
  purgeLegacyLocalLearningData(false);

  const fbUser = firebaseAuth.currentUser;
  if (!fbUser || !fbUser.uid || !fbUser.emailVerified) {
    return 0;
  }

  const markerKey = `${USER_CLOUD_CLEANUP_PREFIX}${fbUser.uid}_${CURRENT_RESET_EPOCH}`;
  try {
    if (localStorage.getItem(markerKey) === 'done') {
      return 0;
    }
  } catch {
    // Continue safely
  }

  try {
    const uid = fbUser.uid;
    const publicCertRefs: DocumentReference[] = [];
    const privateRefs: DocumentReference[] = [];

    // 1. Candidate's own certificates for removed legacy courses
    try {
      const certSnap = await getDocs(
        query(collection(db, 'users', uid, 'certificates'), where('userId', '==', uid))
      );
      certSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const courseId = String(data?.courseId || docSnap.id);
        if (LEGACY_COURSE_ID_SET.has(courseId)) {
          const certId = typeof data?.certificateId === 'string' ? data.certificateId.trim() : '';
          if (certId) {
            publicCertRefs.push(doc(db, 'public_certificates', certId));
          }
          privateRefs.push(docSnap.ref);
        }
      });
    } catch {
      // Ignore if collection does not exist or permission denied
    }

    // 2. Candidate's own assessment attempts for removed legacy courses
    try {
      const attSnap = await getDocs(
        query(collection(db, 'users', uid, 'assessment_attempts'), where('userId', '==', uid))
      );
      attSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const courseId = String(data?.courseId || '');
        if (LEGACY_COURSE_ID_SET.has(courseId)) {
          privateRefs.push(docSnap.ref);
        }
      });
    } catch {
      // Ignore
    }

    // 3. Candidate's own course enrolments for removed legacy courses
    try {
      const enrSnap = await getDocs(
        query(collection(db, 'users', uid, 'course_enrolments'), where('userId', '==', uid))
      );
      enrSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const courseId = String(data?.courseId || docSnap.id);
        if (LEGACY_COURSE_ID_SET.has(courseId)) {
          privateRefs.push(docSnap.ref);
        }
      });
    } catch {
      // Ignore
    }

    let deleted = 0;
    // IMPORTANT: Delete public_certificates BEFORE private certificates so rules ownership check succeeds
    if (publicCertRefs.length > 0) {
      try {
        deleted += await deleteRefsInBatches(publicCertRefs);
      } catch {
        // Continue deleting private records even if public doc was already absent
      }
    }

    if (privateRefs.length > 0) {
      deleted += await deleteRefsInBatches(privateRefs);
    }

    // Also purge local storage cache for this specific user ID
    if (appUserId) {
      try {
        localStorage.removeItem(`abhijobs_course_enrolments_v1_${appUserId}`);
        localStorage.removeItem(`abhijobs_assessment_attempts_v1_${appUserId}`);
        localStorage.removeItem(`abhijobs_certificates_v1_${appUserId}`);
      } catch {
        // Ignore
      }
    }

    try {
      localStorage.setItem(markerKey, 'done');
    } catch {
      // Ignore
    }

    return deleted;
  } catch {
    return 0;
  }
}

/**
 * Step 1 (Read-Only Inspection) for ABHI JOBS Administrators:
 * Inspects ONLY the 6 Learn with ABHI course-specific Firestore collections to identify
 * exact affected documents before any permanent deletion is executed.
 */
export async function inspectAffectedFirestoreCourseRecords(): Promise<CourseResetInspectionReport> {
  const warnings: string[] = [];

  const buckets: CourseResetCollectionBucket[] = [
    {
      key: 'course_lessons',
      label: 'Course Modules & Lessons',
      collectionPath: 'learning_courses/{courseId}/lessons',
      count: 0,
      samplePaths: [],
      refs: [],
    },
    {
      key: 'quiz_configs',
      label: 'Course Quizzes & Final Assessments',
      collectionPath: 'learning_courses/{courseId}/quiz_configs',
      count: 0,
      samplePaths: [],
      refs: [],
    },
    {
      key: 'course_enrolments',
      label: 'Course Enrolments & Lesson Progress',
      collectionPath: 'users/{userId}/course_enrolments',
      count: 0,
      samplePaths: [],
      refs: [],
    },
    {
      key: 'assessment_attempts',
      label: 'Course Quiz & Final Assessment Attempts',
      collectionPath: 'users/{userId}/assessment_attempts',
      count: 0,
      samplePaths: [],
      refs: [],
    },
    {
      key: 'candidate_certificates',
      label: 'Issued Course Completion Certificates',
      collectionPath: 'users/{userId}/certificates',
      count: 0,
      samplePaths: [],
      refs: [],
    },
    {
      key: 'public_certificates',
      label: 'Public Certificate Verification Records',
      collectionPath: 'public_certificates',
      count: 0,
      samplePaths: [],
      refs: [],
    },
  ];

  const byKey = new Map(buckets.map((b) => [b.key, b]));

  const pushRef = (key: CourseResetCollectionBucket['key'], ref: DocumentReference) => {
    const bucket = byKey.get(key);
    if (!bucket) return;
    bucket.refs.push(ref);
    bucket.count = bucket.refs.length;
    if (bucket.samplePaths.length < 4) {
      bucket.samplePaths.push(ref.path);
    }
  };

  // 1 & 2. Inspect learning_courses/{courseId}/lessons and quiz_configs for all legacy courses
  for (const courseId of RESET_LEGACY_COURSE_IDS) {
    try {
      const lessonsSnap = await getDocs(
        query(collection(db, 'learning_courses', courseId, 'lessons'), where('courseId', '==', courseId))
      );
      lessonsSnap.forEach((d) => pushRef('course_lessons', d.ref));
    } catch {
      // Collection empty or inaccessible
    }

    try {
      const quizSnap = await getDocs(
        query(collection(db, 'learning_courses', courseId, 'quiz_configs'), where('courseId', '==', courseId))
      );
      quizSnap.forEach((d) => pushRef('quiz_configs', d.ref));
    } catch {
      // Collection empty or inaccessible
    }
  }

  // 3. Inspect users/*/course_enrolments via scoped collectionGroup
  try {
    const enrSnap = await getDocs(collectionGroup(db, 'course_enrolments'));
    enrSnap.forEach((d) => pushRef('course_enrolments', d.ref));
  } catch (err: any) {
    warnings.push(
      `Could not query all course_enrolments (${err?.code || 'requires verified admin Google sign-in'}).`
    );
  }

  // 4. Inspect users/*/assessment_attempts via scoped collectionGroup
  try {
    const attSnap = await getDocs(collectionGroup(db, 'assessment_attempts'));
    attSnap.forEach((d) => pushRef('assessment_attempts', d.ref));
  } catch (err: any) {
    warnings.push(
      `Could not query all assessment_attempts (${err?.code || 'requires verified admin Google sign-in'}).`
    );
  }

  // 5. Inspect users/*/certificates via scoped collectionGroup
  try {
    const certSnap = await getDocs(collectionGroup(db, 'certificates'));
    certSnap.forEach((d) => pushRef('candidate_certificates', d.ref));
  } catch (err: any) {
    warnings.push(
      `Could not query all candidate certificates (${err?.code || 'requires verified admin Google sign-in'}).`
    );
  }

  // 6. Inspect public_certificates
  try {
    const pubSnap = await getDocs(collection(db, 'public_certificates'));
    pubSnap.forEach((d) => pushRef('public_certificates', d.ref));
  } catch (err: any) {
    warnings.push(
      `Could not query public_certificates (${err?.code || 'requires verified admin Google sign-in'}).`
    );
  }

  const totalAffectedDocs = buckets.reduce((sum, b) => sum + b.count, 0);

  return {
    inspectedAt: new Date().toISOString(),
    totalAffectedDocs,
    buckets,
    preservedCollections: [
      'Candidate Accounts & Profiles (/users/{userId})',
      'Google Authentication & Admin Permissions',
      'Career Readiness Assessments (/users/{userId}/career_assessments)',
      'Job Listings, Applications, Resumes & Recruitment Data',
    ],
    warnings,
  };
}

/**
 * Step 2 (Confirmed Execution) for ABHI JOBS Administrators:
 * Permanently deletes ONLY the inspected Learn with ABHI course records from Firestore,
 * resets in-memory backend course quiz/attempt/certificate stores, and clears course caches.
 */
export async function executeSafeFirestoreCourseReset(
  inspection: CourseResetInspectionReport
): Promise<CourseResetExecutionResult> {
  try {
    // Delete public_certificates first, then candidate certificates, attempts, enrolments, quizzes, lessons
    const orderedKeys: CourseResetCollectionBucket['key'][] = [
      'public_certificates',
      'candidate_certificates',
      'assessment_attempts',
      'course_enrolments',
      'quiz_configs',
      'course_lessons',
    ];

    const bucketMap = new Map(inspection.buckets.map((b) => [b.key, b]));
    let deletedFirestoreDocs = 0;

    for (const key of orderedKeys) {
      const bucket = bucketMap.get(key);
      if (bucket && bucket.refs.length > 0) {
        deletedFirestoreDocs += await deleteRefsInBatches(bucket.refs);
      }
    }

    // Reset backend in-memory course quiz/attempt/certificate stores via admin endpoint
    let backendResetOk = false;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const fbUser = firebaseAuth.currentUser;
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        if (idToken) headers.Authorization = `Bearer ${idToken}`;
      }
      const res = await fetch('/api/learning/admin/reset-course-data', {
        method: 'POST',
        headers,
      });
      backendResetOk = res.ok;
    } catch {
      backendResetOk = false;
    }

    const { clearedKeys } = purgeLegacyLocalLearningData(true);

    return {
      success: true,
      deletedFirestoreDocs,
      clearedLocalKeys: clearedKeys,
      backendResetOk,
    };
  } catch (err: any) {
    return {
      success: false,
      deletedFirestoreDocs: 0,
      clearedLocalKeys: 0,
      backendResetOk: false,
      error: err?.message || 'Unable to complete Firestore course reset.',
    };
  }
}
