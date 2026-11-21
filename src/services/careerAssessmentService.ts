import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  auth as firebaseAuth,
  db,
  OperationType,
  handleFirestoreError,
} from '../lib/firebase';
import { CareerAssessmentRecord } from '../types/careerAssessment';

const LOCAL_STORAGE_PREFIX = 'abhijobs_career_assessments_v1_';

function getStorageKey(userId: string): string {
  return `${LOCAL_STORAGE_PREFIX}${userId}`;
}

function normalizeTimestamp(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

function truncateStr(value: string | undefined, maxLen: number): string {
  return (value || '').trim().slice(0, maxLen);
}

/**
 * Sanitizes outgoing payloads strictly to match firebase-blueprint.json & firestore.rules bounds.
 */
function sanitizeRecordForPersistence(
  record: CareerAssessmentRecord,
  effectiveUserId: string
): CareerAssessmentRecord {
  const sanitizedId = (record.id || `assess_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  return {
    ...record,
    id: sanitizedId || `assess_${Date.now()}`,
    userId: effectiveUserId,
    currentStep: Math.min(7, Math.max(0, Math.floor(Number(record.currentStep) || 0))),
    basicInfo: {
      fullName: truncateStr(record.basicInfo.fullName, 120),
      email: truncateStr(record.basicInfo.email, 150),
      mobileNumber: truncateStr(record.basicInfo.mobileNumber, 30),
      currentCity: truncateStr(record.basicInfo.currentCity, 100),
      preferredJobLocation: truncateStr(record.basicInfo.preferredJobLocation, 120),
    },
    education: {
      highestQualification: truncateStr(record.education.highestQualification, 100),
      fieldOfStudy: truncateStr(record.education.fieldOfStudy, 120),
      graduationYear: truncateStr(record.education.graduationYear, 16),
      currentlyStudying: record.education.currentlyStudying,
    },
    experience: {
      experienceType: record.experience.experienceType,
      totalWorkExperience: truncateStr(record.experience.totalWorkExperience, 60),
      currentEmploymentStatus: truncateStr(record.experience.currentEmploymentStatus, 80),
      previousOrCurrentRole: truncateStr(record.experience.previousOrCurrentRole, 120),
      industryOfExperience: truncateStr(record.experience.industryOfExperience, 120),
    },
    careerPreferences: {
      preferredJobRoles: truncateStr(record.careerPreferences.preferredJobRoles, 240),
      preferredIndustries: (record.careerPreferences.preferredIndustries || [])
        .map((i) => truncateStr(i, 80))
        .filter(Boolean)
        .slice(0, 10),
      careerObjective: truncateStr(record.careerPreferences.careerObjective, 600),
      careerGoal: record.careerPreferences.careerGoal,
    },
    skillsEvaluation: { ...record.skillsEvaluation },
    practicalAnswers: { ...record.practicalAnswers },
    learningRecommendationConsent: Boolean(record.learningRecommendationConsent),
    recruitmentConsent: Boolean(record.recruitmentConsent),
  };
}

function readLocalRecords(userId: string): CareerAssessmentRecord[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && r.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
  } catch {
    return [];
  }
}

function writeLocalRecords(userId: string, records: CareerAssessmentRecord[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(records));
  } catch {
    // Graceful local storage quota handling
  }
}

function upsertLocalRecord(userId: string, record: CareerAssessmentRecord): void {
  const existing = readLocalRecords(userId);
  const idx = existing.findIndex((r) => r.id === record.id);
  const next =
    idx >= 0
      ? existing.map((r, i) => (i === idx ? record : r))
      : [record, ...existing];
  next.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime()
  );
  writeLocalRecords(userId, next);
}

/**
 * Checks whether the current session has an authenticated, email-verified Firebase user
 * matching Firestore rules requirements.
 */
function getVerifiedFirebaseUid(): string | null {
  const fbUser = firebaseAuth.currentUser;
  if (fbUser && fbUser.uid && fbUser.emailVerified) {
    return fbUser.uid;
  }
  return null;
}

/**
 * Loads all assessments strictly belonging to the authenticated candidate.
 * Never queries or reads any other candidate's documents.
 */
export async function loadCandidateAssessments(
  appUserId: string
): Promise<{
  latestSubmitted: CareerAssessmentRecord | null;
  activeDraft: CareerAssessmentRecord | null;
  history: CareerAssessmentRecord[];
  syncedFromCloud: boolean;
}> {
  const fbUid = getVerifiedFirebaseUid();
  const effectiveUid = fbUid || appUserId;

  let merged = readLocalRecords(effectiveUid);
  if (fbUid && appUserId && fbUid !== appUserId) {
    const appLocal = readLocalRecords(appUserId);
    appLocal.forEach((rec) => {
      if (!merged.some((m) => m.id === rec.id)) {
        merged.push({ ...rec, userId: effectiveUid });
      }
    });
  }

  let syncedFromCloud = false;

  if (fbUid) {
    const path = `users/${fbUid}/career_assessments`;
    try {
      const colRef = collection(db, 'users', fbUid, 'career_assessments');
      const q = query(colRef, where('userId', '==', fbUid));
      const snap = await getDocs(q);
      const cloudRecords: CareerAssessmentRecord[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        cloudRecords.push({
          ...(data as CareerAssessmentRecord),
          id: docSnap.id,
          userId: fbUid,
          createdAt: normalizeTimestamp(data.createdAt),
          updatedAt: normalizeTimestamp(data.updatedAt),
        });
      });

      cloudRecords.forEach((cloudRec) => {
        const localIdx = merged.findIndex((m) => m.id === cloudRec.id);
        if (localIdx === -1) {
          merged.push(cloudRec);
        } else {
          const localTime = new Date(merged[localIdx].updatedAt || 0).getTime();
          const cloudTime = new Date(cloudRec.updatedAt || 0).getTime();
          if (cloudTime >= localTime || cloudRec.status === 'submitted') {
            merged[localIdx] = cloudRec;
          }
        }
      });

      merged.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
      writeLocalRecords(effectiveUid, merged);
      syncedFromCloud = true;
    } catch (error) {
      // Surface structured error context for diagnostics while keeping local fallback working
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged by handleFirestoreError; continue gracefully with local records
      }
    }
  }

  const latestSubmitted = merged.find((r) => r.status === 'submitted') || null;
  const activeDraft = merged.find((r) => r.status === 'in_progress') || null;

  return {
    latestSubmitted,
    activeDraft,
    history: merged,
    syncedFromCloud,
  };
}

/**
 * Saves an in-progress draft so candidates can safely close and resume later.
 */
export async function saveAssessmentDraft(
  appUserId: string,
  record: CareerAssessmentRecord
): Promise<{ success: boolean; savedToCloud: boolean; record: CareerAssessmentRecord }> {
  const fbUid = getVerifiedFirebaseUid();
  const effectiveUid = fbUid || appUserId;
  const nowIso = new Date().toISOString();

  const sanitized = sanitizeRecordForPersistence(
    {
      ...record,
      status: 'in_progress',
      updatedAt: nowIso,
      createdAt: record.createdAt || nowIso,
    },
    effectiveUid
  );

  upsertLocalRecord(effectiveUid, sanitized);
  if (appUserId && appUserId !== effectiveUid) {
    upsertLocalRecord(appUserId, { ...sanitized, userId: appUserId });
  }

  let savedToCloud = false;
  if (fbUid) {
    const docPath = `users/${fbUid}/career_assessments/${sanitized.id}`;
    const docRef = doc(db, 'users', fbUid, 'career_assessments', sanitized.id);

    const payloadWithoutReport = {
      id: sanitized.id,
      userId: fbUid,
      status: 'in_progress' as const,
      currentStep: sanitized.currentStep,
      basicInfo: sanitized.basicInfo,
      education: sanitized.education,
      experience: sanitized.experience,
      careerPreferences: sanitized.careerPreferences,
      skillsEvaluation: sanitized.skillsEvaluation,
      practicalAnswers: sanitized.practicalAnswers,
      learningRecommendationConsent: sanitized.learningRecommendationConsent,
      recruitmentConsent: sanitized.recruitmentConsent,
    };

    try {
      // Attempt update first if document already exists; fall back to create with serverTimestamp
      await updateDoc(docRef, {
        currentStep: payloadWithoutReport.currentStep,
        basicInfo: payloadWithoutReport.basicInfo,
        education: payloadWithoutReport.education,
        experience: payloadWithoutReport.experience,
        careerPreferences: payloadWithoutReport.careerPreferences,
        skillsEvaluation: payloadWithoutReport.skillsEvaluation,
        practicalAnswers: payloadWithoutReport.practicalAnswers,
        learningRecommendationConsent: payloadWithoutReport.learningRecommendationConsent,
        recruitmentConsent: payloadWithoutReport.recruitmentConsent,
        updatedAt: serverTimestamp(),
      });
      savedToCloud = true;
    } catch {
      try {
        await setDoc(docRef, {
          ...payloadWithoutReport,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        savedToCloud = true;
      } catch (createErr) {
        try {
          handleFirestoreError(createErr, OperationType.WRITE, docPath);
        } catch {
          // Structured error logged; local draft remains safely preserved
        }
      }
    }
  }

  return { success: true, savedToCloud, record: sanitized };
}

/**
 * Submits the finalized Job Seeker Profile Evaluation Test with its calculated report.
 * Saved permanently to Firestore under the authenticated user's private subcollection.
 */
export async function submitCareerAssessment(
  appUserId: string,
  record: CareerAssessmentRecord
): Promise<{
  success: boolean;
  savedToCloud: boolean;
  record: CareerAssessmentRecord;
  error?: string;
}> {
  if (!record.report) {
    return {
      success: false,
      savedToCloud: false,
      record,
      error: 'Assessment report must be calculated before submission.',
    };
  }

  const fbUid = getVerifiedFirebaseUid();
  const effectiveUid = fbUid || appUserId;
  const nowIso = new Date().toISOString();

  const sanitized = sanitizeRecordForPersistence(
    {
      ...record,
      status: 'submitted',
      submittedAt: nowIso,
      updatedAt: nowIso,
      createdAt: record.createdAt || nowIso,
    },
    effectiveUid
  );

  upsertLocalRecord(effectiveUid, sanitized);
  if (appUserId && appUserId !== effectiveUid) {
    upsertLocalRecord(appUserId, { ...sanitized, userId: appUserId });
  }

  let savedToCloud = false;
  if (fbUid) {
    const docPath = `users/${fbUid}/career_assessments/${sanitized.id}`;
    const docRef = doc(db, 'users', fbUid, 'career_assessments', sanitized.id);

    const submitFields = {
      status: 'submitted' as const,
      currentStep: sanitized.currentStep,
      basicInfo: sanitized.basicInfo,
      education: sanitized.education,
      experience: sanitized.experience,
      careerPreferences: sanitized.careerPreferences,
      skillsEvaluation: sanitized.skillsEvaluation,
      practicalAnswers: sanitized.practicalAnswers,
      learningRecommendationConsent: sanitized.learningRecommendationConsent,
      recruitmentConsent: sanitized.recruitmentConsent,
      report: sanitized.report,
      submittedAt: sanitized.submittedAt,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(docRef, submitFields);
      savedToCloud = true;
    } catch {
      try {
        await setDoc(docRef, {
          id: sanitized.id,
          userId: fbUid,
          ...submitFields,
          createdAt: serverTimestamp(),
        });
        savedToCloud = true;
      } catch (writeErr) {
        try {
          handleFirestoreError(writeErr, OperationType.CREATE, docPath);
        } catch {
          // Structured error logged; local submitted report remains accessible
        }
      }
    }
  }

  return { success: true, savedToCloud, record: sanitized };
}
