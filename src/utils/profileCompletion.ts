import type {
  CandidateLanguageItem,
  CandidateLinkItem,
  CandidateProfile,
  CandidateProjectItem,
  CandidateSkillItem,
  CertificationItem,
  EducationItem,
  ExperienceItem,
} from '../types';
import type { ParsedResumeResult } from '../services/resumeParserService';

export type ProfileSectionId =
  | 'personal'
  | 'summary'
  | 'employment'
  | 'skills'
  | 'education'
  | 'resume'
  | 'certifications'
  | 'projects'
  | 'languages'
  | 'preferences'
  | 'links';

export interface ProfileSectionStatus {
  id: ProfileSectionId;
  order: number;
  title: string;
  weight: number;
  earned: number;
  completed: boolean;
  statusLabel: string;
  missingHint: string;
  actionLabel: string;
}

export interface ProfileCompletionReport {
  percentage: number;
  completedCount: number;
  totalSections: number;
  strengthTier: 'Strong Profile' | 'Good Progress' | 'Needs Attention';
  sections: ProfileSectionStatus[];
  missingSections: ProfileSectionStatus[];
  recommendedActions: Array<{
    sectionId: ProfileSectionId;
    title: string;
    description: string;
    impactPoints: number;
    actionLabel: string;
  }>;
}

export const CURATED_SKILLS_SUGGESTIONS: string[] = [
  // Software & Tech
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java', 'C#', 'Go', 'SQL',
  'PostgreSQL', 'MongoDB', 'Firebase', 'REST APIs', 'GraphQL', 'HTML & CSS', 'Tailwind CSS',
  'Git & GitHub', 'Docker', 'AWS', 'Azure', 'Google Cloud', 'Linux', 'CI/CD', 'QA Testing', 'Selenium',
  // Data & Analytics
  'Microsoft Excel', 'Advanced Excel', 'Power BI', 'Tableau', 'Data Analysis', 'SQL Reporting',
  'Financial Modeling', 'MIS Reporting', 'Google Analytics', 'Statistics', 'Machine Learning', 'ETL',
  // Business, Ops & Finance
  'Accounting', 'Tally Prime', 'GST & Taxation', 'SAP', 'Supply Chain Management', 'Logistics',
  'Inventory Management', 'Procurement', 'Operations Management', 'Project Management', 'Agile & Scrum',
  'Business Analysis', 'Stakeholder Management', 'Vendor Management', 'Process Improvement', 'Six Sigma',
  // Sales, Marketing & Customer Success
  'B2B Sales', 'Inside Sales', 'Account Management', 'CRM (Salesforce / HubSpot)', 'Lead Generation',
  'Digital Marketing', 'SEO / SEM', 'Performance Marketing', 'Content Writing', 'Social Media Marketing',
  'Customer Support', 'Client Relationship Management', 'Negotiation',
  // HR & Administration
  'Talent Acquisition', 'Technical Recruiting', 'HR Operations', 'Payroll Management', 'Employee Relations',
  'Office Administration', 'Executive Assistance', 'Documentation',
  // Design & Product
  'UI/UX Design', 'Figma', 'Product Management', 'Wireframing', 'Graphic Design', 'Adobe Photoshop',
  // Core Workplace Strengths
  'Communication', 'Team Leadership', 'Problem Solving', 'Presentation Skills', 'Time Management',
];

export function sanitizeExternalUrl(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^(javascript|vbscript|data|file):/i.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed.slice(0, 300);
  return `https://${trimmed}`.slice(0, 300);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MONTH_INDEX: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function parseSortableDateValue(dateStr?: string): number {
  if (!dateStr) return 0;
  const trimmed = dateStr.trim();
  if (!trimmed) return 0;
  if (/present|current|now/i.test(trimmed)) return 999999;

  // YYYY-MM format (from <input type="month">)
  const isoMonth = trimmed.match(/^(\d{4})-(\d{1,2})/);
  if (isoMonth) {
    return Number(isoMonth[1]) * 100 + Number(isoMonth[2]);
  }

  // "Jan 2023" or "January 2023"
  const textMonthYear = trimmed.match(/([A-Za-z]+)\.?\s+(\d{4})/);
  if (textMonthYear) {
    const m = MONTH_INDEX[textMonthYear[1].toLowerCase()] || 1;
    return Number(textMonthYear[2]) * 100 + m;
  }

  // MM/YYYY
  const slashMonthYear = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMonthYear) {
    return Number(slashMonthYear[2]) * 100 + Number(slashMonthYear[1]);
  }

  // YYYY
  const yearOnly = trimmed.match(/\b(19|20)\d{2}\b/);
  if (yearOnly) {
    return Number(yearOnly[0]) * 100;
  }

  return 0;
}

export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const isoMonth = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (isoMonth) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = Number(isoMonth[2]) - 1;
    if (mIdx >= 0 && mIdx < 12) return `${months[mIdx]} ${isoMonth[1]}`;
  }
  return trimmed;
}

export function sortExperiencesReverseChronological(experiences: ExperienceItem[]): ExperienceItem[] {
  return [...(experiences || [])].sort((a, b) => {
    if (a.current && !b.current) return -1;
    if (!a.current && b.current) return 1;
    const endDiff = parseSortableDateValue(b.endDate) - parseSortableDateValue(a.endDate);
    if (endDiff !== 0) return endDiff;
    return parseSortableDateValue(b.startDate) - parseSortableDateValue(a.startDate);
  });
}

function getQualificationTier(qualification?: string): number {
  const q = (qualification || '').toLowerCase();
  if (/\b(ph\.?d|doctor)/i.test(q)) return 5;
  if (/\b(master|m\.?b\.?a|m\.?tech|m\.?sc|m\.?com|m\.?c\.?a|m\.?a\b|pgdm|post\s*graduate)/i.test(q)) return 4;
  if (/\b(bachelor|b\.?b\.?a|b\.?tech|b\.?e\b|b\.?sc|b\.?com|b\.?c\.?a|b\.?a\b|ll\.?b)/i.test(q)) return 3;
  if (/\b(diploma|senior\s+secondary|higher\s+secondary|12th|class\s*(?:xii|12)|hsc|puc)/i.test(q)) return 2;
  if (/\b(secondary|high\s+school|10th|class\s*(?:x|10)|ssc|sslc)/i.test(q)) return 1;
  return 0;
}

