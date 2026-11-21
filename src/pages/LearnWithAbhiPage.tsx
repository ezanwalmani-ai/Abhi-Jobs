import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Lock, LogIn } from 'lucide-react';
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
import { getCourseBySlug } from '../data/learningCatalog';
import {
  enrolCandidateInCourse,
  loadCandidateEnrolments,
  saveCandidateCourseProgress,
} from '../services/courseEnrolmentService';
import { loadHydratedCourse } from '../services/courseContentService';
import { CourseEnrolmentRecord, LearningCourseItem } from '../types/learning';

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

  // Hydrate course structure with any admin-managed lessons from Firestore/local storage
  useEffect(() => {
    let active = true;
    if (section !== 'course-detail' && section !== 'course-player') {
      setHydratedCourse(null);
      return () => {
        active = false;
      };
    }

    const baseCourse = courseSlug ? getCourseBySlug(courseSlug) : undefined;
    if (!baseCourse) {
      setHydratedCourse(null);
      return () => {
        active = false;
      };
    }

    setHydratedCourse(baseCourse);
    setIsLoadingCourse(true);
    loadHydratedCourse(baseCourse)
      .then((loaded) => {
        if (active) {
          setHydratedCourse(loaded);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingCourse(false);
        }
      });

    return () => {
      active = false;
    };
  }, [section, courseSlug]);

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
              Only ABHI JOBS administrators can add or edit Learn with ABHI course lessons.
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
        <div className="max-w-6xl mx-auto">
          <AdminCourseContentManager
            adminUserId={currentUser?.id || 'admin'}
            initialCourseId={initialCourseId}
            onNotify={showToast}
            onPreviewCourse={(slug) => navigate(`/learning/courses/${slug}/learn`)}
            onBack={() => navigate('/learning')}
          />
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
              and save your lesson progress automatically.
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
              to start studying lessons, downloading study worksheets, and tracking your progress.
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
        isAdmin={isAdmin}
        isSavingProgress={isSavingProgress}
        lastSavedLabel={lastSavedLabel}
        onUpdateProgress={(params) => handleUpdateProgress(selectedCourse, params)}
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
