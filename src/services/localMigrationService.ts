import { auth } from '../lib/firebase';
import type { CandidateProfile, Job } from '../types';
import type { ResumeData } from '../types/resume';
import {
  saveCandidateProfileToFirestore,
  setSavedJobInFirestore,
  recordRecentlyViewedJobInFirestore,
} from './recruitmentFirestoreService';
import { saveUserResume } from './resumeService';

export interface LocalStorageMigrationPreview {
  eligible: boolean;
  reason?: string;
  matchedEmail: string | null;
  candidateProfileFound: boolean;
  resumesCount: number;
  savedJobsCount: number;
  recentlyViewedCount: number;
  alreadyMigratedAt: string | null;
  sourceCandidate: CandidateProfile | null;
  sourceResumes: ResumeData[];
  sourceSavedJobIds: string[];
  sourceRecentlyViewedJobIds: string[];
}

export interface LocalStorageMigrationResult {
  success: boolean;
  migratedProfile: boolean;
  migratedResumes: number;
  migratedSavedJobs: number;
  migratedRecentlyViewed: number;
  skippedReasons: string[];
  completedAt: string;
}

const MIGRATION_MARKER_PREFIX = 'abhijobs_firestore_local_migrated_v1_';

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Scans browser localStorage for legacy recruitment records belonging STRICTLY to
 * the currently verified Firebase Auth user (matched by normalized email or UID).
 * Never silently imports another user's records.
 */
export function scanLocalStorageForAuthenticatedUser(): LocalStorageMigrationPreview {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.uid) {
    return {
      eligible: false,
      reason: 'Sign in with Firebase Authentication first to scan local browser data.',
      matchedEmail: null,
      candidateProfileFound: false,
      resumesCount: 0,
      savedJobsCount: 0,
      recentlyViewedCount: 0,
      alreadyMigratedAt: null,
      sourceCandidate: null,
      sourceResumes: [],
      sourceSavedJobIds: [],
      sourceRecentlyViewedJobIds: [],
    };
  }

  if (!fbUser.emailVerified) {
    return {
      eligible: false,
      reason: 'Verify your email address before importing legacy local data into Firestore.',
      matchedEmail: fbUser.email || null,
      candidateProfileFound: false,
      resumesCount: 0,
      savedJobsCount: 0,
      recentlyViewedCount: 0,
      alreadyMigratedAt: null,
      sourceCandidate: null,
      sourceResumes: [],
      sourceSavedJobIds: [],
      sourceRecentlyViewedJobIds: [],
    };
  }

  const normalizedEmail = (fbUser.email || '').trim().toLowerCase();
  const marker = localStorage.getItem(`${MIGRATION_MARKER_PREFIX}${fbUser.uid}`);

  // 1. Inspect legacy abhijobs_candidates for matching verified email or UID
  const storedCandidates = safeJsonParse<CandidateProfile[]>(
    localStorage.getItem('abhijobs_candidates')
  );
  const matchedCandidate =
    (Array.isArray(storedCandidates)
      ? storedCandidates.find(
          (c) =>
            c &&
            ((c.email && c.email.trim().toLowerCase() === normalizedEmail) ||
              c.userId === fbUser.uid ||
              c.id === fbUser.uid)
        )
      : null) || null;

  // 2. Collect structured resumes under current UID or matched legacy candidate ID
  const resumeCandidateIds = new Set<string>([fbUser.uid]);
  if (matchedCandidate?.userId) resumeCandidateIds.add(matchedCandidate.userId);
  if (matchedCandidate?.id) resumeCandidateIds.add(matchedCandidate.id);

  const resumesMap = new Map<string, ResumeData>();
  resumeCandidateIds.forEach((cid) => {
    const v2List = safeJsonParse<ResumeData[]>(localStorage.getItem(`abhijobs_resumes_v2_${cid}`));
    if (Array.isArray(v2List)) {
      v2List.forEach((r) => {
        if (!r || !r.id) return;
        const rEmail = (r.email || '').trim().toLowerCase();
        // Enforce ownership: either same UID or matching verified email (or empty email on matched legacy ID)
        if (cid === fbUser.uid || !rEmail || rEmail === normalizedEmail) {
          resumesMap.set(r.id, r);
        }
      });
    }
    const v1 = safeJsonParse<ResumeData>(localStorage.getItem(`abhijobs_resume_${cid}`));
    if (v1 && v1.id) {
      const rEmail = (v1.email || '').trim().toLowerCase();
      if (cid === fbUser.uid || !rEmail || rEmail === normalizedEmail) {
        resumesMap.set(v1.id, v1);
      }
    }
  });

  // 3. Saved jobs & recently viewed jobs (verify active session owner if present)
  const storedUsers = safeJsonParse<Array<{ id: string; email?: string }>>(
    localStorage.getItem('abhijobs_users')
  );
  const belongsToCurrentEmail =
    Boolean(matchedCandidate) ||
    Boolean(
      Array.isArray(storedUsers) &&
        storedUsers.some((u) => u.email?.trim().toLowerCase() === normalizedEmail)
    );

  const rawSaved = belongsToCurrentEmail
    ? safeJsonParse<string[]>(localStorage.getItem('abhijobs_saved_jobs')) || []
    : [];
  const rawViewed = belongsToCurrentEmail
    ? safeJsonParse<string[]>(localStorage.getItem('abhijobs_recently_viewed')) || []
    : [];

  const sourceSavedJobIds = Array.from(
    new Set(rawSaved.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))
  );
  const sourceRecentlyViewedJobIds = Array.from(
    new Set(rawViewed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))
  );

  const sourceResumes = Array.from(resumesMap.values());
  const hasAnything =
    Boolean(matchedCandidate) ||
    sourceResumes.length > 0 ||
    sourceSavedJobIds.length > 0 ||
    sourceRecentlyViewedJobIds.length > 0;

  return {
    eligible: hasAnything,
    reason: hasAnything
      ? undefined
      : 'No unimported legacy browser records were found for your verified email.',
    matchedEmail: normalizedEmail,
    candidateProfileFound: Boolean(matchedCandidate),
    resumesCount: sourceResumes.length,
    savedJobsCount: sourceSavedJobIds.length,
    recentlyViewedCount: sourceRecentlyViewedJobIds.length,
    alreadyMigratedAt: marker,
    sourceCandidate: matchedCandidate,
    sourceResumes,
    sourceSavedJobIds,
    sourceRecentlyViewedJobIds,
  };
}

