# ABHI JOBS — Firebase Single-Backend Migration Runbook, Governance & Cost Plan

**Target Firebase Project**: `geometric-centaur-c6pck` (Starter Tier — No Cost)  
**Target Named Firestore Database**: `ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d`  
**Frontend Hosting**: Netlify (`netlify.toml` configured for SPA routing & static workbook caching)  
**Initial Super Admin**: `ezanwalmani@gmail.com`  
**Admin Control Center Routes**: `/abhi-control-center` and `/admin`

---

## 1. Manual Super Admin Provisioning (`ezanwalmani@gmail.com`)

1. Sign in to ABHI JOBS with `ezanwalmani@gmail.com` via Firebase Authentication (Google Sign-In or Email/Password with verified email).
2. Locate the Firebase Auth UID for `ezanwalmani@gmail.com` in Firebase Console -> Authentication -> Users.
3. Open Cloud Firestore -> database `ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d`.
4. Create document `/admin_roles/{UID}` with:
   ```json
   {
     "uid": "<FIREBASE_AUTH_UID>",
     "email": "ezanwalmani@gmail.com",
     "displayName": "Super Admin",
     "role": "super_admin",
     "status": "active",
     "assignedBy": "<FIREBASE_AUTH_UID>",
     "assignedAt": "<SERVER_TIMESTAMP>",
     "updatedAt": "<SERVER_TIMESTAMP>"
   }
   ```
5. Verify `/users/{UID}` does NOT have `status: "suspended"`.
6. Open `/abhi-control-center`, sign in, and confirm the **Roles & Audit** tab loads your Super Admin record.

---

## 2. Five-Role RBAC Permission Matrix

| Capability | `super_admin` | `recruitment_admin` | `course_admin` | `content_admin` | `support_admin` |
|---|:---:|:---:|:---:|:---:|:---:|
| Overview (`getCountFromServer()`) | Yes | Yes | Yes | Yes | Yes |
| Manage `/admin_roles` | Yes | No | No | No | No |
| Read `/admin_activity_logs` | Yes | No | No | No | No |
| CSV Data Export | Yes | No | No | No | No |
| Employer Verification & Private Contacts | Yes | Yes | No | No | No |
| Jobs Moderation & CRUD | Yes | Yes | No | No | No |
| Applications, Interviews & Private Notes | Yes | Yes | No | No | No |
| Candidate Directory Read | Yes | Yes | No | No | Yes |
| Suspend / Reactivate Accounts | Yes | No | No | No | Yes |
| Learn with ABHI Courses & Quizzes | Yes | No | Yes | No | No |
| Admin-Approved Certificate Queue | Yes | No | Yes | No | No |
| Website CMS (`/website_content`) | Yes | No | No | Yes | No |
| Public Settings (`/public_settings`) | Yes | No | No | Yes | No |
| Hiring Enquiries | Yes | Yes | No | No | Yes |
| Course Enquiries | Yes | No | Yes | No | Yes |

Guardrails enforced in `src/services/adminRbacService.ts` and `firestore.rules`:
- Active Super Admins cannot revoke or downgrade themselves.
- Removing or downgrading the last active Super Admin is blocked.
- Unverified emails and suspended accounts are denied admin access at both UI and Firestore Rules layers.

---

## 3. Password Migration & Reset Workflow (Supabase -> Firebase Auth)

Because Supabase stores bcrypt hashes internally and never exposes plaintext passwords, migrated Email/Password users who do not already have a Firebase Auth password:
1. Are pre-created or reconciled by normalized email while preserving existing Learn with ABHI Firebase UIDs.
2. Can sign in immediately with **Google Sign-In** (same verified email links seamlessly) OR click **"Forgot password? Send reset email"** on `/login` or `/abhi-control-center` to set their Firebase password via `sendPasswordResetEmail()`.
3. Existing Learn with ABHI users who already sign in with Firebase Auth experience **zero disruption** and keep their exact UID, enrolments, quiz history, and certificates.

---

## 4. Firebase Starter Tier vs. Blaze Capability Matrix & Quota Plan

