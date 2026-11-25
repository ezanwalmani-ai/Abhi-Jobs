/**
 * ABHI JOBS — Edge Function: learning-assessments
 * Server-authoritative quiz delivery, grading, HMAC attempt receipts,
 * and sequential module unlock progression for Learn with ABHI.
 *
 * Security guarantees:
 * - Requires authenticated Supabase user JWT on every request.
 * - Quiz answer keys & explanations are NEVER returned during `summary` or `start`.
 * - Single-submission atomic lock on `assessment_sessions` prevents replay/race exploits.
 * - Updates `course_enrolments` progression columns via service_role only after verified pass.
 */

import {
  errorResponse,
  HttpError,
  requireAuthenticatedUser,
} from '../_shared/auth.ts';
import {
  handleCorsPreflight,
  isOriginAuthorized,
  jsonResponse,
} from '../_shared/cors.ts';
import { signQuizAttemptReceipt } from '../_shared/hmac.ts';

function cryptoRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % maxExclusive;
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = cryptoRandomInt(i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function parseJsonBody(req: Request): Promise<Record<string, unknown>> {
  return req.json().catch(() => {
    throw new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  });
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (!isOriginAuthorized(req)) {
    return jsonResponse(req, { error: 'Origin not permitted.', code: 'CORS_ORIGIN_FORBIDDEN' }, 403);
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' }, 405);
  }

  try {
    const ctx = await requireAuthenticatedUser(req);
    const body = await parseJsonBody(req);
    const action = typeof body.action === 'string' ? body.action.trim() : '';

    // -------------------------------------------------------------------------
    // ACTION: summary — Safe quiz metadata for a course (ZERO answer keys)
    // -------------------------------------------------------------------------
    if (action === 'summary') {
      const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
      if (!courseId) {
        throw new HttpError(400, 'COURSE_ID_REQUIRED', 'courseId is required.');
      }

      const { data: configs, error } = await ctx.adminClient
        .from('quiz_configs')
        .select(
          'id, course_id, module_id, assessment_type, module_order, title, description, pass_percentage, question_count, required_for_completion',
        )
        .eq('course_id', courseId)
        .order('module_order', { ascending: true, nullsFirst: false });

      if (error) {
        throw new HttpError(500, 'QUIZ_SUMMARY_ERROR', 'Unable to load course assessments.');
      }

      return jsonResponse(req, { quizzes: configs ?? [] });
    }

    // -------------------------------------------------------------------------
    // ACTION: mine — Learner's own verified quiz attempts
    // -------------------------------------------------------------------------
    if (action === 'mine') {
      const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
      let query = ctx.adminClient
        .from('quiz_attempts')
        .select(
          'id, course_id, quiz_config_id, assessment_type, module_id, assessment_title, attempt_number, total_questions, correct_answers, incorrect_answers, score_percent, pass_percentage, passed, submitted_at',
        )
        .eq('user_id', ctx.user.id)
        .order('submitted_at', { ascending: false })
        .limit(100);

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data: attempts, error } = await query;
      if (error) {
        throw new HttpError(500, 'ATTEMPTS_FETCH_ERROR', 'Unable to fetch quiz attempts.');
      }

      return jsonResponse(req, { attempts: attempts ?? [] });
    }

    // -------------------------------------------------------------------------
    // ACTION: start — Issue randomized assessment session without answer keys
    // -------------------------------------------------------------------------
    if (action === 'start') {
      const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
      const assessmentType = body.assessmentType;
      const moduleId = typeof body.moduleId === 'string' ? body.moduleId.trim() : null;

      if (!courseId) {
        throw new HttpError(400, 'COURSE_ID_REQUIRED', 'courseId is required.');
      }
      if (assessmentType !== 'module_quiz' && assessmentType !== 'final_assessment') {
        throw new HttpError(400, 'INVALID_ASSESSMENT_TYPE', 'Invalid assessmentType.');
      }
      if (assessmentType === 'module_quiz' && !moduleId) {
        throw new HttpError(400, 'MODULE_ID_REQUIRED', 'moduleId is required for module_quiz.');
      }

      // 1. Verify course & learner enrolment
      const [{ data: course }, { data: enrolment }] = await Promise.all([
        ctx.adminClient
          .from('learning_courses')
          .select('id, status, sequential_unlock, pass_percentage')
          .eq('id', courseId)
          .is('deleted_at', null)
          .maybeSingle(),
        ctx.adminClient
          .from('course_enrolments')
          .select(
            'user_id, course_id, completed_lesson_ids, passed_module_quiz_ids, unlocked_module_order, final_assessment_passed',
          )
          .eq('user_id', ctx.user.id)
          .eq('course_id', courseId)
          .maybeSingle(),
      ]);

      if (!course || course.status !== 'published') {
        throw new HttpError(404, 'COURSE_NOT_FOUND', 'Course is not available.');
      }
      if (!enrolment) {
        throw new HttpError(403, 'ENROLMENT_REQUIRED', 'You must enrol in this course before taking assessments.');
      }

      // 2. Enforce sequential module prerequisites server-side
      const { data: allModules } = await ctx.adminClient
        .from('course_modules')
        .select('id, module_order, quiz_required, is_upcoming_placeholder')
        .eq('course_id', courseId)
        .order('module_order', { ascending: true });

      const activeModules = (allModules ?? []).filter((m) => !m.is_upcoming_placeholder);

      if (assessmentType === 'module_quiz') {
        const targetModule = activeModules.find((m) => m.id === moduleId);
        if (!targetModule) {
          throw new HttpError(404, 'MODULE_NOT_FOUND', 'Requested module was not found.');
        }
        if (course.sequential_unlock && targetModule.module_order > enrolment.unlocked_module_order) {
          throw new HttpError(
            403,
            'MODULE_LOCKED',
            'Complete and pass the previous module quiz to unlock this module.',
          );
        }
      } else {
        // Final assessment requires all required module quizzes passed
        const requiredModuleIds = activeModules
          .filter((m) => m.quiz_required)
          .map((m) => m.id);
        const passedSet = new Set<string>(enrolment.passed_module_quiz_ids ?? []);
        const missingModules = requiredModuleIds.filter((id) => !passedSet.has(id));
        if (missingModules.length > 0) {
          throw new HttpError(
            403,
            'FINAL_ASSESSMENT_LOCKED',
            'Pass all required module quizzes before starting the final assessment.',
          );
        }
      }

      // 3. Load quiz configuration & active question bank
      let configQuery = ctx.adminClient
        .from('quiz_configs')
        .select(
          'id, course_id, module_id, assessment_type, module_order, title, description, pass_percentage, question_count, randomize_order',
        )
        .eq('course_id', courseId)
        .eq('assessment_type', assessmentType);

      if (assessmentType === 'module_quiz' && moduleId) {
        configQuery = configQuery.eq('module_id', moduleId);
      } else {
        configQuery = configQuery.is('module_id', null);
      }

      const { data: quizConfig, error: configError } = await configQuery.maybeSingle();
      if (configError || !quizConfig) {
        throw new HttpError(404, 'QUIZ_NOT_FOUND', 'Assessment configuration not found.');
      }

      const { data: rawQuestions, error: qError } = await ctx.adminClient
        .from('quiz_questions')
        .select('id, prompt, options, display_order')
        .eq('quiz_config_id', quizConfig.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (qError || !rawQuestions || rawQuestions.length === 0) {
        throw new HttpError(404, 'QUESTIONS_UNAVAILABLE', 'No active questions configured for this assessment.');
      }

      const orderedQuestions = quizConfig.randomize_order
        ? shuffleArray(rawQuestions)
        : rawQuestions;
      const selectedQuestions = orderedQuestions.slice(
        0,
        Math.min(quizConfig.question_count, orderedQuestions.length),
      );

      // Permute options per question so option positions cannot be memorized or leaked
      const optionPermutations: Record<string, number[]> = {};
      const clientQuestions = selectedQuestions.map((q) => {
        const opts = Array.isArray(q.options) ? q.options.map((o) => String(o)) : [];
        const indices = opts.map((_, idx) => idx);
        const permutedIndices = quizConfig.randomize_order ? shuffleArray(indices) : indices;
        optionPermutations[q.id] = permutedIndices;

        return {
          id: q.id,
          prompt: q.prompt,
          options: permutedIndices.map((origIdx) => opts[origIdx]),
        };
      });

      const sessionId = `sess_${crypto.randomUUID().replace(/-/g, '')}`;
      const expiresAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();

      const { error: insertSessionError } = await ctx.adminClient
        .from('assessment_sessions')
        .insert({
          session_id: sessionId,
          quiz_config_id: quizConfig.id,
          course_id: courseId,
          assessment_type: assessmentType,
          module_id: moduleId,
          user_id: ctx.user.id,
          served_question_ids: selectedQuestions.map((q) => q.id),
          option_permutations: optionPermutations,
          submitted: false,
          expires_at: expiresAt,
        });

      if (insertSessionError) {
        throw new HttpError(500, 'SESSION_CREATE_FAILED', 'Unable to start assessment session.');
      }

      return jsonResponse(req, {
        sessionId,
        quizConfigId: quizConfig.id,
        courseId,
        assessmentType,
        moduleId,
        title: quizConfig.title,
        description: quizConfig.description,
        passPercentage: quizConfig.pass_percentage,
        expiresAt,
        questions: clientQuestions,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: submit — Atomic single-submit grading + progression update
    // -------------------------------------------------------------------------
    if (action === 'submit') {
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
      const rawAnswers = body.answers;

      if (!sessionId) {
        throw new HttpError(400, 'SESSION_ID_REQUIRED', 'sessionId is required.');
      }
      if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
        throw new HttpError(400, 'ANSWERS_REQUIRED', 'answers map is required.');
      }

      const nowIso = new Date().toISOString();

      // Atomic single-submit lock: prevents replay or concurrent double submission
      const { data: session, error: lockError } = await ctx.adminClient
        .from('assessment_sessions')
        .update({ submitted: true })
        .eq('session_id', sessionId)
        .eq('user_id', ctx.user.id)
        .eq('submitted', false)
        .gt('expires_at', nowIso)
        .select('*')
        .maybeSingle();

      if (lockError) {
        throw new HttpError(500, 'SESSION_LOCK_FAILED', 'Unable to process assessment submission.');
      }
      if (!session) {
        throw new HttpError(
          409,
          'SESSION_INVALID_OR_EXPIRED',
          'This assessment session has already been submitted or has expired.',
        );
      }

      const [{ data: quizConfig }, { data: questions }, { count: prevCount }] = await Promise.all([
        ctx.adminClient
          .from('quiz_configs')
          .select('id, title, pass_percentage, module_order')
          .eq('id', session.quiz_config_id)
          .single(),
        ctx.adminClient
          .from('quiz_questions')
          .select('id, prompt, options, correct_option_index, explanation')
          .in('id', session.served_question_ids),
        ctx.adminClient
          .from('quiz_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', ctx.user.id)
          .eq('course_id', session.course_id)
          .eq('quiz_config_id', session.quiz_config_id),
      ]);

      if (!quizConfig || !questions || questions.length === 0) {
        throw new HttpError(500, 'GRADING_DATA_MISSING', 'Assessment grading configuration unavailable.');
      }

      const questionById = new Map(questions.map((q) => [q.id, q]));
      const answersRecord = rawAnswers as Record<string, unknown>;
      const permutations = (session.option_permutations ?? {}) as Record<string, number[]>;

      let correctCount = 0;
      const questionResults: Array<Record<string, unknown>> = [];

      for (const qId of session.served_question_ids as string[]) {
        const q = questionById.get(qId);
        if (!q) continue;

        const perm = Array.isArray(permutations[qId]) ? permutations[qId] : [0, 1, 2, 3];
        const submittedDisplayed = Number(answersRecord[qId]);
        const validChoice =
          Number.isInteger(submittedDisplayed) &&
          submittedDisplayed >= 0 &&
          submittedDisplayed < perm.length;

        const mappedOriginalIndex = validChoice ? perm[submittedDisplayed] : -1;
        const isCorrect = mappedOriginalIndex === q.correct_option_index;
        if (isCorrect) correctCount += 1;

        const correctDisplayedIndex = perm.indexOf(q.correct_option_index);

        questionResults.push({
          questionId: q.id,
          prompt: q.prompt,
          selectedOptionIndex: validChoice ? submittedDisplayed : null,
          correctOptionIndex: correctDisplayedIndex >= 0 ? correctDisplayedIndex : q.correct_option_index,
          isCorrect,
          explanation: q.explanation,
        });
      }

      const totalQuestions = questionResults.length;
      if (totalQuestions === 0) {
        throw new HttpError(500, 'EMPTY_ASSESSMENT', 'No questions found to grade.');
      }

      const incorrectCount = totalQuestions - correctCount;
      const scorePercent = Math.round((correctCount / totalQuestions) * 100);
      const passed = scorePercent >= quizConfig.pass_percentage;
      const attemptId = crypto.randomUUID();
      const attemptNumber = (prevCount ?? 0) + 1;
      const submittedAt = new Date().toISOString();

      const verificationSignature = await signQuizAttemptReceipt({
        attemptId,
        userId: ctx.user.id,
        courseId: session.course_id,
        assessmentType: session.assessment_type,
        moduleId: session.module_id,
        scorePercent,
        passed,
        submittedAt,
      });

      const { error: attemptInsertError } = await ctx.adminClient.from('quiz_attempts').insert({
        id: attemptId,
        user_id: ctx.user.id,
        candidate_name: ctx.profile.full_name,
        candidate_email: ctx.profile.email,
        course_id: session.course_id,
        quiz_config_id: session.quiz_config_id,
        assessment_type: session.assessment_type,
        module_id: session.module_id,
        assessment_title: quizConfig.title,
        attempt_number: attemptNumber,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        incorrect_answers: incorrectCount,
        score_percent: scorePercent,
        pass_percentage: quizConfig.pass_percentage,
        passed,
        question_results: questionResults,
        verification_signature: verificationSignature,
        submitted_at: submittedAt,
      });

      if (attemptInsertError) {
        throw new HttpError(500, 'ATTEMPT_SAVE_FAILED', 'Unable to save verified quiz attempt.');
      }

      // Update course_enrolments server-side when the learner passes
      let updatedEnrolment: Record<string, unknown> | null = null;
      if (passed) {
        const [{ data: enrolment }, { data: modules }] = await Promise.all([
          ctx.adminClient
            .from('course_enrolments')
            .select('*')
            .eq('user_id', ctx.user.id)
            .eq('course_id', session.course_id)
            .maybeSingle(),
          ctx.adminClient
            .from('course_modules')
            .select('id, module_order, quiz_required, is_upcoming_placeholder')
            .eq('course_id', session.course_id)
            .order('module_order', { ascending: true }),
        ]);

        if (enrolment) {
          const activeModules = (modules ?? []).filter((m) => !m.is_upcoming_placeholder);
          const maxOrder = activeModules.reduce((acc, m) => Math.max(acc, m.module_order), 1);
          const passedModuleIds = new Set<string>(enrolment.passed_module_quiz_ids ?? []);

          const patch: Record<string, unknown> = {
            last_accessed_at: submittedAt,
          };

          if (session.assessment_type === 'module_quiz' && session.module_id) {
            passedModuleIds.add(session.module_id);
            const currentModule = activeModules.find((m) => m.id === session.module_id);
            const nextOrder = currentModule
              ? Math.min(maxOrder, Math.max(enrolment.unlocked_module_order ?? 1, currentModule.module_order + 1))
              : enrolment.unlocked_module_order ?? 1;

            const requiredQuizCount = Math.max(1, activeModules.filter((m) => m.quiz_required).length);
            const computedProgress = Math.min(
              95,
              Math.round((passedModuleIds.size / requiredQuizCount) * 90),
            );

            patch.passed_module_quiz_ids = Array.from(passedModuleIds);
            patch.unlocked_module_order = nextOrder;
            patch.last_verified_attempt_id = attemptId;
            patch.status = enrolment.final_assessment_passed ? 'completed' : 'in_progress';
            patch.progress_percent = Math.max(enrolment.progress_percent ?? 0, computedProgress);
          } else if (session.assessment_type === 'final_assessment') {
            patch.final_assessment_passed = true;
            patch.best_final_score_percent = Math.max(
              enrolment.best_final_score_percent ?? 0,
              scorePercent,
            );
            patch.last_verified_final_attempt_id = attemptId;
            patch.status = 'completed';
            patch.progress_percent = 100;
            patch.completed_at = enrolment.completed_at ?? submittedAt;
          }

          const { data: savedEnrolment } = await ctx.adminClient
            .from('course_enrolments')
            .update(patch)
            .eq('user_id', ctx.user.id)
            .eq('course_id', session.course_id)
            .select(
              'course_id, status, passed_module_quiz_ids, unlocked_module_order, final_assessment_passed, best_final_score_percent, progress_percent, completed_at',
            )
            .maybeSingle();

          updatedEnrolment = savedEnrolment ?? null;
        }
      }

      return jsonResponse(req, {
        attempt: {
          id: attemptId,
          courseId: session.course_id,
          assessmentType: session.assessment_type,
          moduleId: session.module_id,
          assessmentTitle: quizConfig.title,
          attemptNumber,
          totalQuestions,
          correctAnswers: correctCount,
          incorrectAnswers: incorrectCount,
          scorePercent,
          passPercentage: quizConfig.pass_percentage,
          passed,
          submittedAt,
          questionResults,
        },
        enrolment: updatedEnrolment,
      });
    }

    throw new HttpError(400, 'UNSUPPORTED_ACTION', 'Unsupported learning-assessments action.');
  } catch (err) {
    return errorResponse(req, err);
  }
});
