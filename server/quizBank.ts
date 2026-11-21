/**
 * SERVER-ONLY Learn with ABHI Quiz & Final Assessment Question Bank.
 *
 * SECURITY & PERSISTENCE BOUNDARY:
 * - MUST ONLY be imported by server.ts / server/* modules.
 * - Never import this module into src/ client bundles — correctOptionIndex and
 *   explanation fields are strictly withheld by the backend until a candidate
 *   submits their answers.
 * - Backed by durable disk persistence (`server/learningStore.ts`) so admin quiz
 *   configurations and server-graded candidate attempts survive restarts.
 */

import {
  AssessmentType,
  PersistedAssessmentConfig,
  PersistedAttemptRecord,
  PersistedQuizQuestion,
  getRegisteredCourseDefinition,
  loadDurableLearningStore,
  persistDurableLearningStore,
  signAssessmentAttemptReceipt,
  verifyAssessmentAttemptReceipt,
} from './learningStore';

export type { AssessmentType };

export type ServerQuizQuestion = PersistedQuizQuestion;
export type ServerAssessmentConfig = PersistedAssessmentConfig;
export type ServerAttemptSummary = PersistedAttemptRecord;

export function getAssessmentConfigById(id: string): ServerAssessmentConfig | undefined {
  const store = loadDurableLearningStore();
  return store.quizConfigs[id];
}

export function getAssessmentConfig(
  courseId: string,
  assessmentType: AssessmentType,
  moduleId?: string
): ServerAssessmentConfig | undefined {
  const key = assessmentType === 'final_assessment' ? `final_${courseId}` : `quiz_${moduleId || ''}`;
  const store = loadDurableLearningStore();
  return store.quizConfigs[key];
}

export function getCourseAssessments(courseId: string): {
  moduleQuizzes: ServerAssessmentConfig[];
  finalAssessment: ServerAssessmentConfig | null;
} {
  const store = loadDurableLearningStore();
  const moduleQuizzes: ServerAssessmentConfig[] = [];
  let finalAssessment: ServerAssessmentConfig | null = null;

  for (const cfg of Object.values(store.quizConfigs)) {
    if (cfg.courseId !== courseId) continue;
    if (cfg.assessmentType === 'module_quiz') {
      moduleQuizzes.push(cfg);
    } else if (cfg.assessmentType === 'final_assessment') {
      finalAssessment = cfg;
    }
  }

  moduleQuizzes.sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0));
  return { moduleQuizzes, finalAssessment };
}

export interface UpsertAssessmentConfigInput {
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
  questions?: ServerQuizQuestion[];
}

