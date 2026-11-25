/**
 * ABHI JOBS — Typed Client for Supabase Edge Functions (Phase 2B Prepared)
 *
 * Connects the React SPA to:
 * - learning-assessments
 * - learning-certificates
 * - admin-operations
 * - public-enquiries
 *
 * Security notes:
 * - Uses ONLY public SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY + caller's session JWT.
 * - Never sends or stores service-role / secret keys in the browser.
 * - Safe to keep alongside existing Firebase/Express flows until Phase 5 cutover.
 */

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../lib/supabase';
import { getSupabaseAccessToken, type AdminRoleName } from './supabaseAuthService';

export type EdgeExportDataset =
  | 'jobs'
  | 'applications'
  | 'candidates'
  | 'employers'
  | 'hiring_enquiries'
  | 'student_progress';

export interface EdgeErrorPayload {
  error?: string;
  code?: string;
}

function getEdgeFunctionUrl(functionName: string): string {
  const base = SUPABASE_URL.replace(/\/+$/, '');
  return `${base}/functions/v1/${functionName}`;
}

async function invokeJsonEdgeFunction<TResponse>(
  functionName: string,
  payload: Record<string, unknown>,
  options: { requireAuth?: boolean } = {},
): Promise<TResponse> {
  const token = await getSupabaseAccessToken();
  if (options.requireAuth && !token) {
    throw new Error('Please sign in with your verified account to continue.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_PUBLISHABLE_KEY,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(getEdgeFunctionUrl(functionName), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as TResponse & EdgeErrorPayload;
  if (!res.ok) {
    throw new Error(data.error || `Request to ${functionName} failed (${res.status}).`);
  }
  return data;
}

// -----------------------------------------------------------------------------
// Learn with ABHI — Assessments
// -----------------------------------------------------------------------------
export function getCourseAssessmentsSummaryViaEdge(courseId: string) {
  return invokeJsonEdgeFunction<{ quizzes: Record<string, unknown>[] }>(
    'learning-assessments',
    { action: 'summary', courseId },
    { requireAuth: true },
  );
}

export function startAssessmentViaEdge(params: {
  courseId: string;
  assessmentType: 'module_quiz' | 'final_assessment';
  moduleId?: string | null;
}) {
  return invokeJsonEdgeFunction<{
    sessionId: string;
    quizConfigId: string;
    title: string;
    description: string;
    passPercentage: number;
    expiresAt: string;
    questions: Array<{ id: string; prompt: string; options: string[] }>;
  }>('learning-assessments', { action: 'start', ...params }, { requireAuth: true });
}

export function submitAssessmentViaEdge(params: {
  sessionId: string;
  answers: Record<string, number>;
}) {
  return invokeJsonEdgeFunction<{
    attempt: Record<string, unknown>;
    enrolment: Record<string, unknown> | null;
  }>('learning-assessments', { action: 'submit', ...params }, { requireAuth: true });
}

export function getMyQuizAttemptsViaEdge(courseId?: string) {
  return invokeJsonEdgeFunction<{ attempts: Record<string, unknown>[] }>(
    'learning-assessments',
    { action: 'mine', courseId },
    { requireAuth: true },
  );
}

// -----------------------------------------------------------------------------
// Learn with ABHI — Certificates
// -----------------------------------------------------------------------------
export function issueCertificateViaEdge(courseId: string) {
  return invokeJsonEdgeFunction<{
    certificate: Record<string, unknown>;
    alreadyIssued: boolean;
  }>('learning-certificates', { action: 'issue', courseId }, { requireAuth: true });
}

export function getMyCertificatesViaEdge() {
  return invokeJsonEdgeFunction<{ certificates: Record<string, unknown>[] }>(
    'learning-certificates',
    { action: 'mine' },
    { requireAuth: true },
  );
}

export function verifyCertificateViaEdge(certificateId: string) {
  return invokeJsonEdgeFunction<{
    valid: boolean;
    certificate: {
      certificateId: string;
      candidateName: string;
      courseTitle: string;
      issueDate: string;
      status: string;
    } | null;
  }>('learning-certificates', { action: 'verify', certificateId }, { requireAuth: false });
}

// -----------------------------------------------------------------------------
// Central Admin Panel (/abhi-control-center) — Admin Operations
// -----------------------------------------------------------------------------
export function checkAdminAuthStatusViaEdge() {
  return invokeJsonEdgeFunction<{
    authenticated: boolean;
    userId: string;
    email: string;
    fullName: string;
    role: AdminRoleName;
    isSuperAdmin: boolean;
    privateRoute: string;
  }>('admin-operations', { action: 'auth-status' }, { requireAuth: true });
}

export function listAdminRolesViaEdge() {
  return invokeJsonEdgeFunction<{ roles: Record<string, unknown>[] }>(
    'admin-operations',
    { action: 'list-roles' },
    { requireAuth: true },
  );
}

export function grantAdminRoleViaEdge(params: {
  targetEmail: string;
  role: AdminRoleName;
  notes?: string;
}) {
  return invokeJsonEdgeFunction<{ success: boolean; userId: string; role: AdminRoleName }>(
    'admin-operations',
    { action: 'grant-role', ...params },
    { requireAuth: true },
  );
}

export function revokeAdminRoleViaEdge(targetUserId: string) {
  return invokeJsonEdgeFunction<{ success: boolean; userId: string }>(
    'admin-operations',
    { action: 'revoke-role', targetUserId },
    { requireAuth: true },
  );
}

export function fetchAdminActivityLogsViaEdge(limit = 50, offset = 0) {
  return invokeJsonEdgeFunction<{ logs: Record<string, unknown>[] }>(
    'admin-operations',
    { action: 'activity-logs', limit, offset },
    { requireAuth: true },
  );
}

export async function exportAdminCsvViaEdge(dataset: EdgeExportDataset): Promise<{
  blob: Blob;
  filename: string;
  rowCount: number;
}> {
  const token = await getSupabaseAccessToken();
  if (!token) {
    throw new Error('Super Admin authentication is required to export CSV data.');
  }

  const res = await fetch(getEdgeFunctionUrl('admin-operations'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: 'export-csv', dataset }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as EdgeErrorPayload;
    throw new Error(errBody.error || `CSV export failed (${res.status}).`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') ?? '';
  const match = /filename="([^"]+)"/i.exec(disposition);
  const filename = match?.[1] || `abhi-jobs-${dataset}.csv`;
  const rowCount = Number(res.headers.get('x-export-row-count') ?? 0);

  return { blob, filename, rowCount };
}

// -----------------------------------------------------------------------------
// Public Enquiries (Hiring & Course)
// -----------------------------------------------------------------------------
export function submitHiringEnquiryViaEdge(payload: {
  companyName: string;
  contactPerson: string;
  businessEmail: string;
  phoneNumber?: string;
  jobTitle: string;
  vacancies: number;
  jobLocation: string;
  additionalRequirements?: string;
}) {
  return invokeJsonEdgeFunction<{ submitted: boolean; enquiryId: string }>(
    'public-enquiries',
    { type: 'hiring', ...payload },
    { requireAuth: false },
  );
}

export function submitCourseEnquiryViaEdge(payload: {
  courseId: string;
  courseTitle: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
}) {
  return invokeJsonEdgeFunction<{ submitted: boolean; enquiryId: string }>(
    'public-enquiries',
    { type: 'course', ...payload },
    { requireAuth: false },
  );
}
