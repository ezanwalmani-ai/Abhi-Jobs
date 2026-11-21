import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, ClipboardCheck, Loader2, Lock, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LearnHeroSection } from '../components/learning/LearnHeroSection';
import { CareerAssessmentSection } from '../components/learning/CareerAssessmentSection';
import { ExploreCoursesSection } from '../components/learning/ExploreCoursesSection';
import { WhyLearnSection } from '../components/learning/WhyLearnSection';
import { LearnFinalCtaSection } from '../components/learning/LearnFinalCtaSection';
import { ProfileEvaluationTest } from '../components/learning/assessment/ProfileEvaluationTest';
import { CourseDetailsView } from '../components/learning/CourseDetailsView';
import { CoursePlayerView } from '../components/learning/CoursePlayerView';
import { AdminCourseContentManager } from '../components/learning/AdminCourseContentManager';
import { AdminAssessmentManager } from '../components/learning/AdminAssessmentManager';
import { flattenCourseLessons, getCourseBySlug } from '../data/learningCatalog';
import {
  enrolCandidateInCourse,
  loadCandidateEnrolments,
  saveCandidateCourseProgress,
} from '../services/courseEnrolmentService';
import { loadHydratedCourse } from '../services/courseContentService';
import {
  fetchCourseAssessmentOverview,
  loadCandidateAssessmentAttempts,
} from '../services/assessmentService';
import {
  AssessmentAttemptRecord,
  CourseAssessmentOverview,
  CourseEnrolmentRecord,
  LearningCourseItem,
} from '../types/learning';

interface LearnWithAbhiPageProps {
  navigate: (route: string) => void;
  section?: 'home' | 'assessment' | 'course-detail' | 'course-player' | 'admin-content';
  courseSlug?: string;
}

