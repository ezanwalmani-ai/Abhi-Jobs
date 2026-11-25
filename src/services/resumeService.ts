import {
  ResumeData,
  EMPTY_RESUME,
  DEFAULT_DESIGN_SETTINGS,
  EMPTY_SKILL_CATEGORIES,
  normalizeTemplateId,
  flattenSkillCategories,
} from '../types/resume';
import {
  auth as firebaseAuth,
  db,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from '../lib/firebase';
import { CandidateProfile } from '../types';

const MULTI_STORAGE_PREFIX = 'abhijobs_resumes_v2_';
const LEGACY_STORAGE_PREFIX = 'abhijobs_resume_';
const DRAFT_STORAGE_PREFIX = 'abhijobs_resume_draft_';

const BASE64_DATA_URI_PATTERN = /^data:[a-zA-Z0-9/+.-]+;base64,/i;

/**
 * Checks whether a value contains a raw base64/data URI binary payload.
 * Starter-tier Firestore documents strictly store structured JSON only — never raw PDFs, DOCX, or base64 images.
 */
export function containsBase64BinaryPayload(value: unknown): boolean {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return (
      BASE64_DATA_URI_PATTERN.test(trimmed) ||
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('data:application/')
    );
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsBase64BinaryPayload(item));
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some((v) => containsBase64BinaryPayload(v));
  }
  return false;
}

function sanitizeSafeExternalUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed || containsBase64BinaryPayload(trimmed)) return '';
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed.slice(0, 300);
  }
  // Allow clean domain-style handles (e.g., linkedin.com/in/...) without javascript:/data: protocols
  if (/^(javascript|vbscript|data|file):/i.test(trimmed)) return '';
  return trimmed.slice(0, 300);
}

/**
 * Produces a schema-compliant structured JSON Firestore payload for /users/{uid}/resumes/{resumeId}.
 * Strips any binary/base64 photo data so Firestore documents stay small, clean, and rules-compliant.
 */
