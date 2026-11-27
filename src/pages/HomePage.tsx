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
  Clock,
  Calendar,
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
} from 'lucide-react';

interface HomePageProps {
  navigate: (route: string) => void;
}

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
    <div className="min-h-screen bg-[#F6F8FB] text-[#1E293B]">
      {/* ========================================================= */}
      {/* 1. HERO SECTION                                           */}
      {/* ========================================================= */}
      <section className="bg-white border-b border-[#E5EAF0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16 lg:pt-16 lg:pb-16">
          <div className="max-w-3xl space-y-5">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_PREMIUM }}
              className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24]"
            >
              Recruitment Consultancy · Discover. Apply. Grow.
            </motion.p>

            <HeroTextReveal
              text="Find Your Next Opportunity."
              as="h1"
              highlightWords={['Opportunity.']}
              highlightClassName="text-[#F47A24]"
              staggerMs={55}
              delay={0.05}
              distance={14}
              className="font-display text-[32px] sm:text-[40px] lg:text-[46px] font-bold text-[#102B4E] tracking-[-0.025em] leading-[1.12] [text-wrap:balance]"
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.16, ease: EASE_PREMIUM }}
              className="text-[15px] sm:text-base text-[#475569] leading-relaxed max-w-2xl"
            >
              Connect with vetted hiring mandates across technology, finance, engineering, and operations. Build your profile, apply directly, and advance your career with ABHI JOBS.
            </motion.p>

            {/* Primary & Secondary Action Links */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.28, ease: EASE_PREMIUM }}
              className="flex flex-wrap items-center gap-3 pt-1"
            >
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[42px] rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Explore Jobs</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>

              <button
                type="button"
                onClick={handleCreateProfile}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[42px] rounded-lg bg-white hover:bg-[#F6F8FB] text-[#102B4E] border border-[#D4DCE6] hover:border-[#102B4E]/45 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{currentUser ? 'Update Your Profile' : 'Create Your Profile'}</span>
              </button>
            </motion.div>
          </div>

          {/* Clean Recruitment Consultancy Pillars Strip */}
          <div className="mt-10 pt-8 border-t border-[#E5EAF0] grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F1F5FA] text-[#102B4E] flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[#102B4E]">Curated Mandates</h2>
                <p className="text-[13px] text-[#475569] mt-0.5 leading-relaxed">
                  Verified openings managed directly with hiring teams across core industries.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FFF4EC] text-[#F47A24] flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[#102B4E]">Learn with ABHI</h2>
                <p className="text-[13px] text-[#475569] mt-0.5 leading-relaxed">
                  Role-aligned courses, assessments, and verifiable certificates to build job readiness.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F1F5FA] text-[#102B4E] flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[#102B4E]">Consultancy Hiring</h2>
                <p className="text-[13px] text-[#475569] mt-0.5 leading-relaxed">
                  Structured screening and shortlisting for organizations seeking vetted talent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. LATEST OPPORTUNITIES                                   */}
      {/* ========================================================= */}
      <section className="py-12 sm:py-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSectionHeading
            kicker="Active Mandates"
            title="Latest Opportunities"
            highlightWord="Opportunities"
            className="mb-8"
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
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-8 text-center space-y-2.5">
              <p className="text-[15px] font-semibold text-[#102B4E]">
                No active openings published yet
              </p>
              <p className="text-sm text-[#475569] max-w-md mx-auto">
                Our recruitment team regularly adds verified positions. Create your profile so we can match you as new mandates open.
              </p>
            </div>
          ) : (
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-5" stagger={0.05}>
              {latestJobs.map((job) => (
                <StaggerItem key={job.id}>
                  <article className="group h-full bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 p-6 shadow-[0_1px_2px_rgba(16,43,78,0.03)] hover:shadow-[0_6px_20px_-10px_rgba(16,43,78,0.14)] transition-all duration-200 flex flex-col justify-between gap-5">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#64748B] truncate">
                            {job.companyName}
                          </p>
                          <h3 className="font-display text-[18px] font-semibold text-[#102B4E] group-hover:text-[#F47A24] transition-colors mt-1 leading-snug tracking-[-0.01em]">
                            {job.title}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-[#F47A24] shrink-0 pt-0.5">
                          {job.employmentType}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#475569]">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                          {job.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                          {job.minExperienceYears > 0
                            ? `${job.minExperienceYears}+ yrs experience`
                            : job.experienceLevel}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                          Posted {job.postedDate}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E5EAF0] flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-[#64748B] truncate">
                        {job.workMode} · {job.department}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-[13px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
      <section className="py-12 sm:py-14 bg-white border-y border-[#E5EAF0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSectionHeading
            kicker="Professional Development"
            title="Learn with ABHI"
            highlightWord="ABHI"
            className="mb-8"
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

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-5" stagger={0.05}>
            {featuredCourses.map((course) => (
              <StaggerItem key={course.id}>
                <article className="group h-full bg-[#FAFBFD] hover:bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 p-6 transition-all duration-200 flex flex-col justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#F47A24] truncate">{course.category}</span>
                      <span className="text-[#64748B] shrink-0">{course.learningMode || 'Online'}</span>
                    </div>

                    <h3 className="font-display text-[17px] font-semibold text-[#102B4E] group-hover:text-[#F47A24] transition-colors leading-snug tracking-[-0.01em]">
                      {course.title}
                    </h3>

                    <p className="text-[13px] text-[#475569] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span className="truncate">{course.provider || 'ABHI JOBS Training Partner'}</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E5EAF0] flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#64748B]">
                      {course.duration} · {course.level}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(course.slug ? `/learning/courses/${course.slug}` : '/learning')
                      }
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer whitespace-nowrap shrink-0"
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
      <section className="py-12 sm:py-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="bg-[#102B4E] rounded-xl px-6 py-8 sm:px-10 sm:py-10 text-white border border-[#081D36] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24]">
                  For Organizations
                </p>
                <h2 className="font-display text-2xl sm:text-[28px] font-bold tracking-[-0.02em] text-white leading-snug">
                  Looking for the Right Talent?
                </h2>
                <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed">
                  Connect with ABHI JOBS to source, screen, and shortlist qualified candidates tailored to your business requirements.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/hire-talent')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
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
