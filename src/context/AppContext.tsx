import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  CandidateProfile,
  EmployerProfile,
  Job,
  Course,
  Application,
  ApplicationStatus,
  ApplicationTimelineEvent,
  Interview,
  NotificationItem,
  SupportTicket,
  AnalyticsEvent,
  HiringEnquiry,
  CourseEnquiry,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CANDIDATES,
  INITIAL_COMPANIES,
  INITIAL_JOBS,
  INITIAL_COURSES,
  INITIAL_HIRING_ENQUIRIES,
  INITIAL_APPLICATIONS,
  INITIAL_INTERVIEWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_ANALYTICS,
} from '../data/mockData';
import confetti from 'canvas-confetti';
import {
  auth as firebaseAuth,
  testConnection as testFirebaseConnection,
  signInWithFirebaseGoogle,
  signInWithFirebaseEmail,
  registerWithFirebaseEmail,
  requestFirebasePasswordReset,
  firebaseSignOut,
  onAuthStateChanged as onFirebaseAuthStateChanged,
} from '../lib/firebase';
import {
  resolveFirebaseAdminSession,
  type ResolvedAdminSession,
} from '../services/adminRbacService';
import {
  fetchCandidateProfileFromFirestore,
  saveCandidateProfileToFirestore,
  listUserSavedJobIds,
  setSavedJobInFirestore,
  listRecentlyViewedJobIds,
  recordRecentlyViewedJobInFirestore,
  listUserNotificationsFromFirestore,
  markUserNotificationReadInFirestore,
  listVerifiedEmployersFromFirestore,
  fetchOwnerEmployerFromFirestore,
  createEmployerInFirestore,
  updateEmployerVerificationInFirestore,
  listPublishedJobsFromFirestore,
  saveJobToFirestore,
  updateJobModerationInFirestore,
  listCandidateApplicationsFromFirestore,
  listEmployerApplicationsFromFirestore,
  submitApplicationToFirestore,
  updateApplicationStatusInFirestore,
  addApplicationInternalNote,
  scheduleInterviewInFirestore,
  createHiringEnquiryInFirestore,
  updateHiringEnquiryAdminInFirestore,
  createCourseEnquiryInFirestore,
  setUserAccountStatusInFirestore,
} from '../services/recruitmentFirestoreService';
import {
  buildSafeCsvFilename,
  mapDatasetToCsvRows,
  serializeCsvDocument,
  triggerCsvBlobDownload,
} from '../utils/csvExport';

interface ToastInfo {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface AppContextType {
  currentUser: User | null;
  currentRole: UserRole;
  currentCandidate: CandidateProfile | null;
  currentEmployer: EmployerProfile | null;
  adminSession: ResolvedAdminSession | null;
  firebaseEmailVerified: boolean;
  users: User[];
  candidates: CandidateProfile[];
  companies: EmployerProfile[];
  jobs: Job[];
  courses: Course[];
  applications: Application[];
  interviews: Interview[];
  notifications: NotificationItem[];
  supportTickets: SupportTicket[];
  analyticsEvents: AnalyticsEvent[];
  hiringEnquiries: HiringEnquiry[];
  courseEnquiries: CourseEnquiry[];
  savedJobIds: string[];
  recentlyViewedJobIds: string[];
  toasts: ToastInfo[];

  // Global Visual Loading State
  isGlobalLoading: boolean;
  globalLoadingMessage: string | null;
  startGlobalLoading: (message?: string) => void;
  stopGlobalLoading: () => void;

