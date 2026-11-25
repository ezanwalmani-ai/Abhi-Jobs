import {
  CourseDifficultyLevel,
  CourseEnrolmentRecord,
  LearningCourseItem,
} from '../types/learning';
import { flattenCourseLessons } from '../data/learningCatalog';
import { evaluateCourseCompletion } from '../services/courseEnrolmentService';

export type CatalogueEnrolmentVisualState =
  | 'not_enrolled'
  | 'enrolled_not_started'
  | 'in_progress'
  | 'completed';

export interface ResolvedCourseCatalogueState {
  visualState: CatalogueEnrolmentVisualState;
  /** Strictly derived from real saved student progress; never invented or hardcoded */
  progressPercent: number;
  activeModuleCount: number;
  completedModuleCount: number;
  totalLessons: number;
  completedLessonsCount: number;
  offersCertificate: boolean;
  isFree: boolean;
  priceLabel: string;
  displayLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  primaryActionLabel: string;
}

/**
 * Normalizes extended curriculum level strings into the clean three-tier
 * Beginner / Intermediate / Advanced scale used by the course catalogue.
 */
export function normalizeCourseDisplayLevel(
  level: CourseDifficultyLevel | string
): 'Beginner' | 'Intermediate' | 'Advanced' {
  const lower = String(level || '').toLowerCase();
  if (lower.includes('advanced')) return 'Advanced';
  if (lower.includes('intermediate') && !lower.startsWith('beginner')) return 'Intermediate';
  if (lower.includes('job-ready')) return 'Intermediate';
  return 'Beginner';
}

/**
 * Checks whether a course matches a selected catalogue difficulty filter.
 */
export function matchesDifficultyFilter(
  courseLevel: CourseDifficultyLevel | string,
  selectedFilter: 'all' | 'Beginner' | 'Intermediate' | 'Advanced'
): boolean {
  if (selectedFilter === 'all') return true;
  const lower = String(courseLevel || '').toLowerCase();
  if (selectedFilter === 'Beginner') {
    return lower.includes('beginner');
  }
  if (selectedFilter === 'Intermediate') {
    return lower.includes('intermediate') || lower.includes('job-ready');
  }
  return lower.includes('advanced');
}

/**
 * Resolves the authoritative enrolment state, real completion percentage,
 * module count, certificate availability, and CTA label for a course card
 * from actual saved student records.
 */
export function resolveCourseCatalogueState(
  course: LearningCourseItem,
  enrolment?: CourseEnrolmentRecord | null
): ResolvedCourseCatalogueState {
  const activeModules = course.modules
    .filter((mod) => !mod.isUpcomingPlaceholder)
    .sort((a, b) => a.order - b.order);
  const activeModuleCount = activeModules.length;

  const flatLessons = flattenCourseLessons({
    ...course,
    modules: activeModules,
  });
  const totalLessons = flatLessons.length;
  const validLessonIds = new Set(flatLessons.map((item) => item.lesson.id));
  const requiredQuizIds = activeModules
    .filter((mod) => mod.quizRequired !== false)
    .map((mod) => mod.id);
  const activeModuleIdSet = new Set(activeModules.map((mod) => mod.id));

  const offersCertificate =
    typeof course.offersCertificate === 'boolean'
      ? course.offersCertificate
      : Boolean(course.certificateTemplateId && course.certificateTemplateId.trim().length > 0);

  const isFree = course.isFree !== false;
  const priceLabel = isFree ? 'Free' : course.priceLabel?.trim() || 'Paid';
  const displayLevel = normalizeCourseDisplayLevel(course.level);

  // State 1: Not enrolled
  if (!enrolment) {
    return {
      visualState: 'not_enrolled',
      progressPercent: 0,
      activeModuleCount,
      completedModuleCount: 0,
      totalLessons,
      completedLessonsCount: 0,
      offersCertificate,
      isFree,
      priceLabel,
      displayLevel,
      primaryActionLabel: isFree
        ? 'Enroll for Free'
        : course.priceLabel?.trim()
        ? `Enroll Now · ${course.priceLabel.trim()}`
        : 'Enroll Now',
    };
  }

  const completedLessonIds = (enrolment.completedLessonIds || []).filter((id) =>
    validLessonIds.has(id)
  );
  const passedQuizIds = (enrolment.passedModuleQuizIds || []).filter((id) =>
    activeModuleIdSet.has(id)
  );
  const completedLessonsCount = new Set(completedLessonIds).size;
  const completedModuleCount = new Set(passedQuizIds).size;

  const hasUpcomingPlaceholder = course.modules.some((m) => m.isUpcomingPlaceholder);

  const evaluation = evaluateCourseCompletion({
    completedLessonIds,
    totalLessons: Math.max(1, totalLessons),
    passedModuleQuizIds: passedQuizIds,
    requiredModuleQuizIds: requiredQuizIds,
    finalAssessmentPassed: Boolean(enrolment.finalAssessmentPassed),
    requiresFinalAssessment: hasUpcomingPlaceholder || Boolean(enrolment.finalAssessmentPassed),
    hasCurrentLesson: false,
  });

  // State 4: Completed (strictly honors saved completed status or verified full completion)
  if (enrolment.status === 'completed' || evaluation.isCourseCompleted) {
    return {
      visualState: 'completed',
      progressPercent: 100,
      activeModuleCount,
      completedModuleCount: activeModuleCount,
      totalLessons,
      completedLessonsCount: totalLessons,
      offersCertificate,
      isFree,
      priceLabel,
      displayLevel,
      primaryActionLabel: 'Review Course',
    };
  }

  const savedPercent =
    typeof enrolment.progressPercent === 'number' && Number.isFinite(enrolment.progressPercent)
      ? Math.max(0, Math.min(99, Math.round(enrolment.progressPercent)))
      : 0;

  const hasRealProgress =
    completedLessonsCount > 0 ||
    completedModuleCount > 0 ||
    Boolean(enrolment.finalAssessmentPassed) ||
    savedPercent > 0;

  // State 2: Enrolled and not started
  if (!hasRealProgress) {
    return {
      visualState: 'enrolled_not_started',
      progressPercent: 0,
      activeModuleCount,
      completedModuleCount: 0,
      totalLessons,
      completedLessonsCount: 0,
      offersCertificate,
      isFree,
      priceLabel,
      displayLevel,
      primaryActionLabel: 'Start Learning',
    };
  }

  // State 3: In progress (derived strictly from actual completed milestones / saved record)
  const actualProgressPercent = Math.max(
    1,
    Math.min(99, Math.max(evaluation.progressPercent, savedPercent))
  );

  return {
    visualState: 'in_progress',
    progressPercent: actualProgressPercent,
    activeModuleCount,
    completedModuleCount,
    totalLessons,
    completedLessonsCount,
    offersCertificate,
    isFree,
    priceLabel,
    displayLevel,
    primaryActionLabel: 'Continue Learning',
  };
}

