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
  deleteServerAttemptById,
  getAssessmentConfig,
  getAssessmentConfigById,
  getCandidateAttemptCount,
  getCourseAssessments,
  listAllServerAttempts,
  recordServerAttempt,
  removeQuestion,
  updateAssessmentConfigSettings,
} from './server/quizBank';

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
// ADMIN PASSCODE AUTH (ENV OR FIRST-RUN SCRYPT CLAIM + IN-MEMORY HMAC TOKEN)
// ============================================================================

const SESSION_HMAC_SECRET =
  process.env.ADMIN_ASSESSMENT_SESSION_SECRET || crypto.randomBytes(32).toString('hex');

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
  const exp = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', sub: subject, exp }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_HMAC_SECRET)
    .update(payload)
    .digest('base64url');
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
    const expectedSig = crypto
      .createHmac('sha256', SESSION_HMAC_SECRET)
      .update(payload)
      .digest('base64url');

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

  // 1. Check in-memory HMAC admin session token
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

// ============================================================================
// SERVER-SIDE ASSESSMENT SESSIONS (ZERO ANSWER LEAKAGE + BACKEND GRADING)
// ============================================================================

interface ActiveAssessmentSession {
  sessionId: string;
  configId: string;
  courseId: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  userId: string;
  firebaseUid?: string;
  candidateName: string;
  candidateEmail: string;
  servedQuestionIds: string[];
  createdAt: number;
  submitted: boolean;
}

const activeSessions = new Map<string, ActiveAssessmentSession>();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function pruneExpiredSessions(): void {
  const now = Date.now();
  for (const [id, sess] of activeSessions.entries()) {
    if (now - sess.createdAt > SESSION_TTL_MS) {
      activeSessions.delete(id);
    }
  }
}

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

