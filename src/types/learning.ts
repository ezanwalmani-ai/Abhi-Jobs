export type LearningCategoryId =
  | 'excel-digital-skills'
  | 'ai-productivity'
  | 'communication-english'
  | 'interview-preparation'
  | 'career-development'
  | 'workplace-skills';

export type CourseDifficultyLevel = 'Beginner' | 'Intermediate';

export type CourseProgressStatus = 'enrolled' | 'in_progress' | 'completed';

export type LessonAttachmentType = 'PDF' | 'Workbook' | 'Checklist' | 'Template' | 'Resource';

export interface LearningCategory {
  id: LearningCategoryId;
  name: string;
  shortDescription: string;
}

export interface LessonAttachment {
  id: string;
  title: string;
  url: string;
  fileType: LessonAttachmentType;
  sizeLabel?: string;
  /** Built-in structured text rendered into a downloadable PDF study sheet when no external file URL is attached */
  worksheetContent?: string;
}

export interface LessonExercise {
  title: string;
  instructions: string;
  deliverable?: string;
}

export interface CourseLesson {
  id: string;
  courseId: string;
  moduleId: string;
  order: number;
  title: string;
  description: string;
  /** Embedded HTTPS video URL (YouTube, Vimeo, Loom, or direct MP4/WebM). Empty string means written-only lesson. */
  videoUrl: string;
  estimatedMinutes: number;
  writtenContent: string;
  exercise?: LessonExercise;
  attachments: LessonAttachment[];
  /** Indicates lesson was added or customized by an administrator */
  isAdminManaged?: boolean;
  updatedAt?: string;
}

export interface CourseModule {
  id: string;
  order: number;
  title: string;
  summary: string;
  lessons: CourseLesson[];
  /** Module quizzes are planned for the next phase of Learn with ABHI */
  quizPlanned: true;
}

export interface CourseIntroduction {
  headline: string;
  overview: string;
  studyGuidance: string[];
  prerequisites: string;
}

export interface LearningCourseItem {
  id: string;
  slug: string;
  categoryId: LearningCategoryId;
  categoryName: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  level: CourseDifficultyLevel;
  estimatedDuration: string;
  isFree: true;
  sequentialUnlock: boolean;
  courseIntroduction: CourseIntroduction;
  whatYouWillLearn: string[];
  skillsDeveloped: string[];
  modules: CourseModule[];
}

export interface CourseEnrolmentRecord {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  categoryId: LearningCategoryId;
  userId: string;
  status: CourseProgressStatus;
  currentLessonId?: string;
  completedLessonIds: string[];
  progressPercent: number;
  enrolledAt: string;
  lastAccessedAt: string;
}

export interface AdminLessonInput {
  id?: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl: string;
  writtenContent: string;
  exerciseTitle: string;
  exerciseInstructions: string;
  exerciseDeliverable: string;
  attachments: LessonAttachment[];
  order: number;
  estimatedMinutes: number;
}

export interface LearningAssessmentDomain {
  id: string;
  title: string;
  focus: string;
}
