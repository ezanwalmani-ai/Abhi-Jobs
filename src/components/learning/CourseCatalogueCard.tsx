import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { CourseEnrolmentRecord, LearningCourseItem } from '../../types/learning';
import { AbhiJobsMarkSVG } from '../AbhiJobsLogo';
import { EASE_PREMIUM, VIEWPORT_ONCE } from '../../lib/motion';
import { resolveCourseCatalogueState } from '../../utils/courseCatalogueState';
const EXCEL_COURSE_THUMBNAIL_URL =
  '/assets/aistudio/Excel_for_Job_Seekers__Grow_Your_Career_a22047c4.png';

const COURSE_COVER_BY_ID: Record<string, string> = {
  excel_for_job_seekers: EXCEL_COURSE_THUMBNAIL_URL,
};

const COURSE_COVER_BY_CATEGORY: Record<string, string> = {
  'excel-digital-skills': EXCEL_COURSE_THUMBNAIL_URL,
};

function resolveCourseThumbnailUrl(course: LearningCourseItem): string | null {
  if (course.thumbnailUrl && course.thumbnailUrl.trim().length > 0) {
    return course.thumbnailUrl.trim();
  }
  if (COURSE_COVER_BY_ID[course.id]) {
    return COURSE_COVER_BY_ID[course.id];
  }
  if (COURSE_COVER_BY_CATEGORY[course.categoryId]) {
    return COURSE_COVER_BY_CATEGORY[course.categoryId];
  }
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const ytId = lesson.videos?.[0]?.youtubeVideoId;
      if (ytId && /^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
        return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
      }
    }
  }
  return null;
}

export interface CourseCatalogueCardProps {
  course: LearningCourseItem;
  enrolment?: CourseEnrolmentRecord | null;
  index?: number;
  isEnrolling?: boolean;
  onViewCourse: (course: LearningCourseItem) => void;
  onEnrolCourse?: (course: LearningCourseItem) => void;
  onStartLearning?: (course: LearningCourseItem) => void;
  onContinueLearning?: (course: LearningCourseItem) => void;
  onReviewCourse?: (course: LearningCourseItem) => void;
}