export function sanitizeResumeForFirestore(
  resume: ResumeData,
  userId: string
): Record<string, unknown> {
  const cleanId = (resume.id || `res_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  const template = normalizeTemplateId(resume.design?.templateId || resume.template);

  return {
    id: cleanId,
    userId,
    title: (resume.title || 'My Professional Resume').trim().slice(0, 140),
    targetRole: (resume.targetRole || '').trim().slice(0, 140),
    fullName: (resume.fullName || '').trim().slice(0, 120),
    professionalTitle: (resume.professionalTitle || '').trim().slice(0, 140),
    email: (resume.email || '').trim().slice(0, 150),
    phone: (resume.phone || '').trim().slice(0, 30),
    city: (resume.city || '').trim().slice(0, 80),
    state: (resume.state || '').trim().slice(0, 80),
    linkedIn: sanitizeSafeExternalUrl(resume.linkedIn),
    portfolio: sanitizeSafeExternalUrl(resume.portfolio),
    summary: (resume.summary || '').trim().slice(0, 3000),
    template: template.slice(0, 64),
    design: {
      templateId: template,
      accentColor: String(resume.design?.accentColor || DEFAULT_DESIGN_SETTINGS.accentColor).slice(0, 32),
      fontFamily: String(resume.design?.fontFamily || DEFAULT_DESIGN_SETTINGS.fontFamily).slice(0, 64),
      fontSize: String(resume.design?.fontSize || DEFAULT_DESIGN_SETTINGS.fontSize).slice(0, 32),
      lineSpacing: String(resume.design?.lineSpacing || DEFAULT_DESIGN_SETTINGS.lineSpacing).slice(0, 32),
      margins: String(resume.design?.margins || DEFAULT_DESIGN_SETTINGS.margins).slice(0, 32),
      sectionOrder: Array.isArray(resume.design?.sectionOrder)
        ? resume.design.sectionOrder.slice(0, 20)
        : DEFAULT_DESIGN_SETTINGS.sectionOrder,
    },
    skillCategories: {
      technical: (resume.skillCategories?.technical || []).slice(0, 40),
      professional: (resume.skillCategories?.professional || []).slice(0, 40),
      industry: (resume.skillCategories?.industry || []).slice(0, 40),
      tools: (resume.skillCategories?.tools || []).slice(0, 40),
    },
    skills: (resume.skills || []).slice(0, 60).map((s) => String(s).slice(0, 80)),
    experiences: (resume.experiences || []).slice(0, 20),
    education: (resume.education || []).slice(0, 15),
    projects: (resume.projects || []).slice(0, 15),
    certifications: (resume.certifications || []).slice(0, 20),
    languages: (resume.languages || []).slice(0, 15),
    achievements: (resume.achievements || []).slice(0, 20),
    awards: (resume.awards || []).slice(0, 15),
    training: (resume.training || []).slice(0, 15),
    volunteer: (resume.volunteer || []).slice(0, 15),
    publications: (resume.publications || []).slice(0, 15),
    memberships: (resume.memberships || []).slice(0, 15),
    customSections: (resume.customSections || []).slice(0, 10),
    createdAt: resume.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp(),
  };
}

function getVerifiedFirebaseUidFor(userId: string): string | null {
  const fbUser = firebaseAuth.currentUser;
  if (fbUser && fbUser.uid === userId && fbUser.emailVerified) {
    return fbUser.uid;
  }
  return null;
}

function normalizeTimestamp(val: unknown): string {
  if (typeof val === 'string' && val.trim()) return val;
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

function ensureResumeShape(raw: Partial<ResumeData>, userId: string): ResumeData {
  const templateId = normalizeTemplateId(raw.design?.templateId || raw.template);
  const skillCategories = raw.skillCategories || {
    ...EMPTY_SKILL_CATEGORIES,
    technical: Array.isArray(raw.skills) ? [...raw.skills] : [],
  };
  const flatSkills = flattenSkillCategories(
    skillCategories,
    Array.isArray(raw.skills) ? raw.skills : []
  );

  // Strip base64 photo payloads from persisted resume shapes to guarantee Starter-tier safety
  const cleanPhotoUrl =
    raw.photoUrl && !containsBase64BinaryPayload(raw.photoUrl) ? raw.photoUrl : '';

  return {
    ...EMPTY_RESUME,
    ...raw,
    id: raw.id || `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    title:
      raw.title?.trim() ||
      (raw.professionalTitle ? `${raw.professionalTitle} Resume` : '') ||
      (raw.fullName ? `${raw.fullName} Resume` : 'My Professional Resume'),
    targetRole: raw.targetRole || raw.professionalTitle || '',
    linkedIn: sanitizeSafeExternalUrl(raw.linkedIn),
    portfolio: sanitizeSafeExternalUrl(raw.portfolio),
    photoUrl: cleanPhotoUrl,
    showPhoto: Boolean(cleanPhotoUrl && raw.showPhoto),
    experiences: Array.isArray(raw.experiences)
      ? raw.experiences.map((exp) => ({
          ...exp,
          responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
          achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
        }))
      : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    skills: flatSkills,
    skillCategories,
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    awards: Array.isArray(raw.awards) ? raw.awards : [],
    training: Array.isArray(raw.training) ? raw.training : [],
    volunteer: Array.isArray(raw.volunteer) ? raw.volunteer : [],
    publications: Array.isArray(raw.publications) ? raw.publications : [],
    memberships: Array.isArray(raw.memberships) ? raw.memberships : [],
    customSections: Array.isArray(raw.customSections) ? raw.customSections : [],
    template: templateId,
    design: {
      ...DEFAULT_DESIGN_SETTINGS,
      ...(raw.design || {}),
      templateId,
    },
    createdAt: normalizeTimestamp(raw.createdAt || raw.updatedAt),
    updatedAt: normalizeTimestamp(raw.updatedAt),
  };
}