export function sortEducationReverseChronological(education: EducationItem[]): EducationItem[] {
  return [...(education || [])].sort((a, b) => {
    const endA = parseSortableDateValue(a.endYear);
    const endB = parseSortableDateValue(b.endYear);
    if (endA > 0 && endB > 0 && endA !== endB) return endB - endA;
    if ((endA === 0) !== (endB === 0)) {
      const tierDiff = getQualificationTier(b.qualification) - getQualificationTier(a.qualification);
      if (tierDiff !== 0) return tierDiff;
    }
    const startDiff = parseSortableDateValue(b.startYear) - parseSortableDateValue(a.startYear);
    if (startDiff !== 0) return startDiff;
    return getQualificationTier(b.qualification) - getQualificationTier(a.qualification);
  });
}

/**
 * Normalizes skills from both `detailedSkills` and legacy `skills: string[]` so both stay 100% synced.
 */
export function getNormalizedDetailedSkills(profile: Partial<CandidateProfile>): CandidateSkillItem[] {
  const map = new Map<string, CandidateSkillItem>();

  if (Array.isArray(profile.detailedSkills)) {
    for (const item of profile.detailedSkills) {
      const cleanName = (item?.name || '').trim();
      if (!cleanName) continue;
      const key = cleanName.toLowerCase();
      map.set(key, {
        name: cleanName,
        proficiency: item.proficiency || 'Intermediate',
        isPrimary: Boolean(item.isPrimary),
      });
    }
  }

  if (Array.isArray(profile.skills)) {
    for (const raw of profile.skills) {
      const cleanName = String(raw || '').trim();
      if (!cleanName) continue;
      const key = cleanName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: cleanName,
          proficiency: 'Intermediate',
          isPrimary: map.size < 3,
        });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Computes real profile completion percentage strictly from actual saved candidate fields.
 * Total weight = 100 points across the 11 recruitment portal sections.
 */
export function calculateProfileCompletion(profile: Partial<CandidateProfile> | null | undefined): ProfileCompletionReport {
  const p = profile || {};

  // 1. Personal Details (15 pts)
  const hasName = Boolean(p.name && p.name.trim().length >= 2);
  const hasEmail = Boolean(p.email && p.email.includes('@'));
  const hasPhone = Boolean(p.phone && p.phone.replace(/\D/g, '').length >= 10);
  const hasLocation = Boolean(p.location && p.location.trim().length >= 2 && p.location.trim().toLowerCase() !== 'india');
  const hasHeadline = Boolean(p.headline && p.headline.trim().length >= 6 && p.headline.trim().toLowerCase() !== 'job seeker');
  const personalMissing: string[] = [];
  if (!hasName) personalMissing.push('Full name');
  if (!hasHeadline) personalMissing.push('Professional headline');
  if (!hasPhone) personalMissing.push('Mobile number');
  if (!hasLocation) personalMissing.push('Current city & location');
  const personalEarned =
    (hasName ? 3 : 0) +
    (hasEmail ? 2 : 0) +
    (hasPhone ? 4 : 0) +
    (hasLocation ? 3 : 0) +
    (hasHeadline ? 3 : 0);

  // 2. Profile Summary (10 pts)
  const summaryLen = (p.about || '').trim().length;
  const summaryComplete = summaryLen >= 40;
  const summaryEarned = summaryComplete ? 10 : summaryLen >= 15 ? 5 : 0;

  // 3. Employment Details (15 pts)
  const validExps = (p.experiences || []).filter((e) => e.company?.trim() && e.jobTitle?.trim());
  const isFresherDeclared = p.experienceLevel === 'Fresher' || p.experienceType === 'fresher';
  const employmentComplete = validExps.length > 0;
  const employmentEarned = validExps.length > 0 ? 15 : isFresherDeclared ? 8 : 0;

  // 4. Key Skills (15 pts)
  const normalizedSkills = getNormalizedDetailedSkills(p);
  const skillsCount = normalizedSkills.length;
  const hasPrimarySkill = normalizedSkills.some((s) => s.isPrimary);
  const skillsComplete = skillsCount >= 3;
  const skillsEarned =
    skillsCount >= 3
      ? hasPrimarySkill
        ? 15
        : 12
      : skillsCount > 0
      ? Math.round((skillsCount / 3) * 10)
      : 0;

  // 5. Education (10 pts)
  const validEdu = (p.education || []).filter((e) => e.qualification?.trim() && e.institution?.trim());
  const eduComplete = validEdu.length > 0;
  const eduEarned = eduComplete ? 10 : 0;

  // 6. Resume (10 pts)
  const hasResume = Boolean((p.resumeName && p.resumeName.trim()) || (p.resumeUrl && p.resumeUrl.trim()));
  const resumeEarned = hasResume ? 10 : 0;

  // 7. Certifications (5 pts)
  const validCerts = (p.certifications || []).filter((c) => c.title?.trim());
  const certsComplete = validCerts.length > 0;
  const certsEarned = certsComplete ? 5 : 0;

  // 8. Projects (5 pts)
  const validProjects = (p.projects || []).filter((pr) => pr.title?.trim());
  const projectsComplete = validProjects.length > 0;
  const projectsEarned = projectsComplete ? 5 : 0;

  // 9. Languages (5 pts)
  const validLanguages = (p.languages || []).filter((l) => l.language?.trim());
  const languagesComplete = validLanguages.length > 0;
  const languagesEarned = languagesComplete ? 5 : 0;

  // 10. Career Preferences (5 pts)
  const hasDesiredRole = Boolean(p.desiredRole && p.desiredRole.trim().length >= 2);
  const hasPrefLoc = Boolean(p.preferredLocation && p.preferredLocation.trim().length >= 2);
  const prefsComplete = hasDesiredRole && hasPrefLoc;
  const prefsEarned = (hasDesiredRole ? 3 : 0) + (hasPrefLoc ? 2 : 0);

  // 11. Professional Links (5 pts)
  const hasLinks = Boolean(
    (p.linkedinUrl && p.linkedinUrl.trim()) ||
      (p.githubUrl && p.githubUrl.trim()) ||
      (p.portfolioUrl && p.portfolioUrl.trim()) ||
      (p.otherLinks && p.otherLinks.some((l) => l.url?.trim()))
  );
  const linksEarned = hasLinks ? 5 : 0;

  const sections: ProfileSectionStatus[] = [
    {
      id: 'personal',
      order: 1,
      title: 'Personal Details',
      weight: 15,
      earned: personalEarned,
      completed: personalEarned === 15,
      statusLabel: personalEarned === 15 ? 'Complete' : `Missing ${personalMissing.length} detail${personalMissing.length === 1 ? '' : 's'}`,
      missingHint: personalMissing.length > 0 ? `Add ${personalMissing.slice(0, 2).join(' & ')}` : 'All contact details complete',
      actionLabel: 'Edit Details',
    },
    {
      id: 'summary',
      order: 2,
      title: 'Profile Summary',
      weight: 10,
      earned: summaryEarned,
      completed: summaryComplete,
      statusLabel: summaryComplete ? 'Complete' : summaryLen > 0 ? 'Too brief' : 'Not added',
      missingHint: 'Write a 2–4 line summary highlighting your expertise and career goals',
      actionLabel: summaryLen > 0 ? 'Refine Summary' : 'Add Summary',
    },
    {
      id: 'employment',
      order: 3,
      title: 'Employment Details',
      weight: 15,
      earned: employmentEarned,
      completed: employmentComplete,
      statusLabel: employmentComplete
        ? `${validExps.length} role${validExps.length === 1 ? '' : 's'}`
        : isFresherDeclared
        ? 'Fresher'
        : 'Not added',
      missingHint: isFresherDeclared
        ? 'Add internships or full-time experience if applicable'
        : 'Add your current or past work experience',
      actionLabel: 'Add Employment',
    },
    {
      id: 'skills',
      order: 4,
      title: 'Key Skills',
      weight: 15,
      earned: skillsEarned,
      completed: skillsComplete && hasPrimarySkill,
      statusLabel: skillsCount > 0 ? `${skillsCount} skill${skillsCount === 1 ? '' : 's'}` : 'Not added',
      missingHint: skillsCount < 3 ? 'Add at least 3 skills and mark your primary strengths' : 'Mark at least 1 primary skill',
      actionLabel: 'Manage Skills',
    },
    {
      id: 'education',
      order: 5,
      title: 'Education',
      weight: 10,
      earned: eduEarned,
      completed: eduComplete,
      statusLabel: eduComplete ? `${validEdu.length} qualification${validEdu.length === 1 ? '' : 's'}` : 'Not added',
      missingHint: 'Add your degree, college/university, and graduation year',
      actionLabel: 'Add Education',
    },
    {
      id: 'resume',
      order: 6,
      title: 'Resume',
      weight: 10,
      earned: resumeEarned,
      completed: hasResume,
      statusLabel: hasResume ? 'Uploaded' : 'Not uploaded',
      missingHint: 'Upload a PDF, DOC, or DOCX resume for recruiters',
      actionLabel: 'Upload Resume',
    },
    {
      id: 'certifications',
      order: 7,
      title: 'Certifications',
      weight: 5,
      earned: certsEarned,
      completed: certsComplete,
      statusLabel: certsComplete ? `${validCerts.length} added` : 'Optional',
      missingHint: 'Highlight industry certifications or verified courses',
      actionLabel: 'Add Certification',
    },
    {
      id: 'projects',
      order: 8,
      title: 'Projects',
      weight: 5,
      earned: projectsEarned,
      completed: projectsComplete,
      statusLabel: projectsComplete ? `${validProjects.length} added` : 'Not added',
      missingHint: 'Showcase notable projects and measurable outcomes',
      actionLabel: 'Add Project',
    },
    {
      id: 'languages',
      order: 9,
      title: 'Languages',
      weight: 5,
      earned: languagesEarned,
      completed: languagesComplete,
      statusLabel: languagesComplete ? `${validLanguages.length} added` : 'Not added',
      missingHint: 'List languages you read, write, and speak',
      actionLabel: 'Add Language',
    },
    {
      id: 'preferences',
      order: 10,
      title: 'Career Preferences',
      weight: 5,
      earned: prefsEarned,
      completed: prefsComplete,
      statusLabel: prefsComplete ? 'Complete' : 'Incomplete',
      missingHint: 'Specify target role, preferred city, and salary expectations',
      actionLabel: 'Set Preferences',
    },
    {
      id: 'links',
      order: 11,
      title: 'Professional Links',
      weight: 5,
      earned: linksEarned,
      completed: hasLinks,
      statusLabel: hasLinks ? 'Connected' : 'Not added',
      missingHint: 'Add LinkedIn, GitHub, or portfolio links',
      actionLabel: 'Add Links',
    },
  ];

  const totalEarned = sections.reduce((sum, s) => sum + s.earned, 0);
  const percentage = Math.max(0, Math.min(100, Math.round(totalEarned)));
  const completedCount = sections.filter((s) => s.completed).length;
  const missingSections = sections
    .filter((s) => !s.completed)
    .sort((a, b) => (b.weight - b.earned) - (a.weight - a.earned));

  const recommendedActions = missingSections.slice(0, 4).map((s) => ({
    sectionId: s.id,
    title: s.title,
    description: s.missingHint,
    impactPoints: Math.max(1, s.weight - s.earned),
    actionLabel: s.actionLabel,
  }));

  const strengthTier: ProfileCompletionReport['strengthTier'] =
    percentage >= 80 ? 'Strong Profile' : percentage >= 50 ? 'Good Progress' : 'Needs Attention';

  return {
    percentage,
    completedCount,
    totalSections: sections.length,
    strengthTier,
    sections,
    missingSections,
    recommendedActions,
  };
}

// ============================================================================
// RESUME PARSE -> CANDIDATE PROFILE DRAFT & SAFE NON-DESTRUCTIVE MERGE
// ============================================================================

export type ParsedMergeSectionKey =
  | 'personal'
  | 'summary'
  | 'employment'
  | 'skills'
  | 'education'
  | 'certifications'
  | 'projects'
  | 'languages'
  | 'preferences'
  | 'links';

export interface AiParsedResumeClientPayload {
  personal: {
    name?: string;
    headline?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    location?: string;
    yearsOfExperience?: number;
    experienceLevel?: CandidateProfile['experienceLevel'];
    workStatus?: string;
    gender?: string;
    dob?: string;
  };
  summary?: string;
  experiences?: Array<{
    jobTitle?: string;
    company?: string;
    employmentType?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    achievements?: string[];
  }>;
  skills?: Array<{
    name: string;
    proficiency?: CandidateSkillItem['proficiency'];
    isPrimary?: boolean;
  }>;
  education?: Array<{
    qualification?: string;
    fieldOfStudy?: string;
    institution?: string;
    startYear?: string;
    endYear?: string;
    grade?: string;
  }>;
  certifications?: Array<{
    title?: string;
    issuer?: string;
    issueDate?: string;
    credentialUrl?: string;
  }>;
  projects?: Array<{
    title?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    ongoing?: boolean;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  languages?: Array<{
    language?: string;
    proficiency?: CandidateLanguageItem['proficiency'];
    canRead?: boolean;
    canWrite?: boolean;
    canSpeak?: boolean;
  }>;
  careerPreferences?: {
    desiredRole?: string;
    preferredLocation?: string;
    preferredIndustry?: string;
    workPreference?: CandidateProfile['workPreference'];
    availability?: CandidateProfile['availability'];
  };
  links?: {
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    otherLinks?: Array<{ label?: string; url?: string }>;
  };
}

export interface ParsedCandidateDraft {
  fileName: string;
  fileSize: string;
  detectedSections: string[];
  personal: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    city: string;
    state: string;
    yearsOfExperience: number;
    experienceLevel: CandidateProfile['experienceLevel'];
    workStatus: string;
    gender: string;
    dob: string;
  };
  summary: string;
  experiences: ExperienceItem[];
  skills: string[];
  detailedSkills: CandidateSkillItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  projects: CandidateProjectItem[];
  languages: CandidateLanguageItem[];
  careerPreferences: {
    desiredRole: string;
    preferredLocation: string;
    preferredIndustry: string;
    workPreference: CandidateProfile['workPreference'];
    availability: CandidateProfile['availability'];
  };
  links: {
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;
    otherLinks: CandidateLinkItem[];
  };
}

function parseMonthIndexValue(dateStr?: string, isEnd = false): number | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  const now = new Date();
  const currentMonthIdx = now.getFullYear() * 12 + (now.getMonth() + 1);
  if (/present|current|now|till\s*date/i.test(trimmed)) return currentMonthIdx;

  const isoMonth = trimmed.match(/^(\d{4})-(\d{1,2})/);
  if (isoMonth) {
    return Number(isoMonth[1]) * 12 + Math.min(12, Math.max(1, Number(isoMonth[2])));
  }

  const textMonthYear = trimmed.match(/([A-Za-z]+)\.?\s+(\d{4})/);
  if (textMonthYear) {
    const m = MONTH_INDEX[textMonthYear[1].toLowerCase()] || (isEnd ? 12 : 1);
    return Number(textMonthYear[2]) * 12 + m;
  }

  const slashMonthYear = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMonthYear) {
    return Number(slashMonthYear[2]) * 12 + Math.min(12, Math.max(1, Number(slashMonthYear[1])));
  }

  const yearOnly = trimmed.match(/\b(19|20)\d{2}\b/);
  if (yearOnly) {
    return Number(yearOnly[0]) * 12 + (isEnd ? 12 : 1);
  }

  return null;
}

