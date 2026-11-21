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

export interface LessonVideoItem {
  id: string;
  title: string;
  /** Valid 11-character YouTube video ID (e.g. dQw4w9WgXcQ) */
  youtubeVideoId: string;
  description: string;
  durationSeconds: number;
  durationLabel?: string;
  order: number;
}

export interface CourseLesson {
  id: string;
  courseId: string;
  moduleId: string;
  order: number;
  title: string;
  description: string;
  /** Legacy/primary embedded HTTPS video URL. Empty string means written-only or multi-video via `videos`. */
  videoUrl: string;
  /** Ordered YouTube educational videos associated with this lesson */
  videos?: LessonVideoItem[];
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
  /** Module quizzes are supported per module */
  quizPlanned: true;
  estimatedMinutes?: number;
  quizRequired?: boolean;
  passPercentage?: number;
}

export type CoursePublishStatus = 'draft' | 'published';

export interface CourseModuleRecord {
  id: string;
  courseId: string;
  order: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  quizRequired: boolean;
  passPercentage: number;
  updatedBy: string;
  updatedAt: string;
}

export interface CourseIntroduction {
  headline: string;
  overview: string;
  studyGuidance: string[];
  prerequisites: string;
}

export interface LearningCourseMetadata {
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
  passPercentage: number;
  certificateTemplateId: string;
  status: CoursePublishStatus;
  moduleCount: number;
  courseIntroduction: CourseIntroduction;
  whatYouWillLearn: string[];
  skillsDeveloped: string[];
  updatedBy: string;
  updatedAt: string;
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
  passPercentage?: number;
  certificateTemplateId?: string;
  status?: CoursePublishStatus;
  courseIntroduction: CourseIntroduction;
  whatYouWillLearn: string[];
  skillsDeveloped: string[];
  modules: CourseModule[];
}

export interface VideoProgressRecord {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  videoId: string;
  youtubeVideoId: string;
  durationSeconds: number;
  watchedSeconds: number;
  maxPercentWatched: number;
  lastPositionSeconds: number;
  /** Strictly set to true only after real playback starts; never set on page load */
  hasPlayed: boolean;
  /** Set to true only when verified player playback reaches completion threshold (>= 80%) */
  completedViaPlayer: boolean;
  manualCompleted: boolean;
  updatedAt: string;
}

export interface CourseEnrolmentRecord {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  categoryId: LearningCategoryId;
  userId: string;
  status: CourseProgressStatus;
  currentModuleId?: string;
  currentLessonId?: string;
  completedLessonIds: string[];
  completedModuleIds?: string[];
  passedModuleQuizIds: string[];
  /** Highest module order (1-based) unlocked through verified quiz progression */
  unlockedModuleOrder?: number;
  lastVerifiedAttemptId?: string;
  lastVerifiedFinalAttemptId?: string;
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
  courseSlug?: string;
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
  /** Map of questionId -> selectedOptionIndex (0-3) submitted by the candidate */
  answers?: Record<string, number>;
  /** Server-generated HMAC-SHA256 receipt proving backend grading */
  verificationSignature?: string;
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
  verificationSignature?: string;
}

export interface AdminLessonInput {
  id?: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl: string;
  videos?: LessonVideoItem[];
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

export type CertificateValidityStatus = 'valid' | 'revoked';

export interface CertificateTemplateRecord {
  id: string;
  name: string;
  organizationName: string;
  certificateTitle: string;
  subtitle: string;
  signatoryName: string;
  signatoryDesignation: string;
  primaryColor: string;
  accentColor: string;
  isDefault: boolean;
  updatedBy: string;
  updatedAt: string;
}

export interface CourseCertificateRecord {
  certificateId: string;
  userId: string;
  candidateName: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  completionDate: string;
  issuedAt: string;
  finalAssessmentScore: number;
  status: CertificateValidityStatus;
  verificationSignature: string;
  finalAttemptId?: string;
  templateId?: string;
}

export interface PublicCertificateVerification {
  certificateId: string;
  candidateName: string;
  courseTitle: string;
  issueDate: string;
  status: CertificateValidityStatus;
}

export interface CertificateVerificationResult {
  found: boolean;
  valid: boolean;
  status: 'valid' | 'revoked' | 'not_found';
  certificate?: PublicCertificateVerification;
}
