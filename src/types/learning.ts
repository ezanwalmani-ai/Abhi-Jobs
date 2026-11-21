export type LearningCategoryId =
  | 'excel-digital-skills'
  | 'ai-productivity'
  | 'communication-english'
  | 'interview-preparation'
  | 'career-development'
  | 'workplace-skills';

export interface LearningCategory {
  id: LearningCategoryId;
  name: string;
  shortDescription: string;
}

export interface LearningCoursePlaceholder {
  id: string;
  slug: string;
  categoryId: LearningCategoryId;
  categoryName: string;
  title: string;
  summary: string;
  plannedTopics: string[];
  levelLabel: string;
  isPlaceholder: true;
  /** Reserved for future LMS backend integration */
  externalCourseId?: string;
}

export interface LearningAssessmentDomain {
  id: string;
  title: string;
  focus: string;
}

/**
 * Reserved interfaces for upcoming Learn with ABHI LMS features
 * (course progress, quizzes, and completion certificates tied to existing candidate userId).
 */
export interface FutureCourseProgress {
  userId: string;
  courseId: string;
  completedModuleIds: string[];
  quizScorePercent?: number;
  updatedAt: string;
}

export interface FutureCompletionCertificate {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  issuedAt: string;
}