export const LearnWithAbhiPage: React.FC<LearnWithAbhiPageProps> = ({
  navigate,
  section = 'home',
  courseSlug,
}) => {
  const { currentUser, currentRole, currentCandidate, showToast } = useApp();
  const [enrolments, setEnrolments] = useState<CourseEnrolmentRecord[]>([]);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [lastSavedLabel, setLastSavedLabel] = useState<string | null>(null);
  const [hydratedCourse, setHydratedCourse] = useState<LearningCourseItem | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);

  const [assessmentOverview, setAssessmentOverview] =
    useState<CourseAssessmentOverview | null>(null);
  const [courseAttempts, setCourseAttempts] = useState<AssessmentAttemptRecord[]>([]);
  const [adminSubTab, setAdminSubTab] = useState<'lessons' | 'assessments'>('lessons');

  const isAuthenticated = Boolean(currentUser);
  const isAdmin =
    isAuthenticated &&
    (currentRole === 'admin' ||
      currentUser?.email?.toLowerCase() === 'ezanwalmani@gmail.com');

  const fullName = currentCandidate?.name || currentUser?.name || '';
  const firstName = fullName ? fullName.trim().split(' ')[0] : null;

  // Load candidate enrolments & progress records
  useEffect(() => {
    let active = true;

    if (!currentUser?.id) {
      setEnrolments([]);
      return () => {
        active = false;
      };
    }

    loadCandidateEnrolments(currentUser.id).then((res) => {
      if (active) {
        setEnrolments(res.enrolments);
      }
    });

    return () => {
      active = false;
    };
  }, [currentUser?.id, section, courseSlug]);

  // Hydrate course structure + load backend assessment summary & candidate's own attempts
  useEffect(() => {
    let active = true;
    if (section !== 'course-detail' && section !== 'course-player') {
      setHydratedCourse(null);
      setAssessmentOverview(null);
      setCourseAttempts([]);
      return () => {
        active = false;
      };
    }

    const baseCourse = courseSlug ? getCourseBySlug(courseSlug) : undefined;
    if (!baseCourse) {
      setHydratedCourse(null);
      setAssessmentOverview(null);
      setCourseAttempts([]);
      return () => {
        active = false;
      };
    }

    setHydratedCourse(baseCourse);
    setIsLoadingCourse(true);

    Promise.all([
      loadHydratedCourse(baseCourse),
      fetchCourseAssessmentOverview(baseCourse.id).catch(() => null),
      currentUser?.id
        ? loadCandidateAssessmentAttempts(currentUser.id, baseCourse.id).catch(() => ({
            attempts: [],
            syncedFromCloud: false,
          }))
        : Promise.resolve({ attempts: [], syncedFromCloud: false }),
    ])
      .then(([loadedCourse, overview, attRes]) => {
        if (!active) return;
        setHydratedCourse(loadedCourse);
        setAssessmentOverview(overview);
        setCourseAttempts(attRes.attempts);
      })
      .finally(() => {
        if (active) {
          setIsLoadingCourse(false);
        }
      });

    return () => {
      active = false;
    };
  }, [section, courseSlug, currentUser?.id]);

  const scrollToElement = (elementId: string) => {
    const target = document.getElementById(elementId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleEnrolCourse = async (
    course: LearningCourseItem,
    redirectToPlayer = true
  ) => {
    if (!isAuthenticated || !currentUser?.id) {
      showToast(
        'info',
        'Sign in required',
        'Please sign in with your ABHI JOBS account to enrol in this course.'
      );
      navigate('/login');
      return;
    }

    if (isEnrolling) return;
    setIsEnrolling(true);

    try {
      const result = await enrolCandidateInCourse(currentUser.id, course);
      if (result.success && result.enrolment) {
        const savedRecord = result.enrolment;
        setEnrolments((prev) => {
          const filtered = prev.filter((item) => item.courseId !== savedRecord.courseId);
          return [savedRecord, ...filtered];
        });

        if (result.alreadyEnrolled) {
          showToast(
            'info',
            'Already enrolled',
            `Opening ${course.title} where you left off.`
          );
        } else {
          showToast(
            'success',
            'Enrolment confirmed',
            `You are now enrolled in ${course.title}.`
          );
        }

        if (redirectToPlayer) {
          navigate(`/learning/courses/${course.slug}/learn`);
        }
      } else {
        showToast(
          'error',
          'Enrolment could not be saved',
          result.error || 'Please try again in a moment.'
        );
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUpdateProgress = async (
    course: LearningCourseItem,
    params: {
      currentLessonId?: string;
      completedLessonIds: string[];
      totalLessons: number;
      requiredModuleQuizIds: string[];
    }
  ) => {
    if (!currentUser?.id) return;
    setIsSavingProgress(true);
    try {
      const res = await saveCandidateCourseProgress(currentUser.id, course, params);
      if (res.success && res.enrolment) {
        const savedRecord = res.enrolment;
        setEnrolments((prev) => [
          savedRecord,
          ...prev.filter((item) => item.courseId !== savedRecord.courseId),
        ]);
        setLastSavedLabel('Progress saved');
      }
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleAssessmentAttemptCompleted = async (
    course: LearningCourseItem,
    attempt: AssessmentAttemptRecord
  ) => {
    if (!currentUser?.id) return;

    const nextAttempts = [
      attempt,
      ...courseAttempts.filter((item) => item.id !== attempt.id),
    ];
    setCourseAttempts(nextAttempts);

    const existingEnrolment = enrolments.find((e) => e.courseId === course.id);
    const totalLessons = flattenCourseLessons(course).length;
    const requiredModuleQuizIds =
      assessmentOverview && assessmentOverview.moduleQuizzes.length > 0
        ? assessmentOverview.moduleQuizzes
            .filter((q) => q.requiredForCompletion && q.moduleId)
            .map((q) => q.moduleId as string)
        : course.modules.map((m) => m.id);

    const passedQuizSet = new Set<string>(existingEnrolment?.passedModuleQuizIds || []);
    nextAttempts.forEach((a) => {
      if (a.assessmentType === 'module_quiz' && a.passed && a.moduleId) {
        passedQuizSet.add(a.moduleId);
      }
    });

    const finalPassed =
      Boolean(existingEnrolment?.finalAssessmentPassed) ||
      nextAttempts.some((a) => a.assessmentType === 'final_assessment' && a.passed);

    const bestFinal = nextAttempts
      .filter((a) => a.assessmentType === 'final_assessment')
      .reduce(
        (max, a) => Math.max(max, a.scorePercent),
        existingEnrolment?.bestFinalScorePercent ?? 0
      );

    setIsSavingProgress(true);
    try {
      const res = await saveCandidateCourseProgress(currentUser.id, course, {
        currentLessonId: existingEnrolment?.currentLessonId,
        completedLessonIds: existingEnrolment?.completedLessonIds || [],
        totalLessons,
        passedModuleQuizIds: Array.from(passedQuizSet),
        requiredModuleQuizIds,
        finalAssessmentPassed: finalPassed,
        bestFinalScorePercent: bestFinal > 0 ? bestFinal : undefined,
      });

      if (res.success && res.enrolment) {
        const savedRecord = res.enrolment;
        const wasAlreadyCompleted = existingEnrolment?.status === 'completed';
        setEnrolments((prev) => [
          savedRecord,
          ...prev.filter((item) => item.courseId !== savedRecord.courseId),
        ]);
        setLastSavedLabel('Assessment result saved');

        if (!wasAlreadyCompleted && savedRecord.status === 'completed') {
          showToast(
            'success',
            'Course Completed!',
            `Congratulations! You completed ${course.title} with a ${savedRecord.bestFinalScorePercent ?? attempt.scorePercent}% final assessment score.`
          );
        } else if (attempt.passed) {
          showToast(
            'success',
            attempt.assessmentType === 'final_assessment'
              ? 'Final Assessment Passed'
              : 'Module Quiz Passed',
            `Score: ${attempt.scorePercent}% (${attempt.correctAnswers}/${attempt.totalQuestions} correct).`
          );
        } else {
          showToast(
            'info',
            'Attempt Recorded',
            `You scored ${attempt.scorePercent}%. Review the explanations and retry to reach ${attempt.passPercentage}%.`
          );
        }
      }
    } finally {
      setIsSavingProgress(false);
    }
  };

  if (section === 'assessment') {
    return (
      <ProfileEvaluationTest
        onBackToLearn={() => navigate('/learning')}
        onExploreCourses={() => {
          navigate('/learning');
          setTimeout(() => scrollToElement('explore-courses'), 180);
        }}
        onNavigateLogin={() => navigate('/login')}
        onNavigateResume={() => navigate(isAuthenticated ? '/resume' : '/login')}
        onNavigateJobs={() => navigate('/jobs')}
      />
    );
  }

  if (section === 'admin-content') {
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-[#F6F8FB] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E5EAF0] p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAFBFD] border border-[#E5EAF0] flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5 text-[#102B4E]" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#102B4E]">
              Administrator Access Required
            </h1>
            <p className="text-sm text-[#566479]">
              Only ABHI JOBS administrators can manage Learn with ABHI course lessons and assessments.
            </p>
            <button
              type="button"
              onClick={() => navigate('/learning')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Learn with ABHI</span>
            </button>
          </div>
        </div>
      );
    }

    const initialCourseId = courseSlug ? getCourseBySlug(courseSlug)?.id : undefined;

    return (
      <div className="min-h-screen bg-[#F6F8FB] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/learning')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#566479] hover:text-[#102B4E] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Learn with ABHI</span>
            </button>

            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdminSubTab('lessons')}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  adminSubTab === 'lessons'
                    ? 'bg-[#102B4E] text-white'
                    : 'bg-white border border-[#E5EAF0] text-[#566479] hover:text-[#102B4E]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Course Lessons</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminSubTab('assessments')}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  adminSubTab === 'assessments'
                    ? 'bg-[#102B4E] text-white'
                    : 'bg-white border border-[#E5EAF0] text-[#566479] hover:text-[#102B4E]'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Quizzes &amp; Assessments</span>
              </button>
            </div>
          </div>

          {adminSubTab === 'lessons' ? (
            <AdminCourseContentManager
              adminUserId={currentUser?.id || 'admin'}
              initialCourseId={initialCourseId}
              onNotify={showToast}
              onPreviewCourse={(slug) => navigate(`/learning/courses/${slug}/learn`)}
              onBack={() => navigate('/learning')}
            />
          ) : (
            <AdminAssessmentManager
              initialCourseId={initialCourseId}
              onNotify={showToast}
            />
          )}
        </div>
      </div>
    );
  }

  if (section === 'course-detail') {
    const selectedCourse =
      hydratedCourse || (courseSlug ? getCourseBySlug(courseSlug) : undefined);

    if (!selectedCourse) {
      return (
        <div className="min-h-screen bg-[#F6F8FB] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E5EAF0] p-8 text-center space-y-4">
            <h1 className="font-display text-2xl font-bold text-[#102B4E]">
              Course not found
            </h1>
            <p className="text-sm text-[#566479]">
              The course you are looking for is not available in the Learn with ABHI catalogue.
            </p>
            <button
              type="button"
              onClick={() => navigate('/learning')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Course Catalogue</span>
            </button>
          </div>
        </div>
      );
    }

    const matchingEnrolment =
      enrolments.find((item) => item.courseId === selectedCourse.id) || null;

    return (
      <CourseDetailsView
        course={selectedCourse}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        enrolment={matchingEnrolment}
        assessmentOverview={assessmentOverview}
        isEnrolling={isEnrolling}
        onEnrol={(c) => handleEnrolCourse(c, true)}
        onStartLearning={(c) => navigate(`/learning/courses/${c.slug}/learn`)}
        onBackToCatalogue={() => {
          navigate('/learning');
          setTimeout(() => scrollToElement('explore-courses'), 180);
        }}
        onNavigateLogin={() => navigate('/login')}
        onOpenAdminContentManager={() => navigate('/learning/admin/content')}
      />
    );
  }

  if (section === 'course-player') {
    const selectedCourse =
      hydratedCourse || (courseSlug ? getCourseBySlug(courseSlug) : undefined);

    if (!selectedCourse) {
      return (
        <div className="min-h-screen bg-[#F6F8FB] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E5EAF0] p-8 text-center space-y-4">
            <h1 className="font-display text-2xl font-bold text-[#102B4E]">
              Course not found
            </h1>
            <button
              type="button"
              onClick={() => navigate('/learning')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Course Catalogue</span>
            </button>
          </div>
        </div>
      );
    }

    if (!isAuthenticated || !currentUser) {
      return (
        <div className="min-h-screen bg-[#F6F8FB] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-[#E5EAF0] p-8 text-center space-y-4">
            <h1 className="font-display text-2xl font-bold text-[#102B4E]">
              Sign in to access lessons
            </h1>
            <p className="text-sm text-[#566479] leading-relaxed">
              Please sign in with your ABHI JOBS account to study{' '}
              <span className="font-semibold text-[#102B4E]">{selectedCourse.title}</span>{' '}
              and save your lesson and assessment progress automatically.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(`/learning/courses/${selectedCourse.slug}`)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm font-semibold text-[#102B4E] cursor-pointer"
              >
                Course Overview
              </button>
            </div>
          </div>
        </div>
      );
    }

    const matchingEnrolment =
      enrolments.find((item) => item.courseId === selectedCourse.id) || null;

    if (!matchingEnrolment && !isAdmin) {
      return (
        <div className="min-h-screen bg-[#F6F8FB] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-[#E5EAF0] p-8 text-center space-y-4">
            <h1 className="font-display text-2xl font-bold text-[#102B4E]">
              Enrol to unlock this course
            </h1>
            <p className="text-sm text-[#566479] leading-relaxed">
              Enrol for free in{' '}
              <span className="font-semibold text-[#102B4E]">{selectedCourse.title}</span>{' '}
              to start studying lessons, taking module quizzes, and completing the final assessment.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isEnrolling}
                onClick={() => void handleEnrolCourse(selectedCourse, false)}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <span>Enrol Free &amp; Open Player</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/learning/courses/${selectedCourse.slug}`)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-[#D4DCE6] text-sm font-semibold text-[#102B4E] cursor-pointer"
              >
                View Course Details
              </button>
            </div>
          </div>
        </div>
      );
    }

    const effectiveEnrolment: CourseEnrolmentRecord = matchingEnrolment || {
      courseId: selectedCourse.id,
      courseSlug: selectedCourse.slug,
      courseTitle: selectedCourse.title,
      categoryId: selectedCourse.categoryId,
      userId: currentUser.id,
      status: 'enrolled',
      completedLessonIds: [],
      passedModuleQuizIds: [],
      finalAssessmentPassed: false,
      progressPercent: 0,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    };

    if (isLoadingCourse && !hydratedCourse) {
      return (
        <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-6">
          <Loader2 className="w-7 h-7 animate-spin text-[#102B4E]" />
        </div>
      );
    }

    return (
      <CoursePlayerView
        course={selectedCourse}
        enrolment={effectiveEnrolment}
        assessmentOverview={assessmentOverview}
        courseAttempts={courseAttempts}
        candidateId={currentUser.id}
        candidateName={fullName || currentUser.name || 'ABHI JOBS Candidate'}
        candidateEmail={currentUser.email || ''}
        isAdmin={isAdmin}
        isSavingProgress={isSavingProgress}
        lastSavedLabel={lastSavedLabel}
        onUpdateProgress={(params) => handleUpdateProgress(selectedCourse, params)}
        onAssessmentAttemptCompleted={(attempt) =>
          handleAssessmentAttemptCompleted(selectedCourse, attempt)
        }
        onBackToCourseDetails={() =>
          navigate(`/learning/courses/${selectedCourse.slug}`)
        }
        onOpenAdminContentManager={() => navigate('/learning/admin/content')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#253449]">
      {/* 1. Hero Section */}
      <LearnHeroSection
        candidateFirstName={firstName}
        onExploreCourses={() => scrollToElement('explore-courses')}
        onTakeAssessment={() => scrollToElement('career-assessment')}
      />

      {/* 2. Career Assessment Section */}
      <CareerAssessmentSection
        onStartAssessment={() => navigate('/learning/assessment')}
      />

      {/* 3. Explore Courses Section */}
      <ExploreCoursesSection
        enrolments={enrolments}
        onViewCourse={(course) => navigate(`/learning/courses/${course.slug}`)}
        onContinueLearning={(course) =>
          navigate(`/learning/courses/${course.slug}/learn`)
        }
      />

      {/* 4. Why Learn with ABHI? */}
      <WhyLearnSection />

      {/* 5. Final Call to Action */}
      <LearnFinalCtaSection
        isAuthenticated={isAuthenticated}
        onStartLearning={() => scrollToElement('explore-courses')}
        onNavigateLogin={() => navigate('/login')}
      />
    </div>
  );
};

export default LearnWithAbhiPage;
