import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import {
  auth as firebaseAuth,
  db,
  OperationType,
  handleFirestoreError,
} from '../lib/firebase';
import {
  AdminLessonInput,
  CourseLesson,
  CourseModule,
  LearningCourseItem,
  LessonAttachment,
  LessonAttachmentType,
} from '../types/learning';

const LOCAL_CUSTOM_LESSONS_KEY = 'abhijobs_learning_admin_lessons_v1';

export interface ParsedVideoEmbed {
  kind: 'iframe' | 'video' | 'invalid';
  embedUrl: string;
  providerLabel: string;
}

/**
 * Validates and converts supported HTTPS video URLs (YouTube, Vimeo, Loom, Google Drive, direct MP4/WebM)
 * into safe embeddable sources. Rejects javascript:, data:, and insecure schemes.
 */
export function parseSafeVideoEmbed(rawUrl: string): ParsedVideoEmbed | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { kind: 'invalid', embedUrl: '', providerLabel: 'HTTPS URL required' };
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // YouTube standard, short, or embed URLs
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        const videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0];
        if (videoId && /^[a-zA-Z0-9_\-]{6,20}$/.test(videoId)) {
          return {
            kind: 'iframe',
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
            providerLabel: 'YouTube',
          };
        }
      }
      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_\-]{6,20}$/.test(vParam)) {
        return {
          kind: 'iframe',
          embedUrl: `https://www.youtube-nocookie.com/embed/${vParam}?rel=0`,
          providerLabel: 'YouTube',
        };
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const shortId = parsed.pathname.split('/shorts/')[1]?.split('/')[0];
        if (shortId && /^[a-zA-Z0-9_\-]{6,20}$/.test(shortId)) {
          return {
            kind: 'iframe',
            embedUrl: `https://www.youtube-nocookie.com/embed/${shortId}?rel=0`,
            providerLabel: 'YouTube',
          };
        }
      }
    }

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.replace(/^\//, '').split('/')[0];
      if (videoId && /^[a-zA-Z0-9_\-]{6,20}$/.test(videoId)) {
        return {
          kind: 'iframe',
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
          providerLabel: 'YouTube',
        };
      }
    }

    // Vimeo
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const match = parsed.pathname.match(/\/(?:video\/)?(\d{5,15})/);
      if (match?.[1]) {
        return {
          kind: 'iframe',
          embedUrl: `https://player.vimeo.com/video/${match[1]}`,
          providerLabel: 'Vimeo',
        };
      }
    }

    // Loom
    if (host === 'loom.com') {
      const match = parsed.pathname.match(/\/(?:share|embed)\/([a-zA-Z0-9]{10,40})/);
      if (match?.[1]) {
        return {
          kind: 'iframe',
          embedUrl: `https://www.loom.com/embed/${match[1]}`,
          providerLabel: 'Loom',
        };
      }
    }

    // Google Drive video preview
    if (host === 'drive.google.com') {
      const match = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_\-]+)/);
      if (match?.[1]) {
        return {
          kind: 'iframe',
          embedUrl: `https://drive.google.com/file/d/${match[1]}/preview`,
          providerLabel: 'Google Drive',
        };
      }
    }

    // Direct HTML5 video file
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(parsed.pathname)) {
      return {
        kind: 'video',
        embedUrl: parsed.toString(),
        providerLabel: 'Direct Video',
      };
    }

    return {
      kind: 'invalid',
      embedUrl: '',
      providerLabel: 'Supported: YouTube, Vimeo, Loom, Google Drive, or direct .mp4/.webm HTTPS URL',
    };
  } catch {
    return {
      kind: 'invalid',
      embedUrl: '',
      providerLabel: 'Enter a valid HTTPS video URL',
    };
  }
}

