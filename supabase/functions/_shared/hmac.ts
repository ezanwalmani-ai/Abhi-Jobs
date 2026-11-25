/**
 * ABHI JOBS — Cryptographic Signing & Hashing Helpers (Web Crypto)
 * Used by learning-assessments, learning-certificates, and admin-operations.
 *
 * Security notes:
 * - Never embeds fallback secrets in source code.
 * - Fails closed if required signing secrets are unset.
 * - Uses constant-time comparison for signature verification.
 */

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getRequiredSecret(envName: string): string {
  const value = (Deno.env.get(envName) ?? '').trim();
  if (value.length < 24) {
    throw new Error(
      `Server signing configuration error: ${envName} must be configured with at least 24 characters.`,
    );
  }
  return value;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return toHex(digest);
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return toHex(signature);
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  const cleanA = a.trim().toLowerCase();
  const cleanB = b.trim().toLowerCase();
  if (cleanA.length === 0 || cleanA.length !== cleanB.length) return false;
  let diff = 0;
  for (let i = 0; i < cleanA.length; i += 1) {
    diff |= cleanA.charCodeAt(i) ^ cleanB.charCodeAt(i);
  }
  return diff === 0;
}

export interface QuizAttemptSignatureInput {
  attemptId: string;
  userId: string;
  courseId: string;
  assessmentType: 'module_quiz' | 'final_assessment';
  moduleId?: string | null;
  scorePercent: number;
  passed: boolean;
  submittedAt: string;
}

export async function signQuizAttemptReceipt(
  input: QuizAttemptSignatureInput,
): Promise<string> {
  const secret = getRequiredSecret('LEARNING_SIGNING_SECRET');
  const payload = [
    'ATTEMPT_V1',
    input.attemptId,
    input.userId,
    input.courseId,
    input.assessmentType,
    input.moduleId ?? 'FINAL',
    String(input.scorePercent),
    input.passed ? 'PASS' : 'FAIL',
    input.submittedAt,
  ].join('|');

  return hmacSha256Hex(secret, payload);
}

export interface CertificateSignatureInput {
  certificateId: string;
  userId: string;
  courseId: string;
  candidateName: string;
  finalAttemptId: string;
  finalAssessmentScore: number;
  completionDate: string;
}

export async function signCertificateReceipt(
  input: CertificateSignatureInput,
): Promise<string> {
  const secret = getRequiredSecret('CERTIFICATE_SIGNING_SECRET');
  const payload = [
    'CERT_V1',
    input.certificateId,
    input.userId,
    input.courseId,
    input.candidateName.trim(),
    input.finalAttemptId,
    String(input.finalAssessmentScore),
    input.completionDate,
  ].join('|');

  return hmacSha256Hex(secret, payload);
}

export async function verifyCertificateReceipt(
  input: CertificateSignatureInput,
  storedSignature: string,
): Promise<boolean> {
  if (!storedSignature || storedSignature.length < 32) return false;
  const expected = await signCertificateReceipt(input);
  return timingSafeEqualHex(expected, storedSignature);
}
