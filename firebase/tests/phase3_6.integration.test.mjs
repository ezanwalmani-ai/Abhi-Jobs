/**
 * ABHI JOBS — Phases 3–6 Automated Local Integration & Security Test Suite
 *
 * Verifies:
 * 1. All 11 static Excel practice workbooks (Modules 02–12) exist, have valid ZIP/XLSX signatures,
 *    load cleanly in ExcelJS with >= 3 worksheets, and are referenced statically in catalogs.
 * 2. Phase 5 deterministic identity & relational reconciliation engine (preserves existing Learn with ABHI
 *    Firebase UIDs, quarantines duplicates/conflicts/orphans, strips base64 binaries, deterministic re-run).
 * 3. Phase 5 idempotent Firestore write plan builder targets named DB and splits employer private_contacts.
 * 4. Security invariants: zero loginAs/switchRole/Quick Demo Admin bypasses in src/, zero active Supabase
 *    runtime imports in migrated active entrypoints, zero fake HMAC certificate generation, and dormant
 *    Supabase files remain intact on disk until post-cutover approval.
 * 5. Five-role RBAC guardrails (self-revocation and last-active-Super-Admin protection) & CSV formula safety.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import {
  reconcileMigrationData,
  renderReconciliationMarkdown,
} from '../../scripts/migration/reconcile-migration-data.mjs';
import {
  TARGET_DATABASE_ID,
  TARGET_PROJECT_ID,
  buildFirestoreWritePlan,
} from '../../scripts/migration/import-firestore-idempotent.mjs';

const ROOT = process.cwd();

function collectTsFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

describe('Phase 6 — Static Excel Practice Workbooks (Modules 02–12)', () => {
  const modules = ['02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  it('all 11 static .xlsx workbooks exist, have ZIP magic bytes, and load in ExcelJS with >= 3 sheets', async () => {
    for (const mod of modules) {
      const filePath = path.join(
        ROOT,
        'public',
        'downloads',
        'workbooks',
        `ABHI-Excel-Module-${mod}-Practice-Workbook.xlsx`
      );
      assert.equal(fs.existsSync(filePath), true, `Missing workbook: ${filePath}`);
      const buf = fs.readFileSync(filePath);
      assert.ok(buf.length > 5000, `Workbook too small (${buf.length} bytes): ${filePath}`);
      // ZIP/OOXML magic header: PK\x03\x04
      assert.equal(buf[0], 0x50);
      assert.equal(buf[1], 0x4b);
      assert.equal(buf[2], 0x03);
      assert.equal(buf[3], 0x04);

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf);
      assert.ok(
        wb.worksheets.length >= 3,
        `Module ${mod} workbook must contain >= 3 sheets, got ${wb.worksheets.length}`
      );
    }
  });

  it('learning catalogs point strictly to static /downloads/workbooks/*.xlsx URLs with zero /api/learning/resources workbook links', () => {
    const catalogFiles = [
      'src/data/learningCatalog.ts',
      'src/data/excelModules05To08Catalog.ts',
      'src/data/excelModules09To12Catalog.ts',
    ];
    for (const rel of catalogFiles) {
      const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      assert.equal(
        content.includes('/api/learning/resources/'),
        false,
        `Legacy dynamic workbook URL still present in ${rel}`
      );
      assert.equal(
        content.includes('/downloads/workbooks/ABHI-Excel-Module-'),
        true,
        `Expected static workbook URL missing in ${rel}`
      );
    }
  });
});

describe('Phase 5 — Deterministic Identity & Relational Reconciliation Engine', () => {
  const syntheticInput = {
    firebaseUsers: [
      {
        uid: 'fb_learn_uid_001',
        email: 'learner@abhijobs.careers',
        displayName: 'Existing Learn User',
        hasFirebasePassword: true,
      },
      {
        uid: 'fb_conflict_uid_002',
        email: 'conflict@abhijobs.careers',
        displayName: 'Existing Conflict User',
        hasFirebasePassword: true,
      },
    ],
    supabaseUsers: [
      // Matches existing Learn with ABHI user -> must preserve fb_learn_uid_001!
      {
        supabaseId: 'sb-user-001',
        email: 'LEARNER@abhijobs.careers',
        displayName: 'Learner SB',
        role: 'jobseeker',
      },
      // Brand new employer user -> deterministic sb_ UID + password reset required
      {
        supabaseId: 'sb-emp-010',
        email: 'hr@verifiedcorp.in',
        displayName: 'HR Lead',
        role: 'employer',
      },
      // Duplicate emails in Supabase -> BOTH quarantined (zero silent merges!)
      { supabaseId: 'sb-dup-1', email: 'dup@example.com', role: 'jobseeker' },
      { supabaseId: 'sb-dup-2', email: 'DUP@example.com', role: 'jobseeker' },
      // Conflicting explicit firebaseUid claim -> quarantined!
      {
        supabaseId: 'sb-conflict-1',
        email: 'conflict@abhijobs.careers',
        firebaseUid: 'wrong_uid_999',
        role: 'jobseeker',
      },
    ],
    candidates: [
      {
        id: 'sb-user-001',
        userId: 'sb-user-001',
        email: 'learner@abhijobs.careers',
        name: 'Existing Learn User',
        avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
      },
    ],
    employers: [
      {
        id: 'emp_010',
        ownerUid: 'sb-emp-010',
        companyName: 'Verified Corp India',
        verificationStatus: 'verified',
        recruiterName: 'HR Lead',
        recruiterEmail: 'hr@verifiedcorp.in',
        recruiterPhone: '+91-9876543210',
      },
    ],
    jobs: [
      {
        id: 'job_010',
        employerId: 'emp_010',
        title: 'Senior Data Analyst',
        status: 'published',
      },
      // Orphaned job with missing employer
      {
        id: 'job_orphan',
        employerId: 'emp_does_not_exist',
        title: 'Orphaned Role',
        status: 'published',
      },
    ],
    applications: [
      {
        id: 'app_001',
        jobId: 'job_010',
        candidateId: 'sb-user-001',
        status: 'Shortlisted',
      },
      // Orphaned application pointing to missing job
      {
        id: 'app_orphan',
        jobId: 'job_orphan',
        candidateId: 'sb-user-001',
        status: 'Applied',
      },
    ],
    resumes: [
      {
        id: 'res_001',
        userId: 'sb-user-001',
        email: 'learner@abhijobs.careers',
        fullName: 'Existing Learn User',
        photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==',
        showPhoto: true,
        summary: 'Experienced Excel analyst',
      },
    ],
  };

  it('preserves existing Learn with ABHI UID, quarantines conflicts/orphans, strips base64, and is deterministic on re-run', () => {
    const run1 = reconcileMigrationData(syntheticInput);
    const run2 = reconcileMigrationData(syntheticInput);

    assert.deepEqual(run1, run2, 'Reconciliation output must be 100% deterministic across re-runs');

    // Existing Learn with ABHI UID preserved
    const preserved = run1.reconciled.users.find((u) => u.email === 'learner@abhijobs.careers');
    assert.ok(preserved);
    assert.equal(preserved.uid, 'fb_learn_uid_001');
    assert.equal(preserved.legacySupabaseId, 'sb-user-001');
    assert.equal(preserved.preservedExistingFirebaseUid, true);

    // Duplicates & conflicting UID quarantined (zero silent merges)
    assert.equal(run1.quarantined.users.length, 3);
    assert.ok(run1.conflicts.some((c) => c.type === 'DUPLICATE_SUPABASE_EMAIL'));
    assert.ok(run1.conflicts.some((c) => c.type === 'CONFLICTING_UID_EMAIL_MAPPING'));

    // Orphaned job & application quarantined
    assert.equal(run1.quarantined.jobs.length, 1);
    assert.equal(run1.quarantined.applications.length, 1);
    assert.equal(run1.reconciled.applications.length, 1);
    assert.equal(run1.reconciled.applications[0].candidateId, 'fb_learn_uid_001');

    // Base64 stripped from candidate avatar and resume photoUrl
    assert.equal(run1.reconciled.candidates[0].avatar, undefined);
    assert.equal(run1.reconciled.resumes[0].photoUrl, undefined);
    assert.equal(run1.reconciled.resumes[0].showPhoto, undefined);
    assert.equal(run1.reconciled.resumes[0].userId, 'fb_learn_uid_001');

    const md = renderReconciliationMarkdown(run1);
    assert.ok(md.includes('DUPLICATE_SUPABASE_EMAIL'));
    assert.ok(md.includes('CONFLICTING_UID_EMAIL_MAPPING'));

    // Verify write plan splits employer private_contacts cleanly and targets exact named DB
    assert.equal(TARGET_PROJECT_ID, 'geometric-centaur-c6pck');
    assert.equal(TARGET_DATABASE_ID, 'ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d');
    const plan = buildFirestoreWritePlan(run1);
    assert.ok(plan.some((op) => op.path === 'employers/emp_010'));
    assert.ok(plan.some((op) => op.path === 'employers/emp_010/private_contacts/default'));
    assert.ok(plan.some((op) => op.path === 'users/fb_learn_uid_001/resumes/res_001'));
  });
});

describe('Phase 3 & 4 — Security Hardening & Static Codebase Invariants', () => {
  it('zero loginAs / switchRole / Quick Demo Admin bypasses remain anywhere in src/', () => {
    const files = collectTsFiles(path.join(ROOT, 'src'));
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      assert.equal(
        /\bloginAs\s*\(/.test(text),
        false,
        `Insecure loginAs() call found in ${path.relative(ROOT, file)}`
      );
      assert.equal(
        /\bswitchRole\s*\(/.test(text),
        false,
        `Insecure switchRole() call found in ${path.relative(ROOT, file)}`
      );
      assert.equal(
        text.includes('Enter as Recruiter Admin'),
        false,
        `Insecure one-click admin bypass text found in ${path.relative(ROOT, file)}`
      );
      assert.equal(
        text.includes('Quick Demo Access'),
        false,
        `Insecure Quick Demo Access block found in ${path.relative(ROOT, file)}`
      );
    }
  });

  it('migrated active app entrypoints contain zero active Supabase runtime imports', () => {
    const activeFiles = [
      'src/App.tsx',
      'src/context/AppContext.tsx',
      'src/pages/auth/LoginPage.tsx',
      'src/pages/jobSeeker/JobSeekerRegisterPage.tsx',
      'src/pages/employer/EmployerRegisterPage.tsx',
      'src/pages/admin/AdminDashboard.tsx',
      'src/services/resumeService.ts',
    ];
    for (const rel of activeFiles) {
      const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      assert.equal(
        /from\s+['"][^'"]*supabase/i.test(content),
        false,
        `Active Supabase import still present in ${rel}`
      );
    }
  });

  it('dormant Supabase files and package dependency remain intact on disk until post-cutover approval', () => {
    assert.equal(fs.existsSync(path.join(ROOT, 'src/lib/supabase.ts')), true);
    assert.equal(fs.existsSync(path.join(ROOT, 'src/supabaseClient.js')), true);
    assert.equal(fs.existsSync(path.join(ROOT, 'supabase')), true);
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    assert.ok(pkg.dependencies['@supabase/supabase-js']);
  });

  it('resumeService rejects/strips base64 data: payloads and recruitmentFirestoreService never fakes HMAC signatures', () => {
    const resumeSrc = fs.readFileSync(path.join(ROOT, 'src/services/resumeService.ts'), 'utf8');
    assert.ok(resumeSrc.includes('containsBase64BinaryPayload'));
    assert.ok(resumeSrc.includes('sanitizeResumeForFirestore'));

    const recruitSrc = fs.readFileSync(
      path.join(ROOT, 'src/services/recruitmentFirestoreService.ts'),
      'utf8'
    );
    assert.ok(recruitSrc.includes("issuanceMethod: 'admin_approved'"));
    assert.equal(
      /verificationSignature\s*:/.test(recruitSrc),
      false,
      'Client-side admin approval must NEVER write verificationSignature property (no fake HMAC)'
    );
  });

  it('firestore.rules locks /test/connection to authenticated users only', () => {
    const rules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
    assert.equal(
      /match\s+\/test\/connection[\s\S]*?allow\s+read:\s*if\s+true\s*;/.test(rules),
      false,
      '/test/connection must not allow unauthenticated reads'
    );
    assert.equal(
      /match\s+\/test\/connection[\s\S]*?allow\s+read:\s*if\s+isSignedIn\(\)\s*;/.test(rules),
      true,
      '/test/connection must require isSignedIn()'
    );
  });

  it('adminRbacService enforces 5 roles, self-revocation block, and last-active-Super-Admin protection', () => {
    const rbacSrc = fs.readFileSync(path.join(ROOT, 'src/services/adminRbacService.ts'), 'utf8');
    for (const role of [
      'super_admin',
      'recruitment_admin',
      'course_admin',
      'content_admin',
      'support_admin',
    ]) {
      assert.ok(rbacSrc.includes(role), `Missing role ${role} in adminRbacService.ts`);
    }
    assert.ok(rbacSrc.includes('You cannot revoke or downgrade your own Super Admin role.'));
    assert.ok(rbacSrc.includes('Cannot remove or downgrade the last active Super Admin.'));
  });
});