/**
 * Resolves the exact lesson ID where the student should land when opening
 * the course player:
 * - Completed course ("Review Course"): Module 1, Lesson 1.
 * - Enrolled & not started ("Start Learning"): Module 1, Lesson 1.
 * - In progress ("Continue Learning"): First incomplete lesson inside the
 *   student's next incomplete unlocked module (or the module awaiting its quiz).
 */
export function resolveResumeLessonId(
  course: LearningCourseItem,
  enrolment?: CourseEnrolmentRecord | null
): string | null {
  const activeModules = course.modules
    .filter((mod) => !mod.isUpcomingPlaceholder)
    .sort((a, b) => a.order - b.order);

  const flatLessons = flattenCourseLessons({
    ...course,
    modules: activeModules,
  });

  if (flatLessons.length === 0) return null;

  if (!enrolment || enrolment.status === 'completed') {
    return flatLessons[0].lesson.id;
  }

  const completedSet = new Set(enrolment.completedLessonIds || []);
  const passedQuizSet = new Set(enrolment.passedModuleQuizIds || []);

  // Compute highest unlocked module order sequentially
  let unlockedOrder = 1;
  for (const mod of activeModules) {
    if (passedQuizSet.has(mod.id)) {
      unlockedOrder = mod.order + 1;
    } else {
      break;
    }
  }
  const effectiveUnlockedOrder = Math.max(enrolment.unlockedModuleOrder ?? 1, unlockedOrder);

  // Walk unlocked modules in order to locate the next incomplete lesson or pending quiz module
  for (const mod of activeModules) {
    if (mod.order > effectiveUnlockedOrder) break;
    const orderedLessons = mod.lessons.slice().sort((a, b) => a.order - b.order);

    const firstIncompleteLesson = orderedLessons.find((lesson) => !completedSet.has(lesson.id));
    if (firstIncompleteLesson) {
      return firstIncompleteLesson.id;
    }

    // All lessons in this module are done, but its required quiz is not yet passed
    if (mod.quizRequired !== false && !passedQuizSet.has(mod.id) && orderedLessons.length > 0) {
      return orderedLessons[orderedLessons.length - 1].id;
    }
  }

  // Fallback to saved currentLessonId if valid, otherwise first lesson
  if (
    enrolment.currentLessonId &&
    flatLessons.some((entry) => entry.lesson.id === enrolment.currentLessonId)
  ) {
    return enrolment.currentLessonId;
  }

  return flatLessons[0].lesson.id;
}
