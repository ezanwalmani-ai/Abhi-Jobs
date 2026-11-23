import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import {
  AssessmentType,
  ServerAssessmentConfig,
  ServerQuizQuestion,
  addOrUpdateQuestion,
  consumeServerAssessmentSession,
  createServerAssessmentSession,
  deleteServerAttemptById,
  getAssessmentConfig,
  getAssessmentConfigById,
  getAuthoritativeCandidateCourseStatus,
  getCandidateAttemptCount,
  getCourseAssessments,
  getServerAssessmentSession,
  listAllServerAttempts,
  pruneExpiredServerSessions,
  recordServerAttempt,
  removeQuestion,
  resetAllLearningTables,
  updateAssessmentConfigSettings,
  upsertAssessmentConfig,
} from './server/quizBank';
import {
  issueVerifiedCertificate,
  listCandidateServerCertificates,
  recordServerLessonProgress,
  verifyPublicCertificateById,
} from './server/certificateStore';
import {
  getDurableStoreDiagnostics,
  getRegisteredCourseDefinition,
  upsertRegisteredCourseDefinition,
} from './server/learningStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase projectId from firebase-applet-config.json if available
let FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'geometric-centaur-c6pck';
try {
  const cfgPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    if (typeof parsed.projectId === 'string' && parsed.projectId.trim()) {
      FIREBASE_PROJECT_ID = parsed.projectId.trim();
    }
  }
} catch {
  // Keep fallback projectId
}

const ADMIN_EMAILS = new Set(['ezanwalmani@gmail.com']);
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ============================================================================
// CRYPTOGRAPHIC FIREBASE ID TOKEN VERIFICATION
// ============================================================================

interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

interface CertCache {
  certs: Record<string, string>;
  expiresAt: number;
}

let googleCertCache: CertCache | null = null;

async function fetchGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (googleCertCache && googleCertCache.expiresAt > now) {
    return googleCertCache.certs;
  }

  const res = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) {
    throw new Error(`Unable to fetch Firebase public keys (${res.status})`);
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const ttlSeconds = maxAgeMatch ? Math.max(60, parseInt(maxAgeMatch[1], 10)) : 3600;
  const certs = (await res.json()) as Record<string, string>;

  googleCertCache = {
    certs,
    expiresAt: now + ttlSeconds * 1000,
  };
  return certs;
}

function base64UrlDecodeToBuffer(segment: string): Buffer {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
}

async function verifyFirebaseIdToken(token: string): Promise<VerifiedFirebaseUser | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const header = JSON.parse(base64UrlDecodeToBuffer(headerB64).toString('utf8'));
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
      return null;
    }

    const payload = JSON.parse(base64UrlDecodeToBuffer(payloadB64).toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);

    if (typeof payload.exp !== 'number' || payload.exp <= nowSec) return null;
    if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) return null;
    if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
    if (typeof payload.sub !== 'string' || !payload.sub.trim()) return null;

    const certs = await fetchGooglePublicCerts();
    const pemCert = certs[header.kid];
    if (!pemCert) return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();

    const sigBuf = base64UrlDecodeToBuffer(signatureB64);
    const isValidSig = verifier.verify(pemCert, sigBuf);
    if (!isValidSig) return null;

    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email.toLowerCase() : '',
      emailVerified: Boolean(payload.email_verified),
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// ADMIN PASSCODE AUTH (ENV-CONFIGURED SECRET FOR MULTI-INSTANCE CONSISTENCY)
// ============================================================================

let devAdminSessionSecret: string | null = null;

function resolveAdminSessionSecret(): string {
  const configured =
    (process.env.ADMIN_ASSESSMENT_SESSION_SECRET || '').trim() ||
    (process.env.LEARNING_SIGNING_SECRET || '').trim();

  if (configured.length >= 32) {
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_SESSION_SECRET_NOT_CONFIGURED: Set ADMIN_ASSESSMENT_SESSION_SECRET (32+ random chars) in production environment variables.'
    );
  }

  if (configured.length >= 16) {
    return configured;
  }

  if (!devAdminSessionSecret) {
    devAdminSessionSecret = crypto.randomBytes(32).toString('hex');
  }
  return devAdminSessionSecret;
}

interface ClaimedPasscodeRecord {
  saltHex: string;
  hashHex: string;
  claimedAt: string;
}

let claimedAdminPasscode: ClaimedPasscodeRecord | null = null;

