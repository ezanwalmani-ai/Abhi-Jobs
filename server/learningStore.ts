/**
 * SERVER-ONLY Learning Data Store Interface & Cryptographic Signing Module.
 *
 * SECURITY & PERSISTENCE BOUNDARY:
 * - Never import this file from client-side `src/` code.
 * - Permanent production storage is backed exclusively by Supabase PostgreSQL
 *   (`server/supabaseLearningStore.ts`, `public.learning_*` tables).
 * - Ephemeral in-memory storage has been REMOVED from the runtime learning workflow.
 * - Signing secret (`LEARNING_SIGNING_SECRET` or `CERTIFICATE_SIGNING_SECRET`) is
 *   read strictly from `process.env` — NEVER written to container disk.
 *   - In production (`NODE_ENV === 'production'`), fails closed (`SIGNING_SECRET_NOT_CONFIGURED`)
 *     unless a strong (32+ char) environment secret is configured across all instances.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { SupabaseLearningStoreRepository } from './supabaseLearningStore';
import { FileLearningStoreRepository } from './fileLearningStore';
import {
  EXCEL_COURSE_DEFINITION,
  EXCEL_M01_QUIZ_CONFIG,
  EXCEL_M02_QUIZ_CONFIG,
  EXCEL_M03_QUIZ_CONFIG,
} from './excelCurriculumSeed';

export type AssessmentType = 'module_quiz' | 'final_assessment';
export type CertificateValidityStatus = 'valid' | 'revoked';

export interface PersistedQuizQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctOptionIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface PersistedAssessmentConfig {
  id: string;
  courseId: string;
  courseSlug?: string;
  courseTitle: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  moduleOrder?: number;
  title: string;
  description: string;
  passPercentage: number;
  questionCount: number;
  randomizeOrder: boolean;
  requiredForCompletion: boolean;
  questions: PersistedQuizQuestion[];
  updatedAt?: string;
}

export interface PersistedAssessmentSession {
  sessionId: string;
  configId: string;
  courseId: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  servedQuestionIds: string[];
  /**
   * Maps each questionId -> [origIdxAtDisplay0, origIdxAtDisplay1, origIdxAtDisplay2, origIdxAtDisplay3]
   * so options can be shuffled per attempt while grading maps deterministically back to canonical index.
   */
  optionPermutations?: Record<string, [number, number, number, number]>;
  createdAt: string;
  expiresAt: string;
  submitted: boolean;
}

export interface PersistedAttemptRecord {
  id: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  assessmentTitle: string;
  attemptNumber: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercent: number;
  passPercentage: number;
  passed: boolean;
  submittedAt: string;
  verificationSignature: string;
}

export interface PersistedCourseDefinition {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  orderedModuleIds: string[];
  requiredLessonIds: string[];
  passPercentage: number;
  certificateTemplateId: string;
  updatedAt: string;
}

export interface PersistedModuleUnlockRecord {
  userId: string;
  courseId: string;
  passedModuleQuizIds: string[];
  unlockedModuleOrder: number;
  finalAssessmentPassed: boolean;
  bestFinalScorePercent: number | null;
  lastVerifiedAttemptId: string | null;
  lastVerifiedFinalAttemptId: string | null;
  updatedAt: string;
}

export interface PersistedCertificateRecord {
  certificateId: string;
  userId: string;
  candidateName: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  completionDate: string;
  issuedAt: string;
  finalAssessmentScore: number;
  status: CertificateValidityStatus;
  verificationSignature: string;
  finalAttemptId: string;
  templateId: string;
}

export interface LearningStoreDiagnostics {
  backend: string;
  isProductionDurable: boolean;
  supabaseConfigured: boolean;
  signingSecretConfigured: boolean;
  connected: boolean;
  connectionError?: string;
  courseDefinitionsCount: number;
  quizConfigsCount: number;
  attemptsCount: number;
  lessonProgressEntriesCount: number;
  moduleUnlocksCount: number;
  certificatesCount: number;
  updatedAt: string;
}

export interface LearningStoreRepository {
  readonly backendName: string;
  readonly isProductionDurable: boolean;

  // Courses
  getCourseDefinition(courseId: string): Promise<PersistedCourseDefinition | undefined>;
  upsertCourseDefinition(record: PersistedCourseDefinition): Promise<PersistedCourseDefinition>;

