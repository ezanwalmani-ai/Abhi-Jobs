import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Application, ApplicationStatus } from '../../types';
import {
  Briefcase,
  Building2,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter,
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
  ThumbsUp,
  XCircle,
  X,
  UserCheck,
  Sparkles,
  ArrowUpRight,
  Info,
  Calendar,
} from 'lucide-react';

interface JobSeekerApplicationsPageProps {
  navigate: (route: string) => void;
  initialSelectedAppId?: string;
}

export const JobSeekerApplicationsPage: React.FC<JobSeekerApplicationsPageProps> = ({
  navigate,
  initialSelectedAppId,
}) => {
  const {
    currentUser,
    currentRole,
    currentCandidate,
    applications,
    jobs,
    interviews,
    withdrawApplication,
    showToast,
  } = useApp();

  // Page Lifecycle State (Loading & Error states)
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'match' | 'company'>('newest');

  // Modal / Detail state
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [withdrawTargetApp, setWithdrawTargetApp] = useState<Application | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Initial load simulation with error safety
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Authenticated candidate application scoping
  // ONLY applications belonging to the currently authenticated Job Seeker
  const myApplications = useMemo(() => {
    if (!currentUser) return [];
    return applications.filter((app) => {
      // Strict ownership check: match candidate profile id, user id, or user email
      const matchesCandidateId = currentCandidate && app.candidateId === currentCandidate.id;
      const matchesUserId = app.candidateId === currentUser.id;
      const matchesUserEmail =
        currentUser?.email && app.candidateEmail?.toLowerCase() === currentUser.email.toLowerCase();
      return matchesCandidateId || matchesUserId || matchesUserEmail;
    });
  }, [applications, currentCandidate, currentUser]);

  // If route provided an initialSelectedAppId, select that application
  useEffect(() => {
    if (initialSelectedAppId && myApplications.length > 0) {
      const found = myApplications.find((a) => a.id === initialSelectedAppId);
      if (found) {
        setSelectedApp(found);
      }
    }
  }, [initialSelectedAppId, myApplications]);

  // Synchronize selectedApp with updated applications (e.g. after status change or withdrawal)
  useEffect(() => {
    if (selectedApp) {
      const updated = myApplications.find((a) => a.id === selectedApp.id);
      if (updated) {
        setSelectedApp(updated);
      }
    }
  }, [myApplications, selectedApp]);

  // Calculate real summary statistics from actual user records ONLY
  const stats = useMemo(() => {
    const total = myApplications.length;

    const inReview = myApplications.filter((a) => {
      const s = a.status.toLowerCase().replace(/\s+/g, '_');
      return s === 'under_review' || s === 'review';
    }).length;

    const shortlisted = myApplications.filter((a) => {
      const s = a.status.toLowerCase().replace(/\s+/g, '_');
      return s === 'shortlisted';
    }).length;

    const interview = myApplications.filter((a) => {
      const s = a.status.toLowerCase().replace(/\s+/g, '_');
      return s === 'interview' || s === 'interview_scheduled';
    }).length;

    const selected = myApplications.filter((a) => {
      const s = a.status.toLowerCase().replace(/\s+/g, '_');
      return s === 'selected' || s === 'hired';
    }).length;

    return { total, inReview, shortlisted, interview, selected };
  }, [myApplications]);

  // Filter and sort the applications list
  const filteredApplications = useMemo(() => {
    let list = [...myApplications];

    // Status filter
    if (filterStatus !== 'All') {
      list = list.filter((a) => {
        const normStatus = a.status.toLowerCase().replace(/\s+/g, '_');
        const normFilter = filterStatus.toLowerCase().replace(/\s+/g, '_');
        return normStatus === normFilter;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.jobTitle.toLowerCase().includes(q) ||
          a.companyName.toLowerCase().includes(q) ||
          (a.candidateLocation && a.candidateLocation.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
      }
      if (sortBy === 'match') {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      if (sortBy === 'company') {
        return a.companyName.localeCompare(b.companyName);
      }
      return 0;
    });

    return list;
  }, [myApplications, filterStatus, searchQuery, sortBy]);

  // Status visual mapping with high-contrast text and icons
  const getStatusConfig = (status: ApplicationStatus | string) => {
    const norm = (status || '').toLowerCase().replace(/\s+/g, '_');
    switch (norm) {
      case 'applied':
        return {
          label: 'Applied',
          badgeBg: 'bg-blue-50 border-blue-200 text-blue-800',
          dotBg: 'bg-blue-500',
          icon: Clock,
          summaryNote: 'Application submitted and received by employer',
        };
      case 'under_review':
        return {
          label: 'Under Review',
          badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
          dotBg: 'bg-amber-500',
          icon: Eye,
          summaryNote: 'Employer is screening your application and qualifications',
        };
      case 'shortlisted':
        return {
          label: 'Shortlisted',
          badgeBg: 'bg-teal-50 border-teal-200 text-[#004D40]',
          dotBg: 'bg-[#FF2B1A]',
          icon: ThumbsUp,
          summaryNote: 'Your profile has been shortlisted for next hiring stages',
        };
      case 'interview':
      case 'interview_scheduled':
        return {
          label: 'Interview',
          badgeBg: 'bg-purple-50 border-purple-200 text-purple-800',
          dotBg: 'bg-purple-500',
          icon: Video,
          summaryNote: 'An interview has been scheduled with the hiring team',
        };
      case 'selected':
      case 'hired':
        return {
          label: 'Selected',
          badgeBg: 'bg-[#004D40] border-teal-800 text-white',
          dotBg: 'bg-white',
          icon: CheckCircle2,
          summaryNote: 'Congratulations! You have been selected for this position',
        };
      case 'rejected':
        return {
          label: 'Archived / Not Selected',
          badgeBg: 'bg-slate-100 border-slate-200 text-slate-700',
          dotBg: 'bg-slate-400',
          icon: XCircle,
          summaryNote: 'Application archived or position filled by employer',
        };
      case 'withdrawn':
        return {
          label: 'Withdrawn',
          badgeBg: 'bg-slate-100 border-slate-300 text-slate-600',
          dotBg: 'bg-slate-400',
          icon: Ban,
          summaryNote: 'You withdrew this application',
        };
      default:
        return {
          label: status,
          badgeBg: 'bg-slate-50 border-slate-200 text-slate-700',
          dotBg: 'bg-slate-400',
          icon: Clock,
          summaryNote: 'Application status update',
        };
    }
  };

  // Safe handler for withdrawal
  const handleConfirmWithdraw = () => {
    if (!withdrawTargetApp) return;
    setIsWithdrawing(true);

    try {
      const success = withdrawApplication(withdrawTargetApp.id, withdrawReason.trim() || undefined);
      if (success) {
        setWithdrawTargetApp(null);
        setWithdrawReason('');
        // Also update selectedApp modal if currently viewing it
        if (selectedApp && selectedApp.id === withdrawTargetApp.id) {
          const refreshed = myApplications.find((a) => a.id === withdrawTargetApp.id);
          if (refreshed) {
            setSelectedApp({ ...refreshed, status: 'Withdrawn' as ApplicationStatus });
          }
        }
      }
    } catch {
      showToast('error', 'Withdrawal Failed', 'Could not withdraw application. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Safe refresh simulation with synchronization
  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasError(false);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('info', 'Applications Refreshed', 'Your application records are up to date.');
    }, 400);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // 1. Render unauthenticated state if user is not signed in
  if (!currentUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-[#004D40] flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8 text-[#004D40]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-[#004D40] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Job Seeker Authentication Required</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Sign In to Access Your Applications</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Please sign in with your ABHI JOBS Job Seeker account to view your live applications, recruiter reviews, and scheduled interviews.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
            <div className="font-semibold text-slate-800">Your Personal Career Area:</div>
            <p>
              Applications on ABHI JOBS are strictly confidential and only visible to you and the verified employer you applied to.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full min-h-[44px] py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In as Job Seeker</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/register/job-seeker')}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Create a Free Job Seeker Account</span>
            </button>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs text-[#004D40] hover:text-[#FF2B1A] font-semibold pt-1 cursor-pointer"
            >
              Browse Open Jobs Without Signing In →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Error State if error occurred
  if (hasError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              We couldn't load your applications right now.
            </h2>
            <p className="text-sm text-slate-600">Please try again.</p>
          </div>

          <button
            onClick={handleRetry}
            className="w-full min-h-[44px] px-6 py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 3. Render Skeleton Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="space-y-3 pb-2 border-b border-slate-200">
            <div className="w-32 h-6 bg-slate-200 rounded-full" />
            <div className="w-64 h-8 bg-slate-200 rounded-xl" />
            <div className="w-96 max-w-full h-4 bg-slate-200 rounded" />
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 p-4 space-y-3" />
            ))}
          </div>

          {/* List Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200 p-6" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-[#004D40] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#004D40] shrink-0" />
              <span>ABHI JOBS Career Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Applications
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Track the opportunities you've applied for and stay updated on your application progress.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh application records"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => navigate('/jobs')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>Find Jobs</span>
            </button>
          </div>
        </div>

        {/* Application Summary Cards (Real Records Only) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          
          {/* Total Applications */}
          <button
            onClick={() => setFilterStatus('All')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'All'
                ? 'bg-white border-[#004D40] shadow-xs ring-2 ring-teal-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Applications</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">All submitted roles</div>
          </button>

          {/* Under Review */}
          <button
            onClick={() => setFilterStatus('Under Review')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'Under Review'
                ? 'bg-white border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700">In Review</span>
              <Eye className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
              {stats.inReview}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Screening in progress</div>
          </button>

          {/* Shortlisted */}
          <button
            onClick={() => setFilterStatus('Shortlisted')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'Shortlisted'
                ? 'bg-white border-[#004D40] shadow-xs ring-2 ring-teal-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#004D40]">Shortlisted</span>
              <Award className="w-4 h-4 text-[#004D40]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#004D40] mt-2">
              {stats.shortlisted}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Recommended for next step</div>
          </button>

          {/* Interviews */}
          <button
            onClick={() => setFilterStatus('Interview')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'Interview'
                ? 'bg-white border-purple-500 shadow-xs ring-2 ring-purple-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700">Interviews</span>
              <Video className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-2">
              {stats.interview}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Scheduled or conducted</div>
          </button>

          {/* Selected / Hired */}
          <button
            onClick={() => setFilterStatus('Selected')}
            className={`col-span-2 sm:col-span-1 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'Selected'
                ? 'bg-white border-[#004D40] shadow-xs ring-2 ring-teal-600/20'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#004D40]">Selected</span>
              <CheckCircle2 className="w-4 h-4 text-[#004D40]" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#004D40] mt-2">
              {stats.selected}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Offers and selections</div>
          </button>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            
            {/* Search input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applications by job title, company, or location..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#061226] transition-all placeholder:text-slate-400 min-h-[44px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:inline" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-auto px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium focus:bg-white focus:outline-hidden focus:border-[#061226] cursor-pointer min-h-[44px]"
              >
                <option value="All">All Statuses ({stats.total})</option>
                <option value="Applied">Applied</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Archived / Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden lg:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full md:w-auto px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium focus:bg-white focus:outline-hidden focus:border-[#061226] cursor-pointer min-h-[44px]"
              >
                <option value="newest">Newest Applied First</option>
                <option value="oldest">Oldest Applied First</option>
                <option value="match">Highest Skill Match</option>
                <option value="company">Company Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Active Filter Pill */}
          {(filterStatus !== 'All' || searchQuery) && (
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
              <span>Showing {filteredApplications.length} of {myApplications.length} applications</span>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => {
                  setFilterStatus('All');
                  setSearchQuery('');
                }}
                className="text-[#004D40] font-semibold hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Application List Container */}
        <div className="space-y-4">
          
          {/* Empty State: Zero applications submitted overall */}
          {myApplications.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-14 text-center space-y-6 shadow-2xs">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-50 border border-teal-100 text-[#004D40] mx-auto flex items-center justify-center">
                <Briefcase className="w-8 h-8 sm:w-10 sm:h-10 text-[#004D40]" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  You haven't applied to any jobs yet.
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Explore available opportunities and submit your first application.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/jobs')}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Find Jobs</span>
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>Complete My Profile</span>
                </button>
              </div>

              <div className="max-w-lg mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-left">
                <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#004D40]" />
                  <span>How ABHI JOBS 1-Click Apply Works:</span>
                </div>
                <p className="leading-relaxed">
                  When you submit an application from any published job opening on ABHI JOBS, your verified credentials and skills are directly delivered to the recruiter. You can return to this page anytime to check real-time evaluation updates and interview schedules.
                </p>
              </div>
            </div>
          ) : filteredApplications.length === 0 ? (
            /* Empty State: Filters returned 0 matches */
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-2xs">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">No matching applications found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't find any applications matching "{searchQuery}" with status "{filterStatus}".
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('All');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset Search &amp; Filters
              </button>
            </div>
          ) : (
            /* Populated Application Cards */
            filteredApplications.map((app) => {
              const statusCfg = getStatusConfig(app.status) || getStatusConfig('applied');
              const StatusIcon = statusCfg?.icon || Clock;

              // Check if matching job still exists in public registry
              const matchedJob = jobs.find((j) => j.id === app.jobId);
              const isJobClosedOrMissing =
                !matchedJob || matchedJob.status === 'closed' || matchedJob.status === 'archived';

              // Check for scheduled interview on this application
              const matchedInterview = interviews.find(
                (i) => i.applicationId === app.id || (i.candidateId === app.candidateId && i.jobId === app.jobId)
              );

              // Latest timeline entry
              const latestTimeline =
                app.timeline && app.timeline.length > 0 ? app.timeline[app.timeline.length - 1] : null;

              // Can this application be withdrawn?
              const canWithdraw =
                app.status !== 'Withdrawn' &&
                app.status !== 'Rejected' &&
                app.status !== 'Selected' &&
                app.status !== ('hired' as any);

              // Location and employment type fallbacks
              const locationDisplay =
                matchedJob?.location
                  ? `${matchedJob.location}${matchedJob.workMode ? ` (${matchedJob.workMode})` : ''}`
                  : app.candidateLocation
                  ? app.candidateLocation
                  : 'Not available';

              const employmentTypeDisplay = matchedJob?.employmentType || 'Not available';

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:shadow-sm transition-all space-y-4"
                >
                  {/* Top Row: Company & Job Overview + Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Company Avatar / Logo */}
                      <img
                        src={
                          app.companyLogo ||
                          matchedJob?.companyLogo ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                            app.companyName
                          )}&backgroundColor=062e22`
                        }
                        alt={app.companyName}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                            {app.jobTitle}
                          </h2>
                          {isJobClosedOrMissing && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                              Posting Closed
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{app.companyName}</span>
                          </span>

                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{locationDisplay}</span>
                          </span>

                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                            {employmentTypeDisplay}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge + Score */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                      {app.matchScore && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#004D40] border border-teal-200">
                          <Sparkles className="w-3 h-3 text-[#004D40]" />
                          <span>{app.matchScore}% Match</span>
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.badgeBg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotBg}`} />
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Metadata Row: Application Date + Resume + Timeline note */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                    {/* Left details */}
                    <div className="space-y-1.5 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Applied on <strong className="text-slate-700">{app.appliedDate}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Resume:{' '}
                          <span className="text-slate-700 font-medium">
                            {app.resumeName || 'Verified Profile Resume'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Right details: Latest timeline status note */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-slate-600 flex items-start gap-2">
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800">
                          {latestTimeline ? latestTimeline.status : app.status}:
                        </span>{' '}
                        <span>{latestTimeline?.note || statusCfg.summaryNote}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Interview Banner (if present) */}
                  {matchedInterview && (
                    <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold">
                            {matchedInterview.type} Interview Scheduled
                          </div>
                          <div className="text-purple-700">
                            {matchedInterview.date} at {matchedInterview.time}
                          </div>
                        </div>
                      </div>

                      {matchedInterview.meetingLink && (
                        <a
                          href={matchedInterview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-purple-700 text-white font-semibold flex items-center gap-1.5 self-start sm:self-auto hover:bg-purple-800 transition-colors"
                        >
                          <span>Join Meeting</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-400 font-mono">
                      Ref ID: #{app.id}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View Application Details Modal */}
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Details</span>
                      </button>

                      {/* View Job Link */}
                      {!isJobClosedOrMissing ? (
                        <button
                          onClick={() => navigate(`/jobs/${app.jobId}`)}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>View Job</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ) : (
                        <span className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-xs font-medium inline-flex items-center">
                          Job Closed
                        </span>
                      )}

                      {/* Withdraw Application (if applicable) */}
                      {canWithdraw && (
                        <button
                          onClick={() => setWithdrawTargetApp(app)}
                          className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* 1. APPLICATION DETAILS MODAL                            */}
      {/* ======================================================= */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 sm:py-5 bg-[#061226] text-white flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-xs text-teal-200 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Confidential Job Seeker Record</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold truncate">{selectedApp.jobTitle}</h2>
                <p className="text-xs text-slate-300">
                  {selectedApp.companyName} • Applied on {selectedApp.appliedDate}
                </p>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 rounded-full hover:bg-white/10 text-teal-200 hover:text-white transition-colors cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
              
              {/* Current Status Banner */}
              {(() => {
                const cfg = getStatusConfig(selectedApp.status) || getStatusConfig('applied');
                const Icon = cfg?.icon || Clock;
                return (
                  <div className={`p-4 rounded-2xl border flex items-start gap-3 ${cfg.badgeBg}`}>
                    <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-sm">Status: {cfg.label}</div>
                      <p className="text-xs opacity-90 leading-relaxed">{cfg.summaryNote}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Progress Timeline (ONLY real recorded events) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Application Timeline
                </h3>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  {selectedApp.timeline && selectedApp.timeline.length > 0 ? (
                    selectedApp.timeline.map((event, idx) => (
                      <div key={idx} className="flex items-start gap-3 relative">
                        {idx < selectedApp.timeline.length - 1 && (
                          <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-slate-200" />
                        )}
                        <div className="w-5 h-5 rounded-full bg-[#004D40] text-white flex items-center justify-center shrink-0 text-[10px] font-bold z-10">
                          ✓
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold text-slate-800 text-xs sm:text-sm">
                            {event.status}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {event.date} {event.note ? `— ${event.note}` : ''}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">
                      Application submitted on {selectedApp.appliedDate}. Awaiting employer review.
                    </div>
                  )}
                </div>
              </div>

              {/* Job Information Section (if job exists in registry) */}
              {(() => {
                const matchedJob = jobs.find((j) => j.id === selectedApp.jobId);
                const isClosed = !matchedJob || matchedJob.status === 'closed' || matchedJob.status === 'archived';

                return (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Job Details
                    </h3>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium">Location:</span>
                          <div className="font-semibold text-slate-800 mt-0.5">
                            {matchedJob?.location
                              ? `${matchedJob.location} (${matchedJob.workMode || 'Standard'})`
                              : 'Not available'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Employment Type:</span>
                          <div className="font-semibold text-slate-800 mt-0.5">
                            {matchedJob?.employmentType || 'Not available'}
                          </div>
                        </div>
                      </div>

                      {matchedJob?.description && (
                        <div className="pt-2 border-t border-slate-200/80 text-xs space-y-1">
                          <span className="text-slate-400 font-medium">Role Overview:</span>
                          <p className="text-slate-700 leading-relaxed line-clamp-4">
                            {matchedJob.description}
                          </p>
                        </div>
                      )}

                      {isClosed && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                          <strong>Note:</strong> This job posting is no longer active or has closed. Your application history and submitted materials are preserved here.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Candidate Submission Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Submitted Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold">Applicant Name</span>
                    <div className="font-bold text-slate-800">{selectedApp.candidateName}</div>
                    <div className="text-xs text-slate-500">{selectedApp.candidateEmail}</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold">Resume Document</span>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#004D40] shrink-0" />
                      <span className="truncate">{selectedApp.resumeName || 'Verified ABHI JOBS Profile'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Attached to application</div>
                  </div>
                </div>

                {selectedApp.coverNote && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold">Cover Note / Message</span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedApp.coverNote}
                    </p>
                  </div>
                )}
              </div>

              {/* Matched Skills */}
              {selectedApp.candidateSkills && selectedApp.candidateSkills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Highlighted Candidate Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.candidateSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setSelectedApp(null)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-white transition-colors cursor-pointer"
              >
                Close Details
              </button>

              <div className="flex items-center gap-2">
                {selectedApp.status !== 'Withdrawn' &&
                  selectedApp.status !== 'Rejected' &&
                  selectedApp.status !== 'Selected' && (
                    <button
                      onClick={() => {
                        const target = selectedApp;
                        setSelectedApp(null);
                        setWithdrawTargetApp(target);
                      }}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Withdraw Application
                    </button>
                  )}

                {(() => {
                  const matchedJob = jobs.find((j) => j.id === selectedApp.jobId);
                  const isClosed = !matchedJob || matchedJob.status === 'closed' || matchedJob.status === 'archived';

                  if (isClosed) return null;

                  return (
                    <button
                      onClick={() => {
                        navigate(`/jobs/${selectedApp.jobId}`);
                        setSelectedApp(null);
                      }}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>View Full Job Opening</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 2. WITHDRAW CONFIRMATION MODAL                          */}
      {/* ======================================================= */}
      {withdrawTargetApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Withdraw Application?</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Are you sure you want to withdraw your application for{' '}
                <strong className="text-slate-900">"{withdrawTargetApp.jobTitle}"</strong> at{' '}
                <strong className="text-slate-900">{withdrawTargetApp.companyName}</strong>?
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Reason for withdrawing (optional):
              </label>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="E.g., Accepted another offer, relocation, or no longer available."
                rows={3}
                className="w-full p-3 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>Please Note:</strong> Withdrawing will notify the employer and remove your candidacy from this role's active hiring pipeline.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setWithdrawTargetApp(null);
                  setWithdrawReason('');
                }}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={isWithdrawing}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSeekerApplicationsPage;
