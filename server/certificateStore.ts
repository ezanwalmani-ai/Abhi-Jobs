/**
 * SERVER-ONLY Learn with ABHI Course Completion Certificate Engine.
 *
 * SECURITY & PERSISTENCE BOUNDARY:
 * - Backed by durable disk persistence (`server/learningStore.ts`) so lesson
 *   progress receipts and issued certificates survive server restarts.
 * - Enforces all 3 completion rules on the backend before issuing any certificate:
 *   1. All required lessons in the course completed.
 *   2. All required module quizzes passed (verified against HMAC-signed backend attempts).
 *   3. Final course assessment passed with score >= 70% (verified against HMAC-signed backend attempts).
 * - Structurally prevents duplicate certificates for the same (userId, courseId).
 * - Public verification strictly exposes ONLY candidateName, courseTitle, certificateId,
 *   issueDate, and validity status — zero email, phone, profile data, or assessment answers —
 *   and re-verifies the HMAC integrity signature on every lookup.
 */

import crypto from 'node:crypto';
import { flattenCourseLessons, getCourseById } from '../src/data/learningCatalog';
import {
  CertificateValidityStatus,
  PersistedCertificateRecord,
  getRegisteredCourseDefinition,
  loadDurableLearningStore,
  persistDurableLearningStore,
  signCertificateReceipt,
  verifyAssessmentAttemptReceipt,
  verifyCertificateReceipt,
} from './learningStore';
import { getCourseAssessments, listAllServerAttempts } from './quizBank';

export type { CertificateValidityStatus };
export type ServerCourseCertificate = PersistedCertificateRecord;

export interface PublicCertificateProjection {
  certificateId: string;
  candidateName: string;
  courseTitle: string;
  issueDate: string;
  status: CertificateValidityStatus;
}

// Unambiguous uppercase alphanumeric alphabet (excludes 0, O, 1, I, L)
const CERT_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function makeUserCourseKey(userId: string, courseId: string): string {
  return `${userId}::${courseId}`;
}

function findCertificateByIdInStore(certId: string): ServerCourseCertificate | undefined {
  const store = loadDurableLearningStore();
  return Object.values(store.certificatesByUserCourse).find(
    (c) => c.certificateId === certId
  );
}

