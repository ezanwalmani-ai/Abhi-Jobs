export type UserRole = 'job_seeker' | 'employer' | 'admin' | 'candidate';

export interface User {
  id: string;
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
  startYear: string;
  endYear: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  city?: string;
  state?: string;
  headline: string;
  about: string;
  currentRole: string;
  desiredRole: string;
  experienceLevel: 'Fresher' | 'Junior' | 'Mid' | 'Senior' | 'Lead';
  experienceType?: 'fresher' | 'experienced';
  workStatus?: 'Working' | 'Looking for a job' | 'Currently not working' | 'Student' | string;
  yearsOfExperience: number;
  preferredLocation: string;
  workPreference: 'Remote' | 'Hybrid' | 'On-site' | 'Flexible';
  preferredIndustry?: string;
  expectedSalary?: { min?: number; max?: number; currency?: string };
  willingToRelocate?: boolean;
  gender?: string;
  dob?: string;
  marketingConsent?: boolean;
  availability: 'Immediate' | '15 Days' | '30 Days' | 'Exploring';
  profileVisibility: 'public' | 'employers_only' | 'private';
  availableForOpportunities: boolean;
  skills: string[];
  education: EducationItem[];
  experiences: ExperienceItem[];
  certifications: CertificationItem[];
  resumeUrl?: string;
  resumeName?: string;
  resumeSize?: string;
  resumeUpdated?: string;
  completionPercentage: number;
  recommendations: string[];
  avatar?: string;
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
  | 'Selected'
  | 'Rejected'
  | 'Withdrawn';

export interface ApplicationTimelineEvent {
  status: ApplicationStatus;
  date: string;
  note?: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  candidateId: string;
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
  timeline: ApplicationTimelineEvent[];
  interviewId?: string;
  matchScore?: number;
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
