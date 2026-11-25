/**
 * ABHI JOBS — Edge Function: admin-operations
 * Central Super Admin & RBAC operations for /abhi-control-center.
 *
 * Security guarantees:
 * - Every request strictly verifies Supabase Auth JWT + verified email + active admin_roles row.
 * - Super Admin role grants require target user to already have a verified Supabase Auth email.
 * - Prevents revoking the last remaining active super_admin (anti-lockout guard).
 * - Super Admin CSV exports neutralize spreadsheet formulas and write immutable audit logs.
 */

import {
  ALL_ADMIN_ROLES,
  errorResponse,
  getClientIpHash,
  HttpError,
  requireAdminRole,
  writeAdminAuditLog,
  type AdminRoleName,
} from '../_shared/auth.ts';
import {
  buildCorsHeaders,
  handleCorsPreflight,
  isOriginAuthorized,
  jsonResponse,
} from '../_shared/cors.ts';
import {
  buildSafeCsv,
  isAllowedExportDataset,
  MAX_EXPORT_ROWS,
  type CsvColumn,
} from '../_shared/csv.ts';

const PRIVATE_ADMIN_ROUTE = '/abhi-control-center';

function isValidAdminRole(value: unknown): value is AdminRoleName {
  return typeof value === 'string' && (ALL_ADMIN_ROLES as string[]).includes(value);
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
    const body = (await req.json().catch(() => {
      throw new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
    })) as Record<string, unknown>;

    const action = typeof body.action === 'string' ? body.action.trim() : '';
    const ipHash = await getClientIpHash(req);

    // -------------------------------------------------------------------------
    // ACTION: auth-status — Verify active admin session & role for /abhi-control-center
    // -------------------------------------------------------------------------
    if (action === 'auth-status') {
      const ctx = await requireAdminRole(req, ALL_ADMIN_ROLES);
      return jsonResponse(req, {
        authenticated: true,
        userId: ctx.user.id,
        email: ctx.profile.email,
        fullName: ctx.profile.full_name,
        role: ctx.adminRole,
        isSuperAdmin: ctx.adminRole === 'super_admin',
        privateRoute: PRIVATE_ADMIN_ROUTE,
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: list-roles — Super Admin view of all administrator assignments
    // -------------------------------------------------------------------------
    if (action === 'list-roles') {
      const ctx = await requireAdminRole(req, ['super_admin']);
      const { data: roles, error } = await ctx.adminClient
        .from('admin_roles')
        .select('id, user_id, role, is_active, notes, granted_by, created_at, updated_at, profiles!admin_roles_user_id_fkey(email, full_name, status)')
        .order('created_at', { ascending: false });

      if (error) {
        throw new HttpError(500, 'LIST_ROLES_ERROR', 'Unable to load administrator roles.');
      }

      return jsonResponse(req, { roles: roles ?? [] });
    }

    // -------------------------------------------------------------------------
    // ACTION: grant-role — Super Admin grants/updates role for a VERIFIED account
    // -------------------------------------------------------------------------
    if (action === 'grant-role') {
      const ctx = await requireAdminRole(req, ['super_admin']);
      const targetEmail = typeof body.targetEmail === 'string' ? body.targetEmail.trim().toLowerCase() : '';
      const role = body.role;
      const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';

      if (!targetEmail || !targetEmail.includes('@')) {
        throw new HttpError(400, 'TARGET_EMAIL_REQUIRED', 'Valid targetEmail is required.');
      }
      if (!isValidAdminRole(role)) {
        throw new HttpError(400, 'INVALID_ADMIN_ROLE', 'Requested admin role is not valid.');
      }

      // Resolve profile & verify email confirmation via Supabase Auth Admin API
      const { data: targetProfile } = await ctx.adminClient
        .from('profiles')
        .select('id, email, status, deleted_at')
        .eq('email', targetEmail)
        .maybeSingle();

      if (!targetProfile || targetProfile.deleted_at || targetProfile.status !== 'active') {
        throw new HttpError(
          404,
          'TARGET_ACCOUNT_NOT_FOUND',
          'Target account must sign up and be active before receiving an admin role.',
        );
      }

      const { data: authLookup, error: authLookupError } =
        await ctx.adminClient.auth.admin.getUserById(targetProfile.id);

      if (authLookupError || !authLookup?.user || !authLookup.user.email_confirmed_at) {
        throw new HttpError(
          403,
          'TARGET_EMAIL_UNVERIFIED',
          'Administrator permissions cannot be granted until the Supabase Auth email is verified.',
        );
      }

      const { error: upsertError } = await ctx.adminClient
        .from('admin_roles')
        .upsert(
          {
            user_id: targetProfile.id,
            role,
            is_active: true,
            granted_by: ctx.user.id,
            notes,
          },
          { onConflict: 'user_id' },
        );

      if (upsertError) {
        throw new HttpError(500, 'GRANT_ROLE_FAILED', 'Unable to update administrator role.');
      }

      await ctx.adminClient
        .from('profiles')
        .update({ account_type: 'admin' })
        .eq('id', targetProfile.id);

      await writeAdminAuditLog(ctx.adminClient, {
        actorUserId: ctx.user.id,
        actorEmail: ctx.profile.email,
        actorRole: ctx.adminRole,
        action: 'grant_admin_role',
        entityType: 'admin_roles',
        entityId: targetProfile.id,
        metadata: { targetEmail, role },
        ipHash,
      });

      return jsonResponse(req, { success: true, userId: targetProfile.id, role });
    }

    // -------------------------------------------------------------------------
    // ACTION: revoke-role — Super Admin revokes an admin role (anti-lockout guard)
    // -------------------------------------------------------------------------
    if (action === 'revoke-role') {
      const ctx = await requireAdminRole(req, ['super_admin']);
      const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId.trim() : '';
      if (!targetUserId) {
        throw new HttpError(400, 'TARGET_USER_ID_REQUIRED', 'targetUserId is required.');
      }

      const { data: targetRole } = await ctx.adminClient
        .from('admin_roles')
        .select('user_id, role, is_active')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (!targetRole || !targetRole.is_active) {
        throw new HttpError(404, 'ADMIN_ROLE_NOT_FOUND', 'Active administrator role not found.');
      }

      if (targetRole.role === 'super_admin') {
        const { count: activeSuperAdmins } = await ctx.adminClient
          .from('admin_roles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'super_admin')
          .eq('is_active', true);

        if ((activeSuperAdmins ?? 0) <= 1) {
          throw new HttpError(
            409,
            'LAST_SUPER_ADMIN_PROTECTED',
            'Cannot revoke the last active Super Admin account.',
          );
        }
      }

      const { error: revokeError } = await ctx.adminClient
        .from('admin_roles')
        .update({ is_active: false })
        .eq('user_id', targetUserId);

      if (revokeError) {
        throw new HttpError(500, 'REVOKE_ROLE_FAILED', 'Unable to revoke administrator role.');
      }

      await writeAdminAuditLog(ctx.adminClient, {
        actorUserId: ctx.user.id,
        actorEmail: ctx.profile.email,
        actorRole: ctx.adminRole,
        action: 'revoke_admin_role',
        entityType: 'admin_roles',
        entityId: targetUserId,
        metadata: { revokedRole: targetRole.role },
        ipHash,
      });

      return jsonResponse(req, { success: true, userId: targetUserId });
    }

    // -------------------------------------------------------------------------
    // ACTION: export-csv — Super Admin authorized CSV export with audit trail
    // -------------------------------------------------------------------------
    if (action === 'export-csv') {
      const ctx = await requireAdminRole(req, ['super_admin']);
      const dataset = body.dataset;

      if (!isAllowedExportDataset(dataset)) {
        throw new HttpError(400, 'INVALID_EXPORT_DATASET', 'Requested export dataset is not allowed.');
      }

      let rows: Record<string, unknown>[] = [];
      let columns: CsvColumn<Record<string, unknown>>[] = [];

      if (dataset === 'jobs') {
        const { data, error } = await ctx.adminClient
          .from('jobs')
          .select('id, title, company_name, location, work_mode, employment_type, experience_level, salary_min, salary_max, status, applicants_count, created_at')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(MAX_EXPORT_ROWS);
        if (error) throw new HttpError(500, 'EXPORT_QUERY_FAILED', 'Failed to export jobs.');
        rows = data ?? [];
        columns = [
          { header: 'Job ID', accessor: (r) => r.id },
          { header: 'Title', accessor: (r) => r.title },
          { header: 'Company', accessor: (r) => r.company_name },
          { header: 'Location', accessor: (r) => r.location },
          { header: 'Work Mode', accessor: (r) => r.work_mode },
          { header: 'Employment Type', accessor: (r) => r.employment_type },
          { header: 'Experience Level', accessor: (r) => r.experience_level },
          { header: 'Salary Min', accessor: (r) => r.salary_min },
          { header: 'Salary Max', accessor: (r) => r.salary_max },
          { header: 'Status', accessor: (r) => r.status },
          { header: 'Applicants', accessor: (r) => r.applicants_count },
          { header: 'Created At', accessor: (r) => r.created_at },
        ];
      } else if (dataset === 'applications') {
        const { data, error } = await ctx.adminClient
          .from('applications')
          .select('id, job_id, job_title, company_name, candidate_name, candidate_email, candidate_phone, status, match_score, applied_date')
          .order('applied_date', { ascending: false })
          .limit(MAX_EXPORT_ROWS);
        if (error) throw new HttpError(500, 'EXPORT_QUERY_FAILED', 'Failed to export applications.');
        rows = data ?? [];
        columns = [
          { header: 'Application ID', accessor: (r) => r.id },
          { header: 'Job ID', accessor: (r) => r.job_id },
          { header: 'Job Title', accessor: (r) => r.job_title },
          { header: 'Company', accessor: (r) => r.company_name },
          { header: 'Candidate Name', accessor: (r) => r.candidate_name },
          { header: 'Candidate Email', accessor: (r) => r.candidate_email },
          { header: 'Candidate Phone', accessor: (r) => r.candidate_phone },
          { header: 'Status', accessor: (r) => r.status },
          { header: 'Match Score', accessor: (r) => r.match_score },
          { header: 'Applied Date', accessor: (r) => r.applied_date },
        ];
      } else if (dataset === 'candidates') {
        const { data, error } = await ctx.adminClient
          .from('candidates')
          .select('id, full_name, email, phone, city, state, experience_level, years_of_experience, skills, availability, completion_percentage, created_at')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(MAX_EXPORT_ROWS);
        if (error) throw new HttpError(500, 'EXPORT_QUERY_FAILED', 'Failed to export candidates.');
        rows = data ?? [];
        columns = [
          { header: 'Candidate ID', accessor: (r) => r.id },
          { header: 'Full Name', accessor: (r) => r.full_name },
          { header: 'Email', accessor: (r) => r.email },
          { header: 'Phone', accessor: (r) => r.phone },
          { header: 'City', accessor: (r) => r.city },
          { header: 'State', accessor: (r) => r.state },
          { header: 'Experience Level', accessor: (r) => r.experience_level },
          { header: 'Years Experience', accessor: (r) => r.years_of_experience },
          { header: 'Skills', accessor: (r) => r.skills },
          { header: 'Availability', accessor: (r) => r.availability },
          { header: 'Profile Completion %', accessor: (r) => r.completion_percentage },
          { header: 'Created At', accessor: (r) => r.created_at },
        ];
      } else if (dataset === 'employers') {
        const { data, error } = await ctx.adminClient
          .from('employers')
          .select('id, company_name, industry, company_size, location, website, recruiter_name, recruiter_email, verification_status, verified, created_at')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(MAX_EXPORT_ROWS);
        if (error) throw new HttpError(500, 'EXPORT_QUERY_FAILED', 'Failed to export employers.');
        rows = data ?? [];
        columns = [
          { header: 'Employer ID', accessor: (r) => r.id },
          { header: 'Company Name', accessor: (r) => r.company_name },
          { header: 'Industry', accessor: (r) => r.industry },
          { header: 'Company Size', accessor: (r) => r.company_size },
          { header: 'Location', accessor: (r) => r.location },
          { header: 'Website', accessor: (r) => r.website },
          { header: 'Recruiter Name', accessor: (r) => r.recruiter_name },
          { header: 'Recruiter Email', accessor: (r) => r.recruiter_email },
          { header: 'Verification Status', accessor: (r) => r.verification_status },
          { header: 'Verified', accessor: (r) => r.verified },
          { header: 'Created At', accessor: (r) => r.created_at },
        ];
      } else if (dataset === 'hiring_enquiries') {
        const { data, error } = await ctx.adminClient
          .from('hiring_enquiries')
          .select('id, company_name, contact_person, business_email, phone_number, job_title, vacancies, job_location, status, assigned_recruiter, created_at')
          .order('created_at', { ascending: false })
          .limit(MAX_EXPORT_ROWS);
        if (error) throw new HttpError(500, 'EXPORT_QUERY_FAILED', 'Failed to export hiring enquiries.');
        rows = data ?? [];
        columns = [
          { header: 'Enquiry ID', accessor: (r) => r.id },
          { header: 'Company Name', accessor: (r) => r.company_name },
          { header: 'Contact Person', accessor: (r) => r.contact_person },
          { header: 'Business Email', accessor: (r) => r.business_email },
          { header: 'Phone Number', accessor: (r) => r.phone_number },
          { header: 'Job Title', accessor: (r) => r.job_title },
          { header: 'Vacancies', accessor: (r) => r.vacancies },
          { header: 'Location', accessor: (r) => r.job_location },
          { header: 'Status', accessor: (r) => r.status },
          { header: 'Assigned Recruiter', accessor: (r) => r.assigned_recruiter },
          { header: 'Created At', accessor: (r) => r.created_at },
        ];
      } else if (dataset === 'student_progress') {
        const { data, error } = await ctx.adminClient
          .from('course_enrolments')
          .select('user_id, course_id, status, progress_percent, unlocked_module_order, passed_module_quiz_ids, final_assessment_passed, best_final_score_percent, enrolled_at, completed_at')
          .order('enrolled_at', { ascending: false })
          .limit(MAX_EXPORT_ROWS);
        if (error) throw new HttpError(500, 'EXPORT_QUERY_FAILED', 'Failed to export student progress.');
        rows = data ?? [];
        columns = [
          { header: 'User ID', accessor: (r) => r.user_id },
          { header: 'Course ID', accessor: (r) => r.course_id },
          { header: 'Status', accessor: (r) => r.status },
          { header: 'Progress %', accessor: (r) => r.progress_percent },
          { header: 'Unlocked Module Order', accessor: (r) => r.unlocked_module_order },
          { header: 'Passed Module Quizzes', accessor: (r) => r.passed_module_quiz_ids },
          { header: 'Final Assessment Passed', accessor: (r) => r.final_assessment_passed },
          { header: 'Best Final Score %', accessor: (r) => r.best_final_score_percent },
          { header: 'Enrolled At', accessor: (r) => r.enrolled_at },
          { header: 'Completed At', accessor: (r) => r.completed_at },
        ];
      }

      const csvContent = buildSafeCsv(rows, columns);
      const dateStamp = new Date().toISOString().slice(0, 10);
      const filename = `abhi-jobs-${dataset}-${dateStamp}.csv`;

      await writeAdminAuditLog(ctx.adminClient, {
        actorUserId: ctx.user.id,
        actorEmail: ctx.profile.email,
        actorRole: ctx.adminRole,
        action: 'export_csv',
        entityType: dataset,
        entityId: null,
        metadata: { rowCount: rows.length, filename },
        ipHash,
      });

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Export-Row-Count': String(rows.length),
          ...buildCorsHeaders(req),
        },
      });
    }

    // -------------------------------------------------------------------------
    // ACTION: upsert-quiz-config — Learning Admin / Super Admin quiz bank editor
    // -------------------------------------------------------------------------
    if (action === 'upsert-quiz-config') {
      const ctx = await requireAdminRole(req, ['super_admin', 'learning_admin']);
      const config = body.config as Record<string, unknown> | undefined;
      const questions = body.questions as Array<Record<string, unknown>> | undefined;

      if (!config || typeof config.id !== 'string' || typeof config.course_id !== 'string') {
        throw new HttpError(400, 'INVALID_QUIZ_CONFIG', 'Valid quiz config id and course_id are required.');
      }
      if (!Array.isArray(questions) || questions.length === 0 || questions.length > 50) {
        throw new HttpError(400, 'INVALID_QUESTIONS', 'Provide between 1 and 50 questions.');
      }

      const { error: upsertConfigError } = await ctx.adminClient.from('quiz_configs').upsert({
        id: config.id,
        course_id: config.course_id,
        module_id: typeof config.module_id === 'string' ? config.module_id : null,
        assessment_type: config.assessment_type,
        module_order: typeof config.module_order === 'number' ? config.module_order : null,
        title: String(config.title ?? 'Assessment').slice(0, 200),
        description: String(config.description ?? '').slice(0, 1000),
        pass_percentage: Math.min(100, Math.max(40, Number(config.pass_percentage ?? 70))),
        question_count: Math.min(50, Math.max(1, Number(config.question_count ?? questions.length))),
        randomize_order: config.randomize_order !== false,
        required_for_completion: config.required_for_completion !== false,
      });

      if (upsertConfigError) {
        throw new HttpError(400, 'QUIZ_CONFIG_SAVE_FAILED', 'Unable to save quiz configuration.');
      }

      const normalizedQuestions = questions.map((q, idx) => {
        const opts = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [];
        const correctIdx = Number(q.correct_option_index);
        if (opts.length !== 4 || !Number.isInteger(correctIdx) || correctIdx < 0 || correctIdx > 3) {
          throw new HttpError(
            400,
            'INVALID_QUESTION_FORMAT',
            `Question #${idx + 1} must have exactly 4 options and a valid correct_option_index (0-3).`,
          );
        }
        return {
          id: typeof q.id === 'string' && q.id.trim() ? q.id.trim() : `${config.id}_q_${idx + 1}`,
          quiz_config_id: config.id,
          prompt: String(q.prompt ?? '').trim().slice(0, 1000),
          options: opts,
          correct_option_index: correctIdx,
          explanation: String(q.explanation ?? '').trim().slice(0, 1500),
          display_order: idx + 1,
          is_active: q.is_active !== false,
        };
      });

      const { error: upsertQError } = await ctx.adminClient
        .from('quiz_questions')
        .upsert(normalizedQuestions, { onConflict: 'id' });

      if (upsertQError) {
        throw new HttpError(500, 'QUIZ_QUESTIONS_SAVE_FAILED', 'Unable to save quiz questions.');
      }

      await writeAdminAuditLog(ctx.adminClient, {
        actorUserId: ctx.user.id,
        actorEmail: ctx.profile.email,
        actorRole: ctx.adminRole,
        action: 'upsert_quiz_config',
        entityType: 'quiz_configs',
        entityId: config.id,
        metadata: { courseId: config.course_id, questionCount: normalizedQuestions.length },
        ipHash,
      });

      return jsonResponse(req, { success: true, quizConfigId: config.id, savedQuestions: normalizedQuestions.length });
    }

    // -------------------------------------------------------------------------
    // ACTION: revoke-certificate — Revoke a certificate with immutable audit log
    // -------------------------------------------------------------------------
    if (action === 'revoke-certificate') {
      const ctx = await requireAdminRole(req, ['super_admin', 'learning_admin']);
      const certificateId = typeof body.certificateId === 'string' ? body.certificateId.trim().toUpperCase() : '';
      const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

      if (!certificateId) {
        throw new HttpError(400, 'CERTIFICATE_ID_REQUIRED', 'certificateId is required.');
      }

      const { data: updated, error } = await ctx.adminClient
        .from('certificates')
        .update({ status: 'revoked' })
        .eq('certificate_id', certificateId)
        .select('certificate_id, status')
        .maybeSingle();

      if (error || !updated) {
        throw new HttpError(404, 'CERTIFICATE_NOT_FOUND', 'Certificate was not found.');
      }

      await writeAdminAuditLog(ctx.adminClient, {
        actorUserId: ctx.user.id,
        actorEmail: ctx.profile.email,
        actorRole: ctx.adminRole,
        action: 'revoke_certificate',
        entityType: 'certificates',
        entityId: certificateId,
        metadata: { reason },
        ipHash,
      });

      return jsonResponse(req, { success: true, certificateId, status: updated.status });
    }

    // -------------------------------------------------------------------------
    // ACTION: activity-logs — Paginated read of immutable audit logs
    // -------------------------------------------------------------------------
    if (action === 'activity-logs') {
      const ctx = await requireAdminRole(req, ['super_admin', 'read_only_admin']);
      const limit = Math.min(200, Math.max(1, Number(body.limit ?? 50)));
      const offset = Math.max(0, Number(body.offset ?? 0));

      const { data: logs, error } = await ctx.adminClient
        .from('admin_activity_logs')
        .select('id, actor_user_id, actor_email, actor_role, action, entity_type, entity_id, metadata, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new HttpError(500, 'AUDIT_LOGS_FETCH_ERROR', 'Unable to fetch activity logs.');
      }

      return jsonResponse(req, { logs: logs ?? [] });
    }

    throw new HttpError(400, 'UNSUPPORTED_ACTION', 'Unsupported admin-operations action.');
  } catch (err) {
    return errorResponse(req, err);
  }
});