/**
 * Computes total non-overlapping work experience in years (rounded to nearest 0.5)
 * from a list of parsed employment entries.
 */
export function computeExperienceYearsFromList(experiences: ExperienceItem[]): number {
  const now = new Date();
  const currentMonthIdx = now.getFullYear() * 12 + (now.getMonth() + 1);
  const intervals: Array<[number, number]> = [];

  for (const exp of experiences || []) {
    const startIdx = parseMonthIndexValue(exp.startDate, false);
    if (startIdx === null) continue;
    const rawEnd = exp.current
      ? currentMonthIdx
      : parseMonthIndexValue(exp.endDate, true) ?? startIdx + 6;
    const endIdx = Math.max(startIdx + 1, Math.min(rawEnd, currentMonthIdx + 12));
    intervals.push([startIdx, endIdx]);
  }

  if (intervals.length === 0) return 0;

  intervals.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const [s, e] = intervals[i];
    const last = merged[merged.length - 1];
    if (s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }

  const totalMonths = merged.reduce((sum, [s, e]) => sum + Math.max(1, e - s), 0);
  const years = Math.round((totalMonths / 12) * 2) / 2;
  return Math.max(0.5, Math.min(50, years));
}

export function deriveExperienceLevelFromYears(years: number): CandidateProfile['experienceLevel'] {
  if (!Number.isFinite(years) || years <= 0) return 'Fresher';
  if (years < 3) return 'Junior';
  if (years < 6) return 'Mid';
  if (years < 10) return 'Senior';
  return 'Lead';
}

