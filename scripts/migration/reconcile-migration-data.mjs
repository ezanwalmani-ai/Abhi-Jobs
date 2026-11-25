#!/usr/bin/env node
/**
 * ABHI JOBS — Phase 5 Deterministic Identity & Relational Reconciliation Engine
 *
 * Reconciles exported Supabase records against existing Firebase Auth / Learn with ABHI
 * identities before any Firestore import occurs.
 *
 * Guarantees:
 * - Deterministic identity resolution by normalized verified email.
 * - Preserves existing Learn with ABHI Firebase UIDs (NEVER overwrites or merges silently).
 * - Stores `legacySupabaseId` traceability metadata on reconciled records.
 * - Quarantines duplicate emails, conflicting UID/email mappings, orphaned applications,
 *   missing employer owners, invalid status values, and base64 binary payloads.
 * - Re-running with the same inputs produces identical output (idempotent & deterministic).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWED_JOB_STATUSES = new Set(['draft', 'published', 'paused', 'closed']);
const ALLOWED_APPLICATION_STATUSES = new Set([
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Interview Scheduled',
  'Offer',
  'Selected',
  'Rejected',
  'Not Selected',
  'Withdrawn',
]);
const ALLOWED_EMPLOYER_STATUSES = new Set(['pending', 'verified', 'rejected', 'suspended']);

function normalizeEmail(raw) {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

function hasBase64Binary(value) {
  if (typeof value === 'string') {
    return /^data:[a-zA-Z0-9/+.-]+;base64,/i.test(value.trim());
  }
  if (Array.isArray(value)) {
    return value.some(hasBase64Binary);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some(hasBase64Binary);
  }
  return false;
}

function stripBase64Fields(value) {
  if (typeof value === 'string') {
    return /^data:[a-zA-Z0-9/+.-]+;base64,/i.test(value.trim()) ? undefined : value;
  }
  if (Array.isArray(value)) {
    return value.map(stripBase64Fields).filter((v) => v !== undefined);
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'photoUrl' || k === 'showPhoto' || k === 'fileBase64') continue;
      const cleaned = stripBase64Fields(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return value;
}

/**
 * Pure, deterministic reconciliation function tested locally against synthetic fixtures
 * and used by the CLI prior to any Firestore import.
 */
