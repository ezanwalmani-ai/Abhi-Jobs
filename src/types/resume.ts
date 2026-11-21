export type ResumeEmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Internship'
  | 'Temporary'
  | 'Freelance';

export type ResumeLanguageProficiency =
  | 'Basic'
  | 'Conversational'
  | 'Professional'
  | 'Fluent'
  | 'Native';

export type ResumeTemplateId =
  | 'classic-professional'
  | 'modern-corporate'
  | 'minimal-elegant'
  | 'executive'
  | 'technology'
  | 'creative'
  | 'modern-two-column'
  | 'finance-accounting'
  | 'graduate-fresher'
  | 'sales-marketing'
  | 'academic-cv'
  | 'contemporary';

// Backward compatibility alias for legacy template values
export type ResumeTemplateStyle = ResumeTemplateId | 'professional' | 'modern' | 'minimal';

export type ResumeFontFamily = 'inter' | 'manrope' | 'georgia' | 'merriweather' | 'mono';
export type ResumeFontSize = 'compact' | 'standard' | 'comfortable';
export type ResumeLineSpacing = 'tight' | 'normal' | 'relaxed';
export type ResumeMarginSize = 'narrow' | 'standard' | 'wide';

export type ResumeSkillCategoryKey =
  | 'technical'
  | 'professional'
  | 'industry'
  | 'tools';

export type ResumeSectionKey =
  | 'summary'
  | 'experiences'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'awards'
  | 'training'
  | 'volunteer'
  | 'publications'
  | 'memberships'
  | 'customSections';

export const DEFAULT_SECTION_ORDER: ResumeSectionKey[] = [
  'summary',
  'experiences',
  'education',
  'skills',
  'projects',
  'certifications',
  'achievements',
  'awards',
  'training',
  'volunteer',
  'publications',
  'memberships',
  'languages',
  'customSections',
];

export const DEFAULT_SECTION_TITLES: Record<ResumeSectionKey, string> = {
  summary: 'Professional Summary',
  experiences: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  languages: 'Languages',
  achievements: 'Key Achievements',
  awards: 'Awards & Honors',
  training: 'Training & Workshops',
  volunteer: 'Volunteer Experience',
  publications: 'Publications',
  memberships: 'Professional Memberships',
  customSections: 'Additional Information',
};

export interface ResumeDesignSettings {
  templateId: ResumeTemplateId;
  fontFamily: ResumeFontFamily;
  fontSize: ResumeFontSize;
  lineSpacing: ResumeLineSpacing;
  margins: ResumeMarginSize;
  accentColor: string;
  sectionOrder: ResumeSectionKey[];
  sectionTitles: Partial<Record<ResumeSectionKey, string>>;
  hiddenSections: ResumeSectionKey[];
  pageBreakBefore: ResumeSectionKey[];
}

export const DEFAULT_DESIGN_SETTINGS: ResumeDesignSettings = {
  templateId: 'classic-professional',
  fontFamily: 'inter',
  fontSize: 'standard',
  lineSpacing: 'normal',
  margins: 'standard',
  accentColor: '#102B4E',
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  sectionTitles: {},
  hiddenSections: [],
  pageBreakBefore: [],
};

export interface ResumeExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  employmentType: ResumeEmploymentType;
  location: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  currentlyWorking: boolean;
  responsibilities: string[];
  achievements?: string[];
}

export interface ResumeEducation {
  id: string;
  degree: string;
  fieldOfStudy?: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  grade?: string;
  description: string;
}

export interface ResumeProject {
  id: string;
  name: string;
  role: string;
  description: string;
  technologies: string;
  url: string;
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
}

export interface ResumeLanguage {
  id: string;
  language: string;
  proficiency: ResumeLanguageProficiency;
}

export interface ResumeSimpleEntry {
  id: string;
  title: string;
  organization: string;
  date: string;
  description: string;
  url?: string;
}

export interface ResumeCustomSection {
  id: string;
  title: string;
  items: string[];
}

export interface ResumeSkillCategories {
  technical: string[];
  professional: string[];
  industry: string[];
  tools: string[];
}

export interface ResumeData {
  id: string;
  userId: string;
  title?: string;
  targetRole?: string;
  // Personal Info
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  linkedIn: string;
  portfolio: string;
  photoUrl?: string;
  showPhoto: boolean;
  // Professional Summary
  summary: string;
  // Core Sections
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  skillCategories?: ResumeSkillCategories;
  // Additional Sections
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  languages: ResumeLanguage[];
  achievements?: string[];
  awards?: ResumeSimpleEntry[];
  training?: ResumeSimpleEntry[];
  volunteer?: ResumeSimpleEntry[];
  publications?: ResumeSimpleEntry[];
  memberships?: string[];
  customSections?: ResumeCustomSection[];
  // Design Settings (separated from content so template switches never alter content)
  template: ResumeTemplateStyle;
  design?: ResumeDesignSettings;
  createdAt?: string;
  updatedAt: string;
}

