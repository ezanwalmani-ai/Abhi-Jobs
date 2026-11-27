import {
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import type {
  JobSearchAlert,
  JobSearchAlertCriteria,
  JobSearchAlertFrequency,
} from '../types';

export const PENDING_ALERT_FILTERS_SESSION_KEY = 'abhijobs_pending_alert_filters';

const ALLOWED_WORK_MODES = new Set(['All', 'Remote', 'Hybrid', 'On-site']);
const ALLOWED_EMPLOYMENT_TYPES = new Set([
  'All',
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Temporary',
  'Freelance',
]);
const ALLOWED_EXPERIENCE_LEVELS = new Set([
  'All',
  'Fresher',
  '1-2_years',
  '3-5_years',
  '5_plus_years',
  'Junior',
  'Mid',
  'Senior',
  'Lead',
]);
const ALLOWED_SALARY_RANGES = new Set([
  'All',
  '0_20k',
  '20k_40k',
  '40k_60k',
  '60k_plus',
]);
const ALLOWED_FREQUENCIES = new Set<JobSearchAlertFrequency>([
  'instant',
  'daily',
  'weekly',
]);

const EXPERIENCE_LABELS: Record<string, string> = {
  Fresher: 'Fresher',
  '1-2_years': '1–2 yrs',
  '3-5_years': '3–5 yrs',
  '5_plus_years': '5+ yrs',
  Junior: 'Junior',
  Mid: 'Mid-level',
  Senior: 'Senior',
  Lead: 'Lead',
};

const SALARY_LABELS: Record<string, string> = {
  '0_20k': '₹0–₹20K/mo',
  '20k_40k': '₹20K–₹40K/mo',
  '40k_60k': '₹40K–₹60K/mo',
  '60k_plus': '₹60K+/mo',
};

const WORK_MODE_LABELS: Record<string, string> = {
  Remote: 'Work from home',
  Hybrid: 'Hybrid',
  'On-site': 'Office',
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function sanitizeJobSearchAlertCriteria(
  raw: Partial<JobSearchAlertCriteria>
): JobSearchAlertCriteria {
  const search = normalizeWhitespace(String(raw.search ?? '')).slice(0, 120);
  const location = normalizeWhitespace(String(raw.location ?? '')).slice(0, 100);
  const workModeRaw = normalizeWhitespace(String(raw.workMode ?? 'All'));
  const workMode = ALLOWED_WORK_MODES.has(workModeRaw) ? workModeRaw : 'All';

  const employmentTypeRaw = normalizeWhitespace(String(raw.employmentType ?? 'All'));
  const employmentType = ALLOWED_EMPLOYMENT_TYPES.has(employmentTypeRaw)
    ? employmentTypeRaw
    : 'All';

  const experienceLevelRaw = normalizeWhitespace(String(raw.experienceLevel ?? 'All'));
  const experienceLevel = ALLOWED_EXPERIENCE_LEVELS.has(experienceLevelRaw)
    ? experienceLevelRaw
    : 'All';

  const salaryRangeRaw = normalizeWhitespace(String(raw.salaryRange ?? 'All'));
  const salaryRange = ALLOWED_SALARY_RANGES.has(salaryRangeRaw)
    ? salaryRangeRaw
    : 'All';

  const department = (normalizeWhitespace(String(raw.department ?? 'All')) || 'All').slice(0, 80);
  const industry = (normalizeWhitespace(String(raw.industry ?? 'All')) || 'All').slice(0, 80);
  const selectedSkill = (normalizeWhitespace(String(raw.selectedSkill ?? 'All')) || 'All').slice(0, 80);
  const quickMinSalary = Boolean(raw.quickMinSalary);

  return {
    search,
    location,
    workMode,
    employmentType,
    experienceLevel,
    salaryRange,
    department,
    industry,
    selectedSkill,
    quickMinSalary,
  };
}

export function sanitizeAlertFrequency(
  raw: unknown,
  fallback: JobSearchAlertFrequency = 'daily'
): JobSearchAlertFrequency {
  if (typeof raw === 'string' && ALLOWED_FREQUENCIES.has(raw as JobSearchAlertFrequency)) {
    return raw as JobSearchAlertFrequency;
  }
  return fallback;
}

/**
 * Deterministic 64-bit FNV-1a dual-lane hash producing a valid Firestore document ID
 * matching ^[a-zA-Z0-9_\-]+$ (always <= 128 chars).
 */
function deterministicHexHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}`;
}

export function computeSearchAlertKey(rawCriteria: Partial<JobSearchAlertCriteria>): string {
  const c = sanitizeJobSearchAlertCriteria(rawCriteria);
  const canonical = JSON.stringify({
    search: c.search.toLowerCase(),
    location: c.location.toLowerCase(),
    workMode: c.workMode.toLowerCase(),
    employmentType: c.employmentType.toLowerCase(),
    experienceLevel: c.experienceLevel.toLowerCase(),
    salaryRange: c.salaryRange.toLowerCase(),
    department: c.department.toLowerCase(),
    industry: c.industry.toLowerCase(),
    selectedSkill: c.selectedSkill.toLowerCase(),
    quickMinSalary: c.quickMinSalary,
  });
  return `alert_${deterministicHexHash(canonical)}`;
}

export function buildSearchAlertLabel(rawCriteria: Partial<JobSearchAlertCriteria>): string {
  const c = sanitizeJobSearchAlertCriteria(rawCriteria);
  const parts: string[] = [];

  if (c.search) {
    parts.push(`"${c.search}"`);
  }
  if (c.location) {
    parts.push(c.location);
  }
  if (c.workMode !== 'All') {
    parts.push(WORK_MODE_LABELS[c.workMode] || c.workMode);
  }
  if (c.employmentType !== 'All') {
    parts.push(c.employmentType);
  }
  if (c.experienceLevel !== 'All') {
    parts.push(EXPERIENCE_LABELS[c.experienceLevel] || c.experienceLevel);
  }
  if (c.salaryRange !== 'All') {
    parts.push(SALARY_LABELS[c.salaryRange] || c.salaryRange);
  }
  if (c.quickMinSalary) {
    parts.push('₹20K+/mo');
  }
  if (c.department !== 'All') {
    parts.push(c.department);
  }
  if (c.industry !== 'All') {
    parts.push(c.industry);
  }
  if (c.selectedSkill !== 'All') {
    parts.push(`Skill: ${c.selectedSkill}`);
  }

  if (parts.length === 0) {
    return 'All Published Jobs';
  }
  return parts.join(' · ').slice(0, 180);
}

export function hasSpecificSearchCriteria(rawCriteria: Partial<JobSearchAlertCriteria>): boolean {
  const c = sanitizeJobSearchAlertCriteria(rawCriteria);
  return Boolean(
    c.search ||
      c.location ||
      c.workMode !== 'All' ||
      c.employmentType !== 'All' ||
      c.experienceLevel !== 'All' ||
      c.salaryRange !== 'All' ||
      c.department !== 'All' ||
      c.industry !== 'All' ||
      c.selectedSkill !== 'All' ||
      c.quickMinSalary
  );
}

export function buildJobSearchAlertPayload(params: {
  userId: string;
  email: string;
  criteria: Partial<JobSearchAlertCriteria>;
  frequency?: JobSearchAlertFrequency;
  enabled: boolean;
}) {
  const criteria = sanitizeJobSearchAlertCriteria(params.criteria);
  const queryKey = computeSearchAlertKey(criteria);
  const label = buildSearchAlertLabel(criteria);
  const frequency = sanitizeAlertFrequency(params.frequency, 'daily');
  const email = normalizeWhitespace(params.email).toLowerCase().slice(0, 150);

  return {
    id: queryKey,
    userId: params.userId,
    email,
    label,
    queryKey,
    ...criteria,
    frequency,
    enabled: Boolean(params.enabled),
  };
}

function toIsoString(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return '';
    }
  }
  return '';
}

function mapSnapshotToAlert(docId: string, data: Record<string, unknown>): JobSearchAlert {
  const criteria = sanitizeJobSearchAlertCriteria({
    search: typeof data.search === 'string' ? data.search : '',
    location: typeof data.location === 'string' ? data.location : '',
    workMode: typeof data.workMode === 'string' ? data.workMode : 'All',
    employmentType: typeof data.employmentType === 'string' ? data.employmentType : 'All',
    experienceLevel: typeof data.experienceLevel === 'string' ? data.experienceLevel : 'All',
    salaryRange: typeof data.salaryRange === 'string' ? data.salaryRange : 'All',
    department: typeof data.department === 'string' ? data.department : 'All',
    industry: typeof data.industry === 'string' ? data.industry : 'All',
    selectedSkill: typeof data.selectedSkill === 'string' ? data.selectedSkill : 'All',
    quickMinSalary: Boolean(data.quickMinSalary),
  });

  return {
    id: typeof data.id === 'string' ? data.id : docId,
    userId: typeof data.userId === 'string' ? data.userId : '',
    email: typeof data.email === 'string' ? data.email : '',
    label: typeof data.label === 'string' && data.label.trim() ? data.label : buildSearchAlertLabel(criteria),
    queryKey: typeof data.queryKey === 'string' ? data.queryKey : docId,
    ...criteria,
    frequency: sanitizeAlertFrequency(data.frequency, 'daily'),
    enabled: Boolean(data.enabled),
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export function subscribeUserJobAlerts(
  userId: string,
  onAlerts: (alerts: JobSearchAlert[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId) {
    onAlerts([]);
    return () => {};
  }

  const colPath = `users/${userId}/job_alerts`;
  const alertsQuery = query(
    collection(db, 'users', userId, 'job_alerts'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    alertsQuery,
    (snapshot) => {
      const mapped = snapshot.docs.map((snap) =>
        mapSnapshotToAlert(snap.id, snap.data() as Record<string, unknown>)
      );
      mapped.sort((a, b) => {
        const tA = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const tB = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        return tB - tA;
      });
      onAlerts(mapped);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveJobSearchAlertPreference(params: {
  userId: string;
  email: string;
  criteria: Partial<JobSearchAlertCriteria>;
  frequency?: JobSearchAlertFrequency;
  enabled: boolean;
}): Promise<JobSearchAlert> {
  const payload = buildJobSearchAlertPayload(params);
  const docPath = `users/${params.userId}/job_alerts/${payload.id}`;
  const docRef = doc(db, 'users', params.userId, 'job_alerts', payload.id);

  try {
    const existingSnap = await getDoc(docRef);
    const nowIso = new Date().toISOString();

    if (existingSnap.exists()) {
      await updateDoc(docRef, {
        email: payload.email,
        label: payload.label,
        frequency: payload.frequency,
        enabled: payload.enabled,
        updatedAt: serverTimestamp(),
      });
      const existingData = existingSnap.data() as Record<string, unknown>;
      return {
        ...payload,
        createdAt: toIsoString(existingData.createdAt) || nowIso,
        updatedAt: nowIso,
      };
    }

    await setDoc(docRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      ...payload,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function toggleJobSearchAlertEnabled(
  userId: string,
  alertId: string,
  enabled: boolean
): Promise<void> {
  const docPath = `users/${userId}/job_alerts/${alertId}`;
  const docRef = doc(db, 'users', userId, 'job_alerts', alertId);
  try {
    await updateDoc(docRef, {
      enabled: Boolean(enabled),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function updateJobSearchAlertFrequency(
  userId: string,
  alertId: string,
  frequency: JobSearchAlertFrequency
): Promise<void> {
  const safeFrequency = sanitizeAlertFrequency(frequency, 'daily');
  const docPath = `users/${userId}/job_alerts/${alertId}`;
  const docRef = doc(db, 'users', userId, 'job_alerts', alertId);
  try {
    await updateDoc(docRef, {
      frequency: safeFrequency,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteJobSearchAlert(
  userId: string,
  alertId: string
): Promise<void> {
  const docPath = `users/${userId}/job_alerts/${alertId}`;
  const docRef = doc(db, 'users', userId, 'job_alerts', alertId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export function stashAlertCriteriaForJobsPage(criteria: JobSearchAlertCriteria): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(
        PENDING_ALERT_FILTERS_SESSION_KEY,
        JSON.stringify(sanitizeJobSearchAlertCriteria(criteria))
      );
    }
  } catch {
    // Non-fatal in private browsing contexts
  }
}

export function consumeStashedAlertCriteria(): JobSearchAlertCriteria | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(PENDING_ALERT_FILTERS_SESSION_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_ALERT_FILTERS_SESSION_KEY);
    const parsed = JSON.parse(raw) as Partial<JobSearchAlertCriteria>;
    return sanitizeJobSearchAlertCriteria(parsed);
  } catch {
    return null;
  }
}
