export type UserRole = 'job_seeker' | 'employer' | 'admin' | 'candidate';

export interface User {
  id: string;
  candidateCode?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastActive: string;
}

export interface EducationItem {
  id: string;
  qualification: string;
  institution: string;
  fieldOfStudy: string;
  courseType?: 'Full-time' | 'Part-time' | 'Distance' | 'Online' | string;
  startYear: string;
  endYear: string;
  grade?: string;
  status?: 'Completed' | 'Pursuing' | string;
  location?: string;
  description?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  jobTitle: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance' | string;
  industry?: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements?: string[];
  skillsUsed?: string[];
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  certificateDocId?: string;
}

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface CandidateSkillItem {
  name: string;
  proficiency: SkillProficiency;
  isPrimary: boolean;
  category?: string;
}

export interface CandidateProjectItem {
  id: string;
  title: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  ongoing?: boolean;
  description: string;
  technologies: string[];
  url?: string;
}

export type LanguageProficiency = 'Native' | 'Fluent' | 'Professional' | 'Conversational' | 'Basic';

export interface CandidateLanguageItem {
  id: string;
  language: string;
  proficiency: LanguageProficiency;
  canRead: boolean;
  canWrite: boolean;
  canSpeak: boolean;
}

export interface CandidateLinkItem {
  id: string;
  label: string;
  url: string;
}

export type CandidateRecruitmentStatus =
  | 'Active'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interviewing'
  | 'Placed'
  | 'On Hold'
  | 'Archived';

export interface CandidateDocumentRecord {
  id: string;
  candidateUid: string;
  category: 'resume' | 'certificate' | 'supporting';
  originalFilename: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  versionNumber: number;
  isLatest: boolean;
  uploadedAt: string;
  uploadedByUid: string;
  sha256?: string;
}

export interface CandidateInternalNoteRecord {
  id: string;
  candidateUid: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
  text: string;
  category?: 'Screening' | 'Interview' | 'Verification' | 'General' | string;
  createdAt: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  candidateCode?: string;
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  headline: string;
  about: string;
  careerObjective?: string;
  currentRole: string;
  currentCompany?: string;
  desiredRole: string;
  noticePeriod?: string;
  experienceLevel: 'Fresher' | 'Junior' | 'Mid' | 'Senior' | 'Lead';
  experienceType?: 'fresher' | 'experienced';
  workStatus?: 'Working' | 'Looking for a job' | 'Currently not working' | 'Student' | string;
  yearsOfExperience: number;
  preferredLocation: string;
  preferredLocations?: string[];
  preferredJobTitles?: string[];
  preferredEmploymentTypes?: string[];
  preferredShift?: string;
  jobSearchStatus?: string;
  workPreference: 'Remote' | 'Hybrid' | 'On-site' | 'Flexible';
  preferredIndustry?: string;
  currentSalary?: { amount?: number; currency?: string };
  expectedSalary?: { min?: number; max?: number; currency?: string };
  willingToRelocate?: boolean;
  gender?: string;
  dob?: string;
  marketingConsent?: boolean;
  availability: 'Immediate' | '15 Days' | '30 Days' | 'Exploring';
  profileVisibility: 'public' | 'employers_only' | 'private';
  availableForOpportunities: boolean;
  skills: string[];
  detailedSkills?: CandidateSkillItem[];
  education: EducationItem[];
  experiences: ExperienceItem[];
  certifications: CertificationItem[];
  projects?: CandidateProjectItem[];
  languages?: CandidateLanguageItem[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  personalWebsiteUrl?: string;
  otherLinks?: CandidateLinkItem[];
  primaryResumeId?: string;
  resumeDocId?: string;
  resumeUrl?: string;
  resumeName?: string;
  resumeSize?: string;
  resumeUpdated?: string;
  recruitmentStatus?: CandidateRecruitmentStatus;
  completionPercentage: number;
  recommendations: string[];
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  lastAction?: string;
  lastActive?: string;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  name?: string; // alias for companyName
  website: string;
  industry: string;
  companySize: string;
  size?: string; // alias for companySize
  location: string;
  recruiterName: string;
  recruiterRole: string;
  recruiterEmail: string;
  recruiterPhone: string;
  logo: string;
  about: string;
  description?: string; // alias for about
  benefits: string[];
  culture: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';
  verified?: boolean; // alias for verificationStatus === 'verified'
  verifiedAt?: string;
  activeJobsCount: number;
}

export interface Job {
  id: string;
  employerId: string;
  employerOwnerUid?: string;
  companyName: string;
  companyLogo: string;
  title: string;
  department: string;
  industry: string;
  location: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  experienceLevel: 'Fresher' | 'Junior' | 'Mid' | 'Senior' | 'Lead';
  minExperienceYears: number;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: 'yearly' | 'monthly' | 'hourly';
  };
  overview: string;
  responsibilities: string[];
  requirements: string[];
  preferredSkills: string[];
  benefits: string[];
  deadline: string;
  postedDate: string;
  status: 'published' | 'draft' | 'paused' | 'closed' | 'archived';
  applicantsCount: number;
  viewsCount: number;
  isVerifiedCompany: boolean;
  featured?: boolean;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  level: 'Foundational' | 'Intermediate' | 'Advanced';
  modules: number;
  duration: string;
  learningMode?: 'Online' | 'Live Online' | 'Hybrid' | 'Classroom' | 'Self-Paced';
  fees?: string;
  imageUrl?: string;
  outcomes?: string[];
  curriculum?: string[];
  badge?: string;
  description: string;
  instructor?: string;
  provider?: string;
  skillsCovered: string[];
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
}