export function upsertAssessmentConfig(
  input: UpsertAssessmentConfigInput
): ServerAssessmentConfig {
  const store = loadDurableLearningStore();
  const safeCourseId = input.courseId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const safeModuleId = input.moduleId
    ? input.moduleId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128)
    : undefined;

  const configId =
    input.assessmentType === 'final_assessment'
      ? `final_${safeCourseId}`
      : `quiz_${safeModuleId || safeCourseId}`;

  const existing = store.quizConfigs[configId];
  const minPass = input.assessmentType === 'final_assessment' ? 70 : 50;
  const passPercentage = Math.max(
    minPass,
    Math.min(100, Math.round(input.passPercentage ?? existing?.passPercentage ?? 70))
  );

  const sanitizedQuestions: ServerQuizQuestion[] = Array.isArray(input.questions)
    ? input.questions.slice(0, 50).map((q, idx) => ({
        id: (q.id || `q_${idx + 1}`).trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100),
        prompt: String(q.prompt || '').trim().slice(0, 500),
        options: [
          String(q.options?.[0] || '').trim().slice(0, 260),
          String(q.options?.[1] || '').trim().slice(0, 260),
          String(q.options?.[2] || '').trim().slice(0, 260),
          String(q.options?.[3] || '').trim().slice(0, 260),
        ],
        correctOptionIndex: ([0, 1, 2, 3].includes(q.correctOptionIndex)
          ? q.correctOptionIndex
          : 0) as 0 | 1 | 2 | 3,
        explanation: String(q.explanation || '').trim().slice(0, 600),
      }))
    : existing?.questions || [];

  const maxQuestionCap = input.assessmentType === 'final_assessment' ? 20 : 15;
  const requestedCount = Math.round(
    input.questionCount ?? existing?.questionCount ?? Math.max(1, sanitizedQuestions.length)
  );
  const questionCount =
    sanitizedQuestions.length > 0
      ? Math.max(1, Math.min(maxQuestionCap, Math.min(sanitizedQuestions.length, requestedCount)))
      : Math.max(1, Math.min(maxQuestionCap, requestedCount));

  const next: ServerAssessmentConfig = {
    id: configId,
    courseId: safeCourseId,
    courseSlug: (input.courseSlug || existing?.courseSlug || safeCourseId).trim().slice(0, 128),
    courseTitle: input.courseTitle.trim().slice(0, 160),
    assessmentType: input.assessmentType,
    moduleId: input.assessmentType === 'module_quiz' ? safeModuleId : undefined,
    moduleOrder:
      input.assessmentType === 'module_quiz'
        ? typeof input.moduleOrder === 'number'
          ? Math.max(1, Math.min(50, Math.round(input.moduleOrder)))
          : existing?.moduleOrder
        : undefined,
    title: input.title.trim().slice(0, 180),
    description: (input.description ?? existing?.description ?? '').trim().slice(0, 500),
    passPercentage,
    questionCount,
    randomizeOrder:
      typeof input.randomizeOrder === 'boolean'
        ? input.randomizeOrder
        : existing?.randomizeOrder ?? true,
    requiredForCompletion:
      typeof input.requiredForCompletion === 'boolean'
        ? input.requiredForCompletion
        : existing?.requiredForCompletion ?? true,
    questions: sanitizedQuestions,
    updatedAt: new Date().toISOString(),
  };

  store.quizConfigs[configId] = next;
  persistDurableLearningStore(store);
  return next;
}

export function updateAssessmentConfigSettings(
  configId: string,
  updates: Partial<
    Pick<
      ServerAssessmentConfig,
      'passPercentage' | 'questionCount' | 'randomizeOrder' | 'requiredForCompletion' | 'title'
    >
  >
): ServerAssessmentConfig | null {
  const store = loadDurableLearningStore();
  const existing = store.quizConfigs[configId];
  if (!existing) return null;

  const minPass = existing.assessmentType === 'final_assessment' ? 70 : 40;
  const passPercentage =
    typeof updates.passPercentage === 'number'
      ? Math.max(minPass, Math.min(100, Math.round(updates.passPercentage)))
      : existing.passPercentage;

  const maxAvailable = Math.max(1, existing.questions.length);
  const requestedCount =
    typeof updates.questionCount === 'number'
      ? Math.round(updates.questionCount)
      : existing.questionCount;
  const clampedCount = Math.max(
    1,
    Math.min(
      existing.assessmentType === 'final_assessment' ? 20 : 15,
      Math.min(maxAvailable, requestedCount)
    )
  );

  const next: ServerAssessmentConfig = {
    ...existing,
    title:
      typeof updates.title === 'string' && updates.title.trim().length > 0
        ? updates.title.trim().slice(0, 180)
        : existing.title,
    passPercentage,
    questionCount: clampedCount,
    randomizeOrder:
      typeof updates.randomizeOrder === 'boolean'
        ? updates.randomizeOrder
        : existing.randomizeOrder,
    requiredForCompletion:
      typeof updates.requiredForCompletion === 'boolean'
        ? updates.requiredForCompletion
        : existing.requiredForCompletion,
    updatedAt: new Date().toISOString(),
  };

  store.quizConfigs[configId] = next;
  persistDurableLearningStore(store);
  return next;
}