export function mapAiParsedResumeToCandidateDraft(
  ai: AiParsedResumeClientPayload,
  fileName = 'Uploaded Resume',
  fileSizeBytes = 0
): ParsedCandidateDraft {
  const ts = Date.now();
  const experiences: ExperienceItem[] = sortExperiencesReverseChronological(
    (ai.experiences || [])
      .filter((e) => (e.jobTitle || '').trim() || (e.company || '').trim())
      .map((item, idx) => ({
        id: `exp_ai_${ts}_${idx}`,
        company: (item.company || '').trim(),
        jobTitle: (item.jobTitle || '').trim(),
        employmentType: (item.employmentType || 'Full-time').trim(),
        location: (item.location || '').trim(),
        startDate: (item.startDate || '').trim(),
        endDate: item.current ? '' : (item.endDate || '').trim(),
        current: Boolean(item.current),
        description: (item.description || '').trim(),
        achievements: Array.isArray(item.achievements)
          ? item.achievements.map((a) => String(a || '').trim()).filter(Boolean)
          : [],
      }))
  );

  const education: EducationItem[] = sortEducationReverseChronological(
    (ai.education || [])
      .filter((ed) => (ed.qualification || '').trim() || (ed.institution || '').trim())
      .map((edu, idx) => ({
        id: `edu_ai_${ts}_${idx}`,
        qualification: (edu.qualification || '').trim(),
        institution: (edu.institution || '').trim(),
        fieldOfStudy: (edu.fieldOfStudy || '').trim(),
        startYear: (edu.startYear || '').trim(),
        endYear: (edu.endYear || '').trim(),
        grade: (edu.grade || '').trim() || undefined,
      }))
  );

  const certifications: CertificationItem[] = (ai.certifications || [])
    .filter((c) => (c.title || '').trim())
    .map((cert, idx) => ({
      id: `cert_ai_${ts}_${idx}`,
      title: (cert.title || '').trim(),
      issuer: (cert.issuer || '').trim(),
      issueDate: (cert.issueDate || '').trim(),
      credentialUrl: cert.credentialUrl ? sanitizeExternalUrl(cert.credentialUrl) : undefined,
    }));

  const projects: CandidateProjectItem[] = (ai.projects || [])
    .filter((p) => (p.title || '').trim())
    .map((proj, idx) => ({
      id: `proj_ai_${ts}_${idx}`,
      title: (proj.title || '').trim(),
      role: (proj.role || '').trim() || undefined,
      startDate: (proj.startDate || '').trim() || undefined,
      endDate: proj.ongoing ? undefined : (proj.endDate || '').trim() || undefined,
      ongoing: Boolean(proj.ongoing),
      description: (proj.description || '').trim(),
      technologies: Array.isArray(proj.technologies)
        ? proj.technologies.map((t) => String(t || '').trim()).filter(Boolean)
        : [],
      url: proj.url ? sanitizeExternalUrl(proj.url) : undefined,
    }));

  const languages: CandidateLanguageItem[] = (ai.languages || [])
    .filter((l) => (l.language || '').trim())
    .map((lang, idx) => ({
      id: `lang_ai_${ts}_${idx}`,
      language: (lang.language || '').trim(),
      proficiency: lang.proficiency || 'Professional',
      canRead: typeof lang.canRead === 'boolean' ? lang.canRead : true,
      canWrite: typeof lang.canWrite === 'boolean' ? lang.canWrite : true,
      canSpeak: typeof lang.canSpeak === 'boolean' ? lang.canSpeak : true,
    }));

  const seenSkills = new Set<string>();
  const detailedSkills: CandidateSkillItem[] = [];
  for (const s of ai.skills || []) {
    const clean = (s?.name || '').trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seenSkills.has(key)) continue;
    seenSkills.add(key);
    detailedSkills.push({
      name: clean,
      proficiency: s.proficiency || 'Intermediate',
      isPrimary: typeof s.isPrimary === 'boolean' ? s.isPrimary : detailedSkills.length < 4,
    });
  }
  if (detailedSkills.length > 0 && !detailedSkills.some((s) => s.isPrimary)) {
    detailedSkills.slice(0, 3).forEach((s) => {
      s.isPrimary = true;
    });
  }
  const skills = detailedSkills.map((s) => s.name);

  const computedYears = computeExperienceYearsFromList(experiences);
  const rawYears =
    typeof ai.personal?.yearsOfExperience === 'number' && Number.isFinite(ai.personal.yearsOfExperience)
      ? Math.max(0, Math.min(50, Math.round(ai.personal.yearsOfExperience * 2) / 2))
      : 0;
  const yearsOfExperience = rawYears > 0 ? rawYears : computedYears;
  const experienceLevel =
    yearsOfExperience > 0
      ? ai.personal?.experienceLevel && ai.personal.experienceLevel !== 'Fresher'
        ? ai.personal.experienceLevel
        : deriveExperienceLevelFromYears(yearsOfExperience)
      : ai.personal?.experienceLevel || 'Fresher';

  const city = (ai.personal?.city || '').trim();
  const state = (ai.personal?.state || '').trim();
  const location =
    (ai.personal?.location || '').trim() ||
    [city, state].filter(Boolean).join(', ') ||
    experiences.find((e) => e.location && !/^remote$/i.test(e.location))?.location ||
    '';

  const headline =
    (ai.personal?.headline || '').trim() ||
    (experiences[0]?.jobTitle
      ? `${experiences[0].jobTitle}${
          skills.length > 0 ? ` | ${skills.slice(0, 3).join(', ')}` : ''
        }`
      : '');

  const workStatus =
    (ai.personal?.workStatus || '').trim() ||
    (experiences.some((e) => e.current) ? 'Working' : 'Looking for a job');

  const otherLinks: CandidateLinkItem[] = (ai.links?.otherLinks || [])
    .map((lnk, idx) => ({
      id: `lnk_ai_${ts}_${idx}`,
      label: (lnk.label || 'Link').trim(),
      url: sanitizeExternalUrl(lnk.url),
    }))
    .filter((lnk) => Boolean(lnk.url));

  const detectedSections: string[] = [];
  if (ai.personal?.name || headline || location) detectedSections.push('Personal Details');
  if (ai.summary?.trim()) detectedSections.push('Profile Summary');
  if (experiences.length > 0) detectedSections.push(`Work Experience (${experiences.length})`);
  if (skills.length > 0) detectedSections.push(`Skills (${skills.length})`);
  if (education.length > 0) detectedSections.push(`Education (${education.length})`);
  if (certifications.length > 0) detectedSections.push(`Certifications (${certifications.length})`);
  if (projects.length > 0) detectedSections.push(`Projects (${projects.length})`);
  if (languages.length > 0) detectedSections.push(`Languages (${languages.length})`);

  return {
    fileName,
    fileSize: formatFileSize(fileSizeBytes),
    detectedSections,
    personal: {
      name: (ai.personal?.name || '').trim(),
      headline,
      email: (ai.personal?.email || '').trim(),
      phone: (ai.personal?.phone || '').trim(),
      location,
      city,
      state,
      yearsOfExperience,
      experienceLevel,
      workStatus,
      gender: (ai.personal?.gender || '').trim(),
      dob: (ai.personal?.dob || '').trim(),
    },
    summary: (ai.summary || '').trim(),
    experiences,
    skills,
    detailedSkills,
    education,
    certifications,
    projects,
    languages,
    careerPreferences: {
      desiredRole:
        (ai.careerPreferences?.desiredRole || '').trim() ||
        experiences[0]?.jobTitle ||
        '',
      preferredLocation:
        (ai.careerPreferences?.preferredLocation || '').trim() || location,
      preferredIndustry: (ai.careerPreferences?.preferredIndustry || '').trim(),
      workPreference: ai.careerPreferences?.workPreference || 'Hybrid',
      availability: ai.careerPreferences?.availability || 'Immediate',
    },
    links: {
      linkedinUrl: ai.links?.linkedinUrl ? sanitizeExternalUrl(ai.links.linkedinUrl) : '',
      githubUrl: ai.links?.githubUrl ? sanitizeExternalUrl(ai.links.githubUrl) : '',
      portfolioUrl: ai.links?.portfolioUrl ? sanitizeExternalUrl(ai.links.portfolioUrl) : '',
      otherLinks,
    },
  };
}

