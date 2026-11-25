/**
 * ABHI JOBS — Origin-Validated CORS & Safe JSON Response Helpers
 * Used across all Supabase Edge Functions.
 *
 * Security notes:
 * - Never returns wildcard "*" on authenticated endpoints.
 * - Reads allowed origins from the ALLOWED_ORIGINS secret (comma-separated).
 * - Always sets Vary: Origin and standard security headers.
 */

const DEFAULT_ALLOWED_ORIGINS = [
  'https://abhijobs.netlify.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getAllowedOrigins(): string[] {
  const configured = Deno.env.get('ALLOWED_ORIGINS') ?? '';
  const parsed = configured
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS;
}

export interface CorsOptions {
  allowPublicRead?: boolean;
  allowedMethods?: string[];
}

export function buildCorsHeaders(
  req: Request,
  options: CorsOptions = {},
): Record<string, string> {
  const requestOrigin = (req.headers.get('origin') ?? '').trim().replace(/\/+$/, '');
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin = requestOrigin.length > 0 && allowedOrigins.includes(requestOrigin);

  const allowOrigin = isAllowedOrigin
    ? requestOrigin
    : options.allowPublicRead
      ? '*'
      : allowedOrigins[0];

  const methods = options.allowedMethods ?? ['GET', 'POST', 'OPTIONS'];

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  };

  if (allowOrigin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

export function isOriginAuthorized(req: Request, options: CorsOptions = {}): boolean {
  if (options.allowPublicRead) return true;
  const requestOrigin = (req.headers.get('origin') ?? '').trim().replace(/\/+$/, '');
  // Non-browser server-to-server calls without an Origin header are permitted
  // (still subject to strict Bearer JWT & RBAC checks).
  if (!requestOrigin) return true;
  return getAllowedOrigins().includes(requestOrigin);
}

export function handleCorsPreflight(
  req: Request,
  options: CorsOptions = {},
): Response | null {
  if (req.method !== 'OPTIONS') return null;

  if (!isOriginAuthorized(req, options)) {
    return new Response(
      JSON.stringify({ error: 'Origin not permitted.', code: 'CORS_ORIGIN_FORBIDDEN' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...buildCorsHeaders(req, options),
        },
      },
    );
  }

  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(req, options),
  });
}

export function jsonResponse(
  req: Request,
  payload: unknown,
  status = 200,
  options: CorsOptions = {},
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...buildCorsHeaders(req, options),
      ...extraHeaders,
    },
  });
}
