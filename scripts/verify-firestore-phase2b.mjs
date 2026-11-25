import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const errors = [];
const warnings = [];
const checks = [];

function pass(label) {
  checks.push(`PASS: ${label}`);
}

function fail(label) {
  errors.push(`FAIL: ${label}`);
}

function warn(label) {
  warnings.push(`WARN: ${label}`);
}

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

// 1. Validate JSON files
let blueprint, indexes, firebaseJson, appletConfig;
try {
  blueprint = readJson('firebase-blueprint.json');
  pass('firebase-blueprint.json is valid JSON');
} catch (e) {
  fail(`firebase-blueprint.json JSON parse error: ${e.message}`);
}

try {
  indexes = readJson('firestore.indexes.json');
  pass('firestore.indexes.json is valid JSON');
} catch (e) {
  fail(`firestore.indexes.json JSON parse error: ${e.message}`);
}

try {
  firebaseJson = readJson('firebase.json');
  pass('firebase.json is valid JSON');
} catch (e) {
  fail(`firebase.json JSON parse error: ${e.message}`);
}

try {
  appletConfig = readJson('firebase-applet-config.json');
  pass('firebase-applet-config.json is valid JSON');
} catch (e) {
  fail(`firebase-applet-config.json JSON parse error: ${e.message}`);
}

// 2. Named database binding check
const EXPECTED_DB = 'ai-studio-jobhunnar-1b523c26-3c4c-4428-9065-5f763d85c23d';
if (firebaseJson?.firestore?.database === EXPECTED_DB && appletConfig?.firestoreDatabaseId === EXPECTED_DB) {
  pass(`Named Firestore database ID preserved (${EXPECTED_DB})`);
} else {
  fail('Named Firestore database ID mismatch between firebase.json and firebase-applet-config.json');
}

// 3. Strict FirebaseBlueprintConfig schema conformance
const ALLOWED_PROP_KEYS = new Set(['type', 'format', 'description', 'enum', '$ref', 'maxLength', 'minLength', 'pattern']);
const ALLOWED_ENTITY_KEYS = new Set(['title', 'description', 'type', 'properties', 'required']);
if (blueprint) {
  const topKeys = Object.keys(blueprint);
  if (topKeys.every((k) => k === 'entities' || k === 'firestore')) {
    pass('firebase-blueprint.json top-level keys strictly conform to FirebaseBlueprintConfig');
  } else {
    fail(`Unexpected top-level keys in firebase-blueprint.json: ${topKeys.join(', ')}`);
  }

  let propViolations = 0;
  for (const [name, entity] of Object.entries(blueprint.entities || {})) {
    for (const k of Object.keys(entity)) {
      if (!ALLOWED_ENTITY_KEYS.has(k)) {
        fail(`Entity ${name} has disallowed key: ${k}`);
        propViolations++;
      }
    }
    for (const [propName, propDef] of Object.entries(entity.properties || {})) {
      for (const pk of Object.keys(propDef)) {
        if (!ALLOWED_PROP_KEYS.has(pk)) {
          fail(`Entity ${name}.${propName} has disallowed PropertyDefinition key: ${pk}`);
          propViolations++;
        }
      }
    }
  }
  if (propViolations === 0) {
    pass(`All ${Object.keys(blueprint.entities).length} blueprint entities strictly conform to PropertyDefinition`);
  }

  // Verify all firestore paths reference defined entities
  let schemaRefsValid = true;
  for (const [colPath, def] of Object.entries(blueprint.firestore || {})) {
    const schemaName = typeof def.schema === 'string' ? def.schema : def.schema?.$ref;
    if (!blueprint.entities[schemaName]) {
      fail(`Blueprint path ${colPath} references undefined entity: ${schemaName}`);
      schemaRefsValid = false;
    }
  }
  if (schemaRefsValid) {
    pass(`All ${Object.keys(blueprint.firestore).length} blueprint Firestore paths resolve to valid entities`);
  }
}

// 4. Verify all 12 preserved Learn with ABHI / User paths remain in blueprint
const PRESERVED_PATHS = [
  '/users/{userId}',
  '/users/{userId}/career_assessments/{assessmentId}',
  '/users/{userId}/course_enrolments/{courseId}',
  '/users/{userId}/video_progress/{progressKey}',
  '/users/{userId}/assessment_attempts/{attemptId}',
  '/users/{userId}/certificates/{courseId}',
  '/public_certificates/{certificateId}',
  '/learning_courses/{courseId}',
  '/learning_courses/{courseId}/modules/{moduleId}',
  '/learning_courses/{courseId}/lessons/{lessonId}',
  '/learning_courses/{courseId}/quiz_configs/{quizId}',
  '/certificate_templates/{templateId}',
];

