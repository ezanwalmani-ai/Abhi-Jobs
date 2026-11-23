/**
 * Persistent Firestore Data Access Layer for Learn with ABHI:
 * - Courses (`/learning_courses/{courseId}`)
 * - Course Modules (`/learning_courses/{courseId}/modules/{moduleId}`)
 * - YouTube Video Metadata Validation & Normalization
 * - Per-Video Student Playback Progress (`/users/{userId}/video_progress/{progressKey}`)
 * - Certificate Templates (`/certificate_templates/{templateId}`)
 *
 * All writes strictly adhere to `firebase-blueprint.json` and `firestore.rules`
 * and reuse the existing Firebase project & Google authentication (`src/lib/firebase.ts`).
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  auth as firebaseAuth,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  CertificateTemplateRecord,
  CourseDifficultyLevel,
  CourseLesson,
  CourseModule,
  CourseModuleRecord,
  CoursePublishStatus,
  LearningCategoryId,
  LearningCourseItem,
  LearningCourseMetadata,
  LessonVideoItem,
  VideoProgressRecord,
} from '../types/learning';
import { loadCourseLessonsFromFirestore } from './courseContentService';

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function sanitizeId(raw: string, fallbackPrefix: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `${fallbackPrefix}_${Date.now()}`;
}

function normalizeTimestamp(val: unknown): string {
  if (typeof val === 'string' && val.trim().length > 0) return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (
    val &&
    typeof val === 'object' &&
    'toDate' in val &&
    typeof (val as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function getVerifiedFirebaseUid(): string | null {
  const fbUser = firebaseAuth.currentUser;
  if (fbUser && fbUser.uid && fbUser.emailVerified) {
    return fbUser.uid;
  }
  return null;
}

// ============================================================================
// YOUTUBE VIDEO METADATA VALIDATION & SANITIZATION
// ============================================================================

/**
 * Extracts a strict 11-character YouTube video ID from either a raw ID or a valid
 * HTTPS YouTube URL (`youtube.com/watch?v=`, `youtu.be/`, `youtube-nocookie.com/embed/`, `youtube.com/shorts/`).
 * Returns null for invalid, non-HTTPS, or unsupported inputs.
 */
