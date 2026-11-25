import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  ScrollReveal,
  HeroTextReveal,
  AnimatedSectionHeading,
  StaggerGroup,
  StaggerItem,
  EASE_PREMIUM,
} from '../lib/motion';
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
  <div className="relative w-full max-w-[460px] mx-auto lg:ml-auto select-none" aria-hidden="true">
    <div className="relative bg-white rounded-xl border border-[#E5EAF0] shadow-[0_14px_36px_-18px_rgba(16,43,78,0.14)] p-5 sm:p-6 overflow-hidden">
      {/* Subtle architectural coordinate grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hero-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#102B4E" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div className="relative z-10 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E5EAF0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#102B4E] text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#778397]">
                Consultancy Recruitment
              </p>
              <p className="text-sm font-bold text-[#102B4E]">
                Curated Career Placement
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#F47A24]">Verified</span>
        </div>

        {/* Recruitment Alignment Flow Cards */}
        <div className="space-y-2.5">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.12, ease: EASE_PREMIUM }}
            className="flex items-center gap-3 p-3 rounded-lg bg-[#F6F8FB] border border-[#E5EAF0]"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E5EAF0] flex items-center justify-center text-[#102B4E] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-[#102B4E] truncate">
                Structured Candidate Profile &amp; Resume
              </p>
              <p className="text-xs text-[#566479]">
                Profile readiness reviewed by our recruitment specialists
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.22, ease: EASE_PREMIUM }}
            className="flex items-center gap-3 p-3 rounded-lg bg-[#102B4E] text-white"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#F47A24] shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-white truncate">
                Role Screening &amp; Shortlisting
              </p>
              <p className="text-xs text-slate-300">
                Matched directly with vetted enterprise hiring mandates
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#F47A24] shrink-0">Active</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.32, ease: EASE_PREMIUM }}
            className="flex items-center gap-3 p-3 rounded-lg bg-[#F6F8FB] border border-[#E5EAF0]"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E5EAF0] flex items-center justify-center text-[#102B4E] shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-[#102B4E] truncate">
                Transparent Interview Progression
              </p>
              <p className="text-xs text-[#566479]">
                Track every milestone from application to final offer
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#102B4E] shrink-0" />
          </motion.div>
        </div>

        {/* Bottom Progress Visual */}
        <div className="pt-2.5 border-t border-[#E5EAF0] flex items-center justify-between text-xs text-[#778397]">
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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_PREMIUM }}
                className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24]"
              >
                Recruitment Consultancy · Discover. Apply. Grow.
              </motion.p>

              <HeroTextReveal
                text="Find Your Next Opportunity."
                as="h1"
                highlightWords={['Opportunity.']}
                highlightClassName="text-[#F47A24]"
                staggerMs={65}
                delay={0.06}
                distance={18}
                className="font-display text-[30px] sm:text-[36px] lg:text-[40px] font-extrabold text-[#102B4E] tracking-tight leading-[1.14] [text-wrap:balance]"
              />

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.22, ease: EASE_PREMIUM }}
                className="text-[15px] sm:text-base text-[#566479] leading-relaxed max-w-lg"
              >
                Discover career opportunities, build your professional profile, and take the next step in your career with ABHI JOBS.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: 0.3, ease: EASE_PREMIUM }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1"
              >
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/jobs')}
                  className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Explore Jobs</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateProfile}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-white hover:bg-[#F6F8FB] text-[#102B4E] border border-[#D4DCE6] hover:border-[#102B4E]/45 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>{currentUser ? 'Update Your Profile' : 'Create Your Profile'}</span>
                </motion.button>
              </motion.div>
            </div>

            {/* Right Visual Illustration */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: EASE_PREMIUM }}
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
      <section className="py-10 sm:py-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSectionHeading
            kicker="Active Mandates"
            title="Latest Opportunities"
            highlightWord="Opportunities"
            className="mb-7"
            rightSlot={
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer"
              >
                <span className="abhi-link-underline">View All Jobs</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>
            }
          />

          {latestJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-5 sm:p-6 text-center space-y-2.5">
              <p className="text-[15px] font-semibold text-[#102B4E]">
                No active openings published yet
              </p>
              <p className="text-sm text-[#566479] max-w-md mx-auto">
                Our recruitment team regularly adds verified positions. Create your profile so we can match you as new mandates open.
              </p>
            </div>
          ) : (
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-5" stagger={0.06}>
              {latestJobs.map((job) => (
                <StaggerItem key={job.id}>
                  <article className="group h-full bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 p-5 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#778397] truncate">
                          {job.companyName}
                        </p>
                        <h3 className="font-display text-[18px] font-bold text-[#102B4E] mt-0.5 leading-snug">
                          {job.title}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-[#F47A24] shrink-0">
                        {job.employmentType}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[#566479]">
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

                  <div className="pt-3.5 border-t border-[#E5EAF0] flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[#778397]">
                      {job.workMode} · {job.department}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </article>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. LEARN WITH ABHI                                        */}
      {/* ========================================================= */}
      <section className="py-10 sm:py-12 bg-white border-y border-[#E5EAF0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSectionHeading
            kicker="Professional Development"
            title="Learn with ABHI"
            highlightWord="ABHI"
            className="mb-7"
            rightSlot={
              <button
                type="button"
                onClick={() => navigate('/learning')}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer"
              >
                <span className="abhi-link-underline">Explore All Courses</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>
            }
          />

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-5" stagger={0.06}>
            {featuredCourses.map((course) => (
              <StaggerItem key={course.id}>
                <article className="group h-full bg-[#FAFBFD] hover:bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 p-5 transition-all duration-200 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#F47A24]">{course.category}</span>
                      <span className="text-[#778397]">{course.learningMode || 'Online'}</span>
                    </div>

                    <h3 className="font-display text-[18px] font-bold text-[#102B4E] group-hover:text-[#F47A24] transition-colors leading-snug">
                      {course.title}
                    </h3>

                    <p className="text-[13px] text-[#566479] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#102B4E]/60 shrink-0" />
                      <span>{course.provider || 'ABHI JOBS Training Partner'}</span>
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-[#E5EAF0] flex items-center justify-between">
                    <span className="text-xs text-[#778397]">
                      {course.duration} · {course.level}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('/learning')}
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>View Course</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. EMPLOYER SECTION                                       */}
      {/* ========================================================= */}
      <section className="py-10 sm:py-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="bg-[#102B4E] rounded-2xl px-6 py-8 sm:px-8 sm:py-9 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24]">
                  For Organizations
                </p>
                <h2 className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-white leading-snug">
                  Looking for the Right Talent?
                </h2>
                <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed">
                  Connect with ABHI JOBS to source, screen, and identify qualified candidates for your business.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/hire-talent')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
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
