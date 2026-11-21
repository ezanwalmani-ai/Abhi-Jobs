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
  passedModuleQuizIds: string[];
  finalAssessmentPassed: boolean;
  bestFinalScorePercent?: number;
  progressPercent: number;
  enrolledAt: string;
  lastAccessedAt: string;
  completedAt?: string;
}

export type AssessmentType = 'module_quiz' | 'final_assessment';

export interface ClientQuizQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
}

export interface AssessmentSummaryItem {
  id: string;
  courseId: string;
  courseTitle: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  moduleOrder?: number;
  title: string;
  description: string;
  passPercentage: number;
  questionCount: number;
  totalBankQuestions: number;
  randomizeOrder: boolean;
  requiredForCompletion: boolean;
}

export interface CourseAssessmentOverview {
  courseId: string;
  moduleQuizzes: AssessmentSummaryItem[];
  finalAssessment: AssessmentSummaryItem | null;
}

export interface StartedAssessmentSession {
  sessionId: string;
  assessmentId: string;
  courseId: string;
  courseTitle: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  title: string;
  description: string;
  passPercentage: number;
  totalQuestions: number;
  previousAttempts: number;
  questions: ClientQuizQuestion[];
}

export interface GradedQuestionResult {
  questionId: string;
  prompt: string;
  options: [string, string, string, string];
  selectedOptionIndex: 0 | 1 | 2 | 3;
  correctOptionIndex: 0 | 1 | 2 | 3;
  isCorrect: boolean;
  explanation: string;
}

export interface AssessmentAttemptRecord {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  assessmentTitle: string;
  attemptNumber: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercent: number;
  passPercentage: number;
  passed: boolean;
  submittedAt: string;
  questionResults?: GradedQuestionResult[];
}

export interface AdminEditableQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctOptionIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface AdminAssessmentConfig {
  id: string;
  courseId: string;
  courseTitle: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  moduleOrder?: number;
  title: string;
  description: string;
  passPercentage: number;
  questionCount: number;
  randomizeOrder: boolean;
  requiredForCompletion: boolean;
  questions: AdminEditableQuestion[];
}

export interface AdminAttemptSummary {
  id: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  courseId: string;
  courseTitle: string;
  assessmentType: AssessmentType;
  moduleId?: string;
  assessmentTitle: string;
  attemptNumber: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  scorePercent: number;
  passPercentage: number;
  passed: boolean;
  submittedAt: string;
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