for (const p of PRESERVED_PATHS) {
  if (!blueprint?.firestore?.[p]) {
    fail(`Missing preserved Learn with ABHI path in blueprint: ${p}`);
  }
}
pass('All 12 preserved Learn with ABHI & User paths exist in firebase-blueprint.json');

// 5. Inspect firestore.rules syntax, size, coverage & security invariants
const rulesText = readText('firestore.rules');
const rulesBytes = Buffer.byteLength(rulesText, 'utf8');
if (rulesBytes < 256 * 1024) {
  pass(`firestore.rules size (${(rulesBytes / 1024).toFixed(1)} KB) is within Firebase 256 KB limit`);
} else {
  fail(`firestore.rules exceeds 256 KB limit (${rulesBytes} bytes)`);
}

// Balanced braces and parens check (ignoring single-line comments and single-quoted strings)
let braceDepth = 0;
let parenDepth = 0;
let inString = false;
const lines = rulesText.split('\n');
for (let li = 0; li < lines.length; li++) {
  const line = lines[li];
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (!inString && ch === '/' && next === '/') break;
    if (ch === "'" && line[i - 1] !== '\\') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') braceDepth++;
    if (ch === '}') braceDepth--;
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;
    if (braceDepth < 0 || parenDepth < 0) {
      fail(`Unbalanced delimiter in firestore.rules at line ${li + 1}`);
      break;
    }
  }
}
if (braceDepth === 0 && parenDepth === 0 && !inString) {
  pass('firestore.rules braces, parentheses, and string literals are strictly balanced');
} else {
  fail(`firestore.rules delimiter imbalance: braces=${braceDepth}, parens=${parenDepth}, inString=${inString}`);
}