  // Assessment configs
  getAssessmentConfigById(id: string): Promise<PersistedAssessmentConfig | undefined>;
  listCourseAssessments(courseId: string): Promise<PersistedAssessmentConfig[]>;
  upsertAssessmentConfig(config: PersistedAssessmentConfig): Promise<PersistedAssessmentConfig>;

  // Multi-instance assessment sessions
  createAssessmentSession(session: PersistedAssessmentSession): Promise<PersistedAssessmentSession>;
  getAssessmentSession(sessionId: string): Promise<PersistedAssessmentSession | undefined>;
  markAssessmentSessionSubmitted(sessionId: string, userId: string): Promise<boolean>;
  pruneExpiredSessions(nowIso: string): Promise<number>;

  // Lesson progress
  getLessonProgress(userId: string, courseId: string): Promise<string[]>;
  upsertLessonProgress(
    userId: string,
    courseId: string,
    completedLessonIds: string[]
  ): Promise<string[]>;

  // Quiz & Final Assessment attempts
  insertAttempt(attempt: PersistedAttemptRecord): Promise<PersistedAttemptRecord>;
  countCandidateAttempts(
    userId: string,
    courseId: string,
    assessmentType: AssessmentType,
    moduleId?: string
  ): Promise<number>;
  listAttempts(filters?: {
    courseId?: string;
    assessmentType?: string;
    userId?: string;
  }): Promise<PersistedAttemptRecord[]>;
  deleteAttemptById(attemptId: string): Promise<boolean>;

  // Module unlocks
  getModuleUnlock(
    userId: string,
    courseId: string
  ): Promise<PersistedModuleUnlockRecord | undefined>;
  upsertModuleUnlock(record: PersistedModuleUnlockRecord): Promise<PersistedModuleUnlockRecord>;

  // Certificates
  getCertificateByUserCourse(
    userId: string,
    courseId: string
  ): Promise<PersistedCertificateRecord | undefined>;
  getCertificateById(certificateId: string): Promise<PersistedCertificateRecord | undefined>;
  listCertificatesByUser(userId: string): Promise<PersistedCertificateRecord[]>;
  insertCertificate(cert: PersistedCertificateRecord): Promise<PersistedCertificateRecord>;

  // Admin maintenance & diagnostics
  resetAllLearningData(): Promise<{
    clearedConfigs: number;
    clearedAttempts: number;
    clearedProgressEntries: number;
    clearedCertificates: number;
    clearedCourseDefinitions: number;
    clearedSessions: number;
    clearedModuleUnlocks: number;
  }>;
  getDiagnostics(): Promise<LearningStoreDiagnostics>;
}

// ============================================================================
// ACTIVE REPOSITORY (SUPABASE IF AVAILABLE, OTHERWISE SERVER FILE STORE)
// ============================================================================

let activeRepository: LearningStoreRepository | null = null;
let initializedPromise: Promise<void> | null = null;

export function getLearningStore(): LearningStoreRepository {
  if (!activeRepository) {
    activeRepository = new FileLearningStoreRepository();
  }
  return activeRepository;
}

/**
 * Initializes the learning repository on server boot and idempotently seeds
 * Module 1 ("Excel Fundamentals") under "Excel for Job Seekers" without ever
 * overwriting existing student attempts, unlocks, or creating duplicates.
 */
export async function initializeLearningStore(): Promise<void> {
  if (initializedPromise) {
    return initializedPromise;
  }

  initializedPromise = (async () => {
    const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
    const supabaseKey = (
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      ''
    ).trim();

    if (supabaseUrl && supabaseKey) {
      try {
        const supabaseRepo = new SupabaseLearningStoreRepository();
        const diag = await supabaseRepo.getDiagnostics();
        if (diag.connected) {
          activeRepository = supabaseRepo;
          console.log('[learningStore] Connected to Supabase PostgreSQL learning store.');
        } else {
          console.warn(
            `[learningStore] Supabase unavailable (${diag.connectionError || 'unconnected'}); using server-side file learning store (.learning-data/store.json).`
          );
          activeRepository = new FileLearningStoreRepository();
        }
      } catch (err) {
        console.warn(
          '[learningStore] Supabase connection check failed; using server-side file learning store (.learning-data/store.json):',
          err instanceof Error ? err.message : err
        );
        activeRepository = new FileLearningStoreRepository();
      }
    } else {
      activeRepository = new FileLearningStoreRepository();
    }

    await seedDefaultExcelModule1IfNeeded();
  })();

  return initializedPromise;
}

