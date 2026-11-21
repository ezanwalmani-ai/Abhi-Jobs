import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Application, ApplicationStatus } from '../../types';
import {
  AnimatedStatusBadge,
  AnimatedTextSwap,
  HeroTextReveal,
  EASE_PREMIUM,
} from '../../lib/motion';
import {
  ApplicationProgressTracker,
  normalizeApplicationStatus,
  NormalizedStage,
} from '../../components/applications/ApplicationProgressTracker';
import {
  Briefcase,
  Building2,
  Clock,
  CheckCircle2,
  ChevronRight,
  Search,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  MapPin,
  FileText,
  AlertCircle,
  Video,
  ExternalLink,
  Ban,
  Eye,
  Award,
  XCircle,
  X,
  UserCheck,
  ArrowUpRight,
  Calendar,
  Globe,
  Users,
  Phone,
  Check,
} from 'lucide-react';

interface JobSeekerApplicationsPageProps {
  navigate: (route: string) => void;
  initialSelectedAppId?: string;
}

type FilterKey =
  | 'All'
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Not Selected';

const FILTER_OPTIONS: Array<{ key: FilterKey; label: string }> = [
  { key: 'All', label: 'All' },
  { key: 'Applied', label: 'Applied' },
  { key: 'Under Review', label: 'Under Review' },
  { key: 'Shortlisted', label: 'Shortlisted' },
  { key: 'Interview Scheduled', label: 'Interview Scheduled' },
  { key: 'Selected', label: 'Selected' },
  { key: 'Not Selected', label: 'Not Selected' },
];

function matchesFilterKey(status: ApplicationStatus | string, filter: FilterKey): boolean {
  if (filter === 'All') return true;
  const stage = normalizeApplicationStatus(status);
  switch (filter) {
    case 'Applied':
      return stage === 'applied';
    case 'Under Review':
      return stage === 'under_review';
    case 'Shortlisted':
      return stage === 'shortlisted';
    case 'Interview Scheduled':
      return stage === 'interview_scheduled';
    case 'Selected':
      return stage === 'selected';
    case 'Not Selected':
      return stage === 'not_selected' || stage === 'withdrawn';
    default:
      return true;
  }
}

