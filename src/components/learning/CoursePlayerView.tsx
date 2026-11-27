import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileText,
  List,
  Loader2,
  Lock,
  PlayCircle,
  Settings2,
  Unlock,
  X,
} from 'lucide-react';
import {
  AssessmentAttemptRecord,
  AssessmentSummaryItem,
  CourseAssessmentOverview,
  CourseCertificateRecord,
  CourseEnrolmentRecord,
  CourseLesson,
  LearningCourseItem,
  VideoProgressRecord,
} from '../../types/learning';
import { flattenCourseLessons } from '../../data/learningCatalog';
import {
  downloadLessonResource,
  parseSafeVideoEmbed,
} from '../../services/courseContentService';
import { evaluateCourseCompletion } from '../../services/courseEnrolmentService';
import {
  loadCourseVideoProgress,
  saveVideoPlaybackProgress,
} from '../../services/learningFirestoreService';
import { CourseAssessmentRunner } from './CourseAssessmentRunner';
import { CollapsibleStudyGuide } from './CollapsibleStudyGuide';
import {
  YouTubeTrackedPlayer,
  VideoProgressUpdatePayload,
} from './YouTubeTrackedPlayer';
import { resolveResumeLessonId } from '../../utils/courseCatalogueState';
import {
  formatModuleDisplayTitle,
  resolveModuleProgressSummary,
  resolveModuleQuizSidebarState,
  toggleAccordionModule,
} from '../../utils/courseSidebarNavigation';
import { EASE_PREMIUM } from '../../lib/motion';

interface CoursePlayerViewProps {
  course: LearningCourseItem;
  enrolment: CourseEnrolmentRecord;
  assessmentOverview: CourseAssessmentOverview | null;
  courseAttempts: AssessmentAttemptRecord[];
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  isAdmin: boolean;
  isSavingProgress: boolean;
  lastSavedLabel: string | null;
  onUpdateProgress: (params: {
    currentLessonId?: string;
    completedLessonIds: string[];
    totalLessons: number;
    requiredModuleQuizIds: string[];
  }) => Promise<void>;
  onAssessmentAttemptCompleted: (attempt: AssessmentAttemptRecord) => Promise<void>;
  onBackToCourseDetails: () => void;
  onBackToDashboard?: () => void;
  onOpenAdminContentManager?: () => void;
  certificate?: CourseCertificateRecord | null;
  isIssuingCertificate?: boolean;
  onViewCertificate?: (certificate: CourseCertificateRecord) => void;
  onDownloadCertificate?: (certificate: CourseCertificateRecord) => Promise<void>;
  onRequestCertificate?: () => Promise<void>;
}

const INTRO_VIEW_ID = '__course_intro__';
const FINAL_ASSESSMENT_VIEW_ID = '__final_assessment__';
const MODULE_QUIZ_PREFIX = '__module_quiz__:';

