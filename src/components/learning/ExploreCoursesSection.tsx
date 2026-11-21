import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Search, CheckCircle2, X } from 'lucide-react';
import { LEARNING_CATEGORIES, LEARNING_CATALOGUE_COURSES } from '../../data/learningCatalog';
import {
  CourseDifficultyLevel,
  CourseEnrolmentRecord,
  LearningCategoryId,
  LearningCourseItem,
} from '../../types/learning';
import { EASE_PREMIUM, VIEWPORT_ONCE } from '../../lib/motion';

interface ExploreCoursesSectionProps {
  enrolments: CourseEnrolmentRecord[];
  onViewCourse: (course: LearningCourseItem) => void;
  onContinueLearning?: (course: LearningCourseItem) => void;
}

export const ExploreCoursesSection: React.FC<ExploreCoursesSectionProps> = ({
  enrolments,
  onViewCourse,
  onContinueLearning,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | LearningCategoryId>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | CourseDifficultyLevel>('all');

  const enrolmentByCourseId = useMemo(() => {
    const map = new Map<string, CourseEnrolmentRecord>();
    enrolments.forEach((e) => map.set(e.courseId, e));
    return map;
  }, [enrolments]);

  const visibleCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LEARNING_CATALOGUE_COURSES.filter((course) => {
      const matchesCat =
        selectedCategory === 'all' || course.categoryId === selectedCategory;
      const matchesLevel =
        selectedDifficulty === 'all' || course.level === selectedDifficulty;
      const matchesSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.shortDescription.toLowerCase().includes(q) ||
        course.categoryName.toLowerCase().includes(q) ||
        course.skillsDeveloped.some((skill) => skill.toLowerCase().includes(q));
      return matchesCat && matchesLevel && matchesSearch;
    });
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== 'all' ||
    selectedDifficulty !== 'all';

  return (
    <section
      id="explore-courses"
      aria-labelledby="explore-courses-heading"
      className="py-16 sm:py-24 bg-white border-b border-[#E5EAF0] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.45, ease: EASE_PREMIUM }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
        >
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs sm:text-sm font-semibold text-[#F47A24]">
              Course Catalogue
            </p>
            <h2
              id="explore-courses-heading"
              className="font-display text-2xl sm:text-4xl font-extrabold text-[#102B4E] tracking-tight leading-tight [text-wrap:balance]"
            >
              Learn Something That Moves You Forward
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#778397] max-w-sm lg:text-right">
            Showing{' '}
            <span className="font-semibold text-[#102B4E] tabular-nums">
              {visibleCourses.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-[#102B4E] tabular-nums">
              {LEARNING_CATALOGUE_COURSES.length}
            </span>{' '}
            free career courses across six focus areas.
          </p>
        </motion.div>

        {/* Search & Difficulty Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Course Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#778397] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses by title, category, or skill..."
              aria-label="Search courses"
              className="w-full min-h-[44px] pl-10 pr-9 py-2.5 rounded-xl border border-[#D4DCE6] bg-white text-sm text-[#102B4E] placeholder:text-[#778397] focus:outline-none focus:border-[#102B4E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear course search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#778397] hover:text-[#102B4E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Difficulty Filter Segmented Control */}
          <div
            role="group"
            aria-label="Filter by difficulty level"
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] self-start md:self-auto"
          >
            {(['all', 'Beginner', 'Intermediate'] as const).map((level) => {
              const active = selectedDifficulty === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedDifficulty(level)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#102B4E] text-white'
                      : 'text-[#566479] hover:text-[#102B4E]'
                  }`}
                >
                  {level === 'all' ? 'All Levels' : level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Course categories"
          className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E5EAF0]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E] ${
              selectedCategory === 'all'
                ? 'bg-[#102B4E] text-white'
                : 'text-[#566479] hover:text-[#102B4E] hover:bg-[#F6F8FB]'
            }`}
          >
            All Categories
          </button>

          {LEARNING_CATEGORIES.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(category.id)}
                className={`min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E] ${
                  active
                    ? 'bg-[#102B4E] text-white'
                    : 'text-[#566479] hover:text-[#102B4E] hover:bg-[#F6F8FB]'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Course Catalogue Grid or Empty State */}
        {visibleCourses.length === 0 ? (
          <div className="rounded-2xl border border-[#E5EAF0] bg-[#FAFBFD] p-10 sm:p-14 text-center space-y-4">
            <h3 className="font-display text-lg font-bold text-[#102B4E]">
              No courses match your current filters
            </h3>
            <p className="text-sm text-[#778397] max-w-md mx-auto">
              Try clearing your search term or switching back to all categories and difficulty levels.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                }}
                className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-semibold cursor-pointer transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCourses.map((course, idx) => {
              const enrolment = enrolmentByCourseId.get(course.id);
              const isEnrolled = Boolean(enrolment);
              const progressPct = enrolment?.progressPercent ?? 0;
              return (
                <motion.article
                  key={course.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VIEWPORT_ONCE}
                  transition={{ duration: 0.3, delay: Math.min(idx, 5) * 0.04, ease: EASE_PREMIUM }}
                  className="group bg-[#FAFBFD] hover:bg-white rounded-2xl border border-[#E5EAF0] hover:border-[#102B4E]/35 p-6 sm:p-7 flex flex-col justify-between gap-6 transition-all duration-200"
                >
                  <div className="space-y-3.5">
                    {/* Clean Unboxed Metadata Line (Zero Pill Clutter) */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#778397]">
                      <span className="font-semibold text-[#102B4E]">{course.categoryName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{course.level}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#F47A24]">Free</span>
                    </div>

                    <h3 className="font-display text-lg sm:text-xl font-bold text-[#102B4E] leading-snug">
                      {course.title}
                    </h3>

                    <p className="text-sm text-[#566479] leading-relaxed">
                      {course.shortDescription}
                    </p>

                    {isEnrolled && (
                      <div className="pt-1 space-y-1.5">
                        <div className="h-1.5 w-full rounded-full bg-[#E5EAF0] overflow-hidden">
                          <div
                            className="h-full bg-[#F47A24] rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[#E5EAF0] flex items-center justify-between gap-3">
                    <div className="text-xs text-[#778397] space-y-0.5 min-w-0">
                      <p className="font-medium text-[#253449] truncate">
                        {course.estimatedDuration}
                      </p>
                      {isEnrolled && (
                        <p className="inline-flex items-center gap-1 font-semibold text-emerald-700 tabular-nums">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {progressPct > 0 ? `${progressPct}% complete` : 'Enrolled'}
                          </span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        isEnrolled && onContinueLearning
                          ? onContinueLearning(course)
                          : onViewCourse(course)
                      }
                      className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E] ${
                        isEnrolled
                          ? 'bg-[#102B4E] hover:bg-[#081D36] text-white'
                          : 'bg-white border border-[#D4DCE6] hover:border-[#102B4E] hover:bg-[#102B4E] text-[#102B4E] hover:text-white'
                      }`}
                    >
                      <span>{isEnrolled ? 'Continue Learning' : 'View Course'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExploreCoursesSection;