/**
 * Executes an idempotent, user-consented import of the authenticated user's local
 * browser data into Firestore under their verified Firebase UID.
 */
export async function executeUserConsentedLocalMigration(
  knownJobs: Job[] = []
): Promise<LocalStorageMigrationResult> {
  const fbUser = auth.currentUser;
  if (!fbUser || !fbUser.uid || !fbUser.emailVerified) {
    throw new Error('A verified Firebase Authentication session is required to import local data.');
  }

  const preview = scanLocalStorageForAuthenticatedUser();
  const skippedReasons: string[] = [];
  let migratedProfile = false;
  let migratedResumes = 0;
  let migratedSavedJobs = 0;
  let migratedRecentlyViewed = 0;

  // 1. Candidate Profile (idempotent upsert under /candidates/{uid})
  if (preview.sourceCandidate) {
    try {
      await saveCandidateProfileToFirestore(fbUser.uid, {
        ...preview.sourceCandidate,
        id: fbUser.uid,
        userId: fbUser.uid,
        email: fbUser.email || preview.sourceCandidate.email,
      });
      migratedProfile = true;
    } catch (err: any) {
      skippedReasons.push(`Candidate profile skipped: ${err?.message || 'Firestore write failed'}`);
    }
  }

  // 2. Structured JSON Resumes (strips base64 payloads automatically)
  for (const resume of preview.sourceResumes) {
    try {
      const res = await saveUserResume(fbUser.uid, { ...resume, userId: fbUser.uid });
      if (res.success) migratedResumes += 1;
    } catch (err: any) {
      skippedReasons.push(`Resume ${resume.id} skipped: ${err?.message || 'Save failed'}`);
    }
  }

  // 3. Saved Jobs (idempotent doc write per jobId)
  const jobMap = new Map(knownJobs.map((j) => [j.id, j]));
  for (const jobId of preview.sourceSavedJobIds) {
    const matchedJob = jobMap.get(jobId);
    try {
      await setSavedJobInFirestore(
        fbUser.uid,
        {
          id: jobId,
          title: matchedJob?.title || `Saved Job (${jobId})`,
          companyName: matchedJob?.companyName || 'ABHI JOBS Employer',
        },
        true
      );
      migratedSavedJobs += 1;
    } catch (err: any) {
      skippedReasons.push(`Saved job ${jobId} skipped: ${err?.message || 'Write failed'}`);
    }
  }

  // 4. Recently Viewed Jobs (idempotent doc write per jobId)
  for (const jobId of preview.sourceRecentlyViewedJobIds.slice(0, 20)) {
    try {
      await recordRecentlyViewedJobInFirestore(fbUser.uid, jobId);
      migratedRecentlyViewed += 1;
    } catch (err: any) {
      skippedReasons.push(`Viewed job ${jobId} skipped: ${err?.message || 'Write failed'}`);
    }
  }

  const completedAt = new Date().toISOString();
  try {
    localStorage.setItem(`${MIGRATION_MARKER_PREFIX}${fbUser.uid}`, completedAt);
  } catch {
    // ignore storage quota
  }

  return {
    success: true,
    migratedProfile,
    migratedResumes,
    migratedSavedJobs,
    migratedRecentlyViewed,
    skippedReasons,
    completedAt,
  };
}
