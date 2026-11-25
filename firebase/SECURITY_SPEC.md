# ABHI JOBS — Firebase Phase 2B Security Specification & Red Team Audit

**Project ID:** `geometric-centaur-c6pck`  
**Firestore Named Database ID:** `ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d`  
**Billing Tier:** Firebase Starter Tier (No Cost)  
**Status:** Local Preparation Only (Not Deployed)

---

## 1. Core Data Invariants (Master Source of Truth)

1. **Identity & Role Integrity (`/admin_roles/{uid}` & `/users/{userId}`)**
   - Admin authority NEVER comes from `localStorage`, client UI state, or `/users/{userId}.role`.
   - Admin roles are resolved strictly from verified Firebase Auth (`request.auth.token.email_verified == true`) combined with `/admin_roles/{request.auth.uid}` (`status == 'active'`) or the verified bootstrap Super Admin email `ezanwalmani@gmail.com` (plus read-only compatibility with legacy `/admins/{uid}` for existing Learn with ABHI operations).
   - No user can create, update, or escalate their own entry in `/admin_roles/{uid}` or `/admins/{adminId}`.
   - A user creating `/users/{userId}` can ONLY set `role` to `'job_seeker'` or `'employer'` (never `'admin'`) and cannot self-reactivate a `'suspended'` account.

2. **PII Isolation (Split-Collection Architecture)**
   - Private candidate records (`/candidates/{uid}`), structured resumes (`/users/{userId}/resumes/{resumeId}`), and career assessments (`/users/{userId}/career_assessments/{assessmentId}`) are strictly unreadable by unauthenticated visitors or other candidates.
   - Employers browsing opt-in talent ONLY read `/candidate_directory/{uid}` (strictly stripped of `email`, `phone`, `dob`, `gender`, `expectedSalary`, and resume payloads) and ONLY when the employer holds an active `'verified'` status on `/employers/{request.auth.uid}`.
   - Recruiter private contact details (`recruiterEmail`, `recruiterPhone`) live in `/employers/{employerId}/private_contacts/{contactId}` gated by the parent `/employers/{employerId}` owner or recruitment/support/super admins — never exposed on public `/employers/{employerId}` documents.
   - Recruiter internal application notes live in `/applications/{applicationId}/internal_notes/{noteId}` gated by the parent `/applications/{applicationId}` `employerOwnerUid` or recruitment/super admins — strictly unreadable by candidates.

3. **Employer Verification & Job Posting Integrity**
   - Self-registered employers MUST create `/employers/{uid}` with `ownerUid == request.auth.uid`, `verificationStatus == 'pending'`, `verified == false`, and `activeJobsCount == 0`.
   - Employers CANNOT approve themselves (`verificationStatus`, `verified`, `verifiedAt`, `activeJobsCount` are immutable to non-admins). Only `recruitment_admin` or `super_admin` may verify, reject, or suspend an employer.
   - Unverified employers CANNOT publish jobs (`status == 'published'` requires `isVerifiedEmployer()` or `isRecruitmentAdmin()`). They may only save `draft` jobs with `isVerifiedCompany == false` and `featured == false`.
   - Candidates have ZERO write access to `/jobs/{jobId}` and therefore CANNOT modify `applicantsCount`, `viewsCount`, `status`, `featured`, or `isVerifiedCompany`.

4. **Application & Interview Relational Integrity**
   - A candidate creating `/applications/{applicationId}` MUST reference an existing `/jobs/{jobId}` document where `status == 'published'`, and `incoming().employerId` and `incoming().employerOwnerUid` MUST match the parent job document via `get()`.
   - Candidates can only create applications with `status == 'Applied'` and `candidateId == request.auth.uid`, and can only update their own application to `status == 'Withdrawn'` while not already in a terminal state (`Selected`, `Rejected`, `Not Selected`, `Withdrawn`).
   - Employers can ONLY update pipeline fields (`status`, `timeline`, `interviewId`, `matchScore`, `updatedAt`) on applications belonging to their own jobs (`existing().employerOwnerUid == request.auth.uid`) — never tampering with candidate-submitted fields.
   - Interviews in `/interviews/{interviewId}` can ONLY be created/updated by the owning employer of the referenced `/applications/{applicationId}` (verified via `get()`) or `recruitment_admin`/`super_admin`. Candidates have read-only access to their own interviews.

