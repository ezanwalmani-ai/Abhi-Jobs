/**
 * SERVER-ONLY Learn with ABHI Quiz & Final Assessment Engine.
 *
 * SECURITY & PERSISTENCE BOUNDARY:
 * - MUST ONLY be imported by server.ts / server/* modules.
 * - Never import this module into src/ client bundles — correctOptionIndex and
 *   explanation fields are strictly withheld by the backend until a candidate
 *   submits their answers.
 * - Permanently backed by Supabase PostgreSQL (`public.learning_assessments`,
 *   `public.learning_quiz_attempts`, `public.learning_final_assessment_attempts`,
 *   `public.learning_module_unlocks`, `public.learning_assessment_sessions`).
 */

import {
  AssessmentType,
  PersistedAssessmentConfig,
  PersistedAssessmentSession,
  PersistedAttemptRecord,
  PersistedQuizQuestion,
  getLearningStore,
  getRegisteredCourseDefinition,
  signAssessmentAttemptReceipt,
  verifyAssessmentAttemptReceipt,
} from './learningStore';

export type { AssessmentType };

export type ServerQuizQuestion = PersistedQuizQuestion;
export type ServerAssessmentConfig = PersistedAssessmentConfig;
export type ServerAttemptSummary = PersistedAttemptRecord;
export type ServerAssessmentSession = PersistedAssessmentSession;

export async function getAssessmentConfigById(
  id: string
): Promise<ServerAssessmentConfig | undefined> {
  return getLearningStore().getAssessmentConfigById(id);
}

export async function getAssessmentConfig(
  courseId: string,
  assessmentType: AssessmentType,
  moduleId?: string
): Promise<ServerAssessmentConfig | undefined> {
  const key =
    assessmentType === 'final_assessment' ? `final_${courseId}` : `quiz_${moduleId || ''}`;
  return getLearningStore().getAssessmentConfigById(key);
}

export async function getCourseAssessments(courseId: string): Promise<{
  moduleQuizzes: ServerAssessmentConfig[];
  finalAssessment: ServerAssessmentConfig | null;
}> {
  const all = await getLearningStore().listCourseAssessments(courseId);
  const moduleQuizzes: ServerAssessmentConfig[] = [];
  let finalAssessment: ServerAssessmentConfig | null = null;

  for (const cfg of all) {
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

export async function upsertAssessmentConfig(
  input: UpsertAssessmentConfigInput
): Promise<ServerAssessmentConfig> {
  const store = getLearningStore();
  const safeCourseId = input.courseId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const safeModuleId = input.moduleId
    ? input.moduleId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128)
    : undefined;

  const configId =
    input.assessmentType === 'final_assessment'
      ? `final_${safeCourseId}`
      : `quiz_${safeModuleId || safeCourseId}`;

  const existing = await store.getAssessmentConfigById(configId);
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

  return store.upsertAssessmentConfig(next);
}

export async function updateAssessmentConfigSettings(
  configId: string,
  updates: Partial<
    Pick<
      ServerAssessmentConfig,
      'passPercentage' | 'questionCount' | 'randomizeOrder' | 'requiredForCompletion' | 'title'
    >
  >
): Promise<ServerAssessmentConfig | null> {
  const store = getLearningStore();
  const existing = await store.getAssessmentConfigById(configId);
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

  return store.upsertAssessmentConfig(next);
}

export async function addOrUpdateQuestion(
  configId: string,
  question: {
    id?: string;
    prompt: string;
    options: [string, string, string, string];
    correctOptionIndex: 0 | 1 | 2 | 3;
    explanation: string;
  }
): Promise<{ config: ServerAssessmentConfig; question: ServerQuizQuestion } | null> {
  const store = getLearningStore();
  const existing = await store.getAssessmentConfigById(configId);
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

  const saved = await store.upsertAssessmentConfig(nextConfig);
  return { config: saved, question: sanitized };
}

export async function removeQuestion(
  configId: string,
  questionId: string
): Promise<ServerAssessmentConfig | null> {
  const store = getLearningStore();
  const existing = await store.getAssessmentConfigById(configId);
  if (!existing) return null;

  const nextQuestions = existing.questions.filter((q) => q.id !== questionId);
  if (nextQuestions.length === 0) return null; // Keep at least 1 question

  const nextConfig: ServerAssessmentConfig = {
    ...existing,
    questions: nextQuestions,
    questionCount: Math.min(existing.questionCount, nextQuestions.length),
    updatedAt: new Date().toISOString(),
  };

  return store.upsertAssessmentConfig(nextConfig);
}

// ============================================================================
// MULTI-INSTANCE ASSESSMENT SESSIONS
// ============================================================================

export async function createServerAssessmentSession(
  session: ServerAssessmentSession
): Promise<ServerAssessmentSession> {
  return getLearningStore().createAssessmentSession(session);
}

export async function getServerAssessmentSession(
  sessionId: string
): Promise<ServerAssessmentSession | undefined> {
  return getLearningStore().getAssessmentSession(sessionId);
}

export async function consumeServerAssessmentSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  return getLearningStore().markAssessmentSessionSubmitted(sessionId, userId);
}

