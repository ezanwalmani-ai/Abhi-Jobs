/**
 * ABHI JOBS — Server-Side Authentication, RBAC & Audit Logging Helpers
 * Used across all Supabase Edge Functions.
 *
 * Security notes:
 * - Reads SUPABASE_URL and SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY strictly from Deno.env.
 * - Verifies caller JWTs via Supabase Auth (never trusts client-supplied user IDs or roles).
 * - Enforces active profile + verified email + active admin_roles row for every admin action.
 * - Never exposes raw internal stack traces or secrets in HTTP responses.
 */

import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { jsonResponse, type CorsOptions } from './cors.ts';
import { sha256Hex } from './hmac.ts';

export type AdminRoleName =
  | 'super_admin'
  | 'job_admin'
  | 'recruitment_admin'
  | 'learning_admin'
  | 'content_admin'
  | 'read_only_admin';

export const ALL_ADMIN_ROLES: AdminRoleName[] = [
  'super_admin',
  'job_admin',
  'recruitment_admin',
  'learning_admin',
  'content_admin',
  'read_only_admin',
];

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function createAdminClient(): SupabaseClient {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') ?? '').trim();
  const secretKey = (
    Deno.env.get('SUPABASE_SECRET_KEY') ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    ''
  ).trim();

  if (!supabaseUrl || !secretKey) {
    throw new HttpError(
      500,
      'SERVER_CONFIG_MISSING',
      'Supabase server credentials are not configured for this Edge Function.',
    );
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function extractBearerToken(req: Request): string {
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Missing or invalid Authorization Bearer token.');
  }
  const token = authHeader.slice(7).trim();
  if (!token || token.length < 20) {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Authorization token is malformed.');
  }
  return token;
}

export interface AuthenticatedContext {
  user: User;
  profile: {
    id: string;
    email: string;
    full_name: string;
    account_type: string;
    status: string;
  };
  adminClient: SupabaseClient;
}

export async function requireAuthenticatedUser(
  req: Request,
  options: { requireEmailVerified?: boolean } = {},
): Promise<AuthenticatedContext> {
  const token = extractBearerToken(req);
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data?.user) {
    throw new HttpError(401, 'INVALID_SESSION', 'Your session is invalid or has expired.');
  }

  const user = data.user;
  if (options.requireEmailVerified && !user.email_confirmed_at) {
    throw new HttpError(
      403,
      'EMAIL_NOT_VERIFIED',
      'Email verification is required before accessing this resource.',
    );
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, email, full_name, account_type, status, deleted_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(500, 'PROFILE_LOOKUP_FAILED', 'Unable to verify user profile.');
  }

  if (!profile) {
    throw new HttpError(403, 'PROFILE_MISSING', 'User profile has not been initialized.');
  }

  if (profile.status !== 'active' || profile.deleted_at) {
    throw new HttpError(403, 'ACCOUNT_INACTIVE', 'This account is suspended or inactive.');
  }

  return {
    user,
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      account_type: profile.account_type,
      status: profile.status,
    },
    adminClient,
  };
}

export interface AdminContext extends AuthenticatedContext {
  adminRole: AdminRoleName;
}

export async function requireAdminRole(
  req: Request,
  allowedRoles: AdminRoleName[] = ALL_ADMIN_ROLES,
): Promise<AdminContext> {
  // Always require verified email for every administrative operation
  const authCtx = await requireAuthenticatedUser(req, { requireEmailVerified: true });

  const { data: roleRow, error: roleError } = await authCtx.adminClient
    .from('admin_roles')
    .select('role, is_active')
    .eq('user_id', authCtx.user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (roleError) {
    throw new HttpError(500, 'RBAC_LOOKUP_FAILED', 'Unable to verify administrator privileges.');
  }

  if (!roleRow || !allowedRoles.includes(roleRow.role as AdminRoleName)) {
    throw new HttpError(
      403,
      'ADMIN_FORBIDDEN',
      'You do not have sufficient administrator privileges for this action.',
    );
  }

  return {
    ...authCtx,
    adminRole: roleRow.role as AdminRoleName,
  };
}

export async function getClientIpHash(req: Request): Promise<string | null> {
  const forwarded = req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? '';
  const firstIp = forwarded.split(',')[0]?.trim();
  if (!firstIp) return null;
  const salt = Deno.env.get('LEARNING_SIGNING_SECRET') ?? 'abhi-ip-hash';
  return (await sha256Hex(`${salt}:${firstIp}`)).slice(0, 32);
}

export interface AuditLogInput {
  actorUserId: string;
  actorEmail: string;
  actorRole: AdminRoleName;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipHash?: string | null;
}

export async function writeAdminAuditLog(
  adminClient: SupabaseClient,
  entry: AuditLogInput,
): Promise<void> {
  const { error } = await adminClient.from('admin_activity_logs').insert({
    actor_user_id: entry.actorUserId,
    actor_email: entry.actorEmail,
    actor_role: entry.actorRole,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
    ip_hash: entry.ipHash ?? null,
  });

  if (error) {
    // Log sanitized operational diagnostic server-side; never expose DB error to caller
    console.error('[admin-audit] failed to record audit log:', entry.action, error.code);
  }
}

export function errorResponse(
  req: Request,
  err: unknown,
  corsOptions: CorsOptions = {},
): Response {
  if (err instanceof HttpError) {
    return jsonResponse(
      req,
      { error: err.message, code: err.code },
      err.status,
      corsOptions,
    );
  }

  console.error('[edge-function] unhandled error:', err instanceof Error ? err.message : 'unknown');
  return jsonResponse(
    req,
    { error: 'An unexpected server error occurred.', code: 'INTERNAL_SERVER_ERROR' },
    500,
    corsOptions,
  );
}