5. **Trusted Audit Logging & Platform Metrics Boundaries**
   - `/admin_activity_logs/{logId}` strictly denies ALL browser client writes (`allow create, update, delete: if false;`) so browser sessions cannot fabricate, alter, or spoof audit history. Trusted tamper-proof audit logging is explicitly deferred until Cloud Functions / a trusted server backend is provisioned on Blaze.
   - `/platform_metrics/{metricId}` is strictly unreadable by public/candidates/employers (`allow get, list: if isAnyAdmin()`), and non-super-admins cannot modify snapshots. Live aggregate counts on the Starter tier use Firestore `getCountFromServer()` queries without client-writable counters.

6. **Learn with ABHI Preservation & Admin-Approved Interim Certificates**
   - All 12 existing collections and paths (`/users/{userId}/career_assessments`, `course_enrolments`, `video_progress`, `assessment_attempts`, `certificates`, `/public_certificates`, `/learning_courses`, `modules`, `lessons`, `quiz_configs`, `/certificate_templates`, plus collectionGroup audit reads) are preserved intact.
   - `/learning_courses/{courseId}/quiz_configs/{quizId}` (answer keys) remains strictly admin-only (`isCourseAdmin()` / legacy `isAdmin()`); zero student or public reads.
   - Students remain strictly blocked from writing `/users/{userId}/assessment_attempts/{attemptId}`, `/users/{userId}/certificates/{courseId}`, `/public_certificates/{certificateId}`, and score/unlock/completion fields on `/users/{userId}/course_enrolments/{courseId}`.
   - Interim **Admin-Approved Certificate Issuance** operates via `/certificate_requests/{requestId}`: enrolled students submit a `pending` request referencing their existing `course_enrolments/{courseId}` document; only `course_admin` or `super_admin` may approve requests and atomically write `/users/{userId}/certificates/{courseId}` + `/public_certificates/{certificateId}` explicitly tagged `issuanceMethod: 'admin_approved'` and `approvedBy: request.auth.uid`. Existing HMAC-signed certificates and public single-doc verification remain 100% preserved and compatible.

---

## 2. The "Dirty Dozen" + Extended Adversarial Payloads

All payloads below MUST evaluate to `PERMISSION_DENIED`:

| # | Attack Category | Actor | Target Path & Operation | Malicious Payload / Pattern | Rule Gate Blocking It |
|---|---|---|---|---|---|
| 1 | **Admin Self-Escalation** | Verified Candidate (`uid_cand1`) | `CREATE /admin_roles/uid_cand1` | `{ uid: "uid_cand1", role: "super_admin", status: "active", ... }` | `isSuperAdmin()` required for all writes on `/admin_roles/{uid}` |
| 2 | **User Profile Role Escalation** | Verified Candidate (`uid_cand1`) | `CREATE /users/uid_cand1` | `{ id: "uid_cand1", role: "admin", ... }` | `incoming().role == 'job_seeker' \|\| incoming().role == 'employer'` |
| 3 | **Unverified Email Spoofing** | Unverified User (`email: "ezanwalmani@gmail.com"`, `email_verified: false`) | `GET /learning_courses/excel_for_job_seekers/quiz_configs/quiz_01` | Read attempt with unverified email token | `isVerifiedUser()` enforces `request.auth.token.email_verified == true` |
| 4 | **Employer Self-Approval** | Verified Employer (`uid_emp1`) | `CREATE /employers/uid_emp1` or `UPDATE /employers/uid_emp1` | `{ verificationStatus: "verified", verified: true }` | `create` mandates `verificationStatus == 'pending' && verified == false`; `update` `affectedKeys().hasOnly(...)` excludes `verificationStatus`, `verified`, `verifiedAt`, `activeJobsCount` |
| 5 | **Unverified Employer Publishing Job** | Pending Employer (`uid_emp1`, `verificationStatus: 'pending'`) | `CREATE /jobs/job_fake` | `{ employerId: "uid_emp1", employerOwnerUid: "uid_emp1", status: "published", isVerifiedCompany: true }` | `status == 'published'` and `isVerifiedCompany == true` require `isVerifiedEmployer() \|\| isRecruitmentAdmin()` |
| 6 | **Candidate Manipulating Job Counter** | Verified Candidate (`uid_cand1`) | `UPDATE /jobs/job_101` | `{ applicantsCount: 9999 }` | Candidates have zero write rules on `/jobs/{jobId}`; employer updates exclude `applicantsCount` and `viewsCount` |
| 7 | **Cross-User Candidate PII Read** | Verified Candidate (`uid_cand2`) or Unverified Employer | `GET /candidates/uid_cand1` or `GET /users/uid_cand1/resumes/res_1` | Direct document read of another user's private profile or resume | `/candidates/{uid}` restricted to `isOwner(uid) \|\| isRecruitmentAdmin() \|\| isSupportAdmin()`; `/resumes/{resumeId}` restricted strictly to `isOwner(userId)` |
| 8 | **Candidate Reading Recruiter Internal Notes** | Verified Candidate (`uid_cand1`, applicant on `app_1`) | `GET /applications/app_1/internal_notes/note_1` | Reading recruiter evaluation notes on own application | Master Gate checks `parentApp.employerOwnerUid == request.auth.uid \|\| isRecruitmentAdmin()`; candidates explicitly excluded |
| 9 | **Application Spoofing Employer Ownership** | Verified Candidate (`uid_cand1`) | `CREATE /applications/app_spoof` | `{ jobId: "job_101", employerOwnerUid: "uid_cand1", status: "Shortlisted" }` | `status == 'Applied'` enforced + `get(/jobs/$(jobId))` verifies job is `'published'` and `employerId`/`employerOwnerUid` match the real job |
| 10 | **Quiz Answer-Key Scraping** | Verified Candidate (`uid_cand1`) or Public | `GET / LIST /learning_courses/excel_for_job_seekers/quiz_configs/q1` | Reading quiz questions + answer keys directly | Strictly `isCourseAdmin() \|\| isAdmin()` |
| 11 | **Student Certificate Forgery / Self-Approval** | Verified Candidate (`uid_cand1`) | `CREATE /users/uid_cand1/certificates/excel_for_job_seekers` or `UPDATE /certificate_requests/req_1` (`status: "approved"`) | Forging certificate or approving own certificate request | Zero student writes on `/certificates` and `/public_certificates`; only `isCourseAdmin()` may update `/certificate_requests/{requestId}` |
| 12 | **Browser Forged Admin Activity Log** | Any Authenticated User (even `super_admin` browser) | `CREATE /admin_activity_logs/log_fake` | `{ actorUid: "...", action: "fake_audit", createdAt: request.time }` | `allow create, update, delete: if false;` on `/admin_activity_logs/{logId}` until trusted server backend exists |
| 13 | **Shadow Field Injection ("Ghost Field")** | Verified Candidate (`uid_cand1`) | `UPDATE /candidates/uid_cand1` | `{ headline: "Analyst", isAdmin: true, verified: true }` | `isValidCandidateProfile()` enforces `data.keys().hasOnly([...])` AND `affectedKeys().hasOnly([...])` |
| 14 | **Resource Poisoning (1MB ID / Oversized String)** | Public Visitor | `CREATE /hiring_enquiries/<500-char-id>` | Oversized doc ID or 50KB `additionalRequirements` string | `isValidId(enquiryId)` caps ID to `<= 128` alphanumeric/underscore/hyphen chars; all strings have explicit `.size()` caps |
| 15 | **Public Scraping of Enquiries** | Unauthenticated or Candidate | `GET / LIST /hiring_enquiries` or `/course_enquiries` | Reading submitted leads/PII | `allow get, list` restricted strictly to authorized admin roles (`recruitment_admin`/`support_admin` for hiring; `course_admin`/`support_admin` for course) |
| 16 | **Cross-Role Admin Privilege Overreach** | `content_admin` (`uid_content1`) | `UPDATE /employers/uid_emp1` (`verificationStatus: "verified"`) or `UPDATE /admin_roles/uid_content1` | Content admin attempting employer approval or role escalation | Employer approval requires `isRecruitmentAdmin()` (`super_admin` or `recruitment_admin`); role edits require `isSuperAdmin()` |