export async function pruneExpiredServerSessions(): Promise<number> {
  return getLearningStore().pruneExpiredSessions(new Date().toISOString());
}

// ============================================================================
// ATTEMPTS & AUTHORITATIVE MODULE UNLOCK SYNCHRONIZATION
// ============================================================================

export async function recordServerAttempt(
  attempt: Omit<ServerAttemptSummary, 'verificationSignature'>
): Promise<ServerAttemptSummary> {
  const store = getLearningStore();
  const signature = signAssessmentAttemptReceipt({
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

  const persisted = await store.insertAttempt({
    ...attempt,
    courseSlug: attempt.courseSlug || attempt.courseId,
    verificationSignature: signature,
  });

  // Recompute and persist authoritative unlock progression in learning_module_unlocks
  await getAuthoritativeCandidateCourseStatus(attempt.userId, attempt.courseId);

  return persisted;
}

export async function getCandidateAttemptCount(
  userId: string,
  courseId: string,
  assessmentType: AssessmentType,
  moduleId?: string
): Promise<number> {
  return getLearningStore().countCandidateAttempts(userId, courseId, assessmentType, moduleId);
}

export async function listAllServerAttempts(filters?: {
  courseId?: string;
  assessmentType?: string;
  userId?: string;
}): Promise<ServerAttemptSummary[]> {
  return getLearningStore().listAttempts(filters);
}

export async function deleteServerAttemptById(attemptId: string): Promise<boolean> {
  return getLearningStore().deleteAttemptById(attemptId);
}

/**
 * Computes authoritative, tamper-resistant course unlock & assessment status
 * strictly from PostgreSQL-persisted, HMAC-verified assessment attempts, and
 * persists the derived state into `public.learning_module_unlocks`.
 */
export async function getAuthoritativeCandidateCourseStatus(
  userId: string,
  courseId: string
): Promise<{
  userId: string;
  courseId: string;
  passedModuleQuizIds: string[];
  unlockedModuleOrder: number;
  finalAssessmentPassed: boolean;
  bestFinalScorePercent: number | null;
  lastVerifiedAttemptId: string | null;
  lastVerifiedFinalAttemptId: string | null;
  completedLessonIds: string[];
}> {
  const store = getLearningStore();
  const [rawAttempts, courseDef, assessments, completedLessonIds] = await Promise.all([
    store.listAttempts({ userId, courseId }),
    getRegisteredCourseDefinition(courseId),
    getCourseAssessments(courseId),
    store.getLessonProgress(userId, courseId),
  ]);

  // Cryptographically verify every attempt's HMAC signature before trusting pass/score
  const verifiedAttempts = rawAttempts.filter((a) =>
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

  for (const att of verifiedAttempts) {
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

  // Compute sequential module unlock order (Module 1 unlocked initially; Module N+1 unlocks after Module N quiz passes)
  const orderedModuleIds =
    courseDef && courseDef.orderedModuleIds.length > 0
      ? courseDef.orderedModuleIds
      : assessments.moduleQuizzes
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

  const passedModuleQuizIds = Array.from(passedModuleQuizSet);

  // Persist authoritative progression state into public.learning_module_unlocks
  await store.upsertModuleUnlock({
    userId,
    courseId,
    passedModuleQuizIds,
    unlockedModuleOrder,
    finalAssessmentPassed,
    bestFinalScorePercent,
    lastVerifiedAttemptId,
    lastVerifiedFinalAttemptId,
    updatedAt: new Date().toISOString(),
  });

  return {
    userId,
    courseId,
    passedModuleQuizIds,
    unlockedModuleOrder,
    finalAssessmentPassed,
    bestFinalScorePercent,
    lastVerifiedAttemptId,
    lastVerifiedFinalAttemptId,
    completedLessonIds,
  };
}

/**
 * Safely clears all Learn with ABHI course-specific records from Supabase learning_* tables.
 * NEVER affects Firebase authentication or existing recruitment tables.
 */
export async function resetAllLearningTables(): Promise<{
  clearedConfigs: number;
  clearedAttempts: number;
  clearedProgressEntries: number;
  clearedCertificates: number;
  clearedCourseDefinitions: number;
  clearedSessions: number;
  clearedModuleUnlocks: number;
}> {
  return getLearningStore().resetAllLearningData();
}