export type ApplicationStatus = 
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected'
  | 'Not Selected'
  | 'Withdrawn';

export interface ApplicationTimelineEvent {
  status: ApplicationStatus;
  date: string;
  note?: string;
}

export interface InternalNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  candidateId: string;
  candidateCode?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateHeadline: string;
  candidateLocation: string;
  candidateExperienceYears: number;
  candidateSkills: string[];
  resumeName: string;
  coverNote?: string;
  status: ApplicationStatus;
  appliedDate: string;
  appliedAt?: string;
  timeline: ApplicationTimelineEvent[];
  internalNotes?: InternalNote[];
  interviewId?: string;
  matchScore?: number;
}

export interface HiringEnquiry {
  id: string;
  companyName: string;
  contactPerson: string;
  businessEmail: string;
  phoneNumber: string;
  jobTitle: string;
  vacancies: number;
  jobLocation: string;
  additionalRequirements: string;
  status: 'New' | 'Contacted' | 'In Progress' | 'Fulfilled' | 'Closed';
  assignedRecruiter?: string;
  internalNotes?: string;
  createdAt: string;
}

export interface CourseEnquiry {
  id: string;
  courseId: string;
  courseTitle: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  employerId: string;
  companyName: string;
  date: string;
  time: string;
  type: 'Video' | 'Phone' | 'In-person';
  meetingLink?: string;
  location?: string;
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
}

export interface NotificationItem {
  id: string;
  userId: string;
  targetRole: UserRole | 'all';
  title: string;
  message: string;
  type: 'application' | 'interview' | 'job' | 'system' | 'verification';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participantCandidateId: string;
  candidateName: string;
  participantEmployerId: string;
  employerName: string;
  companyName: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

export interface AnalyticsEvent {
  id: string;
  eventName: string;
  userId?: string;
  userRole?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: 'Candidate Help' | 'Employer Help' | 'Verification' | 'Job Posting' | 'Billing' | 'General';
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
}

export type JobSearchAlertFrequency = 'instant' | 'daily' | 'weekly';

export interface JobSearchAlertCriteria {
  search: string;
  location: string;
  workMode: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange: string;
  department: string;
  industry: string;
  selectedSkill: string;
  quickMinSalary: boolean;
}

export interface JobSearchAlert extends JobSearchAlertCriteria {
  id: string;
  userId: string;
  email: string;
  label: string;
  queryKey: string;
  frequency: JobSearchAlertFrequency;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

