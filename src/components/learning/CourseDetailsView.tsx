import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  Loader2,
  LogIn,
  PlayCircle,
  Settings2,
} from 'lucide-react';
import { CourseEnrolmentRecord, LearningCourseItem } from '../../types/learning';
import { flattenCourseLessons } from '../../data/learningCatalog';
import { parseSafeVideoEmbed } from '../../services/courseContentService';
import { EASE_PREMIUM } from '../../lib/motion';

interface CourseDetailsViewProps {
  course: LearningCourseItem;
  isAuthenticated: boolean;
  isAdmin: boolean;
  enrolment: CourseEnrolmentRecord | null;
  isEnrolling: boolean;
  onEnrol: (course: LearningCourseItem) => Promise<void>;
  onStartLearning: (course: LearningCourseItem) => void;
  onBackToCatalogue: () => void;
  onNavigateLogin: () => void;
  onOpenAdminContentManager?: () => void;
}

export const CourseDetailsView: React.FC<CourseDetailsViewProps> = ({
  course,
  isAuthenticated,
  isAdmin,
  enrolment,
  isEnrolling,
  onEnrol,
  onStartLearning,
  onBackToCatalogue,
  onNavigateLogin,
  onOpenAdminContentManager,
}) => {
  const flatLessons = useMemo(() => flattenCourseLessons(course), [course]);
  const totalLessons = flatLessons.length;
  const isEnrolled = Boolean(enrolment);

  const completedSet = useMemo(() => {
    const validIds = new Set(flatLessons.map((f) => f.lesson.id));
    const s = new Set<string>();
    (enrolment?.completedLessonIds || []).forEach((id) => {
      if (validIds.has(id)) s.add(id);
    });
    return s;
  }, [enrolment?.completedLessonIds, flatLessons]);

  const progressPercent =
    totalLessons > 0
      ? Math.min(100, Math.round((completedSet.size / totalLessons) * 100))
      : enrolment?.progressPercent || 0;

  const lastAccessedLabel = enrolment?.lastAccessedAt
    ? new Date(enrolment.lastAccessedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-[#F6F8FB] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Row: Back Link + Optional Admin Shortcut */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToCatalogue}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#566479] hover:text-[#102B4E] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course Catalogue</span>
          </button>

          {isAdmin && onOpenAdminContentManager && (
            <button
              type="button"
              onClick={onOpenAdminContentManager}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5 text-[#F47A24]" />
              <span>Manage Course Lessons</span>
            </button>
          )}
        </div>

        {/* Course Header & Enrol / Continue Action Card */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_PREMIUM }}
          className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left: Course Identity & Description */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-[#778397]">
                <span className="font-semibold text-[#102B4E]">{course.categoryName}</span>
                <span aria-hidden="true">·</span>
                <span>{course.level}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#F47A24]">Free</span>
                {isEnrolled && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-emerald-700 tabular-nums">
                      {progressPercent > 0 ? `${progressPercent}% Complete` : 'Enrolled'}
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#102B4E] tracking-tight leading-tight [text-wrap:balance]">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-[#566479] leading-relaxed">
                {course.fullDescription}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-[#253449] tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#F47A24]" />
                  <span>{course.estimatedDuration}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#F47A24]" />
                  <span>
                    {course.modules.length} modules · {totalLessons} lessons
                  </span>
                </span>
              </div>
            </div>

            {/* Right: Enrolment & Learning Progress Box */}
            <div className="lg:col-span-4 lg:border-l lg:border-[#E5EAF0] lg:pl-8 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#778397]">Course Access</p>
                <p className="font-display text-2xl font-extrabold text-[#102B4E]">
                  100% Free
                </p>
                <p className="text-xs text-[#778397]">
                  Self-paced lessons, practical exercises, and downloadable study sheets.
                </p>
              </div>

              {isEnrolled ? (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#102B4E] inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Your Progress</span>
                      </span>
                      <span className="font-bold text-[#102B4E] tabular-nums">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#E5EAF0] overflow-hidden">
                      <div
                        className="h-full bg-[#F47A24] rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#778397] tabular-nums">
                      {completedSet.size} of {totalLessons} lessons completed
                      {lastAccessedLabel ? ` · Last accessed ${lastAccessedLabel}` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartLearning(course)}
                    className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                  >
                    <span>
                      {completedSet.size > 0 || enrolment?.currentLessonId
                        ? 'Continue Learning'
                        : 'Start Learning'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : isAuthenticated ? (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={isEnrolling}
                    onClick={() => void onEnrol(course)}
                    className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] active:scale-[0.98] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-all disabled:opacity-60"
                  >
                    {isEnrolling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enrolling...</span>
                      </>
                    ) : (
                      <>
                        <span>Enrol Now &amp; Start Learning</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-[#778397] leading-relaxed">
                    Saves your enrolment and lesson progress automatically under your candidate account.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={onNavigateLogin}
                    className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Enrol</span>
                  </button>
                  <p className="text-xs text-[#778397] leading-relaxed">
                    Sign in with your ABHI JOBS account to enrol, access lessons, and track your course progress.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Course Introduction */}
        <section className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-3">
          <p className="text-xs font-semibold text-[#F47A24] inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Course Introduction</span>
          </p>
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#102B4E]">
            {course.courseIntroduction.headline}
          </h2>
          <p className="text-sm sm:text-[15px] text-[#566479] leading-relaxed max-w-[72ch]">
            {course.courseIntroduction.overview}
          </p>
          <p className="text-xs text-[#778397] pt-1">
            <span className="font-semibold text-[#253449]">Prerequisites: </span>
            {course.courseIntroduction.prerequisites}
          </p>
        </section>

        {/* What You Will Learn & Skills You Will Develop */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#102B4E]">
              What You Will Learn
            </h2>
            <ul className="space-y-3">
              {course.whatYouWillLearn.map((outcome, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm text-[#253449] leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0 mt-1" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#102B4E]">
              Skills You Will Develop
            </h2>
            <ul className="divide-y divide-[#E5EAF0] border-y border-[#E5EAF0]">
              {course.skillsDeveloped.map((skill, idx) => (
                <li
                  key={skill}
                  className="py-3 flex items-center gap-3 text-sm font-medium text-[#253449]"
                >
                  <span className="font-display text-xs font-bold text-[#F47A24] tabular-nums">
                    0{idx + 1}
                  </span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Structured Course Modules & Lessons */}
        <section
          id="course-modules-section"
          className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-6 scroll-mt-24"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#F47A24]">
                Structured Curriculum
              </p>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#102B4E]">
                Course Modules &amp; Lessons
              </h2>
            </div>
            <span className="text-xs text-[#778397] tabular-nums">
              {course.modules.length} modules · {totalLessons} lessons · Quizzes coming next
            </span>
          </div>

          <div className="divide-y divide-[#E5EAF0] border-y border-[#E5EAF0]">
            {course.modules
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((mod) => (
                <div key={mod.id} className="py-5 space-y-3.5">
                  <div className="flex items-start gap-4">
                    <span className="font-display text-sm font-bold text-[#F47A24] tabular-nums pt-0.5 shrink-0">
                      0{mod.order}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-display text-base font-bold text-[#102B4E]">
                        {mod.title}
                      </h3>
                      <p className="text-sm text-[#566479] leading-relaxed">{mod.summary}</p>
                    </div>
                  </div>

                  {/* Lesson Rows Inside Module */}
                  <div className="pl-7 sm:pl-9 space-y-2">
                    {mod.lessons
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((lesson) => {
                        const completed = completedSet.has(lesson.id);
                        const hasVideo = Boolean(
                          lesson.videoUrl &&
                            parseSafeVideoEmbed(lesson.videoUrl)?.kind !== 'invalid'
                        );
                        return (
                          <div
                            key={lesson.id}
                            className="py-2 px-3 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : hasVideo ? (
                                <PlayCircle className="w-4 h-4 text-[#F47A24] shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-[#566479] shrink-0" />
                              )}
                              <span className="font-semibold text-[#102B4E] truncate">
                                {lesson.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-x-2 text-xs text-[#778397] shrink-0 tabular-nums pl-6 sm:pl-0">
                              <span>{hasVideo ? 'Video & Reading' : 'Written Lesson'}</span>
                              <span aria-hidden="true">·</span>
                              <span>{lesson.estimatedMinutes} min</span>
                              {completed && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-semibold text-emerald-700">
                                    Completed
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    <div className="pt-1 flex items-center justify-between text-[11px] text-[#8B97A8] px-3">
                      <span>Module 0{mod.order} Quiz</span>
                      <span>Scheduled for next update</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CourseDetailsView;