function readLocalList(userId: string): ResumeData[] {
  try {
    const raw = localStorage.getItem(`${MULTI_STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && (!item.userId || item.userId === userId))
          .map((item) => ensureResumeShape(item, userId));
      }
    }
  } catch (err) {
    console.warn('Error reading resumes list:', err);
  }
  return [];
}

function writeLocalList(userId: string, resumes: ResumeData[]): void {
  try {
    localStorage.setItem(`${MULTI_STORAGE_PREFIX}${userId}`, JSON.stringify(resumes));
    if (resumes.length > 0) {
      localStorage.setItem(`${LEGACY_STORAGE_PREFIX}${userId}`, JSON.stringify(resumes[0]));
    }
  } catch (err) {
    console.error('LocalStorage multi-resume cache error:', err);
  }
}

/**
 * Lists all structured JSON resumes owned strictly by the authenticated user.
 * Loads authoritatively from Firestore (/users/{uid}/resumes) for verified Firebase users,
 * with local browser draft cache support when offline.
 */
export async function listUserResumes(userId: string): Promise<ResumeData[]> {
  if (!userId) return [];

  const byId = new Map<string, ResumeData>();
  const localList = readLocalList(userId);
  localList.forEach((r) => byId.set(r.id, r));

  // Migrate legacy single resume cache if empty
  if (byId.size === 0) {
    try {
      const legacyRaw = localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${userId}`);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (legacyParsed) {
          const migrated = ensureResumeShape(legacyParsed, userId);
          byId.set(migrated.id, migrated);
        }
      }
    } catch {
      // ignore
    }
  }

  // Authoritative Firestore read for verified Firebase Auth owner
  const verifiedUid = getVerifiedFirebaseUidFor(userId);
  if (verifiedUid) {
    try {
      const snap = await getDocs(collection(db, 'users', verifiedUid, 'resumes'));
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const remote = ensureResumeShape(
          {
            ...d,
            id: String(d.id || docSnap.id),
            userId: verifiedUid,
            createdAt: normalizeTimestamp(d.createdAt),
            updatedAt: normalizeTimestamp(d.updatedAt),
          },
          verifiedUid
        );
        const existing = byId.get(remote.id);
        if (!existing || new Date(remote.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
          byId.set(remote.id, remote);
        }
      });
    } catch (err) {
      console.warn('Firestore resumes load notice:', err);
    }
  }

  const sorted = Array.from(byId.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  if (sorted.length > 0) {
    writeLocalList(userId, sorted);
  }
  return sorted;
}

/**
 * Loads the primary/latest resume for backward compatibility.
 */
export async function loadUserResume(userId: string): Promise<ResumeData | null> {
  const list = await listUserResumes(userId);
  return list.length > 0 ? list[0] : null;
}

/**
 * Saves or updates a structured JSON resume belonging strictly to the authenticated user.
 * Syncs directly to Firestore (/users/{uid}/resumes/{resumeId}) without storing raw binary files.
 */
export async function saveUserResume(
  userId: string,
  resumeData: ResumeData
): Promise<{ success: boolean; resume?: ResumeData; syncedToFirestore?: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User is not authenticated' };

  const sanitized = ensureResumeShape(
    {
      ...resumeData,
      userId,
      updatedAt: new Date().toISOString(),
    },
    userId
  );

  const currentList = readLocalList(userId);
  const existingIndex = currentList.findIndex((r) => r.id === sanitized.id);
  const updatedList =
    existingIndex >= 0
      ? currentList.map((r, idx) => (idx === existingIndex ? sanitized : r))
      : [sanitized, ...currentList];

  updatedList.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  writeLocalList(userId, updatedList);
  clearResumeDraft(userId, sanitized.id);

  let syncedToFirestore = false;
  const verifiedUid = getVerifiedFirebaseUidFor(userId);
  if (verifiedUid) {
    try {
      const firestorePayload = sanitizeResumeForFirestore(sanitized, verifiedUid);
      const docId = String(firestorePayload.id);
      await setDoc(doc(db, 'users', verifiedUid, 'resumes', docId), firestorePayload);
      syncedToFirestore = true;
    } catch (err) {
      console.warn('Firestore resume sync notice:', err);
    }
  }

  return { success: true, resume: sanitized, syncedToFirestore };
}

/**
 * Duplicates an existing saved resume for targeting a different role.
 */
export async function duplicateUserResume(
  userId: string,
  resumeId: string
): Promise<{ success: boolean; resume?: ResumeData; error?: string }> {
  if (!userId) return { success: false, error: 'Not authenticated' };
  const list = await listUserResumes(userId);
  const source = list.find((r) => r.id === resumeId);
  if (!source) return { success: false, error: 'Resume not found' };

  const now = new Date().toISOString();
  const baseTitle = source.title || 'My Resume';
  const copy: ResumeData = ensureResumeShape(
    {
      ...JSON.parse(JSON.stringify(source)),
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      title: baseTitle.endsWith('(Copy)') ? baseTitle : `${baseTitle} (Copy)`,
      createdAt: now,
      updatedAt: now,
    },
    userId
  );

  return saveUserResume(userId, copy);
}

/**
 * Deletes a resume owned by the authenticated user from both local cache and Firestore.
 */
