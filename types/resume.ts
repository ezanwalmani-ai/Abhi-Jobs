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

export type ResumeTemplateStyle = 'professional' | 'modern' | 'minimal';

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
}

export interface ResumeEducation {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
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

export interface ResumeData {
  id: string;
  userId: string;
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
  // Sections
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  languages: ResumeLanguage[];
  // Styling
  template: ResumeTemplateStyle;
  updatedAt: string;
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

/**
 * Calculates genuine resume completion percentage based on actual content
 */
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
  if (resume.professionalTitle.trim().length > 1 || (resume.city.trim() && resume.state.trim())) personalInfo += 4;

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
    const hasDetailedBullets = resume.experiences.some((e) => e.responsibilities.some((b) => b.trim().length > 10));
    experience = hasDetailedBullets ? 25 : 20;
  } else if (resume.experiences.length === 1) {
    const exp = resume.experiences[0];
    if (exp.jobTitle.trim() && exp.companyName.trim()) {
      experience = exp.responsibilities.length > 0 ? 18 : 12;
    }
  }
  const isExperienceComplete = experience >= 18;
  if (!isExperienceComplete) {
    missingTips.push('Add work experience with key responsibilities');
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
  if (resume.skills.length >= 5) {
    skills = 15;
  } else if (resume.skills.length >= 3) {
    skills = 10;
  } else if (resume.skills.length >= 1) {
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
  additional = Math.min(10, addCount);

  const isAdditionalComplete = additional >= 6;
  if (!isAdditionalComplete) {
    missingTips.push('Add projects, certifications, or languages');
  }

  const total = Math.min(100, Math.max(0, personalInfo + summary + experience + education + skills + additional));

  // Determine encouragement message based on progress bracket
  let encouragementMessage = '';
  if (total >= 100) {
    encouragementMessage = 'Outstanding! Your resume is 100% complete, ATS-optimized, and ready to impress employers.';
  } else if (total >= 80) {
    encouragementMessage = 'Almost there! Add a few finishing touches to make your resume truly stand out to top recruiters.';
  } else if (total >= 50) {
    encouragementMessage = 'Good momentum! Complete your experience and education to significantly boost your callback rates.';
  } else if (total >= 25) {
    encouragementMessage = 'Off to a great start! Add your work experience and key skills to make your profile visible to recruiters.';
  } else {
    encouragementMessage = 'Fill in your basic information and skills to build a strong foundation for your job applications.';
  }

  // Find next best recommendation
  let nextRecommendation: { section: string; points: number; tip: string } | undefined;
  if (!isPersonalInfoComplete) {
    nextRecommendation = { section: 'Personal Details', points: 20 - personalInfo, tip: 'Add full name, email, phone & city' };
  } else if (!isExperienceComplete) {
    nextRecommendation = { section: 'Work Experience', points: 25 - experience, tip: 'Add your current or past job roles' };
  } else if (!isSkillsComplete) {
    nextRecommendation = { section: 'Skills', points: 15 - skills, tip: 'Add 3–5 core industry skills' };
  } else if (!isEducationComplete) {
    nextRecommendation = { section: 'Education', points: 15 - education, tip: 'Add your university or degree' };
  } else if (!isSummaryComplete) {
    nextRecommendation = { section: 'Summary', points: 15 - summary, tip: 'Add a 2–4 sentence career overview' };
  } else if (!isAdditionalComplete) {
    nextRecommendation = { section: 'Projects & Certifications', points: 10 - additional, tip: 'Highlight personal projects or licenses' };
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

export const EMPTY_RESUME: Omit<ResumeData, 'id' | 'userId'> = {
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
  projects: [],
  certifications: [],
  languages: [],
  template: 'professional',
  updatedAt: new Date().toISOString(),
};
