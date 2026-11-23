/**
 * SERVER-ONLY Supabase PostgreSQL Storage Adapter for Learn with ABHI.
 *
 * SECURITY BOUNDARY:
 * - NEVER import this file in client-side `src/` code.
 * - Uses `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
 *   strictly from server `process.env`.
 * - Operates exclusively on isolated `public.learning_*` tables keyed by verified
 *   Firebase UID (`firebase_uid`) and NEVER reads or modifies existing recruitment
 *   tables (`users`, `candidates`, `employers`, `jobs`, `applications`, `resumes`).
 * - Fails closed (`LEARNING_STORAGE_NOT_CONFIGURED`) if Supabase server credentials
 *   are not configured; NEVER silently degrades to ephemeral in-memory storage.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  AssessmentType,
  CertificateValidityStatus,
  LearningStoreDiagnostics,
  LearningStoreRepository,
  PersistedAssessmentConfig,
  PersistedAssessmentSession,
  PersistedAttemptRecord,
  PersistedCertificateRecord,
  PersistedCourseDefinition,
  PersistedModuleUnlockRecord,
  PersistedQuizQuestion,
} from './learningStore';
import { isSigningSecretConfigured } from './learningStore';

const TABLES = {
  users: 'learning_users',
  courses: 'learning_courses',
  modules: 'learning_modules',
  lessons: 'learning_lessons',
  assessments: 'learning_assessments',
  sessions: 'learning_assessment_sessions',
  lessonProgress: 'learning_lesson_progress',
  quizAttempts: 'learning_quiz_attempts',
  finalAttempts: 'learning_final_assessment_attempts',
  moduleUnlocks: 'learning_module_unlocks',
  certificates: 'learning_certificates',
} as const;

export function isSupabaseLearningConfigured(): boolean {
  const url = (process.env.SUPABASE_URL || '').trim();
  const secretKey =
    (process.env.SUPABASE_SECRET_KEY || '').trim() ||
    (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return Boolean(url && secretKey);
}

function getSupabaseAdminClient(): SupabaseClient {
  const url = (process.env.SUPABASE_URL || '').trim();
  const secretKey =
    (process.env.SUPABASE_SECRET_KEY || '').trim() ||
    (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !secretKey) {
    throw new Error(
      'LEARNING_STORAGE_NOT_CONFIGURED: Set SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in server environment variables.'
    );
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function throwStorageError(operation: string, error: { message?: string; code?: string }): never {
  const code = error.code || 'STORAGE_ERROR';
  const msg = error.message || 'Unknown database error';
  throw new Error(`LEARNING_STORAGE_ERROR (${operation} [${code}]): ${msg}`);
}

function mapCourseRow(row: any): PersistedCourseDefinition {
  return {
    courseId: String(row.course_id),
    courseSlug: String(row.course_slug),
    courseTitle: String(row.course_title),
    orderedModuleIds: Array.isArray(row.ordered_module_ids) ? row.ordered_module_ids : [],
    requiredLessonIds: Array.isArray(row.required_lesson_ids) ? row.required_lesson_ids : [],
    passPercentage: Number(row.pass_percentage ?? 70),
    certificateTemplateId: String(row.certificate_template_id || 'default_abhi_certificate'),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function mapAssessmentRow(row: any): PersistedAssessmentConfig {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    courseSlug: String(row.course_slug || row.course_id),
    courseTitle: String(row.course_title),
    assessmentType: row.assessment_type === 'final_assessment' ? 'final_assessment' : 'module_quiz',
    moduleId: row.module_id ? String(row.module_id) : undefined,
    moduleOrder: typeof row.module_order === 'number' ? row.module_order : undefined,
    title: String(row.title),
    description: String(row.description || ''),
    passPercentage: Number(row.pass_percentage ?? 70),
    questionCount: Number(row.question_count ?? 1),
    randomizeOrder: Boolean(row.randomize_order),
    requiredForCompletion: Boolean(row.required_for_completion),
    questions: Array.isArray(row.questions) ? (row.questions as PersistedQuizQuestion[]) : [],
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function mapSessionRow(row: any): PersistedAssessmentSession {
  return {
    sessionId: String(row.session_id),
    configId: String(row.config_id),
    courseId: String(row.course_id),
    assessmentType: row.assessment_type === 'final_assessment' ? 'final_assessment' : 'module_quiz',
    moduleId: row.module_id ? String(row.module_id) : undefined,
    userId: String(row.firebase_uid),
    candidateName: String(row.candidate_name),
    candidateEmail: String(row.candidate_email || ''),
    servedQuestionIds: Array.isArray(row.served_question_ids) ? row.served_question_ids : [],
    createdAt: String(row.created_at),
    expiresAt: String(row.expires_at),
    submitted: Boolean(row.submitted),
  };
}

function mapQuizAttemptRow(row: any): PersistedAttemptRecord {
  return {
    id: String(row.id),
    userId: String(row.firebase_uid),
    candidateName: String(row.candidate_name),
    candidateEmail: String(row.candidate_email || ''),
    courseId: String(row.course_id),
    courseSlug: String(row.course_slug || row.course_id),
    courseTitle: String(row.course_title),
    assessmentType: 'module_quiz',
    moduleId: String(row.module_id),
    assessmentTitle: String(row.assessment_title),
    attemptNumber: Number(row.attempt_number),
    totalQuestions: Number(row.total_questions),
    correctAnswers: Number(row.correct_answers),
    incorrectAnswers: Number(row.incorrect_answers),
    scorePercent: Number(row.score_percent),
    passPercentage: Number(row.pass_percentage),
    passed: Boolean(row.passed),
    submittedAt: String(row.submitted_at),
    verificationSignature: String(row.verification_signature),
  };
}

function mapFinalAttemptRow(row: any): PersistedAttemptRecord {
  return {
    id: String(row.id),
    userId: String(row.firebase_uid),
    candidateName: String(row.candidate_name),
    candidateEmail: String(row.candidate_email || ''),
    courseId: String(row.course_id),
    courseSlug: String(row.course_slug || row.course_id),
    courseTitle: String(row.course_title),
    assessmentType: 'final_assessment',
    moduleId: undefined,
    assessmentTitle: String(row.assessment_title),
    attemptNumber: Number(row.attempt_number),
    totalQuestions: Number(row.total_questions),
    correctAnswers: Number(row.correct_answers),
    incorrectAnswers: Number(row.incorrect_answers),
    scorePercent: Number(row.score_percent),
    passPercentage: Number(row.pass_percentage),
    passed: Boolean(row.passed),
    submittedAt: String(row.submitted_at),
    verificationSignature: String(row.verification_signature),
  };
}

function mapModuleUnlockRow(row: any): PersistedModuleUnlockRecord {
  return {
    userId: String(row.firebase_uid),
    courseId: String(row.course_id),
    passedModuleQuizIds: Array.isArray(row.passed_module_quiz_ids) ? row.passed_module_quiz_ids : [],
    unlockedModuleOrder: Number(row.unlocked_module_order ?? 1),
    finalAssessmentPassed: Boolean(row.final_assessment_passed),
    bestFinalScorePercent:
      typeof row.best_final_score_percent === 'number' ? row.best_final_score_percent : null,
    lastVerifiedAttemptId: row.last_verified_attempt_id
      ? String(row.last_verified_attempt_id)
      : null,
    lastVerifiedFinalAttemptId: row.last_verified_final_attempt_id
      ? String(row.last_verified_final_attempt_id)
      : null,
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function mapCertificateRow(row: any): PersistedCertificateRecord {
  const status: CertificateValidityStatus = row.status === 'revoked' ? 'revoked' : 'valid';
  return {
    certificateId: String(row.certificate_id),
    userId: String(row.firebase_uid),
    candidateName: String(row.candidate_name),
    courseId: String(row.course_id),
    courseSlug: String(row.course_slug || row.course_id),
    courseTitle: String(row.course_title),
    completionDate: String(row.completion_date),
    issuedAt: String(row.issued_at || row.completion_date),
    finalAssessmentScore: Number(row.final_assessment_score),
    status,
    verificationSignature: String(row.verification_signature),
    finalAttemptId: String(row.final_attempt_id),
    templateId: String(row.template_id || 'default_abhi_certificate'),
  };
}

export class SupabaseLearningStoreRepository implements LearningStoreRepository {
  readonly backendName = 'supabase_postgresql';
  readonly isProductionDurable = true;

  private clientCache: SupabaseClient | null = null;
  private cachedUrl = '';
  private cachedKey = '';

  private client(): SupabaseClient {
    const url = (process.env.SUPABASE_URL || '').trim();
    const key =
      (process.env.SUPABASE_SECRET_KEY || '').trim() ||
      (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!this.clientCache || this.cachedUrl !== url || this.cachedKey !== key) {
      this.clientCache = getSupabaseAdminClient();
      this.cachedUrl = url;
      this.cachedKey = key;
    }
    return this.clientCache;
  }

  /**
   * Ensures the verified Firebase UID exists in `public.learning_users` before
   * inserting child rows referencing `learning_users(firebase_uid)`.
   */
  private async ensureLearningUser(
    firebaseUid: string,
    fullName?: string,
    email?: string
  ): Promise<void> {
    const payload: Record<string, unknown> = {
      firebase_uid: firebaseUid,
      updated_at: new Date().toISOString(),
    };
    if (fullName && fullName.trim()) payload.full_name = fullName.trim().slice(0, 120);
    if (email && email.trim()) payload.email = email.trim().slice(0, 150);

    const { error } = await this.client()
      .from(TABLES.users)
      .upsert(payload, { onConflict: 'firebase_uid' });
    if (error) throwStorageError('ensureLearningUser', error);
  }

  /**
   * Ensures the parent `public.learning_courses` row exists before inserting
   * child assessment/progress rows referencing `learning_courses(course_id)`.
   */
  private async ensureCourseExists(
    courseId: string,
    courseSlug?: string,
    courseTitle?: string
  ): Promise<void> {
    const existing = await this.getCourseDefinition(courseId);
    if (existing) return;
    await this.upsertCourseDefinition({
      courseId,
      courseSlug: (courseSlug || courseId).trim().slice(0, 128),
      courseTitle: (courseTitle || courseId).trim().slice(0, 160),
      orderedModuleIds: [],
      requiredLessonIds: [],
      passPercentage: 70,
      certificateTemplateId: 'default_abhi_certificate',
      updatedAt: new Date().toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // Courses
  // --------------------------------------------------------------------------

  async getCourseDefinition(courseId: string): Promise<PersistedCourseDefinition | undefined> {
    const { data, error } = await this.client()
      .from(TABLES.courses)
      .select('*')
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) throwStorageError('getCourseDefinition', error);
    return data ? mapCourseRow(data) : undefined;
  }

  async upsertCourseDefinition(
    record: PersistedCourseDefinition
  ): Promise<PersistedCourseDefinition> {
    const payload = {
      course_id: record.courseId,
      course_slug: record.courseSlug,
      course_title: record.courseTitle,
      ordered_module_ids: record.orderedModuleIds,
      required_lesson_ids: record.requiredLessonIds,
      pass_percentage: record.passPercentage,
      certificate_template_id: record.certificateTemplateId,
      updated_at: record.updatedAt,
    };

    const { data, error } = await this.client()
      .from(TABLES.courses)
      .upsert(payload, { onConflict: 'course_id' })
      .select('*')
      .single();

    if (error) throwStorageError('upsertCourseDefinition', error);
    return mapCourseRow(data);
  }

  // --------------------------------------------------------------------------
  // Assessment Configurations (Module Quizzes & Final Assessments)
  // --------------------------------------------------------------------------

  async getAssessmentConfigById(id: string): Promise<PersistedAssessmentConfig | undefined> {
    const { data, error } = await this.client()
      .from(TABLES.assessments)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throwStorageError('getAssessmentConfigById', error);
    return data ? mapAssessmentRow(data) : undefined;
  }

  async listCourseAssessments(courseId: string): Promise<PersistedAssessmentConfig[]> {
    const { data, error } = await this.client()
      .from(TABLES.assessments)
      .select('*')
      .eq('course_id', courseId);

    if (error) throwStorageError('listCourseAssessments', error);
    return (data || []).map(mapAssessmentRow);
  }

  async upsertAssessmentConfig(
    config: PersistedAssessmentConfig
  ): Promise<PersistedAssessmentConfig> {
    await this.ensureCourseExists(config.courseId, config.courseSlug, config.courseTitle);
    const payload = {
      id: config.id,
      course_id: config.courseId,
      course_slug: config.courseSlug || config.courseId,
      course_title: config.courseTitle,
      assessment_type: config.assessmentType,
      module_id: config.assessmentType === 'module_quiz' ? config.moduleId || null : null,
      module_order:
        config.assessmentType === 'module_quiz' && typeof config.moduleOrder === 'number'
          ? config.moduleOrder
          : null,
      title: config.title,
      description: config.description || '',
      pass_percentage: config.passPercentage,
      question_count: config.questionCount,
      randomize_order: config.randomizeOrder,
      required_for_completion: config.requiredForCompletion,
      questions: config.questions,
      updated_at: config.updatedAt || new Date().toISOString(),
    };

    const { data, error } = await this.client()
      .from(TABLES.assessments)
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) throwStorageError('upsertAssessmentConfig', error);
    return mapAssessmentRow(data);
  }

  // --------------------------------------------------------------------------
  // Stateless Multi-Instance Assessment Sessions
  // --------------------------------------------------------------------------

  async createAssessmentSession(
    session: PersistedAssessmentSession
  ): Promise<PersistedAssessmentSession> {
    await this.ensureLearningUser(session.userId, session.candidateName, session.candidateEmail);
    await this.ensureCourseExists(session.courseId);
    const payload = {
      session_id: session.sessionId,
      config_id: session.configId,
      course_id: session.courseId,
      assessment_type: session.assessmentType,
      module_id: session.moduleId || null,
      firebase_uid: session.userId,
      candidate_name: session.candidateName,
      candidate_email: session.candidateEmail,
      served_question_ids: session.servedQuestionIds,
      submitted: false,
      created_at: session.createdAt,
      expires_at: session.expiresAt,
    };

    const { data, error } = await this.client()
      .from(TABLES.sessions)
      .insert(payload)
      .select('*')
      .single();

    if (error) throwStorageError('createAssessmentSession', error);
    return mapSessionRow(data);
  }

  async getAssessmentSession(sessionId: string): Promise<PersistedAssessmentSession | undefined> {
    const { data, error } = await this.client()
      .from(TABLES.sessions)
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) throwStorageError('getAssessmentSession', error);
    return data ? mapSessionRow(data) : undefined;
  }

  async markAssessmentSessionSubmitted(sessionId: string, userId: string): Promise<boolean> {
    // Atomic conditional update prevents replay / double-submission across Cloud Run instances
    const { data, error } = await this.client()
      .from(TABLES.sessions)
      .update({ submitted: true })
      .eq('session_id', sessionId)
      .eq('firebase_uid', userId)
      .eq('submitted', false)
      .select('session_id');

    if (error) throwStorageError('markAssessmentSessionSubmitted', error);
    return Array.isArray(data) && data.length === 1;
  }

  async pruneExpiredSessions(nowIso: string): Promise<number> {
    const { data, error } = await this.client()
      .from(TABLES.sessions)
      .delete()
      .lt('expires_at', nowIso)
      .select('session_id');

    if (error) throwStorageError('pruneExpiredSessions', error);
    return Array.isArray(data) ? data.length : 0;
  }

  // --------------------------------------------------------------------------
  // Lesson Progress
  // --------------------------------------------------------------------------

  async getLessonProgress(userId: string, courseId: string): Promise<string[]> {
    const { data, error } = await this.client()
      .from(TABLES.lessonProgress)
      .select('completed_lesson_ids')
      .eq('firebase_uid', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) throwStorageError('getLessonProgress', error);
    return data && Array.isArray(data.completed_lesson_ids)
      ? data.completed_lesson_ids.map(String)
      : [];
  }

  async upsertLessonProgress(
    userId: string,
    courseId: string,
    completedLessonIds: string[]
  ): Promise<string[]> {
    await this.ensureLearningUser(userId);
    await this.ensureCourseExists(courseId);
    const payload = {
      firebase_uid: userId,
      course_id: courseId,
      completed_lesson_ids: completedLessonIds,
      completed_count: completedLessonIds.length,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.client()
      .from(TABLES.lessonProgress)
      .upsert(payload, { onConflict: 'firebase_uid,course_id' })
      .select('completed_lesson_ids')
      .single();

    if (error) throwStorageError('upsertLessonProgress', error);
    return Array.isArray(data.completed_lesson_ids) ? data.completed_lesson_ids.map(String) : [];
  }

  // --------------------------------------------------------------------------
  // Quiz & Final Assessment Attempts (Separate Tables)
  // --------------------------------------------------------------------------

  async insertAttempt(attempt: PersistedAttemptRecord): Promise<PersistedAttemptRecord> {
    await this.ensureLearningUser(attempt.userId, attempt.candidateName, attempt.candidateEmail);
    await this.ensureCourseExists(attempt.courseId, attempt.courseSlug, attempt.courseTitle);
    if (attempt.assessmentType === 'final_assessment') {
      const payload = {
        id: attempt.id,
        firebase_uid: attempt.userId,
        candidate_name: attempt.candidateName,
        candidate_email: attempt.candidateEmail,
        course_id: attempt.courseId,
        course_slug: attempt.courseSlug,
        course_title: attempt.courseTitle,
        assessment_title: attempt.assessmentTitle,
        attempt_number: attempt.attemptNumber,
        total_questions: attempt.totalQuestions,
        correct_answers: attempt.correctAnswers,
        incorrect_answers: attempt.incorrectAnswers,
        score_percent: attempt.scorePercent,
        pass_percentage: attempt.passPercentage,
        passed: attempt.passed,
        verification_signature: attempt.verificationSignature,
        submitted_at: attempt.submittedAt,
      };
      const { data, error } = await this.client()
        .from(TABLES.finalAttempts)
        .insert(payload)
        .select('*')
        .single();
      if (error) throwStorageError('insertFinalAttempt', error);
      return mapFinalAttemptRow(data);
    }

    const payload = {
      id: attempt.id,
      firebase_uid: attempt.userId,
      candidate_name: attempt.candidateName,
      candidate_email: attempt.candidateEmail,
      course_id: attempt.courseId,
      course_slug: attempt.courseSlug,
      course_title: attempt.courseTitle,
      module_id: attempt.moduleId || '',
      assessment_title: attempt.assessmentTitle,
      attempt_number: attempt.attemptNumber,
      total_questions: attempt.totalQuestions,
      correct_answers: attempt.correctAnswers,
      incorrect_answers: attempt.incorrectAnswers,
      score_percent: attempt.scorePercent,
      pass_percentage: attempt.passPercentage,
      passed: attempt.passed,
      verification_signature: attempt.verificationSignature,
      submitted_at: attempt.submittedAt,
    };
    const { data, error } = await this.client()
      .from(TABLES.quizAttempts)
      .insert(payload)
      .select('*')
      .single();
    if (error) throwStorageError('insertQuizAttempt', error);
    return mapQuizAttemptRow(data);
  }

  async countCandidateAttempts(
    userId: string,
    courseId: string,
    assessmentType: AssessmentType,
    moduleId?: string
  ): Promise<number> {
    if (assessmentType === 'final_assessment') {
      const { count, error } = await this.client()
        .from(TABLES.finalAttempts)
        .select('id', { count: 'exact', head: true })
        .eq('firebase_uid', userId)
        .eq('course_id', courseId);
      if (error) throwStorageError('countFinalAttempts', error);
      return count ?? 0;
    }

    let query = this.client()
      .from(TABLES.quizAttempts)
      .select('id', { count: 'exact', head: true })
      .eq('firebase_uid', userId)
      .eq('course_id', courseId);

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }

    const { count, error } = await query;
    if (error) throwStorageError('countQuizAttempts', error);
    return count ?? 0;
  }

  async listAttempts(filters?: {
    courseId?: string;
    assessmentType?: string;
    userId?: string;
  }): Promise<PersistedAttemptRecord[]> {
    const includeQuizzes = !filters?.assessmentType || filters.assessmentType === 'all' || filters.assessmentType === 'module_quiz';
    const includeFinals = !filters?.assessmentType || filters.assessmentType === 'all' || filters.assessmentType === 'final_assessment';

    const results: PersistedAttemptRecord[] = [];

    if (includeQuizzes) {
      let q = this.client()
        .from(TABLES.quizAttempts)
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(500);
      if (filters?.userId) q = q.eq('firebase_uid', filters.userId);
      if (filters?.courseId && filters.courseId !== 'all') q = q.eq('course_id', filters.courseId);
      const { data, error } = await q;
      if (error) throwStorageError('listQuizAttempts', error);
      results.push(...(data || []).map(mapQuizAttemptRow));
    }

    if (includeFinals) {
      let q = this.client()
        .from(TABLES.finalAttempts)
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(500);
      if (filters?.userId) q = q.eq('firebase_uid', filters.userId);
      if (filters?.courseId && filters.courseId !== 'all') q = q.eq('course_id', filters.courseId);
      const { data, error } = await q;
      if (error) throwStorageError('listFinalAttempts', error);
      results.push(...(data || []).map(mapFinalAttemptRow));
    }

    return results.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  async deleteAttemptById(attemptId: string): Promise<boolean> {
    const [quizDel, finalDel] = await Promise.all([
      this.client().from(TABLES.quizAttempts).delete().eq('id', attemptId).select('id'),
      this.client().from(TABLES.finalAttempts).delete().eq('id', attemptId).select('id'),
    ]);

    if (quizDel.error) throwStorageError('deleteQuizAttemptById', quizDel.error);
    if (finalDel.error) throwStorageError('deleteFinalAttemptById', finalDel.error);

    return (
      (Array.isArray(quizDel.data) && quizDel.data.length > 0) ||
      (Array.isArray(finalDel.data) && finalDel.data.length > 0)
    );
  }

  // --------------------------------------------------------------------------
  // Module Unlocks (Server-Derived Authoritative Progression)
  // --------------------------------------------------------------------------

  async getModuleUnlock(
    userId: string,
    courseId: string
  ): Promise<PersistedModuleUnlockRecord | undefined> {
    const { data, error } = await this.client()
      .from(TABLES.moduleUnlocks)
      .select('*')
      .eq('firebase_uid', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) throwStorageError('getModuleUnlock', error);
    return data ? mapModuleUnlockRow(data) : undefined;
  }

  async upsertModuleUnlock(
    record: PersistedModuleUnlockRecord
  ): Promise<PersistedModuleUnlockRecord> {
    await this.ensureLearningUser(record.userId);
    await this.ensureCourseExists(record.courseId);
    const payload = {
      firebase_uid: record.userId,
      course_id: record.courseId,
      passed_module_quiz_ids: record.passedModuleQuizIds,
      unlocked_module_order: record.unlockedModuleOrder,
      final_assessment_passed: record.finalAssessmentPassed,
      best_final_score_percent: record.bestFinalScorePercent,
      last_verified_attempt_id: record.lastVerifiedAttemptId,
      last_verified_final_attempt_id: record.lastVerifiedFinalAttemptId,
      updated_at: record.updatedAt,
    };

    const { data, error } = await this.client()
      .from(TABLES.moduleUnlocks)
      .upsert(payload, { onConflict: 'firebase_uid,course_id' })
      .select('*')
      .single();

    if (error) throwStorageError('upsertModuleUnlock', error);
    return mapModuleUnlockRow(data);
  }

  // --------------------------------------------------------------------------
  // Certificates
  // --------------------------------------------------------------------------

  async getCertificateByUserCourse(
    userId: string,
    courseId: string
  ): Promise<PersistedCertificateRecord | undefined> {
    const { data, error } = await this.client()
      .from(TABLES.certificates)
      .select('*')
      .eq('firebase_uid', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) throwStorageError('getCertificateByUserCourse', error);
    return data ? mapCertificateRow(data) : undefined;
  }

  async getCertificateById(
    certificateId: string
  ): Promise<PersistedCertificateRecord | undefined> {
    const { data, error } = await this.client()
      .from(TABLES.certificates)
      .select('*')
      .eq('certificate_id', certificateId)
      .maybeSingle();

    if (error) throwStorageError('getCertificateById', error);
    return data ? mapCertificateRow(data) : undefined;
  }

  async listCertificatesByUser(userId: string): Promise<PersistedCertificateRecord[]> {
    const { data, error } = await this.client()
      .from(TABLES.certificates)
      .select('*')
      .eq('firebase_uid', userId)
      .order('issued_at', { ascending: false });

    if (error) throwStorageError('listCertificatesByUser', error);
    return (data || []).map(mapCertificateRow);
  }

  async insertCertificate(
    cert: PersistedCertificateRecord
  ): Promise<PersistedCertificateRecord> {
    await this.ensureLearningUser(cert.userId, cert.candidateName);
    await this.ensureCourseExists(cert.courseId, cert.courseSlug, cert.courseTitle);
    const payload = {
      certificate_id: cert.certificateId,
      firebase_uid: cert.userId,
      candidate_name: cert.candidateName,
      course_id: cert.courseId,
      course_slug: cert.courseSlug,
      course_title: cert.courseTitle,
      completion_date: cert.completionDate,
      issued_at: cert.issuedAt,
      final_assessment_score: cert.finalAssessmentScore,
      final_attempt_id: cert.finalAttemptId,
      template_id: cert.templateId,
      status: cert.status,
      verification_signature: cert.verificationSignature,
    };

    const { data, error } = await this.client()
      .from(TABLES.certificates)
      .insert(payload)
      .select('*')
      .single();

    if (error) throwStorageError('insertCertificate', error);
    return mapCertificateRow(data);
  }

  // --------------------------------------------------------------------------
  // Admin Reset (Strictly scoped to learning_* tables — NEVER touches recruitment)
  // --------------------------------------------------------------------------

  async resetAllLearningData(): Promise<{
    clearedConfigs: number;
    clearedAttempts: number;
    clearedProgressEntries: number;
    clearedCertificates: number;
    clearedCourseDefinitions: number;
    clearedSessions: number;
    clearedModuleUnlocks: number;
  }> {
    const db = this.client();
    // Delete child rows strictly before parent rows to respect PostgreSQL FK constraints
    const sessions = await db.from(TABLES.sessions).delete().neq('session_id', '').select('session_id');
    if (sessions.error) throwStorageError('resetAllLearningData.sessions', sessions.error);

    const certs = await db.from(TABLES.certificates).delete().neq('certificate_id', '').select('certificate_id');
    if (certs.error) throwStorageError('resetAllLearningData.certificates', certs.error);

    const [quizAtt, finalAtt, unlocks, progress] = await Promise.all([
      db.from(TABLES.quizAttempts).delete().neq('id', '').select('id'),
      db.from(TABLES.finalAttempts).delete().neq('id', '').select('id'),
      db.from(TABLES.moduleUnlocks).delete().neq('firebase_uid', '').select('firebase_uid'),
      db.from(TABLES.lessonProgress).delete().neq('firebase_uid', '').select('firebase_uid'),
    ]);
    for (const r of [quizAtt, finalAtt, unlocks, progress]) {
      if (r.error) throwStorageError('resetAllLearningData.attemptsOrProgress', r.error);
    }

    const configs = await db.from(TABLES.assessments).delete().neq('id', '').select('id');
    if (configs.error) throwStorageError('resetAllLearningData.assessments', configs.error);

    const lessons = await db.from(TABLES.lessons).delete().neq('id', '').select('id');
    if (lessons.error) throwStorageError('resetAllLearningData.lessons', lessons.error);

    const modules = await db.from(TABLES.modules).delete().neq('id', '').select('id');
    if (modules.error) throwStorageError('resetAllLearningData.modules', modules.error);

    const courses = await db.from(TABLES.courses).delete().neq('course_id', '').select('course_id');
    if (courses.error) throwStorageError('resetAllLearningData.courses', courses.error);

    return {
      clearedConfigs: configs.data?.length ?? 0,
      clearedAttempts: (quizAtt.data?.length ?? 0) + (finalAtt.data?.length ?? 0),
      clearedProgressEntries: progress.data?.length ?? 0,
      clearedCertificates: certs.data?.length ?? 0,
      clearedCourseDefinitions: courses.data?.length ?? 0,
      clearedSessions: sessions.data?.length ?? 0,
      clearedModuleUnlocks: unlocks.data?.length ?? 0,
    };
  }

  // --------------------------------------------------------------------------
  // Diagnostics
  // --------------------------------------------------------------------------

  async getDiagnostics(): Promise<LearningStoreDiagnostics> {
    const configured = isSupabaseLearningConfigured();
    if (!configured) {
      return {
        backend: this.backendName,
        isProductionDurable: false,
        supabaseConfigured: false,
        signingSecretConfigured: isSigningSecretConfigured(),
        connected: false,
        connectionError:
          'SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) are not configured.',
        courseDefinitionsCount: 0,
        quizConfigsCount: 0,
        attemptsCount: 0,
        lessonProgressEntriesCount: 0,
        moduleUnlocksCount: 0,
        certificatesCount: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      const db = this.client();
      const [courses, assessments, quizAtt, finalAtt, progress, unlocks, certs] = await Promise.all([
        db.from(TABLES.courses).select('course_id', { count: 'exact', head: true }),
        db.from(TABLES.assessments).select('id', { count: 'exact', head: true }),
        db.from(TABLES.quizAttempts).select('id', { count: 'exact', head: true }),
        db.from(TABLES.finalAttempts).select('id', { count: 'exact', head: true }),
        db.from(TABLES.lessonProgress).select('firebase_uid', { count: 'exact', head: true }),
        db.from(TABLES.moduleUnlocks).select('firebase_uid', { count: 'exact', head: true }),
        db.from(TABLES.certificates).select('certificate_id', { count: 'exact', head: true }),
      ]);

      const firstErr =
        courses.error ||
        assessments.error ||
        quizAtt.error ||
        finalAtt.error ||
        progress.error ||
        unlocks.error ||
        certs.error;

      if (firstErr) {
        return {
          backend: this.backendName,
          isProductionDurable: true,
          supabaseConfigured: true,
          signingSecretConfigured: isSigningSecretConfigured(),
          connected: false,
          connectionError: `${firstErr.code || 'DB_ERROR'}: ${firstErr.message}`,
          courseDefinitionsCount: 0,
          quizConfigsCount: 0,
          attemptsCount: 0,
          lessonProgressEntriesCount: 0,
          moduleUnlocksCount: 0,
          certificatesCount: 0,
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        backend: this.backendName,
        isProductionDurable: true,
        supabaseConfigured: true,
        signingSecretConfigured: isSigningSecretConfigured(),
        connected: true,
        courseDefinitionsCount: courses.count ?? 0,
        quizConfigsCount: assessments.count ?? 0,
        attemptsCount: (quizAtt.count ?? 0) + (finalAtt.count ?? 0),
        lessonProgressEntriesCount: progress.count ?? 0,
        moduleUnlocksCount: unlocks.count ?? 0,
        certificatesCount: certs.count ?? 0,
        updatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        backend: this.backendName,
        isProductionDurable: true,
        supabaseConfigured: true,
        signingSecretConfigured: isSigningSecretConfigured(),
        connected: false,
        connectionError: err?.message || 'Unable to reach Supabase PostgreSQL.',
        courseDefinitionsCount: 0,
        quizConfigsCount: 0,
        attemptsCount: 0,
        lessonProgressEntriesCount: 0,
        moduleUnlocksCount: 0,
        certificatesCount: 0,
        updatedAt: new Date().toISOString(),
      };
    }
  }
}
