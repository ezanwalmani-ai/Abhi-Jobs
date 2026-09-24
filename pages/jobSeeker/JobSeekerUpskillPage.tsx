import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ScrollReveal, StaggerGroup, StaggerItem, EASE_PREMIUM } from '../../lib/motion';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Compass,
  Briefcase,
  UserCheck,
  Layers,
  Lightbulb,
  Check,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  BookMarked,
  FileCheck,
  Flame,
} from 'lucide-react';

interface JobSeekerUpskillPageProps {
  navigate: (route: string) => void;
}

// User-specific course enrollment interface
interface UserEnrollment {
  courseId: string;
  userId: string;
  status: 'Started' | 'In Progress' | 'Completed';
  progressPercentage: number;
  lastActivity: string;
  enrolledAt: string;
}

export const JobSeekerUpskillPage: React.FC<JobSeekerUpskillPageProps> = ({ navigate }) => {
  const { currentUser, currentCandidate, courses, showToast } = useApp();

  // Page lifecycle states
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User-scoped enrollments loaded from real local storage (zero fake enrollments)
  const [userEnrollments, setUserEnrollments] = useState<UserEnrollment[]>(() => {
    if (!currentUser?.id) return [];
    try {
      const stored = localStorage.getItem(`abhijobs_enrollments_${currentUser.id}`) || localStorage.getItem(`hunar_enrollments_${currentUser.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Keep enrollments in sync per authenticated user
  useEffect(() => {
    if (currentUser?.id) {
      try {
        localStorage.setItem(`abhijobs_enrollments_${currentUser.id}`, JSON.stringify(userEnrollments));
      } catch {
        // fallback
      }
    }
  }, [userEnrollments, currentUser?.id]);

  // Initial load simulation with error safety
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Filter only published courses from the real admin backend
  const publishedCourses = useMemo(() => {
    return courses.filter((c) => c.status === 'published');
  }, [courses]);

  // Map user enrollments to published courses
  const enrolledCoursesData = useMemo(() => {
    return userEnrollments
      .map((enrollment) => {
        const course = courses.find((c) => c.id === enrollment.courseId);
        return {
          enrollment,
          course: course || null,
        };
      })
      .filter((item) => item.course !== null);
  }, [userEnrollments, courses]);

  // Handler for enrolling in a real published course
  const handleEnrollCourse = (course: Course) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const alreadyEnrolled = userEnrollments.some((e) => e.courseId === course.id);
    if (alreadyEnrolled) {
      showToast('info', 'Already Enrolled', `You are already enrolled in "${course.title}".`);
      return;
    }

    const newEnrollment: UserEnrollment = {
      courseId: course.id,
      userId: currentUser.id,
      status: 'Started',
      progressPercentage: 0,
      lastActivity: 'Just now',
      enrolledAt: new Date().toISOString().split('T')[0],
    };

    setUserEnrollments((prev) => [newEnrollment, ...prev]);
    showToast('success', 'Enrolled Successfully', `You have enrolled in "${course.title}".`);
  };

  // Safe refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasError(false);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('info', 'Content Updated', 'Learning tracks and catalog are up to date.');
    }, 350);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // 1. Unauthenticated State
  if (!currentUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-[#004D40] flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8 text-[#004D40]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-[#004D40] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Job Seeker Authentication Required</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Sign In to Access Your Learning Hub</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Please sign in with your ABHI JOBS Job Seeker account to track your personal upskilling progress, access accredited tracks, and prepare for upcoming career opportunities.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
            <div className="font-semibold text-slate-800">Your Private Upskill Dashboard:</div>
            <p>
              Your learning enrollments and career readiness goals are saved exclusively to your authenticated account.
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

  // 2. Error State
  if (hasError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              We couldn't load your learning information right now.
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

  // 3. Skeleton Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
          <div className="space-y-3 pb-4 border-b border-slate-200">
            <div className="w-36 h-6 bg-slate-200 rounded-full" />
            <div className="w-72 h-8 bg-slate-200 rounded-xl" />
            <div className="w-96 max-w-full h-4 bg-slate-200 rounded" />
          </div>
          <div className="h-44 bg-slate-200 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-60 bg-white rounded-2xl border border-slate-200" />
            <div className="h-60 bg-white rounded-2xl border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-10">

        {/* ======================================================= */}
        {/* 1. PAGE HEADER (Requirement 5)                          */}
        {/* ======================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-[#004D40] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#004D40] shrink-0" />
              <span>ABHI JOBS Professional Development</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Learning &amp; Upskill
            </h1>

            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Build the skills you need for the opportunities you want.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh learning portal"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#004D40] shrink-0" />
              <span>Profile Skills</span>
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
        {/* 2. HERO / INTRODUCTION (Requirement 2 & 6)              */}
        {/* ======================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-[#061226] border border-slate-800 text-white p-6 sm:p-10 shadow-md">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-slate-700 text-teal-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF2B1A]" />
              <span>Targeted Skill Architecture</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              &ldquo;Don't just look for your next opportunity. Prepare for it.&rdquo;
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Upskilling should never be about passively collecting course certificates. At ABHI JOBS, our learning ecosystem connects real market demand with intentional professional preparation:
            </p>

            {/* Core Relationship Flow */}
            <div className="pt-2">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-white">
                <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">Skills</span>
                <span className="text-teal-200">→</span>
                <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">Learning</span>
                <span className="text-teal-200">→</span>
                <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">Opportunity</span>
                <span className="text-teal-200">→</span>
                <span className="px-3 py-1.5 rounded-xl bg-[#FF2B1A]/20 text-teal-200 border border-teal-400/30">Career Growth</span>
              </div>
            </div>
          </div>

          {/* Value Pillars Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-8 mt-6 border-t border-white/10">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-teal-200">
                <Target className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                <span>Build Job-Relevant Skills</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Focus on high-impact proficiencies directly demanded by current hiring teams.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-teal-200">
                <TrendingUp className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                <span>Improve Career Readiness</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Develop domain knowledge and interview execution before speaking with recruiters.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-teal-200">
                <Compass className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                <span>Identify Skill Gaps</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compare your existing capabilities against published role specifications.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-teal-200">
                <Briefcase className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                <span>Prepare for Opportunities</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Be ready to contribute immediately rather than training after placement.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-teal-200">
                <Layers className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                <span>Continuous Development</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Establish ongoing learning habits that keep your skills resilient and relevant.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-teal-200">
                <Award className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                <span>Strengthen Profile Credibility</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Demonstrate tangible capabilities that enhance recruiter trust and profile visibility.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 3. MY LEARNING / ACTIVE ENROLLMENTS (Requirement 7 & 13)*/}
        {/* ======================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                My Active Learning
              </h2>
              <p className="text-xs text-slate-500">
                Your personal enrolled coursework and ongoing skill programs.
              </p>
            </div>

            {enrolledCoursesData.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#004D40] text-xs font-bold">
                {enrolledCoursesData.length} Enrolled Track{enrolledCoursesData.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {enrolledCoursesData.length > 0 ? (
            /* Render Authentic User Enrolled Courses */
            <StaggerGroup staggerDelay={0.06} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {enrolledCoursesData.map(({ course, enrollment }) => {
                if (!course) return null;
                return (
                  <StaggerItem key={course.id}>
                    <motion.div
                      whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
                      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 h-full"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-teal-50 text-[#004D40] text-xs font-bold border border-teal-200/60">
                            {course.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {enrollment.status}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {course.title}
                        </h3>

                        {course.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                          {course.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{course.duration}</span>
                            </div>
                          )}
                          {course.level && (
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-slate-700">Level:</span>
                              <span>{course.level}</span>
                            </div>
                          )}
                          {enrollment.lastActivity && (
                            <div className="text-[11px] text-slate-400">
                              Last active: {enrollment.lastActivity}
                            </div>
                          )}
                        </div>

                        {/* Animated Progress for In-Progress Course */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Course Progress</span>
                            <span className="font-bold text-slate-800">{enrollment.progressPercentage || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-[#004D40] h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${enrollment.progressPercentage || 0}%` }}
                              transition={{ duration: 0.8, ease: EASE_PREMIUM }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500 font-medium">
                          Enrolled {enrollment.enrolledAt}
                        </div>

                        <button
                          onClick={() => showToast('info', 'Course In Session', `Continuing module review for "${course.title}".`)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>Continue Learning</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          ) : (
            /* Proper Intentional Empty State (Requirement 7 & 8) */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-5 shadow-2xs max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-[#004D40] mx-auto flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-[#004D40]" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-xl font-extrabold text-slate-900">
                  Your learning journey starts here.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Learning and upskilling opportunities will appear here as they become available.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="#available-programs"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore Learning Programs</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* 4. ADMIN-MANAGED LEARNING CATALOG (Requirement 4 & 8)    */}
        {/* ======================================================= */}
        <div id="available-programs" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Available Learning Programs
              </h2>
              <p className="text-xs text-slate-500">
                Curated learning tracks administered through the ABHI JOBS Admin Console.
              </p>
            </div>

            <span className="text-xs text-slate-400 font-medium self-start sm:self-auto">
              Verified Curriculum
            </span>
          </div>

          {publishedCourses.length > 0 ? (
            /* Render Published Admin Courses (Requirement 8) */
            <StaggerGroup staggerDelay={0.06} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {publishedCourses.map((course) => {
                const isEnrolled = userEnrollments.some((e) => e.courseId === course.id);
                return (
                  <StaggerItem key={course.id}>
                    <motion.div
                      whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
                      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 h-full"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200/60">
                            {course.category}
                          </span>
                          {course.duration && (
                            <span className="text-xs text-slate-400 font-medium">{course.duration}</span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {course.title}
                        </h3>

                        {course.description && (
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                            {course.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {course.level && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              Level: {course.level}
                            </span>
                          )}
                          {typeof course.modules === 'number' && course.modules > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {course.modules} Modules
                            </span>
                          )}
                          {course.instructor && (
                            <span className="text-xs text-slate-500">
                              Instructor: {course.instructor}
                            </span>
                          )}
                        </div>

                        {/* Real badge associated with course with professional reveal */}
                        {course.badge && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, ease: EASE_PREMIUM }}
                            className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200/60 flex items-center gap-2 text-xs text-[#004D40]"
                          >
                            <Award className="w-4 h-4 text-[#004D40] shrink-0" />
                            <span>Unlocks credential badge: <strong>{course.badge}</strong></span>
                          </motion.div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-400">
                          Admin-Approved Track
                        </div>

                        {isEnrolled ? (
                          <span className="min-h-[40px] px-3.5 py-2 rounded-xl bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-bold inline-flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[#004D40]" />
                            <span>Enrolled</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEnrollCourse(course)}
                            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span>Enroll &amp; Start</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          ) : (
            /* Empty State for Admin Catalog (Requirement 3 & 8: No Fake Data) */
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Compass className="w-7 h-7 text-slate-600" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Curriculum in Development
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  New learning programs and skill tracks are currently being prepared. Approved programs published by administrators in the ABHI JOBS console will appear dynamically here.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Update Profile Skills</span>
                </button>
                <button
                  onClick={() => navigate('/jobs')}
                  className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Browse Current Openings</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* 5. SKILLS DEVELOPMENT (Requirement 9)                    */}
        {/* ======================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="max-w-2xl space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004D40] uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Upskilling Methodology</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              How Skill Development Drives Career Progression
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Effective career growth follows a deliberate, progressive cycle. This methodology outlines how continuous learning translates into tangible career outcomes:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1: Identify */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#004D40] font-extrabold text-sm flex items-center justify-center">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900">Identify</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Analyze job descriptions and industry standards to understand which technical and collaborative skills are actually required for your target roles.
              </p>
            </div>

            {/* Step 2: Learn */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#004D40] font-extrabold text-sm flex items-center justify-center">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900">Learn</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Build foundational and intermediate knowledge through structured resources, curated documentation, and industry-aligned study materials.
              </p>
            </div>

            {/* Step 3: Practice */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#004D40] font-extrabold text-sm flex items-center justify-center">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900">Practice</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Develop practical ability through hands-on application, case studies, and real-world task simulations to cement your domain confidence.
              </p>
            </div>

            {/* Step 4: Improve */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#004D40] font-extrabold text-sm flex items-center justify-center">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900">Improve</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Continue strengthening your capabilities based on interview feedback, changing market demands, and ongoing professional milestones.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 6. CAREER READINESS (Requirement 10)                     */}
        {/* ======================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="max-w-2xl space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004D40] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Holistic Preparation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Building Comprehensive Career Readiness
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              True career readiness extends beyond memorized answers. Focused preparation strengthens every dimension of your candidate profile:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                <span>Skill Development</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Master the practical tools, software, and domain competencies required to execute day-to-day responsibilities on day one.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                <span>Interview Preparation</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Articulate your problem-solving approaches, project impact, and domain challenges clearly and persuasively during technical rounds.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                <span>Professional Knowledge</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Familiarize yourself with industry compliance, organizational workflows, and collaborative workplace methodologies.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                <span>Career Confidence</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter recruitment conversations backed by genuine competence, reducing anxiety and improving natural communication.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                <span>Job Readiness</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Minimize onboarding friction by understanding modern workflow tools and operational expectations prior to hiring.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                <span>Continuous Improvement</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Build resilience and adaptability across changing industry cycles by cultivating an ongoing growth mindset.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500">
            <strong>Professional Transparency:</strong> ABHI JOBS provides skill-development frameworks to empower candidate career readiness; employment decisions remain exclusively at the discretion of independent hiring organizations based on job requirements and verified qualifications.
          </div>
        </div>

        {/* ======================================================= */}
        {/* 7. FUTURE LEARNING ECOSYSTEM (Requirement 11)           */}
        {/* ======================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="max-w-2xl space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004D40] uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Platform Blueprint</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              ABHI JOBS Future Learning Ecosystem
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The overarching architectural blueprint guiding ABHI JOBS&apos;s upcoming integrated learning and placement pathways:
            </p>
          </div>

          {/* Sequential Lifecycle Roadmap */}
          <div className="relative">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-1 text-center">
                <span className="text-[10px] font-bold text-[#004D40] uppercase">Step 1</span>
                <div className="font-bold text-xs sm:text-sm text-slate-900">Career Goal</div>
                <p className="text-[11px] text-slate-500">Define desired target role</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Step 2</span>
                <div className="font-bold text-xs sm:text-sm text-slate-900">Identify Skills</div>
                <p className="text-[11px] text-slate-500">Audit role requirements</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Step 3</span>
                <div className="font-bold text-xs sm:text-sm text-slate-900">Learn</div>
                <p className="text-[11px] text-slate-500">Engage curated modules</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Step 4</span>
                <div className="font-bold text-xs sm:text-sm text-slate-900">Practice</div>
                <p className="text-[11px] text-slate-500">Hands-on application</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Step 5</span>
                <div className="font-bold text-xs sm:text-sm text-slate-900">Strengthen Profile</div>
                <p className="text-[11px] text-slate-500">Display verified badges</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#061226] text-white space-y-1 text-center shadow-xs">
                <span className="text-[10px] font-bold text-teal-200 uppercase">Step 6</span>
                <div className="font-bold text-xs sm:text-sm">Discover Roles</div>
                <p className="text-[11px] text-slate-300">Connect to opportunities</p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 8. PROFILE & JOB CONNECTION (Requirement 13 & 14)        */}
        {/* ======================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Profile Connection */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#004D40] border border-teal-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-[#004D40]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Connect Skills to Your Profile
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Employers search our talent directory using specific skill tags. Adding your verified competencies directly boosts your visibility to recruiters.
                </p>
              </div>

              {/* Display existing real skills from CandidateProfile */}
              {currentCandidate && Array.isArray(currentCandidate.skills) && currentCandidate.skills.length > 0 ? (
                <div className="pt-2 space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Your Profile Skills ({currentCandidate.skills.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCandidate.skills.map((skill: any) => (
                      <span
                        key={typeof skill === 'string' ? skill : skill.name}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60"
                      >
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  You haven&apos;t added any skills to your profile yet. Add skills to stand out to employers.
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Manage Profile Skills</span>
              <ArrowRight className="w-4 h-4 text-[#004D40]" />
            </button>
          </div>

          {/* Job Connection */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-2xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#004D40] border border-teal-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#004D40]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Looking for Opportunities That Match Your Skills?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Browse live opportunities from verified organizations actively seeking candidates with your technical and professional background.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-600">
                <div className="font-semibold text-slate-800">Job Matching:</div>
                <p>
                  Our search filters allow you to discover remote, hybrid, and on-site opportunities matching your preferred industry and experience level.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/jobs')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Find Matching Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 9. FUTURE-READY CERTIFICATES NOTE (Requirement 12)       */}
        {/* ======================================================= */}
        <div className="bg-slate-100/80 rounded-2xl border border-slate-200 p-4 sm:p-5 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-[#004D40] shrink-0" />
            <div>
              <div className="font-bold text-slate-800">Accredited Skill Certifications:</div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Official certificates will be issued upon successful completion of future admin-accredited coursework tracks. Zero simulated certificates are generated.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/jobs')}
            className="text-[#004D40] hover:text-[#061226] font-bold whitespace-nowrap text-xs cursor-pointer self-end sm:self-auto"
          >
            Explore Openings →
          </button>
        </div>

      </div>
    </div>
  );
};
