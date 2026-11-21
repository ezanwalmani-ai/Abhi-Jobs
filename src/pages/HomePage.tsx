import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ScrollReveal, EASE_PREMIUM } from '../lib/motion';
import {
  ArrowRight,
  MapPin,
  Briefcase,
  Clock,
  Calendar,
  BookOpen,
  Building2,
  CheckCircle2,
  FileText,
  UserCheck,
} from 'lucide-react';

interface HomePageProps {
  navigate: (route: string) => void;
}

/**
 * Clean corporate geometric career-alignment visual illustration
 * Built strictly in ABHI JOBS Navy (#102B4E / #081D36) and Orange (#F47A24)
 */
const HeroCareerIllustration: React.FC = () => (
  <div className="relative w-full max-w-lg mx-auto lg:ml-auto select-none" aria-hidden="true">
    <div className="relative bg-white rounded-2xl border border-[#E5EAF0] shadow-[0_20px_50px_-20px_rgba(16,43,78,0.14)] p-6 sm:p-8 overflow-hidden">
      {/* Subtle architectural coordinate grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.045] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#102B4E" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div className="relative z-10 space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5EAF0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102B4E] text-white flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#778397]">
                Consultancy Recruitment
              </p>
              <p className="text-sm font-bold text-[#102B4E]">
                Curated Career Placement
              </p>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#F47A24]" />
        </div>

        {/* Recruitment Alignment Flow Cards */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.15, ease: EASE_PREMIUM }}
            className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0]"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-[#E5EAF0] flex items-center justify-center text-[#102B4E] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#102B4E] truncate">
                Structured Candidate Profile &amp; Resume
              </p>
              <p className="text-xs text-[#778397]">
                Profile readiness reviewed by our recruitment specialists
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.28, ease: EASE_PREMIUM }}
            className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#102B4E] text-white shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-[#F47A24] shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                Role Screening &amp; Shortlisting
              </p>
              <p className="text-xs text-slate-300">
                Matched directly with vetted enterprise hiring mandates
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#F47A24] shrink-0">Active</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.4, ease: EASE_PREMIUM }}
            className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0]"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-[#E5EAF0] flex items-center justify-center text-[#102B4E] shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#102B4E] truncate">
                Transparent Interview Progression
              </p>
              <p className="text-xs text-[#778397]">
                Track every milestone from application to final offer
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#102B4E] shrink-0" />
          </motion.div>
        </div>

        {/* Bottom Progress Visual */}
        <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-between text-xs text-[#778397]">
          <span>Discover · Apply · Grow</span>
          <span className="font-semibold text-[#102B4E]">ABHI JOBS Consultancy</span>
        </div>
      </div>
    </div>
  </div>
);

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { currentUser, jobs, courses } = useApp();

  // Latest 4 published and active jobs
  const latestJobs = useMemo(() => {
    return jobs
      .filter((j) => j.status === 'published')
      .sort((a, b) => (b.postedDate || '').localeCompare(a.postedDate || ''))
      .slice(0, 4);
  }, [jobs]);

  // Featured 3 published courses
  const featuredCourses = useMemo(() => {
    return courses.filter((c) => c.status === 'published').slice(0, 3);
  }, [courses]);

  const handleCreateProfile = () => {
    if (currentUser) {
      navigate('/profile');
    } else {
      navigate('/register/job-seeker');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#253449]">
      {/* ========================================================= */}
      {/* 1. HERO SECTION                                           */}
      {/* ========================================================= */}
      <section className="bg-white border-b border-[#E5EAF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Copy */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_PREMIUM }}
              className="lg:col-span-6 space-y-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F47A24]">
                Recruitment Consultancy · Discover. Apply. Grow.
              </p>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#102B4E] tracking-tight leading-[1.1]">
                Find Your Next Opportunity.
              </h1>

              <p className="text-base sm:text-lg text-[#778397] leading-relaxed max-w-xl">
                Discover career opportunities, build your professional profile, and take the next step in your career with ABHI JOBS.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/jobs')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <span>Explore Jobs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCreateProfile}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-[#F6F8FB] text-[#102B4E] border border-[#102B4E]/20 text-sm font-semibold transition-all cursor-pointer"
                >
                  <span>{currentUser ? 'Update Your Profile' : 'Create Your Profile'}</span>
                </button>
              </div>
            </motion.div>

            {/* Right Visual Illustration */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: EASE_PREMIUM }}
              className="lg:col-span-6"
            >
              <HeroCareerIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. LATEST OPPORTUNITIES                                   */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24]">
                  Active Mandates
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#102B4E] mt-1">
                  Latest Opportunities
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>View All Jobs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </ScrollReveal>

          {latestJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5EAF0] p-10 text-center space-y-3">
              <p className="text-base font-semibold text-[#102B4E]">
                No active openings published yet
              </p>
              <p className="text-sm text-[#778397] max-w-md mx-auto">
                Our recruitment team regularly adds verified positions. Create your profile so we can match you as new mandates open.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestJobs.map((job) => (
                <article
                  key={job.id}
                  className="bg-white rounded-2xl border border-[#E5EAF0] hover:border-[#102B4E]/30 p-6 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#778397] truncate">
                          {job.companyName}
                        </p>
                        <h3 className="font-display text-lg font-bold text-[#102B4E] mt-0.5 leading-snug">
                          {job.title}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-[#F47A24] shrink-0">
                        {job.employmentType}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#778397]">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#102B4E]/60 shrink-0" />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#102B4E]/60 shrink-0" />
                        {job.minExperienceYears > 0
                          ? `${job.minExperienceYears}+ yrs experience`
                          : job.experienceLevel}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#102B4E]/60 shrink-0" />
                        Posted {job.postedDate}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5EAF0] flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[#778397]">
                      {job.workMode} · {job.department}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. LEARN WITH ABHI                                        */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-20 bg-white border-y border-[#E5EAF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24]">
                  Professional Development
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#102B4E] mt-1">
                  Learn with ABHI
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/learning')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>Explore All Courses</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <article
                key={course.id}
                className="bg-[#F6F8FB] rounded-2xl border border-[#E5EAF0] hover:border-[#102B4E]/30 p-6 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F47A24]">{course.category}</span>
                    <span className="text-[#778397]">{course.learningMode || 'Online'}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#102B4E] leading-snug">
                    {course.title}
                  </h3>

                  <p className="text-xs text-[#778397] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#102B4E]/60 shrink-0" />
                    <span>{course.provider || 'ABHI JOBS Training Partner'}</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5EAF0] flex items-center justify-between">
                  <span className="text-xs text-[#778397]">
                    {course.duration} · {course.level}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/learning')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer"
                  >
                    <span>View Course</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. EMPLOYER SECTION                                       */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="bg-[#102B4E] rounded-2xl px-6 py-12 sm:px-12 sm:py-16 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-3 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F47A24]">
                  For Organizations
                </p>
                <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Looking for the Right Talent?
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Connect with ABHI JOBS to source, screen, and identify qualified candidates for your business.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/hire-talent')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <span>Hire Talent</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