export function mapParsedResumeToCandidateDraft(
  parsed: ParsedResumeResult,
  fileName = 'Uploaded Resume',
  fileSizeBytes = 0
): ParsedCandidateDraft {
  const ex = parsed.extracted || {};

  const city = (ex.city || '').trim();
  const state = (ex.state || '').trim();
  let location = [city, state].filter(Boolean).join(', ');

  // Separate GitHub vs general portfolio URL if found in portfolio or rawText
  let portfolioUrl = (ex.portfolio || '').trim();
  let githubUrl = '';
  if (portfolioUrl.toLowerCase().includes('github.com')) {
    githubUrl = portfolioUrl;
    portfolioUrl = '';
  } else {
    const ghMatch = (parsed.rawText || '').match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)?/i);
    if (ghMatch) githubUrl = ghMatch[0];
  }

  const experiences: ExperienceItem[] = sortExperiencesReverseChronological(
    (ex.experiences || []).map((item, idx) => {
      const startDate = [item.startMonth, item.startYear].filter(Boolean).join(' ').trim();
      const endDate = item.currentlyWorking
        ? ''
        : [item.endMonth, item.endYear].filter(Boolean).join(' ').trim();
      const description = (item.responsibilities || []).join('\n').trim();
      return {
        id: item.id || `exp_parsed_${Date.now()}_${idx}`,
        company: (item.companyName || '').trim(),
        jobTitle: (item.jobTitle || '').trim(),
        employmentType: item.employmentType || 'Full-time',
        location: (item.location || '').trim(),
        startDate,
        endDate,
        current: Boolean(item.currentlyWorking),
        description,
        achievements: (item.achievements || []).filter(Boolean),
      };
    })
  );

  if (!location || location.toLowerCase() === 'india') {
    const nonRemoteLoc = experiences.find(
      (e) => e.location && !/^(remote|hybrid|on-site|india)$/i.test(e.location.trim())
    )?.location;
    if (nonRemoteLoc) location = nonRemoteLoc;
  }

  const education: EducationItem[] = sortEducationReverseChronological(
    (ex.education || []).map((edu, idx) => ({
      id: edu.id || `edu_parsed_${Date.now()}_${idx}`,
      qualification: (edu.degree || '').trim(),
      institution: (edu.institution || '').trim(),
      fieldOfStudy: (edu.description || '').trim().slice(0, 120),
      startYear: (edu.startDate || '').trim(),
      endYear: (edu.endDate || '').trim(),
      grade: (edu.grade || '').trim() || undefined,
      location: (edu.location || '').trim() || undefined,
    }))
  );

  const certifications: CertificationItem[] = (ex.certifications || []).map((cert, idx) => ({
    id: cert.id || `cert_parsed_${Date.now()}_${idx}`,
    title: (cert.name || '').trim(),
    issuer: (cert.issuer || '').trim(),
    issueDate: (cert.issueDate || '').trim(),
    credentialUrl: cert.credentialUrl ? sanitizeExternalUrl(cert.credentialUrl) : undefined,
  }));

  const projects: CandidateProjectItem[] = (ex.projects || []).map((proj, idx) => ({
    id: proj.id || `proj_parsed_${Date.now()}_${idx}`,
    title: (proj.name || '').trim(),
    role: (proj.role || '').trim() || undefined,
    description: (proj.description || '').trim(),
    technologies: (proj.technologies || '')
      .split(/[,|•·;]+/)
      .map((t) => t.trim())
      .filter(Boolean),
    url: proj.url ? sanitizeExternalUrl(proj.url) : undefined,
  }));

  const languages: CandidateLanguageItem[] = (ex.languages || []).map((lang, idx) => ({
    id: lang.id || `lang_parsed_${Date.now()}_${idx}`,
    language: (lang.language || '').trim(),
    proficiency: lang.proficiency || 'Professional',
    canRead: true,
    canWrite: true,
    canSpeak: true,
  }));

  // Deduplicate extracted skills
  const seenSkills = new Set<string>();
  const skills: string[] = [];
  for (const raw of ex.skills || []) {
    const clean = String(raw || '').trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seenSkills.has(key)) {
      seenSkills.add(key);
      skills.push(clean);
    }
  }

  const detailedSkills: CandidateSkillItem[] = skills.slice(0, 40).map((name, idx) => ({
    name,
    proficiency: 'Intermediate',
    isPrimary: idx < 3,
  }));

  const yearsOfExperience = computeExperienceYearsFromList(experiences);
  const experienceLevel = deriveExperienceLevelFromYears(yearsOfExperience);
  const workStatus = experiences.some((e) => e.current) ? 'Working' : 'Looking for a job';
  const primaryRole =
    experiences.find(
      (e) => e.jobTitle && !/^(self[-\s]?employed|freelance)$/i.test(e.jobTitle.trim())
    )?.jobTitle ||
    experiences[0]?.jobTitle ||
    '';

  const headline =
    (ex.professionalTitle || '').trim() ||
    (primaryRole
      ? `${primaryRole}${skills.length > 0 ? ` | ${skills.slice(0, 3).join(', ')}` : ''}`
      : '');

  const corpus = `${headline} ${ex.summary || ''} ${skills.join(' ')} ${experiences.map((e) => `${e.jobTitle} ${e.description}`).join(' ')}`.toLowerCase();
  let preferredIndustry = '';
  if (/\b(procurement|purchase|purchasing|sap\s*mm|sourcing|supply\s*chain|vendor|rfq|migo|miro)\b/i.test(corpus)) {
    preferredIndustry = 'Procurement & Supply Chain';
  } else if (/\b(logistics|warehouse|freight|dispatch|transportation)\b/i.test(corpus)) {
    preferredIndustry = 'Logistics & Operations';
  } else if (/\b(software|developer|engineer|react|node\.js|python|typescript|full[\s-]*stack|devops)\b/i.test(corpus)) {
    preferredIndustry = 'IT & Software';
  } else if (/\b(accounting|finance|tally|gst|audit|financial|taxation)\b/i.test(corpus)) {
    preferredIndustry = 'Finance & Accounting';
  } else if (/\b(sales|marketing|crm|lead\s*generation|seo|business\s*development)\b/i.test(corpus)) {
    preferredIndustry = 'Sales & Marketing';
  } else if (/\b(human\s*resources|talent\s*acquisition|recruiting|payroll|hr\s*operations)\b/i.test(corpus)) {
    preferredIndustry = 'Human Resources';
  }

  return {
    fileName,
    fileSize: formatFileSize(fileSizeBytes),
    detectedSections: parsed.detectedSections || [],
    personal: {
      name: (ex.fullName || '').trim(),
      headline,
      email: (ex.email || '').trim(),
      phone: (ex.phone || '').trim(),
      location,
      city,
      state,
      yearsOfExperience,
      experienceLevel,
      workStatus,
      gender: '',
      dob: '',
    },
    summary: (ex.summary || '').trim(),
    experiences,
    skills,
    detailedSkills,
    education,
    certifications,
    projects,
    languages,
    careerPreferences: {
      desiredRole: primaryRole,
      preferredLocation: location,
      preferredIndustry,
      workPreference: 'Hybrid',
      availability: 'Immediate',
    },
    links: {
      linkedinUrl: ex.linkedIn ? sanitizeExternalUrl(ex.linkedIn) : '',
      githubUrl: githubUrl ? sanitizeExternalUrl(githubUrl) : '',
      portfolioUrl: portfolioUrl ? sanitizeExternalUrl(portfolioUrl) : '',
      otherLinks: [],
    },
  };
}

