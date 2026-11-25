# ABHI JOBS — Supabase Migration Testing, Verification, Backup & Rollback Plan

**Project Reference:** `ruagizqernsqypujeutu`  
**Private Admin Route:** `/abhi-control-center`  
**Intended Super Admin:** `ezanwalmani@gmail.com` (activation strictly gated on verified Supabase Auth email confirmation)  
**Status:** Prepared in Phase 2B for review only — **NOT applied to live Supabase or deployed.**

---

## 1. Server Credential Configuration Resolution (No Secrets Shared in Chat)

### Root Cause Identified
- In the development environment, `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`) is active and accepted (`HTTP 200`), whereas `SUPABASE_SECRET_KEY` (`sb_secret_...`) returned `HTTP 401 {"message":"Unregistered API key"}` from `ruagizqernsqypujeutu.supabase.co`.
- This indicates the stored secret key was rotated, revoked, truncated, or copied from a different Supabase project.

### Exact Key Types & Where to Configure Them
| Variable | Key Type | Scope | Where to Configure |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Project URL (`https://ruagizqernsqypujeutu.supabase.co`) | Public (Frontend) | Netlify Site Env Vars + Local/AI Studio Env |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable Key (`sb_publishable_...`) | Public (Frontend) | Netlify Site Env Vars + Local/AI Studio Env |
| `SUPABASE_URL` | Project URL | Server / Edge | Local/AI Studio Secrets (Auto-injected in Supabase Edge Functions) |
| `SUPABASE_SECRET_KEY` | Active **Secret Key (`sb_secret_...`)** from Supabase Dashboard → **Project Settings → API Keys** | **Server-Only (NEVER `VITE_`)** | AI Studio Settings → Secrets (dev) / CI secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy Service Role Key (fallback if `SUPABASE_SECRET_KEY` unset) | **Server-Only (NEVER `VITE_`)** | Auto-injected inside deployed Supabase Edge Functions |
| `LEARNING_SIGNING_SECRET` | 32+ byte random hex string | **Server-Only** | `supabase secrets set LEARNING_SIGNING_SECRET=...` |
| `CERTIFICATE_SIGNING_SECRET` | 32+ byte random hex string | **Server-Only** | `supabase secrets set CERTIFICATE_SIGNING_SECRET=...` |
| `ALLOWED_ORIGINS` | Comma-separated origins (`https://abhijobs.netlify.app,http://localhost:3000`) | Server / Edge | `supabase secrets set ALLOWED_ORIGINS=...` |

> **Never paste any secret key into chat, source code, or Netlify `VITE_*` variables.**

---

## 2. Pre-Migration Backup Procedure (Before Phase 3 Execution)

1. **PostgreSQL Full Snapshot**:
   - In Supabase Dashboard (`ruagizqernsqypujeutu`) → **Database → Backups**, confirm an on-demand or recent automated backup exists before running any SQL.
   - Export row counts and a logical backup of all 8 existing recruitment tables (`users`, `candidates`, `employers`, `jobs`, `applications`, `resumes`, `saved_jobs`, `notifications`) using `pg_dump` or Supabase CLI `supabase db dump --schema public`.
2. **Firebase Data Export Snapshot**:
   - Export Firebase Auth users (`firebase auth:export`) and Firestore collections (users, enrolments, video progress, quiz attempts, certificates, career assessments) to an encrypted local backup archive.
3. **Local Store Snapshot**:
   - Archive `.learning-data/store.json` prior to importing quiz banks and local attempts into Supabase.

---

## 3. Ordered Execution Sequence (Only After Separate Phase 3/4 Approval)

1. **Verify Active Server Secret Key** in secure secret store (`HTTP 200` against `/rest/v1/` without logging the key).
2. **Apply Versioned SQL Migrations in Exact Order**:
   1. `supabase/migrations/20261125_01_identity_and_admin_rbac.sql`
   2. `supabase/migrations/20261125_02_recruitment_schema_upgrade.sql`
   3. `supabase/migrations/20261125_03_learn_with_abhi_schema.sql`
   4. `supabase/migrations/20261125_04_website_cms_and_storage.sql`
   5. `supabase/migrations/20261125_05_seed_initial_catalog_and_admin.sql`
3. **Confirm Super Admin Account**:
   - Ensure `ezanwalmani@gmail.com` signs up / signs in via Supabase Auth and completes email verification (`auth.users.email_confirmed_at IS NOT NULL`).
   - Re-run the idempotent Super Admin bootstrap block in Migration 05 (it is a safe no-op if already granted, and refuses to grant if email is unverified).
4. **Configure Edge Function Secrets & Deploy**:
   - `supabase secrets set LEARNING_SIGNING_SECRET=... CERTIFICATE_SIGNING_SECRET=... ALLOWED_ORIGINS=https://abhijobs.netlify.app`
   - Deploy `learning-assessments`, `learning-certificates`, `admin-operations`, and `public-enquiries`.
5. **Non-Destructive Data Import (Phase 4)**:
   - Import Excel 12-module full lesson videos, Study Guides, and quiz question banks from `server/excelCurriculumSeed.ts` and `server/excelModules05To12Quizzes.ts` via `ON CONFLICT DO NOTHING` / admin upsert.
   - Import existing Firebase learner enrolments, video progress, quiz attempts, and certificates keyed by `legacy_firebase_uid` + verified email mapping, preserving existing IDs and completion timestamps.

