import { ResumeData, EMPTY_RESUME } from '../types/resume';
import { supabase } from '../lib/supabase';
import { CandidateProfile } from '../types';

const STORAGE_KEY_PREFIX = 'abhijobs_resume_';

/**
 * Loads the active resume for the given user, checking Supabase first with local fallback.
 */
export async function loadUserResume(userId: string): Promise<ResumeData | null> {
  if (!userId) return null;

  // 1. Try local storage cache first for instant responsiveness
  let localData: ResumeData | null = null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (raw) {
      localData = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading resume from localStorage:', err);
  }

  // 2. Try fetching from Supabase table 'resumes' if available
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      const parsedResume: ResumeData = {
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
        template: data.template || 'professional',
        updatedAt: data.updated_at || new Date().toISOString(),
      };

      // Update local cache
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(parsedResume));
      } catch {
        // ignore
      }

      return parsedResume;
    }
  } catch (err) {
    // Supabase table may not exist yet or client is offline; fallback to localData
  }

  return localData;
}

/**
 * Saves resume data for the user to both Supabase and localStorage.
 */
export async function saveUserResume(
  userId: string,
  resumeData: ResumeData
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User is not authenticated' };

  const sanitized: ResumeData = {
    ...resumeData,
    userId,
    updatedAt: new Date().toISOString(),
  };

  // 1. Always save to user-isolated localStorage first
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(sanitized));
  } catch (err: any) {
    console.error('LocalStorage save error:', err);
  }

  // 2. Persist to Supabase if available
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
      template: sanitized.template,
      updated_at: sanitized.updatedAt,
    };

    const { error } = await supabase
      .from('resumes')
      .upsert(payload, { onConflict: 'user_id' });

    if (error && error.code !== 'PGRST205') {
      console.warn('Supabase resumes upsert error:', error.message);
    }
  } catch {
    // Graceful offline fallback
  }

  return { success: true };
}

/**
 * Initializes a new resume with profile data if available.
 */
export function buildResumeFromProfile(
  userId: string,
  candidate?: CandidateProfile | null
): ResumeData {
  if (!candidate) {
    return {
      ...EMPTY_RESUME,
      id: `res_${userId}`,
      userId,
      updatedAt: new Date().toISOString(),
    };
  }

  // Map candidate experiences if present
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
  }));

  // Map candidate education if present
  const mappedEducation = (candidate.education || []).map((edu, idx) => ({
    id: edu.id || `edu_${Date.now()}_${idx}`,
    degree: edu.qualification || edu.fieldOfStudy || '',
    institution: edu.institution || '',
    location: '',
    startDate: edu.startYear || '',
    endDate: edu.endYear || '',
    description: edu.fieldOfStudy ? `Field: ${edu.fieldOfStudy}` : '',
  }));

  return {
    ...EMPTY_RESUME,
    id: `res_${userId}`,
    userId,
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
    skills: Array.isArray(candidate.skills) ? [...candidate.skills] : [],
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
    template: 'professional',
    updatedAt: new Date().toISOString(),
  };
}
