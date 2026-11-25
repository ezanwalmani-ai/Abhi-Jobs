# ABHI JOBS — Supabase Retirement & Removal Checklist

**Current Status**: `PREPARED BUT NOT EXECUTED — DO NOT REMOVE SUPABASE UNTIL PRODUCTION FIREBASE CUTOVER IS VERIFIED AND APPROVED`

All active runtime flows in ABHI JOBS (`src/App.tsx`, `src/context/AppContext.tsx`, `src/pages/auth/LoginPage.tsx`, `src/pages/jobSeeker/JobSeekerRegisterPage.tsx`, `src/pages/employer/EmployerRegisterPage.tsx`, `src/pages/admin/AdminDashboard.tsx`, `src/services/resumeService.ts`) have been migrated to Firebase Authentication and Cloud Firestore. Supabase remains dormant on disk strictly for export, reconciliation, and emergency rollback until explicit post-cutover sign-off.

---

## 1. Complete Inventory of Remaining Dormant Supabase Assets

### A. NPM Packages (`package.json`)
- `@supabase/supabase-js`

### B. Client & Service Files (`src/`)
- `src/lib/supabase.ts`
- `src/lib/supabaseSchema.ts`
- `src/supabaseClient.js`
- `src/services/supabaseAuthService.ts`
- `src/services/supabaseEdgeService.ts`

### C. SQL Migrations & Edge Functions (`supabase/`)
- `supabase/migrations/20261125_01_identity_and_admin_rbac.sql`
- `supabase/migrations/20261125_02_recruitment_schema_upgrade.sql`
- `supabase/migrations/20261125_03_learn_with_abhi_schema.sql`
- `supabase/migrations/20261125_04_website_cms_and_storage.sql`
- `supabase/migrations/20261125_05_seed_initial_catalog_and_admin.sql`
- `supabase/functions/*` (all Edge Function directories and shared utilities)

### D. Environment Variables (`.env.example`, Netlify, AI Studio Secrets)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWKS_URL`

---

## 2. Mandatory Pre-Retirement Gate Criteria

Do **NOT** execute removal until ALL of the following are confirmed in production:
1. Privileged Supabase export completed and verified via SHA-256 `manifest.json`.
2. Identity reconciliation completed with zero unresolved blocking conflicts (`reconciliation-report.md` signed off).
3. Idempotent Firestore import applied to `ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d` and row counts verified.
4. Firebase rules (`firestore.rules`) and composite indexes (`firestore.indexes.json`) deployed and smoke-tested live.
5. `ezanwalmani@gmail.com` confirmed active in `/admin_roles/{uid}` on production.
6. Learn with ABHI existing enrolments, module progress, quizzes, static workbooks, and certificates verified intact on production.
7. Production stability soak period completed (recommended: 7–14 days with zero Firebase fallback incidents).
8. Offline encrypted archive of the final Supabase export bundle safely stored.

---

## 3. Post-Approval Removal Sequence

1. Confirm zero active imports reference Supabase:
   ```bash
   grep -rnE "@supabase|supabaseClient|lib/supabase|supabaseAuthService|supabaseEdgeService" src/
   ```
2. Delete dormant source files (`src/lib/supabase.ts`, `src/lib/supabaseSchema.ts`, `src/supabaseClient.js`, `src/services/supabaseAuthService.ts`, `src/services/supabaseEdgeService.ts`).
3. Remove `supabase/` directory (after archiving git tag `pre-supabase-retirement`).
4. Remove `@supabase/supabase-js` from `package.json` and refresh `package-lock.json`.
5. Remove legacy Supabase env vars from `.env.example`, Netlify Environment Variables, and local secrets.
6. Run `npm run build`, `npm run lint`, and `npm run test:rules`.
7. Pause/archive the Supabase project (`ruagizqernsqypujeutu`) in the Supabase dashboard.
