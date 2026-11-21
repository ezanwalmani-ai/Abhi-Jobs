import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  List,
  Lock,
  PlayCircle,
  Settings2,
  X,
} from 'lucide-react';
import {
  CourseEnrolmentRecord,
  CourseLesson,
  LearningCourseItem,
} from '../../types/learning';
import { flattenCourseLessons } from '../../data/learningCatalog';
import {
  downloadLessonResource,
  parseSafeVideoEmbed,
} from '../../services/courseContentService';
import { EASE_PREMIUM } from '../../lib/motion';

interface CoursePlayerViewProps {
  course: LearningCourseItem;
  enrolment: CourseEnrolmentRecord;
  isAdmin: boolean;
  isSavingProgress: boolean;
  lastSavedLabel: string | null;
  onUpdateProgress: (params: {
    currentLessonId?: string;
    completedLessonIds: string[];
    totalLessons: number;
  }) => Promise<void>;
  onBackToCourseDetails: () => void;
  onOpenAdminContentManager?: () => void;
}

const INTRO_VIEW_ID = '__course_intro__';

export const CoursePlayerView: React.FC<CoursePlayerViewProps> = ({
  course,
  enrolment,
  isAdmin,
  isSavingProgress,
  lastSavedLabel,
  onUpdateProgress,
  onBackToCourseDetails,
  onOpenAdminContentManager,
}) => {
  const flatLessons = useMemo(() => flattenCourseLessons(course), [course]);
  const totalLessons = flatLessons.length;

  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    enrolment.completedLessonIds || []
  );

  // Resume from last viewed lesson if valid; otherwise open Course Introduction for first-time learners
  const [activeId, setActiveId] = useState<string>(() => {
    if (
      enrolment.currentLessonId &&
      flatLessons.some((item) => item.lesson.id === enrolment.currentLessonId)
    ) {
      return enrolment.currentLessonId;
    }
    return INTRO_VIEW_ID;
  });

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    course.modules.forEach((m) => {
      initial[m.id] = true;
    });
    return initial;
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [checkedExercises, setCheckedExercises] = useState<Record<string, boolean>>({});
  const [lockNotice, setLockNotice] = useState<string | null>(null);

  // Keep local state aligned if enrolment refreshes from cloud
  useEffect(() => {
    if (Array.isArray(enrolment.completedLessonIds)) {
      setCompletedIds(enrolment.completedLessonIds);
    }
  }, [enrolment.courseId, enrolment.completedLessonIds]);

  // Filter completedIds strictly against current lessons in this course for accurate progress %
  const validLessonIdSet = useMemo(
    () => new Set(flatLessons.map((item) => item.lesson.id)),
    [flatLessons]
  );

  const validCompletedSet = useMemo(() => {
    const s = new Set<string>();
    completedIds.forEach((id) => {
      if (validLessonIdSet.has(id)) s.add(id);
    });
    return s;
  }, [completedIds, validLessonIdSet]);

  const progressPercent =
    totalLessons > 0
      ? Math.min(100, Math.round((validCompletedSet.size / totalLessons) * 100))
      : 0;

  // Sequential unlock check:
  // - Lesson 0 is always unlocked.
  // - Lesson N is unlocked if sequentialUnlock is false, user is admin, lesson N is already completed,
  //   or lesson N-1 is completed.
  const isLessonUnlocked = (globalIndex: number): boolean => {
    if (!course.sequentialUnlock || isAdmin || globalIndex <= 0) return true;
    const targetLesson = flatLessons[globalIndex]?.lesson;
    if (targetLesson && validCompletedSet.has(targetLesson.id)) return true;
    const prevLesson = flatLessons[globalIndex - 1]?.lesson;
    return Boolean(prevLesson && validCompletedSet.has(prevLesson.id));
  };

  const activeEntry = useMemo(
    () => flatLessons.find((item) => item.lesson.id === activeId) || null,
    [flatLessons, activeId]
  );

  const activeLesson: CourseLesson | null = activeEntry?.lesson || null;
  const activeModule = activeEntry?.module || null;
  const activeGlobalIndex = activeEntry ? activeEntry.globalIndex : -1;

  const isCurrentLessonCompleted = activeLesson
    ? validCompletedSet.has(activeLesson.id)
    : false;

  const parsedVideo = useMemo(
    () => (activeLesson?.videoUrl ? parseSafeVideoEmbed(activeLesson.videoUrl) : null),
    [activeLesson?.videoUrl]
  );

  const selectLesson = async (lessonId: string, globalIndex: number) => {
    if (!isLessonUnlocked(globalIndex)) {
      const prevTitle = flatLessons[globalIndex - 1]?.lesson.title || 'the previous lesson';
      setLockNotice(`Complete "${prevTitle}" first to unlock this lesson.`);
      return;
    }

    setLockNotice(null);
    setActiveId(lessonId);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    await onUpdateProgress({
      currentLessonId: lessonId,
      completedLessonIds: Array.from(validCompletedSet),
      totalLessons,
    });
  };

  const selectIntro = () => {
    setLockNotice(null);
    setActiveId(INTRO_VIEW_ID);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleComplete = async () => {
    if (!activeLesson) return;

    const nextSet = new Set(validCompletedSet);
    if (nextSet.has(activeLesson.id)) {
      nextSet.delete(activeLesson.id);
    } else {
      nextSet.add(activeLesson.id);
    }
    const nextList = Array.from(nextSet);
    setCompletedIds(nextList);
    setLockNotice(null);

    await onUpdateProgress({
      currentLessonId: activeLesson.id,
      completedLessonIds: nextList,
      totalLessons,
    });
  };

  const handlePrevious = () => {
    if (activeGlobalIndex === 0) {
      selectIntro();
      return;
    }
    if (activeGlobalIndex > 0) {
      const prev = flatLessons[activeGlobalIndex - 1];
      if (prev) {
        void selectLesson(prev.lesson.id, prev.globalIndex);
      }
    }
  };

  const handleNext = () => {
    if (activeId === INTRO_VIEW_ID) {
      const first = flatLessons[0];
      if (first) {
        void selectLesson(first.lesson.id, 0);
      }
      return;
    }

    const nextIndex = activeGlobalIndex + 1;
    const next = flatLessons[nextIndex];
    if (!next) return;

    if (!isLessonUnlocked(nextIndex)) {
      setLockNotice(
        'Mark this lesson as complete first to unlock the next lesson in sequence.'
      );
      return;
    }
    void selectLesson(next.lesson.id, nextIndex);
  };

  const hasPrevious = activeId !== INTRO_VIEW_ID;
  const nextEntry =
    activeId === INTRO_VIEW_ID
      ? flatLessons[0] || null
      : flatLessons[activeGlobalIndex + 1] || null;
  const isNextLocked =
    activeId !== INTRO_VIEW_ID &&
    Boolean(nextEntry) &&
    !isLessonUnlocked(activeGlobalIndex + 1);

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const renderWrittenParagraphs = (content: string) => {
    const blocks = content
      .split(/\n\n+/)
      .map((b) => b.trim())
      .filter(Boolean);

    if (blocks.length === 0) {
      return (
        <p className="text-sm text-[#778397]">
          Written notes for this lesson have not been added yet.
        </p>
      );
    }

    return blocks.map((block, index) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const isList = lines.length > 1 && lines.every((l) => /^([•\-*]|\d+\.)\s+/.test(l));

      if (isList) {
        return (
          <ul key={index} className="space-y-2.5 pl-1">
            {lines.map((line, lineIdx) => (
              <li
                key={lineIdx}
                className="flex items-start gap-2.5 text-[15px] sm:text-base text-[#253449] leading-[1.7]"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#F47A24] shrink-0"
                />
                <span>{line.replace(/^([•\-*]|\d+\.)\s+/, '')}</span>
              </li>
            ))}
          </ul>
        );
      }

      return (
        <p
          key={index}
          className="text-[15px] sm:text-base text-[#253449] leading-[1.7] whitespace-pre-line"
        >
          {block}
        </p>
      );
    });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Progress Summary Header */}
      <div className="p-5 border-b border-[#E5EAF0] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#566479]">Course Progress</span>
          <span className="font-display text-sm font-extrabold text-[#102B4E] tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-[#E8EEF5] overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Course progress"
        >
          <div
            className="h-full bg-[#F47A24] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-[#778397] tabular-nums">
          <span>
            {validCompletedSet.size} of {totalLessons} lessons completed
          </span>
          {course.sequentialUnlock && <span>Sequential</span>}
        </div>
      </div>

      {/* Scrollable Module & Lesson List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E5EAF0]">
        {/* Course Introduction Link */}
        <div className="p-3">
          <button
            type="button"
            onClick={selectIntro}
            className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
              activeId === INTRO_VIEW_ID
                ? 'bg-[#102B4E] text-white'
                : 'text-[#253449] hover:bg-[#F6F8FB]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <BookOpen
                className={`w-4 h-4 shrink-0 ${
                  activeId === INTRO_VIEW_ID ? 'text-[#F47A24]' : 'text-[#566479]'
                }`}
              />
              <span className="text-sm font-semibold truncate">Course Introduction</span>
            </div>
            {activeId === INTRO_VIEW_ID && (
              <span className="text-[11px] font-semibold text-slate-200 shrink-0">Current</span>
            )}
          </button>
        </div>

        {/* Modules */}
        {course.modules
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((mod) => {
            const isExpanded = expandedModules[mod.id] !== false;
            const modCompletedCount = mod.lessons.filter((l) =>
              validCompletedSet.has(l.id)
            ).length;

            return (
              <div key={mod.id} className="p-3 space-y-1.5">
                <button
                  type="button"
                  onClick={() => toggleModuleExpand(mod.id)}
                  className="w-full min-h-[40px] px-2.5 py-2 rounded-lg flex items-start justify-between gap-2 text-left hover:bg-[#F6F8FB] transition-colors cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-[#778397] tabular-nums">
                      <span>Module 0{mod.order}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {modCompletedCount}/{mod.lessons.length} done
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#102B4E] leading-snug">
                      {mod.title}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#778397] shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#778397] shrink-0 mt-1" />
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-1 pl-1">
                    {mod.lessons
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((lesson) => {
                        const flatMatch = flatLessons.find(
                          (f) => f.lesson.id === lesson.id
                        );
                        const gIndex = flatMatch ? flatMatch.globalIndex : 0;
                        const unlocked = isLessonUnlocked(gIndex);
                        const completed = validCompletedSet.has(lesson.id);
                        const isCurrent = activeId === lesson.id;
                        const hasVideo = Boolean(
                          lesson.videoUrl &&
                            parseSafeVideoEmbed(lesson.videoUrl)?.kind !== 'invalid'
                        );

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => void selectLesson(lesson.id, gIndex)}
                            aria-current={isCurrent ? 'step' : undefined}
                            className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-[#102B4E] text-white'
                                : unlocked
                                ? 'text-[#253449] hover:bg-[#F6F8FB]'
                                : 'text-[#8B97A8] hover:bg-[#FAFBFD]'
                            }`}
                          >
                            <span className="mt-0.5 shrink-0" aria-hidden="true">
                              {completed ? (
                                <CheckCircle2
                                  className={`w-4 h-4 ${
                                    isCurrent ? 'text-emerald-300' : 'text-emerald-600'
                                  }`}
                                />
                              ) : !unlocked ? (
                                <Lock className="w-4 h-4 text-[#9AA6B8]" />
                              ) : hasVideo ? (
                                <PlayCircle
                                  className={`w-4 h-4 ${
                                    isCurrent ? 'text-[#F47A24]' : 'text-[#566479]'
                                  }`}
                                />
                              ) : (
                                <Circle
                                  className={`w-4 h-4 ${
                                    isCurrent ? 'text-[#F47A24]' : 'text-[#9AA6B8]'
                                  }`}
                                />
                              )}
                            </span>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p
                                className={`text-xs sm:text-[13px] font-semibold leading-snug ${
                                  isCurrent
                                    ? 'text-white'
                                    : unlocked
                                    ? 'text-[#102B4E]'
                                    : 'text-[#778397]'
                                }`}
                              >
                                {lesson.title}
                              </p>
                              <div
                                className={`flex flex-wrap items-center gap-x-1.5 text-[11px] tabular-nums ${
                                  isCurrent ? 'text-slate-300' : 'text-[#778397]'
                                }`}
                              >
                                <span>{hasVideo ? 'Video' : 'Written'}</span>
                                <span aria-hidden="true">·</span>
                                <span>{lesson.estimatedMinutes} min</span>
                                {isCurrent && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-semibold text-[#F47A24]">Current</span>
                                  </>
                                )}
                                {!isCurrent && completed && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="font-semibold text-emerald-700">Done</span>
                                  </>
                                )}
                                {!unlocked && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>Locked</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                    {/* Reserved Module Quiz Slot (Next Step) */}
                    <div className="px-3 py-2 flex items-center justify-between gap-2 text-[11px] text-[#8B97A8]">
                      <span>Module 0{mod.order} Quiz</span>
                      <span>Planned next</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#253449]">
      {/* Minimal Distraction-Free Player Toolbar */}
      <div className="bg-white border-b border-[#E5EAF0]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToCourseDetails}
              className="min-h-[40px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[#566479] hover:text-[#102B4E] hover:bg-[#F6F8FB] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Course Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
            <span className="h-5 w-px bg-[#E5EAF0] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-bold text-[#102B4E] truncate">
                {course.title}
              </p>
              <p className="hidden md:block text-xs text-[#778397] truncate">
                {course.categoryName} · {course.level} ·{' '}
                <span className="tabular-nums">{progressPercent}% complete</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Auto-save confirmation text */}
            <span className="hidden sm:inline text-xs text-[#778397] whitespace-nowrap">
              {isSavingProgress
                ? 'Saving progress...'
                : lastSavedLabel
                ? lastSavedLabel
                : ''}
            </span>

            {isAdmin && onOpenAdminContentManager && (
              <button
                type="button"
                onClick={onOpenAdminContentManager}
                className="min-h-[40px] px-3.5 py-2 rounded-lg border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5 text-[#F47A24]" />
                <span className="hidden sm:inline">Manage Lessons</span>
              </button>
            )}

            {/* Mobile Curriculum Drawer Toggle */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden min-h-[44px] px-3.5 py-2 rounded-xl bg-[#102B4E] text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <List className="w-4 h-4 text-[#F47A24]" />
              <span className="tabular-nums">Lessons · {progressPercent}%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Learning Workspace */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Sidebar */}
          <aside
            aria-label="Course curriculum"
            className="hidden lg:block lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]"
          >
            {sidebarContent}
          </aside>

          {/* Main Learning Content Area */}
          <main className="lg:col-span-8 xl:col-span-9 min-w-0 space-y-6">
            {lockNotice && (
              <div
                role="status"
                className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-900"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>{lockNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLockNotice(null)}
                  className="p-1 text-amber-800 hover:text-amber-950 cursor-pointer shrink-0"
                  aria-label="Dismiss notice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeId === INTRO_VIEW_ID || !activeLesson ? (
              /* COURSE INTRODUCTION VIEW */
              <motion.article
                key="course-intro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_PREMIUM }}
                className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-10 space-y-8"
              >
                <div className="space-y-3 border-b border-[#E5EAF0] pb-6">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-[#778397]">
                    <span className="font-semibold text-[#F47A24]">Course Introduction</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.modules.length} modules</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{totalLessons} lessons</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.estimatedDuration}</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#102B4E] leading-tight [text-wrap:balance]">
                    {course.courseIntroduction.headline}
                  </h1>
                  <p className="text-[15px] sm:text-base text-[#566479] leading-[1.7] max-w-[68ch]">
                    {course.courseIntroduction.overview}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h2 className="font-display text-base sm:text-lg font-bold text-[#102B4E]">
                      How to Get the Most from This Course
                    </h2>
                    <ul className="space-y-2.5">
                      {course.courseIntroduction.studyGuidance.map((tip, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-sm text-[#253449] leading-relaxed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h2 className="font-display text-base sm:text-lg font-bold text-[#102B4E]">
                      Before You Begin
                    </h2>
                    <p className="text-sm text-[#566479] leading-relaxed">
                      {course.courseIntroduction.prerequisites}
                    </p>
                    <p className="text-xs text-[#778397] leading-relaxed pt-2">
                      Your lesson completion and current position save automatically to your ABHI JOBS account so you can resume anytime.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs sm:text-sm text-[#566479]">
                    Ready to begin? Start with Lesson 1 below.
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!flatLessons[0]}
                    className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <span>
                      {validCompletedSet.size > 0
                        ? 'Go to Lesson 1'
                        : 'Start First Lesson'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.article>
            ) : (
              /* ACTIVE LESSON VIEW */
              <motion.article
                key={activeLesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE_PREMIUM }}
                className="space-y-6"
              >
                {/* Lesson Header + Optional Embedded Video Player */}
                <section className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
                  {/* Responsive 16:9 Video Player — ONLY rendered when an admin has added a real video URL */}
                  {parsedVideo && parsedVideo.kind !== 'invalid' && (
                    <div className="w-full bg-[#0B1726]">
                      <div className="relative w-full aspect-video">
                        {parsedVideo.kind === 'iframe' ? (
                          <iframe
                            src={parsedVideo.embedUrl}
                            title={activeLesson.title}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={parsedVideo.embedUrl}
                            controls
                            playsInline
                            className="absolute inset-0 w-full h-full object-contain bg-black"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-6 sm:p-8 lg:p-10 space-y-6">
                    {/* Clean Unboxed Metadata */}
                    <div className="space-y-3 border-b border-[#E5EAF0] pb-6">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-[#778397] tabular-nums">
                        {activeModule && (
                          <span className="font-semibold text-[#102B4E]">
                            Module 0{activeModule.order}: {activeModule.title}
                          </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>
                          Lesson {activeGlobalIndex + 1} of {totalLessons}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#F47A24]" />
                          <span>Est. {activeLesson.estimatedMinutes} min</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {parsedVideo && parsedVideo.kind !== 'invalid'
                            ? `Video & Reading (${parsedVideo.providerLabel})`
                            : 'Written Lesson'}
                        </span>
                        {isCurrentLessonCompleted && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </span>
                          </>
                        )}
                      </div>

                      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#102B4E] leading-tight [text-wrap:balance]">
                        {activeLesson.title}
                      </h1>

                      {activeLesson.description && (
                        <p className="text-sm sm:text-base text-[#566479] leading-relaxed max-w-[68ch]">
                          {activeLesson.description}
                        </p>
                      )}
                    </div>

                    {/* Written Learning Material */}
                    <div className="space-y-4 max-w-[68ch]">
                      <h2 className="font-display text-base sm:text-lg font-bold text-[#102B4E]">
                        Lesson Explanation
                      </h2>
                      <div className="space-y-4">
                        {renderWrittenParagraphs(activeLesson.writtenContent)}
                      </div>
                    </div>

                    {/* Admin-only subtle helper when lesson currently has no video */}
                    {isAdmin &&
                      (!parsedVideo || parsedVideo.kind === 'invalid') &&
                      onOpenAdminContentManager && (
                        <div className="pt-4 border-t border-[#E5EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#566479]">
                          <span>
                            This lesson is currently a written lesson. You can attach an embedded video URL (YouTube, Vimeo, Loom, or MP4) anytime.
                          </span>
                          <button
                            type="button"
                            onClick={onOpenAdminContentManager}
                            className="font-semibold text-[#102B4E] hover:text-[#F47A24] underline underline-offset-4 whitespace-nowrap cursor-pointer shrink-0 text-left"
                          >
                            Attach video or edit lesson
                          </button>
                        </div>
                      )}
                  </div>
                </section>

                {/* Practical Exercise / Activity Section */}
                {activeLesson.exercise && (
                  <section className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#F47A24] inline-flex items-center gap-1.5">
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>Practical Exercise</span>
                        </p>
                        <h2 className="font-display text-lg sm:text-xl font-bold text-[#102B4E]">
                          {activeLesson.exercise.title}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCheckedExercises((prev) => ({
                            ...prev,
                            [activeLesson.id]: !prev[activeLesson.id],
                          }))
                        }
                        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors border ${
                          checkedExercises[activeLesson.id]
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-[#FAFBFD] border-[#E5EAF0] text-[#566479] hover:border-[#102B4E] hover:text-[#102B4E]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {checkedExercises[activeLesson.id]
                            ? 'Exercise Practiced'
                            : 'Mark Exercise Done'}
                        </span>
                      </button>
                    </div>

                    <p className="text-sm sm:text-[15px] text-[#253449] leading-[1.7] max-w-[68ch] whitespace-pre-line">
                      {activeLesson.exercise.instructions}
                    </p>

                    {activeLesson.exercise.deliverable && (
                      <div className="pt-3 border-t border-[#E5EAF0] text-xs sm:text-sm text-[#566479]">
                        <span className="font-semibold text-[#102B4E]">Target Output: </span>
                        <span>{activeLesson.exercise.deliverable}</span>
                      </div>
                    )}
                  </section>
                )}

                {/* Downloadable Resources Section */}
                {activeLesson.attachments && activeLesson.attachments.length > 0 && (
                  <section className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-4">
                    <div className="space-y-1">
                      <h2 className="font-display text-lg font-bold text-[#102B4E]">
                        Downloadable Resources
                      </h2>
                      <p className="text-xs sm:text-sm text-[#778397]">
                        Save these reference sheets and worksheets to review offline.
                      </p>
                    </div>

                    <div className="divide-y divide-[#E5EAF0] border-y border-[#E5EAF0]">
                      {activeLesson.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <FileText className="w-4 h-4 text-[#F47A24] shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#102B4E] break-words">
                                {att.title}
                              </p>
                              <p className="text-xs text-[#778397]">
                                {att.fileType}
                                {att.sizeLabel ? ` · ${att.sizeLabel}` : ''}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              downloadLessonResource(course.title, activeLesson.title, att)
                            }
                            className="min-h-[40px] px-4 py-2 rounded-xl border border-[#D4DCE6] bg-white hover:border-[#102B4E] hover:bg-[#102B4E] text-[#102B4E] hover:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download {att.url ? att.fileType : 'PDF'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Lesson Completion & Previous / Next Lesson Controls */}
                <section className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-[#102B4E]">
                        {isCurrentLessonCompleted
                          ? 'Lesson completed'
                          : 'Finished studying this lesson?'}
                      </p>
                      <p className="text-xs text-[#778397]">
                        {isCurrentLessonCompleted
                          ? 'Your course progress is updated and saved automatically.'
                          : course.sequentialUnlock && nextEntry
                          ? 'Mark this lesson complete to update your progress and unlock the next lesson.'
                          : 'Mark this lesson complete to track your course progress.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSavingProgress}
                      onClick={() => void handleToggleComplete()}
                      className={`min-h-[46px] px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60 ${
                        isCurrentLessonCompleted
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#F47A24] hover:bg-[#DE6816] text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isCurrentLessonCompleted
                          ? 'Completed (Click to Undo)'
                          : 'Mark Lesson as Complete'}
                      </span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-[#E5EAF0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      disabled={!hasPrevious}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>
                        {activeGlobalIndex === 0
                          ? 'Course Introduction'
                          : 'Previous Lesson'}
                      </span>
                    </button>

                    {nextEntry ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                          isNextLocked
                            ? 'bg-[#E8EEF5] text-[#566479] hover:bg-[#DCE5F0]'
                            : 'bg-[#102B4E] hover:bg-[#081D36] text-white'
                        }`}
                      >
                        {isNextLocked && <Lock className="w-4 h-4 shrink-0" />}
                        <span>Next Lesson</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onBackToCourseDetails}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                      >
                        <span>Back to Course Summary</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </section>
              </motion.article>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Curriculum Slide-Over Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-[#102B4E]/45 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: EASE_PREMIUM }}
              aria-label="Course curriculum drawer"
              className="relative z-10 w-[88vw] max-w-[360px] bg-white h-full flex flex-col shadow-xl"
            >
              <div className="px-4 py-3.5 border-b border-[#E5EAF0] flex items-center justify-between gap-2">
                <p className="font-display text-sm font-bold text-[#102B4E] truncate">
                  {course.title}
                </p>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close course outline"
                  className="min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-[#566479] hover:bg-[#F6F8FB] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">{sidebarContent}</div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePlayerView;
