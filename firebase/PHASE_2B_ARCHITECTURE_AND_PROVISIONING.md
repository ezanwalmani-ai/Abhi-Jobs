# ABHI JOBS — Phase 2B Starter-Tier Firebase Architecture & Provisioning Guide

**Firebase Project ID:** `geometric-centaur-c6pck`  
**Firestore Named Database ID:** `ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d`  
**Hosting:** Netlify (preserved — SPA fallback prepared locally in `netlify.toml`, not deployed)  
**Billing Tier:** Firebase Starter Tier (No Cost — zero paid services enabled)

---

## 1. Secure Manual Super Admin Provisioning (`ezanwalmani@gmail.com`)

**Zero Client-Side Privilege Escalation Policy:**  
ABHI JOBS does **NOT** provide any signup button, API route, URL parameter, `localStorage` flag, or client-side self-registration flow that creates or promotes an administrator.

### Step-by-Step Manual Provisioning Procedure (Execute Only When Ready for Cutover)

1. **Verify the Firebase Authentication Account**
   - Open Firebase Console -> Project `geometric-centaur-c6pck` -> **Authentication** -> **Users**.
   - Confirm that the account `ezanwalmani@gmail.com` exists via a trusted sign-in provider (Google Sign-In or verified Email/Password) and that **Email Verified** is `true`.
   - Copy the exact **User UID** (e.g., `<SUPER_ADMIN_UID>`). Do not guess or fabricate a UID.

2. **Open the Correct Named Firestore Database**
   - Navigate to **Firestore Database** in Firebase Console.
   - Use the database selector dropdown to select the named database:  
     `ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d`  
     *(CRITICAL: Do NOT create the document in `(default)`.)*

3. **Create the Root Super Admin Role Document Manually**
   - Collection ID: `admin_roles`
   - Document ID: `<SUPER_ADMIN_UID>` (must match the Firebase Auth UID exactly)
   - Fields:
     - `uid` (`string`): `"<SUPER_ADMIN_UID>"`
     - `email` (`string`): `"ezanwalmani@gmail.com"`
     - `displayName` (`string`): `"Abhi Super Admin"`
     - `role` (`string`): `"super_admin"`
     - `status` (`string`): `"active"`
     - `assignedBy` (`string`): `"<SUPER_ADMIN_UID>"`
     - `assignedAt` (`timestamp`): current server timestamp
     - `updatedAt` (`timestamp`): current server timestamp
     - `notes` (`string`): `"Initial manual Super Admin provisioning via Firebase Console"`

4. **Assigning Additional Staff Admins Later (5-Role RBAC)**
   - Once the Super Admin is authenticated with a verified token on `/abhi-control-center`, ONLY an active `super_admin` may create or update `/admin_roles/{staffUid}` documents for:
     - `super_admin` — Full platform, RBAC management, metrics snapshots, CSV export, all module overrides
     - `recruitment_admin` — Employer verification/rejection/suspension, job moderation & featuring, application/interview oversight, hiring enquiries
     - `course_admin` — Learn with ABHI courses, modules, lessons, quiz configs, certificate templates, course enquiries, and Admin-Approved Certificate Issuance
     - `content_admin` — Website CMS blocks (`/website_content`) and public site settings (`/public_settings`)
     - `support_admin` — Read-only troubleshooting across users, candidates, employers, applications, interviews, certificate requests; user status moderation (`active`/`suspended`); enquiry triage
   - Revoking an admin sets `status: "revoked"` (deletes are disabled on `/admin_roles/{uid}` so role history is retained, and a Super Admin cannot accidentally revoke their own active `super_admin` document).

5. **Bootstrap Email Guard Note**
   - `firestore.rules` retains `isBootstrapSuperAdmin()` strictly gated on `request.auth.token.email_verified == true && request.auth.token.email == 'ezanwalmani@gmail.com'` so existing Learn with ABHI admin access is never interrupted during transition. Once `/admin_roles/<SUPER_ADMIN_UID>` is verified in production, the email fallback can optionally be removed in a future tightening pass.

---

## 2. Client SDK vs. Cloud Functions Operational Boundary

### A. Safe to Operate via Firebase Client SDK + Hardened Firestore Security Rules (Starter Tier — $0/mo)

