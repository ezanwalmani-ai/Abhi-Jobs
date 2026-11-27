import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const CANDIDATE_ID_MIN = 1000;
export const CANDIDATE_ID_MAX = 9999;
export const CANDIDATE_ID_CAPACITY = CANDIDATE_ID_MAX - CANDIDATE_ID_MIN + 1; // 9000 unique 4-digit IDs

export interface CandidateIdRecord {
  candidateCode: string;
  userUid: string;
  assignedAt: string;
}

export interface CandidateIdRegistryState {
  uidToCode: Record<string, string>;
  codeToRecord: Record<string, CandidateIdRecord>;
  capacityAlerts: Array<{
    detectedAt: string;
    usedCount: number;
    capacity: number;
    message: string;
  }>;
}

export interface CandidateIdAssignResult {
  ok: true;
  candidateCode: string;
  alreadyAssigned: boolean;
  assignedAt: string;
  usedCount: number;
  remainingCount: number;
  capacity: number;
}

export interface CandidateIdCapacityError {
  ok: false;
  errorCode: 'CANDIDATE_ID_CAPACITY_EXHAUSTED' | 'INVALID_UID';
  error: string;
  usedCount: number;
  remainingCount: number;
  capacity: number;
}

export function isValidFourDigitCandidateId(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9][0-9]{3}$/.test(value.trim());
}

function sanitizeUid(uid: unknown): string {
  if (typeof uid !== 'string') return '';
  const trimmed = uid.trim();
  if (!/^[a-zA-Z0-9_.:@-]{3,128}$/.test(trimmed)) return '';
  return trimmed;
}

export class CandidateIdStore {
  private readonly filePath: string;
  private state: CandidateIdRegistryState;

  constructor(storagePath?: string) {
    const defaultDir = path.resolve(process.cwd(), '.learning-data');
    this.filePath = storagePath
      ? path.resolve(storagePath)
      : path.join(defaultDir, 'candidate-id-registry.json');
    this.state = this.loadState();
  }

