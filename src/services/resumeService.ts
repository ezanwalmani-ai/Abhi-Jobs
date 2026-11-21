import {
  ResumeData,
  EMPTY_RESUME,
  DEFAULT_DESIGN_SETTINGS,
  EMPTY_SKILL_CATEGORIES,
  normalizeTemplateId,
  flattenSkillCategories,
} from '../types/resume';
import { supabase } from '../lib/supabase';
import { CandidateProfile } from '../types';

const MULTI_STORAGE_PREFIX = 'abhijobs_resumes_v2_';
const LEGACY_STORAGE_PREFIX = 'abhijobs_resume_';
const DRAFT_STORAGE_PREFIX = 'abhijobs_resume_draft_';

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
    createdAt: raw.createdAt || raw.updatedAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
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
      // Keep legacy key updated with most recent resume for backward compatibility
      localStorage.setItem(`${LEGACY_STORAGE_PREFIX}${userId}`, JSON.stringify(resumes[0]));
    }
  } catch (err) {
    console.error('LocalStorage multi-resume save error:', err);
  }
}

/**
 * Lists all resumes owned strictly by the authenticated user.
 * Automatically migrates any legacy single resume into the multi-resume collection.
 */
export async function listUserResumes(userId: string): Promise<ResumeData[]> {
  if (!userId) return [];

  let list = readLocalList(userId);

  // Migrate legacy single resume if v2 collection is empty
  if (list.length === 0) {
    try {
      const legacyRaw = localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${userId}`);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        if (legacyParsed) {
          const migrated = ensureResumeShape(legacyParsed, userId);
          list = [migrated];
          writeLocalList(userId, list);
        }
      }
    } catch {
      // ignore migration read error
    }
  }

  // Merge remote Supabase record if present and newer
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      const remoteResume = ensureResumeShape(
        {
          id: data.id || `res_${userId}`,
          userId: data.user_id,
          fullName: data.full_name || '',
          professionalTitle: data.professional_title || '',
          email: data.email || '',
          phone: data.phone || '',
          city: data.city || '',
          state: data.state || '',
          linkedIn: data.linkedin || '',
          portfolio: data.portfolio || '',
          photoUrl: data.photo_url || '',
          showPhoto: !!data.show_photo,
          summary: data.summary || '',
          experiences: Array.isArray(data.experiences) ? data.experiences : [],
          education: Array.isArray(data.education) ? data.education : [],
          skills: Array.isArray(data.skills) ? data.skills : [],
          projects: Array.isArray(data.projects) ? data.projects : [],
          certifications: Array.isArray(data.certifications) ? data.certifications : [],
          languages: Array.isArray(data.languages) ? data.languages : [],
          template: data.template || 'classic-professional',
          updatedAt: data.updated_at || new Date().toISOString(),
        },
        userId
      );

      const existsIdx = list.findIndex((r) => r.id === remoteResume.id);
      if (existsIdx === -1 && list.length === 0) {
        list = [remoteResume];
        writeLocalList(userId, list);
      }
    }
  } catch {
    // Graceful offline fallback
  }

  // Sort by most recently updated first
  return list.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Loads the primary/latest resume for backward compatibility.
 */
export async function loadUserResume(userId: string): Promise<ResumeData | null> {
  const list = await listUserResumes(userId);
  return list.length > 0 ? list[0] : null;
}

/**
 * Saves or updates a resume belonging strictly to the authenticated user.
 */
export async function saveUserResume(
  userId: string,
  resumeData: ResumeData
): Promise<{ success: boolean; resume?: ResumeData; error?: string }> {
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

  // Sync primary record to Supabase if table is configured
  try {
    const payload = {
      user_id: userId,
      full_name: sanitized.fullName,
      professional_title: sanitized.professionalTitle,
      email: sanitized.email,
      phone: sanitized.phone,
      city: sanitized.city,
      state: sanitized.state,
      linkedin: sanitized.linkedIn,
      portfolio: sanitized.portfolio,
      photo_url: sanitized.photoUrl,
      show_photo: sanitized.showPhoto,
      summary: sanitized.summary,
      experiences: sanitized.experiences,
      education: sanitized.education,
      skills: sanitized.skills,
      projects: sanitized.projects,
      certifications: sanitized.certifications,
      languages: sanitized.languages,
      template: sanitized.design?.templateId || sanitized.template,
      updated_at: sanitized.updatedAt,
    };

    const { error } = await supabase
      .from('resumes')
      .upsert(payload, { onConflict: 'user_id' });

    if (error && error.code !== 'PGRST205') {
      console.warn('Supabase resumes upsert notice:', error.message);
    }
  } catch {
    // Graceful offline fallback
  }

  return { success: true, resume: sanitized };
}

/**
 * Duplicates an existing saved resume for targeting a different role.
 */
export async function duplicateUserResume(
  userId: string,
  resumeId: string
): Promise<{ success: boolean; resume?: ResumeData; error?: string }> {
  if (!userId) return { success: false, error: 'Not authenticated' };
  const list = readLocalList(userId);
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

  const nextList = [copy, ...list];
  writeLocalList(userId, nextList);
  return { success: true, resume: copy };
}

/**
 * Deletes a resume owned by the authenticated user.
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
 * Never fabricates experience or qualifications.
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
      photoUrl: candidate.avatar || '',
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