export function addOrUpdateQuestion(
  configId: string,
  question: {
    id?: string;
    prompt: string;
    options: [string, string, string, string];
    correctOptionIndex: 0 | 1 | 2 | 3;
    explanation: string;
  }
): { config: ServerAssessmentConfig; question: ServerQuizQuestion } | null {
  const store = loadDurableLearningStore();
  const existing = store.quizConfigs[configId];
  if (!existing) return null;

  const qId =
    question.id && question.id.trim().length > 0
      ? question.id.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)
      : `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const sanitized: ServerQuizQuestion = {
    id: qId,
    prompt: question.prompt.trim().slice(0, 500),
    options: [
      question.options[0].trim().slice(0, 260),
      question.options[1].trim().slice(0, 260),
      question.options[2].trim().slice(0, 260),
      question.options[3].trim().slice(0, 260),
    ],
    correctOptionIndex: question.correctOptionIndex,
    explanation: question.explanation.trim().slice(0, 600),
  };

  const idx = existing.questions.findIndex((q) => q.id === qId);
  const nextQuestions =
    idx >= 0
      ? existing.questions.map((q, i) => (i === idx ? sanitized : q))
      : [...existing.questions, sanitized];

  const nextConfig: ServerAssessmentConfig = {
    ...existing,
    questions: nextQuestions.slice(0, 50),
    updatedAt: new Date().toISOString(),
  };

  store.quizConfigs[configId] = nextConfig;
  persistDurableLearningStore(store);
  return { config: nextConfig, question: sanitized };
}

export function removeQuestion(configId: string, questionId: string): ServerAssessmentConfig | null {
  const store = loadDurableLearningStore();
  const existing = store.quizConfigs[configId];
  if (!existing) return null;

  const nextQuestions = existing.questions.filter((q) => q.id !== questionId);
  if (nextQuestions.length === 0) return null; // Keep at least 1 question

  const nextConfig: ServerAssessmentConfig = {
    ...existing,
    questions: nextQuestions,
    questionCount: Math.min(existing.questionCount, nextQuestions.length),
    updatedAt: new Date().toISOString(),
  };

  store.quizConfigs[configId] = nextConfig;
  persistDurableLearningStore(store);
  return nextConfig;
}

export function recordServerAttempt(
  attempt: Omit<ServerAttemptSummary, 'verificationSignature'> & {
    verificationSignature?: string;
  }
): ServerAttemptSummary {
  const store = loadDurableLearningStore();
  const signature =
    attempt.verificationSignature && attempt.verificationSignature.length >= 32
      ? attempt.verificationSignature
      : signAssessmentAttemptReceipt({
          attemptId: attempt.id,
          userId: attempt.userId,
          courseId: attempt.courseId,
          assessmentType: attempt.assessmentType,
          moduleId: attempt.moduleId,
          scorePercent: attempt.scorePercent,
          passPercentage: attempt.passPercentage,
          passed: attempt.passed,
          submittedAt: attempt.submittedAt,
        });

  const persisted: ServerAttemptSummary = {
    ...attempt,
    courseSlug: attempt.courseSlug || attempt.courseId,
    verificationSignature: signature,
  };

  store.attempts.unshift(persisted);
  if (store.attempts.length > 2000) {
    store.attempts.length = 2000;
  }
  persistDurableLearningStore(store);
  return persisted;
}

export function getCandidateAttemptCount(
  userId: string,
  courseId: string,
  assessmentType: AssessmentType,
  moduleId?: string
): number {
  const store = loadDurableLearningStore();
  return store.attempts.filter(
    (a) =>
      a.userId === userId &&
      a.courseId === courseId &&
      a.assessmentType === assessmentType &&
      (assessmentType === 'final_assessment' || a.moduleId === moduleId)
  ).length;
}

export function listAllServerAttempts(filters?: {
  courseId?: string;
  assessmentType?: string;
  userId?: string;
}): ServerAttemptSummary[] {
  const store = loadDurableLearningStore();
  return store.attempts.filter((a) => {
    if (filters?.userId && a.userId !== filters.userId) {
      return false;
    }
    if (filters?.courseId && filters.courseId !== 'all' && a.courseId !== filters.courseId) {
      return false;
    }
    if (
      filters?.assessmentType &&
      filters.assessmentType !== 'all' &&
      a.assessmentType !== filters.assessmentType
    ) {
      return false;
    }
    return true;
  });
}

export function deleteServerAttemptById(attemptId: string): boolean {
  const store = loadDurableLearningStore();
  const idx = store.attempts.findIndex((a) => a.id === attemptId);
  if (idx === -1) return false;
  store.attempts.splice(idx, 1);
  persistDurableLearningStore(store);
  return true;
}

/**
 * Computes authoritative, tamper-resistant course unlock & assessment status
 * strictly from backend-persisted, HMAC-verified assessment attempts.
 */
export function getAuthoritativeCandidateCourseStatus(
  userId: string,
  courseId: string
): {
  userId: string;
  courseId: string;
  passedModuleQuizIds: string[];
  unlockedModuleOrder: number;
  finalAssessmentPassed: boolean;
  bestFinalScorePercent: number | null;
  lastVerifiedAttemptId: string | null;
  lastVerifiedFinalAttemptId: string | null;
  completedLessonIds: string[];
} {
  const store = loadDurableLearningStore();
  const courseAttempts = store.attempts.filter(
    (a) =>
      a.userId === userId &&
      a.courseId === courseId &&
      verifyAssessmentAttemptReceipt({
        attemptId: a.id,
        userId: a.userId,
        courseId: a.courseId,
        assessmentType: a.assessmentType,
        moduleId: a.moduleId,
        scorePercent: a.scorePercent,
        passPercentage: a.passPercentage,
        passed: a.passed,
        submittedAt: a.submittedAt,
        verificationSignature: a.verificationSignature,
      })
  );

  const passedModuleQuizSet = new Set<string>();
  let lastVerifiedAttemptId: string | null = null;
  let finalAssessmentPassed = false;
  let bestFinalScorePercent: number | null = null;
  let lastVerifiedFinalAttemptId: string | null = null;

  for (const att of courseAttempts) {
    if (att.assessmentType === 'module_quiz' && att.passed && att.moduleId) {
      passedModuleQuizSet.add(att.moduleId);
      if (!lastVerifiedAttemptId) {
        lastVerifiedAttemptId = att.id;
      }
    }
    if (att.assessmentType === 'final_assessment') {
      if (bestFinalScorePercent === null || att.scorePercent > bestFinalScorePercent) {
        bestFinalScorePercent = att.scorePercent;
        if (att.passed && att.scorePercent >= 70) {
          lastVerifiedFinalAttemptId = att.id;
        }
      }
      if (att.passed && att.scorePercent >= 70) {
        finalAssessmentPassed = true;
        if (!lastVerifiedFinalAttemptId) {
          lastVerifiedFinalAttemptId = att.id;
        }
      }
    }
  }

  // Compute sequential module unlock order (Module 1 is always unlocked; Module N+1 unlocks only once Module N quiz is passed)
  const courseDef = getRegisteredCourseDefinition(courseId);
  const { moduleQuizzes } = getCourseAssessments(courseId);
  const orderedModuleIds =
    courseDef && courseDef.orderedModuleIds.length > 0
      ? courseDef.orderedModuleIds
      : moduleQuizzes
          .filter((q) => Boolean(q.moduleId))
          .sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0))
          .map((q) => q.moduleId as string);

  let unlockedModuleOrder = 1;
  for (let i = 0; i < orderedModuleIds.length; i++) {
    if (passedModuleQuizSet.has(orderedModuleIds[i])) {
      unlockedModuleOrder = i + 2;
    } else {
      break;
    }
  }

  const pairKey = `${userId}::${courseId}`;
  const completedLessonIds = Array.isArray(store.lessonProgress[pairKey])
    ? [...store.lessonProgress[pairKey]]
    : [];

  return {
    userId,
    courseId,
    passedModuleQuizIds: Array.from(passedModuleQuizSet),
    unlockedModuleOrder,
    finalAssessmentPassed,
    bestFinalScorePercent,
    lastVerifiedAttemptId,
    lastVerifiedFinalAttemptId,
    completedLessonIds,
  };
}

/**
 * Safely clears all course-specific quiz/final assessment configs and attempt records
 * from the durable server store. Does not affect authentication or unrelated recruitment state.
 */
export function resetAllCourseAssessmentsAndAttempts(): {
  clearedConfigs: number;
  clearedAttempts: number;
} {
  const store = loadDurableLearningStore();
  const clearedConfigs = Object.keys(store.quizConfigs).length;
  const clearedAttempts = store.attempts.length;
  store.quizConfigs = {};
  store.attempts = [];
  persistDurableLearningStore(store);
  return { clearedConfigs, clearedAttempts };
}