  private loadState(): CandidateIdRegistryState {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            uidToCode:
              parsed.uidToCode && typeof parsed.uidToCode === 'object' ? parsed.uidToCode : {},
            codeToRecord:
              parsed.codeToRecord && typeof parsed.codeToRecord === 'object'
                ? parsed.codeToRecord
                : {},
            capacityAlerts: Array.isArray(parsed.capacityAlerts) ? parsed.capacityAlerts : [],
          };
        }
      }
    } catch {
      // Fallback to fresh registry if corrupted
    }
    return {
      uidToCode: {},
      codeToRecord: {},
      capacityAlerts: [],
    };
  }

  private persistState(): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(this.state, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.filePath);
  }

  public getCandidateCodeForUid(uid: string): string | null {
    const safeUid = sanitizeUid(uid);
    if (!safeUid) return null;
    const code = this.state.uidToCode[safeUid];
    return isValidFourDigitCandidateId(code) ? code : null;
  }

  public getCapacityStats(): {
    usedCount: number;
    remainingCount: number;
    capacity: number;
    exhausted: boolean;
    utilizationPercent: number;
    capacityAlerts: CandidateIdRegistryState['capacityAlerts'];
  } {
    const usedCount = Object.keys(this.state.codeToRecord).length;
    const remainingCount = Math.max(0, CANDIDATE_ID_CAPACITY - usedCount);
    return {
      usedCount,
      remainingCount,
      capacity: CANDIDATE_ID_CAPACITY,
      exhausted: remainingCount === 0,
      utilizationPercent: Math.round((usedCount / CANDIDATE_ID_CAPACITY) * 1000) / 10,
      capacityAlerts: this.state.capacityAlerts.slice(-10),
    };
  }

  /**
   * Synchronize known UID -> 4-digit Candidate ID mappings from Firestore so restarts or
   * pre-existing cloud records are never duplicated or reused.
   */
  public syncKnownMappings(entries: Array<{ userUid: string; candidateCode: string }>): number {
    let changed = 0;
    const nowIso = new Date().toISOString();
    for (const entry of entries) {
      const safeUid = sanitizeUid(entry.userUid);
      const code = typeof entry.candidateCode === 'string' ? entry.candidateCode.trim() : '';
      if (!safeUid || !isValidFourDigitCandidateId(code)) continue;

      const existingByCode = this.state.codeToRecord[code];
      const existingByUid = this.state.uidToCode[safeUid];
      if (!existingByCode && !existingByUid) {
        this.state.uidToCode[safeUid] = code;
        this.state.codeToRecord[code] = {
          candidateCode: code,
          userUid: safeUid,
          assignedAt: nowIso,
        };
        changed += 1;
      }
    }
    if (changed > 0) {
      this.persistState();
    }
    return changed;
  }

  /**
   * Marks specific codes as already occupied externally (e.g., discovered via Firestore
   * transaction collision) so they will never be re-proposed or reused.
   */
  public markCodesOccupied(codes: string[], externalUidPrefix = 'external_firestore'): void {
    let changed = false;
    const nowIso = new Date().toISOString();
    for (const raw of codes) {
      const code = typeof raw === 'string' ? raw.trim() : '';
      if (!isValidFourDigitCandidateId(code)) continue;
      if (!this.state.codeToRecord[code]) {
        this.state.codeToRecord[code] = {
          candidateCode: code,
          userUid: `${externalUidPrefix}_${code}`,
          assignedAt: nowIso,
        };
        changed = true;
      }
    }
    if (changed) {
      this.persistState();
    }
  }

  /**
   * Assigns a cryptographically random, unique 4-digit numeric Candidate ID (1000-9999)
   * for the specified UID. Never derives from PII, never reuses IDs, and stops safely
   * when all 9,000 IDs are exhausted.
   */
  public assignCandidateId(
    uid: string,
    options?: {
      existingCode?: string;
      excludeCodes?: string[];
      forceNewOnCollision?: boolean;
    }
  ): CandidateIdAssignResult | CandidateIdCapacityError {
    const safeUid = sanitizeUid(uid);
    if (!safeUid) {
      const stats = this.getCapacityStats();
      return {
        ok: false,
        errorCode: 'INVALID_UID',
        error: 'A valid authenticated user identifier is required.',
        usedCount: stats.usedCount,
        remainingCount: stats.remainingCount,
        capacity: CANDIDATE_ID_CAPACITY,
      };
    }

    if (Array.isArray(options?.excludeCodes) && options.excludeCodes.length > 0) {
      this.markCodesOccupied(options.excludeCodes);
    }

    // Preserve immutability: if this UID already has an assigned ID (and caller isn't retrying a Firestore race collision)
    const currentCode = this.state.uidToCode[safeUid];
    if (
      currentCode &&
      isValidFourDigitCandidateId(currentCode) &&
      !options?.forceNewOnCollision &&
      !(options?.excludeCodes || []).includes(currentCode)
    ) {
      const rec = this.state.codeToRecord[currentCode];
      const stats = this.getCapacityStats();
      return {
        ok: true,
        candidateCode: currentCode,
        alreadyAssigned: true,
        assignedAt: rec?.assignedAt || new Date().toISOString(),
        usedCount: stats.usedCount,
        remainingCount: stats.remainingCount,
        capacity: CANDIDATE_ID_CAPACITY,
      };
    }

    // If caller provides an already-persisted valid Firestore code for this UID, register it once
    const existingCode =
      typeof options?.existingCode === 'string' ? options.existingCode.trim() : '';
    if (
      existingCode &&
      isValidFourDigitCandidateId(existingCode) &&
      !options?.forceNewOnCollision
    ) {
      const ownerRecord = this.state.codeToRecord[existingCode];
      if (!ownerRecord || ownerRecord.userUid === safeUid) {
        const nowIso = ownerRecord?.assignedAt || new Date().toISOString();
        this.state.uidToCode[safeUid] = existingCode;
        this.state.codeToRecord[existingCode] = {
          candidateCode: existingCode,
          userUid: safeUid,
          assignedAt: nowIso,
        };
        this.persistState();
        const stats = this.getCapacityStats();
        return {
          ok: true,
          candidateCode: existingCode,
          alreadyAssigned: true,
          assignedAt: nowIso,
          usedCount: stats.usedCount,
          remainingCount: stats.remainingCount,
          capacity: CANDIDATE_ID_CAPACITY,
        };
      }
    }

    // Capacity safeguard: check before attempting selection
    const usedCount = Object.keys(this.state.codeToRecord).length;
    if (usedCount >= CANDIDATE_ID_CAPACITY) {
      const alertMsg =
        'All 9,000 standard 4-digit ABHI JOBS Candidate IDs (1000–9999) have been assigned. New ID assignment has been paused to prevent duplicates or format changes. Please notify an administrator.';
      this.state.capacityAlerts.push({
        detectedAt: new Date().toISOString(),
        usedCount,
        capacity: CANDIDATE_ID_CAPACITY,
        message: alertMsg,
      });
      this.state.capacityAlerts = this.state.capacityAlerts.slice(-25);
      this.persistState();
      return {
        ok: false,
        errorCode: 'CANDIDATE_ID_CAPACITY_EXHAUSTED',
        error: alertMsg,
        usedCount,
        remainingCount: 0,
        capacity: CANDIDATE_ID_CAPACITY,
      };
    }

    // Fast cryptographically random sampling first
    let chosenCode: string | null = null;
    for (let attempt = 0; attempt < 48; attempt += 1) {
      const candidateNum = crypto.randomInt(CANDIDATE_ID_MIN, CANDIDATE_ID_MAX + 1);
      const candidateStr = String(candidateNum);
      if (!this.state.codeToRecord[candidateStr]) {
        chosenCode = candidateStr;
        break;
      }
    }

    // Deterministic fallback scan over remaining free pool (randomly picking one free ID)
    // Guarantees O(9000) exact completion even when 99.9% full
    if (!chosenCode) {
      const availablePool: string[] = [];
      for (let n = CANDIDATE_ID_MIN; n <= CANDIDATE_ID_MAX; n += 1) {
        const str = String(n);
        if (!this.state.codeToRecord[str]) {
          availablePool.push(str);
        }
      }
      if (availablePool.length === 0) {
        const alertMsg =
          'All 9,000 standard 4-digit ABHI JOBS Candidate IDs (1000–9999) are exhausted. Assignment stopped safely.';
        this.state.capacityAlerts.push({
          detectedAt: new Date().toISOString(),
          usedCount: CANDIDATE_ID_CAPACITY,
          capacity: CANDIDATE_ID_CAPACITY,
          message: alertMsg,
        });
        this.persistState();
        return {
          ok: false,
          errorCode: 'CANDIDATE_ID_CAPACITY_EXHAUSTED',
          error: alertMsg,
          usedCount: CANDIDATE_ID_CAPACITY,
          remainingCount: 0,
          capacity: CANDIDATE_ID_CAPACITY,
        };
      }
      const pickIndex = crypto.randomInt(0, availablePool.length);
      chosenCode = availablePool[pickIndex];
    }

    const nowIso = new Date().toISOString();
    this.state.uidToCode[safeUid] = chosenCode;
    this.state.codeToRecord[chosenCode] = {
      candidateCode: chosenCode,
      userUid: safeUid,
      assignedAt: nowIso,
    };
    this.persistState();

    const stats = this.getCapacityStats();
    return {
      ok: true,
      candidateCode: chosenCode,
      alreadyAssigned: false,
      assignedAt: nowIso,
      usedCount: stats.usedCount,
      remainingCount: stats.remainingCount,
      capacity: CANDIDATE_ID_CAPACITY,
    };
  }
}

export const defaultCandidateIdStore = new CandidateIdStore();
