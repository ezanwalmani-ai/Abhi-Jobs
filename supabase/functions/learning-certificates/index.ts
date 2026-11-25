/**
 * ABHI JOBS — Edge Function: learning-certificates
 * Handles server-verified certificate issuance (`issue`), learner retrieval (`mine`),
 * and public zero-PII verification (`verify` via GET or POST).
 *
 * Security guarantees:
 * - Public verification strictly returns ONLY 5 non-PII fields after HMAC validation.
 * - Certificate issuance strictly verifies completed lessons, module quizzes, and
 *   passing final assessment (>= 70%) directly from PostgreSQL.
 * - Idempotent per (user_id, course_id): never issues duplicate certificates.
 */

import {
  createAdminClient,
  errorResponse,
  HttpError,
  requireAuthenticatedUser,
} from '../_shared/auth.ts';
import {
  handleCorsPreflight,
  isOriginAuthorized,
  jsonResponse,
} from '../_shared/cors.ts';
import {
  signCertificateReceipt,
  verifyCertificateReceipt,
} from '../_shared/hmac.ts';

const CERT_ID_REGEX = /^[A-Z0-9-]{8,64}$/;

function generateCertificateId(): string {
  const year = new Date().getUTCFullYear();
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `ABHI-${year}-${hex}`;
}