export function normalizeTemplateId(template?: ResumeTemplateStyle): ResumeTemplateId {
  if (!template) return 'classic-professional';
  if (template === 'professional') return 'classic-professional';
  if (template === 'modern') return 'modern-corporate';
  if (template === 'minimal') return 'minimal-elegant';
  return template;
}

export function getResumeDesign(resume: ResumeData): ResumeDesignSettings {
  const baseTemplate = normalizeTemplateId(resume.design?.templateId || resume.template);
  return {
    ...DEFAULT_DESIGN_SETTINGS,
    ...(resume.design || {}),
    templateId: baseTemplate,
    sectionOrder:
      resume.design?.sectionOrder && resume.design.sectionOrder.length > 0
        ? resume.design.sectionOrder
        : [...DEFAULT_SECTION_ORDER],
    sectionTitles: {
      ...(resume.design?.sectionTitles || {}),
    },
    hiddenSections: resume.design?.hiddenSections || [],
    pageBreakBefore: resume.design?.pageBreakBefore || [],
  };
}

export function flattenSkillCategories(
  categories?: ResumeSkillCategories,
  fallbackSkills: string[] = []
): string[] {
  if (!categories) return fallbackSkills;
  const combined = [
    ...(categories.technical || []),
    ...(categories.professional || []),
    ...(categories.industry || []),
    ...(categories.tools || []),
  ];
  if (combined.length === 0) return fallbackSkills;
  return Array.from(new Set(combined.map((s) => s.trim()).filter(Boolean)));
}

export interface ResumeCompletionBreakdown {
  personalInfo: number; // max 20
  summary: number; // max 15
  experience: number; // max 25
  education: number; // max 15
  skills: number; // max 15
  additional: number; // max 10
  total: number; // 0 - 100
  missingTips: string[];
  sections: {
    personalInfo: boolean;
    summary: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
    additional: boolean;
  };
  encouragementMessage: string;
  nextRecommendation?: {
    section: string;
    points: number;
    tip: string;
  };
}