---

## 4. Automated & Manual Verification Matrix

### A. Database Integrity & Existing Data Preservation
- [ ] Verify pre-migration vs. post-migration row counts on `users`, `candidates`, `employers`, `jobs`, `applications`, `resumes`, `saved_jobs`, `notifications` are `>=` baseline (zero rows lost).
- [ ] Verify `learning_courses` contains `excel_for_job_seekers` (`excel-for-job-seekers`) with all 12 modules (`excel_m01_fundamentals` .. `excel_m12_ai_automation_project`, orders 1..12) and all 12 lessons (`excel_m01_lesson_01` .. `excel_m12_lesson_01`).
- [ ] Verify Storage buckets (`resumes`, `workbooks`, `course-assets`, `avatars`, `company-logos`) exist with expected `public` flags, MIME lists, and byte limits.

### B. Security & Row Level Security (RLS) Tests
- [ ] **Anonymous (`anon`) Role**:
  - Can read published `jobs`, verified `employers`, published `learning_courses`/`course_modules`/`course_lessons`/`lesson_videos`/`lesson_study_guides`, public `website_content`, and public `website_settings` (`is_public = true`).
  - **BLOCKED (401/403/0 rows)** from reading `profiles`, `admin_roles`, `admin_activity_logs`, `candidates`, `applications`, `application_notes`, `resumes`, `course_enrolments`, `quiz_attempts`, `certificates` (direct table), `quiz_configs`, `quiz_questions`, `assessment_sessions`, `hiring_enquiries`, `course_enquiries`, and private `website_settings` (`is_public = false`).
  - Can call `verify_public_certificate(id)` RPC / `learning-certificates` `verify` endpoint and receives ONLY `{ certificateId, candidateName, courseTitle, issueDate, status }`.
- [ ] **Authenticated Job Seeker (`job_seeker`) Role**:
  - Cannot read another user's `profiles`, `candidates`, `applications`, `resumes`, `course_enrolments`, `quiz_attempts`, `certificates`, or `career_assessments`.
  - Cannot update `profiles.account_type` to `'admin'` or modify `profiles.status` (blocked by `guard_profile_privileged_columns` trigger).
  - Cannot insert/update/delete `admin_roles` or `admin_activity_logs` (`REVOKE` + RLS).
  - Cannot tamper with `course_enrolments.unlocked_module_order`, `passed_module_quiz_ids`, or `final_assessment_passed` (blocked by `guard_enrolment_privileged_columns` trigger).
  - Cannot access `quiz_questions` or `quiz_configs` directly (`REVOKE ALL`).
  - Cannot read `application_notes` on their own application.
  - Cannot upload/read another user's folder inside `storage.buckets` (`resumes` / `avatars`).
- [ ] **Authenticated Employer Role**:
  - Can manage jobs, interviews, and `application_notes` ONLY for employers where `is_employer_member(employer_id)` is true.
  - Cannot view applications or notes for another employer's job.
- [ ] **Admin RBAC (`/abhi-control-center`)**:
  - Unauthenticated or non-admin user visiting `/abhi-control-center` receives `401`/`403` from `admin-operations`.
  - Unverified email account cannot receive admin access via Migration 05 or `grant-role`.
  - `super_admin` (`ezanwalmani@gmail.com`, verified) succeeds on `auth-status`, `list-roles`, `export-csv` (returns formula-neutralized CSV + creates immutable `admin_activity_logs` row), and cannot revoke the last active `super_admin`.
  - Attempting `UPDATE` or `DELETE` on `admin_activity_logs` fails with trigger exception.
  - Confirm `/abhi-control-center` does NOT appear anywhere in public `Navbar` or `Footer`.

### C. Edge Function End-to-End Tests
- [ ] `learning-assessments`: `start` omits `correct_option_index` & `explanation`, returns randomized options; `submit` grades server-side, rejects replay/second submit with `409 SESSION_INVALID_OR_EXPIRED`, unlocks Module 2 on pass (`>= 70%`).
- [ ] `learning-certificates`: `issue` returns `403` before all modules + final assessment are passed; issues `ABHI-YYYY-XXXXXXXX` once eligible; second call returns `alreadyIssued: true` idempotently; `verify` returns valid 5-field payload.
- [ ] `admin-operations`: Rejects `export-csv` from `job_admin`/`learning_admin`/`read_only_admin` with `403`; allows `super_admin` and neutralizes `=CMD(...)`, `+1+1`, `-2+3`, `@SUM(A1)` values in CSV output.
- [ ] `public-enquiries`: Validates email & length bounds; rejects >5 rapid submissions within 10 minutes with `429 RATE_LIMITED`.

---

## 5. Safe Rollback Plan

Because all 5 migrations are strictly **additive and non-destructive**, rollback is clean and preserves existing recruitment data:
1. **Application Rollback (Instant, Zero Data Loss)**:
   - Keep Firebase and existing frontend services active until Phase 5 sign-off.
   - If any issue arises during Phase 5 cutover, revert Netlify deploy to the previous production build.
2. **Edge Function Rollback**:
   - Disable or roll back Edge Functions via Supabase CLI without touching database tables.
3. **Database Rollback (If Needed During Phase 3 Staging)**:
   - Restore the pre-migration Supabase PITR/backup snapshot taken in Section 2, OR drop only the newly added triggers/policies while leaving all pre-existing recruitment tables and rows untouched.