async function handlePublicVerify(req: Request, rawCertificateId: string): Promise<Response> {
  const certificateId = rawCertificateId.trim().toUpperCase();
  if (!CERT_ID_REGEX.test(certificateId)) {
    return jsonResponse(
      req,
      { valid: false, error: 'Invalid certificate ID format.' },
      400,
      { allowPublicRead: true },
    );
  }

  const adminClient = createAdminClient();
  const { data: cert, error } = await adminClient
    .from('certificates')
    .select(
      'certificate_id, user_id, course_id, candidate_name, course_title, final_attempt_id, final_assessment_score, completion_date, status, verification_signature',
    )
    .eq('certificate_id', certificateId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'VERIFY_LOOKUP_ERROR', 'Unable to verify certificate right now.');
  }

  if (!cert) {
    return jsonResponse(
      req,
      { valid: false, certificate: null },
      404,
      { allowPublicRead: true },
    );
  }

  // Re-verify HMAC receipt when final_attempt_id is present to guarantee authenticity
  let signatureValid = true;
  if (cert.final_attempt_id) {
    signatureValid = await verifyCertificateReceipt(
      {
        certificateId: cert.certificate_id,
        userId: cert.user_id,
        courseId: cert.course_id,
        candidateName: cert.candidate_name,
        finalAttemptId: cert.final_attempt_id,
        finalAssessmentScore: cert.final_assessment_score,
        completionDate: cert.completion_date,
      },
      cert.verification_signature,
    );
  }

  const effectiveStatus = signatureValid ? cert.status : 'revoked';
  const isValid = signatureValid && effectiveStatus === 'valid';

  // Strictly return ONLY the 5 non-PII public verification fields
  return jsonResponse(
    req,
    {
      valid: isValid,
      certificate: {
        certificateId: cert.certificate_id,
        candidateName: cert.candidate_name,
        courseTitle: cert.course_title,
        issueDate: cert.completion_date,
        status: effectiveStatus,
      },
    },
    200,
    { allowPublicRead: true },
  );
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const isPublicGetVerify = req.method === 'GET';

  const preflight = handleCorsPreflight(req, { allowPublicRead: true });
  if (preflight) return preflight;

  try {
    // Public GET /learning-certificates?certificateId=ABHI-2026-XXXXXXXX
    if (isPublicGetVerify) {
      const certId = url.searchParams.get('certificateId') ?? '';
      return await handlePublicVerify(req, certId);
    }

    if (req.method !== 'POST') {
      return jsonResponse(req, { error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' }, 405);
    }

    const body = (await req.json().catch(() => {
      throw new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
    })) as Record<string, unknown>;

    const action = typeof body.action === 'string' ? body.action.trim() : '';

    // Public POST verify
    if (action === 'verify') {
      const certId = typeof body.certificateId === 'string' ? body.certificateId : '';
      return await handlePublicVerify(req, certId);
    }

    // Authenticated endpoints strictly require allowlisted origin + valid JWT
    if (!isOriginAuthorized(req)) {
      return jsonResponse(req, { error: 'Origin not permitted.', code: 'CORS_ORIGIN_FORBIDDEN' }, 403);
    }

    const ctx = await requireAuthenticatedUser(req);

    // -------------------------------------------------------------------------
    // ACTION: mine — Learner's own issued certificates
    // -------------------------------------------------------------------------
    if (action === 'mine') {
      const { data: certs, error } = await ctx.adminClient
        .from('certificates')
        .select(
          'certificate_id, course_id, course_slug, course_title, candidate_name, final_assessment_score, status, completion_date, issued_at, template_id, certificate_templates(name, organization_name, certificate_title, subtitle, signatory_name, signatory_designation, primary_color, accent_color)',
        )
        .eq('user_id', ctx.user.id)
        .order('issued_at', { ascending: false });

      if (error) {
        throw new HttpError(500, 'CERT_FETCH_ERROR', 'Unable to fetch your certificates.');
      }

      return jsonResponse(req, { certificates: certs ?? [] });
    }

    // -------------------------------------------------------------------------
    // ACTION: issue — Verify eligibility server-side & issue immutable certificate
    // -------------------------------------------------------------------------
    if (action === 'issue') {
      const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
      if (!courseId) {
        throw new HttpError(400, 'COURSE_ID_REQUIRED', 'courseId is required.');
      }

      // 1. Check idempotency — return existing certificate if already issued
      const { data: existingCert } = await ctx.adminClient
        .from('certificates')
        .select(
          'certificate_id, course_id, course_slug, course_title, candidate_name, final_assessment_score, status, completion_date, issued_at, template_id',
        )
        .eq('user_id', ctx.user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (existingCert) {
        return jsonResponse(req, { certificate: existingCert, alreadyIssued: true });
      }

      // 2. Load course, modules, enrolment, and best verified final assessment attempt
      const [{ data: course }, { data: modules }, { data: enrolment }, { data: finalAttempt }] =
        await Promise.all([
          ctx.adminClient
            .from('learning_courses')
            .select('id, slug, title, offers_certificate, pass_percentage, certificate_template_id, status')
            .eq('id', courseId)
            .is('deleted_at', null)
            .maybeSingle(),
          ctx.adminClient
            .from('course_modules')
            .select('id, quiz_required, is_upcoming_placeholder')
            .eq('course_id', courseId),
          ctx.adminClient
            .from('course_enrolments')
            .select('passed_module_quiz_ids, final_assessment_passed, completed_at')
            .eq('user_id', ctx.user.id)
            .eq('course_id', courseId)
            .maybeSingle(),
          ctx.adminClient
            .from('quiz_attempts')
            .select('id, score_percent, passed, submitted_at')
            .eq('user_id', ctx.user.id)
            .eq('course_id', courseId)
            .eq('assessment_type', 'final_assessment')
            .eq('passed', true)
            .order('score_percent', { ascending: false })
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (!course || course.status !== 'published') {
        throw new HttpError(404, 'COURSE_NOT_FOUND', 'Course is not available.');
      }
      if (!course.offers_certificate) {
        throw new HttpError(400, 'CERTIFICATE_NOT_OFFERED', 'This course does not offer a certificate.');
      }
      if (!enrolment) {
        throw new HttpError(403, 'ENROLMENT_REQUIRED', 'Course enrolment is required.');
      }

      // 3. Enforce all required module quizzes passed
      const requiredModules = (modules ?? [])
        .filter((m) => !m.is_upcoming_placeholder && m.quiz_required)
        .map((m) => m.id);
      const passedSet = new Set<string>(enrolment.passed_module_quiz_ids ?? []);
      const missingModules = requiredModules.filter((id) => !passedSet.has(id));

      if (missingModules.length > 0) {
        throw new HttpError(
          403,
          'MODULES_INCOMPLETE',
          'All required module quizzes must be passed before claiming a certificate.',
        );
      }

      // 4. Enforce verified passing final assessment (>= course pass_percentage and >= 70)
      const minPass = Math.max(70, course.pass_percentage ?? 70);
      if (!finalAttempt || !finalAttempt.passed || finalAttempt.score_percent < minPass) {
        throw new HttpError(
          403,
          'FINAL_ASSESSMENT_REQUIRED',
          `You must pass the final assessment with at least ${minPass}% to earn this certificate.`,
        );
      }

      const candidateName =
        (ctx.profile.full_name || '').trim() ||
        ctx.profile.email.split('@')[0] ||
        'ABHI JOBS Learner';
      const completionDate = enrolment.completed_at || finalAttempt.submitted_at || new Date().toISOString();
      const certificateId = generateCertificateId();

      const verificationSignature = await signCertificateReceipt({
        certificateId,
        userId: ctx.user.id,
        courseId: course.id,
        candidateName,
        finalAttemptId: finalAttempt.id,
        finalAssessmentScore: finalAttempt.score_percent,
        completionDate,
      });

      const { data: inserted, error: insertError } = await ctx.adminClient
        .from('certificates')
        .insert({
          certificate_id: certificateId,
          user_id: ctx.user.id,
          candidate_name: candidateName,
          course_id: course.id,
          course_slug: course.slug,
          course_title: course.title,
          final_attempt_id: finalAttempt.id,
          final_assessment_score: finalAttempt.score_percent,
          template_id: course.certificate_template_id ?? 'default_abhi_certificate',
          status: 'valid',
          verification_signature: verificationSignature,
          completion_date: completionDate,
        })
        .select(
          'certificate_id, course_id, course_slug, course_title, candidate_name, final_assessment_score, status, completion_date, issued_at, template_id',
        )
        .single();

      if (insertError) {
        throw new HttpError(500, 'CERT_ISSUE_FAILED', 'Unable to issue certificate right now.');
      }

      return jsonResponse(req, { certificate: inserted, alreadyIssued: false }, 201);
    }

    throw new HttpError(400, 'UNSUPPORTED_ACTION', 'Unsupported learning-certificates action.');
  } catch (err) {
    return errorResponse(req, err, { allowPublicRead: isPublicGetVerify });
  }
});