export function isSafeExternalResourceUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizeTimestamp(val: unknown): string {
  if (typeof val === 'string' && val.trim()) return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

function sanitizeAttachment(raw: any, index: number): LessonAttachment | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = String(raw.title || '').trim().slice(0, 140);
  if (!title) return null;
  const url = String(raw.url || '').trim().slice(0, 500);
  const allowedTypes: LessonAttachmentType[] = ['PDF', 'Workbook', 'Checklist', 'Template', 'Resource'];
  const fileType: LessonAttachmentType = allowedTypes.includes(raw.fileType)
    ? raw.fileType
    : 'PDF';
  return {
    id: String(raw.id || `att_${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64),
    title,
    url: url && isSafeExternalResourceUrl(url) ? url : '',
    fileType,
    sizeLabel: raw.sizeLabel ? String(raw.sizeLabel).slice(0, 40) : undefined,
    worksheetContent: raw.worksheetContent ? String(raw.worksheetContent).slice(0, 4000) : undefined,
  };
}

function readLocalCustomLessons(): Record<string, CourseLesson[]> {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_LESSONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalCustomLessons(courseId: string, lessons: CourseLesson[]): void {
  try {
    const existing = readLocalCustomLessons();
    existing[courseId] = lessons;
    localStorage.setItem(LOCAL_CUSTOM_LESSONS_KEY, JSON.stringify(existing));
  } catch {
    // Graceful quota handling
  }
}

function docToCourseLesson(docId: string, data: any): CourseLesson {
  const attachments: LessonAttachment[] = Array.isArray(data.attachments)
    ? data.attachments
        .slice(0, 15)
        .map((a: any, idx: number) => sanitizeAttachment(a, idx))
        .filter((a: LessonAttachment | null): a is LessonAttachment => Boolean(a))
    : [];

  const exerciseTitle = String(data.exerciseTitle || '').trim();
  const exerciseInstructions = String(data.exerciseInstructions || '').trim();
  const exerciseDeliverable = String(data.exerciseDeliverable || '').trim();

  return {
    id: docId,
    courseId: String(data.courseId || ''),
    moduleId: String(data.moduleId || ''),
    order: typeof data.order === 'number' && data.order >= 1 ? data.order : 1,
    title: String(data.title || 'Untitled Lesson'),
    description: String(data.description || ''),
    videoUrl: String(data.videoUrl || ''),
    estimatedMinutes:
      typeof data.estimatedMinutes === 'number' && data.estimatedMinutes >= 1
        ? data.estimatedMinutes
        : 15,
    writtenContent: String(data.writtenContent || ''),
    exercise:
      exerciseTitle || exerciseInstructions
        ? {
            title: exerciseTitle || 'Practical Exercise',
            instructions: exerciseInstructions,
            deliverable: exerciseDeliverable || undefined,
          }
        : undefined,
    attachments,
    isAdminManaged: true,
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

/**
 * Loads admin-managed lesson additions/overrides for a course from Firestore + local storage,
 * and merges them cleanly into the base course's modules ordered by lesson.order.
 */
export async function loadHydratedCourse(
  baseCourse: LearningCourseItem
): Promise<LearningCourseItem> {
  const localMap = readLocalCustomLessons();
  const mergedById = new Map<string, CourseLesson>();

  (localMap[baseCourse.id] || []).forEach((lesson) => {
    mergedById.set(lesson.id, lesson);
  });

  const path = `learning_courses/${baseCourse.id}/lessons`;
  try {
    const colRef = collection(db, 'learning_courses', baseCourse.id, 'lessons');
    const q = query(colRef, where('courseId', '==', baseCourse.id));
    const snap = await getDocs(q);
    const cloudLessons: CourseLesson[] = [];
    snap.forEach((docSnap) => {
      const parsed = docToCourseLesson(docSnap.id, docSnap.data());
      mergedById.set(parsed.id, parsed);
      cloudLessons.push(parsed);
    });
    if (cloudLessons.length > 0) {
      writeLocalCustomLessons(baseCourse.id, Array.from(mergedById.values()));
    }
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch {
      // Non-fatal fallback to base curriculum + local custom lessons
    }
  }

  const customLessons = Array.from(mergedById.values());
  if (customLessons.length === 0) {
    return baseCourse;
  }

  const hydratedModules: CourseModule[] = baseCourse.modules.map((mod) => {
    const lessonMap = new Map<string, CourseLesson>();
    mod.lessons.forEach((l) => lessonMap.set(l.id, l));

    customLessons
      .filter((cl) => cl.moduleId === mod.id)
      .forEach((cl) => {
        lessonMap.set(cl.id, cl);
      });

    const orderedLessons = Array.from(lessonMap.values()).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });

    return {
      ...mod,
      lessons: orderedLessons,
    };
  });

  return {
    ...baseCourse,
    modules: hydratedModules,
  };
}

/**
 * Saves an admin-authored or updated lesson into Firestore (when verified Firebase admin is active)
 * and persists locally so administrators see immediate updates across the platform.
 */
export async function saveAdminCourseLesson(
  input: AdminLessonInput,
  fallbackAdminId: string
): Promise<{
  success: boolean;
  savedToCloud: boolean;
  lesson?: CourseLesson;
  error?: string;
}> {
  const cleanTitle = input.title.trim().slice(0, 160);
  if (!cleanTitle) {
    return { success: false, savedToCloud: false, error: 'Lesson title is required.' };
  }

  const cleanVideoUrl = input.videoUrl.trim().slice(0, 500);
  if (cleanVideoUrl) {
    const parsedVideo = parseSafeVideoEmbed(cleanVideoUrl);
    if (!parsedVideo || parsedVideo.kind === 'invalid') {
      return {
        success: false,
        savedToCloud: false,
        error:
          parsedVideo?.providerLabel ||
          'Please enter a valid HTTPS YouTube, Vimeo, Loom, Google Drive, or MP4/WebM video URL.',
      };
    }
  }

  const sanitizedAttachments = input.attachments
    .slice(0, 15)
    .map((a, idx) => sanitizeAttachment(a, idx))
    .filter((a): a is LessonAttachment => Boolean(a));

  const safeLessonId = (
    input.id && input.id.trim().length > 0
      ? input.id.trim()
      : `les_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  )
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);

  const safeCourseId = input.courseId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const safeModuleId = input.moduleId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const safeOrder = Math.max(1, Math.min(200, Math.round(input.order || 1)));
  const safeMinutes = Math.max(1, Math.min(300, Math.round(input.estimatedMinutes || 15)));

  const fbUser = firebaseAuth.currentUser;
  const effectiveAdminUid = fbUser?.uid || fallbackAdminId || 'admin_local';

  const cleanDescription = input.description.trim().slice(0, 600);
  const cleanWritten = input.writtenContent.trim().slice(0, 20000);
  const cleanExerciseTitle = input.exerciseTitle.trim().slice(0, 200);
  const cleanExerciseInstructions = input.exerciseInstructions.trim().slice(0, 4000);
  const cleanExerciseDeliverable = input.exerciseDeliverable.trim().slice(0, 500);

  const lessonObj: CourseLesson = {
    id: safeLessonId,
    courseId: safeCourseId,
    moduleId: safeModuleId,
    order: safeOrder,
    title: cleanTitle,
    description: cleanDescription,
    videoUrl: cleanVideoUrl,
    estimatedMinutes: safeMinutes,
    writtenContent: cleanWritten,
    exercise:
      cleanExerciseTitle || cleanExerciseInstructions
        ? {
            title: cleanExerciseTitle || 'Practical Exercise',
            instructions: cleanExerciseInstructions,
            deliverable: cleanExerciseDeliverable || undefined,
          }
        : undefined,
    attachments: sanitizedAttachments,
    isAdminManaged: true,
    updatedAt: new Date().toISOString(),
  };

  let savedToCloud = false;

  if (fbUser && fbUser.emailVerified) {
    const docPath = `learning_courses/${safeCourseId}/lessons/${safeLessonId}`;
    const docRef = doc(db, 'learning_courses', safeCourseId, 'lessons', safeLessonId);

    const payload: Record<string, unknown> = {
      id: safeLessonId,
      courseId: safeCourseId,
      moduleId: safeModuleId,
      title: cleanTitle,
      description: cleanDescription,
      videoUrl: cleanVideoUrl,
      writtenContent: cleanWritten,
      exerciseTitle: cleanExerciseTitle,
      exerciseInstructions: cleanExerciseInstructions,
      exerciseDeliverable: cleanExerciseDeliverable,
      attachments: sanitizedAttachments.map((a) => ({
        id: a.id,
        title: a.title,
        url: a.url,
        fileType: a.fileType,
        sizeLabel: a.sizeLabel || '',
      })),
      order: safeOrder,
      estimatedMinutes: safeMinutes,
      updatedBy: fbUser.uid,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(docRef, payload);
      savedToCloud = true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      } catch {
        // Logged via structured helper; persist locally for admin preview
      }
    }
  }

  const localMap = readLocalCustomLessons();
  const currentCourseLessons = localMap[safeCourseId] || [];
  const nextCourseLessons = [
    ...currentCourseLessons.filter((l) => l.id !== safeLessonId),
    lessonObj,
  ];
  writeLocalCustomLessons(safeCourseId, nextCourseLessons);

  return {
    success: true,
    savedToCloud,
    lesson: lessonObj,
  };
}