---

## 3. Role-by-Role Permission Matrix

| Collection / Path | Public (Unauth) | Candidate (`job_seeker`) | Employer (Pending / Verified) | `support_admin` | `content_admin` | `course_admin` | `recruitment_admin` | `super_admin` |
|---|---|---|---|---|---|---|---|---|
| `/admin_roles/{uid}` | None | Own `get` only (returns not-found) | Own `get` only | Own `get` only | Own `get` only | Own `get` only | Own `get` only | Full CRUD (`delete: false`, cannot self-revoke) |
| `/admins/{adminId}` (legacy) | None | None | None | None | None | None | None | None (Console-only) |
| `/admin_activity_logs/{logId}` | None | None | None | None | None | None | None | Read-only (`write: false` until Cloud Functions) |
| `/platform_metrics/{metricId}` | None | None | None | Read | Read | Read | Read | Read + Snapshot Create/Update (`delete: false`) |
| `/users/{userId}` | None | Own get/create/update (no role/status escalation) | Own get/create/update (no role/status escalation) | Read + Update `status` | Own only | Own only | Read | Read + Update `status` |
| `/candidates/{uid}` | None | Own full CRUD (`delete: false`) | **NONE** (no PII access) | Read | None | None | Read | Read + Moderation Update |
| `/candidate_directory/{uid}` | None | Own create/update/delete (non-PII only) | Read ONLY if **Verified Employer** & opt-in | Read | None | None | Read | Read + Delete |
| `/users/{uid}/resumes/{id}` | None | Own full CRUD | **NONE** | **NONE** | **NONE** | **NONE** | **NONE** | **NONE** (Strictly private to candidate) |
| `/users/{uid}/saved_jobs/{id}` | None | Own full CRUD | Own full CRUD | None | None | None | None | None |
| `/users/{uid}/recently_viewed/{id}` | None | Own full CRUD | Own full CRUD | None | None | None | None | None |
| `/users/{uid}/notifications/{id}` | None | Own read + mark `read: true` + delete | Own read + mark `read: true` + delete | Create + Read | None | Create + Read | Create + Read | Full Read + Create + Delete |
| `/employers/{employerId}` | Read ONLY `verified` | Read ONLY `verified` | Own create (`pending`) + update safe profile fields | Read | None | None | Read + Verify/Reject/Suspend | Full Manage |
| `/employers/{id}/private_contacts/{cid}` | None | None | Own CRUD (via parent `ownerUid`) | Read | None | None | Read + Update | Full Manage |
| `/jobs/{jobId}` | Read ONLY `published` | Read ONLY `published` (**ZERO writes**) | Own read; `draft` if pending; `published` ONLY if **Verified**; no counter/featured writes | Read | None | None | Full Manage (`featured`, moderation) | Full Manage |
| `/applications/{appId}` | None | Own read + create (`Applied`) + withdraw (`Withdrawn`) | Own jobs' apps read + pipeline status update only | Read | None | None | Full Read + Pipeline Manage | Full Manage |
| `/applications/{appId}/internal_notes/{nid}` | None | **NONE** | Own jobs' apps full note CRUD | Read | None | None | Full CRUD | Full CRUD |
| `/interviews/{interviewId}` | None | Own read only | Own jobs' interviews create/update/read | Read | None | None | Full Manage | Full Manage |
| `/website_content/{key}` | Read ONLY `published` | Read ONLY `published` | Read ONLY `published` | Read | Full CRUD | Read | Read | Full CRUD |
| `/public_settings/{key}` | Read | Read | Read | Read | Full CRUD | Read | Read | Full CRUD |
| `/hiring_enquiries/{id}` | Create (`status: New`) | Create (`status: New`) | Create (`status: New`) | Read + Update | None | None | Read + Update | Full Manage |
| `/course_enquiries/{id}` | Create (`status: New`) | Create (`status: New`) | Create (`status: New`) | Read + Update | None | Read + Update | None | Full Manage |
| `/certificate_requests/{id}` | None | Own read + create (`pending`, must be enrolled) | Own read + create (`pending`, must be enrolled) | Read | None | Read + Approve/Reject | None | Full Manage |
| **Learn with ABHI** (`learning_courses`, `modules`, `lessons`, `quiz_configs`, `certificate_templates`, `course_enrolments`, `video_progress`, `assessment_attempts`, `certificates`, `public_certificates`, `career_assessments`) | Preserved verbatim (`published` courses/modules/lessons, single-doc `public_certificates`, `certificate_templates`) | Preserved verbatim (own assessments, own enrolment bookmarks, own video progress, read-only attempts & certs; **ZERO** quiz answer-key reads or cert writes) | Same as candidate | Read-only enrolment/cert support? (Preserved strictly as `isAdmin()` = `course_admin` + `super_admin` + legacy `/admins`) | No write access | Full Manage (`isCourseAdmin()`) | No write access | Full Manage (`isSuperAdmin()`) |