/**
 * Safely merges a user-reviewed resume draft into an existing CandidateProfile.
 * When `overwriteExisting` is false (default), existing non-empty fields are strictly preserved
 * and only empty/placeholder fields and non-duplicate list entries are added.
 */
export function mergeParsedDraftIntoProfile(
  existing: CandidateProfile,
  draft: ParsedCandidateDraft,
  selectedSections: Partial<Record<ParsedMergeSectionKey, boolean>>,
  overwriteExisting: boolean
): Partial<CandidateProfile> {
  const updates: Partial<CandidateProfile> = {
    resumeName: draft.fileName,
    resumeSize: draft.fileSize,
    resumeUpdated: new Date().toISOString(),
  };

  const inferredYears =
    draft.personal.yearsOfExperience > 0
      ? draft.personal.yearsOfExperience
      : computeExperienceYearsFromList(draft.experiences);
  const inferredLevel =
    inferredYears > 0
      ? draft.personal.experienceLevel && draft.personal.experienceLevel !== 'Fresher'
        ? draft.personal.experienceLevel
        : deriveExperienceLevelFromYears(inferredYears)
      : draft.personal.experienceLevel || 'Fresher';

  if (selectedSections.personal) {
    const pick = (current: string | undefined, incoming: string, isPlaceholder = false) => {
      if (!incoming.trim()) return current || '';
      if (overwriteExisting) return incoming.trim();
      if (!current || !current.trim() || isPlaceholder) return incoming.trim();
      return current;
    };

    const existingLocLower = (existing.location || '').trim().toLowerCase();
    const existingHeadlineLower = (existing.headline || '').trim().toLowerCase();

    updates.name = pick(existing.name, draft.personal.name, existing.name === 'Candidate');
    updates.headline = pick(
      existing.headline,
      draft.personal.headline,
      existingHeadlineLower === 'job seeker' || existingHeadlineLower === ''
    );
    updates.phone = pick(existing.phone, draft.personal.phone);
    updates.location = pick(
      existing.location,
      draft.personal.location,
      existingLocLower === 'india' || existingLocLower === 'location not set' || existingLocLower === ''
    );
    if (draft.personal.city) {
      updates.city = pick(existing.city, draft.personal.city);
    }
    if (draft.personal.state) {
      updates.state = pick(existing.state, draft.personal.state);
    }
    if (draft.personal.gender) {
      updates.gender = pick(existing.gender, draft.personal.gender);
    }
    if (draft.personal.dob) {
      updates.dob = pick(existing.dob, draft.personal.dob);
    }

    // Update years of experience, experience level, experience type & work status
    const hasExistingRealYears = (existing.yearsOfExperience || 0) > 0;
    if (overwriteExisting || (!hasExistingRealYears && inferredYears > 0)) {
      updates.yearsOfExperience = inferredYears;
      updates.experienceLevel = inferredLevel;
      updates.experienceType = inferredYears > 0 ? 'experienced' : 'fresher';
    } else if (
      !existing.experienceLevel ||
      (existing.experienceLevel === 'Fresher' && inferredYears > 0)
    ) {
      updates.experienceLevel = inferredLevel;
      updates.experienceType = inferredYears > 0 ? 'experienced' : 'fresher';
    }

    if (draft.personal.workStatus) {
      const isDefaultStatus =
        !existing.workStatus?.trim() ||
        (existing.workStatus === 'Looking for a job' && draft.personal.workStatus === 'Working');
      if (overwriteExisting || isDefaultStatus) {
        updates.workStatus = draft.personal.workStatus;
      }
    }
  }

  if (selectedSections.summary && draft.summary.trim()) {
    if (overwriteExisting || !existing.about?.trim()) {
      updates.about = draft.summary.trim();
    }
  }

  if (selectedSections.employment && draft.experiences.length > 0) {
    if (overwriteExisting) {
      updates.experiences = sortExperiencesReverseChronological(draft.experiences);
    } else {
      const existingList = existing.experiences || [];
      const existingKeys = new Set(
        existingList.map((e) => `${e.company.toLowerCase().trim()}|${e.jobTitle.toLowerCase().trim()}`)
      );
      const additions = draft.experiences.filter(
        (e) => !existingKeys.has(`${e.company.toLowerCase().trim()}|${e.jobTitle.toLowerCase().trim()}`)
      );
      updates.experiences = sortExperiencesReverseChronological([...existingList, ...additions]);
    }
    const latestRole = updates.experiences?.[0];
    if (latestRole && (overwriteExisting || !existing.currentRole?.trim())) {
      updates.currentRole = latestRole.jobTitle;
    }

    // Ensure candidate does not stay stuck on "Fresher (0 yrs)" after importing real work experience
    if (updates.yearsOfExperience === undefined && (existing.yearsOfExperience || 0) === 0 && inferredYears > 0) {
      updates.yearsOfExperience = inferredYears;
      updates.experienceLevel = inferredLevel;
      updates.experienceType = 'experienced';
    }
  }

  if (selectedSections.skills && draft.skills.length > 0) {
    const detailedLookup = new Map(
      (draft.detailedSkills || []).map((s) => [s.name.toLowerCase(), s])
    );

    if (overwriteExisting) {
      const detailed: CandidateSkillItem[] = draft.skills.slice(0, 40).map((name, idx) => {
        const meta = detailedLookup.get(name.toLowerCase());
        return {
          name,
          proficiency: meta?.proficiency || 'Intermediate',
          isPrimary: meta ? meta.isPrimary : idx < 3,
        };
      });
      if (detailed.length > 0 && !detailed.some((s) => s.isPrimary)) {
        detailed.slice(0, 3).forEach((s) => {
          s.isPrimary = true;
        });
      }
      updates.detailedSkills = detailed;
      updates.skills = detailed.map((s) => s.name);
    } else {
      const currentDetailed = getNormalizedDetailedSkills(existing);
      const seen = new Set(currentDetailed.map((s) => s.name.toLowerCase()));
      const merged = [...currentDetailed];
      for (const skillName of draft.skills) {
        const clean = skillName.trim();
        if (!clean || seen.has(clean.toLowerCase())) continue;
        seen.add(clean.toLowerCase());
        const meta = detailedLookup.get(clean.toLowerCase());
        merged.push({
          name: clean,
          proficiency: meta?.proficiency || 'Intermediate',
          isPrimary: meta ? meta.isPrimary : merged.filter((m) => m.isPrimary).length < 3,
        });
      }
      updates.detailedSkills = merged.slice(0, 40);
      updates.skills = updates.detailedSkills.map((s) => s.name);
    }
  }

  if (selectedSections.education && draft.education.length > 0) {
    if (overwriteExisting) {
      updates.education = sortEducationReverseChronological(draft.education);
    } else {
      const existingList = existing.education || [];
      const existingKeys = new Set(
        existingList.map((e) => `${e.qualification.toLowerCase().trim()}|${e.institution.toLowerCase().trim()}`)
      );
      const additions = draft.education.filter(
        (e) => !existingKeys.has(`${e.qualification.toLowerCase().trim()}|${e.institution.toLowerCase().trim()}`)
      );
      updates.education = sortEducationReverseChronological([...existingList, ...additions]);
    }
  }

  if (selectedSections.certifications && draft.certifications.length > 0) {
    if (overwriteExisting) {
      updates.certifications = draft.certifications;
    } else {
      const existingList = existing.certifications || [];
      const existingKeys = new Set(existingList.map((c) => c.title.toLowerCase().trim()));
      const additions = draft.certifications.filter((c) => !existingKeys.has(c.title.toLowerCase().trim()));
      updates.certifications = [...existingList, ...additions];
    }
  }

  if (selectedSections.projects && draft.projects.length > 0) {
    if (overwriteExisting) {
      updates.projects = draft.projects;
    } else {
      const existingList = existing.projects || [];
      const existingKeys = new Set(existingList.map((p) => p.title.toLowerCase().trim()));
      const additions = draft.projects.filter((p) => !existingKeys.has(p.title.toLowerCase().trim()));
      updates.projects = [...existingList, ...additions];
    }
  }

  if (selectedSections.languages && draft.languages.length > 0) {
    if (overwriteExisting) {
      updates.languages = draft.languages;
    } else {
      const existingList = existing.languages || [];
      const existingKeys = new Set(existingList.map((l) => l.language.toLowerCase().trim()));
      const additions = draft.languages.filter((l) => !existingKeys.has(l.language.toLowerCase().trim()));
      updates.languages = [...existingList, ...additions];
    }
  }

  if (selectedSections.preferences && draft.careerPreferences) {
    const prefs = draft.careerPreferences;
    if (prefs.desiredRole.trim() && (overwriteExisting || !existing.desiredRole?.trim())) {
      updates.desiredRole = prefs.desiredRole.trim();
    }
    if (prefs.preferredLocation.trim() && (overwriteExisting || !existing.preferredLocation?.trim())) {
      updates.preferredLocation = prefs.preferredLocation.trim();
    }
    if (prefs.preferredIndustry.trim() && (overwriteExisting || !existing.preferredIndustry?.trim())) {
      updates.preferredIndustry = prefs.preferredIndustry.trim();
    }
    if (prefs.workPreference && (overwriteExisting || !existing.workPreference)) {
      updates.workPreference = prefs.workPreference;
    }
    if (prefs.availability && (overwriteExisting || !existing.availability)) {
      updates.availability = prefs.availability;
    }
  }

  if (selectedSections.links) {
    if (draft.links.linkedinUrl && (overwriteExisting || !existing.linkedinUrl?.trim())) {
      updates.linkedinUrl = sanitizeExternalUrl(draft.links.linkedinUrl);
    }
    if (draft.links.githubUrl && (overwriteExisting || !existing.githubUrl?.trim())) {
      updates.githubUrl = sanitizeExternalUrl(draft.links.githubUrl);
    }
    if (draft.links.portfolioUrl && (overwriteExisting || !existing.portfolioUrl?.trim())) {
      updates.portfolioUrl = sanitizeExternalUrl(draft.links.portfolioUrl);
    }
    if (draft.links.otherLinks && draft.links.otherLinks.length > 0) {
      if (overwriteExisting) {
        updates.otherLinks = draft.links.otherLinks
          .map((l) => ({ ...l, url: sanitizeExternalUrl(l.url) }))
          .filter((l) => Boolean(l.url));
      } else {
        const existingLinks = existing.otherLinks || [];
        const existingUrls = new Set(existingLinks.map((l) => l.url.toLowerCase().trim()));
        const additions = draft.links.otherLinks
          .map((l) => ({ ...l, url: sanitizeExternalUrl(l.url) }))
          .filter((l) => Boolean(l.url) && !existingUrls.has(l.url.toLowerCase().trim()));
        updates.otherLinks = [...existingLinks, ...additions];
      }
    }
  }

  const previewMerged: CandidateProfile = { ...existing, ...updates };
  updates.completionPercentage = calculateProfileCompletion(previewMerged).percentage;

  return updates;
}