/**
 * Deletes an admin-added lesson override from Firestore and local storage.
 */
export async function deleteAdminCourseLesson(
  courseId: string,
  lessonId: string
): Promise<{ success: boolean; deletedFromCloud: boolean }> {
  let deletedFromCloud = false;
  const fbUser = firebaseAuth.currentUser;

  if (fbUser && fbUser.emailVerified) {
    const docPath = `learning_courses/${courseId}/lessons/${lessonId}`;
    try {
      await deleteDoc(doc(db, 'learning_courses', courseId, 'lessons', lessonId));
      deletedFromCloud = true;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      } catch {
        // Logged; still clean up local cache
      }
    }
  }

  const localMap = readLocalCustomLessons();
  if (localMap[courseId]) {
    writeLocalCustomLessons(
      courseId,
      localMap[courseId].filter((l) => l.id !== lessonId)
    );
  }

  return { success: true, deletedFromCloud };
}

/**
 * Downloads an attachment cleanly:
 * - If an admin supplied a valid external HTTPS URL, triggers a safe download/open link.
 * - If it is a built-in Learn with ABHI worksheet, generates a real formatted PDF file via jsPDF.
 */
export function downloadLessonResource(
  courseTitle: string,
  lessonTitle: string,
  attachment: LessonAttachment
): void {
  if (attachment.url && isSafeExternalResourceUrl(attachment.url)) {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `${attachment.title.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'resource'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Generate clean branded PDF study worksheet using jsPDF
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  const maxWidth = 499;
  let y = 56;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(244, 122, 36);
  pdf.text('LEARN WITH ABHI · ABHI JOBS', marginX, y);
  y += 22;

  pdf.setFontSize(18);
  pdf.setTextColor(16, 43, 78);
  const titleLines = pdf.splitTextToSize(attachment.title, maxWidth);
  pdf.text(titleLines, marginX, y);
  y += titleLines.length * 22 + 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  pdf.setTextColor(86, 100, 121);
  pdf.text(`Course: ${courseTitle}  |  Lesson: ${lessonTitle}`, marginX, y);
  y += 16;

  pdf.setDrawColor(229, 234, 240);
  pdf.line(marginX, y, marginX + maxWidth, y);
  y += 24;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(37, 52, 73);

  const bodyText =
    attachment.worksheetContent ||
    `${attachment.title}\n\nStudy resource for ${lessonTitle} (${courseTitle}).`;
  const lines = pdf.splitTextToSize(bodyText, maxWidth);

  for (const line of lines) {
    if (y > 760) {
      pdf.addPage();
      y = 56;
    }
    pdf.text(line, marginX, y);
    y += 17;
  }

  const safeFileName = `${attachment.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}.pdf`;
  pdf.save(safeFileName || 'learn-with-abhi-resource.pdf');
}
