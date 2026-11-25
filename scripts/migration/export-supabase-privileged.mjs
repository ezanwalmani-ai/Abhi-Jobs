#!/usr/bin/env node
/**
 * ABHI JOBS — Phase 5 Privileged Supabase Data Export Script (PREPARED — DO NOT RUN WITHOUT PRODUCTION APPROVAL)
 *
 * Reads credentials strictly from environment variables (never hardcoded):
 *   - SUPABASE_URL
 *   - SUPABASE_SECRET_KEY (preferred) or SUPABASE_SERVICE_ROLE_KEY
 *
 * Exports Supabase Auth users and recruitment tables bypassing RLS using the
 * privileged server key, computes SHA-256 checksums for every exported table,
 * and writes a timestamped export bundle to ./migration-artifacts/.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SUPABASE_TABLES = [
  'profiles',
  'candidates',
  'employers',
  'jobs',
  'applications',
  'interviews',
  'resumes',
  'hiring_enquiries',
  'course_enquiries',
  'website_content',
  'public_settings',
];

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function parseCliArgs(argv) {
  const args = {
    outDir: path.resolve(process.cwd(), 'migration-artifacts'),
    dryRun: true,
    confirmExport: false,
  };
  for (const arg of argv) {
    if (arg === '--execute') args.dryRun = false;
    if (arg === '--confirm-production-read') args.confirmExport = true;
    if (arg.startsWith('--out=')) args.outDir = path.resolve(process.cwd(), arg.slice('--out='.length));
  }
  return args;
}

async function fetchAllAuthUsers(supabaseUrl, privilegedKey) {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const url = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users?page=${page}&per_page=${perPage}`;
    const res = await fetch(url, {
      headers: {
        apikey: privilegedKey,
        Authorization: `Bearer ${privilegedKey}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Supabase Auth admin export failed on page ${page}: HTTP ${res.status}`);
    }
    const payload = await res.json();
    const batch = Array.isArray(payload?.users) ? payload.users : [];
    for (const u of batch) {
      // Export identity metadata only — NEVER export password hashes or sensitive secrets
      users.push({
        supabaseId: u.id,
        email: u.email || null,
        emailConfirmedAt: u.email_confirmed_at || null,
        phone: u.phone || null,
        createdAt: u.created_at || null,
        lastSignInAt: u.last_sign_in_at || null,
        role: u.user_metadata?.role || u.app_metadata?.role || 'jobseeker',
        displayName: u.user_metadata?.full_name || u.user_metadata?.name || null,
        providers: Array.isArray(u.app_metadata?.providers) ? u.app_metadata.providers : [],
      });
    }
    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}

async function fetchAllTableRows(supabaseUrl, privilegedKey, tableName) {
  const rows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(tableName)}?select=*&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        apikey: privilegedKey,
        Authorization: `Bearer ${privilegedKey}`,
        Prefer: 'count=exact',
      },
    });

    if (res.status === 404 || res.status === 400) {
      return { exists: false, rows: [] };
    }
    if (!res.ok) {
      throw new Error(`Failed exporting table "${tableName}" at offset ${offset}: HTTP ${res.status}`);
    }

    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return { exists: true, rows };
}

export async function runPrivilegedSupabaseExport(argv = process.argv.slice(2)) {
  const args = parseCliArgs(argv);
  const supabaseUrl = process.env.SUPABASE_URL;
  const privilegedKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (args.dryRun || !args.confirmExport) {
    console.log('[DRY-RUN] Privileged Supabase export is locked by default.');
    console.log('To execute against live Supabase after explicit production approval, run:');
    console.log('  SUPABASE_URL=... SUPABASE_SECRET_KEY=... node scripts/migration/export-supabase-privileged.mjs --execute --confirm-production-read');
    console.log('Tables queued for export:', ['auth.users', ...SUPABASE_TABLES].join(', '));
    return { dryRun: true, tables: SUPABASE_TABLES };
  }

  if (!supabaseUrl || !privilegedKey) {
    throw new Error('Missing SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in environment.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportDir = path.join(args.outDir, `supabase-export-${timestamp}`);
  fs.mkdirSync(exportDir, { recursive: true });

  const authUsers = await fetchAllAuthUsers(supabaseUrl, privilegedKey);
  const tables = {};
  const checksums = {};

  const authJson = JSON.stringify(authUsers, null, 2);
  fs.writeFileSync(path.join(exportDir, 'auth_users.json'), authJson, 'utf8');
  checksums['auth_users.json'] = { count: authUsers.length, sha256: sha256(authJson) };

  for (const table of SUPABASE_TABLES) {
    const result = await fetchAllTableRows(supabaseUrl, privilegedKey, table);
    tables[table] = result.rows;
    const json = JSON.stringify(result.rows, null, 2);
    const filename = `${table}.json`;
    fs.writeFileSync(path.join(exportDir, filename), json, 'utf8');
    checksums[filename] = {
      exists: result.exists,
      count: result.rows.length,
      sha256: sha256(json),
    };
  }

  const bundle = {
    exportedAt: new Date().toISOString(),
    sourceUrlHost: new URL(supabaseUrl).host,
    authUsers,
    tables,
  };

  const bundleJson = JSON.stringify(bundle, null, 2);
  fs.writeFileSync(path.join(exportDir, 'export-bundle.json'), bundleJson, 'utf8');

  const manifest = {
    exportedAt: bundle.exportedAt,
    sourceUrlHost: bundle.sourceUrlHost,
    bundleSha256: sha256(bundleJson),
    files: checksums,
  };
  fs.writeFileSync(path.join(exportDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`Export complete: ${exportDir}`);
  return { dryRun: false, exportDir, manifest };
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  runPrivilegedSupabaseExport().catch((err) => {
    console.error('[EXPORT ERROR]', err.message);
    process.exit(1);
  });
}
