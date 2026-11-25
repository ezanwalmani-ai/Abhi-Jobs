# ABHI JOBS — Future Firebase Cloud Functions Blueprint (Blaze Upgrade Only)

**Status**: `DEFERRED — REQUIRES FIREBASE BLAZE PLAN UPGRADE AND EXPLICIT PRODUCTION APPROVAL`

This blueprint documents the server-side Cloud Functions (2nd Gen, Node.js 20, TypeScript) designed to activate automatically without schema rewrites if ABHI JOBS later upgrades project `geometric-centaur-c6pck` from Starter (No Cost) to Blaze (Pay-as-you-go).

All functions target the existing named Firestore database:
`ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d`

---

## 1. Planned Cloud Functions Inventory

| Function Name | Trigger Type | Purpose | Replaces Starter-Tier Interim Behavior |
|---|---|---|---|
| `writeAdminAuditLog` | Firestore `onDocumentWritten` on `admin_roles/{uid}`, `employers/{id}`, `jobs/{id}`, `certificate_requests/{id}`, `website_content/{key}`, `public_settings/{key}` | Writes tamper-evident entries to `/admin_activity_logs/{logId}` via Admin SDK | Client writes remain denied; audit log viewer automatically populates |
| `gradeLearningAssessment` | HTTPS Callable (`onCall`, App Check enforced) | Evaluates quiz & final exam submissions against private server-only answer keys in `/course_assessments_private/{id}` and records verified scores | Replaces client-side quiz fallback while preserving existing Firestore assessment documents |
| `issueSignedCertificate` | HTTPS Callable (`onCall`, App Check enforced) | Verifies passing final assessment, generates HMAC-SHA256 signature (`CERTIFICATE_SIGNING_SECRET` in Secret Manager), writes `/public_certificates/{certId}` and `/users/{uid}/certificates/{courseId}` with `issuanceMethod: 'server_hmac'` | Upgrades from `admin_approved` queue to instant cryptographically signed issuance |
| `syncJobApplicantCounters` | Firestore `onDocumentCreated` / `onDocumentDeleted` on `applications/{appId}` | Atomically updates `jobs/{jobId}.applicantsCount` and `platform_metrics/global` | Replaces on-demand `getCountFromServer()` aggregation for high-volume dashboards |
| `submitPublicEnquiry` | HTTPS Request (`onRequest`, App Check + IP rate limit) | Server-validated intake for `/hiring_enquiries` and `/course_enquiries` with Turnstile/reCAPTCHA verification & email notifications | Hardens public create-only rules against spam bursts |
| `getResumeUploadUrl` | HTTPS Callable (`onCall`, authenticated) | Issues short-lived signed Firebase Storage upload/download URLs for optional PDF resumes (with MIME/size checks) | Extends structured JSON resumes with optional binary PDF uploads when paid Storage is approved |

---

## 2. Deployment Prerequisites (Future Blaze Only)

1. Upgrade `geometric-centaur-c6pck` to Blaze with a monthly GCP Budget Alert (recommended initial cap: $5–$10/month).
2. Store secrets in Google Cloud Secret Manager (never in source code):
   - `CERTIFICATE_SIGNING_SECRET`
   - `LEARNING_SIGNING_SECRET`
3. Initialize `functions/` with `firebase-functions/v2` and `firebase-admin/firestore` targeting `getFirestore('ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d')`.
4. Keep existing `firestore.rules` unchanged for `/admin_activity_logs` (`allow write: if false`) because Admin SDK bypasses client rules safely.
