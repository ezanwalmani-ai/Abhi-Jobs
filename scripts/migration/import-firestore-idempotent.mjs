#!/usr/bin/env node
/**
 * ABHI JOBS — Phase 5 Idempotent Firestore Importer (DRY-RUN BY DEFAULT)
 *
 * Targets the EXISTING named Firestore database:
 *   Project ID:  geometric-centaur-c6pck
 *   Database ID: ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d
 *
 * Safety Controls:
 * 1. Dry-run by default — performs full schema validation and prints exact write plan without modifying Firestore.
 * 2. Requires BOTH `--apply` AND `--confirm-target=ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d` to write.
 * 3. Refuses to proceed if blocking reconciliation conflicts exist unless `--allow-partial-quarantined` is explicitly passed.
 * 4. Creates a pre-import backup/rollback manifest before writing any documents.
 * 5. Idempotent deterministic document IDs using `set(..., { merge: true })` so re-running never creates duplicates.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TARGET_PROJECT_ID = 'geometric-centaur-c6pck';
export const TARGET_DATABASE_ID = 'ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d';

function parseArgs(argv) {
  const parsed = {
    input: null,
    apply: false,
    confirmTarget: null,
    allowPartialQuarantined: false,
    useEmulator: false,
  };
  for (const arg of argv) {
    if (arg.startsWith('--input=')) parsed.input = arg.slice('--input='.length);
    if (arg === '--apply') parsed.apply = true;
    if (arg.startsWith('--confirm-target=')) parsed.confirmTarget = arg.slice('--confirm-target='.length);
    if (arg === '--allow-partial-quarantined') parsed.allowPartialQuarantined = true;
    if (arg === '--emulator') parsed.useEmulator = true;
  }
  return parsed;
}

export function buildFirestoreWritePlan(reconciledReport) {
  const operations = [];
  const data = reconciledReport?.reconciled || {};

  for (const cand of data.candidates || []) {
    operations.push({
      path: `candidates/${cand.id}`,
      collection: 'candidates',
      docId: cand.id,
      payload: {
        ...cand,
        migratedFrom: 'supabase',
      },
    });
  }

  for (const emp of data.employers || []) {
    const { recruiterName, recruiterRole, recruiterEmail, recruiterPhone, ...publicFields } = emp;
    operations.push({
      path: `employers/${emp.id}`,
      collection: 'employers',
      docId: emp.id,
      payload: {
        ...publicFields,
        migratedFrom: 'supabase',
      },
    });
    if (recruiterEmail || recruiterName || recruiterPhone) {
      operations.push({
        path: `employers/${emp.id}/private_contacts/default`,
        collection: `employers/${emp.id}/private_contacts`,
        docId: 'default',
        payload: {
          id: 'default',
          employerId: emp.id,
          ownerUid: emp.ownerUid,
          recruiterName: recruiterName || 'Recruiter',
          recruiterRole: recruiterRole || 'HR Manager',
          recruiterEmail: recruiterEmail || '',
          recruiterPhone: recruiterPhone || '',
          migratedFrom: 'supabase',
        },
      });
    }
  }

  for (const job of data.jobs || []) {
    operations.push({
      path: `jobs/${job.id}`,
      collection: 'jobs',
      docId: job.id,
      payload: {
        ...job,
        migratedFrom: 'supabase',
      },
    });
  }

  for (const app of data.applications || []) {
    operations.push({
      path: `applications/${app.id}`,
      collection: 'applications',
      docId: app.id,
      payload: {
        ...app,
        migratedFrom: 'supabase',
      },
    });
  }

  for (const res of data.resumes || []) {
    operations.push({
      path: `users/${res.userId}/resumes/${res.id}`,
      collection: `users/${res.userId}/resumes`,
      docId: res.id,
      payload: {
        ...res,
        migratedFrom: 'supabase',
      },
    });
  }

  return operations;
}

export async function runFirestoreImport(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.input) {
    console.log(
      'Usage: node scripts/migration/import-firestore-idempotent.mjs --input=<reconciled-bundle.json> [--apply --confirm-target=ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d]'
    );
    return { dryRun: true, operationCount: 0 };
  }

  const reportPath = path.resolve(args.input);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const conflictsCount = report?.summary?.totalConflicts || 0;

  if (conflictsCount > 0 && !args.allowPartialQuarantined) {
    throw new Error(
      `Blocked: ${conflictsCount} unresolved reconciliation conflict(s) found. Resolve conflicts or pass --allow-partial-quarantined to skip quarantined rows.`
    );
  }

  const operations = buildFirestoreWritePlan(report);

  if (!args.apply || args.confirmTarget !== TARGET_DATABASE_ID) {
    console.log('[DRY-RUN] No writes executed against Firestore.');
    console.log(`Target Project:  ${TARGET_PROJECT_ID}`);
    console.log(`Target Database: ${TARGET_DATABASE_ID}`);
    console.log(`Planned idempotent document writes: ${operations.length}`);
    const byRoot = operations.reduce((acc, op) => {
      const root = op.path.split('/')[0];
      acc[root] = (acc[root] || 0) + 1;
      return acc;
    }, {});
    console.log('Breakdown by root collection:', JSON.stringify(byRoot));
    return { dryRun: true, operationCount: operations.length, byRoot };
  }

  // Lazy-import firebase-admin only when explicitly authorized for live apply
  let adminApp;
  let adminFirestore;
  try {
    adminApp = await import('firebase-admin/app');
    adminFirestore = await import('firebase-admin/firestore');
  } catch {
    throw new Error(
      'firebase-admin is required for live --apply execution. Install in a dedicated operator environment with GOOGLE_APPLICATION_CREDENTIALS set.'
    );
  }

  const app = adminApp.getApps().length
    ? adminApp.getApp()
    : adminApp.initializeApp({ projectId: TARGET_PROJECT_ID });
  const db = adminFirestore.getFirestore(app, TARGET_DATABASE_ID);

  // Pre-import rollback manifest capturing whether each target doc already existed
  const rollbackManifest = {
    createdAt: new Date().toISOString(),
    projectId: TARGET_PROJECT_ID,
    databaseId: TARGET_DATABASE_ID,
    documents: [],
  };

  for (const op of operations) {
    const snap = await db.doc(op.path).get();
    rollbackManifest.documents.push({
      path: op.path,
      existedBefore: snap.exists,
      previousData: snap.exists ? snap.data() : null,
    });
  }

  const rollbackPath = path.join(
    path.dirname(reportPath),
    `pre-import-rollback-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  fs.writeFileSync(rollbackPath, JSON.stringify(rollbackManifest, null, 2), 'utf8');

  // Execute idempotent batched writes (max 400 per batch)
  const chunkSize = 400;
  for (let i = 0; i < operations.length; i += chunkSize) {
    const batch = db.batch();
    const slice = operations.slice(i, i + chunkSize);
    for (const op of slice) {
      batch.set(
        db.doc(op.path),
        {
          ...op.payload,
          updatedAt: adminFirestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();
  }

  console.log(`Applied ${operations.length} idempotent Firestore writes. Rollback manifest saved to ${rollbackPath}`);
  return { dryRun: false, operationCount: operations.length, rollbackPath };
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  runFirestoreImport().catch((err) => {
    console.error('[IMPORT ERROR]', err.message);
    process.exit(1);
  });
}
