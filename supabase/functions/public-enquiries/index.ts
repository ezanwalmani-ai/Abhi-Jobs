/**
 * ABHI JOBS — Edge Function: public-enquiries
 * Validated, spam-protected submission endpoint for Hiring Enquiries and Course Enquiries.
 *
 * Security guarantees:
 * - Eliminates the need for permissive anonymous INSERT policies on database tables.
 * - Enforces field length bounds, email format validation, honeypot check, and
 *   per-email rate limiting (max 5 submissions per 10 minutes).
 * - Optionally associates `submitted_by` when a valid Supabase Bearer JWT is provided.
 */

import {
  createAdminClient,
  errorResponse,
  HttpError,
} from '../_shared/auth.ts';
import {
  handleCorsPreflight,
  isOriginAuthorized,
  jsonResponse,
} from '../_shared/cors.ts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;

function cleanText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

async function resolveOptionalUserId(
  req: Request,
  adminClient: ReturnType<typeof createAdminClient>,
): Promise<string | null> {
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const { data } = await adminClient.auth.getUser(token);
  return data?.user?.id ?? null;
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

    // Silent honeypot check for automated form bots
    if (typeof body.website_honeypot === 'string' && body.website_honeypot.trim().length > 0) {
      return jsonResponse(req, { submitted: true }, 200);
    }

    const type = typeof body.type === 'string' ? body.type.trim() : '';
    const adminClient = createAdminClient();
    const submittedBy = await resolveOptionalUserId(req, adminClient);
    const windowStartIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    if (type === 'hiring') {
      const companyName = cleanText(body.companyName, 160);
      const contactPerson = cleanText(body.contactPerson, 120);
      const businessEmail = cleanText(body.businessEmail, 160).toLowerCase();
      const phoneNumber = cleanText(body.phoneNumber, 40);
      const jobTitle = cleanText(body.jobTitle, 160);
      const jobLocation = cleanText(body.jobLocation, 160);
      const additionalRequirements = cleanText(body.additionalRequirements, 3000);
      const vacancies = Number(body.vacancies ?? 1);

      if (!companyName || !contactPerson || !jobTitle || !jobLocation) {
        throw new HttpError(400, 'REQUIRED_FIELDS_MISSING', 'Please fill in all required hiring enquiry fields.');
      }
      if (!EMAIL_REGEX.test(businessEmail)) {
        throw new HttpError(400, 'INVALID_EMAIL', 'Please provide a valid business email address.');
      }
      if (!Number.isInteger(vacancies) || vacancies < 1 || vacancies > 5000) {
        throw new HttpError(400, 'INVALID_VACANCIES', 'Vacancies must be an integer between 1 and 5000.');
      }

      const { count } = await adminClient
        .from('hiring_enquiries')
        .select('id', { count: 'exact', head: true })
        .eq('business_email', businessEmail)
        .gte('created_at', windowStartIso);

      if ((count ?? 0) >= MAX_SUBMISSIONS_PER_WINDOW) {
        throw new HttpError(429, 'RATE_LIMITED', 'Too many enquiries submitted recently. Please try again later.');
      }

      const { data: inserted, error } = await adminClient
        .from('hiring_enquiries')
        .insert({
          submitted_by: submittedBy,
          company_name: companyName,
          contact_person: contactPerson,
          business_email: businessEmail,
          phone_number: phoneNumber,
          job_title: jobTitle,
          vacancies,
          job_location: jobLocation,
          additional_requirements: additionalRequirements,
          status: 'New',
        })
        .select('id')
        .single();

      if (error || !inserted) {
        throw new HttpError(500, 'ENQUIRY_SAVE_FAILED', 'Unable to submit your hiring enquiry right now.');
      }

      return jsonResponse(req, { submitted: true, enquiryId: inserted.id }, 201);
    }

    if (type === 'course') {
      const courseId = cleanText(body.courseId, 120);
      const courseTitle = cleanText(body.courseTitle, 200);
      const name = cleanText(body.name, 120);
      const email = cleanText(body.email, 160).toLowerCase();
      const phone = cleanText(body.phone, 40);
      const message = cleanText(body.message, 2000);

      if (!courseId || !courseTitle || !name) {
        throw new HttpError(400, 'REQUIRED_FIELDS_MISSING', 'Please fill in all required course enquiry fields.');
      }
      if (!EMAIL_REGEX.test(email)) {
        throw new HttpError(400, 'INVALID_EMAIL', 'Please provide a valid email address.');
      }

      const { count } = await adminClient
        .from('course_enquiries')
        .select('id', { count: 'exact', head: true })
        .eq('email', email)
        .gte('created_at', windowStartIso);

      if ((count ?? 0) >= MAX_SUBMISSIONS_PER_WINDOW) {
        throw new HttpError(429, 'RATE_LIMITED', 'Too many enquiries submitted recently. Please try again later.');
      }

      const { data: inserted, error } = await adminClient
        .from('course_enquiries')
        .insert({
          submitted_by: submittedBy,
          course_id: courseId,
          course_title: courseTitle,
          name,
          email,
          phone,
          message,
          status: 'New',
        })
        .select('id')
        .single();

      if (error || !inserted) {
        throw new HttpError(500, 'ENQUIRY_SAVE_FAILED', 'Unable to submit your course enquiry right now.');
      }

      return jsonResponse(req, { submitted: true, enquiryId: inserted.id }, 201);
    }

    throw new HttpError(400, 'INVALID_ENQUIRY_TYPE', 'Enquiry type must be "hiring" or "course".');
  } catch (err) {
    return errorResponse(req, err);
  }
});
