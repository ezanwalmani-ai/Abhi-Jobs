import {
  auth,
  db,
  doc,
  getDoc,
  getDocs,
  collection,
  runTransaction,
  serverTimestamp,
} from '../lib/firebase';
import type { CandidateProfile, User } from '../types';

export const CANDIDATE_ID_LABEL = 'ABHI JOBS Candidate ID';

export function isValidCandidateCode(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9][0-9]{3}$/.test(value.trim());
}

export interface CandidateIdCapacityStats {
  usedCount: number;
  remainingCount: number;
  capacity: number;
  exhausted: boolean;
  utilizationPercent: number;
  capacityAlerts: Array<{
    detectedAt: string;
    usedCount: number;
    capacity: number;
    message: string;
  }>;
}

export interface EnsureCandidateIdResult {
  ok: boolean;
  candidateCode?: string;
  alreadyAssigned?: boolean;
  capacityExhausted?: boolean;
  error?: string;
}

async function getBearerAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }
    } catch {
      // ignore
    }
  }
  return headers;
}

/**
 * Ensures the target candidate UID has a unique, immutable 4-digit numeric
 * ABHI JOBS Candidate ID (1000-9999) stored in:
 *  - /candidate_id_registry/{code} (hard DB-level uniqueness lock)
 *  - /users/{uid}.candidateCode
 *  - /candidates/{uid}.candidateCode (if doc exists)
 *
 * Uses backend cryptographic generation + Firestore atomic runTransaction with
 * automatic collision retry and safe capacity-exhaustion handling.
 */
export async function ensureCandidateCodeAssigned(
  targetUid: string,
  options?: {
    knownMappings?: Array<{ userUid: string; candidateCode: string }>;
  }
): Promise<EnsureCandidateIdResult> {
  if (!targetUid || !auth.currentUser) {
    return { ok: false, error: 'Sign-in is required to assign a Candidate ID.' };
  }

  try {
    // 1. Check existing Firestore /users/{uid} and /candidates/{uid} first to preserve immutability
    const userRef = doc(db, 'users', targetUid);
    const candRef = doc(db, 'candidates', targetUid);
    const [userSnap, candSnap] = await Promise.all([
      getDoc(userRef).catch(() => null),
      getDoc(candRef).catch(() => null),
    ]);

    const userExistingCode = userSnap?.exists() ? userSnap.data()?.candidateCode : undefined;
    const candExistingCode = candSnap?.exists() ? candSnap.data()?.candidateCode : undefined;
    const existingCode = isValidCandidateCode(candExistingCode)
      ? candExistingCode.trim()
      : isValidCandidateCode(userExistingCode)
      ? userExistingCode.trim()
      : undefined;

    if (existingCode) {
      // Make sure both /users and /candidates + registry are synchronized if one was missing the code
      const needsSync =
        (userSnap?.exists() && !isValidCandidateCode(userExistingCode)) ||
        (candSnap?.exists() && !isValidCandidateCode(candExistingCode));

      if (needsSync) {
        await runTransaction(db, async (tx) => {
          const uSnap = await tx.get(userRef);
          const cSnap = await tx.get(candRef);
          const regRef = doc(db, 'candidate_id_registry', existingCode);
          const regSnap = await tx.get(regRef);

          if (!regSnap.exists()) {
            tx.set(regRef, {
              candidateCode: existingCode,
              userId: targetUid,
              assignedAt: serverTimestamp(),
            });
          }
          if (uSnap.exists() && !isValidCandidateCode(uSnap.data()?.candidateCode)) {
            tx.update(userRef, { candidateCode: existingCode });
          }
          if (cSnap.exists() && !isValidCandidateCode(cSnap.data()?.candidateCode)) {
            tx.update(candRef, { candidateCode: existingCode, updatedAt: serverTimestamp() });
          }
        }).catch(() => {});
      }

      // Sync existing code to backend registry (best-effort) so backend never proposes it for others
      const headers = await getBearerAuthHeaders();
      fetch('/api/candidates/assign-id', {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetUid, existingCode }),
      }).catch(() => {});

      return { ok: true, candidateCode: existingCode, alreadyAssigned: true };
    }

    // 2. Request a cryptographically random 4-digit Candidate ID from backend & commit transactionally
    const headers = await getBearerAuthHeaders();
    const excludeCodes: string[] = [];

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const resp = await fetch('/api/candidates/assign-id', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetUid,
          excludeCodes: excludeCodes.length > 0 ? excludeCodes : undefined,
          forceNewOnCollision: attempt > 0,
          knownMappings: attempt === 0 ? options?.knownMappings : undefined,
        }),
      });

      const payload: any = await resp.json().catch(() => ({}));
      if (!resp.ok || !payload?.ok) {
        if (payload?.errorCode === 'CANDIDATE_ID_CAPACITY_EXHAUSTED' || resp.status === 507) {
          return {
            ok: false,
            capacityExhausted: true,
            error:
              payload?.error ||
              'All 9,000 standard 4-digit ABHI JOBS Candidate IDs (1000–9999) are assigned. Please notify an administrator.',
          };
        }
        return {
          ok: false,
          error: payload?.error || 'Could not generate a Candidate ID.',
        };
      }

      const proposedCode = String(payload.candidateCode || '').trim();
      if (!isValidCandidateCode(proposedCode)) {
        return { ok: false, error: 'Invalid Candidate ID format received from server.' };
      }

      try {
        const committedCode = await runTransaction(db, async (tx) => {
          const uSnap = await tx.get(userRef);
          const cSnap = await tx.get(candRef);

          // Re-check inside transaction in case another tab/request just assigned one
          const liveExisting =
            (cSnap.exists() && isValidCandidateCode(cSnap.data()?.candidateCode)
              ? String(cSnap.data()?.candidateCode).trim()
              : null) ||
            (uSnap.exists() && isValidCandidateCode(uSnap.data()?.candidateCode)
              ? String(uSnap.data()?.candidateCode).trim()
              : null);
          if (liveExisting) {
            return liveExisting;
          }

          const regRef = doc(db, 'candidate_id_registry', proposedCode);
          const regSnap = await tx.get(regRef);
          if (regSnap.exists()) {
            const regOwner = regSnap.data()?.userId;
            if (regOwner !== targetUid) {
              throw new Error('CANDIDATE_ID_COLLISION');
            }
          } else {
            tx.set(regRef, {
              candidateCode: proposedCode,
              userId: targetUid,
              assignedAt: serverTimestamp(),
            });
          }

          if (uSnap.exists()) {
            tx.update(userRef, { candidateCode: proposedCode });
          }
          if (cSnap.exists()) {
            tx.update(candRef, {
              candidateCode: proposedCode,
              updatedAt: serverTimestamp(),
            });
          }
          return proposedCode;
        });

        return { ok: true, candidateCode: committedCode, alreadyAssigned: false };
      } catch (txErr: any) {
        const msg = txErr instanceof Error ? txErr.message : String(txErr);
        if (msg.includes('CANDIDATE_ID_COLLISION')) {
          excludeCodes.push(proposedCode);
          continue;
        }
        throw txErr;
      }
    }

    return {
      ok: false,
      error: 'Could not reserve a unique Candidate ID after multiple attempts. Please retry.',
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Candidate ID assignment failed.',
    };
  }
}

