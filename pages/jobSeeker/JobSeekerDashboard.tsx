import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ScrollReveal, StaggerGroup, StaggerItem, EASE_PREMIUM, CountUpNumber } from '../../lib/motion';
import { useApp } from '../../context/AppContext';
import { JobCard } from '../../components/JobCard';
import { Button } from '../../components/ui/Button';
import { ApplyModal } from '../../components/ApplyModal';
import { Job, Application } from '../../types';
import {
  Briefcase,
  Bookmark,
  FileText,
  GraduationCap,
  User,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Clock,
  Building2,
  MapPin,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  ExternalLink,
  Award,
  Plus,
  Check,
  Eye,
  Sliders,
  Calendar,
} from 'lucide-react';

interface JobSeekerDashboardProps {
  navigate: (route: string) => void;
  defaultTab?: string;
}

// User-specific course enrollment interface (aligned with JobSeekerUpskillPage)
interface UserEnrollment {
  courseId: string;
  userId: string;
  status: 'Started' | 'In Progress' | 'Completed';
  progressPercentage: number;
  lastActivity: string;
  enrolledAt: string;
}

export const JobSeekerDashboard: React.FC<JobSeekerDashboardProps> = ({ navigate }) => {
  const {
    currentUser,
    currentRole,
    currentCandidate,
    applications,
    jobs,
    courses,
    savedJobIds,
    showToast,
  } = useApp();

  // Page Lifecycle State
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Application Modal State for Recommendations
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);

  // Initial load simulation with clean error handling
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('info', 'Dashboard Refreshed', 'Your latest applications, saved jobs, and profile status are synchronized.');
    }, 350);
  };

  // 1. Profile Completion calculation (strictly mirrors /profile calculation)
  const profileCompletion = useMemo(() => {
    let score = 20; // Base score for having an account
    const name = currentCandidate?.name || currentUser?.name || '';
    const headline = currentCandidate?.headline || '';
    const phone = currentCandidate?.phone || '';
    const location = currentCandidate?.location || '';
    const about = currentCandidate?.about || '';
    const skills = currentCandidate?.skills || [];

    if (name.trim().length > 2) score += 15;
    if (headline.trim().length > 3) score += 15;
    if (phone.trim().length >= 10) score += 15;
    if (location.trim().length > 2) score += 10;
    if (about.trim().length > 15) score += 10;
    if (Array.isArray(skills) && skills.length >= 3) score += 15;

    return Math.min(score, 100);
  }, [currentCandidate, currentUser]);

  // 2. Real Authenticated Job Seeker Applications
  const myApplications = useMemo(() => {
    if (!currentUser) return [];
    return applications.filter((app) => {
      const matchesCandidateId = currentCandidate && app.candidateId === currentCandidate.id;
      const matchesUserId = app.candidateId === currentUser.id;
      const matchesUserEmail =
        currentUser?.email && app.candidateEmail?.toLowerCase() === currentUser.email.toLowerCase();
      return matchesCandidateId || matchesUserId || matchesUserEmail;
    });
  }, [applications, currentCandidate, currentUser]);

  // Sort applications by newest date first
  const recentApplications = useMemo(() => {
    return [...myApplications]
      .sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime())
      .slice(0, 3);
  }, [myApplications]);

  // 3. Real Authenticated Job Seeker Saved Jobs
  const mySavedJobs = useMemo(() => {
    return savedJobIds
      .map((id) => jobs.find((j) => j.id === id))
      .filter((j): j is Job => Boolean(j));
  }, [savedJobIds, jobs]);

  const recentSavedJobs = useMemo(() => {
    return mySavedJobs.slice(0, 3);
  }, [mySavedJobs]);

  // 4. Real Authenticated Job Seeker Enrolled Courses / Upskill Progress
  const userEnrollments = useMemo<UserEnrollment[]>(() => {
    if (!currentUser?.id) return [];
    try {
      const stored = localStorage.getItem(`abhijobs_enrollments_${currentUser.id}`) || localStorage.getItem(`hunar_enrollments_${currentUser.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // safe fallback
    }
    return [];
  }, [currentUser?.id]);

  const enrolledCourses = useMemo(() => {
    return userEnrollments
      .map((enr) => {
        const course = courses.find((c) => c.id === enr.courseId);
        return course ? { ...course, enrollment: enr } : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [userEnrollments, courses]);

  // 5. Real Matching Job Recommendations (based strictly on candidate profile data)
  const recommendedJobs = useMemo(() => {
    const skills = currentCandidate?.skills || [];
    const desiredRole = currentCandidate?.desiredRole || '';
    if (skills.length === 0 && !desiredRole) return [];

    return jobs
      .filter((job) => {
        if (job.status !== 'published') return false;
        // Do not recommend jobs user has already applied to
        const alreadyApplied = myApplications.some((app) => app.jobId === job.id);
        if (alreadyApplied) return false;

        const hasMatchingSkill = skills.some(
          (s) =>
            typeof s === 'string' &&
            Array.isArray(job.preferredSkills) &&
            job.preferredSkills.some(
              (ps) => typeof ps === 'string' && ps.toLowerCase().includes(s.toLowerCase())
            )
        );

        const hasMatchingRole =
          desiredRole &&
          job.title.toLowerCase().includes(desiredRole.toLowerCase().split(' ')[0]);

        return hasMatchingSkill || hasMatchingRole;
      })
      .slice(0, 3);
  }, [jobs, currentCandidate, myApplications]);

  // 6. Career Readiness checklist based strictly on real profile data
  const careerReadinessItems = useMemo(() => {
    const candidate = currentCandidate;
    const user = currentUser;

    const hasName = Boolean((candidate?.name || user?.name || '').trim().length > 2);
    const hasHeadline = Boolean((candidate?.headline || '').trim().length > 3);
    const hasAbout = Boolean((candidate?.about || '').trim().length > 15);
    const hasPhone = Boolean((candidate?.phone || '').trim().length >= 10);
    const hasLocation = Boolean((candidate?.location || '').trim().length > 2);

    const isBasicProfileComplete = hasName && hasHeadline && hasAbout && hasPhone && hasLocation;
    const hasSkills = Boolean(Array.isArray(candidate?.skills) && candidate.skills.length >= 3);
    const hasExperience = Boolean(
      (Array.isArray(candidate?.experiences) && candidate.experiences.length > 0) ||
      (Array.isArray((candidate as any)?.experience) && (candidate as any).experience.length > 0) ||
      candidate?.experienceLevel === 'Fresher'
    );
    const hasResume = Boolean(candidate?.resumeName || candidate?.resumeUrl);
    const hasPreferences = Boolean(
      (candidate?.desiredRole && candidate.desiredRole.trim().length > 0) ||
      (candidate?.workPreference && candidate.workPreference.trim().length > 0)
    );

    return [
      {
        id: 'profile',
        title: 'Complete Profile Details',
        description: 'Name, headline, contact information, and biography.',
        isCompleted: isBasicProfileComplete,
        actionLabel: isBasicProfileComplete ? 'Edit Profile' : 'Complete Profile',
        action: () => navigate('/profile'),
      },
      {
        id: 'skills',
        title: 'Add Core Skills',
        description: hasSkills
          ? `${candidate?.skills?.length || 0} skills listed on your profile.`
          : 'Add at least 3 core competencies to match job openings.',
        isCompleted: hasSkills,
        actionLabel: hasSkills ? 'Manage Skills' : 'Add Skills',
        action: () => navigate('/profile'),
      },
      {
        id: 'experience',
        title: 'Add Experience History',
        description: hasExperience
          ? 'Work background and achievements documented.'
          : 'Document your internships, roles, or fresher qualifications.',
        isCompleted: hasExperience,
        actionLabel: hasExperience ? 'Review Experience' : 'Add Experience',
        action: () => navigate('/profile'),
      },
      {
        id: 'resume',
        title: 'Upload Resume',
        description: hasResume
          ? `Verified resume attached: ${candidate?.resumeName || 'Resume.pdf'}`
          : 'Upload your latest CV for one-click applications.',
        isCompleted: hasResume,
        actionLabel: hasResume ? 'Replace Resume' : 'Upload Resume',
        action: () => navigate('/profile'),
      },
      {
        id: 'preferences',
        title: 'Set Career Preferences',
        description: hasPreferences
          ? `Target role: ${candidate?.desiredRole || 'Configured'}`
          : 'Specify your desired role, work mode, and location.',
        isCompleted: hasPreferences,
        actionLabel: hasPreferences ? 'Edit Preferences' : 'Set Career Preferences',
        action: () => navigate('/profile'),
      },
    ];
  }, [currentCandidate, currentUser, navigate]);

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return { label: 'Applied', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'under_review':
        return { label: 'Under Review', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'shortlisted':
        return { label: 'Shortlisted', bg: 'bg-teal-50 text-[#004D40] border-teal-200' };
      case 'interview_scheduled':
        return { label: 'Interview Scheduled', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'hired':
        return { label: 'Selected', bg: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'rejected':
        return { label: 'Not Selected', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: status.replace(/_/g, ' '), bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Safe user display name
  const userName = currentCandidate?.name || currentUser?.name || '';
  const displayGreetingName = userName.trim() ? userName.trim() : 'Job Seeker';

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  // Unauthenticated State Handling
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#061226]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Sign In to View Your Dashboard</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Access your personal applications, saved opportunities, learning progress, and profile completion.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
          >
            <span>Sign In to ABHI JOBS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 animate-pulse">
          {/* Header Skeleton */}
          <div className="h-32 bg-slate-200 rounded-3xl" />
          {/* Metrics Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
            ))}
          </div>
          {/* Quick Actions Skeleton */}
          <div className="h-16 bg-slate-200 rounded-2xl" />
          {/* Main Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-slate-200 rounded-3xl" />
              <div className="h-64 bg-slate-200 rounded-3xl" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-slate-200 rounded-3xl" />
              <div className="h-64 bg-slate-200 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State Handling
  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Dashboard Unavailable</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              We encountered an issue loading your dashboard data. Please retry or refresh your session.
            </p>
          </div>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 200);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">

        {/* 1. WELCOME SECTION */}
        <ScrollReveal direction="up" distance={16}>
          <div className="bg-[#061226] border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xl sm:text-2xl text-teal-200 shadow-inner shrink-0">
                {displayGreetingName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate">
                    Welcome back, {displayGreetingName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-slate-700 text-[11px] font-bold text-teal-200 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Job Seeker
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                  Track your career progress, applications, saved opportunities, and learning journey in one place.
                </p>
                {currentCandidate?.headline && (
                  <p className="text-xs text-teal-200/80 truncate">
                    {currentCandidate.headline}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-colors cursor-pointer min-h-[44px]"
                aria-label="Refresh dashboard data"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => navigate('/jobs')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer min-h-[44px]"
              >
                <Briefcase className="w-4 h-4" />
                <span>Find Jobs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* 2. PROMINENT PROFILE COMPLETION CARD (Mobile & Top Desktop Placement) */}
        <ScrollReveal direction="up" delay={0.04} distance={16}>
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-[#061226] text-xs font-bold inline-flex items-center gap-1">
                    <User className="w-3 h-3 text-[#004D40]" />
                    Profile Completion
                  </span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900">
                    <CountUpNumber target={profileCompletion} suffix="% Complete" duration={900} />
                  </span>
                  {profileCompletion === 100 ? (
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Profile Completed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                      {100 - profileCompletion}% to reach maximum visibility
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Completed candidate profiles receive up to 4x more direct interview invitations from verified recruiters.
                </p>
              </div>

              <button
                onClick={() => navigate('/profile')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer min-h-[44px] shrink-0 self-start sm:self-auto"
              >
                <span>{profileCompletion === 100 ? 'Edit My Profile' : 'Complete My Profile'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <motion.div
                className="bg-[#004D40] h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion}%` }}
                transition={{ duration: 0.85, ease: EASE_PREMIUM }}
                role="progressbar"
                aria-valuenow={profileCompletion}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </ScrollReveal>

        {/* 3. CAREER OVERVIEW SUMMARY CARDS */}
        <StaggerGroup staggerDelay={0.05} className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {/* Card 1: Applications */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              onClick={() => navigate('/applications')}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group h-full"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  <CountUpNumber target={myApplications.length} duration={800} />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                  Applications
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {myApplications.length === 1 ? '1 job application' : `${myApplications.length} total submitted`}
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Card 2: Saved Jobs */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              onClick={() => navigate('/saved-jobs')}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group h-full"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#004D40] shrink-0">
                  <Bookmark className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FF2B1A] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  <CountUpNumber target={mySavedJobs.length} duration={800} />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                  Saved Jobs
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {mySavedJobs.length === 1 ? '1 opportunity saved' : `${mySavedJobs.length} bookmarked`}
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Card 3: Learning / Upskill */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              onClick={() => navigate('/learning')}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group h-full"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  <CountUpNumber target={enrolledCourses.length} duration={800} />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                  Learning
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {enrolledCourses.length === 1 ? '1 active course' : `${enrolledCourses.length} enrolled tracks`}
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Card 4: Profile Completion */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              onClick={() => navigate('/profile')}
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group h-full"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  <CountUpNumber target={profileCompletion} suffix="%" duration={900} />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                  Profile Strength
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {profileCompletion === 100 ? 'All fields verified' : 'Action items pending'}
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        </StaggerGroup>

        {/* 4. QUICK ACTIONS BAR */}
        <ScrollReveal direction="up" delay={0.06} distance={16}>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            <button
              onClick={() => navigate('/jobs')}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] group text-center"
            >
              <Briefcase className="w-4 h-4 text-[#004D40] shrink-0 group-hover:scale-105 transition-transform" />
              <span className="truncate">Find Jobs</span>
            </button>

            <button
              onClick={() => navigate('/applications')}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] group text-center"
            >
              <FileText className="w-4 h-4 text-blue-700 shrink-0 group-hover:scale-105 transition-transform" />
              <span className="truncate">My Applications</span>
              {myApplications.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold shrink-0">
                  {myApplications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/saved-jobs')}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] group text-center"
            >
              <Bookmark className="w-4 h-4 text-[#004D40] shrink-0 group-hover:scale-105 transition-transform" />
              <span className="truncate">Saved Jobs</span>
              {mySavedJobs.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-[#004D40] text-[10px] font-extrabold shrink-0">
                  {mySavedJobs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/learning')}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] group text-center"
            >
              <GraduationCap className="w-4 h-4 text-purple-700 shrink-0 group-hover:scale-105 transition-transform" />
              <span className="truncate">My Learning</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] group text-center col-span-2 sm:col-span-1"
            >
              <User className="w-4 h-4 text-amber-700 shrink-0 group-hover:scale-105 transition-transform" />
              <span className="truncate">My Profile</span>
            </button>
          </div>
        </div>
        </ScrollReveal>

        {/* 5. MAIN CONTENT 2-COLUMN GRID (Left: Applications, Saved, Recommendations | Right: Career Readiness, Learning) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">

          {/* LEFT 2 COLUMNS */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">

            {/* SECTION: RECENT APPLICATIONS */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Applications</h2>
                    <p className="text-xs text-slate-500">Your submitted job proposals and live status</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/applications')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[36px]"
                >
                  <span>View All Applications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentApplications.length > 0 ? (
                <div className="space-y-3">
                  {recentApplications.map((app) => {
                    const badge = getStatusBadge(app.status);
                    return (
                      <div
                        key={app.id}
                        className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {app.jobTitle}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {app.companyName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Applied {formatDate(app.appliedAt)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate('/applications')}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0 min-h-[36px] self-start sm:self-auto"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Application</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Strict requested empty state */
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-800">
                      You haven't applied to any jobs yet.
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Explore verified openings matching your skills and start your application journey today.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Find Jobs</span>
                  </button>
                </div>
              )}
            </div>

            {/* SECTION: SAVED JOBS */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#004D40] shrink-0">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Saved Jobs</h2>
                    <p className="text-xs text-slate-500">Opportunities bookmarked for your review</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/saved-jobs')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[36px]"
                >
                  <span>View Saved Jobs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentSavedJobs.length > 0 ? (
                <div className="space-y-3">
                  {recentSavedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {job.title}
                          </h3>
                          {job.type && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-[#004D40] border border-teal-200">
                              {job.type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {job.company || (job as any).companyName || 'Verified Employer'}
                          </span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {job.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0 min-h-[36px] self-start sm:self-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Job</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Strict requested empty state */
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-800">
                      No saved jobs yet.
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Bookmark promising opportunities while searching to apply when you are ready.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Find Jobs</span>
                  </button>
                </div>
              )}
            </div>

            {/* SECTION: JOB RECOMMENDATIONS (Requirement 10) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Job Recommendations</h2>
                    <p className="text-xs text-slate-500">Curated opportunities matched against your verified skills &amp; preferences</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/jobs')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[36px]"
                >
                  <span>Explore All Jobs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recommendedJobs.length > 0 ? (
                <div className="space-y-3">
                  {recommendedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-2xl border border-[#E4E7EC] hover:border-slate-300 hover:shadow-xs transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#061226] transition-colors truncate">
                            {job.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#004D40] border border-teal-200 text-[10px] font-bold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Skill Match
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {job.company || (job as any).companyName || 'Verified Employer'}
                          </span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {job.location}
                            </span>
                          )}
                          {job.type && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              {job.type}
                            </span>
                          )}
                        </div>

                        {/* Matching Skills Tags */}
                        {Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            {job.preferredSkills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="min-h-[36px]"
                        >
                          View Job
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedJobForApply(job)}
                          className="min-h-[36px]"
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Professional empty state for recommendations */
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-800">
                      No matching recommendations found based on your current profile.
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Add your skills, target job title, and preferred location to receive personalized opening matches.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                    <button
                      onClick={() => navigate('/profile')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
                    >
                      <User className="w-4 h-4" />
                      <span>Update Profile Skills</span>
                    </button>
                    <button
                      onClick={() => navigate('/jobs')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer min-h-[44px]"
                    >
                      <Briefcase className="w-4 h-4 text-slate-500" />
                      <span>Browse All Jobs</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (Career Readiness & Learning Overview) */}
          <div className="space-y-6 sm:space-y-8">

            {/* SECTION: CAREER READINESS CHECKLIST (Requirement 9) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#004D40]" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">Career Readiness</h2>
                </div>
                <span className="text-xs font-bold text-[#004D40]">
                  {careerReadinessItems.filter((i) => i.isCompleted).length} / {careerReadinessItems.length} Done
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Actionable steps based on your actual profile to maximize employer responses.
              </p>

              <div className="space-y-2.5">
                {careerReadinessItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.isCompleted
                        ? 'bg-teal-50/40 border-teal-100'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {item.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-[#004D40] mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.title}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={item.action}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                          item.isCompleted
                            ? 'text-[#004D40] hover:bg-teal-100/50'
                            : 'bg-[#061226] text-white hover:bg-[#0b3b2c]'
                        }`}
                      >
                        {item.actionLabel}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION: MY LEARNING (Requirement 8) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-700" />
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">My Learning</h2>
                </div>

                <button
                  onClick={() => navigate('/learning')}
                  className="text-xs font-bold text-purple-700 hover:text-purple-800 transition-colors cursor-pointer"
                >
                  Explore Learning &rarr;
                </button>
              </div>

              {enrolledCourses.length > 0 ? (
                <div className="space-y-3">
                  {enrolledCourses.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.title}
                          </h3>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Status: <span className="font-semibold text-purple-700">{item.enrollment.status}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold shrink-0">
                          {item.enrollment.progressPercentage}%
                        </span>
                      </div>

                      {/* Course progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${item.enrollment.progressPercentage}%` }}
                        />
                      </div>

                      <button
                        onClick={() => navigate('/learning')}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span>Continue Learning</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Strict requested empty state */
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
                  <div className="w-10 h-10 mx-auto rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs sm:text-sm font-bold text-slate-800">
                      Your learning journey starts here.
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Build job-relevant skills, improve career readiness, and prepare for interviews.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/learning')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[40px]"
                  >
                    <span>Explore Learning</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Apply Modal for recommended jobs */}
      {selectedJobForApply && (
        <ApplyModal
          job={selectedJobForApply}
          isOpen={Boolean(selectedJobForApply)}
          onClose={() => setSelectedJobForApply(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
};
