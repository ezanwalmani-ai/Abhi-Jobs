# Security Summary

**Reviewed Files:** `firestore.rules`, `server/learningStore.ts`, `server/quizBank.ts`, `server/certificateStore.ts`, `server.ts`, `src/services/assessmentService.ts`, `src/services/courseEnrolmentService.ts`, `src/services/certificateService.ts`, `.env.example`

## Issues Resolved

| Area | Issue Found | Fix Implemented |
|---|---|---|
| Firestore Rules (Attempt & Certificate Forgery) | Signed-in students could write directly to `/users/{uid}/assessment_attempts/{attemptId}` with any 32–128 character hex string (`isValidHexSignature` only checked format, not cryptography). That forged passing record satisfied `get()` rules to unlock all modules, mark courses completed, and forge both private and public certificates. | Revoked all direct student writes on `assessment_attempts`, `certificates`, and `public_certificates` (Admin/server-only). Restricted student `course_enrolments` updates strictly to non-authoritative lesson bookmarks (`currentModuleId`, `currentLessonId`, `completedLessonIds`, `status` `'enrolled'\|'in_progress'`, `lastAccessedAt`) while freezing `passedModuleQuizIds`, `unlockedModuleOrder`, `finalAssessmentPassed`, and `progressPercent`. |
| Ephemeral Disk Persistence & Signing Secret Storage | `.learning-data/learning-store.json` and `.learning-data/.signing-key` were written to container disk on Google Cloud Run, which is ephemeral and wiped on restarts, scale-to-zero, and redeployments—causing data loss and cross-instance HMAC key mismatches. | Deleted `.learning-data/` and removed all local disk reads/writes. Enforced fail-closed `LEARNING_SIGNING_SECRET` (or `CERTIFICATE_SIGNING_SECRET`) from environment secrets in production (`NODE_ENV === 'production'`), with an in-memory-only dev fallback and explicit `isProductionDurable: false` diagnostics via a pluggable `LearningStoreAdapter`. |
| Sequential Module & Final Assessment Bypass | `POST /api/learning/assessments/start` verified the student's Firebase UID but did not check whether the requested module quiz was unlocked or whether required lessons and module quizzes were completed before starting the final assessment. | Added server-side prerequisite checks in `POST /api/learning/assessments/start` using `getAuthoritativeCandidateCourseStatus()` to reject locked modules (`403 MODULE_LOCKED`) and premature final assessments (`403 FINAL_ASSESSMENT_LOCKED`). |
| Certificate Issuance Lesson Bypass | `POST /api/learning/certificates/issue` and `issueVerifiedCertificate()` accepted a client-supplied `completedLessonIds` array directly in the issuance payload and wrote it into progress on the spot. | Removed `completedLessonIds` from `IssueCertificateInput`, `POST /api/learning/certificates/issue`, and `issueCourseCertificate()`. Certificate issuance now verifies lesson completion strictly against prior server-recorded progress plus HMAC-verified quiz and final assessment attempts. |
| Public Certificate Verification LocalStorage Bypass | `verifyCertificatePublic()` fell back to browser `localStorage` (`PUBLIC_CERT_CACHE_KEY`), allowing tampered browser state to verify fake certificates. | Removed the `localStorage` fallback completely. Public verification checks only the backend HMAC-verified registry (`/api/learning/certificates/verify/:certificateId`) and read-only Admin/server-written `/public_certificates/{certificateId}`. |
| Unauthenticated Production Admin Passcode Claim | `POST /api/learning/admin/assessments/auth/claim` allowed any unauthenticated caller to claim the admin passcode when `ADMIN_ASSESSMENT_PASSCODE` was unset. | Restricted `/auth/claim` in production (`NODE_ENV === 'production'`) to already-verified Firebase Admin accounts (`403 ADMIN_PASSCODE_CLAIM_RESTRICTED` otherwise), while requiring `ADMIN_ASSESSMENT_PASSCODE` in production environment variables. |

## Safeguards Verified

