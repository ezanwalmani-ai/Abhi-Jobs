import { LearningCategoryId } from './learning';

export type SkillProficiencyLevel = 'Beginner' | 'Basic' | 'Intermediate' | 'Advanced';

export type SkillEvaluationKey =
  | 'excel'
  | 'wordPowerPoint'
  | 'emailCommunication'
  | 'englishCommunication'
  | 'interviewPreparation'
  | 'aiTools'
  | 'chatGptClaude'
  | 'problemSolving'
  | 'teamworkWorkplace';

export type CareerGoalType = 'first_job' | 'better_job' | 'career_change';

export type PracticalDomainKey =
  | 'excel'
  | 'email'
  | 'workplace'
  | 'interview'
  | 'ai'
  | 'problemSolving';

export interface AssessmentBasicInfo {
  fullName: string;
  email: string;
  mobileNumber: string;
  currentCity: string;
  preferredJobLocation: string;
}

export interface AssessmentEducationInfo {
  highestQualification: string;
  fieldOfStudy: string;
  graduationYear: string;
  currentlyStudying: 'yes' | 'no' | '';
}

export interface AssessmentExperienceInfo {
  experienceType: 'fresher' | 'experienced' | '';
  totalWorkExperience: string;
  currentEmploymentStatus: string;
  previousOrCurrentRole: string;
  industryOfExperience: string;
}

export interface AssessmentCareerPreferences {
  preferredJobRoles: string;
  preferredIndustries: string[];
  careerObjective: string;
  careerGoal: CareerGoalType | '';
}

export type AssessmentSkillsMap = Record<SkillEvaluationKey, SkillProficiencyLevel | ''>;

export interface PracticalQuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface PracticalKnowledgeQuestion {
  id: string;
  domain: PracticalDomainKey;
  domainLabel: string;
  scenario: string;
  question: string;
  options: PracticalQuestionOption[];
  correctOptionId: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface SkillReportItem {
  key: SkillEvaluationKey;
  label: string;
  level: SkillProficiencyLevel;
  scorePercent: number;
}

export interface PracticalDomainScore {
  domain: PracticalDomainKey;
  label: string;
  correct: number;
  total: number;
  percent: number;
}

export interface RecommendedCourseItem {
  id: string;
  title: string;
  categoryId: LearningCategoryId;
  categoryName: string;
  reason: string;
  priority: 'Recommended First' | 'Suggested Next';
}

export interface CareerReadinessReport {
  overallPracticalCorrect: number;
  overallPracticalTotal: number;
  overallPracticalPercent: number;
  selfEvaluationAveragePercent: number;
  readinessBand: string;
  readinessSummary: string;
  skillResults: SkillReportItem[];
  practicalDomainScores: PracticalDomainScore[];
  strengths: string[];
  areasForImprovement: string[];
  recommendedCourses: RecommendedCourseItem[];
  suggestedNextSteps: string[];
  generatedAt: string;
}

export interface CareerAssessmentRecord {
  id: string;
  userId: string;
  status: 'in_progress' | 'submitted';
  currentStep: number;
  basicInfo: AssessmentBasicInfo;
  education: AssessmentEducationInfo;
  experience: AssessmentExperienceInfo;
  careerPreferences: AssessmentCareerPreferences;
  skillsEvaluation: AssessmentSkillsMap;
  practicalAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  learningRecommendationConsent: boolean;
  recruitmentConsent: boolean;
  report?: CareerReadinessReport;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
}
