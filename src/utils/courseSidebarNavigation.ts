export type ModuleQuizSidebarStatus = 'locked' | 'available' | 'passed' | 'failed';

export interface ResolvedModuleQuizSidebarState {
  status: ModuleQuizSidebarStatus;
  statusLabel: string;
  detailLabel: string;
  actionLabel: string | null;
}

export interface ModuleProgressSummary {
  completedLessons: number;
  totalLessons: number;
  isModuleCompleted: boolean;
  progressPercent: number;
  progressText: string;
}

/**
 * Formats a module index as a two-digit string (e.g. 1 -> "01").
 */
export function formatModuleOrder(order: number): string {
  return String(Math.max(1, Math.floor(order))).padStart(2, '0');
}

/**
 * Produces a consistent module heading like "Module 01: Excel Fundamentals"
 * without duplicating an existing "Module XX:" prefix if already present.
 */
export function formatModuleDisplayTitle(order: number, title: string): string {
  const cleanTitle = (title || '').trim();
  const formattedOrder = formatModuleOrder(order);
  const existingPrefixRegex = /^module\s+\d+\s*[:\-–—]\s*/i;
  if (existingPrefixRegex.test(cleanTitle)) {
    const stripped = cleanTitle.replace(existingPrefixRegex, '').trim();
    return stripped ? `Module ${formattedOrder}: ${stripped}` : `Module ${formattedOrder}`;
  }
  return cleanTitle ? `Module ${formattedOrder}: ${cleanTitle}` : `Module ${formattedOrder}`;
}

/**
 * Single-module accordion state reducer:
 * - Clicking a collapsed module expands ONLY that module (collapsing all others).
 * - Clicking the currently expanded module collapses it.
 */
export function toggleAccordionModule(
  currentExpandedModuleId: string | null,
  clickedModuleId: string
): string | null {
  return currentExpandedModuleId === clickedModuleId ? null : clickedModuleId;
}

/**
 * Resolves the clear, dual-coded (icon + text) status of a module's quiz
 * inside its expanded sidebar section while preserving existing unlock and
 * assessment rules.
 */
export function resolveModuleQuizSidebarState(params: {
  moduleOrder: number;
  isModuleLocked: boolean;
  isQuizUnlocked: boolean;
  isQuizPassed: boolean;
  bestScorePercent: number | null;
  attemptCount: number;
  questionCount: number;
  requiresVideoWatch: boolean;
}): ResolvedModuleQuizSidebarState {
  const {
    moduleOrder,
    isModuleLocked,
    isQuizUnlocked,
    isQuizPassed,
    bestScorePercent,
    attemptCount,
    questionCount,
    requiresVideoWatch,
  } = params;

  if (isQuizPassed) {
    const scorePart = bestScorePercent !== null ? `${bestScorePercent}%` : 'Completed';
    return {
      status: 'passed',
      statusLabel: 'Passed',
      detailLabel: scorePart,
      actionLabel: 'Retake',
    };
  }

  if (attemptCount > 0 || bestScorePercent !== null) {
    const scoreText =
      bestScorePercent !== null ? `Best ${bestScorePercent}%` : `${attemptCount} attempt`;
    return {
      status: 'failed',
      statusLabel: 'Failed',
      detailLabel: scoreText,
      actionLabel: 'Retake',
    };
  }

  if (isQuizUnlocked) {
    return {
      status: 'available',
      statusLabel: 'Available',
      detailLabel: `${questionCount} questions`,
      actionLabel: 'Start Quiz',
    };
  }

  const prevModOrder = Math.max(1, moduleOrder - 1);
  return {
    status: 'locked',
    statusLabel: 'Locked',
    detailLabel: isModuleLocked
      ? `Pass M${formatModuleOrder(prevModOrder)} Quiz first`
      : requiresVideoWatch
      ? 'Watch 90% video to unlock'
      : 'Complete lessons to unlock',
    actionLabel: null,
  };
}

/**
 * Summarizes lesson and quiz completion progress for a module header.
 */
export function resolveModuleProgressSummary(params: {
  completedLessons: number;
  totalLessons: number;
  hasQuiz: boolean;
  quizPassed: boolean;
}): ModuleProgressSummary {
  const safeTotal = Math.max(0, params.totalLessons);
  const safeCompleted = Math.max(0, Math.min(safeTotal, params.completedLessons));

  const totalSteps = safeTotal + (params.hasQuiz ? 1 : 0);
  const completedSteps = safeCompleted + (params.hasQuiz && params.quizPassed ? 1 : 0);
  const progressPercent =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const isModuleCompleted =
    safeTotal > 0 &&
    safeCompleted >= safeTotal &&
    (!params.hasQuiz || params.quizPassed);

  const lessonWord = safeTotal === 1 ? 'lesson' : 'lessons';
  const progressText = isModuleCompleted
    ? 'Completed'
    : `${safeCompleted}/${safeTotal} ${lessonWord}`;

  return {
    completedLessons: safeCompleted,
    totalLessons: safeTotal,
    isModuleCompleted,
    progressPercent,
    progressText,
  };
}
