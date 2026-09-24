import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { JobCard } from '../components/JobCard';
import { ApplyModal } from '../components/ApplyModal';
import { Job } from '../types';
import { ScrollReveal, StaggerGroup, StaggerItem, EASE_PREMIUM, TextMaskReveal, ScrollProgress } from '../lib/motion';
import {
  Search,
  MapPin,
  Briefcase,
  Filter,
  X,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Building2,
  Calendar,
  DollarSign,
  SlidersHorizontal,
  BookOpen,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowRight,
  Check,
  History,
  ChevronDown,
} from 'lucide-react';

interface JobsPageProps {
  navigate: (route: string) => void;
  initialQuery?: string;
  initialLocation?: string;
}

// Simple Quick Filter Constants (Designed for clarity and ease of use)
const POPULAR_LOCATIONS = [
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Pune',
];

const JOB_TYPE_OPTIONS = [
  { value: 'All', label: 'Any job type' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Temporary', label: 'Temporary' },
];

const WORK_MODE_OPTIONS = [
  { value: 'All', label: 'Any' },
  { value: 'Remote', label: 'Work from home' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'On-site', label: 'Office' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'All', label: 'Any experience' },
  { value: 'Fresher', label: 'Fresher' },
  { value: '1-2_years', label: '1–2 years' },
  { value: '3-5_years', label: '3–5 years' },
  { value: '5_plus_years', label: '5+ years' },
];

const SALARY_OPTIONS = [
  { value: 'All', label: 'Any salary' },
  { value: '0_20k', label: '₹0–₹20K' },
  { value: '20k_40k', label: '₹20K–₹40K' },
  { value: '40k_60k', label: '₹40K–₹60K' },
  { value: '60k_plus', label: '₹60K+' },
];

export const JobsPage: React.FC<JobsPageProps> = ({
  navigate,
  initialQuery = '',
  initialLocation = '',
}) => {
  const { jobs, currentCandidate, currentRole, savedJobIds, saveJob, unsaveJob } = useApp();

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Mobile Filter Drawer State
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filter States
  const [search, setSearch] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [department, setDepartment] = useState<string>('All');
  const [industry, setIndustry] = useState<string>('All');
  const [workMode, setWorkMode] = useState<string>('All');
  const [employmentType, setEmploymentType] = useState<string>('All');
  const [experienceLevel, setExperienceLevel] = useState<string>('All');
  const [salaryRange, setSalaryRange] = useState<string>('All');
  const [quickMinSalary, setQuickMinSalary] = useState<boolean>(false); // ₹20K+/month filter
  const [datePosted, setDatePosted] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'relevance' | 'salary_high' | 'salary_low'>('recent');

  // Quick Filters UI state (Desktop dropdowns & More Filters toggle)
  const [openDropdown, setOpenDropdown] = useState<'location' | 'jobType' | 'workMode' | 'experience' | 'salary' | null>(null);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState<boolean>(false);
  const quickFiltersRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
      if (quickFiltersRef.current && !quickFiltersRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setIsMobileFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Search History State (persisted to localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_recent_job_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        }
      }
    } catch (e) {
      console.warn('Unable to read recent searches from localStorage:', e);
    }
    return [];
  });

  const addRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('abhijobs_recent_job_searches', JSON.stringify(updated));
      } catch (err) {
        console.warn('Unable to save recent search:', err);
      }
      return updated;
    });
  };

  const removeRecentSearch = (queryToRemove: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== queryToRemove.toLowerCase());
      try {
        localStorage.setItem('abhijobs_recent_job_searches', JSON.stringify(updated));
      } catch (err) {
        console.warn('Unable to remove recent search:', err);
      }
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('abhijobs_recent_job_searches');
    } catch {}
  };

  // Synchronize when initialQuery changes or on initial mount
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setSearch(initialQuery);
      addRecentSearch(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (initialLocation && initialLocation.trim()) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  // Debounced auto-save of typed search queries
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length >= 3) {
      const timer = setTimeout(() => {
        addRecentSearch(trimmed);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [search]);

  // Apply Modal state
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);

  // Simulate initial load / reload
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError(null);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // SOURCE OF TRUTH: published jobs only from backend
  const publishedJobs = useMemo(() => {
    return (jobs || []).filter((j) => j && j.status === 'published');
  }, [jobs]);

  // Dynamically extract categories / departments strictly from published jobs
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    publishedJobs.forEach((j) => {
      if (j.department && typeof j.department === 'string' && j.department.trim()) {
        set.add(j.department.trim());
      }
    });
    return Array.from(set).sort();
  }, [publishedJobs]);

  // Dynamically extract industries strictly from published jobs
  const availableIndustries = useMemo(() => {
    const set = new Set<string>();
    publishedJobs.forEach((j) => {
      if (j.industry && typeof j.industry === 'string' && j.industry.trim()) {
        set.add(j.industry.trim());
      }
    });
    return Array.from(set).sort();
  }, [publishedJobs]);

  // Dynamically extract skills strictly from published jobs
  const availableSkills = useMemo(() => {
    const set = new Set<string>();
    publishedJobs.forEach((j) => {
      (j.preferredSkills || []).forEach((s) => {
        if (typeof s === 'string' && s.trim()) {
          set.add(s.trim());
        }
      });
    });
    return Array.from(set).sort().slice(0, 16);
  }, [publishedJobs]);

  // Filtered & Sorted Jobs derived strictly from published backend jobs
  const filteredJobs = useMemo(() => {
    const now = Date.now();

    return publishedJobs
      .filter((j) => {
        // Keyword search (title, company, skills, overview, department, industry)
        if (search && search.trim()) {
          const q = search.toLowerCase().trim();
          const titleMatch = (j.title || '').toLowerCase().includes(q);
          const companyMatch = (j.companyName || '').toLowerCase().includes(q);
          const overviewMatch = (j.overview || '').toLowerCase().includes(q);
          const deptMatch = (j.department || '').toLowerCase().includes(q);
          const industryMatch = (j.industry || '').toLowerCase().includes(q);
          const skillsMatch = (j.preferredSkills || []).some(
            (s) => typeof s === 'string' && s.toLowerCase().includes(q)
          );
          if (!titleMatch && !companyMatch && !overviewMatch && !deptMatch && !industryMatch && !skillsMatch) {
            return false;
          }
        }

        // Location text or filter (City, State, Remote)
        if (location && location.trim()) {
          const locParts = location.toLowerCase().split(/[,/]+/).map((p) => p.trim()).filter(Boolean);
          const jobLoc = (j.location || '').toLowerCase();
          const jobMode = (j.workMode || '').toLowerCase();

          const locMatches = locParts.some((part) => {
            if (part === 'remote' || part === 'wfh') {
              return jobMode.includes('remote');
            }
            return jobLoc.includes(part);
          });

          if (!locMatches) {
            return false;
          }
        }

        // Department
        if (department !== 'All' && j.department !== department) {
          return false;
        }

        // Industry
        if (industry !== 'All' && j.industry !== industry) {
          return false;
        }

        // Work Mode
        if (workMode !== 'All') {
          const jMode = (j.workMode || '').toLowerCase();
          const jLoc = (j.location || '').toLowerCase();
          if (workMode === 'Remote') {
            if (!jMode.includes('remote') && !jLoc.includes('remote') && !jLoc.includes('wfh')) return false;
          } else if (workMode === 'Hybrid') {
            if (!jMode.includes('hybrid') && !jLoc.includes('hybrid')) return false;
          } else if (workMode === 'On-site') {
            if (!jMode.includes('site') && !jMode.includes('office') && !jMode.includes('on-site')) return false;
          } else if (j.workMode !== workMode) {
            return false;
          }
        }

        // Employment Type
        if (employmentType !== 'All') {
          const jType = (j.employmentType || '').toLowerCase();
          const target = employmentType.toLowerCase();
          if (target === 'temporary') {
            if (!jType.includes('temp') && !jType.includes('contract')) return false;
          } else if (target === 'contract') {
            if (!jType.includes('contract') && !jType.includes('temp')) return false;
          } else if (target === 'internship') {
            if (!jType.includes('intern')) return false;
          } else if (target === 'full-time') {
            if (!jType.includes('full')) return false;
          } else if (target === 'part-time') {
            if (!jType.includes('part')) return false;
          } else if (j.employmentType !== employmentType) {
            return false;
          }
        }

        // Experience Level
        if (experienceLevel !== 'All') {
          const years = j.minExperienceYears ?? 0;
          const level = (j.experienceLevel || '').toLowerCase();
          if (experienceLevel === 'Fresher') {
            if (level !== 'fresher' && years > 0) return false;
          } else if (experienceLevel === '1-2_years' || experienceLevel === 'Junior') {
            const isJunior = level === 'junior';
            const isMatch = years >= 1 && years <= 2;
            if (!isJunior && !isMatch) return false;
          } else if (experienceLevel === '3-5_years' || experienceLevel === 'Mid') {
            const isMid = level === 'mid';
            const isMatch = years >= 3 && years <= 5;
            if (!isMid && !isMatch) return false;
          } else if (experienceLevel === '5_plus_years' || experienceLevel === 'Senior' || experienceLevel === 'Lead') {
            const isSenior = level === 'senior' || level === 'lead';
            const isMatch = years >= 5;
            if (!isSenior && !isMatch) return false;
          } else if (j.experienceLevel !== experienceLevel) {
            return false;
          }
        }

        // Skill tag
        if (selectedSkill !== 'All' && !(j.preferredSkills || []).includes(selectedSkill)) {
          return false;
        }

        // Quick Min Salary: ₹20K+ monthly = ₹240,000 annual
        if (quickMinSalary) {
          const maxSalary = j.salary?.max || j.salary?.min || 0;
          if (maxSalary > 0 && maxSalary < 240000) {
            return false;
          }
        }

        // Salary Range
        if (salaryRange !== 'All') {
          const rawMin = j.salary?.min || 0;
          const rawMax = j.salary?.max || rawMin;
          const period = j.salary?.period || 'yearly';
          // Convert to monthly INR equivalent for calculation
          let monthlyMin = rawMin;
          let monthlyMax = rawMax;
          if (period === 'yearly' || rawMin > 120000 || rawMax > 120000) {
            monthlyMin = Math.round(rawMin / 12);
            monthlyMax = Math.round(rawMax / 12);
          }

          if (salaryRange === '0_20k') {
            if (monthlyMin > 20000 && monthlyMax > 25000) return false;
          } else if (salaryRange === '20k_40k') {
            if (monthlyMax < 20000 || (monthlyMin > 40000 && monthlyMin !== 0)) return false;
          } else if (salaryRange === '40k_60k') {
            if (monthlyMax < 40000 || (monthlyMin > 60000 && monthlyMin !== 0)) return false;
          } else if (salaryRange === '60k_plus') {
            if (monthlyMax < 60000 && monthlyMin < 60000) return false;
          } else if (salaryRange === 'under_6' && rawMax > 600000 && rawMax !== 0) {
            return false;
          } else if (salaryRange === '6_to_12' && (rawMax < 600000 || (rawMin > 1200000 && rawMin !== 0))) {
            return false;
          } else if (salaryRange === '12_to_20' && (rawMax < 1200000 || (rawMin > 2000000 && rawMin !== 0))) {
            return false;
          } else if (salaryRange === '20_plus' && rawMax < 2000000) {
            return false;
          }
        }

        // Date Posted
        if (datePosted !== 'All' && j.postedDate) {
          const postedTime = new Date(j.postedDate).getTime();
          if (!isNaN(postedTime)) {
            const diffHours = (now - postedTime) / (1000 * 60 * 60);
            if (datePosted === '24h' && diffHours > 24) return false;
            if (datePosted === '7d' && diffHours > 24 * 7) return false;
            if (datePosted === '30d' && diffHours > 24 * 30) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'salary_high') {
          const aMax = a.salary?.max || a.salary?.min || 0;
          const bMax = b.salary?.max || b.salary?.min || 0;
          return bMax - aMax;
        }
        if (sortBy === 'salary_low') {
          const aMin = a.salary?.min || a.salary?.max || 0;
          const bMin = b.salary?.min || b.salary?.max || 0;
          return aMin - bMin;
        }
        if (sortBy === 'relevance' && currentCandidate?.skills) {
          const aSkills = currentCandidate.skills.filter((s) => (a.preferredSkills || []).includes(s)).length;
          const bSkills = currentCandidate.skills.filter((s) => (b.preferredSkills || []).includes(s)).length;
          return bSkills - aSkills;
        }
        // Default 'recent'
        const timeA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
        const timeB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
        return timeB - timeA;
      });
  }, [
    publishedJobs,
    search,
    location,
    department,
    industry,
    workMode,
    employmentType,
    experienceLevel,
    salaryRange,
    quickMinSalary,
    datePosted,
    selectedSkill,
    sortBy,
    currentCandidate,
  ]);

  // Real-time Match Recommendations: only shown if published jobs exist AND candidate is logged in with profile skills
  const recommendedJobs = useMemo(() => {
    if (publishedJobs.length === 0) return [];
    if (!currentCandidate || !Array.isArray(currentCandidate.skills) || currentCandidate.skills.length === 0) {
      return [];
    }

    const candidateSkills = currentCandidate.skills;
    const scored = publishedJobs
      .map((job) => {
        const matches = (job.preferredSkills || []).filter((s) =>
          candidateSkills.some(
            (cs) => typeof cs === 'string' && typeof s === 'string' && cs.toLowerCase() === s.toLowerCase()
          )
        );
        const matchPercent = Math.round(
          Math.min(98, 68 + (matches.length / Math.max(1, (job.preferredSkills || []).length)) * 30)
        );
        return { job, score: matchPercent, matchCount: matches.length };
      })
      .filter((item) => item.matchCount > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return scored;
  }, [publishedJobs, currentCandidate]);

  const handleResetFilters = () => {
    setSearch('');
    setLocation('');
    setDepartment('All');
    setIndustry('All');
    setWorkMode('All');
    setEmploymentType('All');
    setExperienceLevel('All');
    setSalaryRange('All');
    setQuickMinSalary(false);
    setDatePosted('All');
    setSelectedSkill('All');
    setSortBy('recent');
    setOpenDropdown(null);
  };

  const getLocationDisplayLabel = () => {
    if (!location || !location.trim()) return 'Location';
    return location;
  };

  const getJobTypeDisplayLabel = () => {
    if (employmentType === 'All') return 'Job Type';
    const found = JOB_TYPE_OPTIONS.find((o) => o.value === employmentType);
    return found ? found.label : employmentType;
  };

  const getWorkModeDisplayLabel = () => {
    if (workMode === 'All') return 'Work Mode';
    const found = WORK_MODE_OPTIONS.find((o) => o.value === workMode);
    return found ? found.label : workMode;
  };

  const getExperienceDisplayLabel = () => {
    if (experienceLevel === 'All') return 'Experience';
    const found = EXPERIENCE_OPTIONS.find((o) => o.value === experienceLevel);
    if (found) return found.label;
    if (experienceLevel === 'Junior') return '1–2 years';
    if (experienceLevel === 'Mid') return '3–5 years';
    if (experienceLevel === 'Senior' || experienceLevel === 'Lead') return '5+ years';
    return experienceLevel;
  };

  const getSalaryDisplayLabel = () => {
    if (salaryRange === 'All') return 'Salary';
    const found = SALARY_OPTIONS.find((o) => o.value === salaryRange);
    if (found) return found.label;
    if (salaryRange === 'under_6') return 'Up to ₹6 LPA';
    if (salaryRange === '6_to_12') return '₹6–₹12 LPA';
    if (salaryRange === '12_to_20') return '₹12–₹20 LPA';
    if (salaryRange === '20_plus') return '₹20+ LPA';
    return salaryRange;
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(location) ||
    department !== 'All' ||
    industry !== 'All' ||
    workMode !== 'All' ||
    employmentType !== 'All' ||
    experienceLevel !== 'All' ||
    salaryRange !== 'All' ||
    quickMinSalary ||
    datePosted !== 'All' ||
    selectedSkill !== 'All';

  // Count active filter criteria
  const activeFilterCount = useMemo(() => {
    return [
      Boolean(location),
      workMode !== 'All',
      employmentType !== 'All',
      experienceLevel !== 'All',
      salaryRange !== 'All',
      department !== 'All',
      industry !== 'All',
      quickMinSalary,
      datePosted !== 'All',
      selectedSkill !== 'All',
    ].filter(Boolean).length;
  }, [
    location,
    department,
    industry,
    workMode,
    employmentType,
    experienceLevel,
    salaryRange,
    quickMinSalary,
    datePosted,
    selectedSkill,
  ]);

  // More Filters active count
  const moreFiltersActiveCount = useMemo(() => {
    return [
      department !== 'All',
      industry !== 'All',
      datePosted !== 'All',
      selectedSkill !== 'All',
    ].filter(Boolean).length;
  }, [department, industry, datePosted, selectedSkill]);

  // Active filter chips for easy removal
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

    if (location && location.trim()) {
      chips.push({
        id: 'location',
        label: location,
        onRemove: () => setLocation(''),
      });
    }

    if (employmentType !== 'All') {
      chips.push({
        id: 'employmentType',
        label: getJobTypeDisplayLabel(),
        onRemove: () => setEmploymentType('All'),
      });
    }

    if (workMode !== 'All') {
      chips.push({
        id: 'workMode',
        label: getWorkModeDisplayLabel(),
        onRemove: () => setWorkMode('All'),
      });
    }

    if (experienceLevel !== 'All') {
      chips.push({
        id: 'experienceLevel',
        label: getExperienceDisplayLabel(),
        onRemove: () => setExperienceLevel('All'),
      });
    }

    if (salaryRange !== 'All') {
      chips.push({
        id: 'salaryRange',
        label: getSalaryDisplayLabel(),
        onRemove: () => setSalaryRange('All'),
      });
    }

    if (quickMinSalary) {
      chips.push({
        id: 'quickMinSalary',
        label: '₹20K+/mo',
        onRemove: () => setQuickMinSalary(false),
      });
    }

    if (department !== 'All') {
      chips.push({
        id: 'department',
        label: `Dept: ${department}`,
        onRemove: () => setDepartment('All'),
      });
    }

    if (industry !== 'All') {
      chips.push({
        id: 'industry',
        label: `Industry: ${industry}`,
        onRemove: () => setIndustry('All'),
      });
    }

    if (datePosted !== 'All') {
      const map: Record<string, string> = {
        '24h': 'Past 24 hours',
        '7d': 'Past 7 days',
        '30d': 'Past 30 days',
      };
      chips.push({
        id: 'datePosted',
        label: map[datePosted] || datePosted,
        onRemove: () => setDatePosted('All'),
      });
    }

    if (selectedSkill !== 'All') {
      chips.push({
        id: 'selectedSkill',
        label: `Skill: ${selectedSkill}`,
        onRemove: () => setSelectedSkill('All'),
      });
    }

    return chips;
  }, [
    location,
    employmentType,
    workMode,
    experienceLevel,
    salaryRange,
    quickMinSalary,
    department,
    industry,
    datePosted,
    selectedSkill,
  ]);

  // Prevent background scroll and support ESC key when mobile filter sidebar is open
  useEffect(() => {
    if (!isMobileFiltersOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileFiltersOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileFiltersOpen]);

  // Strict opportunity count label
  const opportunityCountLabel = useMemo(() => {
    const count = filteredJobs.length;
    if (count === 0) return '0 opportunities';
    if (count === 1) return '1 opportunity';
    return `${count} opportunities`;
  }, [filteredJobs.length]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <ScrollProgress />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <ScrollReveal direction="up" distance={16}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#004D40] text-xs font-bold border border-teal-200">
                <Briefcase className="w-3.5 h-3.5 text-[#004D40]" />
                <span>Verified Career Marketplace</span>
              </div>
              <TextMaskReveal
                as="h1"
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#101828] tracking-tight"
                delay={0.1}
                duration={0.65}
              >
                Find Your Next Opportunity
              </TextMaskReveal>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                Discover opportunities based on skills, experience, and career interests. Every opening is published and verified by trusted employers.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              {/* Mobile filter toggle button */}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="md:hidden px-3.5 py-2.5 rounded-xl border border-[#D0D5DD] bg-white text-[#101828] text-xs font-bold shadow-2xs flex items-center gap-2 cursor-pointer min-h-[44px] hover:border-[#061226] active:scale-98 transition-all"
                aria-label="Open filter sidebar"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#667085]" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF2B1A] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#667085] font-semibold hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-bold px-3 py-2.5 rounded-xl border border-[#D0D5DD] bg-white text-[#101828] shadow-2xs focus:outline-hidden cursor-pointer min-h-[44px]"
                  aria-label="Sort job listings"
                >
                  <option value="recent">Most Recent</option>
                  <option value="relevance">Relevance</option>
                  <option value="salary_high">Salary: High to Low</option>
                  <option value="salary_low">Salary: Low to High</option>
                </select>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Search Bar & Primary Filter Controls */}
        <ScrollReveal direction="up" delay={0.06} distance={18}>
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E4E7EC] shadow-xs space-y-4">
            {/* 1. Search & 2. Location Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* 1. Search */}
              <div className="md:col-span-7 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-[#D0D5DD] bg-[#F7F8FA] focus-within:border-[#061226] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#061226]/10 transition-all">
                <Search className="w-4 h-4 text-[#667085] shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addRecentSearch(search);
                    }
                  }}
                  onBlur={() => {
                    if (search.trim().length >= 2) {
                      addRecentSearch(search);
                    }
                  }}
                  placeholder="Search jobs by title, company or keyword"
                  className="w-full text-xs sm:text-sm text-[#101828] bg-transparent focus:outline-hidden placeholder:text-[#667085]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="p-1 text-[#667085] hover:text-[#101828] cursor-pointer rounded-full shrink-0"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => addRecentSearch(search)}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#061226] text-white text-xs font-semibold hover:bg-[#004D40] transition-colors cursor-pointer shrink-0"
                  title="Search jobs"
                >
                  <span>Search</span>
                </button>
              </div>

              {/* 2. Location */}
              <div className="md:col-span-5 flex items-center gap-2.5 px-4 py-2.5 sm:py-3 rounded-2xl border border-[#D0D5DD] bg-[#F7F8FA] focus-within:border-[#061226] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#061226]/10 transition-all">
                <MapPin className="w-4 h-4 text-[#667085] shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && search.trim().length >= 2) {
                      addRecentSearch(search);
                    }
                  }}
                  placeholder="Where do you want to work?"
                  className="w-full text-xs sm:text-sm text-[#101828] bg-transparent focus:outline-hidden placeholder:text-[#667085]"
                />
                {location && (
                  <button
                    type="button"
                    onClick={() => setLocation('')}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer rounded-full shrink-0"
                    title="Clear location"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 3. Quick Filters Horizontal Bar (Desktop & Tablet) */}
            <div ref={quickFiltersRef} className="filter-bar pt-2 border-t border-slate-100">
              {/* Desktop Filter Bar */}
              <div className="filter-bar-inner hidden md:flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                  Filters:
                </span>

                {/* Location Filter Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] select-none ${
                      location
                        ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${location ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate max-w-[130px]">{getLocationDisplayLabel()}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        openDropdown === 'location' ? 'rotate-180' : ''
                      } ${location ? 'text-white' : 'text-slate-400'}`}
                    />
                  </button>

                  {openDropdown === 'location' && (
                    <div className="absolute left-0 top-full mt-1.5 z-40 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-1 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Type city or 'Remote'..."
                            className="w-full bg-transparent focus:outline-hidden text-xs text-slate-900 placeholder:text-slate-400"
                            autoFocus
                          />
                          {location && (
                            <button
                              type="button"
                              onClick={() => setLocation('')}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-1.5 max-h-56 overflow-y-auto space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setLocation('');
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                            !location ? 'font-bold text-[#004D40] bg-teal-50/60' : 'text-slate-700'
                          }`}
                        >
                          <span>Any location</span>
                          {!location && <Check className="w-3.5 h-3.5 text-[#004D40]" />}
                        </button>

                        {POPULAR_LOCATIONS.map((loc) => {
                          const isSelected = location.toLowerCase().includes(loc.toLowerCase());
                          return (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                setLocation(loc);
                                setOpenDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                                isSelected ? 'font-bold text-[#004D40] bg-teal-50/60' : 'text-slate-700'
                              }`}
                            >
                              <span>{loc}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#004D40]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Type Filter Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'jobType' ? null : 'jobType')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] select-none ${
                      employmentType !== 'All'
                        ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{getJobTypeDisplayLabel()}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        openDropdown === 'jobType' ? 'rotate-180' : ''
                      } ${employmentType !== 'All' ? 'text-white' : 'text-slate-400'}`}
                    />
                  </button>

                  {openDropdown === 'jobType' && (
                    <div className="absolute left-0 top-full mt-1.5 z-40 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
                      {JOB_TYPE_OPTIONS.map((opt) => {
                        const isSelected = employmentType === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setEmploymentType(opt.value);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                              isSelected ? 'font-bold text-[#004D40] bg-teal-50/60' : 'text-slate-700'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#004D40]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Work Mode Filter Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'workMode' ? null : 'workMode')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] select-none ${
                      workMode !== 'All'
                        ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{getWorkModeDisplayLabel()}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        openDropdown === 'workMode' ? 'rotate-180' : ''
                      } ${workMode !== 'All' ? 'text-white' : 'text-slate-400'}`}
                    />
                  </button>

                  {openDropdown === 'workMode' && (
                    <div className="absolute left-0 top-full mt-1.5 z-40 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
                      {WORK_MODE_OPTIONS.map((opt) => {
                        const isSelected = workMode === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setWorkMode(opt.value);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                              isSelected ? 'font-bold text-[#004D40] bg-teal-50/60' : 'text-slate-700'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#004D40]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Experience Filter Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'experience' ? null : 'experience')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] select-none ${
                      experienceLevel !== 'All'
                        ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{getExperienceDisplayLabel()}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        openDropdown === 'experience' ? 'rotate-180' : ''
                      } ${experienceLevel !== 'All' ? 'text-white' : 'text-slate-400'}`}
                    />
                  </button>

                  {openDropdown === 'experience' && (
                    <div className="absolute left-0 top-full mt-1.5 z-40 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
                      {EXPERIENCE_OPTIONS.map((opt) => {
                        const isSelected = experienceLevel === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setExperienceLevel(opt.value);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                              isSelected ? 'font-bold text-[#004D40] bg-teal-50/60' : 'text-slate-700'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#004D40]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Salary Filter Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'salary' ? null : 'salary')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] select-none ${
                      salaryRange !== 'All'
                        ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{getSalaryDisplayLabel()}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        openDropdown === 'salary' ? 'rotate-180' : ''
                      } ${salaryRange !== 'All' ? 'text-white' : 'text-slate-400'}`}
                    />
                  </button>

                  {openDropdown === 'salary' && (
                    <div className="absolute left-0 top-full mt-1.5 z-40 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
                      {SALARY_OPTIONS.map((opt) => {
                        const isSelected = salaryRange === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSalaryRange(opt.value);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                              isSelected ? 'font-bold text-[#004D40] bg-teal-50/60' : 'text-slate-700'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#004D40]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* More Filters Toggle */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] select-none ${
                      moreFiltersActiveCount > 0
                        ? 'bg-teal-50 text-[#004D40] border-teal-300 font-bold'
                        : isMoreFiltersOpen
                        ? 'bg-slate-100 text-slate-900 border-slate-300 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>More Filters</span>
                    {moreFiltersActiveCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#004D40] text-white text-[10px] flex items-center justify-center font-bold">
                        {moreFiltersActiveCount}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isMoreFiltersOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="ml-auto text-xs font-semibold text-[#FF2B1A] hover:text-[#e02213] hover:underline cursor-pointer flex items-center gap-1 py-1.5 px-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Mobile Filter Trigger Button */}
              <div className="md:hidden flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="filter-trigger-btn flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-between cursor-pointer shadow-xs min-h-[44px] transition-colors"
                  aria-label="Filters"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#004D40]" />
                    <span className="text-xs font-bold text-slate-800">Filters</span>
                  </div>
                  {activeFilterCount > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#004D40] text-white ring-2 ring-white">
                      {activeFilterCount} active
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">All filters</span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-2 text-xs font-semibold text-[#FF2B1A] hover:underline cursor-pointer min-h-[44px] flex items-center gap-1 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Active Filter Chips */}
              {activeChips.length > 0 && (
                <div className="pt-2.5 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 select-none">
                    Active Filters:
                  </span>
                  {activeChips.map((chip) => (
                    <span
                      key={chip.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <span>{chip.label}</span>
                      <button
                        type="button"
                        onClick={chip.onRemove}
                        className="p-0.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                        title={`Remove ${chip.label}`}
                        aria-label={`Remove ${chip.label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-[#FF2B1A] hover:text-[#e02213] hover:underline cursor-pointer ml-1.5 flex items-center gap-1 py-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                </div>
              )}
            </div>

            {/* Clickable 'Recent Searches' Chips */}
            {recentSearches.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 shrink-0 select-none">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recent Searches:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                  {recentSearches.map((item) => {
                    const isSelected = search.trim().toLowerCase() === item.toLowerCase();
                    return (
                      <div
                        key={item}
                        className={`inline-flex items-center rounded-full text-xs font-medium transition-all border ${
                          isSelected
                            ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/90 hover:text-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSearch(item);
                            addRecentSearch(item);
                          }}
                          className="px-3 py-1 cursor-pointer truncate max-w-[170px] sm:max-w-[220px] focus:outline-hidden"
                          title={`Search for "${item}"`}
                        >
                          {item}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(item, e)}
                          className={`p-1 mr-1 rounded-full transition-colors cursor-pointer ${
                            isSelected
                              ? 'text-white/70 hover:text-white hover:bg-white/20'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-300/60'
                          }`}
                          title={`Remove "${item}" from history`}
                          aria-label={`Remove "${item}" from search history`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={clearAllRecentSearches}
                    className="text-[11px] font-semibold text-slate-400 hover:text-[#FF2B1A] transition-colors px-2 py-1 cursor-pointer ml-auto sm:ml-1"
                    title="Clear search history"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            )}

            {/* Optional 'More Filters' Panel (Revealed on click) */}
            {isMoreFiltersOpen && (
              <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#004D40]" />
                    <span>Additional Filters</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMoreFiltersOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="All">All Departments</option>
                      {availableDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Industry */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Industry
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="All">All Industries</option>
                      {availableIndustries.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Posted */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Date Posted
                    </label>
                    <select
                      value={datePosted}
                      onChange={(e) => setDatePosted(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="All">Anytime</option>
                      <option value="24h">Past 24 hours</option>
                      <option value="7d">Past 7 days</option>
                      <option value="30d">Past 30 days</option>
                    </select>
                  </div>
                </div>

                {/* Popular Skills inside More Filters */}
                {availableSkills.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Popular Skills:
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSkill('All')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedSkill === 'All'
                          ? 'bg-[#061226] text-white shadow-2xs'
                          : 'bg-[#F7F8FA] text-[#667085] hover:bg-slate-200'
                      }`}
                    >
                      All
                    </button>
                    {availableSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => setSelectedSkill(skill === selectedSkill ? 'All' : skill)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          selectedSkill === skill
                            ? 'bg-[#061226] text-white shadow-2xs font-bold'
                            : 'bg-[#F7F8FA] text-[#101828] hover:bg-slate-200'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Real Profile Recommendations: only if published jobs exist and profile matches */}
        {!hasActiveFilters && recommendedJobs.length > 0 && (
          <ScrollReveal direction="up" delay={0.08}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#004D40] text-white flex items-center justify-center shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#101828]">
                      Recommended for Your Profile
                    </h2>
                    <p className="text-xs text-[#667085]">
                      Matched with your profile skills: {(currentCandidate?.skills || []).slice(0, 3).join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              <StaggerGroup staggerDelay={0.07} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendedJobs.map(({ job, score }) => (
                  <StaggerItem key={`rec-${job.id}`}>
                    <div className="relative h-full">
                      <div className="absolute -top-2.5 right-4 z-10 px-2.5 py-0.5 rounded-full bg-[#004D40] text-white text-[10px] font-extrabold shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{score}% Profile Match</span>
                      </div>
                      <JobCard
                        job={job}
                        onApply={(j) => setSelectedJobForApply(j)}
                        onViewDetails={(id) => navigate(`/jobs/${id}`)}
                      />
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </ScrollReveal>
        )}

        {/* Job Listings Header & Count */}
        <ScrollReveal direction="up" delay={0.1}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Opportunities
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing <strong className="text-slate-800">{opportunityCountLabel}</strong> from verified employers
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Loading State: Skeleton Cards */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
                        <div className="space-y-2">
                          <div className="w-24 h-3 bg-slate-200 rounded-sm" />
                          <div className="w-36 h-4 bg-slate-200 rounded-sm" />
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-20 h-4 bg-slate-200 rounded-sm" />
                      <div className="w-24 h-4 bg-slate-200 rounded-sm" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="w-full h-3 bg-slate-200 rounded-sm" />
                      <div className="w-3/4 h-3 bg-slate-200 rounded-sm" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <div className="w-16 h-5 bg-slate-200 rounded-md" />
                      <div className="w-16 h-5 bg-slate-200 rounded-md" />
                      <div className="w-16 h-5 bg-slate-200 rounded-md" />
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="w-20 h-3 bg-slate-200 rounded-sm" />
                      <div className="flex gap-2">
                        <div className="w-16 h-7 bg-slate-200 rounded-lg" />
                        <div className="w-16 h-7 bg-slate-200 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : loadError ? (
              /* Error State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="p-12 text-center bg-white rounded-3xl border border-rose-200 shadow-xs space-y-4 max-w-lg mx-auto"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">We couldn&apos;t load jobs right now.</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Please check your connection or try refreshing the job feed.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleRetry}
                    className="px-5 py-2.5 rounded-xl bg-[#061226] text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry</span>
                  </button>
                </div>
              </motion.div>
            ) : publishedJobs.length === 0 ? (
              /* Empty State: Zero Published Jobs in Backend */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-10 sm:p-14 text-center bg-white rounded-3xl border border-[#E4E7EC] shadow-xs space-y-5 max-w-xl mx-auto"
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#004D40] flex items-center justify-center mx-auto border border-teal-100">
                  <Briefcase className="w-8 h-8 text-[#004D40]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-[#101828]">
                    No opportunities available right now.
                  </h3>
                  <p className="text-xs sm:text-sm text-[#667085] max-w-md mx-auto leading-relaxed">
                    New opportunities are added regularly. Please check back soon.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('/job-seeker/profile')}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Update My Profile</span>
                  </button>
                  <button
                    onClick={() => navigate('/job-seeker/upskill')}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#D0D5DD] hover:bg-[#F7F8FA] text-[#101828] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <BookOpen className="w-4 h-4 text-[#004D40]" />
                    <span>Explore Learning</span>
                  </button>
                </div>
              </motion.div>
            ) : filteredJobs.length === 0 ? (
              /* Search / Filter yielded 0 results */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-10 sm:p-14 text-center bg-white rounded-3xl border border-[#E4E7EC] shadow-xs space-y-4 max-w-lg mx-auto"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F7F8FA] text-[#667085] flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-[#101828]">No jobs found</h3>
                  <p className="text-xs text-[#667085] max-w-sm mx-auto leading-relaxed">
                    Try changing your filters or searching for something different.
                  </p>
                </div>
                <div className="pt-3">
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 rounded-xl bg-[#061226] text-white text-xs font-bold hover:bg-[#0c1f3d] transition-colors cursor-pointer min-h-[44px] inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Jobs Grid with Stagger */
              <StaggerGroup staggerDelay={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                  <StaggerItem key={job.id}>
                    <JobCard
                      job={job}
                      onApply={(j) => setSelectedJobForApply(j)}
                      onViewDetails={(jobId) => navigate(`/jobs/${jobId}`)}
                    />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* Mobile Filter Sidebar Drawer with Smooth Slide-in Animation */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Filter Opportunities">
            {/* Backdrop with smooth fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
              aria-hidden="true"
            />

            {/* Slide-In Filter Sidebar Panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 pointer-events-none">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{
                  type: 'spring',
                  damping: 30,
                  stiffness: 300,
                  mass: 0.85,
                }}
                className="filter-panel w-screen max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden pointer-events-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E7EC] bg-white shrink-0">
                  <div className="flex items-center gap-2 font-bold text-[#101828] text-base min-w-0">
                    <Filter className="w-4 h-4 text-[#004D40] shrink-0" />
                    <h2 className="font-bold text-slate-900 text-base">Filters</h2>
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#004D40] text-white shrink-0">
                        {activeFilterCount} active
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Filters Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5 text-xs">
                  {/* 1. Location */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#004D40]" />
                        <span>Location</span>
                      </span>
                      {location && (
                        <button
                          type="button"
                          onClick={() => setLocation('')}
                          className="text-[11px] text-[#FF2B1A] font-medium hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </label>

                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Type city or 'Remote'..."
                        className="w-full bg-transparent focus:outline-hidden text-xs text-slate-900 placeholder:text-slate-400"
                      />
                      {location && (
                        <button
                          type="button"
                          onClick={() => setLocation('')}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setLocation('')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          !location
                            ? 'bg-[#004D40] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Any location
                      </button>
                      {POPULAR_LOCATIONS.map((loc) => {
                        const isSelected = location.toLowerCase().includes(loc.toLowerCase());
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setLocation(loc)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#004D40] text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Job Type */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#004D40]" />
                      <span>Job Type</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {JOB_TYPE_OPTIONS.map((opt) => {
                        const isSelected = employmentType === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setEmploymentType(opt.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between border cursor-pointer min-h-[40px] ${
                              isSelected
                                ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Work Mode */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#004D40]" />
                      <span>Work Mode</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {WORK_MODE_OPTIONS.map((opt) => {
                        const isSelected = workMode === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setWorkMode(opt.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between border cursor-pointer min-h-[40px] ${
                              isSelected
                                ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Experience */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#004D40]" />
                      <span>Experience</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {EXPERIENCE_OPTIONS.map((opt) => {
                        const isSelected = experienceLevel === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setExperienceLevel(opt.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between border cursor-pointer min-h-[40px] ${
                              isSelected
                                ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Salary */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#004D40]" />
                      <span>Salary</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SALARY_OPTIONS.map((opt) => {
                        const isSelected = salaryRange === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSalaryRange(opt.value)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between border cursor-pointer min-h-[40px] ${
                              isSelected
                                ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* More Filters Accordion (Optional details) */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>More Filters (Department, Industry, Date)</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isMoreFiltersOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isMoreFiltersOpen && (
                      <div className="pt-3 space-y-3">
                        {/* Department */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Department
                          </label>
                          <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full min-h-[44px] p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-hidden cursor-pointer"
                          >
                            <option value="All">All Departments</option>
                            {availableDepartments.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Industry */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Industry
                          </label>
                          <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full min-h-[44px] p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-hidden cursor-pointer"
                          >
                            <option value="All">All Industries</option>
                            {availableIndustries.map((ind) => (
                              <option key={ind} value={ind}>
                                {ind}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Date Posted */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Date Posted
                          </label>
                          <select
                            value={datePosted}
                            onChange={(e) => setDatePosted(e.target.value)}
                            className="w-full min-h-[44px] p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-hidden cursor-pointer"
                          >
                            <option value="All">Anytime</option>
                            <option value="24h">Past 24 hours</option>
                            <option value="7d">Past 7 days</option>
                            <option value="30d">Past 30 days</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Bottom Actions Bar */}
                <div className="p-4 sm:p-5 border-t border-[#E4E7EC] bg-white flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-5 py-3 rounded-xl border border-[#D0D5DD] bg-white text-[#101828] text-xs font-bold hover:bg-slate-100 cursor-pointer min-h-[44px] transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="flex-1 px-5 py-3 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold shadow-xs cursor-pointer min-h-[44px] transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <span>Apply Filters</span>
                    <span className="text-white/80 font-normal">({filteredJobs.length})</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Apply Modal */}
      <ApplyModal
        job={selectedJobForApply}
        isOpen={Boolean(selectedJobForApply)}
        onClose={() => setSelectedJobForApply(null)}
        navigate={navigate}
      />
    </div>
  );
};
