import {
  LearningCategory,
  LearningCoursePlaceholder,
  LearningAssessmentDomain,
} from '../types/learning';

export const LEARNING_CATEGORIES: LearningCategory[] = [
  {
    id: 'excel-digital-skills',
    name: 'Excel and Digital Skills',
    shortDescription: 'Spreadsheets, workplace software, and practical digital fluency.',
  },
  {
    id: 'ai-productivity',
    name: 'Artificial Intelligence and Productivity',
    shortDescription: 'Responsible AI workflows, daily automation, and modern work habits.',
  },
  {
    id: 'communication-english',
    name: 'Communication and English',
    shortDescription: 'Clear business writing, speaking clarity, and professional etiquette.',
  },
  {
    id: 'interview-preparation',
    name: 'Interview Preparation',
    shortDescription: 'Structured responses, role readiness, and interview confidence.',
  },
  {
    id: 'career-development',
    name: 'Career Development',
    shortDescription: 'Career planning, job search strategy, and professional positioning.',
  },
  {
    id: 'workplace-skills',
    name: 'Workplace Skills',
    shortDescription: 'Collaboration, time management, and day-to-day corporate effectiveness.',
  },
];

/**
 * Sample placeholder course cards representing each initial Learn with ABHI category.
 * Marked explicitly as placeholder content until full LMS lessons and assessments launch.
 */
export const SAMPLE_LEARNING_COURSES: LearningCoursePlaceholder[] = [
  {
    id: 'sample-excel-foundations',
    slug: 'excel-and-digital-skills-sample',
    categoryId: 'excel-digital-skills',
    categoryName: 'Excel and Digital Skills',
    title: 'Everyday Excel & Workplace Spreadsheets',
    summary:
      'Placeholder course outline covering practical formulas, clean data organization, and workplace reporting fundamentals.',
    plannedTopics: ['Core formulas & tables', 'Sorting & clean formatting', 'Everyday reporting'],
    levelLabel: 'Foundational',
    isPlaceholder: true,
  },
  {
    id: 'sample-ai-productivity',
    slug: 'ai-and-productivity-sample',
    categoryId: 'ai-productivity',
    categoryName: 'Artificial Intelligence and Productivity',
    title: 'Practical AI Tools for Daily Productivity',
    summary:
      'Placeholder course outline focused on drafting, summarizing, and organizing day-to-day professional tasks responsibly with AI.',
    plannedTopics: ['Clear prompt habits', 'Document & note workflows', 'Responsible workplace use'],
    levelLabel: 'All Levels',
    isPlaceholder: true,
  },
  {
    id: 'sample-communication-english',
    slug: 'communication-and-english-sample',
    categoryId: 'communication-english',
    categoryName: 'Communication and English',
    title: 'Professional Communication & Business English',
    summary:
      'Placeholder course outline covering clear emails, structured workplace conversations, and confident professional phrasing.',
    plannedTopics: ['Concise email writing', 'Meeting participation', 'Clarity & tone'],
    levelLabel: 'Foundational',
    isPlaceholder: true,
  },
  {
    id: 'sample-interview-prep',
    slug: 'interview-preparation-sample',
    categoryId: 'interview-preparation',
    categoryName: 'Interview Preparation',
    title: 'Structured Interview Readiness',
    summary:
      'Placeholder course outline designed to help candidates prepare honest, structured answers and navigate HR and role interviews.',
    plannedTopics: ['Answering behavioral questions', 'Explaining past work clearly', 'Candidate questions'],
    levelLabel: 'Job-Ready',
    isPlaceholder: true,
  },
  {
    id: 'sample-career-development',
    slug: 'career-development-sample',
    categoryId: 'career-development',
    categoryName: 'Career Development',
    title: 'Career Planning & Job Search Strategy',
    summary:
      'Placeholder course outline for identifying target roles, aligning your profile, and navigating career transitions thoughtfully.',
    plannedTopics: ['Role alignment', 'Portfolio & resume alignment', 'Long-term growth plans'],
    levelLabel: 'All Levels',
    isPlaceholder: true,
  },
  {
    id: 'sample-workplace-skills',
    slug: 'workplace-skills-sample',
    categoryId: 'workplace-skills',
    categoryName: 'Workplace Skills',
    title: 'Workplace Collaboration & Professional Habits',
    summary:
      'Placeholder course outline covering prioritization, team accountability, and dependable habits for corporate environments.',
    plannedTopics: ['Task prioritization', 'Cross-team collaboration', 'Professional ownership'],
    levelLabel: 'Foundational',
    isPlaceholder: true,
  },
];

export const ASSESSMENT_PREVIEW_DOMAINS: LearningAssessmentDomain[] = [
  {
    id: 'core-digital',
    title: 'Digital & Analytical Readiness',
    focus: 'Spreadsheets, productivity software, and modern workflow tools.',
  },
  {
    id: 'communication',
    title: 'Communication & Interview Clarity',
    focus: 'Written professionalism, presentation confidence, and interview readiness.',
  },
  {
    id: 'career-direction',
    title: 'Career Direction & Workplace Habits',
    focus: 'Goal clarity, collaboration, and practical job-readiness priorities.',
  },
];