/**
 * Fetches server-side 4-digit Candidate ID pool utilization & capacity alerts (Admin only).
 */
export async function fetchCandidateIdCapacityAdmin(): Promise<CandidateIdCapacityStats | null> {
  try {
    const headers = await getBearerAuthHeaders();
    const resp = await fetch('/api/admin/candidates/id-capacity', { headers });
    if (!resp.ok) return null;
    return (await resp.json()) as CandidateIdCapacityStats;
  } catch {
    return null;
  }
}

/**
 * Admin backfill utility: assigns unique 4-digit ABHI JOBS Candidate IDs to all existing
 * candidate/job-seeker accounts that do not yet have one, without altering internal UIDs
 * or any existing applications/enrolments/profile records.
 */
export async function backfillMissingCandidateCodesAdmin(
  users: User[],
  candidates: CandidateProfile[]
): Promise<{
  assignedCount: number;
  skippedCount: number;
  failedCount: number;
  capacityExhausted: boolean;
  errors: string[];
}> {
  // Gather all currently known Firestore mappings (including registry) so backend never collides
  const knownMap = new Map<string, string>();
  try {
    const regSnap = await getDocs(collection(db, 'candidate_id_registry'));
    regSnap.docs.forEach((d) => {
      const data = d.data();
      if (isValidCandidateCode(data?.candidateCode) && typeof data?.userId === 'string') {
        knownMap.set(data.userId, String(data.candidateCode).trim());
      }
    });
  } catch {
    // Non-fatal; fall back to loaded users & candidates
  }

  users.forEach((u) => {
    if (isValidCandidateCode(u.candidateCode)) {
      knownMap.set(u.id, u.candidateCode.trim());
    }
  });
  candidates.forEach((c) => {
    if (isValidCandidateCode(c.candidateCode)) {
      knownMap.set(c.userId || c.id, c.candidateCode.trim());
    }
  });

  const knownMappings = Array.from(knownMap.entries()).map(([userUid, candidateCode]) => ({
    userUid,
    candidateCode,
  }));

  // Target every candidate profile AND every job_seeker user missing a valid 4-digit ID
  const targetUidSet = new Set<string>();
  candidates.forEach((c) => {
    const uid = c.userId || c.id;
    if (uid && !isValidCandidateCode(c.candidateCode)) {
      targetUidSet.add(uid);
    }
  });
  users.forEach((u) => {
    if ((u.role === 'job_seeker' || u.role === 'candidate') && !isValidCandidateCode(u.candidateCode)) {
      targetUidSet.add(u.id);
    }
  });

  let assignedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let capacityExhausted = false;
  const errors: string[] = [];

  let firstCall = true;
  for (const uid of targetUidSet) {
    const res = await ensureCandidateCodeAssigned(uid, {
      knownMappings: firstCall ? knownMappings : undefined,
    });
    firstCall = false;

    if (res.ok && res.candidateCode) {
      if (res.alreadyAssigned) {
        skippedCount += 1;
      } else {
        assignedCount += 1;
      }
    } else if (res.capacityExhausted) {
      capacityExhausted = true;
      errors.push(res.error || 'Candidate ID pool capacity exhausted.');
      break;
    } else {
      failedCount += 1;
      if (res.error) errors.push(`${uid}: ${res.error}`);
    }
  }

  return {
    assignedCount,
    skippedCount,
    failedCount,
    capacityExhausted,
    errors,
  };
}