// ============================================================================
// EXPRESS APP + API ROUTES
// ============================================================================

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // --------------------------------------------------------------------------
  // CANDIDATE ASSESSMENT APIs (Public metadata / Auth-aware Start & Submit)
  // --------------------------------------------------------------------------

  // 1. Course assessments summary (NO questions, NO correctOptionIndex, NO explanations)
  app.get('/api/learning/assessments/course/:courseId/summary', (req: Request, res: Response) => {
    const courseId = sanitizeShortText(req.params.courseId, 128);
    if (!courseId) {
      res.status(400).json({ error: 'Invalid courseId.' });
      return;
    }

    const { moduleQuizzes, finalAssessment } = getCourseAssessments(courseId);
    res.json({
      courseId,
      moduleQuizzes: moduleQuizzes.map(sanitizeConfigSummary),
      finalAssessment: finalAssessment ? sanitizeConfigSummary(finalAssessment) : null,
    });
  });

  // 2. Start a quiz or final assessment session — returns ONLY prompts & 4 options
  app.post('/api/learning/assessments/start', async (req: Request, res: Response) => {
    pruneExpiredSessions();

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

    const config = getAssessmentConfig(courseId, assessmentType, moduleId);
    if (!config || config.questions.length === 0) {
      res.status(404).json({ error: 'Assessment not found for this course or module.' });
      return;
    }

    // Check optional Firebase Bearer token to bind session strictly to verified UID when signed in
    const bearer = extractBearerToken(req);
    const fbUser = bearer && !bearer.startsWith('adm.') ? await verifyFirebaseIdToken(bearer) : null;

    const candidateId =
      fbUser?.uid || sanitizeShortText(req.body?.candidateId, 128);
    if (!candidateId) {
      res.status(401).json({ error: 'Please sign in to start this assessment.' });
      return;
    }

    const candidateName =
      fbUser?.name || sanitizeShortText(req.body?.candidateName, 120) || 'ABHI JOBS Candidate';
    const candidateEmail =
      fbUser?.email || sanitizeShortText(req.body?.candidateEmail, 160) || '';

    const countToServe = Math.max(1, Math.min(config.questionCount, config.questions.length));
    const orderedPool = config.randomizeOrder
      ? shuffleArray(config.questions)
      : [...config.questions];
    const selectedQuestions = orderedPool.slice(0, countToServe);

    const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
    activeSessions.set(sessionId, {
      sessionId,
      configId: config.id,
      courseId: config.courseId,
      assessmentType: config.assessmentType,
      moduleId: config.moduleId,
      userId: candidateId,
      firebaseUid: fbUser?.uid,
      candidateName,
      candidateEmail,
      servedQuestionIds: selectedQuestions.map((q) => q.id),
      createdAt: Date.now(),
      submitted: false,
    });

    const previousAttempts = getCandidateAttemptCount(
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
  });

  // 3. Submit candidate answers — validated and graded strictly on the backend
  app.post('/api/learning/assessments/submit', async (req: Request, res: Response) => {
    pruneExpiredSessions();

    const sessionId = sanitizeShortText(req.body?.sessionId, 128);
    const rawAnswers = req.body?.answers;

    if (!sessionId || !rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
      res.status(400).json({ error: 'sessionId and answers map are required.' });
      return;
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
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

    // If session was created by a Firebase-authenticated user, verify caller matches that exact UID
    if (session.firebaseUid) {
      const bearer = extractBearerToken(req);
      const fbUser = bearer && !bearer.startsWith('adm.') ? await verifyFirebaseIdToken(bearer) : null;
      if (!fbUser || fbUser.uid !== session.firebaseUid) {
        res.status(403).json({
          error: 'Authentication mismatch. You may only submit your own assessment session.',
        });
        return;
      }
    }

    const config = getAssessmentConfigById(session.configId);
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

    // Mark session consumed so it cannot be re-graded
    session.submitted = true;
    activeSessions.delete(sessionId);

    const totalQuestions = servedQuestions.length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);
    const passPercentage = config.passPercentage;
    const passed = scorePercent >= passPercentage;

    const priorCount = getCandidateAttemptCount(
      session.userId,
      session.courseId,
      session.assessmentType,
      session.moduleId
    );
    const attemptNumber = priorCount + 1;
    const submittedAt = new Date().toISOString();
    const attemptId = `att_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;

    recordServerAttempt({
      id: attemptId,
      userId: session.userId,
      candidateName: session.candidateName,
      candidateEmail: session.candidateEmail,
      courseId: session.courseId,
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

    res.json({
      id: attemptId,
      userId: session.userId,
      courseId: session.courseId,
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
      questionResults,
    });
  });

  // --------------------------------------------------------------------------
  // ADMIN ASSESSMENT AUTH & MANAGEMENT APIs
  // --------------------------------------------------------------------------

  app.get('/api/learning/admin/assessments/auth-status', async (req: Request, res: Response) => {
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
  });

  app.post('/api/learning/admin/assessments/auth/claim', (req: Request, res: Response) => {
    const envConfigured = Boolean((process.env.ADMIN_ASSESSMENT_PASSCODE || '').trim());
    if (envConfigured || claimedAdminPasscode) {
      res.status(409).json({
        error: 'An administrator passcode is already configured. Please sign in instead.',
      });
      return;
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
  });

  app.post('/api/learning/admin/assessments/auth/login', (req: Request, res: Response) => {
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
  });

  // Get full editable assessment configs (with correct answers & explanations) — ADMIN ONLY
  app.get(
    '/api/learning/admin/assessments/course/:courseId',
    requireAdmin,
    (req: Request, res: Response) => {
      const courseId = sanitizeShortText(req.params.courseId, 128);
      if (!courseId) {
        res.status(400).json({ error: 'Invalid courseId.' });
        return;
      }
      const { moduleQuizzes, finalAssessment } = getCourseAssessments(courseId);
      res.json({
        courseId,
        moduleQuizzes,
        finalAssessment,
      });
    }
  );

  // Update assessment settings (passPercentage, questionCount, randomizeOrder, requiredForCompletion, title)
  app.put(
    '/api/learning/admin/assessments/config',
    requireAdmin,
    (req: Request, res: Response) => {
      const configId = sanitizeShortText(req.body?.configId, 128);
      if (!configId) {
        res.status(400).json({ error: 'configId is required.' });
        return;
      }

      const updated = updateAssessmentConfigSettings(configId, {
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
    }
  );

  // Create question
  app.post(
    '/api/learning/admin/assessments/question',
    requireAdmin,
    (req: Request, res: Response) => {
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

      const result = addOrUpdateQuestion(configId, {
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
    }
  );

  // Edit existing question
  app.put(
    '/api/learning/admin/assessments/question/:questionId',
    requireAdmin,
    (req: Request, res: Response) => {
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

      const result = addOrUpdateQuestion(configId, {
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
    }
  );

  // Delete question
  app.delete(
    '/api/learning/admin/assessments/question/:questionId',
    requireAdmin,
    (req: Request, res: Response) => {
      const questionId = sanitizeShortText(req.params.questionId, 128);
      const configId = sanitizeShortText(req.query.configId, 128);

      if (!questionId || !configId) {
        res.status(400).json({ error: 'questionId and configId query parameter are required.' });
        return;
      }

      const updated = removeQuestion(configId, questionId);
      if (!updated) {
        res.status(400).json({
          error: 'Could not delete question. Each assessment must retain at least 1 question.',
        });
        return;
      }

      res.json({ config: updated });
    }
  );

  // List assessment attempts — ADMIN ONLY
  app.get(
    '/api/learning/admin/assessments/attempts',
    requireAdmin,
    (req: Request, res: Response) => {
      const courseId = sanitizeShortText(req.query.courseId, 128) || 'all';
      const assessmentType = sanitizeShortText(req.query.assessmentType, 64) || 'all';
      const attempts = listAllServerAttempts({ courseId, assessmentType });
      res.json({ attempts });
    }
  );

  // Delete / reset an attempt — ADMIN ONLY
  app.delete(
    '/api/learning/admin/assessments/attempts/:attemptId',
    requireAdmin,
    (req: Request, res: Response) => {
      const attemptId = sanitizeShortText(req.params.attemptId, 128);
      if (!attemptId) {
        res.status(400).json({ error: 'Invalid attemptId.' });
        return;
      }
      const deleted = deleteServerAttemptById(attemptId);
      if (!deleted) {
        res.status(404).json({ error: 'Attempt record not found.' });
        return;
      }
      res.json({ deleted: true, attemptId });
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
