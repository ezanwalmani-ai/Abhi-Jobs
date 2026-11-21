/**
 * SERVER-ONLY Durable Learning Data Store & Cryptographic Signing Module.
 *
 * SECURITY & PERSISTENCE BOUNDARY:
 * - Never import this file from client-side `src/` code.
 * - Eliminates reliance on volatile in-memory-only storage for quiz configs,
 *   server-graded assessment attempts, course requirement definitions, lesson
 *   progress receipts, and issued certificates by atomically persisting state
 *   to disk (`.learning-data/learning-store.json`).
 * - Generates and verifies HMAC-SHA256 receipts for graded assessment attempts
 *   and issued certificates using `process.env.LEARNING_SIGNING_SECRET` /
 *   `process.env.CERTIFICATE_SIGNING_SECRET` (with a server-private auto-generated
 *   key fallback in `.learning-data/` so signatures remain valid across restarts).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', '.learning-data');
const STORE_FILE = path.join(DATA_DIR, 'learning-store.json');
const RUNTIME_KEY_FILE = path.join(DATA_DIR, '.signing-key');

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

export interface DurableLearningStoreSnapshot {
  version: 1;
  updatedAt: string;
  courseDefinitions: Record<string, PersistedCourseDefinition>;
  quizConfigs: Record<string, PersistedAssessmentConfig>;
  attempts: PersistedAttemptRecord[];
  lessonProgress: Record<string, string[]>;
  certificatesByUserCourse: Record<string, PersistedCertificateRecord>;
}

function createEmptySnapshot(): DurableLearningStoreSnapshot {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    courseDefinitions: {},
    quizConfigs: {},
    attempts: [],
    lessonProgress: {},
    certificatesByUserCourse: {},
  };
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
}

let cachedSigningSecret: string | null = null;

function resolveSigningSecret(): string {
  if (cachedSigningSecret) return cachedSigningSecret;

  const envSecret =
    (process.env.LEARNING_SIGNING_SECRET || '').trim() ||
    (process.env.CERTIFICATE_SIGNING_SECRET || '').trim();
  if (envSecret.length >= 16) {
    cachedSigningSecret = envSecret;
    return cachedSigningSecret;
  }

  // Persist a server-private random key inside `.learning-data/` so HMAC receipts
  // remain verifiable across server restarts even when env secrets are not yet configured.
  try {
    ensureDataDir();
    if (fs.existsSync(RUNTIME_KEY_FILE)) {
      const stored = fs.readFileSync(RUNTIME_KEY_FILE, 'utf8').trim();
      if (stored.length >= 32) {
        cachedSigningSecret = stored;
        return cachedSigningSecret;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(RUNTIME_KEY_FILE, generated, { encoding: 'utf8', mode: 0o600 });
    cachedSigningSecret = generated;
    return cachedSigningSecret;
  } catch {
    cachedSigningSecret = crypto.randomBytes(32).toString('hex');
    return cachedSigningSecret;
  }
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
  const expected = signAssessmentAttemptReceipt(fields);
  const a = Buffer.from(fields.verificationSignature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
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
  const expected = signCertificateReceipt(fields);
  const a = Buffer.from(fields.verificationSignature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

let inMemorySnapshot: DurableLearningStoreSnapshot | null = null;

export function loadDurableLearningStore(): DurableLearningStoreSnapshot {
  if (inMemorySnapshot) return inMemorySnapshot;

  try {
    ensureDataDir();
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemorySnapshot = {
          version: 1,
          updatedAt:
            typeof parsed.updatedAt === 'string'
              ? parsed.updatedAt
              : new Date().toISOString(),
          courseDefinitions:
            parsed.courseDefinitions && typeof parsed.courseDefinitions === 'object'
              ? parsed.courseDefinitions
              : {},
          quizConfigs:
            parsed.quizConfigs && typeof parsed.quizConfigs === 'object'
              ? parsed.quizConfigs
              : {},
          attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
          lessonProgress:
            parsed.lessonProgress && typeof parsed.lessonProgress === 'object'
              ? parsed.lessonProgress
              : {},
          certificatesByUserCourse:
            parsed.certificatesByUserCourse &&
            typeof parsed.certificatesByUserCourse === 'object'
              ? parsed.certificatesByUserCourse
              : {},
        };
        return inMemorySnapshot;
      }
    }
  } catch (err) {
    console.warn('[learningStore] Failed to load durable store; initializing clean store:', err);
  }

  inMemorySnapshot = createEmptySnapshot();
  persistDurableLearningStore(inMemorySnapshot);
  return inMemorySnapshot;
}

export function persistDurableLearningStore(snapshot: DurableLearningStoreSnapshot): void {
  snapshot.updatedAt = new Date().toISOString();
  inMemorySnapshot = snapshot;

  try {
    ensureDataDir();
    const tmpFile = `${STORE_FILE}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(snapshot, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
    fs.renameSync(tmpFile, STORE_FILE);
  } catch (err) {
    console.error('[learningStore] Failed to persist durable learning store to disk:', err);
  }
}

export function getRegisteredCourseDefinition(
  courseId: string
): PersistedCourseDefinition | undefined {
  const store = loadDurableLearningStore();
  return store.courseDefinitions[courseId];
}

export function upsertRegisteredCourseDefinition(
  input: Omit<PersistedCourseDefinition, 'updatedAt'>
): PersistedCourseDefinition {
  const store = loadDurableLearningStore();
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

  store.courseDefinitions[safeCourseId] = record;
  persistDurableLearningStore(store);
  return record;
}

export function getDurableStoreDiagnostics(): {
  storePath: string;
  courseDefinitionsCount: number;
  quizConfigsCount: number;
  attemptsCount: number;
  lessonProgressEntriesCount: number;
  certificatesCount: number;
  updatedAt: string;
} {
  const store = loadDurableLearningStore();
  return {
    storePath: STORE_FILE,
    courseDefinitionsCount: Object.keys(store.courseDefinitions).length,
    quizConfigsCount: Object.keys(store.quizConfigs).length,
    attemptsCount: store.attempts.length,
    lessonProgressEntriesCount: Object.keys(store.lessonProgress).length,
    certificatesCount: Object.keys(store.certificatesByUserCourse).length,
    updatedAt: store.updatedAt,
  };
}