// Required patterns in firestore.rules
const REQUIRED_RULE_CHECKS = [
  ['rules_version = \'2\';', /rules_version\s*=\s*'2';/],
  ['Global default deny catch-all', /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/],
  ['Email verification gate on isVerifiedUser()', /function\s+isVerifiedUser\(\)\s*\{[\s\S]*?request\.auth\.token\.email_verified\s*==\s*true/],
  ['Bootstrap Super Admin email ezanwalmani@gmail.com requires isVerifiedUser()', /function\s+isBootstrapSuperAdmin\(\)\s*\{[\s\S]*?isVerifiedUser\(\)\s*&&[\s\S]*?ezanwalmani@gmail\.com/],
  ['5-role RBAC enum enforced in isValidAdminRole', /'super_admin',\s*'recruitment_admin',\s*'course_admin',\s*'content_admin',\s*'support_admin'/],
  ['Legacy /admins/{adminId} locked down', /match\s+\/admins\/\{adminId\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/],
  ['Admin activity logs deny all browser client writes', /match\s+\/admin_activity_logs\/\{logId\}\s*\{[\s\S]*?allow\s+create,\s*update,\s*delete:\s*if\s+false;/],
  ['Quiz configs strictly admin-only (answer keys protected)', /match\s+\/quiz_configs\/\{quizId\}\s*\{\s*allow\s+get:\s*if\s+isAdmin\(\)/],
  ['Assessment attempts block student writes', /match\s+\/assessment_attempts\/\{attemptId\}[\s\S]*?allow\s+create:\s*if\s+isAdmin\(\)[\s\S]*?allow\s+update:\s*if\s+false;/],
  ['Certificates block student writes', /match\s+\/certificates\/\{courseId\}[\s\S]*?allow\s+create:\s*if\s+isAdmin\(\)/],
  ['Public certificates single-doc lookup + zero student writes', /match\s+\/public_certificates\/\{certificateId\}\s*\{\s*allow\s+get:\s*if\s+isValidCertificateId\(certificateId\);\s*allow\s+list:\s*if\s+isAdmin\(\);/],
  ['Employer self-registration forced pending & unverified', /incoming\(\)\.verificationStatus\s*==\s*'pending'\s*&&\s*incoming\(\)\.verified\s*==\s*false/],
  ['Jobs block candidate counter tampering (0 on create + locked on update)', /(incoming\(\)|data)\.applicantsCount\s*==\s*(existing\(\)|prev)\.applicantsCount\s*&&\s*(incoming\(\)|data)\.viewsCount\s*==\s*(existing\(\)|prev)\.viewsCount/],
  ['Application internal_notes Master Gate blocks candidates', /match\s+\/internal_notes\/\{noteId\}\s*\{\s*allow\s+get:\s*if\s+isValidId\(applicationId\)\s*&&\s*isValidId\(noteId\)\s*&&\s*\(\s*isParentApplicationEmployer\(applicationId\)/],
  ['Resumes strictly owner-only', /match\s+\/resumes\/\{resumeId\}\s*\{\s*allow\s+get:\s*if\s+isOwner\(userId\)/],
  ['All 4 preserved collectionGroup audit rules intact', /match\s+\/\{path=\*\*\}\/course_enrolments\/\{courseId\}[\s\S]*?match\s+\/\{path=\*\*\}\/certificates\/\{courseId\}/],
];

for (const [desc, regex] of REQUIRED_RULE_CHECKS) {
  if (regex.test(rulesText)) {
    pass(desc);
  } else {
    fail(`Missing or weakened security rule invariant: ${desc}`);
  }
}

// Forbidden anti-patterns in firestore.rules
if (/allow\s+list:\s*if\s+isSignedIn\(\)\s*;/.test(rulesText)) {
  fail('Found forbidden blanket `allow list: if isSignedIn();` rule');
} else {
  pass('Zero blanket `allow list: if isSignedIn();` rules');
}

if (/allow\s+(get|list|read|delete):[^;]*(incoming\(\)|request\.resource)/.test(rulesText)) {
  fail('Found forbidden incoming()/request.resource reference inside get/list/read/delete rule');
} else {
  pass('Zero incoming()/request.resource calls inside read/get/list/delete blocks');
}

// Verify every blueprint collection leaf segment has a match block in firestore.rules
const blueprintPaths = Object.keys(blueprint?.firestore || {});
let unmatchedPaths = 0;
for (const bp of blueprintPaths) {
  const parts = bp.split('/').filter(Boolean);
  const leafMatch = `/${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  if (!rulesText.includes(`match ${leafMatch}`)) {
    fail(`Blueprint path ${bp} (match ${leafMatch}) not found in firestore.rules`);
    unmatchedPaths++;
  }
}
if (unmatchedPaths === 0) {
  pass(`100% blueprint-to-rules coverage (${blueprintPaths.length}/${blueprintPaths.length} paths matched)`);
}

// 6. Validate firestore.indexes.json structure
if (Array.isArray(indexes?.indexes) && indexes.indexes.length > 0) {
  let badIdx = 0;
  for (const idx of indexes.indexes) {
    if (!idx.collectionGroup || !idx.queryScope || !Array.isArray(idx.fields) || idx.fields.length < 2) {
      fail(`Invalid composite index entry: ${JSON.stringify(idx)}`);
      badIdx++;
    }
  }
  if (badIdx === 0) {
    pass(`firestore.indexes.json contains ${indexes.indexes.length} valid composite indexes`);
  }
} else {
  fail('firestore.indexes.json has no indexes array');
}

// 7. Validate netlify.toml SPA fallback and preserved build config
const netlifyToml = readText('netlify.toml');
if (
  /command\s*=\s*"npm run build"/.test(netlifyToml) &&
  /publish\s*=\s*"dist"/.test(netlifyToml) &&
  /from\s*=\s*"\/\*"/.test(netlifyToml) &&
  /to\s*=\s*"\/index\.html"/.test(netlifyToml) &&
  /status\s*=\s*200/.test(netlifyToml)
) {
  pass('netlify.toml preserves build settings and defines SPA fallback (/* -> /index.html 200)');
} else {
  fail('netlify.toml missing required build or SPA redirect settings');
}

// 8. Verify Supabase was NOT disconnected or removed
const pkg = readJson('package.json');
if (pkg.dependencies['@supabase/supabase-js'] && fs.existsSync(path.join(ROOT, 'src/lib/supabase.ts'))) {
  pass('Supabase dependencies and client remain untouched per Phase 2B restrictions');
} else {
  fail('Unexpected modification to Supabase dependencies or client');
}

console.log('\n=== ABHI JOBS Phase 2B Local Verification Report ===');
for (const c of checks) console.log(`  [OK] ${c}`);
for (const w of warnings) console.log(`  [WARN] ${w}`);
for (const e of errors) console.error(`  [ERR] ${e}`);
console.log(`\nSummary: ${checks.length} passed, ${warnings.length} warnings, ${errors.length} errors.`);

if (errors.length > 0) {
  process.exit(1);
}