| Operation | Firestore Path(s) | Security Enforcement |
|---|---|---|
| Google & Email/Password Auth + Email Verification | Firebase Auth | Firebase Auth identity + `request.auth.token.email_verified == true` enforced on writes |
| Candidate Profile Management | `/candidates/{uid}` | Strict owner-only CRUD + `recruitment_admin`/`support_admin`/`super_admin` read; zero public access |
| Opt-In Non-PII Talent Discovery Card | `/candidate_directory/{uid}` | Strict schema with zero PII (`email`/`phone`/`dob`/resume forbidden); readable only by verified employers & recruitment/super admins |
| Structured JSON Resume Builder (Multi-Resume + client `jsPDF` export) | `/users/{userId}/resumes/{resumeId}` | Strictly owner-only CRUD; zero public or employer access |
| Saved Jobs & Recently Viewed History | `/users/{userId}/saved_jobs/{jobId}`, `/users/{userId}/recently_viewed/{jobId}` | Strictly owner-only CRUD |
| Employer Registration & Profile Edits | `/employers/{employerId}`, `/employers/{employerId}/private_contacts/{contactId}` | Forced `verificationStatus: 'pending'` on create; self-approval blocked; recruiter PII isolated in private subcollection |
| Employer Verification & Job Moderation | `/employers/{employerId}`, `/jobs/{jobId}` | Strictly `recruitment_admin` / `super_admin` |
| Job Publishing & Management | `/jobs/{jobId}` | Only verified employers (`isVerifiedEmployer()`) or `recruitment_admin` can publish; candidates have zero write access; counters locked |
| Job Applications & Candidate Withdrawal | `/applications/{applicationId}` | Candidate creates `'Applied'` against verified published job (`get()` check); can only withdraw; employer updates pipeline only |
| Recruiter Internal Notes | `/applications/{applicationId}/internal_notes/{noteId}` | Master Gate via parent application; strictly owning employer or `recruitment_admin`/`super_admin`; invisible to candidates |
| Interview Scheduling | `/interviews/{interviewId}` | Created/updated only by owning employer of parent application or `recruitment_admin`/`super_admin`; candidate read-only |
| Website CMS & Public Site Settings | `/website_content/{contentKey}`, `/public_settings/{settingKey}` | Public read of published content; writes restricted to `content_admin` / `super_admin` |
| Public Hiring & Course Enquiries | `/hiring_enquiries/{enquiryId}`, `/course_enquiries/{enquiryId}` | Public create-only with `status: 'New'` and strict size caps; zero public read; admin triage only |
| Learn with ABHI Curriculum, Enrolments & Video Progress | `/learning_courses/*`, `/users/{uid}/course_enrolments/*`, `/users/{uid}/video_progress/*` | Existing rules preserved; students update lesson bookmarks/playback only; zero answer-key access |
| **Admin-Approved Certificate Issuance (Interim)** | `/certificate_requests/{requestId}` -> `/users/{uid}/certificates/{courseId}` + `/public_certificates/{certificateId}` | Student submits `pending` request (must be enrolled); `course_admin`/`super_admin` reviews & atomically issues `issuanceMethod: 'admin_approved'` cert |
| Live Dashboard Counters & Super Admin CSV Export | Firestore `getCountFromServer()` + client RFC 4180 CSV generation | Zero client-writable counters; CSV export queries require `super_admin` authorization in Firestore rules |

### B. MUST Wait for Cloud Functions / Trusted Backend (Requires Blaze Tier Upgrade Later)