| Safeguard | Verification |
|---|---|
| Firebase Authentication & UID Binding | Every protected candidate endpoint verifies the RS256 Firebase ID token signature against Google's public x509 keys, checks `aud`, `iss`, `exp`, and `email_verified`, and enforces UID ownership (`401`/`403` on missing, invalid, or mismatched tokens). |
| Answer Key Isolation | Quiz answer keys (`correctOptionIndex`) and explanations remain strictly in server-only modules (`server/quizBank.ts`), never returned in course summaries or started sessions. |
| Server-Side Grading & HMAC Signing | All assessment scores and pass/fail flags are computed strictly on the backend and signed with HMAC-SHA256; `recordServerAttempt()` no longer accepts caller-supplied signatures. |
| Existing ABHI JOBS Features Preserved | Google authentication (`src/lib/firebase.ts`), Career Readiness Assessment (`ProfileEvaluationTest.tsx`, `careerAssessmentEngine.ts`, `/users/{uid}/career_assessments/*`), recruitment database (`supabase/schema.sql`), and job/employer flows remain untouched. No courses, modules, videos, or quizzes were added, and nothing was deployed. |

## PoC Verification

### 1. Forged Hex Signature Attempt in Firestore (Blocked)
- **Attack Vector (Before Fix)**: A signed-in student submits a client Firestore `setDoc` to `/users/{uid}/assessment_attempts/att_fake` with `passed: true`, `scorePercent: 100`, and `verificationSignature: "a".repeat(48)`. Because `isValidHexSignature()` only checked hex formatting, the write succeeded and satisfied `hasPassingFinalAssessmentAttempt()` `get()` checks to forge certificates.
- **Post-Fix Verification**: `firestore.rules` sets `allow create: if isAdmin() ...` on `assessment_attempts`, `certificates`, and `public_certificates`, and freezes `passedModuleQuizIds`, `unlockedModuleOrder`, `finalAssessmentPassed`, and `progressPercent` on `course_enrolments`. Any student write attempt is rejected at the Firestore rule layer.

### 2. Skipping Ahead to Locked Module Quiz or Final Assessment (Blocked)
- **Attack Vector (Before Fix)**: An authenticated student calls `POST /api/learning/assessments/start` with `moduleId: "mod-12"` or `assessmentType: "final_assessment"` before passing Module 1.
- **Post-Fix Verification**: `server.ts` computes `authoritativeStatus = getAuthoritativeCandidateCourseStatus(fbUser.uid, courseId)`. Requesting Module 2+ returns `403` with `code: "MODULE_LOCKED"`; requesting `final_assessment` before all required lessons and module quizzes pass returns `403` with `code: "FINAL_ASSESSMENT_LOCKED"`.

### 3. Self-Reported Lessons on Certificate Issuance (Blocked)
- **Attack Vector (Before Fix)**: A student calls `POST /api/learning/certificates/issue` with `{ courseId, candidateName, completedLessonIds: ["l1", "l2"] }` without prior server-side lesson progress.
- **Post-Fix Verification**: `issueVerifiedCertificate()` no longer accepts `completedLessonIds` and rejects issuance with `403` and `missingRequirements` unless prior server-recorded progress and HMAC-verified attempts satisfy all 3 requirements.

### 4. Forged Public Certificate via Tampered Browser Storage (Blocked)
- **Attack Vector (Before Fix)**: Injecting a fake record under `abhijobs_public_cert_index_v1` in `localStorage` caused `verifyCertificatePublic()` to report `valid: true`.
- **Post-Fix Verification**: `PUBLIC_CERT_CACHE_KEY` and `readPublicVerificationProjection()` were removed from `src/services/certificateService.ts`. Unknown IDs return `{ found: false, valid: false, status: "not_found" }`.

### 5. Unauthenticated Admin Passcode Takeover in Production (Blocked)
- **Attack Vector (Before Fix)**: Calling `POST /api/learning/admin/assessments/auth/claim` without authentication when `ADMIN_ASSESSMENT_PASSCODE` was unset allowed an attacker to claim admin access.
- **Post-Fix Verification**: In `NODE_ENV=production`, unauthenticated calls to `/auth/claim` return `403` (`code: "ADMIN_PASSCODE_CLAIM_RESTRICTED"`).

### 6. Production Missing Signing Secret (Fail-Closed)
- **Attack Vector (Before Fix)**: When `LEARNING_SIGNING_SECRET` was unset, the server wrote a random `.learning-data/.signing-key` to ephemeral container disk, breaking verification across Cloud Run instances.
- **Post-Fix Verification**: With `NODE_ENV=production` and `LEARNING_SIGNING_SECRET` unset, `signAssessmentAttemptReceipt()` and `signCertificateReceipt()` throw `SIGNING_SECRET_NOT_CONFIGURED` (handled as HTTP `503` in `server.ts`), and `/.learning-data` no longer exists on disk.