function generateUniqueCertificateId(year: number): string {
  for (let attempt = 0; attempt < 25; attempt++) {
    const bytes = crypto.randomBytes(8);
    let suffix = '';
    for (let i = 0; i < 8; i++) {
      suffix += CERT_CODE_ALPHABET[bytes[i] % CERT_CODE_ALPHABET.length];
    }
    const candidate = `ABHI-${year}-${suffix}`;
    if (!findCertificateByIdInStore(candidate)) {
      return candidate;
    }
  }
  return `ABHI-${year}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function resolveCourseRequirements(courseId: string): {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  requiredLessonIds: string[];
  passPercentage: number;
  templateId: string;
} | null {
  const registered = getRegisteredCourseDefinition(courseId);
  if (registered) {
    return {
      courseId: registered.courseId,
      courseSlug: registered.courseSlug,
      courseTitle: registered.courseTitle,
      requiredLessonIds: registered.requiredLessonIds,
      passPercentage: registered.passPercentage,
      templateId: registered.certificateTemplateId || 'default_abhi_certificate',
    };
  }

  const catalogCourse = getCourseById(courseId);
  if (catalogCourse) {
    return {
      courseId: catalogCourse.id,
      courseSlug: catalogCourse.slug,
      courseTitle: catalogCourse.title,
      requiredLessonIds: flattenCourseLessons(catalogCourse).map((item) => item.lesson.id),
      passPercentage: catalogCourse.passPercentage || 70,
      templateId: catalogCourse.certificateTemplateId || 'default_abhi_certificate',
    };
  }

  return null;
}

export function recordServerLessonProgress(
  userId: string,
  courseId: string,
  completedLessonIds: string[]
): { completedCount: number; requiredCount: number } {
  const store = loadDurableLearningStore();
  const courseReq = resolveCourseRequirements(courseId);
  const validLessonIds = new Set(courseReq ? courseReq.requiredLessonIds : []);

  const key = makeUserCourseKey(userId, courseId);
  const existing = new Set<string>(store.lessonProgress[key] || []);
  const next = new Set<string>();

  for (const id of completedLessonIds) {
    if (typeof id === 'string' && id.trim().length > 0) {
      const clean = id.trim().slice(0, 128);
      if (validLessonIds.size === 0 || validLessonIds.has(clean)) {
        next.add(clean);
      }
    }
  }

  const finalSet = next.size > 0 || existing.size === 0 ? next : existing;
  store.lessonProgress[key] = Array.from(finalSet).slice(0, 200);
  persistDurableLearningStore(store);

  return {
    completedCount: store.lessonProgress[key].length,
    requiredCount: validLessonIds.size,
  };
}

export interface IssueCertificateInput {
  userId: string;
  candidateName: string;
  courseId: string;
  completedLessonIds?: string[];
}

export type IssueCertificateOutcome =
  | {
      ok: true;
      alreadyIssued: boolean;
      certificate: ServerCourseCertificate;
    }
  | {
      ok: false;
      statusCode: number;
      error: string;
      missingRequirements?: {
        lessonsCompleted: number;
        lessonsRequired: number;
        quizzesPassed: number;
        quizzesRequired: number;
        finalAssessmentPassed: boolean;
        bestFinalScorePercent: number | null;
      };
    };

/**
 * Authoritatively verifies all 3 certificate eligibility conditions on the backend
 * and issues a unique, immutable Course Completion Certificate (or returns the existing one).
 */
export function issueVerifiedCertificate(input: IssueCertificateInput): IssueCertificateOutcome {
  const userId = input.userId.trim().slice(0, 128);
  const courseId = input.courseId.trim().slice(0, 128);
  const candidateName = input.candidateName.trim().slice(0, 120);

  if (!userId || !courseId || !candidateName) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Authenticated candidate identity, full name, and courseId are required.',
    };
  }

  const courseReq = resolveCourseRequirements(courseId);
  if (!courseReq) {
    return {
      ok: false,
      statusCode: 404,
      error: 'Course not found in Learn with ABHI catalogue.',
    };
  }

  const store = loadDurableLearningStore();

  // Prevent duplicate certificates for the same candidate & course
  const pairKey = makeUserCourseKey(userId, courseId);
  const existingCert = store.certificatesByUserCourse[pairKey];
  if (existingCert) {
    return {
      ok: true,
      alreadyIssued: true,
      certificate: existingCert,
    };
  }

  // 1. Validate all required lessons completed
  const requiredLessonIds = courseReq.requiredLessonIds;
  const requiredLessonSet = new Set(requiredLessonIds);

  if (Array.isArray(input.completedLessonIds) && input.completedLessonIds.length > 0) {
    recordServerLessonProgress(userId, courseId, input.completedLessonIds);
  }

  const syncedLessons = new Set<string>(loadDurableLearningStore().lessonProgress[pairKey] || []);
  const completedRequiredLessons = Array.from(syncedLessons).filter((id) =>
    requiredLessonSet.has(id)
  );
  const allLessonsCompleted =
    requiredLessonIds.length > 0 &&
    completedRequiredLessons.length >= requiredLessonIds.length;

  // 2. Validate all required module quizzes passed on backend (with valid HMAC signatures)
  const { moduleQuizzes, finalAssessment } = getCourseAssessments(courseId);
  const requiredQuizModuleIds = moduleQuizzes
    .filter((q) => q.requiredForCompletion && q.moduleId)
    .map((q) => q.moduleId as string);

  const verifiedCourseAttempts = listAllServerAttempts({ courseId, userId }).filter((att) =>
    verifyAssessmentAttemptReceipt({
      attemptId: att.id,
      userId: att.userId,
      courseId: att.courseId,
      assessmentType: att.assessmentType,
      moduleId: att.moduleId,
      scorePercent: att.scorePercent,
      passPercentage: att.passPercentage,
      passed: att.passed,
      submittedAt: att.submittedAt,
      verificationSignature: att.verificationSignature,
    })
  );

  const passedQuizModuleIdSet = new Set<string>();
  for (const att of verifiedCourseAttempts) {
    if (att.assessmentType === 'module_quiz' && att.passed && att.moduleId) {
      passedQuizModuleIdSet.add(att.moduleId);
    }
  }

  const passedRequiredQuizzes = requiredQuizModuleIds.filter((modId) =>
    passedQuizModuleIdSet.has(modId)
  );
  const allRequiredQuizzesPassed =
    passedRequiredQuizzes.length >= requiredQuizModuleIds.length;

  // 3. Validate Final Course Assessment passed on backend with >= 70% (and >= config passPercentage)
  const requiredFinalPassMark = Math.max(
    70,
    courseReq.passPercentage,
    finalAssessment?.passPercentage ?? 70
  );
  const finalAttempts = verifiedCourseAttempts.filter(
    (att) => att.assessmentType === 'final_assessment'
  );

  let bestFinalAttempt: (typeof finalAttempts)[number] | null = null;
  for (const att of finalAttempts) {
    if (!bestFinalAttempt || att.scorePercent > bestFinalAttempt.scorePercent) {
      bestFinalAttempt = att;
    }
  }

  const bestFinalScore = bestFinalAttempt ? bestFinalAttempt.scorePercent : null;
  const finalPassed =
    bestFinalAttempt !== null &&
    bestFinalAttempt.passed &&
    bestFinalAttempt.scorePercent >= requiredFinalPassMark &&
    bestFinalAttempt.scorePercent >= 70;

  if (
    !allLessonsCompleted ||
    !allRequiredQuizzesPassed ||
    !finalPassed ||
    bestFinalScore === null ||
    !bestFinalAttempt
  ) {
    return {
      ok: false,
      statusCode: 403,
      error:
        'Certificate cannot be issued until all required lessons, required module quizzes, and the Final Course Assessment (minimum 70%) are completed.',
      missingRequirements: {
        lessonsCompleted: completedRequiredLessons.length,
        lessonsRequired: requiredLessonIds.length,
        quizzesPassed: passedRequiredQuizzes.length,
        quizzesRequired: requiredQuizModuleIds.length,
        finalAssessmentPassed: finalPassed,
        bestFinalScorePercent: bestFinalScore,
      },
    };
  }

  // All 3 backend requirements verified — generate unique immutable certificate
  const now = new Date();
  const completionDate = now.toISOString();
  const certificateId = generateUniqueCertificateId(now.getUTCFullYear());
  const verificationSignature = signCertificateReceipt({
    certificateId,
    userId,
    courseId,
    finalAttemptId: bestFinalAttempt.id,
    finalAssessmentScore: bestFinalScore,
    completionDate,
  });

  const issuedCert: ServerCourseCertificate = {
    certificateId,
    userId,
    candidateName,
    courseId: courseReq.courseId,
    courseSlug: courseReq.courseSlug,
    courseTitle: courseReq.courseTitle,
    completionDate,
    issuedAt: completionDate,
    finalAssessmentScore: bestFinalScore,
    status: 'valid',
    verificationSignature,
    finalAttemptId: bestFinalAttempt.id,
    templateId: courseReq.templateId,
  };

  const latestStore = loadDurableLearningStore();
  latestStore.certificatesByUserCourse[pairKey] = issuedCert;
  persistDurableLearningStore(latestStore);

  return {
    ok: true,
    alreadyIssued: false,
    certificate: issuedCert,
  };
}

export function listCandidateServerCertificates(userId: string): ServerCourseCertificate[] {
  const cleanUid = userId.trim();
  if (!cleanUid) return [];
  const store = loadDurableLearningStore();
  return Object.values(store.certificatesByUserCourse)
    .filter((cert) => cert.userId === cleanUid)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
}

/**
 * Public verification lookup — verifies HMAC integrity signature and strictly returns
 * ONLY non-PII public verification fields.
 */
export function verifyPublicCertificateById(rawCertificateId: string): {
  found: boolean;
  valid: boolean;
  status: 'valid' | 'revoked' | 'not_found';
  certificate?: PublicCertificateProjection;
} {
  const normalized = rawCertificateId.trim().toUpperCase();
  if (!/^[A-Z0-9-]{8,64}$/.test(normalized)) {
    return { found: false, valid: false, status: 'not_found' };
  }

  const cert = findCertificateByIdInStore(normalized);
  if (!cert) {
    return { found: false, valid: false, status: 'not_found' };
  }

  const signatureValid = verifyCertificateReceipt({
    certificateId: cert.certificateId,
    userId: cert.userId,
    courseId: cert.courseId,
    finalAttemptId: cert.finalAttemptId || '',
    finalAssessmentScore: cert.finalAssessmentScore,
    completionDate: cert.completionDate,
    verificationSignature: cert.verificationSignature,
  });

  const effectiveStatus: CertificateValidityStatus =
    signatureValid && cert.status === 'valid' ? 'valid' : 'revoked';

  return {
    found: true,
    valid: effectiveStatus === 'valid',
    status: effectiveStatus,
    certificate: {
      certificateId: cert.certificateId,
      candidateName: cert.candidateName,
      courseTitle: cert.courseTitle,
      issueDate: cert.completionDate,
      status: effectiveStatus,
    },
  };
}

/**
 * Safely clears all course-specific lesson progress, course definitions, and issued certificates
 * from the durable server store.
 */
export function resetAllServerCertificatesAndProgress(): {
  clearedProgressEntries: number;
  clearedCertificates: number;
  clearedCourseDefinitions: number;
} {
  const store = loadDurableLearningStore();
  const clearedProgressEntries = Object.keys(store.lessonProgress).length;
  const clearedCertificates = Object.keys(store.certificatesByUserCourse).length;
  const clearedCourseDefinitions = Object.keys(store.courseDefinitions).length;
  store.lessonProgress = {};
  store.certificatesByUserCourse = {};
  store.courseDefinitions = {};
  persistDurableLearningStore(store);
  return { clearedProgressEntries, clearedCertificates, clearedCourseDefinitions };
}
