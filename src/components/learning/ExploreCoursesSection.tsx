import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';
import { LEARNING_CATEGORIES, SAMPLE_LEARNING_COURSES } from '../../data/learningCatalog';
import { LearningCategoryId, LearningCoursePlaceholder } from '../../types/learning';
import { EASE_PREMIUM, VIEWPORT_ONCE } from '../../lib/motion';

interface ExploreCoursesSectionProps {
  onOpenAssessment: () => void;
  onNavigateToResume: () => void;
}

export const ExploreCoursesSection: React.FC<ExploreCoursesSectionProps> = ({
  onOpenAssessment,
  onNavigateToResume,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | LearningCategoryId>('all');
  const [previewCourse, setPreviewCourse] = useState<LearningCoursePlaceholder | null>(null);

  const visibleCourses = useMemo(() => {
    if (selectedCategory === 'all') return SAMPLE_LEARNING_COURSES;
    return SAMPLE_LEARNING_COURSES.filter((course) => course.categoryId === selectedCategory);
  }, [selectedCategory]);

  return (
    <section
      id="explore-courses"
      aria-labelledby="explore-courses-heading"
      className="py-16 sm:py-24 bg-white border-b border-[#E5EAF0] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.45, ease: EASE_PREMIUM }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
        >
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs sm:text-sm font-semibold text-[#F47A24]">
              Explore Courses
            </p>
            <h2
              id="explore-courses-heading"
              className="font-display text-2xl sm:text-4xl font-extrabold text-[#102B4E] tracking-tight leading-tight [text-wrap:balance]"
            >
              Learn Something That Moves You Forward
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#778397] max-w-sm lg:text-right">
            Preview catalogue across six core career areas. Full lessons and completion certificates are being prepared.
          </p>
        </motion.div>

        {/* Interactive Category Filter Bar (Functional Buttons) */}
        <div
          role="tablist"
          aria-label="Course categories"
          className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#E5EAF0]"
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

        {/* Clean Responsive Course Catalogue Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCourses.map((course, idx) => (
            <motion.article
              key={course.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.35, delay: idx * 0.04, ease: EASE_PREMIUM }}
              className="group bg-[#FAFBFD] hover:bg-white rounded-2xl border border-[#E5EAF0] hover:border-[#102B4E]/30 p-6 sm:p-7 flex flex-col justify-between gap-6 transition-all duration-200"
            >
              <div className="space-y-4">
                {/* Clean Unboxed Metadata Line (Zero Pill Sandwiches) */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#778397]">
                  <span className="font-semibold text-[#102B4E]">{course.categoryName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#F47A24] font-medium">Sample Placeholder</span>
                </div>

                <h3 className="font-display text-lg sm:text-xl font-bold text-[#102B4E] leading-snug">
                  {course.title}
                </h3>

                <p className="text-sm text-[#566479] leading-relaxed">
                  {course.summary}
                </p>

                {/* Concise Planned Focus Line */}
                <p className="text-xs text-[#778397] leading-relaxed pt-1">
                  <span className="font-semibold text-[#253449]">Planned focus: </span>
                  {course.plannedTopics.join(' · ')}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E5EAF0] flex items-center justify-between gap-3">
                <span className="text-xs text-[#778397]">
                  Free · {course.levelLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewCourse(course)}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-[#102B4E] hover:text-[#F47A24] inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E]"
                >
                  <span>View Outline</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Honest Sample Course Outline Preview Modal */}
      <AnimatePresence>
        {previewCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewCourse(null)}
            className="fixed inset-0 z-50 bg-[#081D36]/60 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-preview-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.2, ease: EASE_PREMIUM }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg bg-white rounded-2xl border border-[#E5EAF0] shadow-xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-[#E5EAF0] flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs text-[#778397]">
                    <span className="font-semibold text-[#102B4E]">
                      {previewCourse.categoryName}
                    </span>{' '}
                    · <span className="text-[#F47A24] font-medium">Sample Placeholder</span>
                  </p>
                  <h3
                    id="course-preview-title"
                    className="font-display text-lg sm:text-xl font-bold text-[#102B4E]"
                  >
                    {previewCourse.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewCourse(null)}
                  aria-label="Close course outline"
                  className="min-h-[40px] min-w-[40px] rounded-lg border border-[#E5EAF0] hover:bg-[#F6F8FB] text-[#253449] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-sm text-[#566479] leading-relaxed">
                  {previewCourse.summary}
                </p>

                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-[#102B4E]">
                    Planned Topic Outline
                  </p>
                  <ul className="divide-y divide-[#E5EAF0] border-y border-[#E5EAF0]">
                    {previewCourse.plannedTopics.map((topic, idx) => (
                      <li
                        key={topic}
                        className="py-2.5 flex items-center gap-3 text-sm text-[#253449]"
                      >
                        <span className="text-xs font-bold text-[#F47A24] tabular-nums">
                          0{idx + 1}
                        </span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-[#778397] leading-relaxed">
                  This is a sample course placeholder for Learn with ABHI. Full video lessons, quizzes, progress tracking, and completion certificates will be connected to your existing ABHI JOBS candidate account in an upcoming release.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewCourse(null);
                      onNavigateToResume();
                    }}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E5EAF0] hover:border-[#102B4E] text-[#102B4E] text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
                  >
                    Open Resume Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewCourse(null);
                      onOpenAssessment();
                    }}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
                  >
                    View Career Assessment
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ExploreCoursesSection;