export const JobSeekerApplicationsPage: React.FC<JobSeekerApplicationsPageProps> = ({
  navigate,
  initialSelectedAppId,
}) => {
  const {
    currentUser,
    currentCandidate,
    applications,
    jobs,
    companies,
    interviews,
    withdrawApplication,
    showToast,
  } = useApp();

  // Page lifecycle state
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter, search & sort state
  const [filterStatus, setFilterStatus] = useState<FilterKey>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'company'>('newest');

  // Detail & withdrawal modal state
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [withdrawTargetApp, setWithdrawTargetApp] = useState<Application | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 220);
    return () => clearTimeout(timer);
  }, []);

  // Close active modal on Escape key
  useEffect(() => {
    if (!selectedApp && !withdrawTargetApp) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (withdrawTargetApp) {
          setWithdrawTargetApp(null);
          setWithdrawReason('');
        } else if (selectedApp) {
          setSelectedApp(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedApp, withdrawTargetApp]);

  // Strict ownership scoping: ONLY applications belonging to the authenticated candidate
  const myApplications = useMemo(() => {
    if (!currentUser) return [];
    return applications.filter((app) => {
      const matchesCandidateId = Boolean(currentCandidate && app.candidateId === currentCandidate.id);
      const matchesUserId = app.candidateId === currentUser.id;
      const matchesUserEmail = Boolean(
        currentUser.email && app.candidateEmail?.toLowerCase() === currentUser.email.toLowerCase()
      );
      return matchesCandidateId || matchesUserId || matchesUserEmail;
    });
  }, [applications, currentCandidate, currentUser]);

  // Open specific application if passed via route
  useEffect(() => {
    if (initialSelectedAppId && myApplications.length > 0) {
      const found = myApplications.find((a) => a.id === initialSelectedAppId);
      if (found) {
        setSelectedApp(found);
      }
    }
  }, [initialSelectedAppId, myApplications]);

  // Keep selectedApp synced with live updates from context
  useEffect(() => {
    if (!selectedApp) return;
    const updated = myApplications.find((a) => a.id === selectedApp.id);
    if (updated && updated !== selectedApp) {
      setSelectedApp(updated);
    }
  }, [myApplications, selectedApp]);

  // Real summary statistics computed strictly from candidate's actual applications
  const summaryStats = useMemo(() => {
    let underReview = 0;
    let shortlisted = 0;

    myApplications.forEach((app) => {
      const stage = normalizeApplicationStatus(app.status);
      if (stage === 'under_review') underReview += 1;
      if (stage === 'shortlisted') shortlisted += 1;
    });

    return {
      total: myApplications.length,
      underReview,
      shortlisted,
    };
  }, [myApplications]);

  // Live per-filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
      All: myApplications.length,
      Applied: 0,
      'Under Review': 0,
      Shortlisted: 0,
      'Interview Scheduled': 0,
      Selected: 0,
      'Not Selected': 0,
    };

    myApplications.forEach((app) => {
      const stage = normalizeApplicationStatus(app.status);
      if (stage === 'applied') counts.Applied += 1;
      else if (stage === 'under_review') counts['Under Review'] += 1;
      else if (stage === 'shortlisted') counts.Shortlisted += 1;
      else if (stage === 'interview_scheduled') counts['Interview Scheduled'] += 1;
      else if (stage === 'selected') counts.Selected += 1;
      else if (stage === 'not_selected' || stage === 'withdrawn') counts['Not Selected'] += 1;
    });

    return counts;
  }, [myApplications]);

  // Filtered and sorted applications
  const filteredApplications = useMemo(() => {
    let list = myApplications.filter((app) => matchesFilterKey(app.status, filterStatus));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((app) => {
        const matchedJob = jobs.find((j) => j.id === app.jobId);
        return (
          app.jobTitle.toLowerCase().includes(q) ||
          app.companyName.toLowerCase().includes(q) ||
          (matchedJob?.location && matchedJob.location.toLowerCase().includes(q)) ||
          (app.candidateLocation && app.candidateLocation.toLowerCase().includes(q))
        );
      });
    }

    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
      }
      return a.companyName.localeCompare(b.companyName);
    });

    return list;
  }, [myApplications, filterStatus, searchQuery, sortBy, jobs]);

  // Clean ABHI JOBS status visual config
  const getStatusVisual = (status: ApplicationStatus | string) => {
    const stage: NormalizedStage = normalizeApplicationStatus(status);
    switch (stage) {
      case 'applied':
        return {
          label: 'Applied',
          badgeClass: 'bg-[#102B4E]/[0.06] border-[#102B4E]/15 text-[#102B4E]',
          dotClass: 'bg-[#102B4E]',
          icon: Clock,
          description: 'Your application has been submitted and received by our recruitment team.',
        };
      case 'under_review':
        return {
          label: 'Under Review',
          badgeClass: 'bg-[#F47A24]/10 border-[#F47A24]/25 text-[#B45309]',
          dotClass: 'bg-[#F47A24]',
          icon: Eye,
          description: 'Our recruiters are currently reviewing your profile and qualifications.',
        };
      case 'shortlisted':
        return {
          label: 'Shortlisted',
          badgeClass: 'bg-[#102B4E] border-[#102B4E] text-white',
          dotClass: 'bg-[#F47A24]',
          icon: Award,
          description: 'You have been shortlisted for the next stage of the hiring process.',
        };
      case 'interview_scheduled':
        return {
          label: 'Interview Scheduled',
          badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          dotClass: 'bg-indigo-600',
          icon: Video,
          description: 'An interview has been scheduled. Check your interview details below.',
        };
      case 'selected':
        return {
          label: 'Selected',
          badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dotClass: 'bg-emerald-600',
          icon: CheckCircle2,
          description: 'Congratulations — you have been selected for this opportunity.',
        };
      case 'not_selected':
        return {
          label: 'Not Selected',
          badgeClass: 'bg-slate-100 border-slate-200 text-slate-600',
          dotClass: 'bg-slate-400',
          icon: XCircle,
          description: 'This application was not moved forward. Keep exploring other matching roles.',
        };
      case 'withdrawn':
        return {
          label: 'Withdrawn',
          badgeClass: 'bg-slate-100 border-slate-200 text-slate-600',
          dotClass: 'bg-slate-400',
          icon: Ban,
          description: 'You withdrew this application from consideration.',
        };
    }
  };

  const handleConfirmWithdraw = () => {
    if (!withdrawTargetApp) return;
    setIsWithdrawing(true);

    try {
      const success = withdrawApplication(
        withdrawTargetApp.id,
        withdrawReason.trim() || undefined
      );
      if (success) {
        if (selectedApp && selectedApp.id === withdrawTargetApp.id) {
          setSelectedApp({
            ...selectedApp,
            status: 'Withdrawn',
          });
        }
        setWithdrawTargetApp(null);
        setWithdrawReason('');
      }
    } catch {
      showToast('error', 'Withdrawal Failed', 'Could not withdraw application. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasError(false);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('info', 'Up to Date', 'Your application statuses are synchronized.');
    }, 350);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 280);
  };

  // Helper to resolve job, company, and interview details for an application
  const resolveApplicationContext = (app: Application) => {
    const matchedJob = jobs.find((j) => j.id === app.jobId);
    const matchedCompany = companies.find(
      (c) =>
        (matchedJob && c.id === matchedJob.employerId) ||
        c.companyName.toLowerCase() === app.companyName.toLowerCase()
    );
    const matchedInterview = interviews.find(
      (i) =>
        i.applicationId === app.id ||
        (i.candidateId === app.candidateId && i.jobId === app.jobId)
    );
    const isJobClosed =
      !matchedJob || matchedJob.status === 'closed' || matchedJob.status === 'archived';

    const locationDisplay = matchedJob?.location
      ? `${matchedJob.location}${matchedJob.workMode ? ` · ${matchedJob.workMode}` : ''}`
      : matchedCompany?.location || app.candidateLocation || '';

    const employmentTypeDisplay = matchedJob?.employmentType || '';

    const stage = normalizeApplicationStatus(app.status);
    const canWithdraw =
      stage !== 'withdrawn' && stage !== 'not_selected' && stage !== 'selected';

    return {
      matchedJob,
      matchedCompany,
      matchedInterview,
      isJobClosed,
      locationDisplay,
      employmentTypeDisplay,
      canWithdraw,
    };
  };

  // 1. Unauthenticated State
  if (!currentUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-[#F6F8FB]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_PREMIUM }}
          className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAF0] shadow-sm text-center space-y-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#102B4E]/5 border border-[#102B4E]/10 text-[#102B4E] flex items-center justify-center mx-auto">
            <UserCheck className="w-7 h-7 text-[#102B4E]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F47A24]/10 text-[#102B4E] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F47A24]" />
              <span>Candidate Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#102B4E] tracking-tight">
              Sign in to view your applications
            </h1>
            <p className="text-sm text-[#778397] leading-relaxed">
              Access your personal application tracker, real-time recruiter updates, and scheduled interviews securely.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <button
              onClick={() => navigate('/login')}
              className="w-full min-h-[44px] py-3 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-bold shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/register/job-seeker')}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#102B4E]/30 text-[#253449] text-sm font-semibold transition-all cursor-pointer"
            >
              Create Candidate Account
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs text-[#102B4E] hover:text-[#F47A24] font-semibold pt-1 transition-colors cursor-pointer"
            >
              Explore open jobs without signing in →
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Error State
  if (hasError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-[#F6F8FB]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_PREMIUM }}
          className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5EAF0] shadow-sm text-center space-y-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-[#102B4E]">
              Unable to load your applications
            </h2>
            <p className="text-sm text-[#778397]">
              Something interrupted the connection. Please try again.
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="w-full min-h-[44px] px-6 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  // 3. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7 animate-pulse">
          <div className="space-y-2.5 pb-6 border-b border-[#E5EAF0]">
            <div className="w-48 h-8 bg-slate-200/80 rounded-xl" />
            <div className="w-80 max-w-full h-4 bg-slate-200/70 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-2xl border border-[#E5EAF0] p-5"
              />
            ))}
          </div>

          <div className="h-14 bg-white rounded-2xl border border-[#E5EAF0]" />

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 bg-white rounded-2xl border border-[#E5EAF0] p-6"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        {/* 1. Page Introduction */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5EAF0]">
          <div className="space-y-1.5 min-w-0">
            <HeroTextReveal
              as="h1"
              text="My Applications"
              highlightWords={['Applications']}
              highlightClassName="text-[#F47A24]"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102B4E] tracking-tight"
              delay={0.04}
            />
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.14, ease: EASE_PREMIUM }}
              className="text-sm sm:text-base text-[#778397] max-w-2xl leading-relaxed"
            >
              Keep track of your job applications and stay updated on your career journey.
            </motion.p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#E5EAF0] bg-white hover:border-[#102B4E]/25 text-[#253449] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh applications"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 text-[#778397] ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>Explore Jobs</span>
            </button>
          </div>
        </header>

        {/* 2. Application Summary — Three Compact Cards (Real Database Values) */}
        <section
          aria-label="Application summary"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4"
        >
          {/* Card 1: Total Applications */}
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2, ease: EASE_PREMIUM }}
            onClick={() => setFilterStatus('All')}
            className={`group p-5 rounded-2xl border text-left transition-all cursor-pointer bg-white ${
              filterStatus === 'All'
                ? 'border-[#102B4E] ring-2 ring-[#102B4E]/10 shadow-xs'
                : 'border-[#E5EAF0] hover:border-[#102B4E]/30 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#778397]">Total Applications</span>
              <div className="w-8 h-8 rounded-xl bg-[#102B4E]/[0.06] text-[#102B4E] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#102B4E] tabular-nums">
                {summaryStats.total}
              </span>
              <span className="text-xs text-[#778397]">submitted</span>
            </div>
          </motion.button>

          {/* Card 2: Under Review */}
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2, ease: EASE_PREMIUM }}
            onClick={() => setFilterStatus('Under Review')}
            className={`group p-5 rounded-2xl border text-left transition-all cursor-pointer bg-white ${
              filterStatus === 'Under Review'
                ? 'border-[#F47A24] ring-2 ring-[#F47A24]/15 shadow-xs'
                : 'border-[#E5EAF0] hover:border-[#F47A24]/40 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#778397]">Under Review</span>
              <div className="w-8 h-8 rounded-xl bg-[#F47A24]/10 text-[#F47A24] flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#102B4E] tabular-nums">
                {summaryStats.underReview}
              </span>
              <span className="text-xs text-[#778397]">in screening</span>
            </div>
          </motion.button>

          {/* Card 3: Shortlisted */}
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2, ease: EASE_PREMIUM }}
            onClick={() => setFilterStatus('Shortlisted')}
            className={`group p-5 rounded-2xl border text-left transition-all cursor-pointer bg-white ${
              filterStatus === 'Shortlisted'
                ? 'border-[#102B4E] ring-2 ring-[#102B4E]/10 shadow-xs'
                : 'border-[#E5EAF0] hover:border-[#102B4E]/30 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#778397]">Shortlisted</span>
              <div className="w-8 h-8 rounded-xl bg-[#102B4E] text-white flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-[#F47A24]" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#102B4E] tabular-nums">
                {summaryStats.shortlisted}
              </span>
              <span className="text-xs text-[#778397]">next stage</span>
            </div>
          </motion.button>
        </section>

        {/* 3. Application Filters & Search Bar (Shown when candidate has applications) */}
        {myApplications.length > 0 && (
          <section
            aria-label="Filter applications"
            className="bg-white rounded-2xl border border-[#E5EAF0] p-4 shadow-2xs space-y-3.5"
          >
            {/* Status Filter Chips with Animated Selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {FILTER_OPTIONS.map((option) => {
                const isActive = filterStatus === option.key;
                const count = filterCounts[option.key];

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setFilterStatus(option.key)}
                    aria-pressed={isActive}
                    className={`relative min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'text-white'
                        : 'text-[#253449] hover:text-[#102B4E] hover:bg-[#F6F8FB]'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="applications-active-filter"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-[#102B4E] shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{option.label}</span>
                    {count > 0 && (
                      <span
                        className={`relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                          isActive
                            ? 'bg-[#F47A24] text-white'
                            : 'bg-[#F6F8FB] text-[#778397] border border-[#E5EAF0]'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Subtle Search + Sort Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2.5 border-t border-[#F0F3F7]">
              <div className="abhi-search-shell relative flex-1 rounded-xl">
                <Search className="w-4 h-4 text-[#778397] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by job title, company, or location..."
                  className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#F6F8FB] rounded-xl border border-[#E5EAF0] text-[#253449] focus:bg-white focus:outline-hidden focus:border-[#102B4E] transition-all placeholder:text-[#94A3B8] min-h-[44px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#778397] hover:text-[#102B4E] cursor-pointer rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="applications-sort" className="text-xs font-medium text-[#778397] hidden md:inline">
                  Sort:
                </label>
                <select
                  id="applications-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'company')}
                  className="w-full sm:w-auto px-3.5 py-2.5 text-xs sm:text-sm bg-[#F6F8FB] rounded-xl border border-[#E5EAF0] text-[#253449] font-medium focus:bg-white focus:outline-hidden focus:border-[#102B4E] cursor-pointer min-h-[44px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="company">Company (A–Z)</option>
                </select>
              </div>
            </div>

            {/* Active filter feedback bar */}
            {(filterStatus !== 'All' || searchQuery.trim() !== '') && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#778397]">
                <AnimatedTextSwap
                  stateKey={`${filteredApplications.length}-${myApplications.length}-${filterStatus}-${searchQuery}`}
                  className="inline-flex items-center font-medium text-[#253449]"
                >
                  Showing {filteredApplications.length} of {myApplications.length}{' '}
                  {myApplications.length === 1 ? 'application' : 'applications'}
                </AnimatedTextSwap>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('All');
                    setSearchQuery('');
                  }}
                  className="text-[#F47A24] hover:text-[#DE6816] font-semibold hover:underline cursor-pointer transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        )}

        {/* 4. Applications List or Empty States */}
        <section aria-label="Applications list" className="space-y-4">
          {myApplications.length === 0 ? (
            /* Empty State — Candidate has not applied to any jobs */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_PREMIUM }}
              className="bg-white rounded-3xl border border-[#E5EAF0] px-6 py-12 sm:py-16 text-center shadow-2xs"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#102B4E]/[0.05] border border-[#102B4E]/10 text-[#102B4E] mx-auto flex items-center justify-center mb-5">
                <Briefcase className="w-8 h-8 text-[#F47A24]" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#102B4E] tracking-tight">
                  No applications yet.
                </h2>
                <p className="text-sm text-[#778397] leading-relaxed">
                  Your next opportunity could be waiting. Explore available jobs and apply when you find the right match.
                </p>
              </div>

              <div className="mt-7 flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/jobs')}
                  className="min-h-[46px] px-7 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] active:scale-[0.98] text-white text-sm font-bold shadow-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore Jobs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : filteredApplications.length === 0 ? (
            /* Filtered Empty State */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_PREMIUM }}
              className="bg-white rounded-2xl border border-[#E5EAF0] p-10 text-center space-y-4 shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] text-[#778397] mx-auto flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-[#102B4E]">
                  No applications match this filter
                </h3>
                <p className="text-xs sm:text-sm text-[#778397] max-w-sm mx-auto">
                  Try selecting another status filter or clearing your search query.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('All');
                  setSearchQuery('');
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </motion.div>
          ) : (
            /* Populated Responsive Application Cards */
            <div className="space-y-4">
              {filteredApplications.map((app, index) => {
                const statusVisual = getStatusVisual(app.status);
                const StatusIcon = statusVisual.icon;
                const {
                  matchedJob,
                  matchedInterview,
                  isJobClosed,
                  locationDisplay,
                  employmentTypeDisplay,
                } = resolveApplicationContext(app);

                const latestTimeline =
                  app.timeline && app.timeline.length > 0
                    ? app.timeline[app.timeline.length - 1]
                    : null;
                const shortStatusNote = latestTimeline?.note || statusVisual.description;

                return (
                  <motion.article
                    key={app.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(index * 0.045, 0.25),
                      ease: EASE_PREMIUM,
                    }}
                    className="group bg-white rounded-2xl border border-[#E5EAF0] hover:border-[#102B4E]/25 hover:shadow-md transition-all duration-200 p-5 sm:p-6 shadow-2xs space-y-5"
                  >
                    {/* Top Row: Role & Company Info + Current Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <img
                          src={
                            app.companyLogo ||
                            matchedJob?.companyLogo ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              app.companyName
                            )}&backgroundColor=102B4E&textColor=ffffff`
                          }
                          alt={app.companyName}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover bg-[#F6F8FB] border border-[#E5EAF0] shrink-0"
                          referrerPolicy="no-referrer"
                        />

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-[#102B4E] group-hover:text-[#081D36] transition-colors truncate">
                              {app.jobTitle}
                            </h2>
                            {isJobClosed && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-[#E5EAF0] text-[#778397] text-[10px] font-semibold">
                                Closed
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-[#778397]">
                            <span className="font-semibold text-[#253449] inline-flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#778397] shrink-0" />
                              <span className="truncate">{app.companyName}</span>
                            </span>

                            {locationDisplay && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                                <span>{locationDisplay}</span>
                              </span>
                            )}

                            {employmentTypeDisplay && (
                              <span className="px-2 py-0.5 rounded-md bg-[#F6F8FB] border border-[#E5EAF0] text-[#253449] text-[11px] font-medium">
                                {employmentTypeDisplay}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge + Applied Date */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                        <AnimatedStatusBadge
                          statusKey={app.status}
                          label={statusVisual.label}
                          className={statusVisual.badgeClass}
                          dotClassName={statusVisual.dotClass}
                          icon={<StatusIcon className="w-3.5 h-3.5" />}
                        />
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#778397]">
                          <Calendar className="w-3 h-3 text-[#94A3B8] shrink-0" />
                          <span>Applied {app.appliedDate}</span>
                        </span>
                      </div>
                    </div>

                    {/* Short Status Description & Optional Interview Callout */}
                    <div className="space-y-2.5">
                      <p className="text-xs sm:text-sm text-[#253449]/85 leading-relaxed">
                        {shortStatusNote}
                      </p>

                      {matchedInterview && (
                        <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                              <Video className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#102B4E]">
                                {matchedInterview.type} Interview · {matchedInterview.status}
                              </div>
                              <div className="text-indigo-800">
                                {matchedInterview.date} at {matchedInterview.time}
                              </div>
                            </div>
                          </div>

                          {matchedInterview.meetingLink && (
                            <a
                              href={matchedInterview.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors shrink-0"
                            >
                              <span>Join Meeting</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 5. Compact Visual Progress Tracker */}
                    <div className="pt-4 border-t border-[#F0F3F7]">
                      <ApplicationProgressTracker
                        status={app.status}
                        timeline={app.timeline}
                        compact
                      />
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0F3F7]">
                      <span className="text-[11px] font-medium text-[#94A3B8]">
                        Ref #{app.id}
                      </span>

                      <div className="flex items-center gap-2">
                        {!isJobClosed && (
                          <button
                            type="button"
                            onClick={() => navigate(`/jobs/${app.jobId}`)}
                            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/30 hover:bg-[#F6F8FB] text-[#253449] text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Job</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#778397]" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] active:scale-[0.98] text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#F47A24]" />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ======================================================= */}
      {/* 6. APPLICATION DETAILS MODAL                            */}
      {/* ======================================================= */}
      <AnimatePresence>
        {selectedApp && (() => {
          const statusVisual = getStatusVisual(selectedApp.status);
          const StatusIcon = statusVisual.icon;
          const {
            matchedJob,
            matchedCompany,
            matchedInterview,
            isJobClosed,
            locationDisplay,
            employmentTypeDisplay,
            canWithdraw,
          } = resolveApplicationContext(selectedApp);

          return (
            <motion.div
              key="details-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedApp(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#081D36]/60 backdrop-blur-xs overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="application-details-title"
            >
              <motion.div
                key="details-modal"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.28, ease: EASE_PREMIUM }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E5EAF0] overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="px-5 sm:px-6 py-5 bg-[#102B4E] text-white flex items-start justify-between gap-4 shrink-0 border-b-2 border-[#F47A24]">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white/75">
                      <span>Application #{selectedApp.id}</span>
                      <span>•</span>
                      <span>Applied {selectedApp.appliedDate}</span>
                    </div>
                    <h2
                      id="application-details-title"
                      className="text-lg sm:text-xl font-extrabold tracking-tight truncate"
                    >
                      {selectedApp.jobTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/80 font-medium truncate">
                      {selectedApp.companyName}
                      {locationDisplay ? ` · ${locationDisplay}` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Close application details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-[#253449]">
                  {/* Current Status + Progress Tracker */}
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${statusVisual.badgeClass}`}
                    >
                      <StatusIcon className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-sm">
                          Current Status: {statusVisual.label}
                        </div>
                        <p className="text-xs opacity-90 leading-relaxed">
                          {statusVisual.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0]">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#778397] mb-3">
                        Application Progress
                      </div>
                      <ApplicationProgressTracker
                        status={selectedApp.status}
                        timeline={selectedApp.timeline}
                      />
                    </div>
                  </div>

                  {/* Interview Information (Only if applicable) */}
                  {matchedInterview && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#778397]">
                        Interview Information
                      </h3>
                      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-bold text-[#102B4E]">
                            {matchedInterview.type === 'Phone' ? (
                              <Phone className="w-4 h-4 text-indigo-600" />
                            ) : matchedInterview.type === 'In-person' ? (
                              <MapPin className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Video className="w-4 h-4 text-indigo-600" />
                            )}
                            <span>{matchedInterview.type} Interview</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700 text-[11px] font-semibold">
                            {matchedInterview.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <span className="text-[#778397]">Date &amp; Time</span>
                            <div className="font-semibold text-[#102B4E] mt-0.5">
                              {matchedInterview.date} at {matchedInterview.time}
                            </div>
                          </div>
                          {matchedInterview.location && (
                            <div>
                              <span className="text-[#778397]">Location</span>
                              <div className="font-semibold text-[#102B4E] mt-0.5">
                                {matchedInterview.location}
                              </div>
                            </div>
                          )}
                        </div>

                        {matchedInterview.notes && (
                          <p className="text-xs text-[#253449] bg-white/80 rounded-xl p-3 border border-indigo-100 leading-relaxed">
                            {matchedInterview.notes}
                          </p>
                        )}

                        {matchedInterview.meetingLink && (
                          <a
                            href={matchedInterview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span>Open Interview Link</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status History (Actual recorded timeline events) */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#778397]">
                      Status History
                    </h3>

                    <div className="p-4 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-4">
                      {selectedApp.timeline && selectedApp.timeline.length > 0 ? (
                        selectedApp.timeline.map((event, idx) => {
                          const isLatest = idx === selectedApp.timeline.length - 1;
                          return (
                            <div key={`${event.status}-${event.date}-${idx}`} className="flex items-start gap-3 relative">
                              {idx < selectedApp.timeline.length - 1 && (
                                <div className="absolute left-[9px] top-5 bottom-[-18px] w-0.5 bg-[#DCE3EC]" />
                              )}
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 mt-0.5 ${
                                  isLatest
                                    ? 'bg-[#F47A24] text-white'
                                    : 'bg-[#102B4E] text-white'
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-[#102B4E] text-xs sm:text-sm">
                                    {event.status}
                                  </span>
                                  <span className="text-[11px] text-[#778397]">
                                    {event.date}
                                  </span>
                                </div>
                                {event.note && (
                                  <p className="text-xs text-[#253449]/80 leading-relaxed">
                                    {event.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#102B4E] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#102B4E] text-xs sm:text-sm">
                              Application Submitted
                            </div>
                            <p className="text-xs text-[#778397]">
                              Submitted on {selectedApp.appliedDate}. Awaiting recruiter review.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Information */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#778397]">
                      Job Information
                    </h3>

                    <div className="p-4 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#778397]">Role Title</span>
                          <div className="font-semibold text-[#102B4E] mt-0.5">
                            {selectedApp.jobTitle}
                          </div>
                        </div>

                        <div>
                          <span className="text-[#778397]">Location</span>
                          <div className="font-semibold text-[#102B4E] mt-0.5">
                            {locationDisplay || 'Not specified'}
                          </div>
                        </div>

                        {employmentTypeDisplay && (
                          <div>
                            <span className="text-[#778397]">Employment Type</span>
                            <div className="font-semibold text-[#102B4E] mt-0.5">
                              {employmentTypeDisplay}
                            </div>
                          </div>
                        )}

                        {matchedJob?.experienceLevel && (
                          <div>
                            <span className="text-[#778397]">Experience Level</span>
                            <div className="font-semibold text-[#102B4E] mt-0.5">
                              {matchedJob.experienceLevel}
                            </div>
                          </div>
                        )}
                      </div>

                      {matchedJob?.overview && (
                        <div className="pt-2.5 border-t border-[#E5EAF0] space-y-1 text-xs">
                          <span className="text-[#778397] font-medium">Role Overview</span>
                          <p className="text-[#253449] leading-relaxed line-clamp-4">
                            {matchedJob.overview}
                          </p>
                        </div>
                      )}

                      {isJobClosed && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                          This job opening is no longer accepting new applications. Your application record remains preserved here.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#778397]">
                      Company Information
                    </h3>

                    <div className="p-4 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            selectedApp.companyLogo ||
                            matchedCompany?.logo ||
                            matchedJob?.companyLogo ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                              selectedApp.companyName
                            )}&backgroundColor=102B4E&textColor=ffffff`
                          }
                          alt={selectedApp.companyName}
                          className="w-10 h-10 rounded-xl object-cover bg-white border border-[#E5EAF0] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[#102B4E] text-sm truncate">
                            {selectedApp.companyName}
                          </div>
                          {matchedCompany?.industry && (
                            <div className="text-xs text-[#778397] truncate">
                              {matchedCompany.industry}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#778397]">
                        {matchedCompany?.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                            <span>{matchedCompany.location}</span>
                          </span>
                        )}
                        {matchedCompany?.companySize && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#94A3B8]" />
                            <span>{matchedCompany.companySize}</span>
                          </span>
                        )}
                        {matchedCompany?.website && (
                          <a
                            href={
                              matchedCompany.website.startsWith('http')
                                ? matchedCompany.website
                                : `https://${matchedCompany.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#102B4E] hover:text-[#F47A24] font-medium transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>

                      {matchedCompany?.about && (
                        <p className="text-xs text-[#253449]/85 leading-relaxed line-clamp-3 pt-1 border-t border-[#E5EAF0]">
                          {matchedCompany.about}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Application Submission Summary */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#778397]">
                      Your Submission
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-1">
                        <span className="text-[11px] font-semibold text-[#778397]">
                          Application Date
                        </span>
                        <div className="font-bold text-[#102B4E]">{selectedApp.appliedDate}</div>
                        <div className="text-[#778397] truncate">{selectedApp.candidateEmail}</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-1">
                        <span className="text-[11px] font-semibold text-[#778397]">
                          Attached Resume
                        </span>
                        <div className="font-bold text-[#102B4E] flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#F47A24] shrink-0" />
                          <span className="truncate">
                            {selectedApp.resumeName || 'Verified ABHI JOBS Profile'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedApp.coverNote && (
                      <div className="p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-1 text-xs">
                        <span className="text-[11px] font-semibold text-[#778397]">
                          Cover Note
                        </span>
                        <p className="text-[#253449] whitespace-pre-wrap leading-relaxed">
                          {selectedApp.coverNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-5 sm:px-6 py-4 bg-[#F6F8FB] border-t border-[#E5EAF0] flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E5EAF0] bg-white hover:border-[#102B4E]/30 text-[#253449] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {canWithdraw && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = selectedApp;
                          setSelectedApp(null);
                          setWithdrawTargetApp(target);
                        }}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Withdraw
                      </button>
                    )}

                    {!isJobClosed && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/jobs/${selectedApp.jobId}`);
                          setSelectedApp(null);
                        }}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>View Job Opening</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* WITHDRAW CONFIRMATION MODAL                             */}
      {/* ======================================================= */}
      <AnimatePresence>
        {withdrawTargetApp && (
          <motion.div
            key="withdraw-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setWithdrawTargetApp(null);
              setWithdrawReason('');
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081D36]/60 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-dialog-title"
          >
            <motion.div
              key="withdraw-modal"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.24, ease: EASE_PREMIUM }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#E5EAF0] space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h2
                  id="withdraw-dialog-title"
                  className="text-lg font-bold text-[#102B4E]"
                >
                  Withdraw Application?
                </h2>
                <p className="text-xs sm:text-sm text-[#778397] leading-relaxed">
                  Are you sure you want to withdraw your application for{' '}
                  <strong className="text-[#102B4E]">{withdrawTargetApp.jobTitle}</strong> at{' '}
                  <strong className="text-[#102B4E]">{withdrawTargetApp.companyName}</strong>?
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#253449]">
                  Reason for withdrawing (optional)
                </label>
                <textarea
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="E.g., Accepted another offer or no longer available."
                  rows={3}
                  className="w-full p-3 text-xs sm:text-sm bg-[#F6F8FB] rounded-xl border border-[#E5EAF0] text-[#253449] focus:bg-white focus:outline-hidden focus:border-[#102B4E]"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawTargetApp(null);
                    setWithdrawReason('');
                  }}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-[#E5EAF0] text-[#253449] text-xs sm:text-sm font-semibold hover:bg-[#F6F8FB] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobSeekerApplicationsPage;