function timingSafeTextEqual(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function hashPasscodeScrypt(passcode: string, saltHex: string): string {
  return crypto.scryptSync(passcode, Buffer.from(saltHex, 'hex'), 64).toString('hex');
}

function verifyPasscodeAgainstConfig(candidatePasscode: string): boolean {
  const envPasscode = (process.env.ADMIN_ASSESSMENT_PASSCODE || '').trim();
  if (envPasscode.length > 0) {
    return timingSafeTextEqual(candidatePasscode, envPasscode);
  }
  if (!claimedAdminPasscode) return false;
  const computed = hashPasscodeScrypt(candidatePasscode, claimedAdminPasscode.saltHex);
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(claimedAdminPasscode.hashHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function issueAdminSessionToken(subject: string): { token: string; expiresAt: string } {
  const secret = resolveAdminSessionSecret();
  const exp = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', sub: subject, exp }),
    'utf8'
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return {
    token: `adm.${payload}.${sig}`,
    expiresAt: new Date(exp).toISOString(),
  };
}

function verifyAdminSessionToken(token: string): { sub: string } | null {
  try {
    if (!token.startsWith('adm.')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [, payload, sig] = parts;
    const secret = resolveAdminSessionSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.role !== 'admin' || typeof decoded.exp !== 'number' || decoded.exp <= Date.now()) {
      return null;
    }
    return { sub: String(decoded.sub || 'admin') };
  } catch {
    return null;
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

async function resolveAdminAuth(req: Request): Promise<{
  authorized: boolean;
  method?: 'firebase' | 'passcode';
  actor?: string;
}> {
  const token = extractBearerToken(req);
  if (!token) return { authorized: false };

  // 1. Check HMAC admin session token
  if (token.startsWith('adm.')) {
    const verified = verifyAdminSessionToken(token);
    if (verified) {
      return { authorized: true, method: 'passcode', actor: verified.sub };
    }
    return { authorized: false };
  }

  // 2. Check cryptographic Firebase ID token
  const fbUser = await verifyFirebaseIdToken(token);
  if (fbUser && fbUser.emailVerified && ADMIN_EMAILS.has(fbUser.email)) {
    return { authorized: true, method: 'firebase', actor: fbUser.email };
  }

  return { authorized: false };
}

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authResult = await resolveAdminAuth(req);
  if (!authResult.authorized) {
    res.status(401).json({
      error: 'Administrator authentication required.',
      code: 'ADMIN_UNAUTHORIZED',
    });
    return;
  }
  (req as any).adminActor = authResult.actor || 'admin';
  next();
}

/**
 * Cryptographically authenticates a student using their Firebase ID token.
 * Rejects missing, invalid, unverified-email, or UID-spoofed requests so student
 * quiz attempts, progress, and certificates are strictly bound to Firebase UID.
 */
async function requireVerifiedCandidate(
  req: Request,
  res: Response,
  claimedCandidateId?: string
): Promise<VerifiedFirebaseUser | null> {
  const bearer = extractBearerToken(req);
  if (!bearer || bearer.startsWith('adm.')) {
    res.status(401).json({
      error: 'Valid Firebase authentication token is required.',
      code: 'CANDIDATE_AUTH_REQUIRED',
    });
    return null;
  }

  const fbUser = await verifyFirebaseIdToken(bearer);
  if (!fbUser || !fbUser.uid) {
    res.status(401).json({
      error: 'Invalid or expired authentication token. Please sign in again.',
      code: 'CANDIDATE_TOKEN_INVALID',
    });
    return null;
  }

  if (!fbUser.emailVerified) {
    res.status(403).json({
      error: 'A verified email account is required to record learning progress and assessments.',
      code: 'EMAIL_VERIFICATION_REQUIRED',
    });
    return null;
  }

  const claimed = sanitizeShortText(claimedCandidateId, 128);
  if (claimed && claimed !== fbUser.uid) {
    res.status(403).json({
      error: 'Account mismatch detected. You may only access your own learning records.',
      code: 'CANDIDATE_UID_MISMATCH',
    });
    return null;
  }

  return fbUser;
}

// ============================================================================
// HELPERS & ERROR BOUNDARY
// ============================================================================

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function stripQuestionSecrets(q: ServerQuizQuestion) {
  return {
    id: q.id,
    prompt: q.prompt,
    options: q.options,
  };
}

function sanitizeConfigSummary(cfg: ServerAssessmentConfig) {
  return {
    id: cfg.id,
    courseId: cfg.courseId,
    courseTitle: cfg.courseTitle,
    assessmentType: cfg.assessmentType,
    moduleId: cfg.moduleId,
    moduleOrder: cfg.moduleOrder,
    title: cfg.title,
    description: cfg.description,
    passPercentage: cfg.passPercentage,
    questionCount: Math.min(cfg.questionCount, cfg.questions.length),
    totalBankQuestions: cfg.questions.length,
    randomizeOrder: cfg.randomizeOrder,
    requiredForCompletion: cfg.requiredForCompletion,
  };
}

function sanitizeShortText(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function handleLearningRouteError(res: Response, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err || '');

  if (message.includes('SIGNING_SECRET_NOT_CONFIGURED')) {
    res.status(503).json({
      error: 'Assessment and certificate signing secret is not configured for production.',
      code: 'SIGNING_SECRET_NOT_CONFIGURED',
    });
    return;
  }

  if (message.includes('ADMIN_SESSION_SECRET_NOT_CONFIGURED')) {
    res.status(503).json({
      error: 'Admin session secret is not configured for production.',
      code: 'ADMIN_SESSION_SECRET_NOT_CONFIGURED',
    });
    return;
  }

  if (message.includes('LEARNING_STORAGE_NOT_CONFIGURED')) {
    res.status(503).json({
      error: 'Supabase PostgreSQL learning storage is not configured.',
      code: 'LEARNING_STORAGE_NOT_CONFIGURED',
    });
    return;
  }

  if (message.includes('LEARNING_STORAGE_ERROR')) {
    res.status(503).json({
      error: 'Learning database is currently unavailable or migration has not been applied.',
      code: 'LEARNING_STORAGE_UNAVAILABLE',
    });
    return;
  }

  console.error('[Learn with ABHI API error]', message);
  res.status(500).json({
    error: 'An unexpected server error occurred while processing the learning request.',
    code: 'INTERNAL_SERVER_ERROR',
  });
}

// ============================================================================
// EXPRESS APP + API ROUTES
// ============================================================================

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // --------------------------------------------------------------------------
  // CANDIDATE ASSESSMENT APIs (Strictly Firebase UID Authenticated)
  // --------------------------------------------------------------------------

  // 1. Course assessments summary (NO questions, NO correctOptionIndex, NO explanations)
  app.get('/api/learning/assessments/course/:courseId/summary', async (req: Request, res: Response) => {
    try {
      const courseId = sanitizeShortText(req.params.courseId, 128);
      if (!courseId) {
        res.status(400).json({ error: 'Invalid courseId.' });
        return;
      }

      const { moduleQuizzes, finalAssessment } = await getCourseAssessments(courseId);
      res.json({
        courseId,
        moduleQuizzes: moduleQuizzes.map(sanitizeConfigSummary),
        finalAssessment: finalAssessment ? sanitizeConfigSummary(finalAssessment) : null,
      });
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // 2. Start a quiz or final assessment session — returns ONLY prompts & 4 options
  app.post('/api/learning/assessments/start', async (req: Request, res: Response) => {
    try {
      const fbUser = await requireVerifiedCandidate(req, res, req.body?.candidateId);
      if (!fbUser) return;

      await pruneExpiredServerSessions().catch(() => 0);

      const courseId = sanitizeShortText(req.body?.courseId, 128);
      const assessmentType: AssessmentType =
        req.body?.assessmentType === 'final_assessment' ? 'final_assessment' : 'module_quiz';
      const moduleId = sanitizeShortText(req.body?.moduleId, 128) || undefined;

      if (!courseId) {
        res.status(400).json({ error: 'courseId is required.' });
        return;
      }
      if (assessmentType === 'module_quiz' && !moduleId) {
        res.status(400).json({ error: 'moduleId is required for a module quiz.' });
        return;
      }

      const config = await getAssessmentConfig(courseId, assessmentType, moduleId);
      if (!config || config.questions.length === 0) {
        res.status(404).json({ error: 'Assessment not found for this course or module.' });
        return;
      }

      const candidateId = fbUser.uid;
      const [authoritativeStatus, courseDef] = await Promise.all([
        getAuthoritativeCandidateCourseStatus(candidateId, courseId),
        getRegisteredCourseDefinition(courseId),
      ]);

      // Enforce server-side sequential module unlock and final assessment prerequisites
      if (assessmentType === 'module_quiz') {
        const idxInCourseDef =
          courseDef && config.moduleId
            ? courseDef.orderedModuleIds.indexOf(config.moduleId)
            : -1;
        const effectiveModuleOrder =
          idxInCourseDef >= 0 ? idxInCourseDef + 1 : config.moduleOrder || 1;

        if (effectiveModuleOrder > authoritativeStatus.unlockedModuleOrder) {
          res.status(403).json({
            error:
              'This module quiz is locked. Complete and pass the previous module quiz first.',
            code: 'MODULE_LOCKED',
            requiredUnlockedOrder: effectiveModuleOrder,
            currentUnlockedOrder: authoritativeStatus.unlockedModuleOrder,
          });
          return;
        }
      } else if (assessmentType === 'final_assessment') {
        const { moduleQuizzes } = await getCourseAssessments(courseId);
        const passedQuizSet = new Set(authoritativeStatus.passedModuleQuizIds);
        const requiredQuizModuleIds = moduleQuizzes
          .filter((q) => q.requiredForCompletion && q.moduleId)
          .map((q) => q.moduleId as string);
        const missingModuleQuizIds = requiredQuizModuleIds.filter(
          (modId) => !passedQuizSet.has(modId)
        );

        const completedLessonSet = new Set(authoritativeStatus.completedLessonIds);
        const requiredLessonIds = courseDef?.requiredLessonIds || [];
        const missingLessonsCount = requiredLessonIds.filter(
          (lessonId) => !completedLessonSet.has(lessonId)
        ).length;

        if (missingModuleQuizIds.length > 0 || missingLessonsCount > 0) {
          res.status(403).json({
            error:
              'The Final Course Assessment is locked until all required lessons and module quizzes are completed.',
            code: 'FINAL_ASSESSMENT_LOCKED',
            missingModuleQuizIds,
            missingLessonsCount,
          });
          return;
        }
      }

      const candidateName =
        fbUser.name || sanitizeShortText(req.body?.candidateName, 120) || 'ABHI JOBS Candidate';
      const candidateEmail = fbUser.email || '';

      const countToServe = Math.max(1, Math.min(config.questionCount, config.questions.length));
      const orderedPool = config.randomizeOrder
        ? shuffleArray(config.questions)
        : [...config.questions];
      const selectedQuestions = orderedPool.slice(0, countToServe);

      const nowMs = Date.now();
      const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
      await createServerAssessmentSession({
        sessionId,
        configId: config.id,
        courseId: config.courseId,
        assessmentType: config.assessmentType,
        moduleId: config.moduleId,
        userId: candidateId,
        candidateName,
        candidateEmail,
        servedQuestionIds: selectedQuestions.map((q) => q.id),
        createdAt: new Date(nowMs).toISOString(),
        expiresAt: new Date(nowMs + SESSION_TTL_MS).toISOString(),
        submitted: false,
      });

      const previousAttempts = await getCandidateAttemptCount(
        candidateId,
        config.courseId,
        config.assessmentType,
        config.moduleId
      );

      res.json({
        sessionId,
        assessmentId: config.id,
        courseId: config.courseId,
        courseTitle: config.courseTitle,
        assessmentType: config.assessmentType,
        moduleId: config.moduleId,
        title: config.title,
        description: config.description,
        passPercentage: config.passPercentage,
        totalQuestions: selectedQuestions.length,
        previousAttempts,
        questions: selectedQuestions.map(stripQuestionSecrets),
      });
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // 3. Submit candidate answers — validated, graded, HMAC-signed, and persisted in PostgreSQL
  app.post('/api/learning/assessments/submit', async (req: Request, res: Response) => {
    try {
      const fbUser = await requireVerifiedCandidate(req, res);
      if (!fbUser) return;

      const sessionId = sanitizeShortText(req.body?.sessionId, 128);
      const rawAnswers = req.body?.answers;

      if (!sessionId || !rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
        res.status(400).json({ error: 'sessionId and answers map are required.' });
        return;
      }

      const session = await getServerAssessmentSession(sessionId);
      if (!session || Date.now() > new Date(session.expiresAt).getTime()) {
        res.status(404).json({
          error: 'Assessment session expired or not found. Please start a fresh attempt.',
        });
        return;
      }

      if (session.submitted) {
        res.status(409).json({
          error: 'This assessment session has already been graded. Start a new attempt to retake.',
        });
        return;
      }

      if (session.userId !== fbUser.uid) {
        res.status(403).json({
          error: 'Authentication mismatch. You may only submit your own assessment session.',
        });
        return;
      }

      const config = await getAssessmentConfigById(session.configId);
      if (!config) {
        res.status(404).json({ error: 'Assessment configuration no longer exists.' });
        return;
      }

      const questionById = new Map<string, ServerQuizQuestion>();
      for (const q of config.questions) {
        questionById.set(q.id, q);
      }

      const servedQuestions = session.servedQuestionIds
        .map((id) => questionById.get(id))
        .filter((q): q is ServerQuizQuestion => Boolean(q));

      if (servedQuestions.length === 0) {
        res.status(500).json({ error: 'Unable to resolve served assessment questions.' });
        return;
      }

      // Validate every served question has a single valid answer option index (0..3)
      let correctAnswers = 0;
      const sanitizedAnswers: Record<string, number> = {};
      const questionResults = [];

      for (const q of servedQuestions) {
        const submittedVal = (rawAnswers as Record<string, unknown>)[q.id];
        const selectedOptionIndex =
          typeof submittedVal === 'number' &&
          Number.isInteger(submittedVal) &&
          submittedVal >= 0 &&
          submittedVal <= 3
            ? (submittedVal as 0 | 1 | 2 | 3)
            : null;

        if (selectedOptionIndex === null) {
          res.status(400).json({
            error: 'Please answer every question before submitting your assessment.',
          });
          return;
        }

        sanitizedAnswers[q.id] = selectedOptionIndex;
        const isCorrect = selectedOptionIndex === q.correctOptionIndex;
        if (isCorrect) correctAnswers += 1;

        questionResults.push({
          questionId: q.id,
          prompt: q.prompt,
          options: q.options,
          selectedOptionIndex,
          correctOptionIndex: q.correctOptionIndex,
          isCorrect,
          explanation: q.explanation,
        });
      }

      // Atomically mark session consumed in PostgreSQL to prevent replay across instances
      const consumed = await consumeServerAssessmentSession(sessionId, fbUser.uid);
      if (!consumed) {
        res.status(409).json({
          error: 'This assessment session has already been graded. Start a new attempt to retake.',
        });
        return;
      }

      const totalQuestions = servedQuestions.length;
      const incorrectAnswers = totalQuestions - correctAnswers;
      const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);
      const passPercentage =
        session.assessmentType === 'final_assessment'
          ? Math.max(70, config.passPercentage)
          : config.passPercentage;
      const passed =
        session.assessmentType === 'final_assessment'
          ? scorePercent >= passPercentage && scorePercent >= 70
          : scorePercent >= passPercentage;

      const priorCount = await getCandidateAttemptCount(
        session.userId,
        session.courseId,
        session.assessmentType,
        session.moduleId
      );
      const attemptNumber = priorCount + 1;
      const submittedAt = new Date().toISOString();
      const attemptId = `att_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
      const courseSlug = config.courseSlug || session.courseId;

      const persistedAttempt = await recordServerAttempt({
        id: attemptId,
        userId: session.userId,
        candidateName: session.candidateName,
        candidateEmail: session.candidateEmail,
        courseId: session.courseId,
        courseSlug,
        courseTitle: config.courseTitle,
        assessmentType: session.assessmentType,
        moduleId: session.moduleId,
        assessmentTitle: config.title,
        attemptNumber,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        scorePercent,
        passPercentage,
        passed,
        submittedAt,
      });

      const authoritativeStatus = await getAuthoritativeCandidateCourseStatus(
        session.userId,
        session.courseId
      );

      res.json({
        id: persistedAttempt.id,
        userId: persistedAttempt.userId,
        courseId: persistedAttempt.courseId,
        courseSlug: persistedAttempt.courseSlug,
        courseTitle: persistedAttempt.courseTitle,
        assessmentType: persistedAttempt.assessmentType,
        moduleId: persistedAttempt.moduleId,
        assessmentTitle: persistedAttempt.assessmentTitle,
        attemptNumber: persistedAttempt.attemptNumber,
        totalQuestions: persistedAttempt.totalQuestions,
        correctAnswers: persistedAttempt.correctAnswers,
        incorrectAnswers: persistedAttempt.incorrectAnswers,
        scorePercent: persistedAttempt.scorePercent,
        passPercentage: persistedAttempt.passPercentage,
        passed: persistedAttempt.passed,
        submittedAt: persistedAttempt.submittedAt,
        verificationSignature: persistedAttempt.verificationSignature,
        answers: sanitizedAnswers,
        questionResults,
        courseProgressStatus: authoritativeStatus,
      });
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // 3b. List authenticated candidate's own server-verified assessment attempts
  app.get('/api/learning/assessments/mine', async (req: Request, res: Response) => {
    try {
      const fbUser = await requireVerifiedCandidate(req, res);
      if (!fbUser) return;

      const courseId = sanitizeShortText(req.query.courseId, 128) || 'all';
      const attempts = await listAllServerAttempts({
        userId: fbUser.uid,
        courseId,
      });
      res.json({ attempts });
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // 4. Sync candidate lesson progress to PostgreSQL (strictly authenticated UID)
  app.post('/api/learning/progress/sync', async (req: Request, res: Response) => {
    try {
      const fbUser = await requireVerifiedCandidate(req, res, req.body?.candidateId);
      if (!fbUser) return;

      const courseId = sanitizeShortText(req.body?.courseId, 128);
      const rawCompleted = req.body?.completedLessonIds;
      if (!courseId || !Array.isArray(rawCompleted)) {
        res.status(400).json({ error: 'courseId and completedLessonIds array are required.' });
        return;
      }

      const lessonIds = rawCompleted
        .filter((id): id is string => typeof id === 'string')
        .slice(0, 200);
      const result = await recordServerLessonProgress(fbUser.uid, courseId, lessonIds);
      res.json({ synced: true, ...result });
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // 4b. Authoritative server-computed course unlock & quiz pass status
  app.get('/api/learning/progress/course/:courseId/status', async (req: Request, res: Response) => {
    try {
      const fbUser = await requireVerifiedCandidate(req, res);
      if (!fbUser) return;

      const courseId = sanitizeShortText(req.params.courseId, 128);
      if (!courseId) {
        res.status(400).json({ error: 'Invalid courseId.' });
        return;
      }

      const status = await getAuthoritativeCandidateCourseStatus(fbUser.uid, courseId);
      res.json(status);
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // 5. Issue a verified Course Completion Certificate (validated strictly from PostgreSQL records)
  app.post('/api/learning/certificates/issue', async (req: Request, res: Response) => {
    try {
      const fbUser = await requireVerifiedCandidate(req, res, req.body?.candidateId);
      if (!fbUser) return;

      const courseId = sanitizeShortText(req.body?.courseId, 128);
      const candidateName =
        sanitizeShortText(req.body?.candidateName, 120) || fbUser.name || '';

      if (!courseId || !candidateName) {
        res.status(400).json({ error: 'courseId and candidateName are required.' });
        return;
      }

      const outcome = await issueVerifiedCertificate({
        userId: fbUser.uid,
        candidateName,
        courseId,
      });

      if ('error' in outcome) {
        res.status(outcome.statusCode).json({
          error: outcome.error,
          missingRequirements: outcome.missingRequirements,
        });
        return;
      }

      res.status(outcome.alreadyIssued ? 200 : 201).json({
        alreadyIssued: outcome.alreadyIssued,
        certificate: outcome.certificate,
      });
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // 6. List authenticated candidate's own certificates
  app.get('/api/learning/certificates/mine', async (req: Request, res: Response) => {
    try {
      const fbUser = await requireVerifiedCandidate(
        req,
        res,
        typeof req.query.candidateId === 'string' ? req.query.candidateId : undefined
      );
      if (!fbUser) return;

      const certificates = await listCandidateServerCertificates(fbUser.uid);
      res.json({ certificates });
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // 7. Public Certificate Verification Endpoint (strictly minimal non-PII response)
  app.get('/api/learning/certificates/verify/:certificateId', async (req: Request, res: Response) => {
    try {
      const certificateId = sanitizeShortText(req.params.certificateId, 64);
      if (!certificateId) {
        res.status(400).json({
          found: false,
          valid: false,
          status: 'not_found',
        });
        return;
      }

      const result = await verifyPublicCertificateById(certificateId);
      res.json(result);
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // --------------------------------------------------------------------------
  // ADMIN ASSESSMENT AUTH & MANAGEMENT APIs
  // --------------------------------------------------------------------------

  app.get('/api/learning/admin/assessments/auth-status', async (req: Request, res: Response) => {
    try {
      const authResult = await resolveAdminAuth(req);
      const envConfigured = Boolean((process.env.ADMIN_ASSESSMENT_PASSCODE || '').trim());
      res.json({
        authenticated: authResult.authorized,
        method: authResult.method || null,
        passcodeMode: envConfigured
          ? 'env'
          : claimedAdminPasscode
          ? 'claimed'
          : 'needs_setup',
      });
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  app.post('/api/learning/admin/assessments/auth/claim', async (req: Request, res: Response) => {
    try {
      const envConfigured = Boolean((process.env.ADMIN_ASSESSMENT_PASSCODE || '').trim());
      if (envConfigured || claimedAdminPasscode) {
        res.status(409).json({
          error: 'An administrator passcode is already configured. Please sign in instead.',
        });
        return;
      }

      // In production, never allow unauthenticated callers to claim the admin passcode
      if (process.env.NODE_ENV === 'production') {
        const authResult = await resolveAdminAuth(req);
        if (!authResult.authorized || authResult.method !== 'firebase') {
          res.status(403).json({
            error:
              'Unauthenticated admin passcode setup is disabled in production. Configure ADMIN_ASSESSMENT_PASSCODE in environment secrets or sign in with an authorized Firebase Admin account.',
            code: 'ADMIN_PASSCODE_CLAIM_RESTRICTED',
          });
          return;
        }
      }

      const passcode = sanitizeShortText(req.body?.passcode, 128);
      if (passcode.length < 8) {
        res.status(400).json({ error: 'Passcode must be at least 8 characters long.' });
        return;
      }

      const saltHex = crypto.randomBytes(16).toString('hex');
      const hashHex = hashPasscodeScrypt(passcode, saltHex);
      claimedAdminPasscode = {
        saltHex,
        hashHex,
        claimedAt: new Date().toISOString(),
      };

      const session = issueAdminSessionToken('admin_passcode_owner');
      res.json({
        authenticated: true,
        token: session.token,
        expiresAt: session.expiresAt,
      });
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // Honest persistence & signing configuration diagnostics — ADMIN ONLY
  app.get(
    '/api/learning/admin/persistence-status',
    requireAdmin,
    async (_req: Request, res: Response) => {
      try {
        const diagnostics = await getDurableStoreDiagnostics();
        res.json(diagnostics);
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  app.post('/api/learning/admin/assessments/auth/login', (req: Request, res: Response) => {
    try {
      const passcode = sanitizeShortText(req.body?.passcode, 128);
      if (!passcode) {
        res.status(400).json({ error: 'Please enter the administrator passcode.' });
        return;
      }

      if (!verifyPasscodeAgainstConfig(passcode)) {
        res.status(401).json({ error: 'Incorrect administrator passcode.' });
        return;
      }

      const session = issueAdminSessionToken('admin_passcode');
      res.json({
        authenticated: true,
        token: session.token,
        expiresAt: session.expiresAt,
      });
    } catch (err) {
      handleLearningRouteError(res, err);
    }
  });

  // Get full editable assessment configs (with correct answers & explanations) — ADMIN ONLY
  app.get(
    '/api/learning/admin/assessments/course/:courseId',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const courseId = sanitizeShortText(req.params.courseId, 128);
        if (!courseId) {
          res.status(400).json({ error: 'Invalid courseId.' });
          return;
        }
        const { moduleQuizzes, finalAssessment } = await getCourseAssessments(courseId);
        res.json({
          courseId,
          moduleQuizzes,
          finalAssessment,
        });
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  // Register or update course structural requirements in Supabase PostgreSQL — ADMIN ONLY
  app.post(
    '/api/learning/admin/courses/register',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const courseId = sanitizeShortText(req.body?.courseId, 128);
        const courseSlug = sanitizeShortText(req.body?.courseSlug, 128);
        const courseTitle = sanitizeShortText(req.body?.courseTitle, 160);
        const orderedModuleIds = Array.isArray(req.body?.orderedModuleIds)
          ? req.body.orderedModuleIds.filter((id: unknown): id is string => typeof id === 'string')
          : [];
        const requiredLessonIds = Array.isArray(req.body?.requiredLessonIds)
          ? req.body.requiredLessonIds.filter((id: unknown): id is string => typeof id === 'string')
          : [];
        const passPercentage =
          typeof req.body?.passPercentage === 'number' ? req.body.passPercentage : 70;
        const certificateTemplateId =
          sanitizeShortText(req.body?.certificateTemplateId, 128) || 'default_abhi_certificate';

        if (!courseId || !courseTitle) {
          res.status(400).json({ error: 'courseId and courseTitle are required.' });
          return;
        }

        const registered = await upsertRegisteredCourseDefinition({
          courseId,
          courseSlug: courseSlug || courseId,
          courseTitle,
          orderedModuleIds,
          requiredLessonIds,
          passPercentage,
          certificateTemplateId,
        });

        res.status(200).json({ courseDefinition: registered });
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  // Create or upsert a module quiz or final assessment configuration — ADMIN ONLY
  app.post(
    '/api/learning/admin/assessments/config',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const courseId = sanitizeShortText(req.body?.courseId, 128);
        const courseSlug = sanitizeShortText(req.body?.courseSlug, 128);
        const courseTitle = sanitizeShortText(req.body?.courseTitle, 160);
        const assessmentType: AssessmentType =
          req.body?.assessmentType === 'final_assessment' ? 'final_assessment' : 'module_quiz';
        const moduleId = sanitizeShortText(req.body?.moduleId, 128) || undefined;
        const title = sanitizeShortText(req.body?.title, 180);

        if (!courseId || !courseTitle || !title) {
          res.status(400).json({ error: 'courseId, courseTitle, and title are required.' });
          return;
        }
        if (assessmentType === 'module_quiz' && !moduleId) {
          res.status(400).json({ error: 'moduleId is required for a module quiz configuration.' });
          return;
        }

        const rawQuestions = Array.isArray(req.body?.questions) ? req.body.questions : undefined;
        if (rawQuestions) {
          const invalidQuestion = rawQuestions.some(
            (q: any) =>
              !q ||
              typeof q.prompt !== 'string' ||
              !q.prompt.trim() ||
              !Array.isArray(q.options) ||
              q.options.length !== 4 ||
              q.options.some((o: unknown) => typeof o !== 'string' || !o.trim()) ||
              typeof q.correctOptionIndex !== 'number' ||
              ![0, 1, 2, 3].includes(q.correctOptionIndex) ||
              typeof q.explanation !== 'string' ||
              !q.explanation.trim()
          );
          if (invalidQuestion) {
            res.status(400).json({
              error:
                'Every question must include a prompt, 4 non-empty options, a correctOptionIndex (0-3), and an explanation.',
            });
            return;
          }
        }

        const config = await upsertAssessmentConfig({
          courseId,
          courseSlug: courseSlug || courseId,
          courseTitle,
          assessmentType,
          moduleId,
          moduleOrder:
            typeof req.body?.moduleOrder === 'number' ? req.body.moduleOrder : undefined,
          title,
          description: sanitizeShortText(req.body?.description, 500),
          passPercentage:
            typeof req.body?.passPercentage === 'number' ? req.body.passPercentage : 70,
          questionCount:
            typeof req.body?.questionCount === 'number' ? req.body.questionCount : undefined,
          randomizeOrder:
            typeof req.body?.randomizeOrder === 'boolean' ? req.body.randomizeOrder : true,
          requiredForCompletion:
            typeof req.body?.requiredForCompletion === 'boolean'
              ? req.body.requiredForCompletion
              : true,
          questions: rawQuestions,
        });

        res.status(201).json({ config });
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  // Update assessment settings
  app.put(
    '/api/learning/admin/assessments/config',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const configId = sanitizeShortText(req.body?.configId, 128);
        if (!configId) {
          res.status(400).json({ error: 'configId is required.' });
          return;
        }

        const updated = await updateAssessmentConfigSettings(configId, {
          title: typeof req.body?.title === 'string' ? req.body.title : undefined,
          passPercentage:
            typeof req.body?.passPercentage === 'number' ? req.body.passPercentage : undefined,
          questionCount:
            typeof req.body?.questionCount === 'number' ? req.body.questionCount : undefined,
          randomizeOrder:
            typeof req.body?.randomizeOrder === 'boolean' ? req.body.randomizeOrder : undefined,
          requiredForCompletion:
            typeof req.body?.requiredForCompletion === 'boolean'
              ? req.body.requiredForCompletion
              : undefined,
        });

        if (!updated) {
          res.status(404).json({ error: 'Assessment configuration not found.' });
          return;
        }

        res.json({ config: updated });
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  // Create question
  app.post(
    '/api/learning/admin/assessments/question',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const configId = sanitizeShortText(req.body?.configId, 128);
        const prompt = sanitizeShortText(req.body?.prompt, 500);
        const explanation = sanitizeShortText(req.body?.explanation, 600);
        const options = req.body?.options;
        const correctOptionIndex = req.body?.correctOptionIndex;

        if (
          !configId ||
          !prompt ||
          !explanation ||
          !Array.isArray(options) ||
          options.length !== 4 ||
          options.some((o) => typeof o !== 'string' || !o.trim()) ||
          typeof correctOptionIndex !== 'number' ||
          ![0, 1, 2, 3].includes(correctOptionIndex)
        ) {
          res.status(400).json({
            error:
              'Please provide a question prompt, all 4 non-empty answer options, one correct answer (0-3), and an explanation.',
          });
          return;
        }

        const result = await addOrUpdateQuestion(configId, {
          prompt,
          options: [options[0], options[1], options[2], options[3]],
          correctOptionIndex: correctOptionIndex as 0 | 1 | 2 | 3,
          explanation,
        });

        if (!result) {
          res.status(404).json({ error: 'Assessment configuration not found.' });
          return;
        }

        res.status(201).json(result);
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  // Edit existing question
  app.put(
    '/api/learning/admin/assessments/question/:questionId',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const questionId = sanitizeShortText(req.params.questionId, 128);
        const configId = sanitizeShortText(req.body?.configId, 128);
        const prompt = sanitizeShortText(req.body?.prompt, 500);
        const explanation = sanitizeShortText(req.body?.explanation, 600);
        const options = req.body?.options;
        const correctOptionIndex = req.body?.correctOptionIndex;

        if (
          !questionId ||
          !configId ||
          !prompt ||
          !explanation ||
          !Array.isArray(options) ||
          options.length !== 4 ||
          options.some((o) => typeof o !== 'string' || !o.trim()) ||
          typeof correctOptionIndex !== 'number' ||
          ![0, 1, 2, 3].includes(correctOptionIndex)
        ) {
          res.status(400).json({
            error:
              'Please provide a question prompt, all 4 non-empty answer options, one correct answer (0-3), and an explanation.',
          });
          return;
        }

        const result = await addOrUpdateQuestion(configId, {
          id: questionId,
          prompt,
          options: [options[0], options[1], options[2], options[3]],
          correctOptionIndex: correctOptionIndex as 0 | 1 | 2 | 3,
          explanation,
        });

        if (!result) {
          res.status(404).json({ error: 'Assessment configuration not found.' });
          return;
        }

        res.json(result);
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  // Delete question
  app.delete(
    '/api/learning/admin/assessments/question/:questionId',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const questionId = sanitizeShortText(req.params.questionId, 128);
        const configId = sanitizeShortText(req.query.configId, 128);

        if (!questionId || !configId) {
          res.status(400).json({ error: 'questionId and configId query parameter are required.' });
          return;
        }

        const updated = await removeQuestion(configId, questionId);
        if (!updated) {
          res.status(400).json({
            error: 'Could not delete question. Each assessment must retain at least 1 question.',
          });
          return;
        }

        res.json({ config: updated });
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  // List assessment attempts — ADMIN ONLY
  app.get(
    '/api/learning/admin/assessments/attempts',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const courseId = sanitizeShortText(req.query.courseId, 128) || 'all';
        const assessmentType = sanitizeShortText(req.query.assessmentType, 64) || 'all';
        const attempts = await listAllServerAttempts({ courseId, assessmentType });
        res.json({ attempts });
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  // Delete / reset an attempt — ADMIN ONLY
  app.delete(
    '/api/learning/admin/assessments/attempts/:attemptId',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const attemptId = sanitizeShortText(req.params.attemptId, 128);
        if (!attemptId) {
          res.status(400).json({ error: 'Invalid attemptId.' });
          return;
        }
        const deleted = await deleteServerAttemptById(attemptId);
        if (!deleted) {
          res.status(404).json({ error: 'Attempt record not found.' });
          return;
        }
        res.json({ deleted: true, attemptId });
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  // Reset all Learn with ABHI course tables in Supabase PostgreSQL — ADMIN ONLY
  // NEVER touches existing recruitment tables, Firebase Auth, or Career Readiness Assessments.
  app.post(
    '/api/learning/admin/reset-course-data',
    requireAdmin,
    async (_req: Request, res: Response) => {
      try {
        const resetSummary = await resetAllLearningTables();
        res.json({
          reset: true,
          ...resetSummary,
          clearedActiveSessions: resetSummary.clearedSessions,
        });
      } catch (err) {
        handleLearningRouteError(res, err);
      }
    }
  );

  // --------------------------------------------------------------------------
  // VITE MIDDLEWARE (DEV) OR STATIC DIST SERVING (PROD)
  // --------------------------------------------------------------------------

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ABHI JOBS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ABHI JOBS server:', err);
  process.exit(1);
});
