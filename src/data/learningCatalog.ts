import {
  CourseLesson,
  CourseModule,
  LearningAssessmentDomain,
  LearningCategory,
  LearningCourseItem,
} from '../types/learning';

export const LEARNING_CATEGORIES: LearningCategory[] = [
  {
    id: 'excel-digital-skills',
    name: 'Excel and Digital Skills',
    shortDescription: 'Spreadsheets, workplace software, and practical digital fluency.',
  },
  {
    id: 'ai-productivity',
    name: 'AI and Productivity',
    shortDescription: 'Practical AI tools, prompting workflows, and modern workplace productivity.',
  },
  {
    id: 'communication-english',
    name: 'Communication and English',
    shortDescription: 'Clear business writing, spoken clarity, and professional communication.',
  },
  {
    id: 'interview-preparation',
    name: 'Interview Preparation',
    shortDescription: 'Structured interview responses, preparation habits, and confidence.',
  },
  {
    id: 'career-development',
    name: 'Career Development',
    shortDescription: 'Career transitions, positioning, and long-term growth planning.',
  },
  {
    id: 'workplace-skills',
    name: 'Workplace Skills',
    shortDescription: 'Collaboration, prioritization, and dependable professional habits.',
  },
];

/**
 * Exact IDs of the previously seeded Learn with ABHI courses removed during the course reset.
 * Retained strictly as a read-only reference list so cleanup utilities and Firestore rules can
 * safely target ONLY legacy course records without touching accounts, jobs, resumes, or
 * Career Readiness Assessment data.
 */
export const RESET_LEGACY_COURSE_IDS: readonly string[] = [
  'course_excel_job_seekers',
  'course_ai_presentations',
  'course_chatgpt_job_seekers',
  'course_claude_ai_job_seekers',
  'course_chatgpt_customer_service',
  'course_build_websites_ai',
  'course_improve_your_english',
  'course_interview_preparation',
  'course_change_career_domain',
  'course_professional_workplace_skills',
] as const;

/**
 * Active Learn with ABHI course catalogue.
 * Intentionally empty after course content reset so administrators can add fresh courses from scratch.
 */
export const LEARNING_CATALOGUE_COURSES: LearningCourseItem[] = [];

export function getCourseBySlug(slug: string): LearningCourseItem | undefined {
  return LEARNING_CATALOGUE_COURSES.find((c) => c.slug === slug);
}

export function getCourseById(courseId: string): LearningCourseItem | undefined {
  return LEARNING_CATALOGUE_COURSES.find((c) => c.id === courseId);
}

export function flattenCourseLessons(course: LearningCourseItem): Array<{
  lesson: CourseLesson;
  module: CourseModule;
  globalIndex: number;
}> {
  const orderedModules = [...course.modules].sort((a, b) => a.order - b.order);
  const result: Array<{ lesson: CourseLesson; module: CourseModule; globalIndex: number }> = [];
  let idx = 0;

  for (const mod of orderedModules) {
    const orderedLessons = [...mod.lessons].sort((a, b) => a.order - b.order);
    for (const lesson of orderedLessons) {
      result.push({ lesson, module: mod, globalIndex: idx });
      idx += 1;
    }
  }

  return result;
}

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