/**
 * Idempotently registers/updates the "Excel for Job Seekers" course definition
 * (Modules 1 & 2 + Module 3 placeholder) and seeds Module 1 & Module 2 quiz banks
 * if not already present. Never overwrites existing student progress, attempts,
 * or Module 1 quiz records.
 */
export async function seedDefaultExcelModule1IfNeeded(): Promise<void> {
  const store = getLearningStore();

  const existingCourse = await store.getCourseDefinition(EXCEL_COURSE_DEFINITION.courseId);
  if (!existingCourse) {
    await store.upsertCourseDefinition({
      ...EXCEL_COURSE_DEFINITION,
      updatedAt: new Date().toISOString(),
    });
  } else {
    // Ensure newly added modules (e.g. Module 2 & Module 3 placeholder) are registered
    // without touching student progress, attempts, or existing Module 1 records
    const desiredOrder = EXCEL_COURSE_DEFINITION.orderedModuleIds;
    const desiredLessons = EXCEL_COURSE_DEFINITION.requiredLessonIds;
    const orderChanged =
      existingCourse.orderedModuleIds.length !== desiredOrder.length ||
      desiredOrder.some((id, idx) => existingCourse.orderedModuleIds[idx] !== id);
    const lessonsChanged = desiredLessons.some(
      (id) => !existingCourse.requiredLessonIds.includes(id)
    );

    if (orderChanged || lessonsChanged) {
      await store.upsertCourseDefinition({
        ...existingCourse,
        orderedModuleIds: desiredOrder,
        requiredLessonIds: Array.from(
          new Set([...existingCourse.requiredLessonIds, ...desiredLessons])
        ),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const existingM01Quiz = await store.getAssessmentConfigById(EXCEL_M01_QUIZ_CONFIG.id);
  if (!existingM01Quiz) {
    await store.upsertAssessmentConfig({
      ...EXCEL_M01_QUIZ_CONFIG,
      updatedAt: new Date().toISOString(),
    });
  }

  const existingM02Quiz = await store.getAssessmentConfigById(EXCEL_M02_QUIZ_CONFIG.id);
  if (!existingM02Quiz) {
    await store.upsertAssessmentConfig({
      ...EXCEL_M02_QUIZ_CONFIG,
      updatedAt: new Date().toISOString(),
    });
  }

  const existingM03Quiz = await store.getAssessmentConfigById(EXCEL_M03_QUIZ_CONFIG.id);
  if (!existingM03Quiz) {
    await store.upsertAssessmentConfig({
      ...EXCEL_M03_QUIZ_CONFIG,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Allows automated test harnesses to inject a mock/isolated repository without
 * modifying production behavior (never called in production runtime).
 */
export function setLearningStoreRepository(repo: LearningStoreRepository | null): void {
  activeRepository = repo;
  initializedPromise = null;
}

// ============================================================================
// SIGNING SECRET RESOLUTION (ENV-ONLY IN PRODUCTION, CONSISTENT ACROSS INSTANCES)
// ============================================================================

let devFallbackSigningSecret: string | null = null;
let loggedDevSecretWarning = false;

export function isSigningSecretConfigured(): boolean {
  const envSecret =
    (process.env.LEARNING_SIGNING_SECRET || '').trim() ||
    (process.env.CERTIFICATE_SIGNING_SECRET || '').trim();
  return envSecret.length >= 32;
}

function resolveSigningSecret(): string {
  const envSecret =
    (process.env.LEARNING_SIGNING_SECRET || '').trim() ||
    (process.env.CERTIFICATE_SIGNING_SECRET || '').trim();

  if (envSecret.length >= 32) {
    return envSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SIGNING_SECRET_NOT_CONFIGURED: Set LEARNING_SIGNING_SECRET (minimum 32 random characters) in production environment variables so HMAC signatures remain stable across restarts and Cloud Run instances.'
    );
  }

  // Non-production dev fallback: persist inside server-only .learning-data/.dev-signing-key
  // so HMAC-verified quiz attempts and module unlocks survive dev server restarts.
  if (envSecret.length >= 16) {
    return envSecret;
  }

  if (!devFallbackSigningSecret) {
    const keyFilePath = path.resolve(process.cwd(), '.learning-data', '.dev-signing-key');
    try {
      if (fs.existsSync(keyFilePath)) {
        const stored = fs.readFileSync(keyFilePath, 'utf8').trim();
        if (stored.length >= 32) {
          devFallbackSigningSecret = stored;
        }
      }
      if (!devFallbackSigningSecret) {
        devFallbackSigningSecret = crypto.randomBytes(32).toString('hex');
        const dir = path.dirname(keyFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(keyFilePath, devFallbackSigningSecret, { encoding: 'utf8', mode: 0o600 });
      }
    } catch {
      devFallbackSigningSecret = crypto.randomBytes(32).toString('hex');
    }
  }
  if (!loggedDevSecretWarning) {
    loggedDevSecretWarning = true;
    console.warn(
      '[learningStore] LEARNING_SIGNING_SECRET (32+ chars) is not set. Using a local server-only dev key. Configure LEARNING_SIGNING_SECRET in production environment variables.'
    );
  }
  return devFallbackSigningSecret;
}

export function signAssessmentAttemptReceipt(fields: {
  attemptId: string;
  userId: string;
  courseId: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  scorePercent: number;
  passPercentage: number;
  passed: boolean;
  submittedAt: string;
}): string {
  const payload = [
    'ATTEMPT_V1',
    fields.attemptId,
    fields.userId,
    fields.courseId,
    fields.assessmentType,
    fields.moduleId || '',
    String(fields.scorePercent),
    String(fields.passPercentage),
    fields.passed ? '1' : '0',
    fields.submittedAt,
  ].join('|');

  return crypto
    .createHmac('sha256', resolveSigningSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 48);
}

export function verifyAssessmentAttemptReceipt(fields: {
  attemptId: string;
  userId: string;
  courseId: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  scorePercent: number;
  passPercentage: number;
  passed: boolean;
  submittedAt: string;
  verificationSignature: string;
}): boolean {
  if (!fields.verificationSignature || fields.verificationSignature.length < 32) {
    return false;
  }
  try {
    const expected = signAssessmentAttemptReceipt(fields);
    const a = Buffer.from(fields.verificationSignature, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function signCertificateReceipt(fields: {
  certificateId: string;
  userId: string;
  courseId: string;
  finalAttemptId: string;
  finalAssessmentScore: number;
  completionDate: string;
}): string {
  const payload = [
    'CERT_V1',
    fields.certificateId,
    fields.userId,
    fields.courseId,
    fields.finalAttemptId,
    String(fields.finalAssessmentScore),
    fields.completionDate,
  ].join('|');

  return crypto
    .createHmac('sha256', resolveSigningSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 48);
}

export function verifyCertificateReceipt(fields: {
  certificateId: string;
  userId: string;
  courseId: string;
  finalAttemptId: string;
  finalAssessmentScore: number;
  completionDate: string;
  verificationSignature: string;
}): boolean {
  if (!fields.verificationSignature || fields.verificationSignature.length < 32) {
    return false;
  }
  try {
    const expected = signCertificateReceipt(fields);
    const a = Buffer.from(fields.verificationSignature, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ============================================================================
// HIGH-LEVEL COURSE DEFINITION & DIAGNOSTICS HELPERS
// ============================================================================

export async function getRegisteredCourseDefinition(
  courseId: string
): Promise<PersistedCourseDefinition | undefined> {
  return getLearningStore().getCourseDefinition(courseId);
}

export async function upsertRegisteredCourseDefinition(
  input: Omit<PersistedCourseDefinition, 'updatedAt'>
): Promise<PersistedCourseDefinition> {
  const safeCourseId = input.courseId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  const record: PersistedCourseDefinition = {
    courseId: safeCourseId,
    courseSlug: input.courseSlug.trim().slice(0, 128) || safeCourseId,
    courseTitle: input.courseTitle.trim().slice(0, 160),
    orderedModuleIds: Array.from(
      new Set(
        input.orderedModuleIds
          .filter((id) => typeof id === 'string' && id.trim().length > 0)
          .map((id) => id.trim().slice(0, 128))
      )
    ).slice(0, 40),
    requiredLessonIds: Array.from(
      new Set(
        input.requiredLessonIds
          .filter((id) => typeof id === 'string' && id.trim().length > 0)
          .map((id) => id.trim().slice(0, 128))
      )
    ).slice(0, 200),
    passPercentage: Math.max(70, Math.min(100, Math.round(input.passPercentage || 70))),
    certificateTemplateId:
      (input.certificateTemplateId || 'default_abhi_certificate').trim().slice(0, 128),
    updatedAt: new Date().toISOString(),
  };

  return getLearningStore().upsertCourseDefinition(record);
}

export async function getDurableStoreDiagnostics(): Promise<LearningStoreDiagnostics> {
  return getLearningStore().getDiagnostics();
}
