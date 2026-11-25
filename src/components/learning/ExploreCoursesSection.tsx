import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { LEARNING_CATEGORIES, LEARNING_CATALOGUE_COURSES } from '../../data/learningCatalog';
import {
  CourseEnrolmentRecord,
  LearningCategoryId,
  LearningCourseItem,
} from '../../types/learning';
import { EASE_PREMIUM, VIEWPORT_ONCE } from '../../lib/motion';
import { CourseCatalogueCard } from './CourseCatalogueCard';
import { matchesDifficultyFilter } from '../../utils/courseCatalogueState';

type DifficultyFilterOption = 'all' | 'Beginner' | 'Intermediate' | 'Advanced';

interface ExploreCoursesSectionProps {
  enrolments: CourseEnrolmentRecord[];
  courses?: LearningCourseItem[];
  enrollingCourseId?: string | null;
  onViewCourse: (course: LearningCourseItem) => void;
  onEnrolCourse?: (course: LearningCourseItem) => void;
  onStartLearning?: (course: LearningCourseItem) => void;
  onContinueLearning?: (course: LearningCourseItem) => void;
  onReviewCourse?: (course: LearningCourseItem) => void;
}

export const ExploreCoursesSection: React.FC<ExploreCoursesSectionProps> = ({
  enrolments,
  courses = LEARNING_CATALOGUE_COURSES,
  enrollingCourseId = null,
  onViewCourse,
  onEnrolCourse,
  onStartLearning,
  onContinueLearning,
  onReviewCourse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | LearningCategoryId>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilterOption>('all');

  const enrolmentByCourseId = useMemo(() => {
    const map = new Map<string, CourseEnrolmentRecord>();
    enrolments.forEach((e) => map.set(e.courseId, e));
    return map;
  }, [enrolments]);

  const visibleCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      if (course.status === 'draft') return false;
      const matchesCat =
        selectedCategory === 'all' || course.categoryId === selectedCategory;
      const matchesLevel = matchesDifficultyFilter(course.level, selectedDifficulty);
      const matchesSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.shortDescription.toLowerCase().includes(q) ||
        course.categoryName.toLowerCase().includes(q) ||
        course.skillsDeveloped.some((skill) => skill.toLowerCase().includes(q));
      return matchesCat && matchesLevel && matchesSearch;
    });
  }, [courses, searchQuery, selectedCategory, selectedDifficulty]);

  const publishedCoursesCount = useMemo(
    () => courses.filter((c) => c.status !== 'draft').length,
    [courses]
  );

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== 'all' ||
    selectedDifficulty !== 'all';

  const isCatalogueEmpty = publishedCoursesCount === 0;

  return (
    <section
      id="explore-courses"
      aria-labelledby="explore-courses-heading"
      className="py-10 sm:py-12 bg-white border-b border-[#E5EAF0] scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-7">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.4, ease: EASE_PREMIUM }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-3"
        >
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-[#F47A24]">
              Course Catalogue
            </p>
            <h2
              id="explore-courses-heading"
              className="font-display text-2xl sm:text-[28px] font-bold text-[#102B4E] tracking-tight leading-snug [text-wrap:balance]"
            >
              Learn Something That Moves You Forward
            </h2>
          </div>

          {!isCatalogueEmpty && (
            <p className="text-xs sm:text-[13px] text-[#566479] max-w-sm lg:text-right tabular-nums">
              Showing{' '}
              <span className="font-semibold text-[#102B4E]">
                {visibleCourses.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-[#102B4E]">
                {publishedCoursesCount}
              </span>{' '}
              {publishedCoursesCount === 1 ? 'course' : 'courses'} from Learn with ABHI
            </p>
          )}
        </motion.div>

        {isCatalogueEmpty ? (
          <div className="rounded-xl border border-[#E5EAF0] bg-[#FAFBFD] p-6 text-center space-y-2.5">
            <h3 className="font-display text-lg font-bold text-[#102B4E]">
              No courses available yet. New courses are coming soon.
            </h3>
            <p className="text-sm text-[#566479] max-w-md mx-auto leading-relaxed">
              We are preparing a fresh library of career development courses for Learn with ABHI. In the meantime, you can take the Career Readiness Assessment above.
            </p>
          </div>
        ) : (
          <>
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
                  className="w-full min-h-[44px] pl-10 pr-9 py-2.5 rounded-lg border border-[#D4DCE6] bg-white text-sm text-[#102B4E] placeholder:text-[#778397] focus:outline-none focus:border-[#102B4E]"
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
                className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#F6F8FB] border border-[#E5EAF0] self-start md:self-auto"
              >
                {(['all', 'Beginner', 'Intermediate', 'Advanced'] as const).map((level) => {
                  const active = selectedDifficulty === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedDifficulty(level)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
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
                className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E] ${
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
                    className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E] ${
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

            {/* Responsive Coursera-Inspired Course Catalogue Grid */}
            {visibleCourses.length === 0 ? (
              <div className="rounded-xl border border-[#E5EAF0] bg-[#FAFBFD] p-6 text-center space-y-3.5">
                <h3 className="font-display text-lg font-bold text-[#102B4E]">
                  No courses match your current filters
                </h3>
                <p className="text-sm text-[#566479] max-w-md mx-auto">
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
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold cursor-pointer transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {visibleCourses.map((course, idx) => (
                  <CourseCatalogueCard
                    key={course.id}
                    course={course}
                    enrolment={enrolmentByCourseId.get(course.id) || null}
                    index={idx}
                    isEnrolling={enrollingCourseId === course.id}
                    onViewCourse={onViewCourse}
                    onEnrolCourse={onEnrolCourse}
                    onStartLearning={onStartLearning}
                    onContinueLearning={onContinueLearning}
                    onReviewCourse={onReviewCourse}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ExploreCoursesSection;