export const CoursePlayerView: React.FC<CoursePlayerViewProps> = ({
  course,
  enrolment,
  assessmentOverview,
  courseAttempts,
  candidateId,
  candidateName,
  candidateEmail,
  isAdmin,
  isSavingProgress,
  lastSavedLabel,
  onUpdateProgress,
  onAssessmentAttemptCompleted,
  onBackToCourseDetails,
  onBackToDashboard,
  onOpenAdminContentManager,
  certificate,
  isIssuingCertificate = false,
  onViewCertificate,
  onDownloadCertificate,
  onRequestCertificate,
}) => {
  const flatLessons = useMemo(() => flattenCourseLessons(course), [course]);
  const totalLessons = flatLessons.length;

  const sortedModules = useMemo(
    () => course.modules.slice().sort((a, b) => a.order - b.order),
    [course.modules]
  );

  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    enrolment.completedLessonIds || []
  );

  // Resume directly at the student's next incomplete unlocked module/lesson (or Module 1 for new/review)
  const [activeId, setActiveId] = useState<string>(() => {
    const resumeLessonId = resolveResumeLessonId(course, enrolment);
    if (resumeLessonId) {
      return resumeLessonId;
    }
    if (flatLessons.length > 0) {
      return flatLessons[0].lesson.id;
    }
    return INTRO_VIEW_ID;
  });

  // Single-module accordion: expand only the active module by default, keeping all other modules collapsed
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(() => {
    const resumeLessonId = resolveResumeLessonId(course, enrolment);
    if (resumeLessonId) {
      const match = flatLessons.find((item) => item.lesson.id === resumeLessonId);
      if (match) return match.module.id;
    }
    const firstActiveMod = sortedModules.find((m) => !m.isUpcomingPlaceholder);
    return firstActiveMod?.id ?? null;
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const [videoProgressById, setVideoProgressById] = useState<Record<string, VideoProgressRecord>>({});
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  useEffect(() => {
    if (Array.isArray(enrolment.completedLessonIds)) {
      setCompletedIds(enrolment.completedLessonIds);
    }
  }, [enrolment.courseId, enrolment.completedLessonIds]);

  // Load saved per-video playback progress for the authenticated student from Firestore
  useEffect(() => {
    let active = true;
    loadCourseVideoProgress(course.id)
      .then((res) => {
        if (!active) return;
        const map: Record<string, VideoProgressRecord> = {};
        res.records.forEach((rec) => {
          map[rec.videoId] = rec;
        });
        setVideoProgressById(map);
      })
      .catch(() => {
        // Non-blocking
      });
    return () => {
      active = false;
    };
  }, [course.id, candidateId]);

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

  const moduleQuizByModuleId = useMemo(() => {
    const map = new Map<string, AssessmentSummaryItem>();
    (assessmentOverview?.moduleQuizzes || []).forEach((q) => {
      if (q.moduleId) map.set(q.moduleId, q);
    });
    return map;
  }, [assessmentOverview]);

  const requiredModuleQuizIds = useMemo(() => {
    if (assessmentOverview && assessmentOverview.moduleQuizzes.length > 0) {
      return assessmentOverview.moduleQuizzes
        .filter((q) => q.requiredForCompletion && q.moduleId)
        .map((q) => q.moduleId as string);
    }
    return sortedModules
      .filter((m) => !m.isUpcomingPlaceholder && m.quizRequired !== false)
      .map((m) => m.id);
  }, [assessmentOverview, sortedModules]);

  // Combine passed module quizzes from enrolment & loaded attempts
  const passedModuleQuizSet = useMemo(() => {
    const set = new Set<string>(enrolment.passedModuleQuizIds || []);
    courseAttempts.forEach((att) => {
      if (att.assessmentType === 'module_quiz' && att.passed && att.moduleId) {
        set.add(att.moduleId);
      }
    });
    return set;
  }, [enrolment.passedModuleQuizIds, courseAttempts]);

  // Authoritative sequential unlock order: Module 1 starts unlocked; Module N+1 unlocks ONLY when Module N quiz is passed
  const effectiveUnlockedModuleOrder = useMemo(() => {
    let computed = 1;
    for (let i = 0; i < sortedModules.length; i++) {
      const mod = sortedModules[i];
      if (mod.isUpcomingPlaceholder) break;
      if (passedModuleQuizSet.has(mod.id)) {
        computed = mod.order + 1;
      } else {
        break;
      }
    }
    return Math.max(enrolment.unlockedModuleOrder ?? 1, computed);
  }, [sortedModules, passedModuleQuizSet, enrolment.unlockedModuleOrder]);

  const finalAssessmentPassed = useMemo(() => {
    if (enrolment.finalAssessmentPassed) return true;
    return courseAttempts.some(
      (att) => att.assessmentType === 'final_assessment' && att.passed
    );
  }, [enrolment.finalAssessmentPassed, courseAttempts]);

  const bestFinalScore = useMemo(() => {
    const fromAttempts = courseAttempts
      .filter((a) => a.assessmentType === 'final_assessment')
      .reduce((max, a) => Math.max(max, a.scorePercent), 0);
    const fromEnrol = enrolment.bestFinalScorePercent ?? 0;
    const best = Math.max(fromAttempts, fromEnrol);
    return best > 0 ? best : null;
  }, [courseAttempts, enrolment.bestFinalScorePercent]);

  const fmtMod = (n: number) => String(n).padStart(2, '0');
  const hasUpcomingPlaceholder = sortedModules.some((m) => m.isUpcomingPlaceholder);

  const completionState = useMemo(
    () =>
      evaluateCourseCompletion({
        completedLessonIds: Array.from(validCompletedSet),
        totalLessons,
        passedModuleQuizIds: Array.from(passedModuleQuizSet),
        requiredModuleQuizIds,
        finalAssessmentPassed,
        requiresFinalAssessment:
          Boolean(assessmentOverview?.finalAssessment) || hasUpcomingPlaceholder,
        hasCurrentLesson: Boolean(enrolment.currentLessonId),
      }),
    [
      validCompletedSet,
      totalLessons,
      passedModuleQuizSet,
      requiredModuleQuizIds,
      finalAssessmentPassed,
      assessmentOverview?.finalAssessment,
      hasUpcomingPlaceholder,
      enrolment.currentLessonId,
    ]
  );

  const progressPercent = completionState.progressPercent;

  // Helper: are all lessons in a specific module completed?
  const isModuleLessonsComplete = (moduleId: string): boolean => {
    const mod = sortedModules.find((m) => m.id === moduleId);
    if (!mod || mod.lessons.length === 0) return false;
    return mod.lessons.every((l) => validCompletedSet.has(l.id));
  };

  // Strict student progression: NO client-side bypass (applies equally to all learners)
  const isModuleQuizUnlocked = (moduleId: string): boolean => {
    if (passedModuleQuizSet.has(moduleId)) return true;
    const mod = sortedModules.find((m) => m.id === moduleId);
    if (mod && mod.order > effectiveUnlockedModuleOrder) return false;
    return isModuleLessonsComplete(moduleId);
  };

  const isFinalAssessmentUnlocked =
    Boolean(assessmentOverview?.finalAssessment) &&
    (finalAssessmentPassed ||
      (completionState.allLessonsCompleted && completionState.allRequiredQuizzesPassed));

  const isLessonUnlocked = (globalIndex: number): boolean => {
    if (!course.sequentialUnlock || globalIndex <= 0) return true;
    const entry = flatLessons[globalIndex];
    if (!entry) return false;
    if (entry.module.order > effectiveUnlockedModuleOrder) return false;
    if (validCompletedSet.has(entry.lesson.id)) return true;
    const prevLesson = flatLessons[globalIndex - 1]?.lesson;
    return Boolean(prevLesson && validCompletedSet.has(prevLesson.id));
  };

  const isViewingModuleQuiz = activeId.startsWith(MODULE_QUIZ_PREFIX);
  const activeModuleQuizId = isViewingModuleQuiz
    ? activeId.slice(MODULE_QUIZ_PREFIX.length)
    : null;
  const activeModuleQuizSummary = activeModuleQuizId
    ? moduleQuizByModuleId.get(activeModuleQuizId) || null
    : null;
  const isViewingFinalAssessment = activeId === FINAL_ASSESSMENT_VIEW_ID;

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

  // Check if the current active lesson is the last lesson in its module (so we can prompt Module Quiz)
  const isLastLessonOfModule = useMemo(() => {
    if (!activeLesson || !activeModule) return false;
    const orderedModLessons = activeModule.lessons
      .slice()
      .sort((a, b) => a.order - b.order);
    return orderedModLessons[orderedModLessons.length - 1]?.id === activeLesson.id;
  }, [activeLesson, activeModule]);

  const selectLesson = async (lessonId: string, globalIndex: number) => {
    if (!isLessonUnlocked(globalIndex)) {
      const targetEntry = flatLessons[globalIndex];
      if (targetEntry && targetEntry.module.order > effectiveUnlockedModuleOrder) {
        setLockNotice(
          `Pass the Module ${fmtMod(targetEntry.module.order - 1)} Quiz (70%+) first to unlock Module ${fmtMod(targetEntry.module.order)}.`
        );
      } else {
        const prevTitle = flatLessons[globalIndex - 1]?.lesson.title || 'the previous lesson';
        setLockNotice(`Complete "${prevTitle}" first to unlock this lesson.`);
      }
      return;
    }

    setLockNotice(null);
    setActiveId(lessonId);
    const selectedEntry = flatLessons[globalIndex];
    if (selectedEntry) {
      setExpandedModuleId(selectedEntry.module.id);
    }
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    await onUpdateProgress({
      currentLessonId: lessonId,
      completedLessonIds: Array.from(validCompletedSet),
      totalLessons,
      requiredModuleQuizIds,
    });
  };

  const selectIntro = () => {
    setLockNotice(null);
    setActiveId(INTRO_VIEW_ID);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectModuleQuiz = (moduleId: string, moduleTitle: string) => {
    if (!isModuleQuizUnlocked(moduleId)) {
      const mod = sortedModules.find((m) => m.id === moduleId);
      if (mod && mod.order > effectiveUnlockedModuleOrder) {
        setLockNotice(
          `Pass the Module ${fmtMod(mod.order - 1)} Quiz (70%+) first to unlock Module ${fmtMod(mod.order)}.`
        );
      } else if (mod) {
        setLockNotice(
          `Watch at least 90% of the Module ${fmtMod(mod.order)} video first to unlock the Module ${fmtMod(mod.order)} Quiz.`
        );
      } else {
        setLockNotice(
          `Complete all lessons in "${moduleTitle}" to unlock its Module Quiz.`
        );
      }
      return;
    }
    setLockNotice(null);
    setExpandedModuleId(moduleId);
    setActiveId(`${MODULE_QUIZ_PREFIX}${moduleId}`);
    setMobileDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectFinalAssessment = () => {
    setLockNotice(null);
    setActiveId(FINAL_ASSESSMENT_VIEW_ID);
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
      requiredModuleQuizIds,
    });
  };

  const handleVideoProgressSave = async (
    lessonId: string,
    payload: VideoProgressUpdatePayload,
    triggerLessonUnlock = false
  ) => {
    setIsSavingVideo(true);
    try {
      const saveRes = await saveVideoPlaybackProgress({
        courseId: course.id,
        lessonId,
        videoId: payload.videoId,
        youtubeVideoId: payload.youtubeVideoId,
        durationSeconds: payload.durationSeconds,
        watchedSeconds: payload.watchedSeconds,
        maxPercentWatched: payload.maxPercentWatched,
        lastPositionSeconds: payload.lastPositionSeconds,
        hasPlayed: payload.hasPlayed,
        completedViaPlayer: payload.completedViaPlayer,
        manualCompleted: payload.manualCompleted,
      });

      if (saveRes.success && saveRes.record) {
        setVideoProgressById((prev) => ({
          ...prev,
          [payload.videoId]: saveRes.record!,
        }));
      }

      if (triggerLessonUnlock && !validCompletedSet.has(lessonId)) {
        const nextSet = new Set(validCompletedSet);
        nextSet.add(lessonId);
        const nextList = Array.from(nextSet);
        setCompletedIds(nextList);
        setLockNotice(null);

        await onUpdateProgress({
          currentLessonId: lessonId,
          completedLessonIds: nextList,
          totalLessons,
          requiredModuleQuizIds,
        });
      }
    } finally {
      setIsSavingVideo(false);
    }
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

    if (
      activeModule &&
      isLastLessonOfModule &&
      moduleQuizByModuleId.has(activeModule.id) &&
      !passedModuleQuizSet.has(activeModule.id)
    ) {
      if (!isModuleQuizUnlocked(activeModule.id)) {
        setLockNotice(
          'Watch at least 90% of the Module video above first to unlock the Module Quiz.'
        );
        return;
      }
      selectModuleQuiz(activeModule.id, activeModule.title);
      return;
    }

    const nextIndex = activeGlobalIndex + 1;
    const next = flatLessons[nextIndex];
    if (!next) {
      if (assessmentOverview?.finalAssessment) {
        selectFinalAssessment();
      }
      return;
    }

    if (!isLessonUnlocked(nextIndex)) {
      setLockNotice(
        'Complete the current module and pass its quiz (70%+) to unlock the next module.'
      );
      return;
    }
    void selectLesson(next.lesson.id, nextIndex);
  };

  const getContinueActionAfterModuleQuiz = (moduleId: string) => {
    const modIndex = sortedModules.findIndex((m) => m.id === moduleId);
    const currentMod = modIndex >= 0 ? sortedModules[modIndex] : null;
    const nextMod = modIndex >= 0 ? sortedModules[modIndex + 1] : null;
    if (nextMod && !nextMod.isUpcomingPlaceholder && nextMod.lessons.length > 0) {
      const firstNextLesson = nextMod.lessons
        .slice()
        .sort((a, b) => a.order - b.order)[0];
      const flatMatch = flatLessons.find((f) => f.lesson.id === firstNextLesson.id);
      if (flatMatch) {
        return {
          label: `Continue to Module ${fmtMod(nextMod.order)}`,
          action: () => void selectLesson(flatMatch.lesson.id, flatMatch.globalIndex),
        };
      }
    }
    if (nextMod?.isUpcomingPlaceholder) {
      const currentFirstLesson = currentMod?.lessons
        .slice()
        .sort((a, b) => a.order - b.order)[0];
      const currentMatch = currentFirstLesson
        ? flatLessons.find((f) => f.lesson.id === currentFirstLesson.id)
        : flatLessons[0];
      return {
        label: `Back to Module ${fmtMod(currentMod?.order ?? 1)} (Module ${fmtMod(nextMod.order)} Unlocked)`,
        action: () => {
          if (currentMatch) {
            void selectLesson(currentMatch.lesson.id, currentMatch.globalIndex);
          } else {
            onBackToCourseDetails();
          }
        },
      };
    }
    if (assessmentOverview?.finalAssessment) {
      return {
        label: 'Proceed to Final Assessment',
        action: () => selectFinalAssessment(),
      };
    }
    return {
      label: 'Return to Course Overview',
      action: () => onBackToCourseDetails(),
    };
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
    setExpandedModuleId((prev) => toggleAccordionModule(prev, moduleId));
  };

  const getBestScoreForModuleQuiz = (moduleId: string): number | null => {
    const scores = courseAttempts
      .filter((a) => a.assessmentType === 'module_quiz' && a.moduleId === moduleId)
      .map((a) => a.scorePercent);
    return scores.length > 0 ? Math.max(...scores) : null;
  };

  const getAttemptCountForModuleQuiz = (moduleId: string): number =>
    courseAttempts.filter(
      (a) => a.assessmentType === 'module_quiz' && a.moduleId === moduleId
    ).length;

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

  const passedRequiredCount = requiredModuleQuizIds.filter((id) =>
    passedModuleQuizSet.has(id)
  ).length;

  const renderActiveModuleQuizCard = () => {
    if (!activeModule || !moduleQuizByModuleId.has(activeModule.id)) {
      return null;
    }

    const activeModOrder = activeModule.order;
    const nextModOrder = activeModOrder + 1;
    const nextModObj = sortedModules.find((m) => m.order === nextModOrder);
    const nextModFirstLesson =
      nextModObj && !nextModObj.isUpcomingPlaceholder && nextModObj.lessons.length > 0
        ? nextModObj.lessons.slice().sort((a, b) => a.order - b.order)[0]
        : null;
    const nextModFlatMatch = nextModFirstLesson
      ? flatLessons.find((f) => f.lesson.id === nextModFirstLesson.id)
      : null;
    const modPassed = passedModuleQuizSet.has(activeModule.id);
    const modQuizUnlocked = isModuleQuizUnlocked(activeModule.id);
    const bestScore = getBestScoreForModuleQuiz(activeModule.id);
    const hasFailedAttempt = !modPassed && bestScore !== null;
    const quizMeta = moduleQuizByModuleId.get(activeModule.id);
    const qCount = quizMeta?.questionCount ?? 10;
    const passPct = quizMeta?.passPercentage ?? 70;
    const passNeeded = Math.ceil((qCount * passPct) / 100);

    const hasNextModule = Boolean(nextModObj);

    return (
      <section
        className={`rounded-xl border p-5 sm:p-6 space-y-4 ${
          modPassed
            ? 'bg-emerald-50/50 border-emerald-200'
            : hasFailedAttempt
            ? 'bg-amber-50/60 border-amber-200'
            : modQuizUnlocked
            ? 'bg-[#FFF8F2] border-[#F47A24]/40'
            : 'bg-white border-[#E5EAF0]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {modPassed ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {hasNextModule
                      ? `Module ${fmtMod(activeModOrder)} Passed · Module ${fmtMod(nextModOrder)} Unlocked`
                      : `Module ${fmtMod(activeModOrder)} Passed · Course Completed!`}
                  </span>
                </span>
              ) : hasFailedAttempt ? (
                <span className="inline-flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    Not Yet Passed (Best {bestScore}%) — Unlimited Retakes Available
                  </span>
                </span>
              ) : modQuizUnlocked ? (
                <span className="inline-flex items-center gap-1.5 text-[#F47A24]">
                  <Unlock className="w-4 h-4" />
                  <span>Video Completed — Quiz Unlocked</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <Lock className="w-4 h-4" />
                  <span>Locked Until Video Reaches 90%</span>
                </span>
              )}
            </div>

            <h2 className="font-display text-lg sm:text-xl font-bold text-[#102B4E]">
              Module {fmtMod(activeModOrder)} Quiz: {qCount} Questions (Pass {passPct}%+)
            </h2>

            <p className="text-xs sm:text-sm text-[#566479] leading-relaxed">
              {modPassed
                ? hasNextModule
                  ? `Best score: ${bestScore ?? passPct}%. Module ${fmtMod(nextModOrder)} is now unlocked for your account. You may retake the quiz anytime to review.`
                  : `Best score: ${bestScore ?? passPct}%. Congratulations — you have passed the final module and completed ${course.title}!`
                : hasFailedAttempt
                ? hasNextModule
                  ? `Your best attempt so far is ${bestScore}%. Score at least ${passPct}% (${passNeeded}/${qCount}) to pass Module ${fmtMod(activeModOrder)} and unlock Module ${fmtMod(nextModOrder)}. Review the study material and try again.`
                  : `Your best attempt so far is ${bestScore}%. Score at least ${passPct}% (${passNeeded}/${qCount}) to pass Module ${fmtMod(activeModOrder)} and complete the course. Review the study material and try again.`
                : modQuizUnlocked
                ? hasNextModule
                  ? `Complete all ${qCount} multiple-choice questions and score at least ${passPct}% (${passNeeded}/${qCount}) to pass Module ${fmtMod(activeModOrder)} and unlock Module ${fmtMod(nextModOrder)}. Unlimited retakes allowed.`
                  : `Complete all ${qCount} multiple-choice questions and score at least ${passPct}% (${passNeeded}/${qCount}) to pass Module ${fmtMod(activeModOrder)} and complete ${course.title}. Unlimited retakes allowed.`
                : `Watch at least 90% of the embedded video above to automatically unlock the ${qCount}-question Module ${fmtMod(activeModOrder)} Quiz.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {modPassed && nextModFlatMatch && (
              <button
                type="button"
                onClick={() =>
                  void selectLesson(
                    nextModFlatMatch.lesson.id,
                    nextModFlatMatch.globalIndex
                  )
                }
                className="min-h-[42px] px-4 py-2 rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
              >
                <span>Continue to Module {fmtMod(nextModOrder)}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                selectModuleQuiz(activeModule.id, activeModule.title)
              }
              className={`min-h-[42px] px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                modQuizUnlocked
                  ? 'bg-[#102B4E] hover:bg-[#081D36] text-white'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {!modQuizUnlocked && <Lock className="w-4 h-4 shrink-0" />}
              <ClipboardCheck className="w-4 h-4 shrink-0 text-[#F47A24]" />
              <span>
                {modPassed
                  ? `Retake Module ${fmtMod(activeModOrder)} Quiz`
                  : bestScore !== null
                  ? `Retake Quiz (Best ${bestScore}%)`
                  : modQuizUnlocked
                  ? `Start Module ${fmtMod(activeModOrder)} Quiz`
                  : 'Quiz Locked'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </section>
    );
  };

  const handleSidebarBack = () => {
    setMobileDrawerOpen(false);
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      onBackToCourseDetails();
    }
  };

  const renderSidebarContent = (isMobileDrawer: boolean) => (
    <div className="flex flex-col flex-auto min-h-0 overflow-hidden">
      {/* Fixed Non-Overlapping Course Sidebar Header */}
      <div
        className={`shrink-0 bg-white border-b border-[#E5EAF0] ${
          isMobileDrawer ? 'px-4 py-3 space-y-2.5' : 'px-4 py-3.5 sm:px-5 sm:py-4 space-y-3'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleSidebarBack}
            className="min-h-[36px] -ml-1.5 px-2 py-1 rounded-lg text-xs font-semibold text-[#566479] hover:text-[#102B4E] hover:bg-[#F6F8FB] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={selectIntro}
              className={`min-h-[36px] px-2 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                activeId === INTRO_VIEW_ID
                  ? 'bg-[#102B4E] text-white'
                  : 'text-[#566479] hover:text-[#102B4E] hover:bg-[#F6F8FB]'
              }`}
              title="Course Introduction"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Intro</span>
            </button>

            {isMobileDrawer && (
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close course outline"
                className="min-w-[40px] min-h-[40px] -mr-1.5 rounded-lg flex items-center justify-center text-[#566479] hover:text-[#102B4E] hover:bg-[#F6F8FB] cursor-pointer transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-sm font-bold text-[#102B4E] leading-snug line-clamp-2 min-w-0">
              {course.title}
            </h2>
            <span className="font-display text-xs font-extrabold text-[#102B4E] tabular-nums shrink-0 pt-0.5">
              {progressPercent}%
            </span>
          </div>

          <div
            className="h-1.5 w-full rounded-full bg-[#E8EEF5] overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Course progress"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                completionState.isCourseCompleted ? 'bg-emerald-600' : 'bg-[#F47A24]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-1 text-[11px] text-[#778397] tabular-nums">
            <div className="flex items-center justify-between gap-2">
              <span>
                Lessons: {validCompletedSet.size}/{totalLessons}
              </span>
              <span>
                Quizzes: {passedRequiredCount}/{requiredModuleQuizIds.length}
              </span>
            </div>
            {!isMobileDrawer &&
              (assessmentOverview?.finalAssessment ? (
                <div className="flex items-center justify-between">
                  <span>
                    Final Assessment:{' '}
                    <strong
                      className={
                        finalAssessmentPassed ? 'text-emerald-700' : 'text-[#566479]'
                      }
                    >
                      {finalAssessmentPassed
                        ? `Passed${bestFinalScore ? ` (${bestFinalScore}%)` : ''}`
                        : 'Required (70%+)'}
                    </strong>
                  </span>
                </div>
              ) : (() => {
                if (completionState.isCourseCompleted) {
                  return (
                    <div className="flex items-center justify-between">
                      <span>
                        Status:{' '}
                        <strong className="text-emerald-700">Completed</strong>
                      </span>
                    </div>
                  );
                }
                const nextLockedMod = sortedModules.find(
                  (m) => m.order > effectiveUnlockedModuleOrder
                );
                const highestPlaceholder = sortedModules.find((m) => m.isUpcomingPlaceholder);
                const targetModOrder =
                  nextLockedMod?.order ?? highestPlaceholder?.order ?? sortedModules.length;
                const targetUnlocked = effectiveUnlockedModuleOrder >= targetModOrder;
                return (
                  <div className="flex items-center justify-between">
                    <span>
                      Module {fmtMod(targetModOrder)}:{' '}
                      <strong
                        className={
                          targetUnlocked ? 'text-emerald-700' : 'text-[#566479]'
                        }
                      >
                        {targetUnlocked
                          ? 'Unlocked'
                          : `Locked (Pass M${fmtMod(targetModOrder - 1)} 70%+)`}
                      </strong>
                    </span>
                  </div>
                );
              })())}
          </div>
        </div>
      </div>

      {/* Scrollable Modules-Only Accordion Navigation */}
      <nav
        aria-label="Course modules"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain course-sidebar-scroll p-2.5 sm:p-3 space-y-1.5"
      >
        {sortedModules.map((mod) => {
          if (mod.isUpcomingPlaceholder) {
            const isPlaceholderUnlocked = effectiveUnlockedModuleOrder >= mod.order;
            const prevModOrder = Math.max(1, mod.order - 1);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setLockNotice(
                    isPlaceholderUnlocked
                      ? `Module ${fmtMod(mod.order)} is unlocked! Module ${fmtMod(prevModOrder)} has been completed and passed.`
                      : `Module ${fmtMod(mod.order)} is locked. Watch the Module ${fmtMod(prevModOrder)} video (90%+) and score at least 70% on the Module ${fmtMod(prevModOrder)} Quiz to unlock it.`
                  );
                  setMobileDrawerOpen(false);
                }}
                className={`w-full min-h-[48px] px-3 py-2.5 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer border ${
                  isPlaceholderUnlocked
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-[#FAFBFD] border-[#E5EAF0] text-[#778397]'
                }`}
              >
                <span className="mt-0.5 shrink-0" aria-hidden="true">
                  {isPlaceholderUnlocked ? (
                    <Unlock className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-[#9AA6B8]" />
                  )}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-[13px] font-bold leading-snug text-[#102B4E]">
                    {formatModuleDisplayTitle(
                      mod.order,
                      mod.title || (isPlaceholderUnlocked ? 'Ready Next' : 'Upcoming Module')
                    )}
                  </p>
                  <p className="text-[11px]">
                    {isPlaceholderUnlocked
                      ? `Unlocked · M${fmtMod(prevModOrder)} passed`
                      : `Locked · Pass M${fmtMod(prevModOrder)} Quiz (70%+)`}
                  </p>
                </div>
              </button>
            );
          }

          const isExpanded = expandedModuleId === mod.id;
          const isActiveModule =
            activeModule?.id === mod.id || activeModuleQuizId === mod.id;
          const isModuleLocked =
            Boolean(course.sequentialUnlock) && mod.order > effectiveUnlockedModuleOrder;

          const orderedLessons = mod.lessons.slice().sort((a, b) => a.order - b.order);
          const modCompletedCount = orderedLessons.filter((l) =>
            validCompletedSet.has(l.id)
          ).length;

          const modQuiz = moduleQuizByModuleId.get(mod.id);
          const quizPassed = passedModuleQuizSet.has(mod.id);
          const quizUnlocked = isModuleQuizUnlocked(mod.id);
          const quizBestScore = getBestScoreForModuleQuiz(mod.id);
          const quizAttemptCount = getAttemptCountForModuleQuiz(mod.id);
          const isCurrentQuiz = activeId === `${MODULE_QUIZ_PREFIX}${mod.id}`;

          const hasVideoLessons = orderedLessons.some(
            (lesson) =>
              (lesson.videos && lesson.videos.length > 0) ||
              Boolean(
                lesson.videoUrl && parseSafeVideoEmbed(lesson.videoUrl)?.kind !== 'invalid'
              )
          );

          const progressSummary = resolveModuleProgressSummary({
            completedLessons: modCompletedCount,
            totalLessons: orderedLessons.length,
            hasQuiz: Boolean(modQuiz),
            quizPassed,
          });

          const quizSidebarState = modQuiz
            ? resolveModuleQuizSidebarState({
                moduleOrder: mod.order,
                isModuleLocked,
                isQuizUnlocked: quizUnlocked,
                isQuizPassed: quizPassed,
                bestScorePercent: quizBestScore,
                attemptCount: quizAttemptCount,
                questionCount: modQuiz.questionCount,
                requiresVideoWatch: hasVideoLessons,
              })
            : null;

          const moduleHeading = formatModuleDisplayTitle(mod.order, mod.title);

          return (
            <div
              key={mod.id}
              className={`rounded-xl border transition-colors ${
                isActiveModule
                  ? 'border-[#102B4E]/25 bg-[#F4F7FC]'
                  : isExpanded
                  ? 'border-[#D4DCE6] bg-[#FAFBFD]'
                  : 'border-transparent bg-white hover:border-[#E5EAF0] hover:bg-[#FAFBFD]'
              }`}
            >
              {/* Module Header (Click expands this module and collapses others) */}
              <button
                type="button"
                onClick={() => toggleModuleExpand(mod.id)}
                aria-expanded={isExpanded}
                className="w-full min-h-[48px] px-3 py-2.5 rounded-xl flex items-start justify-between gap-2.5 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="mt-0.5 shrink-0" aria-hidden="true">
                    {progressSummary.isModuleCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isActiveModule ? (
                      <PlayCircle className="w-4 h-4 text-[#F47A24]" />
                    ) : isModuleLocked ? (
                      <Lock className="w-3.5 h-3.5 text-[#9AA6B8] mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#9AA6B8]" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p
                      className={`text-[13px] font-bold leading-snug break-words ${
                        isActiveModule || !isModuleLocked
                          ? 'text-[#102B4E]'
                          : 'text-[#566479]'
                      }`}
                    >
                      {moduleHeading}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-[#778397] tabular-nums">
                      {progressSummary.isModuleCompleted ? (
                        <span className="font-semibold text-emerald-700">Completed</span>
                      ) : isModuleLocked ? (
                        <span>Locked</span>
                      ) : (
                        <span>{progressSummary.progressText}</span>
                      )}

                      {quizSidebarState && !progressSummary.isModuleCompleted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              quizSidebarState.status === 'passed'
                                ? 'font-semibold text-emerald-700'
                                : quizSidebarState.status === 'failed'
                                ? 'font-semibold text-amber-700'
                                : quizSidebarState.status === 'available'
                                ? 'font-semibold text-[#F47A24]'
                                : 'text-[#778397]'
                            }
                          >
                            Quiz {quizSidebarState.statusLabel}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span className="mt-0.5 shrink-0 text-[#778397]" aria-hidden="true">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#102B4E]" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {/* Expanded Module Content: Lessons followed by Associated Module Quiz */}
              {isExpanded && (
                <div className="px-2 pb-2.5 pt-1.5 mx-1 border-t border-[#E5EAF0]/90 space-y-1">
                  {orderedLessons.map((lesson) => {
                    const flatMatch = flatLessons.find(
                      (f) => f.lesson.id === lesson.id
                    );
                    const gIndex = flatMatch ? flatMatch.globalIndex : 0;
                    const unlocked = isLessonUnlocked(gIndex);
                    const completed = validCompletedSet.has(lesson.id);
                    const isCurrent = activeId === lesson.id;
                    const hasVideo = Boolean(
                      (lesson.videos && lesson.videos.length > 0) ||
                        (lesson.videoUrl &&
                          parseSafeVideoEmbed(lesson.videoUrl)?.kind !== 'invalid')
                    );

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => void selectLesson(lesson.id, gIndex)}
                        aria-current={isCurrent ? 'step' : undefined}
                        className={`w-full min-h-[44px] px-2.5 py-2 rounded-lg text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#102B4E] text-white'
                            : unlocked
                            ? 'text-[#253449] hover:bg-white'
                            : 'text-[#8B97A8] hover:bg-white/70'
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
                            <Lock className="w-3.5 h-3.5 text-[#9AA6B8] mt-0.5" />
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
                            className={`text-xs font-semibold leading-snug break-words ${
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

                  {/* Associated Module Quiz (belongs visually & functionally inside its module) */}
                  {modQuiz && quizSidebarState && (
                    <div className="pt-1.5 mt-1.5 border-t border-[#E5EAF0]">
                      <button
                        type="button"
                        onClick={() => selectModuleQuiz(mod.id, mod.title)}
                        aria-current={isCurrentQuiz ? 'step' : undefined}
                        className={`w-full min-h-[44px] px-2.5 py-2 rounded-lg text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                          isCurrentQuiz
                            ? 'bg-[#102B4E] text-white'
                            : quizSidebarState.status === 'available'
                            ? 'bg-white border border-[#F47A24]/40 hover:border-[#F47A24] text-[#102B4E]'
                            : quizSidebarState.status === 'passed'
                            ? 'bg-emerald-50/70 border border-emerald-200/80 hover:border-emerald-300 text-[#102B4E]'
                            : quizSidebarState.status === 'failed'
                            ? 'bg-amber-50/70 border border-amber-200/80 hover:border-amber-300 text-[#102B4E]'
                            : 'text-[#8B97A8] hover:bg-white/70'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0" aria-hidden="true">
                          {quizSidebarState.status === 'passed' ? (
                            <CheckCircle2
                              className={`w-4 h-4 ${
                                isCurrentQuiz ? 'text-emerald-300' : 'text-emerald-600'
                              }`}
                            />
                          ) : quizSidebarState.status === 'failed' ? (
                            <AlertCircle
                              className={`w-4 h-4 ${
                                isCurrentQuiz ? 'text-amber-300' : 'text-amber-600'
                              }`}
                            />
                          ) : quizSidebarState.status === 'available' ? (
                            <ClipboardCheck className="w-4 h-4 text-[#F47A24]" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-[#9AA6B8] mt-0.5" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-xs font-bold leading-snug ${
                                isCurrentQuiz
                                  ? 'text-white'
                                  : quizSidebarState.status !== 'locked'
                                  ? 'text-[#102B4E]'
                                  : 'text-[#778397]'
                              }`}
                            >
                              Module {fmtMod(mod.order)} Quiz
                            </p>
                            <span
                              className={`text-[11px] font-semibold shrink-0 ${
                                isCurrentQuiz
                                  ? quizSidebarState.status === 'passed'
                                    ? 'text-emerald-300'
                                    : quizSidebarState.status === 'failed'
                                    ? 'text-amber-300'
                                    : 'text-[#F47A24]'
                                  : quizSidebarState.status === 'passed'
                                  ? 'text-emerald-700'
                                  : quizSidebarState.status === 'failed'
                                  ? 'text-amber-700'
                                  : quizSidebarState.status === 'available'
                                  ? 'text-[#F47A24]'
                                  : 'text-[#778397]'
                              }`}
                            >
                              {quizSidebarState.statusLabel}
                            </span>
                          </div>

                          <div
                            className={`flex flex-wrap items-center gap-x-1.5 text-[11px] tabular-nums ${
                              isCurrentQuiz ? 'text-slate-300' : 'text-[#778397]'
                            }`}
                          >
                            <span>{quizSidebarState.detailLabel}</span>
                            {quizSidebarState.actionLabel && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span
                                  className={`font-semibold ${
                                    isCurrentQuiz
                                      ? 'text-[#F47A24]'
                                      : quizSidebarState.status === 'available'
                                      ? 'text-[#F47A24]'
                                      : 'text-[#102B4E]'
                                  }`}
                                >
                                  {quizSidebarState.actionLabel}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Final Course Assessment Entry (shown only when configured) */}
        {assessmentOverview?.finalAssessment && (
          <div className="pt-2 mt-2 border-t border-[#E5EAF0]">
            <button
              type="button"
              onClick={selectFinalAssessment}
              aria-current={isViewingFinalAssessment ? 'step' : undefined}
              className={`w-full min-h-[50px] px-3 py-2.5 rounded-xl text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                isViewingFinalAssessment
                  ? 'bg-[#102B4E] text-white'
                  : isFinalAssessmentUnlocked
                  ? 'bg-[#FFF8F2] border border-[#F47A24]/40 hover:border-[#F47A24] text-[#102B4E]'
                  : 'bg-[#FAFBFD] border border-[#E5EAF0] text-[#778397] hover:border-[#CBD5E1]'
              }`}
            >
              <span className="mt-0.5 shrink-0" aria-hidden="true">
                {finalAssessmentPassed ? (
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      isViewingFinalAssessment ? 'text-emerald-300' : 'text-emerald-600'
                    }`}
                  />
                ) : !isFinalAssessmentUnlocked ? (
                  <Lock className="w-4 h-4 text-[#9AA6B8]" />
                ) : (
                  <Award className="w-4 h-4 text-[#F47A24]" />
                )}
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p
                  className={`text-xs sm:text-[13px] font-bold leading-snug ${
                    isViewingFinalAssessment
                      ? 'text-white'
                      : isFinalAssessmentUnlocked
                      ? 'text-[#102B4E]'
                      : 'text-[#566479]'
                  }`}
                >
                  Final Course Assessment
                </p>
                <div
                  className={`flex flex-wrap items-center gap-x-1.5 text-[11px] tabular-nums ${
                    isViewingFinalAssessment ? 'text-slate-300' : 'text-[#778397]'
                  }`}
                >
                  <span>
                    {assessmentOverview.finalAssessment.questionCount} questions
                  </span>
                  <span aria-hidden="true">·</span>
                  {finalAssessmentPassed ? (
                    <span
                      className={
                        isViewingFinalAssessment
                          ? 'font-semibold text-emerald-300'
                          : 'font-semibold text-emerald-700'
                      }
                    >
                      Passed{bestFinalScore ? ` (${bestFinalScore}%)` : ''}
                    </span>
                  ) : isFinalAssessmentUnlocked ? (
                    <span className="font-semibold text-[#F47A24]">
                      Available · Start
                    </span>
                  ) : (
                    <span>Locked</span>
                  )}
                </div>
              </div>
            </button>
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#253449]">
      {/* Minimal Distraction-Free Player Toolbar */}
      <div className="bg-white border-b border-[#E5EAF0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToCourseDetails}
              className="min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-[#566479] hover:text-[#102B4E] hover:bg-[#F6F8FB] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Course Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
            <span className="h-5 w-px bg-[#E5EAF0] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm sm:text-[15px] font-bold text-[#102B4E] truncate">
                {course.title}
              </p>
              <p className="hidden md:block text-xs text-[#778397] truncate">
                {course.categoryName} · {course.level} ·{' '}
                <span className="tabular-nums">
                  {completionState.isCourseCompleted
                    ? 'Course Completed (100%)'
                    : `${progressPercent}% complete`}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
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
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#D4DCE6] bg-white hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5 text-[#F47A24]" />
                <span className="hidden sm:inline">Manage Course</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden min-h-[44px] px-3.5 py-2 rounded-lg bg-[#102B4E] text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <List className="w-4 h-4 text-[#F47A24]" />
              <span className="tabular-nums">Outline · {progressPercent}%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Learning Workspace */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Desktop Sidebar (310px fixed width, clean header + scrollable modules accordion) */}
          <aside
            aria-label="Course curriculum"
            className="hidden lg:flex lg:flex-col lg:w-[310px] lg:shrink-0 bg-white rounded-xl border border-[#E5EAF0] overflow-hidden lg:sticky lg:top-[84px] lg:max-h-[calc(100vh-6rem)]"
          >
            {renderSidebarContent(false)}
          </aside>

          {/* Main Learning Content Area */}
          <main className="flex-1 min-w-0 space-y-5">
            {/* Course Completed & Certificate Banner */}
            {completionState.isCourseCompleted && (
              <div className="rounded-xl bg-white border border-emerald-200 px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-5 h-5 text-[#C59B43]" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-bold text-[#102B4E]">
                      {certificate
                        ? 'Course Completed — Official Certificate Ready'
                        : `Course Completed — Congratulations on Finishing ${course.title}!`}
                    </p>
                    <p className="text-xs text-[#566479] leading-relaxed">
                      {assessmentOverview?.finalAssessment
                        ? `You completed all ${totalLessons} lessons, passed all required module quizzes, and passed the Final Course Assessment${bestFinalScore ? ` with ${bestFinalScore}%` : ''}.`
                        : `You completed all ${totalLessons} modules and passed all ${requiredModuleQuizIds.length} module quizzes (70%+).`}
                      {certificate ? (
                        <span className="font-semibold text-[#102B4E] tabular-nums">
                          {' '}
                          Certificate ID: {certificate.certificateId}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {certificate ? (
                    <>
                      {onViewCertificate && (
                        <button
                          type="button"
                          onClick={() => onViewCertificate(certificate)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C59B43]" />
                          <span>View Certificate</span>
                        </button>
                      )}
                      {onDownloadCertificate && (
                        <button
                          type="button"
                          onClick={() => void onDownloadCertificate(certificate)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-[#D4DCE6] hover:border-[#102B4E] text-[#102B4E] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      )}
                    </>
                  ) : onRequestCertificate ? (
                    <button
                      type="button"
                      disabled={isIssuingCertificate}
                      onClick={() => void onRequestCertificate()}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors disabled:opacity-60"
                    >
                      {isIssuingCertificate ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Issuing Certificate...</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-3.5 h-3.5 text-[#C59B43]" />
                          <span>Generate Certificate</span>
                        </>
                      )}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={onBackToCourseDetails}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] text-[#566479] hover:text-[#102B4E] text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Course Summary
                  </button>
                </div>
              </div>
            )}

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

            {/* VIEW A: MODULE QUIZ */}
            {isViewingModuleQuiz && activeModuleQuizSummary ? (
              <CourseAssessmentRunner
                key={activeModuleQuizSummary.id}
                assessment={activeModuleQuizSummary}
                candidateId={candidateId}
                candidateName={candidateName}
                candidateEmail={candidateEmail}
                pastAttempts={courseAttempts.filter(
                  (a) =>
                    a.assessmentType === 'module_quiz' &&
                    a.moduleId === activeModuleQuizSummary.moduleId
                )}
                onAttemptCompleted={onAssessmentAttemptCompleted}
                onContinueAfterPass={
                  getContinueActionAfterModuleQuiz(
                    activeModuleQuizSummary.moduleId || ''
                  ).action
                }
                continueLabel={
                  getContinueActionAfterModuleQuiz(
                    activeModuleQuizSummary.moduleId || ''
                  ).label
                }
                onBackToLesson={() => {
                  const mod = sortedModules.find(
                    (m) => m.id === activeModuleQuizSummary.moduleId
                  );
                  const firstModLesson = mod?.lessons
                    .slice()
                    .sort((a, b) => a.order - b.order)[0];
                  const match = firstModLesson
                    ? flatLessons.find((f) => f.lesson.id === firstModLesson.id)
                    : null;
                  if (match) {
                    void selectLesson(match.lesson.id, match.globalIndex);
                  } else {
                    selectIntro();
                  }
                }}
              />
            ) : isViewingFinalAssessment ? (
              /* VIEW B: FINAL COURSE ASSESSMENT (LOCKED CHECKLIST OR RUNNER) */
              !isFinalAssessmentUnlocked ? (
                <section className="bg-white rounded-xl border border-[#E5EAF0] p-5 sm:p-6 space-y-5">
                  <div className="space-y-2 border-b border-[#E5EAF0] pb-4">
                    <p className="text-xs font-semibold text-[#F47A24] inline-flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Prerequisites Required</span>
                    </p>
                    <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#102B4E]">
                      Final Course Assessment
                    </h1>
                    <p className="text-sm sm:text-base text-[#566479] leading-relaxed max-w-[66ch]">
                      Complete all required lessons and module quizzes below to unlock the Final Course Assessment. You must score at least{' '}
                      <strong className="text-[#102B4E]">
                        {assessmentOverview?.finalAssessment?.passPercentage ?? 70}%
                      </strong>{' '}
                      to complete this course.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {completionState.allLessonsCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#9AA6B8] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#102B4E]">
                            1. Complete all required lessons
                          </p>
                          <p className="text-xs text-[#778397] tabular-nums">
                            {validCompletedSet.size} of {totalLessons} lessons completed
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          completionState.allLessonsCompleted
                            ? 'text-emerald-700'
                            : 'text-[#566479]'
                        }`}
                      >
                        {completionState.allLessonsCompleted ? 'Done' : 'In Progress'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {completionState.allRequiredQuizzesPassed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#9AA6B8] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#102B4E]">
                            2. Pass all required module quizzes
                          </p>
                          <p className="text-xs text-[#778397] tabular-nums">
                            {passedRequiredCount} of {requiredModuleQuizIds.length} module quizzes passed
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold shrink-0 ${
                          completionState.allRequiredQuizzesPassed
                            ? 'text-emerald-700'
                            : 'text-[#566479]'
                        }`}
                      >
                        {completionState.allRequiredQuizzesPassed ? 'Done' : 'Pending'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Award className="w-5 h-5 text-[#F47A24] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#102B4E]">
                            3. Pass the Final Course Assessment ({assessmentOverview?.finalAssessment?.passPercentage ?? 70}%+)
                          </p>
                          <p className="text-xs text-[#778397]">
                            Unlocks automatically once steps 1 and 2 are complete.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#778397] shrink-0">
                        Locked
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const firstIncomplete = flatLessons.find(
                          (f) => !validCompletedSet.has(f.lesson.id)
                        );
                        if (firstIncomplete) {
                          void selectLesson(
                            firstIncomplete.lesson.id,
                            firstIncomplete.globalIndex
                          );
                          return;
                        }
                        const firstUnpassedQuizMod = sortedModules.find(
                          (m) =>
                            requiredModuleQuizIds.includes(m.id) &&
                            !passedModuleQuizSet.has(m.id)
                        );
                        if (firstUnpassedQuizMod) {
                          selectModuleQuiz(
                            firstUnpassedQuizMod.id,
                            firstUnpassedQuizMod.title
                          );
                        }
                      }}
                      className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Resume Next Required Step</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              ) : assessmentOverview?.finalAssessment ? (
                <CourseAssessmentRunner
                  key={assessmentOverview.finalAssessment.id}
                  assessment={assessmentOverview.finalAssessment}
                  candidateId={candidateId}
                  candidateName={candidateName}
                  candidateEmail={candidateEmail}
                  pastAttempts={courseAttempts.filter(
                    (a) => a.assessmentType === 'final_assessment'
                  )}
                  onAttemptCompleted={onAssessmentAttemptCompleted}
                  onContinueAfterPass={onBackToCourseDetails}
                  continueLabel="View Course Summary"
                  onBackToLesson={() => {
                    const lastLesson = flatLessons[flatLessons.length - 1];
                    if (lastLesson) {
                      void selectLesson(lastLesson.lesson.id, lastLesson.globalIndex);
                    } else {
                      selectIntro();
                    }
                  }}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 text-center text-sm text-[#566479]">
                  Loading Final Course Assessment...
                </div>
              )
            ) : activeId === INTRO_VIEW_ID || !activeLesson ? (
              /* VIEW C: COURSE INTRODUCTION */
              <motion.article
                key="course-intro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_PREMIUM }}
                className="bg-white rounded-xl border border-[#E5EAF0] p-5 sm:p-6 space-y-6"
              >
                <div className="space-y-2.5 border-b border-[#E5EAF0] pb-5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-[#778397]">
                    <span className="font-semibold text-[#F47A24]">Course Introduction</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.modules.length} modules</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{totalLessons} lessons</span>
                    <span aria-hidden="true">·</span>
                    <span>Module Quizzes &amp; Final Assessment</span>
                  </div>
                  <h1 className="font-display text-xl sm:text-2xl font-extrabold text-[#102B4E] leading-tight [text-wrap:balance]">
                    {course.courseIntroduction.headline}
                  </h1>
                  <p className="text-sm sm:text-[15px] text-[#566479] leading-[1.65] max-w-[68ch]">
                    {course.courseIntroduction.overview}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h2 className="font-display text-base sm:text-lg font-bold text-[#102B4E]">
                      How to Complete This Course
                    </h2>
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2.5 text-sm text-[#253449] leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0 mt-0.5" />
                        <span>Study and complete all {totalLessons} structured lessons.</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-sm text-[#253449] leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0 mt-0.5" />
                        <span>Complete the quiz at the end of each module with instant feedback.</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-sm text-[#253449] leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0 mt-0.5" />
                        <span>Pass the Final Course Assessment with at least 70% (retakes allowed).</span>
                      </li>
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
                      Your lesson completion, quiz scores, and assessment attempts save automatically under your ABHI JOBS account.
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
              /* VIEW D: ACTIVE LESSON (VIDEO + OBJECTIVES + QUIZ CARD + STUDY GUIDE + ACTIVITY) */
              <motion.article
                key={activeLesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE_PREMIUM }}
                className="space-y-5"
              >
                {/* 1. Primary Module Header & Embedded YouTube Video (Immediately Visible) */}
                {activeLesson.videos && activeLesson.videos.length > 0 ? (
                  <div className="space-y-5">
                    {/* Module Title & Metadata Banner */}
                    <section className="bg-white rounded-xl border border-[#E5EAF0] p-5 sm:p-6 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#778397] tabular-nums">
                        {activeModule && (
                          <span className="font-bold text-[#F47A24]">
                            Module {fmtMod(activeModule.order)}
                          </span>
                        )}
                        {activeModule?.level && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#102B4E]">
                              {activeModule.level}
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#F47A24]" />
                          <span>Est. {activeLesson.estimatedMinutes} min</span>
                        </span>
                        {activeModule && passedModuleQuizSet.has(activeModule.id) && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Module Passed</span>
                            </span>
                          </>
                        )}
                      </div>

                      <h1 className="font-display text-xl sm:text-[24px] font-extrabold text-[#102B4E] leading-tight [text-wrap:balance]">
                        {activeModule ? activeModule.title : activeLesson.title}
                      </h1>

                      <p className="text-sm sm:text-[15px] text-[#566479] leading-relaxed max-w-[70ch]">
                        {activeModule?.summary || activeLesson.description}
                      </p>
                    </section>

                    {/* Immediately Visible Tracked YouTube Video Player */}
                    {activeLesson.videos.map((vid) => (
                      <YouTubeTrackedPlayer
                        key={vid.id}
                        video={vid}
                        moduleLabel={
                          activeModule ? `Module ${fmtMod(activeModule.order)} Quiz` : 'Module Quiz'
                        }
                        savedProgress={videoProgressById[vid.id]}
                        isSaving={isSavingVideo || isSavingProgress}
                        onSaveProgress={(payload, triggerUnlock) =>
                          handleVideoProgressSave(activeLesson.id, payload, triggerUnlock)
                        }
                      />
                    ))}

                    {/* 2. Collapsible Study Guide (Collapsed by default on every module) */}
                    {activeLesson.studyGuide ? (
                      <CollapsibleStudyGuide
                        key={activeLesson.id}
                        lessonId={activeLesson.id}
                        studyGuide={activeLesson.studyGuide}
                      />
                    ) : (
                      <section className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 space-y-4">
                        <h2 className="font-display text-base sm:text-lg font-bold text-[#102B4E]">
                          Lesson Notes
                        </h2>
                        <div className="space-y-4">
                          {renderWrittenParagraphs(activeLesson.writtenContent)}
                        </div>
                      </section>
                    )}
                  </div>
                ) : (
                  /* Legacy non-tracked lesson rendering preserved for any future written lessons */
                  <section className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
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

                    <div className="p-5 sm:p-6 space-y-5">
                      <div className="space-y-2.5 border-b border-[#E5EAF0] pb-5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#778397] tabular-nums">
                          {activeModule && (
                            <span className="font-semibold text-[#102B4E]">
                              Module {fmtMod(activeModule.order)}: {activeModule.title}
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
                        </div>

                        <h1 className="font-display text-xl sm:text-[24px] font-extrabold text-[#102B4E] leading-tight [text-wrap:balance]">
                          {activeLesson.title}
                        </h1>

                        {activeLesson.description && (
                          <p className="text-sm sm:text-[15px] text-[#566479] leading-relaxed max-w-[68ch]">
                            {activeLesson.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4 max-w-[68ch]">
                        <h2 className="font-display text-base sm:text-lg font-bold text-[#102B4E]">
                          Lesson Explanation
                        </h2>
                        <div className="space-y-4">
                          {renderWrittenParagraphs(activeLesson.writtenContent)}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Downloadable Resources */}
                {activeLesson.attachments && activeLesson.attachments.length > 0 && (
                  <section className="bg-white rounded-xl border border-[#E5EAF0] p-5 sm:p-6 space-y-4">
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
                          className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                            className="min-h-[44px] px-4 py-2 rounded-lg border border-[#D4DCE6] bg-white hover:border-[#102B4E] hover:bg-[#102B4E] text-[#102B4E] hover:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download {att.url ? att.fileType : 'PDF'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Module Quiz Card (below Study Guide & Downloadable Resources) */}
                {activeModule && renderActiveModuleQuizCard()}

                {/* Lesson Completion Status & Navigation Controls */}
                <section className="bg-white rounded-xl border border-[#E5EAF0] p-5 sm:p-6 space-y-4">
                  {activeLesson.videos && activeLesson.videos.length > 0 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-[#102B4E]">
                          {isCurrentLessonCompleted
                            ? 'Video requirement completed'
                            : 'Complete the embedded video to unlock the quiz'}
                        </p>
                        <p className="text-xs text-[#778397]">
                          {isCurrentLessonCompleted
                            ? 'Your video progress is saved. Take the Module Quiz to unlock the next module.'
                            : 'Video completion is recorded automatically at 90% playback — no manual bypass is permitted while playback tracking is active.'}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 self-start sm:self-center ${
                          isCurrentLessonCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isCurrentLessonCompleted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Video Completed</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>Watch 90% Above</span>
                          </>
                        )}
                      </span>
                    </div>
                  ) : (
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
                            : isLastLessonOfModule
                            ? 'Mark this lesson complete to unlock the Module Quiz.'
                            : 'Mark this lesson complete to update your progress and unlock the next lesson.'}
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
                  )}

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

                    {activeModule &&
                    isLastLessonOfModule &&
                    moduleQuizByModuleId.has(activeModule.id) ? (
                      <button
                        type="button"
                        onClick={() =>
                          selectModuleQuiz(activeModule.id, activeModule.title)
                        }
                        className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                          isModuleQuizUnlocked(activeModule.id)
                            ? 'bg-[#102B4E] hover:bg-[#081D36] text-white'
                            : 'bg-[#E8EEF5] text-[#566479] hover:bg-[#DCE5F0]'
                        }`}
                      >
                        {!isModuleQuizUnlocked(activeModule.id) && (
                          <Lock className="w-4 h-4 shrink-0" />
                        )}
                        <ClipboardCheck className="w-4 h-4 shrink-0 text-[#F47A24]" />
                        <span>Take Module {fmtMod(activeModule.order)} Quiz</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </button>
                    ) : nextEntry ? (
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
                    ) : assessmentOverview?.finalAssessment ? (
                      <button
                        type="button"
                        onClick={selectFinalAssessment}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
                      >
                        <Award className="w-4 h-4 text-[#F47A24]" />
                        <span>Go to Final Assessment</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : null}
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
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {renderSidebarContent(true)}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePlayerView;