  // Firebase Auth & Verified Admin Session (Zero One-Click Bypasses)
  refreshAdminSession: () => Promise<ResolvedAdminSession>;
  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: User; requiresEmailVerification?: boolean }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (googleUser: {
    name: string;
    email: string;
    avatar?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  loginWithFirebaseGooglePopup: () => Promise<{
    success: boolean;
    error?: string;
    user?: User;
    isUnauthorizedDomain?: boolean;
    hostname?: string;
  }>;
  registerJobSeeker: (data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    workStatus?: string;
    experienceLevel?: string;
    experienceType?: 'fresher' | 'experienced';
    city?: string;
    state?: string;
    marketingConsent?: boolean;
    avatar?: string;
    isGoogle?: boolean;
  }) => Promise<{
    success: boolean;
    error?: string;
    user?: User;
    candidate?: CandidateProfile;
    verificationEmailSent?: boolean;
  }>;
  registerEmployer: (data: {
    name: string;
    email: string;
    companyName: string;
    phone?: string;
    password?: string;
    industry?: string;
    location?: string;
    website?: string;
    companySize?: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    user?: User;
    employer?: EmployerProfile;
    verificationEmailSent?: boolean;
  }>;
  logout: () => void;
  updateUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  deactivateCurrentUser: () => void;
  deleteCurrentUser: () => void;

  // Candidate Actions
  updateCandidateProfile: (updated: Partial<CandidateProfile>) => void;
  saveJob: (jobId: string) => void;
  unsaveJob: (jobId: string) => void;
  recordJobView: (jobId: string) => void;
  applyToJob: (jobId: string, coverNote?: string, selectedResume?: string) => Promise<boolean>;
  withdrawApplication: (applicationId: string, reason?: string) => boolean;

  // Employer / Job Actions
  createJob: (
    newJob: Omit<Job, 'id' | 'postedDate' | 'applicantsCount' | 'viewsCount' | 'isVerifiedCompany'>
  ) => Job;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  deleteJob: (jobId: string) => void;
  updateJobStatus: (jobId: string, status: Job['status']) => void;
  updateEmployerProfile: (updates: Partial<EmployerProfile>) => void;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, note?: string) => void;
  scheduleInterview: (interviewData: Omit<Interview, 'id'>) => Interview;
  inviteCandidateToApply: (candidateId: string, jobId: string) => void;

  // Course / Learning Actions (Admin Managed)
  createCourse: (data: Omit<Course, 'id' | 'createdAt'>) => Course;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  updateCourseStatus: (courseId: string, status: Course['status']) => void;

  // Admin Actions
  verifyEmployer: (employerId: string, status: 'verified' | 'rejected') => void;
  moderateJob: (jobId: string, action: 'approve' | 'pause' | 'delete') => void;
  sendCandidateReminder: (candidateId: string) => void;
  submitSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt'>) => void;
  updateSupportTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  exportCsvReport: (type: 'candidates' | 'employers' | 'jobs' | 'applications') => void;

  // Recruitment Consultancy Actions (Hiring & Course Enquiries + Recruiter Notes)
  submitHiringEnquiry: (data: Omit<HiringEnquiry, 'id' | 'status' | 'createdAt'>) => HiringEnquiry;
  updateHiringEnquiry: (enquiryId: string, updates: Partial<HiringEnquiry>) => void;
  submitCourseEnquiry: (data: Omit<CourseEnquiry, 'id' | 'createdAt'>) => CourseEnquiry;
  addApplicationNote: (applicationId: string, noteText: string) => void;

  // General Actions
  trackEvent: (eventName: string, metadata?: Record<string, any>, targetId?: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  deleteNotification: (notificationId: string) => void;
  recordApplicationView: (applicationId: string) => void;
  showToast: (type: ToastInfo['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function formatFirebaseAuthError(err: any): string {
  const code = String(err?.code || '');
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. If your account was migrated, use "Forgot Password" to set a new password.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in or reset your password.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 8 characters).';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a few minutes and try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact ABHI JOBS support for assistance.';
    default:
      return err?.message || 'Authentication failed. Please try again.';
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('job_seeker');
  const [adminSession, setAdminSession] = useState<ResolvedAdminSession | null>(null);
  const [firebaseEmailVerified, setFirebaseEmailVerified] = useState<boolean>(false);

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_users') || localStorage.getItem('hunar_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((u: any) => (u.role === 'candidate' ? { ...u, role: 'job_seeker' } : u));
      }
    } catch {}
    return INITIAL_USERS;
  });

  const [candidates, setCandidates] = useState<CandidateProfile[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_candidates') || localStorage.getItem('hunar_candidates');
      if (stored) {
        const list: CandidateProfile[] = JSON.parse(stored);
        return list.filter((c) => !['cand-1', 'cand-2', 'cand-3', 'cand-4', 'cand-5', 'cand-aarav'].includes(c.id));
      }
    } catch {}
    return INITIAL_CANDIDATES;
  });

  const [companies, setCompanies] = useState<EmployerProfile[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_companies') || localStorage.getItem('hunar_companies');
      if (stored) {
        const list = JSON.parse(stored);
        const filtered = list.filter((c: any) => !['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5'].includes(c.id));
        return filtered.map((c: any) => ({
          ...c,
          name: c.companyName || c.name || '',
          companyName: c.companyName || c.name || '',
          size: c.companySize || c.size || '',
          companySize: c.companySize || c.size || '',
          description: c.about || c.description || '',
          about: c.about || c.description || '',
          verified: c.verificationStatus === 'verified' || c.verified,
        }));
      }
    } catch {}
    return INITIAL_COMPANIES;
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_jobs') || localStorage.getItem('hunar_jobs');
      if (stored) {
        const list: Job[] = JSON.parse(stored);
        return list.filter((j) => !['job-1', 'job-2', 'job-3', 'job-4', 'job-5'].includes(j.id));
      }
    } catch {}
    return INITIAL_JOBS;
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_courses') || localStorage.getItem('hunar_courses');
      if (stored) {
        const list: Course[] = JSON.parse(stored);
        return list.filter((c) => !['course-demo-1', 'course-demo-2', 'course-demo-3'].includes(c.id));
      }
    } catch {}
    return INITIAL_COURSES;
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_applications') || localStorage.getItem('hunar_applications');
      if (stored) {
        const list: Application[] = JSON.parse(stored);
        return list.filter((a) => !['app-1', 'app-2', 'app-3', 'app-4'].includes(a.id));
      }
    } catch {}
    return INITIAL_APPLICATIONS;
  });

  const [interviews, setInterviews] = useState<Interview[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_interviews') || localStorage.getItem('hunar_interviews');
      if (stored) {
        const list: Interview[] = JSON.parse(stored);
        return list.filter((i) => !['int-1', 'int-2', 'int-3'].includes(i.id));
      }
    } catch {}
    return INITIAL_INTERVIEWS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_notifications') || localStorage.getItem('hunar_notifications');
      return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_supportTickets') || localStorage.getItem('hunar_supportTickets');
      return stored ? JSON.parse(stored) : INITIAL_SUPPORT_TICKETS;
    } catch {
      return INITIAL_SUPPORT_TICKETS;
    }
  });

  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_analytics') || localStorage.getItem('hunar_analytics');
      return stored ? JSON.parse(stored) : INITIAL_ANALYTICS;
    } catch {
      return INITIAL_ANALYTICS;
    }
  });

  const [hiringEnquiries, setHiringEnquiries] = useState<HiringEnquiry[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_hiringEnquiries');
      return stored ? JSON.parse(stored) : INITIAL_HIRING_ENQUIRIES;
    } catch {
      return INITIAL_HIRING_ENQUIRIES;
    }
  });

  const [courseEnquiries, setCourseEnquiries] = useState<CourseEnquiry[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_courseEnquiries');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_savedJobs') || localStorage.getItem('hunar_savedJobs');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed)
          ? parsed.filter((id) => !['job-1', 'job-2', 'job-3', 'job-4', 'job-5'].includes(id))
          : [];
      }
    } catch {}
    return [];
  });

  const [recentlyViewedJobIds, setRecentlyViewedJobIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_recently_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {}
    return [];
  });

  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isGlobalLoading, setIsGlobalLoading] = useState<boolean>(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState<string | null>(null);

  const startGlobalLoading = (message?: string) => {
    setGlobalLoadingMessage(message || null);
    setIsGlobalLoading(true);
  };

  const stopGlobalLoading = () => {
    setIsGlobalLoading(false);
    setGlobalLoadingMessage(null);
  };

  const refreshAdminSession = useCallback(async (): Promise<ResolvedAdminSession> => {
    const resolved = await resolveFirebaseAdminSession(firebaseAuth.currentUser);
    setAdminSession(resolved);
    return resolved;
  }, []);

  // Hydrate public Firestore catalog (published jobs & verified employers) on boot
  useEffect(() => {
    testFirebaseConnection().catch(() => {});

    let active = true;
    Promise.all([
      listPublishedJobsFromFirestore(100).catch(() => []),
      listVerifiedEmployersFromFirestore(100).catch(() => []),
    ]).then(([cloudJobs, cloudEmployers]) => {
      if (!active) return;
      if (cloudJobs.length > 0) {
        setJobs((prev) => {
          const map = new Map(prev.map((j) => [j.id, j]));
          cloudJobs.forEach((j) => map.set(j.id, j));
          return Array.from(map.values());
        });
      }
      if (cloudEmployers.length > 0) {
        setCompanies((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          cloudEmployers.forEach((c) => map.set(c.id, c));
          return Array.from(map.values());
        });
      }
    });

    // Authoritative Firebase Auth session listener (replaces localStorage & Supabase auth listeners)
    const unsubscribeFirebase = onFirebaseAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (!active) return;
      if (!fbUser || !fbUser.email) {
        setCurrentUser(null);
        setCurrentRole('job_seeker');
        setAdminSession(null);
        setFirebaseEmailVerified(false);
        return;
      }

      setFirebaseEmailVerified(Boolean(fbUser.emailVerified));
      const userEmail = fbUser.email.toLowerCase();
      const displayName = fbUser.displayName || userEmail.split('@')[0] || 'ABHI JOBS Member';
      const avatarUrl =
        fbUser.photoURL ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

      // Resolve authoritative admin RBAC role + owner employer/candidate docs in Firestore
      const [resolvedAdmin, cloudCandidate, ownerEmployer, cloudSaved, cloudViewed, cloudNotifs] =
        await Promise.all([
          resolveFirebaseAdminSession(fbUser),
          fbUser.emailVerified
            ? fetchCandidateProfileFromFirestore(fbUser.uid).catch(() => null)
            : Promise.resolve(null),
          fbUser.emailVerified
            ? fetchOwnerEmployerFromFirestore(fbUser.uid).catch(() => null)
            : Promise.resolve(null),
          fbUser.emailVerified
            ? listUserSavedJobIds(fbUser.uid).catch(() => [])
            : Promise.resolve([]),
          fbUser.emailVerified
            ? listRecentlyViewedJobIds(fbUser.uid).catch(() => [])
            : Promise.resolve([]),
          fbUser.emailVerified
            ? listUserNotificationsFromFirestore(fbUser.uid).catch(() => [])
            : Promise.resolve([]),
        ]);

      if (!active) return;
      setAdminSession(resolvedAdmin);

      // Determine authoritative role strictly from Firebase RBAC / Firestore records (never client spoofing)
      const resolvedRole: UserRole = resolvedAdmin.authorized
        ? 'admin'
        : ownerEmployer
          ? 'employer'
          : 'job_seeker';

      const syncedUser: User = {
        id: fbUser.uid,
        name: displayName,
        email: userEmail,
        role: resolvedRole,
        avatar: avatarUrl,
        createdAt: fbUser.metadata?.creationTime || new Date().toISOString(),
        lastActive: 'Just now',
        status: resolvedAdmin.denialReason === 'account_suspended' ? 'suspended' : 'active',
      };

      setCurrentUser(syncedUser);
      setCurrentRole(resolvedRole);
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === fbUser.uid || u.email.toLowerCase() === userEmail);
        return exists
          ? prev.map((u) =>
              u.id === fbUser.uid || u.email.toLowerCase() === userEmail ? syncedUser : u
            )
          : [syncedUser, ...prev];
      });

      if (cloudCandidate) {
        setCandidates((prev) => {
          const filtered = prev.filter(
            (c) => c.userId !== fbUser.uid && c.email.toLowerCase() !== userEmail
          );
          return [cloudCandidate, ...filtered];
        });
      }

      if (ownerEmployer) {
        setCompanies((prev) => {
          const filtered = prev.filter((c) => c.id !== ownerEmployer.id && c.userId !== fbUser.uid);
          return [ownerEmployer, ...filtered];
        });
      }

      if (cloudSaved.length > 0) {
        setSavedJobIds((prev) => Array.from(new Set([...cloudSaved, ...prev])));
      }
      if (cloudViewed.length > 0) {
        setRecentlyViewedJobIds((prev) => Array.from(new Set([...cloudViewed, ...prev])).slice(0, 20));
      }
      if (cloudNotifs.length > 0) {
        setNotifications((prev) => {
          const map = new Map(prev.map((n) => [n.id, n]));
          cloudNotifs.forEach((n) => map.set(n.id, n));
          return Array.from(map.values());
        });
      }

      // Hydrate user's applications from Firestore
      if (fbUser.emailVerified) {
        const appFetch = ownerEmployer
          ? listEmployerApplicationsFromFirestore(fbUser.uid).catch(() => [])
          : listCandidateApplicationsFromFirestore(fbUser.uid).catch(() => []);
        appFetch.then((cloudApps) => {
          if (!active || cloudApps.length === 0) return;
          setApplications((prev) => {
            const map = new Map(prev.map((a) => [a.id, a]));
            cloudApps.forEach((a) => map.set(a.id, a));
            return Array.from(map.values());
          });
        });
      }
    });

    return () => {
      active = false;
      unsubscribeFirebase();
    };
  }, []);

  // Sync non-authoritative local UI cache for offline continuity
  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_candidates', JSON.stringify(candidates));
    } catch {}
  }, [candidates]);

  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_companies', JSON.stringify(companies));
    } catch {}
  }, [companies]);

  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_jobs', JSON.stringify(jobs));
    } catch {}
  }, [jobs]);

  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_courses', JSON.stringify(courses));
    } catch {}
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_applications', JSON.stringify(applications));
    } catch {}
  }, [applications]);

  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_interviews', JSON.stringify(interviews));
    } catch {}
  }, [interviews]);

  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_savedJobs', JSON.stringify(savedJobIds));
      if (currentUser?.id) {
        localStorage.setItem(`abhijobs_savedJobs_${currentUser.id}`, JSON.stringify(savedJobIds));
      }
    } catch {}
  }, [savedJobIds, currentUser?.id]);

  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_recently_viewed', JSON.stringify(recentlyViewedJobIds));
    } catch {}
  }, [recentlyViewedJobIds]);

  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_hiringEnquiries', JSON.stringify(hiringEnquiries));
    } catch {}
  }, [hiringEnquiries]);

  useEffect(() => {
    try {
      localStorage.setItem('abhijobs_courseEnquiries', JSON.stringify(courseEnquiries));
    } catch {}
  }, [courseEnquiries]);

  const currentCandidate =
    (currentUser
      ? candidates.find(
          (c) => c.userId === currentUser.id || c.email.toLowerCase() === currentUser.email.toLowerCase()
        )
      : null) || null;

  const currentEmployer =
    (currentUser
      ? companies.find(
          (e) =>
            e.userId === currentUser.id ||
            (e.recruiterEmail && e.recruiterEmail.toLowerCase() === currentUser.email.toLowerCase())
        )
      : null) || null;

  const showToast = (type: ToastInfo['type'], title: string, message?: string) => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const trackEvent = (eventName: string, metadata?: Record<string, any>, targetId?: string) => {
    const newEvent: AnalyticsEvent = {
      id: 'ev-' + Date.now(),
      eventName,
      userId: currentUser?.id,
      userRole: currentRole,
      targetId,
      metadata,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setAnalyticsEvents((prev) => [newEvent, ...prev]);
  };

  // ============================================================================
  // REAL FIREBASE AUTHENTICATION (ZERO ONE-CLICK BYPASSES)
  // ============================================================================

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User; requiresEmailVerification?: boolean }> => {
    if (!email.trim() || !password) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }
    startGlobalLoading('Signing in with Firebase Authentication...');
    try {
      const fbResult = await signInWithFirebaseEmail(email.trim(), password);
      const resolvedAdmin = await resolveFirebaseAdminSession(fbResult.user);
      setAdminSession(resolvedAdmin);

      if (resolvedAdmin.denialReason === 'account_suspended') {
        await firebaseSignOut(firebaseAuth).catch(() => {});
        return {
          success: false,
          error: 'Your account has been suspended. Please contact ABHI JOBS support.',
        };
      }

      const ownerEmployer = fbResult.user.emailVerified
        ? await fetchOwnerEmployerFromFirestore(fbResult.user.uid).catch(() => null)
        : null;

      const role: UserRole = resolvedAdmin.authorized
        ? 'admin'
        : ownerEmployer
          ? 'employer'
          : 'job_seeker';

      const authenticatedUser: User = {
        id: fbResult.user.uid,
        name: fbResult.name,
        email: fbResult.email.toLowerCase(),
        role,
        avatar: fbResult.avatar,
        status: 'active',
        createdAt: fbResult.user.metadata?.creationTime || new Date().toISOString(),
        lastActive: 'Just now',
      };

      setCurrentUser(authenticatedUser);
      setCurrentRole(role);
      setFirebaseEmailVerified(Boolean(fbResult.user.emailVerified));

      showToast(
        'success',
        `Welcome back, ${authenticatedUser.name}!`,
        fbResult.user.emailVerified
          ? `Signed in via Firebase (${authenticatedUser.email})`
          : 'Please check your inbox and verify your email address to unlock all cloud features.'
      );
      trackEvent('user_login', { method: 'firebase_email', role });

      return {
        success: true,
        user: authenticatedUser,
        requiresEmailVerification: !fbResult.user.emailVerified,
      };
    } catch (err: any) {
      return { success: false, error: formatFirebaseAuthError(err) };
    } finally {
      stopGlobalLoading();
    }
  };

  const sendPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      return { success: false, error: 'Please enter a valid email address first.' };
    }
    try {
      await requestFirebasePasswordReset(trimmed);
      showToast(
        'success',
        'Password Reset Email Sent',
        `Check ${trimmed} for your Firebase password reset link.`
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatFirebaseAuthError(err) };
    }
  };

  const loginWithGoogle = async (googleUser: {
    name: string;
    email: string;
    avatar?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    // Redirect any Google modal flow to real Firebase Google Sign-In popup; never fabricate admin sessions.
    void googleUser;
    const popupResult = await loginWithFirebaseGooglePopup();
    return {
      success: popupResult.success,
      error: popupResult.error,
      user: popupResult.user,
    };
  };

  const loginWithFirebaseGooglePopup = async (): Promise<{
    success: boolean;
    error?: string;
    user?: User;
    isUnauthorizedDomain?: boolean;
    hostname?: string;
  }> => {
    startGlobalLoading('Connecting to Google via Firebase Auth...');
    try {
      const fbData = await signInWithFirebaseGoogle();
      const resolvedAdmin = await resolveFirebaseAdminSession(fbData.user);
      setAdminSession(resolvedAdmin);

      if (resolvedAdmin.denialReason === 'account_suspended') {
        await firebaseSignOut(firebaseAuth).catch(() => {});
        return {
          success: false,
          error: 'Your account has been suspended. Contact ABHI JOBS support.',
        };
      }

      const ownerEmployer = await fetchOwnerEmployerFromFirestore(fbData.user.uid).catch(() => null);
      const role: UserRole = resolvedAdmin.authorized
        ? 'admin'
        : ownerEmployer
          ? 'employer'
          : 'job_seeker';

      const authedUser: User = {
        id: fbData.user.uid,
        name: fbData.name,
        email: fbData.email.toLowerCase(),
        role,
        avatar: fbData.avatar,
        status: 'active',
        createdAt: fbData.user.metadata?.creationTime || new Date().toISOString(),
        lastActive: 'Just now',
      };

      setCurrentUser(authedUser);
      setCurrentRole(role);
      setFirebaseEmailVerified(Boolean(fbData.user.emailVerified));

      // Ensure candidate doc exists for non-employer Google sign-ins
      if (!ownerEmployer) {
        const existingCand = await fetchCandidateProfileFromFirestore(fbData.user.uid).catch(() => null);
        if (!existingCand && fbData.user.emailVerified) {
          const initialCand: CandidateProfile = {
            id: fbData.user.uid,
            userId: fbData.user.uid,
            name: fbData.name,
            email: fbData.email.toLowerCase(),
            phone: '',
            location: 'India',
            headline: 'Job Seeker',
            about: '',
            currentRole: '',
            desiredRole: '',
            experienceLevel: 'Fresher',
            experienceType: 'fresher',
            workStatus: 'Looking for a job',
            yearsOfExperience: 0,
            preferredLocation: 'India',
            workPreference: 'Hybrid',
            availability: 'Immediate',
            profileVisibility: 'employers_only',
            availableForOpportunities: true,
            skills: [],
            education: [],
            experiences: [],
            certifications: [],
            completionPercentage: 25,
            recommendations: [],
            avatar: fbData.avatar,
          };
          saveCandidateProfileToFirestore(fbData.user.uid, initialCand).catch(() => {});
          setCandidates((prev) => [
            initialCand,
            ...prev.filter((c) => c.userId !== fbData.user.uid),
          ]);
        }
      }

      showToast('success', `Welcome, ${fbData.name}!`, 'Signed in with Google (Firebase Auth)');
      trackEvent('user_login', { method: 'firebase_google', role });
      return { success: true, user: authedUser };
    } catch (err: any) {
      const isBlocked = err?.code === 'auth/popup-blocked';
      const isCancelled =
        err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request';
      const isUnauthDomain = err?.code === 'auth/unauthorized-domain';
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

      if (isUnauthDomain) {
        return {
          success: false,
          error: `Firebase domain authorization required: "${currentHost}" is not in Firebase Authorized domains.`,
          isUnauthorizedDomain: true,
          hostname: currentHost,
        };
      }

      return {
        success: false,
        error: isBlocked
          ? 'Popup was blocked by your browser. Please allow popups for this site.'
          : isCancelled
            ? 'Google sign-in popup was closed before completing.'
            : formatFirebaseAuthError(err),
      };
    } finally {
      stopGlobalLoading();
    }
  };

  const registerJobSeeker = async (data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    workStatus?: string;
    experienceLevel?: string;
    experienceType?: 'fresher' | 'experienced';
    city?: string;
    state?: string;
    marketingConsent?: boolean;
    avatar?: string;
    isGoogle?: boolean;
  }): Promise<{
    success: boolean;
    error?: string;
    user?: User;
    candidate?: CandidateProfile;
    verificationEmailSent?: boolean;
  }> => {
    if (!data.password || data.password.length < 8) {
      return { success: false, error: 'A password of at least 8 characters is required.' };
    }
    startGlobalLoading('Creating your Firebase account...');
    try {
      const trimmedEmail = data.email.trim().toLowerCase();
      const fbReg = await registerWithFirebaseEmail({
        email: trimmedEmail,
        password: data.password,
        displayName: data.name.trim(),
        role: 'job_seeker',
      });

      const locationStr = [data.city, data.state].filter(Boolean).join(', ') || 'India';
      const isFresher =
        data.experienceType === 'fresher' ||
        data.experienceLevel?.toLowerCase().includes('fresher');

      const newUser: User = {
        id: fbReg.user.uid,
        name: data.name.trim(),
        email: trimmedEmail,
        role: 'job_seeker',
        avatar: data.avatar || fbReg.avatar,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        lastActive: 'Just now',
      };

      const newCandidate: CandidateProfile = {
        id: fbReg.user.uid,
        userId: fbReg.user.uid,
        name: data.name.trim(),
        email: trimmedEmail,
        phone: data.phone || '',
        location: locationStr,
        city: data.city || '',
        state: data.state || '',
        headline: isFresher ? 'Aspiring Professional | Open to Opportunities' : 'Job Seeker',
        about: '',
        currentRole: isFresher ? 'Fresher' : 'Job Seeker',
        desiredRole: isFresher ? 'Entry-Level Associate' : 'Open to Opportunities',
        experienceLevel: isFresher ? 'Fresher' : 'Junior',
        experienceType: isFresher ? 'fresher' : 'experienced',
        workStatus: data.workStatus || 'Looking for a job',
        yearsOfExperience: isFresher ? 0 : 1,
        preferredLocation: locationStr,
        workPreference: 'Hybrid',
        availability: 'Immediate',
        profileVisibility: 'employers_only',
        availableForOpportunities: true,
        skills: [],
        education: [],
        experiences: [],
        certifications: [],
        completionPercentage: 25,
        recommendations: [],
        avatar: newUser.avatar,
        marketingConsent: !!data.marketingConsent,
        lastActive: 'Just now',
      };

      setUsers((prev) => [newUser, ...prev.filter((u) => u.id !== newUser.id)]);
      setCandidates((prev) => [newCandidate, ...prev.filter((c) => c.userId !== newCandidate.userId)]);

      // Sign out after email/password registration until user verifies their email address
      await firebaseSignOut(firebaseAuth).catch(() => {});
      setCurrentUser(null);

      showToast(
        'success',
        'Account Created — Verify Your Email',
        `A verification link has been sent to ${trimmedEmail}. Please verify your email before signing in.`
      );
      trackEvent('user_registered', { method: 'firebase_email', role: 'job_seeker' });

      return {
        success: true,
        user: newUser,
        candidate: newCandidate,
        verificationEmailSent: fbReg.verificationEmailSent,
      };
    } catch (err: any) {
      return { success: false, error: formatFirebaseAuthError(err) };
    } finally {
      stopGlobalLoading();
    }
  };

  const registerEmployer = async (data: {
    name: string;
    email: string;
    companyName: string;
    phone?: string;
    password?: string;
    industry?: string;
    location?: string;
    website?: string;
    companySize?: string;
  }): Promise<{
    success: boolean;
    error?: string;
    user?: User;
    employer?: EmployerProfile;
    verificationEmailSent?: boolean;
  }> => {
    if (!data.password || data.password.length < 8) {
      return { success: false, error: 'A password of at least 8 characters is required.' };
    }
    startGlobalLoading('Registering company account...');
    try {
      const trimmedEmail = data.email.trim().toLowerCase();
      const fbReg = await registerWithFirebaseEmail({
        email: trimmedEmail,
        password: data.password,
        displayName: data.name.trim(),
        role: 'employer',
      });

      const newUser: User = {
        id: fbReg.user.uid,
        name: data.name.trim(),
        email: trimmedEmail,
        role: 'employer',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.companyName)}&backgroundColor=062e22`,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        lastActive: 'Just now',
      };

      // SECURITY: Self-registered employers are ALWAYS created as pending (never self-verified)
      let createdEmployer: EmployerProfile;
      try {
        createdEmployer = await createEmployerInFirestore({
          ownerUid: fbReg.user.uid,
          companyName: data.companyName.trim(),
          website: data.website?.trim(),
          industry: data.industry || 'Technology & Services',
          companySize: data.companySize || '11-50 employees',
          location: data.location || 'India',
          about: `Organization account for ${data.companyName.trim()}. Pending verification by ABHI JOBS Recruitment Team.`,
          logo: newUser.avatar,
          recruiterName: data.name.trim(),
          recruiterRole: 'Hiring Manager',
          recruiterEmail: trimmedEmail,
          recruiterPhone: data.phone || '',
        });
      } catch {
        createdEmployer = {
          id: `emp_${fbReg.user.uid}`,
          userId: fbReg.user.uid,
          name: data.companyName.trim(),
          companyName: data.companyName.trim(),
          industry: data.industry || 'Technology & Services',
          location: data.location || 'India',
          website: data.website || '',
          companySize: data.companySize || '11-50 employees',
          size: data.companySize || '11-50 employees',
          recruiterName: data.name.trim(),
          recruiterRole: 'Hiring Manager',
          recruiterEmail: trimmedEmail,
          recruiterPhone: data.phone || '',
          about: `Organization account for ${data.companyName.trim()}. Pending verification.`,
          description: `Organization account for ${data.companyName.trim()}. Pending verification.`,
          benefits: [],
          culture: '',
          socialLinks: {},
          verified: false,
          verificationStatus: 'pending',
          activeJobsCount: 0,
          logo: newUser.avatar || '',
        };
      }

      setUsers((prev) => [newUser, ...prev.filter((u) => u.id !== newUser.id)]);
      setCompanies((prev) => [createdEmployer, ...prev.filter((c) => c.id !== createdEmployer.id)]);

      await firebaseSignOut(firebaseAuth).catch(() => {});
      setCurrentUser(null);

      showToast(
        'success',
        'Employer Account Registered (Pending Verification)',
        `Verify your email at ${trimmedEmail}. Once approved by ABHI JOBS admins, you can publish jobs.`
      );
      trackEvent('employer_register', { email: trimmedEmail, company: data.companyName });

      return {
        success: true,
        user: newUser,
        employer: createdEmployer,
        verificationEmailSent: fbReg.verificationEmailSent,
      };
    } catch (err: any) {
      return { success: false, error: formatFirebaseAuthError(err) };
    } finally {
      stopGlobalLoading();
    }
  };

  const logout = () => {
    firebaseSignOut(firebaseAuth).catch(() => {});
    try {
      localStorage.removeItem('abhijobs_currentUser');
      localStorage.removeItem('hunar_currentUser');
    } catch {}
    setCurrentUser(null);
    setCurrentRole('job_seeker');
    setAdminSession(null);
    setFirebaseEmailVerified(false);
    setSavedJobIds([]);
    showToast('info', 'Signed Out', 'You have been signed out successfully.');
  };

  const updateUserStatus = (userId: string, status: 'active' | 'suspended') => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    if (firebaseAuth.currentUser?.emailVerified && adminSession?.permissions?.canSuspendUsers) {
      setUserAccountStatusInFirestore(userId, status).catch((err) => {
        console.warn('Firestore user status update notice:', err);
      });
    }
    showToast('info', 'User Status Updated', `User is now marked as ${status}.`);
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u)));

    if (updates.name || updates.email) {
      setCandidates((prev) =>
        prev.map((c) =>
          c.userId === currentUser.id || c.email.toLowerCase() === currentUser.email.toLowerCase()
            ? {
                ...c,
                name: updates.name || c.name,
                email: updates.email || c.email,
              }
            : c
        )
      );
    }
    showToast('success', 'Settings Saved', 'Your account settings have been updated.');
  };

  const deactivateCurrentUser = () => {
    if (!currentUser) return;
    const uid = currentUser.id;
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, status: 'suspended' } : u)));
    showToast('info', 'Account Deactivated', 'Your account has been deactivated.');
    logout();
  };

  const deleteCurrentUser = () => {
    if (!currentUser) return;
    const uid = currentUser.id;
    setUsers((prev) => prev.filter((u) => u.id !== uid));
    setCandidates((prev) => prev.filter((c) => c.userId !== uid));
    setCompanies((prev) => prev.filter((comp) => comp.userId !== uid));
    showToast('info', 'Account Removed', 'Your ABHI JOBS local session data has been cleared.');
    logout();
  };

  // ============================================================================
  // CANDIDATE ACTIONS (SYNCED TO FIRESTORE)
  // ============================================================================

  const updateCandidateProfile = (updates: Partial<CandidateProfile>) => {
    let targetCandidate = currentCandidate;
    if (!targetCandidate && currentUser) {
      const fallbackCand: CandidateProfile = {
        id: currentUser.id,
        userId: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        phone: '',
        location: 'India',
        headline: 'Job Seeker',
        about: '',
        currentRole: '',
        desiredRole: '',
        experienceLevel: 'Fresher',
        experienceType: 'fresher',
        workStatus: 'Looking for a job',
        yearsOfExperience: 0,
        preferredLocation: 'India',
        workPreference: 'Hybrid',
        skills: [],
        education: [],
        experiences: [],
        certifications: [],
        completionPercentage: 25,
        recommendations: [],
        availability: 'Immediate',
        profileVisibility: 'employers_only',
        availableForOpportunities: true,
        avatar: currentUser.avatar,
      };
      setCandidates((prev) => [fallbackCand, ...prev]);
      targetCandidate = fallbackCand;
    }
    if (!targetCandidate) return;

    const candId = targetCandidate.id;
    let computedUpdated: CandidateProfile | null = null;

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candId) {
          const updated = { ...c, ...updates };
          let score = 20;
          if (updated.headline && updated.headline.length > 5) score += 10;
          if (updated.about && updated.about.length > 15) score += 10;
          if (updated.education && updated.education.length > 0) score += 15;
          if (updated.experienceType === 'fresher' || (updated.experiences && updated.experiences.length > 0)) {
            score += 15;
          }
          if (updated.skills && updated.skills.length >= 3) score += 15;
          if (updated.desiredRole && updated.desiredRole.length > 3) score += 5;
          if (updated.resumeName || updated.resumeUrl) score += 10;

          updated.completionPercentage =
            typeof updates.completionPercentage === 'number'
              ? updates.completionPercentage
              : Math.min(100, Math.max(score, c.completionPercentage || 20));
          computedUpdated = updated;
          return updated;
        }
        return c;
      })
    );

    const fbUser = firebaseAuth.currentUser;
    if (fbUser && fbUser.emailVerified && computedUpdated) {
      saveCandidateProfileToFirestore(fbUser.uid, computedUpdated).catch((err) => {
        console.warn('Firestore candidate profile sync notice:', err);
      });
    }

    showToast('success', 'Profile Updated', 'Your ABHI JOBS profile changes have been saved.');
    trackEvent('profile_updated', { candidateId: candId });
  };

  const saveJob = (jobId: string) => {
    if (!savedJobIds.includes(jobId)) {
      setSavedJobIds((prev) => [...prev, jobId]);
      const fbUser = firebaseAuth.currentUser;
      const job = jobs.find((j) => j.id === jobId);
      if (fbUser && fbUser.emailVerified && job) {
        setSavedJobInFirestore(fbUser.uid, job, true).catch(() => {});
      }
      showToast('success', 'Job Saved', 'Added to your saved jobs portfolio.');
      trackEvent('job_saved', { jobId });
    }
  };

  const unsaveJob = (jobId: string) => {
    setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
    const fbUser = firebaseAuth.currentUser;
    if (fbUser && fbUser.emailVerified) {
      setSavedJobInFirestore(fbUser.uid, { id: jobId, title: '', companyName: '' }, false).catch(() => {});
    }
    showToast('info', 'Job Removed', 'Removed from saved jobs.');
  };

  const recordJobView = (jobId: string) => {
    if (!jobId) return;
    setRecentlyViewedJobIds((prev) => [jobId, ...prev.filter((id) => id !== jobId)].slice(0, 20));
    const fbUser = firebaseAuth.currentUser;
    if (fbUser && fbUser.emailVerified) {
      recordRecentlyViewedJobInFirestore(fbUser.uid, jobId).catch(() => {});
    }
  };

  const applyToJob = async (
    jobId: string,
    coverNote?: string,
    selectedResume?: string
  ): Promise<boolean> => {
    startGlobalLoading('Submitting application...');
    try {
      const job = jobs.find((j) => j.id === jobId);
      if (!job || !currentCandidate) {
        showToast('error', 'Cannot apply', 'Please sign in and complete your candidate profile first.');
        return false;
      }

      const existing = applications.find(
        (a) =>
          a.jobId === jobId &&
          (a.candidateId === currentCandidate.id || a.candidateId === currentCandidate.userId)
      );
      if (existing) {
        showToast('warning', 'Already Applied', 'You have already submitted an application for this role.');
        return false;
      }

      const matchingSkills = (currentCandidate.skills || []).filter(
        (skill) =>
          typeof skill === 'string' &&
          (job.preferredSkills || []).some(
            (s) => typeof s === 'string' && s.toLowerCase().includes(skill.toLowerCase())
          )
      );
      const score = Math.round(
        Math.min(98, 70 + (matchingSkills.length / Math.max(1, (job.preferredSkills || []).length)) * 28)
      );

      let newApp: Application = {
        id: 'app_' + Date.now(),
        jobId,
        jobTitle: job.title,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        candidateId: currentUser?.id || currentCandidate.id,
        candidateName: currentCandidate.name,
        candidateEmail: currentCandidate.email,
        candidatePhone: currentCandidate.phone,
        candidateHeadline: currentCandidate.headline,
        candidateLocation: currentCandidate.location,
        candidateExperienceYears: currentCandidate.yearsOfExperience,
        candidateSkills: currentCandidate.skills,
        resumeName: selectedResume || currentCandidate.resumeName || 'ABHI_Structured_Resume',
        coverNote: coverNote || 'Submitted with my verified ABHI JOBS profile.',
        status: 'Applied',
        appliedDate: new Date().toISOString().substring(0, 10),
        timeline: [
          {
            status: 'Applied',
            date: new Date().toISOString().substring(0, 10),
            note: 'Application received via ABHI JOBS',
          },
        ],
        matchScore: score,
      };

      const fbUser = firebaseAuth.currentUser;
      const employerRecord = companies.find((c) => c.id === job.employerId);
      if (fbUser && fbUser.emailVerified) {
        try {
          newApp = await submitApplicationToFirestore({
            job,
            employerOwnerUid: employerRecord?.userId || job.employerId || fbUser.uid,
            candidate: { ...currentCandidate, userId: fbUser.uid },
            resumeName: newApp.resumeName,
            coverNote: newApp.coverNote,
          });
        } catch (fsErr) {
          console.warn('Firestore application submit notice:', fsErr);
        }
      }

      setApplications((prev) => [newApp, ...prev]);

      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#F47A24', '#102B4E', '#004D40'],
        });
      } catch {}

      showToast(
        'success',
        'Application Submitted!',
        `Successfully applied to ${job.companyName}. Track status in your dashboard.`
      );
      trackEvent('application_submitted', { jobId, score }, jobId);
      return true;
    } finally {
      stopGlobalLoading();
    }
  };

  const withdrawApplication = (applicationId: string, reason?: string): boolean => {
    const targetApp = applications.find((a) => a.id === applicationId);
    if (!targetApp) return false;

    const candidateId = currentUser?.id || currentCandidate?.id;
    const userEmail = currentUser?.email?.toLowerCase();
    const isOwner =
      (candidateId && targetApp.candidateId === candidateId) ||
      (userEmail && targetApp.candidateEmail?.toLowerCase() === userEmail);

    if (!isOwner && !adminSession?.permissions?.canManageApplications) {
      showToast('error', 'Unauthorized', 'You can only withdraw your own applications.');
      return false;
    }

    if (targetApp.status === 'Withdrawn') {
      showToast('warning', 'Already Withdrawn', 'This application has already been withdrawn.');
      return false;
    }

    const today = new Date().toISOString().substring(0, 10);
    const updatedTimeline: ApplicationTimelineEvent[] = [
      ...targetApp.timeline,
      {
        status: 'Withdrawn' as ApplicationStatus,
        date: today,
        note: reason ? `Withdrawn by candidate: ${reason}` : 'Withdrawn by candidate',
      },
    ];

    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? { ...app, status: 'Withdrawn' as ApplicationStatus, timeline: updatedTimeline }
          : app
      )
    );

    if (firebaseAuth.currentUser?.emailVerified) {
      updateApplicationStatusInFirestore({
        applicationId,
        status: 'Withdrawn',
        timeline: updatedTimeline,
      }).catch(() => {});
    }

    showToast('info', 'Application Withdrawn', `Your application for "${targetApp.jobTitle}" has been withdrawn.`);
    trackEvent('application_withdrawn', { applicationId, jobId: targetApp.jobId });
    return true;
  };

  // ============================================================================
  // EMPLOYER & JOB ACTIONS (SYNCED TO FIRESTORE)
  // ============================================================================

  const createJob = (
    newJobData: Omit<Job, 'id' | 'postedDate' | 'applicantsCount' | 'viewsCount' | 'isVerifiedCompany'>
  ): Job => {
    const id = 'job_' + Date.now();
    const canPublishDirectly =
      Boolean(adminSession?.permissions?.canManageJobs) ||
      currentEmployer?.verificationStatus === 'verified';

    const created: Job = {
      ...newJobData,
      id,
      status: canPublishDirectly ? newJobData.status : 'draft',
      postedDate: new Date().toISOString().substring(0, 10),
      applicantsCount: 0,
      viewsCount: 0,
      isVerifiedCompany: Boolean(currentEmployer?.verificationStatus === 'verified' || adminSession?.authorized),
    };

    setJobs((prev) => [created, ...prev]);

    const fbUser = firebaseAuth.currentUser;
    if (fbUser && fbUser.emailVerified) {
      saveJobToFirestore({
        job: created,
        employerOwnerUid: currentEmployer?.userId || fbUser.uid,
        isNew: true,
      }).catch((err) => console.warn('Firestore job create notice:', err));
    }

    showToast(
      'success',
      created.status === 'published' ? 'Job Published!' : 'Job Saved as Draft',
      created.status === 'published'
        ? `Your job opening "${created.title}" is now live.`
        : 'Your employer account is pending verification. This job has been saved as a draft.'
    );
    trackEvent('job_posted', { jobId: id, title: created.title }, id);
    return created;
  };

  const updateJob = (jobId: string, updates: Partial<Job>) => {
    let mergedJob: Job | null = null;
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          mergedJob = { ...j, ...updates };
          return mergedJob;
        }
        return j;
      })
    );
    if (firebaseAuth.currentUser?.emailVerified && mergedJob) {
      saveJobToFirestore({
        job: mergedJob,
        employerOwnerUid: currentEmployer?.userId || firebaseAuth.currentUser.uid,
      }).catch(() => {});
    }
    showToast('info', 'Job Updated', 'Job posting details have been refreshed.');
  };

  const deleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
    showToast('info', 'Job Deleted', 'The job opening has been removed.');
  };

  const updateJobStatus = (jobId: string, status: Job['status']) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
    if (firebaseAuth.currentUser?.emailVerified) {
      updateJobModerationInFirestore(jobId, { status }).catch(() => {});
    }
    showToast('info', 'Status Changed', `Job listing is now ${status}.`);
  };

  const createCourse = (newCourseData: Omit<Course, 'id' | 'createdAt'>): Course => {
    const newCourse: Course = {
      ...newCourseData,
      id: 'crs-' + Date.now(),
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setCourses((prev) => [newCourse, ...prev]);
    showToast('success', 'Course Created', `Course "${newCourse.title}" created (${newCourse.status}).`);
    return newCourse;
  };

  const updateCourse = (courseId: string, updates: Partial<Course>) => {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, ...updates } : c)));
    showToast('info', 'Course Updated', 'Course information has been updated.');
  };

  const updateCourseStatus = (courseId: string, status: Course['status']) => {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, status } : c)));
    showToast('info', 'Course Status', `Course is now ${status}.`);
  };

  const deleteCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    showToast('info', 'Course Deleted', 'Course has been removed.');
  };

  const updateEmployerProfile = (updates: Partial<EmployerProfile>) => {
    if (!currentEmployer) return;
    // Strip privileged verification fields from self-service employer profile edits
    const { verificationStatus: _vs, verified: _v, verifiedAt: _va, ...safeUpdates } = updates;
    setCompanies((prev) =>
      prev.map((c) => (c.id === currentEmployer.id ? { ...c, ...safeUpdates } : c))
    );
    showToast('success', 'Company Profile Saved', 'Your employer details have been updated.');
  };

  const updateApplicationStatus = (
    applicationId: string,
    status: ApplicationStatus,
    note?: string
  ) => {
    const today = new Date().toISOString().substring(0, 10);
    let nextTimeline: ApplicationTimelineEvent[] = [];

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === applicationId) {
          nextTimeline = [
            ...app.timeline,
            { status, date: today, note: note || `Status changed to ${status}` },
          ];
          return { ...app, status, timeline: nextTimeline };
        }
        return app;
      })
    );

    if (firebaseAuth.currentUser?.emailVerified && nextTimeline.length > 0) {
      updateApplicationStatusInFirestore({
        applicationId,
        status,
        timeline: nextTimeline,
      }).catch(() => {});
    }

    showToast('success', 'Application Status Updated', `Application moved to "${status}".`);
    trackEvent('application_status_changed', { applicationId, status });
  };

  const scheduleInterview = (interviewData: Omit<Interview, 'id'>): Interview => {
    const newInterview: Interview = {
      ...interviewData,
      id: 'int_' + Date.now(),
    };

    setInterviews((prev) => [newInterview, ...prev]);
    updateApplicationStatus(
      interviewData.applicationId,
      'Interview',
      `Interview scheduled for ${interviewData.date} at ${interviewData.time}`
    );

    const fbUser = firebaseAuth.currentUser;
    if (fbUser && fbUser.emailVerified) {
      scheduleInterviewInFirestore({
        interview: interviewData,
        employerOwnerUid: currentEmployer?.userId || fbUser.uid,
        createdByUid: fbUser.uid,
      }).catch((err) => console.warn('Firestore interview schedule notice:', err));
    }

    showToast('success', 'Interview Confirmed', `Interview scheduled for ${interviewData.candidateName}.`);
    trackEvent('interview_scheduled', { interviewId: newInterview.id });
    return newInterview;
  };

  const inviteCandidateToApply = (candidateId: string, jobId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    const job = jobs.find((j) => j.id === jobId);
    if (cand && job) {
      const notif: NotificationItem = {
        id: 'notif-' + Date.now(),
        userId: cand.id,
        targetRole: 'candidate',
        title: 'Special Invitation to Apply!',
        message: `${job.companyName} reviewed your ABHI JOBS profile and invited you to apply for "${job.title}".`,
        type: 'job',
        timestamp: 'Just now',
        read: false,
        link: `/jobs/${job.id}`,
      };
      setNotifications((prev) => [notif, ...prev]);
      showToast('success', 'Invitation Sent', `${cand.name} was notified of your opening.`);
      trackEvent('candidate_invited_to_apply', { candidateId, jobId });
    }
  };

  // ============================================================================
  // ADMIN ACTIONS (RBAC-CHECKED & FIRESTORE-SYNCED)
  // ============================================================================

  const verifyEmployer = (employerId: string, status: 'verified' | 'rejected') => {
    const today = new Date().toISOString().substring(0, 10);
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === employerId
          ? {
              ...c,
              verificationStatus: status,
              verified: status === 'verified',
              verifiedAt: status === 'verified' ? today : undefined,
            }
          : c
      )
    );
    setJobs((prev) =>
      prev.map((j) => (j.employerId === employerId ? { ...j, isVerifiedCompany: status === 'verified' } : j))
    );

    if (firebaseAuth.currentUser?.emailVerified && adminSession?.permissions?.canManageEmployers) {
      updateEmployerVerificationInFirestore({
        employerId,
        verificationStatus: status,
        adminUid: firebaseAuth.currentUser.uid,
      }).catch((err) => console.warn('Firestore employer verification notice:', err));
    }

    showToast(
      status === 'verified' ? 'success' : 'info',
      `Company ${status.toUpperCase()}`,
      'Employer verification status updated.'
    );
    trackEvent('employer_verification_action', { employerId, status });
  };

  const moderateJob = (jobId: string, action: 'approve' | 'pause' | 'delete') => {
    if (action === 'delete') {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      showToast('warning', 'Job Removed', 'Job listing removed by administrator.');
    } else {
      const status: Job['status'] = action === 'approve' ? 'published' : 'paused';
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
      if (firebaseAuth.currentUser?.emailVerified && adminSession?.permissions?.canManageJobs) {
        updateJobModerationInFirestore(jobId, { status }).catch(() => {});
      }
      showToast('info', 'Job Moderated', `Job status set to ${status}.`);
    }
    trackEvent('job_moderation', { jobId, action });
  };

  const sendCandidateReminder = (candidateId: string) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (cand) {
      const notif: NotificationItem = {
        id: 'notif-' + Date.now(),
        userId: cand.id,
        targetRole: 'candidate',
        title: 'Boost Your ABHI JOBS Profile Completion',
        message: `Your profile is ${cand.completionPercentage}% complete. Complete your remaining steps to unlock more recruiter views.`,
        type: 'system',
        timestamp: 'Just now',
        read: false,
        link: '/candidate/profile',
      };
      setNotifications((prev) => [notif, ...prev]);
      showToast('success', 'Reminder Sent', `Profile completion nudge sent to ${cand.name}.`);
      trackEvent('incomplete_profile_nudge', { candidateId });
    }
  };

  const submitSupportTicket = (ticket: Omit<SupportTicket, 'id' | 'createdAt'>) => {
    const newTicket: SupportTicket = {
      ...ticket,
      id: 'tkt-' + Date.now(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    showToast('success', 'Ticket Submitted', 'Our support team will follow up within 24 business hours.');
  };

  const updateSupportTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    setSupportTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    showToast('info', 'Support Ticket Updated', `Ticket status set to ${status}.`);
  };

  const submitHiringEnquiry = (
    data: Omit<HiringEnquiry, 'id' | 'status' | 'createdAt'>
  ): HiringEnquiry => {
    const newEnquiry: HiringEnquiry = {
      ...data,
      id: 'henq_' + Date.now(),
      status: 'New',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setHiringEnquiries((prev) => [newEnquiry, ...prev]);

    createHiringEnquiryInFirestore(data).catch((err) => {
      console.warn('Firestore hiring enquiry notice:', err);
    });

    showToast('success', 'Requirement Submitted', 'Our recruitment consultancy team will contact you shortly.');
    trackEvent('hiring_enquiry_submitted', { companyName: data.companyName, jobTitle: data.jobTitle });
    return newEnquiry;
  };

  const updateHiringEnquiry = (enquiryId: string, updates: Partial<HiringEnquiry>) => {
    setHiringEnquiries((prev) =>
      prev.map((e) => (e.id === enquiryId ? { ...e, ...updates } : e))
    );
    if (firebaseAuth.currentUser?.emailVerified && updates.status) {
      updateHiringEnquiryAdminInFirestore(enquiryId, {
        status: updates.status,
        assignedRecruiter: updates.assignedRecruiter,
        internalNotes: updates.internalNotes,
      }).catch(() => {});
    }
    showToast('success', 'Enquiry Updated', 'Hiring requirement details have been saved.');
  };

  const submitCourseEnquiry = (
    data: Omit<CourseEnquiry, 'id' | 'createdAt'>
  ): CourseEnquiry => {
    const newEnquiry: CourseEnquiry = {
      ...data,
      id: 'cenq_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCourseEnquiries((prev) => [newEnquiry, ...prev]);

    createCourseEnquiryInFirestore(data).catch((err) => {
      console.warn('Firestore course enquiry notice:', err);
    });

    showToast('success', 'Course Enquiry Submitted', 'Training advisor will follow up with syllabus and batch dates.');
    trackEvent('course_enquiry_submitted', { courseId: data.courseId });
    return newEnquiry;
  };

  const addApplicationNote = (applicationId: string, noteText: string) => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    const note = {
      id: 'note_' + Date.now(),
      author: currentUser?.name || 'Recruitment Team',
      text: trimmed,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? { ...app, internalNotes: [note, ...(app.internalNotes || [])] }
          : app
      )
    );

    const fbUser = firebaseAuth.currentUser;
    if (fbUser && fbUser.emailVerified) {
      const authorRole: 'employer' | 'recruitment_admin' | 'super_admin' =
        adminSession?.role === 'super_admin'
          ? 'super_admin'
          : adminSession?.role === 'recruitment_admin'
            ? 'recruitment_admin'
            : 'employer';
      addApplicationInternalNote({
        applicationId,
        authorUid: fbUser.uid,
        authorName: currentUser?.name || fbUser.email || 'Recruiter',
        authorRole,
        text: trimmed,
      }).catch((err) => console.warn('Firestore internal note notice:', err));
    }

    showToast('success', 'Internal Note Added', 'Private recruiter note saved (hidden from candidate).');
  };

  const exportCsvReport = (type: 'candidates' | 'employers' | 'jobs' | 'applications') => {
    if (!adminSession?.authorized || !adminSession.permissions?.canExportCsv) {
      showToast('error', 'Unauthorized', 'Verified Super Admin access is required to export system data.');
      return;
    }

    const { headers, rows } = mapDatasetToCsvRows(type, {
      candidates,
      employers: companies,
      jobs,
      applications,
    });

    const filename = buildSafeCsvFilename(type);
    const csvContent = serializeCsvDocument(headers, rows);
    triggerCsvBlobDownload(csvContent, filename);

    showToast('success', 'Report Exported', `Generated sanitized CSV report for ${type}.`);
    trackEvent('report_exported', { reportType: type });
  };

  // Notifications
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    if (firebaseAuth.currentUser?.emailVerified) {
      markUserNotificationReadInFirestore(firebaseAuth.currentUser.uid, notificationId).catch(() => {});
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('info', 'Notifications Updated', 'All notifications marked as read.');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('info', 'Notifications Cleared', 'All notifications have been removed.');
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const recordApplicationView = (applicationId: string) => {
    const targetApp = applications.find((a) => a.id === applicationId);
    if (!targetApp) return;

    const existingNotif = notifications.find(
      (n) =>
        n.userId === targetApp.candidateId &&
        n.title === 'Application Viewed' &&
        n.message.includes(targetApp.jobTitle)
    );
    if (existingNotif) return;

    const notif: NotificationItem = {
      id: 'notif-' + Date.now(),
      userId: targetApp.candidateId,
      targetRole: 'job_seeker',
      title: 'Application Viewed',
      message: `${targetApp.companyName} reviewed your application for "${targetApp.jobTitle}".`,
      type: 'application',
      timestamp: 'Just now',
      read: false,
      link: '/applications',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        currentCandidate,
        currentEmployer,
        adminSession,
        firebaseEmailVerified,
        users,
        candidates,
        companies,
        jobs,
        courses,
        applications,
        interviews,
        notifications,
        supportTickets,
        analyticsEvents,
        hiringEnquiries,
        courseEnquiries,
        savedJobIds,
        recentlyViewedJobIds,
        toasts,
        isGlobalLoading,
        globalLoadingMessage,
        startGlobalLoading,
        stopGlobalLoading,
        refreshAdminSession,
        loginWithEmail,
        sendPasswordReset,
        loginWithGoogle,
        loginWithFirebaseGooglePopup,
        registerJobSeeker,
        registerEmployer,
        logout,
        updateUserStatus,
        updateCurrentUser,
        deactivateCurrentUser,
        deleteCurrentUser,
        updateCandidateProfile,
        saveJob,
        unsaveJob,
        recordJobView,
        applyToJob,
        withdrawApplication,
        createJob,
        updateJob,
        deleteJob,
        updateJobStatus,
        createCourse,
        updateCourse,
        updateCourseStatus,
        deleteCourse,
        updateEmployerProfile,
        updateApplicationStatus,
        scheduleInterview,
        inviteCandidateToApply,
        verifyEmployer,
        moderateJob,
        sendCandidateReminder,
        submitSupportTicket,
        updateSupportTicketStatus,
        exportCsvReport,
        submitHiringEnquiry,
        updateHiringEnquiry,
        submitCourseEnquiry,
        addApplicationNote,
        trackEvent,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        deleteNotification,
        recordApplicationView,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