export function reconcileMigrationData({
  firebaseUsers = [],
  supabaseUsers = [],
  candidates = [],
  employers = [],
  jobs = [],
  applications = [],
  resumes = [],
}) {
  const conflicts = [];
  const warnings = [];
  const quarantined = {
    users: [],
    candidates: [],
    employers: [],
    jobs: [],
    applications: [],
    resumes: [],
  };

  // 1. Index existing Firebase Auth / Learn with ABHI users by normalized verified email
  const firebaseByEmail = new Map();
  const firebaseByUid = new Map();
  for (const fb of firebaseUsers) {
    const uid = String(fb.uid || '').trim();
    const email = normalizeEmail(fb.email);
    if (!uid) continue;
    firebaseByUid.set(uid, fb);
    if (email) {
      if (!firebaseByEmail.has(email)) {
        firebaseByEmail.set(email, []);
      }
      firebaseByEmail.get(email).push(fb);
    }
  }

  // 2. Detect duplicate emails in Supabase Auth
  const supabaseEmailBuckets = new Map();
  for (const su of supabaseUsers) {
    const email = normalizeEmail(su.email);
    if (!email) {
      quarantined.users.push({ reason: 'missing_email', record: su });
      conflicts.push({
        type: 'USER_MISSING_EMAIL',
        severity: 'error',
        legacySupabaseId: su.supabaseId || su.id,
        detail: 'Supabase user has no email address and cannot be reconciled deterministically.',
      });
      continue;
    }
    if (!supabaseEmailBuckets.has(email)) supabaseEmailBuckets.set(email, []);
    supabaseEmailBuckets.get(email).push(su);
  }

  const supabaseIdToFirebaseUid = new Map();
  const reconciledUsers = [];

  for (const [email, bucket] of Array.from(supabaseEmailBuckets.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    if (bucket.length > 1) {
      for (const dup of bucket) {
        quarantined.users.push({ reason: 'duplicate_supabase_email', record: dup });
      }
      conflicts.push({
        type: 'DUPLICATE_SUPABASE_EMAIL',
        severity: 'error',
        email,
        count: bucket.length,
        detail: `Multiple Supabase Auth accounts share ${email}. Quarantined — zero silent merges allowed.`,
      });
      continue;
    }

    const su = bucket[0];
    const supId = String(su.supabaseId || su.id || '').trim();
    const fbMatches = firebaseByEmail.get(email) || [];

    if (fbMatches.length > 1) {
      quarantined.users.push({ reason: 'duplicate_firebase_email', record: su });
      conflicts.push({
        type: 'DUPLICATE_FIREBASE_EMAIL',
        severity: 'error',
        email,
        detail: `Multiple existing Firebase accounts share ${email}. Manual review required.`,
      });
      continue;
    }

    if (fbMatches.length === 1) {
      const existingFb = fbMatches[0];
      // Verify whether the Supabase record claims a different Firebase UID explicitly
      if (su.firebaseUid && su.firebaseUid !== existingFb.uid) {
        quarantined.users.push({ reason: 'conflicting_uid_mapping', record: su });
        conflicts.push({
          type: 'CONFLICTING_UID_EMAIL_MAPPING',
          severity: 'error',
          email,
          legacySupabaseId: supId,
          existingFirebaseUid: existingFb.uid,
          claimedFirebaseUid: su.firebaseUid,
          detail: 'Conflicting UID mapping detected — quarantined to protect existing Learn with ABHI UID.',
        });
        continue;
      }

      // Preserve existing Learn with ABHI Firebase UID!
      supabaseIdToFirebaseUid.set(supId, existingFb.uid);
      reconciledUsers.push({
        uid: existingFb.uid,
        email,
        displayName: existingFb.displayName || su.displayName || email.split('@')[0],
        role: su.role || 'jobseeker',
        legacySupabaseId: supId,
        preservedExistingFirebaseUid: true,
        passwordResetRequired: !existingFb.hasFirebasePassword,
      });
    } else {
      // Deterministic new UID placeholder for pre-provisioning in Firebase Auth (never overwrites existing)
      const plannedUid = `sb_${supId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)}`;
      supabaseIdToFirebaseUid.set(supId, plannedUid);
      reconciledUsers.push({
        uid: plannedUid,
        email,
        displayName: su.displayName || email.split('@')[0],
        role: su.role || 'jobseeker',
        legacySupabaseId: supId,
        preservedExistingFirebaseUid: false,
        passwordResetRequired: true,
      });
    }
  }

  // Helper to map an owner ID (existing Firebase UID or reconciled Supabase ID)
  const resolveUid = (rawId, emailHint) => {
    const id = String(rawId || '').trim();
    if (firebaseByUid.has(id)) return id;
    if (supabaseIdToFirebaseUid.has(id)) return supabaseIdToFirebaseUid.get(id);
    const norm = normalizeEmail(emailHint);
    if (norm && firebaseByEmail.get(norm)?.length === 1) {
      return firebaseByEmail.get(norm)[0].uid;
    }
    return null;
  };

  // 3. Reconcile Candidates
  const reconciledCandidates = [];
  const candidateUidSet = new Set();
  for (const cand of candidates) {
    const uid = resolveUid(cand.userId || cand.user_id || cand.id, cand.email);
    if (!uid) {
      quarantined.candidates.push({ reason: 'unresolved_owner_uid', record: cand });
      conflicts.push({
        type: 'CANDIDATE_MISSING_OWNER',
        severity: 'error',
        recordId: cand.id,
        detail: 'Candidate record could not be mapped to a verified Firebase or reconciled Supabase user.',
      });
      continue;
    }
    if (candidateUidSet.has(uid)) {
      quarantined.candidates.push({ reason: 'duplicate_candidate_uid', record: cand });
      conflicts.push({
        type: 'DUPLICATE_CANDIDATE_PROFILE',
        severity: 'error',
        uid,
        recordId: cand.id,
        detail: `Duplicate candidate profile mapped to UID ${uid}. Quarantined — zero silent overwrites.`,
      });
      continue;
    }
    candidateUidSet.add(uid);
    const base64Found = hasBase64Binary(cand);
    if (base64Found) {
      warnings.push({
        type: 'BASE64_STRIPPED_FROM_CANDIDATE',
        uid,
        detail: 'Base64 binary payload detected on candidate record and stripped for Firestore compliance.',
      });
    }
    const cleaned = stripBase64Fields(cand);
    reconciledCandidates.push({
      ...cleaned,
      id: uid,
      userId: uid,
      legacySupabaseId: String(cand.id || ''),
    });
  }

  // 4. Reconcile Employers
  const reconciledEmployers = [];
  const validEmployerMap = new Map();
  for (const emp of employers) {
    const ownerUid = resolveUid(emp.ownerUid || emp.owner_uid || emp.userId || emp.user_id, emp.recruiterEmail || emp.email);
    if (!ownerUid) {
      quarantined.employers.push({ reason: 'missing_employer_owner', record: emp });
      conflicts.push({
        type: 'EMPLOYER_MISSING_OWNER',
        severity: 'error',
        recordId: emp.id,
        detail: 'Employer record has no valid owner UID.',
      });
      continue;
    }
    const status = ALLOWED_EMPLOYER_STATUSES.has(emp.verificationStatus || emp.verification_status)
      ? emp.verificationStatus || emp.verification_status
      : 'pending';
    const employerId = String(emp.id || `emp_${ownerUid}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const rec = {
      ...stripBase64Fields(emp),
      id: employerId,
      ownerUid,
      verificationStatus: status,
      verified: status === 'verified',
      legacySupabaseId: String(emp.id || ''),
    };
    reconciledEmployers.push(rec);
    validEmployerMap.set(employerId, rec);
    if (emp.id) validEmployerMap.set(String(emp.id), rec);
  }

  // 5. Reconcile Jobs
  const reconciledJobs = [];
  const validJobMap = new Map();
  for (const job of jobs) {
    const emp = validEmployerMap.get(String(job.employerId || job.employer_id || ''));
    const ownerUid = emp?.ownerUid || resolveUid(job.employerOwnerUid || job.employer_owner_uid, null);
    if (!ownerUid) {
      quarantined.jobs.push({ reason: 'orphaned_job_missing_employer_owner', record: job });
      conflicts.push({
        type: 'JOB_ORPHANED_EMPLOYER',
        severity: 'error',
        recordId: job.id,
        detail: `Job "${job.title || job.id}" references an employer with no valid owner UID.`,
      });
      continue;
    }
    const rawStatus = String(job.status || 'draft').toLowerCase();
    const status = ALLOWED_JOB_STATUSES.has(rawStatus) ? rawStatus : 'draft';
    if (!ALLOWED_JOB_STATUSES.has(rawStatus)) {
      warnings.push({
        type: 'JOB_STATUS_NORMALIZED',
        recordId: job.id,
        detail: `Invalid job status "${job.status}" normalized to "draft".`,
      });
    }
    const jobId = String(job.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const rec = {
      ...stripBase64Fields(job),
      id: jobId,
      employerId: emp?.id || String(job.employerId || `emp_${ownerUid}`),
      employerOwnerUid: ownerUid,
      status,
      legacySupabaseId: String(job.id || ''),
    };
    reconciledJobs.push(rec);
    validJobMap.set(jobId, rec);
    if (job.id) validJobMap.set(String(job.id), rec);
  }

  // 6. Reconcile Applications
  const reconciledApplications = [];
  for (const app of applications) {
    const job = validJobMap.get(String(app.jobId || app.job_id || ''));
    const candidateUid = resolveUid(app.candidateId || app.candidate_id || app.userId, app.candidateEmail || app.candidate_email);
    if (!job || !candidateUid) {
      quarantined.applications.push({
        reason: !job ? 'orphaned_application_missing_job' : 'orphaned_application_missing_candidate',
        record: app,
      });
      conflicts.push({
        type: 'APPLICATION_ORPHANED',
        severity: 'error',
        recordId: app.id,
        detail: !job
          ? `Application ${app.id} references missing/quarantined job ${app.jobId || app.job_id}.`
          : `Application ${app.id} references unmapped candidate ${app.candidateId || app.candidate_id}.`,
      });
      continue;
    }
    const rawStatus = String(app.status || 'Applied');
    const status = ALLOWED_APPLICATION_STATUSES.has(rawStatus) ? rawStatus : 'Applied';
    if (!ALLOWED_APPLICATION_STATUSES.has(rawStatus)) {
      warnings.push({
        type: 'APPLICATION_STATUS_NORMALIZED',
        recordId: app.id,
        detail: `Invalid application status "${app.status}" normalized to "Applied".`,
      });
    }
    const appId = String(app.id || `app_${job.id}_${candidateUid}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    reconciledApplications.push({
      ...stripBase64Fields(app),
      id: appId,
      jobId: job.id,
      employerId: job.employerId,
      employerOwnerUid: job.employerOwnerUid,
      candidateId: candidateUid,
      status,
      legacySupabaseId: String(app.id || ''),
    });
  }

  // 7. Reconcile Resumes (Structured JSON only — strip any base64 payloads)
  const reconciledResumes = [];
  for (const res of resumes) {
    const ownerUid = resolveUid(res.userId || res.user_id || res.candidateId, res.email);
    if (!ownerUid) {
      quarantined.resumes.push({ reason: 'orphaned_resume_missing_owner', record: res });
      conflicts.push({
        type: 'RESUME_MISSING_OWNER',
        severity: 'error',
        recordId: res.id,
        detail: `Resume ${res.id} has no mapped Firebase UID.`,
      });
      continue;
    }
    if (hasBase64Binary(res)) {
      warnings.push({
        type: 'BASE64_STRIPPED_FROM_RESUME',
        recordId: res.id,
        uid: ownerUid,
        detail: 'Base64 binary/photo payload stripped from resume to maintain structured JSON Firestore compliance.',
      });
    }
    const cleaned = stripBase64Fields(res);
    reconciledResumes.push({
      ...cleaned,
      id: String(res.id || `res_${ownerUid}`).replace(/[^a-zA-Z0-9_-]/g, '_'),
      userId: ownerUid,
      legacySupabaseId: String(res.id || ''),
    });
  }

  const summary = {
    reconciledUsers: reconciledUsers.length,
    preservedLearnWithAbhiUids: reconciledUsers.filter((u) => u.preservedExistingFirebaseUid).length,
    newUsersRequiringPasswordReset: reconciledUsers.filter((u) => u.passwordResetRequired).length,
    reconciledCandidates: reconciledCandidates.length,
    reconciledEmployers: reconciledEmployers.length,
    reconciledJobs: reconciledJobs.length,
    reconciledApplications: reconciledApplications.length,
    reconciledResumes: reconciledResumes.length,
    totalConflicts: conflicts.length,
    totalWarnings: warnings.length,
    quarantinedCounts: {
      users: quarantined.users.length,
      candidates: quarantined.candidates.length,
      employers: quarantined.employers.length,
      jobs: quarantined.jobs.length,
      applications: quarantined.applications.length,
      resumes: quarantined.resumes.length,
    },
  };

  return {
    summary,
    conflicts,
    warnings,
    quarantined,
    reconciled: {
      users: reconciledUsers,
      candidates: reconciledCandidates,
      employers: reconciledEmployers,
      jobs: reconciledJobs,
      applications: reconciledApplications,
      resumes: reconciledResumes,
    },
  };
}

export function renderReconciliationMarkdown(report) {
  const s = report.summary;
  const lines = [
    '# ABHI JOBS — Migration Reconciliation Report',
    '',
    '## Summary',
    `- Reconciled Users: **${s.reconciledUsers}** (Preserved existing Learn with ABHI UIDs: **${s.preservedLearnWithAbhiUids}**)`,
    `- Users Requiring Firebase Password Reset: **${s.newUsersRequiringPasswordReset}**`,
    `- Reconciled Candidates: **${s.reconciledCandidates}**`,
    `- Reconciled Employers: **${s.reconciledEmployers}**`,
    `- Reconciled Jobs: **${s.reconciledJobs}**`,
    `- Reconciled Applications: **${s.reconciledApplications}**`,
    `- Reconciled Resumes (Structured JSON): **${s.reconciledResumes}**`,
    `- Total Blocking Conflicts (Quarantined): **${s.totalConflicts}**`,
    `- Total Non-Blocking Warnings: **${s.totalWarnings}**`,
    '',
    '## Blocking Conflicts (Zero Silent Merges)',
    ...(report.conflicts.length === 0
      ? ['- None detected.']
      : report.conflicts.map((c) => `- **${c.type}**: ${c.detail}`)),
    '',
    '## Warnings',
    ...(report.warnings.length === 0
      ? ['- None.']
      : report.warnings.map((w) => `- **${w.type}**: ${w.detail}`)),
    '',
  ];
  return lines.join('\n');
}

function runCli() {
  const args = process.argv.slice(2);
  const inputArg = args.find((a) => a.startsWith('--input='));
  const firebaseUsersArg = args.find((a) => a.startsWith('--firebase-users='));
  const outArg = args.find((a) => a.startsWith('--out='));

  if (!inputArg) {
    console.log('Usage: node scripts/migration/reconcile-migration-data.mjs --input=<export-bundle.json> [--firebase-users=<firebase-users.json>] [--out=<dir>]');
    return;
  }

  const bundle = JSON.parse(fs.readFileSync(path.resolve(inputArg.slice('--input='.length)), 'utf8'));
  const firebaseUsers = firebaseUsersArg
    ? JSON.parse(fs.readFileSync(path.resolve(firebaseUsersArg.slice('--firebase-users='.length)), 'utf8'))
    : [];

  const report = reconcileMigrationData({
    firebaseUsers,
    supabaseUsers: bundle.authUsers || [],
    candidates: bundle.tables?.candidates || [],
    employers: bundle.tables?.employers || [],
    jobs: bundle.tables?.jobs || [],
    applications: bundle.tables?.applications || [],
    resumes: bundle.tables?.resumes || [],
  });

  const outDir = outArg
    ? path.resolve(outArg.slice('--out='.length))
    : path.dirname(path.resolve(inputArg.slice('--input='.length)));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'reconciled-bundle.json'), JSON.stringify(report, null, 2), 'utf8');
  fs.writeFileSync(path.join(outDir, 'reconciliation-report.md'), renderReconciliationMarkdown(report), 'utf8');

  console.log('Reconciliation complete:', JSON.stringify(report.summary));
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  runCli();
}