export async function deleteUserResume(
  userId: string,
  resumeId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'Not authenticated' };
  const list = readLocalList(userId);
  const nextList = list.filter((r) => r.id !== resumeId);
  writeLocalList(userId, nextList);
  clearResumeDraft(userId, resumeId);

  const verifiedUid = getVerifiedFirebaseUidFor(userId);
  if (verifiedUid) {
    try {
      await deleteDoc(doc(db, 'users', verifiedUid, 'resumes', resumeId));
    } catch (err) {
      console.warn('Firestore resume delete notice:', err);
    }
  }

  return { success: true };
}

/**
 * Draft recovery helpers so accidental browser closes never lose edits.
 */
export function saveResumeDraft(userId: string, resume: ResumeData): void {
  if (!userId || !resume?.id) return;
  try {
    localStorage.setItem(
      `${DRAFT_STORAGE_PREFIX}${userId}_${resume.id}`,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        resume,
      })
    );
  } catch {
    // ignore storage quota errors
  }
}

export function loadResumeDraft(
  userId: string,
  resumeId: string
): { savedAt: string; resume: ResumeData } | null {
  if (!userId || !resumeId) return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${userId}_${resumeId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.resume) {
      return {
        savedAt: parsed.savedAt,
        resume: ensureResumeShape(parsed.resume, userId),
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearResumeDraft(userId: string, resumeId: string): void {
  if (!userId || !resumeId) return;
  try {
    localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${userId}_${resumeId}`);
  } catch {
    // ignore
  }
}

/**
 * Initializes a brand-new resume with optional authenticated candidate profile info.
 */
export function buildResumeFromProfile(
  userId: string,
  candidate?: CandidateProfile | null,
  customTitle?: string
): ResumeData {
  const now = new Date().toISOString();
  const newId = `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (!candidate) {
    return ensureResumeShape(
      {
        ...EMPTY_RESUME,
        id: newId,
        userId,
        title: customTitle || 'New Resume',
        createdAt: now,
        updatedAt: now,
      },
      userId
    );
  }

  const mappedExperiences = (candidate.experiences || []).map((exp, idx) => ({
    id: exp.id || `exp_${Date.now()}_${idx}`,
    jobTitle: exp.jobTitle || '',
    companyName: exp.company || '',
    employmentType: 'Full-time' as const,
    location: '',
    startMonth: '',
    startYear: exp.startDate || '',
    endMonth: '',
    endYear: exp.endDate || '',
    currentlyWorking: !!exp.current,
    responsibilities: exp.description ? [exp.description] : [],
    achievements: [],
  }));

  const mappedEducation = (candidate.education || []).map((edu, idx) => ({
    id: edu.id || `edu_${Date.now()}_${idx}`,
    degree: edu.qualification || '',
    fieldOfStudy: edu.fieldOfStudy || '',
    institution: edu.institution || '',
    location: '',
    startDate: edu.startYear || '',
    endDate: edu.endYear || '',
    grade: '',
    description: '',
  }));

  const rawSkills = Array.isArray(candidate.skills) ? [...candidate.skills] : [];

  return ensureResumeShape(
    {
      ...EMPTY_RESUME,
      id: newId,
      userId,
      title:
        customTitle ||
        (candidate.desiredRole
          ? `${candidate.desiredRole} Resume`
          : candidate.currentRole
          ? `${candidate.currentRole} Resume`
          : 'My Professional Resume'),
      targetRole: candidate.desiredRole || candidate.currentRole || '',
      fullName: candidate.name || '',
      professionalTitle: candidate.headline || candidate.currentRole || candidate.desiredRole || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      city: candidate.city || candidate.location?.split(',')[0]?.trim() || '',
      state: candidate.state || candidate.location?.split(',')[1]?.trim() || '',
      linkedIn: '',
      portfolio: '',
      photoUrl: '',
      showPhoto: false,
      summary: candidate.about || '',
      experiences: mappedExperiences,
      education: mappedEducation,
      skills: rawSkills,
      skillCategories: {
        technical: rawSkills,
        professional: [],
        industry: [],
        tools: [],
      },
      projects: [],
      certifications: (candidate.certifications || []).map((c, idx) => ({
        id: c.id || `cert_${Date.now()}_${idx}`,
        name: c.title || '',
        issuer: c.issuer || '',
        issueDate: c.issueDate || '',
        expiryDate: '',
        credentialId: '',
        credentialUrl: c.credentialUrl || '',
      })),
      languages: [],
      createdAt: now,
      updatedAt: now,
    },
    userId
  );
}