export function calculateResumeCompletion(resume: ResumeData): ResumeCompletionBreakdown {
  let personalInfo = 0;
  let summary = 0;
  let experience = 0;
  let education = 0;
  let skills = 0;
  let additional = 0;
  const missingTips: string[] = [];

  // Personal Info (max 20)
  if (resume.fullName.trim().length > 1) personalInfo += 6;
  if (resume.email.trim().length > 3 && resume.email.includes('@')) personalInfo += 6;
  if (resume.phone.trim().length >= 6) personalInfo += 4;
  if (
    resume.professionalTitle.trim().length > 1 ||
    resume.city.trim().length > 0 ||
    resume.state.trim().length > 0
  ) {
    personalInfo += 4;
  }

  const isPersonalInfoComplete = personalInfo >= 16;
  if (!isPersonalInfoComplete) {
    missingTips.push('Complete your personal and contact details');
  }

  // Summary (max 15)
  const trimmedSummary = resume.summary.trim();
  if (trimmedSummary.length >= 80) {
    summary = 15;
  } else if (trimmedSummary.length >= 30) {
    summary = 10;
  } else if (trimmedSummary.length > 0) {
    summary = 5;
  }
  const isSummaryComplete = summary >= 10;
  if (!isSummaryComplete) {
    missingTips.push('Add a 2–4 sentence professional summary');
  }

  // Experience (max 25)
  if (resume.experiences.length >= 2) {
    const hasDetailedBullets = resume.experiences.some(
      (e) =>
        e.responsibilities.some((b) => b.trim().length > 10) ||
        (e.achievements || []).some((a) => a.trim().length > 10)
    );
    experience = hasDetailedBullets ? 25 : 20;
  } else if (resume.experiences.length === 1) {
    const exp = resume.experiences[0];
    if (exp.jobTitle.trim() && exp.companyName.trim()) {
      const hasBullets =
        exp.responsibilities.some((r) => r.trim()) ||
        (exp.achievements || []).some((a) => a.trim());
      experience = hasBullets ? 18 : 12;
    }
  }
  const isExperienceComplete = experience >= 18;
  if (!isExperienceComplete) {
    missingTips.push('Add work experience with responsibilities or achievements');
  }

  // Education (max 15)
  if (resume.education.length >= 1) {
    const edu = resume.education[0];
    if (edu.degree.trim() && edu.institution.trim()) {
      education = 15;
    } else {
      education = 8;
    }
  }
  const isEducationComplete = education >= 15;
  if (!isEducationComplete) {
    missingTips.push('Add your highest degree or educational institution');
  }

  // Skills (max 15)
  const allSkills = flattenSkillCategories(resume.skillCategories, resume.skills);
  if (allSkills.length >= 5) {
    skills = 15;
  } else if (allSkills.length >= 3) {
    skills = 10;
  } else if (allSkills.length >= 1) {
    skills = 5;
  }
  const isSkillsComplete = skills >= 10;
  if (!isSkillsComplete) {
    missingTips.push('List at least 3 to 5 core professional skills');
  }

  // Additional sections (max 10)
  let addCount = 0;
  if (resume.projects.length > 0) addCount += 4;
  if (resume.certifications.length > 0) addCount += 3;
  if (resume.languages.length > 0) addCount += 3;
  if ((resume.achievements || []).length > 0) addCount += 3;
  if ((resume.awards || []).length > 0) addCount += 3;
  if ((resume.training || []).length > 0) addCount += 2;
  if ((resume.volunteer || []).length > 0) addCount += 2;
  if ((resume.publications || []).length > 0) addCount += 3;
  if ((resume.memberships || []).length > 0) addCount += 2;
  if ((resume.customSections || []).length > 0) addCount += 3;
  additional = Math.min(10, addCount);

  const isAdditionalComplete = additional >= 4;
  if (!isAdditionalComplete) {
    missingTips.push('Optionally add projects, certifications, languages, or achievements');
  }

  const total = Math.min(
    100,
    Math.max(0, personalInfo + summary + experience + education + skills + additional)
  );

  let encouragementMessage = '';
  if (total >= 95) {
    encouragementMessage =
      'Excellent — your resume is thorough, well-structured, and ready to export.';
  } else if (total >= 75) {
    encouragementMessage =
      'Looking strong. Consider reviewing your summary and bullet wording before exporting.';
  } else if (total >= 50) {
    encouragementMessage =
      'Good progress. Completing experience, education, and skills gives recruiters clear context.';
  } else if (total >= 25) {
    encouragementMessage =
      'Great start. Keep filling in your background at your own pace.';
  } else {
    encouragementMessage =
      'Start with your contact details and career background to build your resume.';
  }

  let nextRecommendation: { section: string; points: number; tip: string } | undefined;
  if (!isPersonalInfoComplete) {
    nextRecommendation = {
      section: 'Personal Details',
      points: 20 - personalInfo,
      tip: 'Add full name, email, phone & location',
    };
  } else if (!isExperienceComplete) {
    nextRecommendation = {
      section: 'Work Experience',
      points: 25 - experience,
      tip: 'Add your roles and key achievements',
    };
  } else if (!isSkillsComplete) {
    nextRecommendation = {
      section: 'Skills',
      points: 15 - skills,
      tip: 'Add 3–5 core skills relevant to your target role',
    };
  } else if (!isEducationComplete) {
    nextRecommendation = {
      section: 'Education',
      points: 15 - education,
      tip: 'Add your degree and institution',
    };
  } else if (!isSummaryComplete) {
    nextRecommendation = {
      section: 'Summary',
      points: 15 - summary,
      tip: 'Write a concise 2–4 sentence career summary',
    };
  } else if (!isAdditionalComplete) {
    nextRecommendation = {
      section: 'Additional Sections',
      points: 10 - additional,
      tip: 'Add projects, certifications, or languages if relevant',
    };
  }

  return {
    personalInfo,
    summary,
    experience,
    education,
    skills,
    additional,
    total,
    missingTips,
    sections: {
      personalInfo: isPersonalInfoComplete,
      summary: isSummaryComplete,
      experience: isExperienceComplete,
      education: isEducationComplete,
      skills: isSkillsComplete,
      additional: isAdditionalComplete,
    },
    encouragementMessage,
    nextRecommendation,
  };
}

export const EMPTY_SKILL_CATEGORIES: ResumeSkillCategories = {
  technical: [],
  professional: [],
  industry: [],
  tools: [],
};

export const EMPTY_RESUME: Omit<ResumeData, 'id' | 'userId'> = {
  title: 'Untitled Resume',
  targetRole: '',
  fullName: '',
  professionalTitle: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  linkedIn: '',
  portfolio: '',
  photoUrl: '',
  showPhoto: false,
  summary: '',
  experiences: [],
  education: [],
  skills: [],
  skillCategories: { ...EMPTY_SKILL_CATEGORIES },
  projects: [],
  certifications: [],
  languages: [],
  achievements: [],
  awards: [],
  training: [],
  volunteer: [],
  publications: [],
  memberships: [],
  customSections: [],
  template: 'classic-professional',
  design: { ...DEFAULT_DESIGN_SETTINGS },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