export function extractYouTubeVideoId(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  if (YOUTUBE_VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return YOUTUBE_VIDEO_ID_REGEX.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const vParam = parsed.searchParams.get('v');
      if (vParam && YOUTUBE_VIDEO_ID_REGEX.test(vParam)) {
        return vParam;
      }
      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.split('/embed/')[1]?.split('/')[0] || '';
        return YOUTUBE_VIDEO_ID_REGEX.test(id) ? id : null;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || '';
        return YOUTUBE_VIDEO_ID_REGEX.test(id) ? id : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function buildYouTubeNoCookieEmbedUrl(youtubeVideoId: string): string {
  const id = extractYouTubeVideoId(youtubeVideoId);
  if (!id) return '';
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&enablejsapi=1`;
}

export function sanitizeLessonVideoItem(
  raw: Partial<LessonVideoItem> & { url?: string },
  index: number
): LessonVideoItem | null {
  const extractedId = extractYouTubeVideoId(raw.youtubeVideoId || raw.url || '');
  if (!extractedId) return null;

  const title = String(raw.title || `Video ${index + 1}`).trim().slice(0, 180);
  if (!title) return null;

  const durationSeconds =
    typeof raw.durationSeconds === 'number' && Number.isFinite(raw.durationSeconds)
      ? Math.max(0, Math.min(86400, Math.round(raw.durationSeconds)))
      : 0;

  return {
    id: sanitizeId(String(raw.id || `vid_${index + 1}`), 'vid').slice(0, 64),
    title,
    youtubeVideoId: extractedId,
    description: String(raw.description || '').trim().slice(0, 500),
    durationSeconds,
    durationLabel: raw.durationLabel ? String(raw.durationLabel).trim().slice(0, 32) : undefined,
    order:
      typeof raw.order === 'number' && Number.isFinite(raw.order)
        ? Math.max(1, Math.min(50, Math.round(raw.order)))
        : index + 1,
  };
}

// ============================================================================
// COURSES COLLECTION (`/learning_courses/{courseId}`)
// ============================================================================

function docToCourseMetadata(docId: string, data: any): LearningCourseMetadata {
  const level: CourseDifficultyLevel =
    data.level === 'Intermediate' ? 'Intermediate' : 'Beginner';
  const status: CoursePublishStatus = data.status === 'published' ? 'published' : 'draft';

  const intro = data.courseIntroduction && typeof data.courseIntroduction === 'object'
    ? {
        headline: String(data.courseIntroduction.headline || '').slice(0, 200),
        overview: String(data.courseIntroduction.overview || '').slice(0, 2000),
        studyGuidance: Array.isArray(data.courseIntroduction.studyGuidance)
          ? data.courseIntroduction.studyGuidance
              .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
              .slice(0, 12)
              .map((s: string) => s.trim().slice(0, 240))
          : [],
        prerequisites: String(data.courseIntroduction.prerequisites || '').slice(0, 500),
      }
    : {
        headline: '',
        overview: '',
        studyGuidance: [],
        prerequisites: '',
      };

  return {
    id: docId,
    slug: String(data.slug || docId).slice(0, 128),
    categoryId: (data.categoryId || 'excel-digital-skills') as LearningCategoryId,
    categoryName: String(data.categoryName || 'Excel and Digital Skills').slice(0, 100),
    title: String(data.title || 'Untitled Course').slice(0, 160),
    shortDescription: String(data.shortDescription || '').slice(0, 400),
    fullDescription: String(data.fullDescription || '').slice(0, 4000),
    level,
    estimatedDuration: String(data.estimatedDuration || '').slice(0, 64),
    isFree: true,
    sequentialUnlock: Boolean(data.sequentialUnlock ?? true),
    passPercentage:
      typeof data.passPercentage === 'number'
        ? Math.max(70, Math.min(100, Math.round(data.passPercentage)))
        : 70,
    certificateTemplateId: String(
      data.certificateTemplateId || 'default_abhi_certificate'
    ).slice(0, 128),
    status,
    moduleCount:
      typeof data.moduleCount === 'number'
        ? Math.max(0, Math.min(50, Math.round(data.moduleCount)))
        : 0,
    courseIntroduction: intro,
    whatYouWillLearn: Array.isArray(data.whatYouWillLearn)
      ? data.whatYouWillLearn
          .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
          .slice(0, 20)
          .map((s: string) => s.trim().slice(0, 200))
      : [],
    skillsDeveloped: Array.isArray(data.skillsDeveloped)
      ? data.skillsDeveloped
          .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
          .slice(0, 20)
          .map((s: string) => s.trim().slice(0, 100))
      : [],
    updatedBy: String(data.updatedBy || ''),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

export async function listPublishedCoursesFromFirestore(): Promise<LearningCourseMetadata[]> {
  const path = 'learning_courses';
  try {
    const colRef = collection(db, 'learning_courses');
    const q = query(colRef, where('status', '==', 'published'));
    const snap = await getDocs(q);
    const courses: LearningCourseMetadata[] = [];
    snap.forEach((docSnap) => {
      courses.push(docToCourseMetadata(docSnap.id, docSnap.data()));
    });
    return courses.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch {
      // Logged via structured helper
    }
    return [];
  }
}

export async function listAllCoursesForAdminFromFirestore(): Promise<LearningCourseMetadata[]> {
  const path = 'learning_courses';
  try {
    const snap = await getDocs(collection(db, 'learning_courses'));
    const courses: LearningCourseMetadata[] = [];
    snap.forEach((docSnap) => {
      courses.push(docToCourseMetadata(docSnap.id, docSnap.data()));
    });
    return courses.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch {
      // Logged via structured helper
    }
    return [];
  }
}

export async function getCourseMetadataById(
  courseId: string
): Promise<LearningCourseMetadata | null> {
  if (!SAFE_ID_REGEX.test(courseId)) return null;
  const path = `learning_courses/${courseId}`;
  try {
    const snap = await getDoc(doc(db, 'learning_courses', courseId));
    if (!snap.exists()) return null;
    return docToCourseMetadata(snap.id, snap.data());
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch {
      // Logged via structured helper
    }
    return null;
  }
}

export async function getCourseMetadataBySlug(
  slug: string
): Promise<LearningCourseMetadata | null> {
  const cleanSlug = slug.trim().slice(0, 128);
  if (!cleanSlug) return null;
  const path = 'learning_courses';
  try {
    const q = query(
      collection(db, 'learning_courses'),
      where('slug', '==', cleanSlug),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const first = snap.docs[0];
    return docToCourseMetadata(first.id, first.data());
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch {
      // Logged via structured helper
    }
    return null;
  }
}

export async function saveAdminCourseMetadata(
  input: Omit<LearningCourseMetadata, 'updatedBy' | 'updatedAt'>
): Promise<{ success: boolean; course?: LearningCourseMetadata; error?: string }> {
  const fbUid = getVerifiedFirebaseUid();
  if (!fbUid) {
    return { success: false, error: 'Verified administrator Firebase session is required.' };
  }

  const safeId = sanitizeId(input.id, 'course');
  const safeSlug = sanitizeId(input.slug || safeId, 'course');
  const title = input.title.trim().slice(0, 160);
  if (!title) {
    return { success: false, error: 'Course title is required.' };
  }

  const docPath = `learning_courses/${safeId}`;
  const docRef = doc(db, 'learning_courses', safeId);

  const payload = {
    id: safeId,
    slug: safeSlug,
    categoryId: input.categoryId,
    categoryName: input.categoryName.trim().slice(0, 100),
    title,
    shortDescription: input.shortDescription.trim().slice(0, 400),
    fullDescription: input.fullDescription.trim().slice(0, 4000),
    level: input.level === 'Intermediate' ? 'Intermediate' : 'Beginner',
    estimatedDuration: input.estimatedDuration.trim().slice(0, 64),
    isFree: true,
    sequentialUnlock: Boolean(input.sequentialUnlock),
    passPercentage: Math.max(70, Math.min(100, Math.round(input.passPercentage || 70))),
    certificateTemplateId: sanitizeId(
      input.certificateTemplateId || 'default_abhi_certificate',
      'tpl'
    ),
    status: input.status === 'published' ? 'published' : 'draft',
    moduleCount: Math.max(0, Math.min(50, Math.round(input.moduleCount || 0))),
    courseIntroduction: {
      headline: input.courseIntroduction.headline.trim().slice(0, 200),
      overview: input.courseIntroduction.overview.trim().slice(0, 2000),
      studyGuidance: input.courseIntroduction.studyGuidance
        .slice(0, 12)
        .map((s) => s.trim().slice(0, 240))
        .filter(Boolean),
      prerequisites: input.courseIntroduction.prerequisites.trim().slice(0, 500),
    },
    whatYouWillLearn: input.whatYouWillLearn
      .slice(0, 20)
      .map((s) => s.trim().slice(0, 200))
      .filter(Boolean),
    skillsDeveloped: input.skillsDeveloped
      .slice(0, 20)
      .map((s) => s.trim().slice(0, 100))
      .filter(Boolean),
    updatedBy: fbUid,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, payload);
    return {
      success: true,
      course: {
        ...(payload as unknown as LearningCourseMetadata),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch {
      // Logged via structured helper
    }
    return {
      success: false,
      error: 'Could not save course metadata to Firestore. Verify admin permissions.',
    };
  }
}

export async function deleteAdminCourseMetadata(
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  const fbUid = getVerifiedFirebaseUid();
  if (!fbUid || !SAFE_ID_REGEX.test(courseId)) {
    return { success: false, error: 'Verified administrator session and valid courseId required.' };
  }
  const docPath = `learning_courses/${courseId}`;
  try {
    await deleteDoc(doc(db, 'learning_courses', courseId));
    return { success: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    } catch {
      // Logged via structured helper
    }
    return { success: false, error: 'Failed to delete course metadata.' };
  }
}

// ============================================================================
// COURSE MODULES SUBCOLLECTION (`/learning_courses/{courseId}/modules/{moduleId}`)
// ============================================================================

function docToCourseModuleRecord(docId: string, data: any): CourseModuleRecord {
  return {
    id: docId,
    courseId: String(data.courseId || ''),
    order:
      typeof data.order === 'number' && data.order >= 1
        ? Math.min(50, Math.round(data.order))
        : 1,
    title: String(data.title || 'Untitled Module').slice(0, 160),
    summary: String(data.summary || '').slice(0, 600),
    estimatedMinutes:
      typeof data.estimatedMinutes === 'number' && data.estimatedMinutes >= 1
        ? Math.min(600, Math.round(data.estimatedMinutes))
        : 30,
    quizRequired: Boolean(data.quizRequired ?? true),
    passPercentage:
      typeof data.passPercentage === 'number'
        ? Math.max(50, Math.min(100, Math.round(data.passPercentage)))
        : 70,
    updatedBy: String(data.updatedBy || ''),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

export async function listCourseModulesFromFirestore(
  courseId: string
): Promise<CourseModuleRecord[]> {
  if (!SAFE_ID_REGEX.test(courseId)) return [];
  const path = `learning_courses/${courseId}/modules`;
  try {
    const colRef = collection(db, 'learning_courses', courseId, 'modules');
    const q = query(colRef, where('courseId', '==', courseId));
    const snap = await getDocs(q);
    const modules: CourseModuleRecord[] = [];
    snap.forEach((docSnap) => {
      modules.push(docToCourseModuleRecord(docSnap.id, docSnap.data()));
    });
    return modules.sort((a, b) => a.order - b.order);
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch {
      // Logged via structured helper
    }
    return [];
  }
}

export async function saveAdminCourseModule(
  input: Omit<CourseModuleRecord, 'updatedBy' | 'updatedAt'>
): Promise<{ success: boolean; module?: CourseModuleRecord; error?: string }> {
  const fbUid = getVerifiedFirebaseUid();
  if (!fbUid) {
    return { success: false, error: 'Verified administrator Firebase session is required.' };
  }

  const safeCourseId = sanitizeId(input.courseId, 'course');
  const safeModuleId = sanitizeId(input.id, 'mod');
  const title = input.title.trim().slice(0, 160);
  if (!title) {
    return { success: false, error: 'Module title is required.' };
  }

  const docPath = `learning_courses/${safeCourseId}/modules/${safeModuleId}`;
  const docRef = doc(db, 'learning_courses', safeCourseId, 'modules', safeModuleId);

  const payload = {
    id: safeModuleId,
    courseId: safeCourseId,
    order: Math.max(1, Math.min(50, Math.round(input.order || 1))),
    title,
    summary: input.summary.trim().slice(0, 600),
    estimatedMinutes: Math.max(1, Math.min(600, Math.round(input.estimatedMinutes || 30))),
    quizRequired: Boolean(input.quizRequired),
    passPercentage: Math.max(50, Math.min(100, Math.round(input.passPercentage || 70))),
    updatedBy: fbUid,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, payload);
    return {
      success: true,
      module: {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch {
      // Logged via structured helper
    }
    return { success: false, error: 'Failed to save course module to Firestore.' };
  }
}

export async function deleteAdminCourseModule(
  courseId: string,
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  const fbUid = getVerifiedFirebaseUid();
  if (!fbUid || !SAFE_ID_REGEX.test(courseId) || !SAFE_ID_REGEX.test(moduleId)) {
    return { success: false, error: 'Verified admin session and valid IDs required.' };
  }
  const docPath = `learning_courses/${courseId}/modules/${moduleId}`;
  try {
    await deleteDoc(doc(db, 'learning_courses', courseId, 'modules', moduleId));
    return { success: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    } catch {
      // Logged via structured helper
    }
    return { success: false, error: 'Failed to delete course module.' };
  }
}

/**
 * Loads a complete Learn with ABHI course directly from Firestore
 * (course metadata + ordered modules + ordered lessons with YouTube video metadata).
 */
export async function loadFullCourseFromFirestore(
  courseIdOrSlug: string
): Promise<LearningCourseItem | null> {
  const meta =
    (await getCourseMetadataById(courseIdOrSlug)) ||
    (await getCourseMetadataBySlug(courseIdOrSlug));
  if (!meta) return null;

  const [moduleRecords, lessonRecords] = await Promise.all([
    listCourseModulesFromFirestore(meta.id),
    loadCourseLessonsFromFirestore(meta.id),
  ]);

  const lessonsByModule = new Map<string, CourseLesson[]>();
  for (const lesson of lessonRecords) {
    const existing = lessonsByModule.get(lesson.moduleId) || [];
    existing.push(lesson);
    lessonsByModule.set(lesson.moduleId, existing);
  }

  const modules: CourseModule[] = moduleRecords.map((mod) => ({
    id: mod.id,
    order: mod.order,
    title: mod.title,
    summary: mod.summary,
    estimatedMinutes: mod.estimatedMinutes,
    quizRequired: mod.quizRequired,
    passPercentage: mod.passPercentage,
    quizPlanned: true,
    lessons: (lessonsByModule.get(mod.id) || []).sort((a, b) => a.order - b.order),
  }));

  return {
    id: meta.id,
    slug: meta.slug,
    categoryId: meta.categoryId,
    categoryName: meta.categoryName,
    title: meta.title,
    shortDescription: meta.shortDescription,
    fullDescription: meta.fullDescription,
    level: meta.level,
    estimatedDuration: meta.estimatedDuration,
    isFree: true,
    sequentialUnlock: meta.sequentialUnlock,
    passPercentage: meta.passPercentage,
    certificateTemplateId: meta.certificateTemplateId,
    status: meta.status,
    courseIntroduction: meta.courseIntroduction,
    whatYouWillLearn: meta.whatYouWillLearn,
    skillsDeveloped: meta.skillsDeveloped,
    modules,
  };
}

// ============================================================================
// PER-VIDEO STUDENT PLAYBACK PROGRESS (`/users/{userId}/video_progress/{progressKey}`)
// ============================================================================

export function buildVideoProgressDocId(
  courseId: string,
  lessonId: string,
  videoId: string
): string {
  const raw = `${courseId}__${lessonId}__${videoId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  return raw.slice(0, 128);
}

function docToVideoProgress(docId: string, data: any, fallbackUserId: string): VideoProgressRecord {
  const hasPlayed = Boolean(data.hasPlayed);
  const maxPercentWatched =
    typeof data.maxPercentWatched === 'number'
      ? Math.max(0, Math.min(100, Math.round(data.maxPercentWatched)))
      : 0;
  return {
    id: docId,
    userId: String(data.userId || fallbackUserId).slice(0, 128),
    courseId: String(data.courseId || '').slice(0, 128),
    lessonId: String(data.lessonId || '').slice(0, 128),
    videoId: String(data.videoId || '').slice(0, 64),
    youtubeVideoId: String(data.youtubeVideoId || '').slice(0, 20),
    durationSeconds:
      typeof data.durationSeconds === 'number' && data.durationSeconds >= 0
        ? Math.min(86400, Math.round(data.durationSeconds))
        : 0,
    watchedSeconds:
      typeof data.watchedSeconds === 'number' && data.watchedSeconds >= 0
        ? Math.min(86400, Math.round(data.watchedSeconds))
        : 0,
    maxPercentWatched,
    lastPositionSeconds:
      typeof data.lastPositionSeconds === 'number' && data.lastPositionSeconds >= 0
        ? Math.min(86400, Math.round(data.lastPositionSeconds))
        : 0,
    hasPlayed,
    completedViaPlayer: Boolean(data.completedViaPlayer) && hasPlayed && maxPercentWatched >= 90,
    manualCompleted: Boolean(data.manualCompleted),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

export async function loadCourseVideoProgress(
  courseId: string
): Promise<{ records: VideoProgressRecord[]; syncedFromCloud: boolean }> {
  const fbUid = getVerifiedFirebaseUid();
  if (!fbUid || !SAFE_ID_REGEX.test(courseId)) {
    return { records: [], syncedFromCloud: false };
  }

  const path = `users/${fbUid}/video_progress`;
  try {
    const colRef = collection(db, 'users', fbUid, 'video_progress');
    const q = query(
      colRef,
      where('userId', '==', fbUid),
      where('courseId', '==', courseId)
    );
    const snap = await getDocs(q);
    const records: VideoProgressRecord[] = [];
    snap.forEach((docSnap) => {
      records.push(docToVideoProgress(docSnap.id, docSnap.data(), fbUid));
    });
    return { records, syncedFromCloud: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch {
      // Logged via structured helper
    }
    return { records: [], syncedFromCloud: false };
  }
}

export async function saveVideoPlaybackProgress(input: {
  courseId: string;
  lessonId: string;
  videoId: string;
  youtubeVideoId: string;
  durationSeconds: number;
  watchedSeconds: number;
  maxPercentWatched: number;
  lastPositionSeconds: number;
  hasPlayed: boolean;
  completedViaPlayer: boolean;
  manualCompleted?: boolean;
}): Promise<{ success: boolean; record?: VideoProgressRecord; error?: string }> {
  const fbUid = getVerifiedFirebaseUid();
  if (!fbUid) {
    return { success: false, error: 'Verified Firebase sign-in is required to save video progress.' };
  }

  const safeYoutubeId = extractYouTubeVideoId(input.youtubeVideoId);
  if (!safeYoutubeId) {
    return { success: false, error: 'Invalid YouTube video ID.' };
  }

  const safeCourseId = sanitizeId(input.courseId, 'course');
  const safeLessonId = sanitizeId(input.lessonId, 'lesson');
  const safeVideoId = sanitizeId(input.videoId, 'vid').slice(0, 64);
  const progressKey = buildVideoProgressDocId(safeCourseId, safeLessonId, safeVideoId);

  const durationSeconds = Math.max(0, Math.min(86400, Math.round(input.durationSeconds || 0)));
  const watchedSeconds = Math.max(0, Math.min(86400, Math.round(input.watchedSeconds || 0)));
  const maxPercentWatched = Math.max(0, Math.min(100, Math.round(input.maxPercentWatched || 0)));
  const lastPositionSeconds = Math.max(
    0,
    Math.min(86400, Math.round(input.lastPositionSeconds || 0))
  );
  const hasPlayed = Boolean(input.hasPlayed);
  // Strictly disallow player completion unless genuine playback reached >= 90%
  const completedViaPlayer =
    Boolean(input.completedViaPlayer) && hasPlayed && maxPercentWatched >= 90;
  const manualCompleted = Boolean(input.manualCompleted);

  const docPath = `users/${fbUid}/video_progress/${progressKey}`;
  const docRef = doc(db, 'users', fbUid, 'video_progress', progressKey);

  const payload = {
    id: progressKey,
    userId: fbUid,
    courseId: safeCourseId,
    lessonId: safeLessonId,
    videoId: safeVideoId,
    youtubeVideoId: safeYoutubeId,
    durationSeconds,
    watchedSeconds,
    maxPercentWatched,
    lastPositionSeconds,
    hasPlayed,
    completedViaPlayer,
    manualCompleted,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, payload);
    return {
      success: true,
      record: {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch {
      // Logged via structured helper
    }
    return { success: false, error: 'Failed to save video playback progress to Firestore.' };
  }
}

// ============================================================================
// CERTIFICATE TEMPLATES (`/certificate_templates/{templateId}`)
// ============================================================================

function docToCertificateTemplate(docId: string, data: any): CertificateTemplateRecord {
  return {
    id: docId,
    name: String(data.name || 'ABHI JOBS Official Certificate').slice(0, 120),
    organizationName: String(data.organizationName || 'ABHI JOBS · Learn with ABHI').slice(0, 120),
    certificateTitle: String(data.certificateTitle || 'Certificate of Completion').slice(0, 120),
    subtitle: String(
      data.subtitle || 'Awarded for successfully completing all modules and assessments'
    ).slice(0, 240),
    signatoryName: String(data.signatoryName || 'ABHI JOBS Academic Director').slice(0, 100),
    signatoryDesignation: String(
      data.signatoryDesignation || 'Authorized Signatory, Learn with ABHI'
    ).slice(0, 120),
    primaryColor: HEX_COLOR_REGEX.test(String(data.primaryColor || ''))
      ? String(data.primaryColor)
      : '#102B4E',
    accentColor: HEX_COLOR_REGEX.test(String(data.accentColor || ''))
      ? String(data.accentColor)
      : '#C89B3C',
    isDefault: Boolean(data.isDefault),
    updatedBy: String(data.updatedBy || ''),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

export async function listCertificateTemplatesFromFirestore(): Promise<CertificateTemplateRecord[]> {
  const path = 'certificate_templates';
  try {
    const snap = await getDocs(collection(db, 'certificate_templates'));
    const templates: CertificateTemplateRecord[] = [];
    snap.forEach((docSnap) => {
      templates.push(docToCertificateTemplate(docSnap.id, docSnap.data()));
    });
    return templates.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch {
      // Logged via structured helper
    }
    return [];
  }
}

export async function getCertificateTemplateById(
  templateId: string
): Promise<CertificateTemplateRecord | null> {
  if (!SAFE_ID_REGEX.test(templateId)) return null;
  const path = `certificate_templates/${templateId}`;
  try {
    const snap = await getDoc(doc(db, 'certificate_templates', templateId));
    if (!snap.exists()) return null;
    return docToCertificateTemplate(snap.id, snap.data());
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch {
      // Logged via structured helper
    }
    return null;
  }
}

export async function saveAdminCertificateTemplate(
  input: Omit<CertificateTemplateRecord, 'updatedBy' | 'updatedAt'>
): Promise<{ success: boolean; template?: CertificateTemplateRecord; error?: string }> {
  const fbUid = getVerifiedFirebaseUid();
  if (!fbUid) {
    return { success: false, error: 'Verified administrator Firebase session is required.' };
  }

  const safeId = sanitizeId(input.id || 'default_abhi_certificate', 'tpl');
  const primaryColor = HEX_COLOR_REGEX.test(input.primaryColor)
    ? input.primaryColor
    : '#102B4E';
  const accentColor = HEX_COLOR_REGEX.test(input.accentColor)
    ? input.accentColor
    : '#C89B3C';

  const docPath = `certificate_templates/${safeId}`;
  const docRef = doc(db, 'certificate_templates', safeId);

  const payload = {
    id: safeId,
    name: input.name.trim().slice(0, 120) || 'ABHI JOBS Certificate Template',
    organizationName:
      input.organizationName.trim().slice(0, 120) || 'ABHI JOBS · Learn with ABHI',
    certificateTitle:
      input.certificateTitle.trim().slice(0, 120) || 'Certificate of Completion',
    subtitle: input.subtitle.trim().slice(0, 240),
    signatoryName: input.signatoryName.trim().slice(0, 100),
    signatoryDesignation: input.signatoryDesignation.trim().slice(0, 120),
    primaryColor,
    accentColor,
    isDefault: Boolean(input.isDefault),
    updatedBy: fbUid,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, payload);
    return {
      success: true,
      template: {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    } catch {
      // Logged via structured helper
    }
    return { success: false, error: 'Failed to save certificate template to Firestore.' };
  }
}

export async function deleteAdminCertificateTemplate(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  const fbUid = getVerifiedFirebaseUid();
  if (!fbUid || !SAFE_ID_REGEX.test(templateId)) {
    return { success: false, error: 'Verified admin session and valid templateId required.' };
  }
  const docPath = `certificate_templates/${templateId}`;
  try {
    await deleteDoc(doc(db, 'certificate_templates', templateId));
    return { success: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    } catch {
      // Logged via structured helper
    }
    return { success: false, error: 'Failed to delete certificate template.' };
  }
}