export const CourseCatalogueCard: React.FC<CourseCatalogueCardProps> = ({
  course,
  enrolment,
  index = 0,
  isEnrolling = false,
  onViewCourse,
  onEnrolCourse,
  onStartLearning,
  onContinueLearning,
  onReviewCourse,
}) => {
  const [imageError, setImageError] = useState(false);

  const state = useMemo(
    () => resolveCourseCatalogueState(course, enrolment),
    [course, enrolment]
  );

  const thumbnailSrc = useMemo(() => resolveCourseThumbnailUrl(course), [course]);

  const handlePrimaryAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEnrolling) return;

    switch (state.visualState) {
      case 'not_enrolled':
        if (state.isFree && onEnrolCourse) {
          onEnrolCourse(course);
        } else {
          onViewCourse(course);
        }
        return;
      case 'enrolled_not_started':
        if (onStartLearning) {
          onStartLearning(course);
        } else if (onContinueLearning) {
          onContinueLearning(course);
        } else {
          onViewCourse(course);
        }
        return;
      case 'in_progress':
        if (onContinueLearning) {
          onContinueLearning(course);
        } else {
          onViewCourse(course);
        }
        return;
      case 'completed':
        if (onReviewCourse) {
          onReviewCourse(course);
        } else if (onContinueLearning) {
          onContinueLearning(course);
        } else {
          onViewCourse(course);
        }
        return;
    }
  };

  const moduleLabel =
    state.activeModuleCount === 1
      ? '1 Module'
      : `${state.activeModuleCount} Modules`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{
        duration: 0.24,
        delay: Math.min(index, 7) * 0.03,
        ease: EASE_PREMIUM,
      }}
      data-course-id={course.id}
      data-enrolment-state={state.visualState}
      className="group h-full bg-white rounded-xl border border-[#DCE3EC] hover:border-[#102B4E]/40 hover:shadow-[0_10px_24px_-12px_rgba(16,43,78,0.18)] transition-all duration-200 p-2.5 flex flex-col justify-between gap-3"
    >
      <div className="space-y-2.5">
        {/* Inset Rounded 16:9 Course Thumbnail (Coursera Compact Proportions) */}
        <button
          type="button"
          onClick={() => onViewCourse(course)}
          aria-label={`View details for ${course.title}`}
          className="relative block w-full aspect-[16/9] rounded-lg bg-[#102B4E] overflow-hidden text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47A24]"
        >
          {thumbnailSrc && !imageError ? (
            <img
              src={thumbnailSrc}
              alt={`${course.title} course cover`}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#102B4E] via-[#173B68] to-[#0B1E38] flex flex-col items-center justify-center p-4 text-center relative">
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative w-9 h-9 rounded-md bg-white/10 border border-white/15 flex items-center justify-center p-1.5 mb-1.5">
                <AbhiJobsMarkSVG theme="white" className="w-full h-full" />
              </div>
              <span className="relative text-[11px] font-medium text-white/80 tracking-wide">
                {course.categoryName}
              </span>
            </div>
          )}
        </button>

        {/* Compact Card Content */}
        <div className="px-1 space-y-1.5">
          {/* Official AJ Logo + Learn with ABHI Provider Row */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-[5px] bg-white border border-[#DCE3EC] flex items-center justify-center p-0.5 shrink-0"
              aria-hidden="true"
            >
              <AbhiJobsMarkSVG className="w-full h-full" />
            </div>
            <span className="text-[12.5px] font-medium text-[#3B4B61] truncate">
              Learn with ABHI
            </span>
          </div>

          {/* Course Title */}
          <h3 className="font-display text-[15px] font-bold text-[#102B4E] leading-snug pt-0.5">
            <button
              type="button"
              onClick={() => onViewCourse(course)}
              className="text-left hover:text-[#0A2A73] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline line-clamp-2"
            >
              {course.title}
            </button>
          </h3>

          {/* Compact Metadata Line: Level · Modules · Free/Paid */}
          <div className="pt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] text-[#566479] tabular-nums">
            <span>{state.displayLevel}</span>
            <span className="text-[#B8C4D4]" aria-hidden="true">
              ·
            </span>
            <span>{moduleLabel}</span>
            <span className="text-[#B8C4D4]" aria-hidden="true">
              ·
            </span>
            <span
              className={
                state.isFree
                  ? 'font-semibold text-[#0E7C66]'
                  : 'font-semibold text-[#102B4E]'
              }
            >
              {state.priceLabel}
            </span>
          </div>

          {/* Certificate Line (Only when course offers one) */}
          {state.offersCertificate && (
            <div className="flex items-center gap-1 text-[11.5px] text-[#566479]">
              <Award className="w-3.5 h-3.5 text-[#102B4E]/70 shrink-0" aria-hidden="true" />
              <span>Certificate included</span>
            </div>
          )}
        </div>
      </div>

      {/* Compact Dynamic Enrolment State & Action Footer */}
      <div className="px-1 pt-2 border-t border-[#EEF2F6] space-y-2">
        {state.visualState === 'in_progress' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-medium text-[#566479]">In progress</span>
              <span className="font-semibold text-[#102B4E] tabular-nums">
                {state.progressPercent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`${course.title} completion progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={state.progressPercent}
              className="h-1.5 w-full rounded-full bg-[#E5EAF0] overflow-hidden"
            >
              <div
                className="h-full bg-[#F47A24] rounded-full transition-all duration-300"
                style={{ width: `${state.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {state.visualState === 'completed' && (
          <div className="flex items-center justify-between gap-2 text-[11.5px]">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Completed</span>
            </span>
            <span className="font-medium text-[#566479] tabular-nums">100%</span>
          </div>
        )}

        <button
          type="button"
          disabled={isEnrolling}
          onClick={handlePrimaryAction}
          className={`w-full min-h-[38px] px-3 py-2 rounded-lg text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#102B4E] ${
            state.visualState === 'in_progress'
              ? 'bg-[#F47A24] hover:bg-[#DE6816] text-white'
              : state.visualState === 'completed'
              ? 'bg-white border border-[#102B4E] text-[#102B4E] hover:bg-[#102B4E] hover:text-white'
              : state.visualState === 'not_enrolled' && !state.isFree
              ? 'bg-[#F47A24] hover:bg-[#DE6816] text-white'
              : 'bg-[#102B4E] hover:bg-[#081D36] text-white'
          }`}
        >
          {isEnrolling ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Enrolling...</span>
            </>
          ) : (
            <>
              {state.visualState === 'enrolled_not_started' && (
                <Play className="w-3 h-3 shrink-0" aria-hidden="true" />
              )}
              {state.visualState === 'completed' && (
                <RotateCcw className="w-3 h-3 shrink-0" aria-hidden="true" />
              )}
              <span>{state.primaryActionLabel}</span>
              {state.visualState !== 'completed' && (
                <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
};

export default CourseCatalogueCard;