| Capability | Starter Tier (Current — $0/mo) | Blaze Upgrade (Optional Future) |
|---|---|---|
| Firebase Authentication (Email/Password + Google) | Full support (up to 50K MAU free) | Same + Identity Platform MFA |
| Cloud Firestore (Named DB) | 50K reads/day, 20K writes/day, 20K deletes/day, 1 GiB storage | Pay-as-you-go beyond free daily quota |
| Firestore Security Rules & Composite Indexes | Full support | Full support |
| Structured JSON Resumes (`/users/{uid}/resumes`) | Full support (zero base64 binaries) | Optional PDF uploads via Firebase Storage |
| Static Excel Workbooks (Modules 02–12) | Hosted free on Netlify CDN (`/downloads/workbooks/*.xlsx`) | Same |
| Analytics Counters | `getCountFromServer()` (1 read per 1,000 index entries) | Cloud Function triggers + `platform_metrics` |
| Certificates | Existing HMAC preserved + Transparent `admin_approved` queue | Automated server HMAC via Cloud Functions |
| Immutable Audit Log Writes | Read-only viewer; client writes strictly denied by rules | Automated `onDocumentWritten` Cloud Function |
| Firebase App Check | Opt-in ready via `VITE_FIREBASE_APP_CHECK_SITE_KEY` | Enforced on Firestore + Callable Functions |

### Firestore Quota Optimization Measures Implemented
- Overview counters use `getCountFromServer()` instead of downloading full collections.
- All list queries include explicit `.limit(...)` bounds (e.g., 50–150 documents).
- Public job browsing queries indexed `status == 'published'` + `orderBy('postedAt', 'desc')`.
- Base64 images/PDFs are strictly stripped from Firestore resume and profile documents.

---

## 5. Netlify Deployment & Security Checklist

1. **Build command**: `npm run build` | **Publish directory**: `dist` (configured in `netlify.toml`).
2. **SPA Fallback**: `/* -> /index.html (200)` preserved, with `/downloads/workbooks/*` served as static `.xlsx` assets with `Cache-Control: public, max-age=31536000, immutable`.
3. **Security Headers** (`netlify.toml`): `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and Content-Security-Policy allowing Firebase Auth/Firestore endpoints.
4. **Authorized Domains in Firebase Console**: Ensure your Netlify production domain (`*.netlify.app` and custom domain) is added under Firebase Console -> Authentication -> Settings -> Authorized Domains.
5. **Opt-in App Check**: Set `VITE_FIREBASE_APP_CHECK_SITE_KEY` in Netlify Environment Variables only after registering reCAPTCHA v3 in Firebase Console -> App Check.

---

## 6. Production Cutover & Rollback Runbook (Execute ONLY After Explicit Approval)

### Cutover Sequence
1. Deploy `firestore.rules` and `firestore.indexes.json` to `geometric-centaur-c6pck` (database `ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d`).
2. Provision `/admin_roles/{UID}` for `ezanwalmani@gmail.com`.
3. Run `scripts/migration/export-supabase-privileged.mjs --execute --confirm-production-read` from a secure operator workstation.
4. Run `scripts/migration/reconcile-migration-data.mjs` against exported bundle + Firebase Auth user list; inspect `reconciliation-report.md` and resolve any quarantined conflicts.
5. Run `scripts/migration/import-firestore-idempotent.mjs` in dry-run mode first, verify counts, then run with `--apply --confirm-target=ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d`.
6. Deploy updated frontend to Netlify and verify:
   - Candidate login, profile update, structured resume save, job application
   - Employer registration (`pending`), Super Admin verification, job publish
   - Learn with ABHI course playback, static workbook download (Modules 02–12), certificate verification
   - Admin Control Center 5-role RBAC enforcement
7. Complete 7–14 day soak period before executing `firebase/SUPABASE_RETIREMENT_CHECKLIST.md`.

### Rollback Plan
- **Frontend rollback**: Instant 1-click Netlify deploy rollback to the previous production build.
- **Firestore data rollback**: Use the generated `pre-import-rollback-*.json` manifest created before any `--apply` write to restore modified documents or delete newly created migration documents without touching Learn with ABHI collections.
- **Supabase safety**: Supabase data and credentials remain untouched (read-only during export) throughout cutover.