| Operation | Why Client SDK Cannot Safely Perform It | Starter-Tier Interim Posture |
|---|---|---|
| **Trusted, Tamper-Proof Admin Activity Audit Logs** | A browser with admin credentials could omit, fabricate, or selectively skip writing logs. Browser-written logs are NOT tamper-proof. | `/admin_activity_logs/{logId}` has **`allow create, update, delete: if false;`** in `firestore.rules`. Deferred until Cloud Functions writes logs server-side. |
| **Automated Server-Graded Quizzes & Final Exams** | Answer keys live in admin-only `/learning_courses/{courseId}/quiz_configs/{quizId}`. Moving answer keys to the client would allow trivial cheating. | Answer keys remain strictly hidden from students. Automated grading deferred until Cloud Functions. |
| **Automated HMAC-SHA256 Signed Certificates** | Signing secrets (`HMAC_SECRET`) must NEVER ship to browser JavaScript bundles. | Use **Admin-Approved Certificate Issuance** (`issuanceMethod: 'admin_approved'`). Existing HMAC-signed certificates and public verification remain 100% preserved. |
| **Binary File Uploads (PDF/DOCX Resumes, Company Logos, Signed URLs)** | Firebase Cloud Storage buckets (`*.firebasestorage.app`) require Blaze billing (`402`/`403` on Starter tier). Storing raw binaries in Firestore violates 1MB limits & performance. | Structured JSON resumes in `/users/{uid}/resumes/{resumeId}` + client-side PDF export (`jsPDF`). Binary uploads deferred until Blaze Storage. |
| **Server-Side Job Applicant & View Counters** | Candidates must NEVER write to `/jobs/{jobId}` (prevents counter tampering). | Use live `getCountFromServer()` on `/applications` where `jobId == X` (for admins/employers) rather than client-incremented counters. |
| **Server-Side Email Notifications & Automated Alerts** | SMTP/transactional email credentials cannot live in browser code. | In-app `/users/{uid}/notifications` (admin-created) + manual email follow-up until Cloud Functions. |
| **IP-Based Abuse Rate Limiting & Anti-Spam on Public Enquiries** | Firestore Security Rules cannot inspect client IP addresses or enforce sliding-window rate limits per IP. | Strict payload size caps + future Firebase App Check (reCAPTCHA v3, free on Starter tier) in Phase 3; IP rate limiting deferred to Cloud Functions. |
| **Custom Auth Claims & Server-Side User Deletion / Token Revocation** | Firebase Admin SDK IAM operations are unavailable on Starter tier. | Role checks read `/admin_roles/{uid}` directly in `firestore.rules`; suspension uses `/users/{uid}.status == 'suspended'` + role revocation. |

---

## 3. Admin-Approved Certificate Issuance (Interim Starter-Tier Workflow)

1. Candidate completes lessons/study in a Learn with ABHI course (existing `/users/{uid}/course_enrolments/{courseId}` tracks `completedLessonIds` and `video_progress`).
2. Candidate submits a completion review request into `/certificate_requests/{requestId}` (`status: 'pending'`, `userId == request.auth.uid`), which Firestore Rules verify against an existing enrolment document (`exists(/users/$(uid)/course_enrolments/$(courseId))`).
3. A `course_admin` or `super_admin` inspects the candidate's enrolment & progress in `/abhi-control-center` and either:
   - **Approves**: Runs an atomic `writeBatch` creating `/public_certificates/{certificateId}`, `/users/{uid}/certificates/{courseId}` (explicitly tagged `issuanceMethod: 'admin_approved'`, `approvedBy: adminUid`), updating `/certificate_requests/{requestId}` to `status: 'approved'`, and marking `/users/{uid}/course_enrolments/{courseId}` `status: 'completed'`.
   - **Rejects**: Updates `/certificate_requests/{requestId}` to `status: 'rejected'` with `reviewNote`.
4. **Honesty & Compatibility Guarantee:**
   - Admin-approved certificates are explicitly labeled `issuanceMethod: 'admin_approved'` (never masquerading as HMAC-signed server certificates).
   - All existing `server_hmac` certificates and `/public_certificates/{certificateId}` single-document verification lookups remain 100% intact and untouched.

---

## 4. Recommended DevDependencies Requiring Your Approval Before Local Automated Rule Testing

Per Phase 2B restrictions, **no packages were installed**. Before deploying `firestore.rules` to production, we recommend approving installation of these dev-only packages for automated local validation:

1. `eslint` + `@firebase/eslint-plugin-security-rules` — Runs Firebase's official static security analyzer over `firestore.rules`.
2. `@firebase/rules-unit-testing` — Runs automated pass/fail assertions for all 16 Dirty Dozen attack payloads against the local Firebase Firestore Emulator (`firebase emulators:exec`).