---

## 4. Red Team Audit Checklist & Verification Results

- **Shadow Update Test:** PASS — Every `isValid[Entity]` blueprint enforces both `data.keys().hasAll([...])` and `data.keys().hasOnly([...])`, and every non-admin `allow update` branch enforces `incoming().diff(existing()).affectedKeys().hasOnly([...])` AND invokes `isValid[Entity](incoming())` first.
- **Email Spoofing Test:** PASS — `isBootstrapSuperAdmin()` checks `isVerifiedUser()` (`request.auth != null && request.auth.token.email_verified == true`) before evaluating `request.auth.token.email == 'ezanwalmani@gmail.com'`.
- **PII Blanket Test:** PASS — Zero collections with emails, phones, DOB, or resumes allow `isSignedIn()` blanket reads. Split collections separate `/candidates` vs `/candidate_directory`, `/employers` vs `/employers/*/private_contacts`, and `/applications` vs `/applications/*/internal_notes`.
- **Query Trust Test (Pillar 8):** PASS — Every `allow list` rule evaluates `resource.data` against `request.auth.uid`, publication status (`status == 'published'` / `verificationStatus == 'verified'`), or verified role helper with zero per-document `get()` calls inside list rules.
- **Value Poisoning & ID Poisoning Tests:** PASS — All document IDs validated via `isValidId()` (`^[a-zA-Z0-9_\-]+$`, `1..128` chars) on single-doc operations; all string fields have explicit `.size()` bounds; all lists have explicit `.size() <= MAX` bounds plus index-0 type guards.
- **Temporal Integrity & Immutability:** PASS — `createdAt == request.time` on create; `updatedAt == request.time` on update; immutable IDs (`id`, `userId`, `ownerUid`, `candidateId`, `employerId`, `employerOwnerUid`, `jobId`, `createdAt`) locked via `incoming().field == existing().field`.

---

## 5. Local Validation Coverage & Emulator Harness Readiness

Because Phase 2B prohibits installing new npm packages without prior approval:
- **Validated Locally (Zero New Packages):** Automated static/structural audit via `node scripts/verify-firestore-phase2b.mjs` (verifies valid JSON for `firebase-blueprint.json`, `firestore.indexes.json`, `firebase.json`; 100% blueprint-to-rules collection coverage; balanced syntax; all 12 preserved Learn with ABHI collections & answer-key isolation; zero client writes to `admin_activity_logs` / `certificates` / `public_certificates` / `assessment_attempts` / `quiz_configs` / `admins`; Netlify SPA fallback verification).
- **Requires Approved DevDependencies for Execution:**
  1. `eslint` + `@firebase/eslint-plugin-security-rules` — Official Firebase Security Rules ESLint static analyzer.
  2. `@firebase/rules-unit-testing` (plus local Firebase Emulator Suite with Java runtime) — Live execution of the 16 Dirty Dozen test cases against the Firestore Rules engine before production rules deployment.
