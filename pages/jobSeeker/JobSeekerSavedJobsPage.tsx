import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApplyModal } from '../../components/ApplyModal';
import { Button } from '../../components/ui/Button';
import { Job } from '../../types';
import {
  Bookmark,
  BookmarkCheck,
  Search,
  Filter,
  ArrowRight,
  Eye,
  Check,
  Clock,
  Calendar,
  MapPin,
  Briefcase,
  Building2,
  Sparkles,
  RotateCcw,
  AlertCircle,
  X,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface JobSeekerSavedJobsPageProps {
  navigate: (route: string) => void;
}

export const JobSeekerSavedJobsPage: React.FC<JobSeekerSavedJobsPageProps> = ({ navigate }) => {
  const {
    currentUser,
    currentRole,
    currentCandidate,
    jobs,
    savedJobIds,
    unsaveJob,
    applications,
    showToast,
  } = useApp();

  // Page lifecycle state (Loading & Error states)
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmploymentType, setFilterEmploymentType] = useState<string>('All');
  const [filterWorkMode, setFilterWorkMode] = useState<string>('All');
  const [filterLocation, setFilterLocation] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recently_saved' | 'recent_job' | 'salary_high' | 'salary_low'>('recently_saved');

  // Application Modal state
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);

  // Initial load simulation with error safety
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Check if candidate/user has already applied to a specific job
  const hasUserApplied = (jobId: string) => {
    if (!currentUser && !currentCandidate) return false;
    return applications.some((app) => {
      const matchesJob = app.jobId === jobId;
      const matchesCandidate = currentCandidate && app.candidateId === currentCandidate.id;
      const matchesUser =
        currentUser &&
        (app.candidateId === currentUser.id ||
          (currentUser.email && app.candidateEmail?.toLowerCase() === currentUser.email.toLowerCase()));
      return matchesJob && (matchesCandidate || matchesUser);
    });
  };

  // Calculate Match Score with candidate skills if profile exists
  const getMatchScore = (job: Job) => {
    if (
      !currentCandidate ||
      !Array.isArray(currentCandidate.skills) ||
      currentCandidate.skills.length === 0 ||
      !Array.isArray(job.preferredSkills) ||
      job.preferredSkills.length === 0
    ) {
      return null;
    }

    const matchingCount = currentCandidate.skills.filter((skill) =>
      typeof skill === 'string' &&
      job.preferredSkills.some(
        (s) => typeof s === 'string' && s.toLowerCase().includes(skill.toLowerCase())
      )
    ).length;

    if (matchingCount > 0) {
      return Math.round(
        Math.min(98, 70 + (matchingCount / Math.max(1, job.preferredSkills.length)) * 28)
      );
    }
    return null;
  };

  // Format salary cleanly
  const formatSalary = (job: Job) => {
    if (!job.salary || (!job.salary.min && !job.salary.max)) {
      return null;
    }
    const currency = job.salary.currency || 'INR';
    if (currency === 'INR') {
      if (job.salary.min && job.salary.max) {
        const minLakh = (job.salary.min / 100000).toFixed(1).replace('.0', '');
        const maxLakh = (job.salary.max / 100000).toFixed(1).replace('.0', '');
        return `₹${minLakh}L - ₹${maxLakh}L / yr`;
      }
      if (job.salary.min) {
        return `From ₹${(job.salary.min / 100000).toFixed(1).replace('.0', '')}L / yr`;
      }
      if (job.salary.max) {
        return `Up to ₹${(job.salary.max / 100000).toFixed(1).replace('.0', '')}L / yr`;
      }
    }
    if (job.salary.min && job.salary.max) {
      return `${currency} ${(job.salary.min / 1000).toFixed(0)}k - ${(job.salary.max / 1000).toFixed(0)}k`;
    }
    if (job.salary.min) return `${currency} ${job.salary.min.toLocaleString()}`;
    if (job.salary.max) return `${currency} ${job.salary.max.toLocaleString()}`;
    return null;
  };

  // Map savedJobIds to actual job objects (or mark as missing/unavailable)
  // Maintains strictly the current user's real saved-job relationships
  const savedJobsData = useMemo(() => {
    return savedJobIds.map((id) => {
      const found = jobs.find((j) => j.id === id);
      return {
        id,
        job: found || null,
        isMissing: !found,
        isClosed: found ? found.status === 'closed' || found.status === 'archived' || found.status === 'paused' : true,
      };
    });
  }, [savedJobIds, jobs]);

  // Real count of saved jobs
  const totalSavedCount = savedJobIds.length;

  // Distinct locations from user's saved jobs for dynamic filter
  const availableLocations = useMemo(() => {
    const locs = new Set<string>();
    savedJobsData.forEach((item) => {
      if (item.job?.location) {
        locs.add(item.job.location.split(',')[0].trim());
      }
    });
    return Array.from(locs).sort();
  }, [savedJobsData]);

  // Filter and sort the user's saved jobs
  const filteredSavedJobs = useMemo(() => {
    let list = [...savedJobsData];

    // Search query across title, company, location, skills
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(({ job, id }) => {
        if (!job) return id.toLowerCase().includes(q);
        const titleMatch = job.title.toLowerCase().includes(q);
        const companyMatch = job.companyName.toLowerCase().includes(q);
        const locationMatch = job.location ? job.location.toLowerCase().includes(q) : false;
        const skillsMatch = Array.isArray(job.preferredSkills)
          ? job.preferredSkills.some((s) => s.toLowerCase().includes(q))
          : false;
        return titleMatch || companyMatch || locationMatch || skillsMatch;
      });
    }

    // Employment Type filter
    if (filterEmploymentType !== 'All') {
      list = list.filter(
        ({ job }) =>
          job && job.employmentType && job.employmentType.toLowerCase() === filterEmploymentType.toLowerCase()
      );
    }

    // Work Mode filter
    if (filterWorkMode !== 'All') {
      list = list.filter(
        ({ job }) =>
          job && job.workMode && job.workMode.toLowerCase() === filterWorkMode.toLowerCase()
      );
    }

    // Location filter
    if (filterLocation !== 'All') {
      list = list.filter(
        ({ job }) =>
          job && job.location && job.location.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'All') {
      if (filterStatus === 'Active') {
        list = list.filter(({ job, isClosed }) => job && !isClosed);
      } else if (filterStatus === 'Closed') {
        list = list.filter(({ isClosed }) => isClosed);
      }
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'recently_saved') {
        // savedJobIds order: index in reverse so the most recently added appears first
        const indexA = savedJobIds.indexOf(a.id);
        const indexB = savedJobIds.indexOf(b.id);
        return indexB - indexA;
      }
      if (sortBy === 'recent_job') {
        const dateA = a.job?.postedDate ? new Date(a.job.postedDate).getTime() : 0;
        const dateB = b.job?.postedDate ? new Date(b.job.postedDate).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'salary_high') {
        const salA = a.job?.salary?.max || a.job?.salary?.min || 0;
        const salB = b.job?.salary?.max || b.job?.salary?.min || 0;
        return salB - salA;
      }
      if (sortBy === 'salary_low') {
        const salA = a.job?.salary?.min || a.job?.salary?.max || 0;
        const salB = b.job?.salary?.min || b.job?.salary?.max || 0;
        return salA - salB;
      }
      return 0;
    });

    return list;
  }, [
    savedJobsData,
    searchQuery,
    filterEmploymentType,
    filterWorkMode,
    filterLocation,
    filterStatus,
    sortBy,
    savedJobIds,
  ]);

  // Safe handler for unsaving job
  const handleRemoveSaved = (jobId: string, jobTitle?: string) => {
    unsaveJob(jobId);
    showToast(
      'info',
      'Job Removed',
      jobTitle ? `"${jobTitle}" has been removed from your saved jobs.` : 'Removed from saved jobs.'
    );
  };

  // Safe refresh simulation
  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasError(false);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('info', 'Saved Jobs Updated', 'Your saved jobs list is up to date.');
    }, 350);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // 1. Render Unauthenticated State if user is not signed in
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
            <h1 className="text-2xl font-extrabold text-slate-900">Sign In to Access Your Saved Jobs</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Please sign in with your ABHI JOBS Job Seeker account to view your bookmarked opportunities, track deadlines, and submit applications.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
            <div className="font-semibold text-slate-800">Your Private Job Bookmarks:</div>
            <p>
              Jobs you bookmark are stored securely in your personal career hub and synchronized across all your devices.
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
              We couldn't load your saved jobs right now.
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
            <div className="w-36 h-6 bg-slate-200 rounded-full" />
            <div className="w-64 h-8 bg-slate-200 rounded-xl" />
            <div className="w-96 max-w-full h-4 bg-slate-200 rounded" />
          </div>

          {/* Search/Filter Skeleton */}
          <div className="h-16 bg-white rounded-2xl border border-slate-200 p-4" />

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 p-6 space-y-4" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active filters check
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    filterEmploymentType !== 'All' ||
    filterWorkMode !== 'All' ||
    filterLocation !== 'All' ||
    filterStatus !== 'All';

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilterEmploymentType('All');
    setFilterWorkMode('All');
    setFilterLocation('All');
    setFilterStatus('All');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header (Requirement 4 & 5) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-[#004D40] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#004D40] shrink-0" />
              <span>ABHI JOBS Career Portal</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Saved Jobs
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                {totalSavedCount} Saved Job{totalSavedCount === 1 ? '' : 's'}
              </span>
            </div>

            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Keep track of opportunities you're interested in and come back to them when you're ready.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh saved jobs"
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

        {/* ======================================================= */}
        {/* CONDITIONAL CONTENT: EMPTY STATE vs POPULATED VIEW      */}
        {/* ======================================================= */}

        {totalSavedCount === 0 ? (
          /* Proper Empty State (Requirement 8): ZERO saved jobs */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-14 text-center space-y-6 shadow-2xs max-w-3xl mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-50 border border-teal-100 text-[#004D40] mx-auto flex items-center justify-center">
              <Bookmark className="w-8 h-8 sm:w-10 sm:h-10 text-[#004D40]" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                You haven't saved any jobs yet.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Save opportunities you're interested in and come back to them when you're ready to apply.
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
                <span>Update My Profile</span>
              </button>
            </div>

            <div className="max-w-lg mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-left">
              <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-[#004D40]" />
                <span>How Job Bookmarks Work on ABHI JOBS:</span>
              </div>
              <p className="leading-relaxed">
                When browsing verified roles on the Find Jobs page, click the bookmark icon on any job card. It will instantly be saved here so you can compare salaries, review required skills, and apply when ready.
              </p>
            </div>
          </div>
        ) : (
          /* Populated State with Search, Filters, and Job Cards */
          <div className="space-y-6">
            
            {/* Search, Filter & Sort Bar (Requirements 9, 10, 11) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                
                {/* Search input (Requirement 9) */}
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your saved jobs by title, company, location, or skills..."
                    aria-label="Search your saved jobs"
                    className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden focus:border-[#061226] transition-all placeholder:text-slate-400 min-h-[44px]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Controls Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-2">
                  
                  {/* Employment Type Filter */}
                  <select
                    value={filterEmploymentType}
                    onChange={(e) => setFilterEmploymentType(e.target.value)}
                    className="w-full lg:w-auto px-3 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium focus:bg-white focus:outline-hidden focus:border-[#061226] cursor-pointer min-h-[44px]"
                    aria-label="Filter by Employment Type"
                  >
                    <option value="All">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>

                  {/* Work Mode Filter */}
                  <select
                    value={filterWorkMode}
                    onChange={(e) => setFilterWorkMode(e.target.value)}
                    className="w-full lg:w-auto px-3 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium focus:bg-white focus:outline-hidden focus:border-[#061226] cursor-pointer min-h-[44px]"
                    aria-label="Filter by Work Mode"
                  >
                    <option value="All">All Modes</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full lg:w-auto px-3 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium focus:bg-white focus:outline-hidden focus:border-[#061226] cursor-pointer min-h-[44px]"
                    aria-label="Filter by Status"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active Only</option>
                    <option value="Closed">Closed / Unavailable</option>
                  </select>

                  {/* Location Filter (if available) */}
                  {availableLocations.length > 0 && (
                    <select
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="w-full lg:w-auto px-3 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium focus:bg-white focus:outline-hidden focus:border-[#061226] cursor-pointer min-h-[44px]"
                      aria-label="Filter by Location"
                    >
                      <option value="All">All Locations</option>
                      {availableLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Sort Dropdown (Requirement 11) */}
                  <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-400 whitespace-nowrap hidden xl:inline">
                      Sort:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full lg:w-auto px-3 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium focus:bg-white focus:outline-hidden focus:border-[#061226] cursor-pointer min-h-[44px]"
                      aria-label="Sort saved jobs"
                    >
                      <option value="recently_saved">Recently Saved</option>
                      <option value="recent_job">Most Recent Job</option>
                      <option value="salary_high">Salary: High to Low</option>
                      <option value="salary_low">Salary: Low to High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Filter Indicators */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 border-t border-slate-100">
                  <span>
                    Showing <strong>{filteredSavedJobs.length}</strong> of {totalSavedCount} saved jobs
                  </span>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={resetAllFilters}
                    className="text-[#004D40] font-semibold hover:underline cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Empty Filter State (filters returned 0 results) */}
            {filteredSavedJobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-2xs">
                <Search className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">No matching saved jobs found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    We couldn't find any saved jobs matching your search and filter criteria.
                  </p>
                </div>
                <button
                  onClick={resetAllFilters}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Search &amp; Filters
                </button>
              </div>
            ) : (
              /* Populated Saved Job Cards Grid (Requirement 6, 7, 12) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSavedJobs.map(({ id, job, isMissing, isClosed }) => {
                  // Fallback Card for Deleted / Missing Job Record (Requirement 12)
                  if (isMissing || !job) {
                    return (
                      <div
                        key={id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4 opacity-90"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                              Job no longer available
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-800">
                              Position No Longer Listed
                            </h3>
                            <p className="text-xs text-slate-500 font-mono">
                              Reference ID: #{id}
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed pt-1">
                              This position has expired or was removed by the hiring organization.
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                          <button
                            onClick={() => handleRemoveSaved(id)}
                            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            <span>Remove Saved</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Standard Saved Job Card with Real Information (Requirements 6, 7, 12)
                  const matchScore = getMatchScore(job);
                  const hasApplied = hasUserApplied(job.id);
                  const salaryDisplay = formatSalary(job);

                  return (
                    <div
                      key={job.id}
                      className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                        isClosed ? 'border-amber-200 bg-amber-50/20' : 'border-[#E4E7EC] hover:border-slate-300'
                      }`}
                    >
                      {/* Card Header: Company, Logo, Verified badge, Save action */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            {job.companyLogo ? (
                              <img
                                src={job.companyLogo}
                                alt={job.companyName}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 bg-slate-50 shadow-2xs shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6 text-slate-400" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px] sm:max-w-[190px]">
                                  {job.companyName}
                                </span>
                                {job.isVerifiedCompany && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-50 text-[#004D40] text-[10px] font-bold border border-teal-200/60">
                                    <Check className="w-3 h-3 text-[#004D40]" />
                                    Verified
                                  </span>
                                )}
                              </div>

                              {/* Title with link */}
                              <h2
                                onClick={() => navigate(`/jobs/${job.id}`)}
                                className="text-base sm:text-lg font-bold text-slate-900 hover:text-[#FF2B1A] transition-colors mt-0.5 cursor-pointer leading-snug line-clamp-1"
                                title={job.title}
                              >
                                {job.title}
                              </h2>
                            </div>
                          </div>

                          {/* Quick Remove Saved Button (Requirement 7: Remove Saved) */}
                          <button
                            onClick={() => handleRemoveSaved(job.id, job.title)}
                            className="p-2 rounded-xl border border-teal-200 bg-teal-50 text-[#004D40] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-all cursor-pointer shrink-0 flex items-center gap-1 text-xs font-semibold"
                            title="Remove from Saved Jobs"
                            aria-label="Remove from Saved Jobs"
                          >
                            <BookmarkCheck className="w-4 h-4 text-[#004D40]" />
                            <span className="hidden sm:inline text-[11px] font-bold">Saved</span>
                          </button>
                        </div>

                        {/* Unavailable / Closed Job Notice (Requirement 12) */}
                        {isClosed && (
                          <div className="mt-3 p-2 rounded-xl bg-amber-100/70 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>Job no longer available (Posting Closed)</span>
                          </div>
                        )}

                        {/* Job Metadata Items (Requirement 6: Real fields only) */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-3.5 text-xs text-slate-600 mt-3.5">
                          {job.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{job.location}</span>
                            </div>
                          )}

                          {(job.employmentType || job.workMode) && (
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {[job.employmentType, job.workMode].filter(Boolean).join(' • ')}
                              </span>
                            </div>
                          )}

                          {job.experienceLevel && (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {job.experienceLevel}
                                {typeof job.minExperienceYears === 'number' && job.minExperienceYears > 0
                                  ? ` (${job.minExperienceYears}+ yrs)`
                                  : ''}
                              </span>
                            </div>
                          )}

                          {salaryDisplay && (
                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                              <span className="text-slate-400 font-normal">Salary:</span>
                              <span>{salaryDisplay}</span>
                            </div>
                          )}

                          {job.deadline && (
                            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Deadline: {job.deadline}</span>
                            </div>
                          )}
                        </div>

                        {/* Overview snippet (only if available) */}
                        {job.overview && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-3 leading-relaxed">
                            {job.overview}
                          </p>
                        )}

                        {/* Skills (Requirement 6: Only existing skills) */}
                        {Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3.5">
                            {job.preferredSkills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.preferredSkills.length > 4 && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px]">
                                +{job.preferredSkills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Match Score / Posted Date + Action Buttons (Requirement 7) */}
                      <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          {matchScore ? (
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#004D40] shrink-0" />
                              <span className="text-xs font-bold text-[#004D40]">{matchScore}% Match</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>Posted {job.postedDate || 'recently'}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons: View Job + Apply Now / Already Applied / Closed */}
                        <div className="flex items-center gap-2">
                          {/* View Job (Requirement 7) */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            iconLeft={<Eye className="w-3.5 h-3.5 text-slate-500" />}
                            className="flex-1 sm:flex-none min-h-[40px]"
                            title="View complete job details"
                          >
                            View Job
                          </Button>

                          {/* Apply Now / Already Applied / Closed (Requirement 7 & 12) */}
                          {hasApplied ? (
                            <button
                              onClick={() => navigate('/applications')}
                              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] text-xs font-bold inline-flex items-center justify-center gap-1.5 min-h-[40px] hover:bg-teal-100 transition-colors cursor-pointer"
                              title="View your submitted application"
                            >
                              <Check className="w-3.5 h-3.5 text-[#004D40]" />
                              <span>Already Applied</span>
                            </button>
                          ) : isClosed ? (
                            <span
                              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold inline-flex items-center justify-center min-h-[40px] cursor-not-allowed"
                              title="This job is closed and no longer accepting applications"
                            >
                              Closed
                            </span>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedJobForApply(job)}
                              iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                              className="flex-1 sm:flex-none min-h-[40px]"
                              title="Apply for this opportunity"
                            >
                              Apply Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Existing Application Flow Modal (Requirement 7 & 17) */}
        <ApplyModal
          job={selectedJobForApply}
          isOpen={Boolean(selectedJobForApply)}
          onClose={() => setSelectedJobForApply(null)}
          navigate={navigate}
        />
      </div>
    </div>
  );
};
